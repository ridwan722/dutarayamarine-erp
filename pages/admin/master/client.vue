<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import moment from "moment";
import type { ConfirmationDialog } from "#components";
import type { customerM } from "~/types/customerModel";

definePageMeta({ layout: "admin" });

const customerStore = usecustomerStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(null);
const isLoading = ref(true);
const isSaving = ref(false);

const data = reactive({
  searchCustomer: "",
  dialogCustomer: false,
  customerAddEdit: "add" as "add" | "edit",
});

const customerHeaders = [
  { title: "No.", value: "no", sortable: false, width: "54px" },
  { title: "Client", value: "nama", sortable: true, width: "270px" },
  { title: "PIC", value: "pic", sortable: true, width: "170px" },
  { title: "Vessel", value: "vessel", sortable: true, width: "180px" },
  { title: "Kontak", value: "kontak", sortable: false, width: "245px" },
  { title: "Alamat", value: "alamat", sortable: true },
  { title: "Aksi", value: "aksi", sortable: false, align: "center" as const, width: "100px" },
];

function emptyCustomer(): customerM {
  return {
    nama: "",
    pic: "",
    alamat: "",
    no_telp: "",
    email: "",
    vessel: "",
    createdAt: 0,
    createdBy: "",
  };
}

const newCustomer = ref<customerM>(emptyCustomer());
const customers = computed(() => customerStore.getDataCustomer);
const completeContactCount = computed(
  () => customers.value.filter((customer) => customer.no_telp?.trim() && customer.email?.trim()).length,
);
const vesselCount = computed(
  () => customers.value.filter((customer) => customer.vessel?.trim()).length,
);
const filteredCustomers = computed(() => {
  const query = data.searchCustomer.trim().toLocaleLowerCase("id-ID");
  return [...customers.value]
    .filter((customer) => {
      if (!query) return true;
      return [customer.nama, customer.pic, customer.vessel, customer.no_telp, customer.email, customer.alamat]
        .some((value) => String(value || "").toLocaleLowerCase("id-ID").includes(query));
    })
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
});

onMounted(async () => {
  try {
    isLoading.value = true;
    await customerStore.tarikDataCustomerAct();
  } finally {
    isLoading.value = false;
  }
});

function customerInitial(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "CL";
  return words.slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase();
}

function formatCreatedAt(timestamp: number) {
  return timestamp ? moment.unix(timestamp).format("DD MMM YYYY") : "—";
}

function openDialogAddCustomer() {
  data.customerAddEdit = "add";
  newCustomer.value = emptyCustomer();
  data.dialogCustomer = true;
}

function openDialogEditCustomer(item: customerM) {
  data.customerAddEdit = "edit";
  newCustomer.value = { ...item };
  data.dialogCustomer = true;
}

function closeCustomerDialog() {
  if (isSaving.value) return;
  data.dialogCustomer = false;
}

async function simpanCustomer() {
  if (isSaving.value) return;
  if (!newCustomer.value.nama) return notificationStore.showError("Nama Client tidak boleh kosong");
  if (!newCustomer.value.alamat) return notificationStore.showError("Address tidak boleh kosong");
  if (!newCustomer.value.pic) return notificationStore.showError("PIC tidak boleh kosong");
  if (!newCustomer.value.no_telp) return notificationStore.showError("Phone Number tidak boleh kosong");
  if (!newCustomer.value.email) return notificationStore.showError("Email tidak boleh kosong");
  if (!newCustomer.value.vessel) return notificationStore.showError("Vessel tidak boleh kosong");

  isSaving.value = true;
  try {
    if (data.customerAddEdit === "add") {
      newCustomer.value.createdAt = moment().unix();
      newCustomer.value.createdBy = userStore.getEmail;
      await customerStore.addCustomerAct(newCustomer.value);
    } else {
      newCustomer.value.updatedAt = moment().unix();
      newCustomer.value.updatedBy = userStore.getEmail;
      await customerStore.updateCustomerAct(newCustomer.value);
    }
    data.dialogCustomer = false;
  } finally {
    isSaving.value = false;
  }
}

