<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import moment from "moment";
import * as XLSX from "xlsx-js-style";
import { usepettyCashStore } from "~/stores/pettyCashStore";
import { useUserStore } from "~/stores/userStore";
import type {
  OfficeTransactionCategory,
  PettyCashCategory,
  PettyCashType,
} from "~/types/pettyCashModel";

definePageMeta({ layout: "admin" });

interface CategoryOption {
  value: OfficeTransactionCategory;
  type: PettyCashType;
  icon: string;
  tone: "blue" | "violet" | "amber" | "green" | "rose" | "slate";
}

interface Transaction {
  createdAt: number;
  id: string;
  date: string;
  category: OfficeTransactionCategory;
  description: string;
  responsible: string;
  amount: number;
  type: PettyCashType;
  images: string[];
  itemName: string;
  quantity: number;
  unit: string;
  assetLocation: string;
}

interface OfficeTransactionForm {
  type: PettyCashType;
  category: OfficeTransactionCategory;
  amount: number | null;
  description: string;
  responsible: string;
  images: string[];
  date: string;
  itemName: string;
  quantity: number;
  unit: string;
  assetLocation: string;
}

const categoryOptions: CategoryOption[] = [
  { value: "Setoran Modal", type: "in", icon: "mdi-bank-transfer-in", tone: "green" },
  { value: "Pendapatan Lainnya", type: "in", icon: "mdi-cash-plus", tone: "green" },
  { value: "Pengembalian Dana", type: "in", icon: "mdi-cash-refund", tone: "blue" },
  { value: "Aset & Inventaris", type: "out", icon: "mdi-laptop", tone: "violet" },
  { value: "Peralatan Kantor", type: "out", icon: "mdi-printer-outline", tone: "blue" },
  { value: "Operasional Kantor", type: "out", icon: "mdi-office-building-cog-outline", tone: "slate" },
  { value: "Utilitas", type: "out", icon: "mdi-flash-outline", tone: "amber" },
  { value: "Transportasi", type: "out", icon: "mdi-car-outline", tone: "blue" },
  { value: "Konsumsi", type: "out", icon: "mdi-food-outline", tone: "amber" },
  { value: "Perawatan & Perbaikan", type: "out", icon: "mdi-tools", tone: "violet" },
  { value: "Sewa", type: "out", icon: "mdi-home-city-outline", tone: "slate" },
  { value: "Gaji & Tunjangan", type: "out", icon: "mdi-account-cash-outline", tone: "green" },
  { value: "Pajak & Administrasi", type: "out", icon: "mdi-file-document-outline", tone: "rose" },
  { value: "Lainnya", type: "out", icon: "mdi-dots-horizontal-circle-outline", tone: "slate" },
];

const pettyCashStore = usepettyCashStore();
const userStore = useUserStore();

const isLoading = ref(true);
const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<string | null>(null);
const isUploadingImages = ref(false);
const isSaving = ref(false);
const activePreviewImage = ref<string | null>(null);

const selectedMonth = ref("all");
const selectedYear = ref(moment().format("YYYY"));
const filterType = ref<"all" | PettyCashType>("all");
const filterCategory = ref<"all" | OfficeTransactionCategory>("all");
const searchQuery = ref("");

const createEmptyForm = (
  type: PettyCashType = "out",
): OfficeTransactionForm => ({
  type,
  category: type === "in" ? "Setoran Modal" : "Operasional Kantor",
  amount: null,
  description: "",
  responsible: "",
  images: [],
  date: moment().format("YYYY-MM-DD"),
  itemName: "",
  quantity: 1,
  unit: "Unit",
  assetLocation: "Kantor",
});

const form = ref<OfficeTransactionForm>(createEmptyForm());

onMounted(async () => {
  try {
    isLoading.value = true;
    await pettyCashStore.tarikDataPettyCashAct();
  } finally {
    isLoading.value = false;
  }
});

function normalizeCategory(
  category: PettyCashCategory | undefined,
  type: PettyCashType,
): OfficeTransactionCategory {
  if (category === "Debet") return "Setoran Modal";
  if (category === "Kredit") return "Operasional Kantor";
  const option = categoryOptions.find((item) => item.value === category);
  if (option) return option.value;
  return type === "in" ? "Pendapatan Lainnya" : "Lainnya";
}

const transactions = computed<Transaction[]>(() =>
  pettyCashStore.getDataPettyCash.map((item) => {
    const timestamp = Number(item.createdAt || 0);
    const type: PettyCashType = item.type === "in" ? "in" : "out";
    return {
      id: item.id || `${timestamp}-${item.tanggal}-${item.amount}`,
      createdAt: timestamp,
      date: item.tanggal || "",
      category: normalizeCategory(item.kategori, type),
      description: item.keterangan || "",
      responsible: item.dikeluarkan_oleh || "",
      amount: Number(item.amount || 0),
      type,
      images: Array.isArray(item.bukti)
        ? item.bukti
        : item.bukti
          ? [item.bukti]
          : [],
      itemName: item.nama_item || "",
      quantity: Number(item.qty || 0),
      unit: item.satuan || "",
      assetLocation: item.lokasi_aset || "",
    };
  }),
);

const availableYears = computed(() => {
  const years = new Set<string>([
    moment().subtract(3, "year").format("YYYY"),
    moment().subtract(2, "year").format("YYYY"),
    moment().subtract(1, "year").format("YYYY"),
    moment().format("YYYY"),
    moment().add(1, "year").format("YYYY"),
  ]);
  transactions.value.forEach((transaction) => {
    const year = transaction.date?.slice(0, 4);
    if (year) years.add(year);
  });
  return [...years].sort((a, b) => Number(b) - Number(a));
});

const transactionsByPeriod = computed(() =>
  transactions.value.filter((transaction) => {
    const [year, month] = transaction.date.split("-");
    const matchesYear =
      selectedYear.value === "all" || year === selectedYear.value;
    const matchesMonth =
      selectedMonth.value === "all" || month === selectedMonth.value;
    return matchesYear && matchesMonth;
  }),
);

const totalIn = computed(() =>
  transactionsByPeriod.value
    .filter((transaction) => transaction.type === "in")
    .reduce((total, transaction) => total + transaction.amount, 0),
);
const totalOut = computed(() =>
  transactionsByPeriod.value
    .filter((transaction) => transaction.type === "out")
    .reduce((total, transaction) => total + transaction.amount, 0),
);
const netCashFlow = computed(() => totalIn.value - totalOut.value);
const totalAssetSpending = computed(() =>
  transactionsByPeriod.value
    .filter(
      (transaction) =>
        transaction.type === "out" &&
        transaction.category === "Aset & Inventaris",
    )
    .reduce((total, transaction) => total + transaction.amount, 0),
);

