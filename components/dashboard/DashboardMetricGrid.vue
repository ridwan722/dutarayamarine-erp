<script setup lang="ts">
import { formatDashboardCompactMoney } from "./useDashboardAnalytics";

type Metric = { label: string; value: number | null; kind: "money" | "number"; hint: string; icon: string; tone: string; href?: string };
defineProps<{ cards: Metric[] }>();
const format = (card: Metric) => card.value === null ? "—" : card.kind === "money" ? formatDashboardCompactMoney(card.value) : new Intl.NumberFormat("id-ID").format(card.value);
</script>

<template>
  <div class="metric-grid">
    <component :is="card.href ? 'a' : 'div'" v-for="card in cards" :key="card.label" :href="card.href" class="metric" :class="card.tone">
      <div class="metric-head"><span class="metric-icon"><v-icon :icon="card.icon" size="19" /></span><v-icon v-if="card.href" icon="mdi-arrow-top-right" size="17" class="metric-arrow" /></div>
      <div class="metric-copy"><span>{{ card.label }}</span><strong>{{ format(card) }}</strong><small>{{ card.hint }}</small></div>
    </component>
  </div>
</template>

<style scoped>
.metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.metric{display:flex;flex-direction:column;justify-content:space-between;min-height:149px;padding:18px 19px;border:1px solid #e6edf1;border-radius:18px;background:#fff;color:#193248;text-decoration:none;box-shadow:0 7px 20px rgba(31,62,77,.035);transition:transform .2s,border-color .2s,box-shadow .2s}.metric[href]:hover{transform:translateY(-3px);border-color:#b8d9df;box-shadow:0 12px 26px rgba(31,62,77,.09)}.metric-head{display:flex;align-items:flex-start;justify-content:space-between}.metric-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#e8f4fa;color:#1e779e}.metric.green .metric-icon{background:#e8f7ef;color:#289267}.metric.orange .metric-icon{background:#fff3e9;color:#cb7c35}.metric.violet .metric-icon{background:#f0edfb;color:#8061c4}.metric.rose .metric-icon{background:#ffedf1;color:#c65b7a}.metric-arrow{color:#a2b5c0}.metric-copy{display:flex;flex-direction:column;gap:3px;margin-top:16px}.metric-copy span{font-size:11px;color:#688294;font-weight:600}.metric-copy strong{font-size:23px;letter-spacing:-.035em;line-height:1.2;white-space:nowrap}.metric-copy small{font-size:10px;color:#98abb6;line-height:1.4}
@media(max-width:1100px){.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.metric-grid{gap:9px}.metric{min-width:0;min-height:134px;padding:14px}.metric-copy{min-width:0}.metric-copy strong{font-size:19px;white-space:normal;overflow-wrap:anywhere}}@media(max-width:380px){.metric-grid{grid-template-columns:1fr}.metric{min-height:126px}}
</style>
