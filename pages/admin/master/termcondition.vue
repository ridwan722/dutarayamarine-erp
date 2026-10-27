<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import moment from "moment";
import type { ConfirmationDialog } from "#components";
import type { termconditionM } from "~/types/termconditionModel";

definePageMeta({ layout: "admin" });

const termconditionStore = usetermconditionStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(null);
const isLoading = ref(true);
const deletingTermId = ref("");

const data = reactive({
  searchTnc: "",
  dialogBulkTnc: false,
  loadingBulk: false,
});

const termHeaders = [
  { title: "No.", value: "no", sortable: false, width: "54px" },
  { title: "Term & Condition", value: "nama_term", sortable: true, width: "560px" },
  { title: "Dibuat", value: "createdAt", sortable: true, width: "180px" },
  // { title: "Dibuat Oleh", value: "createdBy", sortable: true, width: "240px" },
  { title: "Aksi", value: "aksi", sortable: false, align: "center" as const, width: "70px" },
];

const bulkInputText = ref("");
const terms = computed(() => termconditionStore.getDataTermcondition);

function createdAtSeconds(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    value &&
    typeof value === "object" &&
    "seconds" in value &&
    typeof value.seconds === "number"
  ) {
    return value.seconds;
  }
  return 0;
}

const filteredTerms = computed(() => {
  const query = data.searchTnc.trim().toLocaleLowerCase("id-ID");

  return [...terms.value]
    .filter((term) => {
      if (!query) return true;
      return [term.nama_term, term.createdBy].some((value) =>
        String(value || "").toLocaleLowerCase("id-ID").includes(query),
      );
    })
    .sort((a, b) =>
      a.nama_term.localeCompare(b.nama_term, "id-ID", { sensitivity: "base" }),
    );
});

const uniqueTermCount = computed(
  () =>
    new Set(
      terms.value.map((term) => term.nama_term.trim().toLocaleLowerCase("id-ID")),
    ).size,
);

const contributorCount = computed(
  () =>
    new Set(
      terms.value.map((term) => term.createdBy?.trim()).filter(Boolean),
    ).size,
);

const parsedBulkLines = computed(() =>
  bulkInputText.value
    .split("\n")
    .map((line) => line.replace(/^\d+[.)]\s*/, "").trim())
    .filter(Boolean),
);

const uniqueBulkLineCount = computed(
  () =>
    new Set(
      parsedBulkLines.value.map((line) => line.toLocaleLowerCase("id-ID")),
    ).size,
);

onMounted(async () => {
  try {
    isLoading.value = true;
    await termconditionStore.tarikDataTermconditionAct();
  } catch (error) {
    console.error("Gagal mengambil data T&C:", error);
    notificationStore.showError("Gagal mengambil data T&C");
  } finally {
    isLoading.value = false;
  }
});

function formatCreatedAt(timestamp: unknown) {
  const seconds = createdAtSeconds(timestamp);
  return seconds ? moment.unix(seconds).format("DD MMM YYYY") : "—";
}

function creatorName(email: string) {
  if (!email) return "—";
  return email.split("@")[0]?.replace(/[._-]+/g, " ") || email;
}

function openDialogBulkTnc() {
  bulkInputText.value = "";
  data.dialogBulkTnc = true;
}

function closeBulkDialog() {
  if (data.loadingBulk) return;
  data.dialogBulkTnc = false;
}

