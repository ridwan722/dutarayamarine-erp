<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import moment from "moment";
import type { ConfirmationDialog } from "#components";
import type { vendorM } from "~/types/vendorModel";

definePageMeta({ layout: "admin" });

const vendorStore = usevendorStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);

const isLoading = ref(true);
const isSaving = ref(false);

const data = reactive({
  searchVendor: "",
  dialogVendor: false,
  vendorAddEdit: "add" as "add" | "edit",
});

const vendorHeaders = [
  { title: "No.", value: "no", sortable: false, width: "54px" },
  { title: "Vendor", value: "nama_vendor", sortable: true, width: "270px" },
  { title: "PIC", value: "pic_vendor", sortable: true, width: "180px" },
  { title: "Kontak", value: "kontak", sortable: false, width: "250px" },
  { title: "Alamat", value: "alamat_vendor", sortable: true },
  {
    title: "Aksi",
    value: "aksi",
    sortable: false,
    align: "center" as const,
    width: "100px",
  },
];

function emptyVendor(): vendorM {
  return {
    nama_vendor: "",
    pic_vendor: "",
    no_telp_vendor: "",
    alamat_vendor: "",
    email_vendor: "",
    createdAt: 0,
    createdBy: "",
  };
}

const newVendor = ref<vendorM>(emptyVendor());
const vendors = computed(() => vendorStore.getDataVendor);
const completeContactCount = computed(
  () =>
    vendors.value.filter(
      (vendor) => vendor.no_telp_vendor?.trim() && vendor.email_vendor?.trim(),
    ).length,
);
const vendorWithPicCount = computed(
  () => vendors.value.filter((vendor) => vendor.pic_vendor?.trim()).length,
);
const filteredVendors = computed(() => {
  const query = data.searchVendor.trim().toLocaleLowerCase("id-ID");
  return [...vendors.value]
    .filter((vendor) => {
      if (!query) return true;
      return [
        vendor.nama_vendor,
        vendor.pic_vendor,
        vendor.no_telp_vendor,
        vendor.email_vendor,
        vendor.alamat_vendor,
      ].some((value) =>
        String(value || "")
          .toLocaleLowerCase("id-ID")
          .includes(query),
      );
    })
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
});

onMounted(async () => {
  try {
    isLoading.value = true;
    await vendorStore.tarikDataVendorAct();
  } finally {
    isLoading.value = false;
  }
});

function vendorInitial(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "V";
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

function formatCreatedAt(timestamp: number) {
  return timestamp ? moment.unix(timestamp).format("DD MMM YYYY") : "—";
}

function openDialogAddVendor() {
  data.vendorAddEdit = "add";
  newVendor.value = emptyVendor();
  data.dialogVendor = true;
}

function openDialogEditVendor(item: vendorM) {
  data.vendorAddEdit = "edit";
  newVendor.value = { ...item };
  data.dialogVendor = true;
}

function closeVendorDialog() {
  if (isSaving.value) return;
  data.dialogVendor = false;
}

async function simpanVendor() {
  if (isSaving.value) return;
  if (!newVendor.value.nama_vendor) {
    return notificationStore.showError("Nama Vendor tidak boleh kosong");
  }
  if (!newVendor.value.alamat_vendor) {
    return notificationStore.showError("Address tidak boleh kosong");
  }
  if (!newVendor.value.pic_vendor) {
    return notificationStore.showError("PIC tidak boleh kosong");
  }
  if (!newVendor.value.no_telp_vendor) {
    return notificationStore.showError("Phone Number tidak boleh kosong");
  }
  if (!newVendor.value.email_vendor) {
    return notificationStore.showError("Email tidak boleh kosong");
  }

  isSaving.value = true;
  try {
    if (data.vendorAddEdit === "add") {
      newVendor.value.createdAt = moment().unix();
      newVendor.value.createdBy = userStore.getEmail;
      await vendorStore.addVendorAct(newVendor.value);
    } else {
      newVendor.value.updatedAt = moment().unix();
      newVendor.value.updatedBy = userStore.getEmail;
      await vendorStore.updateVendorAct(newVendor.value);
    }
    data.dialogVendor = false;
  } finally {
    isSaving.value = false;
  }
}

async function hapusVendor(id: string) {
  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus Vendor",
    "Anda yakin ingin menghapus Vendor ini? Tindakan ini tidak dapat dipulihkan",
    { variant: "danger" },
  );
  if (!confirmed) return notificationStore.showInfo("Penghapusan dibatalkan");
  await vendorStore.deleteVendorAct(id);
}
</script>

