<script setup lang="ts">
import { computed } from "vue";
import { formatDashboardCompactMoney, formatDashboardMoney } from "./useDashboardAnalytics";

type Month = { key: string; label: string; invoice: number; paid: number; expense: number };
const props = defineProps<{ rows: Month[]; available: boolean; year: number }>();
const width = 660;
const height = 225;
const left = 48;
const right = 14;
const top = 20;
const bottom = 30;
const plotWidth = width - left - right;
const plotHeight = height - top - bottom;
const maxValue = computed(() => Math.max(1, ...props.rows.flatMap((row) => [row.invoice, row.paid, row.expense])));
const x = (index: number) => left + (index * plotWidth) / 11;
const y = (value: number) => top + plotHeight - (value / maxValue.value) * plotHeight;
const series = computed(() => [
  { key: "invoice" as const, label: "Invoice", color: "#1699c0" },
  { key: "paid" as const, label: "Selesai", color: "#31ad83" },
  { key: "expense" as const, label: "Biaya proyek", color: "#f0a15c" },
].map((item) => ({ ...item, points: props.rows.map((row, index) => `${x(index)},${y(row[item.key])}`).join(" ") })));
const ticks = computed(() => [0, .25, .5, .75, 1].map((fraction) => ({ y: top + (1 - fraction) * plotHeight, value: maxValue.value * fraction })));
const hasData = computed(() => props.rows.some((row) => row.invoice || row.paid || row.expense));
</script>

<template>
  <section class="panel trend">
    <div class="panel-head"><div><div class="overline">PERFORMA KEUANGAN</div><h2>Tren 12 bulan</h2><p>Nilai dokumen dan biaya tercatat per bulan{{ year === 0 ? ' (12 bulan terakhir)' : ` pada ${year}` }}.</p></div><span class="head-icon"><v-icon icon="mdi-chart-line" size="21" /></span></div>
    <div v-if="!available" class="empty">Data invoice atau penawaran belum dapat dimuat.</div>
    <div v-else-if="!hasData" class="empty">Belum ada transaksi pada periode ini.</div>
    <div v-else class="chart-wrap">
      <svg class="chart" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="Grafik tren nilai invoice, invoice selesai, dan biaya proyek per bulan">
        <g v-for="tick in ticks" :key="tick.y"><line :x1="left" :x2="width-right" :y1="tick.y" :y2="tick.y" stroke="#eaf0f2" stroke-dasharray="4 5" /><text :x="left-9" :y="tick.y+3" text-anchor="end" class="axis-text">{{ formatDashboardCompactMoney(tick.value).replace('Rp ', '') }}</text></g>
        <g v-for="(month, index) in rows" :key="month.key"><text :x="x(index)" :y="height-5" text-anchor="middle" class="axis-text">{{ month.label }}</text></g>
        <polyline v-for="line in series" :key="line.key" :points="line.points" fill="none" :stroke="line.color" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <g v-for="line in series" :key="`${line.key}-points`"><circle v-for="(month, index) in rows" :key="month.key" :cx="x(index)" :cy="y(month[line.key])" r="3.3" :fill="line.color" stroke="#fff" stroke-width="1.6"><title>{{ month.label }} · {{ line.label }}: {{ formatDashboardMoney(month[line.key]) }}</title></circle></g>
      </svg>
    </div>
    <div class="legend"><span v-for="line in series" :key="line.key"><i :style="{background:line.color}" />{{ line.label }}</span></div>
    <p class="fine-print">“Selesai” mengikuti status invoice; tanggal pembayaran dipakai bila tersedia. Bukan laporan arus kas terverifikasi.</p>
  </section>
</template>

<style scoped>
.panel{background:#fff;border:1px solid #e6edf1;border-radius:20px;padding:22px 24px;box-shadow:0 8px 24px rgba(31,62,77,.035)}.panel-head{display:flex;justify-content:space-between;gap:12px}.overline{font-size:10px;font-weight:800;letter-spacing:.14em;color:#2991ab}h2{margin:6px 0 3px;font-size:19px;letter-spacing:-.025em;color:#18364a}p{margin:0;color:#8ba0ae;font-size:11px;line-height:1.55}.head-icon{display:grid;place-items:center;width:39px;height:39px;border-radius:12px;background:#ebf7fa;color:#2693aa;flex:none}.chart-wrap{margin:23px -6px 4px;overflow-x:auto}.chart{display:block;width:100%;min-width:530px;height:auto}.axis-text{fill:#9aaeb8;font-family:inherit;font-size:9px}.legend{display:flex;flex-wrap:wrap;gap:10px 20px;margin-top:12px}.legend span{display:flex;align-items:center;gap:7px;font-size:11px;color:#617b8a}.legend i{display:block;width:8px;height:8px;border-radius:50%}.fine-print{margin-top:15px;font-size:10px}.empty{display:grid;place-items:center;min-height:206px;color:#9aaeb8;font-size:12px;text-align:center}
@media(max-width:600px){.panel{padding:20px 17px}}
</style>
