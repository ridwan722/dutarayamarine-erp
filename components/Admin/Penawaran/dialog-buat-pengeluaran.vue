<template>
  <div
    v-if="modelValue"
    class="modal-overlay"
  >
    <div
      class="modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-dialog-title"
    >
      <!-- Header -->
      <div class="modal-header">
        <div class="title-group">
          <span class="modal-icon" aria-hidden="true">
            <v-icon icon="mdi-cash-plus" size="21" />
          </span>
          <div class="modal-heading-copy">
            <h2 id="expense-dialog-title" class="modal-title">
              Tambah Pengeluaran
            </h2>
            <p class="modal-subtitle">
              {{ penawaran.perihal || "Lengkapi rincian pengeluaran" }}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="btn-close"
          :disabled="saving"
          aria-label="Tutup dialog"
          @click="emit('update:modelValue', false)"
        >
          <v-icon icon="mdi-close" size="20" />
        </button>
      </div>


      <!-- Content Body -->
      <div class="modal-body">
        <section class="expense-section">
          <div class="section-heading">
            <div>
              <h3>Informasi Pengeluaran</h3>
            </div>
            <p>Isi tanggal, penanggung jawab, dan nilai transaksi.</p>
          </div>

          <div class="expense-fields">
            <a-select-new
              v-if="invoiceOptions.length > 1"
              ref="invoiceOutSelect"
              v-model="form.invoice_out"
              class="expense-horizontal-field"
              label="Invoice Pengeluaran"
              placeholder="Pilih invoice"
              :items="invoiceOptions"
              :rules="invoiceOutRules"
              :disabled="saving"
            />
            <a-date-picker-new
              ref="tanggalPengeluaranPicker"
              v-model="form.tanggal_pengeluaran"
              class="expense-horizontal-field"
              label="Tanggal Pengeluaran"
              :disabled="saving"
              :rules="tanggalPengeluaranRules"
            />
            <a-select-new
              v-model="form.dikeluarkan_oleh"
              class="expense-horizontal-field"
              label="Dikeluarkan Oleh"
              :items="['Seilla', 'Ridwan', 'Leo']"
              :disabled="saving"
            />
            <a-textarea-new
              v-model="form.keterangan"
              class="expense-horizontal-field expense-textarea-field"
              label="Keterangan"
              placeholder="Jelaskan keperluan pengeluaran"
              :disabled="saving"
              :rows="2"
            />
            <a-field-number-new
              v-model="form.qty"
              class="expense-horizontal-field"
              label="Qty"
              :disabled="saving"
            />
            <a-select-new
              v-model="form.satuan"
              class="expense-horizontal-field"
              label="Satuan"
              :items="['Unit', 'Pcs', 'Kg', 'Lot']"
              :disabled="saving"
            />
            <a-field-number-new
              v-model="form.nominal"
              class="expense-horizontal-field"
              label="Nominal"
              placeholder="Masukkan nominal"
              :disabled="saving"
            />
            <a-select-new
              v-model="form.status_pengeluaran"
              class="expense-horizontal-field"
              label="Status"
              :items="['Hutang', 'Lunas']"
              :disabled="saving"
            />
          </div>
        </section>

        <section class="expense-section expense-vendor-section">
          <div class="section-heading">
            <div>
              <h3>Informasi Vendor</h3>
            </div>
            <p>Data vendor dapat dilengkapi jika tersedia.</p>
          </div>

          <div class="expense-fields expense-vendor-fields">
            <a-text-field-new
              v-model="form.nama_vendor"
              class="expense-horizontal-field"
              label="Nama Vendor"
              placeholder="Nama vendor"
              :disabled="saving"
            />
            <a-text-field-new
              v-model="form.no_telp_vendor"
              class="expense-horizontal-field"
              label="No. Telepon Vendor"
              placeholder="Nomor telepon vendor"
              :disabled="saving"
            />
            <a-text-field-new
              v-model="form.lokasi_vendor"
              class="expense-horizontal-field"
              label="Lokasi Vendor"
              placeholder="Alamat atau lokasi vendor"
              :disabled="saving"
            />
          </div>
        </section>

        <section class="expense-section expense-attachment-section">
          <div class="section-heading">
            <div>
              <h3>Bukti Pengeluaran</h3>
            </div>
            <p>Tambahkan foto atau dokumen tagihan.</p>
          </div>

          <div class="expense-upload-field">
            <label for="upload-po" class="expense-upload-label">
              Lampiran
            </label>
            <div class="expense-upload-content">
              <div class="po-upload-box">
                <input
                  id="upload-po"
                  type="file"
                  multiple
                  :disabled="saving"
                  class="po-file-input"
                  @change="addfile"
                />
                <span class="po-upload-icon" aria-hidden="true">
                  <v-icon icon="mdi-tray-arrow-up" size="20" />
                </span>
                <span class="po-upload-text">
                  <span class="po-upload-title">Pilih file untuk diunggah</span>
                  <span class="po-upload-info">Klik area ini untuk memilih file</span>
                </span>
              </div>

              <div v-if="billFiles.length" class="po-files-wrapper">
                <div class="po-files-heading">
                  <span class="po-upload-label">File terpilih</span>
                  <span class="po-file-count">{{ billFiles.length }} file</span>
                </div>
                <div class="po-file-list">
                  <div
                    v-for="(file, index) in billFiles"
                    :key="`${file.name}-${index}`"
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
                      <span v-else class="po-file-document" aria-hidden="true">
                        <v-icon icon="mdi-file-outline" size="18" />
                      </span>
                      <span class="po-file-name">{{ file.name }}</span>
                    </div>

                    <button
                      type="button"
                      class="po-file-remove"
                      :disabled="saving"
                      :aria-label="`Hapus ${file.name}`"
                      @click="removeBillFile(index)"
                    >
                      <v-icon icon="mdi-close" size="17" />
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="po-files-empty">
                <span class="po-files-empty-icon" aria-hidden="true">
                  <v-icon icon="mdi-file-multiple-outline" size="19" />
                </span>
                <span class="po-files-empty-copy">
                  <strong>Belum ada file</strong>
                  <small>File yang dipilih akan tampil di sini.</small>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>



      <!-- Footer Actions -->
      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="saving"
          @click="emit('update:modelValue', false)"
        >
          Batal
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="saving"
          @click="save"
        >
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
  dikeluarkan_oleh: "",
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