const categoryBreakdown = computed(() => {
  const totals = new Map<OfficeTransactionCategory, number>();
  transactionsByPeriod.value
    .filter((transaction) => transaction.type === "out")
    .forEach((transaction) => {
      totals.set(
        transaction.category,
        (totals.get(transaction.category) || 0) + transaction.amount,
      );
    });
  return [...totals.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalOut.value ? (amount / totalOut.value) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
});

const filteredTransactions = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase("id-ID");
  return transactionsByPeriod.value
    .filter(
      (transaction) =>
        filterType.value === "all" || transaction.type === filterType.value,
    )
    .filter(
      (transaction) =>
        filterCategory.value === "all" ||
        transaction.category === filterCategory.value,
    )
    .filter((transaction) => {
      if (!query) return true;
      return [
        transaction.description,
        transaction.category,
        transaction.itemName,
        transaction.responsible,
      ].some((value) => value.toLocaleLowerCase("id-ID").includes(query));
    })
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
    );
});

const availableFormCategories = computed(() =>
  categoryOptions
    .filter((category) => category.type === form.value.type)
    .map((category) => category.value),
);
const isAssetTransaction = computed(
  () =>
    form.value.type === "out" && form.value.category === "Aset & Inventaris",
);
const hasActiveFilters = computed(
  () =>
    selectedMonth.value !== "all" ||
    selectedYear.value !== moment().format("YYYY") ||
    filterType.value !== "all" ||
    filterCategory.value !== "all" ||
    Boolean(searchQuery.value),
);

function categoryMeta(category: OfficeTransactionCategory) {
  return (
    categoryOptions.find((item) => item.value === category) ||
    categoryOptions[categoryOptions.length - 1]
  );
}

function setTransactionType(type: PettyCashType) {
  form.value.type = type;
  if (!availableFormCategories.value.includes(form.value.category)) {
    form.value.category =
      type === "in" ? "Setoran Modal" : "Operasional Kantor";
  }
}

function openModal(type: PettyCashType = "out") {
  isEditMode.value = false;
  editingId.value = null;
  form.value = createEmptyForm(type);
  isModalOpen.value = true;
}

function openEditModal(transaction: Transaction) {
  uploadStore().setReset();
  isEditMode.value = true;
  editingId.value = transaction.id;
  form.value = {
    type: transaction.type,
    category: transaction.category,
    amount: transaction.amount,
    description: transaction.description,
    responsible: transaction.responsible,
    images: [...transaction.images],
    date: transaction.date,
    itemName: transaction.itemName,
    quantity: transaction.quantity || 1,
    unit: transaction.unit || "Unit",
    assetLocation: transaction.assetLocation || "Kantor",
  };
  isModalOpen.value = true;
}

function closeModal() {
  if (isSaving.value) return;
  isModalOpen.value = false;
  uploadStore().setReset();
}

function resetFilters() {
  selectedMonth.value = "all";
  selectedYear.value = moment().format("YYYY");
  filterType.value = "all";
  filterCategory.value = "all";
  searchQuery.value = "";
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  if (!files.length) return;
  isUploadingImages.value = true;
  try {
    form.value.images.push(...(await Promise.all(files.map(readImageFile))));
  } catch (error) {
    console.error("Gagal membaca bukti transaksi kantor", error);
    useNotificationStore().showError("Gambar bukti tidak dapat dibaca");
  } finally {
    isUploadingImages.value = false;
    target.value = "";
  }
};

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("File bukti tidak dapat dibaca"));
    reader.onerror = () =>
      reject(reader.error || new Error("File bukti tidak dapat dibaca"));
    reader.onabort = () => reject(new Error("Pembacaan file bukti dibatalkan"));
    reader.readAsDataURL(file);
  });
}

function removeImage(index: number) {
  form.value.images.splice(index, 1);
}
function previewImage(imageUrl: string) {
  activePreviewImage.value = imageUrl;
}

async function handleSubmit() {
  if (isSaving.value || isUploadingImages.value) return;
  if (!form.value.date) {
    return useNotificationStore().showError("Tanggal transaksi wajib diisi");
  }
  if (!form.value.amount || form.value.amount <= 0) {
    return useNotificationStore().showError("Nominal transaksi wajib diisi");
  }
  if (!form.value.category || !form.value.description.trim()) {
    return useNotificationStore().showError(
      "Kategori dan keterangan transaksi wajib diisi",
    );
  }
  if (!form.value.responsible.trim()) {
    return useNotificationStore().showError(
      "Penanggung jawab transaksi wajib diisi",
    );
  }
  if (isAssetTransaction.value && !form.value.itemName.trim()) {
    return useNotificationStore().showError(
      "Nama barang atau aset wajib diisi",
    );
  }

  const payload = {
    amount: Number(form.value.amount),
    keterangan: form.value.description.trim(),
    dikeluarkan_oleh: form.value.responsible.trim(),
    bukti: form.value.images,
    type: form.value.type,
    tanggal: form.value.date,
    kategori: form.value.category,
    nama_item: isAssetTransaction.value ? form.value.itemName.trim() : "",
    qty: isAssetTransaction.value ? Number(form.value.quantity || 0) : 0,
    satuan: isAssetTransaction.value ? form.value.unit.trim() : "",
    lokasi_aset: isAssetTransaction.value
      ? form.value.assetLocation.trim()
      : "",
  };

  isSaving.value = true;
  useloadingStore().setLoading(true);
  await nextTick();
  try {
    let saved = false;
    if (isEditMode.value && editingId.value) {
      saved = await pettyCashStore.updatePettyCashAct({
        id: editingId.value,
        ...payload,
        updatedAt: moment().unix(),
        updatedBy: userStore.getEmail || "",
      });
    } else {
      saved = await pettyCashStore.addPettyCashAct({
        ...payload,
        createdAt: moment().unix(),
        createdBy: userStore.getEmail || "",
      });
    }
    if (saved) {
      isModalOpen.value = false;
      uploadStore().setReset();
    }
  } finally {
    isSaving.value = false;
    useloadingStore().setLoading(false);
  }
}

async function deleteTransaction(id: string) {
  if (confirm("Hapus transaksi keuangan kantor ini?")) {
    await pettyCashStore.deletePettyCashAct(id);
  }
}

const formatNumber = (value: number) =>
  Number(value || 0).toLocaleString("id-ID");
const formatCurrency = (value: number) => `Rp ${formatNumber(value)}`;
const formatDate = (date: string) =>
  date ? moment(date, "YYYY-MM-DD").format("DD MMM YYYY") : "—";

function periodLabel() {
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  if (selectedMonth.value !== "all" && selectedYear.value !== "all") {
    return `${monthNames[Number(selectedMonth.value) - 1]} ${selectedYear.value}`;
  }
  if (selectedYear.value !== "all") return `Tahun ${selectedYear.value}`;
  return "Semua Periode";
}

