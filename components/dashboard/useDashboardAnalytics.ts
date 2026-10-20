import { computed, ref } from "vue";
import { collection, collectionGroup, getDocs, type Firestore } from "firebase/firestore";
import { useFirestore } from "vuefire";
import type { penawaranM, pengeluaranM } from "~/types/penawaranModel";
import type { invoiceM } from "~/types/invoice";
import type { purchaseorderM } from "~/types/purchaseorderModel";
import type { pettyCashM } from "~/types/pettyCashModel";
import type { customerM } from "~/types/customerModel";
import type { vendorM } from "~/types/vendorModel";
import type { leadsM } from "~/types/leadsModel";

export type DashboardQuotation = penawaranM & { id: string };
export type DashboardInvoice = invoiceM & { id: string };
export type DashboardPurchaseOrder = purchaseorderM & { id: string };
export type DashboardPettyCash = pettyCashM & { id: string };
export type DashboardExpense = {
  item: pengeluaranM;
  projectId: string;
  projectName: string;
  date: Date | null;
};

export type DashboardSource =
  | "penawaran"
  | "invoice"
  | "pettyCash"
  | "customer"
  | "vendor"
  | "leads"
  | "purchaseorder";

export type DashboardActivity = {
  id: string;
  title: string;
  description: string;
  type: string;
  icon: string;
  tone: string;
  href: string;
  amount: number | null;
  date: Date;
};

type DashboardSnapshot = {
  penawaran: DashboardQuotation[];
  invoice: DashboardInvoice[];
  pettyCash: DashboardPettyCash[];
  customer: (customerM & { id: string })[];
  vendor: (vendorM & { id: string })[];
  leads: (leadsM & { id: string })[];
  purchaseorder: DashboardPurchaseOrder[];
};

const emptySnapshot = (): DashboardSnapshot => ({
  penawaran: [],
  invoice: [],
  pettyCash: [],
  customer: [],
  vendor: [],
  leads: [],
  purchaseorder: [],
});

const sources: Exclude<DashboardSource, "purchaseorder">[] = [
  "penawaran",
  "invoice",
  "pettyCash",
  "customer",
  "vendor",
  "leads",
];

export function toDashboardDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const date = new Date(value < 1e12 ? value * 1000 : value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string") {
    const dayFirst = value.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
    const date = dayFirst
      ? new Date(Number(dayFirst[3]), Number(dayFirst[2]) - 1, Number(dayFirst[1]))
      : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "object") {
    const timestamp = value as { seconds?: number; toDate?: () => Date };
    if (typeof timestamp.toDate === "function") return toDashboardDate(timestamp.toDate());
    if (typeof timestamp.seconds === "number") return toDashboardDate(timestamp.seconds);
  }
  return null;
}

const number = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const inYear = (date: Date | null, year: number) => year === 0 || date?.getFullYear() === year;
const quotationDate = (item: DashboardQuotation) =>
  toDashboardDate(item.tanggal_penawaran) || toDashboardDate(item.created_at);
const invoiceDate = (item: DashboardInvoice) =>
  toDashboardDate(item.tanggal) || toDashboardDate(item.createdAt);
const paymentDate = (item: DashboardInvoice) =>
  toDashboardDate(item.tanggal_bayar) || toDashboardDate(item.selesaiAt) || invoiceDate(item);
const purchaseDate = (item: DashboardPurchaseOrder) =>
  toDashboardDate(item.tgl_purchaseorder) || toDashboardDate(item.createdAt);
const pettyDate = (item: DashboardPettyCash) =>
  toDashboardDate(item.tanggal) || toDashboardDate(item.createdAt);

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const decimalFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
export const formatDashboardMoney = (value: number | null) =>
  value === null ? "—" : rupiahFormatter.format(value);
export const formatDashboardCompactMoney = (value: number | null) => {
  if (value === null) return "—";
  const absolute = Math.abs(value);
  if (absolute >= 1e12) return `Rp ${decimalFormatter.format(value / 1e12)} T`;
  if (absolute >= 1e9) return `Rp ${decimalFormatter.format(value / 1e9)} M`;
  if (absolute >= 1e6) return `Rp ${decimalFormatter.format(value / 1e6)} jt`;
  return rupiahFormatter.format(value);
};
export const formatDashboardDate = (date: Date | null) =>
  date
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date)
    : "—";

