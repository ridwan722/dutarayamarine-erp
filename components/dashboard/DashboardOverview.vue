<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useDashboardAnalytics } from "./useDashboardAnalytics";
import DashboardHero from "./DashboardHero.vue";
import DashboardMetricGrid from "./DashboardMetricGrid.vue";
import DashboardTrend from "./DashboardTrend.vue";
import DashboardStatus from "./DashboardStatus.vue";
import DashboardPortfolio from "./DashboardPortfolio.vue";
import DashboardClients from "./DashboardClients.vue";
import DashboardInvoiceCosts from "./DashboardInvoiceCosts.vue";
import DashboardActivity from "./DashboardActivity.vue";
import DashboardQuickLinks from "./DashboardQuickLinks.vue";

const dashboard = useDashboardAnalytics();
const { summary, selectedYear, years, available, ready, loading, errors, lastUpdated, monthly, invoiceStatuses, projectRows, clientRows, invoiceCostSummary, activities, refresh } = dashboard;

onMounted(refresh);

const allCoreAvailable = computed(() => available.value.invoice && available.value.penawaran);
const metricCards = computed(() => [
  { label: "Penawaran", value: available.value.penawaran ? summary.value.quotationCount : null, kind: "number" as const, hint: "Dokumen pada periode ini", icon: "mdi-file-document-edit-outline", tone: "blue", href: "/admin/penawaran" },
  { label: "Nilai penawaran", value: available.value.penawaran ? summary.value.quotationValue : null, kind: "money" as const, hint: summary.value.foreignQuotationCount ? `+ ${summary.value.foreignQuotationCount} non-IDR tidak dijumlahkan` : "Hanya penawaran IDR", icon: "mdi-file-chart-outline", tone: "violet", href: "/admin/penawaran" },
  { label: "Invoice dikirim", value: available.value.invoice ? summary.value.sentValue : null, kind: "money" as const, hint: `${summary.value.sentCount} dokumen menunggu selesai`, icon: "mdi-send-check-outline", tone: "orange", href: "/admin/invoice" },
  { label: "Pengeluaran proyek", value: available.value.penawaran ? summary.value.expenseValue : null, kind: "money" as const, hint: `${summary.value.expenseCount} transaksi tercatat`, icon: "mdi-cash-minus", tone: "rose", href: "/admin/penawaran" },
  { label: "PO vendor", value: available.value.purchaseorder ? summary.value.purchaseCount : null, kind: "number" as const, hint: "Purchase order dari proyek", icon: "mdi-truck-delivery-outline", tone: "violet", href: "/admin/penawaran" },
  { label: "Pemasukan kantor", value: available.value.pettyCash ? summary.value.pettyIn : null, kind: "money" as const, hint: "Dana masuk pada periode ini", icon: "mdi-cash-plus", tone: "green", href: "/admin/petty-cash" },
  { label: "Pengeluaran kantor", value: available.value.pettyCash ? summary.value.pettyOut : null, kind: "money" as const, hint: "Biaya kantor pada periode ini", icon: "mdi-wallet-minus-outline", tone: "orange", href: "/admin/petty-cash" },
  { label: "Selisih keuangan kantor", value: available.value.pettyCash ? summary.value.pettyBalance : null, kind: "money" as const, hint: "Akumulasi dana masuk dikurangi pengeluaran", icon: "mdi-wallet-outline", tone: "blue", href: "/admin/petty-cash" },
]);
const expenseShare = computed(() => {
  if (!available.value.invoice || !available.value.penawaran || !summary.value.invoiceValue) return null;
  return Math.round(summary.value.expenseValue / summary.value.invoiceValue * 100);
});
</script>

