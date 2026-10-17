<template>
  <div
    v-if="modelValue"
    class="modal-overlay"
    @click.self="!saving && emit('update:modelValue', false)"
  >
    <div class="modal-card">
      <!-- Header -->
      <div class="modal-header">
        <div class="title-group">
          <!-- <svg
            class="icon-doc"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
            />
          </svg> -->
          <span class="modal-title">Tambah Pengeluaran <br> <span class="text-caption">{{ penawaran.perihal }}</span></span>

        </div>
        <button
          class="btn-close"
          :disabled="saving"
          @click="emit('update:modelValue', false)"
        >
          &times;
        </button>
      </div>


      <!-- Content Body -->
      <div class="modal-body">
        <!-- Customer Info Section -->
        <a-select-new
          v-if="invoiceOptions.length > 1"
          ref="invoiceOutSelect"
          v-model="form.invoice_out"
          label="Invoice Pengeluaran"
          placeholder="Pilih invoice"
          :items="invoiceOptions"
          :rules="invoiceOutRules"
          :disabled="saving"
          class="mb-2"
        />
        <a-date-picker-new
          ref="tanggalPengeluaranPicker"
          v-model="form.tanggal_pengeluaran"
          label="Tanggal Pengeluaran"
          :disabled="saving"
          :rules="tanggalPengeluaranRules"
          class="mb-2"
        ></a-date-picker-new>
        <a-select-new
        :items="['Leo', 'Seilla']"
            v-model="form.dikeluarkan_oleh"
            label="Dikeluarkan Oleh"
            :disabled="saving"
            placeholder="nama"
            class="my-2"
          />
        <a-textarea-new
          v-model="form.keterangan"
          label="Keterangan"
          :disabled="saving"
        />
        <div class="form-grid">
          <a-field-number-new v-model="form.qty" label="Qty" :disabled="saving" />
          <a-select-new
            v-model="form.satuan"
            label="Satuan"
            :disabled="saving"
            :items="['Unit', 'Pcs', 'Kg']"
          />
          <a-field-number-new
            v-model="form.nominal"
            label="Nominal"
            :disabled="saving"
          />
        </div>

        <!-- Items Table Section -->
         <v-divider class="my-2" />
        <div class="form-grid">
          <a-text-field-new
            v-model="form.nama_vendor"
            label="Nama Vendor"
            :disabled="saving"
          />
          <a-text-field-new
            v-model="form.no_telp_vendor"
            label="No. Telepon Vendor"
            :disabled="saving"
          />
          <a-text-field-new
            v-model="form.lokasi_vendor"
            label="Lokasi Vendor"
            :disabled="saving"
          />
        </div>

         <v-divider class="my-2" />
        <div class="po-upload-row">
          <!-- Upload -->
          <div class="po-upload-wrapper">
            <label for="upload-po" class="po-upload-label"> Bill Upload </label>

            <div class="po-upload-box">
              <input
                id="upload-po"
                type="file"
                multiple
                :disabled="saving"
                class="po-file-input"
                @change="addfile"
              />

              <div class="po-upload-icon">↑</div>

              <div class="po-upload-text">
                <div class="po-upload-title">Pilih File</div>
                <div class="po-upload-info">Ukuran file bebas</div>
              </div>
            </div>
          </div>

          <!-- Hasil Upload -->
          <div v-if="billFiles.length" class="po-files-wrapper">
            <div class="po-upload-label">File Terpilih</div>

            <div class="po-file-list">
              <div
                v-for="(file, index) in billFiles"
                :key="index"
                class="po-file-item"
              >
                <div class="po-file-main">
                  <button
                    v-if="billPreviewUrls[index]"
                    type="button"
                    class="po-file-thumbnail-button"
                    :aria-label="`Pratinjau ${file.name}`"
                    :disabled="saving"
                    @click="previewSelectedImage(index)"
                  >
                    <img
                      :src="billPreviewUrls[index]"
                      :alt="file.name"
                      class="po-file-thumbnail"
                    />
                  </button>
                  <span v-else class="po-file-document">📄</span>
                  <div class="po-file-name">{{ file.name }}</div>
                </div>

                <button
                  type="button"
                  class="po-file-remove"
                  :disabled="saving"
                  @click="removeBillFile(index)"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
          <!-- <a-select-new
            v-model="form.status_pengeluaran"
            :items="['Hutang', 'Lunas']"
            label="Status"
            :disabled="saving"
            class="mt-2"
          /> -->
      </div>



      <!-- Footer Actions -->
      <div class="modal-footer">
        <button
          class="btn btn-secondary"
          :disabled="saving"
          @click="emit('update:modelValue', false)"
        >
          Batal
        </button>
        <button class="btn btn-primary" :disabled="saving" @click="save">
          <span v-if="saving">{{ savingMessage }}</span>
          <span v-else>Simpan Pengeluaran</span>
        </button>
      </div>
    </div>
  </div>

  <v-dialog
    v-model="selectedImagePreviewDialog"
    max-width="900"
    :z-index="10001"
  >
    <v-card class="selected-image-preview-card">
      <v-card-title class="selected-image-preview-header">
        <span class="selected-image-preview-title">
          {{ selectedImagePreviewName || "Pratinjau Lampiran" }}
        </span>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Tutup pratinjau"
          @click="closeSelectedImagePreview"
        />
      </v-card-title>
      <v-card-text class="selected-image-preview-body">
        <img
          v-if="selectedImagePreviewUrl"
          :src="selectedImagePreviewUrl"
          :alt="selectedImagePreviewName || 'Pratinjau lampiran'"
          class="selected-image-preview"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount } from "vue";
