<script setup lang="ts">
import { nextTick } from "vue";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { useCollection, useDocument, useFirestore } from "vuefire";
import { persistPengeluaranDocuments } from "~/composables/useInvoiceAresaDigital";
import dialogBuatPengeluaran from "~/components/Admin/Penawaran/dialog-buat-pengeluaran.vue";
import type {
  buktiPengeluaranM,
  penawaranM,
  pengeluaranM,
} from "~/types/penawaranModel";
import type { invoiceM } from "~/types/invoice";

definePageMeta({
  layout: "admin",
});

const route = useRoute();
const db = useFirestore();

const idPenawaran = computed(() => String(route.params.id));
const addPengeluaranDialog = ref(false);

const penawaranRef = computed(() => doc(db, "penawaran", idPenawaran.value));
const pengeluaranFileChunksRef = computed(() =>
  collection(db, "penawaran", idPenawaran.value, "pengeluaran_file_chunks"),
);

const { data: penawaran, pending, error } = useDocument(penawaranRef);
const { data: pengeluaranFileChunks } = useCollection(pengeluaranFileChunksRef);

const detailPenawaran = computed(
  () => penawaran.value as penawaranM | undefined,
);
const invoiceCollectionRef = computed(() =>
  collection(db, "penawaran", idPenawaran.value, "invoice"),
);
const { data: invoices } = useCollection(invoiceCollectionRef);
const invoiceOptions = computed(() =>
  ((invoices.value ?? []) as invoiceM[])
    .map((invoice) => ({
      id: String(invoice.id_invoice || invoice.id || invoice.no_inv || ""),
      invoice,
    }))
    .filter((option) => option.id)
    .sort(
      // Invoice paling awal menjadi pilihan default untuk uang masuk.
      (a, b) => Number(a.invoice.createdAt || 0) - Number(b.invoice.createdAt || 0),
    ),
);
const selectedInvoiceId = ref("");
watch(
  invoiceOptions,
  (options) => {
    if (!options.some((option) => option.id === selectedInvoiceId.value)) {
      selectedInvoiceId.value = options[0]?.id ?? "";
    }
  },
  { immediate: true },
);
const selectedInvoice = computed(
  () => invoiceOptions.value.find((option) => option.id === selectedInvoiceId.value)?.invoice,
);
const uangMasukInvoice = computed(() =>
  Number(selectedInvoice.value?.grandtotal_invoice) || 0,
);
const namaClient = computed(() =>
  selectedInvoice.value?.nama_customer || detailPenawaran.value?.nama_perusahaan || "-",
);
const alamatClient = computed(() =>
  selectedInvoice.value?.alamat_customer || detailPenawaran.value?.alamat_perusahaan || "-",
);
const vessel = computed(() =>
  selectedInvoice.value?.vessel || detailPenawaran.value?.vessel || "-",
);
const nomorInvoice = computed(() => {
  const invoice = selectedInvoice.value;
  if (!invoice?.no_inv) return "-";
  const invoiceYear = new Date(invoice.tanggal).getFullYear();
  const createdAt = Number(invoice.createdAt);
  const createdYear = createdAt
    ? new Date(createdAt < 1e12 ? createdAt * 1000 : createdAt).getFullYear()
    : NaN;
  const year = [invoiceYear, createdYear].find(Number.isFinite) ?? new Date().getFullYear();
  return `INV/DRM/${year}/${invoice.no_inv}`;
});
const nomorPreorder = computed(() => selectedInvoice.value?.no_preorder || "-");
const getInvoiceLabel = (invoiceId?: string) => {
  if (!invoiceId) return "Belum ditentukan";
  const invoice = invoiceOptions.value.find((option) => option.id === invoiceId)?.invoice;
  return invoice?.no_inv ? `INV/${invoice.no_inv}` : `Invoice ${invoiceId}`;
};
const getExpenseInvoiceLabel = (expense: pengeluaranM) =>
  getInvoiceLabel(
    expense.invoice_out ||
      (invoiceOptions.value.length === 1 ? invoiceOptions.value[0]?.id : ""),
  );
const invoiceSelectItems = computed(() =>
  invoiceOptions.value.map((option) => ({
    title: getInvoiceLabel(option.id),
    value: option.id,
  })),
);
const isExpenseForInvoice = (
  expense: pengeluaranM,
  invoiceId: string,
  invoiceCount: number,
) =>
  expense.invoice_out === invoiceId ||
  (!expense.invoice_out && invoiceCount === 1);

const getTanggalPengeluaranTimestamp = (tanggal: string) => {
  const timestamp = new Date(tanggal).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
};

const fileDataUrls = computed(() => {
  const groupedChunks = new Map<string, { index: number; data: string }[]>();
  for (const chunk of pengeluaranFileChunks.value ?? []) {
    const fileId = chunk.fileId as string | undefined;
    if (!fileId) continue;
    const fileChunks = groupedChunks.get(fileId) ?? [];
    fileChunks.push({
      index: Number(chunk.index) || 0,
      data: String(chunk.data || ""),
    });
    groupedChunks.set(fileId, fileChunks);
  }

  const dataUrls = new Map<string, string>();
  for (const [fileId, chunks] of groupedChunks) {
    dataUrls.set(
      fileId,
      chunks
        .sort((a, b) => a.index - b.index)
        .map((chunk) => chunk.data)
        .join(""),
    );
  }
  return dataUrls;
});

const pengeluaran = computed(() => {
  return (detailPenawaran.value?.pengeluaran ?? [])
    .map((expense) => ({
      ...expense,
      doc_pengeluaran: (expense.doc_pengeluaran ?? []).map((document) => ({
        ...document,
        dataUrl:
          document.dataUrl ||
          (document.fileId ? fileDataUrls.value.get(document.fileId) : "") ||
          "",
      })),
    }))
    .sort((a, b) => {
      const timestampA = getTanggalPengeluaranTimestamp(a.tanggal_pengeluaran);
      const timestampB = getTanggalPengeluaranTimestamp(b.tanggal_pengeluaran);
      const invalidTimestamp = Number.NEGATIVE_INFINITY;

      if (timestampA === invalidTimestamp) {
        return timestampB === invalidTimestamp ? 0 : 1;
      }
      if (timestampB === invalidTimestamp) return -1;

      return timestampA - timestampB;
    });
});
const pengeluaranInvoice = computed(() => {
  if (!invoiceOptions.value.length) return pengeluaran.value;
  return pengeluaran.value.filter((expense) =>
    isExpenseForInvoice(expense, selectedInvoiceId.value, invoiceOptions.value.length),
  );
});
const unassignedExpenseCount = computed(() =>
  invoiceOptions.value.length > 1
    ? pengeluaran.value.filter(
        (expense) => !invoiceOptions.value.some((option) => option.id === expense.invoice_out),
      ).length
    : 0,
);

/* =====================================================
   EDIT
===================================================== */

const editDialog = ref(false);
const savingEdit = ref(false);
const deletingPengeluaranId = ref<string | null>(null);
const editIndex = ref<number | null>(null);
const editFiles = ref<File[]>([]);
const notificationStore = useNotificationStore();
const loadingStore = useloadingStore();

const editForm = reactive<pengeluaranM>({
  id_pengeluaran: "",
  invoice_out: "",
  tanggal_pengeluaran: "",
  keterangan: "",
  nominal: 0,
  qty: 1,
  satuan: "",
  nama_vendor: "",
  no_telp_vendor: "",
  lokasi_vendor: "",
  dikeluarkan_oleh: "",
  doc_pengeluaran: [],
  status_pengeluaran: "",
});

/* =====================================================
   TABLE HEADER
===================================================== */

