<script setup lang="ts">
import { useDisplay } from "vuetify";

definePageMeta({
  layout: "admin",
});

// Penanganan otomatis jika chunk JS gagal dimuat (misal setelah deployment baru Vercel)
onErrorCaptured((err: unknown) => {
  const errorMessage = err instanceof Error ? err.message : String(err);

  if (
    errorMessage.includes("Failed to fetch dynamically imported module") ||
    errorMessage.includes("Importing a module script failed") ||
    errorMessage.includes("Failed to load module script")
  ) {
    // Reload halaman otomatis agar browser mengambil bundle/chunk versi terbaru
    window.location.reload();
    return false; // Hentikan propagasi error
  }
});
</script>

<template>
  <div class="admin-dashboard-page">
    <div class="content-container">
      <!-- Header Banner dengan Brand Color Line -->
      <header class="dashboard-header">
        <div class="header-info">
          <div class="header-tag">ENTERPRISE SYSTEM</div>
          <h1 class="header-title">Ringkasan Sistem & Directory Menu</h1>
        </div>
        <!-- <div class="header-metrics">
          <div class="metric-pill">
            <span class="metric-label">Server</span>
            <span class="metric-value status-online">
              <span class="dot"></span> 
            </span>
          </div>
        </div> -->
      </header>

      <!-- Main Bento Grid -->
      <main class="bento-grid">
        <!-- CARD 1: TRANSACTION CENTER -->
        <section class="bento-card col-span-2">
          <div class="card-header">
            <div class="header-title-group">
              <v-icon
                icon="mdi-file-document-multiple-outline"
                size="18"
                class="header-icon"
              />
              <h2>ERP</h2>
            </div>
            <span class="badge-count">6 Direct Links</span>
          </div>

          <div class="card-body">
            <!-- Sub Group: Quotation -->
            <div>
              <div class="group-header">
                <span class="group-title">QUOTATION (PENAWARAN)</span>
              </div>
              <div class="action-grid-1">
                <NuxtLink to="/admin/penawaran" class="compact-action-card">
                  <div class="action-icon">
                    <v-icon icon="mdi-file-edit-outline" size="18" />
                  </div>
                  <div class="action-text">
                    <span class="title">Quotation</span>
                    <span class="sub">Kelola Penawaran Harga</span>
                  </div>
                  <v-icon icon="mdi-chevron-right" size="16" class="arrow" />
                </NuxtLink>
              </div>
            </div>


            <div>
              <div class="group-header">
                <span class="group-title">INVOICE</span>
              </div>
              <div class="action-grid-2">
                <NuxtLink to="/admin/invoice" class="compact-action-card">
                  <div class="action-icon">
                    <v-icon icon="mdi-receipt-text-outline" size="18" />
                  </div>
                  <div class="action-text">
                    <span class="title">Invoice</span>
                    <span class="sub">Catatan Invoice</span>
                  </div>
                </NuxtLink>

                <NuxtLink
                  to="/admin/invoice/selesai"
                  class="compact-action-card"
                >
                  <div class="action-icon">
                    <v-icon icon="mdi-check-decagram-outline" size="18" />
                  </div>
                  <div class="action-text">
                    <span class="title">Invoice Success</span>
                    <span class="sub">Lunas & selesai</span>
                  </div>
                </NuxtLink>
              </div>
            </div>
            <v-divider class="my-1"></v-divider>
             <!-- Sub Group: Berita Acara -->
            <div class="action-grid-2">
              <NuxtLink to="/admin/delivery-order" class="compact-action-card">
                <div class="action-icon">
                  <v-icon icon="mdi-file-certificate-outline" size="18" />
                </div>
                <div class="action-text">
                  <span class="title">Delivery Order</span>
                  <span class="sub">Kelola BAST & serah terima pekerjaan</span>
                </div>
                <v-icon icon="mdi-chevron-right" size="16" class="arrow" />
              </NuxtLink>
              <NuxtLink to="/admin/berita-acara" class="compact-action-card">
                <div class="action-icon">
                  <v-icon icon="mdi-file-certificate-outline" size="18" />
                </div>
                <div class="action-text">
                  <span class="title">Berita Acara</span>
                  <span class="sub">Kelola BAST & serah terima pekerjaan</span>
                </div>
                <v-icon icon="mdi-chevron-right" size="16" class="arrow" />
              </NuxtLink>
            </div>
          </div>
        </section>

        <section class="bento-card">
          <div class="card-header">
            <div class="header-title-group">
              <v-icon icon="mdi-wallet-outline" size="18" class="header-icon" />
              <h2>MASTER & OPERASIONAL</h2>
            </div>
          </div>

          <div class="card-body">
            <div>
              <div class="group-header">
                <span class="group-title">MASTER DATA & OPERATIONAL</span>
              </div>

              <div class="action-grid-1">
                <NuxtLink
                  to="/admin/master/users"
                  class="compact-action-card"
                >
                 <div class="action-icon">
                  <v-icon icon="mdi-account-group-outline" size="18" />
                </div>
                  <div class="action-text">
                    <span class="title">User</span>
                    <span class="sub"
                      >Kelola akun, role, dan hak akses pengguna</span
                    >
                  </div>
                  <v-icon icon="mdi-arrow-top-right" size="16" class="arrow" />
                </NuxtLink>
              </div>

              <div class="action-grid-1 mt-2">
                <NuxtLink to="/admin/master/client" class="compact-action-card">
                  <div class="action-icon">
                    <v-icon icon="mdi-domain" size="18" />
                  </div>
                  <div class="action-text">
                    <span class="title">Master Client</span>
                    <span class="sub"
                      >Direktori klien dan data kontak perusahaan</span
                    >
                  </div>
                  <v-icon icon="mdi-arrow-top-right" size="16" class="arrow" />
                </NuxtLink>
              </div>

               <div class="action-grid-1 mt-2">
                <NuxtLink to="/admin/master/vendor" class="compact-action-card">
                  <div class="action-icon">
                    <v-icon icon="mdi-human-dolly" size="18" />
                  </div>
                  <div class="action-text">
                    <span class="title">Master Vendor</span>
                    <span class="sub"
                      >Master Vendor / Supplyer</span
                    >
                  </div>
                  <v-icon icon="mdi-arrow-top-right" size="16" class="arrow" />
                </NuxtLink>
              </div>

              <div class="action-grid-1 mt-2">
                <NuxtLink to="/admin/master/termcondition" class="compact-action-card">
                  <div class="action-icon">
                    <v-icon icon="mdi-information-variant-circle-outline" size="18" />
                  </div>
                  <div class="action-text">
                    <span class="title">Master T&C</span>
                    <span class="sub"
                      >Master Term & Condition</span
                    >
                  </div>
                  <v-icon icon="mdi-arrow-top-right" size="16" class="arrow" />
                </NuxtLink>
              </div>

              <div class="action-grid-1 mt-2">
                <NuxtLink to="/admin/master/barang" class="compact-action-card">
                  <div class="action-icon">
                    <v-icon icon="mdi-package-variant-closed" size="18" />
                  </div>
                  <div class="action-text">
                    <span class="title">Master Barang / Service</span>
                    <span class="sub"
                      >Master Barang dan Harga Modal</span
                    >
                  </div>
                  <v-icon icon="mdi-arrow-top-right" size="16" class="arrow" />
                </NuxtLink>
              </div>

              <div class="action-grid-1 mt-2">
                <NuxtLink to="/admin/petty-cash" class="compact-action-card">
                  <div class="action-icon">
                    <v-icon icon="mdi-package-variant-closed" size="18" />
                  </div>
                  <div class="action-text">
                    <span class="title">Kas</span>
                    <span class="sub"
                      >Pengeluaran kantor</span
                    >
                  </div>
                  <v-icon icon="mdi-arrow-top-right" size="16" class="arrow" />
                </NuxtLink>
              </div>
            </div>
          </div>
        </section>

        <section class="bento-card col-span-3">
          <div class="card-header">
            <div class="header-title-group">
              <v-icon
                icon="mdi-database-outline"
                size="18"
                class="header-icon"
              />
              <h2>Report Order</h2>
            </div>
          </div>

          <div class="card-body">
            <div class="action-grid-1">
              <NuxtLink to="/admin/report-order" class="compact-action-card highlight2">
                <div class="action-icon">
                  <v-icon icon="mdi-account-group-outline" size="18" />
                </div>
                <div class="action-text">
                  <span class="title">Report Order</span>
                  <span class="sub">Rekapan order SNS</span>
                </div>
                <v-icon icon="mdi-chevron-right" size="16" class="arrow" />
              </NuxtLink>
            </div>
          </div>
        </section>

        <!-- CARD 3: MASTER DATA -->
        <section class="bento-card col-span-3">
          <div class="card-header">
            <div class="header-title-group">
              <v-icon
                icon="mdi-database-outline"
                size="18"
                class="header-icon"
              />
              <h2>-</h2>
            </div>
          </div>

          <div class="card-body">
            <div class="action-grid-2">
              <NuxtLink class="compact-action-card">
                <div class="action-icon">
                  <v-icon icon="mdi-account-group-outline" size="18" />
                </div>
                <div class="action-text">
                  <span class="title">-</span>
                  <span class="sub"
                    >---</span
                  >
                </div>
                <v-icon icon="mdi-chevron-right" size="16" class="arrow" />
              </NuxtLink>

              <NuxtLink class="compact-action-card">
                <div class="action-icon">
                  <v-icon icon="mdi-domain" size="18" />
                </div>
                <div class="action-text">
                  <span class="title">-</span>
                  <span class="sub"
                    >---</span
                  >
                </div>
                <v-icon icon="mdi-chevron-right" size="16" class="arrow" />
              </NuxtLink>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* =========================================================
   PALET WARNA BRAND LOGO (CYAN, NAVY, RED ACCENT)
