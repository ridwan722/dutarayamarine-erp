<script setup>
import { computed, ref } from "vue";
import { useDisplay } from "vuetify";
import { useUserStore } from "@/stores/userStore";
import { getAuth, signOut } from "firebase/auth";
import { navigateTo } from "#app";

const { mdAndUp } = useDisplay();
const useuser = useUserStore();

/* =========================
   USER
========================= */
const displayname = computed(() => useuser.getDisplayName || "Admin");
const role = computed(() => useuser.getRole || "Administrator");

/* =========================
   QUOTATION FLOW DIALOG
========================= */
const dialogQuotationFlow = ref(false);
const dialogInvoiceFlow = ref(false);
const activeQuotationSlide = ref(0);
const activeInvoiceSlide = ref(0);

const quotationFlowSlides = [
  {
    title: "Buka menu Quotation",
    description:
      "Pilih menu Quotation pada navigasi untuk melihat seluruh daftar penawaran yang sedang dikerjakan.",
    image: "/tutorial/quotation/1.jpeg",
  },
  {
    title: "Buat quotation baru",
    description:
      "Tekan tombol Create New Quotation, lengkapi informasi klien, kapal, item pekerjaan, dan harga penawaran.",
    image: "/tutorial/quotation/2.jpeg",
  },
  {
    title: "Tinjau dan kirim",
    description:
      "Periksa kembali total serta syarat penawaran, lalu simpan quotation.",
    image: "/tutorial/quotation/3.jpeg",
  },
];

const invoiceFlowSlides = [
  {
    title: "Buka menu Quotation",
    description: "Pilih Quotation yang ingin dibuat invoice nya.",
    image: "/tutorial/invoice/1.jpeg",
  },
  {
    title: "Buat Invoice (by Quotation)",
    description: "Tekan tombol Buat Invoice.",
    image: "/tutorial/invoice/2.jpeg",
  },
  {
    title: "Tinjau dan kirim",
    description: "Periksa kembali data sudah sesuai, lalu simpan invoice.",
    image: "/tutorial/invoice/3.jpeg",
  },
  {
    title: "Lihat Hasil",
    description: "Invoice yang dibuat akan ditampilkan di bagian menu invoice",
    image: "/tutorial/invoice/4.jpeg",
  },
];

const openQuotationFlow = () => {
  activeQuotationSlide.value = 0;
  dialogQuotationFlow.value = true;
};
const openInvoiceFlow = () => {
  activeInvoiceSlide.value = 0;
  dialogInvoiceFlow.value = true;
};

const previousQuotationSlide = () => {
  activeQuotationSlide.value = Math.max(0, activeQuotationSlide.value - 1);
};

const nextQuotationSlide = () => {
  activeQuotationSlide.value = Math.min(
    quotationFlowSlides.length - 1,
    activeQuotationSlide.value + 1,
  );
};

const previousInvoiceSlide = () => {
  activeInvoiceSlide.value = Math.max(0, activeInvoiceSlide.value - 1);
};

const nextInvoiceSlide = () => {
  activeInvoiceSlide.value = Math.min(
    invoiceFlowSlides.length - 1,
    activeInvoiceSlide.value + 1,
  );
};

