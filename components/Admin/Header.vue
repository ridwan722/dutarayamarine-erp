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

const HEADER_DESKTOP_BREAKPOINT = 910;
const { width: viewportWidth } = useDisplay();
const isDesktopLayout = computed(
  () => viewportWidth.value >= HEADER_DESKTOP_BREAKPOINT,
);
const route = useRoute();
const useuser = useUserStore();
const customerStore = usecustomerStore();
const invoiceStore = useinvoiceStore();
const desktopMenuExpanded = ref(false);
const sideMenuQuery = ref("");
const sideMenuSearchInput = ref(null);
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
const DESKTOP_MENU_EXPANDED_STORAGE_KEY =
  "drm-erp:desktop-menu-expanded:v1";

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

function restoreDesktopMenuState() {
  try {
    desktopMenuExpanded.value =
      window.localStorage.getItem(DESKTOP_MENU_EXPANDED_STORAGE_KEY) ===
      "true";
  } catch {
    desktopMenuExpanded.value = false;
  }
}

function toggleDesktopMenu() {
  desktopMenuExpanded.value = !desktopMenuExpanded.value;

  if (!desktopMenuExpanded.value) {
    sideMenuQuery.value = "";
  }

  try {
    window.localStorage.setItem(
      DESKTOP_MENU_EXPANDED_STORAGE_KEY,
      String(desktopMenuExpanded.value),
    );
  } catch {
    // Status expand tetap berlaku selama sesi jika storage tidak tersedia.
  }
}

async function openDesktopMenuSearch() {
  if (!desktopMenuExpanded.value) {
    desktopMenuExpanded.value = true;

    try {
      window.localStorage.setItem(DESKTOP_MENU_EXPANDED_STORAGE_KEY, "true");
    } catch {
      // Pencarian tetap dapat digunakan jika storage tidak tersedia.
    }
  }

  await nextTick();
  sideMenuSearchInput.value?.focus();
}

function handleDesktopMenuShortcut(event) {
  if (!isDesktopLayout.value || event.key.toLowerCase() !== "k") return;
  if (!event.metaKey && !event.ctrlKey) return;

  event.preventDefault();
  void openDesktopMenuSearch();
}

onMounted(() => {
  currentTime.value = new Date();
  restoreDesktopMenuState();
  restoreNotificationSeenState();
  void loadNotifications();
  clockInterval = window.setInterval(() => {
    currentTime.value = new Date();
  }, 1_000);
  window.addEventListener("keydown", handleDesktopMenuShortcut);
  restoreWorkspaceTabs();
  void nextTick(initializeWorkspaceTabsSortable);
});

onBeforeUnmount(() => {
  if (clockInterval) window.clearInterval(clockInterval);
  window.removeEventListener("keydown", handleDesktopMenuShortcut);
  destroyWorkspaceTabsSortable();
});

const sideMenuIconKeyByPath = {
  "/admin/": "dashboard",
  "/admin/penawaran": "quotation",
  "/admin/invoice": "invoice",
  "/admin/service-report": "service",
  "/admin/purchase-order": "purchase",
  "/admin/master/users": "users",
  "/admin/master/client": "client",
  "/admin/master/vendor": "vendor",
  "/admin/master/leads-web": "leads",
  "/admin/master/project-web": "projects",
  "/admin/master/product-service": "website",
  "/admin/master/barang": "inventory",
  "/admin/master/termcondition": "terms",
  "/admin/petty-cash": "finance",
  "/admin/legalitas": "legal",
  "/admin/master/penomoran": "numbering",
};

