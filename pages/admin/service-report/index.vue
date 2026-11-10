<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { invoiceM, serviceReportM } from "~/types/invoice";
import type { penawaranM } from "~/types/penawaranModel";

interface ServiceReportRow {
  key: string;
  report: serviceReportM;
  quotation?: penawaranM;
  invoice?: invoiceM;
  customer: string;
  vessel: string;
  scope: string;
  updatedAt: number;
}

definePageMeta({ layout: "admin" });

const invoiceStore = useinvoiceStore();
const quotationStore = usePenawaranStore();
const notificationStore = useNotificationStore();
const search = ref("");
const loading = ref(false);
const previewOpen = ref(false);
const activeReport = ref<ServiceReportRow | null>(null);

const headers = [
  {
    title: "No",
    value: "no",
    width: "48px",
    align: "center" as const,
    sortable: false,
  },
  { title: "Report No", value: "reportNo", width: "190px" },
  { title: "Service Period", value: "servicePeriod", width: "180px" },
  { title: "Client / Attention", value: "customer", width: "220px" },
  { title: "Vessel / Project", value: "vessel", width: "210px" },
  { title: "Scope of Work", value: "scope", width: "260px" },
  { title: "Source", value: "source", width: "150px" },
  // { title: "Photos", value: "photos", width: "80px", align: "center" as const },
  {
    title: "Action",
    value: "aksi",
    width: "58px",
    align: "center" as const,
    sortable: false,
  },
];

const reportRows = computed<ServiceReportRow[]>(() => {
  const rows = new Map<string, ServiceReportRow>();

  quotationStore.getDataPenawaran.forEach((quotation) => {
    const report = quotation.service_report;
    if (!report) return;
    const quotationId =
      quotation.id_penawaran ||
      quotation.id ||
      quotation.no_penawaran ||
      "quotation";
    const key = report.reportNo || `quotation-${quotationId}`;
    rows.set(key, {
      key,
      report,
      quotation,
      customer: report.attention || quotation.nama_perusahaan || "—",
      vessel: report.vesselProject || quotation.vessel || "—",
      scope: report.scopeOfWork || quotation.perihal || "—",
      updatedAt:
        Number(
          report.updatedAt ||
            report.createdAt ||
            quotation.updated_at ||
            quotation.created_at,
        ) || 0,
    });
  });

  invoiceStore.getDataInvoice.forEach((invoice) => {
    const report = invoice.service_report;
    if (!report) return;
    const invoiceId =
      invoice.id || invoice.id_invoice || invoice.no_inv || "invoice";
    const key = report.reportNo || `invoice-${invoiceId}`;
    const existing = rows.get(key);
    const invoiceUpdatedAt =
      Number(report.updatedAt || report.createdAt || invoice.createdAt) || 0;
    rows.set(key, {
      key,
      report:
        !existing || invoiceUpdatedAt >= existing.updatedAt
          ? report
          : existing.report,
      quotation: existing?.quotation,
      invoice,
      customer:
        report.attention || invoice.nama_customer || existing?.customer || "—",
      vessel: report.vesselProject || invoice.vessel || existing?.vessel || "—",
      scope: report.scopeOfWork || invoice.perihal || existing?.scope || "—",
      updatedAt: Math.max(invoiceUpdatedAt, existing?.updatedAt || 0),
    });
  });

  return [...rows.values()].sort(
    (left, right) => right.updatedAt - left.updatedAt,
  );
});

const filteredRows = computed(() => {
  const query = search.value.trim().toLocaleLowerCase("id-ID");
  if (!query) return reportRows.value;
  return reportRows.value.filter((row) =>
    [
      row.report.reportNo,
      row.customer,
      row.vessel,
      row.scope,
      row.report.location,
      row.quotation?.no_penawaran,
      row.invoice?.no_inv,
    ].some((value) =>
      String(value || "")
        .toLocaleLowerCase("id-ID")
        .includes(query),
    ),
  );
});

