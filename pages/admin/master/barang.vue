<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import moment from "moment";
import type { ConfirmationDialog } from "#components";
import type { barangM } from "~/types/barangModel";

definePageMeta({ layout: "admin" });

const barangStore = usebarangStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(null);
const isLoading = ref(true);
const isSaving = ref(false);
const deletingBarangId = ref("");

const data = reactive({
  searchBarang: "",
  dialogBarang: false,
  barangAddEdit: "add" as "add" | "edit",
});

const barangHeaders = [
  { title: "No.", value: "no", sortable: false, width: "54px" },
  { title: "Barang / Service", value: "nama_barang", sortable: true, width: "390px" },
  { title: "Harga HPP", value: "harga_hpp", sortable: true, width: "220px", align: "end" as const },
  { title: "Dibuat", value: "createdAt", sortable: true, width: "220px" },
  { title: "Aksi", value: "aksi", sortable: false, align: "center" as const, width: "96px" },
];

function emptyBarang(): barangM {
  return {
    nama_barang: "",
    harga_hpp: 0,
    createdAt: 0,
    createdBy: "",
  };
}

const newBarang = ref<barangM>(emptyBarang());
const barangList = computed(() => barangStore.getDataBarang);

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

const filteredBarang = computed(() => {
  const query = data.searchBarang.trim().toLocaleLowerCase("id-ID");

  return [...barangList.value]
    .filter((barang) => {
      if (!query) return true;
      return [barang.nama_barang, barang.createdBy, barang.harga_hpp].some(
        (value) =>
          String(value || "").toLocaleLowerCase("id-ID").includes(query),
      );
    })
    .sort(
      (a, b) =>
        createdAtSeconds(b.createdAt) - createdAtSeconds(a.createdAt),
    );
});

const averageHpp = computed(() => {
  if (!barangList.value.length) return 0;
  const total = barangList.value.reduce(
    (sum, barang) => sum + (Number(barang.harga_hpp) || 0),
    0,
  );
  return total / barangList.value.length;
});

const highestHpp = computed(() =>
  barangList.value.reduce(
    (highest, barang) => Math.max(highest, Number(barang.harga_hpp) || 0),
    0,
  ),
);

onMounted(async () => {
  try {
    isLoading.value = true;
    await barangStore.tarikDataBarangAct();
  } catch (error) {
    console.error("Gagal mengambil data barang:", error);
    notificationStore.showError("Gagal mengambil data barang");
  } finally {
    isLoading.value = false;
  }
});

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatCreatedAt(timestamp: unknown) {
  const seconds = createdAtSeconds(timestamp);
  return seconds ? moment.unix(seconds).format("DD MMM YYYY") : "—";
}

function openDialogAddBarang() {
  data.barangAddEdit = "add";
  newBarang.value = emptyBarang();
  data.dialogBarang = true;
}

function openDialogEditBarang(item: barangM) {
  data.barangAddEdit = "edit";
  newBarang.value = { ...item };
  data.dialogBarang = true;
}

function closeBarangDialog() {
  if (isSaving.value) return;
  data.dialogBarang = false;
}

async function simpanBarang() {
  if (isSaving.value) return;
  if (!newBarang.value.nama_barang.trim()) {
    return notificationStore.showError("Nama barang tidak boleh kosong");
  }
  if (
    !Number.isFinite(Number(newBarang.value.harga_hpp)) ||
    Number(newBarang.value.harga_hpp) <= 0
  ) {
    return notificationStore.showError("Harga HPP harus lebih besar dari 0");
  }

  isSaving.value = true;
  try {
    if (data.barangAddEdit === "add") {
      newBarang.value.createdAt = moment().unix();
      newBarang.value.createdBy = userStore.getEmail;
      await barangStore.addBarangAct(newBarang.value);
    } else {
      const updatedBarang = {
        ...newBarang.value,
        updatedAt: moment().unix(),
        updatedBy: userStore.getEmail,
      };
      await barangStore.updateBarangAct(updatedBarang);
    }
    data.dialogBarang = false;
  } finally {
    isSaving.value = false;
  }
}

async function hapusBarang(id?: string) {
  if (!id) return notificationStore.showError("ID barang tidak ditemukan");

  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus Barang",
    "Anda yakin ingin menghapus barang atau service ini? Tindakan ini tidak dapat dipulihkan.",
    { variant: "danger" },
  );
  if (!confirmed) return notificationStore.showInfo("Penghapusan dibatalkan");

  deletingBarangId.value = id;
  try {
    await barangStore.deleteBarangAct(id);
  } finally {
    deletingBarangId.value = "";
  }
}
</script>