const sideMenuIconPaths = {
  dashboard: [
    "M4 4h6v8H4z",
    "M14 4h6v4h-6z",
    "M14 12h6v8h-6z",
    "M4 16h6v4H4z",
  ],
  quotation: [
    "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z",
    "M14 3v6h6",
    "M9 17h2l6.5-6.5-2-2L9 15z",
  ],
  invoice: [
    "M6 3v18l3-2 3 2 3-2 3 2V3l-3 2-3-2-3 2z",
    "M9 9h6",
    "M9 13h6",
    "M9 17h3",
  ],
  service: [
    "M9 4H6a2 2 0 0 0-2 2v14h16V6a2 2 0 0 0-2-2h-3",
    "M9 2h6v4H9z",
    "m9 12-5 5-3-3",
  ],
  purchase: [
    "M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H7",
    "M10 20h.01",
    "M17 20h.01",
  ],
  users: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M22 21v-2a4 4 0 0 0-3-3.87",
    "M16 3.13a4 4 0 0 1 0 7.75",
  ],
  client: [
    "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",
    "M16 9h2a2 2 0 0 1 2 2v10",
    "M8 7h4",
    "M8 11h4",
    "M8 15h4",
    "M2 21h20",
  ],
  vendor: [
    "M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2",
    "M4 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z",
    "M2 12h20",
    "M10 12v2h4v-2",
  ],
  leads: [
    "M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M19 8v6",
    "M16 11h6",
  ],
  projects: [
    "M3 7h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    "M3 7V5a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2",
  ],
  website: [
    "M4 4h6v6H4z",
    "M14 4h6v6h-6z",
    "M4 14h6v6H4z",
    "M14 14h6v6h-6z",
  ],
  inventory: [
    "m12 3 9 5-9 5-9-5z",
    "m3 8 9 5 9-5",
    "M3 8v8l9 5 9-5V8",
    "M12 13v8",
  ],
  terms: [
    "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z",
    "M14 3v6h6",
    "M8 13h8",
    "M8 17h6",
  ],
  finance: [
    "M4 6h15a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12",
    "M16 12h5v4h-5a2 2 0 0 1 0-4z",
  ],
  legal: [
    "M12 3 20 6v6c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z",
    "m9 12 2 2 4-4",
  ],
  numbering: [
    "M10 3 8 21",
    "M16 3l-2 18",
    "M4 9h16",
    "M3 15h16",
  ],
  more: [
    "M4 6h2",
    "M10 6h10",
    "M4 12h2",
    "M10 12h10",
    "M4 18h2",
    "M10 18h10",
  ],
};

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

const desktopMenuItems = computed(() => {
  const query = sideMenuQuery.value.trim().toLocaleLowerCase("id-ID");
  if (!query) return menuItems.value;

  return menuItems.value.filter((item) =>
    `${item.title} ${item.subtitle}`.toLocaleLowerCase("id-ID").includes(query),
  );
});

const MOBILE_PRIMARY_PATHS = [
  "/admin/",
  "/admin/penawaran",
  "/admin/invoice",
  "/admin/service-report",
];

const mobilePrimaryItems = computed(() =>
  MOBILE_PRIMARY_PATHS.map((path) =>
    menuItems.value.find((item) => item.to === path),
  ).filter(Boolean),
);

const mobileOverflowItems = computed(() => {
  const primaryPaths = new Set(mobilePrimaryItems.value.map((item) => item.to));
  return menuItems.value.filter((item) => !primaryPaths.has(item.to));
});

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
      items: mobileOverflowItems.value.filter((item) => {
        return sectionForItem(item) === title;
      }),
    }))
    .filter((group) => group.items.length);
});

const normalizePath = (path) => {
  const normalized = path.replace(/\/+$/, "");
  return normalized || "/";
};

const isMenuItemActive = (item) => {
  const currentPath = normalizePath(route.path);
  const itemPath = normalizePath(item.to);

  if (itemPath === "/admin") return currentPath === itemPath;
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
};

const mobileMoreActive = computed(() =>
  mobileOverflowItems.value.some((item) => isMenuItemActive(item)),
);