import { collection, doc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from "firebase/storage";
import { useCollection, useFirebaseStorage, useFirestore } from "vuefire";
import type {
  buktiPengeluaranM,
  penawaranM,
  pengeluaranM,
} from "~/types/penawaranModel";
import type { invoiceM } from "~/types/invoice";
const billFiles = ref<File[]>([]);
const billPreviewUrls = ref<string[]>([]);
const selectedImagePreviewDialog = ref(false);
const selectedImagePreviewUrl = ref("");
const selectedImagePreviewName = ref("");
const props = defineProps<{
  modelValue: boolean;
  penawaran: penawaranM;
  idPenawaran: string;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  saved: [invoiceId: string];
}>();

const notificationStore = useNotificationStore();
const db = useFirestore();
const storage = useFirebaseStorage();
const invoiceCollectionRef = computed(() =>
  collection(db, "penawaran", props.idPenawaran, "invoice"),
);
const {
  data: invoices,
  pending: loadingInvoices,
  error: invoiceError,
} = useCollection(invoiceCollectionRef);
const invoiceOptions = computed(() =>
  ((invoices.value ?? []) as invoiceM[])
    .map((invoice) => {
      const value = String(invoice.id_invoice || invoice.id || invoice.no_inv || "");
      return {
        value,
        title: `INV/${invoice.no_inv || value}`,
        createdAt: Number(invoice.createdAt) || 0,
      };
    })
    .filter((option) => option.value)
    .sort((a, b) => a.createdAt - b.createdAt),
);
const saving = ref(false);
const savingMessage = ref("Memproses...");
const tanggalPengeluaranPicker = ref<{ validate: () => boolean } | null>(null);
const invoiceOutSelect = ref<{ validate: () => boolean } | null>(null);
const tanggalPengeluaranRules = [
  (value: string) => Boolean(value) || "Tanggal pengeluaran wajib diisi",
];
const invoiceOutRules = [
  (value: string) => Boolean(value) || "Invoice wajib dipilih",
];

type PengeluaranForm = pengeluaranM & { invoice_out: string };
const emptyForm = (): PengeluaranForm => ({
  id_pengeluaran: "",
  invoice_out: "",
  keterangan: "",
  nominal: 0,
  satuan: "Pcs",
  dikeluarkan_oleh: "Leo",
  qty: 1,
  nama_vendor: "-",
  doc_pengeluaran: [],
  no_telp_vendor: "-",
  lokasi_vendor: "-",
  status_pengeluaran: "Hutang",
  tanggal_pengeluaran: "",
});
const form = ref<PengeluaranForm>(emptyForm());
const automaticallySelectedInvoiceId = ref("");
const IMAGE_COMPRESSION_MIN_BYTES = 750_000;
const IMAGE_MAX_EDGE = 2_048;
const IMAGE_WEBP_QUALITY = 0.85;
const IMAGE_PREPARATION_TIMEOUT_MS = 8_000;
const FILE_UPLOAD_STALL_TIMEOUT_MS = 8_000;
const DOWNLOAD_URL_TIMEOUT_MS = 15_000;
const storageUnavailable = ref(false);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetBillFiles();
      form.value = emptyForm();
      automaticallySelectedInvoiceId.value = "";
      if (invoiceOptions.value.length === 1) {
        form.value.invoice_out = invoiceOptions.value[0]!.value;
        automaticallySelectedInvoiceId.value = form.value.invoice_out;
      }
      savingMessage.value = "Memproses...";
    } else {
      closeSelectedImagePreview();
      resetBillFiles();
    }
  },
);

