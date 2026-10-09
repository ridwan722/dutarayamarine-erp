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
          <svg
            class="icon-doc"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
            />
          </svg>
          <span class="modal-title">Tambah Pengeluaran <br> <span class="text-caption">Project : {{ penawaran.perihal }}</span></span>

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
        <a-date-picker-new
          v-model="form.tanggal_pengeluaran"
          label="Tanggal Pengeluaran"
          :disabled="saving"
          class="mb-2"
        ></a-date-picker-new>
        <a-text-field-new
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
        <div class="section-title mt-3">Informasi Vendor</div>
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
                @change="addfile"
                class="po-file-input"
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
                <div class="po-file-name">📄 {{ file.name }}</div>

                <button
                  type="button"
                  class="po-file-remove"
                  :disabled="saving"
                  @click="billFiles.splice(index, 1)"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
          <a-select-new
            v-model="form.status_pengeluaran"
            :items="['Hutang', 'Lunas']"
            label="Status"
            :disabled="saving"
            class="mt-2"
          />
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
          <span v-if="saving">Memproses...</span>
          <span v-else>Simpan Pengeluaran</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import moment from "moment";
import type {
  buktiPengeluaranM,
  penawaranM,
  pengeluaranM,
} from "~/types/penawaranModel";
const billFiles = ref<File[]>([]);
const props = defineProps<{
  modelValue: boolean;
  penawaran: penawaranM;
  idPenawaran: string;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  saved: [];
}>();

const notificationStore = useNotificationStore();
const saving = ref(false);

const emptyForm = (): pengeluaranM => ({
  id_pengeluaran: "",
  keterangan: "",
  nominal: 0,
  satuan: "Pcs",
  dikeluarkan_oleh: "",
  qty: 1,
  nama_vendor: "",
  doc_pengeluaran: [],
  no_telp_vendor: "",
  lokasi_vendor: "",
  status_pengeluaran: "Hutang",
  tanggal_pengeluaran: moment().format("YYYY-MM-DD"),
});
const form = ref<pengeluaranM>(emptyForm());

watch(
  () => props.modelValue,
  (open) => {
    if (open) form.value = emptyForm();
  },
);

function addfile(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    billFiles.value = [...billFiles.value, ...Array.from(target.files)];
  }
  target.value = "";
}

async function save() {
  if (saving.value) return;
  if (!props.idPenawaran) {
    notificationStore.showError("ID penawaran tidak ditemukan");
    return;
  }
  if (!form.value.keterangan.trim() || !form.value.tanggal_pengeluaran || !form.value.dikeluarkan_oleh ) {
    notificationStore.showError(
      "Keterangan / tanggal / dikeluarkan oleh, wajib diisi",
    );
    return;
  }
  if (
    !Number.isFinite(form.value.nominal) ||
    form.value.nominal <= 0 ||
    !Number.isFinite(form.value.qty) ||
    form.value.qty <= 0
  ) {
    notificationStore.showError("Nominal dan qty harus lebih dari 0");
    return;
  }

  saving.value = true;
  try {
    const documents: buktiPengeluaranM[] = [];
    for (const file of billFiles.value) {
      documents.push({
        name: file.name,
        dataUrl: await readBillFile(file),
        size: file.size,
        contentType: file.type || "application/octet-stream",
      });
    }
    form.value.doc_pengeluaran = documents;

    await createPengeluaran(
      {
        ...form.value,
        keterangan: form.value.keterangan.trim(),
      },
      props.idPenawaran,
    );
    notificationStore.showSuccess("Pengeluaran berhasil ditambahkan");
    emit("update:modelValue", false);
    emit("saved");
  } catch (error) {
  console.error("ERROR CREATE PENGELUARAN:", error);

  notificationStore.showError(
    error instanceof Error
      ? error.message
      : "Gagal menyimpan pengeluaran",
  );
} finally {
    saving.value = false;
  }
}

function readBillFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("File bukti tidak dapat dibaca"));
    };
    reader.onerror = () =>
      reject(reader.error || new Error("File bukti tidak dapat dibaca"));
    reader.onabort = () => reject(new Error("Pembacaan file dibatalkan"));
    reader.readAsDataURL(file);
  });
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
</style>
