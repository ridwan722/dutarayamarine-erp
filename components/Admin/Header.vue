<script setup>
import Sortable from "sortablejs";
import { useDisplay } from "vuetify";
import { useUserStore } from "@/stores/userStore";
import { useinvoiceStore } from "@/stores/invoiceStore";
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
import {
  formatDashboardCompactMoney,
  formatDashboardDate,
  toDashboardDate,
  useDashboardAnalytics,
} from "~/components/dashboard/useDashboardAnalytics";

const { mdAndUp } = useDisplay();
const route = useRoute();
const useuser = useUserStore();
const customerStore = usecustomerStore();
const invoiceStore = useinvoiceStore();
const mobileMenuOpen = ref(false);
const accountMenuOpen = ref(false);
const accountCompanyName = ref("");
const accountCompanyLoading = ref(false);
const currentTime = ref(new Date());
const isLoggingOut = ref(false);
const workspaceTabs = ref([]);
const workspaceTabsReady = ref(false);
const workspaceTabsScroll = ref(null);
const workspaceTabsList = ref(null);
const activeWorkspaceTabId = ref("");
const notificationMenuOpen = ref(false);
const notificationLastLoadedAt = ref(0);
const notificationSeenActivityIds = ref([]);
let clockInterval;
let workspaceTabSequence = 0;
let workspaceTabsSortable = null;
let notificationLoadPromise = null;

const WORKSPACE_TABS_STORAGE_PREFIX = "drm-erp:workspace-tabs:v2";
const NOTIFICATION_SEEN_STORAGE_PREFIX = "drm-erp:notification-seen:v1";

const accountName = computed(() => {
  const name = useuser.getDisplayName?.trim();
  if (name) return name;

  const emailName = useuser.getEmail?.split("@")[0]?.trim();
  return emailName || "Pengguna ERP";
});

const accountRole = computed(() => useuser.getRole?.trim() || "Pengguna");
const accountEmail = computed(() => useuser.getEmail?.trim() || "-");
const accountPhoto = computed(() => useuser.getUser?.photoURL || "");
const accountCompanyId = computed(() => useuser.getIdPerusahaan?.trim() || "");
const accountCompany = computed(() => {
  if (!accountCompanyId.value) return "Semua perusahaan";
  return (
    useuser.getNamaPerusahaan?.trim() ||
    accountCompanyName.value ||
    (accountCompanyLoading.value ? "Memuat..." : "Perusahaan terhubung")
  );
});
let accountCompanyLookupFor = "";
let accountCompanyLookupPromise = null;

async function loadAccountCompanyName() {
  const companyId = accountCompanyId.value;
  if (!companyId || useuser.getNamaPerusahaan?.trim()) return;
  if (accountCompanyLookupFor === companyId) return;
  if (accountCompanyLookupPromise) await accountCompanyLookupPromise;
  if (accountCompanyLookupFor === companyId) return;

  accountCompanyLoading.value = true;
  accountCompanyLookupFor = companyId;
  accountCompanyLookupPromise = (async () => {
    try {
      const name = await customerStore.cariNamaPerusahaanAct(companyId);
      if (accountCompanyId.value === companyId) {
        accountCompanyName.value = name || "Perusahaan tidak ditemukan";
      }
    } catch (error) {
      console.error("Gagal memuat perusahaan profil:", error);
      if (accountCompanyId.value === companyId) {
        accountCompanyName.value = "Data perusahaan tidak tersedia";
      }
    } finally {
      accountCompanyLoading.value = false;
      accountCompanyLookupPromise = null;
    }
  })();

  await accountCompanyLookupPromise;
}

watch(accountCompanyId, () => {
  accountCompanyName.value = "";
  accountCompanyLookupFor = "";
});
watch(accountMenuOpen, (isOpen) => {
  if (isOpen) void loadAccountCompanyName();
});
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

