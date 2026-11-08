<script setup>
import { useDisplay } from "vuetify";
import { useUserStore } from "@/stores/userStore";
import { getAuth, signOut } from "firebase/auth";
import { navigateTo, useRoute } from "#app";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { permissionForPath } from "~/utils/access-control";

const { mdAndUp } = useDisplay();
const route = useRoute();
const useuser = useUserStore();
const mobileMenuOpen = ref(false);
const currentTime = ref(new Date());
const isLoggingOut = ref(false);
const workspaceTabs = ref([]);
const workspaceTabsReady = ref(false);
const workspaceTabsScroll = ref(null);
const activeWorkspaceTabId = ref("");
let clockInterval;
let workspaceTabSequence = 0;

const WORKSPACE_TABS_STORAGE_PREFIX = "drm-erp:workspace-tabs:v2";

const accountName = computed(() => {
  const name = useuser.getDisplayName?.trim();
  if (name) return name;

  const emailName = useuser.getEmail?.split("@")[0]?.trim();
  return emailName || "Pengguna ERP";
});

const accountRole = computed(() => useuser.getRole?.trim() || "Pengguna");
const accountEmail = computed(() => useuser.getEmail?.trim() || "-");
const accountPhoto = computed(() => useuser.getUser?.photoURL || "");
const accountInitials = computed(() => {
  const parts = accountName.value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts.at(-1)[0]}`.toUpperCase();
});

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
  restoreWorkspaceTabs();
});

onBeforeUnmount(() => {
  if (clockInterval) window.clearInterval(clockInterval);
});

const allMenuItems = [
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
    title: "Master Users",
    subtitle: "Akun dan hak akses",
    to: "/admin/master/users",
    icon: "mdi-account-cog-outline",
  },
  
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
    title: "Product / Service Website",
    subtitle: "Daftar Proyek yang di tampikan di website",
    to: "/admin/master/product-service",
    icon: "mdi-package",
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

const menuItems = computed(() =>
  allMenuItems.filter((item) => {
    const permission = permissionForPath(item.to);
    return permission ? useuser.canAccess(permission) : false;
  }),
);

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
      items: menuItems.value.filter((item) => {
        return sectionForItem(item) === title;
      }),
    }))
    .filter((group) => group.items.length);
});

const normalizePath = (path) => {
  const normalized = path.replace(/\/+$/, "");
  return normalized || "/";
};

const workspaceStorageKey = computed(() => {
  const accountKey = (useuser.getEmail || useuser.profileId || "default")
    .trim()
    .toLowerCase();
  return `${WORKSPACE_TABS_STORAGE_PREFIX}:${accountKey}`;
});

const workspaceTabMeta = (path) => {
  const currentPath = normalizePath(path);
  const currentMenu = [...menuItems.value]
    .filter((item) => {
      const itemPath = normalizePath(item.to);
      return (
        currentPath === itemPath ||
        (itemPath !== "/admin" && currentPath.startsWith(`${itemPath}/`))
      );
    })
    .sort(
      (left, right) =>
        normalizePath(right.to).length - normalizePath(left.to).length,
    )[0];

  if (!currentMenu) {
    const fallback = currentPath.split("/").filter(Boolean).at(-1) || "Halaman";
    return {
      title: fallback
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
      icon: "mdi-file-outline",
    };
  }

  const menuPath = normalizePath(currentMenu.to);
  if (currentPath === menuPath) {
    return { title: currentMenu.title, icon: currentMenu.icon };
  }

  const nestedSegments = currentPath
    .slice(menuPath.length)
    .split("/")
    .filter(Boolean);
  const nestedPageLabels = {
    pengeluaran: "Pengeluaran",
    activate: "Aktivasi",
    selesai: "Selesai",
  };
  const nestedPage = nestedPageLabels[nestedSegments.at(-1)];

  return {
    title: nestedPage
      ? `${currentMenu.title} · ${nestedPage}`
      : `${currentMenu.title} · Detail`,
    icon: currentMenu.icon,
  };
};

const createWorkspaceTabId = () => {
  workspaceTabSequence += 1;
  return (
    globalThis.crypto?.randomUUID?.() ||
    `workspace-tab-${Date.now()}-${workspaceTabSequence}`
  );
};

const createWorkspaceTab = (path, to = path, id = createWorkspaceTabId()) => {
  const normalizedPath = normalizePath(path);
  const meta = workspaceTabMeta(normalizedPath);
  return {
    id,
    path: normalizedPath,
    to,
    title: meta.title,
    icon: meta.icon,
  };
};

const canOpenWorkspacePath = (path) => {
  const normalizedPath = normalizePath(path);
  if (!/^\/admin(?:\/|$)/.test(normalizedPath)) return false;

  const permission = permissionForPath(normalizedPath);
  return Boolean(permission && useuser.canAccess(permission));
};

const persistWorkspaceTabs = () => {
  if (!workspaceTabsReady.value || !process.client) return;

  try {
    localStorage.setItem(
      workspaceStorageKey.value,
      JSON.stringify({
        activeTabId: activeWorkspaceTabId.value,
        tabs: workspaceTabs.value,
      }),
    );
  } catch (error) {
    console.warn("Tab workspace tidak dapat disimpan:", error);
  }
};

const scrollActiveWorkspaceTabIntoView = async () => {
  await nextTick();
  workspaceTabsScroll.value
    ?.querySelector(".workspace-tab--active")
    ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
};

const scrollWorkspaceEndIntoView = async () => {
  await nextTick();
  workspaceTabsScroll.value
    ?.querySelector(".workspace-add-tab")
    ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
};

const updateActiveWorkspaceTabFromRoute = () => {
  if (!workspaceTabsReady.value || !canOpenWorkspacePath(route.path)) return;

  let activeIndex = workspaceTabs.value.findIndex(
    (tab) => tab.id === activeWorkspaceTabId.value,
  );
  if (activeIndex < 0) {
    activeIndex = 0;
    activeWorkspaceTabId.value = workspaceTabs.value[0]?.id || "";
  }
  if (activeIndex < 0) return;

  const currentPath = normalizePath(route.path);
  const currentTo = route.fullPath || route.path;
  workspaceTabs.value[activeIndex] = createWorkspaceTab(
    currentPath,
    currentTo,
    activeWorkspaceTabId.value,
  );

  persistWorkspaceTabs();
  void scrollActiveWorkspaceTabIntoView();
};

const defaultWorkspaceDestination = () => {
  if (canOpenWorkspacePath("/admin")) {
    return { path: "/admin", to: "/admin/" };
  }

  const fallbackMenu = menuItems.value[0];
  return fallbackMenu
    ? { path: normalizePath(fallbackMenu.to), to: fallbackMenu.to }
    : { path: normalizePath(route.path), to: route.fullPath || route.path };
};

const restoreWorkspaceTabs = () => {
  let savedTabs = [];
  let savedActiveTabId = "";

  try {
    const storedState = JSON.parse(
      localStorage.getItem(workspaceStorageKey.value) || "{}",
    );
    if (Array.isArray(storedState.tabs)) savedTabs = storedState.tabs;
    if (typeof storedState.activeTabId === "string") {
      savedActiveTabId = storedState.activeTabId;
    }
  } catch (error) {
    console.warn("Tab workspace tersimpan tidak dapat dibaca:", error);
  }

  const uniqueIds = new Set();
  workspaceTabs.value = savedTabs
    .filter((tab) => {
      if (
        !tab ||
        typeof tab.id !== "string" ||
        typeof tab.path !== "string"
      ) {
        return false;
      }
      const path = normalizePath(tab.path.split(/[?#]/)[0]);
      if (!canOpenWorkspacePath(path) || uniqueIds.has(tab.id)) return false;
      uniqueIds.add(tab.id);
      return true;
    })
    .map((tab) => {
      const path = normalizePath(tab.path.split(/[?#]/)[0]);
      const savedToPath =
        typeof tab.to === "string"
          ? normalizePath(tab.to.split(/[?#]/)[0])
          : "";
      const savedTo =
        typeof tab.to === "string" && savedToPath === path ? tab.to : path;
      return createWorkspaceTab(path, savedTo, tab.id);
    });

  if (!workspaceTabs.value.length) {
    const defaultDestination = defaultWorkspaceDestination();
    workspaceTabs.value.push(
      createWorkspaceTab(defaultDestination.path, defaultDestination.to),
    );
  }

  activeWorkspaceTabId.value = workspaceTabs.value.some(
    (tab) => tab.id === savedActiveTabId,
  )
    ? savedActiveTabId
    : workspaceTabs.value[0].id;
  workspaceTabsReady.value = true;
  updateActiveWorkspaceTabFromRoute();
};

const navigateToWorkspaceTab = async (tab) => {
  activeWorkspaceTabId.value = tab.id;
  persistWorkspaceTabs();
  void scrollActiveWorkspaceTabIntoView();
  if (tab.to === route.fullPath) return;
  await navigateTo(tab.to);
};

const addWorkspaceTab = async () => {
  const defaultDestination = defaultWorkspaceDestination();
  const newTab = createWorkspaceTab(
    defaultDestination.path,
    defaultDestination.to,
  );
  workspaceTabs.value.push(newTab);
  activeWorkspaceTabId.value = newTab.id;
  persistWorkspaceTabs();
  void scrollWorkspaceEndIntoView();

  if (newTab.to !== route.fullPath) await navigateTo(newTab.to);
};

const closeWorkspaceTab = async (tab) => {
  if (workspaceTabs.value.length <= 1) return;

  const tabIndex = workspaceTabs.value.findIndex(
    (item) => item.id === tab.id,
  );
  if (tabIndex < 0) return;

  const isActive = tab.id === activeWorkspaceTabId.value;
  workspaceTabs.value.splice(tabIndex, 1);
  if (!isActive) {
    persistWorkspaceTabs();
    return;
  }

  const nextTab =
    workspaceTabs.value[tabIndex] || workspaceTabs.value[tabIndex - 1];
  activeWorkspaceTabId.value = nextTab.id;
  persistWorkspaceTabs();
  void scrollActiveWorkspaceTabIntoView();
  if (nextTab.to !== route.fullPath) await navigateTo(nextTab.to);
};

const breadcrumbs = computed(() => {
  const currentPath = normalizePath(route.path);
  const dashboard = { title: "Dashboard", to: "/admin/" };
  if (currentPath === "/admin") return [dashboard];

  const items = [dashboard];
  if (currentPath.startsWith("/admin/master/")) {
    items.push({ title: "Master Data" });
  }

  const currentMenu = [...menuItems.value]
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

watch(
  () => route.fullPath,
  () => updateActiveWorkspaceTabFromRoute(),
);

const logout = async () => {
  if (isLoggingOut.value) return;

  isLoggingOut.value = true;
  mobileMenuOpen.value = false;

  // Mulai menghapus sesi Firebase, tetapi jangan tahan navigasi halaman login.
  void signOut(getAuth()).catch((error) => {
    console.error("Logout Firebase gagal:", error);
  });
  useuser.logout();

  try {
    await navigateTo("/", { replace: true });
  } catch (error) {
    console.error("Navigasi ke halaman login gagal:", error);
    isLoggingOut.value = false;
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
  <v-app-bar flat height="72" extension-height="44" class="app-bar-border">
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
              <div class="mobile-account">
                <v-avatar size="34" class="account-avatar">
                  <v-img v-if="accountPhoto" :src="accountPhoto" :alt="accountName" />
                  <span v-else>{{ accountInitials }}</span>
                </v-avatar>
                <div class="mobile-account-copy">
                  <strong>{{ accountName }}</strong>
                  <span class="account-email">{{ accountEmail }}</span>
                  <span class="account-meta-divider" aria-hidden="true" />
                  <span class="account-role">{{ accountRole }}</span>
                </div>
              </div>
              <button
                type="button"
                class="mobile-logout-button"
                :disabled="isLoggingOut"
                @click="logout"
              >
                <v-progress-circular v-if="isLoggingOut" indeterminate size="16" width="2" />
                <v-icon v-else icon="mdi-logout-variant" size="17" />
                {{ isLoggingOut ? "Keluar..." : "Logout" }}
              </button>
            </div>
          </v-card>
        </v-menu>

        <div v-if="mdAndUp" class="desktop-account-area">
          <div class="account-summary" :title="accountEmail">
            <v-avatar size="36" class="account-avatar">
              <v-img v-if="accountPhoto" :src="accountPhoto" :alt="accountName" />
              <span v-else>{{ accountInitials }}</span>
            </v-avatar>
            <div class="account-copy">
              <strong>{{ accountName }}</strong>
              <span class="account-email">{{ accountEmail }}</span>
              <span class="account-meta-divider" aria-hidden="true" />
              <span class="account-role">{{ accountRole }}</span>
            </div>
          </div>

          <button
            type="button"
            class="logout-icon-button"
            :disabled="isLoggingOut"
            aria-label="Logout dari aplikasi"
            title="Logout"
            @click="logout"
          >
            <v-progress-circular v-if="isLoggingOut" indeterminate size="17" width="2" />
            <v-icon v-else icon="mdi-logout-variant" size="19" />
          </button>
        </div>
      </div>
    </template>

    <template #extension>
      <div class="workspace-tabs-bar">
        <div ref="workspaceTabsScroll" class="workspace-tabs-scroll">
          <div class="workspace-tabs-list" role="tablist" aria-label="Halaman terbuka">
            <div
              v-for="tab in workspaceTabs"
              :key="tab.id"
              :class="[
                'workspace-tab',
                { 'workspace-tab--active': tab.id === activeWorkspaceTabId },
              ]"
            >
              <button
                type="button"
                class="workspace-tab-main"
                role="tab"
                :aria-selected="tab.id === activeWorkspaceTabId"
                :title="tab.title"
                @click="navigateToWorkspaceTab(tab)"
              >
                <v-icon :icon="tab.icon" size="15" aria-hidden="true" />
                <span>{{ tab.title }}</span>
              </button>

              <button
                v-if="workspaceTabs.length > 1"
                type="button"
                class="workspace-tab-close"
                :aria-label="`Tutup tab ${tab.title}`"
                :title="`Tutup ${tab.title}`"
                @click.stop="closeWorkspaceTab(tab)"
              >
                <v-icon icon="mdi-close" size="12" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              class="workspace-add-tab"
              aria-label="Tambah tab baru"
              title="Tambah tab baru"
              @click="addWorkspaceTab"
            >
              <v-icon icon="mdi-plus" size="14" aria-hidden="true" />
            </button>
          </div>
        </div>
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
  padding: 0 !important;
}

.app-bar-border :deep(.v-toolbar__content) {
  padding: 0 18px !important;
}

.app-bar-border :deep(.v-toolbar__extension) {
  width: 100% !important;
  padding: 0 !important;
  border-top: 1px solid #e6ebf1;
  background: #f3f6f9;
}

.workspace-tabs-bar {
  display: flex;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: 44px;
  flex: 1 1 auto;
  align-items: flex-end;
  overflow: hidden;
}

.workspace-tabs-scroll {
  min-width: 0;
  height: 100%;
  flex: 1 1 auto;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}

.workspace-tabs-scroll::-webkit-scrollbar {
  display: none;
}

.workspace-tabs-list {
  display: flex;
  width: max-content;
  min-width: 100%;
  height: 100%;
  padding-top: 7px;
  align-items: flex-end;
  gap: 4px;
}

.workspace-tab {
  display: flex;
  min-width: 112px;
  max-width: 210px;
  height: 34px;
  flex: 0 0 auto;
  align-items: center;
  overflow: hidden;
  border: 1px solid transparent;
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
  background: #e7ecf2;
  color: #5f6d7e;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
}

.workspace-tab:hover {
  background: #dde4eb;
  color: #334155;
}

.workspace-tab--active {
  position: relative;
  border-color: transparent;
  background: #ffffff;
  color: #111827;
  box-shadow:
    0 -1px 0 rgba(255, 255, 255, 0.9),
    0 -4px 12px rgba(15, 23, 42, 0.07);
}

.workspace-tab--active::before {
  content: "";
  position: absolute;
  right: 11px;
  bottom: 0;
  left: 11px;
  height: 1px;
  border-radius: 3px 3px 0 0;
  background: #dc2626;
}

.workspace-tab-main {
  display: flex;
  min-width: 0;
  height: 100%;
  flex: 1 1 auto;
  padding: 2px 7px 0 10px;
  align-items: center;
  gap: 7px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: default;
}

.workspace-tab-main .v-icon {
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
  border-radius: 6px;
  color: #758396;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.workspace-tab-main span {
  min-width: 0;
  overflow: hidden;
  font-size: 10.5px;
  font-weight: 650;
  letter-spacing: 0.005em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-tab--active .workspace-tab-main span {
  font-weight: 750;
}

.workspace-tab-main:focus-visible,
.workspace-tab-close:focus-visible,
.workspace-add-tab:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}

.workspace-tab-close {
  display: inline-flex;
  width: 20px;
  height: 20px;
  margin-right: 5px;
  padding: 0;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #8390a0;
  cursor: default;
}

.workspace-tab-close:hover {
  background: #cfd7e0;
  color: #991b1b;
}

.workspace-add-tab {
  display: inline-flex;
  width: 24px;
  height: 24px;
  margin-bottom: 5px;
  padding: 0;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #526174;
  cursor: default;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;
}

.workspace-add-tab:hover {
  background: #dfe5ec;
  color: #526174;
  transform: scale(1.05);
}

.workspace-add-tab:active {
  background: #d4dce5;
  transform: scale(0.96);
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
  display: flex;
  padding: 10px 12px;
  align-items: center;
  gap: 10px;
  border-top: 1px solid #e8ecf0;
  background: #ffffff;
}

.mobile-account {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 9px;
}

.mobile-account-copy,
.account-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.mobile-account-copy strong,
.account-copy strong {
  overflow: hidden;
  color: #1e293b;
  font-size: 11px;
  font-weight: 750;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-email,
.account-role {
  display: block;
  overflow: hidden;
  color: #7b8794;
  font-size: 8.5px;
  font-weight: 600;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-email {
  margin-top: 1px;
  font-weight: 450;
}

.account-meta-divider {
  display: block;
  width: 100%;
  height: 1px;
  margin: 3px 0 2px;
  background: #e5e9ed;
}

.account-role {
  color: #526171;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.025em;
}

.mobile-logout-button {
  display: flex;
  height: 32px;
  flex: 0 0 auto;
  padding: 0 4px;
  align-items: center;
  gap: 6px;
  color: #64748b;
  background: transparent;
  border: 0;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 650;
  text-align: left;
  cursor: pointer;
  transition: color 0.15s ease;
}

.mobile-logout-button:hover,
.mobile-logout-button:active {
  color: #b4232d;
}

.mobile-logout-button:disabled,
.logout-icon-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.desktop-account-area {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
}

.account-summary {
  display: flex;
  width: max-content;
  min-width: max-content;
  max-width: none;
  flex: 0 0 auto;
  align-items: center;
  gap: 9px;
}

.account-avatar {
  flex: 0 0 auto;
  border: 1px solid #dbe2e8;
  background: #edf1f4 !important;
  color: #34495e !important;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.01em;
}

.account-copy {
  width: max-content;
  min-width: max-content;
  max-width: none;
}

.account-copy strong {
  overflow: visible;
  font-size: 12px;
  text-overflow: clip;
}

.logout-icon-button {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #7b8794;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.logout-icon-button:hover {
  color: #b4232d;
  background: #f8eeee;
}

@media (max-width: 600px) {
  .app-bar-border :deep(.v-toolbar__content) {
    padding: 0 10px !important;
  }

  .workspace-tab {
    min-width: 104px;
    max-width: 168px;
  }

  .workspace-tab-main {
    padding-left: 8px;
    gap: 6px;
  }

  .workspace-tab-main span {
    font-size: 10px;
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
