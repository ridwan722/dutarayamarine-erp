<template>
  <div class="soa-canvas">
    <div class="soa-preview-container" :style="{ zoom: previewZoom }">
      <div ref="printArea" class="soa-paper-wrapper">
        <article class="soa-paper">
          <header class="letterhead">
            <div class="header-section">
              <div class="logo-wrapper">
                <img src="/logokopsurat.png" alt="Logo PT. Duta Raya Marine" />
              </div>

              <div class="letterhead-info">
                <h2 class="company-name">PT. DUTA RAYA MARINE</h2>
                <p class="address-line">
                  Ruko Dreamland H3 No. 05, Tanjung Riau,<br />
                  Sekupang, Kota Batam, Kepulauan Riau.<br />
                  <v-divider class="mx-auto" style="max-width: 35%" opacity="50" />
                  Jl. Raya Pasar Minggu No. 15A, Jakarta Selatan.
                  <v-divider class="mx-auto" style="max-width: 35%" opacity="50" />
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
          </header>

          <h1 class="soa-title">STATEMENT OF ACCOUNT</h1>

          <div class="soa-metadata">
            <table class="metadata-table metadata-table-left">
              <tbody>
                <tr>
                  <th>To</th>
                  <td>:</td>
                  <td>{{ (soaDetail.nama_customer || "—").toUpperCase() }}</td>
                </tr>
                <tr>
                  <th>Attn</th>
                  <td>:</td>
                  <td>{{ soaDetail.attn || "Account / Finance Dept" }}</td>
                </tr>
              </tbody>
            </table>

            <table class="metadata-table metadata-table-right">
              <tbody>
                <tr>
                  <th>Date of Issue</th>
                  <td>:</td>
                  <td>{{ formatLongDate(soaDetail.tanggal_soa) }}</td>
                </tr>
                <tr>
                  <th>Currency</th>
                  <td>:</td>
                  <td>{{ soaDetail.currency || "IDR" }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <table class="soa-table">
            <colgroup>
              <col class="col-no" />
              <col class="col-date" />
              <col class="col-invoice" />
              <col class="col-perihal" />
              <col class="col-project" />
              <col class="col-debit" />
              <col class="col-balance" />
              <col class="col-remark" />
            </colgroup>
            <thead>
              <tr>
                <th>No</th>
                <th>Inv Date</th>
                <th>Inv Number</th>
                <th>Description</th>
                <th>Project Name</th>
                <th>Debit ({{ soaDetail.currency || "IDR" }})</th>
                <th>Balance</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(invoice, index) in soaDetail.invoices" :key="invoice.id">
                <td class="text-center">{{ index + 1 }}</td>
                <td class="text-center">{{ formatShortDate(invoice.tanggal) }}</td>
                <td class="text-center invoice-number">{{ invoice.no_inv }}</td>
                <td class="perihal-cell">{{ invoice.perihal || "—" }}</td>
                <td class="text-center">{{ invoice.projectName || "—" }}</td>
                <td class="amount-cell">{{ formatAmount(invoice.debit) }}</td>
                <td class="amount-cell balance-cell">{{ formatAmount(invoice.balance) }}</td>
                <td>{{ invoice.remark || "" }}</td>
              </tr>
              <tr v-if="!soaDetail.invoices?.length">
                <td colspan="8" class="empty-row">Tidak ada invoice pada SOA ini.</td>
              </tr>
              <tr class="soa-total-row">
                <th colspan="5">Total Outstanding Amount</th>
                <td />
                <td class="outstanding-total">{{ formatAmount(outstandingTotal) }}</td>
                <td />
              </tr>
            </tbody>
          </table>

          <p class="issue-location">Batam, {{ formatLongDate(soaDetail.tanggal_soa) }}</p>

          <section class="soa-note">
            <h2
              class="editable-display-value"
              contenteditable="true"
              spellcheck="false"
              aria-label="Ubah judul note"
              @blur="updateSoaNote('heading', $event)"
              @keydown.enter.prevent="blurEditableDisplay"
            >{{ soaNoteDisplay.heading }}</h2>
            <p
              class="editable-display-value"
              contenteditable="true"
              spellcheck="false"
              aria-label="Ubah note pertama"
              @blur="updateSoaNote('discrepancy', $event)"
              @keydown.enter.prevent="blurEditableDisplay"
            >{{ soaNoteDisplay.discrepancy }}</p>
            <p
              class="editable-display-value"
              contenteditable="true"
              spellcheck="false"
              aria-label="Ubah note pembayaran"
              @blur="updateSoaNote('payment', $event)"
              @keydown.enter.prevent="blurEditableDisplay"
            >{{ soaNoteDisplay.payment }}</p>
          </section>

          <section class="remittance-section">
            <div class="remittance-heading-row" >
              <h2 v-if="showBankDetails">KINDLY REMIT THE AMOUNT TO OUR BANKER AS FOLLOWS:</h2>
              <v-chip
                size="x-small"
                variant="tonal"
                color="primary"
                class="no-print bank-visibility-chip"
                :prepend-icon="showBankDetails ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                @click="showBankDetails = !showBankDetails"
              >
                {{ showBankDetails ? "Sembunyikan Rekening" : "Tampilkan Rekening" }}
              </v-chip>
            </div>
            <div class="remittance-content">
              <table v-if="showBankDetails" class="remittance-table">
                <tbody>
                  <tr>
                    <th>Company Name</th>
                    <td>:</td>
                    <td>PT. DUTA RAYA MARINE</td>
                  </tr>
                  <tr>
                    <th>Bank Name</th>
                    <td>:</td>
                    <td
                      class="editable-display-value"
                      contenteditable="true"
                      spellcheck="false"
                      aria-label="Ubah tampilan nama bank"
                      @blur="updateBankText('bankName', $event)"
                      @keydown.enter.prevent="blurEditableDisplay"
                    >{{ bankDisplay.bankName }}</td>
                  </tr>
                  <tr>
                    <th>Account Number</th>
                    <td>:</td>
                    <td
                      class="editable-display-value"
                      contenteditable="true"
                      spellcheck="false"
                      aria-label="Ubah tampilan nomor rekening"
                      @blur="updateBankText('accountNumber', $event)"
                      @keydown.enter.prevent="blurEditableDisplay"
                    >{{ bankDisplay.accountNumber }}</td>
                  </tr>
                  <tr>
                    <th>Beneficiary Name</th>
                    <td>:</td>
                    <td
                      class="editable-display-value"
                      contenteditable="true"
                      spellcheck="false"
                      aria-label="Ubah tampilan nama penerima"
                      @blur="updateBankText('beneficiary', $event)"
                      @keydown.enter.prevent="blurEditableDisplay"
                    >{{ bankDisplay.beneficiary }}</td>
                  </tr>
                </tbody>
              </table>

              <div
                class="soa-signature"
                :class="{
                  'has-stamped-signature': usesStampedSignature,
                }"
              >
                <span>Yours sincerely,</span>
                <strong>PT. DUTA RAYA MARINE</strong>
                <div class="signature-img-container">
                  <img
                    v-if="signatureImage"
                    :src="signatureImage"
                    :alt="`Tanda tangan ${soaDetail.sign_by}`"
                    class="signature-image"
                    :class="{
                      'signature-image-stamped': usesStampedSignature,
                      'signature-image-lilis': soaDetail.sign_by === 'Lilis',
                    }"
                  />
                </div>
                <strong class="signature-name">{{ soaDetail.sign_by || "—" }}</strong>
              </div>
            </div>
          </section>
        </article>
      </div>
    </div>

    <div class="soa-actions no-print">
      <v-btn
        prepend-icon="mdi-printer"
        color="indigo-darken-3"
        variant="elevated"
        @click="printSoa"
      >
        Print SOA
      </v-btn>
      <v-btn
        prepend-icon="mdi-file-pdf-box"
        color="red-darken-2"
        variant="elevated"
        :loading="isSavingPdf"
        :disabled="isSavingPdf"
        @click="handleSavePdf"
      >
        Save PDF
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";

