<script setup lang="ts">
import type { invoiceM } from "~/types/invoice";

const props = defineProps<{
  invoiceDetail: invoiceM;
  actionsTarget?: HTMLElement | null;
}>();

const printArea = ref<HTMLElement | null>(null);
const isSavingPdf = ref(false);
const CONTINUATION_PAGE_TOP_PADDING_MM = 8;
const PAGE_BOTTOM_PADDING_MM = 8;

type DeliveryOrderDisplayItem = Omit<
  invoiceM["item_pekerjaan"][number],
  "qty"
> & {
  qty: number | string;
};
const displayItems = ref<DeliveryOrderDisplayItem[]>([]);
const invoiceYear = computed(() => props.invoiceDetail.tanggal?.slice(0, 4));

const isDeliveryItem = (item: DeliveryOrderDisplayItem) =>
  ["Barang", "Barang & Jasa"].includes(item.kategori_item);

const deliveryItems = computed(() =>
  displayItems.value
    .map((item, sourceIndex) => ({ item, sourceIndex }))
    .filter(({ item }) => isDeliveryItem(item)),
);

const emptyItemRows = computed(() =>
  Math.max(0, 4 - deliveryItems.value.length),
);

const deliveryOrderNumber = computed(
  () =>
    `DO/DRM/${invoiceYear.value || "-"}/${props.invoiceDetail.no_inv || "-"}`,
);

const invoiceNumber = computed(
  () =>
    `INV/DRM/${invoiceYear.value || "-"}/${props.invoiceDetail.no_inv || "-"}`,
);

watch(
  () => props.invoiceDetail.item_pekerjaan,
  (items) => {
    displayItems.value = (items || []).map((item) => ({ ...item }));
  },
  { immediate: true, deep: true },
);

function updateDisplayItem(
  index: number,
  field: "nama" | "qty" | "uom",
  event: FocusEvent,
) {
  const item = displayItems.value[index];
  const target = event.currentTarget as HTMLElement | null;

  if (!item || !target) return;

  const value = target.innerText.trim();

  if (field === "qty") {
    item.qty = value;
    return;
  }

  item[field] = value;
}

const formatTanggal = (tanggal: string) => {
  if (!tanggal) return "-";

  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(tanggal);
  if (isoDate) return `${isoDate[3]}-${isoDate[2]}-${isoDate[1]}`;

  const date = new Date(tanggal);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(date)
    .replace(/\//g, "-");
};

function printDeliveryOrder() {
  const content =
    printArea.value?.querySelector<HTMLElement>(".invoice-paper");

  if (!content) return;

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    console.error("Tidak dapat membuka print window.");
    return;
  }

  const styles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]'),
  )
    .map((style) => style.outerHTML)
    .join("");

  printWindow.document.write(`<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <base href="${document.baseURI}" />
        <title>${deliveryOrderNumber.value}</title>
        ${styles}
        <style>
          html,
          body {
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          body {
            min-height: 297mm !important;
          }

          .no-print {
            display: none !important;
          }

          .invoice-paper {
            width: 210mm !important;
            min-width: 210mm !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .main-table tr,
          .info-section,
          .signature-section {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            size: A4 portrait;
            margin: ${CONTINUATION_PAGE_TOP_PADDING_MM}mm 0
              ${PAGE_BOTTOM_PADDING_MM}mm;
          }

          @page :first {
            margin: 0;
          }
        </style>
      </head>
      <body>
        ${content.outerHTML}
        <script>
          window.onload = async function () {
            await Promise.all(
              Array.from(document.images).map(function (image) {
                if (image.complete) return Promise.resolve();
                return new Promise(function (resolve) {
                  image.onload = resolve;
                  image.onerror = resolve;
                });
              })
            );
            setTimeout(function () { window.print(); }, 150);
          };

          window.onafterprint = function () { window.close(); };
        <\/script>
      </body>
    </html>`);

  printWindow.document.close();
}

