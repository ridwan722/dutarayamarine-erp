<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import moment from "moment";
import type { ConfirmationDialog } from "#components";
import type { leadsM } from "~/types/leadsModel";

definePageMeta({ layout: "admin" });

const leadsStore = useleadsStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(null);
const isLoading = ref(true);
const isSaving = ref(false);
const deletingLeadId = ref("");

const data = reactive({
  searchLeads: "",
  dialogLeads: false,
});

const leadsHeaders = [
  { title: "No.", value: "no", sortable: false, width: "48px" },
  { title: "Company", value: "nama_perusahaan", sortable: true, width: "210px" },
  { title: "PIC", value: "pic", sortable: true, width: "135px" },
  { title: "Vessel", value: "vessel", sortable: true, width: "135px" },
  { title: "Inquiry", value: "inquiry", sortable: true, width: "230px" },
  { title: "Address", value: "alamat", sortable: true, width: "230px" },
  { title: "Aksi", value: "aksi", sortable: false, align: "center" as const, width: "58px" },
];

function emptyLeads(): leadsM {
  return {
    nama_perusahaan: "",
    pic: "",
    alamat: "",
    vessel: "",
    inquiry: "",
    createdAt: 0,
  };
}

const newLeads = ref<leadsM>(emptyLeads());
const leads = computed(() => leadsStore.getDataLeads);
const inquiryCount = computed(
  () => leads.value.filter((lead) => lead.inquiry?.trim()).length,
);
const vesselCount = computed(
  () => leads.value.filter((lead) => lead.vessel?.trim()).length,
);

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

const filteredLeads = computed(() => {
  const query = data.searchLeads.trim().toLocaleLowerCase("id-ID");

  return [...leads.value]
    .filter((lead) => {
      if (!query) return true;
      return [
        lead.nama_perusahaan,
        lead.pic,
        lead.vessel,
        lead.inquiry,
        lead.alamat,
      ].some((value) =>
        String(value || "").toLocaleLowerCase("id-ID").includes(query),
      );
    })
    .sort(
      (a, b) =>
        createdAtSeconds(b.createdAt) - createdAtSeconds(a.createdAt),
    );
});

onMounted(async () => {
  try {
    isLoading.value = true;
    await leadsStore.tarikDataLeadsAct();
  } catch (error) {
    console.error("Gagal mengambil data leads:", error);
    notificationStore.showError("Gagal mengambil data leads");
  } finally {
    isLoading.value = false;
  }
});

function leadInitial(name: string) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "LW";
  return words.slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase();
}

function formatCreatedAt(timestamp: unknown) {
  const seconds = createdAtSeconds(timestamp);
  return seconds ? moment.unix(seconds).format("DD MMM YYYY") : "—";
}

function openDialogAddLeads() {
  newLeads.value = emptyLeads();
  data.dialogLeads = true;
}

function closeLeadsDialog() {
  if (isSaving.value) return;
  data.dialogLeads = false;
}

async function simpanLeads() {
  if (isSaving.value) return;
  if (!newLeads.value.nama_perusahaan.trim()) {
    return notificationStore.showError("Nama perusahaan tidak boleh kosong");
  }
  if (!newLeads.value.pic.trim()) {
    return notificationStore.showError("PIC tidak boleh kosong");
  }
  if (!newLeads.value.vessel.trim()) {
    return notificationStore.showError("Vessel tidak boleh kosong");
  }
  if (!newLeads.value.inquiry?.trim()) {
    return notificationStore.showError("Inquiry tidak boleh kosong");
  }
  if (!newLeads.value.alamat.trim()) {
    return notificationStore.showError("Address tidak boleh kosong");
  }

  isSaving.value = true;
  try {
    newLeads.value.createdAt = moment().unix();
    const saved = await leadsStore.addLeadsAct(newLeads.value);
    if (saved) data.dialogLeads = false;
  } finally {
    isSaving.value = false;
  }
}

