<script setup lang="ts">
import type { DashboardActivity } from "./useDashboardAnalytics";
import { formatDashboardCompactMoney, formatDashboardDate } from "./useDashboardAnalytics";
defineProps<{ items: DashboardActivity[]; available: boolean }>();
</script>

<template>
  <section class="panel activity">
    <div class="panel-head"><div><div class="overline">LIVE OPERATIONS</div><h2>Aktivitas terbaru</h2><p>Dokumen dan transaksi pada periode terpilih.</p></div><span class="head-icon"><v-icon icon="mdi-timeline-clock-outline" size="21" /></span></div>
    <div v-if="!available" class="empty">Data aktivitas belum dapat dimuat.</div>
    <div v-else-if="!items.length" class="empty">Belum ada aktivitas pada periode ini.</div>
    <div v-else class="timeline"><NuxtLink v-for="item in items" :key="item.id" :to="item.href" class="event"><span class="event-icon" :class="item.tone"><v-icon :icon="item.icon" size="18" /></span><div class="event-copy"><div><strong>{{ item.title }}</strong><time>{{ formatDashboardDate(item.date) }}</time></div><span>{{ item.description }}</span><small>{{ item.type }}</small></div><span v-if="item.amount !== null" class="event-amount">{{ formatDashboardCompactMoney(item.amount) }}</span></NuxtLink></div>
  </section>
</template>

<style scoped>
.panel{background:#fff;border:1px solid #e6edf1;border-radius:20px;padding:22px 24px;box-shadow:0 8px 24px rgba(31,62,77,.035)}.panel-head{display:flex;justify-content:space-between;gap:12px}.overline{font-size:10px;font-weight:800;letter-spacing:.14em;color:#2991ab}h2{margin:6px 0 3px;font-size:19px;letter-spacing:-.025em;color:#18364a}p{margin:0;color:#8ba0ae;font-size:11px}.head-icon{display:grid;place-items:center;width:39px;height:39px;border-radius:12px;background:#ebf7fa;color:#2693aa}.timeline{margin-top:17px}.event{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #eef2f4;text-decoration:none;color:inherit}.event:last-child{border:0}.event:hover .event-copy strong{color:#188caa}.event-icon{display:grid;place-items:center;flex:none;width:38px;height:38px;border-radius:12px;background:#e8f4fa;color:#3188b0}.event-icon.green{background:#e8f7ef;color:#289267}.event-icon.orange{background:#fff3e9;color:#cb7c35}.event-icon.violet{background:#f0edfb;color:#8061c4}.event-icon.rose{background:#ffedf1;color:#c65b7a}.event-icon.cyan{background:#e6f7f9;color:#1594ae}.event-copy{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.event-copy>div{display:flex;align-items:center;justify-content:space-between;gap:8px}.event-copy strong{font-size:11px;color:#234458;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.event-copy time{font-size:9px;color:#9caeb8;white-space:nowrap}.event-copy span{font-size:10px;color:#79929f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.event-copy small{font-size:9px;color:#21a0b6;font-weight:700}.event-amount{font-size:10px;font-weight:800;color:#315e70;white-space:nowrap}.empty{display:grid;place-items:center;min-height:220px;color:#9aaeb8;font-size:12px}
@media(max-width:600px){.panel{padding:20px 17px}.event-amount{display:none}}
</style>