watch(invoiceOptions, (options) => {
  if (!props.modelValue || saving.value) return;

  if (options.length === 1) {
    form.value.invoice_out = options[0]!.value;
    automaticallySelectedInvoiceId.value = form.value.invoice_out;
    return;
  }

  if (
    form.value.invoice_out === automaticallySelectedInvoiceId.value ||
    !options.some((option) => option.value === form.value.invoice_out)
  ) {
    form.value.invoice_out = "";
  }
  automaticallySelectedInvoiceId.value = "";
});

function addfile(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const newFiles = Array.from(target.files);
    billFiles.value = [...billFiles.value, ...newFiles];
    billPreviewUrls.value = [
      ...billPreviewUrls.value,
      ...newFiles.map((file) =>
        file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      ),
    ];
  }
  target.value = "";
}

function removeBillFile(index: number) {
  const previewUrl = billPreviewUrls.value[index];
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  if (selectedImagePreviewUrl.value === previewUrl) {
    closeSelectedImagePreview();
  }
  billFiles.value.splice(index, 1);
  billPreviewUrls.value.splice(index, 1);
}

function previewSelectedImage(index: number) {
  const previewUrl = billPreviewUrls.value[index];
  if (!previewUrl) return;
  selectedImagePreviewUrl.value = previewUrl;
  selectedImagePreviewName.value = billFiles.value[index]?.name || "";
  selectedImagePreviewDialog.value = true;
}

function closeSelectedImagePreview() {
  selectedImagePreviewDialog.value = false;
  selectedImagePreviewUrl.value = "";
  selectedImagePreviewName.value = "";
}

function resetBillFiles() {
  for (const previewUrl of billPreviewUrls.value) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }
  billFiles.value = [];
  billPreviewUrls.value = [];
}

onBeforeUnmount(() => {
  closeSelectedImagePreview();
  resetBillFiles();
});

