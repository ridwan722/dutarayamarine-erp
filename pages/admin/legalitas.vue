<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { legalitasM } from "~/types/legalitasModel";

definePageMeta({ layout: "admin" });
useHead({ title: "Legalitas Perusahaan | DRM ERP" });

interface LegalitasForm {
  title: string;
  description: string;
  reference: string;
}

const MAX_UPLOAD_FILE_BYTES = 650_000;
const MAX_FIRESTORE_DOCUMENT_BYTES = 900_000;

const legalitasStore = useLegalitasStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const legalDocuments = computed(() => legalitasStore.getDataLegalitas);
const searchQuery = ref("");
const previewDialog = ref(false);
const activeDocument = ref<legalitasM | null>(null);
const previewLoading = ref(false);
const activePreviewUrl = ref("");
let previewObjectUrl = "";
const isLoading = ref(true);
const addDialog = ref(false);
const saving = ref(false);
const selectedFile = ref<File | null>(null);
const uploadInput = ref<HTMLInputElement | null>(null);

const emptyForm = (): LegalitasForm => ({
  title: "",
  description: "",
  reference: "",
});
const form = ref<LegalitasForm>(emptyForm());

const filteredDocuments = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase("id-ID");

  return legalDocuments.value.filter((document) => {
    const matchesSearch =
      !query ||
      [
        document.title,
        document.shortTitle,
        document.description,
        document.reference,
        document.file.name,
      ].some((value) => value.toLocaleLowerCase("id-ID").includes(query));

    return matchesSearch;
  });
});

onMounted(async () => {
  isLoading.value = true;
  try {
    await legalitasStore.initializeLegalitasAct();
  } catch (error) {
    console.error("Gagal memuat collection legalitas:", error);
    notificationStore.showError(
      "Collection legalitas gagal dimuat. Dokumen bawaan tetap ditampilkan.",
    );
  } finally {
    isLoading.value = false;
  }
});

function formatFileSize(bytes: number) {
  if (!bytes) return "0 KB";

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** unitIndex;

  return `${value.toLocaleString("id-ID", {
    minimumFractionDigits: unitIndex > 1 ? 1 : 0,
    maximumFractionDigits: 1,
  })} ${units[unitIndex]}`;
}

function documentUrl(document: legalitasM) {
  return document.file.dataUrl;
}

function createBrowserUrl(document: legalitasM) {
  const source = documentUrl(document);
  if (!source.startsWith("data:")) {
    return { url: source, objectUrl: false };
  }

  const separatorIndex = source.indexOf(",");
  if (separatorIndex < 0) return { url: source, objectUrl: false };

  const header = source.slice(0, separatorIndex);
  const encodedData = source.slice(separatorIndex + 1);
  const contentType =
    header.match(/^data:([^;,]+)/)?.[1] || document.file.contentType;
  const binary = header.includes(";base64")
    ? window.atob(encodedData)
    : decodeURIComponent(encodedData);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }

  return {
    url: window.URL.createObjectURL(new Blob([bytes], { type: contentType })),
    objectUrl: true,
  };
}

function revokePreviewObjectUrl() {
  if (!previewObjectUrl) return;
  window.URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = "";
}

function openPreview(document: legalitasM) {
  revokePreviewObjectUrl();
  const browserUrl = createBrowserUrl(document);
  activeDocument.value = document;
  activePreviewUrl.value = `${browserUrl.url}#toolbar=1&navpanes=0&view=FitH`;
  previewObjectUrl = browserUrl.objectUrl ? browserUrl.url : "";
  previewLoading.value = true;
  previewDialog.value = true;
}

function openInNewTab(document: legalitasM) {
  const browserUrl = createBrowserUrl(document);
  const openedWindow = window.open(browserUrl.url, "_blank");
  if (!openedWindow) {
    notificationStore.showError(
      "Tab baru diblokir browser. Izinkan pop-up lalu coba kembali.",
    );
  } else {
    openedWindow.opener = null;
  }
  if (browserUrl.objectUrl) {
    window.setTimeout(() => window.URL.revokeObjectURL(browserUrl.url), 60_000);
  }
}

function downloadDocument(document: legalitasM) {
  const browserUrl = createBrowserUrl(document);
  const downloadLink = window.document.createElement("a");
  downloadLink.href = browserUrl.url;
  downloadLink.download = document.downloadName;
  downloadLink.setAttribute("aria-hidden", "true");
  window.document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  if (browserUrl.objectUrl) {
    window.setTimeout(() => window.URL.revokeObjectURL(browserUrl.url), 1_000);
  }
}

function printDocument(document: legalitasM) {
  const browserUrl = createBrowserUrl(document);
  const printWindow = window.open(browserUrl.url, "_blank");
  if (!printWindow) {
    if (browserUrl.objectUrl) window.URL.revokeObjectURL(browserUrl.url);
    notificationStore.showError(
      "Jendela cetak diblokir browser. Izinkan pop-up lalu coba kembali.",
    );
    return;
  }

  printWindow.addEventListener(
    "load",
    () => {
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    },
    { once: true },
  );
  if (browserUrl.objectUrl) {
    window.setTimeout(() => window.URL.revokeObjectURL(browserUrl.url), 60_000);
  }
}