<template>
  <div class="vendor-page">
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

    <header class="vendor-hero">
      <div class="vendor-hero-copy">
        <span class="vendor-eyebrow">Master Data</span>
        <h1>Vendor</h1>
        <p>
          Kelola data perusahaan, PIC, dan informasi kontak seluruh mitra
          pengadaan dalam satu direktori.
        </p>
      </div>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        class="text-none add-vendor-button"
        @click="openDialogAddVendor"
      >
        Tambah Vendor
      </v-btn>
    </header>

    <section class="vendor-summary" aria-label="Ringkasan vendor">
      <article class="summary-card summary-card--primary">
        <span class="summary-icon">
          <v-icon icon="mdi-storefront-outline" size="20" />
        </span>
        <div>
          <small>Total Vendor</small>
          <strong>{{ vendors.length }}</strong>
          <span>Mitra terdaftar</span>
        </div>
      </article>
      <article class="summary-card">
        <span class="summary-icon summary-icon--green">
          <v-icon icon="mdi-card-account-phone-outline" size="20" />
        </span>
        <div>
          <small>Kontak Lengkap</small>
          <strong>{{ completeContactCount }}</strong>
          <span>Telepon dan email tersedia</span>
        </div>
      </article>
      <article class="summary-card">
        <span class="summary-icon summary-icon--violet">
          <v-icon icon="mdi-account-tie-outline" size="20" />
        </span>
        <div>
          <small>PIC Tercatat</small>
          <strong>{{ vendorWithPicCount }}</strong>
          <span>Kontak penanggung jawab</span>
        </div>
      </article>
    </section>

    <section class="vendor-directory">
      <header class="directory-header">
        <div>
          <span class="section-kicker">Vendor Directory</span>
          <div class="directory-title-row">
            <h2>Daftar Vendor</h2>
            <span>{{ filteredVendors.length }} data</span>
          </div>
        </div>
        <label class="vendor-search">
          <v-icon icon="mdi-magnify" size="18" />
          <input
            v-model="data.searchVendor"
            type="search"
            placeholder="Cari vendor, PIC, kontak, atau alamat..."
          />
          <button
            v-if="data.searchVendor"
            type="button"
            aria-label="Hapus pencarian"
            @click="data.searchVendor = ''"
          >
            <v-icon icon="mdi-close" size="16" />
          </button>
        </label>
      </header>

      <div class="vendor-table-wrap">
        <v-data-table
          :headers="vendorHeaders"
          :items="filteredVendors"
          :loading="isLoading"
          :items-per-page="10"
          density="comfortable"
          item-value="id_vendor"
          class="vendor-table"
          hover
        >
          <template #item.no="{ index }">
            <span class="row-number">{{ index + 1 }}</span>
          </template>

          <template #item.nama_vendor="{ item }">
            <div class="vendor-identity">
              <span class="vendor-avatar">{{ vendorInitial(item.nama_vendor) }}</span>
              <div>
                <strong>{{ item.nama_vendor }}</strong>
                <small>Ditambahkan {{ formatCreatedAt(item.createdAt) }}</small>
              </div>
            </div>
          </template>

          <template #item.pic_vendor="{ item }">
            <div class="pic-cell">
              <v-icon icon="mdi-account-outline" size="15" />
              <span>{{ item.pic_vendor || "—" }}</span>
            </div>
          </template>

          <template #item.kontak="{ item }">
            <div class="contact-cell">
              <a
                v-if="item.no_telp_vendor"
                :href="`tel:${item.no_telp_vendor}`"
              >
                <v-icon icon="mdi-phone-outline" size="14" />
                {{ item.no_telp_vendor }}
              </a>
              <span v-else>—</span>
              <a
                v-if="item.email_vendor"
                :href="`mailto:${item.email_vendor}`"
              >
                <v-icon icon="mdi-email-outline" size="14" />
                {{ item.email_vendor }}
              </a>
            </div>
          </template>

          <template #item.alamat_vendor="{ item }">
            <p class="address-cell">{{ item.alamat_vendor || "—" }}</p>
          </template>

          <template #item.aksi="{ item }">
            <div class="table-actions">
              <v-btn
                icon="mdi-pencil-outline"
                variant="text"
                color="primary"
                size="small"
                aria-label="Edit vendor"
                @click="openDialogEditVendor(item)"
              >
                <v-tooltip activator="parent" location="top">Edit</v-tooltip>
              </v-btn>
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                color="error"
                size="small"
                aria-label="Hapus vendor"
                @click="hapusVendor(item.id_vendor!)"
              >
                <v-tooltip activator="parent" location="top">Hapus</v-tooltip>
              </v-btn>
            </div>
          </template>

          <template #no-data>
            <div class="empty-state">
              <span class="empty-icon">
                <v-icon icon="mdi-store-search-outline" size="30" />
              </span>
              <strong>
                {{ data.searchVendor ? "Vendor tidak ditemukan" : "Belum ada vendor" }}
              </strong>
              <p>
                {{
                  data.searchVendor
                    ? "Coba gunakan kata kunci lain."
                    : "Tambahkan vendor pertama untuk mulai membangun direktori."
                }}
              </p>
            </div>
          </template>
        </v-data-table>
      </div>

      <div class="vendor-mobile-list">
        <div v-if="isLoading" class="mobile-loading">
          <v-skeleton-loader v-for="index in 3" :key="index" type="article" />
        </div>
        <div v-else-if="!filteredVendors.length" class="empty-state">
          <span class="empty-icon">
            <v-icon icon="mdi-store-search-outline" size="30" />
          </span>
          <strong>
            {{ data.searchVendor ? "Vendor tidak ditemukan" : "Belum ada vendor" }}
          </strong>
          <p>
            {{
              data.searchVendor
                ? "Coba gunakan kata kunci lain."
                : "Tambahkan vendor pertama untuk mulai membangun direktori."
            }}
          </p>
        </div>
        <template v-else>
          <article
            v-for="vendor in filteredVendors"
            :key="vendor.id_vendor"
            class="vendor-mobile-card"
          >
            <header>
              <span class="vendor-avatar">{{ vendorInitial(vendor.nama_vendor) }}</span>
              <div>
                <strong>{{ vendor.nama_vendor }}</strong>
                <small>{{ vendor.pic_vendor || "PIC belum dicatat" }}</small>
              </div>
              <div class="mobile-actions">
                <button type="button" aria-label="Edit vendor" @click="openDialogEditVendor(vendor)">
                  <v-icon icon="mdi-pencil-outline" size="17" />
                </button>
                <button
                  type="button"
                  class="delete-action"
                  aria-label="Hapus vendor"
                  @click="hapusVendor(vendor.id_vendor!)"
                >
                  <v-icon icon="mdi-delete-outline" size="17" />
                </button>
              </div>
            </header>
            <div class="mobile-contact-grid">
              <span><v-icon icon="mdi-phone-outline" size="14" />{{ vendor.no_telp_vendor || "—" }}</span>
              <span><v-icon icon="mdi-email-outline" size="14" />{{ vendor.email_vendor || "—" }}</span>
              <span class="mobile-address"><v-icon icon="mdi-map-marker-outline" size="14" />{{ vendor.alamat_vendor || "—" }}</span>
            </div>
          </article>
        </template>
      </div>
    </section>

    <v-dialog
      v-model="data.dialogVendor"
      max-width="680"
      :fullscreen="$vuetify.display.smAndDown"
      :persistent="isSaving"
    >
      <form class="vendor-dialog" @submit.prevent="simpanVendor">
        <header class="vendor-dialog-header">
          <div class="dialog-heading">
            <span class="dialog-icon">
              <v-icon icon="mdi-storefront-plus-outline" size="20" />
            </span>
            <div>
              <h2>{{ data.vendorAddEdit === "add" ? "Tambah Vendor" : "Edit Vendor" }}</h2>
              <p>Lengkapi identitas dan informasi kontak vendor.</p>
            </div>
          </div>
          <button
            type="button"
            class="dialog-close"
            :disabled="isSaving"
            aria-label="Tutup dialog"
            @click="closeVendorDialog"
          >
            <v-icon icon="mdi-close" size="20" />
          </button>
        </header>

        <div class="vendor-dialog-body">
          <section class="dialog-section">
            <div class="dialog-section-heading">
              <span>01</span>
              <div>
                <h3>Identitas Vendor</h3>
                <p>Nama perusahaan dan penanggung jawab utama.</p>
              </div>
            </div>
            <div class="dialog-form-grid">
              <a-text-field-new
                v-model="newVendor.nama_vendor"
                label="Nama Vendor"
                placeholder="Contoh: PT Samudra Teknik"
              />
              <a-text-field-new
                v-model="newVendor.pic_vendor"
                label="PIC"
                placeholder="Nama penanggung jawab"
              />
            </div>
          </section>

          <section class="dialog-section">
            <div class="dialog-section-heading">
              <span>02</span>
              <div>
                <h3>Informasi Kontak</h3>
                <p>Nomor telepon dan email yang dapat dihubungi.</p>
              </div>
            </div>
            <div class="dialog-form-grid">
              <a-text-field-new
                v-model="newVendor.no_telp_vendor"
                label="Nomor Telepon"
                placeholder="Contoh: +62 812 3456 7890"
              />
              <a-text-field-new
                v-model="newVendor.email_vendor"
                label="Email"
                placeholder="vendor@perusahaan.com"
              />
            </div>
          </section>

          <section class="dialog-section">
            <div class="dialog-section-heading">
              <span>03</span>
              <div>
                <h3>Alamat Vendor</h3>
                <p>Alamat lengkap kantor atau lokasi operasional.</p>
              </div>
            </div>
            <a-textarea-new
              v-model="newVendor.alamat_vendor"
              label="Alamat"
              placeholder="Tuliskan alamat lengkap vendor"
              rows="2"
            />
          </section>
        </div>

        <footer class="vendor-dialog-footer">
          <p>Pastikan informasi vendor sudah benar sebelum disimpan.</p>
          <div>
            <v-btn
              variant="outlined"
              color="grey-darken-1"
              class="text-none dialog-cancel"
              :disabled="isSaving"
              @click="closeVendorDialog"
            >
              Batal
            </v-btn>
            <v-btn
              type="submit"
              color="primary"
              variant="flat"
              prepend-icon="mdi-content-save-outline"
              class="text-none dialog-save"
              :disabled="isSaving"
            >
              {{ data.vendorAddEdit === "add" ? "Simpan Vendor" : "Simpan Perubahan" }}
            </v-btn>
          </div>
        </footer>
      </form>
    </v-dialog>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }

.vendor-page {
  width: 100%;
  max-width: 1500px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 8px 14px 30px;
  color: #243447;
}

.back-button {
  min-height: 32px;
  margin-bottom: 8px;
  padding-inline: 7px !important;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0;
}

.vendor-hero,
.vendor-directory,
.summary-card {
  background: #ffffff;
  border: 1px solid #e0e5ea;
  box-shadow: 0 6px 18px rgba(34, 51, 68, 0.035);
}

.vendor-hero {
  display: flex;
  min-height: 118px;
  padding: 20px 22px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border-radius: 8px;
}

.vendor-hero-copy { min-width: 0; }
.vendor-eyebrow,
.section-kicker {
  color: #587a9b;
  font-size: 8px;
  font-weight: 750;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.vendor-hero h1 {
  margin: 4px 0 4px;
  color: #1d2937;
  font-size: 25px;
  font-weight: 750;
  letter-spacing: -0.025em;
  line-height: 1.15;
}

.vendor-hero p {
  max-width: 660px;
  margin: 0;
  color: #778493;
  font-size: 11px;
  line-height: 1.55;
}

.add-vendor-button {
  flex: 0 0 auto;
  min-width: 142px;
  height: 36px !important;
  font-size: 10px !important;
  font-weight: 650 !important;
  letter-spacing: 0 !important;
  border-radius: 5px !important;
}

.vendor-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.summary-card {
  display: flex;
  min-height: 96px;
  padding: 15px 17px;
  align-items: center;
  gap: 13px;
  border-radius: 7px;
}

.summary-card--primary { background: #f8fafc; border-color: #d9e2eb; }
.summary-icon {
  display: grid;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  place-items: center;
  color: #315f8c;
  background: #eaf1f7;
  border-radius: 6px;
}
.summary-icon--green { color: #2c7957; background: #e9f5ef; }
.summary-icon--violet { color: #6a5790; background: #f0edf7; }
.summary-card > div { display: flex; min-width: 0; flex-direction: column; }
.summary-card small {
  color: #737f8c;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.summary-card strong {
  margin: 2px 0 1px;
  color: #253444;
  font-size: 20px;
  font-weight: 750;
  line-height: 1.1;
}
.summary-card > div > span { color: #9099a3; font-size: 9px; }

.vendor-directory {
  margin-top: 10px;
  overflow: hidden;
  border-radius: 8px;
}

.directory-header {
  display: flex;
  min-height: 72px;
  padding: 13px 18px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-bottom: 1px solid #e5e9ed;
}

.directory-title-row { display: flex; margin-top: 3px; align-items: center; gap: 8px; }
.directory-title-row h2 {
  margin: 0;
  color: #263442;
  font-size: 15px;
  font-weight: 720;
  letter-spacing: -0.015em;
}
.directory-title-row > span {
  padding: 2px 7px;
  color: #6f7e8d;
  font-size: 8px;
  font-weight: 650;
  background: #f0f3f6;
  border-radius: 10px;
}

.vendor-search {
  display: flex;
  width: min(390px, 45vw);
  height: 34px;
  padding: 0 9px;
  align-items: center;
  gap: 7px;
  color: #8793a0;
  background: #f8fafb;
  border: 1px solid #d7dee5;
  border-radius: 5px;
}
.vendor-search:focus-within {
  background: #ffffff;
  border-color: #7f9fbd;
  box-shadow: 0 0 0 2px rgba(49, 95, 140, 0.08);
}
.vendor-search input {
  min-width: 0;
  flex: 1;
  color: #354454;
  font: inherit;
  font-size: 10px;
  background: transparent;
  border: 0;
  outline: 0;
}
.vendor-search input::placeholder { color: #9aa4ae; }
.vendor-search button {
  display: grid;
  width: 23px;
  height: 23px;
  padding: 0;
  place-items: center;
  color: #7f8994;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}
.vendor-search button:hover { background: #edf1f4; }

.vendor-table-wrap { overflow-x: auto; }
.vendor-table { min-width: 1000px; }
.vendor-table :deep(.v-data-table__th) {
  height: 36px !important;
  padding: 0 11px !important;
  color: #687584 !important;
  font-size: 8px !important;
  font-weight: 750 !important;
  letter-spacing: 0.055em !important;
  text-transform: uppercase !important;
  background: #f5f7f9 !important;
  border-bottom-color: #dfe4e9 !important;
}
.vendor-table :deep(.v-data-table__td) {
  min-height: 58px !important;
  padding: 9px 11px !important;
  color: #4b5968;
  font-size: 10px;
  border-bottom-color: #e8ecef !important;
}
.vendor-table :deep(tbody tr:hover) { background: #fafcfd !important; }
.vendor-table :deep(.v-data-table-footer) {
  min-height: 50px;
  color: #75818d;
  font-size: 10px;
  border-top: 1px solid #e8ecef;
}

.row-number { display: block; color: #84909c; text-align: center; font-variant-numeric: tabular-nums; }
.vendor-identity { display: flex; min-width: 0; align-items: center; gap: 9px; }
.vendor-avatar {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #315f8c;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.04em;
  background: #edf3f8;
  border: 1px solid #dbe6ef;
  border-radius: 6px;
}
.vendor-identity > div { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
.vendor-identity strong {
  overflow: hidden;
  color: #2c3a49;
  font-size: 10px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vendor-identity small { color: #929ca6; font-size: 8px; }

.pic-cell { display: flex; align-items: center; gap: 5px; color: #586676; }
.pic-cell .v-icon { color: #85919d; }
.contact-cell { display: flex; min-width: 0; flex-direction: column; gap: 4px; }
.contact-cell a,
.contact-cell > span {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
  color: #526f88;
  font-size: 9px;
  text-decoration: none;
}
.contact-cell a:hover { color: #245f92; text-decoration: underline; }
.contact-cell a:last-child {
  overflow: hidden;
  color: #778492;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.address-cell {
  display: -webkit-box;
  max-width: 420px;
  margin: 0;
  overflow: hidden;
  color: #697684;
  font-size: 9px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.table-actions { display: flex; align-items: center; justify-content: center; gap: 1px; }
.vendor-mobile-list { display: none; }

.empty-state {
  display: flex;
  min-height: 190px;
  padding: 30px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: #8e99a4;
  text-align: center;
}
.empty-icon {
  display: grid;
  width: 52px;
  height: 52px;
  margin-bottom: 9px;
  place-items: center;
  color: #6d8193;
  background: #f1f4f6;
  border-radius: 8px;
}
.empty-state strong { color: #566473; font-size: 11px; }
.empty-state p { margin: 4px 0 0; font-size: 9px; }

.vendor-dialog {
  display: flex;
  width: 100%;
  max-height: calc(100vh - 40px);
  overflow: hidden;
  flex-direction: column;
  color: #263545;
  background: #f5f6f8;
  border: 1px solid #d9dee4;
  border-radius: 9px;
  box-shadow: 0 22px 60px rgba(20, 31, 43, 0.24);
}
.vendor-dialog-header {
  display: flex;
  min-height: 64px;
  padding: 11px 15px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background: #ffffff;
  border-bottom: 1px solid #dfe4e8;
}
.dialog-heading { display: flex; min-width: 0; align-items: center; gap: 10px; }
.dialog-icon {
  display: grid;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  place-items: center;
  color: #315f8c;
  background: #edf3f8;
  border: 1px solid #dbe6ef;
  border-radius: 6px;
}
.dialog-heading h2 { margin: 0; color: #202c38; font-size: 14px; font-weight: 730; }
.dialog-heading p { margin: 2px 0 0; color: #818c97; font-size: 9px; }
.dialog-close {
  display: grid;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  padding: 0;
  place-items: center;
  color: #75818d;
  background: transparent;
  border: 0;
  border-radius: 5px;
  cursor: pointer;
}
.dialog-close:hover:not(:disabled) { background: #f0f3f5; }

.vendor-dialog-body {
  display: flex;
  min-height: 0;
  padding: 10px;
  overflow-y: auto;
  flex-direction: column;
  gap: 8px;
}
.dialog-section {
  padding: 12px;
  background: #ffffff;
  border: 1px solid #dfe4e8;
  border-radius: 6px;
}
.dialog-section-heading { display: flex; margin-bottom: 10px; align-items: flex-start; gap: 8px; }
.dialog-section-heading > span {
  display: grid;
  flex: 0 0 22px;
  width: 22px;
  height: 21px;
  place-items: center;
  color: #607080;
  font-size: 8px;
  font-weight: 700;
  background: #f0f3f5;
  border: 1px solid #e0e5e9;
  border-radius: 4px;
}
.dialog-section-heading h3 { margin: 0; color: #33404e; font-size: 11px; line-height: 1.25; }
.dialog-section-heading p { margin: 2px 0 0; color: #8b959f; font-size: 8px; }
.dialog-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
.vendor-dialog :deep(.input-field) { border-radius: 4px; }

.vendor-dialog-footer {
  display: flex;
  flex: 0 0 auto;
  min-height: 56px;
  padding: 9px 14px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #ffffff;
  border-top: 1px solid #dfe4e8;
}
.vendor-dialog-footer p { margin: 0; color: #7d8893; font-size: 9px; }
.vendor-dialog-footer > div { display: flex; gap: 7px; }
.dialog-cancel,
.dialog-save {
  min-width: 96px;
  height: 32px !important;
  font-size: 10px !important;
  font-weight: 650 !important;
  letter-spacing: 0 !important;
  border-radius: 4px !important;
}
.dialog-save { min-width: 145px; }

@media (max-width: 900px) {
  .vendor-summary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .summary-card { padding: 13px; }
  .summary-icon { display: none; }
}

@media (max-width: 767px) {
  .vendor-page { padding: 6px 8px 22px; }
  .vendor-hero { min-height: 0; padding: 17px; align-items: stretch; flex-direction: column; gap: 14px; }
  .vendor-hero h1 { font-size: 22px; }
  .add-vendor-button { width: 100%; }
  .vendor-summary { grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 7px; }
  .summary-card { min-height: 86px; padding: 12px; }
  .summary-card:last-child { grid-column: 1 / -1; }
  .summary-card strong { font-size: 18px; }
  .vendor-directory { margin-top: 7px; }
  .directory-header { padding: 13px; align-items: stretch; flex-direction: column; gap: 11px; }
  .vendor-search { width: 100%; }
  .vendor-table-wrap { display: none; }
  .vendor-mobile-list { display: block; padding: 9px; background: #f7f9fa; }
  .mobile-loading { display: grid; gap: 8px; }
  .vendor-mobile-card {
    padding: 11px;
    background: #ffffff;
    border: 1px solid #dfe5ea;
    border-radius: 6px;
  }
  .vendor-mobile-card + .vendor-mobile-card { margin-top: 8px; }
  .vendor-mobile-card > header { display: flex; align-items: center; gap: 8px; }
  .vendor-mobile-card > header > div:nth-child(2) { display: flex; min-width: 0; flex: 1; flex-direction: column; }
  .vendor-mobile-card > header strong { overflow: hidden; color: #314050; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
  .vendor-mobile-card > header small { margin-top: 2px; color: #8a959f; font-size: 8px; }
  .mobile-actions { display: flex; gap: 4px; }
  .mobile-actions button {
    display: grid;
    width: 29px;
    height: 29px;
    padding: 0;
    place-items: center;
    color: #416f98;
    background: #f1f6fa;
    border: 1px solid #dce6ee;
    border-radius: 4px;
  }
  .mobile-actions .delete-action { color: #ad4d58; background: #fcf2f3; border-color: #efd8dc; }
  .mobile-contact-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
    margin-top: 10px;
    padding-top: 9px;
    color: #6d7a88;
    font-size: 8px;
    border-top: 1px solid #edf0f2;
  }
  .mobile-contact-grid span { display: flex; min-width: 0; align-items: flex-start; gap: 5px; overflow-wrap: anywhere; }
  .mobile-address { grid-column: 1 / -1; }

  .vendor-dialog { height: 100%; max-height: 100%; border: 0; border-radius: 0; }
  .vendor-dialog-header { min-height: 62px; padding: 10px 12px; }
  .dialog-heading p { display: none; }
  .vendor-dialog-body { padding: 9px; }
  .dialog-section { padding: 11px; }
  .dialog-form-grid { grid-template-columns: 1fr; }
  .vendor-dialog-footer { padding: 9px 10px; }
  .vendor-dialog-footer p { display: none; }
  .vendor-dialog-footer > div { display: grid; width: 100%; grid-template-columns: 1fr 1.35fr; }
  .dialog-cancel,
  .dialog-save { width: 100%; min-width: 0; }
}

@media (max-width: 420px) {
  .vendor-summary { grid-template-columns: 1fr; }
  .summary-card:last-child { grid-column: auto; }
  .summary-card { min-height: 76px; }
  .mobile-contact-grid { grid-template-columns: 1fr; }
  .mobile-address { grid-column: auto; }
}
</style>
