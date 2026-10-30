<script setup>
import { useDisplay } from "vuetify";
import { useUserStore } from "@/stores/userStore";
import { getAuth, signOut } from "firebase/auth";
import { navigateTo, useRoute } from "#app";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const { mdAndUp } = useDisplay();
const route = useRoute();
const useuser = useUserStore();
const mobileMenuOpen = ref(false);
const currentTime = ref(new Date());
let clockInterval;

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const digitalTime = computed(() => timeFormatter.format(currentTime.value));
const digitalDate = computed(() => dateFormatter.format(currentTime.value));
const clockAriaLabel = computed(
  () => `${digitalDate.value}, pukul ${digitalTime.value} WIB`,
);

onMounted(() => {
  currentTime.value = new Date();
  clockInterval = window.setInterval(() => {
    currentTime.value = new Date();
  }, 1_000);
});

onBeforeUnmount(() => {
  if (clockInterval) window.clearInterval(clockInterval);
});

const menuItems = [
  {
    title: "Dashboard",
    subtitle: "Ringkasan aktivitas ERP",
    to: "/admin/",
    icon: "mdi-view-dashboard-outline",
    exact: true,
  },
  {
    title: "Quotation",
    subtitle: "Penawaran dan proyek",
    to: "/admin/penawaran",
    icon: "mdi-file-edit-outline",
  },
  {
    title: "Invoice",
    subtitle: "Tagihan pelanggan",
    to: "/admin/invoice",
    icon: "mdi-receipt-text-outline",
    exact: true,
  },
  {
    title: "Purchase Order",
    subtitle: "Pesanan untuk vendor",
    to: "/admin/purchase-order",
    icon: "mdi-dolly",
  },
  // {
  //   title: "Invoice Success",
  //   subtitle: "Invoice yang telah selesai",
  //   to: "/admin/invoice/selesai",
  //   icon: "mdi-check-decagram-outline",
  // },
  {
    title: "Master Client",
    subtitle: "Data pelanggan",
    to: "/admin/master/client",
    icon: "mdi-domain",
  },
  {
    title: "Master Vendor",
    subtitle: "Data mitra dan pemasok",
    to: "/admin/master/vendor",
    icon: "mdi-human-dolly",
  },
  {
    title: "Leads Web",
    subtitle: "Prospek yang masuk",
    to: "/admin/master/leads-web",
    icon: "mdi-human-queue",
  },

  {
    title: "Projects Website",
    subtitle: "Daftar Proyek yang di tampikan di website",
    to: "/admin/master/project-web",
    icon: "mdi-format-list-bulleted-square",
  },
  {
    title: "Master Barang / Service",
    subtitle: "Katalog barang dan layanan",
    to: "/admin/master/barang",
    icon: "mdi-package-variant-closed",
  },
  {
    title: "Master T&C",
    subtitle: "Syarat dan ketentuan",
    to: "/admin/master/termcondition",
    icon: "mdi-information-variant-circle-outline",
  },
  {
    title: "Keuangan Kantor",
    subtitle: "Kas dan transaksi kantor",
    to: "/admin/petty-cash",
    icon: "mdi-cash-multiple",
  },
  // {
  //   title: "Report Order",
  //   subtitle: "Laporan pekerjaan",
  //   to: "/admin/report-order",
  //   icon: "mdi-chart-box-outline",
  // },
  {
    title: "Legalitas",
    subtitle: "Dokumen legal perusahaan",
    to: "/admin/legalitas",
    icon: "mdi-file-cloud",
  },
  {
    title: "Penomoran",
    subtitle: "Nomor invoice dan quotation",
    to: "/admin/master/penomoran",
    icon: "mdi-counter",
    bottom: true,
  },
];

