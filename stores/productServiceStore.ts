import { defineStore } from "pinia";
import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from "firebase/storage";
import { useFirebaseStorage, useFirestore } from "vuefire";
import type {
  productServiceM,
  productServicePhotoM,
} from "~/types/product_service";

const CATEGORY_COLLECTION = "category-product-service";
const PRODUCT_SUBCOLLECTION = "product-service";
const LEGACY_PRODUCT_COLLECTION = "product-service";
const STORAGE_FOLDER = "product-service";
const STORAGE_STALL_TIMEOUT_MS = 20_000;
const MAX_FALLBACK_DATA_URL_BYTES = 100_000;

function toDocumentSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id-ID")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeProductService(
  data: Partial<productServiceM>,
  id: string,
): productServiceM {
  const categoryIds = Array.isArray(data.id_category_product_service)
    ? [
        ...new Set(
          data.id_category_product_service
            .map((categoryId) => String(categoryId || "").trim())
            .filter(Boolean),
        ),
      ]
    : [];
  const normalizedTags: string[] = [];
  const existingTags = new Set<string>();
  if (Array.isArray(data.tags)) {
    data.tags.forEach((value) => {
      const tag = String(value || "").trim();
      const tagKey = tag.toLocaleLowerCase("id-ID");
      if (!tag || existingTags.has(tagKey)) return;
      existingTags.add(tagKey);
      normalizedTags.push(tag);
    });
  }

  return {
    id_product_service: id,
    id_category_product_service: categoryIds,
    nama_product_service: String(data.nama_product_service || ""),
    description: String(data.description || ""),
    description_en: String(data.description_en || ""),
    tags: normalizedTags,
    foto: Array.isArray(data.foto)
      ? data.foto
          .filter((photo): photo is productServicePhotoM => Boolean(photo?.url))
          .map((photo) => ({
            name: String(photo.name || "Foto product/service"),
            url: String(photo.url),
            ...(photo.storagePath
              ? { storagePath: String(photo.storagePath) }
              : {}),
            ...(typeof photo.size === "number" ? { size: photo.size } : {}),
            ...(photo.contentType
              ? { contentType: String(photo.contentType) }
              : {}),
          }))
      : [],
    createdAt: Number(data.createdAt) || 0,
    ...(data.createdBy ? { createdBy: String(data.createdBy) } : {}),
    ...(data.updatedAt ? { updatedAt: Number(data.updatedAt) } : {}),
    ...(data.updatedBy ? { updatedBy: String(data.updatedBy) } : {}),
  };
}

