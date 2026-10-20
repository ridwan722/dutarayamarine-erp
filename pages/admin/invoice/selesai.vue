<template>
  <v-btn
    variant="text"
    color="grey-darken-3"
    prepend-icon="mdi-arrow-left"
    class="text-capitalize font-weight-bold mb-2"
    @click="$router.go(-1)"
  >
    Kembali
  </v-btn>

  <div class="invoice-page-heading">
    <div>
      <h1>Invoice Selesai</h1>
      <p>Manage completed invoices, clients, payment status, and transaction value.</p>
    </div>
  </div>

  <v-card class="invoice-list-card" flat>
    <div class="invoice-list-toolbar">
      <div class="invoice-list-search">
        <v-icon icon="mdi-magnify" size="17" />
        <div class="invoice-list-search-field">
          <a-text-field-new
            v-model="data.searchInvoice"
            placeholder="Cari nomor invoice, client, quotation, atau subject"
          />
        </div>
        <v-btn
          v-if="data.searchInvoice"
          icon="mdi-close"
          size="x-small"
          variant="text"
          color="grey-darken-1"
          aria-label="Hapus pencarian"
          @click="data.searchInvoice = ''"
        />
      </div>

      <div class="invoice-list-tools">
        <span class="invoice-result-count">
          {{ displayedInvoices.length }} invoice
        </span>
        <span class="completed-filter">
          <v-icon icon="mdi-check-circle-outline" size="14" />
          Status Selesai
        </span>
        <v-btn
          icon="mdi-refresh"
          size="small"
          variant="text"
          class="invoice-refresh-btn"
          aria-label="Refresh invoice selesai"
          @click="refreshData"
        >
          <v-tooltip activator="parent" location="top">Refresh Data</v-tooltip>
        </v-btn>
      </div>
    </div>

    <v-divider />

    <v-data-table
      :headers="data.headInvoice"
      :items="displayedInvoices"
      :items-per-page="-1"
      density="compact"
      :sort-by="[{ key: 'createdAt', order: 'desc' }]"
      :hover="true"
      hide-default-footer
      class="invoice-list-table"
    >
      <template #item.no="{ index }">
        <span class="invoice-row-index">{{ index + 1 }}</span>
      </template>

      <template #item.tanggal="{ item }">
        <span class="invoice-date-cell">{{ rubahtanggallengkap(item.tanggal) }}</span>
      </template>

      <template #item.no_inv="{ item }">
        <NuxtLink :to="`/admin/invoice/${item.no_inv}`" class="invoice-reference">
          #INV/DRM/{{ invoiceYear(item.tanggal) }}/{{ item.no_inv }}
          <v-icon icon="mdi-arrow-top-right" size="12" />
        </NuxtLink>
      </template>

      <template #item.nama_customer="{ item }">
        <div class="invoice-client-cell">
          <div class="invoice-client-name">{{ item.nama_customer || "—" }}</div>
          <div class="invoice-client-meta">
            <span><v-icon icon="mdi-ferry" size="12" />{{ item.vessel || "—" }}</span>
            <i aria-hidden="true"></i>
            <span><v-icon icon="mdi-account-outline" size="12" />{{ item.pic || "—" }}</span>
          </div>
        </div>
      </template>

      <template #item.no_penawaran="{ item }">
        <NuxtLink
          v-if="item.id_penawaran && item.id_penawaran !== '-'"
          :to="`/admin/penawaran/${item.id_penawaran}`"
          class="invoice-quotation-reference"
        >
          {{ item.no_penawaran || "Quotation" }}
        </NuxtLink>
        <span v-else class="invoice-empty-value">—</span>
      </template>

      <template #item.perihal="{ item }">
        <div class="invoice-subject-cell">{{ item.perihal || "—" }}</div>
      </template>

      <template #item.grandtotal_invoice="{ item }">
        <strong class="invoice-amount-cell">
          Rp {{ rupiah(item.grandtotal_invoice) }}
        </strong>
      </template>

      <template #item.status="{ item }">
        <v-chip
          size="x-small"
          color="success"
          variant="tonal"
          class="invoice-table-status"
        >
          <v-icon start icon="mdi-circle" size="6" />
          {{ item.status || "Selesai" }}
        </v-chip>
      </template>

      <template #item.aksi="{ item }">
        <div class="invoice-row-actions">
          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                icon="mdi-dots-horizontal"
                size="small"
                variant="text"
                color="grey-darken-1"
                class="invoice-action-trigger"
                aria-label="Buka menu aksi invoice"
              />
            </template>
            <v-list density="compact" min-width="195" class="invoice-action-menu">
              <v-list-item
                :to="`/admin/invoice/${item.id}`"
                prepend-icon="mdi-eye-outline"
                title="Detail invoice"
              />
            </v-list>
          </v-menu>
        </div>
      </template>

      <template #no-data>
        <div class="invoice-empty-state">
          <v-icon size="34" color="grey-lighten-1" icon="mdi-receipt-text-check-outline" />
          <div>
            {{ data.searchInvoice ? "Invoice selesai tidak ditemukan" : "Belum ada invoice selesai" }}
          </div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from "vue";