interface SoaInvoiceSnapshot {
  id: string;
  no_inv: string;
  tanggal: string;
  perihal: string;
  projectName: string;
  debit: number;
  credit?: number;
  balance: number;
  remark?: string;
}

interface SoaDetail {
  id?: string;
  tanggal_soa: string;
  nama_customer: string;
  attn: string;
  currency: string;
  sign_by: string;
  invoices: SoaInvoiceSnapshot[];
}

const props = defineProps<{ soaDetail: SoaDetail }>();
const printArea = ref<HTMLElement | null>(null);
const isSavingPdf = ref(false);
const showBankDetails = ref(false);
const previewZoom = ref(1);
let previewResizeObserver: ResizeObserver | null = null;
const soaNoteDisplay = reactive({
  heading: "NOTE :",
  discrepancy:
    "** Unless notified in writing of any discrepancies in the invoice within fourteen (14) days of receipts by the Customer, the invoiced amount shall be deemed to be accurate and conclusive.",
  payment:
    "** Payment shall be made in immediately available funds and shall be in full, free, and clear of and without any deduction for or account of any bank charges, legal or equitable set-offs, counterclaims, imposts, taxes or withholdings of any nature whatsoever.",
});

function updatePreviewZoom() {
  if (typeof window === "undefined") return;

  const previewWidth =
    printArea.value?.closest<HTMLElement>(".soa-canvas")?.clientWidth || 0;
  const isMobile = window.matchMedia("(max-width: 700px)").matches;
  previewZoom.value =
    isMobile && previewWidth > 0 ? Math.min(1, previewWidth / 1123) : 1;
}

