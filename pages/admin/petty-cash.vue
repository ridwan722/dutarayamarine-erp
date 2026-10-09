<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import moment from "moment";
import { usepettyCashStore } from "~/stores/pettyCashStore";
import { useUserStore } from "~/stores/userStore";
import * as XLSX from "xlsx-js-style";
import type {
  pettyCashM,
  PettyCashCategory,
  PettyCashType,
} from "~/types/pettyCashModel";
const isLoading = ref(true);
definePageMeta({
  layout: "admin",
  // middleware: [
  //   function (to, from) {
  //     const isAuthorized =
  //       process.client &&
  //       sessionStorage.getItem("is_petty_cash_authorized") === "true";

  //     if (!isAuthorized) {
  //       return navigateTo("/admin/");
  //     }
  //   },
  // ],
});

onMounted(async () => {
  try {
    isLoading.value = true;

    await pettyCashStore.tarikDataPettyCashAct();
  } finally {
    isLoading.value = false;
  }
  form.value.tanggal = moment().format("YYYY-MM-DD");
});

interface Transaction {
  createdAt: number;
  id: string;
  date: string;
  category: PettyCashCategory;
  description: string;
  dikeluarkan_oleh: string;
  amount: number;
  type: PettyCashType;
  images: string[];
}

const pettyCashStore = usepettyCashStore();
const userStore = useUserStore();
const MAX_PETTY_CASH_BYTES = 900_000;

const filterCategory = ref<string>("all");

const isModalOpen = ref<boolean>(false);
const isTopupHistoryOpen = ref<boolean>(false);
const isInfoCardOpen = ref<boolean>(false);
const modalType = ref<"topup" | "expense">("topup");
const activePreviewImage = ref<string | null>(null);

// State Tambahan untuk Fitur Edit
const isEditMode = ref<boolean>(false);
const editingId = ref<string | null>(null);

const form = ref({
  category: "Kredit" as PettyCashCategory,
  amount: null as number | null,
  description: "",
  dikeluarkan_oleh: "",
  images: [] as string[],
  tanggal: "",
  isMealAllowance: false, // State untuk melacak checkbox uang makan
});

onMounted(async () => {
  await pettyCashStore.tarikDataPettyCashAct();
});

const transactions = computed<Transaction[]>(() =>
  pettyCashStore.getDataPettyCash.map((item) => {
    const timestamp = Number(item.createdAt || 0);

    return {
      id: item.id || `${timestamp}-${item.tanggal}-${item.amount}`,
      createdAt: timestamp,
      date: item.tanggal,
      category: item.kategori,
      description: item.keterangan,
      dikeluarkan_oleh: item.dikeluarkan_oleh || "",
      amount: Number(item.amount || 0),
      type: item.type,
      images: Array.isArray(item.bukti)
        ? item.bukti
        : item.bukti
          ? [item.bukti]
          : [],
    };
  }),
);

// const transactionsByMonth = computed(() => {
//   if (selectedMonth.value === "all") return transactions.value;
//   return transactions.value.filter((t) => {
//     const month = t.date.split("-")[1];
//     return month === selectedMonth.value;
//   });
// });

// State untuk filter Bulan dan Tahun (default tahun sekarang)
const selectedMonth = ref<string>("all");
const selectedYear = ref<string>(moment().format("YYYY")); // Default tahun saat ini

// Membuat daftar pilihan tahun secara dinamis dari data transaksi yang ada
// Menggenerasi pilihan tahun (misal: 3 tahun ke belakang & 1 tahun ke depan dari tahun sekarang)
const availableYears = computed(() => {
  const currentYear = moment().year();
  const years: string[] = [];

  // Menampilkan rentang tahun (misal: 2023 s/d 2027)
  for (let y = currentYear + 1; y >= currentYear - 3; y--) {
    years.push(y.toString());
  }

  return years;
});

// Filter transaksi berdasarkan Bulan & Tahun
const transactionsByMonth = computed(() => {
  return transactions.value.filter((t) => {
    const [year, month] = t.date.split("-");

    const matchYear =
      selectedYear.value === "all" || year === selectedYear.value;
    const matchMonth =
      selectedMonth.value === "all" || month === selectedMonth.value;

    return matchYear && matchMonth;
  });
});

// Total Pemasukan Berdasarkan Periode (Bulan & Tahun)
const totalIn = computed(() =>
  transactionsByMonth.value
    .filter((t) => t.type === "in")
    .reduce((sum, t) => sum + t.amount, 0),
);

// Total Pengeluaran Berdasarkan Periode (Bulan & Tahun)
const totalOut = computed(() =>
  transactionsByMonth.value
    .filter((t) => t.type === "out")
    .reduce((sum, t) => sum + t.amount, 0),
);

// Sisa Saldo Kas Berdasarkan Periode
const actualRealBalance = computed(() => totalIn.value - totalOut.value);

const compareDateDescending = (a: Transaction, b: Transaction) =>
  b.date.localeCompare(a.date);

const compareDateAscending = (a: Transaction, b: Transaction) =>
  a.date.localeCompare(b.date);

const filteredTransactions = computed(() => {
  let result = transactionsByMonth.value;
  if (filterCategory.value !== "all") {
    result = result.filter((t) => t.category === filterCategory.value);
  }
  return [...result].sort(compareDateDescending);
});

const topupTransactions = computed(() =>
  transactions.value
    .filter((t) => t.category === "Debet")
    .sort(compareDateDescending),
);

