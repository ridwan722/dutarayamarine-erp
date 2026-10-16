<script setup lang="ts">
import { formatDashboardCompactMoney } from "./useDashboardAnalytics";
defineProps<{
  rows: { name: string; amount: number; count: number; paid: number }[];
  customerCount: number | null;
  vendorCount: number | null;
  leadCount: number | null;
  available: boolean;
}>();
</script>

<template>
  <section class="panel clients">
    <div class="overline">RELASI BISNIS</div><h2>Client utama</h2><p>Berdasarkan nilai invoice pada periode terpilih.</p>
    <div class="master-stats"><NuxtLink to="/admin/master/client"><v-icon icon="mdi-account-group-outline" size="18" /><strong>{{ customerCount ?? '—' }}</strong><span>Client</span></NuxtLink><NuxtLink to="/admin/master/vendor"><v-icon icon="mdi-storefront-outline" size="18" /><strong>{{ vendorCount ?? '—' }}</strong><span>Vendor</span></NuxtLink><NuxtLink to="/admin/master/leads-web"><v-icon icon="mdi-account-star-outline" size="18" /><strong>{{ leadCount ?? '—' }}</strong><span>Leads*</span></NuxtLink></div>
    <div v-if="!available" class="empty">Data invoice belum dapat dimuat.</div>
    <div v-else-if="!rows.length" class="empty">Belum ada invoice pada periode ini.</div>
    <div v-else class="client-list"><div v-for="(row,index) in rows" :key="`${row.name}-${index}`" class="client-row"><span class="avatar">{{ row.name.slice(0,2).toUpperCase() }}</span><div class="client-name"><strong>{{ row.name }}</strong><span>{{ row.count }} invoice · {{ row.paid }} selesai</span></div><strong class="amount">{{ formatDashboardCompactMoney(row.amount) }}</strong></div></div>
    <small>*Jumlah leads mengikuti periode; client dan vendor adalah total data master.</small>
  </section>
</template>

<style scoped>
.panel{background:#fff;border:1px solid #e6edf1;border-radius:20px;padding:22px 24px;box-shadow:0 8px 24px rgba(31,62,77,.035)}.overline{font-size:10px;font-weight:800;letter-spacing:.14em;color:#2991ab}h2{margin:6px 0 3px;font-size:19px;letter-spacing:-.025em;color:#18364a}p{margin:0;color:#8ba0ae;font-size:11px}.master-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:20px 0 11px}.master-stats a{display:flex;flex-direction:column;gap:5px;padding:13px 10px;border-radius:12px;background:#f3f8fa;color:#2c6680;text-decoration:none}.master-stats a:hover{background:#e9f5f8}.master-stats strong{color:#1e4055;font-size:18px;line-height:1}.master-stats span{color:#8099a7;font-size:10px}.client-list{margin-top:5px}.client-row{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #edf2f4}.client-row:last-child{border-bottom:0}.avatar{display:grid;place-items:center;flex:none;width:34px;height:34px;border-radius:11px;background:#e8f4f8;color:#2c8da9;font-size:10px;font-weight:800}.client-name{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.client-name strong{font-size:11px;color:#234458;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.client-name span{font-size:10px;color:#96a9b3}.amount{white-space:nowrap;font-size:11px;color:#1c6e84}small{display:block;margin-top:12px;color:#9aaebb;font-size:10px;line-height:1.5}.empty{display:grid;place-items:center;min-height:180px;color:#9aaeb8;font-size:12px}
@media(max-width:600px){.panel{padding:20px 17px}}
</style>