async function simpanBulkTnc() {
  if (data.loadingBulk) return;
  if (!parsedBulkLines.value.length) {
    return notificationStore.showError("Daftar T&C tidak boleh kosong");
  }

  data.loadingBulk = true;
  try {
    const existingTerms = new Set(
      terms.value.map((item) => item.nama_term.trim().toLocaleLowerCase("id-ID")),
    );
    const nowUnix = moment().unix();
    const userEmail = userStore.getEmail;
    let addedCount = 0;
    let skippedCount = 0;

    for (const itemText of parsedBulkLines.value) {
      const normalizedText = itemText.toLocaleLowerCase("id-ID");
      if (existingTerms.has(normalizedText)) {
        skippedCount++;
        continue;
      }

      const payload: termconditionM = {
        nama_term: itemText,
        createdAt: nowUnix,
        createdBy: userEmail,
      };

      await termconditionStore.addTermconditionAct(payload);
      existingTerms.add(normalizedText);
      addedCount++;
    }

    if (addedCount > 0) {
      const skippedMessage = skippedCount
        ? ` ${skippedCount} data duplikat dilewati.`
        : "";
      notificationStore.showSuccess(
        `${addedCount} T&C berhasil ditambahkan.${skippedMessage}`,
      );
    } else {
      notificationStore.showInfo("Semua T&C yang dimasukkan sudah tersedia.");
    }

    data.dialogBulkTnc = false;
    bulkInputText.value = "";
  } catch (error) {
    console.error("Gagal menyimpan daftar T&C:", error);
    notificationStore.showError("Gagal menyimpan beberapa data T&C");
  } finally {
    data.loadingBulk = false;
  }
}

async function hapusTnc(id?: string) {
  if (!id) return notificationStore.showError("ID T&C tidak ditemukan");

  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus T&C",
    "Anda yakin ingin menghapus ketentuan ini? Tindakan ini tidak dapat dipulihkan.",
    { variant: "danger" },
  );
  if (!confirmed) return notificationStore.showInfo("Penghapusan dibatalkan");

  deletingTermId.value = id;
  try {
    await termconditionStore.deleteTermconditionAct(id);
  } finally {
    deletingTermId.value = "";
  }
}
</script>