========================================================= */

.admin-dashboard-page {
  min-height: 100vh;
  background-color: #f1f5f9;
  color: #0f172a;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 16px;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ---------------------------------------------------------
   HEADER
--------------------------------------------------------- */
.dashboard-header {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-left: 4px solid #f83b3b; /* Merah Brand Logo */
  border-radius: 6px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-tag {
  font-size: 10px;
  font-weight: 800;
  color: #005792; /* Navy Brand Logo */
  letter-spacing: 0.8px;
}

.header-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 2px 0 0 0;
}

.metric-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
}

.metric-label {
  color: #64748b;
}

.status-online {
  color: #15803d;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 6px;
  height: 6px;
  background-color: #22c55e;
  border-radius: 50%;
}

/* ---------------------------------------------------------
   BENTO GRID LAYOUT
--------------------------------------------------------- */
.bento-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.bento-card {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
}

.card-header {
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: #005792; /* Navy Brand Logo */
}

.card-header h2 {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #005792; /* Navy Brand Logo */
  margin: 0;
}

.badge-count {
  font-size: 10px;
  background: #e0f2fe; /* Light Cyan Soft Tint */
  color: #005792;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.card-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.divider {
  height: 1px;
  background-color: #f1f5f9;
  margin: 1px 0;
}

/* ---------------------------------------------------------
   GROUP SECTIONS & CARDS
--------------------------------------------------------- */
.group-header {
  margin-bottom: 3px;
}