const mobileMenuLabel = (item) => {
  const labels = {
    "/admin/": "Beranda",
    "/admin/penawaran": "Penawaran",
    "/admin/service-report": "Service",
  };
  return labels[item.to] || item.title;
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

watch(isDesktopLayout, (isDesktop) => {
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
    v-if="isDesktopLayout"
    id="desktop-side-navigation"
    permanent
    :rail="!desktopMenuExpanded"
    :width="252"
    :rail-width="72"
    :class="[
      'desktop-side-menu',
      { 'desktop-side-menu--expanded': desktopMenuExpanded },
    ]"
  >
    <div class="side-brand-header">
      <div class="side-brand-lockup">
        <div class="mini-logo-box">
          <img src="/Logo-DRM.png" alt="DRM Logo" class="mini-logo-img" />
        </div>
        <div class="side-brand-copy">
          <strong>Duta Raya Marine</strong>
          <span>ERP Workspace</span>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="side-menu-toggle"
      :aria-label="desktopMenuExpanded ? 'Perkecil menu samping' : 'Perluas menu samping'"
      :aria-expanded="desktopMenuExpanded"
      aria-controls="desktop-side-navigation"
      :title="desktopMenuExpanded ? 'Perkecil menu' : 'Tampilkan nama menu'"
      @click="toggleDesktopMenu"
    >
      <svg
        class="side-control-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          :d="desktopMenuExpanded ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'"
        />
      </svg>
    </button>

    <div class="side-search-region">
      <label
        class="side-search-field"
        :aria-hidden="!desktopMenuExpanded"
      >
        <svg class="side-search-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m21 21-4.35-4.35" />
          <path d="M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" />
        </svg>
        <input
          ref="sideMenuSearchInput"
          v-model="sideMenuQuery"
          type="search"
          placeholder="Cari menu"
          aria-label="Cari menu navigasi"
          :tabindex="desktopMenuExpanded ? 0 : -1"
        />
        <kbd>⌘K</kbd>
      </label>

      <button
        type="button"
        class="side-search-trigger"
        aria-label="Buka pencarian menu"
        title="Cari menu"
        :tabindex="desktopMenuExpanded ? -1 : 0"
        :aria-hidden="desktopMenuExpanded"
        @click="openDesktopMenuSearch"
      >
        <svg class="side-search-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m21 21-4.35-4.35" />
          <path d="M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" />
        </svg>
      </button>
    </div>

    <v-list nav density="compact" class="side-nav-list">
      <v-list-item
        v-for="item in desktopMenuItems"
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
          <svg class="side-nav-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path
              v-for="(path, pathIndex) in sideMenuIconPaths[
                sideMenuIconKeyByPath[item.to]
              ]"
              :key="`${item.to}-icon-${pathIndex}`"
              :d="path"
            />
          </svg>
        </div>
        <span class="side-nav-label">{{ item.title }}</span>
        <svg
          class="side-nav-indicator"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
        <v-tooltip
          v-if="!desktopMenuExpanded"
          activator="parent"
          location="end"
          content-class="side-nav-tooltip"
        >
          {{ item.title }}
        </v-tooltip>
      </v-list-item>

      <div
        v-if="desktopMenuExpanded && !desktopMenuItems.length"
        class="side-nav-empty"
        role="status"
      >
        <svg class="side-empty-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m21 21-4.35-4.35" />
          <path d="M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" />
          <path d="m8.5 8.5 5 5" />
          <path d="m13.5 8.5-5 5" />
        </svg>
        <span>Menu tidak ditemukan</span>
      </div>
    </v-list>
  </v-navigation-drawer>

  <!-- APP BAR / TOP HEADER -->
  <v-app-bar flat height="62" extension-height="40" class="app-bar-border">
    <template #prepend>
      <div class="header-left">
        <div v-if="!isDesktopLayout" class="logo-box">
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

        <nav v-if="isDesktopLayout" class="header-breadcrumbs" aria-label="Breadcrumb">
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

    <div v-if="isDesktopLayout" class="header-version" aria-label="Versi aplikasi 25.5.0">
      Versi 25.5.3
    </div>

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
          v-if="isDesktopLayout"
          class="header-utility-divider"
          aria-hidden="true"
        />

        <div
          v-if="isDesktopLayout"
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

  <v-bottom-navigation
    v-if="!isDesktopLayout"
    grow
    tag="nav"
    :height="68"
    :elevation="0"
    class="mobile-bottom-navigation"
    aria-label="Navigasi utama"
  >
    <v-btn
      v-for="item in mobilePrimaryItems"
      :key="`bottom-${item.to}`"
      :to="item.to"
      :exact="item.exact"
      :active="isMenuItemActive(item)"
      class="mobile-bottom-item"
      :aria-label="mobileMenuLabel(item)"
    >
      <svg class="mobile-bottom-svg" viewBox="0 0 24 24" aria-hidden="true">
        <path
          v-for="(path, pathIndex) in sideMenuIconPaths[
            sideMenuIconKeyByPath[item.to]
          ]"
          :key="`${item.to}-bottom-icon-${pathIndex}`"
          :d="path"
        />
      </svg>
      <span>{{ mobileMenuLabel(item) }}</span>
    </v-btn>

    <v-menu
      v-if="mobileOverflowItems.length"
      v-model="mobileMenuOpen"
      location="top end"
      :offset="12"
      :close-on-content-click="true"
    >
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          :active="mobileMoreActive || mobileMenuOpen"
          class="mobile-bottom-item mobile-bottom-more"
          aria-label="Buka menu lainnya"
          :aria-expanded="mobileMenuOpen"
        >
          <svg class="mobile-bottom-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path
              v-for="(path, pathIndex) in sideMenuIconPaths.more"
              :key="`more-bottom-icon-${pathIndex}`"
              :d="path"
            />
          </svg>
          <span>Lainnya</span>
        </v-btn>
      </template>

      <v-card class="mobile-menu-card" width="380" elevation="0">
        <div class="mobile-menu-heading">
          <div>
            <strong>Menu lainnya</strong>
            <span>Fitur operasional dan pengaturan ERP</span>
          </div>
          <button
            type="button"
            aria-label="Tutup menu lainnya"
            @click="mobileMenuOpen = false"
          >
            <v-icon icon="mdi-close" size="17" />
          </button>
        </div>

        <div class="mobile-nav-scroll">
          <section
            v-for="group in mobileMenuGroups"
            :key="group.title"
            class="mobile-nav-section"
          >
            <h3>{{ group.title }}</h3>
            <v-list density="compact" nav>
              <v-list-item
                v-for="item in group.items"
                :key="`mobile-${item.to}`"
                :to="item.to"
                :exact="item.exact"
                :active="isMenuItemActive(item)"
                class="mobile-nav-item"
                @click="mobileMenuOpen = false"
              >
                <template #prepend>
                  <span class="mobile-nav-icon" aria-hidden="true">
                    <svg class="mobile-nav-svg" viewBox="0 0 24 24">
                      <path
                        v-for="(path, pathIndex) in sideMenuIconPaths[
                          sideMenuIconKeyByPath[item.to]
                        ]"
                        :key="`${item.to}-mobile-icon-${pathIndex}`"
                        :d="path"
                      />
                    </svg>
                  </span>
                </template>

                <v-list-item-title>{{ item.title }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ item.subtitle }}
                </v-list-item-subtitle>

                <template #append>
                  <svg
                    class="mobile-nav-chevron"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </template>
              </v-list-item>
            </v-list>
          </section>
        </div>
      </v-card>
    </v-menu>
  </v-bottom-navigation>