const isUploadingImages = ref(false);
const isSaving = ref(false);

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  if (!files.length) return;

  isUploadingImages.value = true;
  try {
    form.value.images.push(...(await Promise.all(files.map(readImageFile))));
  } catch (error) {
    useNotificationStore().showError("Gambar bukti tidak dapat dibaca");
  } finally {
    isUploadingImages.value = false;
    target.value = "";
  }
};

const removeImage = (index: number) => form.value.images.splice(index, 1);

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

const openModal = (type: "topup" | "expense") => {
  isEditMode.value = false;
  editingId.value = null;
  modalType.value = type;
  form.value.category = type === "topup" ? "Debet" : "Kredit";
  form.value.amount = null;
  form.value.description = "";
  form.value.dikeluarkan_oleh = "";
  form.value.images = [];
  form.value.isMealAllowance = false;
  isModalOpen.value = true;
};

const openEditModal = (tx: Transaction) => {
  uploadStore().setReset();
  isEditMode.value = true;
  editingId.value = tx.id;
  modalType.value = tx.type === "in" ? "topup" : "expense";
  form.value.category = tx.category;
  form.value.amount = tx.amount;
  form.value.description = tx.description;
  form.value.dikeluarkan_oleh = tx.dikeluarkan_oleh;
  form.value.images = [...tx.images];
  form.value.isMealAllowance = false; // Reset ketika edit, karena nominal lama diasumsikan sudah final
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  uploadStore().setReset();
};
const openTopupHistoryModal = () => {
  isTopupHistoryOpen.value = true;
};
const closeTopupHistoryModal = () => {
  isTopupHistoryOpen.value = false;
};
const openInfoCardModal = () => {
  isInfoCardOpen.value = true;
};
const closeInfoCardModal = () => {
  isInfoCardOpen.value = false;
};
const previewImage = (imgUrl: string) => {
  activePreviewImage.value = imgUrl;
};

const handleSubmit = async () => {
  if (isSaving.value || isUploadingImages.value) return;
  if (!form.value.amount || !form.value.description) return;
  // Hitung final amount, jika kategori Uang Jalan dan checkbox diisi, tambahkan 15000
  let finalAmount = form.value.amount;
  if (
    modalType.value === "expense" &&
    form.value.category === "Uang Jalan" &&
    form.value.isMealAllowance
  ) {
    finalAmount += 15000;
  }

  // Field yang sama untuk add & update
  const payload = {
    amount: finalAmount,
    keterangan: form.value.description,
    dikeluarkan_oleh: form.value.dikeluarkan_oleh,
    bukti: form.value.images,
    type: (modalType.value === "topup" ? "in" : "out") as PettyCashType,
    tanggal: form.value.tanggal,
    kategori: form.value.category,
  };

  if (
    new TextEncoder().encode(JSON.stringify(payload)).byteLength >
    MAX_PETTY_CASH_BYTES
  ) {
    useNotificationStore().showError(
      "Total ukuran gambar bukti terlalu besar. Kurangi ukuran atau jumlah gambar (maksimal sekitar 650 KB total).",
    );
    return;
  }

  isSaving.value = true;
  try {
    if (isEditMode.value && editingId.value) {
      await pettyCashStore.updatePettyCashAct({
        id: editingId.value,
        ...payload,
        updatedAt: moment().unix(),
        updatedBy: useUserStore().getEmail || "",
      });
    } else {
      await pettyCashStore.addPettyCashAct({
        ...payload,
        createdAt: moment().unix(),
        createdBy: userStore.getEmail || "",
      });
    }
    closeModal();
  } finally {
    isSaving.value = false;
  }
};

async function deletePettyCash(id: string) {
  if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
    await pettyCashStore.deletePettyCashAct(id);
  }
}

const formatNumber = (num: number): string => num.toLocaleString("id-ID");

const copyRekening = async () => {
  try {
    await navigator.clipboard.writeText("586-573-7332");
  } catch (err) {
    console.error("Gagal menyalin nomor rekening", err);
  }
};

