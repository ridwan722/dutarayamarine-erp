<template>
  <div class="invoice-canvas">
    <div class="preview-container d-flex justify-center">
      <div ref="printArea" class="invoice-paper-wrapper">
        <v-btn
          class="no-print text-center mx-auto mb-3"
          size="x-small"
          color="primary"
          prepend-icon="mdi-translate-variant"
          block
          @click="invoiceLanguage = invoiceLanguage === 'en' ? 'id' : 'en'"
        >
          {{ invoiceLanguage === "en" ? "English" : "Indonesia" }}
        </v-btn>

        <v-card width="850" class="pa-10 invoice-paper elevation-2">
          <div class="letterhead">
            <div class="header-section">
              <div class="logo-wrapper">
                <img src="/logokopsurat.png" alt="Logo Header" />
              </div>

              <div class="letterhead-info">
                <h1 class="company-name">PT. DUTA RAYA MARINE</h1>
                <p class="address-line">
                  Ruko Dreamland H3 No. 05, Tanjung Riau,<br />
                  Sekupang, Kota Batam, Kepulauan Riau.<br />
                  <v-divider
                    class="mx-auto"
                    style="max-width: 60%"
                    opacity="50"
                  />
                  Jl. Raya Pasar Minggu No. 15A, Jakarta Selatan.
                  <v-divider
                    class="mx-auto"
                    style="max-width: 60%"
                    opacity="50"
                  />
                </p>
                <p class="phone-line">
                  E-mail: sales@dutarayamarine.com, Phone/WhatsApp :
                  +62823-8450-3953<br />
                  Website: www.dutarayamarine.com
                </p>
              </div>

              <div class="header-spacer" aria-hidden="true" />
            </div>

            <div class="header-divider">
              <div class="accent-bar" />
              <div class="secondary-bar" />
            </div>
          </div>

          <div class="text-center my-3 font-weight-bold">
            <span class="font-weight-bold" style="font-size: 23px">
              INVOICE
            </span>
          </div>

          <div class="info-grid mb-4">
            <div class="info-box-left">
              <table class="w-100">
                <tbody>
                  <tr>
                    <td style="vertical-align: top">
                      {{ invoiceLanguage === "id" ? "Perihal" : "Subject" }}
                    </td>
                    <td style="vertical-align: top">:</td>
                    <td style="vertical-align: top">
                      {{ invoiceDetail.perihal }}
                    </td>
                  </tr>
                  <tr>
                    <td width="80">
                      {{ invoiceLanguage === "id" ? "Pelanggan" : "Customer" }}
                    </td>
                    <td width="10">:</td>
                    <td>{{ invoiceDetail.nama_customer }}</td>
                  </tr>
                  <tr>
                    <td style="vertical-align: top">
                      {{ invoiceLanguage === "id" ? "Alamat" : "Address" }}
                    </td>
                    <td style="vertical-align: top">:</td>
                    <td style="vertical-align: top">
                      {{ invoiceDetail.alamat_customer }}
                    </td>
                  </tr>
                  <tr>
                    <td width="80">
                      {{ invoiceLanguage === "id" ? "PIC" : "Attn" }}
                    </td>
                    <td width="10">:</td>
                    <td>{{ invoiceDetail.pic }}</td>
                  </tr>
                  <tr>
                    <td width="80">
                      {{ invoiceLanguage === "id" ? "Kapal" : "Vessel" }}
                    </td>
                    <td width="10">:</td>
                    <td>{{ invoiceDetail.vessel }}</td>
                  </tr>
                  <tr>
                    <td width="80">
                      {{ invoiceLanguage === "id" ? "Lokasi" : "Location" }}
                    </td>
                    <td width="10">:</td>
                    <td>{{ invoiceDetail.location }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="info-box-right">
              <table class="w-100">
                <tbody>
                  <tr>
                    <td width="110">
                      {{
                        invoiceLanguage === "id"
                          ? "No. Penawaran"
                          : "Quotation No."
                      }}
                    </td>
                    <td width="10">:</td>
                    <td>{{ invoiceDetail.no_penawaran }}</td>
                  </tr>
                  <tr>
                    <td width="110">
                      {{
                        invoiceLanguage === "id"
                          ? "Tanggal Penawaran"
                          : "Quotation Date"
                      }}
                    </td>
                    <td width="10">:</td>
                    <td>{{ formatTanggal(invoiceDetail.tanggal_penawaran!) }}</td>
                  </tr>
                  <tr>
                    <td width="110">
                      {{ invoiceLanguage === "id" ? "No. PO" : "PO No." }}
                    </td>
                    <td width="10">:</td>
                    <td>{{ invoiceDetail.no_preorder }}</td>
                  </tr>
                  <tr>
                    <td width="110">
                      {{ invoiceLanguage === "id" ? "Tanggal PO" : "PO Date" }}
                    </td>
                    <td width="10">:</td>
                    <td>{{ formatTanggal(invoiceDetail.tanggal_preorder!) }}</td>
                  </tr>
                  <tr>
                    <td width="110">
                      {{
                        invoiceLanguage === "id" ? "No. Invoice" : "Invoice No."
                      }}
                    </td>
                    <td width="10">:</td>
                    <td>INV/DRM/{{ invoiceYear }}/{{ invoiceDetail.no_inv }}</td>
                  </tr>
                  <tr>
                    <td>
                      {{
                        invoiceLanguage === "id"
                          ? "Tanggal Invoice"
                          : "Invoice Date"
                      }}
                    </td>
                    <td>:</td>
                    <td>{{ formatTanggal(invoiceDetail.tanggal) }}</td>
                  </tr>
                  <tr>
                    <td>
                      {{ invoiceLanguage === "id" ? "Mata Uang" : "Currency" }}
                    </td>
                    <td>:</td>
                    <td>{{ invoiceCurrencyDescription }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <table class="main-table">
            <thead>
              <tr>
                <th width="3%">NO.</th>
                <th width="47%">
                  {{ invoiceLanguage === "id" ? "DESKRIPSI" : "DESCRIPTION" }}
                </th>
                <th width="5%">{{ invoiceLanguage === "id" ? "JUMLAH" : "QTY" }}</th>
                <th width="5%">
                  {{ invoiceLanguage === "id" ? "SATUAN" : "UOM" }}
                </th>
                <th width="35%">
                  {{ invoiceLanguage === "id" ? "JUMLAH" : "AMOUNT" }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(item, index) in invoiceDetail.item_pekerjaan"
                :key="index"
              >
                <td class="no-cell v-align-middle">
                  <div class="text-center">{{ index + 1 }}.</div>
                </td>
                <td class="desc-cell">
                  <span
                    v-for="(line, lineIndex) in item.nama.split(/\r?\n/)"
                    :key="lineIndex"
                    class="description-line"
                  >
                    {{ line }}
                  </span>
                </td>
                <td class="qty-cell v-align-middle text-center">
                  {{ item.qty }}
                </td>
                <td class="qty-cell v-align-middle text-center">
                  {{ item.uom }}
                </td>
                <td class="amount-cell v-align-middle">
                  <div class="d-flex justify-space-between align-center">
                    <span>{{ invoiceCurrencyPrefix }}</span>
                    <span>{{ formatInvoiceNumber(item.amount) }}</span>
                  </div>
                </td>
              </tr>

              <tr v-if="showSubtotalRow">
                <td /><td /><td />
                <td class="footer-label">Total</td>
                <td class="footer-value">
                  <div class="d-flex justify-space-between">
                    <span>{{ invoiceCurrencyPrefix }}</span>
                    <span>{{ formatInvoiceNumber(invoiceDetail.subtotal_invoice) }}</span>
                  </div>
                </td>
              </tr>

              <tr v-if="showDiscountRow">
                <td /><td /><td />
                <td class="footer-label">Discount</td>
                <td class="footer-value">
                  <div class="d-flex justify-space-between font-italic">
                    <span>{{ invoiceCurrencyPrefix }}</span>
                    <span>{{ formatInvoiceNumber(invoiceDetail.discount_invoice) }}</span>
                  </div>
                </td>
              </tr>

              <tr v-if="invoiceAmountLabel === 'Balance' && previousBilledSubtotal > 0">
                <td /><td /><td />
                <td class="footer-label">DP {{ previousDpPercent }}%</td>
                <td class="footer-value">
                  <div class="d-flex justify-space-between">
                    <span>{{ invoiceCurrencyPrefix }}</span>
                    <span>{{ formatInvoiceNumber(previousBilledSubtotal) }}</span>
                  </div>
                </td>
              </tr>

              <tr v-if="invoiceDetail.pakai_ppn === true">
                <td /><td /><td />
                <td class="footer-label">
                  <strong>{{ invoiceLanguage === "id" ? "PPN 11%" : "VAT 11%" }}</strong>
                </td>
                <td class="footer-value">
                  <div class="d-flex justify-space-between">
                    <span>{{ invoiceCurrencyPrefix }}</span>
                    <span>{{ formatInvoiceNumber(invoiceDetail.ppn) }}</span>
                  </div>
                </td>
              </tr>

              <tr v-if="showGrandTotalRow">
                <td /><td /><td />
                <td class="footer-label">
                  <strong>
                    {{ invoiceAmountLabel }}
                    <template v-if="invoiceAmountLabel === 'Balance'">
                      {{ balancePercent }}%
                    </template>
                    <template v-else-if="invoiceAmountLabel === 'Down Payment'">
                      {{ invoiceDetail.dp_persen }}%
                    </template>
                  </strong>
                </td>
                <td class="footer-value">
                  <div class="d-flex justify-space-between">
                    <span>{{ invoiceCurrencyPrefix }}</span>
                    <strong>{{
                      formatInvoiceNumber(invoiceDetail.grandtotal_invoice)
                    }}</strong>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="terbilang-strip">
            <span v-if="invoiceLanguage === 'id'">
              Terbilang: # {{ jadirupiah(invoiceDetail.grandtotal_invoice) }}
              {{ invoiceCurrencyName }}.
            </span>
            <span v-else>
              Amount in words: #
              {{ numberToWordsEnglish(invoiceDetail.grandtotal_invoice) }}
              {{ invoiceCurrencyName }}.
            </span>
          </div>

          <table v-if="invoiceDetail.termCondition?.length" class="w-100">
            <tbody>
              <tr>
                <td class="remark-cell">
                  <div class="remark-border-box">
                    <strong class="text-body-2 font-weight-bold">
                      {{
                        invoiceLanguage === "id"
                          ? "SYARAT & KETENTUAN :"
                          : "TERMS & CONDITIONS :"
                      }}
                    </strong>
                    <ul class="remark-list-style">
                      <li
                        v-for="(item, index) in invoiceDetail.termCondition"
                        :key="index"
                      >
                        {{ index + 1 }}. {{ item.nama_term }}
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="d-flex justify-space-between mt-6 page-break-section">
            <div class="bank-details">
              <table class="bank-table">
                <tbody>
                  <tr>
                    <td>{{ invoiceLanguage === "id" ? "NAMA BANK" : "BANK NAME" }}</td>
                    <td>:</td>
                    <td
                      class="editable-display-value"
                      contenteditable="true"
                      spellcheck="false"
                      aria-label="Ubah tampilan nama bank"
                      @keydown.enter.prevent="blurEditableDisplay"
                    >{{ bankAccount.bankName }}</td>
                  </tr>
                  <tr>
                    <td>
                      {{
                        invoiceLanguage === "id"
                          ? "NOMOR REKENING"
                          : "ACCOUNT NUMBER"
                      }}
                    </td>
                    <td>:</td>
                    <td
                      :class="{ 'editable-display-value': bankAccount.accountEditable }"
                      :contenteditable="bankAccount.accountEditable"
                      spellcheck="false"
                      aria-label="Ubah tampilan nomor rekening"
                      @keydown.enter.prevent="blurEditableDisplay"
                    >{{ bankAccount.accountNumber }}</td>
                  </tr>
                  <tr>
                    <td>
                      {{
                        invoiceLanguage === "id"
                          ? "ATAS NAMA"
                          : "BENEFICIARY NAME"
                      }}
                    </td>
                    <td>:</td>
                    <td
                      class="editable-display-value"
                      contenteditable="true"
                      spellcheck="false"
                      aria-label="Ubah tampilan nama penerima"
                      @keydown.enter.prevent="blurEditableDisplay"
                    >{{ bankAccount.beneficiary }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="mt-8 signature-area">
            <span class="font-italic">
              {{ invoiceLanguage === "id" ? "Hormat kami," : "Yours sincerely," }}
            </span>
            <br />
            <strong>PT. DUTA RAYA MARINE</strong>

            <v-img
              v-if="signatureImage"
              :src="signatureImage"
              :alt="`Tanda tangan ${signatureName}`"
              width="150"
              :class="{ 'ml-3': invoiceDetail.sign_by !== 'Seilla Maryana' }"
            />
            <div
              v-else
              class="ml-3 mt-5 mb-8 font-italic text-grey-lighten-1 text-caption"
            >
              No Signature Required
            </div>

            <strong>{{ signatureName }}</strong>
          </div>
        </v-card>
      </div>
    </div>

    <div class="document-actions d-flex flex-wrap justify-center ga-3 mt-4 no-print">
      <v-btn
        prepend-icon="mdi-printer"
        color="indigo"
        variant="elevated"
        @click="printInvoice"
      >
        Print Invoice
      </v-btn>
      <v-btn
        prepend-icon="mdi-file-pdf-box"
        color="red-darken-1"
        variant="elevated"
        :loading="isSavingPdf"
        @click="handleSavePdf"
      >
        Save PDF Invoice
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { invoiceCurrencyM, invoiceM } from "~/types/invoice";

const props = withDefaults(
  defineProps<{
    invoiceDetail: invoiceM;
    quotationGrandTotal?: number;
    relatedInvoices?: invoiceM[];
  }>(),
  {
    quotationGrandTotal: 0,
    relatedInvoices: () => [],
  },
);

const invoiceLanguage = ref<"id" | "en">("en");
const isSavingPdf = ref(false);
const printArea = ref<HTMLElement | null>(null);

const invoiceYear = computed(() => props.invoiceDetail.tanggal?.slice(0, 4));
const invoiceCurrency = computed<invoiceCurrencyM>(() => {
  const currency = props.invoiceDetail.currency_inv;
  return currency === "USD" || currency === "SGD" ? currency : "IDR";
});
const invoiceCurrencyPrefix = computed(() =>
  invoiceCurrency.value === "IDR" ? "Rp" : invoiceCurrency.value,
);
const invoiceCurrencyName = computed(() => {
  if (invoiceCurrency.value === "USD") {
    return invoiceLanguage.value === "id"
      ? "Dolar Amerika Serikat"
      : "US Dollars";
  }
  if (invoiceCurrency.value === "SGD") {
    return invoiceLanguage.value === "id"
      ? "Dolar Singapura"
      : "Singapore Dollars";
  }
  return invoiceLanguage.value === "id" ? "Rupiah" : "Rupiah";
});
const invoiceCurrencyDescription = computed(
  () => `${invoiceCurrency.value} – (${invoiceCurrencyName.value})`,
);

const formatTanggal = (tanggal?: string) => {
  if (!tanggal) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(new Date(tanggal))
    .replace(/\//g, "-");
};

function formatInvoiceNumber(value?: number) {
  const fractionDigits = invoiceCurrency.value === "IDR" ? 0 : 2;
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number(value) || 0);
}

function numberToWordsEnglish(value: number): string {
  const number = Math.floor(Math.abs(value || 0));
  const units = [
    "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
    "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Fourty", "Fifty", "Sixty", "Seventy",
    "Eighty", "Ninety",
  ];

  function convert(n: number): string {
    if (n < 20) return units[n];
    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 ? ` ${units[n % 10]}` : "");
    }
    if (n < 1000) {
      return `${units[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${convert(n % 100)}` : ""}`;
    }
    const scales = [
      [1_000_000_000, "Billion"],
      [1_000_000, "Million"],
      [1000, "Thousand"],
    ] as const;
    for (const [scale, name] of scales) {
      if (n >= scale) {
        return `${convert(Math.floor(n / scale))} ${name}${n % scale ? ` ${convert(n % scale)}` : ""}`;
      }
    }
    return "";
  }

  return `${value < 0 ? "Minus " : ""}${convert(number)}`;
}

const billedSubtotal = (invoice: invoiceM) => {
  const subtotal = Math.max(
    0,
    Number(invoice.subtotal_invoice || 0) - Number(invoice.discount_invoice || 0),
  );
  return invoice.down_payment
    ? subtotal * (Number(invoice.dp_persen || 0) / 100)
    : subtotal;
};

const previousBilledSubtotal = computed(() => {
  const currentId = props.invoiceDetail.id || props.invoiceDetail.id_invoice;
  const invoicesInOrder = [...props.relatedInvoices].sort(
    (a, b) =>
      Number(a.createdAt || 0) - Number(b.createdAt || 0) ||
      Number(a.no_inv || 0) - Number(b.no_inv || 0),
  );
  const currentIndex = invoicesInOrder.findIndex(
    (invoice) => (invoice.id || invoice.id_invoice) === currentId,
  );
  if (currentIndex <= 0) return 0;
  return invoicesInOrder
    .slice(0, currentIndex)
    .reduce((total, invoice) => total + billedSubtotal(invoice), 0);
});

const invoiceBaseTotal = computed(() =>
  Math.max(
    0,
    Number(props.invoiceDetail.subtotal_invoice || 0) -
      Number(props.invoiceDetail.discount_invoice || 0),
  ),
);
const invoiceReferenceTotal = computed(
  () => props.quotationGrandTotal || invoiceBaseTotal.value,
);
const previousDpPercent = computed(() =>
  invoiceReferenceTotal.value > 0
    ? Math.round(
        (previousBilledSubtotal.value / invoiceReferenceTotal.value) * 10000,
      ) / 100
    : 0,
);
const balancePercent = computed(() =>
  Math.max(0, Math.round((100 - previousDpPercent.value) * 100) / 100),
);
const invoiceAmountLabel = computed(() => {
  const quotationTotal = invoiceReferenceTotal.value;
  const currentAmount = billedSubtotal(props.invoiceDetail);
  const isSingleFullInvoice =
    props.relatedInvoices.length === 1 &&
    quotationTotal > 0 &&
    Math.abs(currentAmount - quotationTotal) < 1;

  if (isSingleFullInvoice) return "Grand Total";
  if (
    previousBilledSubtotal.value > 0 &&
    quotationTotal > 0 &&
    previousBilledSubtotal.value + currentAmount >= quotationTotal - 1
  ) {
    return "Balance";
  }
  return "Down Payment";
});

const showSubtotalRow = computed(
  () =>
    props.invoiceDetail.dp_persen > 0 ||
    invoiceAmountLabel.value !== "Down Payment" ||
    props.invoiceDetail.pakai_ppn ||
    Number(props.invoiceDetail.discount_invoice) > 0,
);
const showDiscountRow = computed(
  () =>
    (props.invoiceDetail.dp_persen > 0 &&
      invoiceAmountLabel.value !== "Down Payment" &&
      props.invoiceDetail.pakai_ppn) ||
    Number(props.invoiceDetail.discount_invoice) > 0,
);
const showGrandTotalRow = computed(
  () =>
    props.invoiceDetail.dp_persen > 0 ||
    invoiceAmountLabel.value !== "Down Payment",
);

const bankAccount = computed(() => {
  const accounts = {
    Lilis: {
      bankName: "BCA",
      accountNumber: "2671 6250 74",
      beneficiary: "Lilis Trisnawati",
      accountEditable: true,
    },
    "Seilla Maryana": {
      bankName: "BCA",
      accountNumber: "8551 0635 77",
      beneficiary: "Seilla Maryana",
      accountEditable: false,
    },
    "Leo Adiatmaja Sembiring": {
      bankName: "BCA",
      accountNumber: "8550 7530 23",
      beneficiary: "Leo Adiatmaja Sembiring",
      accountEditable: false,
    },
    "Muhammad Ridwan": {
      bankName: "BCA",
      accountNumber: "8691 8096 92",
      beneficiary: "Muhammad Ridwan",
      accountEditable: false,
    },
  } as const;

  return (
    accounts[props.invoiceDetail.sign_by as keyof typeof accounts] ||
    accounts.Lilis
  );
});

const signatureImage = computed(() => {
  const images: Record<string, string> = {
    "Seilla Maryana": "/ttd_seilla.png",
    "Leo Adiatmaja Sembiring": "/ttd_leo.png",
    "Muhammad Ridwan": "/ttd_ridwan.png",
  };
  return images[props.invoiceDetail.sign_by || ""] || "";
});
const signatureName = computed(() => props.invoiceDetail.sign_by || "Lilis");

function blurEditableDisplay(event: KeyboardEvent) {
  (event.currentTarget as HTMLElement | null)?.blur();
}

function printInvoice() {
  const content = printArea.value?.querySelector<HTMLElement>(".invoice-paper");
  if (!content) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const styles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]'),
  )
    .map((style) => style.outerHTML)
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>Invoice</title>
        ${styles}
        <style>
          body { background: white !important; margin: 0; padding: 0; }
          .invoice-paper {
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          @page { margin: 0.5cm; }
          .page-break-section { page-break-inside: avoid; break-inside: avoid; }
        </style>
      </head>
      <body>
        ${content.outerHTML}
        <script>
          window.onload = () => { window.print(); window.close(); };
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

const findSafeCanvasBreak = (
  canvas: HTMLCanvasElement,
  sourceY: number,
  preferredY: number,
  canvasScale: number,
) => {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || preferredY >= canvas.height) return preferredY;

  // Only inspect a small band before the regular page boundary. Vertical
  // table borders are present on every row, so a relative ink threshold is
  // used instead of requiring a completely white row.
  const searchDistance = Math.max(1, Math.round(72 * canvasScale));
  const searchTop = Math.max(
    sourceY + Math.round(12 * canvasScale),
    preferredY - searchDistance,
  );
  const bandHeight = preferredY - searchTop;
  if (bandHeight <= 0) return preferredY;

  const pixels = context.getImageData(
    0,
    searchTop,
    canvas.width,
    bandHeight,
  ).data;
  const inkPerRow = new Array<number>(bandHeight).fill(0);

  for (let row = 0; row < bandHeight; row++) {
    const rowOffset = row * canvas.width * 4;
    let ink = 0;
    for (let column = 0; column < canvas.width; column++) {
      const pixelOffset = rowOffset + column * 4;
      if (
        pixels[pixelOffset + 3] > 16 &&
        (pixels[pixelOffset] < 245 ||
          pixels[pixelOffset + 1] < 245 ||
          pixels[pixelOffset + 2] < 245)
      ) {
        ink++;
      }
    }
    inkPerRow[row] = ink;
  }

  const sortedInk = [...inkPerRow].sort((first, second) => first - second);
  const baselineInk = sortedInk[Math.floor(sortedInk.length * 0.2)] || 0;
  const quietThreshold = baselineInk + Math.max(4, canvas.width * 0.004);
  const minimumGapHeight = Math.max(2, Math.round(canvasScale * 1.5));
  let quietRunEnd = -1;
  let quietRunLength = 0;
  let currentRunLength = 0;

  for (let row = 0; row < bandHeight; row++) {
    if (inkPerRow[row] <= quietThreshold) {
      currentRunLength++;
      if (currentRunLength >= minimumGapHeight) {
        quietRunEnd = row;
        quietRunLength = currentRunLength;
      }
    } else {
      currentRunLength = 0;
    }
  }

  if (quietRunEnd < 0) return preferredY;

  return Math.round(
    searchTop + quietRunEnd - Math.min(quietRunLength, minimumGapHeight) / 2,
  );
};

const handleSavePdf = async () => {
  const targetElement =
    printArea.value?.querySelector<HTMLElement>(".invoice-paper");
  if (!targetElement || isSavingPdf.value) return;

  isSavingPdf.value = true;
  const previewContainer = targetElement.closest<HTMLElement>(
    ".penawaran-content",
  );
  previewContainer?.classList.add("invoice-pdf-unscaled");
  void targetElement.offsetHeight;

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    await document.fonts?.ready;
    await Promise.all(
      Array.from(targetElement.querySelectorAll("img")).map(async (image) => {
        if (!image.complete) {
          await new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          });
        }
        await image.decode?.().catch(() => undefined);
      }),
    );

    const targetRect = targetElement.getBoundingClientRect();
    const isSmallViewport = window.matchMedia("(max-width: 600px)").matches;
    const requestedScale = isSmallViewport ? 3 : 4;
    const maxCanvasPixels = isSmallViewport ? 36_000_000 : 64_000_000;
    const safeScale = Math.sqrt(
      maxCanvasPixels / (targetRect.width * targetRect.height),
    );
    const captureScale = Math.max(1, Math.min(requestedScale, safeScale));

    const canvas = await html2canvas(targetElement, {
      scale: captureScale,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (_clonedDocument, clonedTarget) => {
        clonedTarget.querySelectorAll(".editable-display-value").forEach(
          (element) => {
            const htmlElement = element as HTMLElement;
            htmlElement.style.background = "transparent";
            htmlElement.style.boxShadow = "none";
          },
        );
      },
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
      precision: 4,
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginTop = 8;
    const marginBottom = 8;
    const printableHeight = pageHeight - marginTop - marginBottom;
    const pixelsPerMm = canvas.width / pageWidth;
    const pageSliceHeight = Math.floor(printableHeight * pixelsPerMm);
    const canvasScale = canvas.width / targetRect.width;
    const keepTogetherRanges: Array<{ top: number; bottom: number }> = [];

    targetElement
      .querySelectorAll(
        ".main-table tr, .terbilang-strip, .remark-border-box, .page-break-section, .signature-area",
      )
      .forEach((element) => {
        const rect = element.getBoundingClientRect();
        const range = {
          top: Math.max(
            0,
            Math.floor((rect.top - targetRect.top) * canvasScale) - 2,
          ),
          bottom: Math.min(
            canvas.height,
            Math.ceil((rect.bottom - targetRect.top) * canvasScale) + 2,
          ),
        };
        const rangeHeight = range.bottom - range.top;
        const maxProtectedHeight = element.matches(".main-table tr")
          ? pageSliceHeight * 0.35
          : pageSliceHeight;

        // Short rows stay intact. A very tall description row must be allowed
        // to continue on the next page; moving the whole row previously left
        // most of page one blank (as seen in INV-DRM-2026-00001.pdf).
        if (rangeHeight <= maxProtectedHeight) {
          keepTogetherRanges.push(range);
        }
      });

    keepTogetherRanges.sort((first, second) => first.top - second.top);

    let sourceY = 0;
    let pageIndex = 0;
    while (sourceY < canvas.height) {
      if (pageIndex > 0) pdf.addPage();

      let targetY = Math.min(sourceY + pageSliceHeight, canvas.height);
      const crossingRanges = keepTogetherRanges.filter(
        (range) =>
          range.top > sourceY &&
          range.top < targetY &&
          range.bottom > targetY,
      );

      if (crossingRanges.length) {
        targetY = Math.min(...crossingRanges.map((range) => range.top));
      } else {
        targetY = findSafeCanvasBreak(
          canvas,
          sourceY,
          targetY,
          canvasScale,
        );
      }

      const sliceHeight = targetY - sourceY;
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const context = pageCanvas.getContext("2d");
      if (context) context.imageSmoothingEnabled = false;
      context?.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight,
      );

      const imageData = pageCanvas.toDataURL("image/png");
      pdf.addImage(
        imageData,
        "PNG",
        0,
        marginTop,
        pageWidth,
        sliceHeight / pixelsPerMm,
        `invoice-page-${pageIndex}`,
        "SLOW",
      );

      sourceY = targetY;
      pageIndex++;
    }

    const year =
      props.invoiceDetail.tanggal?.slice(0, 4) || new Date().getFullYear();
    const invoiceId =
      props.invoiceDetail.id ||
      props.invoiceDetail.id_invoice ||
      props.invoiceDetail.no_inv;
    pdf.save(`INV-DRM-${year}-${invoiceId}.pdf`);
  } catch (error) {
    console.error("Gagal menyimpan PDF invoice:", error);
    useNotificationStore().showError("Gagal menyimpan PDF invoice");
  } finally {
    previewContainer?.classList.remove("invoice-pdf-unscaled");
    isSavingPdf.value = false;
  }
};
</script>

<style scoped>
.invoice-canvas {
  width: 100%;
}

:global(.penawaran-content.invoice-pdf-unscaled) {
  transform: none !important;
}

.invoice-paper-wrapper {
  width: 850px;
  max-width: 100%;
}

.invoice-paper {
  font-family: Arial, sans-serif;
  color: #000;
  line-height: 1.3;
}

.header-section {
  display: grid;
  grid-template-columns: 130px minmax(0, 1fr) 130px;
  align-items: center;
  position: relative;
  z-index: 1;
  padding: 2px 0 8px;
}

.logo-wrapper img {
  width: 205px;
  height: auto;
}

.letterhead-info {
  text-align: center;
}

.company-name {
  margin: 0;
  color: #0f2b48;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0.3px;
  line-height: 1.2;
}

.address-line,
.phone-line {
  margin: 1px 0 0;
  font-size: 11.5px;
  line-height: 1.4;
}

.header-divider {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 6px;
  margin-bottom: 6px;
}

.accent-bar {
  width: 100%;
  height: 4px;
  border-radius: 2px;
}

.secondary-bar {
  width: 100%;
  height: 2px;
  background-color: #032752;
}

.info-grid {
  display: flex;
  border: 1px solid #000;
}

.info-box-left,
.info-box-right {
  padding: 10px;
  font-size: 14px;
}

.info-box-left {
  width: 55%;
}

.info-box-right {
  width: 45%;
  border-left: 1px solid #000;
}

.main-table {
  width: 100%;
  margin-bottom: 15px;
  border-top: 1px solid #000;
  border-left: 1px solid #000;
  border-spacing: 0;
  border-collapse: separate;
}

.main-table th,
.main-table td {
  box-sizing: border-box;
  border: 0;
  border-right: 1px solid #000;
  border-bottom: 1px solid #000;
}

.main-table th {
  padding: 8px;
  background-color: #b8cce4 !important;
  font-size: 13px;
  font-weight: bold;
}

.main-table td {
  padding: 6px;
  font-size: 14px;
}

.desc-cell {
  padding: 8px !important;
}

.description-line {
  display: block;
  break-inside: avoid;
  page-break-inside: avoid;
}

.qty-cell {
  width: 15%;
}

.no-cell {
  width: 5%;
}

.amount-cell {
  width: 125%;
  padding-right: 5px !important;
  padding-left: 5px !important;
}

.v-align-middle {
  vertical-align: middle !important;
}

.footer-label {
  width: 15%;
  padding-right: 10px !important;
  white-space: nowrap;
}

.footer-value {
  width: 20%;
}

.terbilang-strip {
  margin: 15px 0;
  padding: 5px 10px;
  border-top: 2px solid #000;
  border-bottom: 2px solid #000;
  font-size: 14px;
  font-style: italic;
}

.remark-border-box {
  min-height: 80px;
  height: auto;
  padding: 8px;
  border: 1px solid #000;
}

.remark-list-style {
  margin: 5px 0 0;
  padding-left: 0;
  list-style: none;
  font-size: 12px;
}

.bank-details,
.signature-area {
  font-size: 14px;
}

.bank-table {
  border-collapse: collapse;
  font-size: 14px;
}

.bank-table td {
  padding: 0 4px 0 0 !important;
  border: 0 !important;
  line-height: 1.4;
  vertical-align: top;
}

.bank-table td:first-child {
  width: 160px;
}

.editable-display-value {
  border-radius: 2px;
  cursor: text;
  outline: none;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
}

.editable-display-value:hover {
  background: #f3f6f9;
}

.editable-display-value:focus {
  background: #eef4fa;
  box-shadow: inset 0 -1px 0 #6d91b3;
}

.page-break-section,
.remark-border-box,
.terbilang-strip {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}

@media print {
  .no-print {
    display: none !important;
  }

  .editable-display-value {
    background: transparent !important;
    box-shadow: none !important;
  }

  .main-table th {
    background-color: #b8cce4 !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>