<template>
  <div class="barang-page">
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

    <header class="barang-hero">
      <div class="barang-hero-copy">
        <span class="barang-eyebrow">Master Data</span>
        <h1>Barang &amp; Service</h1>
        <p>
          Kelola daftar barang, layanan, dan harga pokok yang digunakan saat
          menyusun penawaran untuk client.
        </p>
      </div>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        class="text-none add-barang-button"
        @click="openDialogAddBarang"
      >
        Tambah Barang
      </v-btn>
    </header>

    <section class="barang-summary" aria-label="Ringkasan barang dan service">
      <article class="summary-card summary-card--primary">
        <span class="summary-icon"><v-icon icon="mdi-package-variant-closed" size="20" /></span>
        <div><small>Total Item</small><strong>{{ barangList.length }}</strong><span>Barang dan service terdaftar</span></div>
      </article>
      <article class="summary-card">
        <span class="summary-icon summary-icon--green"><v-icon icon="mdi-calculator-variant-outline" size="20" /></span>
        <div><small>Rata-rata HPP</small><strong class="summary-currency">{{ formatRupiah(averageHpp) }}</strong><span>Nilai rata-rata seluruh item</span></div>
      </article>
      <article class="summary-card">
        <span class="summary-icon summary-icon--violet"><v-icon icon="mdi-trending-up" size="20" /></span>
        <div><small>HPP Tertinggi</small><strong class="summary-currency">{{ formatRupiah(highestHpp) }}</strong><span>Harga pokok tertinggi tercatat</span></div>
      </article>
    </section>

    <section class="barang-directory">
      <header class="directory-header">
        <div>
          <span class="section-kicker">Item Directory</span>
          <div class="directory-title-row"><h2>Daftar Barang &amp; Service</h2><span>{{ filteredBarang.length }} data</span></div>
        </div>
        <label class="barang-search">
          <v-icon icon="mdi-magnify" size="18" />
          <input v-model="data.searchBarang" type="search" placeholder="Cari nama barang, harga HPP, atau pembuat..." />
          <button v-if="data.searchBarang" type="button" aria-label="Hapus pencarian" @click="data.searchBarang = ''">
            <v-icon icon="mdi-close" size="16" />
          </button>
        </label>
      </header>

      <div class="barang-table-wrap">
        <v-data-table
          :headers="barangHeaders"
          :items="filteredBarang"
          :loading="isLoading"
          :items-per-page="-1"
          density="comfortable"
          item-value="id"
          class="barang-table"
          hide-default-footer
          hover
        >
          <template #item.no="{ index }"><span class="row-number">{{ index + 1 }}</span></template>
          <template #item.nama_barang="{ item }">
            <div class="barang-identity">
              <span class="barang-avatar"><v-icon icon="mdi-package-variant" size="17" /></span>
              <strong>{{ item.nama_barang || "—" }}</strong>
            </div>
          </template>
          <template #item.harga_hpp="{ item }">
            <strong class="price-cell">{{ formatRupiah(item.harga_hpp) }}</strong>
          </template>
          <template #item.createdAt="{ item }">
            <div class="date-cell"><v-icon icon="mdi-calendar-blank-outline" size="15" /><span>{{ formatCreatedAt(item.createdAt) }}</span></div>
          </template>
          <template #item.aksi="{ item }">
            <div class="table-actions">
              <button type="button" class="table-action-button table-action-button--edit" title="Edit barang" aria-label="Edit barang" @click="openDialogEditBarang(item)">
                <v-icon icon="mdi-pencil-outline" size="16" />
              </button>
              <button
                type="button"
                class="table-action-button table-action-button--delete"
                title="Hapus barang"
                aria-label="Hapus barang"
                :disabled="deletingBarangId === item.id"
                @click="hapusBarang(item.id)"
              >
                <v-progress-circular v-if="deletingBarangId === item.id" indeterminate size="14" width="2" />
                <v-icon v-else icon="mdi-delete-outline" size="16" />
              </button>
            </div>
          </template>
          <template #no-data>
            <div class="empty-state">
              <span class="empty-icon"><v-icon icon="mdi-package-variant-closed-remove" size="30" /></span>
              <strong>{{ data.searchBarang ? "Barang tidak ditemukan" : "Belum ada barang atau service" }}</strong>
              <p>{{ data.searchBarang ? "Coba gunakan kata kunci lain." : "Tambahkan item pertama untuk mulai membangun katalog." }}</p>
            </div>
          </template>
        </v-data-table>
      </div>

      <div class="barang-mobile-list">
        <div v-if="isLoading" class="mobile-loading">
          <v-skeleton-loader v-for="index in 3" :key="index" type="article" />
        </div>
        <div v-else-if="!filteredBarang.length" class="empty-state">
          <span class="empty-icon"><v-icon icon="mdi-package-variant-closed-remove" size="30" /></span>
          <strong>{{ data.searchBarang ? "Barang tidak ditemukan" : "Belum ada barang atau service" }}</strong>
          <p>{{ data.searchBarang ? "Coba gunakan kata kunci lain." : "Tambahkan item pertama untuk mulai membangun katalog." }}</p>
        </div>
        <template v-else>
          <article v-for="barang in filteredBarang" :key="barang.id" class="barang-mobile-card">
            <header>
              <span class="barang-avatar"><v-icon icon="mdi-package-variant" size="17" /></span>
              <div class="mobile-identity"><strong>{{ barang.nama_barang || "—" }}</strong><small>{{ formatCreatedAt(barang.createdAt) }}</small></div>
              <div class="mobile-actions">
                <button type="button" aria-label="Edit barang" @click="openDialogEditBarang(barang)"><v-icon icon="mdi-pencil-outline" size="17" /></button>
                <button type="button" class="delete-action" aria-label="Hapus barang" :disabled="deletingBarangId === barang.id" @click="hapusBarang(barang.id)">
                  <v-progress-circular v-if="deletingBarangId === barang.id" indeterminate size="14" width="2" />
                  <v-icon v-else icon="mdi-delete-outline" size="17" />
                </button>
              </div>
            </header>
            <div class="mobile-price"><span>Harga HPP</span><strong>{{ formatRupiah(barang.harga_hpp) }}</strong></div>
          </article>
        </template>
      </div>
    </section>

    <v-dialog
      v-model="data.dialogBarang"
      max-width="620"
      :fullscreen="$vuetify.display.smAndDown"
      :persistent="isSaving"
    >
      <form class="barang-dialog" @submit.prevent="simpanBarang">
        <header class="barang-dialog-header">
          <div class="dialog-heading">
            <span class="dialog-icon"><v-icon :icon="data.barangAddEdit === 'add' ? 'mdi-package-variant-plus' : 'mdi-package-variant-closed-edit'" size="20" /></span>
            <div>
              <h2>{{ data.barangAddEdit === "add" ? "Tambah Barang / Service" : "Edit Barang / Service" }}</h2>
              <p>Lengkapi nama item dan harga pokok yang berlaku.</p>
            </div>
          </div>
          <button type="button" class="dialog-close" :disabled="isSaving" aria-label="Tutup dialog" @click="closeBarangDialog"><v-icon icon="mdi-close" size="20" /></button>
        </header>

        <div class="barang-dialog-body">
          <section class="dialog-section">
            <div class="dialog-section-heading"><span>01</span><div><h3>Informasi Item</h3><p>Nama barang atau jenis service yang tersedia.</p></div></div>
            <a-text-field-new v-model="newBarang.nama_barang" label="Nama Barang / Service" placeholder="Contoh: Marine equipment supply" />
          </section>
          <section class="dialog-section">
            <div class="dialog-section-heading"><span>02</span><div><h3>Harga Pokok</h3><p>Nilai HPP dasar yang digunakan saat membuat penawaran.</p></div></div>
            <a-field-number-new v-model="newBarang.harga_hpp" label="Harga HPP" placeholder="0" />
          </section>
        </div>

        <footer class="barang-dialog-footer">
          <p>Pastikan nama dan harga HPP sudah sesuai sebelum disimpan.</p>
          <div>
            <v-btn variant="outlined" color="grey-darken-1" class="text-none dialog-cancel" :disabled="isSaving" @click="closeBarangDialog">Batal</v-btn>
            <v-btn type="submit" color="primary" variant="flat" prepend-icon="mdi-content-save-outline" class="text-none dialog-save" :disabled="isSaving" :loading="isSaving">
              {{ data.barangAddEdit === "add" ? "Simpan Barang" : "Simpan Perubahan" }}
            </v-btn>
          </div>
        </footer>
      </form>
    </v-dialog>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }
.barang-page { width: 100%; max-width: 1500px; min-height: 100vh; margin: 0 auto; padding: 8px 14px 30px; color: #243447; }
.back-button { min-height: 32px; margin-bottom: 8px; padding-inline: 7px !important; font-size: 11px; font-weight: 650; letter-spacing: 0; }
.barang-hero, .barang-directory, .summary-card { background: #fff; border: 1px solid #e0e5ea; box-shadow: 0 6px 18px rgba(34, 51, 68, .035); }
.barang-hero { display: flex; min-height: 118px; padding: 20px 22px; align-items: center; justify-content: space-between; gap: 24px; border-radius: 8px; }
.barang-hero-copy { min-width: 0; }
.barang-eyebrow, .section-kicker { color: #587a9b; font-size: 8px; font-weight: 750; letter-spacing: .13em; text-transform: uppercase; }
.barang-hero h1 { margin: 4px 0; color: #1d2937; font-size: 25px; font-weight: 750; letter-spacing: -.025em; line-height: 1.15; }
.barang-hero p { max-width: 720px; margin: 0; color: #778493; font-size: 11px; line-height: 1.55; }
.add-barang-button { flex: 0 0 auto; min-width: 142px; height: 36px !important; font-size: 10px !important; font-weight: 650 !important; letter-spacing: 0 !important; border-radius: 5px !important; }
.barang-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 10px; }
.summary-card { display: flex; min-height: 96px; padding: 15px 17px; align-items: center; gap: 13px; border-radius: 7px; }
.summary-card--primary { background: #f8fafc; border-color: #d9e2eb; }
.summary-icon { display: grid; flex: 0 0 38px; width: 38px; height: 38px; place-items: center; color: #315f8c; background: #eaf1f7; border-radius: 6px; }
.summary-icon--green { color: #2c7957; background: #e9f5ef; }
.summary-icon--violet { color: #6a5790; background: #f0edf7; }
.summary-card > div { display: flex; min-width: 0; flex-direction: column; }
.summary-card small { color: #737f8c; font-size: 8px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.summary-card strong { margin: 2px 0 1px; color: #253444; font-size: 20px; font-weight: 750; line-height: 1.1; }
.summary-card .summary-currency { font-size: 16px; }
.summary-card > div > span { color: #9099a3; font-size: 9px; }
.barang-directory { margin-top: 10px; overflow: hidden; border-radius: 8px; }
.directory-header { display: flex; min-height: 72px; padding: 13px 18px; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 1px solid #e5e9ed; }
.directory-title-row { display: flex; margin-top: 3px; align-items: center; gap: 8px; }
.directory-title-row h2 { margin: 0; color: #263442; font-size: 15px; font-weight: 720; letter-spacing: -.015em; }
.directory-title-row > span { padding: 2px 7px; color: #6f7e8d; font-size: 8px; font-weight: 650; background: #f0f3f6; border-radius: 10px; }
.barang-search { display: flex; width: min(410px, 46vw); height: 34px; padding: 0 9px; align-items: center; gap: 7px; color: #8793a0; background: #f8fafb; border: 1px solid #d7dee5; border-radius: 5px; }
.barang-search:focus-within { background: #fff; border-color: #7f9fbd; box-shadow: 0 0 0 2px rgba(49, 95, 140, .08); }
.barang-search input { min-width: 0; flex: 1; color: #354454; font: inherit; font-size: 10px; background: transparent; border: 0; outline: 0; }
.barang-search input::placeholder { color: #9aa4ae; }
.barang-search button { display: grid; width: 23px; height: 23px; padding: 0; place-items: center; color: #7f8994; background: transparent; border: 0; border-radius: 4px; cursor: pointer; }
.barang-search button:hover { background: #edf1f4; }
.barang-table-wrap { width: 100%; overflow-x: auto; }
.barang-table { width: 100%; min-width: 980px; }
.barang-table :deep(.v-data-table__th) { height: 36px !important; padding: 0 11px !important; color: #687584 !important; font-size: 8px !important; font-weight: 750 !important; letter-spacing: .055em !important; text-transform: uppercase !important; background: #f5f7f9 !important; border-bottom-color: #dfe4e9 !important; }
.barang-table :deep(.v-data-table__td) { min-height: 58px !important; padding: 9px 11px !important; color: #4b5968; font-size: 10px; border-bottom-color: #e8ecef !important; }
.barang-table :deep(tbody tr:hover) { background: #fafcfd !important; }
.barang-table :deep(.v-data-table__th:last-child), .barang-table :deep(.v-data-table__td:last-child) { position: sticky; right: 0; z-index: 2; box-shadow: -8px 0 12px -12px rgba(35, 52, 68, .35); }
.barang-table :deep(.v-data-table__th:last-child) { z-index: 3; background: #f5f7f9 !important; }
.barang-table :deep(.v-data-table__td:last-child) { background: #fff !important; }
.barang-table :deep(tbody tr:hover .v-data-table__td:last-child) { background: #fafcfd !important; }
.row-number { display: block; color: #84909c; text-align: center; font-variant-numeric: tabular-nums; }
.barang-identity { display: flex; min-width: 0; align-items: center; gap: 9px; }
.barang-avatar { display: grid; flex: 0 0 34px; width: 34px; height: 34px; place-items: center; color: #315f8c; background: #edf3f8; border: 1px solid #dbe6ef; border-radius: 6px; }
.barang-identity > div { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
.barang-identity strong { overflow: hidden; color: #2c3a49; font-size: 10px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.barang-identity small { overflow: hidden; color: #929ca6; font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
.price-cell { display: block; color: #315f69; font-size: 10px; font-weight: 720; text-align: right; font-variant-numeric: tabular-nums; }
.date-cell { display: flex; align-items: center; gap: 5px; color: #687684; }
.date-cell .v-icon { color: #929ca6; }
.table-actions { display: flex; min-width: 74px; align-items: center; justify-content: center; gap: 5px; }
.table-action-button { display: grid; flex: 0 0 30px; width: 30px; height: 30px; padding: 0; place-items: center; background: #fff; border: 1px solid; border-radius: 5px; cursor: pointer; transition: background-color .15s ease, border-color .15s ease; }
.table-action-button--edit { color: #316b9a; border-color: #d5e3ee; }
.table-action-button--edit:hover { background: #edf5fa; border-color: #b8cfdf; }
.table-action-button--delete { color: #b44c58; border-color: #edd8dc; }
.table-action-button--delete:hover:not(:disabled) { background: #fcf0f2; border-color: #dfb9c0; }
.table-action-button:disabled { cursor: wait; opacity: .65; }
.barang-mobile-list { display: none; }
.empty-state { display: flex; min-height: 190px; padding: 30px; align-items: center; justify-content: center; flex-direction: column; color: #8e99a4; text-align: center; }
.empty-icon { display: grid; width: 52px; height: 52px; margin-bottom: 9px; place-items: center; color: #6d8193; background: #f1f4f6; border-radius: 8px; }
.empty-state strong { color: #566473; font-size: 11px; }
.empty-state p { margin: 4px 0 0; font-size: 9px; }
.barang-dialog { display: flex; width: 100%; max-height: calc(100vh - 40px); overflow: hidden; flex-direction: column; color: #263545; background: #f5f6f8; border: 1px solid #d9dee4; border-radius: 9px; box-shadow: 0 22px 60px rgba(20, 31, 43, .24); }
.barang-dialog-header { display: flex; min-height: 64px; padding: 11px 15px; align-items: center; justify-content: space-between; gap: 18px; background: #fff; border-bottom: 1px solid #dfe4e8; }
.dialog-heading { display: flex; min-width: 0; align-items: center; gap: 10px; }
.dialog-icon { display: grid; flex: 0 0 36px; width: 36px; height: 36px; place-items: center; color: #315f8c; background: #edf3f8; border: 1px solid #dbe6ef; border-radius: 6px; }
.dialog-heading h2 { margin: 0; color: #202c38; font-size: 14px; font-weight: 730; }
.dialog-heading p { margin: 2px 0 0; color: #818c97; font-size: 9px; }
.dialog-close { display: grid; flex: 0 0 30px; width: 30px; height: 30px; padding: 0; place-items: center; color: #75818d; background: transparent; border: 0; border-radius: 5px; cursor: pointer; }
.dialog-close:hover:not(:disabled) { background: #f0f3f5; }
.barang-dialog-body { display: flex; min-height: 0; padding: 10px; overflow-y: auto; flex-direction: column; gap: 8px; }
.dialog-section { padding: 12px; background: #fff; border: 1px solid #dfe4e8; border-radius: 6px; }
.dialog-section-heading { display: flex; margin-bottom: 10px; align-items: flex-start; gap: 8px; }
.dialog-section-heading > span { display: grid; flex: 0 0 22px; width: 22px; height: 21px; place-items: center; color: #607080; font-size: 8px; font-weight: 700; background: #f0f3f5; border: 1px solid #e0e5e9; border-radius: 4px; }
.dialog-section-heading h3 { margin: 0; color: #33404e; font-size: 11px; line-height: 1.25; }
.dialog-section-heading p { margin: 2px 0 0; color: #8b959f; font-size: 8px; }
.barang-dialog :deep(.input-field) { border-radius: 4px; }
.barang-dialog-footer { display: flex; flex: 0 0 auto; min-height: 56px; padding: 9px 14px; align-items: center; justify-content: space-between; gap: 16px; background: #fff; border-top: 1px solid #dfe4e8; }
.barang-dialog-footer p { margin: 0; color: #7d8893; font-size: 9px; }
.barang-dialog-footer > div { display: flex; gap: 7px; }
.dialog-cancel, .dialog-save { min-width: 96px; height: 32px !important; font-size: 10px !important; font-weight: 650 !important; letter-spacing: 0 !important; border-radius: 4px !important; }
.dialog-save { min-width: 145px; }

@media (max-width: 900px) {
  .summary-card { padding: 13px; }
  .summary-icon { display: none; }
}

@media (max-width: 767px) {
  .barang-page { padding: 6px 8px 22px; }
  .barang-hero { min-height: 0; padding: 17px; align-items: stretch; flex-direction: column; gap: 14px; }
  .barang-hero h1 { font-size: 22px; }
  .add-barang-button { width: 100%; }
  .barang-summary { grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 7px; }
  .summary-card { min-height: 86px; padding: 12px; }
  .summary-card:last-child { grid-column: 1 / -1; }
  .summary-card strong { font-size: 18px; }
  .summary-card .summary-currency { font-size: 14px; }
  .barang-directory { margin-top: 7px; }
  .directory-header { padding: 13px; align-items: stretch; flex-direction: column; gap: 11px; }
  .barang-search { width: 100%; }
  .barang-table-wrap { display: none; }
  .barang-mobile-list { display: block; padding: 9px; background: #f7f9fa; }
  .mobile-loading { display: grid; gap: 8px; }
  .barang-mobile-card { padding: 11px; background: #fff; border: 1px solid #dfe5ea; border-radius: 6px; }
  .barang-mobile-card + .barang-mobile-card { margin-top: 8px; }
  .barang-mobile-card > header { display: flex; align-items: center; gap: 8px; }
  .mobile-identity { display: flex; min-width: 0; flex: 1; flex-direction: column; }
  .mobile-identity strong { overflow: hidden; color: #314050; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
  .mobile-identity small { margin-top: 2px; color: #8a959f; font-size: 8px; }
  .mobile-actions { display: flex; gap: 4px; }
  .mobile-actions button { display: grid; width: 29px; height: 29px; padding: 0; place-items: center; color: #416f98; background: #f1f6fa; border: 1px solid #dce6ee; border-radius: 4px; }
  .mobile-actions .delete-action { color: #ad4d58; background: #fcf2f3; border-color: #efd8dc; }
  .mobile-actions button:disabled { opacity: .65; }
  .mobile-price { display: flex; margin-top: 10px; padding-top: 9px; align-items: center; justify-content: space-between; gap: 12px; border-top: 1px solid #edf0f2; }
  .mobile-price span { color: #7b8792; font-size: 8px; font-weight: 650; text-transform: uppercase; }
  .mobile-price strong { color: #315f69; font-size: 11px; }
  .barang-dialog { height: 100%; max-height: 100%; border: 0; border-radius: 0; }
  .barang-dialog-header { min-height: 62px; padding: 10px 12px; }
  .dialog-heading p { display: none; }
  .barang-dialog-body { padding: 9px; }
  .dialog-section { padding: 11px; }
  .barang-dialog-footer { padding: 9px 10px; }
  .barang-dialog-footer p { display: none; }
  .barang-dialog-footer > div { display: grid; width: 100%; grid-template-columns: 1fr 1.35fr; }
  .dialog-cancel, .dialog-save { width: 100%; min-width: 0; }
}

@media (max-width: 420px) {
  .barang-summary { grid-template-columns: 1fr; }
  .summary-card:last-child { grid-column: auto; }
  .summary-card { min-height: 76px; }
}
</style>