const downloadExcel = () => {
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const period =
    selectedMonth.value !== "all" && selectedYear.value !== "all"
      ? `${monthNames[Number(selectedMonth.value) - 1]} ${selectedYear.value}`
      : selectedYear.value !== "all"
        ? `Tahun ${selectedYear.value}`
        : "Semua Periode";
  const reportTransactions = transactionsByMonth.value
    .filter(
      (tx) =>
        filterCategory.value === "all" || tx.category === filterCategory.value,
    )
    .sort(compareDateAscending);

  const currencyFormat = '"Rp "#,##0;[Red]\\("-Rp "#,##0\\);"-"';
  const thinBorder = {
    top: { style: "thin", color: { rgb: "CBD5E1" } },
    bottom: { style: "thin", color: { rgb: "CBD5E1" } },
    left: { style: "thin", color: { rgb: "CBD5E1" } },
    right: { style: "thin", color: { rgb: "CBD5E1" } },
  };
  const totalBorder = {
    ...thinBorder,
    top: { style: "thin", color: { rgb: "1E3A8A" } },
    bottom: { style: "double", color: { rgb: "1E3A8A" } },
  };
  const baseFont = { name: "Calibri", sz: 11 };
  const styles = {
    title: {
      font: { ...baseFont, bold: true, sz: 16, color: { rgb: "1E3A8A" } },
    },
    subtitle: { font: { ...baseFont, italic: true, color: { rgb: "475569" } } },
    summaryLabel: {
      font: { ...baseFont, bold: true, sz: 9, color: { rgb: "64748B" } },
      fill: { fgColor: { rgb: "F8FAFC" } },
      alignment: { horizontal: "center", vertical: "center" },
    },
    summaryValue: {
      font: { ...baseFont, bold: true, sz: 14, color: { rgb: "1E3A8A" } },
      fill: { fgColor: { rgb: "F8FAFC" } },
      alignment: { horizontal: "center", vertical: "center" },
      numFmt: currencyFormat,
    },
    header: {
      font: { ...baseFont, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E3A8A" } },
      border: thinBorder,
      alignment: { horizontal: "center", vertical: "center" },
    },
    cellCenter: {
      font: baseFont,
      border: thinBorder,
      alignment: { horizontal: "center", vertical: "center" },
    },
    cellLeft: {
      font: baseFont,
      border: thinBorder,
      alignment: { horizontal: "left", vertical: "center" },
    },
    currency: {
      font: baseFont,
      border: thinBorder,
      alignment: { horizontal: "right", vertical: "center" },
      numFmt: currencyFormat,
    },
    totalLabel: {
      font: { ...baseFont, bold: true },
      fill: { fgColor: { rgb: "E2E8F0" } },
      border: totalBorder,
      alignment: { horizontal: "right", vertical: "center" },
    },
    totalCurrency: {
      font: { ...baseFont, bold: true },
      fill: { fgColor: { rgb: "E2E8F0" } },
      border: totalBorder,
      alignment: { horizontal: "right", vertical: "center" },
      numFmt: currencyFormat,
    },
  };

  const worksheet = XLSX.utils.aoa_to_sheet([
    ["REKAPAN KAS DUTA RAYA MARINE"],
    [`Periode: ${period} (Urutan Terlama ke Terbaru)`],
    [],
    [
      "TOTAL DEBET (MASUK)",
      "",
      "TOTAL KREDIT (KELUAR)",
      "",
      "SISA SALDO AKHIR",
    ],
    ["", "", "", "", ""],
    [],
    ["No", "Tanggal", "Kategori", "Keterangan", "DEBET", "KREDIT", "SALDO"],
  ]);
  const firstDataRow = 8;
  let runningBalance = 0;
  let totalDebit = 0;
  let totalCredit = 0;

  reportTransactions.forEach((transaction, index) => {
    const row = firstDataRow + index;
    const debit = transaction.type === "in" ? transaction.amount : 0;
    const credit = transaction.type === "out" ? transaction.amount : 0;
    runningBalance += debit - credit;
    totalDebit += debit;
    totalCredit += credit;
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [
          index + 1,
          transaction.date,
          transaction.category,
          transaction.description,
          debit,
          credit,
          {
            t: "n",
            f: index === 0 ? `E${row}-F${row}` : `G${row - 1}+E${row}-F${row}`,
            v: runningBalance,
          },
        ],
      ],
      { origin: `A${row}` },
    );
  });

  const totalRow = firstDataRow + reportTransactions.length;
  const lastDataRow = totalRow - 1;
  const hasTransactions = reportTransactions.length > 0;
  XLSX.utils.sheet_add_aoa(
    worksheet,
    [
      [
        "",
        "",
        "",
        "TOTAL",
        hasTransactions
          ? {
              t: "n",
              f: `SUM(E${firstDataRow}:E${lastDataRow})`,
              v: totalDebit,
            }
          : 0,
        hasTransactions
          ? {
              t: "n",
              f: `SUM(F${firstDataRow}:F${lastDataRow})`,
              v: totalCredit,
            }
          : 0,
        hasTransactions
          ? { t: "n", f: `G${lastDataRow}`, v: runningBalance }
          : 0,
      ],
    ],
    { origin: `A${totalRow}` },
  );
  XLSX.utils.sheet_add_aoa(
    worksheet,
    [
      [
        { t: "n", f: `E${totalRow}`, v: totalDebit },
        "",
        { t: "n", f: `F${totalRow}`, v: totalCredit },
        "",
        { t: "n", f: `G${totalRow}`, v: runningBalance },
      ],
    ],
    { origin: "A5" },
  );

  worksheet["!merges"] = [
    XLSX.utils.decode_range("A4:B4"),
    XLSX.utils.decode_range("C4:D4"),
    XLSX.utils.decode_range("E4:G4"),
    XLSX.utils.decode_range("A5:B5"),
    XLSX.utils.decode_range("C5:D5"),
    XLSX.utils.decode_range("E5:G5"),
  ];
  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 23 },
    { wch: 55 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];
  worksheet["!rows"] = [{ hpt: 21 }, null, null, null, { hpt: 19 }];
  worksheet["!freeze"] = {
    xSplit: 0,
    ySplit: 7,
    topLeftCell: "A8",
    activePane: "bottomLeft",
    state: "frozen",
  };

  const applyRowStyle = (row: number, isAlternate: boolean) => {
    const fill = isAlternate ? { fgColor: { rgb: "F1F5F9" } } : undefined;
    ["A", "B"].forEach((column) => {
      worksheet[`${column}${row}`].s = {
        ...styles.cellCenter,
        ...(fill && { fill }),
      };
    });
    ["C", "D"].forEach((column) => {
      worksheet[`${column}${row}`].s = {
        ...styles.cellLeft,
        ...(fill && { fill }),
      };
    });
    ["E", "F", "G"].forEach((column) => {
      worksheet[`${column}${row}`].s = {
        ...styles.currency,
        ...(fill && { fill }),
      };
    });
  };

  worksheet.A1.s = styles.title;
  worksheet.A2.s = styles.subtitle;
  ["A", "C", "E"].forEach((column) => {
    worksheet[`${column}4`].s = styles.summaryLabel;
    worksheet[`${column}5`].s = styles.summaryValue;
  });
  ["B", "D", "F", "G"].forEach((column) => {
    worksheet[`${column}4`] = {
      t: "z",
      s: { fill: { fgColor: { rgb: "F8FAFC" } } },
    };
    worksheet[`${column}5`] = {
      t: "z",
      s: { fill: { fgColor: { rgb: "F8FAFC" } } },
    };
  });
  ["A", "B", "C", "D", "E", "F", "G"].forEach((column) => {
    worksheet[`${column}7`].s = styles.header;
    worksheet[`${column}${totalRow}`].s =
      column === "D" ? styles.totalLabel : styles.totalCurrency;
  });
  reportTransactions.forEach((_, index) =>
    applyRowStyle(firstDataRow + index, index % 2 === 1),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    `Kas ${period}`.slice(0, 31),
  );
  XLSX.writeFile(workbook, `Laporan Kas - ${period}.xlsx`);
};