async function hapusCustomer(id: string) {
  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus",
    "Anda yakin ingin menghapus customer ini?",
    { variant: "danger" },
  );
  if (!confirmed) return notificationStore.showError("Penghapusan dibatalkan");
  await customerStore.deleteCustomerAct(id);
}
</script>

<template>
  <div class="client-page">
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

    <header class="client-hero">
      <div class="client-hero-copy">
        <span class="client-eyebrow">Master Data</span>
        <h1>Client</h1>
        <p>Kelola identitas perusahaan, PIC, vessel, dan informasi kontak seluruh client dalam satu direktori.</p>
      </div>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        class="text-none add-client-button"
        @click="openDialogAddCustomer"
      >
        Tambah Client
      </v-btn>
    </header>

    <section class="client-summary" aria-label="Ringkasan client">
      <article class="summary-card summary-card--primary">
        <span class="summary-icon"><v-icon icon="mdi-domain" size="20" /></span>
        <div><small>Total Client</small><strong>{{ customers.length }}</strong><span>Perusahaan terdaftar</span></div>
      </article>
      <article class="summary-card">
        <span class="summary-icon summary-icon--green"><v-icon icon="mdi-card-account-phone-outline" size="20" /></span>
        <div><small>Kontak Lengkap</small><strong>{{ completeContactCount }}</strong><span>Telepon dan email tersedia</span></div>
      </article>
      <article class="summary-card">
        <span class="summary-icon summary-icon--violet"><v-icon icon="mdi-ferry" size="20" /></span>
        <div><small>Vessel Tercatat</small><strong>{{ vesselCount }}</strong><span>Client dengan vessel aktif</span></div>
      </article>
    </section>

    <section class="client-directory">
      <header class="directory-header">
        <div>
          <span class="section-kicker">Client Directory</span>
          <div class="directory-title-row"><h2>Daftar Client</h2><span>{{ filteredCustomers.length }} data</span></div>
        </div>
        <label class="client-search">
          <v-icon icon="mdi-magnify" size="18" />
          <input v-model="data.searchCustomer" type="search" placeholder="Cari client, PIC, vessel, kontak, atau alamat..." />
          <button v-if="data.searchCustomer" type="button" aria-label="Hapus pencarian" @click="data.searchCustomer = ''">
            <v-icon icon="mdi-close" size="16" />
          </button>
        </label>
      </header>

      <div class="client-table-wrap">
        <v-data-table
          :headers="customerHeaders"
          :items="filteredCustomers"
          :loading="isLoading"
          :items-per-page="-1"
          density="comfortable"
          item-value="id_customer"
          class="client-table"
          hide-default-footer
          hover
        >
          <template #item.no="{ index }"><span class="row-number">{{ index + 1 }}</span></template>
          <template #item.nama="{ item }">
            <div class="client-identity">
              <span class="client-avatar">{{ customerInitial(item.nama) }}</span>
              <div><strong>{{ item.nama }}</strong><small>Ditambahkan {{ formatCreatedAt(item.createdAt) }}</small></div>
            </div>
          </template>
          <template #item.pic="{ item }">
            <div class="pic-cell"><v-icon icon="mdi-account-outline" size="15" /><span>{{ item.pic || "—" }}</span></div>
          </template>
          <template #item.vessel="{ item }">
            <div class="vessel-cell"><v-icon icon="mdi-ferry" size="15" /><span>{{ item.vessel || "—" }}</span></div>
          </template>
          <template #item.kontak="{ item }">
            <div class="contact-cell">
              <a v-if="item.no_telp" ><v-icon icon="mdi-phone-outline" size="14" />{{ item.no_telp }}</a>
              <span v-else>—</span>
              <a v-if="item.email" ><v-icon icon="mdi-email-outline" size="14" />{{ item.email }}</a>
            </div>
          </template>
          <template #item.alamat="{ item }"><p class="address-cell">{{ item.alamat || "—" }}</p></template>
          <template #item.aksi="{ item }">
            <div class="table-actions">
              <button
                type="button"
                class="table-action-button table-action-button--edit"
                title="Edit client"
                aria-label="Edit client"
                @click="openDialogEditCustomer(item)"
              >
                <v-icon icon="mdi-pencil-outline" size="16" />
              </button>
              <button
                type="button"
                class="table-action-button table-action-button--delete"
                title="Hapus client"
                aria-label="Hapus client"
                @click="hapusCustomer(item.id_customer!)"
              >
                <v-icon icon="mdi-delete-outline" size="16" />
              </button>
            </div>
          </template>
          <template #no-data>
            <div class="empty-state">
              <span class="empty-icon"><v-icon icon="mdi-account-search-outline" size="30" /></span>
              <strong>{{ data.searchCustomer ? "Client tidak ditemukan" : "Belum ada client" }}</strong>
              <p>{{ data.searchCustomer ? "Coba gunakan kata kunci lain." : "Tambahkan client pertama untuk mulai membangun direktori." }}</p>
            </div>
          </template>
        </v-data-table>
      </div>

      <div class="client-mobile-list">
        <div v-if="isLoading" class="mobile-loading">
          <v-skeleton-loader v-for="index in 3" :key="index" type="article" />
        </div>
        <div v-else-if="!filteredCustomers.length" class="empty-state">
          <span class="empty-icon"><v-icon icon="mdi-account-search-outline" size="30" /></span>
          <strong>{{ data.searchCustomer ? "Client tidak ditemukan" : "Belum ada client" }}</strong>
          <p>{{ data.searchCustomer ? "Coba gunakan kata kunci lain." : "Tambahkan client pertama untuk mulai membangun direktori." }}</p>
        </div>
        <template v-else>
          <article v-for="customer in filteredCustomers" :key="customer.id_customer" class="client-mobile-card">
            <header>
              <span class="client-avatar">{{ customerInitial(customer.nama) }}</span>
              <div><strong>{{ customer.nama }}</strong><small>{{ customer.pic || "PIC belum dicatat" }}</small></div>
              <div class="mobile-actions">
                <button type="button" aria-label="Edit client" @click="openDialogEditCustomer(customer)"><v-icon icon="mdi-pencil-outline" size="17" /></button>
                <button type="button" class="delete-action" aria-label="Hapus client" @click="hapusCustomer(customer.id_customer!)"><v-icon icon="mdi-delete-outline" size="17" /></button>
              </div>
            </header>
            <div class="mobile-contact-grid">
              <span><v-icon icon="mdi-ferry" size="14" />{{ customer.vessel || "—" }}</span>
              <span><v-icon icon="mdi-phone-outline" size="14" />{{ customer.no_telp || "—" }}</span>
              <span><v-icon icon="mdi-email-outline" size="14" />{{ customer.email || "—" }}</span>
              <span class="mobile-address"><v-icon icon="mdi-map-marker-outline" size="14" />{{ customer.alamat || "—" }}</span>
            </div>
          </article>
        </template>
      </div>
    </section>

    <v-dialog v-model="data.dialogCustomer" max-width="680" :fullscreen="$vuetify.display.smAndDown" :persistent="isSaving">
      <form class="client-dialog" @submit.prevent="simpanCustomer">
        <header class="client-dialog-header">
          <div class="dialog-heading">
            <span class="dialog-icon"><v-icon icon="mdi-account-plus-outline" size="20" /></span>
            <div><h2>{{ data.customerAddEdit === "add" ? "Tambah Client" : "Edit Client" }}</h2><p>Lengkapi identitas dan informasi kontak client.</p></div>
          </div>
          <button type="button" class="dialog-close" :disabled="isSaving" aria-label="Tutup dialog" @click="closeCustomerDialog">
            <v-icon icon="mdi-close" size="20" />
          </button>
        </header>

        <div class="client-dialog-body">
          <section class="dialog-section">
            <div class="dialog-section-heading"><span>01</span><div><h3>Identitas Client</h3><p>Nama perusahaan, PIC, dan vessel yang ditangani.</p></div></div>
            <div class="dialog-form-grid">
              <a-text-field-new v-model="newCustomer.nama" label="Nama Client" placeholder="Contoh: PT Samudra Indonesia" />
              <a-text-field-new v-model="newCustomer.pic" label="PIC" placeholder="Nama penanggung jawab" />
              <a-text-field-new v-model="newCustomer.vessel" label="Vessel" placeholder="Nama vessel" class="dialog-field-wide" />
            </div>
          </section>
          <section class="dialog-section">
            <div class="dialog-section-heading"><span>02</span><div><h3>Informasi Kontak</h3><p>Nomor telepon dan email yang dapat dihubungi.</p></div></div>
            <div class="dialog-form-grid">
              <a-text-field-new v-model="newCustomer.no_telp" label="Nomor Telepon" placeholder="Contoh: +62 812 3456 7890" />
              <a-text-field-new v-model="newCustomer.email" label="Email" placeholder="client@perusahaan.com" />
            </div>
          </section>
          <section class="dialog-section">
            <div class="dialog-section-heading"><span>03</span><div><h3>Alamat Client</h3><p>Alamat lengkap kantor atau lokasi operasional.</p></div></div>
            <a-textarea-new v-model="newCustomer.alamat" label="Alamat" placeholder="Tuliskan alamat lengkap client" rows="2" />
          </section>
        </div>

        <footer class="client-dialog-footer">
          <p>Pastikan informasi client sudah benar sebelum disimpan.</p>
          <div>
            <v-btn variant="outlined" color="grey-darken-1" class="text-none dialog-cancel" :disabled="isSaving" @click="closeCustomerDialog">Batal</v-btn>
            <v-btn type="submit" color="primary" variant="flat" prepend-icon="mdi-content-save-outline" class="text-none dialog-save" :disabled="isSaving" :loading="isSaving">
              {{ data.customerAddEdit === "add" ? "Simpan Client" : "Simpan Perubahan" }}
            </v-btn>
          </div>
        </footer>
      </form>
    </v-dialog>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }
.client-page { width: 100%; max-width: 1500px; min-height: 100vh; margin: 0 auto; padding: 8px 14px 30px; color: #243447; }
.back-button { min-height: 32px; margin-bottom: 8px; padding-inline: 7px !important; font-size: 11px; font-weight: 650; letter-spacing: 0; }
.client-hero, .client-directory, .summary-card { background: #fff; border: 1px solid #e0e5ea; box-shadow: 0 6px 18px rgba(34, 51, 68, .035); }
.client-hero { display: flex; min-height: 118px; padding: 20px 22px; align-items: center; justify-content: space-between; gap: 24px; border-radius: 8px; }
.client-hero-copy { min-width: 0; }
.client-eyebrow, .section-kicker { color: #587a9b; font-size: 8px; font-weight: 750; letter-spacing: .13em; text-transform: uppercase; }
.client-hero h1 { margin: 4px 0; color: #1d2937; font-size: 25px; font-weight: 750; letter-spacing: -.025em; line-height: 1.15; }
.client-hero p { max-width: 680px; margin: 0; color: #778493; font-size: 11px; line-height: 1.55; }
.add-client-button { flex: 0 0 auto; min-width: 142px; height: 36px !important; font-size: 10px !important; font-weight: 650 !important; letter-spacing: 0 !important; border-radius: 5px !important; }
.client-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 10px; }
.summary-card { display: flex; min-height: 96px; padding: 15px 17px; align-items: center; gap: 13px; border-radius: 7px; }
.summary-card--primary { background: #f8fafc; border-color: #d9e2eb; }
.summary-icon { display: grid; flex: 0 0 38px; width: 38px; height: 38px; place-items: center; color: #315f8c; background: #eaf1f7; border-radius: 6px; }
.summary-icon--green { color: #2c7957; background: #e9f5ef; }
.summary-icon--violet { color: #6a5790; background: #f0edf7; }
.summary-card > div { display: flex; min-width: 0; flex-direction: column; }
.summary-card small { color: #737f8c; font-size: 8px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.summary-card strong { margin: 2px 0 1px; color: #253444; font-size: 20px; font-weight: 750; line-height: 1.1; }
.summary-card > div > span { color: #9099a3; font-size: 9px; }
.client-directory { margin-top: 10px; overflow: hidden; border-radius: 8px; }
.directory-header { display: flex; min-height: 72px; padding: 13px 18px; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 1px solid #e5e9ed; }
.directory-title-row { display: flex; margin-top: 3px; align-items: center; gap: 8px; }
.directory-title-row h2 { margin: 0; color: #263442; font-size: 15px; font-weight: 720; letter-spacing: -.015em; }
.directory-title-row > span { padding: 2px 7px; color: #6f7e8d; font-size: 8px; font-weight: 650; background: #f0f3f6; border-radius: 10px; }
.client-search { display: flex; width: min(410px, 46vw); height: 34px; padding: 0 9px; align-items: center; gap: 7px; color: #8793a0; background: #f8fafb; border: 1px solid #d7dee5; border-radius: 5px; }
.client-search:focus-within { background: #fff; border-color: #7f9fbd; box-shadow: 0 0 0 2px rgba(49, 95, 140, .08); }
.client-search input { min-width: 0; flex: 1; color: #354454; font: inherit; font-size: 10px; background: transparent; border: 0; outline: 0; }
.client-search input::placeholder { color: #9aa4ae; }
.client-search button { display: grid; width: 23px; height: 23px; padding: 0; place-items: center; color: #7f8994; background: transparent; border: 0; border-radius: 4px; cursor: pointer; }
.client-search button:hover { background: #edf1f4; }
.client-table-wrap { width: 100%; overflow-x: auto; }
.client-table { min-width: 1160px; }
.client-table :deep(.v-data-table__th) { height: 36px !important; padding: 0 11px !important; color: #687584 !important; font-size: 8px !important; font-weight: 750 !important; letter-spacing: .055em !important; text-transform: uppercase !important; background: #f5f7f9 !important; border-bottom-color: #dfe4e9 !important; }
.client-table :deep(.v-data-table__td) { min-height: 58px !important; padding: 9px 11px !important; color: #4b5968; font-size: 10px; border-bottom-color: #e8ecef !important; }
.client-table :deep(tbody tr:hover) { background: #fafcfd !important; }
.client-table :deep(.v-data-table__th:last-child),
.client-table :deep(.v-data-table__td:last-child) {
  position: sticky;
  right: 0;
  z-index: 2;
  box-shadow: -8px 0 12px -12px rgba(35, 52, 68, .35);
}
.client-table :deep(.v-data-table__th:last-child) {
  z-index: 3;
  background: #f5f7f9 !important;
}
.client-table :deep(.v-data-table__td:last-child) { background: #fff !important; }
.client-table :deep(tbody tr:hover .v-data-table__td:last-child) { background: #fafcfd !important; }
.client-table :deep(.v-data-table-footer) { min-height: 50px; color: #75818d; font-size: 10px; border-top: 1px solid #e8ecef; }
.row-number { display: block; color: #84909c; text-align: center; font-variant-numeric: tabular-nums; }
.client-identity { display: flex; min-width: 0; align-items: center; gap: 9px; }
.client-avatar { display: grid; flex: 0 0 34px; width: 34px; height: 34px; place-items: center; color: #315f8c; font-size: 10px; font-weight: 750; letter-spacing: .04em; background: #edf3f8; border: 1px solid #dbe6ef; border-radius: 6px; }
.client-identity > div { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
.client-identity strong { overflow: hidden; color: #2c3a49; font-size: 10px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.client-identity small { color: #929ca6; font-size: 8px; }
.pic-cell, .vessel-cell { display: flex; align-items: center; gap: 5px; color: #586676; }
.pic-cell .v-icon, .vessel-cell .v-icon { color: #85919d; }
.contact-cell { display: flex; min-width: 0; flex-direction: column; gap: 4px; }
.contact-cell a, .contact-cell > span { display: flex; min-width: 0; align-items: center; gap: 5px; color: #526f88; font-size: 9px; text-decoration: none; }
.contact-cell a:hover { color: #245f92; text-decoration: underline; }
.contact-cell a:last-child { overflow: hidden; color: #778492; text-overflow: ellipsis; white-space: nowrap; }
.address-cell { display: -webkit-box; max-width: 420px; margin: 0; overflow: hidden; color: #697684; font-size: 9px; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.table-actions { display: flex; min-width: 74px; align-items: center; justify-content: center; gap: 5px; }
.table-action-button {
  display: grid;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  padding: 0;
  place-items: center;
  background: #fff;
  border: 1px solid;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color .15s ease, border-color .15s ease;
}
.table-action-button--edit { color: #316b9a; border-color: #d5e3ee; }
.table-action-button--edit:hover { background: #edf5fa; border-color: #b8cfdf; }
.table-action-button--delete { color: #b44c58; border-color: #edd8dc; }
.table-action-button--delete:hover { background: #fcf0f2; border-color: #dfb9c0; }
.client-mobile-list { display: none; }
.empty-state { display: flex; min-height: 190px; padding: 30px; align-items: center; justify-content: center; flex-direction: column; color: #8e99a4; text-align: center; }
.empty-icon { display: grid; width: 52px; height: 52px; margin-bottom: 9px; place-items: center; color: #6d8193; background: #f1f4f6; border-radius: 8px; }
.empty-state strong { color: #566473; font-size: 11px; }
.empty-state p { margin: 4px 0 0; font-size: 9px; }
.client-dialog { display: flex; width: 100%; max-height: calc(100vh - 40px); overflow: hidden; flex-direction: column; color: #263545; background: #f5f6f8; border: 1px solid #d9dee4; border-radius: 9px; box-shadow: 0 22px 60px rgba(20, 31, 43, .24); }
.client-dialog-header { display: flex; min-height: 64px; padding: 11px 15px; align-items: center; justify-content: space-between; gap: 18px; background: #fff; border-bottom: 1px solid #dfe4e8; }
.dialog-heading { display: flex; min-width: 0; align-items: center; gap: 10px; }
.dialog-icon { display: grid; flex: 0 0 36px; width: 36px; height: 36px; place-items: center; color: #315f8c; background: #edf3f8; border: 1px solid #dbe6ef; border-radius: 6px; }
.dialog-heading h2 { margin: 0; color: #202c38; font-size: 14px; font-weight: 730; }
.dialog-heading p { margin: 2px 0 0; color: #818c97; font-size: 9px; }
.dialog-close { display: grid; flex: 0 0 30px; width: 30px; height: 30px; padding: 0; place-items: center; color: #75818d; background: transparent; border: 0; border-radius: 5px; cursor: pointer; }
.dialog-close:hover:not(:disabled) { background: #f0f3f5; }
.client-dialog-body { display: flex; min-height: 0; padding: 10px; overflow-y: auto; flex-direction: column; gap: 8px; }
.dialog-section { padding: 12px; background: #fff; border: 1px solid #dfe4e8; border-radius: 6px; }
.dialog-section-heading { display: flex; margin-bottom: 10px; align-items: flex-start; gap: 8px; }
.dialog-section-heading > span { display: grid; flex: 0 0 22px; width: 22px; height: 21px; place-items: center; color: #607080; font-size: 8px; font-weight: 700; background: #f0f3f5; border: 1px solid #e0e5e9; border-radius: 4px; }
.dialog-section-heading h3 { margin: 0; color: #33404e; font-size: 11px; line-height: 1.25; }
.dialog-section-heading p { margin: 2px 0 0; color: #8b959f; font-size: 8px; }
.dialog-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
.dialog-field-wide { grid-column: 1 / -1; }
.client-dialog :deep(.input-field) { border-radius: 4px; }
.client-dialog-footer { display: flex; flex: 0 0 auto; min-height: 56px; padding: 9px 14px; align-items: center; justify-content: space-between; gap: 16px; background: #fff; border-top: 1px solid #dfe4e8; }
.client-dialog-footer p { margin: 0; color: #7d8893; font-size: 9px; }
.client-dialog-footer > div { display: flex; gap: 7px; }
.dialog-cancel, .dialog-save { min-width: 96px; height: 32px !important; font-size: 10px !important; font-weight: 650 !important; letter-spacing: 0 !important; border-radius: 4px !important; }
.dialog-save { min-width: 145px; }

@media (max-width: 900px) {
  .summary-card { padding: 13px; }
  .summary-icon { display: none; }
}

@media (max-width: 767px) {
  .client-page { padding: 6px 8px 22px; }
  .client-hero { min-height: 0; padding: 17px; align-items: stretch; flex-direction: column; gap: 14px; }
  .client-hero h1 { font-size: 22px; }
  .add-client-button { width: 100%; }
  .client-summary { grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 7px; }
  .summary-card { min-height: 86px; padding: 12px; }
  .summary-card:last-child { grid-column: 1 / -1; }
  .summary-card strong { font-size: 18px; }
  .client-directory { margin-top: 7px; }
  .directory-header { padding: 13px; align-items: stretch; flex-direction: column; gap: 11px; }
  .client-search { width: 100%; }
  .client-table-wrap { display: none; }
  .client-mobile-list { display: block; padding: 9px; background: #f7f9fa; }
  .mobile-loading { display: grid; gap: 8px; }
  .client-mobile-card { padding: 11px; background: #fff; border: 1px solid #dfe5ea; border-radius: 6px; }
  .client-mobile-card + .client-mobile-card { margin-top: 8px; }
  .client-mobile-card > header { display: flex; align-items: center; gap: 8px; }
  .client-mobile-card > header > div:nth-child(2) { display: flex; min-width: 0; flex: 1; flex-direction: column; }
  .client-mobile-card > header strong { overflow: hidden; color: #314050; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
  .client-mobile-card > header small { margin-top: 2px; color: #8a959f; font-size: 8px; }
  .mobile-actions { display: flex; gap: 4px; }
  .mobile-actions button { display: grid; width: 29px; height: 29px; padding: 0; place-items: center; color: #416f98; background: #f1f6fa; border: 1px solid #dce6ee; border-radius: 4px; }
  .mobile-actions .delete-action { color: #ad4d58; background: #fcf2f3; border-color: #efd8dc; }
  .mobile-contact-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; margin-top: 10px; padding-top: 9px; color: #6d7a88; font-size: 8px; border-top: 1px solid #edf0f2; }
  .mobile-contact-grid span { display: flex; min-width: 0; align-items: flex-start; gap: 5px; overflow-wrap: anywhere; }
  .mobile-address { grid-column: 1 / -1; }
  .client-dialog { height: 100%; max-height: 100%; border: 0; border-radius: 0; }
  .client-dialog-header { min-height: 62px; padding: 10px 12px; }
  .dialog-heading p { display: none; }
  .client-dialog-body { padding: 9px; }
  .dialog-section { padding: 11px; }
  .dialog-form-grid { grid-template-columns: 1fr; }
  .dialog-field-wide { grid-column: auto; }
  .client-dialog-footer { padding: 9px 10px; }
  .client-dialog-footer p { display: none; }
  .client-dialog-footer > div { display: grid; width: 100%; grid-template-columns: 1fr 1.35fr; }
  .dialog-cancel, .dialog-save { width: 100%; min-width: 0; }
}

@media (max-width: 420px) {
  .client-summary { grid-template-columns: 1fr; }
  .summary-card:last-child { grid-column: auto; }
  .summary-card { min-height: 76px; }
  .mobile-contact-grid { grid-template-columns: 1fr; }
  .mobile-address { grid-column: auto; }
}
</style>
