<script setup>
import { useDisplay } from "vuetify";
import { useUserStore } from "@/stores/userStore";
import { getAuth, signOut } from "firebase/auth";
import { navigateTo } from "#app";

const { mdAndUp } = useDisplay();
const useuser = useUserStore();

const logout = async () => {
  const auth = getAuth();

  try {
    await signOut(auth);
    useuser.setUser(null);
    await navigateTo("/");
  } catch (error) {
    console.error("Logout gagal:", error);
  }
};
</script>

<template>
  <!-- SIDE NAVIGATION DRAWER -->
  <v-navigation-drawer
    v-if="mdAndUp"
    permanent
    rail
    width="72"
    rail-width="72"
    class="desktop-side-menu"
  >
    <div class="side-brand-header">
      <div class="mini-logo-box">
        <img src="/Logo-DRM.png" alt="DRM Logo" class="mini-logo-img" />
      </div>
    </div>

    <v-divider class="mx-3 my-2 border-opacity-25" />

    <v-list nav density="compact" class="side-nav-list px-2">
      <v-list-item
        to="/admin/"
        class="side-nav-item"
        active-class="side-nav-item--active"
        exact
      >
        <div class="nav-icon-wrapper">
          <v-icon size="20">mdi-view-dashboard-outline</v-icon>
        </div>
        <span class="nav-title-flyout">Dashboard</span>
      </v-list-item>

      <v-list-item
        to="/admin/penawaran"
        class="side-nav-item"
        active-class="side-nav-item--active"
      >
        <div class="nav-icon-wrapper">
          <v-icon size="20">mdi-file-edit-outline</v-icon>
        </div>
        <span class="nav-title-flyout">Quotation</span>
      </v-list-item>

      <v-list-item
        to="/admin/invoice"
        class="side-nav-item"
        active-class="side-nav-item--active"
        exact
      >
        <div class="nav-icon-wrapper">
          <v-icon size="20">mdi-receipt-text-outline</v-icon>
        </div>
        <span class="nav-title-flyout">Invoice</span>
      </v-list-item>

      <v-list-item
        to="/admin/invoice/selesai"
        class="side-nav-item"
        active-class="side-nav-item--active"
      >
        <div class="nav-icon-wrapper">
          <v-icon size="20">mdi-check-decagram-outline</v-icon>
        </div>
        <span class="nav-title-flyout">Invoice Success</span>
      </v-list-item>

      <!-- <v-list-item
        to="/admin/berita-acara"
        class="side-nav-item"
        active-class="side-nav-item--active"
      >
        <div class="nav-icon-wrapper">
          <v-icon size="20">mdi-file-certificate-outline</v-icon>
        </div>
        <span class="nav-title-flyout">Berita Acara</span>
      </v-list-item> -->

      <v-list-item
        to="/admin/master/client"
        class="side-nav-item"
        active-class="side-nav-item--active"
      >
        <div class="nav-icon-wrapper">
          <v-icon size="20">mdi-domain</v-icon>
        </div>
        <span class="nav-title-flyout">Master Client</span>
      </v-list-item>

      <v-list-item
        to="/admin/master/vendor"
        class="side-nav-item"
        active-class="side-nav-item--active"
      >
        <div class="nav-icon-wrapper">
          <v-icon size="20">mdi-human-dolly</v-icon>
        </div>
        <span class="nav-title-flyout">Master Vendor</span>
      </v-list-item>

      <v-list-item
        to="/admin/master/leads-web"
        class="side-nav-item"
        active-class="side-nav-item--active"
      >
        <div class="nav-icon-wrapper">
          <v-icon size="20">mdi-human-queue</v-icon>
        </div>
        <span class="nav-title-flyout">Leads Web</span>
      </v-list-item>

      <v-list-item
        to="/admin/master/barang"
        class="side-nav-item"
        active-class="side-nav-item--active"
      >
        <div class="nav-icon-wrapper">
          <v-icon size="20">mdi-package-variant-closed</v-icon>
        </div>
        <span class="nav-title-flyout">Master Barang / Service</span>
      </v-list-item>

      <v-list-item
        to="/admin/master/termcondition"
        class="side-nav-item"
        active-class="side-nav-item--active"
      >
        <div class="nav-icon-wrapper">
          <v-icon size="20">mdi-information-variant-circle-outline</v-icon>
        </div>
        <span class="nav-title-flyout">Master T&C</span>
      </v-list-item>

      <v-list-item
        to="/admin/petty-cash"
        class="side-nav-item"
        active-class="side-nav-item--active"
      >
        <div class="nav-icon-wrapper">
          <v-icon size="20">mdi-cash-multiple</v-icon>
        </div>
        <span class="nav-title-flyout">Keuangan Kantor</span>
      </v-list-item>

      <v-list-item
        to="/admin/report-order"
        class="side-nav-item"
        active-class="side-nav-item--active"
      >
        <div class="nav-icon-wrapper">
          <v-icon size="20">mdi-chart-box-outline</v-icon>
        </div>
        <span class="nav-title-flyout">Report Order</span>
      </v-list-item>

      <v-list-item
        to="/admin/legalitas"
        class="side-nav-item"
        active-class="side-nav-item--active"
      >
        <div class="nav-icon-wrapper">
          <v-icon size="20">mdi-file-cloud</v-icon>
        </div>
        <span class="nav-title-flyout">Legalitas</span>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>

  <!-- APP BAR / TOP HEADER -->
  <v-app-bar flat height="72" class="app-bar-border">
    <template #prepend>
      <div class="header-left">
        <div v-if="!mdAndUp" class="logo-box">
          <img
            src="/Logo-DRM.png"
            alt="PT. DUTA RAYA MARINE"
            class="logo-img"
          />
        </div>

        <div class="company-info">
          <span class="company-name">PT. DUTA RAYA MARINE</span>
          <span class="company-subtitle">Enterprise Resource Planning</span>
        </div>

        <span class="portal-label d-none d-sm-inline-flex">Admin Portal</span>
      </div>
    </template>

    <v-spacer />

    <template #append>
      <div class="header-right">
        <v-btn
          variant="outlined"
          prepend-icon="mdi-logout-variant"
          class="logout-btn"
          aria-label="Keluar dari aplikasi"
          title="Keluar"
          @click="logout"
        >
          <span class="logout-label">Keluar</span>
        </v-btn>
      </div>
    </template>
  </v-app-bar>