// Mengecek apakah tanggal transaksi berada pada bulan & tahun yang sama dengan hari ini
const isCurrentMonth = (dateString: string): boolean => {
  if (!dateString) return false;

  // Mengomparasi bulan dan tahun transaksi dengan bulan dan tahun sekarang
  const txDate = moment(dateString, "YYYY-MM-DD");
  const now = moment();

  return txDate.isSame(now, "month");
};
</script>

<template>
  <v-btn
    variant="text"
    color="grey-darken-3"
    prepend-icon="mdi-arrow-left"
    @click="$router.go(-1)"
    class="text-capitalize font-weight-bold mb-2"
  >
    Kembali
  </v-btn>
  
  <div class="petty-cash-container">
    <div class="pc-header">
      <div class="header-info">
        <h1 class="pc-title">Kas Management</h1>
        <p class="pc-subtitle">
          Pantau saldo, pengeluaran operasional, dan riwayat klaim kas.
        </p>
      </div>

      <div class="pc-action-buttons">
        <button @click="openInfoCardModal" class="btn btn-outline">
          <v-icon size="18">mdi-bank-outline</v-icon>
          <span class="btn-text">Rekening</span>
        </button>
        <button @click="openTopupHistoryModal" class="btn btn-outline">
          <v-icon size="18">mdi-history</v-icon>
          <span class="btn-text">Riwayat Debet</span>
        </button>
        <button @click="openModal('topup')" class="btn btn-success">
          <v-icon size="18">mdi-plus-circle-outline</v-icon>
          <span class="btn-text">Top Up</span>
        </button>
        <button @click="openModal('expense')" class="btn btn-primary">
          <v-icon size="18">mdi-minus-circle-outline</v-icon>
          <span class="btn-text">Create Pengeluaran</span>
        </button>
      </div>
    </div>

    <div class="pc-metrics-grid">
      <template v-if="isLoading">
        <div class="metric-card card-balance">
          <div class="metric-header">
            <v-skeleton-loader type="text" width="60%" class="bg-transparent" />
            <v-skeleton-loader type="avatar" size="32" class="bg-transparent" />
          </div>
          <v-skeleton-loader
            type="heading"
            width="80%"
            class="bg-transparent mt-2"
          />
        </div>

        <div class="metric-card card-in">
          <div class="metric-header">
            <v-skeleton-loader type="text" width="60%" />
            <v-skeleton-loader type="avatar" size="32" />
          </div>
          <v-skeleton-loader type="heading" width="70%" class="mt-2" />
        </div>

        <div class="metric-card card-out">
          <div class="metric-header">
            <v-skeleton-loader type="text" width="60%" />
            <v-skeleton-loader type="avatar" size="32" />
          </div>
          <v-skeleton-loader type="heading" width="70%" class="mt-2" />
        </div>
      </template>

      <template v-else>
        <div class="metric-card card-balance">
          <div class="metric-header">
            <span class="metric-label label-light"
              >Sisa Saldo Kas Saat Ini</span
            >
            <div class="card-icon-badge">
              <v-icon size="20" color="white">mdi-wallet-outline</v-icon>
            </div>
          </div>
          <p class="metric-value value-large text-white">
            Rp {{ formatNumber(actualRealBalance) }}
          </p>
        </div>

        <div class="metric-card card-in">
          <div class="metric-header">
            <span class="metric-label">Total Masuk Keseluruhan</span>
            <div class="icon-circle text-emerald">
              <v-icon size="18">mdi-arrow-down-left</v-icon>
            </div>
          </div>
          <p class="metric-value text-emerald">
            Rp {{ formatNumber(totalIn) }}
          </p>
        </div>

        <div class="metric-card card-out">
          <div class="metric-header">
            <span class="metric-label">Total Keluar Keseluruhan</span>
            <div class="icon-circle text-rose">
              <v-icon size="18">mdi-arrow-up-right</v-icon>
            </div>
          </div>
          <p class="metric-value text-rose">Rp {{ formatNumber(totalOut) }}</p>
        </div>
      </template>
    </div>

    <div class="month-filter-card">
      <div class="filter-label-group">
        <v-icon size="18" color="#64748b">mdi-calendar-month-outline</v-icon>
        <span class="month-filter-label">Periode Transaksi</span>
      </div>
      <div class="select-wrapper">
        <select v-model="selectedMonth" class="form-select month-select">
          <option value="all">Semua Bulan</option>
          <option value="01">Januari</option>
          <option value="02">Februari</option>
          <option value="03">Maret</option>
          <option value="04">April</option>
          <option value="05">Mei</option>
          <option value="06">Juni</option>
          <option value="07">Juli</option>
          <option value="08">Agustus</option>
          <option value="09">September</option>
          <option value="10">Oktober</option>
          <option value="11">November</option>
          <option value="12">Desember</option>
        </select>
        <v-icon class="select-icon" size="18">mdi-chevron-down</v-icon>
      </div>

      <div class="select-wrapper">
        <select v-model="selectedYear" class="form-select month-select">
          <option value="all">Semua Tahun</option>
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
        <v-icon class="select-icon" size="18">mdi-chevron-down</v-icon>
      </div>
    </div>

    <div class="pc-main-card">
      <div class="card-header-bar">
        <div class="card-title-group">
          <h3 class="table-title">Riwayat Transaksi</h3>
          <span class="badge-count">
            {{ filteredTransactions.length }} Transaksi
          </span>
        </div>

        <!-- Kanan -->
        <div style="display: flex; align-items: center">
          <v-tooltip text="Download Excel" location="top">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                variant="text"
                color="success"
                @click="downloadExcel"
              >
                <v-icon>mdi-file-excel</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <div class="filter-wrapper select-wrapper">
            <select v-model="filterCategory" class="form-select">
              <option value="all">Semua Kategori</option>
              <option value="Debet">Debet Saldo</option>
              <!-- <option value="Uang Jalan">Uang Jalan</option> -->
              <option value="Kredit">Kredit</option>
              <!-- <option value="Listrik Kantor">Listrik Kantor</option> -->
            </select>

            <v-icon class="select-icon" size="18"> mdi-chevron-down </v-icon>
          </div>
        </div>
      </div>

      <div class="mobile-list-view">
        <div v-if="filteredTransactions.length === 0" class="table-empty">
          <v-icon size="36" color="#cbd5e1">mdi-receipt-text-outline</v-icon>
          <p>Belum ada data transaksi pada periode ini.</p>
        </div>

        <div
          v-for="tx in filteredTransactions"
          :key="tx.id"
          class="mobile-tx-card"
        >
          <div class="mobile-card-row">
            <span class="badge-date">{{ tx.date }}</span>
            <span
              class="badge"
              :class="{
                'badge-topup': tx.category === 'Debet',
                // 'badge-jalan': tx.category === 'Uang Jalan',
                'badge-kantor': tx.category === 'Kredit',
                // 'badge-listrik': tx.category === 'Listrik Kantor',
              }"
            >
              {{ tx.category }}
            </span>
          </div>

          <div class="mobile-card-desc">{{ tx.description }}</div>

          <div class="mobile-card-footer">
            <div class="mobile-amount-box">
              <span class="amount-label">Nominal</span>
              <div
                class="tx-amount"
                :class="tx.type === 'in' ? 'text-emerald' : 'text-rose'"
              >
                {{ tx.type === "in" ? "+" : "-" }} Rp
                {{ formatNumber(tx.amount) }}
              </div>
            </div>

            <div class="mobile-card-actions">
              <v-btn
                v-for="image in tx.images"
                :key="image"
                icon
                variant="flat"
                color="#f1f5f9"
                density="comfortable"
                size="small"
                @click="previewImage(image)"
              >
                <v-icon size="18" color="#475569">mdi-image-outline</v-icon>
              </v-btn>
              <v-btn
                icon="mdi-pencil-outline"
                variant="flat"
                color="#eff6ff"
                size="small"
                density="comfortable"
                @click="openEditModal(tx)"
              />
              <v-btn
                icon="mdi-delete-outline"
                variant="flat"
                color="#fef2f2"
                size="small"
                density="comfortable"
                @click="deletePettyCash(tx.id)"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="table-responsive desktop-table-view">
        <table class="pc-table">
          <thead>
            <tr>
              <th style="max-width: 20px">No.</th>
              <th>Tanggal</th>
              <th>Kategori</th>
              <th>Keterangan / Keperluan</th>
              <th>Bukti</th>
              <th class="text-right">Nominal</th>
              <th>Dikeluarkan Oleh</th>
              <th class="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredTransactions.length === 0">
              <td colspan="6" class="table-empty">
                <v-icon size="40" color="#cbd5e1" class="mb-2"
                  >mdi-text-box-remove-outline</v-icon
                >
                <div>Belum ada data transaksi pada periode ini.</div>
              </td>
            </tr>
            <tr
              v-for="(tx, index) in filteredTransactions"
              :key="tx.id"
              class="table-row"
            >
              <td class="text-nowrap" style="max-width: 20px">
                {{ index + 1 }}.
              </td>
              <!-- <td class="text-muted text-nowrap font-mono">
                {{ tx.id }}
              </td> -->
              <td class="text-muted text-nowrap font-mono">
                {{ rubahtanggalharilengkappettycash(tx.date) }}
              </td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'badge-topup': tx.category === 'Debet',
                    // 'badge-jalan': tx.category === 'Uang Jalan',
                    'badge-kantor': tx.category === 'Kredit',
                    // 'badge-listrik': tx.category === 'Listrik Kantor',
                  }"
                >
                  {{ tx.category }}
                </span>
              </td>
              <td style="max-width: 250px">{{ tx.description }}</td>
              <td style="max-width: 220px">
                <div v-if="tx.images.length" class="proof-links">
                  <v-tooltip
                    v-for="(image, imageIndex) in tx.images"
                    :key="image"
                    text="Pratinjau Gambar"
                    location="top"
                  >
                    <template #activator="{ props }">
                      <button
                        v-bind="props"
                        class="btn-image-preview"
                        @click="previewImage(image)"
                      >
                        <v-icon size="20">mdi-image-outline</v-icon>
                        <!-- <span>{{ imageIndex === 0 ? "Lihat" : `Bukti ${imageIndex + 1}` }}</span> -->
                      </button>
                    </template>
                  </v-tooltip>
                </div>
                <span v-else class="text-muted italic text-xs"
                  >-</span
                >
              </td>
              <td
                class="text-right tx-amount"
                :class="tx.type === 'in' ? 'text-emerald' : 'text-rose'"
              >
                {{ tx.type === "in" ? "+" : "-" }} Rp
                {{ formatNumber(tx.amount) }}
              </td>
              <td >
                {{ tx.dikeluarkan_oleh }}
              </td>
              <td class="text-center">
                <div class="table-action-btns">
                  <v-btn
                    :disabled="!isCurrentMonth(tx.date)"
                    icon="mdi-pencil-outline"
                    variant="text"
                    color="primary"
                    size="small"
                    @click="openEditModal(tx)"
                  />
                  <v-btn
                    :disabled="!isCurrentMonth(tx.date)"
                    icon="mdi-delete-outline"
                    variant="text"
                    color="error"
                    size="small"
                    @click="deletePettyCash(tx.id)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="isModalOpen" class="modal-backdrop">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title-box">
            <h3>
              {{
                isEditMode
                  ? "Edit Transaksi"
                  : modalType === "topup"
                    ? "Debet Saldo Kas"
                    : "Catat Pengeluaran Kas"
              }}
            </h3>
            <p class="modal-subtitle">Isi rincian transaksi dengan benar</p>
          </div>
          <button :disabled="isSaving" @click="closeModal" class="btn-close">&times;</button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <div v-if="modalType === 'expense'" class="form-group">
            <label class="form-label">Kategori Penggunaan</label>
            <div class="radio-group">
              <!-- <label
                class="radio-box"
                :class="{ active: form.category === 'Uang Jalan' }"
              >
                <input
                  type="radio"
                  v-model="form.category"
                  value="Uang Jalan"
                />
                Uang Jalan
              </label> -->
              <label
                class="radio-box"
                :class="{ active: form.category === 'Kredit' }"
              >
                <input
                  type="radio"
                  v-model="form.category"
                  value="Kredit"
                />
                Kredit
              </label>
              <!-- <label
                class="radio-box"
                :class="{ active: form.category === 'Listrik Kantor' }"
              >
                <input
                  type="radio"
                  v-model="form.category"
                  value="Listrik Kantor"
                />
                Listrik
              </label> -->
            </div>
          </div>

          <!-- <div
            v-if="modalType === 'expense' && form.category === 'Uang Jalan'"
            class="meal-allowance-box"
          >
            <label class="checkbox-container">
              <input type="checkbox" v-model="form.isMealAllowance" />
              <span class="checkmark"></span>
              <span class="checkbox-label"
                >Tambah Uang Makan (+ Rp 15.000)</span
              >
            </label>
          </div> -->

          <div class="form-group">
            <label class="form-label">Tanggal</label>
            <div class="input-with-prefix">
              <a-date-picker v-model="form.tanggal"></a-date-picker>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Nominal Transaksi (Rp)</label>
            <div class="input-with-prefix">
              <span class="prefix">Rp</span>
              <input
                v-model.number="form.amount"
                type="number"
                required
                min="1"
                placeholder="0"
                class="form-control"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Keterangan / Keperluan</label>
            <textarea
              v-model="form.description"
              required
              rows="3"
              placeholder="Tuliskan detail penggunaan dana..."
              class="form-control"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Dikeluarkan Oleh</label>
            <input
              v-model="form.dikeluarkan_oleh"
              type="text"
              required
              placeholder="Nama pihak yang mengeluarkan dana"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label class="form-label"
              >Upload Bukti <span class="text-muted">(Opsional)</span></label
            >
            <div class="upload-wrapper">
              <input
                type="file"
                accept="image/*"
                multiple
                class="form-control"
                :disabled="isUploadingImages || isSaving"
                @change="handleImageUpload"
              />
              <small v-if="isUploadingImages" class="text-muted">Menyiapkan gambar...</small>
            </div>
            <div v-if="form.images.length" class="proof-preview-list mt-2">
              <div v-for="(image, index) in form.images" :key="image" class="image-preview-card">
                <img :src="image" :alt="`Bukti ${index + 1}`" />
                <button type="button" class="btn-remove-image" :disabled="isSaving" @click="removeImage(index)">&times;</button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" :disabled="isSaving" @click="closeModal" class="btn btn-secondary">
              Batal
            </button>
            <button
              type="submit"
              :disabled="isSaving || isUploadingImages"
              class="btn"
              :class="modalType === 'topup' ? 'btn-success' : 'btn-primary'"
            >
              {{ isSaving ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Simpan Transaksi" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="isTopupHistoryOpen" class="modal-backdrop">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <div class="modal-title-box">
            <h3>Riwayat Debet Masuk</h3>
            <p class="modal-subtitle">
              Daftar penambahan kas masuk yang tercatat
            </p>
          </div>
          <button @click="closeTopupHistoryModal" class="btn-close">
            &times;
          </button>
        </div>
        <div class="modal-body-scroll">
          <div class="mobile-list-view">
            <div
              v-for="tx in topupTransactions"
              :key="tx.id"
              class="mobile-tx-card"
            >
              <div class="mobile-card-row">
                <span class="badge-date">{{ tx.date }}</span>
                <span class="text-emerald font-semibold"
                  >+ Rp {{ formatNumber(tx.amount) }}</span
                >
              </div>
              <div class="mobile-card-desc">{{ tx.description }}</div>
              <div v-if="tx.images.length" class="proof-preview-list mt-2">
                <img
                  v-for="image in tx.images"
                  :key="image"
                  :src="image"
                  @click="previewImage(image)"
                  class="table-thumb"
                  alt="Bukti Transfer"
                />
              </div>
              <div class="mobile-card-actions-row">
                <v-btn
                  icon="mdi-pencil-outline"
                  variant="text"
                  color="primary"
                  size="small"
                  @click="openEditModal(tx)"
                />
                <v-btn
                  icon="mdi-delete-outline"
                  variant="text"
                  color="error"
                  size="small"
                  @click="deletePettyCash(tx.id)"
                />
              </div>
            </div>
          </div>

          <table class="pc-table desktop-table-view">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Keterangan Pengisian</th>
                <th>Bukti Transfer</th>
                <th class="text-right">Nominal</th>
                <th class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tx in topupTransactions" :key="tx.id">
                <td class="text-muted font-mono">{{ tx.date }}</td>
                <td class="font-medium">{{ tx.description }}</td>
                <td>
                  <div v-if="tx.images.length" class="proof-preview-list">
                    <img
                      v-for="image in tx.images"
                      :key="image"
                      :src="image"
                      @click="previewImage(image)"
                      class="table-thumb"
                      alt="Bukti"
                    />
                  </div>
                  <span v-else class="text-muted italic text-xs">Kosong</span>
                </td>
                <td class="text-right text-emerald tx-amount">
                  + Rp {{ formatNumber(tx.amount) }}
                </td>
                <td class="text-center">
                  <div class="table-action-btns">
                    <v-btn
                      icon="mdi-pencil-outline"
                      variant="text"
                      color="primary"
                      size="small"
                      @click="openEditModal(tx)"
                    />
                    <v-btn
                      icon="mdi-delete-outline"
                      variant="text"
                      color="error"
                      size="small"
                      @click="deletePettyCash(tx.id)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      v-if="isInfoCardOpen"
      class="modal-backdrop"
      @click="isInfoCardOpen = false"
    >
      <div class="info-card-container" @click.stop>
        <div class="bank-card">
          <div class="bank-card-header">
            <div class="bank-logo-icon">
              <v-icon color="white" size="24">mdi-bank</v-icon>
            </div>
            <span class="bank-title">REKENING OPERASIONAL</span>
          </div>
          <div class="bank-card-body">
            <div class="holder-name">Leo Adiatmaja Sembiring</div>
            <div class="account-number-group">
              <span class="acc-number">586-573-7332</span>
              <button class="btn-copy" @click="copyRekening">
                <v-icon size="16">mdi-content-copy</v-icon>
                <span>Salin</span>
              </button>
            </div>
          </div>
        </div>
        <div class="info-tap-hint">
          <v-icon size="16" color="#94a3b8">mdi-gesture-tap</v-icon>
          <span>Ketuk di mana saja di luar untuk menutup</span>
        </div>
      </div>
    </div>

    <div
      v-if="activePreviewImage"
      @click="activePreviewImage = null"
      class="lightbox-backdrop"
    >
      <div class="lightbox-content">
        <img :src="activePreviewImage" alt="Preview Bukti" />
        <p class="lightbox-caption">Ketuk di mana saja untuk menutup</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  pointer-events: none;
}

.skeleton-bone {
  background: #e0e0e0;
  background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 37%, #e0e0e0 63%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
  border-radius: 6px;
}

.skeleton-label {
  width: 60%;
  height: 16px;
}

.skeleton-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.skeleton-value {
  width: 75%;
  height: 28px;
  margin-top: 12px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

.petty-cash-container {
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;
  padding: 16px;
  max-width: 1280px;
  margin: 0 auto;
  background-color: #f8fafc;
  min-height: 100vh;
  color: #1e293b;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .petty-cash-container {
    padding: 8px;
  }
}

.pc-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}