/* =========================
   LOGOUT
========================= */
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
  <!-- DIALOG QUOTATION FLOW -->
  <v-dialog
    v-model="dialogQuotationFlow"
    max-width="900"
    scrollable
    teleport="body"
  >
    <v-card class="quotation-flow-card">
      <v-card-title class="quotation-flow-header">
        <div>
          <div class="quotation-flow-title">Quotation Flow</div>
          <div class="quotation-flow-step">
            Langkah {{ activeQuotationSlide + 1 }} dari
            {{ quotationFlowSlides.length }}
          </div>
        </div>

        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="dialogQuotationFlow = false"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="quotation-flow-content">
        <div class="quotation-flow-visual">
          <img
            :src="quotationFlowSlides[activeQuotationSlide].image"
            :alt="quotationFlowSlides[activeQuotationSlide].title"
            class="quotation-flow-image"
          />
        </div>

        <div class="quotation-flow-description">
          <h3>{{ quotationFlowSlides[activeQuotationSlide].title }}</h3>
          <p>{{ quotationFlowSlides[activeQuotationSlide].description }}</p>
        </div>

        <div class="quotation-flow-dots">
          <button
            v-for="(slide, index) in quotationFlowSlides"
            :key="index"
            type="button"
            class="quotation-flow-dot"
            :class="{
              'quotation-flow-dot--active': activeQuotationSlide === index,
            }"
            :aria-label="`Ke slide ${index + 1}`"
            @click="activeQuotationSlide = index"
          />
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="quotation-flow-actions">
        <v-btn
          variant="text"
          prepend-icon="mdi-arrow-left"
          :disabled="activeQuotationSlide === 0"
          @click="previousQuotationSlide"
        >
          Sebelumnya
        </v-btn>

        <v-spacer />

        <v-btn
          v-if="activeQuotationSlide < quotationFlowSlides.length - 1"
          color="primary"
          variant="flat"
          append-icon="mdi-arrow-right"
          @click="nextQuotationSlide"
        >
          Berikutnya
        </v-btn>

        <v-btn
          v-else
          color="primary"
          variant="flat"
          prepend-icon="mdi-check"
          @click="dialogQuotationFlow = false"
        >
          Selesai
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- DIALOG INVOICE FLOW -->
  <v-dialog
    v-model="dialogInvoiceFlow"
    max-width="900"
    scrollable
    teleport="body"
  >
    <v-card class="quotation-flow-card">
      <v-card-title class="quotation-flow-header">
        <div>
          <div class="quotation-flow-title">Invoice Flow</div>
          <div class="quotation-flow-step">
            Langkah {{ activeInvoiceSlide + 1 }} dari
            {{ invoiceFlowSlides.length }}
          </div>
        </div>

        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="dialogInvoiceFlow = false"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="quotation-flow-content">
        <div class="quotation-flow-visual">
          <img
            :src="invoiceFlowSlides[activeInvoiceSlide].image"
            :alt="invoiceFlowSlides[activeInvoiceSlide].title"
            class="quotation-flow-image"
          />
        </div>

        <div class="quotation-flow-description">
          <h3>{{ invoiceFlowSlides[activeInvoiceSlide].title }}</h3>
          <p>{{ invoiceFlowSlides[activeInvoiceSlide].description }}</p>
        </div>

        <div class="quotation-flow-dots">
          <button
            v-for="(slide, index) in invoiceFlowSlides"
            :key="index"
            type="button"
            class="quotation-flow-dot"
            :class="{
              'quotation-flow-dot--active': activeInvoiceSlide === index,
            }"
            :aria-label="`Ke slide ${index + 1}`"
            @click="activeInvoiceSlide = index"
          />
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="quotation-flow-actions">
        <v-btn
          variant="text"
          prepend-icon="mdi-arrow-left"
          :disabled="activeInvoiceSlide === 0"
          @click="previousInvoiceSlide"
        >
          Sebelumnya
        </v-btn>

        <v-spacer />

        <v-btn
          v-if="activeInvoiceSlide < invoiceFlowSlides.length - 1"
          color="primary"
          variant="flat"
          append-icon="mdi-arrow-right"
          @click="nextInvoiceSlide"
        >
          Berikutnya
        </v-btn>

        <v-btn
          v-else
          color="primary"
          variant="flat"
          prepend-icon="mdi-check"
          @click="dialogInvoiceFlow = false"
        >
          Selesai
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

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
        <span class="nav-title-flyout">Kas</span>
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
  <v-app-bar flat color="white" height="68" class="app-bar-border">
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
          <span class="company-name desktop-company">
            PT. DUTA RAYA MARINE
          </span>

          <span class="company-name mobile-company"> PT. DUTA RAYA MARINE </span>

          <span class="company-subtitle"> Enterprise Management </span>
        </div>

        <v-chip
          size="x-small"
          color="primary"
          variant="outlined"
          class="version-chip"
        >
          V 1.2
        </v-chip>

        <!-- Home Button (Desktop) -->
        <v-btn
          variant="outlined"
          color="primary"
          size="small"
          prepend-icon="mdi-home-outline"
          to="/admin"
          class="text-capitalize font-weight-bold ml-2 d-none d-md-flex"
        >
          Home
        </v-btn>

        <!-- Quotation Flow (Desktop) -->
        <v-tooltip text="Lihat alur Quotation" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              color="grey"
              size="x-small"
              prepend-icon="mdi-help-circle-outline"
              @click="openQuotationFlow"
              class="text-capitalize font-weight-bold ml-1 d-none d-sm-flex"
            >
              Quotation Flow
            </v-btn>
          </template>
        </v-tooltip>

        <!-- Invoice Flow (Desktop) -->
        <v-tooltip text="Lihat alur Invoice" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              color="grey"
              size="x-small"
              prepend-icon="mdi-help-circle-outline"
              @click="openInvoiceFlow"
              class="text-capitalize font-weight-bold d-none d-sm-flex"
            >
              Invoice Flow
            </v-btn>
          </template>
        </v-tooltip>
      </div>
    </template>

    <v-spacer />

    <template #append>
      <div class="header-right">
        <!-- Flow Buttons for Mobile Only -->
        <v-btn
          icon="mdi-file-document-outline"
          variant="tonal"
          color="primary"
          size="x-small"
          class="d-flex d-sm-none mr-1"
          title="Quotation Flow"
          @click="openQuotationFlow"
        />

        <v-btn
          icon="mdi-receipt-outline"
          variant="tonal"
          color="primary"
          size="x-small"
          class="d-flex d-sm-none mr-1"
          title="Invoice Flow"
          @click="openInvoiceFlow"
        />

        <v-btn
          icon
          variant="text"
          size="small"
          color="slate-600"
          class="notification-btn d-none d-sm-flex"
        >
          <v-badge dot color="error" offset-x="-2" offset-y="-2">
            <v-icon size="20"> mdi-bell-outline </v-icon>
          </v-badge>
        </v-btn>

        <v-divider vertical inset class="header-divider d-none d-sm-flex" />

        <v-menu
          rounded="xl"
          transition="slide-y-transition"
          :offset="[12, 0]"
          elevation="16"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              variant="text"
              class="user-profile-btn"
              height="48"
            >
              <v-avatar size="32" class="avatar-shadow">
                <div class="avatar-placeholder text-uppercase font-weight-bold">
                  {{ displayname[0] }}
                </div>
              </v-avatar>

              <div class="user-info d-none d-md-block">
                <p class="user-name">
                  {{ displayname }}
                </p>

                <p class="user-role">
                  {{ role }}
                </p>
              </div>

              <v-icon size="18" class="profile-chevron d-none d-md-block">
                mdi-chevron-down
              </v-icon>
            </v-btn>
          </template>

          <v-card
            min-width="260"
            class="profile-card border-thin overflow-hidden rounded-xl"
          >
            <div class="pa-4 profile-card-header d-flex align-center">
              <v-avatar size="44" class="mr-3 avatar-shadow">
                <div class="avatar-placeholder text-h6 font-weight-bold">
                  {{ displayname[0] }}
                </div>
              </v-avatar>

              <div class="overflow-hidden">
                <div
                  class="text-subtitle-2 font-weight-bold text-slate-900 text-truncate"
                >
                  {{ displayname }}
                </div>

                <v-chip
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  class="mt-1 font-weight-semibold"
                >
                  {{ role }}
                </v-chip>
              </div>
            </div>

            <v-divider />

            <div class="pa-2">
              <v-list density="compact" nav class="bg-transparent pa-0">
                <v-list-item
                  prepend-icon="mdi-shield-account-outline"
                  title="User Management"
                  value="settings"
                  rounded="lg"
                  to="/admin/master/users"
                  class="menu-item py-2"
                />
              </v-list>
            </div>

            <v-divider />

            <div class="pa-2 bg-slate-50">
              <v-btn
                block
                variant="flat"
                color="error-lighten-5"
                class="logout-btn justify-start"
                rounded="lg"
                @click="logout"
              >
                <template #prepend>
                  <v-icon color="error"> mdi-logout-variant </v-icon>
                </template>

                <span class="text-error font-weight-semibold"> Keluar </span>
              </v-btn>
            </div>
          </v-card>
        </v-menu>
      </div>
    </template>
  </v-app-bar>