const notificationDashboard = useDashboardAnalytics();
const {
  activities: notificationActivities,
  available: notificationSources,
  loading: notificationLoading,
  ready: notificationReady,
  selectedYear: notificationYear,
  snapshot: notificationSnapshot,
  refresh: refreshNotifications,
} = notificationDashboard;
const notificationItems = computed(() => notificationActivities.value.slice(0, 6));
const notificationAvailable = computed(() =>
  Object.values(notificationSources.value).some(Boolean),
);
const notificationSeenStorageKey = computed(() => {
  const accountKey = (useuser.getEmail || useuser.profileId || "default")
    .trim()
    .toLowerCase();
  return `${NOTIFICATION_SEEN_STORAGE_PREFIX}:${accountKey}`;
});
const notificationHasUnread = computed(
  () =>
    !notificationMenuOpen.value &&
    notificationReady.value &&
    notificationItems.value.some(
      (item) => !notificationSeenActivityIds.value.includes(item.id),
    ),
);

function restoreNotificationSeenState() {
  try {
    const stored = window.localStorage.getItem(notificationSeenStorageKey.value);
    const parsed = stored ? JSON.parse(stored) : [];
    notificationSeenActivityIds.value = Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string").slice(0, 50)
      : [];
  } catch {
    notificationSeenActivityIds.value = [];
  }
}

function markNotificationsAsRead() {
  if (!notificationItems.value.length) return;
  notificationSeenActivityIds.value = [
    ...new Set([
      ...notificationItems.value.map((item) => item.id),
      ...notificationSeenActivityIds.value,
    ]),
  ].slice(0, 50);
  try {
    window.localStorage.setItem(
      notificationSeenStorageKey.value,
      JSON.stringify(notificationSeenActivityIds.value),
    );
  } catch {
    // Status baca tetap berlaku selama sesi ketika penyimpanan browser tidak tersedia.
  }
}

async function loadNotifications(force = false) {
  if (notificationLoadPromise) return notificationLoadPromise;
  const cacheIsFresh =
    notificationReady.value &&
    Date.now() - notificationLastLoadedAt.value < 60_000;
  if (!force && cacheIsFresh) return;

  notificationLoadPromise = (async () => {
    notificationYear.value = 0;
    await refreshNotifications();
    notificationLastLoadedAt.value = Date.now();
  })();

  try {
    await notificationLoadPromise;
  } finally {
    notificationLoadPromise = null;
  }
}

async function openNotificationPanel() {
  await loadNotifications();
  markNotificationsAsRead();
}

async function refreshNotificationPanel() {
  await loadNotifications(true);
  if (notificationMenuOpen.value) markNotificationsAsRead();
}

watch(notificationMenuOpen, (isOpen) => {
  if (isOpen) void openNotificationPanel();
});

onMounted(() => {
  currentTime.value = new Date();
  restoreNotificationSeenState();
  void loadNotifications();
  clockInterval = window.setInterval(() => {
    currentTime.value = new Date();
  }, 1_000);
  restoreWorkspaceTabs();
  void nextTick(initializeWorkspaceTabsSortable);
});