@media (min-width: 992px) {
  .pc-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.pc-title {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0;
}

@media (min-width: 768px) {
  .pc-title {
    font-size: 26px;
  }
}

.pc-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0 0;
}

.pc-action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  width: 100%;
}

@media (min-width: 640px) {
  .pc-action-buttons {
    display: flex;
    width: auto;
    align-items: center;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
}
.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-success {
  background-color: #10b981;
  color: #ffffff;
}
.btn-success:hover {
  background-color: #059669;
}

.btn-outline {
  background-color: #ffffff;
  color: #334155;
  border-color: #cbd5e1;
}
.btn-outline:hover {
  background-color: #f1f5f9;
  border-color: #94a3b8;
}

.btn-secondary {
  background-color: #f1f5f9;
  color: #475569;
}
.btn-secondary:hover {
  background-color: #e2e8f0;
}

.pc-metrics-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

@media (min-width: 640px) {
  .pc-metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 992px) {
  .pc-metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.metric-card {
  background: #ffffff;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.02),
    0 10px 15px -3px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-balance {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border: none;
  box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.3);
}

@media (min-width: 640px) and (max-width: 991px) {
  .card-balance {
    grid-column: span 2;
  }
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.metric-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.label-light {
  color: #94a3b8;
}

.card-icon-badge {
  background: rgba(255, 255, 255, 0.12);
  padding: 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-circle.text-emerald {
  background: #ecfdf5;
}
.icon-circle.text-rose {
  background: #fff1f2;
}

.metric-value {
  font-size: 22px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.02em;
}

@media (min-width: 768px) {
  .metric-value {
    font-size: 26px;
  }
}

.value-large {
  font-size: 28px;
}

.month-filter-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 18px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (min-width: 576px) {
  .month-filter-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.filter-label-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.month-filter-label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.select-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
  min-width: 200px;
}

@media (min-width: 576px) {
  .select-wrapper {
    width: auto;
  }
}

.form-select {
  appearance: none;
  -webkit-appearance: none;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 8px 36px 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.form-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.month-select {
  color: #2563eb;
  background-color: #eff6ff;
  border-color: #bfdbfe;
}

.select-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #64748b;
}

.pc-main-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.card-header-bar {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (min-width: 576px) {
  .card-header-bar {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.card-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.badge-count {
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
}

.desktop-table-view {
  display: none;
}

.mobile-list-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

@media (min-width: 768px) {
  .mobile-list-view {
    display: none;
  }
  .desktop-table-view {
    display: block;
  }
}

.table-responsive {
  overflow-x: auto;
}

.pc-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.pc-table th {
  background-color: #f8fafc;
  padding: 14px 20px;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e2e8f0;
}

.pc-table td {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  color: #334155;
}

.table-row {
  transition: background-color 0.15s ease;
}

.table-row:hover {
  background-color: #f8fafc;
}

.table-empty {
  padding: 48px 24px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}

.table-action-btns {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.btn-image-preview {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-image-preview:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.proof-links,
.proof-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.image-preview-card {
  position: relative;
}

.btn-remove-image {
  position: absolute;
  top: -7px;
  right: -7px;
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  cursor: pointer;
  line-height: 18px;
}

.mobile-tx-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.mobile-card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge-date {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  font-family: monospace;
}

.mobile-card-desc {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
}

.mobile-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-top: 10px;
  border-top: 1px dashed #e2e8f0;
}

.mobile-amount-box {
  display: flex;
  flex-direction: column;
}

.amount-label {
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
  font-weight: 700;
}

.mobile-card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mobile-card-actions-row {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e2e8f0;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.badge-topup {
  background-color: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.badge-jalan {
  background-color: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.badge-kantor {
  background-color: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.badge-listrik {
  background-color: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
}

.text-right {
  text-align: right;
}
.text-center {
  text-align: center;
}
.text-emerald {
  color: #10b981;
}
.text-rose {
  color: #f43f5e;
}
.text-white {
  color: #ffffff;
}
.text-muted {
  color: #94a3b8;
}
.text-xs {
  font-size: 11px;
}
.font-mono {
  font-family: monospace;
}

.text-emerald {
  color: #10b981 !important;
}

.text-rose {
  color: #f43f5e !important;
}

.table-thumb {
  width: 64px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  display: block;
  cursor: pointer;
  transition: opacity 0.2s;
}

.table-thumb:hover {
  opacity: 0.8;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 999999;
}

.modal-content {
  background: #ffffff;
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  animation: modalFadeIn 0.2s ease-out;
}

.modal-large {
  max-width: 760px;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  padding: 18px 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title-box h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.modal-subtitle {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #64748b;
}

.btn-close {
  background: #f1f5f9;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.modal-form {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
}

.modal-body-scroll {
  padding: 16px 24px;
  overflow-y: auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #475569;
}

.form-control {
  padding: 10px 14px;
  font-size: 14px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  outline: none;
  transition: all 0.2s;
  width: 100%;
}

.form-control:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input-with-prefix {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-prefix .prefix {
  position: absolute;
  left: 14px;
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
}

.input-with-prefix .form-control {
  padding-left: 42px;
}

.radio-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.radio-box {
  border: 1px solid #e2e8f0;
  padding: 10px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s;
  text-align: center;
}

.radio-box input[type="radio"] {
  display: none;
}

.radio-box.active {
  border-color: #2563eb;
  background-color: #eff6ff;
  color: #1d4ed8;
}

.meal-allowance-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
}

.checkbox-container {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 28px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  user-select: none;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  height: 18px;
  width: 18px;
  background-color: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 4px;
  transition: all 0.2s;
}

.checkbox-container:hover input ~ .checkmark {
  border-color: #2563eb;
}

.checkbox-container input:checked ~ .checkmark {
  background-color: #2563eb;
  border-color: #2563eb;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.image-preview-card img {
  max-height: 90px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  object-fit: cover;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.info-card-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 400px;
}

.bank-card {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  color: #ffffff;
  box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.4);
}

.bank-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.bank-logo-icon {
  background: rgba(255, 255, 255, 0.2);
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bank-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  opacity: 0.9;
}

.bank-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.holder-name {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.account-number-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.acc-number {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.05em;
  font-family: monospace;
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-copy:hover {
  background: rgba(255, 255, 255, 0.3);
}

.info-tap-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #cbd5e1;
}

.lightbox-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999999;
  padding: 20px;
}

.lightbox-content {
  max-width: 90%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lightbox-content img {
  max-width: 100%;
  max-height: 75vh;
  border-radius: 12px;
  object-fit: contain;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.lightbox-caption {
  color: #94a3b8;
  font-size: 13px;
  margin-top: 14px;
}
</style>
