<script setup lang="ts">
import { formatDashboardCompactMoney } from "./useDashboardAnalytics";
defineProps<{
  rows: { id: string; name: string; client: string; invoiceValue: number; expenseValue: number; invoiceCount: number }[];
  purchaseCount: number | null;
  purchaseValue: number | null;
  foreignPurchaseCount: number;
  available: boolean;
}>();
</script>

<template>
  <section class="panel portfolio">
    <div class="panel-head"><div><div class="overline">PORTOFOLIO PROYEK</div><h2>Proyek teratas</h2><p>Perbandingan nilai invoice dan pengeluaran yang tercatat.</p></div><NuxtLink to="/admin/penawaran" class="view-all">Semua proyek <v-icon icon="mdi-arrow-right" size="15" /></NuxtLink></div>
    <div v-if="!available" class="empty">Data proyek belum dapat dimuat.</div>
    <div v-else-if="!rows.length" class="empty">Belum ada proyek dengan invoice atau pengeluaran pada periode ini.</div>
    <div v-else class="project-list"><NuxtLink v-for="(row,index) in rows" :key="row.id" :to="`/admin/penawaran/${encodeURIComponent(row.id)}`" class="project-row"><span class="rank">{{ String(index+1).padStart(2,'0') }}</span><div class="project-name"><strong>{{ row.name }}</strong><span>{{ row.client }} · {{ row.invoiceCount }} invoice</span></div><div class="project-amount"><strong>{{ formatDashboardCompactMoney(row.invoiceValue) }}</strong><span>Purchase Order : {{ formatDashboardCompactMoney(row.expenseValue) }}</span></div><v-icon icon="mdi-chevron-right" size="17" class="chevron" /></NuxtLink></div>
    <div class="po-strip"><span class="po-icon"><v-icon icon="mdi-dolly" size="19" /></span><div><span>Purchase order vendor</span><strong>{{ purchaseCount === null ? '—' : `${purchaseCount} dokumen` }}</strong></div><div class="po-value"><strong>{{ formatDashboardCompactMoney(purchaseValue) }}</strong><small v-if="foreignPurchaseCount">+ {{ foreignPurchaseCount }} PO non-IDR, tidak dijumlahkan</small></div></div>
    <p class="note">Invoice dan biaya adalah dua ukuran berbeda; selisihnya bukan laba bersih. PO tidak ditambahkan ke biaya proyek agar tidak menghitung ganda.</p>
  </section>
</template>

<style scoped>
.panel{background:#fff;border:1px solid #e6edf1;border-radius:20px;padding:22px 24px;box-shadow:0 8px 24px rgba(31,62,77,.035)}.panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.overline{font-size:10px;font-weight:800;letter-spacing:.14em;color:#2991ab}h2{margin:6px 0 3px;font-size:19px;letter-spacing:-.025em;color:#18364a}p{margin:0;color:#8ba0ae;font-size:11px;line-height:1.5}.view-all{display:flex;align-items:center;gap:4px;white-space:nowrap;color:#1685a5;font-weight:700;text-decoration:none;font-size:11px}.project-list{margin-top:19px}.project-row{display:flex;align-items:center;gap:13px;min-height:64px;border-top:1px solid #edf2f4;text-decoration:none;color:inherit}.project-row:hover .project-name strong{color:#1789a9}.rank{display:grid;place-items:center;flex:none;width:31px;height:31px;border-radius:9px;background:#f2f7f9;color:#7f9ba8;font-weight:800;font-size:11px}.project-name{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}.project-name strong{color:#1d3b50;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.project-name span,.project-amount span{font-size:10px;color:#91a6b2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.project-amount{display:flex;flex-direction:column;align-items:flex-end;gap:4px;min-width:125px}.project-amount strong{font-size:12px;color:#1b5267;white-space:nowrap}.chevron{color:#a8bbc5}.po-strip{display:flex;align-items:center;gap:12px;margin-top:16px;padding:14px;border:1px solid #e2f0f4;border-radius:13px;background:#f5fbfc}.po-icon{display:grid;place-items:center;flex:none;width:37px;height:37px;border-radius:11px;color:#1987a3;background:#e4f3f7}.po-strip>div{display:flex;flex-direction:column;gap:4px}.po-strip span:not(.po-icon){font-size:10px;color:#75929d}.po-strip strong{font-size:12px;color:#244255}.po-value{margin-left:auto;text-align:right}.po-value small{font-size:9px;color:#91a6b2}.note{margin-top:12px;font-size:10px}.empty{display:grid;place-items:center;min-height:230px;color:#9aaeb8;text-align:center;font-size:12px}
@media(max-width:600px){.panel{padding:20px 17px}.project-row{gap:8px}.rank{width:26px;height:26px}.project-amount{min-width:96px}.chevron{display:none}.po-strip{flex-wrap:wrap}.po-value{width:100%;margin-left:49px;text-align:left}}
</style>