const mobileMenuGroups = computed(() => {
  const sectionForItem = (item) => {
    if (item.bottom) return "Pengaturan";
    if (item.to.startsWith("/admin/master/")) return "Master Data";
    if (["/admin/petty-cash", "/admin/legalitas"].includes(item.to)) {
      return "Operasional";
    }
    return "Utama";
  };

  return ["Utama", "Master Data", "Operasional", "Pengaturan"]
    .map((title) => ({
      title,
      items: menuItems.filter((item) => {
        return sectionForItem(item) === title;
      }),
    }))
    .filter((group) => group.items.length);
});

const normalizePath = (path) => {
  const normalized = path.replace(/\/+$/, "");
  return normalized || "/";
};

const breadcrumbs = computed(() => {
  const currentPath = normalizePath(route.path);
  const dashboard = { title: "Dashboard", to: "/admin/" };
  if (currentPath === "/admin") return [dashboard];

  const items = [dashboard];
  if (currentPath.startsWith("/admin/master/")) {
    items.push({ title: "Master Data" });
  }

  const currentMenu = [...menuItems]
    .filter((item) => {
      const itemPath = normalizePath(item.to);
      return (
        itemPath !== "/admin" &&
        (currentPath === itemPath || currentPath.startsWith(`${itemPath}/`))
      );
    })
    .sort(
      (left, right) =>
        normalizePath(right.to).length - normalizePath(left.to).length,
    )[0];

  if (!currentMenu) return items;

  const menuPath = normalizePath(currentMenu.to);
  const isNestedPage = currentPath !== menuPath;
  items.push({
    title: currentMenu.title,
    ...(isNestedPage ? { to: currentMenu.to } : {}),
  });

  if (isNestedPage) {
    const nestedSegments = currentPath
      .slice(menuPath.length)
      .split("/")
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment));
    const nestedLabels = {
      pengeluaran: "Pengeluaran",
      activate: "Aktivasi",
    };
    const pageSegment = nestedSegments.at(-1);
    const pageLabel = nestedLabels[pageSegment];

    if (pageLabel && nestedSegments.length > 1) {
      items.push({ title: nestedSegments[0] });
      items.push({ title: pageLabel });
    } else {
      items.push({ title: pageLabel || nestedSegments[0] });
    }
  }

  return items;
});

watch(mdAndUp, (isDesktop) => {
  if (isDesktop) mobileMenuOpen.value = false;
});

const logout = async () => {
  const auth = getAuth();

  try {
    mobileMenuOpen.value = false;
    await signOut(auth);
    useuser.setUser(null);
    await navigateTo("/");
  } catch (error) {
    console.error("Logout gagal:", error);
  }
};
</script>