onMounted(() => {
  updatePreviewZoom();
  const canvasRoot = printArea.value?.closest<HTMLElement>(".soa-canvas");
  if (canvasRoot) {
    previewResizeObserver = new ResizeObserver(updatePreviewZoom);
    previewResizeObserver.observe(canvasRoot);
  }
  window.addEventListener("resize", updatePreviewZoom);
});

onBeforeUnmount(() => {
  previewResizeObserver?.disconnect();
  window.removeEventListener("resize", updatePreviewZoom);
});

const outstandingTotal = computed(() =>
  (props.soaDetail.invoices || []).reduce(
    (total, invoice) => total + (Number(invoice.balance) || 0),
    0,
  ),
);

const bankAccount = computed(() => {
  const accounts: Record<
    string,
    {
      bankName: string;
      accountNumber: string;
      beneficiary: string;
    }
  > = {
    Lilis: {
      bankName: "BCA",
      accountNumber: "2671 6250 74",
      beneficiary: "Lilis Trisnawati",
    },
    "Seilla Maryana": {
      bankName: "BCA",
      accountNumber: "8551 0635 77",
      beneficiary: "Seilla Maryana",
    },
    "Leo Adiatmaja Sembiring": {
      bankName: "BCA",
      accountNumber: "8550 7530 23",
      beneficiary: "Leo Adiatmaja Sembiring",
    },
    "Muhammad Ridwan": {
      bankName: "BCA",
      accountNumber: "8691 8096 92",
      beneficiary: "Muhammad Ridwan",
    },
  };

  return accounts[props.soaDetail.sign_by] || accounts.Lilis;
});

const bankDisplay = reactive({
  bankName: "",
  accountNumber: "",
  beneficiary: "",
});

watch(
  bankAccount,
  (account) => {
    bankDisplay.bankName = account.bankName;
    bankDisplay.accountNumber = account.accountNumber;
    bankDisplay.beneficiary = account.beneficiary;
  },
  { immediate: true },
);