function downloadExcel() {
  const reportTransactions = [...filteredTransactions.value].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const rows = reportTransactions.map((transaction, index) => [
    index + 1,
    transaction.date,
    transaction.type === "in" ? "Pemasukan" : "Pengeluaran",
    transaction.category,
    transaction.description,
    transaction.itemName,
    transaction.quantity || "",
    transaction.unit,
    transaction.assetLocation,
    transaction.responsible,
    transaction.type === "in" ? transaction.amount : 0,
    transaction.type === "out" ? transaction.amount : 0,
  ]);
  const reportIn = reportTransactions
    .filter((transaction) => transaction.type === "in")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const reportOut = reportTransactions
    .filter((transaction) => transaction.type === "out")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["LAPORAN KEUANGAN KANTOR PT. DUTA RAYA MARINE"],
    [`Periode: ${periodLabel()}`],
    [],
    [
      "No", "Tanggal", "Jenis", "Kategori", "Keterangan", "Item / Aset",
      "Qty", "Satuan", "Lokasi", "Penanggung Jawab", "Pemasukan",
      "Pengeluaran",
    ],
    ...rows,
    [],
    ["", "", "", "", "", "", "", "", "", "TOTAL", reportIn, reportOut],
    ["", "", "", "", "", "", "", "", "", "SELISIH", reportIn - reportOut, ""],
  ]);
  worksheet["!merges"] = [
    XLSX.utils.decode_range("A1:L1"),
    XLSX.utils.decode_range("A2:L2"),
  ];
  worksheet["!freeze"] = {
    xSplit: 0,
    ySplit: 4,
    topLeftCell: "A5",
    activePane: "bottomLeft",
    state: "frozen",
  };
  worksheet["!cols"] = [
    { wch: 6 }, { wch: 14 }, { wch: 13 }, { wch: 24 }, { wch: 42 },
    { wch: 24 }, { wch: 8 }, { wch: 10 }, { wch: 18 }, { wch: 20 },
    { wch: 18 }, { wch: 18 },
  ];
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "173F66" } },
    alignment: { horizontal: "center", vertical: "center" },
  };
  const currencyFormat = '"Rp "#,##0;[Red]\-"Rp "#,##0';
  worksheet.A1.s = { font: { bold: true, sz: 16, color: { rgb: "173F66" } } };
  worksheet.A2.s = { font: { italic: true, color: { rgb: "64748B" } } };
  for (let column = 0; column < 12; column++) {
    worksheet[XLSX.utils.encode_cell({ r: 3, c: column })].s = headerStyle;
  }
  for (let row = 4; row < 4 + rows.length; row++) {
    [10, 11].forEach((column) => {
      const cell = XLSX.utils.encode_cell({ r: row, c: column });
      if (worksheet[cell]) worksheet[cell].z = currencyFormat;
    });
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Keuangan Kantor");
  XLSX.writeFile(workbook, `Laporan Keuangan Kantor DRM - ${periodLabel()}.xlsx`);
}
</script>

