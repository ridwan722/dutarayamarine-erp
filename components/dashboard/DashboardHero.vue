<script setup lang="ts">
import { formatDashboardCompactMoney, formatDashboardDate } from "./useDashboardAnalytics";

defineProps<{
  year: number;
  invoiceValue: number | null;
  paidValue: number | null;
  expenseValue: number | null;
  invoiceCount: number | null;
  lastUpdated: Date | null;
}>();
</script>

<template>
  <section class="hero">
    <div class="hero-copy">
      <div class="eyebrow"><span class="pulse" /> DUTA RAYA MARINE · ERP INTELLIGENCE</div>
      <h1>Selamat datang di<br /><em>command center.</em></h1>
      <p>Ringkasan bisnis, arus dokumen, dan biaya operasional dalam satu pandangan.</p>
      <div class="hero-meta">
        <span><v-icon icon="mdi-calendar-month-outline" size="15" /> {{ year === 0 ? 'Semua tahun' : `Tahun ${year}` }}</span>
        <span v-if="lastUpdated"><v-icon icon="mdi-update" size="15" /> Diperbarui {{ formatDashboardDate(lastUpdated) }}</span>
      </div>
    </div>
    <div class="hero-stats">
      <div class="hero-stat featured">
        <span>Nilai invoice diterbitkan</span>
        <strong>{{ formatDashboardCompactMoney(invoiceValue) }}</strong>
        <small>{{ invoiceCount === null ? 'Data belum tersedia' : `${invoiceCount} dokumen invoice` }}</small>
      </div>
      <div class="hero-stat-grid">
        <div class="hero-stat"><span>Invoice selesai</span><strong>{{ formatDashboardCompactMoney(paidValue) }}</strong><small>Indikasi pembayaran</small></div>
        <div class="hero-stat"><span>Biaya proyek</span><strong>{{ formatDashboardCompactMoney(expenseValue) }}</strong><small>Tercatat di penawaran</small></div>
      </div>
    </div>
    <div class="hero-orbit orbit-one" /><div class="hero-orbit orbit-two" />
  </section>
</template>

<style scoped>
.hero{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr);gap:32px;align-items:center;padding:34px 38px;border-radius:24px;background:linear-gradient(125deg,#09243d 0%,#0c3853 62%,#116277 100%);color:#fff;box-shadow:0 22px 52px rgba(9,45,66,.18)}
.hero-copy,.hero-stats{position:relative;z-index:1}.eyebrow{display:flex;align-items:center;gap:9px;font-size:10px;font-weight:800;letter-spacing:.18em;color:#9ce5e9}.pulse{width:7px;height:7px;border-radius:50%;background:#73e6c4;box-shadow:0 0 0 5px rgba(115,230,196,.14)}h1{margin:17px 0 12px;font-size:clamp(30px,3vw,46px);line-height:1.08;letter-spacing:-.045em;font-weight:800}h1 em{font-style:normal;color:#8bdce5}.hero-copy p{max-width:480px;color:#bdd3e0;font-size:13px;line-height:1.7;margin:0}.hero-meta{display:flex;flex-wrap:wrap;gap:12px 22px;margin-top:27px;color:#b0d4dd;font-size:11px}.hero-meta span{display:flex;align-items:center;gap:6px}.hero-stats{display:grid;gap:10px}.hero-stat{display:flex;flex-direction:column;gap:7px;border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:17px 19px;background:rgba(255,255,255,.08);backdrop-filter:blur(10px)}.hero-stat.featured{padding:21px 23px;background:rgba(255,255,255,.13)}.hero-stat span{font-size:11px;color:#c5e0e7}.hero-stat strong{font-size:25px;line-height:1.1;letter-spacing:-.035em;white-space:nowrap}.hero-stat.featured strong{font-size:32px}.hero-stat small{font-size:10px;color:#abd1d9}.hero-stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.hero-stat-grid strong{font-size:19px}.hero-orbit{position:absolute;border:1px solid rgba(166,229,232,.13);border-radius:50%;pointer-events:none}.orbit-one{width:520px;height:520px;right:-170px;top:-320px}.orbit-two{width:340px;height:340px;left:35%;bottom:-295px}
@media(max-width:850px){.hero{grid-template-columns:1fr;padding:29px;gap:24px}}@media(max-width:520px){.hero{padding:25px 21px;border-radius:20px}.hero-stat-grid{grid-template-columns:1fr 1fr}.hero-stat{padding:14px}.hero-stat strong,.hero-stat-grid strong{font-size:16px}.hero-stat.featured strong{font-size:27px}}
</style>
