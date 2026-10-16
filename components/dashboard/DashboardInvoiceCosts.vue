<script setup lang="ts">
import { formatDashboardCompactMoney } from "./useDashboardAnalytics";
defineProps<{
  rows: { id: string; number: string; client: string; status: string; invoiceValue: number; expenseValue: number }[];
  unassignedCount: number;
  unassignedValue: number;
  available: boolean;
}>();
</script>

<template>
  <section class="panel costs">
    <div class="panel-head"><div><div class="overline">REKAP PER INVOICE</div><h2>Pengeluaran terkait invoice</h2><p>Biaya penawaran dipasangkan ke invoice melalui <code>invoice_out</code>.</p></div><NuxtLink to="/admin/invoice" class="view-all">Semua invoice <v-icon icon="mdi-arrow-right" size="15" /></NuxtLink></div>
    <div v-if="!available" class="empty">Data invoice atau pengeluaran belum dapat dimuat.</div>
    <div v-else-if="!rows.length" class="empty">Belum ada pengeluaran yang terhubung dengan invoice pada periode ini.</div>
    <div v-else class="cost-table"><div class="table-head"><span>Invoice / Client</span><span>Nilai invoice</span><span>Biaya tercatat</span></div><NuxtLink v-for="row in rows" :key="row.id" :to="`/admin/invoice/${encodeURIComponent(row.id)}`" class="cost-row"><div><strong>#{{ row.number }}</strong><small>{{ row.client }} · {{ row.status }}</small></div><span>{{ formatDashboardCompactMoney(row.invoiceValue) }}</span><strong class="cost-value">{{ formatDashboardCompactMoney(row.expenseValue) }}</strong></NuxtLink></div>
    <div v-if="available && unassignedCount" class="unassigned"><v-icon icon="mdi-alert-circle-outline" size="18" /><span><strong>{{ unassignedCount }} pengeluaran belum terhubung jelas</strong> ({{ formatDashboardCompactMoney(unassignedValue) }}). Periksa proyek tanpa invoice atau dengan beberapa invoice.</span></div>
    <p class="note">Pengeluaran tanpa <code>invoice_out</code> hanya dipasangkan otomatis bila proyek memiliki tepat satu invoice. Biaya ini tidak ditambahkan lagi ke total pengeluaran proyek.</p>
  </section>
</template>

<style scoped>
.panel{background:#fff;border:1px solid #e6edf1;border-radius:20px;padding:22px 24px;box-shadow:0 8px 24px rgba(31,62,77,.035)}.panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:15px}.overline{font-size:10px;font-weight:800;letter-spacing:.14em;color:#2991ab}h2{margin:6px 0 3px;font-size:19px;letter-spacing:-.025em;color:#18364a}p{margin:0;color:#8ba0ae;font-size:11px;line-height:1.5}code{font-size:.95em;background:#f1f6f8;padding:1px 4px;border-radius:4px;color:#3e7487}.view-all{display:flex;align-items:center;gap:4px;white-space:nowrap;color:#1685a5;font-weight:700;text-decoration:none;font-size:11px}.cost-table{margin-top:19px}.table-head,.cost-row{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(100px,.8fr) minmax(100px,.8fr);gap:12px;align-items:center}.table-head{padding:9px 12px;background:#f5f9fa;border-radius:9px;color:#8ba1ad;font-size:10px;font-weight:700}.cost-row{min-height:53px;padding:8px 12px;border-bottom:1px solid #edf2f4;color:#657e8b;text-decoration:none;font-size:11px}.cost-row:hover{background:#f8fbfc}.cost-row>div{display:flex;flex-direction:column;gap:3px;min-width:0}.cost-row>div strong{color:#26485b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cost-row small{color:#99adb7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px}.cost-value{color:#c77e42}.unassigned{display:flex;gap:8px;align-items:flex-start;margin-top:14px;padding:11px 13px;border:1px solid #f0dfbd;border-radius:10px;background:#fffaf0;color:#956d32;font-size:10px;line-height:1.5}.unassigned .v-icon{flex:none}.note{margin-top:12px;color:#9aadb6;font-size:10px}.empty{display:grid;place-items:center;min-height:135px;color:#9aaeb8;text-align:center;font-size:12px}
@media(max-width:600px){.panel{padding:20px 17px}.table-head,.cost-row{grid-template-columns:minmax(0,1.4fr) minmax(80px,.8fr);gap:8px}.table-head span:nth-child(2),.cost-row>span{display:none}}
</style>