<template>
  <div class="office-finance-page">
    <v-btn
      variant="text"
      color="grey-darken-3"
      prepend-icon="mdi-arrow-left"
      class="back-button text-none"
      @click="$router.go(-1)"
    >
      Kembali
    </v-btn>

    <header class="finance-hero">
      <div class="finance-hero-copy">
        <span class="finance-eyebrow">Office Finance</span>
        <h1>Keuangan Kantor</h1>
        <p>
          Catat seluruh pemasukan dan pengeluaran perusahaan, termasuk
          pembelian aset, inventaris, dan kebutuhan operasional kantor.
        </p>
      </div>
      <div class="finance-hero-actions">
        <v-btn
          variant="outlined"
          color="grey-darken-1"
          prepend-icon="mdi-file-excel-outline"
          class="text-none export-button"
          @click="downloadExcel"
        >
          Export Excel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          class="text-none create-button"
          @click="openModal('out')"
        >
          Catat Transaksi
        </v-btn>
      </div>
    </header>

    <section class="metric-grid" aria-label="Ringkasan keuangan kantor">
      <template v-if="isLoading">
        <div v-for="index in 2" :key="index" class="metric-card">
          <v-skeleton-loader type="text, heading" />
        </div>
      </template>
      <template v-else>
        <!-- <article class="metric-card metric-card--net">
          <div class="metric-card-heading">
            <span>Selisih Periode</span>
            <span class="metric-icon">
              <v-icon icon="mdi-chart-timeline-variant" size="19" />
            </span>
          </div>
          <strong>{{ formatCurrency(netCashFlow) }}</strong>
          <small>{{ periodLabel() }}</small>
        </article>
        <article class="metric-card">
          <div class="metric-card-heading">
            <span>Total Pemasukan</span>
            <span class="metric-icon metric-icon--green">
              <v-icon icon="mdi-arrow-down-left" size="19" />
            </span>
          </div>
          <strong class="metric-value--green">{{ formatCurrency(totalIn) }}</strong>
          <small>Transaksi dana masuk</small>
        </article> -->
        <article class="metric-card">
          <div class="metric-card-heading">
            <span>Total Pengeluaran</span>
            <span class="metric-icon metric-icon--rose">
              <v-icon icon="mdi-arrow-up-right" size="19" />
            </span>
          </div>
          <strong class="metric-value--rose">{{ formatCurrency(totalOut) }}</strong>
          <small>Seluruh biaya yang dikeluarkan</small>
        </article>
        <article class="metric-card">
          <div class="metric-card-heading">
            <span>Belanja Aset</span>
            <span class="metric-icon metric-icon--violet">
              <v-icon icon="mdi-laptop" size="19" />
            </span>
          </div>
          <strong>{{ formatCurrency(totalAssetSpending) }}</strong>
          <small>Aset &amp; inventaris periode ini</small>
        </article>
      </template>
    </section>

    <section class="finance-overview-grid">
      <article class="category-overview-card">
        <div class="section-heading">
          <div>
            <span class="section-kicker">Expense allocation</span>
            <h2>Pengeluaran per Kategori</h2>
          </div>
          <span class="section-count">{{ categoryBreakdown.length }} kategori</span>
        </div>
        <div v-if="categoryBreakdown.length" class="category-breakdown-list">
          <div
            v-for="item in categoryBreakdown"
            :key="item.category"
            class="category-breakdown-item"
          >
            <span
              class="category-icon"
              :class="`category-icon--${categoryMeta(item.category).tone}`"
            >
              <v-icon :icon="categoryMeta(item.category).icon" size="17" />
            </span>
            <div class="category-breakdown-main">
              <div>
                <span>{{ item.category }}</span>
                <strong>{{ formatCurrency(item.amount) }}</strong>
              </div>
              <div class="category-progress-track">
                <span :style="{ width: `${item.percentage}%` }"></span>
              </div>
            </div>
            <span class="category-percentage">{{ item.percentage.toFixed(1) }}%</span>
          </div>
        </div>
        <div v-else class="overview-empty">
          <v-icon icon="mdi-chart-donut" size="28" />
          <span>Belum ada pengeluaran pada periode ini.</span>
        </div>
      </article>

      <article class="period-card">
        <div class="section-heading">
          <div>
            <span class="section-kicker">Reporting period</span>
            <h2>Periode Laporan</h2>
          </div>
          <v-icon icon="mdi-calendar-month-outline" size="21" />
        </div>
        <div class="period-fields">
          <label>
            <span>Bulan</span>
            <select v-model="selectedMonth">
              <option value="all">Semua Bulan</option>
              <option value="01">Januari</option><option value="02">Februari</option>
              <option value="03">Maret</option><option value="04">April</option>
              <option value="05">Mei</option><option value="06">Juni</option>
              <option value="07">Juli</option><option value="08">Agustus</option>
              <option value="09">September</option><option value="10">Oktober</option>
              <option value="11">November</option><option value="12">Desember</option>
            </select>
          </label>
          <label>
            <span>Tahun</span>
            <select v-model="selectedYear">
              <option value="all">Semua Tahun</option>
              <option v-for="year in availableYears" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </label>
        </div>
        <div class="period-summary">
          <div><span>Transaksi</span><strong>{{ transactionsByPeriod.length }}</strong></div>
          <!-- <div><span>Kategori Aktif</span><strong>{{ categoryBreakdown.length }}</strong></div> -->
        </div>
      </article>
    </section>

    <section class="transaction-panel">
      <div class="transaction-panel-header">
        <div>
          <!-- <span class="section-kicker">Office ledger</span> -->
          <div class="transaction-title-row">
            <h2>Daftar Transaksi</h2>
            <span>{{ filteredTransactions.length }} data</span>
          </div>
        </div>
        <v-btn
          icon="mdi-file-excel-outline"
          variant="text"
          color="success"
          aria-label="Export transaksi ke Excel"
          @click="downloadExcel"
        />
      </div>

      <div class="transaction-toolbar">
        <label class="search-field">
          <v-icon icon="mdi-magnify" size="18" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari keterangan, kategori, aset, atau PIC..."
          />
        </label>
        <label class="toolbar-select">
          <span>Jenis</span>
          <select v-model="filterType">
            <option value="all">Semua Jenis</option>
            <option value="in">Pemasukan</option>
            <option value="out">Pengeluaran</option>
          </select>
        </label>
        <label class="toolbar-select toolbar-select--category">
          <span>Kategori</span>
          <select v-model="filterCategory">
            <option value="all">Semua Kategori</option>
            <option
              v-for="category in categoryOptions"
              :key="category.value"
              :value="category.value"
            >
              {{ category.value }}
            </option>
          </select>
        </label>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="clear-filter-button"
          @click="resetFilters"
        >
          <v-icon icon="mdi-filter-remove-outline" size="17" /> Reset
        </button>
      </div>

      <div class="transaction-mobile-list">
        <div v-if="!filteredTransactions.length" class="empty-state">
          <v-icon icon="mdi-text-box-search-outline" size="38" />
          <strong>Belum ada transaksi</strong>
          <span>Sesuaikan filter atau tambahkan transaksi kantor baru.</span>
        </div>
        <article
          v-for="transaction in filteredTransactions"
          :key="transaction.id"
          class="transaction-mobile-card"
        >
          <div class="mobile-card-heading">
            <span
              class="category-icon"
              :class="`category-icon--${categoryMeta(transaction.category).tone}`"
            >
              <v-icon :icon="categoryMeta(transaction.category).icon" size="17" />
            </span>
            <div>
              <strong>{{ transaction.description }}</strong>
              <span>{{ formatDate(transaction.date) }} · {{ transaction.category }}</span>
            </div>
            <span
              class="transaction-type-badge"
              :class="`transaction-type-badge--${transaction.type}`"
            >
              {{ transaction.type === "in" ? "Masuk" : "Keluar" }}
            </span>
          </div>
          <div v-if="transaction.itemName" class="mobile-asset-info">
            <v-icon icon="mdi-package-variant-closed" size="15" />
            {{ transaction.itemName }} · {{ transaction.quantity }}
            {{ transaction.unit }} · {{ transaction.assetLocation }}
          </div>
          <div class="mobile-card-meta">
            <span>PIC: {{ transaction.responsible || "—" }}</span>
            <strong
              :class="transaction.type === 'in' ? 'transaction-amount--in' : 'transaction-amount--out'"
            >
              {{ transaction.type === "in" ? "+" : "-" }}
              {{ formatCurrency(transaction.amount) }}
            </strong>
          </div>
          <div class="mobile-card-actions">
            <button
              v-for="(image, imageIndex) in transaction.images"
              :key="`${transaction.id}-${imageIndex}`"
              type="button"
              aria-label="Lihat bukti transaksi"
              @click="previewImage(image)"
            >
              <v-icon icon="mdi-image-outline" size="17" />
            </button>
            <button type="button" @click="openEditModal(transaction)">
              <v-icon icon="mdi-pencil-outline" size="17" />
            </button>
            <button
              type="button"
              class="mobile-delete-button"
              @click="deleteTransaction(transaction.id)"
            >
              <v-icon icon="mdi-delete-outline" size="17" />
            </button>
          </div>
        </article>
      </div>

      <div class="transaction-table-wrap">
        <table class="transaction-table">
          <thead>
            <tr>
              <th>No.</th><th>Tanggal</th><th>Jenis</th><th>Kategori</th>
              <th>Detail Transaksi</th><th>Bukti</th><th>Penanggung Jawab</th>
              <th>Nominal</th><th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!filteredTransactions.length">
              <td colspan="9">
                <div class="empty-state">
                  <v-icon icon="mdi-text-box-search-outline" size="38" />
                  <strong>Belum ada transaksi</strong>
                  <span>Sesuaikan filter atau tambahkan transaksi kantor baru.</span>
                </div>
              </td>
            </tr>
            <tr
              v-for="(transaction, index) in filteredTransactions"
              :key="transaction.id"
            >
              <td class="table-number">{{ index + 1 }}</td>
              <td class="table-date">{{ formatDate(transaction.date) }}</td>
              <td>
                <span
                  class="transaction-type-badge"
                  :class="`transaction-type-badge--${transaction.type}`"
                >
                  {{ transaction.type === "in" ? "Masuk" : "Keluar" }}
                </span>
              </td>
              <td>
                <div class="table-category">
                  <span
                    class="category-icon"
                    :class="`category-icon--${categoryMeta(transaction.category).tone}`"
                  >
                    <v-icon :icon="categoryMeta(transaction.category).icon" size="16" />
                  </span>
                  <span>{{ transaction.category }}</span>
                </div>
              </td>
              <td>
                <div class="transaction-detail-cell">
                  <strong>{{ transaction.description }}</strong>
                  <span v-if="transaction.itemName">
                    {{ transaction.itemName }} · {{ transaction.quantity }} {{ transaction.unit }}
                    <template v-if="transaction.assetLocation">· {{ transaction.assetLocation }}</template>
                  </span>
                </div>
              </td>
              <td>
                <div v-if="transaction.images.length" class="proof-buttons">
                  <button
                    v-for="(image, imageIndex) in transaction.images"
                    :key="`${transaction.id}-proof-${imageIndex}`"
                    type="button"
                    :aria-label="`Lihat bukti ${imageIndex + 1}`"
                    @click="previewImage(image)"
                  >
                    <v-icon icon="mdi-image-outline" size="17" /> {{ imageIndex + 1 }}
                  </button>
                </div>
                <span v-else class="table-empty-value">—</span>
              </td>
              <td>{{ transaction.responsible || "—" }}</td>
              <td
                class="transaction-amount"
                :class="transaction.type === 'in' ? 'transaction-amount--in' : 'transaction-amount--out'"
              >
                {{ transaction.type === "in" ? "+" : "-" }}
                {{ formatCurrency(transaction.amount) }}
              </td>
              <td>
                <div class="table-actions">
                  <v-btn
                    icon="mdi-pencil-outline"
                    variant="text"
                    color="primary"
                    size="small"
                    aria-label="Edit transaksi"
                    @click="openEditModal(transaction)"
                  />
                  <v-btn
                    icon="mdi-delete-outline"
                    variant="text"
                    color="error"
                    size="small"
                    aria-label="Hapus transaksi"
                    @click="deleteTransaction(transaction.id)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="isModalOpen" class="transaction-dialog-backdrop">
      <div
        class="transaction-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-dialog-title"
      >
        <header class="transaction-dialog-header">
          <div class="transaction-dialog-heading">
            <span class="transaction-dialog-icon">
              <v-icon icon="mdi-cash-register" size="20" />
            </span>
            <div>
              <h2 id="transaction-dialog-title">
                {{ isEditMode ? "Edit Transaksi" : "Catat Transaksi Kantor" }}
              </h2>
              <p>Lengkapi informasi transaksi dan bukti pendukung.</p>
            </div>
          </div>
          <button
            type="button"
            class="dialog-close-button"
            :disabled="isSaving"
            aria-label="Tutup dialog transaksi"
            @click="closeModal"
          >
            <v-icon icon="mdi-close" size="20" />
          </button>
        </header>

        <form
          class="transaction-form"
          @submit.prevent="handleSubmit"
        >
          <div
            class="transaction-form-body"
            :class="{ 'transaction-form-body--asset': isAssetTransaction }"
          >
          <section class="form-section form-section--primary">
            <div class="form-section-heading">
              <div><span>01</span><h3>Informasi Transaksi</h3></div>
              <p>Tentukan jenis, kategori, tanggal, dan nominal.</p>
            </div>
            <div class="transaction-type-switch">
              <button
                type="button"
                :class="{ active: form.type === 'out' }"
                @click="setTransactionType('out')"
              >
                <v-icon icon="mdi-arrow-up-right" size="17" /> Pengeluaran
              </button>
              <button
                type="button"
                :class="{ active: form.type === 'in' }"
                @click="setTransactionType('in')"
              >
                <v-icon icon="mdi-arrow-down-left" size="17" /> Pemasukan
              </button>
            </div>
            <div class="form-grid form-grid--three">
              <a-date-picker-new v-model="form.date" label="Tanggal" />
              <a-select-new
                v-model="form.category"
                :items="availableFormCategories"
                label="Kategori"
                placeholder="Pilih kategori"
              />
              <a-field-number-new
                v-model="form.amount"
                label="Nominal (IDR)"
                placeholder="0"
              />
            </div>
          </section>

          <section class="form-section form-section--detail">
            <div class="form-section-heading">
              <div><span>02</span><h3>Detail Transaksi</h3></div>
              <p>Tambahkan keperluan dan penanggung jawab transaksi.</p>
            </div>
            <a-textarea-new
              v-model="form.description"
              label="Keterangan / Keperluan"
              placeholder="Contoh: Pembelian HP untuk inventory tim operasional"
              rows="2"
            />
            <div class="form-grid form-grid-spaced">
              <a-text-field-new
                v-model="form.responsible"
                label="Penanggung Jawab"
                placeholder="Nama PIC transaksi"
              />
            </div>
          </section>

          <section
            v-if="isAssetTransaction"
            class="form-section form-section--asset asset-section"
          >
            <div class="form-section-heading">
              <div><span>03</span><h3>Detail Aset &amp; Inventaris</h3></div>
              <p>Data ini membantu identifikasi barang milik kantor.</p>
            </div>
            <div class="asset-notice">
              <v-icon icon="mdi-information-outline" size="18" />
              <span>
                Catat nama barang, jumlah, dan lokasi penempatan agar mudah
                ditelusuri sebagai inventaris kantor.
              </span>
            </div>
            <div class="form-grid asset-grid">
              <a-text-field-new
                v-model="form.itemName"
                label="Nama Barang / Aset"
                placeholder="Contoh: Samsung Galaxy S24"
              />
              <a-field-number-new v-model="form.quantity" label="Qty" placeholder="1" />
              <a-select-new
                v-model="form.unit"
                :items="['Unit', 'Pcs', 'Set', 'Lot', 'Box']"
                label="Satuan"
              />
              <a-text-field-new
                v-model="form.assetLocation"
                label="Lokasi / Pengguna"
                placeholder="Contoh: Kantor Batam / Ridwan"
              />
            </div>
          </section>

          <section class="form-section form-section--proof">
            <div class="form-section-heading">
              <div>
                <span>{{ isAssetTransaction ? "04" : "03" }}</span>
                <h3>Bukti Transaksi</h3>
              </div>
              <p>Unggah nota, invoice, atau bukti pembayaran.</p>
            </div>
            <label class="proof-upload-box">
              <input
                type="file"
                accept="image/*"
                multiple
                :disabled="isUploadingImages || isSaving"
                @change="handleImageUpload"
              />
              <span class="proof-upload-icon">
                <v-icon icon="mdi-tray-arrow-up" size="20" />
              </span>
              <span>
                <strong>
                  {{ isUploadingImages ? "Menyiapkan gambar..." : "Pilih bukti transaksi" }}
                </strong>
                <small>Format gambar, dapat memilih lebih dari satu file</small>
              </span>
            </label>
            <div v-if="form.images.length" class="proof-preview-grid">
              <div
                v-for="(image, index) in form.images"
                :key="`${index}-${image.slice(-20)}`"
                class="proof-preview-card"
              >
                <img :src="image" :alt="`Bukti transaksi ${index + 1}`" />
                <button
                  type="button"
                  :disabled="isSaving"
                  :aria-label="`Hapus bukti ${index + 1}`"
                  @click="removeImage(index)"
                >
                  <v-icon icon="mdi-close" size="15" />
                </button>
              </div>
            </div>
          </section>
          </div>

          <footer class="transaction-dialog-footer">
            <p>Pastikan kategori dan nominal sudah sesuai sebelum disimpan.</p>
            <div>
              <v-btn
                variant="outlined"
                color="grey-darken-1"
                size="small"
                class="text-none dialog-cancel-button"
                :disabled="isSaving"
                @click="closeModal"
              >
                Batal
              </v-btn>
              <v-btn
                type="submit"
                color="primary"
                variant="flat"
                size="small"
                prepend-icon="mdi-content-save-outline"
                class="text-none dialog-save-button"
                :disabled="isSaving || isUploadingImages"
              >
                {{ isEditMode ? "Simpan Perubahan" : "Simpan Transaksi" }}
              </v-btn>
            </div>
          </footer>
        </form>
      </div>
    </div>

    <div
      v-if="activePreviewImage"
      class="proof-lightbox"
      @click="activePreviewImage = null"
    >
      <button type="button" aria-label="Tutup preview">
        <v-icon icon="mdi-close" size="22" />
      </button>
      <img :src="activePreviewImage" alt="Preview bukti transaksi" />
      <span>Klik area gelap untuk menutup</span>
    </div>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }

.office-finance-page {
  width: 100%;
  max-width: 1500px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 8px 1px 1px;
  color: #243142;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.back-button {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0 !important;
}

.finance-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding: 22px 24px;
  background: #ffffff;
  border: 1px solid #dfe4ea;
  border-radius: 10px;
}

.finance-hero-copy { min-width: 0; }

.finance-eyebrow,
.section-kicker {
  display: block;
  margin-bottom: 4px;
  color: #6f7d8c;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.09em;
  line-height: 1.3;
  text-transform: uppercase;
}

.finance-hero h1 {
  margin: 0;
  color: #202a36;
  font-size: 25px;
  font-weight: 750;
  letter-spacing: -0.025em;
  line-height: 1.25;
}

.finance-hero p {
  max-width: 720px;
  margin: 6px 0 0;
  color: #75808d;
  font-size: 12px;
  line-height: 1.55;
}

.finance-hero-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 9px;
}

.export-button,
.create-button {
  height: 36px !important;
  padding-inline: 15px !important;
  font-size: 11px !important;
  font-weight: 650 !important;
  letter-spacing: 0 !important;
  border-radius: 5px !important;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.metric-card {
  min-width: 0;
  min-height: 126px;
  padding: 17px 18px;
  background: #ffffff;
  border: 1px solid #dfe4ea;
  border-radius: 8px;
}

.metric-card--net {
  color: #ffffff;
  background: #20364d;
  border-color: #20364d;
}

.metric-card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 13px;
  color: #738091;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.065em;
  text-transform: uppercase;
}