</template>

<style scoped>
/* =========================================================
   OVERLAY Z-INDEX FIX
========================================================= */
:deep(.v-overlay-container) {
  z-index: 99999 !important;
}

/* =========================================================
   QUOTATION FLOW DIALOG
========================================================= */

.quotation-flow-card {
  border-radius: 20px !important;
  overflow: hidden;
  background: #ffffff;
}

.quotation-flow-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 76px;
  padding: 16px 20px !important;
}

.quotation-flow-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.quotation-flow-step {
  margin-top: 2px;
  font-size: 12px;
  color: #64748b;
}

.quotation-flow-content {
  min-height: 400px;
  padding: 36px 48px 28px !important;
}

.quotation-flow-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.quotation-flow-image {
  width: 100%;
  max-width: 650px;
  max-height: 320px;
  object-fit: contain;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
  transition: all 0.25s ease;
}

.quotation-flow-description {
  max-width: 650px;
  margin: 24px auto 0;
  text-align: center;
}

.quotation-flow-description h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.quotation-flow-description p {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: #64748b;
}

.quotation-flow-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
}

.quotation-flow-dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: #cbd5e1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quotation-flow-dot:hover {
  background: #94a3b8;
}

.quotation-flow-dot--active {
  width: 24px;
  background: #2563eb;
}

