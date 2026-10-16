<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{
  statuses: { Draft: number; Dikirim: number; Selesai: number; Lainnya: number };
  quotationCount: number | null;
  linkedQuotationCount: number | null;
  available: boolean;
}>();
const total = computed(() => Object.values(props.statuses).reduce((sum, count) => sum + count, 0));
const donut = computed(() => {
  if (!total.value) return "conic-gradient(#e8eef1 0 100%)";
  let from = 0;
  const parts = [
    [props.statuses.Selesai, "#31ad83"],
    [props.statuses.Dikirim, "#1699c0"],
    [props.statuses.Draft, "#f0a15c"],
    [props.statuses.Lainnya, "#9fa8bb"],
  ].map(([count, color]) => { const to = from + Number(count) / total.value * 100; const part = `${color} ${from}% ${to}%`; from = to; return part; });
  return `conic-gradient(${parts.join(",")})`;
});
const rows = computed(() => [
  { label: "Selesai", value: props.statuses.Selesai, color: "#31ad83" },
  { label: "Dikirim", value: props.statuses.Dikirim, color: "#1699c0" },
  { label: "Draft", value: props.statuses.Draft, color: "#f0a15c" },
  { label: "Lainnya", value: props.statuses.Lainnya, color: "#9fa8bb" },
]);
</script>

<template>
  <section class="panel status">
    <div class="overline">ALUR DOKUMEN</div><h2>Status invoice</h2><p>Distribusi dokumen pada periode terpilih.</p>
    <div v-if="!available" class="empty">Data invoice belum dapat dimuat.</div>
    <template v-else>
      <div class="status-main"><div class="donut" :style="{background:donut}"><div class="donut-center"><strong>{{ total }}</strong><span>invoice</span></div></div><div class="status-list"><div v-for="row in rows" :key="row.label" class="status-row"><span><i :style="{background:row.color}" />{{ row.label }}</span><strong>{{ row.value }}</strong></div></div></div>
      <div class="flow"><div><span>Penawaran</span><strong>{{ quotationCount ?? '—' }}</strong></div><v-icon icon="mdi-arrow-right" size="16" /><div><span>Terhubung ke invoice</span><strong>{{ linkedQuotationCount ?? '—' }}</strong></div></div>
      <small class="note">Jumlah terhubung berdasarkan relasi ID penawaran pada invoice; bukan rasio konversi penjualan.</small>
    </template>
  </section>
</template>

<style scoped>
.panel{background:#fff;border:1px solid #e6edf1;border-radius:20px;padding:22px 24px;box-shadow:0 8px 24px rgba(31,62,77,.035)}.overline{font-size:10px;font-weight:800;letter-spacing:.14em;color:#2991ab}h2{margin:6px 0 3px;font-size:19px;letter-spacing:-.025em;color:#18364a}p{margin:0;color:#8ba0ae;font-size:11px}.status-main{display:flex;align-items:center;gap:24px;margin:29px 0 25px}.donut{display:grid;place-items:center;flex:none;width:142px;height:142px;border-radius:50%}.donut-center{display:flex;flex-direction:column;align-items:center;justify-content:center;width:104px;height:104px;border-radius:50%;background:#fff}.donut-center strong{font-size:30px;line-height:1;color:#19384a}.donut-center span{font-size:10px;color:#9aaebb}.status-list{flex:1;min-width:0}.status-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #eff3f5;color:#587486;font-size:11px}.status-row span{display:flex;align-items:center;gap:8px}.status-row i{width:8px;height:8px;border-radius:50%}.status-row strong{color:#213b4f;font-size:12px}.flow{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:13px 15px;background:#f4f8fa;border-radius:13px}.flow div{display:flex;flex-direction:column;gap:4px}.flow span{font-size:10px;color:#77909e}.flow strong{font-size:19px;color:#1e465a}.flow .v-icon{color:#9db3bd}.note{display:block;margin-top:12px;color:#9aaebb;line-height:1.5;font-size:10px}.empty{display:grid;place-items:center;min-height:250px;color:#9aaeb8;font-size:12px;text-align:center}
@media(max-width:600px){.panel{padding:20px 17px}.status-main{gap:16px}.donut{width:118px;height:118px}.donut-center{width:86px;height:86px}}
</style>