const signatureImage = computed(() => {
  const images: Record<string, string> = {
    "Seilla Maryana": "/ttd_seilla_hitam.png",
    "Leo Adiatmaja Sembiring": "/ttd_leo.png",
    "Muhammad Ridwan": "/ttd_ridwan.png",
    Lilis: "/ttd_lilis_hitam.png",
  };
  return images[props.soaDetail.sign_by] || "";
});

const usesStampedSignature = computed(() =>
  ["Seilla Maryana", "Lilis"].includes(props.soaDetail.sign_by),
);

function updateBankText(
  field: keyof typeof bankDisplay,
  event: Event,
) {
  bankDisplay[field] = (event.currentTarget as HTMLElement).innerText.trim();
}

function updateSoaNote(field: keyof typeof soaNoteDisplay, event: Event) {
  soaNoteDisplay[field] = (event.currentTarget as HTMLElement).innerText.trim();
}

function blurEditableDisplay(event: KeyboardEvent) {
  (event.currentTarget as HTMLElement | null)?.blur();
}

function parseLocalDate(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatLongDate(value?: string) {
  const date = parseLocalDate(value);
  if (!date) return value || "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatShortDate(value?: string) {
  const date = parseLocalDate(value);
  if (!date) return value || "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(date);
}

function formatAmount(value?: number) {
  const currency = props.soaDetail.currency || "IDR";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: currency === "IDR" ? 0 : 2,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(Number(value) || 0);
}

type PdfTextFragment = {
  text: string;
  left: number;
  top: number;
  height: number;
  baseline: number;
  fontSizePx: number;
  fontFamily: string;
  fontWeight: number;
  isItalic: boolean;
  color: [number, number, number];
  alignment: "left" | "center" | "right";
};

function parseCssColor(value: string): [number, number, number] {
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  return channels?.length === 3
    ? [channels[0], channels[1], channels[2]]
    : [0, 0, 0];
}

function applyTextTransform(text: string, transform: string) {
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  if (transform === "capitalize") {
    return text.replace(/(^|\s)\S/g, (character) => character.toUpperCase());
  }
  return text;
}

// Capture backgrounds and fine document details as an image, then write text
// as native PDF text so it stays sharp and selectable at every zoom level.
function extractPdfTextFragments(root: Element): PdfTextFragment[] {
  const rootRect = root.getBoundingClientRect();
  const fragments: PdfTextFragment[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  let textNode = walker.nextNode() as Text | null;
  while (textNode) {
    const parent = textNode.parentElement;
    const sourceText = textNode.data;
    if (
      parent &&
      sourceText.trim() &&
      !parent.closest(".no-print, .drag-icon, .no-print-cell")
    ) {
      const style = window.getComputedStyle(parent);
      const fontSizePx = Number.parseFloat(style.fontSize);
      if (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) !== 0 &&
        fontSizePx > 0 &&
        parent.getClientRects().length
      ) {
        type CharacterRect = { character: string; rect: DOMRect };
        let currentLine: CharacterRect[] = [];
        let currentTop: number | null = null;
        const range = document.createRange();

        const flushLine = () => {
          const firstVisible = currentLine.findIndex(
            ({ character }) => !/\s/.test(character),
          );
          let lastVisible = currentLine.length - 1;
          while (
            lastVisible >= firstVisible &&
            /\s/.test(currentLine[lastVisible]?.character || "")
          ) {
            lastVisible--;
          }

          if (firstVisible >= 0 && lastVisible >= firstVisible) {
            const visibleCharacters = currentLine.slice(
              firstVisible,
              lastVisible + 1,
            );
            const lineTop = Math.min(
              ...visibleCharacters.map(({ rect }) => rect.top),
            );
            const lineBottom = Math.max(
              ...visibleCharacters.map(({ rect }) => rect.bottom),
            );
            const normalizedText = visibleCharacters
              .map(({ character }) => character)
              .join("")
              .replace(/\s+/g, " ");
            const alignment =
              style.textAlign === "right" || style.textAlign === "end"
                ? "right"
                : style.textAlign === "center"
                  ? "center"
                  : "left";
            const firstCharacterRect = visibleCharacters[0].rect;
            const lastCharacterRect =
              visibleCharacters[visibleCharacters.length - 1].rect;
            const textAnchor =
              alignment === "right"
                ? lastCharacterRect.right - rootRect.left
                : alignment === "center"
                  ? (firstCharacterRect.left + lastCharacterRect.right) / 2 -
                    rootRect.left
                  : firstCharacterRect.left - rootRect.left;

            fragments.push({
              text: applyTextTransform(normalizedText, style.textTransform),
              left: textAnchor,
              top: lineTop - rootRect.top,
              height: lineBottom - lineTop,
              baseline: lineTop - rootRect.top + (lineBottom - lineTop) * 0.8,
              fontSizePx,
              fontFamily: style.fontFamily.toLowerCase(),
              fontWeight: Number.parseInt(style.fontWeight, 10) || 400,
              isItalic: style.fontStyle === "italic",
              color: parseCssColor(style.color),
              alignment,
            });
          }

          currentLine = [];
          currentTop = null;
        };

        for (let index = 0; index < sourceText.length; index++) {
          const character = sourceText[index];
          if (character === "\n" || character === "\r") {
            flushLine();
            continue;
          }

          range.setStart(textNode, index);
          range.setEnd(textNode, index + 1);
          const rect = range.getBoundingClientRect();
          if (!rect.width && !rect.height) continue;

          if (currentTop !== null && Math.abs(rect.top - currentTop) > 0.75) {
            flushLine();
          }
          if (currentTop === null) currentTop = rect.top;
          currentLine.push({ character, rect });
        }
        flushLine();
      }
    }

    textNode = walker.nextNode() as Text | null;
  }

  return fragments;
}

async function createPaginatedSoaPdf() {
  const targetElement = printArea.value?.querySelector<HTMLElement>(".soa-paper");
  if (!targetElement) return null;

  targetElement.classList.add("soa-pdf-capture");
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
    const textFragments = extractPdfTextFragments(targetElement);
    const isSmallViewport = window.matchMedia("(max-width: 600px)").matches;
    const requestedScale = isSmallViewport ? 2 : 3;
    const maxCanvasPixels = isSmallViewport ? 12_000_000 : 40_000_000;
    const safeScale = Math.sqrt(
      maxCanvasPixels / (targetRect.width * targetRect.height),
    );
    const captureScale = Math.max(1, Math.min(requestedScale, safeScale));
    const canvas = await html2canvas(targetElement, {
      scale: captureScale,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (clonedDocument, clonedTarget) => {
        clonedTarget.style.width = "1123px";
        clonedTarget.style.maxWidth = "none";
        clonedTarget.style.boxShadow = "none";

        clonedTarget
          .querySelectorAll(".no-print, .drag-icon, .no-print-cell")
          .forEach((element) => {
            (element as HTMLElement).style.display = "none";
          });
        clonedTarget.querySelectorAll(".editable-display-value").forEach(
          (element) => {
            const htmlElement = element as HTMLElement;
            htmlElement.style.background = "transparent";
            htmlElement.style.boxShadow = "none";
          },
        );

        // Keep backgrounds and document details in the captured image while
        // reserving text rendering for the native PDF layer below.
        clonedTarget.querySelectorAll("*").forEach((element) => {
          const htmlElement = element as HTMLElement;
          const originalStyle = clonedDocument.defaultView?.getComputedStyle(
            element,
          );
          htmlElement.style.setProperty("color", "transparent", "important");
          htmlElement.style.setProperty(
            "-webkit-text-fill-color",
            "transparent",
            "important",
          );
          htmlElement.style.setProperty("text-shadow", "none", "important");
          if (originalStyle?.textDecorationLine.includes("underline")) {
            htmlElement.style.setProperty(
              "text-decoration-color",
              "#000",
              "important",
            );
          }
        });
      },
    });

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true,
      putOnlyUsedFonts: true,
      precision: 4,
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;
    const pixelsPerMm = canvas.width / contentWidth;
    const pageSliceHeight = Math.floor(contentHeight * pixelsPerMm);
    const canvasScale = canvas.width / targetRect.width;
    const keepTogetherRanges: Array<{ top: number; bottom: number }> = [];

    targetElement
      .querySelectorAll<HTMLElement>(
        ".letterhead, .soa-title, .soa-metadata, .soa-table tbody tr, .issue-location, .soa-note, .remittance-section",
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
        if (range.bottom - range.top <= pageSliceHeight * 0.8) {
          keepTogetherRanges.push(range);
        }
      });
    keepTogetherRanges.sort((first, second) => first.top - second.top);

    const drawPdfTextFragments = (
      originX: number,
      originY: number,
      scale: number,
      sourceTop = 0,
      sourceBottom = Number.POSITIVE_INFINITY,
    ) => {
      const millimetersPerCssPixel = (contentWidth / targetRect.width) * scale;
      textFragments.forEach((fragment) => {
        const fragmentMiddle = fragment.top + fragment.height / 2;
        if (fragmentMiddle < sourceTop || fragmentMiddle >= sourceBottom) return;

        const fontStyle = fragment.isItalic
          ? fragment.fontWeight >= 600
            ? "bolditalic"
            : "italic"
          : fragment.fontWeight >= 600
            ? "bold"
            : "normal";
        const isSerifFont =
          fragment.fontFamily.includes("times") ||
          (fragment.fontFamily.includes("serif") &&
            !fragment.fontFamily.includes("sans-serif"));
        const fontFamily = isSerifFont
          ? "times"
          : "helvetica";
        pdf.setFont(fontFamily, fontStyle);
        pdf.setFontSize(
          fragment.fontSizePx * millimetersPerCssPixel * (72 / 25.4),
        );
        pdf.setTextColor(...fragment.color);
        pdf.text(
          fragment.text,
          originX + fragment.left * millimetersPerCssPixel,
          originY +
            (fragment.baseline - sourceTop) * millimetersPerCssPixel,
          { align: fragment.alignment },
        );
      });
    };

    const createCanvasSlice = (sliceStart: number, sliceHeight: number) => {
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeight;
      sliceCanvas
        .getContext("2d")
        ?.drawImage(
          canvas,
          0,
          sliceStart,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight,
        );
      return sliceCanvas;
    };

    const addPdfPageSlice = (
      pageIndex: number,
      sourceY: number,
      targetY: number,
      scale: number,
    ) => {
      if (pageIndex > 0) pdf.addPage();

      const sliceHeight = targetY - sourceY;
      const pageCanvas = createCanvasSlice(sourceY, sliceHeight);
      const fittedWidth = contentWidth * scale;
      const fittedHeight = (sliceHeight / pixelsPerMm) * scale;
      const imageX = margin + (contentWidth - fittedWidth) / 2;
      pdf.addImage(
        pageCanvas.toDataURL("image/png"),
        "PNG",
        imageX,
        margin,
        fittedWidth,
        fittedHeight,
        `soa-page-${pageIndex}`,
        "SLOW",
      );
      drawPdfTextFragments(
        imageX,
        margin,
        scale,
        sourceY / canvasScale,
        targetY / canvasScale,
      );
    };

    // Fit a compact statement on one page. This also prevents a final
    // near-empty page caused by a few pixels of capture rounding.
    const naturalHeight = targetRect.height * (contentWidth / targetRect.width);
    const onePageScale = Math.min(1, contentHeight / naturalHeight);
    if (onePageScale >= 0.92) {
      addPdfPageSlice(0, 0, canvas.height, onePageScale);
      return pdf;
    }

    let sourceY = 0;
    let pageIndex = 0;
    while (sourceY < canvas.height) {
      let targetY = Math.min(sourceY + pageSliceHeight, canvas.height);
      const crossingRanges = keepTogetherRanges.filter(
        (range) =>
          range.top > sourceY &&
          range.top < targetY &&
          range.bottom > targetY,
      );
      if (crossingRanges.length) {
        targetY = Math.min(...crossingRanges.map((range) => range.top));
      }

      if (targetY <= sourceY) {
        targetY = Math.min(sourceY + pageSliceHeight, canvas.height);
      }

      const remainingHeight = canvas.height - sourceY;
      const finalPageScale = Math.min(1, pageSliceHeight / remainingHeight);
      if (finalPageScale >= 0.92) {
        addPdfPageSlice(pageIndex, sourceY, canvas.height, finalPageScale);
        break;
      }

      addPdfPageSlice(pageIndex, sourceY, targetY, 1);

      sourceY = targetY;
      pageIndex++;
    }

    return pdf;
  } finally {
    targetElement.classList.remove("soa-pdf-capture");
  }
}