</template>

<style scoped>
/* =========================================================
   CORPORATE MINIMALIST SIDE NAVIGATION DRAWER
========================================================= */

.desktop-side-menu {
  isolation: isolate;
  border-right: 1px solid #1d2a3e !important;
  background: #ffffff !important;
  box-shadow: 8px 0 28px rgba(15, 23, 42, 0.035) !important;
  overflow: visible !important;
  transition-property:
    transform,
    visibility,
    width,
    border-color,
    box-shadow !important;
  transition-duration: 280ms !important;
  transition-timing-function: cubic-bezier(0.2, 0, 0, 1) !important;
}

.desktop-side-menu::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(180deg, #111d31 0%, #0b1423 100%);
  opacity: 1;
  pointer-events: none;
  transition: opacity 280ms cubic-bezier(0.2, 0, 0, 1);
}

.desktop-side-menu--expanded {
  border-right-color: #e7e9ed !important;
}

.desktop-side-menu--expanded::before {
  opacity: 0;
}

.desktop-side-menu ~ .app-bar-border,
:global(.desktop-side-menu ~ .v-main) {
  transition-duration: 280ms !important;
  transition-timing-function: cubic-bezier(0.2, 0, 0, 1) !important;
}

.desktop-side-menu :deep(.v-navigation-drawer__content) {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  overflow: visible !important;
}