.metric-card--net .metric-card-heading { color: #bac8d8; }

.metric-icon {
  display: grid;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  place-items: center;
  color: #e8eef5;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.metric-icon--green { color: #24865b; background: #e9f7f0; }
.metric-icon--rose { color: #b44f5d; background: #fcedef; }
.metric-icon--violet { color: #6f5a9d; background: #f1eef8; }

.metric-card > strong {
  display: block;
  overflow: hidden;
  color: #243142;
  font-size: clamp(17px, 1.8vw, 23px);
  font-weight: 750;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.025em;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-card--net > strong { color: #ffffff; }
.metric-card .metric-value--green { color: #25815a; }
.metric-card .metric-value--rose { color: #050404; }

.metric-card small {
  display: block;
  margin-top: 6px;
  color: #8b96a2;
  font-size: 9px;
}
.metric-card--net small { color: #aebdcd; }

.finance-overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(290px, 0.7fr);
  gap: 12px;
  margin-top: 12px;
}

.category-overview-card,
.period-card,
.transaction-panel {
  background: #ffffff;
  border: 1px solid #dfe4ea;
  border-radius: 8px;
}

.category-overview-card,
.period-card { padding: 17px 18px; }

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.section-heading h2,
.transaction-panel-header h2 {
  margin: 0;
  color: #27313d;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
}

.section-count,
.transaction-title-row > span {
  padding: 4px 8px;
  color: #647181;
  font-size: 9px;
  font-weight: 650;
  background: #f3f5f7;
  border: 1px solid #e2e6ea;
  border-radius: 4px;
}

.category-breakdown-list { display: grid; gap: 10px; }

.category-breakdown-item {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) 42px;
  align-items: center;
  gap: 9px;
}

.category-icon {
  display: inline-grid;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 5px;
}

.category-icon--blue { color: #356b98; background: #edf4fa; }
.category-icon--violet { color: #755fa0; background: #f2eff8; }
.category-icon--amber { color: #9a6b22; background: #fbf4e8; }
.category-icon--green { color: #34775a; background: #eaf6f0; }
.category-icon--rose { color: #a94e5c; background: #fbeef0; }
.category-icon--slate { color: #59697a; background: #eff2f5; }

.category-breakdown-main { min-width: 0; }

.category-breakdown-main > div:first-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 5px;
  color: #4e5c6c;
  font-size: 10px;
}

.category-breakdown-main strong {
  color: #303b48;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.category-progress-track {
  height: 4px;
  overflow: hidden;
  background: #edf0f3;
  border-radius: 999px;
}

.category-progress-track span {
  display: block;
  min-width: 3px;
  height: 100%;
  background: #527da4;
  border-radius: inherit;
}

.category-percentage {
  color: #778391;
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.overview-empty {
  display: flex;
  min-height: 114px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  color: #929ca7;
  font-size: 10px;
}

.period-card .section-heading > .v-icon { color: #708093; }

.period-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.period-fields label,
.toolbar-select { display: flex; flex-direction: column; gap: 5px; }

.period-fields label > span,
.toolbar-select > span {
  color: #7b8693;
  font-size: 9px;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.period-fields select,
.toolbar-select select {
  width: 100%;
  height: 34px;
  padding: 0 28px 0 9px;
  color: #354353;
  font: inherit;
  font-size: 10px;
  font-weight: 600;
  background: #ffffff;
  border: 1px solid #cfd6dd;
  border-radius: 4px;
  outline: none;
}

.period-fields select:focus,
.toolbar-select select:focus {
  border-color: #6f94b8;
  box-shadow: 0 0 0 2px rgba(49, 95, 140, 0.1);
}

.period-summary {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1px;
  margin-top: 14px;
  overflow: hidden;
  background: #dfe4e9;
  border: 1px solid #dfe4e9;
  border-radius: 5px;
}

.period-summary > div {
  display: flex;
  min-height: 48px;
  padding: 8px 10px;
  align-items: flex-start;
  justify-content: center;
  flex-direction: column;
  background: #f8f9fb;
}

.period-summary span {
  color: #818b96;
  font-size: 8px;
  font-weight: 650;
  text-transform: uppercase;
}

.period-summary strong { margin-top: 2px; color: #344250; font-size: 15px; }

.transaction-panel { margin-top: 12px; overflow: hidden; }

.transaction-panel-header {
  display: flex;
  min-height: 64px;
  padding: 13px 18px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-bottom: 1px solid #e4e8ec;
}

.transaction-title-row { display: flex; align-items: center; gap: 9px; }

.transaction-toolbar {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) 145px minmax(190px, 230px) auto;
  align-items: end;
  gap: 9px;
  padding: 11px 18px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e8ec;
}

.search-field {
  display: flex;
  height: 34px;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  color: #7d8996;
  background: #ffffff;
  border: 1px solid #cfd6dd;
  border-radius: 4px;
}

.search-field:focus-within {
  border-color: #6f94b8;
  box-shadow: 0 0 0 2px rgba(49, 95, 140, 0.1);
}

.search-field input {
  width: 100%;
  min-width: 0;
  color: #344250;
  font: inherit;
  font-size: 10px;
  background: transparent;
  border: 0;
  outline: 0;
}

.search-field input::placeholder { color: #9aa3ad; }

.clear-filter-button {
  display: inline-flex;
  height: 34px;
  padding: 0 11px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #697686;
  font: inherit;
  font-size: 10px;
  font-weight: 600;
  background: #ffffff;
  border: 1px solid #cfd6dd;
  border-radius: 4px;
  cursor: pointer;
}

.transaction-table-wrap { overflow-x: auto; }

.transaction-table {
  width: 100%;
  min-width: 1180px;
  color: #465463;
  font-size: 10px;
  border-collapse: collapse;
}

.transaction-table th {
  height: 34px;
  padding: 7px 9px;
  color: #687584;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.055em;
  text-align: left;
  text-transform: uppercase;
  background: #f4f6f8;
  border-bottom: 1px solid #dfe4e9;
}

.transaction-table td {
  padding: 9px;
  vertical-align: middle;
  border-bottom: 1px solid #e9ecef;
}

.transaction-table tbody tr:last-child td { border-bottom: 0; }
.transaction-table tbody tr:hover { background: #fafbfc; }

.transaction-table th:first-child,
.transaction-table td:first-child { width: 42px; text-align: center; }

.transaction-table th:nth-child(8),
.transaction-table td:nth-child(8) { text-align: right; }

.transaction-table th:last-child,
.transaction-table td:last-child { width: 78px; text-align: center; }

.table-number,
.table-date {
  color: #758190;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.transaction-type-badge {
  display: inline-flex;
  min-height: 22px;
  padding: 0 7px;
  align-items: center;
  color: #657282;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.035em;
  text-transform: uppercase;
  border: 1px solid;
  border-radius: 4px;
}

.transaction-type-badge--in { color: #287252; background: #eef8f3; border-color: #cce8da; }
.transaction-type-badge--out { color: #a04956; background: #fcf1f2; border-color: #efd4d8; }

.table-category {
  display: flex;
  min-width: 150px;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.transaction-detail-cell {
  display: flex;
  max-width: 290px;
  min-width: 150px;
  flex-direction: column;
  gap: 2px;
}

.transaction-detail-cell strong {
  overflow-wrap: anywhere;
  color: #334150;
  font-weight: 650;
  line-height: 1.4;
}

.transaction-detail-cell span { color: #87919d; font-size: 9px; line-height: 1.4; }

.proof-buttons { display: flex; flex-wrap: wrap; gap: 4px; }

.proof-buttons button {
  display: inline-flex;
  height: 26px;
  padding: 0 7px;
  align-items: center;
  gap: 4px;
  color: #536577;
  font: inherit;
  font-size: 9px;
  background: #f5f7f9;
  border: 1px solid #d7dde3;
  border-radius: 4px;
  cursor: pointer;
}

.table-empty-value { color: #a1a9b2; }

.transaction-amount {
  min-width: 128px;
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.transaction-amount--in { color: #2c7957; }
.transaction-amount--out { color: #b14e5b; }
.table-actions { display: flex; align-items: center; justify-content: center; gap: 1px; }

.empty-state {
  display: flex;
  min-height: 150px;
  padding: 24px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;
  color: #929ca7;
  text-align: center;
}

.empty-state strong { color: #677483; font-size: 11px; }
.empty-state span { font-size: 9px; }
.transaction-mobile-list { display: none; }

.transaction-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(22, 29, 37, 0.5);
}

.transaction-dialog {
  display: flex;
  width: 100%;
  max-width: 960px;
  max-height: calc(100vh - 48px);
  flex-direction: column;
  overflow: hidden;
  color: #243142;
  background: #f5f6f8;
  border: 1px solid #d9dee5;
  border-radius: 10px;
  box-shadow: 0 20px 55px rgba(20, 30, 43, 0.22);
}

.transaction-dialog-header {
  display: flex;
  flex: 0 0 auto;
  min-height: 58px;
  padding: 10px 14px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  background: #ffffff;
  border-bottom: 1px solid #dfe3e8;
}

.transaction-dialog-heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 11px;
}

.transaction-dialog-icon {
  display: grid;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  place-items: center;
  color: #315f8c;
  background: #eef3f8;
  border: 1px solid #dce6ef;
  border-radius: 6px;
}

.transaction-dialog-heading h2 { margin: 0; color: #202833; font-size: 15px; font-weight: 700; }
.transaction-dialog-heading p { margin: 2px 0 0; color: #7d8792; font-size: 10px; }

.dialog-close-button {
  display: grid;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  padding: 0;
  place-items: center;
  color: #718090;
  background: transparent;
  border: 0;
  border-radius: 5px;
  cursor: pointer;
}
.dialog-close-button:hover:not(:disabled) { background: #f1f3f5; }

.transaction-form {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  overflow: hidden;
}

.transaction-form-body {
  display: grid;
  min-height: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-areas:
    "primary primary"
    "detail proof";
  gap: 8px;
  padding: 9px;
  overflow: visible;
}

.transaction-form-body--asset {
  grid-template-areas:
    "primary primary"
    "detail proof"
    "asset asset";
}

.form-section {
  min-width: 0;
  padding: 10px;
  background: #ffffff;
  border: 1px solid #dfe3e8;
  border-radius: 7px;
}

.form-section--primary {
  display: grid;
  grid-area: primary;
  grid-template-columns: 220px minmax(0, 1fr);
  column-gap: 10px;
}
.form-section--detail { grid-area: detail; }
.form-section--proof { grid-area: proof; }
.form-section--asset {
  display: grid;
  grid-area: asset;
  grid-template-columns: 190px minmax(0, 1fr);
  column-gap: 10px;
}

.form-section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.form-section--primary > .form-section-heading,
.form-section--asset > .form-section-heading { grid-column: 1 / -1; }

.form-section-heading > div { display: flex; align-items: center; gap: 8px; }

.form-section-heading > div > span {
  display: inline-grid;
  width: 23px;
  height: 21px;
  place-items: center;
  color: #5a6877;
  font-size: 8px;
  font-weight: 700;
  background: #f1f3f5;
  border: 1px solid #e0e4e8;
  border-radius: 4px;
}

.form-section-heading h3 { margin: 0; color: #2c3743; font-size: 12px; font-weight: 700; line-height: 21px; }
.form-section-heading p { margin: 3px 0 0; color: #8a949f; font-size: 9px; text-align: right; }

.transaction-type-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  width: 100%;
  max-width: none;
  margin: 0;
  align-self: end;
  padding: 3px;
  background: #eef1f4;
  border-radius: 5px;
}

.transaction-type-switch button {
  display: flex;
  height: 30px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #718091;
  font: inherit;
  font-size: 10px;
  font-weight: 600;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}

.transaction-type-switch button.active {
  color: #315f8c;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(28, 39, 52, 0.12);
}

.form-grid { display: grid; gap: 8px; }
.form-grid--three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.form-grid--two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.form-grid-spaced { margin-top: 8px; }
.asset-section { border-color: #ddd8eb; }

.asset-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-height: 48px;
  margin: 0;
  padding: 7px 9px;
  color: #65577f;
  font-size: 9px;
  line-height: 1.5;
  background: #f6f3fa;
  border: 1px solid #e6dff1;
  border-radius: 5px;
}

.asset-grid { grid-template-columns: minmax(180px, 1.6fr) 90px 120px minmax(180px, 1.3fr); }

.proof-upload-box {
  position: relative;
  display: flex;
  min-height: 50px;
  padding: 7px 9px;
  align-items: center;
  gap: 10px;
  color: #4b5b6c;
  background: #fbfcfd;
  border: 1px dashed #b9c3cd;
  border-radius: 5px;
  cursor: pointer;
}

.proof-upload-box:hover { background: #f5f8fb; border-color: #7f9db9; }

.proof-upload-box > input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.proof-upload-icon {
  display: grid;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  place-items: center;
  color: #315f8c;
  background: #eef3f8;
  border: 1px solid #dce6ef;
  border-radius: 5px;
}

.proof-upload-box > span:last-child { display: flex; flex-direction: column; }
.proof-upload-box strong { font-size: 10px; }
.proof-upload-box small { margin-top: 2px; color: #8c96a1; font-size: 8px; }

.proof-preview-grid {
  display: flex;
  gap: 6px;
  margin-top: 7px;
  overflow-x: auto;
}

.proof-preview-card {
  position: relative;
  flex: 0 0 82px;
  height: 50px;
  overflow: hidden;
  background: #f3f5f7;
  border: 1px solid #dfe3e8;
  border-radius: 5px;
}

.proof-preview-card img { width: 100%; height: 100%; object-fit: cover; }

.proof-preview-card button {
  position: absolute;
  top: 5px;
  right: 5px;
  display: grid;
  width: 23px;
  height: 23px;
  padding: 0;
  place-items: center;
  color: #ffffff;
  background: rgba(34, 40, 48, 0.75);
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}

.transaction-dialog-footer {
  display: flex;
  flex: 0 0 auto;
  min-height: 46px;
  padding: 7px 13px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background: #ffffff;
  border-top: 1px solid #dfe3e8;
}

.transaction-dialog-footer p { margin: 0; color: #7c8793; font-size: 9px; }
.transaction-dialog-footer > div { display: flex; gap: 8px; }

.dialog-cancel-button,
.dialog-save-button {
  min-width: 100px;
  height: 30px !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  border-radius: 4px !important;
}
.dialog-save-button { min-width: 142px; }

.transaction-dialog :deep(.input-field),
.transaction-dialog :deep(.date-input-wrapper) { border-radius: 4px; }

.proof-lightbox {
  position: fixed;
  inset: 0;
  z-index: 11000;
  display: flex;
  padding: 28px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
  color: #cbd3dc;
  background: rgba(9, 13, 18, 0.9);
  cursor: zoom-out;
}

.proof-lightbox img {
  max-width: min(1100px, 94vw);
  max-height: 80vh;
  object-fit: contain;
  border-radius: 7px;
  box-shadow: 0 20px 55px rgba(0, 0, 0, 0.4);
}

.proof-lightbox button {
  position: absolute;
  top: 18px;
  right: 18px;
  display: grid;
  width: 36px;
  height: 36px;
  padding: 0;
  place-items: center;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
}
.proof-lightbox span { font-size: 9px; }

@media (max-width: 1100px) {
  .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .finance-overview-grid { grid-template-columns: 1fr; }
  .transaction-toolbar { grid-template-columns: minmax(220px, 1fr) repeat(2, minmax(150px, 0.5fr)); }
  .clear-filter-button { grid-column: 1 / -1; justify-self: start; }
}

@media (max-width: 767px) {
  .office-finance-page { padding: 6px 0px 0px; }
  .finance-hero { align-items: stretch; padding: 17px; flex-direction: column; }
  .finance-hero h1 { font-size: 21px; }
  .finance-hero-actions { display: grid; grid-template-columns: 1fr 1.2fr; }
  .finance-hero-actions .v-btn { width: 100%; }
  .metric-grid { grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
  .metric-card { min-height: 112px; padding: 14px; }
  .metric-card > strong { font-size: 16px; }
  .finance-overview-grid,
  .transaction-panel { margin-top: 8px; }
  .category-overview-card,
  .period-card { padding: 14px; }
  .transaction-toolbar { grid-template-columns: 1fr 1fr; padding: 10px; }
  .search-field { grid-column: 1 / -1; }
  .toolbar-select--category { grid-column: 1 / -1; }
  .transaction-table-wrap { display: none; }
  .transaction-mobile-list { display: grid; gap: 8px; padding: 10px; }

  .transaction-mobile-card {
    padding: 11px;
    background: #ffffff;
    border: 1px solid #dfe4e9;
    border-radius: 6px;
  }

  .mobile-card-heading {
    display: grid;
    grid-template-columns: 30px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
  }

  .mobile-card-heading > div { display: flex; min-width: 0; flex-direction: column; }
  .mobile-card-heading strong {
    overflow: hidden;
    color: #334150;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mobile-card-heading > div span { margin-top: 2px; color: #89939e; font-size: 8px; }

  .mobile-asset-info {
    display: flex;
    margin-top: 9px;
    padding: 7px 8px;
    align-items: center;
    gap: 6px;
    color: #65577f;
    font-size: 8px;
    background: #f6f3fa;
    border-radius: 4px;
  }

  .mobile-card-meta {
    display: flex;
    margin-top: 9px;
    padding-top: 8px;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    color: #7c8793;
    font-size: 8px;
    border-top: 1px solid #edf0f2;
  }
  .mobile-card-meta strong { font-size: 10px; font-variant-numeric: tabular-nums; }

  .mobile-card-actions { display: flex; justify-content: flex-end; gap: 5px; margin-top: 8px; }
  .mobile-card-actions button {
    display: grid;
    width: 29px;
    height: 29px;
    padding: 0;
    place-items: center;
    color: #4e6f8e;
    background: #f3f7fa;
    border: 1px solid #dce5ec;
    border-radius: 4px;
  }
  .mobile-card-actions .mobile-delete-button {
    color: #ac4c58;
    background: #fcf2f3;
    border-color: #efd8dc;
  }

  .transaction-dialog-backdrop { padding: 0; }
  .transaction-dialog { height: 100vh; max-height: 100vh; border: 0; border-radius: 0; }
  .transaction-dialog-header { min-height: 64px; padding: 11px 12px; }
  .transaction-dialog-heading p { display: none; }
  .transaction-form {
    display: flex;
    min-height: 0;
    overflow: hidden;
    flex-direction: column;
  }
  .transaction-form-body {
    display: flex;
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;
    flex-direction: column;
    gap: 9px;
    padding: 9px;
  }
  .form-section { padding: 13px; }
  .form-section--primary,
  .form-section--asset { display: block; }
  .form-section-heading p { display: none; }
  .transaction-type-switch { margin-bottom: 13px; }
  .asset-notice { margin-bottom: 12px; }
  .form-grid--three,
  .form-grid--two,
  .asset-grid { grid-template-columns: 1fr; }

  .transaction-dialog-footer {
    align-items: stretch;
    padding: 9px 11px;
  }
  .transaction-dialog-footer p { display: none; }
  .transaction-dialog-footer > div {
    display: grid;
    flex: 1;
    grid-template-columns: 1fr 1.35fr;
  }
  .dialog-cancel-button,
  .dialog-save-button { width: 100%; min-width: 0; }
}

@media (max-width: 480px) {
  .metric-grid { grid-template-columns: 1fr; }
  .metric-card { min-height: 104px; }
  .period-fields,
  .transaction-toolbar { grid-template-columns: 1fr; }
  .search-field,
  .toolbar-select--category { grid-column: auto; }
  .finance-hero-actions { grid-template-columns: 1fr; }
}
</style>