onBeforeUnmount(() => {
  if (clockInterval) window.clearInterval(clockInterval);
  destroyWorkspaceTabsSortable();
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
    title: "Service Report",
    subtitle: "Laporan pekerjaan proyek",
    to: "/admin/service-report",
    icon: "mdi-hammer-screwdriver",
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

const invoiceWorkspaceTabTitle = (documentId) => {
  const decodedId = decodeURIComponent(documentId);
  const invoices = [
    invoiceStore.getDetailInvoice,
    ...invoiceStore.getDataInvoice,
    ...notificationSnapshot.value.invoice,
  ];
  const invoice = invoices.find((item) =>
    [item?.id, item?.id_invoice, item?.no_inv].some(
      (identifier) => String(identifier || "") === decodedId,
    ),
  );
  const createdDate = toDashboardDate(invoice?.createdAt);

  if (!invoice || !createdDate) return decodedId;
  return `INV/DRM/${createdDate.getFullYear()}/${invoice.no_inv || decodedId}`;
};

const workspaceStorageKey = computed(() => {
  const accountKey = (useuser.getEmail || useuser.profileId || "default")
    .trim()
    .toLowerCase();
  return `${WORKSPACE_TABS_STORAGE_PREFIX}:${accountKey}`;
});

const workspaceTabMeta = (path, to = path) => {
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
  if (
    menuPath === "/admin/penawaran" &&
    nestedSegments.at(-1) === "buat-service-report"
  ) {
    const queryString = String(to).split("?")[1]?.split("#")[0] || "";
    const mode = new URLSearchParams(queryString).get("mode");
    return {
      title: mode === "revisi" ? "Revisi Service Report" : "Buat Service Report",
      icon: "mdi-hammer-screwdriver",
    };
  }

  const nestedPageLabels = {
    pengeluaran: "Pengeluaran",
    activate: "Aktivasi",
    selesai: "Selesai",
  };
  const nestedPage = nestedPageLabels[nestedSegments.at(-1)];
  const isDocumentDetail =
    nestedSegments.length === 1 &&
    !nestedPage &&
    ["/admin/penawaran", "/admin/invoice"].includes(menuPath);

  if (isDocumentDetail) {
    return {
      title:
        menuPath === "/admin/invoice"
          ? invoiceWorkspaceTabTitle(nestedSegments[0])
          : decodeURIComponent(nestedSegments[0]),
      icon: currentMenu.icon,
    };
  }

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
  const meta = workspaceTabMeta(normalizedPath, to);
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

const moveWorkspaceTab = (fromIndex, toIndex) => {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= workspaceTabs.value.length ||
    toIndex >= workspaceTabs.value.length
  ) {
    return;
  }

  const [movedTab] = workspaceTabs.value.splice(fromIndex, 1);
  if (!movedTab) return;

  workspaceTabs.value.splice(toIndex, 0, movedTab);
  persistWorkspaceTabs();
};

const moveWorkspaceTabByOffset = (tab, offset, event) => {
  const fromIndex = workspaceTabs.value.findIndex((item) => item.id === tab.id);
  const toIndex = fromIndex + offset;
  const tabButton = event?.currentTarget;

  moveWorkspaceTab(fromIndex, toIndex);
  void nextTick(() => {
    tabButton?.focus();
    tabButton?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  });
};

function destroyWorkspaceTabsSortable() {
  workspaceTabsSortable?.destroy();
  workspaceTabsSortable = null;
}

function initializeWorkspaceTabsSortable() {
  destroyWorkspaceTabsSortable();
  if (!workspaceTabsList.value) return;

  workspaceTabsSortable = new Sortable(workspaceTabsList.value, {
    animation: 190,
    easing: "cubic-bezier(0.2, 0, 0, 1)",
    direction: "horizontal",
    draggable: ".workspace-tab",
    handle: ".workspace-tab-main",
    ghostClass: "workspace-tab-sortable-ghost",
    chosenClass: "workspace-tab-sortable-chosen",
    dragClass: "workspace-tab-sortable-drag",
    delay: 120,
    delayOnTouchOnly: true,
    touchStartThreshold: 4,
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 2,
    swapThreshold: 0.55,
    invertSwap: false,
    scroll: true,
    scrollSensitivity: 48,
    scrollSpeed: 14,
    onEnd(event) {
      const fromIndex =
        event.oldDraggableIndex ?? event.oldIndex;
      const toIndex =
        event.newDraggableIndex ?? event.newIndex;
      if (fromIndex === undefined || toIndex === undefined) return;
      moveWorkspaceTab(fromIndex, toIndex);
    },
  });
}

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

watch(
  [
    () => invoiceStore.getDetailInvoice,
    () => invoiceStore.getDataInvoice,
    () => notificationSnapshot.value.invoice,
  ],
  () => {
    if (!workspaceTabsReady.value) return;

    workspaceTabs.value = workspaceTabs.value.map((tab) => {
      const meta = workspaceTabMeta(tab.path, tab.to);
      return { ...tab, title: meta.title, icon: meta.icon };
    });
    persistWorkspaceTabs();
  },
);

const logout = async () => {
  if (isLoggingOut.value) return;

  isLoggingOut.value = true;
  mobileMenuOpen.value = false;
  accountMenuOpen.value = false;

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
  <v-app-bar flat height="62" extension-height="40" class="app-bar-border">
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
          <span class="company-subtitle">ERP - Enterprise Resource Planning</span>
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
                V25.4 | {{ item.title }}
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
        <v-menu
          v-model="notificationMenuOpen"
          location="bottom end"
          :offset="10"
        >
          <template #activator="{ props: notificationMenuProps }">
            <v-badge
              :model-value="notificationHasUnread"
              dot
              color="error"
              location="top end"
              :offset-x="4"
              :offset-y="4"
              class="header-notification-badge"
            >
              <v-btn
                v-bind="notificationMenuProps"
                icon
                variant="text"
                class="header-notification-button"
                aria-label="Buka aktivitas terbaru"
                title="Aktivitas terbaru"
              >
                <v-icon icon="mdi-bell-outline" size="19" />
              </v-btn>
            </v-badge>
          </template>

          <v-card class="notification-menu-card" width="360" elevation="0">
            <div class="notification-menu-header">
              <div>
                <strong>Aktivitas terbaru</strong>
                <span>Dokumen dan transaksi ERP</span>
              </div>
              <button
                type="button"
                class="notification-refresh-button"
                :disabled="notificationLoading"
                aria-label="Perbarui aktivitas"
                title="Perbarui aktivitas"
                @click.stop="refreshNotificationPanel"
              >
                <v-icon
                  icon="mdi-refresh"
                  size="15"
                  :class="{ 'notification-refresh-icon--loading': notificationLoading }"
                />
              </button>
            </div>

            <div
              v-if="notificationLoading && !notificationReady"
              class="notification-loading-state"
            >
              <v-progress-circular indeterminate size="20" width="2" color="primary" />
              <span>Memuat aktivitas...</span>
            </div>

            <div
              v-else-if="notificationReady && !notificationAvailable"
              class="notification-empty-state"
            >
              <v-icon icon="mdi-alert-circle-outline" size="20" />
              <strong>Aktivitas belum dapat dimuat</strong>
              <p>Coba perbarui kembali beberapa saat lagi.</p>
            </div>

            <div
              v-else-if="notificationReady && !notificationItems.length"
              class="notification-empty-state"
            >
              <v-icon icon="mdi-bell-check-outline" size="20" />
              <strong>Belum ada aktivitas</strong>
              <p>Aktivitas terbaru akan tampil di sini.</p>
            </div>

            <div v-else class="notification-activity-list">
              <NuxtLink
                v-for="item in notificationItems"
                :key="item.id"
                :to="item.href"
                class="notification-activity-item"
                @click="notificationMenuOpen = false"
              >
                <span
                  class="notification-activity-icon"
                  :class="`notification-activity-icon--${item.tone}`"
                >
                  <v-icon :icon="item.icon" size="16" />
                </span>
                <span class="notification-activity-copy">
                  <span class="notification-activity-title-row">
                    <strong>{{ item.title }}</strong>
                    <time>{{ formatDashboardDate(item.date) }}</time>
                  </span>
                  <span class="notification-activity-description">{{ item.description }}</span>
                  <span class="notification-activity-meta">
                    <small>{{ item.type }}</small>
                    <em v-if="item.amount !== null">{{ formatDashboardCompactMoney(item.amount) }}</em>
                  </span>
                </span>
              </NuxtLink>
            </div>

          </v-card>
        </v-menu>

        <span
          v-if="mdAndUp"
          class="header-utility-divider"
          aria-hidden="true"
        />

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
              <v-icon size="17" :icon="mobileMenuOpen ? 'mdi-close' : 'mdi-menu'" />
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

          </v-card>
        </v-menu>

        <v-menu
          v-model="accountMenuOpen"
          location="bottom end"
          :offset="10"
          :close-on-content-click="false"
        >
          <template #activator="{ props: accountMenuProps }">
            <button
              v-bind="accountMenuProps"
              type="button"
              class="account-menu-trigger"
              :aria-expanded="accountMenuOpen"
              :aria-label="`Profil ${accountName}`"
              title="Profil akun"
            >
              <v-avatar size="32" class="account-avatar">
                <v-img v-if="accountPhoto" :src="accountPhoto" alt="" />
                <span v-else>{{ accountInitials }}</span>
              </v-avatar>
              <span class="account-trigger-name">{{ accountName }}</span>
              <v-icon
                icon="mdi-chevron-down"
                size="17"
                class="account-trigger-chevron"
                aria-hidden="true"
              />
            </button>
          </template>

          <v-card class="account-menu-card" width="292" elevation="0">
            <div class="account-menu-profile">
              <v-avatar size="44" class="account-avatar account-menu-avatar">
                <v-img v-if="accountPhoto" :src="accountPhoto" alt="" />
                <span v-else>{{ accountInitials }}</span>
              </v-avatar>
              <div class="account-menu-identity">
                <strong>{{ accountName }}</strong>
                <span>{{ accountEmail }}</span>
              </div>
            </div>

            <div class="account-menu-details">

              <div class="account-menu-detail">
                <span class="account-menu-detail-label">Role</span>
                <span class="account-menu-role">
                  <v-icon icon="mdi-shield-account-outline" size="15" />
                  {{ accountRole }}
                </span>
              </div>
              <div v-if="accountCompanyId" class="account-menu-detail">
                <span class="account-menu-role">
                  <v-icon icon="mdi-domain" size="15" />
                  {{ accountCompany }}
                </span>
              </div>
            </div>

            <div class="account-menu-divider" aria-hidden="true" />

            <button
              type="button"
              class="account-menu-logout"
              :disabled="isLoggingOut"
              @click="logout"
            >
              <v-progress-circular v-if="isLoggingOut" indeterminate size="17" width="2" />
              <v-icon v-else icon="mdi-location-exit" size="18" />
              {{ isLoggingOut ? "Keluar..." : "Keluar" }}
            </button>
          </v-card>
        </v-menu>
      </div>
    </template>

    <template #extension>
      <div class="workspace-tabs-bar">
        <div ref="workspaceTabsScroll" class="workspace-tabs-scroll">
          <div
            ref="workspaceTabsList"
            class="workspace-tabs-list"
            role="tablist"
            aria-label="Halaman terbuka"
          >
            <div
              v-for="tab in workspaceTabs"
              :key="tab.id"
              :class="[
                'workspace-tab',
                {
                  'workspace-tab--active': tab.id === activeWorkspaceTabId,
                },
              ]"
            >
              <button
                type="button"
                class="workspace-tab-main"
                role="tab"
                :aria-selected="tab.id === activeWorkspaceTabId"
                :title="tab.title"
                @click="navigateToWorkspaceTab(tab)"
                @keydown.alt.left.prevent="moveWorkspaceTabByOffset(tab, -1, $event)"
                @keydown.alt.right.prevent="moveWorkspaceTabByOffset(tab, 1, $event)"
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
  position: relative;
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
  will-change: transform;
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
  user-select: none;
}

.workspace-tab-main:active {
  cursor: default;
}

.workspace-tab-sortable-ghost {
  border-color: transparent;
  background: #cfd8e3;
  opacity: 0.28;
  box-shadow: none;
}

.workspace-tab-sortable-chosen {
  z-index: 8;
  background: #ffffff;
  cursor: default;
  box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.16);
}