async function hapusLeads(id?: string) {
  if (!id) return notificationStore.showError("ID leads tidak ditemukan");

  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus Leads",
    "Anda yakin ingin menghapus leads ini? Tindakan ini tidak dapat dipulihkan.",
    { variant: "danger" },
  );
  if (!confirmed) return notificationStore.showInfo("Penghapusan dibatalkan");

  deletingLeadId.value = id;
  try {
    await leadsStore.deleteLeadsAct(id);
  } finally {
    deletingLeadId.value = "";
  }
}
</script>

<template>
  <div class="leads-page">
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

    <header class="leads-hero">
      <div class="leads-hero-copy">
        <span class="leads-eyebrow">Master Data</span>
        <h1>Leads Website</h1>
        <p>
          Kelola prospek dan inquiry yang masuk melalui
          <a
            href="https://www.dutarayamarine.com"
            target="_blank"
            rel="noopener noreferrer"
            class="website-link"
          >
            www.dutarayamarine.com
            <v-icon icon="mdi-open-in-new" size="11" />
          </a>
        </p>
      </div>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        class="text-none add-leads-button"
        @click="openDialogAddLeads"
      >
        Tambah Leads
      </v-btn>
    </header>

    <!-- <section class="leads-summary" aria-label="Ringkasan leads website">
      <article class="summary-card summary-card--primary">
        <span class="summary-icon"><v-icon icon="mdi-account-star-outline" size="20" /></span>
        <div><small>Total Leads</small><strong>{{ leads.length }}</strong><span>Prospek dari website</span></div>
      </article>
      <article class="summary-card">
        <span class="summary-icon summary-icon--green"><v-icon icon="mdi-message-text-outline" size="20" /></span>
        <div><small>Inquiry Tercatat</small><strong>{{ inquiryCount }}</strong><span>Permintaan yang dapat ditindaklanjuti</span></div>
      </article>
      <article class="summary-card">
        <span class="summary-icon summary-icon--violet"><v-icon icon="mdi-ferry" size="20" /></span>
        <div><small>Vessel Tercatat</small><strong>{{ vesselCount }}</strong><span>Prospek dengan informasi vessel</span></div>
      </article>
    </section> -->

    <section class="leads-directory">
      <header class="directory-header">
        <div>
          <span class="section-kicker">Website Leads Directory</span>
          <div class="directory-title-row"><h2>Daftar Leads</h2><span>{{ filteredLeads.length }} data</span></div>
        </div>
        <label class="leads-search">
          <v-icon icon="mdi-magnify" size="18" />
          <input v-model="data.searchLeads" type="search" placeholder="Cari company, PIC, vessel, inquiry, atau alamat..." />
          <button v-if="data.searchLeads" type="button" aria-label="Hapus pencarian" @click="data.searchLeads = ''">
            <v-icon icon="mdi-close" size="16" />
          </button>
        </label>
      </header>

      <div class="leads-table-wrap">
        <v-data-table
          :headers="leadsHeaders"
          :items="filteredLeads"
          :loading="isLoading"
          :items-per-page="-1"
          density="comfortable"
          item-value="id_leads"
          class="leads-table"
          hide-default-footer
          hover
        >
          <template #item.no="{ index }"><span class="row-number">{{ index + 1 }}</span></template>
          <template #item.nama_perusahaan="{ item }">
            <div class="lead-identity">
              <span class="lead-avatar">{{ leadInitial(item.nama_perusahaan) }}</span>
              <div><strong>{{ item.nama_perusahaan || "—" }}</strong><small>Masuk {{ formatCreatedAt(item.createdAt) }}</small></div>
            </div>
          </template>
          <template #item.pic="{ item }">
            <div class="icon-cell"><v-icon icon="mdi-account-outline" size="15" /><span>{{ item.pic || "—" }}</span></div>
          </template>
          <template #item.vessel="{ item }">
            <div class="icon-cell"><v-icon icon="mdi-ferry" size="15" /><span>{{ item.vessel || "—" }}</span></div>
          </template>
          <template #item.inquiry="{ item }"><p class="multiline-cell inquiry-cell">{{ item.inquiry || "—" }}</p></template>
          <template #item.alamat="{ item }"><p class="multiline-cell">{{ item.alamat || "—" }}</p></template>
          <template #item.aksi="{ item }">
            <div class="table-actions">
              <button
                type="button"
                class="table-action-button table-action-button--delete"
                title="Hapus leads"
                aria-label="Hapus leads"
                :disabled="deletingLeadId === item.id_leads"
                @click="hapusLeads(item.id_leads)"
              >
                <v-progress-circular v-if="deletingLeadId === item.id_leads" indeterminate size="14" width="2" />
                <v-icon v-else icon="mdi-delete-outline" size="16" />
              </button>
            </div>
          </template>
          <template #no-data>
            <div class="empty-state">
              <span class="empty-icon"><v-icon icon="mdi-account-search-outline" size="30" /></span>
              <strong>{{ data.searchLeads ? "Leads tidak ditemukan" : "Belum ada leads" }}</strong>
              <p>{{ data.searchLeads ? "Coba gunakan kata kunci lain." : "Data leads dari website akan tampil di direktori ini." }}</p>
            </div>
          </template>
        </v-data-table>
      </div>

      <div class="leads-mobile-list">
        <div v-if="isLoading" class="mobile-loading">
          <v-skeleton-loader v-for="index in 3" :key="index" type="article" />
        </div>
        <div v-else-if="!filteredLeads.length" class="empty-state">
          <span class="empty-icon"><v-icon icon="mdi-account-search-outline" size="30" /></span>
          <strong>{{ data.searchLeads ? "Leads tidak ditemukan" : "Belum ada leads" }}</strong>
          <p>{{ data.searchLeads ? "Coba gunakan kata kunci lain." : "Data leads dari website akan tampil di direktori ini." }}</p>
        </div>
        <template v-else>
          <article v-for="lead in filteredLeads" :key="lead.id_leads" class="lead-mobile-card">
            <header>
              <span class="lead-avatar">{{ leadInitial(lead.nama_perusahaan) }}</span>
              <div class="mobile-identity"><strong>{{ lead.nama_perusahaan || "—" }}</strong><small>{{ lead.pic || "PIC belum dicatat" }}</small></div>
              <button
                type="button"
                class="mobile-delete"
                aria-label="Hapus leads"
                :disabled="deletingLeadId === lead.id_leads"
                @click="hapusLeads(lead.id_leads)"
              >
                <v-progress-circular v-if="deletingLeadId === lead.id_leads" indeterminate size="14" width="2" />
                <v-icon v-else icon="mdi-delete-outline" size="17" />
              </button>
            </header>
            <div class="mobile-lead-grid">
              <span><v-icon icon="mdi-ferry" size="14" />{{ lead.vessel || "—" }}</span>
              <span class="mobile-wide"><v-icon icon="mdi-message-text-outline" size="14" />{{ lead.inquiry || "—" }}</span>
              <span class="mobile-wide"><v-icon icon="mdi-map-marker-outline" size="14" />{{ lead.alamat || "—" }}</span>
            </div>
          </article>
        </template>
      </div>
    </section>

    <v-dialog
      v-model="data.dialogLeads"
      max-width="680"
      :fullscreen="$vuetify.display.smAndDown"
      :persistent="isSaving"
    >
      <form class="leads-dialog" @submit.prevent="simpanLeads">
        <header class="leads-dialog-header">
          <div class="dialog-heading">
            <span class="dialog-icon"><v-icon icon="mdi-account-plus-outline" size="20" /></span>
            <div><h2>Tambah Leads Website</h2><p>Lengkapi identitas prospek dan detail inquiry yang diterima.</p></div>
          </div>
          <button type="button" class="dialog-close" :disabled="isSaving" aria-label="Tutup dialog" @click="closeLeadsDialog">
            <v-icon icon="mdi-close" size="20" />
          </button>
        </header>

        <div class="leads-dialog-body">
          <section class="dialog-section">
            <div class="dialog-section-heading"><span>01</span><div><h3>Identitas Prospek</h3><p>Nama perusahaan, PIC, dan vessel yang berkaitan.</p></div></div>
            <div class="dialog-form-grid">
              <a-text-field-new v-model="newLeads.nama_perusahaan" label="Company" placeholder="Contoh: PT Samudra Indonesia" />
              <a-text-field-new v-model="newLeads.pic" label="PIC" placeholder="Nama penanggung jawab" />
              <a-text-field-new v-model="newLeads.vessel" label="Vessel" placeholder="Nama vessel" class="dialog-field-wide" />
            </div>
          </section>
          <section class="dialog-section">
            <div class="dialog-section-heading"><span>02</span><div><h3>Detail Inquiry</h3><p>Permintaan atau kebutuhan yang disampaikan prospek.</p></div></div>
            <a-textarea-new v-model="newLeads.inquiry" label="Inquiry" placeholder="Tuliskan detail inquiry" rows="3" />
          </section>
          <section class="dialog-section">
            <div class="dialog-section-heading"><span>03</span><div><h3>Alamat Prospek</h3><p>Alamat perusahaan atau lokasi operasional prospek.</p></div></div>
            <a-textarea-new v-model="newLeads.alamat" label="Address" placeholder="Tuliskan alamat lengkap" rows="2" />
          </section>
        </div>

        <footer class="leads-dialog-footer">
          <p>Pastikan informasi leads sudah benar sebelum disimpan.</p>
          <div>
            <v-btn variant="outlined" color="grey-darken-1" class="text-none dialog-cancel" :disabled="isSaving" @click="closeLeadsDialog">Batal</v-btn>
            <v-btn type="submit" color="primary" variant="flat" prepend-icon="mdi-content-save-outline" class="text-none dialog-save" :disabled="isSaving" :loading="isSaving">Simpan Leads</v-btn>
          </div>
        </footer>
      </form>
    </v-dialog>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }
.leads-page { width: 100%; max-width: 1500px; min-height: 100vh; margin: 0 auto; padding: 8px 14px 30px; color: #243447; }
.back-button { min-height: 32px; margin-bottom: 8px; padding-inline: 7px !important; font-size: 11px; font-weight: 650; letter-spacing: 0; }
.leads-hero, .leads-directory, .summary-card { background: #fff; border: 1px solid #e0e5ea; box-shadow: 0 6px 18px rgba(34, 51, 68, .035); }
.leads-hero { display: flex; min-height: 118px; padding: 20px 22px; align-items: center; justify-content: space-between; gap: 24px; border-radius: 8px; }
.leads-hero-copy { min-width: 0; }
.leads-eyebrow, .section-kicker { color: #587a9b; font-size: 8px; font-weight: 750; letter-spacing: .13em; text-transform: uppercase; }
.leads-hero h1 { margin: 4px 0; color: #1d2937; font-size: 25px; font-weight: 750; letter-spacing: -.025em; line-height: 1.15; }
.leads-hero p { max-width: 720px; margin: 0; color: #778493; font-size: 11px; line-height: 1.55; }
.website-link { display: inline-flex; align-items: center; gap: 3px; color: #315f8c; font-weight: 650; text-decoration: none; }
.website-link:hover { text-decoration: underline; }
.add-leads-button { flex: 0 0 auto; min-width: 142px; height: 36px !important; font-size: 10px !important; font-weight: 650 !important; letter-spacing: 0 !important; border-radius: 5px !important; }
.leads-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 10px; }
.summary-card { display: flex; min-height: 96px; padding: 15px 17px; align-items: center; gap: 13px; border-radius: 7px; }
.summary-card--primary { background: #f8fafc; border-color: #d9e2eb; }
.summary-icon { display: grid; flex: 0 0 38px; width: 38px; height: 38px; place-items: center; color: #315f8c; background: #eaf1f7; border-radius: 6px; }
.summary-icon--green { color: #2c7957; background: #e9f5ef; }
.summary-icon--violet { color: #6a5790; background: #f0edf7; }
.summary-card > div { display: flex; min-width: 0; flex-direction: column; }
.summary-card small { color: #737f8c; font-size: 8px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.summary-card strong { margin: 2px 0 1px; color: #253444; font-size: 20px; font-weight: 750; line-height: 1.1; }
.summary-card > div > span { color: #9099a3; font-size: 9px; }
.leads-directory { margin-top: 10px; overflow: hidden; border-radius: 8px; }
.directory-header { display: flex; min-height: 72px; padding: 13px 18px; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 1px solid #e5e9ed; }
.directory-title-row { display: flex; margin-top: 3px; align-items: center; gap: 8px; }
.directory-title-row h2 { margin: 0; color: #263442; font-size: 15px; font-weight: 720; letter-spacing: -.015em; }
.directory-title-row > span { padding: 2px 7px; color: #6f7e8d; font-size: 8px; font-weight: 650; background: #f0f3f6; border-radius: 10px; }
.leads-search { display: flex; width: min(440px, 48vw); height: 34px; padding: 0 9px; align-items: center; gap: 7px; color: #8793a0; background: #f8fafb; border: 1px solid #d7dee5; border-radius: 5px; }
.leads-search:focus-within { background: #fff; border-color: #7f9fbd; box-shadow: 0 0 0 2px rgba(49, 95, 140, .08); }
.leads-search input { min-width: 0; flex: 1; color: #354454; font: inherit; font-size: 10px; background: transparent; border: 0; outline: 0; }
.leads-search input::placeholder { color: #9aa4ae; }
.leads-search button { display: grid; width: 23px; height: 23px; padding: 0; place-items: center; color: #7f8994; background: transparent; border: 0; border-radius: 4px; cursor: pointer; }
.leads-search button:hover { background: #edf1f4; }
.leads-table-wrap { width: 100%; overflow-x: auto; }
.leads-table { width: 100%; min-width: 1046px; }
.leads-table :deep(.v-data-table__th) { height: 36px !important; padding: 0 11px !important; color: #687584 !important; font-size: 8px !important; font-weight: 750 !important; letter-spacing: .055em !important; text-transform: uppercase !important; background: #f5f7f9 !important; border-bottom-color: #dfe4e9 !important; }
.leads-table :deep(.v-data-table__td) { min-height: 58px !important; padding: 9px 11px !important; color: #4b5968; font-size: 10px; border-bottom-color: #e8ecef !important; }
.leads-table :deep(tbody tr:hover) { background: #fafcfd !important; }
.leads-table :deep(.v-data-table__th:last-child), .leads-table :deep(.v-data-table__td:last-child) { position: sticky; right: 0; z-index: 2; box-shadow: -8px 0 12px -12px rgba(35, 52, 68, .35); }
.leads-table :deep(.v-data-table__th:last-child) { z-index: 3; background: #f5f7f9 !important; }
.leads-table :deep(.v-data-table__td:last-child) { background: #fff !important; }
.leads-table :deep(tbody tr:hover .v-data-table__td:last-child) { background: #fafcfd !important; }
.row-number { display: block; color: #84909c; text-align: center; font-variant-numeric: tabular-nums; }
.lead-identity { display: flex; min-width: 0; align-items: center; gap: 9px; }
.lead-avatar { display: grid; flex: 0 0 34px; width: 34px; height: 34px; place-items: center; color: #315f8c; font-size: 10px; font-weight: 750; letter-spacing: .04em; background: #edf3f8; border: 1px solid #dbe6ef; border-radius: 6px; }
.lead-identity > div { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
.lead-identity strong { overflow: hidden; color: #2c3a49; font-size: 10px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.lead-identity small { color: #929ca6; font-size: 8px; }
.icon-cell { display: flex; min-width: 0; align-items: center; gap: 5px; color: #586676; }
.icon-cell .v-icon { flex: 0 0 auto; color: #85919d; }
.multiline-cell { display: -webkit-box; max-width: 330px; margin: 0; overflow: hidden; color: #697684; font-size: 9px; line-height: 1.45; overflow-wrap: anywhere; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.inquiry-cell { color: #536a7e; }
.table-actions { display: flex; min-width: 42px; align-items: center; justify-content: center; }
.table-action-button { display: grid; flex: 0 0 30px; width: 30px; height: 30px; padding: 0; place-items: center; background: #fff; border: 1px solid; border-radius: 5px; cursor: pointer; transition: background-color .15s ease, border-color .15s ease; }
.table-action-button--delete { color: #b44c58; border-color: #edd8dc; }
.table-action-button--delete:hover:not(:disabled) { background: #fcf0f2; border-color: #dfb9c0; }
.table-action-button:disabled { cursor: wait; opacity: .65; }
.leads-mobile-list { display: none; }
.empty-state { display: flex; min-height: 190px; padding: 30px; align-items: center; justify-content: center; flex-direction: column; color: #8e99a4; text-align: center; }
.empty-icon { display: grid; width: 52px; height: 52px; margin-bottom: 9px; place-items: center; color: #6d8193; background: #f1f4f6; border-radius: 8px; }
.empty-state strong { color: #566473; font-size: 11px; }
.empty-state p { margin: 4px 0 0; font-size: 9px; }
.leads-dialog { display: flex; width: 100%; max-height: calc(100vh - 40px); overflow: hidden; flex-direction: column; color: #263545; background: #f5f6f8; border: 1px solid #d9dee4; border-radius: 9px; box-shadow: 0 22px 60px rgba(20, 31, 43, .24); }
.leads-dialog-header { display: flex; min-height: 64px; padding: 11px 15px; align-items: center; justify-content: space-between; gap: 18px; background: #fff; border-bottom: 1px solid #dfe4e8; }
.dialog-heading { display: flex; min-width: 0; align-items: center; gap: 10px; }
.dialog-icon { display: grid; flex: 0 0 36px; width: 36px; height: 36px; place-items: center; color: #315f8c; background: #edf3f8; border: 1px solid #dbe6ef; border-radius: 6px; }
.dialog-heading h2 { margin: 0; color: #202c38; font-size: 14px; font-weight: 730; }
.dialog-heading p { margin: 2px 0 0; color: #818c97; font-size: 9px; }
.dialog-close { display: grid; flex: 0 0 30px; width: 30px; height: 30px; padding: 0; place-items: center; color: #75818d; background: transparent; border: 0; border-radius: 5px; cursor: pointer; }
.dialog-close:hover:not(:disabled) { background: #f0f3f5; }
.leads-dialog-body { display: flex; min-height: 0; padding: 10px; overflow-y: auto; flex-direction: column; gap: 8px; }
.dialog-section { padding: 12px; background: #fff; border: 1px solid #dfe4e8; border-radius: 6px; }
.dialog-section-heading { display: flex; margin-bottom: 10px; align-items: flex-start; gap: 8px; }
.dialog-section-heading > span { display: grid; flex: 0 0 22px; width: 22px; height: 21px; place-items: center; color: #607080; font-size: 8px; font-weight: 700; background: #f0f3f5; border: 1px solid #e0e5e9; border-radius: 4px; }
.dialog-section-heading h3 { margin: 0; color: #33404e; font-size: 11px; line-height: 1.25; }
.dialog-section-heading p { margin: 2px 0 0; color: #8b959f; font-size: 8px; }
.dialog-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
.dialog-field-wide { grid-column: 1 / -1; }
.leads-dialog :deep(.input-field) { border-radius: 4px; }
.leads-dialog-footer { display: flex; flex: 0 0 auto; min-height: 56px; padding: 9px 14px; align-items: center; justify-content: space-between; gap: 16px; background: #fff; border-top: 1px solid #dfe4e8; }
.leads-dialog-footer p { margin: 0; color: #7d8893; font-size: 9px; }
.leads-dialog-footer > div { display: flex; gap: 7px; }
.dialog-cancel, .dialog-save { min-width: 96px; height: 32px !important; font-size: 10px !important; font-weight: 650 !important; letter-spacing: 0 !important; border-radius: 4px !important; }
.dialog-save { min-width: 135px; }

@media (max-width: 900px) {
  .summary-card { padding: 13px; }
  .summary-icon { display: none; }
}

@media (max-width: 767px) {
  .leads-page { padding: 6px 8px 22px; }
  .leads-hero { min-height: 0; padding: 17px; align-items: stretch; flex-direction: column; gap: 14px; }
  .leads-hero h1 { font-size: 22px; }
  .add-leads-button { width: 100%; }
  .leads-summary { grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 7px; }
  .summary-card { min-height: 86px; padding: 12px; }
  .summary-card:last-child { grid-column: 1 / -1; }
  .summary-card strong { font-size: 18px; }
  .leads-directory { margin-top: 7px; }
  .directory-header { padding: 13px; align-items: stretch; flex-direction: column; gap: 11px; }
  .leads-search { width: 100%; }
  .leads-table-wrap { display: none; }
  .leads-mobile-list { display: block; padding: 9px; background: #f7f9fa; }
  .mobile-loading { display: grid; gap: 8px; }
  .lead-mobile-card { padding: 11px; background: #fff; border: 1px solid #dfe5ea; border-radius: 6px; }
  .lead-mobile-card + .lead-mobile-card { margin-top: 8px; }
  .lead-mobile-card > header { display: flex; align-items: center; gap: 8px; }
  .mobile-identity { display: flex; min-width: 0; flex: 1; flex-direction: column; }
  .mobile-identity strong { overflow: hidden; color: #314050; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
  .mobile-identity small { margin-top: 2px; color: #8a959f; font-size: 8px; }
  .mobile-delete { display: grid; flex: 0 0 29px; width: 29px; height: 29px; padding: 0; place-items: center; color: #ad4d58; background: #fcf2f3; border: 1px solid #efd8dc; border-radius: 4px; }
  .mobile-delete:disabled { opacity: .65; }
  .mobile-lead-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; margin-top: 10px; padding-top: 9px; color: #6d7a88; font-size: 8px; border-top: 1px solid #edf0f2; }
  .mobile-lead-grid span { display: flex; min-width: 0; align-items: flex-start; gap: 5px; overflow-wrap: anywhere; }
  .mobile-wide { grid-column: 1 / -1; }
  .leads-dialog { height: 100%; max-height: 100%; border: 0; border-radius: 0; }
  .leads-dialog-header { min-height: 62px; padding: 10px 12px; }
  .dialog-heading p { display: none; }
  .leads-dialog-body { padding: 9px; }
  .dialog-section { padding: 11px; }
  .dialog-form-grid { grid-template-columns: 1fr; }
  .dialog-field-wide { grid-column: auto; }
  .leads-dialog-footer { padding: 9px 10px; }
  .leads-dialog-footer p { display: none; }
  .leads-dialog-footer > div { display: grid; width: 100%; grid-template-columns: 1fr 1.35fr; }
  .dialog-cancel, .dialog-save { width: 100%; min-width: 0; }
}

@media (max-width: 420px) {
  .leads-summary { grid-template-columns: 1fr; }
  .summary-card:last-child { grid-column: auto; }
  .summary-card { min-height: 76px; }
  .mobile-lead-grid { grid-template-columns: 1fr; }
  .mobile-wide { grid-column: auto; }
}
</style>