async function fetchPurchaseOrders(db: Firestore, quotations: DashboardQuotation[]) {
  try {
    const snapshot = await getDocs(collectionGroup(db, "purchaseorder"));
    return {
      items: snapshot.docs
        .filter((item) => item.ref.parent.parent?.parent.id === "penawaran")
        .map((item) => ({
          ...(item.data() as purchaseorderM),
          id: item.id,
          id_penawaran: item.ref.parent.parent!.id,
        })),
      partial: false,
    };
  } catch {
    // Collection-group permissions vary by deployment; read each quotation's
    // own subcollection when the grouped query is unavailable.
    const items: DashboardPurchaseOrder[] = [];
    let partial = false;
    for (let offset = 0; offset < quotations.length; offset += 8) {
      const batch = quotations.slice(offset, offset + 8);
      const results = await Promise.allSettled(
        batch.map((quotation) =>
          getDocs(collection(db, "penawaran", quotation.id, "purchaseorder")),
        ),
      );
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          partial = true;
          return;
        }
        items.push(
          ...result.value.docs.map((item) => ({
            ...(item.data() as purchaseorderM),
            id: item.id,
            id_penawaran: batch[index]!.id,
          })),
        );
      });
    }
    return { items, partial };
  }
}

export function useDashboardAnalytics() {
  const db = useFirestore();
  const snapshot = ref<DashboardSnapshot>(emptySnapshot());
  const ready = ref(false);
  const loading = ref(false);
  const errors = ref<string[]>([]);
  const lastUpdated = ref<Date | null>(null);
  const selectedYear = ref(new Date().getFullYear());
  const available = ref<Record<DashboardSource, boolean>>({
    penawaran: false,
    invoice: false,
    pettyCash: false,
    customer: false,
    vendor: false,
    leads: false,
    purchaseorder: false,
  });

  async function refresh() {
    if (loading.value) return;
    loading.value = true;
    const next = emptySnapshot();
    const failed: string[] = [];
    const nextAvailable = { ...available.value };
    try {
      const results = await Promise.allSettled(
        sources.map((source) => getDocs(collection(db, source))),
      );
      results.forEach((result, index) => {
        const source = sources[index]!;
        nextAvailable[source] = result.status === "fulfilled";
        if (result.status === "rejected") {
          failed.push(source);
          console.error(`Dashboard gagal memuat ${source}:`, result.reason);
          return;
        }
        const rows = result.value.docs.map((item) => ({ ...item.data(), id: item.id }));
        if (source === "penawaran") next.penawaran = rows as DashboardQuotation[];
        else if (source === "invoice") next.invoice = rows as DashboardInvoice[];
        else if (source === "pettyCash") next.pettyCash = rows as DashboardPettyCash[];
        else if (source === "customer") next.customer = rows as DashboardSnapshot["customer"];
        else if (source === "vendor") next.vendor = rows as DashboardSnapshot["vendor"];
        else next.leads = rows as DashboardSnapshot["leads"];
      });

      if (nextAvailable.penawaran) {
        try {
          const purchaseOrders = await fetchPurchaseOrders(db, next.penawaran);
          next.purchaseorder = purchaseOrders.items;
          nextAvailable.purchaseorder = !purchaseOrders.partial;
          if (purchaseOrders.partial) failed.push("purchaseorder (sebagian)");
        } catch (error) {
          nextAvailable.purchaseorder = false;
          failed.push("purchaseorder");
          console.error("Dashboard gagal memuat purchase order:", error);
        }
      } else {
        nextAvailable.purchaseorder = false;
        failed.push("purchaseorder");
      }

      snapshot.value = next;
      available.value = nextAvailable;
      errors.value = failed;
      lastUpdated.value = new Date();

      if (!ready.value) {
        const actualYears = collectYears(next);
        if (!actualYears.includes(selectedYear.value) && actualYears.length) {
          selectedYear.value = actualYears[0]!;
        }
      }
      ready.value = true;
    } finally {
      loading.value = false;
    }
  }

  const years = computed(() =>
    [...new Set([new Date().getFullYear(), ...collectYears(snapshot.value)])].sort((a, b) => b - a),
  );
  const quotations = computed(() =>
    snapshot.value.penawaran.filter((item) => inYear(quotationDate(item), selectedYear.value)),
  );
  const invoices = computed(() =>
    snapshot.value.invoice.filter((item) => inYear(invoiceDate(item), selectedYear.value)),
  );
  const purchases = computed(() =>
    snapshot.value.purchaseorder.filter((item) => inYear(purchaseDate(item), selectedYear.value)),
  );
  const pettyCash = computed(() =>
    snapshot.value.pettyCash.filter((item) => inYear(pettyDate(item), selectedYear.value)),
  );
  const leads = computed(() =>
    snapshot.value.leads.filter((item) => inYear(toDashboardDate(item.createdAt), selectedYear.value)),
  );
  const expenses = computed<DashboardExpense[]>(() =>
    snapshot.value.penawaran.flatMap((quotation) =>
      (quotation.pengeluaran ?? []).map((item) => ({
        item,
        projectId: quotation.id,
        projectName: quotation.perihal || quotation.no_penawaran || quotation.id,
        date: toDashboardDate(item.tanggal_pengeluaran) || quotationDate(quotation),
      })),
    ).filter((expense) => inYear(expense.date, selectedYear.value)),
  );

  const summary = computed(() => {
    const quoteIdr = quotations.value.filter((item) => !item.currency || item.currency === "IDR");
    const poIdr = purchases.value.filter((item) => !item.currency || item.currency === "IDR");
    const paid = snapshot.value.invoice.filter(
      (item) => item.status === "Selesai" && inYear(paymentDate(item), selectedYear.value),
    );
    const sent = invoices.value.filter((item) => item.status === "Dikirim");
    const completedQuotationIds = new Set(invoices.value.map((item) => item.id_penawaran).filter(Boolean));
    return {
      quotationCount: quotations.value.length,
      quotationValue: quoteIdr.reduce((sum, item) => sum + number(item.grand_total_penawaran), 0),
      foreignQuotationCount: quotations.value.length - quoteIdr.length,
      invoiceCount: invoices.value.length,
      invoiceValue: invoices.value.reduce((sum, item) => sum + number(item.grandtotal_invoice), 0),
      paidCount: paid.length,
      paidValue: paid.reduce((sum, item) => sum + number(item.grandtotal_invoice), 0),
      sentCount: sent.length,
      sentValue: sent.reduce((sum, item) => sum + number(item.grandtotal_invoice), 0),
      expenseCount: expenses.value.length,
      expenseValue: expenses.value.reduce((sum, expense) => sum + number(expense.item.nominal), 0),
      purchaseCount: purchases.value.length,
      purchaseValue: poIdr.reduce((sum, item) => sum + number(item.grandtotal_purchaseorder), 0),
      foreignPurchaseCount: purchases.value.length - poIdr.length,
      pettyIn: pettyCash.value.filter((item) => item.type === "in").reduce((sum, item) => sum + number(item.amount), 0),
      pettyOut: pettyCash.value.filter((item) => item.type === "out").reduce((sum, item) => sum + number(item.amount), 0),
      pettyBalance: snapshot.value.pettyCash.reduce(
        (sum, item) => sum + (item.type === "in" ? 1 : -1) * number(item.amount),
        0,
      ),
      leadCount: leads.value.length,
      customerCount: snapshot.value.customer.length,
      vendorCount: snapshot.value.vendor.length,
      quotedProjectsWithInvoice: quotations.value.filter((item) => completedQuotationIds.has(item.id)).length,
    };
  });

  const monthly = computed(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, index) =>
      selectedYear.value === 0
        ? new Date(now.getFullYear(), now.getMonth() - 11 + index, 1)
        : new Date(selectedYear.value, index, 1),
    );
    const key = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const rows = months.map((date) => ({
      key: key(date),
      label: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date),
      invoice: 0,
      paid: 0,
      expense: 0,
    }));
    const byKey = new Map(rows.map((row) => [row.key, row]));
    snapshot.value.invoice.forEach((invoice) => {
      const issued = invoiceDate(invoice);
      if (issued) {
        const bucket = byKey.get(key(issued));
        if (bucket) bucket.invoice += number(invoice.grandtotal_invoice);
      }
      if (invoice.status === "Selesai") {
        const paidDate = paymentDate(invoice);
        if (paidDate) {
          const bucket = byKey.get(key(paidDate));
          if (bucket) bucket.paid += number(invoice.grandtotal_invoice);
        }
      }
    });
    snapshot.value.penawaran.forEach((quotation) => {
      (quotation.pengeluaran ?? []).forEach((expense) => {
        const date = toDashboardDate(expense.tanggal_pengeluaran) || quotationDate(quotation);
        if (date) {
          const bucket = byKey.get(key(date));
          if (bucket) bucket.expense += number(expense.nominal);
        }
      });
    });
    return rows;
  });

  const invoiceStatuses = computed(() => {
    const counts = { Draft: 0, Dikirim: 0, Selesai: 0, Lainnya: 0 };
    invoices.value.forEach((item) => {
      if (item.status === "Draft" || item.status === "Dikirim" || item.status === "Selesai") {
        counts[item.status]++;
      } else counts.Lainnya++;
    });
    return counts;
  });

  const clientRows = computed(() => {
    const grouped = new Map<string, { name: string; amount: number; count: number; paid: number }>();
    invoices.value.forEach((invoice) => {
      const name = invoice.nama_customer?.trim() || "Tanpa nama client";
      const key = invoice.id_customer || name.toLocaleLowerCase("id-ID");
      const row = grouped.get(key) ?? { name, amount: 0, count: 0, paid: 0 };
      row.amount += number(invoice.grandtotal_invoice);
      row.count++;
      if (invoice.status === "Selesai") row.paid++;
      grouped.set(key, row);
    });
    return [...grouped.values()].sort((a, b) => b.amount - a.amount).slice(0, 5);
  });

  const projectRows = computed(() => {
    const grouped = new Map<string, {
      id: string;
      name: string;
      client: string;
      invoiceValue: number;
      expenseValue: number;
      invoiceCount: number;
    }>();
    snapshot.value.penawaran.forEach((quotation) => {
      grouped.set(quotation.id, {
        id: quotation.id,
        name: quotation.perihal || quotation.no_penawaran || quotation.id,
        client: quotation.nama_perusahaan || "—",
        invoiceValue: 0,
        expenseValue: 0,
        invoiceCount: 0,
      });
    });
    invoices.value.forEach((invoice) => {
      const id = invoice.id_penawaran;
      if (!id) return;
      const row = grouped.get(id) ?? {
        id,
        name: invoice.perihal || invoice.no_penawaran || id,
        client: invoice.nama_customer || "—",
        invoiceValue: 0,
        expenseValue: 0,
        invoiceCount: 0,
      };
      row.invoiceValue += number(invoice.grandtotal_invoice);
      row.invoiceCount++;
      grouped.set(id, row);
    });
    expenses.value.forEach((expense) => {
      const row = grouped.get(expense.projectId);
      if (row) row.expenseValue += number(expense.item.nominal);
    });
    return [...grouped.values()]
      .filter((row) => row.invoiceValue > 0 || row.expenseValue > 0)
      .sort((a, b) => b.invoiceValue - a.invoiceValue || b.expenseValue - a.expenseValue)
      .slice(0, 6);
  });

  const invoiceCostSummary = computed(() => {
    const byProject = new Map<string, DashboardInvoice[]>();
    snapshot.value.invoice.forEach((invoice) => {
      if (!invoice.id_penawaran) return;
      const group = byProject.get(invoice.id_penawaran) ?? [];
      group.push(invoice);
      byProject.set(invoice.id_penawaran, group);
    });
    const costs = new Map<string, number>();
    let unassignedValue = 0;
    let unassignedCount = 0;
    expenses.value.forEach((expense) => {
      const projectInvoices = byProject.get(expense.projectId) ?? [];
      const invoice = expense.item.invoice_out
        ? projectInvoices.find((candidate) =>
            [candidate.id_invoice, candidate.id, candidate.no_inv].some(
              (identifier) => String(identifier || "") === expense.item.invoice_out,
            ),
          )
        : projectInvoices.length === 1 ? projectInvoices[0] : undefined;
      if (!invoice) {
        unassignedValue += number(expense.item.nominal);
        unassignedCount++;
        return;
      }
      costs.set(invoice.id, (costs.get(invoice.id) ?? 0) + number(expense.item.nominal));
    });
    const rows = invoices.value.map((invoice) => ({
      id: invoice.id,
      number: invoice.no_inv || invoice.id_invoice || invoice.id,
      client: invoice.nama_customer || "Client",
      status: invoice.status || "—",
      invoiceValue: number(invoice.grandtotal_invoice),
      expenseValue: costs.get(invoice.id) ?? 0,
    })).filter((row) => row.expenseValue > 0).sort((a, b) => b.expenseValue - a.expenseValue).slice(0, 6);
    return { rows, unassignedCount, unassignedValue };
  });

  const activities = computed<DashboardActivity[]>(() => {
    const rows: DashboardActivity[] = [];
    quotations.value.forEach((item) => {
      const date = quotationDate(item);
      if (!date) return;
      rows.push({
        id: `quotation-${item.id}`,
        title: item.no_penawaran || "Penawaran baru",
        description: item.nama_perusahaan || item.perihal || "Penawaran",
        type: "Penawaran",
        icon: "mdi-file-document-edit-outline",
        tone: "blue",
        href: `/admin/penawaran/${encodeURIComponent(item.id)}`,
        amount: item.currency === "IDR" || !item.currency ? number(item.grand_total_penawaran) : null,
        date,
      });
    });
    invoices.value.forEach((item) => {
      const date = invoiceDate(item);
      if (!date) return;
      rows.push({
        id: `invoice-${item.id}`,
        title: `Invoice #${item.no_inv || item.id}`,
        description: `${item.nama_customer || "Client"} · ${item.status || "Invoice"}`,
        type: "Invoice",
        icon: "mdi-receipt-text-outline",
        tone: "cyan",
        href: `/admin/invoice/${encodeURIComponent(item.id)}`,
        amount: number(item.grandtotal_invoice),
        date,
      });
    });
    expenses.value.forEach((expense) => {
      if (!expense.date) return;
      rows.push({
        id: `expense-${expense.projectId}-${expense.item.id_pengeluaran}`,
        title: expense.item.keterangan || "Pengeluaran proyek",
        description: expense.projectName,
        type: "Biaya proyek",
        icon: "mdi-cash-minus",
        tone: "orange",
        href: `/admin/penawaran/${encodeURIComponent(expense.projectId)}/pengeluaran`,
        amount: number(expense.item.nominal),
        date: expense.date,
      });
    });
    purchases.value.forEach((item) => {
      const date = purchaseDate(item);
      if (!date) return;
      rows.push({
        id: `po-${item.id}`,
        title: item.no_purchaseorder || "Purchase order",
        description: item.nama_vendor || item.perihal_purchaseorder || "Vendor",
        type: "PO vendor",
        icon: "mdi-truck-outline",
        tone: "violet",
        href: `/admin/penawaran/${encodeURIComponent(item.id_penawaran)}`,
        amount: item.currency === "IDR" || !item.currency ? number(item.grandtotal_purchaseorder) : null,
        date,
      });
    });
    pettyCash.value.forEach((item) => {
      const date = pettyDate(item);
      if (!date) return;
      rows.push({
        id: `cash-${item.id}`,
        title: item.keterangan || "Transaksi kas",
        description: item.type === "in" ? "Kas masuk" : "Kas keluar",
        type: "Keuangan kantor",
        icon: item.type === "in" ? "mdi-cash-plus" : "mdi-wallet-outline",
        tone: item.type === "in" ? "green" : "rose",
        href: "/admin/petty-cash",
        amount: number(item.amount),
        date,
      });
    });
    return rows.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
  });

  return {
    snapshot,
    ready,
    loading,
    errors,
    lastUpdated,
    selectedYear,
    years,
    available,
    refresh,
    quotations,
    invoices,
    purchases,
    expenses,
    summary,
    monthly,
    invoiceStatuses,
    clientRows,
    projectRows,
    invoiceCostSummary,
    activities,
  };
}

function collectYears(snapshot: DashboardSnapshot) {
  const dates = [
    ...snapshot.penawaran.map(quotationDate),
    ...snapshot.invoice.flatMap((item) => [invoiceDate(item), item.status === "Selesai" ? paymentDate(item) : null]),
    ...snapshot.purchaseorder.map(purchaseDate),
    ...snapshot.pettyCash.map(pettyDate),
    ...snapshot.leads.map((item) => toDashboardDate(item.createdAt)),
    ...snapshot.penawaran.flatMap((item) =>
      (item.pengeluaran ?? []).map((expense) => toDashboardDate(expense.tanggal_pengeluaran)),
    ),
  ];
  return [...new Set(dates.filter((date): date is Date => Boolean(date)).map((date) => date.getFullYear()))]
    .sort((a, b) => b - a);
}