<template>
  <div class="terms-page">
    <ConfirmationDialog ref="confirmationDialog" />

    <v-btn
      variant="text"
      color="grey-darken-3"
      prepend-icon="mdi-arrow-left"
      class="back-button text-none"
      @click="$router.go(-1)"
    >
      Kembali
    </v-btn>

    <header class="terms-hero">
      <div class="terms-hero-copy">
        <span class="terms-eyebrow">Master Data</span>
        <h1>Term &amp; Condition</h1>
        <p>
          Kelola ketentuan standar yang dapat digunakan kembali pada dokumen
          penawaran, invoice, dan purchase order.
        </p>
      </div>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        class="text-none add-terms-button"
        @click="openDialogBulkTnc"
      >
        Tambah T&amp;C
      </v-btn>
    </header>

    <section class="terms-summary" aria-label="Ringkasan term and condition">
      <article class="summary-card summary-card--primary">
        <span class="summary-icon"><v-icon icon="mdi-file-document-check-outline" size="20" /></span>
        <div><small>Total Term & Condition</small><strong>{{ terms.length }}</strong><span>T&C tersimpan di master data</span></div>
      </article>
    </section>

    <section class="terms-directory">
      <header class="directory-header">
        <div>
          <span class="section-kicker">Terms Directory</span>
          <div class="directory-title-row"><h2>Daftar Term &amp; Condition</h2><span>{{ filteredTerms.length }} data</span></div>
        </div>
        <label class="terms-search">
          <v-icon icon="mdi-magnify" size="18" />
          <input v-model="data.searchTnc" type="search" placeholder="Cari isi ketentuan atau pembuat..." />
          <button v-if="data.searchTnc" type="button" aria-label="Hapus pencarian" @click="data.searchTnc = ''"><v-icon icon="mdi-close" size="16" /></button>
        </label>
      </header>

      <div class="terms-table-wrap">
        <v-data-table
          :headers="termHeaders"
          :items="filteredTerms"
          :loading="isLoading"
          :items-per-page="-1"
          density="comfortable"
          item-value="id"
          class="terms-table"
          hide-default-footer
          hover
        >
          <template #item.no="{ index }"><span class="row-number">{{ index + 1 }}</span></template>
          <template #item.nama_term="{ item }">
            <div class="term-content">
              <!-- <span class="term-icon"><v-icon icon="mdi-text-box-check-outline" size="17" /></span> -->
              <p>{{ item.nama_term }}</p>
            </div>
          </template>
          <template #item.createdAt="{ item }">
            <div class="meta-cell"><v-icon icon="mdi-calendar-blank-outline" size="15" /><span>{{ formatCreatedAt(item.createdAt) }}</span></div>
          </template>
          <template #item.createdBy="{ item }">
            <div class="creator-cell"><span class="creator-avatar">{{ creatorName(item.createdBy).charAt(0).toUpperCase() }}</span><div><strong>{{ creatorName(item.createdBy) }}</strong><small>{{ item.createdBy || "—" }}</small></div></div>
          </template>
          <template #item.aksi="{ item }">
            <div class="table-actions">
              <button
                type="button"
                class="table-action-button"
                title="Hapus T&C"
                aria-label="Hapus T&C"
                :disabled="deletingTermId === item.id"
                @click="hapusTnc(item.id)"
              >
                <v-progress-circular v-if="deletingTermId === item.id" indeterminate size="14" width="2" />
                <v-icon v-else icon="mdi-delete-outline" size="16" />
              </button>
            </div>
          </template>
          <template #no-data>
            <div class="empty-state">
              <span class="empty-icon"><v-icon icon="mdi-file-search-outline" size="30" /></span>
              <strong>{{ data.searchTnc ? "T&C tidak ditemukan" : "Belum ada Term & Condition" }}</strong>
              <p>{{ data.searchTnc ? "Coba gunakan kata kunci lain." : "Tambahkan ketentuan pertama untuk membangun template dokumen." }}</p>
            </div>
          </template>
        </v-data-table>
      </div>

      <div class="terms-mobile-list">
        <div v-if="isLoading" class="mobile-loading">
          <v-skeleton-loader v-for="index in 3" :key="index" type="article" />
        </div>
        <div v-else-if="!filteredTerms.length" class="empty-state">
          <span class="empty-icon"><v-icon icon="mdi-file-search-outline" size="30" /></span>
          <strong>{{ data.searchTnc ? "T&C tidak ditemukan" : "Belum ada Term & Condition" }}</strong>
          <p>{{ data.searchTnc ? "Coba gunakan kata kunci lain." : "Tambahkan ketentuan pertama untuk membangun template dokumen." }}</p>
        </div>
        <template v-else>
          <article v-for="(term, index) in filteredTerms" :key="term.id" class="term-mobile-card">
            <header>
              <span class="mobile-number">{{ index + 1 }}</span>
              <div><small>{{ formatCreatedAt(term.createdAt) }} · {{ creatorName(term.createdBy) }}</small><p>{{ term.nama_term }}</p></div>
              <button type="button" aria-label="Hapus T&C" :disabled="deletingTermId === term.id" @click="hapusTnc(term.id)">
                <v-progress-circular v-if="deletingTermId === term.id" indeterminate size="14" width="2" />
                <v-icon v-else icon="mdi-delete-outline" size="17" />
              </button>
            </header>
          </article>
        </template>
      </div>
    </section>

    <v-dialog
      v-model="data.dialogBulkTnc"
      max-width="720"
      :fullscreen="$vuetify.display.smAndDown"
      :persistent="data.loadingBulk"
    >
      <form class="terms-dialog" @submit.prevent="simpanBulkTnc">
        <header class="terms-dialog-header">
          <div class="dialog-heading">
            <span class="dialog-icon"><v-icon icon="mdi-text-box-plus-outline" size="20" /></span>
            <div><h2>Tambah Term &amp; Condition</h2><p>Tambahkan beberapa ketentuan sekaligus, satu ketentuan per baris.</p></div>
          </div>
          <button type="button" class="dialog-close" :disabled="data.loadingBulk" aria-label="Tutup dialog" @click="closeBulkDialog"><v-icon icon="mdi-close" size="20" /></button>
        </header>

        <div class="terms-dialog-body">
          <section class="dialog-section">
            <div class="dialog-section-heading"><span>01</span><div><h3>Daftar Ketentuan</h3><p>Nomor urut seperti “1.” atau “2)” akan dibersihkan otomatis.</p></div></div>
            <v-textarea
              v-model="bulkInputText"
              class="bulk-input"
              label="Daftar T&C"
              placeholder="1. Lead time: 5 days&#10;2. Price is Franco Jakarta&#10;3. Payment term: 30 days"
              rows="10"
              variant="outlined"
              density="compact"
              hide-details
              autofocus
            />
          </section>

          <section class="bulk-summary" aria-live="polite">
            <span class="bulk-summary-icon"><v-icon icon="mdi-format-list-numbered" size="18" /></span>
            <div><strong>{{ parsedBulkLines.length }} baris terdeteksi</strong></div>
            <span v-if="parsedBulkLines.length" class="ready-badge">Siap disimpan</span>
          </section>
        </div>

        <footer class="terms-dialog-footer">
          <p>Ketentuan yang sudah tersedia akan dilewati secara otomatis.</p>
          <div>
            <v-btn variant="outlined" color="grey-darken-1" class="text-none dialog-cancel" :disabled="data.loadingBulk" @click="closeBulkDialog">Batal</v-btn>
            <v-btn type="submit" color="primary" variant="flat" prepend-icon="mdi-content-save-outline" class="text-none dialog-save" :disabled="data.loadingBulk || !parsedBulkLines.length" :loading="data.loadingBulk">Simpan Semua</v-btn>
          </div>
        </footer>
      </form>
    </v-dialog>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }
.terms-page { width: 100%; max-width: 1500px; min-height: 100vh; margin: 0 auto; padding: 8px 14px 30px; color: #243447; }
.back-button { min-height: 32px; margin-bottom: 8px; padding-inline: 7px !important; font-size: 11px; font-weight: 650; letter-spacing: 0; }
.terms-hero, .terms-directory, .summary-card { background: #fff; border: 1px solid #e0e5ea; box-shadow: 0 6px 18px rgba(34, 51, 68, .035); }
.terms-hero { display: flex; min-height: 118px; padding: 20px 22px; align-items: center; justify-content: space-between; gap: 24px; border-radius: 8px; }
.terms-hero-copy { min-width: 0; }
.terms-eyebrow, .section-kicker { color: #587a9b; font-size: 8px; font-weight: 750; letter-spacing: .13em; text-transform: uppercase; }
.terms-hero h1 { margin: 4px 0; color: #1d2937; font-size: 25px; font-weight: 750; letter-spacing: -.025em; line-height: 1.15; }
.terms-hero p { max-width: 720px; margin: 0; color: #778493; font-size: 11px; line-height: 1.55; }
.add-terms-button { flex: 0 0 auto; min-width: 142px; height: 36px !important; font-size: 10px !important; font-weight: 650 !important; letter-spacing: 0 !important; border-radius: 5px !important; }
.terms-summary { display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 10px; margin-top: 10px; }
.summary-card { display: flex; min-height: 96px; padding: 15px 17px; align-items: center; gap: 13px; border-radius: 7px; }
.summary-card--primary { background: #f8fafc; border-color: #d9e2eb; }
.summary-icon { display: grid; flex: 0 0 38px; width: 38px; height: 38px; place-items: center; color: #315f8c; background: #eaf1f7; border-radius: 6px; }
.summary-icon--green { color: #2c7957; background: #e9f5ef; }
.summary-icon--violet { color: #6a5790; background: #f0edf7; }
.summary-card > div { display: flex; min-width: 0; flex-direction: column; }
.summary-card small { color: #737f8c; font-size: 8px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.summary-card strong { margin: 2px 0 1px; color: #253444; font-size: 20px; font-weight: 750; line-height: 1.1; }
.summary-card > div > span { color: #9099a3; font-size: 9px; }
.terms-directory { margin-top: 10px; overflow: hidden; border-radius: 8px; }
.directory-header { display: flex; min-height: 72px; padding: 13px 18px; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 1px solid #e5e9ed; }
.directory-title-row { display: flex; margin-top: 3px; align-items: center; gap: 8px; }
.directory-title-row h2 { margin: 0; color: #263442; font-size: 15px; font-weight: 720; letter-spacing: -.015em; }
.directory-title-row > span { padding: 2px 7px; color: #6f7e8d; font-size: 8px; font-weight: 650; background: #f0f3f6; border-radius: 10px; }
.terms-search { display: flex; width: min(410px, 46vw); height: 34px; padding: 0 9px; align-items: center; gap: 7px; color: #8793a0; background: #f8fafb; border: 1px solid #d7dee5; border-radius: 5px; }
.terms-search:focus-within { background: #fff; border-color: #7f9fbd; box-shadow: 0 0 0 2px rgba(49, 95, 140, .08); }
.terms-search input { min-width: 0; flex: 1; color: #354454; font: inherit; font-size: 10px; background: transparent; border: 0; outline: 0; }
.terms-search input::placeholder { color: #9aa4ae; }
.terms-search button { display: grid; width: 23px; height: 23px; padding: 0; place-items: center; color: #7f8994; background: transparent; border: 0; border-radius: 4px; cursor: pointer; }
.terms-search button:hover { background: #edf1f4; }
.terms-table-wrap { width: 100%; overflow-x: auto; }
.terms-table { width: 100%; min-width: 1100px; }
.terms-table :deep(.v-data-table__th) { height: 36px !important; padding: 0 11px !important; color: #687584 !important; font-size: 8px !important; font-weight: 750 !important; letter-spacing: .055em !important; text-transform: uppercase !important; background: #f5f7f9 !important; border-bottom-color: #dfe4e9 !important; }
.terms-table :deep(.v-data-table__td) { min-height: 62px !important; padding: 9px 11px !important; color: #4b5968; font-size: 10px; border-bottom-color: #e8ecef !important; }
.terms-table :deep(tbody tr:hover) { background: #fafcfd !important; }
.terms-table :deep(.v-data-table__th:last-child), .terms-table :deep(.v-data-table__td:last-child) { position: sticky; right: 0; z-index: 2; box-shadow: -8px 0 12px -12px rgba(35, 52, 68, .35); }
.terms-table :deep(.v-data-table__th:last-child) { z-index: 3; background: #f5f7f9 !important; }
.terms-table :deep(.v-data-table__td:last-child) { background: #fff !important; }
.terms-table :deep(tbody tr:hover .v-data-table__td:last-child) { background: #fafcfd !important; }
.row-number { display: block; color: #84909c; text-align: center; font-variant-numeric: tabular-nums; }
.term-content { display: flex; min-width: 0; align-items: center; gap: 9px; }
.term-icon { display: grid; flex: 0 0 34px; width: 34px; height: 34px; place-items: center; color: #315f8c; background: #edf3f8; border: 1px solid #dbe6ef; border-radius: 6px; }
.term-content p { display: -webkit-box; max-width: 560px; margin: 0; overflow: hidden; color: #3f4e5d; font-size: 10px; line-height: 1.55; overflow-wrap: anywhere; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.meta-cell { display: flex; align-items: center; gap: 5px; color: #687684; }
.meta-cell .v-icon { color: #929ca6; }
.creator-cell { display: flex; min-width: 0; align-items: center; gap: 8px; }
.creator-avatar { display: grid; flex: 0 0 28px; width: 28px; height: 28px; place-items: center; color: #6a5790; font-size: 9px; font-weight: 750; background: #f0edf7; border-radius: 5px; }
.creator-cell > div { display: flex; min-width: 0; flex-direction: column; gap: 1px; }
.creator-cell strong { color: #4e5c6a; font-size: 9px; font-weight: 680; text-transform: capitalize; }
.creator-cell small { overflow: hidden; color: #939ca5; font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
.table-actions { display: flex; min-width: 42px; justify-content: center; }
.table-action-button { display: grid; flex: 0 0 30px; width: 30px; height: 30px; padding: 0; place-items: center; color: #b44c58; background: #fff; border: 1px solid #edd8dc; border-radius: 5px; cursor: pointer; }
.table-action-button:hover:not(:disabled) { background: #fcf0f2; border-color: #dfb9c0; }
.table-action-button:disabled { cursor: wait; opacity: .65; }
.terms-mobile-list { display: none; }
.empty-state { display: flex; min-height: 190px; padding: 30px; align-items: center; justify-content: center; flex-direction: column; color: #8e99a4; text-align: center; }
.empty-icon { display: grid; width: 52px; height: 52px; margin-bottom: 9px; place-items: center; color: #6d8193; background: #f1f4f6; border-radius: 8px; }
.empty-state strong { color: #566473; font-size: 11px; }
.empty-state p { margin: 4px 0 0; font-size: 9px; }
.terms-dialog { display: flex; width: 100%; max-height: calc(100vh - 40px); overflow: hidden; flex-direction: column; color: #263545; background: #f5f6f8; border: 1px solid #d9dee4; border-radius: 9px; box-shadow: 0 22px 60px rgba(20, 31, 43, .24); }
.terms-dialog-header { display: flex; min-height: 64px; padding: 11px 15px; align-items: center; justify-content: space-between; gap: 18px; background: #fff; border-bottom: 1px solid #dfe4e8; }
.dialog-heading { display: flex; min-width: 0; align-items: center; gap: 10px; }
.dialog-icon { display: grid; flex: 0 0 36px; width: 36px; height: 36px; place-items: center; color: #315f8c; background: #edf3f8; border: 1px solid #dbe6ef; border-radius: 6px; }
.dialog-heading h2 { margin: 0; color: #202c38; font-size: 14px; font-weight: 730; }
.dialog-heading p { margin: 2px 0 0; color: #818c97; font-size: 9px; }
.dialog-close { display: grid; flex: 0 0 30px; width: 30px; height: 30px; padding: 0; place-items: center; color: #75818d; background: transparent; border: 0; border-radius: 5px; cursor: pointer; }
.dialog-close:hover:not(:disabled) { background: #f0f3f5; }
.terms-dialog-body { display: flex; min-height: 0; padding: 10px; overflow-y: auto; flex-direction: column; gap: 8px; }
.dialog-section { padding: 12px; background: #fff; border: 1px solid #dfe4e8; border-radius: 6px; }
.dialog-section-heading { display: flex; margin-bottom: 10px; align-items: flex-start; gap: 8px; }
.dialog-section-heading > span { display: grid; flex: 0 0 22px; width: 22px; height: 21px; place-items: center; color: #607080; font-size: 8px; font-weight: 700; background: #f0f3f5; border: 1px solid #e0e5e9; border-radius: 4px; }
.dialog-section-heading h3 { margin: 0; color: #33404e; font-size: 11px; line-height: 1.25; }
.dialog-section-heading p { margin: 2px 0 0; color: #8b959f; font-size: 8px; }
.bulk-input :deep(.v-field) { font-size: 11px; border-radius: 5px; }
.bulk-input :deep(textarea) { line-height: 1.6; }
.bulk-summary { display: flex; min-height: 58px; padding: 10px 12px; align-items: center; gap: 9px; color: #536272; background: #f9fbfc; border: 1px solid #dfe5ea; border-radius: 6px; }
.bulk-summary-icon { display: grid; flex: 0 0 32px; width: 32px; height: 32px; place-items: center; color: #315f8c; background: #edf3f8; border-radius: 5px; }
.bulk-summary > div { display: flex; min-width: 0; flex: 1; flex-direction: column; }
.bulk-summary strong { font-size: 10px; }
.bulk-summary small { margin-top: 1px; color: #8a959f; font-size: 8px; }
.ready-badge { padding: 3px 7px; color: #2c7957; font-size: 8px; font-weight: 700; background: #e9f5ef; border-radius: 10px; }
.terms-dialog-footer { display: flex; flex: 0 0 auto; min-height: 56px; padding: 9px 14px; align-items: center; justify-content: space-between; gap: 16px; background: #fff; border-top: 1px solid #dfe4e8; }
.terms-dialog-footer p { margin: 0; color: #7d8893; font-size: 9px; }
.terms-dialog-footer > div { display: flex; gap: 7px; }
.dialog-cancel, .dialog-save { min-width: 96px; height: 32px !important; font-size: 10px !important; font-weight: 650 !important; letter-spacing: 0 !important; border-radius: 4px !important; }
.dialog-save { min-width: 135px; }

@media (max-width: 900px) {
  .summary-card { padding: 13px; }
  .summary-icon { display: none; }
}

@media (max-width: 767px) {
  .terms-page { padding: 6px 8px 22px; }
  .terms-hero { min-height: 0; padding: 17px; align-items: stretch; flex-direction: column; gap: 14px; }
  .terms-hero h1 { font-size: 22px; }
  .add-terms-button { width: 100%; }
  .terms-summary { grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 7px; }
  .summary-card { min-height: 86px; padding: 12px; }
  .summary-card:last-child { grid-column: 1 / -1; }
  .summary-card strong { font-size: 18px; }
  .terms-directory { margin-top: 7px; }
  .directory-header { padding: 13px; align-items: stretch; flex-direction: column; gap: 11px; }
  .terms-search { width: 100%; }
  .terms-table-wrap { display: none; }
  .terms-mobile-list { display: block; padding: 9px; background: #f7f9fa; }
  .mobile-loading { display: grid; gap: 8px; }
  .term-mobile-card { padding: 11px; background: #fff; border: 1px solid #dfe5ea; border-radius: 6px; }
  .term-mobile-card + .term-mobile-card { margin-top: 8px; }
  .term-mobile-card header { display: flex; align-items: flex-start; gap: 8px; }
  .mobile-number { display: grid; flex: 0 0 26px; width: 26px; height: 26px; place-items: center; color: #65788a; font-size: 8px; font-weight: 700; background: #eef2f5; border-radius: 5px; }
  .term-mobile-card header > div { min-width: 0; flex: 1; }
  .term-mobile-card small { color: #929ca6; font-size: 8px; }
  .term-mobile-card p { margin: 3px 0 0; color: #465564; font-size: 9px; line-height: 1.5; overflow-wrap: anywhere; }
  .term-mobile-card button { display: grid; flex: 0 0 29px; width: 29px; height: 29px; padding: 0; place-items: center; color: #ad4d58; background: #fcf2f3; border: 1px solid #efd8dc; border-radius: 4px; }
  .term-mobile-card button:disabled { opacity: .65; }
  .terms-dialog { height: 100%; max-height: 100%; border: 0; border-radius: 0; }
  .terms-dialog-header { min-height: 62px; padding: 10px 12px; }
  .dialog-heading p { display: none; }
  .terms-dialog-body { padding: 9px; }
  .dialog-section { padding: 11px; }
  .terms-dialog-footer { padding: 9px 10px; }
  .terms-dialog-footer p { display: none; }
  .terms-dialog-footer > div { display: grid; width: 100%; grid-template-columns: 1fr 1.35fr; }
  .dialog-cancel, .dialog-save { width: 100%; min-width: 0; }
}

@media (max-width: 420px) {
  .terms-summary { grid-template-columns: 1fr; }
  .summary-card:last-child { grid-column: auto; }
  .summary-card { min-height: 76px; }
  .ready-badge { display: none; }
}
</style>