import moment from "moment";
import { useinvoiceStore } from "~/stores/invoiceStore";

definePageMeta({ layout: "admin" });

const invoiceStore = useinvoiceStore();
const notificationStore = useNotificationStore();

const data = reactive({
  searchInvoice: "",
  headInvoice: [
    { title: "No", value: "no", width: "48px", align: "center" as const, sortable: false },
    { title: "Date", value: "tanggal", sortable: true, width: "116px" },
    { title: "Invoice Ref", value: "no_inv", sortable: true, width: "190px" },
    { title: "Client", value: "nama_customer", sortable: true, width: "250px" },
    { title: "Based On", value: "no_penawaran", sortable: true, width: "150px" },
    { title: "Subject", value: "perihal", sortable: true, width: "220px" },
    { title: "Total Amount", value: "grandtotal_invoice", sortable: true, width: "155px", align: "end" as const },
    { title: "Status", value: "status", sortable: true, width: "104px" },
    { title: "Action", value: "aksi", sortable: false, width: "58px", align: "center" as const },
  ],
});

const completedInvoices = computed(() =>
  invoiceStore.getDataInvoice.filter((invoice) => invoice.status === "Selesai"),
);

const displayedInvoices = computed(() => {
  const query = data.searchInvoice.trim().toLocaleLowerCase("id-ID");
  if (!query) return completedInvoices.value;

  return completedInvoices.value.filter((invoice) =>
    [
      invoice.no_inv,
      invoice.no_penawaran,
      invoice.nama_customer,
      invoice.vessel,
      invoice.pic,
      invoice.perihal,
      invoice.status,
      invoice.grandtotal_invoice,
    ].some((value) =>
      String(value ?? "").toLocaleLowerCase("id-ID").includes(query),
    ),
  );
});

onMounted(async () => {
  useloadingStore().setLoading(true);
  try {
    await invoiceStore.tarikDataInvoiceAct();
  } finally {
    useloadingStore().setLoading(false);
  }
});

function invoiceYear(date: string) {
  const parsedDate = moment(date, "YYYY-MM-DD", true);
  return parsedDate.isValid() ? parsedDate.format("YYYY") : moment().format("YYYY");
}

async function refreshData() {
  useloadingStore().setLoading(true);
  try {
    sessionStorage.removeItem("invoice");
    await invoiceStore.tarikDataInvoiceAct();
    notificationStore.showSuccess("Data berhasil diperbarui");
  } finally {
    useloadingStore().setLoading(false);
  }
}
</script>

<style scoped>
* { box-sizing: border-box; }

