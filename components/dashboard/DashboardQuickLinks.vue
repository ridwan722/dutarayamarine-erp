<script setup lang="ts">
const links = [
  { title: "Penawaran", subtitle: "Kelola proyek & penawaran", href: "/admin/penawaran", icon: "mdi-file-document-edit-outline", tone: "blue" },
  { title: "Invoice", subtitle: "Tagihan dan pembayaran", href: "/admin/invoice", icon: "mdi-receipt-text-outline", tone: "cyan" },
  { title: "Purchase Order", subtitle: "Pesanan ke vendor", href: "/admin/purchase-order", icon: "mdi-clipboard-text-outline", tone: "blue" },
  { title: "Keuangan kantor", subtitle: "Transaksi & inventaris", href: "/admin/petty-cash", icon: "mdi-wallet-outline", tone: "green" },
  { title: "Client", subtitle: "Data pelanggan", href: "/admin/master/client", icon: "mdi-account-group-outline", tone: "violet" },
  { title: "Vendor", subtitle: "Mitra pengadaan", href: "/admin/master/vendor", icon: "mdi-storefront-outline", tone: "orange" },
  { title: "Leads web", subtitle: "Prospek masuk", href: "/admin/master/leads-web", icon: "mdi-account-star-outline", tone: "rose" },
];
</script>

<template>
  <nav class="panel shortcuts" aria-label="Menu utama dashboard">
    <div class="shortcut-heading"><h5>Pilih halaman</h5><p>Buka modul ERP yang ingin dikelola.</p></div>
    <div class="links"><NuxtLink v-for="link in links" :key="link.href" :to="link.href" class="shortcut"><span class="shortcut-icon" :class="link.tone"><v-icon :icon="link.icon" size="19" /></span><span class="shortcut-copy"><strong>{{ link.title }}</strong><small>{{ link.subtitle }}</small></span><v-icon icon="mdi-chevron-right" size="17" class="arrow" /></NuxtLink></div>
  </nav>
</template>

<style scoped>
.panel{display:grid;grid-template-columns:minmax(150px,.55fr) minmax(0,2.45fr);align-items:center;gap:22px;background:#fff;border:1px solid #e6edf1;border-radius:20px;padding:18px 20px;box-shadow:0 8px 24px rgba(31,62,77,.035)}.shortcut-heading{min-width:0}.overline{font-size:10px;font-weight:800;letter-spacing:.14em;color:#2991ab}h2{margin:5px 0 3px;font-size:19px;letter-spacing:-.025em;color:#18364a}p{margin:0;color:#8ba0ae;font-size:11px;line-height:1.45}.links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;min-width:0}.shortcut{display:flex;align-items:center;gap:9px;min-width:0;padding:10px;border:1px solid #e9eff2;border-radius:13px;text-decoration:none;color:#244355;transition:background .2s,border-color .2s,transform .2s}.shortcut:hover{background:#f7fbfc;border-color:#b9dce4;transform:translateY(-1px)}.shortcut-icon{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:11px;background:#e8f4fa;color:#3188b0}.shortcut-icon.green{background:#e8f7ef;color:#289267}.shortcut-icon.orange{background:#fff3e9;color:#cb7c35}.shortcut-icon.violet{background:#f0edfb;color:#8061c4}.shortcut-icon.rose{background:#ffedf1;color:#c65b7a}.shortcut-icon.cyan{background:#e6f7f9;color:#1594ae}.shortcut-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px}.shortcut-copy strong{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.shortcut-copy small{font-size:9px;color:#95a9b3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.arrow{flex:none;color:#abc0c9}
@media(max-width:1050px){.panel{grid-template-columns:1fr;gap:14px}.shortcut-heading p{display:none}}@media(max-width:600px){.panel{gap:12px;padding:15px 13px;border-radius:16px}.links{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.shortcut{padding:9px 8px}.shortcut-icon{width:32px;height:32px}.shortcut-copy small,.arrow{display:none}}@media(max-width:340px){.links{grid-template-columns:1fr}.shortcut-copy small{display:block}}
</style>