.group-title {
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.5px;
}

.compact-action-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  text-decoration: none;
  color: inherit;
  transition: all 0.12s ease;
}

.compact-action-card:hover {
  border-color: #38bdf8; /* Light Cyan Border on Hover */
  background: #f0f9ff;
}

.compact-action-card.highlight {
  border-color: #cbd5e1;
  background: #fafafa;
}

.compact-action-card.highlight:hover {
  border-color: #f83b3b; /* Touch of Red Accent on Hover */
  background: #fff5f5;
}

.compact-action-card.highlight2 {
  border-color: #cbd5e1;
  background: #fafafa;
}

.compact-action-card.highlight2:hover {
  border-color: #1b41ff; /* Touch of Red Accent on Hover */
  background: rgba(0, 110, 255, 0.389);
}

.action-icon {
  width: 30px;
  height: 30px;
  background: #e0f2fe; /* Light Cyan Tint */
  color: #005792; /* Navy Icon Color */
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.12s ease;
}

.action-icon.primary {
  background: #ffe4e6;
  color: #f83b3b;
}

.compact-action-card:hover .action-icon {
  background: #005792; /* Navy Background on Active Hover */
  color: #ffffff;
}

.compact-action-card.highlight:hover .action-icon.primary {
  background: #f83b3b;
  color: #ffffff;
}

.action-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.action-text .title {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.2;
}

.action-text .sub {
  font-size: 10.5px;
  color: #64748b;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow {
  color: #cbd5e1;
}

.compact-action-card:hover .arrow {
  color: #005792;
}

/* GRIDS INSIDE CARDS */
.action-grid-1 {
  display: grid;
  grid-template-columns: 1fr;
}

.action-grid-2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.action-grid-3 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

/* ---------------------------------------------------------
   DESKTOP RESPONSIVE
========================================================= */

@media (min-width: 768px) {
  .admin-dashboard-page {
    padding: 20px;
  }

  .action-grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .col-span-2 {
    grid-column: span 2;
  }

  .col-span-3 {
    grid-column: span 3;
  }
}
</style>