const headers = [
  {
    title: "NO",
    key: "no",
    width: "55px",
    sortable: false,
  },
  {
    title: "TANGGAL",
    key: "tanggal_pengeluaran",
    width: "120px",
  },
  {
    title: "INVOICE",
    key: "invoice_out",
    width: "130px",
  },
  {
    title: "KETERANGAN",
    key: "keterangan",
    minWidth: "220px",
  },
  {
    title: "Dikeluarkan oleh",
    key: "dikeluarkan_oleh",
    maxWidth: "100px",
  },
  {
    title: "NOMINAL",
    key: "nominal",
    align: "end",
    width: "150px",
  },
  {
    title: "QTY",
    key: "qty",
    width: "90px",
  },
  {
    title: "VENDOR",
    key: "nama_vendor",
    minWidth: "180px",
  },

  {
    title: "Lampiran",
    key: "bukti",
    minWidth: "100px",
  },

  // {
  //   title: "Status",
  //   key: "status_pengeluaran",
  //   minWidth: "50px",
  // },
  {
    title: "AKSI",
    key: "actions",
    width: "110px",
    sortable: false,
    align: "center",
  },
];

/* =====================================================
   FORMAT
===================================================== */

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const totalPengeluaran = computed(() => {
  return pengeluaranInvoice.value.reduce(
    (total, item) => total + Number(item.nominal || 0),
    0,
  );
});

const simpanPengeluaranKeKeduaDokumen = async (
  pengeluaranBaru: pengeluaranM[],
) => {
  const invoiceSnapshots = await getDocs(invoiceCollectionRef.value);
  const invoiceIds = invoiceSnapshots.docs.map((snapshot) => snapshot.id);
  const expenses = invoiceIds.length === 1
    ? pengeluaranBaru.map((expense) =>
        expense.invoice_out ? expense : { ...expense, invoice_out: invoiceIds[0] },
      )
    : pengeluaranBaru;
  const total = expenses.reduce(
    (sum, expense) => sum + (Number(expense.nominal) || 0),
    0,
  );
  const batch = writeBatch(db);
  batch.update(doc(db, "penawaran", idPenawaran.value), {
    pengeluaran: expenses,
    grandtotal_pengeluaran: total,
  });
  for (const invoiceId of invoiceIds) {
    const invoiceExpenses = expenses.filter((expense) =>
      isExpenseForInvoice(expense, invoiceId, invoiceIds.length),
    );
    const values = {
      pengeluaran: invoiceExpenses,
      grandtotal_pengeluaran: invoiceExpenses.reduce(
        (sum, expense) => sum + (Number(expense.nominal) || 0),
        0,
      ),
    };
    batch.update(doc(db, "invoice", invoiceId), values);
    batch.update(doc(db, "penawaran", idPenawaran.value, "invoice", invoiceId), values);
  }
  await batch.commit();
};

let syncedExistingExpenses = false;
watch(
  [pending, detailPenawaran],
  async ([isPending, currentPenawaran]) => {
    if (
      isPending ||
      syncedExistingExpenses ||
      !currentPenawaran?.pengeluaran?.length
    ) {
      return;
    }
    syncedExistingExpenses = true;
    try {
      await simpanPengeluaranKeKeduaDokumen(currentPenawaran.pengeluaran);
    } catch (syncError) {
      syncedExistingExpenses = false;
      console.error("Gagal menyinkronkan pengeluaran ke invoice:", syncError);
      notificationStore.showError("Gagal menyinkronkan pengeluaran ke invoice");
    }
  },
  { immediate: true },
);

const savingPdf = ref(false);

const loadPdfImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Gagal memuat gambar PDF: ${src}`));
    image.src = src;
  });

const savePengeluaranPdf = async () => {
  if (savingPdf.value) return;
  savingPdf.value = true;
  loadingStore.setLoading(true);

  try {
    await nextTick();
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const tableWidth = pageWidth - margin * 2;
    const [logo, signature] = await Promise.all([
      loadPdfImage("/logokopsurat.png"),
      loadPdfImage("/ttd_ridwan.png"),
    ]);
    const columns = [
      { title: "No.", width: 13 },
      { title: "Tanggal", width: 28 },
      { title: "Keterangan", width: tableWidth - 13 - 28 - 40 },
      { title: "Nominal", width: 40 },
    ];
    const columnStarts = columns.map((_, index) =>
      margin + columns.slice(0, index).reduce((width, column) => width + column.width, 0),
    );
    let y = 0;

    const drawLetterhead = () => {
      const logoWidth = 48;
      const centerX = pageWidth / 2;
      pdf.addImage(
        logo,
        "PNG",
        margin,
        12,
        logoWidth,
        (logoWidth * logo.naturalHeight) / logo.naturalWidth,
      );
      pdf.setTextColor(15, 43, 72);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("PT. DUTA RAYA MARINE", centerX, 17, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text("Cipta Grand City G-8, Sagulung, Kota Batam,", centerX, 23, { align: "center" });
      pdf.text("Kepulauan Riau 29425", centerX, 27, { align: "center" });
      pdf.text("Jl. Raya Pasar Minggu No. 15A, Jakarta Selatan.", centerX, 31, { align: "center" });
      pdf.text("E-mail: sales@dutarayamarine.com | Phone/WhatsApp: +62823-8450-3953", centerX, 37, { align: "center" });
      pdf.text("Website: www.dutarayamarine.com", centerX, 41, { align: "center" });
      pdf.setDrawColor(3, 39, 82);
      pdf.setLineWidth(0.8);
      pdf.line(margin, 47, pageWidth - margin, 47);
      pdf.setLineWidth(0.2);
      y = 54;
    };

    const drawField = (label: string, value: string, x: number, top: number) => {
      pdf.setTextColor(75, 85, 99);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.text(label, x, top);
      pdf.setTextColor(17, 24, 39);
      const lines = pdf.splitTextToSize(value || "-", 58) as string[];
      pdf.text(lines, x + 29, top);
      return top + Math.max(1, lines.length) * 4.2 + 2;
    };

    drawLetterhead();
    pdf.setTextColor(17, 24, 39);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.text("DAFTAR PENGELUARAN", pageWidth / 2, y + 2, { align: "center" });
    y += 10;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    const projectLines = pdf.splitTextToSize(
      String(detailPenawaran.value?.perihal || "Project"),
      tableWidth,
    ) as string[];
    pdf.text(projectLines, margin, y);
    y += projectLines.length * 4.5 + 7;

    let leftY = y;
    leftY = drawField("Nama Client", namaClient.value, margin, leftY);
    leftY = drawField("Alamat Client", alamatClient.value, margin, leftY);
    leftY = drawField("Vessel", vessel.value, margin, leftY);
    leftY = drawField(
      "No. Penawaran",
      detailPenawaran.value?.no_penawaran || idPenawaran.value,
      margin,
      leftY,
    );
    let rightY = y;
    rightY = drawField("No. Invoice", nomorInvoice.value, 108, rightY);
    rightY = drawField("No. Preorder", nomorPreorder.value, 108, rightY);
    rightY = drawField(
      "Nilai Invoice",
      selectedInvoice.value ? rupiah.format(uangMasukInvoice.value) : "-",
      108,
      rightY,
    );
    y = Math.max(leftY, rightY) + 3;
    if (y > pageHeight - 40) {
      pdf.addPage();
      drawLetterhead();
    }

    const drawHeader = () => {
      pdf.setFillColor(245, 247, 250);
      pdf.setDrawColor(210, 215, 222);
      pdf.rect(margin, y, tableWidth, 9, "FD");
      pdf.setTextColor(17, 24, 39);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(columns[0].title, columnStarts[0] + 2, y + 6);
      pdf.text(columns[1].title, columnStarts[1] + 2, y + 6);
      pdf.text(columns[2].title, columnStarts[2] + 2, y + 6);
      pdf.text(columns[3].title, columnStarts[3] + columns[3].width - 2, y + 6, {
        align: "right",
      });
      let dividerX = margin;
      for (const column of columns.slice(0, -1)) {
        dividerX += column.width;
        pdf.line(dividerX, y, dividerX, y + 9);
      }
      y += 9;
    };

    drawHeader();
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    pengeluaranInvoice.value.forEach((item, index) => {
      const descriptionLines = pdf.splitTextToSize(
        String(item.keterangan || "-"),
        columns[2].width - 4,
      ) as string[];
      const rowHeight = Math.max(8, descriptionLines.length * 4.5 + 3);

      if (y + rowHeight > pageHeight - 18) {
        pdf.addPage();
        drawLetterhead();
        drawHeader();
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
      }

      pdf.setDrawColor(220, 224, 230);
      pdf.rect(margin, y, tableWidth, rowHeight);
      let dividerX = margin;
      for (const column of columns.slice(0, -1)) {
        dividerX += column.width;
        pdf.line(dividerX, y, dividerX, y + rowHeight);
      }
      pdf.text(String(index + 1), margin + 2, y + 5.5);
      pdf.text(formatTanggal(item.tanggal_pengeluaran), margin + columns[0].width + 2, y + 5.5);
      pdf.text(
        descriptionLines,
        margin + columns[0].width + columns[1].width + 2,
        y + 5.5,
      );
      pdf.text(
        rupiah.format(Number(item.nominal || 0)),
        columnStarts[3] + columns[3].width - 2,
        y + 5.5,
        { align: "right" },
      );
      y += rowHeight;
    });

    const signatureWidth = Math.min(40, (20 * signature.naturalWidth) / signature.naturalHeight);
    const signatureHeight = (signatureWidth * signature.naturalHeight) / signature.naturalWidth;
    const signatureSpace = 38 + signatureHeight;
    if (y + signatureSpace > pageHeight - 15) {
      pdf.addPage();
      drawLetterhead();
    }
    pdf.setTextColor(17, 24, 39);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Total Pengeluaran", margin, y + 7);
    pdf.text(rupiah.format(totalPengeluaran.value), pageWidth - margin, y + 7, {
      align: "right",
    });
    y += 18;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("Yours sincerely,", margin, y);
    y += 6;
    pdf.setFont("helvetica", "bold");
    pdf.text("PT. DUTA RAYA MARINE", margin, y);
    y += 3;
    pdf.addImage(signature, "PNG", margin, y, signatureWidth, signatureHeight);
    y += signatureHeight + 2;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("Muhammad Ridwan", margin, y);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(120, 128, 138);
    const waktuUnduh = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date());
    pdf.text(`Diunduh: ${waktuUnduh} WIB`, pageWidth - margin, pageHeight - 9, {
      align: "right",
    });

    const invoiceId = selectedInvoice.value?.id_invoice || selectedInvoiceId.value || "Tanpa-Invoice";
    const projectTitle = String(detailPenawaran.value?.perihal || idPenawaran.value)
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
    pdf.save(`Pengeluaran - INV-${invoiceId} ${projectTitle}.pdf`);
  } catch (error) {
    console.error("Gagal membuat PDF pengeluaran:", error);
    notificationStore.showError("Gagal membuat PDF pengeluaran.");
  } finally {
    savingPdf.value = false;
    loadingStore.setLoading(false);
  }
};

const formatTanggal = (tanggal: string) => {
  if (!tanggal) return "-";

  const date = new Date(tanggal);

  if (Number.isNaN(date.getTime())) {
    return tanggal;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const searchPengeluaran = ref("");
const searchQuery = computed(() => (searchPengeluaran.value ?? "").trim());
const filteredPengeluaran = computed(() => {
  const terms = searchQuery.value.toLocaleLowerCase("id-ID").split(/\s+/).filter(Boolean);
  if (!terms.length) return pengeluaran.value;

  return pengeluaran.value.filter((item) => {
    const searchableText = [
      item.tanggal_pengeluaran,
      formatTanggal(item.tanggal_pengeluaran),
      item.keterangan,
      item.dikeluarkan_oleh,
      item.nominal,
      rupiah.format(Number(item.nominal) || 0),
      item.qty,
      item.satuan,
      item.nama_vendor,
      item.no_telp_vendor,
      item.lokasi_vendor,
      item.status_pengeluaran,
      getExpenseInvoiceLabel(item),
      item.invoice_out,
      ...(item.doc_pengeluaran ?? []).map((document) => document.name),
    ]
      .join(" ")
      .toLocaleLowerCase("id-ID");

    return terms.every((term) => searchableText.includes(term));
  });
});
const totalPengeluaranDitampilkan = computed(() =>
  filteredPengeluaran.value.reduce(
    (total, item) => total + Number(item.nominal || 0),
    0,
  ),
);

/* =====================================================
   OPEN EDIT
===================================================== */

const openEdit = (item: any) => {
  const originalIndex = (detailPenawaran.value?.pengeluaran ?? []).findIndex(
    (expense) => expense.id_pengeluaran === item.id_pengeluaran,
  );
  if (originalIndex < 0) return;

  editIndex.value = originalIndex;

  editForm.id_pengeluaran = item.id_pengeluaran || "";
  editForm.invoice_out =
    item.invoice_out || (invoiceOptions.value.length === 1 ? invoiceOptions.value[0]?.id : "") || "";
  editForm.tanggal_pengeluaran = item.tanggal_pengeluaran || "";
  editForm.keterangan = item.keterangan || "";
  editForm.nominal = Number(item.nominal || 0);
  editForm.qty = Number(item.qty || 1);
  editForm.satuan = item.satuan || "";
  editForm.nama_vendor = item.nama_vendor || "";
  editForm.no_telp_vendor = item.no_telp_vendor || "";
  editForm.lokasi_vendor = item.lokasi_vendor || "";
  editForm.dikeluarkan_oleh = item.dikeluarkan_oleh || "";
  editForm.doc_pengeluaran = [...(item.doc_pengeluaran || [])];
  editForm.status_pengeluaran = item.status_pengeluaran || "";
  editFiles.value = [];

  editDialog.value = true;
};

const addEditFile = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files?.length) {
    editFiles.value = [...editFiles.value, ...Array.from(target.files)];
  }
  target.value = "";
};

const readEditFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("File bukti tidak dapat dibaca"));
    reader.onerror = () =>
      reject(reader.error || new Error("File bukti tidak dapat dibaca"));
    reader.readAsDataURL(file);
  });

/* =====================================================
   CLOSE EDIT
===================================================== */

const closeEdit = () => {
  if (savingEdit.value) return;

  editDialog.value = false;
  editIndex.value = null;
};

/* =====================================================
   SAVE EDIT
===================================================== */

const saveEdit = async () => {
  if (
    editIndex.value === null ||
    !detailPenawaran.value ||
    !Array.isArray(detailPenawaran.value.pengeluaran)
  ) {
    return;
  }
  if (
    !editForm.keterangan.trim() ||
    !editForm.tanggal_pengeluaran ||
    !editForm.dikeluarkan_oleh
  ) {
    notificationStore.showError(
      "Keterangan, tanggal, dan dikeluarkan oleh wajib diisi",
    );
    return;
  }
  if (
    !Number.isFinite(editForm.nominal) ||
    editForm.nominal <= 0 ||
    !Number.isFinite(editForm.qty) ||
    editForm.qty <= 0
  ) {
    notificationStore.showError("Nominal dan qty harus lebih dari 0");
    return;
  }
  if (
    invoiceOptions.value.length > 0 &&
    !invoiceOptions.value.some((option) => option.id === editForm.invoice_out)
  ) {
    notificationStore.showError("Pilih invoice untuk pengeluaran ini");
    return;
  }

  try {
    savingEdit.value = true;
    loadingStore.setLoading(true);
    await nextTick();

    const index = editIndex.value;

    const pengeluaranBaru = [...detailPenawaran.value.pengeluaran];

    const dataLama = pengeluaranBaru[index];

    if (!dataLama) {
      return;
    }

    const newDocuments: buktiPengeluaranM[] = [];
    for (const file of editFiles.value) {
      newDocuments.push({
        name: file.name,
        dataUrl: await readEditFile(file),
        size: file.size,
        contentType: file.type || "application/octet-stream",
      });
    }
    const doc_pengeluaran = await persistPengeluaranDocuments(
      idPenawaran.value,
      dataLama.id_pengeluaran,
      [...editForm.doc_pengeluaran, ...newDocuments],
    );

    pengeluaranBaru[index] = {
      ...dataLama,

      id_pengeluaran: editForm.id_pengeluaran || dataLama.id_pengeluaran,
      invoice_out: editForm.invoice_out || "",

      tanggal_pengeluaran: editForm.tanggal_pengeluaran,
      keterangan: editForm.keterangan,
      nominal: Number(editForm.nominal || 0),
      qty: Number(editForm.qty || 0),
      satuan: editForm.satuan,
      nama_vendor: editForm.nama_vendor,
      no_telp_vendor: editForm.no_telp_vendor,
      lokasi_vendor: editForm.lokasi_vendor,
      dikeluarkan_oleh: editForm.dikeluarkan_oleh,
      status_pengeluaran: editForm.status_pengeluaran,
      doc_pengeluaran,
    };

    await simpanPengeluaranKeKeduaDokumen(pengeluaranBaru);

    editDialog.value = false;
    editIndex.value = null;
  } catch (err) {
    console.error("Gagal mengedit pengeluaran:", err);
  } finally {
    savingEdit.value = false;
    loadingStore.setLoading(false);
  }
};

const deletePengeluaran = async (item: any) => {
  const idPengeluaran = item.id_pengeluaran;
  if (!idPengeluaran || !detailPenawaran.value) return;
  if (
    !window.confirm(
      `Hapus pengeluaran "${item.keterangan || "ini"}"? Tindakan ini tidak dapat dibatalkan.`,
    )
  ) {
    return;
  }

  try {
    deletingPengeluaranId.value = idPengeluaran;
    const pengeluaranBaru = (detailPenawaran.value.pengeluaran ?? []).filter(
      (expense) => expense.id_pengeluaran !== idPengeluaran,
    );
    await simpanPengeluaranKeKeduaDokumen(pengeluaranBaru);
    try {
      await persistPengeluaranDocuments(idPenawaran.value, idPengeluaran, []);
    } catch (cleanupError) {
      console.error("Gagal membersihkan lampiran pengeluaran:", cleanupError);
    }
    notificationStore.showSuccess("Pengeluaran berhasil dihapus");
  } catch (err) {
    console.error("Gagal menghapus pengeluaran:", err);
    notificationStore.showError("Gagal menghapus pengeluaran");
  } finally {
    deletingPengeluaranId.value = null;
  }
};

const imagePreviewDialog = ref(false);
const imagePreviewUrl = ref("");

const previewImage = (dataUrl: string) => {
  if (!dataUrl) return;

  imagePreviewUrl.value = dataUrl;
  imagePreviewDialog.value = true;
};
</script>

<template>
  <dialog-buat-pengeluaran
    v-if="detailPenawaran"
    v-model="addPengeluaranDialog"
    :id-penawaran="idPenawaran"
    :penawaran="detailPenawaran"
    @saved="selectedInvoiceId = $event || selectedInvoiceId"
  />

  <v-container fluid class="expense-page pa-0 pa-md-0">
    <v-dialog v-model="imagePreviewDialog" max-width="900">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          Pratinjau Bukti

          <v-btn
            icon="mdi-close"
            variant="text"
            @click="imagePreviewDialog = false"
          />
        </v-card-title>

        <v-card-text class="pa-2">
          <img
            v-if="imagePreviewUrl"
            :src="imagePreviewUrl"
            alt="Bukti Pengeluaran"
            class="w-100"
            style="max-height: 75vh; object-fit: contain"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- =================================================
         HEADER
    ================================================== -->

    <div class="page-header mb-4">
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="d-flex align-center">
        <v-btn
          icon="mdi-arrow-left"
          variant="tonal"
          color="grey-darken-2"
          size="small"
          class="back-button mr-3"
          @click="$router.go(-1)"
        />

        <div>
          <h1 class="page-title">Pengeluaran Project</h1>
        </div>
        </div>

      </div>

      <!-- PROJECT INFORMATION -->

      <v-card class="project-card" elevation="0">
        <div class="project-content">
          <div class="project-main">
            <div class="project-label">PROJECT</div>

            <div class="project-title">
              {{ detailPenawaran?.perihal || "Memuat data..." }}
            </div>

            <div class="company-name">
              <v-icon icon="mdi-domain" size="15" class="mr-1" />

              {{ detailPenawaran?.nama_perusahaan || "-" }}
            </div>
          </div>

          <div class="project-reference">
            <div class="reference-label">QUOTATION NO.</div>

            <div class="reference-number">
              {{ detailPenawaran?.no_penawaran || idPenawaran }}
            </div>
          </div>
        </div>
        <div class="project-meta-grid">
          <div class="project-meta-item">
            <span>Nama Client</span>
            <strong>{{ namaClient }}</strong>
          </div>
          <div class="project-meta-item">
            <span>Alamat Client</span>
            <strong>{{ alamatClient }}</strong>
          </div>
          <div class="project-meta-item">
            <span>Vessel</span>
            <strong>{{ vessel }}</strong>
          </div>
          <div class="project-meta-item">
            <span>Nomor Invoice</span>
            <strong>{{ nomorInvoice }}</strong>
          </div>
          <div class="project-meta-item">
            <span>Nomor Preorder</span>
            <strong>{{ nomorPreorder }}</strong>
          </div>
          <div class="project-meta-item">
            <span>Nilai Invoice</span>
            <strong>{{ selectedInvoice ? rupiah.format(uangMasukInvoice) : "-" }}</strong>
          </div>
        </div>
      </v-card>
    </div>

    <!-- =================================================
         SUMMARY
    ================================================== -->

    <div class="summary-grid mb-4">
      <v-card class="summary-card summary-primary" elevation="0">
        <div class="summary-primary-heading">
          <div class="summary-icon">
            <v-icon icon="mdi-cash-minus" size="19" />
          </div>
          <div class="summary-heading-label">Ringkasan Keuangan</div>
        </div>

        <div class="summary-metrics">
          <div class="summary-info summary-info-invoice">
            <div class="summary-label">UANG MASUK (INVOICE)</div>

            <div class="summary-amount">
              <div class="summary-value">
                {{ rupiah.format(uangMasukInvoice) }}
              </div>
              <div
                v-if="invoiceOptions.length"
                class="invoice-selector"
                aria-label="Pilih invoice untuk ringkasan"
              >
                <button
                  v-for="(option, index) in invoiceOptions"
                  :key="option.id"
                  type="button"
                  class="invoice-choice"
                  :class="{ 'invoice-choice-active': selectedInvoiceId === option.id }"
                  :aria-pressed="selectedInvoiceId === option.id"
                  @click="selectedInvoiceId = option.id"
                >
                  <span>
                    {{ option.invoice.no_inv ? `INV/${option.invoice.no_inv}` : `Invoice ${index + 1}` }}
                  </span>
                  <strong>{{ rupiah.format(Number(option.invoice.grandtotal_invoice) || 0) }}</strong>
                </button>
              </div>
            </div>
          </div>

          <div class="summary-info">
            <div class="summary-label">
              {{ invoiceOptions.length ? "TOTAL PENGELUARAN (INVOICE)" : "TOTAL PENGELUARAN" }}
            </div>

            <div class="summary-value">
              {{ rupiah.format(totalPengeluaran) }}
            </div>
          </div>

          <div class="summary-info summary-info-remaining">
            <div class="summary-label">SISA</div>

            <div class="summary-value">
              {{ rupiah.format(uangMasukInvoice - totalPengeluaran) }}
            </div>
          </div>
        </div>
      </v-card>

      <v-card class="summary-card" elevation="0">
        <div class="summary-icon neutral">
          <v-icon icon="mdi-receipt-text-outline" size="19" />
        </div>

        <div class="summary-info">
          <div class="summary-label">JUMLAH TRANSAKSI</div>

          <div class="summary-value">
            {{ pengeluaranInvoice.length }}

            <span class="summary-unit"> transaksi </span>
          </div>
        </div>
      </v-card>
    </div>

    <!-- =================================================
         ALERT ERROR
    ================================================== -->

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4 corporate-alert"
      icon="mdi-alert-circle-outline"
    >
      <div class="font-weight-medium">Gagal mengambil data pengeluaran.</div>

      <div class="text-caption mt-1">
        Silakan refresh halaman atau coba kembali beberapa saat lagi.
      </div>
    </v-alert>

    <!-- =================================================
         DATA TIDAK DITEMUKAN
    ================================================== -->

    <v-alert
      v-else-if="!pending && !detailPenawaran"
      type="warning"
      variant="tonal"
      class="mb-4 corporate-alert"
      icon="mdi-alert-outline"
    >
      <div class="font-weight-medium">Data penawaran tidak ditemukan.</div>
    </v-alert>

    <!-- =================================================
         TABLE
    ================================================== -->

    <v-card v-else class="table-card" elevation="0">
      <div class="table-header">
        <div>
          <div class="table-title">Daftar Pengeluaran</div>

          <div class="table-subtitle">
            Semua biaya proyek; ringkasan dan PDF mengikuti invoice terpilih
          </div>
        </div>

        <div class="table-actions">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-plus"
            size="small"
            class="table-action table-action-primary"
            :disabled="!detailPenawaran"
            @click="addPengeluaranDialog = true"
          >
            Tambah Pengeluaran
          </v-btn>

          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-file-pdf-box"
            size="small"
            class="table-action table-action-secondary"
            :loading="savingPdf"
            :disabled="pending || !detailPenawaran"
            aria-label="Unduh daftar pengeluaran sebagai PDF"
            @click="savePengeluaranPdf"
          >
            Unduh PDF
          </v-btn>
        </div>
      </div>

      <v-divider />

      <v-alert
        v-if="unassignedExpenseCount"
        type="warning"
        variant="tonal"
        density="compact"
        class="ma-4 corporate-alert"
      >
        {{ unassignedExpenseCount }} pengeluaran belum terkait ke invoice yang tersedia. Edit pengeluaran tersebut untuk memilih invoice.
      </v-alert>

      <div class="table-search-toolbar">
        <v-text-field
          v-model="searchPengeluaran"

          placeholder="Keterangan, vendor, tanggal, nominal..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="expense-search"
        />
        <span v-if="searchQuery" class="search-result-count">
          {{ filteredPengeluaran.length }} dari {{ pengeluaran.length }} data
        </span>
      </div>

      <v-divider />

      <div class="table-wrapper">
        <v-data-table
          :headers="headers"
          :items="filteredPengeluaran"
          :loading="pending"
          :items-per-page="-1"
          item-value="id_pengeluaran"
          hover
          class="corporate-table"
          hide-default-footer
        >
          <!-- LOADING -->

          <template #loading>
            <v-skeleton-loader type="table-row@6" class="pa-4" />
          </template>

          <!-- EMPTY -->

          <template #no-data>
            <div class="empty-state">
              <div class="empty-icon">
                <v-icon icon="mdi-receipt-text-outline" size="30" />
              </div>

              <div class="empty-title">
                {{ searchQuery ? "Tidak ada hasil pencarian" : "Belum ada pengeluaran" }}
              </div>

              <div class="empty-description">
                {{
                  searchQuery
                    ? "Coba kata kunci lain atau hapus pencarian."
                    : "Belum terdapat data pengeluaran untuk project ini."
                }}
              </div>
            </div>
          </template>

          <!-- NOMOR -->

          <template #item.no="{ index }">
            <span class="row-number">
              {{ String(index + 1).padStart(2, "0") }}
            </span>
          </template>

          <!-- TANGGAL -->

          <template #item.tanggal_pengeluaran="{ item }">
            <div class="date-cell">
              {{ formatTanggal(item.tanggal_pengeluaran) }}
            </div>
          </template>

          <template #item.invoice_out="{ item }">
            <span class="expense-invoice-label" :class="{ 'expense-invoice-unassigned': invoiceOptions.length > 1 && !invoiceOptions.some((option) => option.id === item.invoice_out) }">
              {{ getExpenseInvoiceLabel(item) }}
            </span>
          </template>

          <!-- KETERANGAN -->

          <template #item.keterangan="{ item }">
            <div class="description-cell">
              {{ item.keterangan || "-" }}
            </div>
          </template>

          <!-- NOMINAL -->

          <template #item.nominal="{ item }">
            <div class="nominal-cell">
              {{ rupiah.format(Number(item.nominal || 0)) }}
            </div>
          </template>

          <!-- QTY -->

          <template #item.qty="{ item }">
            <div class="qty-cell">
              <span class="qty-number">
                {{ item.qty ?? 0 }}
              </span>

              <span class="qty-unit">
                {{ item.satuan || "-" }}
              </span>
            </div>
          </template>

          <!-- VENDOR -->

          <template #item.nama_vendor="{ item }">
            <div class="vendor-cell mt-2">
              <div class="vendor-icon">
                <v-icon icon="mdi-store-outline" size="15" />
              </div>

              <span>
                {{ item.nama_vendor || "-" }} {{ item.no_telp_vendor || "-" }} {{ item.lokasi_vendor || "-" }}
              </span>
            </div>
          </template>

          <template #item.bukti="{ item }">
            <div v-if="item.doc_pengeluaran?.length" class="d-flex ga-1">
              <v-tooltip
                v-for="(document, index) in item.doc_pengeluaran"
                :key="document.fileId || index"
                text="Pratinjau Gambar"
                location="top"
              >
                <template #activator="{ props }">
                  <button
                    v-bind="props"
                    type="button"
                    class="btn-image-preview"
                    @click="previewImage(document.dataUrl)"
                  >
                    <v-icon size="20">mdi-image-outline</v-icon>
                  </button>
                </template>
              </v-tooltip>
            </div>

            <span v-else class="text-disabled">-</span>
          </template>

          <!-- DIKELUARKAN OLEH -->

          <template #item.dikeluarkan_oleh="{ item }">
            <div>
              {{ item.dikeluarkan_oleh || "-" }}
            </div>
          </template>

          <!-- <template #item.status_pengeluaran="{ item }">
            <div
              class="issued-by-cell"
              :style="{
                color:
                  item.status_pengeluaran === 'Hutang'
                    ? '#f44336'
                    : item.status_pengeluaran === 'Lunas'
                      ? '#4caf50'
                      : '',
                backgroundColor:
                  item.status_pengeluaran === 'Hutang'
                    ? '#ffebee'
                    : item.status_pengeluaran === 'Lunas'
                      ? '#e8f5e9'
                      : '',
                padding: '4px 10px',
                borderRadius: '6px',
                display: 'inline-block',
                fontWeight: '500',
              }"
            >
              {{ item.status_pengeluaran || "-" }}
            </div>
          </template> -->

          <!-- AKSI -->

          <template #item.actions="{ item, index }">
            <div class="d-flex align-center justify-center">
              <v-btn
                icon="mdi-pencil-outline"
                variant="text"
                size="small"
                color="grey-darken-1"
                :disabled="deletingPengeluaranId !== null"
                @click="openEdit(item)"
              >
                <v-icon size="18">mdi-pencil-outline</v-icon>
                <v-tooltip activator="parent" location="top">
                  Edit Pengeluaran
                </v-tooltip>
              </v-btn>

              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                size="small"
                color="error"
                :loading="deletingPengeluaranId === item.id_pengeluaran"
                :disabled="deletingPengeluaranId !== null"
                @click="deletePengeluaran(item)"
              >
                <v-icon size="18">mdi-delete-outline</v-icon>
                <v-tooltip activator="parent" location="top">
                  Hapus Pengeluaran
                </v-tooltip>
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </div>

      <div class="mobile-expense-list">
        <v-skeleton-loader v-if="pending" type="card@3" />

        <div v-else-if="!filteredPengeluaran.length" class="empty-state">
          <div class="empty-icon">
            <v-icon icon="mdi-receipt-text-outline" size="30" />
          </div>
          <div class="empty-title">
            {{ searchQuery ? "Tidak ada hasil pencarian" : "Belum ada pengeluaran" }}
          </div>
          <div class="empty-description">
            {{
              searchQuery
                ? "Coba kata kunci lain atau hapus pencarian."
                : "Belum terdapat data pengeluaran untuk project ini."
            }}
          </div>
        </div>

        <article
          v-for="(item, index) in pending ? [] : filteredPengeluaran"
          :key="item.id_pengeluaran"
          class="mobile-expense-card"
        >
          <div class="mobile-expense-topline">
            <span class="mobile-expense-date">
              <span class="row-number">#{{ String(index + 1).padStart(2, "0") }}</span>
              <!-- {{ formatTanggal(item.tanggal_pengeluaran) }} -->
            </span>
            <span
              class="text-caption text-grey"
              
            >
              {{ formatTanggal(item.tanggal_pengeluaran) }}
            </span>
          </div>

          <div class="mobile-expense-description">{{ item.keterangan || "-" }}</div>
          <div class="mobile-expense-amount">
            {{ rupiah.format(Number(item.nominal || 0)) }}
          </div>

          <div class="mobile-expense-details">
            <div class="mobile-expense-detail">
              <span>Invoice</span>
              <strong>{{ getExpenseInvoiceLabel(item) }}</strong>
            </div>
            <div class="mobile-expense-detail">
              <span>Qty</span>
              <strong>{{ item.qty ?? 0 }} {{ item.satuan || "-" }}</strong>
            </div>
            <div v-if="item.nama_vendor || item.no_telp_vendor || item.lokasi_vendor" class="mobile-expense-detail">
              <span>Vendor</span>
              <strong>
                {{ [item.nama_vendor, item.no_telp_vendor, item.lokasi_vendor].filter(Boolean).join(" · ") }}
              </strong>
            </div>
            <div class="mobile-expense-detail">
              <span>Dikeluarkan oleh</span>
              <strong>{{ item.dikeluarkan_oleh || "-" }}</strong>
            </div>
          </div>

          <div class="mobile-expense-actions">
            <div class="mobile-expense-attachments">
              <button
                v-for="(document, documentIndex) in item.doc_pengeluaran ?? []"
                :key="document.fileId || documentIndex"
                type="button"
                class="btn-image-preview"
                :aria-label="`Pratinjau ${document.name || 'lampiran'}`"
                @click="previewImage(document.dataUrl)"
              >
                <v-icon size="18">mdi-image-outline</v-icon>
              </button>
              <span v-if="!item.doc_pengeluaran?.length" class="mobile-expense-no-file">
                Tanpa lampiran
              </span>
            </div>
            <div class="mobile-expense-action-buttons">
              <v-btn
                icon="mdi-pencil-outline"
                variant="text"
                size="small"
                color="grey-darken-1"
                aria-label="Edit pengeluaran"
                :disabled="deletingPengeluaranId !== null"
                @click="openEdit(item)"
              />
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                size="small"
                color="error"
                aria-label="Hapus pengeluaran"
                :loading="deletingPengeluaranId === item.id_pengeluaran"
                :disabled="deletingPengeluaranId !== null"
                @click="deletePengeluaran(item)"
              />
            </div>
          </div>
        </article>
      </div>

      <!-- TABLE FOOTER -->

      <v-divider />

      <div class="table-footer">
        <span class="footer-label">
          {{ searchQuery ? "Total Hasil Pencarian" : "Total Semua Pengeluaran" }}
        </span>

        <span class="footer-total">
          {{ rupiah.format(totalPengeluaranDitampilkan) }}
        </span>
      </div>
    </v-card>

    <!-- =================================================
         EDIT DIALOG
    ================================================== -->

    <div v-if="editDialog" class="edit-modal-overlay" @click.self="closeEdit">
      <div class="edit-modal-card">
        <div class="edit-modal-header">
          <div class="edit-title-group">
            <v-icon color="primary" size="18"
              >mdi-file-document-edit-outline</v-icon
            >
            <span class="edit-modal-title">Edit Pengeluaran</span>
          </div>
          <button
            class="edit-btn-close"
            :disabled="savingEdit"
            @click="closeEdit"
          >
            &times;
          </button>
        </div>

        <div class="edit-modal-body">
          <a-select-new
            v-if="invoiceOptions.length > 1"
            v-model="editForm.invoice_out"
            label="Invoice Pengeluaran"
            placeholder="Pilih invoice"
            :items="invoiceSelectItems"
            :disabled="savingEdit"
            class="mb-2"
          />
          <a-date-picker-new
            v-model="editForm.tanggal_pengeluaran"
            label="Tanggal Pengeluaran"
            :disabled="savingEdit"
            class="mb-2"
          />
          <a-text-field-new
            v-model="editForm.dikeluarkan_oleh"
            label="Dikeluarkan Oleh"
            placeholder="Nama"
            :disabled="savingEdit"
            class="my-2"
          />
          <a-textarea-new
            v-model="editForm.keterangan"
            label="Keterangan"
            :disabled="savingEdit"
          />
          <div class="edit-form-grid">
            <a-text-field-new
              v-model="editForm.qty"
              label="Qty"
              :disabled="savingEdit"
            />
            <a-select-new
              v-model="editForm.satuan"
              label="Satuan"
              :disabled="savingEdit"
              :items="['Unit', 'Pcs', 'Kg', 'Lot']"
            />
            <a-field-number-new
              v-model="editForm.nominal"
              label="Nominal"
              :disabled="savingEdit"
            />
          </div>

          <div class="edit-section-title mt-3">Informasi Vendor</div>
          <div class="edit-form-grid">
            <a-text-field-new
              v-model="editForm.nama_vendor"
              label="Nama Vendor"
              :disabled="savingEdit"
            />
            <a-text-field-new
              v-model="editForm.no_telp_vendor"
              label="No. Telepon Vendor"
              :disabled="savingEdit"
            />
            <a-text-field-new
              v-model="editForm.lokasi_vendor"
              label="Lokasi Vendor"
              :disabled="savingEdit"
            />
          </div>

          <v-divider class="my-2" />
          <div class="edit-upload-row">
            <div class="edit-upload-wrapper">
              <label for="edit-upload-bukti" class="edit-upload-label"
                >Bill Upload</label
              >
              <div class="edit-upload-box">
                <input
                  id="edit-upload-bukti"
                  type="file"
                  multiple
                  class="edit-file-input"
                  :disabled="savingEdit"
                  @change="addEditFile"
                />
                <div class="edit-upload-icon">↑</div>
                <div>
                  <div class="edit-upload-title">Pilih File</div>
                  <div class="edit-upload-info">Ukuran file bebas</div>
                </div>
              </div>
            </div>
            <div
              v-if="editForm.doc_pengeluaran.length || editFiles.length"
              class="edit-files-wrapper"
            >
              <div class="edit-upload-label">File Terpilih</div>
              <div class="edit-file-list">
                <div
                  v-for="(file, index) in editForm.doc_pengeluaran"
                  :key="`${file.name}-${index}`"
                  class="edit-file-item"
                >
                  <div class="edit-file-name">📄 {{ file.name }}</div>
                  <button
                    type="button"
                    class="edit-file-remove"
                    :disabled="savingEdit"
                    @click="editForm.doc_pengeluaran.splice(index, 1)"
                  >
                    &times;
                  </button>
                </div>
                <div
                  v-for="(file, index) in editFiles"
                  :key="`${file.name}-${file.lastModified}-${index}`"
                  class="edit-file-item"
                >
                  <div class="edit-file-name">📄 {{ file.name }}</div>
                  <button
                    type="button"
                    class="edit-file-remove"
                    :disabled="savingEdit"
                    @click="editFiles.splice(index, 1)"
                  >
                    &times;
                  </button>
                </div>
              </div>
            </div>
          </div>
          <a-select-new
            v-model="editForm.status_pengeluaran"
            :items="['Hutang', 'Lunas']"
            label="Status"
            :disabled="savingEdit"
            class="mt-2"
          />
        </div>

        <div class="edit-modal-footer">
          <button
            class="edit-btn edit-btn-secondary"
            :disabled="savingEdit"
            @click="closeEdit"
          >
            Batal
          </button>
          <button
            class="edit-btn edit-btn-primary"
            :disabled="savingEdit"
            @click="saveEdit"
          >
            {{ savingEdit ? "Memproses..." : "Simpan Pengeluaran" }}
          </button>
        </div>
      </div>
    </div>
  </v-container>
</template>

<style scoped>
/* =====================================================
   PAGE
===================================================== */

.expense-page {
  max-width: 1800px;
  margin: 0 auto;
  color: #1f2937;
}

/* =====================================================
   PAGE HEADER
===================================================== */

.page-header {
  width: 100%;
}

.back-button {
  border-radius: 8px;
}

.page-eyebrow {
  font-size: 9px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #9ca3af;
  margin-bottom: 3px;
}

.page-title {
  margin: 0;
  font-size: 21px;
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.2px;
  color: #111827;
}

/* =====================================================
   PROJECT CARD
===================================================== */

.project-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.project-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 78px;
  padding: 14px 18px;
}

.project-main {
  min-width: 0;
}

.project-label,
.reference-label {
  font-size: 9px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #9ca3af;
  margin-bottom: 5px;
}

.project-title {
  font-size: 15px;
  line-height: 1.3;
  font-weight: 650;
  color: #111827;
  word-break: break-word;
}

.company-name {
  display: flex;
  align-items: center;
  margin-top: 4px;
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

.project-reference {
  flex-shrink: 0;
  min-width: 160px;
  padding-left: 20px;
  margin-left: 20px;
  border-left: 1px solid #e5e7eb;
}

.reference-number {
  font-family: monospace;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
}

.project-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px 20px;
  padding: 14px 18px 16px;
  border-top: 1px solid #eef0f3;
}

.project-meta-item {
  display: grid;
  align-content: start;
  gap: 4px;
  min-width: 0;
}

.project-meta-item span {
  color: #9ca3af;
  font-size: 10px;
  font-weight: 600;
}

.project-meta-item strong {
  color: #374151;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

/* =====================================================
   SUMMARY
===================================================== */

.summary-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(190px, 0.38fr);
  gap: 10px;
  min-width: 0;
}

.summary-card {
  min-width: 0;
  min-height: 92px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.summary-primary {
  display: grid;
  grid-template-columns: minmax(140px, 0.55fr) minmax(0, 2fr);
  align-items: stretch;
  gap: 16px;
  background: #fafbfc;
  border-color: #e1e5ea;
}

.summary-primary-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.summary-heading-label {
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
}

.summary-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
  min-width: 0;
}

.summary-info {
  min-width: 0;
  padding: 2px 14px;
}

.summary-metrics .summary-info + .summary-info {
  border-left: 1px solid #e5e7eb;
}

.summary-icon {
  width: 36px;
  height: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: #eef2f6;
  color: #526b84;
}

.summary-icon.neutral {
  background: #f3f4f6;
  color: #6b7280;
}

.summary-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #9ca3af;
  margin-bottom: 3px;
}

.summary-value {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 16px;
  line-height: 1.2;
  font-weight: 700;
  color: #111827;
}

.summary-unit {
  font-size: 10px;
  font-weight: 500;
  color: #9ca3af;
}

.invoice-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  min-width: 0;
  margin-top: 7px;
}

.invoice-choice {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  padding: 4px 7px;
  border: 1px solid #dbe2ea;
  border-radius: 6px;
  background: #fff;
  color: #475569;
  font-size: 9px;
  line-height: 1.2;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease,
    color 0.15s ease;
}

.invoice-choice span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invoice-choice strong {
  color: #1f2937;
  font-size: 9px;
  white-space: nowrap;
}

.invoice-choice:hover {
  border-color: #93b4d5;
}

.invoice-choice-active {
  border-color: #1867c0;
  background: #eff6ff;
  color: #164f8e;
  box-shadow: 0 0 0 1px #1867c0 inset;
}

.invoice-choice-active strong {
  color: #164f8e;
}

/* =====================================================
   ALERT
===================================================== */

.corporate-alert {
  border-radius: 8px !important;
}

/* =====================================================
   TABLE CARD
===================================================== */

.table-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
}

.table-header {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 18px;
}

.table-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.table-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.table-action {
  height: 36px !important;
  padding-inline: 13px !important;
  border-radius: 9px !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  letter-spacing: 0 !important;
  text-transform: none !important;
}

.table-action-primary {
  box-shadow: 0 3px 8px rgba(24, 103, 192, 0.18);
}

.table-action-secondary {
  border-color: #cbd5e1 !important;
  background: #f8fafc;
}

.table-action-secondary:hover:not(:disabled) {
  border-color: #1867c0 !important;
  background: #eff6ff;
}

.table-subtitle {
  margin-top: 2px;
  font-size: 11px;
  color: #9ca3af;
}

.table-search-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
}

.expense-search {
  max-width: 360px;
}

.search-result-count {
  color: #6b7280;
  font-size: 12px;
  white-space: nowrap;
}

.transaction-chip {
  font-size: 11px !important;
  flex-shrink: 0;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.mobile-expense-list {
  display: none;
}

.mobile-expense-card {
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}

.mobile-expense-topline,
.mobile-expense-date,
.mobile-expense-actions,
.mobile-expense-action-buttons,
.mobile-expense-attachments {
  display: flex;
  align-items: center;
}

.mobile-expense-topline,
.mobile-expense-actions {
  justify-content: space-between;
  gap: 10px;
}

.mobile-expense-date {
  gap: 7px;
  color: #6b7280;
  font-size: 11px;
}

.mobile-expense-status {
  padding: 3px 8px;
  border-radius: 5px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 10px;
  font-weight: 600;
}

.mobile-expense-status-debt {
  background: #ffebee;
  color: #c62828;
}

.mobile-expense-status-paid {
  background: #e8f5e9;
  color: #2e7d32;
}

.mobile-expense-description {
  margin-top: 12px;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.mobile-expense-amount {
  margin-top: 3px;
  color: #111827;
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.mobile-expense-details {
  display: grid;
  gap: 7px;
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid #f0f1f3;
}

.mobile-expense-detail {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 11px;
  line-height: 1.0;
}

.mobile-expense-detail span {
  flex-shrink: 0;
  color: #9ca3af;
}

.mobile-expense-detail strong {
  color: #4b5563;
  font-weight: 500;
  text-align: right;
  overflow-wrap: anywhere;
}

.mobile-expense-actions {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #f0f1f3;
}

.mobile-expense-attachments {
  flex-wrap: wrap;
  gap: 5px;
}

.mobile-expense-no-file {
  color: #9ca3af;
  font-size: 10px;
}

.mobile-expense-action-buttons {
  flex-shrink: 0;
  gap: 2px;
}

/* =====================================================
   DATA TABLE
===================================================== */

.corporate-table {
  min-width: 1250px;
}

.corporate-table :deep(th) {
  height: 42px !important;
  background: #f8fafc !important;
  border-bottom: 1px solid #e5e7eb !important;
  color: #6b7280 !important;
  font-size: 9px !important;
  font-weight: 700 !important;
  letter-spacing: 0.6px;
  white-space: nowrap;
}

.corporate-table :deep(td) {
  height: 52px !important;
  border-bottom: 1px solid #f0f1f3 !important;
  color: #374151;
  font-size: 12px;
}

.corporate-table :deep(tbody tr:hover) {
  background: #fafbfc !important;
}

.corporate-table :deep(tbody tr:last-child td) {
  border-bottom: none !important;
}

/* =====================================================
   TABLE CELLS
===================================================== */

.row-number {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
}

.date-cell {
  font-size: 11px;
  color: #4b5563;
  white-space: nowrap;
}

.expense-invoice-label {
  display: inline-block;
  padding: 4px 7px;
  border-radius: 5px;
  background: #eff6ff;
  color: #164f8e;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.expense-invoice-unassigned {
  background: #fff7ed;
  color: #9a3412;
}

.description-cell {
  max-width: 320px;
  line-height: 1.4;
  font-weight: 500;
  color: #374151;
}

.nominal-cell {
  font-size: 12px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.qty-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 5px;
  background: #f3f4f6;
  white-space: nowrap;
}

.qty-number {
  font-size: 11px;
  font-weight: 700;
  color: #374151;
}

.qty-unit {
  font-size: 10px;
  color: #6b7280;
}

.vendor-cell {
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 500;
}

.vendor-icon {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 6px;
  background: #f3f4f6;
  color: #6b7280;
}

.phone-link {
  display: inline-flex;
  align-items: center;
  color: #526b84;
  text-decoration: none;
  white-space: nowrap;
  font-size: 11px;
}

.phone-link:hover {
  text-decoration: underline;
}

.location-cell {
  display: flex;
  align-items: center;
  color: #6b7280;
  font-size: 11px;
  line-height: 1.4;
}

.issued-by-cell {
  font-size: 11px;
  font-weight: 500;
  color: #4b5563;
  white-space: nowrap;
}

/* =====================================================
   EMPTY STATE
===================================================== */

.empty-state {
  padding: 45px 20px;
  text-align: center;
}

.empty-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  border-radius: 10px;
  background: #f3f4f6;
  color: #9ca3af;
}

.empty-title {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.empty-description {
  margin-top: 3px;
  font-size: 11px;
  color: #9ca3af;
}

/* =====================================================
   TABLE FOOTER
===================================================== */

.table-footer {
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 10px 18px;
  background: #fafbfc;
}

.footer-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
}

.footer-total {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

/* =====================================================
   EDIT DIALOG
===================================================== */

.edit-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.4);
  justify-content: center;
}

.edit-modal-card {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.edit-modal-header,
.edit-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f8f9fa;
}

.edit-modal-header {
  border-bottom: 1px solid #e9ecef;
}
.edit-modal-footer {
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #e9ecef;
}
.edit-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.edit-modal-title {
  font-size: 14px;
  font-weight: 700;
  color: #212529;
}

.edit-btn-close,
.edit-file-remove {
  border: 0;
  background: transparent;
  cursor: pointer;
}
.edit-btn-close {
  color: #6c757d;
  font-size: 20px;
  line-height: 1;
}
.edit-modal-body {
  padding: 12px 16px;
  overflow-y: auto;
}
.edit-section-title {
  margin-bottom: 6px;
  color: #6c757d;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.edit-form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.edit-upload-row {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
}
.edit-upload-wrapper {
  flex-shrink: 0;
}
.edit-files-wrapper {
  flex: 1;
  min-width: 0;
}
.edit-upload-label {
  display: block;
  margin-bottom: 6px;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
}
.edit-upload-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 150px;
  height: 82px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
}
.edit-file-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
.edit-upload-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #475569;
  font-size: 17px;
}
.edit-upload-title {
  color: #334155;
  font-size: 12px;
  font-weight: 600;
}
.edit-upload-info {
  margin-top: 2px;
  color: #94a3b8;
  font-size: 10px;
}
.edit-file-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.edit-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 38px;
  padding: 6px 9px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
}
.edit-file-name {
  min-width: 0;
  overflow: hidden;
  color: #475569;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.edit-file-remove {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 18px;
  line-height: 1;
}
.edit-file-remove:hover:not(:disabled) {
  color: #dc2626;
}
.edit-btn {
  padding: 5px 14px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.edit-btn-secondary {
  border-color: #ced4da;
  background: #fff;
  color: #495057;
}
.edit-btn-primary {
  background: #1976d2;
  color: #fff;
}
.edit-btn:disabled,
.edit-btn-close:disabled,
.edit-file-remove:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .edit-modal-card {
    max-height: 100vh;
    border-radius: 0;
  }
  .edit-form-grid {
    grid-template-columns: 1fr;
  }
  .edit-upload-row {
    flex-direction: column;
    gap: 12px;
  }
}

/* =====================================================
   TABLET
===================================================== */

@media (max-width: 959px) {
  .expense-page {
    padding: 1px !important;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-card {
    min-height: 82px;
  }

  .project-content {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }

  .project-reference {
    width: 100%;
    min-width: 0;
    padding-left: 0;
    padding-top: 12px;
    margin-left: 0;
    border-left: none;
    border-top: 1px solid #e5e7eb;
  }

  .project-meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .edit-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* =====================================================
   MOBILE
===================================================== */

@media (max-width: 600px) {
  .expense-page {
    padding: 1px !important;
  }

  .page-title {
    font-size: 19px;
  }

  .page-header > .d-flex {
    flex-wrap: wrap;
    gap: 10px;
  }

  .page-header > .d-flex > .v-btn {
    flex-shrink: 0;
  }

  .page-eyebrow {
    font-size: 8px;
  }

  .project-content {
    padding: 14px;
  }

  .project-meta-grid {
    gap: 12px;
    padding: 12px 14px 14px;
  }

  .project-title {
    font-size: 14px;
  }

  .company-name {
    font-size: 10px;
  }

  .summary-card {
    min-height: 0;
    padding: 10px 13px;
    gap: 10px;
  }

  .summary-primary {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .summary-primary-heading {
    padding-bottom: 10px;
    border-bottom: 1px solid #e5e7eb;
  }

  .summary-metrics {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }

  .summary-info {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 0;
  }

  .summary-info-invoice .summary-amount {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 0;
    max-width: 60%;
  }

  .summary-info-invoice .invoice-selector {
    justify-content: flex-end;
  }

  .summary-metrics .summary-info + .summary-info {
    border-top: 1px solid #eef0f3;
    border-left: 0;
  }

  .summary-label {
    margin: 0;
    line-height: 1.4;
  }

  .summary-value {
    text-align: right;
    overflow-wrap: anywhere;
  }

  .summary-icon {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }

  .summary-label {
    font-size: 8px;
  }

  .summary-value {
    font-size: 14px;
  }

  .table-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 13px 14px;
  }

  .table-actions {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .table-action {
    width: 100%;
    padding-inline: 8px !important;
    font-size: 11px !important;
  }

  .table-search-toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
  }

  .expense-search {
    max-width: none;
  }

  .table-wrapper {
    display: none;
  }

  .mobile-expense-list {
    display: grid;
    gap: 10px;
    padding: 12px 14px;
    background: #f8fafc;
  }

  .mobile-expense-list > .empty-state {
    background: #fff;
    border-radius: 10px;
  }

  .edit-form-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .edit-modal-overlay {
    padding: 10px;
  }

  .edit-modal-card {
    max-height: calc(100dvh - 20px);
    border-radius: 10px;
  }

  .transaction-chip {
    align-self: flex-start;
  }

  .table-footer {
    justify-content: space-between;
    padding: 10px 14px;
  }

  .footer-total {
    font-size: 13px;
  }

  .edit-dialog-actions {
    padding: 10px 14px;
  }
}

@media (max-width: 380px) {
  .table-actions {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