<template>
  <div class="top-brand-line" aria-hidden="true" />

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
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        :exact="item.exact"
        :class="[
          'side-nav-item',
          { 'side-nav-item--bottom': item.bottom },
        ]"
        active-class="side-nav-item--active"
      >
        <div class="nav-icon-wrapper">
          <v-icon :icon="item.icon" size="20" />
        </div>
        <v-tooltip
          activator="parent"
          location="end"
          content-class="side-nav-tooltip"
        >
          {{ item.title }}
        </v-tooltip>
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

        <nav v-if="mdAndUp" class="header-breadcrumbs" aria-label="Breadcrumb">
          <span class="header-breadcrumb-divider" aria-hidden="true" />
          <ol>
            <li v-for="(item, index) in breadcrumbs" :key="`${item.title}-${index}`">
              <v-icon
                v-if="index > 0"
                icon="mdi-chevron-right"
                size="14"
                aria-hidden="true"
              />
              <NuxtLink v-if="item.to && index < breadcrumbs.length - 1" :to="item.to">
                {{ item.title }}
              </NuxtLink>
              <span v-else :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined">
                {{ item.title }}
              </span>
            </li>
          </ol>
        </nav>
      </div>
    </template>

    <v-spacer />

    <template #append>
      <div class="header-right">
        <div
          v-if="mdAndUp"
          class="header-clock"
          role="timer"
          :aria-label="clockAriaLabel"
        >
          <span class="header-clock-date">{{ digitalDate }}</span>
          <time class="header-clock-time" :datetime="currentTime.toISOString()">
            {{ digitalTime }} <span class="header-clock-date">WIB</span>
          </time>
        </div>

        <v-menu
          v-if="!mdAndUp"
          v-model="mobileMenuOpen"
          location="bottom end"
          :offset="10"
          :close-on-content-click="true"
        >
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon
              variant="outlined"
              class="mobile-menu-btn"
              aria-label="Buka menu navigasi"
              :aria-expanded="mobileMenuOpen"
            >
              <v-icon :icon="mobileMenuOpen ? 'mdi-close' : 'mdi-menu'" />
            </v-btn>
          </template>

          <v-card class="mobile-menu-card" width="300" elevation="0">
            <div class="mobile-nav-scroll">
              <section v-for="group in mobileMenuGroups" :key="group.title" class="mobile-nav-section">
                <h3>{{ group.title }}</h3>
                <v-list density="compact" nav>
                  <v-list-item
                    v-for="item in group.items"
                    :key="`mobile-${item.to}`"
                    :to="item.to"
                    :exact="item.exact"
                    class="mobile-nav-item"
                    active-class="mobile-nav-item--active"
                    @click="mobileMenuOpen = false"
                  >
                    <template #prepend>
                      <v-icon class="mobile-nav-icon" :icon="item.icon" size="18" />
                    </template>

                    <v-list-item-title>{{ item.title }}</v-list-item-title>

                    <template #append>
                      <v-icon icon="mdi-chevron-right" size="15" />
                    </template>
                  </v-list-item>
                </v-list>
              </section>

            </div>

            <div class="mobile-menu-footer">
              <button type="button" class="mobile-logout-button" @click="logout">
                <v-icon icon="mdi-logout-variant" size="17" />
                Keluar
              </button>
            </div>
          </v-card>
        </v-menu>

        <v-btn
          v-if="mdAndUp"
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

.desktop-side-menu :deep(.v-navigation-drawer__content) {
  overflow: hidden !important;
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
  flex: 1 1 auto;
  min-height: 0;
  flex-direction: column;
  gap: 6px;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  padding-bottom: 12px !important;
  scrollbar-width: none;
  overscroll-behavior: contain;
}

