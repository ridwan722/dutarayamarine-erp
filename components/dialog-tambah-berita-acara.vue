<template>
  <div class="page-shell">
    <form class="form-container" @submit.prevent="submitBeritaAcara">
      <!-- Card Section -->
      <section class="panel-card">
        <div class="panel-header">
          <div class="panel-header-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div>
            <h2>Buat Berita Acara</h2>
            <p class="panel-subtitle">Lengkapi detail dokumen dan data customer terkait</p>
          </div>
        </div>

        <div class="panel-body">
          <div class="form-grid">
            <!-- ID Customer -->
            <div class="form-field">
              <label for="id_customer">
                ID Customer <span class="required-asterisk">*</span>
              </label>
              <input
                id="id_customer"
                v-model.trim="form.id_customer"
                class="input-control"
                type="text"
                placeholder="Masukkan ID customer"
                required
              />
            </div>

            <!-- Tanggal -->
            <div class="form-field">
              <label>Tanggal Berita Acara <span class="required-asterisk">*</span></label>
              <a-date-picker-new
                v-model="form.tanggal_berita_acara"
                class="custom-datepicker"
              ></a-date-picker-new>
            </div>

            <!-- Pihak Pertama -->
            <div class="form-field">
              <label for="pihak_pertama">
                Pihak Pertama <span class="required-asterisk">*</span>
              </label>
              <input
                id="pihak_pertama"
                v-model.trim="form.pihak_pertama"
                class="input-control"
                type="text"
                placeholder="Nama pihak pertama"
                required
              />
            </div>

            <!-- Jabatan -->
            <div class="form-field">
              <label for="jabatan">
                Jabatan <span class="required-asterisk">*</span>
              </label>
              <input
                id="jabatan"
                v-model.trim="form.jabatan"
                class="input-control"
                type="text"
                placeholder="Contoh: Master"
                required
              />
            </div>

            <!-- Nama Kapal -->
            <div class="form-field">
              <label for="nama_kapal">
                Nama Kapal <span class="required-asterisk">*</span>
              </label>
              <input
                id="nama_kapal"
                v-model.trim="form.nama_kapal"
                class="input-control"
                type="text"
                placeholder="Nama kapal"
                required
              />
            </div>

            <!-- Lokasi -->
            <div class="form-field full-width">
              <label for="lokasi">
                Lokasi <span class="required-asterisk">*</span>
              </label>
              <textarea
                id="lokasi"
                v-model.trim="form.lokasi"
                class="input-control textarea-control"
                rows="3"
                placeholder="Masukkan detail lokasi..."
                required
              />
            </div>
          </div>
        </div>

        <div class="bar-actions">
          <button type="button" class="btn btn-secondary" @click="emit('close')">
            <span class="btn-icon">✕</span> Batal
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="loadingSubmit"
          >
            <span v-if="loadingSubmit" class="spinner"></span>
            <span v-else class="btn-icon">✓</span>
            {{ loadingSubmit ? "Memproses..." : "Simpan" }}
          </button>
        </div>
      </section>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useBeritaAcaraStore } from "~/stores/beritaAcaraStore";
import type { CompanyInspectionReport } from "~/types/beritaAcaraModel";

const props = withDefaults(
  defineProps<{
    mode?: "create" | "edit";
    dataEdit?: CompanyInspectionReport | null;
  }>(),
  { mode: "create", dataEdit: null },
);

const emit = defineEmits<{ close: []; saved: [] }>();
const beritaAcaraStore = useBeritaAcaraStore();
const notificationStore = useNotificationStore();
const loadingSubmit = ref(false);

const emptyForm = (): CompanyInspectionReport => ({
  id_customer: "",
  pihak_pertama: "",
  lokasi: "",
  jabatan: "",
  nama_kapal: "",
  tanggal_berita_acara: "",
});

const form = reactive<CompanyInspectionReport>(emptyForm());

const applyEditData = (data?: CompanyInspectionReport | null) => {
  Object.assign(form, emptyForm());
  delete form.id;
  if (!data) return;

  Object.assign(form, {
    id: data.id,
    id_customer: data.id_customer,
    pihak_pertama: data.pihak_pertama,
    lokasi: data.lokasi,
    jabatan: data.jabatan,
    nama_kapal: data.nama_kapal,
    tanggal_berita_acara: data.tanggal_berita_acara,
  });
};

watch(() => props.dataEdit, applyEditData, { immediate: true });

const submitBeritaAcara = async () => {
  if (
    !form.id_customer ||
    !form.pihak_pertama.trim() ||
    !form.lokasi.trim() ||
    !form.jabatan.trim() ||
    !form.nama_kapal.trim() ||
    !form.tanggal_berita_acara
  ) {
    notificationStore.showError("Semua data berita acara wajib diisi");
    return;
  }

  const payload: CompanyInspectionReport = {
    ...(form.id ? { id: form.id } : {}),
    id_customer: form.id_customer,
    pihak_pertama: form.pihak_pertama,
    lokasi: form.lokasi,
    jabatan: form.jabatan,
    nama_kapal: form.nama_kapal,
    tanggal_berita_acara: form.tanggal_berita_acara,
  };

  loadingSubmit.value = true;
  try {
    const saved =
      props.mode === "create"
        ? await beritaAcaraStore.addBeritaAcaraAct(payload)
        : await beritaAcaraStore.updateBeritaAcaraAct(payload);
    if (!saved) return;
    emit("saved");
    emit("close");
  } finally {
    loadingSubmit.value = false;
  }
};
</script>

<style scoped>
/* Page Layout Fix */
.page-shell {
  height: 100%;
  max-height: 100vh;
  overflow-y: auto;
  background-color: transparent !important; 
  color: #1e293b;
}

.form-container {
  width: 450px;
  margin: 0 auto;
  padding-bottom: 40px;
}

/* Header & Top Bar */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.header-title-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.page-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.bar-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 0 28px 28px 28px;
}

/* Card Panel */
.panel-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 28px;
  border-bottom: 1px solid #f1f5f9;
  background-color: #fafafa;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.panel-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background-color: #eff6ff;
  color: #2563eb;
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}

.panel-subtitle {
  margin: 2px 0 0 0;
  font-size: 13px;
  color: #64748b;
}

.panel-body {
  padding: 28px;
}

/* Form Grid & Fields */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.required-asterisk {
  color: #ef4444;
}

.full-width {
  grid-column: 1 / -1;
}

/* Input Controls */
.input-control {
  width: 100%;
  box-sizing: border-box;
  min-height: 44px;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background-color: #ffffff;
  color: #0f172a;
  font-size: 14px;
  transition: all 0.15s ease-in-out;
}

.input-control::placeholder {
  color: #94a3b8;
}

.input-control:hover {
  border-color: #94a3b8;
}

.input-control:focus {
  border-color: #2563eb;
  outline: none;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.textarea-control {
  line-height: 1.5;
  resize: vertical;
}

/* Custom Component Integration */
.custom-v-select :deep(.v-field) {
  border-radius: 10px !important;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 20px;
  border: 1px solid transparent;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background-color: #1d4ed8;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
}

.btn-secondary {
  background-color: #ffffff;
  border-color: #cbd5e1;
  color: #475569;
}

.btn-secondary:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 14px;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 640px) {
  .page-shell {
    padding: 16px;
  }

  .top-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .bar-actions {
    width: 100%;
    padding: 0 20px 20px 20px;
  }

  .bar-actions .btn {
    flex: 1;
  }

  .panel-body {
    padding: 20px 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