.workspace-tab-sortable-chosen .workspace-tab-main {
  cursor: default;
}

.workspace-tab-sortable-drag {
  z-index: 1000;
  border-bottom: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  cursor: default;
  opacity: 0.98;
  pointer-events: none;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.2);
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
  letter-spacing: 0em;
  white-space: nowrap;
}

.company-subtitle {
  margin-top: 4px;
  font-size: 10px;
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

.header-utility-divider {
  width: 1px;
  height: 30px;
  flex: 0 0 1px;
  background: #e2e8f0;
}

.header-notification-badge :deep(.v-badge__badge) {
  min-width: 7px !important;
  width: 7px !important;
  height: 7px !important;
  border: 1.5px solid #ffffff !important;
  box-shadow: 0 0 0 1px rgba(185, 28, 28, 0.08);
}

.header-notification-button {
  width: 32px !important;
  height: 32px !important;
  flex: 0 0 32px;
  color: #667487 !important;
  border: 0 !important;
  border-radius: 6px !important;
  background: transparent !important;
}

.header-notification-button:hover,
.header-notification-button[aria-expanded="true"] {
  color: #315f8d !important;
  background: #edf3f8 !important;
}

.notification-menu-card {
  overflow: hidden !important;
  border: 1px solid #dce3e9 !important;
  border-radius: 7px !important;
  background: #ffffff !important;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.13) !important;
}

.notification-menu-header {
  display: flex;
  min-height: 48px;
  padding: 8px 11px 8px 13px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e8edf1;
}

.notification-menu-header > div {
  display: flex;
  flex-direction: column;
}

.notification-menu-header strong {
  color: #253447;
  font-size: 11px;
  font-weight: 700;
}

.notification-menu-header span {
  margin-top: 1px;
  color: #8994a1;
  font-size: 8px;
}

.notification-refresh-button {
  display: grid;
  width: 26px;
  height: 26px;
  padding: 0;
  place-items: center;
  color: #718096;
  background: transparent;
  border: 0;
  border-radius: 5px;
  cursor: pointer;
}

.notification-refresh-button:hover:not(:disabled) {
  color: #315f8d;
  background: #edf3f8;
}

.notification-refresh-button:disabled {
  opacity: 0.55;
}

.notification-refresh-icon--loading {
  animation: notification-spin 0.8s linear infinite;
}

.notification-loading-state,
.notification-empty-state {
  display: flex;
  min-height: 126px;
  padding: 18px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
  color: #77889a;
  text-align: center;
}

.notification-loading-state {
  flex-direction: row;
  gap: 8px;
  color: #7d8a98;
  font-size: 9px;
}

.notification-empty-state strong {
  color: #405063;
  font-size: 10px;
  font-weight: 700;
}

.notification-empty-state p {
  margin: 0;
  color: #8a95a2;
  font-size: 8.5px;
}

.notification-activity-list {
  max-height: min(390px, calc(100vh - 180px));
  overflow-y: auto;
}

.notification-activity-item {
  display: flex;
  min-height: 58px;
  padding: 8px 12px;
  align-items: flex-start;
  gap: 9px;
  color: inherit;
  border-bottom: 1px solid #eef1f4;
  text-decoration: none;
}

.notification-activity-item:hover {
  background: #f8fafb;
}

.notification-activity-item:last-child {
  border-bottom: 0;
}

.notification-activity-icon {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  place-items: center;
  color: #377da0;
  background: #eaf3f7;
  border-radius: 6px;
}

.notification-activity-icon--green {
  color: #287e5b;
  background: #e8f4ed;
}

.notification-activity-icon--orange {
  color: #ad6b31;
  background: #faf0e6;
}

.notification-activity-icon--violet {
  color: #745aa5;
  background: #f0edf7;
}

.notification-activity-icon--rose {
  color: #ad4f68;
  background: #faecef;
}

.notification-activity-icon--cyan {
  color: #197f94;
  background: #e7f4f6;
}

.notification-activity-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.notification-activity-title-row,
.notification-activity-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.notification-activity-title-row strong {
  min-width: 0;
  overflow: hidden;
  color: #334455;
  font-size: 9.5px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-activity-title-row time {
  flex: 0 0 auto;
  color: #98a2ad;
  font-size: 7.5px;
  white-space: nowrap;
}

.notification-activity-description {
  overflow: hidden;
  color: #778693;
  font-size: 8.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-activity-meta small {
  color: #3c8298;
  font-size: 7.5px;
  font-weight: 700;
}

.notification-activity-meta em {
  color: #526578;
  font-size: 7.5px;
  font-style: normal;
  font-weight: 700;
  white-space: nowrap;
}

@keyframes notification-spin {
  to {
    transform: rotate(360deg);
  }
}

.mobile-menu-btn {
  width: 30px !important;
  height: 30px !important;
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

.account-avatar {
  flex: 0 0 auto;
  border: 1px solid #dbe2e8;
  background: #edf1f4 !important;
  color: #34495e !important;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.01em;
}

.account-menu-trigger {
  display: inline-flex;
  min-width: 0;
  max-width: 220px;
  height: 40px;
  padding: 4px 9px 4px 5px;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #253448;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease;
}

.account-menu-trigger:hover,
.account-menu-trigger[aria-expanded="true"] {
  border-color: #e5e9ee;
  background: #f7f8fa;
}

.account-menu-trigger:focus-visible,
.account-menu-logout:focus-visible {
  outline: 2px solid #71839a;
  outline-offset: 2px;
}

.account-trigger-name {
  max-width: 148px;
  overflow: hidden;
  color: #253448;
  font-size: 11px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-trigger-chevron {
  flex: 0 0 auto;
  color: #788596;
  transition: transform 0.16s ease;
}

.account-menu-trigger[aria-expanded="true"] .account-trigger-chevron {
  transform: rotate(180deg);
}

.account-menu-card {
  width: min(292px, calc(100vw - 16px)) !important;
  padding: 12px;
  border: 1px solid #e1e6eb !important;
  border-radius: 10px !important;
  background: #ffffff !important;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.16) !important;
}

.account-menu-profile {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.account-menu-avatar {
  width: 44px;
  height: 44px;
}

.account-menu-identity {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.account-menu-identity strong {
  overflow: hidden;
  color: #1e293b;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-menu-identity span {
  overflow: hidden;
  color: #748092;
  font-size: 11px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-menu-details {
  display: grid;
  margin-top: 16px;
  gap: 8px;
}

.account-menu-detail {
  display: flex;
  min-width: 0;
  padding: 11px 12px;
  flex-direction: column;
  gap: 6px;
  border-radius: 7px;
  background: #f7f8fa;
}

.account-menu-detail-label {
  color: #8490a0;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.account-menu-role {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  color: #35465a;
  font-size: 11px;
  font-weight: 650;
  overflow-wrap: anywhere;
}

.account-menu-role .v-icon {
  flex: 0 0 auto;
  color: #758397;
}

.account-menu-divider {
  height: 1px;
  margin: 13px 0 9px;
  background: #edf0f3;
}

.account-menu-logout {
  display: flex;
  width: 100%;
  min-height: 38px;
  padding: 0 10px;
  align-items: center;
  gap: 9px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #a43a43;
  font-size: 11px;
  font-weight: 650;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.account-menu-logout:hover {
  background: #fbf1f1;
}

.account-menu-logout:disabled {
  cursor: wait;
  opacity: 0.65;
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

  .header-right {
    gap: 5px;
  }

  .account-menu-trigger {
    max-width: 136px;
    height: 36px;
    padding-right: 6px;
    gap: 5px;
  }

  .account-menu-trigger .account-avatar {
    width: 30px !important;
    height: 30px !important;
  }

  .account-trigger-name {
    display: none;
  }

  .header-notification-button {
    width: 32px !important;
    height: 32px !important;
    flex-basis: 32px;
  }

  .notification-menu-card {
    width: min(360px, calc(100vw - 16px)) !important;
  }

  .logo-box {
    width: 56px;
    height: 56px;
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .logo-img {
    width: 50px;
    height: 50px;
  }

  .company-name {
    max-width: none;
    overflow: visible;
    font-size: 13px;
    line-height: 1.05;
    letter-spacing: 0.01em;
    text-overflow: clip;
    white-space: nowrap;
  }

  .company-subtitle {
    margin-top: 3px;
    font-size: 9.5px;
  }

}

@media (max-width: 390px) {
  .app-bar-border :deep(.v-toolbar__content) {
    padding: 0 8px !important;
  }

  .header-right {
    gap: 3px;
  }

  .account-menu-trigger {
    max-width: 104px;
    padding-left: 4px;
    padding-right: 4px;
    gap: 4px;
  }

  .account-menu-trigger .account-avatar {
    width: 28px !important;
    height: 28px !important;
  }

  .account-trigger-name {
    max-width: 40px;
    font-size: 9.5px;
  }

  .logo-box {
    width: 44px;
    height: 44px;
    padding: 2px;
  }

  .logo-img {
    width: 40px;
    height: 40px;
  }

  .company-name {
    max-width: none;
    font-size: 12px;
  }

  .company-info {
    max-width: none;
  }

  .company-subtitle {
    display: none;
  }
}

@media (max-width: 360px) {
  .header-notification-button {
    width: 28px !important;
    height: 28px !important;
    flex-basis: 28px;
  }

  .mobile-menu-btn {
    width: 22px !important;
    height: 22px !important;
  }

  .account-menu-trigger {
    max-width: 94px;
    height: 32px;
    gap: 3px;
  }

  .account-menu-trigger .account-avatar {
    width: 26px !important;
    height: 26px !important;
  }

  .account-trigger-name {
    max-width: 36px;
  }

  .company-name {
    max-width: none;
    font-size: 11px;
  }

  .company-info {
    max-width: none;
  }
}
</style>