watch(previewDialog, (isOpen) => {
  if (!isOpen) revokePreviewObjectUrl();
});

onBeforeUnmount(revokePreviewObjectUrl);

function resetFilters() {
  searchQuery.value = "";
}

function openAddDialog() {
  form.value = emptyForm();
  selectedFile.value = null;
  if (uploadInput.value) uploadInput.value.value = "";
  addDialog.value = true;
}

function closeAddDialog() {
  if (saving.value) return;
  addDialog.value = false;
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = "";
  if (!file) return;

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    notificationStore.showError("Dokumen wajib menggunakan format PDF");
    return;
  }
  if (file.size > MAX_UPLOAD_FILE_BYTES) {
    notificationStore.showError(
      "Ukuran PDF terlalu besar. Maksimal sekitar 650 KB per dokumen.",
    );
    return;
  }

  selectedFile.value = file;
  if (!form.value.title.trim()) {
    form.value.title = file.name
      .replace(/\.pdf$/i, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

function removeSelectedFile() {
  if (saving.value) return;
  selectedFile.value = null;
  if (uploadInput.value) uploadInput.value.value = "";
}

function readLegalFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Dokumen tidak dapat dibaca"));
    };
    reader.onerror = () =>
      reject(reader.error || new Error("Dokumen tidak dapat dibaca"));
    reader.onabort = () => reject(new Error("Pembacaan dokumen dibatalkan"));
    reader.readAsDataURL(file);
  });
}

function createDownloadName(title: string) {
  const cleanTitle = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `DRM-${cleanTitle || "Dokumen-Legalitas"}.pdf`;
}