.side-brand-header {
  position: relative;
  display: flex;
  height: 86px;
  padding: 0 14px;
  flex: 0 0 86px;
  align-items: center;
  transition: padding 280ms cubic-bezier(0.2, 0, 0, 1);
}

.desktop-side-menu--expanded .side-brand-header {
  padding-inline: 18px;
}

.side-brand-lockup {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  column-gap: 0;
  overflow: hidden;
  transition: column-gap 280ms cubic-bezier(0.2, 0, 0, 1);
}

.desktop-side-menu--expanded .side-brand-lockup {
  column-gap: 12px;
}

.mini-logo-box {
  display: flex;
  width: 44px;
  height: 44px;
  padding: 6px;
  flex: 0 0 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e5e9;
  border-radius: 11px;
  background: #ffffff;
  box-shadow: 0 2px 7px rgba(15, 23, 42, 0.08);
}

.mini-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.side-brand-copy {
  display: flex;
  min-width: 0;
  max-width: 0;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
  opacity: 0;
  transition:
    max-width 140ms ease,
    opacity 90ms ease;
}

.desktop-side-menu--expanded .side-brand-copy {
  max-width: 166px;
  opacity: 1;
  transition:
    max-width 220ms ease 55ms,
    opacity 140ms ease 90ms;
}