<template>
  <div class="dashboard-page">
    <div class="dashboard-inner">
      <DashboardQuickLinks />

      <div class="toolbar"><div class="toolbar-label"><span class="toolbar-dot" /> BUSINESS OVERVIEW <span class="toolbar-separator">/</span> ANALYTICS</div><div class="toolbar-actions"><label class="year-filter"><v-icon icon="mdi-calendar-filter-outline" size="18" /><select v-model.number="selectedYear" aria-label="Pilih tahun dashboard"><option :value="0">Semua tahun</option><option v-for="year in years" :key="year" :value="year">{{ year }}</option></select><v-icon icon="mdi-chevron-down" size="15" /></label><button type="button" class="refresh" :disabled="loading" @click="refresh"><v-icon :icon="loading ? 'mdi-loading' : 'mdi-refresh'" size="18" :class="{ spinning: loading }" /><span>Perbarui</span></button></div></div>

      <div v-if="!ready" class="loading-state"><v-progress-circular indeterminate color="primary" size="35" /><span>Memuat analitik ERP...</span></div>
      <template v-else>
        <div v-if="errors.length" class="warning" role="status"><v-icon icon="mdi-alert-circle-outline" size="21" /><div><strong>Sebagian data belum tersedia.</strong><span>Gagal memuat: {{ errors.join(', ') }}. Angka terkait ditandai “—”; coba perbarui.</span></div></div>
        <DashboardHero :year="selectedYear" :invoice-value="available.invoice ? summary.invoiceValue : null" :paid-value="available.invoice ? summary.paidValue : null" :expense-value="available.penawaran ? summary.expenseValue : null" :invoice-count="available.invoice ? summary.invoiceCount : null" :last-updated="lastUpdated" />
        <div class="section-line"><div><span>01 / BUSINESS SNAPSHOT</span><h2>Angka penting</h2></div><span class="section-caption">Periode {{ selectedYear === 0 ? 'semua tahun' : selectedYear }}</span></div>
        <DashboardMetricGrid :cards="metricCards" />
        <div class="insight-strip"><span class="insight-icon"><v-icon icon="mdi-information-outline" size="19" /></span><p><strong>Pembacaan data:</strong> invoice selesai dipakai sebagai indikasi pembayaran, sedangkan nilai invoice adalah tagihan yang diterbitkan. Biaya proyek hanya berasal dari pengeluaran penawaran; keuangan kantor dicatat terpisah.<template v-if="expenseShare !== null"> Rasio biaya tercatat terhadap nilai invoice periode ini <strong>{{ expenseShare }}%</strong>.</template></p></div>
        <div class="section-line"><div><span>02 / PERFORMANCE</span><h2>Performa & alur</h2></div></div>
        <div class="dashboard-grid grid-performance"><DashboardTrend :rows="monthly" :year="selectedYear" :available="allCoreAvailable" /><DashboardStatus :statuses="invoiceStatuses" :quotation-count="available.penawaran ? summary.quotationCount : null" :linked-quotation-count="allCoreAvailable ? summary.quotedProjectsWithInvoice : null" :available="available.invoice" /></div>
        <div class="section-line"><div><span>03 / PROJECTS & RELATIONSHIPS</span><h2>Detail bisnis</h2></div></div>
        <div class="dashboard-grid grid-details"><DashboardPortfolio :rows="projectRows" :purchase-count="available.purchaseorder ? summary.purchaseCount : null" :purchase-value="available.purchaseorder ? summary.purchaseValue : null" :foreign-purchase-count="summary.foreignPurchaseCount" :available="allCoreAvailable" /><DashboardClients :rows="clientRows" :customer-count="available.customer ? summary.customerCount : null" :vendor-count="available.vendor ? summary.vendorCount : null" :lead-count="available.leads ? summary.leadCount : null" :available="available.invoice" /></div>
        <DashboardInvoiceCosts class="invoice-costs" :rows="invoiceCostSummary.rows" :unassigned-count="invoiceCostSummary.unassignedCount" :unassigned-value="invoiceCostSummary.unassignedValue" :available="allCoreAvailable" />
        <div class="section-line"><div><span>04 / LIVE OPERATIONS</span><h2>Aktivitas terbaru</h2></div></div>
        <DashboardActivity :items="activities" :available="Object.values(available).some(Boolean)" />
        <footer class="dashboard-footer"><span>Duta Raya Marine · ERP Dashboard</span><span>Data aktual dari Firestore · {{ lastUpdated ? `Terakhir dimuat ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : 'Belum dimuat' }}</span></footer>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page{min-height:100%;overflow-x:hidden;background:#f5f8fa;padding:24px clamp(14px,2.5vw,36px) 48px;color:#1b3b4e}.dashboard-inner{min-width:0;max-width:1500px;margin:0 auto}.toolbar{display:flex;align-items:center;justify-content:space-between;gap:15px;margin:14px 0}.toolbar-label{display:flex;align-items:center;gap:9px;font-size:10px;font-weight:800;letter-spacing:.14em;color:#3e7285}.toolbar-dot{width:7px;height:7px;background:#239db4;border-radius:50%}.toolbar-separator{color:#aabdc6}.toolbar-actions{display:flex;align-items:center;gap:9px}.year-filter,.refresh{display:flex;align-items:center;gap:8px;height:36px;border:1px solid #dce7eb;border-radius:10px;background:#fff;color:#3a6679;padding:0 11px;font:inherit;font-size:11px;font-weight:700}.year-filter select{appearance:none;border:0;outline:0;background:transparent;color:inherit;font:inherit;cursor:pointer;min-width:110px}.refresh{cursor:pointer}.refresh:hover,.year-filter:hover{border-color:#87c4d0}.refresh:disabled{opacity:.6;cursor:wait}.spinning{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.warning{display:flex;gap:11px;align-items:flex-start;padding:13px 16px;margin:15px 0;border:1px solid #f4dab0;background:#fff9ee;color:#94611c;border-radius:13px;font-size:11px}.warning div{display:flex;min-width:0;flex-direction:column;gap:3px}.warning span{line-height:1.5;overflow-wrap:anywhere}.loading-state{min-height:55vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#6d8997;font-size:13px}.section-line{display:flex;align-items:flex-end;justify-content:space-between;margin:31px 0 14px}.section-line span:first-child{font-size:10px;font-weight:800;letter-spacing:.13em;color:#3a9bb0}.section-line h2{margin:4px 0 0;font-size:22px;letter-spacing:-.035em;line-height:1.2;color:#1b394d}.section-caption{font-size:11px;color:#91a6b1}.insight-strip{display:flex;align-items:flex-start;gap:11px;margin-top:14px;padding:13px 16px;border-radius:12px;border:1px solid #d9eaf0;background:#eef8fa}.insight-icon{color:#2b93aa;flex:none}.insight-strip p{min-width:0;margin:0;font-size:11px;color:#63808e;line-height:1.65;overflow-wrap:anywhere}.insight-strip strong{color:#286679}.dashboard-grid{display:grid;gap:14px}.dashboard-grid>*{min-width:0}.grid-performance,.grid-details{grid-template-columns:minmax(0,1.45fr) minmax(320px,1fr)}.invoice-costs{margin-top:14px}.dashboard-footer{display:flex;justify-content:space-between;gap:10px;margin-top:25px;padding-top:16px;border-top:1px solid #e2ebef;font-size:10px;color:#9bb0bb}
@media(max-width:1080px){.dashboard-grid{grid-template-columns:1fr}}@media(max-width:600px){.dashboard-page{padding:14px 10px 35px}.toolbar{align-items:flex-start;flex-direction:column}.toolbar-actions{width:100%;min-width:0}.year-filter{min-width:0;flex:1}.year-filter select{min-width:0;flex:1}.section-line{align-items:flex-start;flex-direction:column;gap:5px;margin-top:26px}.section-line h2{font-size:20px}.dashboard-footer{flex-direction:column}}@media(max-width:360px){.refresh span{display:none}.refresh{width:38px;justify-content:center;padding:0}.toolbar-label{letter-spacing:.1em}}
</style>