.invoice-page-heading {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-end;
  justify-content: center;
  gap: 20px;
  text-align: center;
}
.invoice-page-heading h1 { margin: 0; color: #1f2937; font-size: 20px; font-weight: 700; letter-spacing: -.02em; line-height: 1.3; }
.invoice-page-heading p { margin: 3px 0 0; color: #7b8490; font-size: 11px; line-height: 1.4; }

.invoice-list-card { overflow: hidden; background: #fff; border: 1px solid #dfe3e8; border-radius: 8px !important; box-shadow: 0 1px 2px rgba(15, 23, 42, .025) !important; }
.invoice-list-toolbar { display: flex; min-height: 58px; padding: 11px 14px; align-items: center; justify-content: space-between; gap: 18px; }
.invoice-list-search { display: flex; height: 34px; max-width: 500px; padding: 0 5px 0 10px; flex: 1 1 410px; align-items: center; gap: 7px; color: #8993a0; background: #fff; border: 1px solid #d6dbe1; border-radius: 5px; transition: border-color .15s ease, box-shadow .15s ease; }
.invoice-list-search:focus-within { border-color: #7da5cc; box-shadow: 0 0 0 2px rgba(49, 95, 140, .08); }
.invoice-list-search-field { min-width: 0; flex: 1 1 auto; }
.invoice-list-search :deep(.form-group),
.invoice-list-search :deep(.input-wrapper) { height: 32px; }
.invoice-list-search :deep(.input-field) { height: 32px !important; min-height: 32px !important; padding: 5px 0 !important; overflow: hidden; font-size: 11px !important; line-height: 20px !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; resize: none; }

.invoice-list-tools { display: flex; flex: 0 0 auto; align-items: center; gap: 7px; }
.invoice-result-count { margin-right: 5px; color: #858f9b; font-size: 10px; font-weight: 600; white-space: nowrap; }
.completed-filter { display: inline-flex; height: 30px; padding: 0 10px; align-items: center; gap: 5px; color: #39735d; font-size: 9px; font-weight: 650; background: #f1f8f5; border: 1px solid #d6e9e0; border-radius: 4px; white-space: nowrap; }
.invoice-refresh-btn { width: 30px !important; height: 30px !important; color: #65717f !important; border-radius: 4px !important; }

.invoice-list-table { color: #344050; font-size: 11px; }
.invoice-list-table :deep(table) { min-width: 1320px; }
.invoice-list-table :deep(.v-data-table__th) { height: 37px !important; padding: 0 12px !important; color: #697586 !important; font-size: 9px !important; font-weight: 700 !important; letter-spacing: .055em !important; text-transform: uppercase; background: #f7f8fa !important; border-bottom: 1px solid #dfe3e8 !important; }
.invoice-list-table :deep(.v-data-table-header__content) { gap: 3px; }
.invoice-list-table :deep(.v-data-table__td) { height: 56px !important; padding: 8px 12px !important; line-height: 1.35; vertical-align: middle; border-bottom-color: #edf0f2 !important; }
.invoice-list-table :deep(tbody tr) { transition: background-color .12s ease; }
.invoice-list-table :deep(tbody tr:hover > td) { background: #fafbfd !important; }

.invoice-row-index { color: #9aa3ae; font-size: 10px; font-variant-numeric: tabular-nums; }
.invoice-date-cell { color: #556170; font-size: 10.5px; white-space: nowrap; }
.invoice-reference { display: inline-flex; align-items: center; gap: 4px; color: #285f91; font-size: 10.5px; font-weight: 700; letter-spacing: .005em; text-decoration: none; white-space: nowrap; }
.invoice-reference:hover,
.invoice-quotation-reference:hover { color: #174a79; text-decoration: underline; text-underline-offset: 3px; }
.invoice-client-cell { min-width: 210px; max-width: 260px; }
.invoice-client-name { overflow: hidden; color: #273444; font-size: 11px; font-weight: 700; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
.invoice-client-meta { display: flex; min-width: 0; margin-top: 4px; overflow: hidden; align-items: center; gap: 6px; color: #7a8592; font-size: 9.5px; white-space: nowrap; }
.invoice-client-meta span { display: inline-flex; min-width: 0; max-width: 105px; align-items: center; gap: 3px; overflow: hidden; text-overflow: ellipsis; }
.invoice-client-meta i { flex: 0 0 3px; width: 3px; height: 3px; background: #dfe4e8; border-radius: 50%; }
.invoice-quotation-reference { color: #526f88; font-size: 10px; font-weight: 650; text-decoration: none; white-space: nowrap; }
.invoice-subject-cell { display: -webkit-box; min-width: 170px; max-width: 230px; overflow: hidden; color: #556170; line-height: 1.42; overflow-wrap: anywhere; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.invoice-amount-cell { display: block; color: #273444; font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
.invoice-empty-value { color: #9ba4ae; }
.invoice-table-status { height: 22px !important; padding-inline: 8px !important; font-size: 9px !important; font-weight: 700 !important; letter-spacing: .015em !important; border-radius: 4px !important; }
.invoice-row-actions { display: flex; align-items: center; justify-content: center; }
.invoice-action-trigger { width: 28px !important; height: 28px !important; border-radius: 4px !important; }
.invoice-action-trigger:hover { color: #26384b !important; background: #eef1f4 !important; }
.invoice-action-menu { padding: 4px !important; border: 1px solid #dfe3e8; border-radius: 6px !important; box-shadow: 0 10px 28px rgba(15, 23, 42, .12) !important; }
.invoice-action-menu :deep(.v-list-item) { min-height: 32px !important; padding-inline: 9px !important; border-radius: 4px !important; }
.invoice-action-menu :deep(.v-list-item-title) { font-size: 10.5px !important; font-weight: 500; }
.invoice-action-menu :deep(.v-list-item__prepend > .v-icon) { margin-inline-end: 9px !important; font-size: 16px !important; }
.invoice-empty-state { padding: 44px 16px; color: #8a949f; font-size: 11px; text-align: center; }
.invoice-empty-state .v-icon { display: block; margin: 0 auto 8px; }

@media (max-width: 700px) {
  .invoice-list-toolbar { align-items: stretch; flex-direction: column; gap: 9px; }
  .invoice-list-search { width: 100%; max-width: none; flex-basis: auto; }
  .invoice-list-tools { justify-content: flex-end; }
}

@media (max-width: 599px) {
  .invoice-page-heading { margin-bottom: 12px; }
  .invoice-page-heading h1 { font-size: 18px; }
  .invoice-page-heading p { max-width: 290px; }
  .invoice-list-toolbar { padding: 10px; }
  .invoice-list-tools { justify-content: space-between; }
  .invoice-result-count { margin-right: auto; }
  .completed-filter { padding-inline: 8px; }
}
</style>