async function saveDocument() {
  if (saving.value) return;

  const title = form.value.title.trim();
  if (!title) {
    return notificationStore.showError("Nama dokumen wajib diisi");
  }
  if (!selectedFile.value) {
    return notificationStore.showError("Pilih file PDF yang akan diunggah");
  }

  const estimatedFileBytes = 4 * Math.ceil(selectedFile.value.size / 3);
  if (estimatedFileBytes > MAX_FIRESTORE_DOCUMENT_BYTES) {
    return notificationStore.showError(
      "Ukuran PDF setelah diproses terlalu besar untuk disimpan di Firestore.",
    );
  }

  saving.value = true;
  try {
    const file = selectedFile.value;
    const dataUrl = await readLegalFile(file);
    const payload: legalitasM = {
      title,
      shortTitle: title,
      description:
        form.value.description.trim() || `Dokumen legalitas ${title}.`,
      reference: form.value.reference.trim() || "Dokumen Legalitas",
      downloadName: createDownloadName(title),
      icon: "mdi-file-document-outline",
      file: {
        name: file.name,
        dataUrl,
        size: file.size,
        contentType: file.type || "application/pdf",
      },
      createdAt: Math.floor(Date.now() / 1000),
      createdBy: userStore.getEmail,
      bundled: false,
    };

    if (
      new TextEncoder().encode(JSON.stringify(payload)).byteLength >
      MAX_FIRESTORE_DOCUMENT_BYTES
    ) {
      return notificationStore.showError(
        "Ukuran dokumen beserta informasinya terlalu besar. Gunakan PDF yang lebih kecil.",
      );
    }

    const saved = await legalitasStore.addLegalitasAct(payload);
    if (!saved) return;

    addDialog.value = false;
    form.value = emptyForm();
    selectedFile.value = null;
  } catch (error) {
    console.error("Gagal membaca atau menyimpan dokumen legalitas:", error);
    notificationStore.showError(
      "Gagal membaca atau menyimpan dokumen. Silakan coba kembali.",
    );
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <main class="legal-page">
    <v-btn
      variant="text"
      color="grey-darken-3"
      prepend-icon="mdi-arrow-left"
      class="back-button text-none"
      @click="$router.go(-1)"
    >
      Kembali
    </v-btn>

    <section class="legal-hero">
      <div class="hero-copy">
        <span class="eyebrow">
          <v-icon icon="mdi-shield-check-outline" size="14" />
          Pusat Dokumen Perusahaan
        </span>
        <h1>Legalitas PT Duta Raya Marine</h1>
        <p>
          Akses dokumen legal perusahaan dalam satu tempat. Pratinjau,
          cetak, atau unduh berkas PDF sesuai kebutuhan administrasi.
        </p>
        <div class="hero-status">
          <span><i class="status-dot" />Dokumen tersedia</span>
          <span><v-icon icon="mdi-lock-outline" size="14" />Akses internal</span>
        </div>
      </div>

      <div class="hero-illustration" aria-hidden="true">
        <div class="document-sheet document-sheet--back" />
        <div class="document-sheet document-sheet--middle" />
        <div class="document-sheet document-sheet--front">
          <span class="document-mark">
            <v-icon icon="mdi-shield-check" size="25" />
          </span>
          <i />
          <i />
          <i class="short-line" />
          <span class="document-seal">DRM</span>
        </div>
      </div>
    </section>

    <section class="document-library">
      <header class="library-header">
        <div>
          <span class="section-kicker">Document Library</span>
          <div class="library-title-row">
            <h2>Dokumen Legalitas</h2>
            <span>{{ filteredDocuments.length }} dokumen</span>
          </div>
          <p>Pilih dokumen untuk melihat detail atau mengunduh salinannya.</p>
        </div>

        <div class="library-actions">
          <label class="document-search">
            <v-icon icon="mdi-magnify" size="19" />
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Cari nama dokumen atau nomor referensi..."
              aria-label="Cari dokumen legalitas"
            />
            <button
              v-if="searchQuery"
              type="button"
              aria-label="Hapus pencarian"
              @click="searchQuery = ''"
            >
              <v-icon icon="mdi-close" size="16" />
            </button>
          </label>
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-file-plus-outline"
            class="add-document-button text-none"
            @click="openAddDialog"
          >
            Tambah Dokumen
          </v-btn>
        </div>
      </header>

      <div v-if="isLoading" class="document-grid loading-grid">
        <v-skeleton-loader
          v-for="index in 6"
          :key="index"
          type="article, actions"
          class="document-skeleton"
        />
      </div>

      <div v-else-if="filteredDocuments.length" class="document-grid">
        <article
          v-for="document in filteredDocuments"
          :key="document.id"
          class="document-card"
        >
          <div class="card-topline">
            <span class="pdf-label">
              <v-icon icon="mdi-file-pdf-box" size="15" />
              PDF
            </span>
          </div>

          <div class="card-content">
            <span class="card-document-icon">
              <v-icon :icon="document.icon" size="25" />
            </span>
            <h3>{{ document.title }}</h3>
            <p>{{ document.description }}</p>
          </div>

          <div class="document-meta">
            <div>
              <v-icon icon="mdi-tag-outline" size="15" />
              <span>{{ document.reference }}</span>
            </div>
            <div>
              <v-icon icon="mdi-harddisk" size="15" />
              <span>{{ formatFileSize(document.file.size) }}</span>
            </div>
          </div>

          <footer class="card-actions">
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-eye-outline"
              class="preview-button text-none"
              @click="openPreview(document)"
            >
              Lihat Dokumen
            </v-btn>

            <v-btn
              icon
              variant="outlined"
              class="icon-action"
              aria-label="Cetak dokumen"
              @click="printDocument(document)"
            >
              <v-icon icon="mdi-printer-outline" />
              <v-tooltip activator="parent" location="top">Cetak</v-tooltip>
            </v-btn>

            <v-btn
              icon
              variant="outlined"
              class="icon-action"
              aria-label="Unduh dokumen"
              @click="downloadDocument(document)"
            >
              <v-icon icon="mdi-download-outline" />
              <v-tooltip activator="parent" location="top">Unduh PDF</v-tooltip>
            </v-btn>
          </footer>
        </article>
      </div>

      <div v-else class="empty-state">
        <span><v-icon icon="mdi-file-search-outline" size="34" /></span>
        <h3>
          {{ legalDocuments.length ? "Dokumen tidak ditemukan" : "Belum ada dokumen" }}
        </h3>
        <p>
          {{
            legalDocuments.length
              ? "Coba gunakan nama dokumen atau nomor referensi lainnya."
              : "Tambahkan dokumen legalitas pertama ke collection."
          }}
        </p>
        <v-btn
          :variant="legalDocuments.length ? 'outlined' : 'flat'"
          :color="legalDocuments.length ? undefined : 'primary'"
          :prepend-icon="
            legalDocuments.length ? 'mdi-close' : 'mdi-file-plus-outline'
          "
          class="text-none"
          @click="legalDocuments.length ? resetFilters() : openAddDialog()"
        >
          {{ legalDocuments.length ? "Hapus pencarian" : "Tambah Dokumen" }}
        </v-btn>
      </div>
    </section>

    <v-dialog
      v-model="addDialog"
      max-width="760"
      :fullscreen="$vuetify.display.smAndDown"
      :persistent="saving"
    >
      <form class="upload-dialog" @submit.prevent="saveDocument">
        <header class="upload-dialog-header">
          <div class="upload-dialog-heading">
            <span class="upload-dialog-icon">
              <v-icon icon="mdi-file-document-plus-outline" size="21" />
            </span>
            <div>
              <h2>Tambah Dokumen Legalitas</h2>
              <p>Dokumen akan disimpan ke collection legalitas.</p>
            </div>
          </div>
          <button
            type="button"
            class="upload-dialog-close"
            :disabled="saving"
            aria-label="Tutup dialog"
            @click="closeAddDialog"
          >
            <v-icon icon="mdi-close" size="20" />
          </button>
        </header>

        <div class="upload-dialog-body">
          <section class="upload-form-section">
            <div class="upload-section-header">
              <span>01</span>
              <div>
                <h3>Informasi Dokumen</h3>
                <p>Lengkapi identitas agar dokumen mudah ditemukan.</p>
              </div>
            </div>

            <div class="upload-form-grid">
              <a-text-field-new
                v-model="form.title"
                label="Nama Dokumen *"
                placeholder="Contoh: Surat Izin Usaha"
                :disabled="saving"
              />
            </div>
            <a-text-field-new
              v-model="form.reference"
              label="Nomor / Referensi"
              placeholder="Contoh: KBLI 33121"
              :disabled="saving"
            />
            <a-textarea-new
              v-model="form.description"
              label="Deskripsi"
              placeholder="Jelaskan fungsi atau isi singkat dokumen..."
              :disabled="saving"
              :rows="3"
              :maxlength="300"
            />
          </section>

          <section class="upload-form-section">
            <div class="upload-section-header">
              <span>02</span>
              <div>
                <h3>File PDF</h3>
                <p>Pilih satu file PDF untuk disimpan bersama data dokumen.</p>
              </div>
            </div>

            <div class="legal-file-upload-row">
              <div class="legal-file-upload-wrapper">
                <label for="upload-legalitas" class="upload-field-label">
                  Upload Dokumen *
                </label>
                <div class="legal-file-upload-box">
                  <input
                    id="upload-legalitas"
                    ref="uploadInput"
                    class="legal-file-input"
                    type="file"
                    accept="application/pdf,.pdf"
                    :disabled="saving"
                    @change="handleFileChange"
                  />
                  <span class="legal-file-upload-icon" aria-hidden="true">
                    <v-icon icon="mdi-tray-arrow-up" size="20" />
                  </span>
                  <span>
                    <strong>Pilih File PDF</strong>
                    <small>Maks. sekitar 650 KB</small>
                  </span>
                </div>
              </div>

              <div v-if="selectedFile" class="legal-selected-file-wrapper">
                <span class="upload-field-label">File Terpilih</span>
                <div class="legal-selected-file">
                  <span class="selected-file-icon">
                    <v-icon icon="mdi-file-pdf-box" size="21" />
                  </span>
                  <span class="selected-file-info">
                    <strong>{{ selectedFile.name }}</strong>
                    <small>{{ formatFileSize(selectedFile.size) }}</small>
                  </span>
                  <button
                    type="button"
                    :disabled="saving"
                    :aria-label="`Hapus ${selectedFile.name}`"
                    @click="removeSelectedFile"
                  >
                    <v-icon icon="mdi-close" size="17" />
                  </button>
                </div>
              </div>
            </div>

            <div class="upload-info-note">
              <v-icon icon="mdi-information-outline" size="17" />
              <span>
                File dibaca sebagai Data URL seperti upload PO invoice, lalu
                disimpan langsung pada dokumen Firestore.
              </span>
            </div>
          </section>
        </div>

        <footer class="upload-dialog-footer">
          <p>Nama unduhan otomatis memakai format DRM-Nama-Dokumen.pdf.</p>
          <div>
            <v-btn
              variant="outlined"
              color="grey-darken-1"
              class="text-none"
              :disabled="saving"
              @click="closeAddDialog"
            >
              Batal
            </v-btn>
            <v-btn
              type="submit"
              color="primary"
              variant="flat"
              prepend-icon="mdi-content-save-outline"
              class="text-none"
              :loading="saving"
              :disabled="saving || !form.title.trim() || !selectedFile"
            >
              Simpan Dokumen
            </v-btn>
          </div>
        </footer>
      </form>
    </v-dialog>

    <v-dialog
      v-model="previewDialog"
      max-width="1180"
      :fullscreen="$vuetify.display.smAndDown"
      scrollable
    >
      <section v-if="activeDocument" class="preview-dialog">
        <header class="preview-header">
          <div class="preview-heading">
            <span class="preview-heading-icon">
              <v-icon :icon="activeDocument.icon" size="21" />
            </span>
            <div>
              <span>Dokumen PDF · {{ formatFileSize(activeDocument.file.size) }}</span>
              <h2>{{ activeDocument.title }}</h2>
            </div>
          </div>

          <div class="preview-header-actions">
            <v-btn
              variant="outlined"
              prepend-icon="mdi-open-in-new"
              class="text-none preview-secondary-action"
              @click="openInNewTab(activeDocument)"
            >
              Buka tab baru
            </v-btn>
            <button
              type="button"
              class="preview-close"
              aria-label="Tutup pratinjau"
              @click="previewDialog = false"
            >
              <v-icon icon="mdi-close" size="21" />
            </button>
          </div>
        </header>

        <div class="preview-body">
          <div v-if="previewLoading" class="preview-loader">
            <v-progress-circular indeterminate color="primary" size="34" width="3" />
            <span>Memuat dokumen...</span>
          </div>
          <iframe
            :key="activeDocument.id"
            :src="activePreviewUrl"
            :title="`Pratinjau ${activeDocument.title}`"
            class="pdf-frame"
            @load="previewLoading = false"
          />
        </div>

        <footer class="preview-footer">
          <div class="preview-footer-note">
            <v-icon icon="mdi-information-outline" size="16" />
            <span>Jika pratinjau tidak tampil, gunakan tombol “Buka tab baru”.</span>
          </div>
          <div class="preview-footer-actions">
            <v-btn
              variant="outlined"
              prepend-icon="mdi-printer-outline"
              class="text-none"
              @click="printDocument(activeDocument)"
            >
              Cetak Dokumen
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-download-outline"
              class="text-none"
              @click="downloadDocument(activeDocument)"
            >
              Unduh PDF
            </v-btn>
          </div>
        </footer>
      </section>
    </v-dialog>
  </main>
</template>

<style scoped>
* { box-sizing: border-box; }
.legal-page { width: 100%; max-width: 1500px; min-height: calc(100vh - 72px); margin: 0 auto; padding: 8px 14px 34px; color: #243447; }
.back-button { min-height: 32px; margin-bottom: 8px; padding-inline: 7px !important; font-size: 11px; font-weight: 650; letter-spacing: 0; }
.legal-hero, .summary-card, .document-library { background: #fff; border: 1px solid #dfe5eb; box-shadow: 0 8px 24px rgba(23, 43, 65, .045); }
.legal-hero { position: relative; display: flex; min-height: 230px; padding: 34px 40px; align-items: center; justify-content: space-between; gap: 48px; overflow: hidden; background: radial-gradient(circle at 88% 20%, rgba(66,125,184,.11), transparent 27%), linear-gradient(115deg, #fff 0%, #f8fbfd 100%); border-radius: 12px; }
.legal-hero::after { position: absolute; right: -70px; bottom: -115px; width: 330px; height: 330px; background: rgba(52,102,151,.035); border: 1px solid rgba(52,102,151,.06); border-radius: 50%; content: ""; }
.hero-copy { position: relative; z-index: 1; max-width: 780px; }
.eyebrow { display: inline-flex; padding: 5px 9px; align-items: center; gap: 6px; color: #315f8c; font-size: 9px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; background: #edf4fa; border: 1px solid #d8e7f3; border-radius: 20px; }
.hero-copy h1 { margin: 12px 0 8px; color: #172638; font-size: clamp(27px, 3vw, 38px); font-weight: 760; letter-spacing: -.035em; line-height: 1.12; }
.hero-copy > p { max-width: 690px; margin: 0; color: #6f7e8d; font-size: 12px; line-height: 1.7; }
.hero-status { display: flex; margin-top: 19px; align-items: center; flex-wrap: wrap; gap: 18px; }
.hero-status span { display: inline-flex; align-items: center; gap: 6px; color: #657586; font-size: 10px; font-weight: 600; }
.status-dot { width: 7px; height: 7px; background: #3d9a70; border: 2px solid #dff2e9; border-radius: 50%; box-shadow: 0 0 0 2px #3d9a70; }
.hero-illustration { position: relative; z-index: 1; flex: 0 0 210px; width: 210px; height: 160px; }
.document-sheet { position: absolute; width: 116px; height: 148px; background: #fff; border: 1px solid #cad7e2; border-radius: 7px; box-shadow: 0 16px 36px rgba(32,58,83,.12); }
.document-sheet--back { top: 8px; left: 32px; transform: rotate(-10deg); background: #edf3f8; }
.document-sheet--middle { top: 6px; right: 18px; transform: rotate(8deg); background: #f7fafc; }
.document-sheet--front { top: 0; left: 55px; display: flex; padding: 18px 16px; align-items: center; flex-direction: column; }
.document-mark { display: grid; width: 48px; height: 48px; margin-bottom: 16px; place-items: center; color: #315f8c; background: #ebf3f9; border-radius: 50%; }
.document-sheet--front > i { display: block; width: 74px; height: 4px; margin-bottom: 7px; background: #d9e2ea; border-radius: 10px; }
.document-sheet--front > i.short-line { width: 48px; }
.document-seal { display: grid; position: absolute; right: 11px; bottom: 10px; width: 29px; height: 29px; place-items: center; color: #aa5260; font-size: 7px; font-weight: 800; letter-spacing: .06em; border: 2px solid #d797a1; border-radius: 50%; transform: rotate(-8deg); }
.summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 10px; }
.summary-card { display: flex; min-height: 96px; padding: 16px 18px; align-items: center; gap: 13px; border-radius: 9px; }
.summary-icon { display: grid; flex: 0 0 42px; width: 42px; height: 42px; place-items: center; border-radius: 8px; }
.summary-icon--blue { color: #315f8c; background: #eaf2f8; }
.summary-icon--green { color: #2c7957; background: #e9f5ef; }
.summary-icon--amber { color: #a05d2f; background: #fbf0e7; }
.summary-card > div { display: flex; min-width: 0; flex-direction: column; }
.summary-card small { color: #7a8794; font-size: 8px; font-weight: 750; letter-spacing: .07em; text-transform: uppercase; }
.summary-card strong { margin: 2px 0 1px; color: #253444; font-size: 21px; font-weight: 760; line-height: 1.1; }
.summary-card > div > span { color: #9099a3; font-size: 9px; }
.document-library { margin-top: 10px; overflow: hidden; border-radius: 11px; }
.library-header { display: flex; min-height: 104px; padding: 20px 22px; align-items: center; justify-content: space-between; gap: 24px; border-bottom: 1px solid #e5eaee; }
.section-kicker { color: #587a9b; font-size: 8px; font-weight: 750; letter-spacing: .13em; text-transform: uppercase; }
.library-title-row { display: flex; margin-top: 3px; align-items: center; gap: 9px; }
.library-title-row h2 { margin: 0; color: #263442; font-size: 18px; font-weight: 730; letter-spacing: -.02em; }
.library-title-row > span { padding: 3px 8px; color: #617181; font-size: 8px; font-weight: 700; background: #eef2f5; border-radius: 12px; }
.library-header p { margin: 4px 0 0; color: #8a959f; font-size: 9px; }
.library-actions { display: flex; min-width: 0; align-items: center; gap: 8px; }
.document-search { display: flex; width: min(410px, 44vw); height: 38px; padding: 0 10px; align-items: center; gap: 8px; color: #8793a0; background: #f8fafb; border: 1px solid #d7dee5; border-radius: 7px; transition: .2s ease; }
.document-search:focus-within { background: #fff; border-color: #7899b8; box-shadow: 0 0 0 3px rgba(49,95,140,.08); }
.document-search input { min-width: 0; flex: 1; color: #354454; font: inherit; font-size: 10px; background: transparent; border: 0; outline: 0; }
.document-search input::placeholder { color: #9aa4ae; }
.document-search button { display: grid; width: 24px; height: 24px; padding: 0; place-items: center; color: #7f8994; background: transparent; border: 0; border-radius: 5px; cursor: pointer; }
.document-search button:hover { background: #ebf0f4; }
.add-document-button { flex: 0 0 auto; height: 38px !important; padding-inline: 14px !important; font-size: 9px !important; font-weight: 680 !important; letter-spacing: 0 !important; border-radius: 6px !important; }
.document-grid { display: grid; padding: 16px; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; background: #f7f9fb; }
.document-card { display: flex; min-width: 0; min-height: 315px; padding: 16px; flex-direction: column; background: #fff; border: 1px solid #dde4ea; border-radius: 9px; box-shadow: 0 4px 12px rgba(30,50,70,.025); transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
.document-card:hover { border-color: #c7d5e1; box-shadow: 0 11px 26px rgba(33,58,82,.08); transform: translateY(-2px); }
.card-topline { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
.pdf-label { display: inline-flex; min-height: 22px; padding: 0 8px; align-items: center; gap: 4px; color: #a64d58; font-size: 8px; font-weight: 730; background: #fbf0f2; border-radius: 10px; }
.card-content { flex: 1; padding: 18px 1px 14px; }
.card-document-icon { display: grid; width: 48px; height: 48px; margin-bottom: 13px; place-items: center; color: #315f8c; background: #edf3f8; border: 1px solid #dce7ef; border-radius: 9px; }
.card-content h3 { margin: 0; color: #293847; font-size: 13px; font-weight: 730; letter-spacing: -.01em; line-height: 1.35; }
.card-content p { display: -webkit-box; margin: 7px 0 0; overflow: hidden; color: #7e8a96; font-size: 9px; line-height: 1.6; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.document-meta { display: grid; padding: 10px 0; gap: 6px; border-top: 1px solid #edf0f3; border-bottom: 1px solid #edf0f3; }
.document-meta div { display: flex; min-width: 0; align-items: center; gap: 6px; color: #7d8995; font-size: 8px; }
.document-meta div .v-icon { flex: 0 0 auto; color: #9aa5af; }
.document-meta span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-actions { display: grid; padding-top: 12px; grid-template-columns: minmax(0, 1fr) 34px 34px; gap: 7px; }
.preview-button { height: 34px !important; font-size: 9px !important; font-weight: 650 !important; letter-spacing: 0 !important; border-radius: 5px !important; }
.icon-action { width: 34px !important; min-width: 34px !important; height: 34px !important; color: #627384 !important; border-color: #d5dde4 !important; border-radius: 5px !important; }
.icon-action :deep(.v-icon) { font-size: 17px !important; }
.loading-grid { min-height: 500px; }
.document-skeleton { min-height: 280px; border: 1px solid #dde4ea; border-radius: 9px; }
.empty-state { display: flex; min-height: 360px; padding: 45px 20px; align-items: center; justify-content: center; flex-direction: column; color: #87939e; text-align: center; background: #f8fafb; }
.empty-state > span { display: grid; width: 62px; height: 62px; margin-bottom: 13px; place-items: center; color: #64798d; background: #edf2f6; border-radius: 12px; }
.empty-state h3 { margin: 0; color: #526170; font-size: 13px; }
.empty-state p { margin: 5px 0 15px; font-size: 9px; }
.upload-dialog { display: flex; width: 100%; max-height: calc(100vh - 40px); overflow: hidden; flex-direction: column; color: #263545; background: #f4f6f8; border: 1px solid #d7dde3; border-radius: 11px; box-shadow: 0 24px 70px rgba(16,31,45,.26); }
.upload-dialog-header { display: flex; min-height: 70px; padding: 12px 16px; align-items: center; justify-content: space-between; gap: 18px; background: #fff; border-bottom: 1px solid #dfe4e8; }
.upload-dialog-heading { display: flex; min-width: 0; align-items: center; gap: 11px; }
.upload-dialog-icon { display: grid; flex: 0 0 40px; width: 40px; height: 40px; place-items: center; color: #315f8c; background: #edf3f8; border: 1px solid #dbe6ef; border-radius: 7px; }
.upload-dialog-heading h2 { margin: 0; color: #202d3a; font-size: 15px; font-weight: 740; letter-spacing: -.015em; }
.upload-dialog-heading p { margin: 2px 0 0; color: #818c97; font-size: 9px; }
.upload-dialog-close { display: grid; flex: 0 0 32px; width: 32px; height: 32px; padding: 0; place-items: center; color: #75818d; background: transparent; border: 0; border-radius: 5px; cursor: pointer; }
.upload-dialog-close:hover:not(:disabled) { background: #eef2f5; }
.upload-dialog-close:disabled { cursor: wait; opacity: .55; }
.upload-dialog-body { display: flex; min-height: 0; padding: 11px; overflow-y: auto; flex-direction: column; gap: 9px; }
.upload-form-section { display: grid; padding: 14px; gap: 11px; background: #fff; border: 1px solid #dfe4e8; border-radius: 7px; }
.upload-section-header { display: flex; margin-bottom: 1px; align-items: flex-start; gap: 9px; }
.upload-section-header > span { display: grid; flex: 0 0 23px; width: 23px; height: 22px; place-items: center; color: #607080; font-size: 8px; font-weight: 700; background: #f0f3f5; border: 1px solid #e0e5e9; border-radius: 4px; }
.upload-section-header h3 { margin: 0; color: #33404e; font-size: 11px; line-height: 1.25; }
.upload-section-header p { margin: 2px 0 0; color: #8b959f; font-size: 8px; }
.upload-form-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
.legal-file-upload-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; }
.legal-file-upload-wrapper, .legal-selected-file-wrapper { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.upload-field-label { color: #495057; font-size: 10px; font-weight: 650; line-height: 1.2; }
.legal-file-upload-box { position: relative; display: flex; min-height: 67px; padding: 10px 12px; align-items: center; gap: 10px; overflow: hidden; background: #f8fafc; border: 1px dashed #b9c8d5; border-radius: 6px; transition: .18s ease; }
.legal-file-upload-box:hover { background: #f1f6fa; border-color: #7398b8; }
.legal-file-input { position: absolute; z-index: 2; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.legal-file-input:disabled { cursor: wait; }
.legal-file-upload-icon { display: grid; flex: 0 0 36px; width: 36px; height: 36px; place-items: center; color: #315f8c; background: #e8f1f8; border-radius: 6px; }
.legal-file-upload-box > span:last-child { display: flex; min-width: 0; flex-direction: column; }
.legal-file-upload-box strong { color: #435363; font-size: 10px; font-weight: 680; }
.legal-file-upload-box small { margin-top: 2px; color: #8b97a2; font-size: 8px; }
.legal-selected-file { display: flex; min-height: 67px; padding: 10px; align-items: center; gap: 9px; background: #f8fafb; border: 1px solid #dbe2e8; border-radius: 6px; }
.selected-file-icon { display: grid; flex: 0 0 36px; width: 36px; height: 36px; place-items: center; color: #a64d58; background: #fbf0f2; border-radius: 6px; }
.selected-file-info { display: flex; min-width: 0; flex: 1; flex-direction: column; }
.selected-file-info strong { overflow: hidden; color: #465564; font-size: 9px; font-weight: 680; text-overflow: ellipsis; white-space: nowrap; }
.selected-file-info small { margin-top: 2px; color: #8e99a4; font-size: 8px; }
.legal-selected-file button { display: grid; flex: 0 0 28px; width: 28px; height: 28px; padding: 0; place-items: center; color: #a64d58; background: transparent; border: 0; border-radius: 5px; cursor: pointer; }
.legal-selected-file button:hover:not(:disabled) { background: #faecef; }
.upload-info-note { display: flex; min-height: 42px; padding: 9px 10px; align-items: flex-start; gap: 7px; color: #667788; font-size: 8px; line-height: 1.5; background: #eef5fa; border: 1px solid #dae8f2; border-radius: 6px; }
.upload-info-note .v-icon { flex: 0 0 auto; color: #4f7698; }
.upload-dialog-footer { display: flex; flex: 0 0 auto; min-height: 59px; padding: 10px 15px; align-items: center; justify-content: space-between; gap: 16px; background: #fff; border-top: 1px solid #dfe4e8; }
.upload-dialog-footer p { margin: 0; color: #7d8893; font-size: 8px; }
.upload-dialog-footer > div { display: flex; gap: 7px; }
.upload-dialog-footer .v-btn { min-width: 100px; height: 33px !important; font-size: 9px !important; font-weight: 650 !important; letter-spacing: 0 !important; border-radius: 5px !important; }
.preview-dialog { display: flex; width: 100%; height: min(850px, calc(100vh - 40px)); overflow: hidden; flex-direction: column; color: #263545; background: #eef1f4; border: 1px solid #d6dde4; border-radius: 11px; box-shadow: 0 24px 70px rgba(16,31,45,.28); }
.preview-header { display: flex; flex: 0 0 auto; min-height: 72px; padding: 12px 15px; align-items: center; justify-content: space-between; gap: 20px; background: #fff; border-bottom: 1px solid #dce2e7; }
.preview-heading { display: flex; min-width: 0; align-items: center; gap: 10px; }
.preview-heading-icon { display: grid; flex: 0 0 39px; width: 39px; height: 39px; place-items: center; color: #315f8c; background: #edf3f8; border: 1px solid #dbe6ef; border-radius: 7px; }
.preview-heading > div { min-width: 0; }
.preview-heading span { display: block; color: #7b8895; font-size: 8px; font-weight: 650; letter-spacing: .04em; text-transform: uppercase; }
.preview-heading h2 { overflow: hidden; margin: 2px 0 0; color: #243342; font-size: 14px; font-weight: 730; text-overflow: ellipsis; white-space: nowrap; }
.preview-header-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 7px; }
.preview-secondary-action, .preview-download-action { height: 33px !important; font-size: 9px !important; font-weight: 650 !important; letter-spacing: 0 !important; border-radius: 5px !important; }
.preview-close { display: grid; width: 33px; height: 33px; padding: 0; place-items: center; color: #6f7c88; background: transparent; border: 0; border-radius: 5px; cursor: pointer; }
.preview-close:hover { background: #edf1f4; }
.preview-body { position: relative; min-height: 0; padding: 10px; flex: 1; }
.preview-loader { position: absolute; z-index: 3; inset: 10px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; color: #748391; font-size: 9px; background: #f8fafb; }
.pdf-frame { position: relative; z-index: 2; display: block; width: 100%; height: 100%; background: #fff; border: 1px solid #d9dfe5; border-radius: 5px; }
.preview-footer { display: flex; flex: 0 0 auto; min-height: 54px; padding: 9px 15px; align-items: center; gap: 18px; background: #fff; border-top: 1px solid #dce2e7; }
.preview-footer-note { display: flex; align-items: center; gap: 6px; color: #7d8995; font-size: 9px; }
.preview-footer-actions { display: flex; margin-left: auto; align-items: center; justify-content: flex-end; gap: 7px; }
.preview-footer .v-btn { height: 32px !important; font-size: 9px !important; font-weight: 650 !important; letter-spacing: 0 !important; border-radius: 5px !important; }

@media (max-width: 1050px) {
  .document-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hero-illustration { flex-basis: 180px; transform: scale(.9); transform-origin: right center; }
}

@media (max-width: 767px) {
  .legal-page { padding: 6px 8px 24px; }
  .legal-hero { min-height: 0; padding: 25px 20px; }
  .hero-copy h1 { font-size: 27px; }
  .hero-illustration { display: none; }
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; margin-top: 7px; }
  .summary-card { min-height: 88px; padding: 13px; }
  .summary-card:last-child { grid-column: 1 / -1; }
  .summary-icon { width: 38px; height: 38px; flex-basis: 38px; }
  .document-library { margin-top: 7px; }
  .library-header { min-height: 0; padding: 16px; align-items: stretch; flex-direction: column; gap: 13px; }
  .library-actions { align-items: stretch; flex-direction: column; }
  .document-search { width: 100%; }
  .add-document-button { width: 100%; }
  .document-grid { padding: 10px; grid-template-columns: 1fr; gap: 9px; }
  .document-card { min-height: 300px; }
  .upload-dialog { height: 100%; max-height: 100%; border: 0; border-radius: 0; }
  .upload-dialog-header { min-height: 64px; padding: 10px 12px; }
  .upload-dialog-heading p { display: none; }
  .upload-dialog-body { padding: 9px; }
  .upload-form-section { padding: 12px; }
  .upload-form-grid, .legal-file-upload-row { grid-template-columns: 1fr; }
  .upload-dialog-footer { padding: 9px 10px; }
  .upload-dialog-footer p { display: none; }
  .upload-dialog-footer > div { display: grid; width: 100%; grid-template-columns: 1fr 1.3fr; }
  .upload-dialog-footer .v-btn { width: 100%; min-width: 0; }
  .preview-dialog { height: 100%; max-height: 100%; border: 0; border-radius: 0; }
  .preview-header { min-height: 64px; padding: 9px 10px; }
  .preview-heading-icon, .preview-secondary-action, .preview-download-action { display: none !important; }
  .preview-heading h2 { max-width: calc(100vw - 80px); font-size: 12px; }
  .preview-body { padding: 0; }
  .pdf-frame { border: 0; border-radius: 0; }
  .preview-loader { inset: 0; }
  .preview-footer { padding: 8px 10px; }
  .preview-footer-note { display: none; }
  .preview-footer-actions { display: grid; width: 100%; grid-template-columns: 1fr 1fr; }
  .preview-footer .v-btn { width: 100%; }
}

@media (max-width: 420px) {
  .hero-copy h1 { font-size: 24px; }
  .hero-status { align-items: flex-start; flex-direction: column; gap: 10px; }
  .summary-grid { grid-template-columns: 1fr; }
  .summary-card:last-child { grid-column: auto; }
}
</style>