.quotation-flow-actions {
  min-height: 72px;
  padding: 12px 20px !important;
}

@media (max-width: 600px) {
  .quotation-flow-content {
    min-height: 340px;
    padding: 28px 20px 24px !important;
  }

  .quotation-flow-image {
    max-height: 200px;
  }

  .quotation-flow-description h3 {
    font-size: 19px;
  }

  .quotation-flow-description p {
    font-size: 13px;
  }

  .quotation-flow-actions {
    padding: 10px 12px !important;
  }
}

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
  height: 68px;
  flex-shrink: 0;
}

.mini-logo-box {
  width: 48px;
  height: 48px;
  background: rgb(255, 255, 255);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
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
  background: rgba(255, 255, 255, 0.96) !important;
  backdrop-filter: blur(8px);
  padding: 0 8px !important;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.logo-box {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-img {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.company-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}

.company-name {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.company-subtitle {
  margin-top: 1px;
  font-size: 10px;
  color: #64748b;
  white-space: nowrap;
}

.version-chip {
  flex-shrink: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.notification-btn {
  border-radius: 10px !important;
}

.header-divider {
  height: 24px;
  margin: 0 6px;
  opacity: 0.2;
}

.user-profile-btn {
  text-transform: none !important;
  border-radius: 12px !important;
  padding: 4px 6px !important;
  min-width: auto !important;
  transition: background-color 0.2s ease;
}

.user-profile-btn:hover {
  background-color: #f8fafc !important;
}

.user-info {
  text-align: left;
  margin-left: 8px;
  min-width: 0;
}

.user-name {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  margin: 1px 0 0;
  font-size: 11px;
  color: #64748b;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-chevron {
  margin-left: 4px;
  color: #94a3b8;
}

.avatar-placeholder {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-shadow {
  box-shadow: 0 2px 6px rgba(220, 38, 38, 0.2);
}

.profile-card {
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.08) !important;
}

.profile-card-header {
  background: #f8fafc;
}

.menu-item {
  color: #475569 !important;
  font-size: 0.875rem !important;
  transition: all 0.15s ease;
}

.menu-item:hover {
  background-color: #f1f5f9 !important;
  color: #0f172a !important;
}

.logout-btn {
  text-transform: none !important;
  letter-spacing: 0;
  background-color: #fef2f2 !important;
  transition: background-color 0.2s ease;
}

.logout-btn:hover {
  background-color: #fee2e2 !important;
}

.text-slate-900 {
  color: #0f172a;
}

.bg-slate-50 {
  background-color: #f8fafc;
}

.mobile-company {
  display: none;
}

@media (max-width: 600px) {
  .desktop-company {
    display: none;
  }

  .mobile-company {
    display: inline;
  }

  .company-subtitle {
    display: none;
  }

  .version-chip {
    display: none;
  }

  .user-profile-btn {
    padding: 2px !important;
    min-width: 36px !important;
    width: 36px !important;
  }
}
</style>
