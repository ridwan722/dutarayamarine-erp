import { defineStore } from "pinia";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { useFirestore } from "vuefire";
import type {
  categoryProductServiceM,
  categoryProductServicePhotoM,
} from "~/types/category_product_service";

const COLLECTION = "category-product-service";
const PRODUCT_SUBCOLLECTION = "product-service";
const STORAGE_FOLDER = "category-product-service";

function toDocumentSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id-ID")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCategory(
  data: Partial<categoryProductServiceM>,
  id: string,
): categoryProductServiceM {
  return {
    id_category_product_service: id,
    category_product_service: String(data.category_product_service || ""),
    foto: Array.isArray(data.foto)
      ? data.foto
          .filter(
            (photo): photo is categoryProductServicePhotoM =>
              Boolean(photo?.url),
          )
          .map((photo) => ({
            name: String(photo.name || "Foto kategori"),
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

function categoryErrorMessage(error: unknown, fallback: string) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  if (code.includes("permission-denied")) {
    return "Akses Firestore ditolak. Pastikan akun memiliki izin menyimpan kategori.";
  }
  if (code.includes("unavailable") || code.includes("network")) {
    return "Koneksi ke Firebase bermasalah. Periksa internet lalu coba lagi.";
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export const useCategoryProductServiceStore = defineStore(
  "categoryProductServiceStore",
  {
    state: () => ({
      dataCategoryProductService: [] as categoryProductServiceM[],
    }),

    getters: {
      getDataCategoryProductService(state) {
        return state.dataCategoryProductService;
      },
    },

    actions: {
      async tarikDataCategoryProductServiceAct() {
        const db = useFirestore();
        const snapshot = await getDocs(collection(db, COLLECTION));
        this.dataCategoryProductService = snapshot.docs
          .map((categoryDocument) =>
            normalizeCategory(categoryDocument.data(), categoryDocument.id),
          )
          .sort((a, b) =>
            a.category_product_service.localeCompare(
              b.category_product_service,
              "id-ID",
            ),
          );
      },

      async addCategoryProductServiceAct(
        data: categoryProductServiceM,
        files: File[] = [],
      ) {
        const notificationStore = useNotificationStore();
        const loadingStore = useloadingStore();
        const productServiceStore = useProductServiceStore();
        let uploadedPhotos: categoryProductServicePhotoM[] = [];

        try {
          loadingStore.setLoading(true);
          const db = useFirestore();
          const categoryName = data.category_product_service
            .trim()
            .replace(/\s+/g, " ");
          const categoryId = toDocumentSlug(categoryName);
          if (!categoryId) {
            throw new Error("Nama kategori tidak valid");
          }
          if (
            this.dataCategoryProductService.some(
              (item) =>
                item.id_category_product_service === categoryId ||
                toDocumentSlug(item.category_product_service) === categoryId,
            )
          ) {
            throw new Error("Nama kategori menghasilkan ID yang sudah digunakan");
          }
          uploadedPhotos = await productServiceStore.uploadPhotosAct(
            files,
            categoryId,
            STORAGE_FOLDER,
          );
          const categoryRef = doc(db, COLLECTION, categoryId);
          const category = normalizeCategory(
            {
              ...data,
              category_product_service: categoryName,
              foto: [...(data.foto || []), ...uploadedPhotos],
            },
            categoryId,
          );
          await setDoc(categoryRef, category);
          this.dataCategoryProductService = [
            ...this.dataCategoryProductService,
            category,
          ].sort((a, b) =>
            a.category_product_service.localeCompare(
              b.category_product_service,
              "id-ID",
            ),
          );
          notificationStore.showSuccess("Kategori berhasil ditambahkan");
          return category;
        } catch (error) {
          if (uploadedPhotos.length) {
            await productServiceStore.deletePhotosAct(uploadedPhotos);
          }
          console.error("Gagal menyimpan kategori product/service:", error);
          notificationStore.showError(
            categoryErrorMessage(error, "Gagal menyimpan kategori"),
          );
          return null;
        } finally {
          loadingStore.setLoading(false);
        }
      },

      async updateCategoryProductServiceAct(
        data: categoryProductServiceM,
        files: File[] = [],
        removedPhotos: categoryProductServicePhotoM[] = [],
      ) {
        const notificationStore = useNotificationStore();
        const loadingStore = useloadingStore();
        const productServiceStore = useProductServiceStore();
        const id = data.id_category_product_service;
        if (!id) {
          notificationStore.showError("ID kategori tidak ditemukan");
          return null;
        }

        let uploadedPhotos: categoryProductServicePhotoM[] = [];
        try {
          loadingStore.setLoading(true);
          const db = useFirestore();
          const categoryName = data.category_product_service
            .trim()
            .replace(/\s+/g, " ");
          const newId = toDocumentSlug(categoryName);
          if (!newId) {
            throw new Error("Nama kategori tidak valid");
          }
          if (
            this.dataCategoryProductService.some(
              (item) =>
                item.id_category_product_service !== id &&
                (item.id_category_product_service === newId ||
                  toDocumentSlug(item.category_product_service) === newId),
            )
          ) {
            throw new Error("Nama kategori menghasilkan ID yang sudah digunakan");
          }
          uploadedPhotos = await productServiceStore.uploadPhotosAct(
            files,
            newId,
            STORAGE_FOLDER,
          );
          const category = normalizeCategory(
            {
              ...data,
              category_product_service: categoryName,
              foto: [...(data.foto || []), ...uploadedPhotos],
            },
            newId,
          );

          if (id === newId) {
            await setDoc(doc(db, COLLECTION, id), category);
          } else {
            const productSnapshot = await getDocs(
              collection(db, COLLECTION, id, PRODUCT_SUBCOLLECTION),
            );
            const batch = writeBatch(db);

            batch.set(doc(db, COLLECTION, newId), category);
            productSnapshot.docs.forEach((productDocument) => {
              const productData = productDocument.data();
              const currentCategoryIds = Array.isArray(
                productData.id_category_product_service,
              )
                ? productData.id_category_product_service.map((value) =>
                    String(value || ""),
                  )
                : [];
              const nextCategoryIds = [
                ...new Set(
                  currentCategoryIds
                    .map((categoryId) =>
                      categoryId === id ? newId : categoryId,
                    )
                    .filter(Boolean)
                    .concat(newId),
                ),
              ];
              const nextProductData = {
                ...productData,
                id_category_product_service: nextCategoryIds,
              };

              nextCategoryIds.forEach((categoryId) => {
                batch.set(
                  doc(
                    db,
                    COLLECTION,
                    categoryId,
                    PRODUCT_SUBCOLLECTION,
                    productDocument.id,
                  ),
                  nextProductData,
                );
              });
              batch.delete(
                doc(
                  db,
                  COLLECTION,
                  id,
                  PRODUCT_SUBCOLLECTION,
                  productDocument.id,
                ),
              );
            });
            batch.delete(doc(db, COLLECTION, id));
            await batch.commit();
          }

          this.dataCategoryProductService = [
            ...this.dataCategoryProductService.filter(
              (item) => item.id_category_product_service !== id,
            ),
            category,
          ].sort((a, b) =>
            a.category_product_service.localeCompare(
              b.category_product_service,
              "id-ID",
            ),
          );
          await productServiceStore.deletePhotosAct(removedPhotos);
          notificationStore.showSuccess("Kategori berhasil diperbarui");
          return category;
        } catch (error) {
          if (uploadedPhotos.length) {
            await productServiceStore.deletePhotosAct(uploadedPhotos);
          }
          console.error("Gagal memperbarui kategori product/service:", error);
          notificationStore.showError(
            categoryErrorMessage(error, "Gagal memperbarui kategori"),
          );
          return null;
        } finally {
          loadingStore.setLoading(false);
        }
      },

      async deleteCategoryProductServiceAct(id: string) {
        const notificationStore = useNotificationStore();
        const loadingStore = useloadingStore();
        if (!id) {
          notificationStore.showError("ID kategori tidak ditemukan");
          return false;
        }

        try {
          loadingStore.setLoading(true);
          const db = useFirestore();
          const category = this.dataCategoryProductService.find(
            (item) => item.id_category_product_service === id,
          );
          const productSnapshot = await getDocs(
            collection(db, COLLECTION, id, PRODUCT_SUBCOLLECTION),
          );
          if (!productSnapshot.empty) {
            notificationStore.showError(
              `Kategori masih digunakan oleh ${productSnapshot.size} product/service`,
            );
            return false;
          }
          await deleteDoc(doc(db, COLLECTION, id));
          this.dataCategoryProductService =
            this.dataCategoryProductService.filter(
              (item) => item.id_category_product_service !== id,
            );
          if (category?.foto.length) {
            await useProductServiceStore().deletePhotosAct(category.foto);
          }
          notificationStore.showSuccess("Kategori berhasil dihapus");
          return true;
        } catch (error) {
          console.error("Gagal menghapus kategori product/service:", error);
          notificationStore.showError(
            categoryErrorMessage(error, "Gagal menghapus kategori"),
          );
          return false;
        } finally {
          loadingStore.setLoading(false);
        }
      },
    },
  },
);
