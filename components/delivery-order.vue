<script setup lang="ts">
import type { invoiceM } from "~/types/invoice";

const props = defineProps<{
  invoiceDetail: invoiceM;
}>();

const printArea = ref<HTMLElement | null>(null);
const isSavingPdf = ref(false);
const showInvoiceDate = ref(true);

type DeliveryOrderDisplayItem = Omit<
  invoiceM["item_pekerjaan"][number],
  "qty"
> & {
  qty: number | string;
};

const displayItems = ref<DeliveryOrderDisplayItem[]>([]);
const invoiceYear = computed(() => props.invoiceDetail.tanggal?.slice(0, 4));

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

  const date = new Date(tanggal);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(date)
    .replace(/\//g, "-");
};

const formatTanggalPanjang = (tanggal: string | undefined | null) => {
  if (!tanggal) return "-";

  const date = new Date(tanggal);

  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

function printDeliveryOrder() {
  const content = printArea.value;

  if (!content) return;

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    console.error("Tidak dapat membuka print window.");
    return;
  }

  /* Ambil semua CSS dari halaman */
  const styles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]'),
  )
    .map((style) => style.outerHTML)
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>

    <html>

      <head>

        <meta charset="UTF-8" />

        <title>
          Delivery Order
        </title>

        ${styles}

        <style>

          


          html,
          body {
            margin: 0 !important;
            padding: 0 !important;

            width: 100% !important;

            background: #ffffff !important;

            font-family: Arial, Helvetica, sans-serif;
          }


          


          .delivery-order-wrapper {
            width: 100% !important;

            margin: 0 !important;
            padding: 0 !important;
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

            padding: 15mm !important;

            box-sizing: border-box !important;

            background: #ffffff !important;

            border: none !important;

            border-radius: 0 !important;

            box-shadow: none !important;

            overflow: hidden !important;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }

          .main-table {
            page-break-inside: auto;
          }

          .main-table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }


          .signature-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

        </style>

      </head>


      <body>

        ${content.innerHTML}


        <script>

          window.onload = function () {

            setTimeout(function () {

              window.print();

            }, 300);

          };


          window.onafterprint = function () {

            window.close();

          };

        <\/script>

      </body>

    </html>
  `);

  printWindow.document.close();
}

type PdfTextFragment = {
  text: string;
  left: number;
  top: number;
  height: number;
  baseline: number;
  fontSizePx: number;
  fontWeight: number;
  isItalic: boolean;
  color: [number, number, number];
  alignment: "left" | "center";
};

const parseCssColor = (value: string): [number, number, number] => {
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  return channels?.length === 3
    ? [channels[0], channels[1], channels[2]]
    : [0, 0, 0];
};

const applyTextTransform = (text: string, transform: string) => {
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  if (transform === "capitalize") {
    return text.replace(/(^|\s)\S/g, (character) => character.toUpperCase());
  }
  return text;
};

// Teks ditulis kembali sebagai teks native jsPDF agar tetap tajam ketika
// diperbesar. Canvas hanya menyimpan logo, garis, border, dan background.
const extractPdfTextFragments = (root: Element): PdfTextFragment[] => {
  const rootRect = root.getBoundingClientRect();
  const fragments: PdfTextFragment[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  let textNode = walker.nextNode() as Text | null;
  while (textNode) {
    const parent = textNode.parentElement;
    const sourceText = textNode.data;
    if (parent && sourceText.trim() && !parent.closest(".no-print")) {
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
            const isCentered = style.textAlign === "center";

            fragments.push({
              text: applyTextTransform(normalizedText, style.textTransform),
              left: isCentered
                ? parent.getBoundingClientRect().left -
                  rootRect.left +
                  parent.getBoundingClientRect().width / 2
                : visibleCharacters[0].rect.left - rootRect.left,
              top: lineTop - rootRect.top,
              height: lineBottom - lineTop,
              baseline: lineTop - rootRect.top + (lineBottom - lineTop) * 0.8,
              fontSizePx,
              fontWeight: Number.parseInt(style.fontWeight, 10) || 400,
              isItalic: style.fontStyle === "italic",
              color: parseCssColor(style.color),
              alignment: isCentered ? "center" : "left",
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
};

const createPaginatedDeliveryOrderPdf = async () => {
  const paperElement = printArea.value?.querySelector<HTMLElement>(
    ".invoice-paper",
  );
  const letterheadElement = paperElement?.querySelector<HTMLElement>(
    ".letterhead",
  );
  const contentElement = paperElement?.querySelector<HTMLElement>(
    ".content-body",
  );

  if (!paperElement || !letterheadElement || !contentElement) return null;

  const previewContainer = paperElement.closest<HTMLElement>(
    ".penawaran-content",
  );
  previewContainer?.classList.add("delivery-order-pdf-unscaled");
  paperElement.classList.add("delivery-order-pdf-capture");
  void paperElement.offsetHeight;

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    await document.fonts?.ready;

    const letterheadRect = letterheadElement.getBoundingClientRect();
    const contentRect = contentElement.getBoundingClientRect();
    const letterheadTextFragments = extractPdfTextFragments(letterheadElement);
    const contentTextFragments = extractPdfTextFragments(contentElement);

    const preparePrintClone = (clonedDocument: Document) => {
      clonedDocument.querySelectorAll(".no-print").forEach((element) => {
        (element as HTMLElement).style.display = "none";
      });
      clonedDocument
        .querySelectorAll(".main-table tbody tr")
        .forEach((element) => {
          (element as HTMLElement).style.breakInside = "avoid";
          (element as HTMLElement).style.pageBreakInside = "avoid";
        });
      clonedDocument
        .querySelectorAll(".editable-display-value")
        .forEach((element) => {
          const htmlElement = element as HTMLElement;
          htmlElement.style.setProperty("background", "transparent", "important");
          htmlElement.style.setProperty("outline", "none", "important");
        });

      clonedDocument
        .querySelectorAll(".invoice-paper *")
        .forEach((element) => {
          const htmlElement = element as HTMLElement;
          htmlElement.style.setProperty("color", "transparent", "important");
          htmlElement.style.setProperty(
            "-webkit-text-fill-color",
            "transparent",
            "important",
          );
          htmlElement.style.setProperty("text-shadow", "none", "important");
        });
    };

    const isSmallViewport = window.matchMedia("(max-width: 600px)").matches;
    const requestedCaptureScale = isSmallViewport ? 2 : 3;
    const maxContentCanvasPixels = isSmallViewport ? 12_000_000 : 40_000_000;
    const safeContentScale = Math.sqrt(
      maxContentCanvasPixels / (contentRect.width * contentRect.height),
    );
    const captureScale = Math.max(
      1,
      Math.min(requestedCaptureScale, safeContentScale),
    );
    const captureOptions = {
      scale: captureScale,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: preparePrintClone,
    };

    const [letterheadCanvas, contentCanvas] = await Promise.all([
      html2canvas(letterheadElement, captureOptions),
      html2canvas(contentElement, captureOptions),
    ]);

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
    const sideMargin = 15;
    const topMargin = 10;
    const bottomMargin = 15;
    const contentWidth = pageWidth - sideMargin * 2;
    const letterheadHeight =
      (letterheadCanvas.height * contentWidth) / letterheadCanvas.width;
    const contentTop = topMargin + letterheadHeight + 4;
    const printableContentHeight = pageHeight - bottomMargin - contentTop;
    const pixelsPerMm = contentCanvas.width / contentWidth;
    const pageSliceHeight = Math.floor(printableContentHeight * pixelsPerMm);

    const drawPdfTextFragments = (
      fragments: PdfTextFragment[],
      originX: number,
      originY: number,
      mmPerCssPixel: number,
      sourceTop = 0,
      sourceBottom = Number.POSITIVE_INFINITY,
    ) => {
      fragments.forEach((fragment) => {
        const fragmentMiddle = fragment.top + fragment.height / 2;
        if (fragmentMiddle < sourceTop || fragmentMiddle >= sourceBottom) return;

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
        pdf.text(
          fragment.text,
          originX + fragment.left * mmPerCssPixel,
          originY + (fragment.baseline - sourceTop) * mmPerCssPixel,
          { align: fragment.alignment },
        );
      });
    };

    const canvasScale = contentCanvas.width / contentRect.width;
    const keepTogetherRanges: Array<{ top: number; bottom: number }> = [];
    contentElement
      .querySelectorAll(".main-table tbody tr, .info-section, .signature-section")
      .forEach((element) => {
        const rect = element.getBoundingClientRect();
        const range = {
          top: Math.floor((rect.top - contentRect.top) * canvasScale) - 2,
          bottom: Math.ceil((rect.bottom - contentRect.top) * canvasScale) + 2,
        };
        if (range.bottom - range.top <= pageSliceHeight) {
          keepTogetherRanges.push(range);
        }
      });

    const toLosslessPdfImage = (canvas: HTMLCanvasElement) =>
      canvas.toDataURL("image/png");
    const letterheadImage = toLosslessPdfImage(letterheadCanvas);

    const addPageFrame = () => {
      pdf.addImage(
        letterheadImage,
        "PNG",
        sideMargin,
        topMargin,
        contentWidth,
        letterheadHeight,
        "delivery-order-letterhead",
        "SLOW",
      );
      drawPdfTextFragments(
        letterheadTextFragments,
        sideMargin,
        topMargin,
        contentWidth / letterheadRect.width,
        0,
        letterheadRect.height,
      );
    };

    const createContentSlice = (sliceStart: number, sliceHeight: number) => {
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = contentCanvas.width;
      sliceCanvas.height = sliceHeight;
      sliceCanvas
        .getContext("2d")
        ?.drawImage(
          contentCanvas,
          0,
          sliceStart,
          contentCanvas.width,
          sliceHeight,
          0,
          0,
          contentCanvas.width,
          sliceHeight,
        );
      return sliceCanvas;
    };

    let sourceY = 0;
    let pageIndex = 0;
    while (sourceY < contentCanvas.height) {
      const remainingHeight = contentCanvas.height - sourceY;
      const finalPageScale = Math.min(1, pageSliceHeight / remainingHeight);

      if (finalPageScale >= 0.92) {
        if (pageIndex > 0) pdf.addPage();

        const finalPageCanvas = createContentSlice(sourceY, remainingHeight);
        const fittedContentWidth = contentWidth * finalPageScale;
        const fittedContentHeight =
          (remainingHeight / pixelsPerMm) * finalPageScale;

        addPageFrame();
        pdf.addImage(
          toLosslessPdfImage(finalPageCanvas),
          "PNG",
          sideMargin + (contentWidth - fittedContentWidth) / 2,
          contentTop,
          fittedContentWidth,
          fittedContentHeight,
          `delivery-order-content-${pageIndex}`,
          "SLOW",
        );
        drawPdfTextFragments(
          contentTextFragments,
          sideMargin + (contentWidth - fittedContentWidth) / 2,
          contentTop,
          (contentWidth / contentRect.width) * finalPageScale,
          sourceY / canvasScale,
          contentCanvas.height / canvasScale,
        );
        break;
      }

      let targetY = Math.min(sourceY + pageSliceHeight, contentCanvas.height);
      const crossingRange = keepTogetherRanges.find(
        (range) =>
          range.top > sourceY &&
          range.top < targetY &&
          range.bottom > targetY,
      );
      if (crossingRange) targetY = crossingRange.top;
      if (pageIndex > 0) pdf.addPage();

      const sliceHeight = targetY - sourceY;
      const sliceCanvas = createContentSlice(sourceY, sliceHeight);
      addPageFrame();
      pdf.addImage(
        toLosslessPdfImage(sliceCanvas),
        "PNG",
        sideMargin,
        contentTop,
        contentWidth,
        sliceHeight / pixelsPerMm,
        `delivery-order-content-${pageIndex}`,
        "SLOW",
      );
      drawPdfTextFragments(
        contentTextFragments,
        sideMargin,
        contentTop,
        contentWidth / contentRect.width,
        sourceY / canvasScale,
        targetY / canvasScale,
      );

      sourceY = targetY;
      pageIndex++;
    }

    return pdf;
  } finally {
    paperElement.classList.remove("delivery-order-pdf-capture");
    previewContainer?.classList.remove("delivery-order-pdf-unscaled");
  }
};

const handleSavePdf = async () => {
  if (isSavingPdf.value) return;
  isSavingPdf.value = true;

  try {
    const pdf = await createPaginatedDeliveryOrderPdf();
    if (!pdf) return;

    pdf.save(`DO-DRM-${props.invoiceDetail.perihal}.pdf`);
  } catch (error) {
    console.error("Gagal menyimpan PDF Delivery Order:", error);
    useNotificationStore().showError("Gagal membuat PDF Delivery Order");
  } finally {
    isSavingPdf.value = false;
  }
};
</script>

<template>
  <div class="delivery-order-wrapper">
    <div ref="printArea" class="invoice-paper-wrapper">
      <v-card width="850" class="pa-10 invoice-paper elevation-2 mx-auto">
        <!-- HEADER -->

        <div class="letterhead">
          <div class="header-section">
            <div class="logo-wrapper">
              <img width="160" src="/logokopsurat.png" alt="Logo Header" />
            </div>

            <div class="letterhead-info">
              <h1 class="company-name">PT. DUTA RAYA MARINE</h1>
              <p class="address-line">
                <!-- Cipta Grand City G-8, Sagulung, Kota Batam, <br />
                Kepulauan Riau 29425. -->
                Ruko Dreamland H3 No. 05, Tanjung Riau,<br />
               Sekupang, Kota Batam, Kepulauan Riau.
                <br />
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
                E-mail: sales@dutarayamarine.com 
                Phone/WhatsApp : +62823-8450-3953 <br />
                Website: www.dutarayamarine.com
              </p>
            </div>

            <div class="header-spacer" aria-hidden="true"></div>
          </div>

          <div class="header-divider">
            <div class="accent-bar"></div>
            <div class="secondary-bar"></div>
          </div>
        </div>

        <div class="content-body">
          <div class="document-title text-center mt-4 mb-6">DELIVERY ORDER</div>

        <!-- =========================================
             CUSTOMER / INVOICE INFO
        ========================================== -->

        <div class="info-section mb-6">
          <table class="info-table">
            <tbody>
              <tr>
                <td width="140">Company Name</td>

                <td width="15">:</td>

                <td>
                  {{ invoiceDetail.nama_customer }}
                </td>
              </tr>

              <tr>
                <td style="vertical-align: top">Address</td>

                <td style="vertical-align: top">:</td>

                <td style="vertical-align: top">
                  {{ invoiceDetail.alamat_customer }}
                </td>
              </tr>

              <tr>
                <td>Quotation No.</td>

                <td>:</td>

                <td>{{ invoiceDetail.no_penawaran }}</td>
              </tr>

              <tr>
                <td>PO No.</td>

                <td>:</td>

                <td>{{ invoiceDetail.no_preorder }}</td>
              </tr>

              <tr>
                <td>Invoice No.</td>

                <td>:</td>

                <td>INV/DRM/{{ invoiceYear }}/{{ invoiceDetail.no_inv }}</td>
              </tr>

              <tr>
                <td>Vessel</td>

                <td>:</td>

                <td>
                  {{ (invoiceDetail as any).vessel || "-" }}
                </td>
              </tr>

              <tr>
                <td>Location</td>

                <td>:</td>

                <td> {{ invoiceDetail.location }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- =========================================
             ITEM TABLE
        ========================================== -->

        <table class="main-table mb-6">
          <thead>
            <tr>
              <th width="4%" class="text-center">No</th>

              <th width="47%">Desc</th>

              <th width="15%" class="text-center">Qty</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(item, index) in displayItems"
              :key="'do-item-' + index"
            >
              <td class="text-center v-align-top" v-if="item.kategori_item == 'Barang' || item.kategori_item == 'Barang & Jasa'">{{ index + 1 }}.</td>

              <td class="v-align-top" v-if="item.kategori_item == 'Barang' || item.kategori_item == 'Barang & Jasa'">
                <div
                  class="editable-display-value editable-description"
                  contenteditable="true"
                  role="textbox"
                  aria-label="Ubah deskripsi item untuk tampilan Delivery Order"
                  spellcheck="false"
                  @blur="updateDisplayItem(index, 'nama', $event)"
                >{{ item.nama }}</div>
              </td>

              <td class="text-center v-align-top" v-if="item.kategori_item == 'Barang' || item.kategori_item == 'Barang & Jasa'">
                <div class="editable-quantity">
                  <span
                    class="editable-display-value editable-quantity-value"
                    contenteditable="true"
                    role="textbox"
                    inputmode="decimal"
                    aria-label="Ubah jumlah item untuk tampilan Delivery Order"
                    spellcheck="false"
                    @blur="updateDisplayItem(index, 'qty', $event)"
                  >{{ item.qty }}</span>
                  <span
                    class="editable-display-value editable-uom-value"
                    contenteditable="true"
                    role="textbox"
                    aria-label="Ubah satuan item untuk tampilan Delivery Order"
                    spellcheck="false"
                    @blur="updateDisplayItem(index, 'uom', $event)"
                  >{{ item.uom }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- =========================================
             SIGNATURE
        ========================================== -->

        <div class="signature-section mt-6 page-break-section">
          <div class="mb-4 text-caption">
            Received by :
            <span v-if="showInvoiceDate">
              {{ formatTanggalPanjang(invoiceDetail.tanggal) }}
            </span>
            <v-chip
              class="no-print ml-2 date-visibility-chip"
              size="x-small"
              variant="outlined"
              :prepend-icon="showInvoiceDate ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              @click="showInvoiceDate = !showInvoiceDate"
            >
              {{ showInvoiceDate ? "Hide tanggal" : "Show tanggal" }}
            </v-chip>
            <!-- ___ / __________ / 20___ -->
          </div>

          <div class="stamp-box mb-3"></div>

          <div class="received-details">
            <div class="d-flex align-center mb-1">
              <span class="label-field"> Name </span>

              <span>
                : ...........................................................
              </span>
            </div>

            <div class="d-flex align-center">
              <span class="label-field"> Date </span>

              <span>
                : ...........................................................
              </span>
            </div>
          </div>
        </div>
        </div>
      </v-card>
    </div>
    <div class="no-print action-bar d-flex justify-center gap-2 mt-4">

       <v-btn
        color="primary"
        variant="elevated"
        prepend-icon="mdi-printer"

        @click="printDeliveryOrder"
      >
        Cetak Delivery Order
      </v-btn>

       <v-btn
        color="red"
        variant="elevated"
        prepend-icon="mdi-file-pdf-box"
        :loading="isSavingPdf"
        class="ml-2"
        @click="handleSavePdf"
      >
        Save PDF Delivery Order
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.delivery-order-wrapper {
  width: 100%;
  margin-top: 20px;
}

:global(.penawaran-content.delivery-order-pdf-unscaled) {
  transform: none !important;
}

.action-bar {
  width: 100%;
  max-width: 850px;

  margin: 0 auto;
}

.invoice-paper-wrapper {
  width: 100%;
}

.invoice-paper {
  font-family: Arial, Helvetica, sans-serif;

  color: #000;

  line-height: 1.4;

  background-color: #fff !important;
}

.content-body {
  position: relative;
}

.invoice-paper.delivery-order-pdf-capture .no-print {
  display: none !important;
}

.letterhead {
  color: #1e293b;
  font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
}

.header-section {
  display: grid;
  grid-template-columns: 130px minmax(0, 1fr) 130px;
  position: relative;
  z-index: 1;
  align-items: center;
  padding: 2px 0 8px;
}

.logo-wrapper img {
  display: block;
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
  font-size: 9.5px;
  line-height: 1.4;
}

.header-divider {
  display: flex;
  margin-top: 6px;
  margin-bottom: 6px;
  flex-direction: column;
  gap: 2px;
}

.accent-bar {
  width: 100%;
  height: 4px;
  background-color: #061b3c;
  border-radius: 2px;
}

.secondary-bar {
  width: 100%;
  height: 1px;
  background-color: #cbd5e1;
}

.document-title {
  font-size: 18px;

  font-weight: bold;

  letter-spacing: 1px;

  text-decoration: underline;
}

.info-table {
  width: 100%;

  border-collapse: collapse;

  font-size: 13px;
}

.info-table td {
  padding: 2px 0;

  font-weight: 600;
}

.main-table {
  width: 100%;

  border-collapse: collapse;
}

.main-table th {
  border: 1px solid #000;

  padding: 6px 8px;

  font-weight: bold;

  font-size: 13px;

  text-align: left;

  background-color: transparent !important;
}

.main-table td {
  border: 1px solid #000;

  padding: 6px 8px;

  font-size: 13px;
}

.v-align-top {
  vertical-align: top !important;
}

.editable-display-value {
  min-width: 1.5em;
  border-radius: 3px;
  outline: 1px dashed transparent;
  outline-offset: 2px;
  cursor: text;
  transition: background-color 0.15s ease, outline-color 0.15s ease;
}

.editable-display-value:hover {
  background-color: #f7f7f7;
  outline-color: #bdbdbd;
}

.editable-display-value:focus {
  background-color: #fffde7;
  outline-color: #757575;
}

.editable-description {
  min-height: 1.4em;
  white-space: pre-line;
}

.editable-quantity {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.editable-quantity-value,
.editable-uom-value {
  display: inline-block;
}

.date-visibility-chip {
  vertical-align: middle;
  cursor: pointer;
}

.signature-section {
  font-size: 13px;

  font-weight: 600;
}

.stamp-box {
  width: 220px;

  height: 100px;

  border: 1px solid #000;
}

.label-field {
  width: 50px;

  display: inline-block;
}

.page-break-section {
  page-break-inside: avoid;

  break-inside: avoid;
}

@media screen {
  .invoice-paper {
    background: #fff !important;
  }
}

@media print {
  @page {
    size: A4 portrait;

    margin: 0;
  }

  .no-print {
    display: none !important;
  }

  .invoice-paper {
    box-shadow: none !important;

    border: none !important;
  }

  .editable-display-value {
    background: transparent !important;
    outline: none !important;
  }
}
</style>