.side-nav-list::-webkit-scrollbar {
  display: none;
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

.side-nav-item--bottom {
  margin-top: auto !important;
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

.side-nav-item:hover {
  background-color: rgba(255, 255, 255, 0.06) !important;
  color: #ffffff !important;
}

.side-nav-item:hover .nav-icon-wrapper .v-icon {
  color: #ffffff;
  transform: scale(1.08);
}

.side-nav-item--active {
  background-color: rgba(220, 38, 38, 0.12) !important;
}

.side-nav-item--active::before {
  content: "";
  position: absolute;
  top: 50%;
  right: -6px;
  width: 8px;
  height: 14px;
  background-color: #ef4444;
  clip-path: polygon(100% 0, 100% 100%, 0 50%);
  transform: translateY(-50%);
}

.side-nav-item--active .nav-icon-wrapper .v-icon {
  color: #ef4444 !important;
}

:global(.side-nav-tooltip) {
  padding: 6px 14px !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 6px !important;
  background: #0f172a !important;
  color: #f8fafc !important;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.3),
    0 4px 6px -4px rgba(0, 0, 0, 0.2) !important;
  font-size: 12.5px !important;
  font-weight: 600 !important;
  letter-spacing: 0.2px !important;
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

.top-brand-line {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 2000;
  height: 3px;
  background: #dc2626;
  pointer-events: none;
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

.header-breadcrumbs {
  display: flex;
  min-width: 0;
  max-width: min(420px, 36vw);
  margin-left: 6px;
  align-items: center;
}

.header-breadcrumb-divider {
  width: 1px;
  height: 28px;
  margin-right: 14px;
  flex: 0 0 auto;
  background: #e2e8f0;
}

.header-breadcrumbs ol {
  display: flex;
  min-width: 0;
  margin: 0;
  padding: 0;
  align-items: center;
  overflow: hidden;
  list-style: none;
}

.header-breadcrumbs li {
  display: flex;
  min-width: 0;
  align-items: center;
  color: #8491a3;
  font-size: 10px;
  font-weight: 550;
  white-space: nowrap;
}

.header-breadcrumbs li:not(:last-child) {
  flex: 0 0 auto;
}

.header-breadcrumbs li:last-child {
  flex: 1 1 auto;
  color: #344256;
  font-weight: 650;
}

.header-breadcrumbs li:last-child > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-breadcrumbs .v-icon {
  margin: 0 5px;
  flex: 0 0 auto;
  color: #b0bac6;
}

.header-breadcrumbs a {
  color: #748195;
  text-decoration: none;
  transition: color 0.15s ease;
}

.header-breadcrumbs a:hover {
  color: #1f6478;
}

.header-clock {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 3px;
  padding-right: 15px;
  border-right: 1px solid #e2e8f0;
  pointer-events: none;
}

.header-clock-time {
  color: #1e293b;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  letter-spacing: 0.045em;
  line-height: 1.1;
}

.header-clock-date {
  color: #6e7b8f;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.015em;
  line-height: 1.2;
  text-transform: capitalize;
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
  gap: 15px;
}

.mobile-menu-btn {
  width: 40px !important;
  height: 40px !important;
  border-color: #dbe3ee !important;
  border-radius: 10px !important;
  background: #ffffff !important;
  color: #334155 !important;
}

.mobile-menu-card {
  width: min(300px, calc(100vw - 16px)) !important;
  overflow: hidden !important;
  border: 1px solid #dce2e8 !important;
  border-radius: 8px !important;
  background: #ffffff !important;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14) !important;
}

.mobile-nav-scroll {
  max-height: min(60vh, 500px);
  padding: 0 7px 7px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.mobile-nav-section h3 {
  margin: 0;
  padding: 10px 8px 4px;
  color: #8b96a5;
  font-size: 8px;
  font-weight: 750;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.mobile-nav-section .v-list {
  padding: 0 !important;
  background: transparent !important;
}

.mobile-nav-item {
  min-height: 42px !important;
  margin-bottom: 1px !important;
  padding-inline: 10px !important;
  border-left: 2px solid transparent !important;
  border-radius: 4px !important;
  color: #3d4a5c !important;
}

.mobile-nav-section .mobile-nav-item:not(:last-child) {
  border-bottom: 1px solid #edf0f3 !important;
}

.mobile-nav-item :deep(.v-list-item__prepend) {
  margin-right: 10px !important;
}

.mobile-nav-item :deep(.v-list-item__append) {
  color: #a5aeba;
}

.mobile-nav-item :deep(.v-list-item-title) {
  font-size: 11px !important;
  font-weight: 650 !important;
}

.mobile-nav-icon {
  color: #697688;
}

.mobile-nav-item:hover {
  background: #f6f7f9 !important;
}

.mobile-nav-item--active {
  color: #243447 !important;
  background: #eef1f4 !important;
  border-left-color: #526579 !important;
}

.mobile-nav-item--active .mobile-nav-icon {
  color: #34465a;
}

.mobile-menu-footer {
  padding: 8px 12px 10px;
  border-top: 1px solid #e8ecf0;
}

.mobile-logout-button {
  display: flex;
  width: 100%;
  height: 34px;
  padding: 0 9px;
  align-items: center;
  gap: 8px;
  color: #9b3d3d;
  background: transparent;
  border: 0;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 650;
  text-align: left;
}

.mobile-logout-button:active {
  background: #faf0f0;
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