function safeFileName(fileName: string) {
  const extension = fileName.includes(".")
    ? `.${fileName.split(".").pop()?.toLowerCase()}`
    : "";
  const baseName = fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${baseName || "foto"}${extension}`;
}

function documentBytes(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Foto tidak dapat dibaca"));
    reader.onerror = () =>
      reject(reader.error || new Error("Foto tidak dapat dibaca"));
    reader.onabort = () => reject(new Error("Pembacaan foto dibatalkan"));
    reader.readAsDataURL(blob);
  });
}

async function createFirestoreFallbackPhoto(
  file: File,
): Promise<productServicePhotoM> {
  const estimatedDataUrlBytes = 4 * Math.ceil(file.size / 3) + 100;
  if (estimatedDataUrlBytes <= MAX_FALLBACK_DATA_URL_BYTES) {
    return {
      name: file.name,
      url: await readBlobAsDataUrl(file),
      size: file.size,
      contentType: file.type || "application/octet-stream",
    };
  }

  if (
    typeof createImageBitmap !== "function" ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml"
  ) {
    throw new Error(
      `Foto ${file.name} tidak dapat dikompres. Gunakan JPG, PNG, atau WEBP.`,
    );
  }

  const bitmap = await createImageBitmap(file);
  try {
    let scale = Math.min(1, 1_200 / Math.max(bitmap.width, bitmap.height));
    let quality = 0.8;
    const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";

    for (let attempt = 0; attempt < 14; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Foto tidak dapat diproses");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );
      if (!blob) throw new Error(`Foto ${file.name} gagal dikompres`);

      const dataUrl = await readBlobAsDataUrl(blob);
      if (documentBytes(dataUrl) <= MAX_FALLBACK_DATA_URL_BYTES) {
        return {
          name: `${baseName}.webp`,
          url: dataUrl,
          size: blob.size,
          contentType: "image/webp",
        };
      }

      if (quality > 0.5) quality -= 0.1;
      else {
        scale *= 0.76;
        quality = 0.72;
      }
    }
  } finally {
    bitmap.close();
  }

  throw new Error(
    `Foto ${file.name} masih terlalu besar setelah dikompres.`,
  );
}

function uploadPhotoWithTimeout(
  fileRef: ReturnType<typeof storageRef>,
  file: File,
): Promise<void> {
  const uploadTask = uploadBytesResumable(fileRef, file, {
    contentType: file.type || "application/octet-stream",
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      callback();
    };
    const armTimeout = () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        finish(() => {
          uploadTask.cancel();
          reject(new Error("Upload foto berhenti merespons"));
        });
      }, STORAGE_STALL_TIMEOUT_MS);
    };

    armTimeout();
    uploadTask.on(
      "state_changed",
      armTimeout,
      (error) => finish(() => reject(error)),
      () => finish(resolve),
    );
  });
}

function saveErrorMessage(error: unknown, fallback: string) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  if (code.includes("permission-denied")) {
    return "Akses Firestore ditolak. Pastikan akun memiliki izin menyimpan data.";
  }
  if (code.includes("unavailable") || code.includes("network")) {
    return "Koneksi ke Firebase bermasalah. Periksa internet lalu coba lagi.";
  }
  if (code.includes("resource-exhausted")) {
    return "Ukuran data terlalu besar. Kurangi jumlah atau ukuran foto.";
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export const useProductServiceStore = defineStore("productServiceStore", {
  state: () => ({
    dataProductService: [] as productServiceM[],
  }),

  getters: {
    getDataProductService(state) {
      return state.dataProductService;
    },
  },

  actions: {
    async tarikDataProductServiceAct() {
      const db = useFirestore();
      const categorySnapshot = await getDocs(
        collection(db, CATEGORY_COLLECTION),
      );
      const categoryIds = categorySnapshot.docs.map(
        (categoryDocument) => categoryDocument.id,
      );
      const [legacySnapshot, ...categoryProductSnapshots] = await Promise.all([
        getDocs(collection(db, LEGACY_PRODUCT_COLLECTION)),
        ...categoryIds.map((categoryId) =>
          getDocs(
            collection(
              db,
              CATEGORY_COLLECTION,
              categoryId,
              PRODUCT_SUBCOLLECTION,
            ),
          ),
        ),
      ]);

      const productsById = new Map<string, productServiceM>();
      categoryProductSnapshots.forEach((snapshot, categoryIndex) => {
        const categoryId = categoryIds[categoryIndex];
        if (!categoryId) return;

        snapshot.docs.forEach((productDocument) => {
          const product = normalizeProductService(
            productDocument.data(),
            productDocument.id,
          );
          const existingProduct = productsById.get(productDocument.id);
          if (!existingProduct) {
            product.id_category_product_service = [
              ...new Set([
                ...product.id_category_product_service,
                categoryId,
              ]),
            ];
            productsById.set(productDocument.id, product);
            return;
          }

          const existingTime =
            Number(existingProduct.updatedAt) || existingProduct.createdAt;
          const productTime = Number(product.updatedAt) || product.createdAt;
          const latestProduct =
            productTime >= existingTime ? product : existingProduct;
          latestProduct.id_category_product_service = [
            ...new Set([
              ...existingProduct.id_category_product_service,
              ...product.id_category_product_service,
              categoryId,
            ]),
          ];
          productsById.set(productDocument.id, latestProduct);
        });
      });

      // Dokumen top-level lama tetap dibaca. Saat diedit, dokumen tersebut
      // otomatis dipindahkan ke subcollection kategori yang dipilih.
      legacySnapshot.docs.forEach((productDocument) => {
        if (productsById.has(productDocument.id)) return;
        productsById.set(
          productDocument.id,
          normalizeProductService(productDocument.data(), productDocument.id),
        );
      });

      this.dataProductService = [...productsById.values()];
    },

    async uploadPhotosAct(
      files: File[],
      productServiceId: string,
      storageFolder = STORAGE_FOLDER,
    ) {
      if (!files.length) return [] as productServicePhotoM[];

      const storage = useFirebaseStorage();
      const uploadedPhotos: productServicePhotoM[] = [];
      let storageAvailable = true;

      for (const [index, file] of files.entries()) {
        if (storageAvailable) {
          const uniqueName = `${Date.now()}-${index}-${Math.random()
            .toString(36)
            .slice(2, 8)}-${safeFileName(file.name)}`;
          const path = `${storageFolder}/${productServiceId}/${uniqueName}`;
          const fileRef = storageRef(storage, path);
          let fileUploaded = false;

          try {
            await uploadPhotoWithTimeout(fileRef, file);
            fileUploaded = true;
            uploadedPhotos.push({
              name: file.name,
              url: await getDownloadURL(fileRef),
              storagePath: path,
              size: file.size,
              contentType: file.type || "application/octet-stream",
            });
            continue;
          } catch (error) {
            storageAvailable = false;
            if (fileUploaded) {
              await deleteObject(fileRef).catch(() => undefined);
            }
            console.warn(
              "Firebase Storage tidak tersedia; foto dialihkan ke Firestore.",
              error,
            );
          }
        }

        uploadedPhotos.push(await createFirestoreFallbackPhoto(file));
      }

      return uploadedPhotos;
    },

    async deletePhotosAct(photos: productServicePhotoM[]) {
      const paths = photos
        .map((photo) => photo.storagePath)
        .filter((path): path is string => Boolean(path));
      if (!paths.length) return;

      const storage = useFirebaseStorage();
      const results = await Promise.allSettled(
        paths.map((path) => deleteObject(storageRef(storage, path))),
      );
      const failures = results.filter((result) => result.status === "rejected");
      if (failures.length) {
        console.warn(
          "Sebagian foto product/service gagal dihapus dari Storage",
          failures,
        );
      }
    },

    async addProductServiceAct(data: productServiceM, files: File[] = []) {
      const notificationStore = useNotificationStore();
      const loadingStore = useloadingStore();
      const db = useFirestore();
      const productName = data.nama_product_service
        .trim()
        .replace(/\s+/g, " ");
      const productId = toDocumentSlug(productName);
      let uploadedPhotos: productServicePhotoM[] = [];

      try {
        loadingStore.setLoading(true);
        if (!productId) {
          throw new Error("Nama product/service tidak valid");
        }
        const duplicateProduct = this.dataProductService.some(
          (item) =>
            item.id_product_service === productId ||
            toDocumentSlug(item.nama_product_service) === productId,
        );
        if (duplicateProduct) {
          throw new Error(
            "Nama product/service menghasilkan ID yang sudah digunakan",
          );
        }
        uploadedPhotos = await this.uploadPhotosAct(files, productId);
        const productService = normalizeProductService(
          {
            ...data,
            nama_product_service: productName,
            foto: [...(data.foto || []), ...uploadedPhotos],
          },
          productId,
        );
        if (!productService.id_category_product_service.length) {
          throw new Error("Pilih minimal satu kategori");
        }

        const batch = writeBatch(db);
        productService.id_category_product_service.forEach((categoryId) => {
          batch.set(
            doc(
              db,
              CATEGORY_COLLECTION,
              categoryId,
              PRODUCT_SUBCOLLECTION,
              productId,
            ),
            productService,
          );
        });
        await batch.commit();
        this.dataProductService = [
          productService,
          ...this.dataProductService,
        ];
        notificationStore.showSuccess("Product/service berhasil ditambahkan");
        return productService;
      } catch (error) {
        if (uploadedPhotos.length) await this.deletePhotosAct(uploadedPhotos);
        console.error("Gagal menyimpan product/service:", error);
        notificationStore.showError(
          saveErrorMessage(error, "Gagal menyimpan product/service"),
        );
        return null;
      } finally {
        loadingStore.setLoading(false);
      }
    },

    async updateProductServiceAct(
      data: productServiceM,
      files: File[] = [],
      removedPhotos: productServicePhotoM[] = [],
    ) {
      const notificationStore = useNotificationStore();
      const loadingStore = useloadingStore();
      const id = data.id_product_service;

      if (!id) {
        notificationStore.showError("ID product/service tidak ditemukan");
        return null;
      }

      let uploadedPhotos: productServicePhotoM[] = [];
      try {
        loadingStore.setLoading(true);
        const db = useFirestore();
        const productName = data.nama_product_service
          .trim()
          .replace(/\s+/g, " ");
        const newId = toDocumentSlug(productName);
        if (!newId) {
          throw new Error("Nama product/service tidak valid");
        }
        const duplicateProduct = this.dataProductService.some(
          (item) =>
            item.id_product_service !== id &&
            (item.id_product_service === newId ||
              toDocumentSlug(item.nama_product_service) === newId),
        );
        if (duplicateProduct) {
          throw new Error(
            "Nama product/service menghasilkan ID yang sudah digunakan",
          );
        }
        const previousProduct = this.dataProductService.find(
          (item) => item.id_product_service === id,
        );
        const previousCategoryIds =
          previousProduct?.id_category_product_service || [];
        uploadedPhotos = await this.uploadPhotosAct(files, newId);
        const productService = normalizeProductService(
          {
            ...data,
            nama_product_service: productName,
            foto: [...data.foto, ...uploadedPhotos],
          },
          newId,
        );
        if (!productService.id_category_product_service.length) {
          throw new Error("Pilih minimal satu kategori");
        }

        const selectedCategoryIds = new Set(
          productService.id_category_product_service,
        );
        const batch = writeBatch(db);
        productService.id_category_product_service.forEach((categoryId) => {
          batch.set(
            doc(
              db,
              CATEGORY_COLLECTION,
              categoryId,
              PRODUCT_SUBCOLLECTION,
              newId,
            ),
            productService,
          );
        });
        previousCategoryIds.forEach((categoryId) => {
          if (id === newId && selectedCategoryIds.has(categoryId)) return;
          batch.delete(
            doc(
              db,
              CATEGORY_COLLECTION,
              categoryId,
              PRODUCT_SUBCOLLECTION,
              id,
            ),
          );
        });
        if (id !== newId) {
          productService.id_category_product_service
            .filter((categoryId) => !previousCategoryIds.includes(categoryId))
            .forEach((categoryId) => {
              batch.delete(
                doc(
                  db,
                  CATEGORY_COLLECTION,
                  categoryId,
                  PRODUCT_SUBCOLLECTION,
                  id,
                ),
              );
            });
        }
        batch.delete(doc(db, LEGACY_PRODUCT_COLLECTION, id));
        await batch.commit();
        this.dataProductService = this.dataProductService.map((item) =>
          item.id_product_service === id ? productService : item,
        );
        await this.deletePhotosAct(removedPhotos);
        notificationStore.showSuccess("Product/service berhasil diperbarui");
        return productService;
      } catch (error) {
        if (uploadedPhotos.length) await this.deletePhotosAct(uploadedPhotos);
        console.error("Gagal memperbarui product/service:", error);
        notificationStore.showError(
          saveErrorMessage(error, "Gagal memperbarui product/service"),
        );
        return null;
      } finally {
        loadingStore.setLoading(false);
      }
    },

    async deleteProductServiceAct(productService: productServiceM) {
      const notificationStore = useNotificationStore();
      const loadingStore = useloadingStore();
      const id = productService.id_product_service;

      if (!id) {
        notificationStore.showError("ID product/service tidak ditemukan");
        return false;
      }

      try {
        loadingStore.setLoading(true);
        const db = useFirestore();
        const batch = writeBatch(db);
        productService.id_category_product_service.forEach((categoryId) => {
          batch.delete(
            doc(
              db,
              CATEGORY_COLLECTION,
              categoryId,
              PRODUCT_SUBCOLLECTION,
              id,
            ),
          );
        });
        batch.delete(doc(db, LEGACY_PRODUCT_COLLECTION, id));
        await batch.commit();
        this.dataProductService = this.dataProductService.filter(
          (item) => item.id_product_service !== id,
        );
        await this.deletePhotosAct(productService.foto || []);
        notificationStore.showSuccess("Product/service berhasil dihapus");
        return true;
      } catch (error) {
        console.error("Gagal menghapus product/service:", error);
        notificationStore.showError("Gagal menghapus product/service");
        return false;
      } finally {
        loadingStore.setLoading(false);
      }
    },
  },
});