/* Expense dialog refresh */
.modal-overlay {
  padding: 24px;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(3px);
}

.modal-card {
  width: min(900px, 100%);
  max-height: min(92vh, 980px);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 16px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
}

.modal-header {
  min-height: 82px;
  padding: 18px 28px;
  background: #fff;
  border-bottom-color: #edf0f4;
}

.title-group {
  min-width: 0;
  gap: 14px;
}

.modal-icon {
  display: grid;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: #eff6ff;
  color: #2563eb;
}

.modal-heading-copy {
  min-width: 0;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  line-height: 1.35;
  letter-spacing: -0.02em;
}

.modal-subtitle {
  max-width: 650px;
  margin: 3px 0 0;
  overflow: hidden;
  color: #788397;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-close {
  display: grid;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 9px;
  color: #64748b;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.btn-close:hover:not(:disabled) {
  background: #f1f5f9;
  color: #1e293b;
}

.modal-body {
  padding: 6px 30px 18px;
  background: #fff;
}

.expense-section {
  padding: 21px 0 24px;
  border-bottom: 1px solid #edf0f4;
}

.expense-section:last-child {
  padding-bottom: 12px;
  border-bottom: 0;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.section-eyebrow {
  display: block;
  margin-bottom: 5px;
  color: #8b95a5;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.section-heading h3 {
  margin: 0;
  color: #202939;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.section-heading p {
  margin: 0 0 1px;
  color: #8791a1;
  font-size: 12px;
  text-align: right;
}

.expense-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.expense-fields :deep(.expense-horizontal-field) {
  display: grid !important;
  grid-template-columns: minmax(165px, 205px) minmax(0, 1fr);
  align-items: center;
  column-gap: 24px;
  row-gap: 6px;
  width: 100%;
  margin: 0;
}

.expense-fields :deep(.expense-horizontal-field > .input-label) {
  grid-column: 1;
  grid-row: 1;
  color: #687385;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

.expense-fields :deep(.expense-horizontal-field > .input-wrapper),
.expense-fields :deep(.expense-horizontal-field > .select-wrapper),
.expense-fields :deep(.expense-horizontal-field > .date-input-wrapper) {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
}

.expense-fields :deep(.expense-horizontal-field > .hint-message),
.expense-fields :deep(.expense-horizontal-field > .error-message) {
  grid-column: 2;
  margin: 0;
}

.expense-fields :deep(.expense-horizontal-field .input-field) {
  width: 100%;
  min-height: 48px;
  height: 48px;
  padding: 10px 14px;
  border: 1px solid #e1e6ed;
  border-radius: 11px;
  background-color: #fff;
  color: #202939;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.expense-fields :deep(.expense-horizontal-field .input-field::placeholder) {
  color: #a1a9b6;
}

.expense-fields :deep(.expense-horizontal-field .input-field:hover:not(:disabled)) {
  border-color: #cbd5e1;
}

.expense-fields :deep(.expense-horizontal-field .input-field:focus) {
  border-color: #76a8f7;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  outline: none;
}

.expense-fields :deep(.expense-horizontal-field .input-field:disabled) {
  border-color: #e5e9ef;
  background: #f8fafc;
  color: #8490a0;
}

.expense-fields :deep(.expense-horizontal-field .select-field) {
  padding-right: 40px;
}

.expense-fields :deep(.expense-horizontal-field .select-arrow) {
  right: 15px;
  color: #8b95a5;
}

.expense-fields :deep(.expense-horizontal-field .date-input) {
  padding-right: 42px;
}

.expense-fields :deep(.expense-horizontal-field .calendar-icon) {
  right: 14px;
  color: #8791a1;
}

.expense-fields :deep(.expense-horizontal-field .spinner) {
  right: 8px;
}

.expense-fields :deep(.expense-textarea-field .input-wrapper) {
  align-self: start;
}

.expense-fields :deep(.expense-textarea-field .textarea-field) {
  min-height: 78px;
  height: auto;
  padding: 12px 14px;
  resize: vertical;
}

.expense-fields :deep(.expense-textarea-field > .input-label) {
  align-self: start;
  padding-top: 14px;
}

.expense-fields :deep(.expense-horizontal-field .input-field.input-error) {
  border-color: #e16464;
}

.expense-vendor-section {
  padding-top: 16px;
  padding-bottom: 18px;
}

.expense-vendor-fields {
  gap: 10px;
}

.expense-vendor-fields :deep(.expense-horizontal-field > .input-label) {
  font-size: 13px;
}

.expense-vendor-fields :deep(.expense-horizontal-field .input-field) {
  min-height: 40px;
  height: 40px;
  padding: 8px 13px;
  font-size: 13px;
}

.expense-upload-field {
  display: block;
}

.expense-upload-label {
  display: block;
  margin-bottom: 10px;
  color: #687385;
  font-size: 14px;
  font-weight: 500;
}

.expense-upload-content {
  display: grid;
  grid-template-columns: minmax(190px, 0.9fr) minmax(0, 1.1fr);
  align-items: stretch;
  gap: 16px;
  min-width: 0;
}

.po-upload-box {
  width: 100%;
  min-height: 116px;
  height: auto;
  justify-content: flex-start;
  gap: 12px;
  padding: 16px;
  border: 1px dashed #cbd5e1;
  border-radius: 11px;
  background: #f8fafc;
  transition: border-color 0.18s ease, background-color 0.18s ease;
}

.po-upload-box:hover {
  border-color: #8baee6;
  background: #f4f8ff;
}

.po-upload-icon {
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  border-color: #e5eaf1;
  border-radius: 9px;
  color: #5278b5;
}

.po-upload-text {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.po-upload-title {
  color: #344054;
  font-size: 13px;
}

.po-upload-info {
  color: #929bad;
  font-size: 11px;
}

.po-files-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 116px;
  min-width: 0;
  padding: 12px;
  border: 1px solid #e7ebf0;
  border-radius: 11px;
  background: #fff;
}

.po-files-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 9px;
}

.po-upload-label {
  margin: 0;
  color: #798496;
  font-size: 11px;
  font-weight: 600;
}

.po-file-count {
  flex: 0 0 auto;
  padding: 3px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 10px;
  font-weight: 600;
}

.po-file-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  max-height: 116px;
  overflow-y: auto;
}

