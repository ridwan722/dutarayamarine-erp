<script setup lang="ts">
const links = [
  { title: "Penawaran", subtitle: "Kelola proyek & penawaran", href: "/admin/penawaran", icon: "mdi-file-document-edit-outline", tone: "blue" },
  { title: "Invoice", subtitle: "Tagihan dan pembayaran", href: "/admin/invoice", icon: "mdi-receipt-text-outline", tone: "cyan" },
  { title: "Petty cash", subtitle: "Kas operasional", href: "/admin/petty-cash", icon: "mdi-wallet-outline", tone: "green" },
  { title: "Client", subtitle: "Data pelanggan", href: "/admin/master/client", icon: "mdi-account-group-outline", tone: "violet" },
  { title: "Vendor", subtitle: "Mitra pengadaan", href: "/admin/master/vendor", icon: "mdi-storefront-outline", tone: "orange" },
  { title: "Leads web", subtitle: "Prospek masuk", href: "/admin/master/leads-web", icon: "mdi-account-star-outline", tone: "rose" },
];
</script>

<template>
  <section class="panel shortcuts"><div class="overline">AKSES CEPAT</div><h2>Jelajahi workspace</h2><p>Lanjutkan pekerjaan dari modul utama ERP.</p><div class="links"><NuxtLink v-for="link in links" :key="link.href" :to="link.href" class="shortcut"><span class="shortcut-icon" :class="link.tone"><v-icon :icon="link.icon" size="19" /></span><span class="shortcut-copy"><strong>{{ link.title }}</strong><small>{{ link.subtitle }}</small></span><v-icon icon="mdi-arrow-top-right" size="17" class="arrow" /></NuxtLink></div></section>
</template>

<style scoped>
.panel{background:#fff;border:1px solid #e6edf1;border-radius:20px;padding:22px 24px;box-shadow:0 8px 24px rgba(31,62,77,.035)}.overline{font-size:10px;font-weight:800;letter-spacing:.14em;color:#2991ab}h2{margin:6px 0 3px;font-size:19px;letter-spacing:-.025em;color:#18364a}p{margin:0;color:#8ba0ae;font-size:11px}.links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:19px}.shortcut{display:flex;align-items:center;gap:10px;min-width:0;padding:12px;border:1px solid #e9eff2;border-radius:13px;text-decoration:none;color:#244355;transition:background .2s,border-color .2s}.shortcut:hover{background:#f7fbfc;border-color:#b9dce4}.shortcut-icon{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:11px;background:#e8f4fa;color:#3188b0}.shortcut-icon.green{background:#e8f7ef;color:#289267}.shortcut-icon.orange{background:#fff3e9;color:#cb7c35}.shortcut-icon.violet{background:#f0edfb;color:#8061c4}.shortcut-icon.rose{background:#ffedf1;color:#c65b7a}.shortcut-icon.cyan{background:#e6f7f9;color:#1594ae}.shortcut-copy{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}.shortcut-copy strong{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.shortcut-copy small{font-size:9px;color:#95a9b3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.arrow{color:#abc0c9}
@media(max-width:600px){.panel{padding:20px 17px}.links{grid-template-columns:1fr 1fr;gap:7px}.shortcut{padding:9px}.shortcut-icon{width:31px;height:31px}.arrow{display:none}}
</style>