type PdfTextFragment = {
  text: string;
  left: number;
  width: number;
  top: number;
  height: number;
  baseline: number;
  fontSizePx: number;
  fontWeight: number;
  isItalic: boolean;
  color: [number, number, number];
  alignment: "left" | "center" | "right";
};

const parseCssColor = (value: string): [number, number, number] => {
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  return channels?.length === 3
    ? [channels[0], channels[1], channels[2]]
    : [17, 24, 39];
};

const applyTextTransform = (text: string, transform: string) => {
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  if (transform === "capitalize") {
    return text.replace(/(^|\s)\S/g, (character) => character.toUpperCase());
  }
  return text;
};

const extractPdfTextFragments = (root: Element): PdfTextFragment[] => {
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
      !parent.closest(".no-print, .editable-description")
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
        type WordRect = { word: string; rect: DOMRect };
        let currentLine: WordRect[] = [];
        let currentTop: number | null = null;
        const parsedLineHeight = Number.parseFloat(style.lineHeight);
        const lineHeightPx = Number.isFinite(parsedLineHeight)
          ? parsedLineHeight
          : fontSizePx * 1.25;
        const lineTopTolerance = Math.max(2, lineHeightPx * 0.45);
        const range = document.createRange();

        const flushLine = () => {
          if (currentLine.length) {
            const lineTop = Math.min(
              ...currentLine.map(({ rect }) => rect.top),
            );
            const lineBottom = Math.max(
              ...currentLine.map(({ rect }) => rect.bottom),
            );
            const normalizedText = currentLine
              .map(({ word }) => word)
              .join(" ");
            const alignment =
              style.textAlign === "right" || style.textAlign === "end"
                ? "right"
                : style.textAlign === "center"
                  ? "center"
                  : "left";
            const firstWordRect = currentLine[0].rect;
            const lastWordRect = currentLine[currentLine.length - 1].rect;
            const textAnchor =
              alignment === "right"
                ? lastWordRect.right - rootRect.left
                : alignment === "center"
                  ? (firstWordRect.left + lastWordRect.right) / 2 -
                    rootRect.left
                  : firstWordRect.left - rootRect.left;

            fragments.push({
              text: applyTextTransform(normalizedText, style.textTransform),
              left: textAnchor,
              width: lastWordRect.right - firstWordRect.left,
              top: lineTop - rootRect.top,
              height: lineBottom - lineTop,
              baseline: lineTop - rootRect.top + (lineBottom - lineTop) * 0.8,
              fontSizePx,
              fontWeight: Number.parseInt(style.fontWeight, 10) || 400,
              isItalic: style.fontStyle === "italic",
              color: parseCssColor(style.color),
              alignment,
            });
          }

          currentLine = [];
          currentTop = null;
        };

        const wordPattern = /\S+/g;
        let match: RegExpExecArray | null;
        while ((match = wordPattern.exec(sourceText))) {
          const wordStart = match.index;
          const wordEnd = wordStart + match[0].length;
          range.setStart(textNode, wordStart);
          range.setEnd(textNode, wordEnd);
          const rect = range.getBoundingClientRect();
          if (!rect.width && !rect.height) continue;

          if (
            currentTop !== null &&
            Math.abs(rect.top - currentTop) > lineTopTolerance
          ) {
            flushLine();
          }
          if (currentTop === null) currentTop = rect.top;
          currentLine.push({ word: match[0], rect });
        }

        flushLine();
      }
    }

    textNode = walker.nextNode() as Text | null;
  }

  return fragments;
};