</template>

<style scoped>
/* =========================================================
   CORPORATE MINIMALIST SIDE NAVIGATION DRAWER
========================================================= */

.desktop-side-menu {
  border-right: 1px solid #e2e8f0 !important;
  background-color: #0f172a !important;
  overflow: visible !important;
}

:deep(.v-navigation-drawer__content) {
  overflow: visible !important;
  display: flex;
  flex-direction: column;
}

.side-brand-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 72px;
  flex-shrink: 0;
}

.mini-logo-box {
  width: 50px;
  height: 50px;
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  transition: all 0.2s ease;
}

.mini-logo-box:hover {
  background: rgba(255, 255, 255, 0.15);
}

.mini-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.side-nav-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: visible !important;
}

.side-nav-item {
  position: relative !important;
  border-radius: 10px !important;
  color: #94a3b8 !important;
  height: 44px !important;
  min-height: 44px !important;
  padding: 0 !important;
  margin-bottom: 0 !important;
  overflow: visible !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.side-nav-item :deep(.v-list-item__content) {
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: visible !important;
}

.side-nav-item :deep(.v-list-item__overlay) {
  border-radius: 10px !important;
}

.nav-icon-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-icon-wrapper .v-icon {
  color: #94a3b8;
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.nav-title-flyout {
  position: absolute;
  left: 56px;
  top: 50%;
  transform: translateY(-50%);
  background-color: #0f172a;
  color: #f8fafc;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.2px;
  white-space: nowrap;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.3),
    0 4px 6px -4px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.12);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 999;
}

.side-nav-item:hover {
  background-color: rgba(255, 255, 255, 0.06) !important;
  color: #ffffff !important;
}

.side-nav-item:hover .nav-icon-wrapper .v-icon {
  color: #ffffff;
  transform: scale(1.08);
}

.side-nav-item:hover .nav-title-flyout {
  opacity: 1;
  visibility: visible;
  left: 62px;
}

.side-nav-item--active {
  background-color: rgba(220, 38, 38, 0.12) !important;
}

.side-nav-item--active::before {
  content: "";
  position: absolute;
  left: -8px;
  top: 15%;
  height: 70%;
  width: 3px;
  background-color: #ef4444;
  border-radius: 0 4px 4px 0;
}

.side-nav-item--active .nav-icon-wrapper .v-icon {
  color: #ef4444 !important;
}

/* =========================================================
   APP BAR & UTILITIES
========================================================= */

.app-bar-border {
  border-bottom: 1px solid #e2e8f0 !important;
  background: rgba(255, 255, 255, 0.98) !important;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03) !important;
  backdrop-filter: blur(12px);
  padding: 0 18px !important;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.logo-box {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.06);
}

.logo-img {
  width: 46px;
  height: 46px;
  object-fit: contain;
}

.company-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.15;
}

.company-name {
  font-size: 14px;
  font-weight: 800;
  color: #13243e;
  letter-spacing: 0.045em;
  white-space: nowrap;
}

.company-subtitle {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
  letter-spacing: 0.015em;
  white-space: nowrap;
}

.portal-label {
  align-items: center;
  height: 24px;
  margin-left: 4px;
  padding: 0 9px;
  border: 1px solid #dbe3ee;
  border-radius: 999px;
  background: #f8fafc;
  color: #526177;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
  flex-shrink: 0;
}

.header-right {
  display: flex;
  align-items: center;
}

.logout-btn {
  min-width: 92px !important;
  height: 38px !important;
  padding: 0 14px !important;
  border-color: #dbe3ee !important;
  border-radius: 10px !important;
  color: #334155 !important;
  text-transform: none !important;
  letter-spacing: 0.01em !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  background: #ffffff !important;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.logout-btn:hover {
  border-color: #fecaca !important;
  color: #b91c1c !important;
  background: #fef2f2 !important;
}

@media (max-width: 600px) {
  .app-bar-border {
    padding: 0 10px !important;
  }

  .header-left {
    gap: 9px;
  }

  .logo-box {
    width: 56px;
    height: 56px;
    border-radius: 13px;
  }

  .logo-img {
    width: 50px;
    height: 50px;
  }

  .company-name {
    max-width: 185px;
    overflow: hidden;
    font-size: 13px;
    line-height: 1.05;
    letter-spacing: 0.01em;
    text-overflow: ellipsis;
  }

  .company-subtitle {
    margin-top: 3px;
    font-size: 9.5px;
  }

  .logout-btn {
    min-width: 40px !important;
    width: 40px !important;
    height: 40px !important;
    padding: 0 !important;
  }

  .logout-btn :deep(.v-btn__prepend) {
    margin: 0 !important;
  }

  .logout-label {
    display: none;
  }
}

@media (max-width: 390px) {
  .company-name {
    max-width: 160px;
    font-size: 12.5px;
  }

  .company-subtitle {
    font-size: 9px;
  }
}
</style>