.po-file-item {
  flex: 0 0 auto;
  min-height: 40px;
  padding: 4px 8px;
  border-color: #e7ebf0;
  border-radius: 8px;
  background: #fff;
}

.po-file-name {
  font-size: 12px;
}

.po-files-empty {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 116px;
  min-width: 0;
  padding: 15px;
  border: 1px solid #e7ebf0;
  border-radius: 11px;
  background: #fbfcfe;
}

.po-files-empty-icon {
  display: grid;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid #e7ebf0;
  border-radius: 10px;
  background: #fff;
  color: #8994a5;
}

.po-files-empty-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.po-files-empty-copy strong {
  color: #596579;
  font-size: 12px;
  font-weight: 600;
}

.po-files-empty-copy small {
  color: #929bad;
  font-size: 11px;
  line-height: 1.45;
}

.po-file-remove {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 7px;
  color: #8893a3;
}

.po-file-remove:hover:not(:disabled) {
  background: #fff1f2;
  color: #dc2626;
}

.modal-footer {
  min-height: 76px;
  padding: 14px 30px;
  background: #fff;
  border-top-color: #edf0f4;
}

.btn {
  min-height: 42px;
  padding: 0 18px;
  border-radius: 9px;
  font-size: 13px;
  transition: background-color 0.18s ease, border-color 0.18s ease;
}