const createExactDeliveryOrderPdf = async () => {
  const paperElement = printArea.value?.querySelector<HTMLElement>(
    ".invoice-paper",
  );

  if (!paperElement) return null;

  const previewContainer = paperElement.closest<HTMLElement>(
    ".penawaran-content",
  );
  previewContainer?.classList.add("delivery-order-pdf-unscaled");
  void paperElement.offsetHeight;

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    await document.fonts?.ready;

    const paperRect = paperElement.getBoundingClientRect();
    const textFragments = extractPdfTextFragments(paperElement);
    const isSmallViewport = window.matchMedia("(max-width: 600px)").matches;
    const requestedCaptureScale = isSmallViewport ? 2 : 3;
    const maxCanvasPixels = isSmallViewport ? 12_000_000 : 40_000_000;
    const safeCaptureScale = Math.sqrt(
      maxCanvasPixels / (paperRect.width * paperRect.height),
    );
    const captureScale = Math.max(
      1,
      Math.min(requestedCaptureScale, safeCaptureScale),
    );

    const canvas = await html2canvas(paperElement, {
      scale: captureScale,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (clonedDocument) => {
        clonedDocument.querySelectorAll(".no-print").forEach((element) => {
          (element as HTMLElement).style.display = "none";
        });

        const clonedPaper =
          clonedDocument.querySelector<HTMLElement>(".invoice-paper");
        clonedPaper?.style.setProperty("box-shadow", "none", "important");
        clonedPaper?.style.setProperty("border-radius", "0", "important");

        clonedDocument
          .querySelectorAll(".invoice-paper *")
          .forEach((element) => {
            const htmlElement = element as HTMLElement;
            if (htmlElement.closest(".editable-description")) return;

            htmlElement.style.setProperty("color", "transparent", "important");
            htmlElement.style.setProperty(
              "-webkit-text-fill-color",
              "transparent",
              "important",
            );
            htmlElement.style.setProperty("text-shadow", "none", "important");
          });

        const captureTextStyle = clonedDocument.createElement("style");
        captureTextStyle.textContent = `
          .invoice-paper .editable-description {
            color: #111827 !important;
            -webkit-text-fill-color: #111827 !important;
            letter-spacing: 0 !important;
            line-height: 1.35 !important;
            text-align: left !important;
            text-align-last: left !important;
            white-space: normal !important;
            word-spacing: 0 !important;
          }
        `;
        clonedDocument.head.appendChild(captureTextStyle);
      },
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
      putOnlyUsedFonts: true,
      precision: 4,
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const canvasScale = canvas.width / paperRect.width;
    const mmPerCssPixel = pageWidth / paperRect.width;

    const drawPdfTextFragments = (
      sourceTop: number,
      sourceBottom: number,
      pageTopPadding: number,
    ) => {
      textFragments.forEach((fragment) => {
        const fragmentMiddle = fragment.top + fragment.height / 2;
        if (fragmentMiddle < sourceTop || fragmentMiddle >= sourceBottom) {
          return;
        }

        const fontStyle = fragment.isItalic
          ? fragment.fontWeight >= 600
            ? "bolditalic"
            : "italic"
          : fragment.fontWeight >= 600
            ? "bold"
            : "normal";

        pdf.setFont("helvetica", fontStyle);
        pdf.setFontSize(fragment.fontSizePx * mmPerCssPixel * (72 / 25.4));
        pdf.setTextColor(...fragment.color);
        const targetWidth = fragment.width * mmPerCssPixel;
        const measuredWidth = pdf.getTextWidth(fragment.text);
        const horizontalScale =
          measuredWidth > 0 ? targetWidth / measuredWidth : 1;
        pdf.text(
          fragment.text,
          fragment.left * mmPerCssPixel,
          pageTopPadding +
            (fragment.baseline - sourceTop) * mmPerCssPixel,
          { align: fragment.alignment, horizontalScale },
        );
      });
    };

    let sourceY = 0;
    let pageIndex = 0;

    while (sourceY < canvas.height) {
      const pageTopPadding =
        pageIndex === 0 ? 0 : CONTINUATION_PAGE_TOP_PADDING_MM;
      const pageBottomPadding =
        pageIndex === 0 ? 0 : PAGE_BOTTOM_PADDING_MM;
      const availablePageHeight =
        pageHeight - pageTopPadding - pageBottomPadding;
      const pageSliceHeight = Math.floor(
        canvas.width * (availablePageHeight / pageWidth),
      );
      const remainingHeight = canvas.height - sourceY;
      const sliceHeight =
        remainingHeight <= pageSliceHeight + Math.ceil(canvasScale)
          ? remainingHeight
          : pageSliceHeight;
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      pageCanvas
        .getContext("2d")
        ?.drawImage(
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

      if (pageIndex > 0) pdf.addPage();

      pdf.addImage(
        pageCanvas.toDataURL("image/png"),
        "PNG",
        0,
        pageTopPadding,
        pageWidth,
        (sliceHeight / canvas.width) * pageWidth,
        `delivery-order-page-${pageIndex}`,
        "SLOW",
      );
      drawPdfTextFragments(
        sourceY / canvasScale,
        (sourceY + sliceHeight) / canvasScale,
        pageTopPadding,
      );

      sourceY += sliceHeight;
      pageIndex++;
    }

    return pdf;
  } finally {
    previewContainer?.classList.remove("delivery-order-pdf-unscaled");
  }
};

function handleSavePdf() {
  if (isSavingPdf.value) return;
  isSavingPdf.value = true;

  void createExactDeliveryOrderPdf()
    .then((pdf) => {
      if (!pdf) return;

      const fileSubject = (props.invoiceDetail.perihal || "delivery-order")
        .replace(/[^a-z0-9-_]+/gi, "-")
        .replace(/^-+|-+$/g, "");
      pdf.save(`DO-DRM-${fileSubject || "delivery-order"}.pdf`);
    })
    .catch((error) => {
      console.error("Gagal menyimpan PDF Delivery Order:", error);
      useNotificationStore().showError("Gagal membuat PDF Delivery Order");
    })
    .finally(() => {
      isSavingPdf.value = false;
    });
}

</script>

<template>
  <div class="delivery-order-wrapper">
    <Teleport :to="actionsTarget || 'body'" :disabled="!actionsTarget">
      <div
        class="no-print delivery-order-toolbar"
        role="group"
        aria-label="Delivery order document actions"
      >
        <div class="document-actions">
          <v-btn
            height="38"
            color="blue-grey-darken-2"
            variant="outlined"
            prepend-icon="mdi-printer-outline"
            class="delivery-order-action delivery-order-action--print"
            :disabled="isSavingPdf"
            aria-label="Print delivery order"
            @click="printDeliveryOrder"
          >
            Print
          </v-btn>

          <v-btn
            height="38"
            color="indigo-darken-3"
            variant="flat"
            prepend-icon="mdi-file-pdf-box"
            class="delivery-order-action delivery-order-action--primary"
            :loading="isSavingPdf"
            :disabled="isSavingPdf"
            aria-label="Download delivery order as PDF"
            @click="handleSavePdf"
          >
            Download PDF
          </v-btn>
        </div>
      </div>
    </Teleport>

    <div ref="printArea" class="invoice-paper-wrapper">
      <article class="invoice-paper">
        <div class="document-frame">
        <header class="letterhead">
          <div class="header-section">
            <section class="company-panel">
              <div class="logo-wrapper">
                <img src="/logokopsurat.png" alt="Logo PT. Duta Raya Marine" />
              </div>

              <div class="letterhead-info">
                <h1 class="company-name">PT. DUTA RAYA MARINE</h1>
                <p class="address-line">
                  Ruko Dreamland H3 No. 05, Tanjung Riau, Sekupang,<br />
                  Kota Batam, Kepulauan Riau
                </p>
                <p class="phone-line">
                  E-mail : sales@dutarayamarine.com <br /> Phone/Whatsapp +62 823-8450-3953<br />
                  Website : www.dutarayamarine.com
                </p>
              </div>
            </section>

            <section class="document-identity">
              <!-- <div class="document-kicker">Shipping Document</div> -->
              <h2>DELIVERY ORDER</h2>

              <dl class="document-meta">
                <div>
                  <dt>DO No.</dt>
                  <span class="document-meta-separator" aria-hidden="true">:</span>
                  <dd>{{ deliveryOrderNumber }}</dd>
                </div>
              </dl>
            </section>
          </div>
        </header>

        <div class="content-body">
          <section class="info-section party-grid">
            <div class="party-panel">
              <div class="panel-title">Recipient Information</div>
              <dl class="party-details">
                <div>
                  <dt>Delivered To</dt>
                  <span class="party-detail-separator" aria-hidden="true">:</span>
                  <dd>{{ invoiceDetail.nama_customer || "-" }}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <span class="party-detail-separator" aria-hidden="true">:</span>
                  <dd>{{ invoiceDetail.alamat_customer || "-" }}</dd>
                </div>
              </dl>
            </div>

            <div class="party-panel">
              <div class="panel-title">Destination Information</div>
              <dl class="party-details">
                <div>
                  <dt>Vessel</dt>
                  <span class="party-detail-separator" aria-hidden="true">:</span>
                  <dd>{{ invoiceDetail.vessel || "-" }}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <span class="party-detail-separator" aria-hidden="true">:</span>
                  <dd>{{ invoiceDetail.location || "-" }}</dd>
                </div>

              </dl>
            </div>
          </section>

          <section class="reference-section">
            <div class="panel-title">Document References</div>
            <div class="reference-grid">
              <div class="reference-item">
                <span>Quotation No.</span>
                <strong>{{ invoiceDetail.no_penawaran || "-" }}</strong>
              </div>
              <div class="reference-item">
                <span>PO No.</span>
                <strong>{{ invoiceDetail.no_preorder || "-" }}</strong>
              </div>
              <div class="reference-item">
                <span>Invoice No.</span>
                <strong>{{ invoiceNumber }}</strong>
              </div>
            </div>
          </section>

          <!-- <div class="subject-strip">
            <span>Subject</span>
            <strong>{{ invoiceDetail.perihal || "-" }}</strong>
          </div> -->

        <table class="main-table">
          <thead>
            <tr>
              <th class="item-number-column">No.</th>
              <th>Description</th>
              <th class="item-quantity-column">Qty</th>
              <th class="item-unit-column">Uom</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="({ item, sourceIndex }, index) in deliveryItems"
              :key="'do-item-' + sourceIndex"
              class="item-row"
            >
              <td class="item-number-cell">{{ index + 1 }}</td>
              <td class="v-align-top">
                <div
                  class="editable-display-value editable-description"
                  contenteditable="true"
                  role="textbox"
                  dir="ltr"
                  aria-label="Ubah deskripsi item untuk tampilan Delivery Order"
                  spellcheck="false"
                  style="
                    letter-spacing: 0 !important;
                    text-align: left !important;
                    text-align-last: left !important;
                    white-space: normal !important;
                    word-spacing: 0 !important;
                  "
                  @blur="updateDisplayItem(sourceIndex, 'nama', $event)"
                >{{ item.nama }}</div>
              </td>

              <td class="item-value-cell v-align-top">
                <span
                  class="editable-display-value editable-quantity-value"
                  contenteditable="true"
                  role="textbox"
                  inputmode="decimal"
                  aria-label="Ubah jumlah item untuk tampilan Delivery Order"
                  spellcheck="false"
                  @blur="updateDisplayItem(sourceIndex, 'qty', $event)"
                >{{ item.qty }}</span>
              </td>

              <td class="item-value-cell v-align-top">
                <span
                  class="editable-display-value editable-uom-value"
                  contenteditable="true"
                  role="textbox"
                  aria-label="Ubah satuan item untuk tampilan Delivery Order"
                  spellcheck="false"
                  @blur="updateDisplayItem(sourceIndex, 'uom', $event)"
                >{{ item.uom }}</span>
              </td>
            </tr>

            <tr
              v-for="row in emptyItemRows"
              :key="'do-empty-item-' + row"
              class="item-row item-row--empty"
              aria-hidden="true"
            >
              <td>&nbsp;</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <section class="signature-section page-break-section">
          <div class="signature-heading">Received by</div>

          <div class="receipt-fields">
            <div class="receipt-signature">
              <span class="receipt-label">Signature</span>
              <!-- <span class="signature-writing-line"></span> -->
            </div>

            <dl class="receipt-details">
              <div>
                <dt>Date</dt>
                <span class="receipt-separator" aria-hidden="true">:</span>
              </div>
              <div>
                <dt>Name</dt>
                <span class="receipt-separator" aria-hidden="true">:</span>
              </div>
              <div>
                <dt>Position</dt>
                <span class="receipt-separator" aria-hidden="true">:</span>
              </div>
            </dl>
          </div>
        </section>

        <section class="notes-section">
          <strong>Notes:</strong>
          <div class="notes-lines" aria-hidden="true">
            <span></span>
            <span></span>
          </div>
          <div class="document-footer">
            <span>{{ deliveryOrderNumber }}</span>
          </div>
        </section>
        </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
/* Delivery Order form layout */
.delivery-order-wrapper {
  box-sizing: border-box;
  width: 100%;
  padding: 0px 0 12px;
}

:global(.penawaran-content.delivery-order-pdf-unscaled) {
  transform: none !important;
}

.delivery-order-toolbar {
  box-sizing: border-box;
  display: flex;
  width: 210mm;
  max-width: 100%;
  min-height: 56px;
  margin: 6px auto 12px;
  padding: 8px;
  align-items: center;
  border: 1px solid rgba(203, 213, 225, 0.85);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(12px);
}

.document-actions {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.delivery-order-action {
  min-width: 0 !important;
  padding-inline: 14px !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  font-size: 11px !important;
  font-weight: 750 !important;
  letter-spacing: 0.01em !important;
  text-transform: none !important;
}

.delivery-order-action--print {
  color: #475569 !important;
}

.delivery-order-action--primary {
  box-shadow: 0 4px 10px rgba(49, 46, 129, 0.2) !important;
}

@media screen and (max-width: 600px) {
  .delivery-order-toolbar {
    min-height: 58px;
    margin-block: 6px 10px;
    padding: 8px;
    border-radius: 12px;
  }

  .document-actions {
    width: 100%;
    gap: 8px;
  }

  .delivery-order-action {
    height: 40px !important;
    flex: 1 1 0;
    padding-inline: 10px !important;
    font-size: 11px !important;
  }
}

.invoice-paper-wrapper {
  width: 210mm;
  max-width: none;
  margin: 0 auto;
}

.invoice-paper {
  box-sizing: border-box;
  width: 210mm;
  min-width: 210mm;
  max-width: 210mm;
  min-height: 297mm;
  margin: 0;
  padding: 8mm;
  overflow: visible;
  color: #111827;
  font-family: Arial, Helvetica, sans-serif;
  line-height: 1.25;
  background: #ffffff !important;
  border: 0;
  border-radius: 2px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.document-frame {
  display: flex;
  min-height: 281mm;
  flex-direction: column;
  border: 1.4px solid #172033;
}

.letterhead {
  color: #111827;
  font-family: Arial, Helvetica, sans-serif;
  border-bottom: 1.4px solid #172033;
}

.header-section {
  display: grid;
  min-height: fit-content;
  grid-template-columns: 54% 46%;
  align-items: stretch;
  padding: 0;
}

.company-panel {
  display: grid;
  grid-template-columns: 31mm minmax(0, 1fr);
  align-items: center;
  gap: 3mm;
  padding: 4mm;
}

.logo-wrapper img {
  display: block;
  width: 30mm;
  height: 16mm;
  object-fit: contain;
}

.letterhead-info {
  min-width: 0;
  text-align: left;
}

.company-name {
  margin: 0;
  color: #0c2748;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.25px;
  line-height: 1.1;
}

.address-line,
.phone-line {
  margin: 0;
  color: #334155;
  font-size: 8px;
  font-weight: 500;
  line-height: 1.4;
}

.phone-line {
  margin-top: 1.5mm;
}

.document-identity {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4mm 5mm;
  text-align: center;
  border-left: 1.4px solid #172033;
}

.document-kicker {
  margin-bottom: 1.5mm;
  color: #64748b;
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
}

.document-identity h2 {
  margin: 0 0 4mm;
  color: #101827;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.65px;
  line-height: 1;
}

.document-identity h2 span {
  font-size: 14px;
}

.document-meta {
  display: grid;
  gap: 1.5mm;
  margin: 0;
  text-align: left;
}

.document-meta div {
  display: grid;
  grid-template-columns: 22mm 3mm minmax(0, 1fr);
  align-items: baseline;
  font-size: 10px;
}

.document-meta dt {
  font-weight: 700;
}

.document-meta-separator {
  grid-column: 2;
  font-weight: 700;
}

.document-meta dd {
  grid-column: 3;
  margin: 0;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.content-body {
  display: flex;
  position: relative;
  flex: 1;
  flex-direction: column;
}

.party-grid {
  display: grid;
  min-height: fit-content;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  border-bottom: 1.2px solid #172033;
}

.party-panel + .party-panel {
  border-left: 1.2px solid #172033;
}

.panel-title {
  padding: 2mm 3mm;
  color: #172033;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  background: #eef2f6;
  border-bottom: 1px solid #172033;
}

.party-details {
  display: grid;
  gap: 1.2mm;
  margin: 0;
  padding: 2.2mm 4mm;
}

.party-details div {
  display: grid;
  grid-template-columns: 31mm 3mm minmax(0, 1fr);
  align-items: start;
  font-size: 10px;
}

.party-details dt {
  grid-column: 1;
}

.party-detail-separator {
  grid-column: 2;
  font-weight: 600;
}

.party-details dd {
  grid-column: 3;
  min-width: 0;
  margin: 0;

  line-height: 1.15;
  overflow-wrap: anywhere;
}

.subject-strip {
  display: grid;
  min-height: 10mm;
  grid-template-columns: 42mm minmax(0, 1fr);
  align-items: center;
  border-bottom: 1.2px solid #172033;
}

.subject-strip span,
.subject-strip strong {
  padding: 2.3mm 4mm;
  font-size: 10px;
}

.subject-strip span {
  align-self: stretch;
  display: flex;
  align-items: center;
  font-weight: 800;
  background: #eef2f6;
  border-right: 1px solid #172033;
}

.main-table {
  width: 100%;
  margin: 0;
  table-layout: fixed;
  border-collapse: collapse;
  border-spacing: 0;
}

.main-table th,
.main-table td {
  color: #111827;
  border: 0;
  border-right: 1px solid #172033;
  border-bottom: 1px solid #172033;
}

.main-table th:last-child,
.main-table td:last-child {
  border-right: 0;
}

.main-table th {
  padding: 1.5mm 2mm;
  font-size: 9.5px;
  font-weight: 800;
  text-align: center;
  text-transform: uppercase;
  background: #e8edf3 !important;
}

.main-table td {
  height: 9mm;
  padding: 1.4mm 2mm;
  font-size: 10px;
}

.main-table td:nth-child(2) {
  text-align: left;
}

.item-number-column {
  width: 8%;
}

.item-quantity-column {
  width: 17%;
}

.item-unit-column {
  width: 17%;
}

.item-number-cell,
.item-value-cell {
  text-align: center;
}

.item-row--empty td {
  height: 9mm;
}

.editable-display-value {
  min-width: 1.5em;
  border-radius: 2px;
  outline: 1px dashed transparent;
  outline-offset: 1px;
}

.editable-display-value:hover {
  background: #f1f5f9;
  outline-color: #94a3b8;
}

.editable-display-value:focus {
  background: #fffbea;
  outline-color: #475569;
}

.editable-description {
  display: block;
  width: 100%;
  min-height: 1.4em;
  margin: 0;
  overflow-wrap: break-word;
  font-kerning: normal;
  hyphens: none;
  letter-spacing: normal !important;
  line-height: 1.35;
  text-align: left !important;
  text-align-last: left !important;
  text-justify: none;
  white-space: normal;
  word-break: normal;
  word-spacing: normal !important;
}

.editable-quantity-value,
.editable-uom-value {
  display: inline-block;
}

.reference-section {
  border-bottom: 1.2px solid #172033;
}

.reference-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.reference-item {
  display: flex;
  min-width: 0;
  min-height: 14mm;
  flex-direction: column;
  justify-content: center;
  gap: 1mm;
  padding: 2.4mm 3mm;
  border-right: 1px solid #172033;
  border-bottom: 1px solid #172033;
}

.reference-item:nth-child(3n) {
  border-right: 0;
}

.reference-item:nth-last-child(-n + 3) {
  border-bottom: 0;
}

.reference-item span {
  color: #64748b;
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 0.35px;
  text-transform: uppercase;
}

.reference-item strong {
  font-size: 9.5px;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.signature-section {
  font-size: 10px;
  font-weight: 600;
  border-bottom: 1.2px solid #172033;
}

.signature-heading {
  padding: 2.2mm 2mm;
  text-align: center;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  background: #eef2f6;
  border-right: 0;
  border-bottom: 1px solid #172033;
}

.receipt-fields {
  display: grid;
  grid-template-columns: 36% 64%;
}

.receipt-signature {
  display: flex;
  min-height: 36mm;
  flex-direction: column;
  justify-content: space-between;
  padding: 2.5mm 3mm 3mm;
  border-right: 1px solid #172033;
}

.receipt-label {
  color: #64748b;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.35px;
  text-align: center;
  text-transform: uppercase;
}

.signature-writing-line {
  display: block;
  width: 100%;
  height: 1px;
  border-bottom: 1px solid #172033;
}

.receipt-details {
  display: grid;
  margin: 0;
}

.receipt-details div {
  display: grid;
  min-height: 8.6mm;
  grid-template-columns: 23mm 3mm minmax(0, 1fr);
  align-items: center;
  padding: 1.5mm 3mm;
  border-bottom: 1px solid #172033;
}

.receipt-details div:last-child {
  border-bottom: 0;
}

.receipt-details dt {
  font-size: 8.5px;
  font-weight: 800;
  text-transform: uppercase;
}

.receipt-separator {
  grid-column: 2;
  font-size: 8.5px;
  font-weight: 800;
}

.receipt-details dd {
  height: 4mm;
  grid-column: 3;
  margin: 0;
  border-bottom: 1px solid #172033;
}

.notes-section {
  display: flex;
  min-height: 25mm;
  flex: 1;
  flex-direction: column;
  padding: 3mm 4mm 2.5mm;
  font-size: 9px;
}

.notes-lines {
  display: grid;
  gap: 3mm;
  margin-top: 3mm;
}

.notes-lines span {
  display: block;
  border-bottom: 1px dotted #94a3b8;
}

.document-footer {
  display: flex;
  justify-content: flex-end;
  gap: 4mm;
  margin-top: auto;
  padding-top: 3mm;
  color: #64748b;
  font-size: 7px;
  letter-spacing: 0.1px;
}

.page-break-section {
  break-inside: avoid;
  page-break-inside: avoid;
}

@media screen and (max-width: 600px) {
  .invoice-paper-wrapper {
    margin: 0;
  }
}

@media print {
  html,
  body {
    width: 210mm;
    min-height: 297mm;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
  }

  .delivery-order-wrapper {
    padding: 0;
  }

  .invoice-paper-wrapper,
  .invoice-paper {
    width: 210mm !important;
    min-width: 210mm !important;
    max-width: 210mm !important;
    margin: 0 !important;
  }

  .invoice-paper {
    min-height: 297mm !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  .editable-display-value {
    background: transparent !important;
    outline: none !important;
  }

  @page {
    size: A4 portrait;
    margin: 8mm 0;
  }

  @page :first {
    margin: 0;
  }
}
</style>