.side-brand-copy strong {
  overflow: hidden;
  color: #20242c;
  font-size: 13px;
  font-weight: 750;
  letter-spacing: -0.02em;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-brand-copy span {
  color: #9298a2;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  line-height: 1.15;
  text-transform: uppercase;
  white-space: nowrap;
}

.side-menu-toggle {
  position: absolute;
  top: 50%;
  right: -13px;
  z-index: 4;
  display: grid;
  width: 26px;
  height: 26px;
  padding: 0;
  place-items: center;
  border: 1px solid #dfe3e8;
  border-radius: 50%;
  background: #ffffff;
  color: #7c838e;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.12);
  cursor: pointer;
  transform: translateY(-50%);
  transition:
    border-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.side-menu-toggle:hover {
  border-color: #d5aeb2;
  color: #a6202b;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
}

.side-menu-toggle:focus-visible {
  outline: 2px solid rgba(166, 32, 43, 0.35);
  outline-offset: 2px;
}

.side-control-icon,
.side-search-icon,
.side-nav-svg,
.side-nav-indicator,
.side-empty-icon {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.side-control-icon {
  width: 15px;
  height: 15px;
  stroke-width: 1.9;
}

.side-search-region {
  position: relative;
  height: 52px;
  flex: 0 0 52px;
  overflow: hidden;
}

.side-search-field {
  position: absolute;
  inset: 6px 14px 8px;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
  padding: 0 10px 0 12px;
  border: 1px solid #dfe2e6;
  border-radius: 10px;
  background: #ffffff;
  color: #858c96;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.025);
  opacity: 0;
  pointer-events: none;
  transform: translateX(-8px);
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    opacity 100ms ease,
    transform 180ms ease;
}

.desktop-side-menu--expanded .side-search-field {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0);
  transition-delay: 70ms, 70ms, 70ms, 70ms;
}

.side-search-field:focus-within {
  border-color: #cbd0d7;
  box-shadow: 0 0 0 3px rgba(166, 32, 43, 0.08);
}

.side-search-field input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #303640;
  font: inherit;
  font-size: 12px;
  font-weight: 550;
}

.side-search-field input::placeholder {
  color: #a1a6af;
}

.side-search-field input::-webkit-search-cancel-button {
  opacity: 0.45;
}

.side-search-field kbd {
  display: inline-flex;
  height: 22px;
  padding: 0 6px;
  flex: 0 0 auto;
  align-items: center;
  border: 1px solid #e3e5e8;
  border-radius: 6px;
  background: #fafafa;
  color: #8a9099;
  font-family: inherit;
  font-size: 10px;
  font-weight: 650;
  line-height: 1;
}

.side-search-trigger {
  position: absolute;
  top: 6px;
  left: 19px;
  display: grid;
  width: 34px;
  height: 34px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #9ca8ba;
  cursor: pointer;
  opacity: 1;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    opacity 100ms ease;
}

.desktop-side-menu--expanded .side-search-trigger {
  opacity: 0;
  pointer-events: none;
}

.side-search-trigger:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.side-search-trigger:focus-visible {
  outline: 2px solid rgba(166, 32, 43, 0.28);
  outline-offset: 2px;
}

.side-search-icon {
  width: 18px;
  height: 18px;
  stroke-width: 1.7;
}

.side-nav-list {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  flex-direction: column;
  gap: 0;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  padding: 3px 12px 14px !important;
  scrollbar-width: none;
  overscroll-behavior: contain;
}

.side-nav-list::-webkit-scrollbar {
  display: none;
}

.side-nav-item {
  position: relative !important;
  border-radius: 0 !important;
  background: transparent !important;
  color: #737a85 !important;
  height: 38px !important;
  min-height: 38px !important;
  padding: 0 !important;
  margin-bottom: 0 !important;
  overflow: visible !important;
  transition: color 0.16s ease !important;
}

.side-nav-item--bottom {
  margin-top: auto !important;
}

.side-nav-item--bottom::before {
  content: "";
  position: absolute;
  top: -6px;
  right: 4px;
  left: 4px;
  height: 1px;
  background: rgba(148, 163, 184, 0.18);
  transition: background-color 200ms ease;
}

.desktop-side-menu--expanded .side-nav-item--bottom::before {
  background: #eceef1;
}

.side-nav-item :deep(.v-list-item__content) {
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  column-gap: 0;
  padding: 0 9px !important;
  margin: 0 !important;
  overflow: hidden !important;
  transition:
    column-gap 280ms cubic-bezier(0.2, 0, 0, 1);
}

.desktop-side-menu--expanded
  .side-nav-item
  :deep(.v-list-item__content) {
  column-gap: 8px;
}

.side-nav-item :deep(.v-list-item__overlay),
.side-nav-item :deep(.v-list-item__underlay) {
  background: transparent !important;
  opacity: 0 !important;
}

.side-nav-item::after {
  border: 0 !important;
}

.nav-icon-wrapper {
  width: 30px;
  height: 30px;
  display: flex;
  flex: 0 0 30px;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: #98a5b8;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease;
}

.desktop-side-menu--expanded .nav-icon-wrapper {
  color: #858c96;
}

.side-nav-svg {
  width: 18px;
  height: 18px;
  stroke-width: 1.65;
  transition:
    color 0.16s ease,
    stroke-width 0.16s ease;
}

.side-nav-item:hover {
  background: transparent !important;
}

.side-nav-item:hover .nav-icon-wrapper {
  border-color: transparent;
  background: transparent;
  color: #ffffff;
}

.desktop-side-menu--expanded .side-nav-item:hover .nav-icon-wrapper {
  color: #343a43;
}

.side-nav-item:hover .side-nav-svg {
  stroke-width: 1.85;
}

.side-nav-item--active {
  background: transparent !important;
  color: #252a33 !important;
}

.side-nav-item--active .nav-icon-wrapper {
  border-color: transparent;
  background: transparent;
  color: #f97882;
  box-shadow: none;
}

.desktop-side-menu--expanded
  .side-nav-item--active
  .nav-icon-wrapper {
  color: #a6202b;
}

.side-nav-item--active .side-nav-svg {
  stroke-width: 1.9;
}

.side-nav-item:focus-visible .nav-icon-wrapper {
  outline: 2px solid rgba(166, 32, 43, 0.28);
  outline-offset: 2px;
}

.side-nav-label {
  min-width: 0;
  max-width: 0;
  overflow: hidden;
  color: #505761;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.2;
  opacity: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    max-width 140ms ease,
    opacity 90ms ease;
}

.desktop-side-menu--expanded .side-nav-label {
  max-width: 146px;
  opacity: 1;
  transition:
    max-width 220ms ease 55ms,
    opacity 140ms ease 90ms;
}

.side-nav-item--active .side-nav-label {
  color: #252a33;
  font-weight: 700;
}

.side-nav-indicator {
  width: 0;
  height: 14px;
  max-width: 0;
  margin-left: auto;
  flex: 0 0 0;
  overflow: hidden;
  color: #a6abb3;
  opacity: 0;
  stroke-width: 1.7;
  transition:
    width 140ms ease,
    max-width 140ms ease,
    flex-basis 140ms ease,
    opacity 100ms ease;
}

.desktop-side-menu--expanded .side-nav-indicator {
  width: 14px;
  max-width: 14px;
  flex-basis: 14px;
  opacity: 1;
  transition-delay: 55ms;
}

.side-nav-item:hover .side-nav-indicator,
.side-nav-item--active .side-nav-indicator {
  color: #a6202b;
}

.side-nav-empty {
  display: flex;
  min-height: 112px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  color: #9a9fa8;
  font-size: 11.5px;
  font-weight: 600;
}

.side-empty-icon {
  width: 20px;
  height: 20px;
  stroke-width: 1.5;
}

:global(.side-nav-tooltip) {
  padding: 7px 10px !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 7px !important;
  background: #252a33 !important;
  color: #f8fafc !important;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.24) !important;
  font-size: 11.5px !important;
  font-weight: 650 !important;
  letter-spacing: 0.01em !important;
}

@media (prefers-reduced-motion: reduce) {
  .desktop-side-menu,
  .desktop-side-menu::before,
  .desktop-side-menu ~ .app-bar-border,
  :global(.desktop-side-menu ~ .v-main),
  .side-brand-header,
  .side-brand-lockup,
  .side-brand-copy,
  .side-menu-toggle,
  .side-search-field,
  .side-search-trigger,
  .side-nav-item :deep(.v-list-item__content),
  .side-nav-label,
  .side-nav-indicator {
    transition: none !important;
  }
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
  position: relative;
  padding: 0 18px !important;
}

.header-version {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  padding: 5px 10px;
  transform: translate(-50%, -50%);
  color: #7a8798;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.055em;
  white-space: nowrap;
  border: 1px solid #e1e7ee;
  border-radius: 999px;
  background: #f8fafc;
  pointer-events: none;
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

@media (max-width: 559px) {
  .header-version {
    display: none;
  }
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

.mobile-bottom-navigation {
  z-index: 1200 !important;
  overflow: visible !important;
  border-top: 1px solid #dbe2ea !important;
  background: #ffffff !important;
  box-shadow: 0 -3px 14px rgba(15, 23, 42, 0.07) !important;
}

.mobile-bottom-navigation :deep(.v-bottom-navigation__content) {
  padding: 5px 8px 4px;
  align-items: stretch;
  gap: 2px;
}

.mobile-bottom-navigation :deep(.v-bottom-navigation__content > .v-btn) {
  min-width: 0 !important;
  max-width: none !important;
  min-height: 58px !important;
  padding: 0 3px !important;
  border-radius: 0 !important;
  background: transparent !important;
  color: #7b8797 !important;
  letter-spacing: 0 !important;
}

.mobile-bottom-navigation :deep(.v-btn__overlay) {
  opacity: 0 !important;
}

.mobile-bottom-item :deep(.v-btn__content) {
  gap: 4px !important;
}

.mobile-bottom-svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.65;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition:
    color 0.16s ease,
    stroke-width 0.16s ease;
}

.mobile-bottom-item span {
  display: block;
  width: 100%;
  overflow: hidden;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-bottom-item.v-btn--active {
  color: #14263d !important;
}

.mobile-bottom-item.v-btn--active::before {
  content: "";
  position: absolute;
  top: -5px;
  left: 50%;
  width: 30px;
  height: 2px;
  border-radius: 0 0 2px 2px;
  background: #c92a2a;
  transform: translateX(-50%);
}

.mobile-bottom-item.v-btn--active .mobile-bottom-svg {
  stroke-width: 1.9;
}

.mobile-bottom-item:focus-visible {
  outline: 2px solid #315f8d;
  outline-offset: -4px;
}

@media (hover: hover) {
  .mobile-bottom-item:hover {
    color: #31465f !important;
  }

  .mobile-bottom-item:hover .mobile-bottom-svg {
    stroke-width: 1.8;
  }
}

.mobile-menu-card {
  width: min(380px, calc(100vw - 16px)) !important;
  overflow: hidden !important;
  border: 1px solid #dbe2ea !important;
  border-radius: 12px !important;
  background: #ffffff !important;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.16) !important;
}

.mobile-menu-heading {
  display: flex;
  min-height: 62px;
  padding: 11px 12px 11px 16px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e4e9ef;
}

.mobile-menu-heading > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mobile-menu-heading strong {
  color: #14263d;
  font-size: 12.5px;
  font-weight: 800;
}

.mobile-menu-heading span {
  color: #7d8998;
  font-size: 9.5px;
}

.mobile-menu-heading button {
  display: grid;
  width: 32px;
  height: 32px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #718095;
  cursor: pointer;
}

.mobile-menu-heading button:hover {
  background: #f3f5f7;
  color: #14263d;
}

.mobile-menu-heading button:focus-visible {
  outline: 2px solid #315f8d;
  outline-offset: 1px;
}

.mobile-nav-scroll {
  max-height: min(66vh, 520px);
  padding: 2px 8px 10px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.mobile-nav-section h3 {
  margin: 0;
  padding: 12px 8px 5px;
  color: #7b8797;
  font-size: 8.5px;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.mobile-nav-section .v-list {
  padding: 0 !important;
  background: transparent !important;
}

.mobile-nav-item {
  position: relative;
  min-height: 56px !important;
  padding: 6px 9px !important;
  border-radius: 7px !important;
  color: #314157 !important;
}

.mobile-nav-section .mobile-nav-item:not(:last-child) {
  border-bottom: 1px solid #edf1f5 !important;
}

.mobile-nav-item :deep(.v-list-item__prepend) {
  margin-right: 11px !important;
}

.mobile-nav-item :deep(.v-list-item__append) {
  color: #9aa5b2;
}

.mobile-nav-item :deep(.v-list-item-title) {
  font-size: 11.5px !important;
  font-weight: 700 !important;
  line-height: 1.25 !important;
}

.mobile-nav-item :deep(.v-list-item-subtitle) {
  margin-top: 2px;
  color: #84909f !important;
  font-size: 9.25px !important;
  line-height: 1.25 !important;
  opacity: 1 !important;
}

.mobile-nav-icon {
  width: 32px;
  height: 32px;
  display: flex;
  flex: 0 0 32px;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: transparent;
  color: #637286;
}

.mobile-nav-svg,
.mobile-nav-chevron {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.mobile-nav-svg {
  width: 18px;
  height: 18px;
  stroke-width: 1.65;
}

.mobile-nav-chevron {
  width: 15px;
  height: 15px;
  stroke-width: 1.7;
}

.mobile-nav-item:focus-visible {
  outline: 2px solid #315f8d;
  outline-offset: -2px;
}

.mobile-nav-item.v-list-item--active {
  color: #14263d !important;
  background: #f5f7f9 !important;
}

.mobile-nav-item.v-list-item--active::before {
  content: "";
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 0;
  width: 2px;
  border-radius: 0 2px 2px 0;
  background: #c92a2a;
}

.mobile-nav-item.v-list-item--active .mobile-nav-icon {
  background: transparent;
  color: #14263d;
}

@media (hover: hover) {
  .mobile-nav-item:hover {
    background: #f7f9fa !important;
  }
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