const quotationReportCount = computed(
  () => reportRows.value.filter((row) => row.quotation).length,
);
const invoiceReportCount = computed(
  () => reportRows.value.filter((row) => row.invoice).length,
);
const photoCount = computed(() =>
  reportRows.value.reduce(
    (total, row) => total + (row.report.images?.length || 0),
    0,
  ),
);

function quotationTarget(row: ServiceReportRow) {
  const id = row.quotation?.id_penawaran || row.quotation?.id;
  return id ? `/admin/penawaran/${encodeURIComponent(id)}` : "";
}

function invoiceTarget(row: ServiceReportRow) {
  const id = row.invoice?.id || row.invoice?.id_invoice || row.invoice?.no_inv;
  return id ? `/admin/invoice/${encodeURIComponent(id)}` : "";
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function servicePeriod(report: serviceReportM) {
  const start = formatDate(report.servicePeriodStart);
  const end = formatDate(report.servicePeriodEnd);
  return start === end ? start : `${start} – ${end}`;
}

function openPreview(row: ServiceReportRow) {
  activeReport.value = row;
  previewOpen.value = true;
}

async function loadData(showSuccess = false) {
  if (loading.value) return;
  loading.value = true;
  try {
    await Promise.all([
      invoiceStore.tarikDataInvoiceAct(),
      quotationStore.tarikDataPenawaranAct(),
    ]);
    if (showSuccess)
      notificationStore.showSuccess("Data Service Report berhasil diperbarui");
  } catch (error) {
    console.error("Gagal memuat Service Report:", error);
    notificationStore.showError("Data Service Report gagal dimuat");
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadData());
</script>

<template>
  <v-dialog v-model="previewOpen" max-width="1060" scrollable>
    <v-card class="sr-preview-dialog" elevation="0">
      <header class="sr-preview-header">
        <div>
          <h2>{{ activeReport?.report.reportNo || "Service Report" }}</h2>
          <p>{{ activeReport?.customer }} · {{ activeReport?.vessel }}</p>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Tutup preview"
          @click="previewOpen = false"
        />
      </header>
      <v-card-text class="sr-preview-body">
        <canvas-service-report
          v-if="activeReport"
          :service-report="activeReport.report"
          :invoice="activeReport.invoice"
        />
      </v-card-text>
    </v-card>
  </v-dialog>

  <div class="sr-page-heading">
    <div class="sr-page-title">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        color="grey-darken-3"
        size="small"
        aria-label="Kembali"
        @click="$router.go(-1)"
      />
      <div class="sr-page-title-label">
        <v-icon icon="mdi-hammer-screwdriver" size="22" />
        <h1>Service Report</h1>
      </div>
    </div>
    <v-btn
      to="/admin/penawaran"
      color="primary"
      variant="flat"
      size="small"
      prepend-icon="mdi-file-document-edit-outline"
      class="text-none"
    >
      Buka Quotation
    </v-btn>
  </div>

  <!-- <section class="sr-summary" aria-label="Ringkasan Service Report">
    <article>
      <span><v-icon icon="mdi-clipboard-text-outline" size="18" /></span>
      <div>
        <small>Total Report</small><strong>{{ reportRows.length }}</strong>
      </div>
    </article>
    <article>
      <span><v-icon icon="mdi-file-edit-outline" size="18" /></span>
      <div>
        <small>Dari Quotation</small><strong>{{ quotationReportCount }}</strong>
      </div>
    </article>
    <article>
      <span><v-icon icon="mdi-receipt-text-outline" size="18" /></span>
      <div>
        <small>Terhubung Invoice</small
        ><strong>{{ invoiceReportCount }}</strong>
      </div>
    </article>
    <article>
      <span><v-icon icon="mdi-image-multiple-outline" size="18" /></span>
      <div>
        <small>Total Foto</small><strong>{{ photoCount }}</strong>
      </div>
    </article>
  </section> -->

  <v-card class="sr-list-card" flat>
    <div class="sr-toolbar">
      <div class="sr-search">
        <v-icon icon="mdi-magnify" size="17" />
        <div>
          <a-text-field-new
            v-model="search"
            placeholder="Cari nomor report, client, vessel, atau scope"
          />
        </div>
        <v-btn
          v-if="search"
          icon="mdi-close"
          size="x-small"
          variant="text"
          @click="search = ''"
        />
      </div>
      <div class="sr-tools">
        <span>{{ filteredRows.length }} service report</span>
        <v-btn
          icon="mdi-refresh"
          size="small"
          variant="text"
          :loading="loading"
          aria-label="Refresh"
          @click="loadData(true)"
          ><v-tooltip activator="parent" location="top"
            >Refresh Data</v-tooltip
          ></v-btn
        >
      </div>
    </div>
    <v-divider class="mt-4" />

    <v-data-table
      :headers="headers"
      :items="filteredRows"
      :items-per-page="-1"
      :loading="loading"
      loading-text="Memuat Service Report..."
      density="compact"
      hover
      hide-default-footer
      class="sr-table"
    >
      <template #item.no="{ index }"
        ><span class="sr-row-index">{{ index + 1 }}</span></template
      >
      <template #item.reportNo="{ item }">
        <button type="button" class="sr-reference" @click="openPreview(item)">
          {{ item.report.reportNo || "—"
          }}<v-icon icon="mdi-eye-outline" size="12" />
        </button>
      </template>
      <template #item.servicePeriod="{ item }"
        ><span class="sr-date">{{ servicePeriod(item.report) }}</span></template
      >
      <template #item.customer="{ item }"
        ><div class="sr-primary-cell">
          <strong>{{ item.customer }}</strong
          ><small>{{ item.report.location || "Lokasi belum diisi" }}</small>
        </div></template
      >
      <template #item.vessel="{ item }"
        ><span class="sr-wrap-cell">{{ item.vessel }}</span></template
      >
      <template #item.scope="{ item }"
        ><span class="sr-wrap-cell">{{ item.scope }}</span></template
      >
      <template #item.source="{ item }">
        <div class="sr-source-chips">
          <v-chip
            v-if="item.quotation"
            size="x-small"
            color="indigo"
            variant="tonal"
            >Quotation</v-chip
          >
          <v-chip
            v-if="item.invoice"
            size="x-small"
            color="teal"
            variant="tonal"
            >Invoice</v-chip
          >
        </div>
      </template>
      <!-- <template #item.photos="{ item }"
        ><span class="sr-photo-count"
          ><v-icon icon="mdi-image-outline" size="14" />{{
            item.report.images?.length || 0
          }}</span
        ></template
      > -->
      <template #item.aksi="{ item }">
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }"
            ><v-btn
              v-bind="menuProps"
              icon="mdi-dots-horizontal"
              size="small"
              variant="text"
              aria-label="Buka aksi"
          /></template>
          <v-list density="compact" min-width="205">
            <v-list-item
              prepend-icon="mdi-eye-outline"
              title="Preview report"
              @click="openPreview(item)"
            />
            <v-list-item
              v-if="quotationTarget(item)"
              :to="quotationTarget(item)"
              prepend-icon="mdi-file-edit-outline"
              title="Buka quotation"
            />
            <v-list-item
              v-if="invoiceTarget(item)"
              :to="invoiceTarget(item)"
              prepend-icon="mdi-receipt-text-outline"
              title="Buka invoice"
            />
          </v-list>
        </v-menu>
      </template>
      <template #no-data>
        <div class="sr-empty">
          <v-icon
            icon="mdi-hammer-screwdriver"
            size="36"
            color="grey-lighten-1"
          /><span>{{
            search
              ? "Service Report tidak ditemukan"
              : "Belum ada Service Report"
          }}</span
          ><small>Buat Service Report melalui halaman detail quotation.</small>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<style scoped>
* {
  box-sizing: border-box;
}
.sr-page-heading {
  display: flex;
  margin-bottom: 14px;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}
.sr-page-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}
.sr-page-title-label {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  color: #17384b;
}
.sr-page-title h1 {
  margin: 0;
  color: #17384b;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.04em;
}
.sr-page-title p {
  margin: 3px 0 0;
  color: #8298a5;
  font-size: 11px;
}
.sr-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
  margin-bottom: 12px;
}
.sr-summary article {
  display: flex;
  min-height: 64px;
  padding: 11px 13px;
  align-items: center;
  gap: 10px;
  border: 1px solid #e1e8ed;
  border-radius: 10px;
  background: #fff;
}
.sr-summary article > span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 8px;
  background: #edf4f7;
  color: #28566b;
}
.sr-summary small {
  display: block;
  color: #80919d;
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
}
.sr-summary strong {
  display: block;
  margin-top: 2px;
  color: #253b49;
  font-size: 18px;
  line-height: 1;
}
.sr-list-card,
.sr-preview-dialog {
  overflow: hidden;
  border: 1px solid #e3ebef;
  border-radius: 12px !important;
  background: #fff;
}
.sr-toolbar {
  display: flex;
  padding: 14px 16px 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.sr-search {
  display: flex;
  max-width: 620px;
  height: 38px;
  padding: 0 8px 0 12px;
  flex: 1 1 480px;
  align-items: center;
  gap: 5px;
  border: 1px solid #dfe8ed;
  border-radius: 10px;
  color: #7a929f;
}
.sr-search > div {
  min-width: 0;
  flex: 1;
}
.sr-search :deep(.form-group),
.sr-search :deep(.input-wrapper) {
  height: 32px;
}
.sr-search :deep(.input-field) {
  min-height: 32px;
  padding-inline: 5px;
  border: 0;
  box-shadow: none;
  background: transparent;
}
.sr-tools {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #718b98;
  font-size: 10px;
}
.sr-table :deep(th) {
  height: 38px !important;
  background: #f7f9fa !important;
  color: #71818c !important;
  font-size: 8px !important;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.sr-table :deep(td) {
  height: 52px !important;
  color: #526674;
  font-size: 9px;
}
.sr-row-index {
  color: #91a0aa;
  font-weight: 700;
}
.sr-reference {
  display: inline-flex;
  padding: 0;
  align-items: center;
  gap: 5px;
  border: 0;
  background: transparent;
  color: #176779;
  font-size: 9px;
  font-weight: 750;
  cursor: pointer;
}
.sr-date {
  white-space: nowrap;
}
.sr-primary-cell {
  display: grid;
  gap: 2px;
}
.sr-primary-cell strong {
  color: #344b5a;
  font-size: 9px;
}
.sr-primary-cell small {
  color: #92a0aa;
  font-size: 8px;
}
.sr-wrap-cell {
  display: block;
  min-width: 150px;
  white-space: normal;
  overflow-wrap: anywhere;
}
.sr-source-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.sr-photo-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #607886;
}
.sr-empty {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;
  color: #84949f;
}
.sr-empty small {
  color: #a1adb5;
  font-size: 9px;
}
.sr-preview-header {
  display: flex;
  min-height: 60px;
  padding: 12px 16px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e9ed;
}
.sr-preview-header h2 {
  margin: 0;
  color: #273c4b;
  font-size: 14px;
}
.sr-preview-header p {
  margin: 3px 0 0;
  color: #84939e;
  font-size: 9px;
}
.sr-preview-body {
  padding: 18px !important;
  background: #eef1f4;
}
@media (max-width: 800px) {
  .sr-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 599px) {
  .sr-page-heading {
    align-items: stretch;
    flex-direction: column;
  }
  .sr-page-heading > .v-btn {
    align-self: flex-end;
  }
  .sr-page-title p {
    display: none;
  }
  .sr-toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
  }
  .sr-search {
    width: 100%;
    max-width: none;
    flex-basis: auto;
  }
  .sr-tools {
    justify-content: flex-end;
  }
}
</style>