async function save() {
  if (saving.value) return;
  if (!props.idPenawaran) {
    notificationStore.showError("ID penawaran tidak ditemukan");
    return;
  }
  if (loadingInvoices.value) {
    notificationStore.showError("Daftar invoice masih dimuat");
    return;
  }
  if (invoiceError.value) {
    notificationStore.showError("Daftar invoice gagal dimuat. Tutup dialog lalu coba kembali.");
    return;
  }
  if (invoiceOptions.value.length === 1) {
    form.value.invoice_out = invoiceOptions.value[0]!.value;
  } else if (invoiceOptions.value.length > 1) {
    if (
      !invoiceOptions.value.some((option) => option.value === form.value.invoice_out) ||
      !invoiceOutSelect.value?.validate()
    ) {
      notificationStore.showError("Pilih invoice untuk pengeluaran ini");
      return;
    }
  } else {
    form.value.invoice_out = "";
  }
  const tanggalPengeluaran = String(form.value.tanggal_pengeluaran || "").trim();
  if (
    !tanggalPengeluaranPicker.value?.validate() ||
    Number.isNaN(new Date(`${tanggalPengeluaran}T00:00:00`).getTime())
  ) {
    notificationStore.showError("Tanggal pengeluaran wajib diisi");
    return;
  }
  const keterangan = String(form.value.keterangan || "").trim();
  const dikeluarkanOleh = String(form.value.dikeluarkan_oleh || "").trim();
  if (!keterangan || !dikeluarkanOleh) {
    notificationStore.showError(
      "Keterangan dan dikeluarkan oleh wajib diisi",
    );
    return;
  }
  const nominal = Number(form.value.nominal);
  const qty = Number(form.value.qty);
  if (
    !Number.isFinite(nominal) ||
    nominal <= 0 ||
    !Number.isFinite(qty) ||
    qty <= 0
  ) {
    notificationStore.showError("Nominal dan qty harus lebih dari 0");
    return;
  }

  saving.value = true;
  const uploadedStoragePaths: string[] = [];
  let expenseSaved = false;
  try {
    await nextTick();
    savingMessage.value = billFiles.value.length
      ? "Mengunggah lampiran..."
      : "Menyimpan pengeluaran...";
    const filesToUpload = [...billFiles.value];
    const idPengeluaran = doc(collection(db, "penawaran")).id;
    if (filesToUpload.length) savingMessage.value = "Menyiapkan lampiran...";
    const preparedFiles = await Promise.all(
      filesToUpload.map(async (file) => ({
        originalName: file.name,
        file: await withTimeout(
          optimizeBillImage(file),
          IMAGE_PREPARATION_TIMEOUT_MS,
          "Persiapan gambar terlalu lama",
        ).catch(() => file),
      })),
    );

    let documents: buktiPengeluaranM[] = [];
    if (preparedFiles.length && !storageUnavailable.value) {
      savingMessage.value = "Mengunggah lampiran...";
      const uploadedBytes = preparedFiles.map(() => 0);
      const totalUploadBytes = preparedFiles.reduce(
        (total, prepared) => total + prepared.file.size,
        0,
      );
      const datePath = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
      const uploadResults = await Promise.allSettled(
        preparedFiles.map(async ({ originalName, file }, uploadIndex) => {
          const safeFileName =
            file.name.replace(/[^\w.-]/g, "_") || "lampiran";
          const fileId = doc(collection(db, "penawaran")).id;
          const path = `upload/${datePath}/pengeluaran/${props.idPenawaran}/${idPengeluaran}/${fileId}-${safeFileName}`;
          const fileRef = storageRef(storage, path);

          await uploadBillFile(fileRef, file, (bytesTransferred) => {
            uploadedBytes[uploadIndex] = bytesTransferred;
            const progress = totalUploadBytes
              ? Math.round(
                  (uploadedBytes.reduce((total, bytes) => total + bytes, 0) /
                    totalUploadBytes) *
                    100,
                )
              : 100;
            savingMessage.value = `Mengunggah lampiran ${progress}%`;
          });
          uploadedStoragePaths.push(path);

          return {
            name: originalName,
            dataUrl: await withTimeout(
              getDownloadURL(fileRef),
              DOWNLOAD_URL_TIMEOUT_MS,
              "Link lampiran gagal dibuat",
            ),
            size: file.size,
            contentType: file.type || "application/octet-stream",
            storagePath: path,
          } satisfies buktiPengeluaranM;
        }),
      );

      if (uploadResults.some((result) => result.status === "rejected")) {
        storageUnavailable.value = true;
        console.warn(
          "Firebase Storage tidak tersedia; lampiran dialihkan ke Firestore.",
          uploadResults
            .filter((result) => result.status === "rejected")
            .map((result) => result.reason),
        );
      }

      savingMessage.value = storageUnavailable.value
        ? "Menyimpan lampiran..."
        : "Menyimpan pengeluaran...";
      documents = await Promise.all(
        uploadResults.map((result, index) =>
          result.status === "fulfilled"
            ? result.value
            : createFirestoreFallbackDocument(preparedFiles[index]!),
        ),
      );
    } else if (preparedFiles.length) {
      savingMessage.value = "Menyimpan lampiran...";
      documents = await Promise.all(
        preparedFiles.map(createFirestoreFallbackDocument),
      );
    }
    savingMessage.value = "Menyimpan pengeluaran...";

    const savedExpense = await createPengeluaran(
      {
        ...form.value,
        id_pengeluaran: idPengeluaran,
        tanggal_pengeluaran: tanggalPengeluaran,
        keterangan,
        dikeluarkan_oleh: dikeluarkanOleh,
        nominal,
        qty,
        doc_pengeluaran: documents,
      },
      props.idPenawaran,
    );
    expenseSaved = true;
    notificationStore.showSuccess("Pengeluaran berhasil ditambahkan");
    billFiles.value = [];
    const savedInvoiceId = savedExpense.invoice_out || form.value.invoice_out;
    form.value = emptyForm();
    emit("saved", savedInvoiceId);
    emit("update:modelValue", false);
  } catch (error) {
    console.error("ERROR CREATE PENGELUARAN:", error);

    if (!expenseSaved && uploadedStoragePaths.length) {
      // Cleanup tidak boleh menahan UI jika koneksi Storage sedang bermasalah.
      void Promise.allSettled(
        uploadedStoragePaths.map((path) => deleteObject(storageRef(storage, path))),
      ).then((cleanupResults) => {
        if (cleanupResults.some((result) => result.status === "rejected")) {
          console.error(
            "Sebagian lampiran gagal dibersihkan setelah penyimpanan gagal",
          );
        }
      });
    }

    notificationStore.showError(
      error instanceof Error
        ? error.message
        : "Gagal menyimpan pengeluaran",
    );
  } finally {
    saving.value = false;
    savingMessage.value = "Memproses...";
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(
      () => reject(new Error(message)),
      timeoutMs,
    );
    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

function uploadBillFile(
  fileRef: ReturnType<typeof storageRef>,
  file: File,
  onProgress: (bytesTransferred: number) => void,
): Promise<void> {
  const uploadTask = uploadBytesResumable(fileRef, file, {
    contentType: file.type || "application/octet-stream",
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId = 0;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      callback();
    };
    const armStallTimeout = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        finish(() =>
          reject(
            new Error(
              "Upload lampiran berhenti merespons. Periksa koneksi internet lalu coba lagi.",
            ),
          ),
        );
        uploadTask.cancel();
      }, FILE_UPLOAD_STALL_TIMEOUT_MS);
    };
    armStallTimeout();

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        armStallTimeout();
        onProgress(snapshot.bytesTransferred);
      },
      (error) => finish(() => reject(error)),
      () => finish(resolve),
    );
  });
}