.btn-secondary {
  border-color: #e1e6ed;
  color: #475467;
}

.btn-secondary:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-primary {
  background: #2563eb;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

@media (max-width: 700px) {
  .modal-overlay {
    align-items: flex-end;
    padding: 10px;
  }

  .modal-card {
    width: 100%;
    max-height: 96vh;
    border-radius: 16px 16px 12px 12px;
  }

  .modal-header {
    min-height: 72px;
    padding: 14px 18px;
  }

  .modal-icon {
    flex-basis: 38px;
    width: 38px;
    height: 38px;
  }

  .modal-title {
    font-size: 16px;
  }

  .modal-subtitle {
    max-width: calc(100vw - 120px);
    font-size: 11px;
  }

  .modal-body {
    padding: 4px 18px 14px;
  }

  .expense-section {
    padding: 19px 0 21px;
  }

  .section-heading {
    display: block;
    margin-bottom: 16px;
  }

  .section-heading p {
    margin-top: 5px;
    text-align: left;
  }

  .expense-fields {
    gap: 15px;
  }

  .expense-vendor-section {
    padding-top: 15px;
    padding-bottom: 17px;
  }

  .expense-vendor-fields {
    gap: 11px;
  }

  .expense-vendor-fields :deep(.expense-horizontal-field .input-field) {
    min-height: 42px;
    height: 42px;
  }

  .expense-fields :deep(.expense-horizontal-field) {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 7px;
  }

  .expense-fields :deep(.expense-horizontal-field > .input-label),
  .expense-fields :deep(.expense-horizontal-field > .input-wrapper),
  .expense-fields :deep(.expense-horizontal-field > .select-wrapper),
  .expense-fields :deep(.expense-horizontal-field > .date-input-wrapper),
  .expense-fields :deep(.expense-horizontal-field > .hint-message),
  .expense-fields :deep(.expense-horizontal-field > .error-message) {
    grid-column: 1;
  }

  .expense-fields :deep(.expense-horizontal-field > .input-label) {
    grid-row: 1;
    font-size: 13px;
  }

  .expense-fields :deep(.expense-horizontal-field > .input-wrapper),
  .expense-fields :deep(.expense-horizontal-field > .select-wrapper),
  .expense-fields :deep(.expense-horizontal-field > .date-input-wrapper) {
    grid-row: 2;
  }

  .expense-fields :deep(.expense-textarea-field > .input-label) {
    padding-top: 0;
  }

  .expense-upload-field {
    display: block;
  }

  .expense-upload-label {
    margin-bottom: 8px;
    font-size: 13px;
  }

  .expense-upload-content {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }

  .po-upload-box {
    min-height: 82px;
    padding: 12px;
  }

  .po-files-wrapper {
    width: 100%;
    min-height: 82px;
  }

  .po-files-empty {
    min-height: 82px;
    padding: 12px;
  }

  .po-file-list {
    max-height: 180px;
  }

  .modal-footer {
    min-height: 68px;
    padding: 12px 18px;
  }
}
</style>