async function handleSavePdf() {
  if (isSavingPdf.value) return;
  isSavingPdf.value = true;
  try {
    const pdf = await createPaginatedSoaPdf();
    if (!pdf) return;

    const customerName = (props.soaDetail.nama_customer || "Customer")
      .normalize("NFKD")
      .replace(/[^\w-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const issueDate = (props.soaDetail.tanggal_soa || "")
      .replace(/[^\d]/g, "") || "SOA";
    pdf.save(`SOA-${customerName || "Customer"}-${issueDate}.pdf`);
  } catch (error) {
    console.error("Gagal membuat PDF SOA:", error);
    useNotificationStore().showError("Gagal membuat PDF SOA");
  } finally {
    isSavingPdf.value = false;
  }
}

function printSoa() {
  const content = printArea.value?.querySelector<HTMLElement>(".soa-paper");
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
        <title>Statement of Account</title>
        ${styles}
        <style>
          body { background: white !important; margin: 0; padding: 0; }
          .soa-paper { border: none !important; box-shadow: none !important; width: 100% !important; max-width: 100% !important; }
          @page { size: A4 landscape; margin: 8mm; }
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
</script>

<style scoped>
.soa-canvas {
  width: 100%;
  color: #000;
}

.soa-preview-container {
  display: flex;
  justify-content: center;
  overflow: auto;
}

.soa-paper-wrapper {
  width: 1123px;
  max-width: 100%;
}

.soa-paper {
  box-sizing: border-box;
  width: 1123px;
  max-width: 100%;
  padding: 24px 32px 28px;
  border: 1px solid #e4e4e4;
  background: #fff;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.1);
  color: #000;
  font-family:
    "Segoe UI",
    -apple-system,
    BlinkMacSystemFont,
    Roboto,
    sans-serif;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
}

.letterhead {
  margin-bottom: 11px;
}

.header-section {
  display: grid;
  grid-template-columns: 130px minmax(0, 1fr) 130px;
  align-items: center;
  position: relative;
  z-index: 1;
  padding: 2px 0 7px;
  font-weight: 400;
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
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.3px;
  line-height: 1.2;
}

.address-line,
.phone-line {
  margin: 1px 0 0;
  font-size: 11px;
  line-height: 1.35;
}

.header-divider {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 5px;
}

.accent-bar {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #153a5c;
}

.secondary-bar {
  width: 100%;
  height: 2px;
  background-color: #032752;
}

.soa-paper.soa-pdf-capture {
  width: 1123px !important;
  max-width: none !important;
  border: 0 !important;
  box-shadow: none !important;
}

.soa-paper.soa-pdf-capture .no-print,
.soa-paper.soa-pdf-capture .drag-icon,
.soa-paper.soa-pdf-capture .no-print-cell {
  display: none !important;
}

.soa-preview-container:has(.soa-paper.soa-pdf-capture) {
  zoom: 1 !important;
}

.soa-title {
  margin: 0 0 17px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.soa-metadata {
  display: flex;
  min-height: 48px;
  margin-bottom: 9px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.metadata-table {
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.35;
}

.metadata-table-left {
  width: 58%;
}

.metadata-table-right {
  width: 35%;
}

.metadata-table th,
.metadata-table td {
  padding: 0 5px 1px 0;
  border: 0;
  text-align: left;
  vertical-align: top;
}

.metadata-table th {
  min-width: 57px;
  white-space: nowrap;
}

.metadata-table-right th {
  min-width: 118px;
}

.metadata-table td:last-child {
  padding-right: 0;
}

.soa-table {
  width: 100%;
  table-layout: fixed;
  border: 1px solid #111;
  border-collapse: separate;
  border-spacing: 0;
}

.soa-table th,
.soa-table td {
  padding: 4px 6px;
  border: 0;
  border-right: 1px solid #111;
  border-bottom: 1px solid #111;
  vertical-align: middle;
}

.soa-table tr > :last-child {
  border-right: 0;
}

.soa-table tbody tr:last-child > * {
  border-bottom: 0;
}

.soa-table th {
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
}

.soa-table tbody td {
  font-size: 12px;
   font-weight: 400;
}

.col-no { width: 4.5%; }
.col-date { width: 9%; }
.col-invoice { width: 15%; }
.col-perihal { width: 32%; }
.col-project { width: 11%; }
.col-debit { width: 10%; }
.col-balance { width: 10%; }
.col-remark { width: 8.5%; }

.text-center {
  text-align: center;
}

.invoice-number,
.amount-cell {
  white-space: nowrap;
}

.perihal-cell {
  font-weight: 600;
  text-align: center;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.amount-cell {
  text-align: right;
}

.empty-row {
  padding: 16px !important;
  text-align: center;
  font-weight: 400;
}

.soa-total-row th:first-child {
  text-align: center;
}

.outstanding-total {
  background: #f2b082;
  text-align: right;
}

.issue-location {
  margin: 16px 0 26px;
  font-size: 13px;
}

.soa-note h2 {
  display: inline-block;
  margin: 0 0 3px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  text-decoration: underline;
}

.soa-note p {
  margin: 2px 0;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
}

.remittance-section {
  margin-top: 24px;
  font-size: 12px;
}

.remittance-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.remittance-section h2 {
  display: inline-block;
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: underline;
}

.bank-visibility-chip {
  flex: 0 0 auto;
  margin: 0 0 12px;
}

.remittance-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 32px;
}

.remittance-table {
  border-collapse: collapse;
  font-size: 12px;
}

.remittance-table th,
.remittance-table td {
  padding: 1px 4px 1px 0;
  border: 0;
  text-align: left;
  vertical-align: top;
}

.remittance-table th {
  min-width: 122px;
}

.soa-signature {
  display: flex;
  min-width: 200px;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  font-size: 12px;
}

.soa-signature > span {
  font-style: italic;
  font-weight: 400;
}

.signature-img-container {
  display: flex;
  height: 68px;
  align-items: center;
  justify-content: flex-start;
}

.signature-image {
  max-width: 130px;
  max-height: 68px;
  margin: 1px 0 -2px;
  object-fit: contain;
  object-position: left center;
}

.signature-image-stamped {
  max-width: 150px;
  max-height: 118px;
}

.signature-image-lilis {
  filter: saturate(60%);
}

.soa-signature.has-stamped-signature .signature-img-container {
  height: 120px;
}

.signature-name {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.soa-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin: 16px 0 8px;
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

@media (max-width: 700px) {
  .soa-preview-container {
    width: 1123px;
    max-width: none;
    margin-inline: auto;
    justify-content: center;
    overflow: visible;
  }

  .soa-paper-wrapper {
    width: 1123px;
    max-width: none;
    flex: 0 0 1123px;
  }

  .soa-paper {
    width: 1123px;
    max-width: none;
  }
}

@media print {
  .no-print {
    display: none !important;
  }

  .soa-paper {
    width: 100% !important;
    max-width: 100% !important;
    border: 0 !important;
    box-shadow: none !important;
  }
}
</style>