async function createFirestoreFallbackDocument({
  originalName,
  file,
}: {
  originalName: string;
  file: File;
}): Promise<buktiPengeluaranM> {
  return {
    name: originalName,
    dataUrl: await readFileAsDataUrl(file),
    size: file.size,
    contentType: file.type || "application/octet-stream",
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Lampiran tidak dapat dibaca"));
    reader.onerror = () =>
      reject(reader.error || new Error("Lampiran tidak dapat dibaca"));
    reader.onabort = () => reject(new Error("Pembacaan lampiran dibatalkan"));
    reader.readAsDataURL(file);
  });
}

async function optimizeBillImage(file: File): Promise<File> {
  if (
    file.size < IMAGE_COMPRESSION_MIN_BYTES ||
    !file.type.startsWith("image/") ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml"
  ) {
    return file;
  }

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      IMAGE_MAX_EDGE / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const compressedBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", IMAGE_WEBP_QUALITY),
    );
    if (!compressedBlob || compressedBlob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "lampiran";
    return new File([compressedBlob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } catch (error) {
    console.warn("Kompresi lampiran dilewati:", error);
    return file;
  } finally {
    bitmap?.close();
  }
}

</script>

<style scoped>
/* Reset & Base Fonts */
* {
  box-sizing: border-box;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
}

/* Modal Structure */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-card {
  background: #ffffff;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

/* Header */
.modal-header {
  padding: 10px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-doc {
  width: 18px;
  height: 18px;
  fill: #1976d2;
}

.modal-title {
  font-size: 14px;
  font-weight: 700;
  color: #212529;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6c757d;
  line-height: 1;
}

.btn-close:hover {
  color: #000;
}

/* Body */
.modal-body {
  padding: 12px 16px;
  overflow-y: auto;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #6c757d;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.mt-3 {
  margin-top: 12px;
}

/* Grid Layout */
.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group.span-2 {
  grid-column: span 2;
}

.form-group label {
  font-size: 11px;
  font-weight: 600;
  color: #495057;
}

.input-field {
  width: 100%;
  padding: 5px 8px;
  font-size: 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  outline: none;
  background: #fff;
  transition: border-color 0.15s ease-in-out;
}

.input-field:focus {
  border-color: #1976d2;
}

.input-field.disabled {
  background: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
}

.textarea {
  resize: vertical;
}

/* Compact Table */
.table-container {
  border: 1px solid #dee2e6;
  border-radius: 4px;
  overflow: hidden;
}

.compact-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.compact-table th {
  background: #f1f3f5;
  color: #343a40;
  font-weight: 600;
  padding: 6px 8px;
  border-bottom: 1px solid #dee2e6;
}

.compact-table td {
  padding: 4px;
  border-bottom: 1px solid #e9ecef;
}

.table-input {
  width: 100%;
  padding: 4px 6px;
  font-size: 12px;
  border: 1px solid #ced4da;
  border-radius: 3px;
  outline: none;
}

.table-input:focus {
  border-color: #1976d2;
}

/* Text Align Helpers */
.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}
.font-bold {
  font-weight: 700;
}
.font-medium {
  font-weight: 500;
}
.text-muted {
  color: #6c757d;
}
.text-subtotal {
  padding-right: 8px;
  font-size: 12px;
}

/* Summary Area */
.summary-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.summary-box {
  width: 260px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.summary-row.align-center {
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.divider {
  height: 1px;
  background: #dee2e6;
  margin: 6px 0;
}

.total-row {
  margin-bottom: 0;
  font-size: 13px;
}

.grand-total-val {
  font-weight: 700;
  color: #1976d2;
}

/* Footer & Buttons */
.modal-footer {
  padding: 8px 16px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-secondary {
  background: #fff;
  border-color: #ced4da;
  color: #495057;
}

.btn-secondary:hover {
  background: #f8f9fa;
}

.btn-primary {
  background: #1976d2;
  color: #fff;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.po-upload-row {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
}

.po-upload-wrapper {
  flex-shrink: 0;
}

.po-files-wrapper {
  flex: 1;
  min-width: 0;
}

.po-upload-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

/* Upload Box */
.po-upload-box {
  position: relative;
  width: 150px;
  height: 82px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
  transition: 0.2s;
}

.po-upload-box:hover {
  border-color: #64748b;
  background: #f1f5f9;
}

.po-file-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.po-upload-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 17px;
}

.po-upload-title {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.po-upload-info {
  margin-top: 2px;
  font-size: 10px;
  color: #94a3b8;
}

/* Files */
.po-file-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.po-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 38px;
  padding: 6px 9px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
}

.po-file-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.po-file-thumbnail-button {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  padding: 0;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  background: #f8fafc;
  cursor: zoom-in;
}

.po-file-thumbnail-button:disabled {
  cursor: wait;
}

.po-file-thumbnail {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.po-file-document {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 5px;
  background: #f8fafc;
}

.po-file-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: #475569;
}

.po-file-remove {
  flex-shrink: 0;
  border: 0;
  background: transparent;
  color: #94a3b8;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.po-file-remove:hover:not(:disabled) {
  color: #dc2626;
}

.selected-image-preview-card {
  overflow: hidden;
  border-radius: 10px !important;
}

.selected-image-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 50px;
  padding: 8px 12px 8px 16px;
}

.selected-image-preview-title {
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-image-preview-body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  padding: 8px !important;
  background: #0f172a;
}

.selected-image-preview {
  display: block;
  width: 100%;
  max-height: 78vh;
  object-fit: contain;
}
</style>
