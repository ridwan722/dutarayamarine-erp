<template>
  <div class="service-report-canvas">
    <div ref="previewViewport" class="service-report-preview">
      <div class="service-report-scale" :style="{ zoom: previewZoom }">
        <div ref="reportPagesElement" class="service-report-pages">
          <article
            v-for="(page, pageIndex) in reportPages"
            :key="page.id"
            :data-report-page="pageIndex"
            class="service-report-paper"
          >
            <ServiceReportLetterhead />

            <div v-if="pageIndex === 0" class="report-first-page-intro">
              <h1 class="report-title">SERVICE REPORT</h1>
              <table class="report-metadata">
                <tbody>
                  <tr v-for="row in metadataRows" :key="row.label">
                    <th>{{ row.label }}</th>
                    <td class="metadata-separator">:</td>
                    <td>{{ row.value || "—" }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="report-page-blocks">
              <div
                v-for="block in page.blocks"
                :key="block.key"
                class="report-page-block"
                :class="{
                  'report-page-block--continuation':
                    block.type === 'section' && block.continuation,
                  'report-page-block--image-row': block.type === 'image-row',
                }"
                :style="imageRowStyle(block)"
              >
                <ServiceReportContentBlock :block="block" />
                <button
                  v-if="editable && block.type === 'image-row'"
                  type="button"
                  class="report-image-resize-handle no-print"
                  aria-label="Atur tinggi baris foto"
                  title="Geser ke atas atau bawah untuk mengatur tinggi foto"
                  @pointerdown="startImageResize($event, block)"
                >
                  <span />
                </button>
              </div>
            </div>

            <div class="report-bottom-line" />
          </article>
        </div>

        <div
          ref="paginationMeasure"
          class="report-pagination-measure"
          aria-hidden="true"
        >
          <div ref="measureLetterhead" class="pagination-letterhead">
            <ServiceReportLetterhead />
          </div>
          <div ref="measureFirstPageIntro" class="report-first-page-intro">
            <h1 class="report-title">SERVICE REPORT</h1>
            <table class="report-metadata">
              <tbody>
                <tr v-for="row in metadataRows" :key="row.label">
                  <th>{{ row.label }}</th>
                  <td class="metadata-separator">:</td>
                  <td>{{ row.value || "—" }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            v-for="block in renderBlocks"
            :key="block.key"
            :ref="(element) => setMeasurementRef(block.key, element)"
            class="pagination-block-measure"
            :style="imageRowStyle(block)"
          >
            <ServiceReportContentBlock :block="block" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="showActions" class="service-report-actions no-print">
      <v-btn
        prepend-icon="mdi-printer-outline"
        color="indigo-darken-3"
        variant="flat"
        class="text-none"
        :loading="isPrinting"
        :disabled="isPrinting || isSavingPdf"
        @click="printReport"
      >
        Print Service Report
      </v-btn>
      <v-btn
        prepend-icon="mdi-file-pdf-box"
        color="red-darken-2"
        variant="flat"
        class="text-none"
        :loading="isSavingPdf"
        :disabled="isPrinting || isSavingPdf"
        @click="savePdf"
      >
        Save PDF
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComponentPublicInstance,
} from "vue";
import ServiceReportContentBlock from "./ServiceReport/content-block.vue";
import ServiceReportLetterhead from "./ServiceReport/letterhead.vue";
import type {
  invoiceM,
  serviceReportImageM,
  serviceReportM,
  serviceReportRenderBlockM,
  serviceReportSectionM,
} from "~/types/invoice";

const props = withDefaults(
  defineProps<{
    serviceReport: serviceReportM;
    invoice?: invoiceM | null;
    showActions?: boolean;
    editable?: boolean;
  }>(),
  { invoice: null, showActions: true, editable: false },
);

const emit = defineEmits<{
  "update:image-row-height": [blockId: string, height: number];
}>();

type ReportPage = {
  id: string;
  blocks: serviceReportRenderBlockM[];
};

type PdfTextFragment = {
  text: string;
  left: number;
  baseline: number;
  fontSizePx: number;
  fontWeight: number;
  isItalic: boolean;
  color: [number, number, number];
  alignment: "left" | "center" | "right";
};

const PAPER_HEIGHT_PX = 1123;
const PAPER_PADDING_TOP_PX = 26;
const PAPER_PADDING_BOTTOM_PX = 54;
const CONTENT_BLOCK_GAP_PX = 16;
const DEFAULT_IMAGE_ROW_HEIGHT = 170;
const MIN_IMAGE_ROW_HEIGHT = 100;
const MAX_IMAGE_ROW_HEIGHT = 520;

const previewViewport = ref<HTMLElement | null>(null);
const reportPagesElement = ref<HTMLElement | null>(null);
const paginationMeasure = ref<HTMLElement | null>(null);
const measureLetterhead = ref<HTMLElement | null>(null);
const measureFirstPageIntro = ref<HTMLElement | null>(null);
const previewZoom = ref(1);
const reportPages = ref<ReportPage[]>([
  { id: "service-report-page-1", blocks: [] },
]);
const isSavingPdf = ref(false);
const isPrinting = ref(false);
const measurementElements = new Map<string, HTMLElement>();
let resizeObserver: ResizeObserver | null = null;
let paginationFrame: number | null = null;
let activeImageResize:
  | {
      pointerId: number;
      blockId: string;
      startY: number;
      startHeight: number;
      previousCursor: string;
      previousUserSelect: string;
    }
  | undefined;

const metadataRows = computed(() => [
  { label: "Vessel / Project", value: props.serviceReport.vesselProject },
  { label: "Attention", value: props.serviceReport.attention },
  { label: "Location", value: props.serviceReport.location },
  { label: "Service Period", value: formatServicePeriod() },
  { label: "Scope of Work", value: props.serviceReport.scopeOfWork },
  { label: "Report No", value: props.serviceReport.reportNo },
]);

function sectionHasContent(section: serviceReportSectionM) {
  return Boolean(
    section.point?.trim() ||
      section.sub?.trim() ||
      section.items?.some((item) => item?.trim()),
  );
}

const orderedContentBlocks = computed<serviceReportRenderBlockM[]>(() => {
  const sections = (props.serviceReport.sections || []).filter(sectionHasContent);
  const sectionById = new Map(
    sections.map((section) => [section.id, section] as const),
  );
  const imageById = new Map(
    (props.serviceReport.images || []).map(
      (image) => [image.id, image] as const,
    ),
  );
  const usedSectionIds = new Set<string>();
  const usedImageIds = new Set<string>();
  const blocks: serviceReportRenderBlockM[] = [];

  (props.serviceReport.contentBlocks || []).forEach((block) => {
    if (block.type === "section") {
      const section = sectionById.get(block.sectionId);
      if (!section || usedSectionIds.has(section.id)) return;
      usedSectionIds.add(section.id);
      blocks.push({
        key: block.id,
        type: "section",
        section,
        sectionId: section.id,
        pointNumber: 0,
        itemOffset: 0,
        showHeader: true,
        continuation: false,
      });
      return;
    }

    const images = (block.imageIds || [])
      .map((imageId) => imageById.get(imageId))
      .filter((image): image is serviceReportImageM => {
        if (!image || usedImageIds.has(image.id)) return false;
        usedImageIds.add(image.id);
        return true;
      })
      .slice(0, 3);
    if (images.length) {
      blocks.push({
        key: block.id,
        type: "image-row",
        blockId: block.id,
        images,
        height: normalizeImageRowHeight(block.height),
      });
    }
  });

  sections.forEach((section) => {
    if (!usedSectionIds.has(section.id)) {
      blocks.push({
        key: `legacy-section-${section.id}`,
        type: "section",
        section,
        sectionId: section.id,
        pointNumber: 0,
        itemOffset: 0,
        showHeader: true,
        continuation: false,
      });
    }
  });

  const remainingImages = (props.serviceReport.images || []).filter(
    (image) => !usedImageIds.has(image.id),
  );
  for (let index = 0; index < remainingImages.length; index += 3) {
    blocks.push({
      key: `legacy-image-row-${index / 3}`,
      type: "image-row",
      blockId: `legacy-image-row-${index / 3}`,
      images: remainingImages.slice(index, index + 3),
      height: DEFAULT_IMAGE_ROW_HEIGHT,
    });
  }

  let pointNumber = 0;
  const numberedBlocks = blocks.map((block) => {
    if (block.type !== "section") return block;
    pointNumber += 1;
    return { ...block, pointNumber };
  });

  return numberedBlocks.flatMap((block) => {
    if (block.type !== "section") return [block];
    const items = (block.section.items || []).filter((item) => item?.trim());
    if (!items.length) return [block];
    return items.map(
      (item, itemIndex): serviceReportRenderBlockM => ({
        ...block,
        key: `${block.key}-item-${itemIndex}`,
        section: { ...block.section, items: [item] },
        itemOffset: itemIndex,
        showHeader: itemIndex === 0,
        continuation: itemIndex > 0,
      }),
    );
  });
});

const renderBlocks = computed<serviceReportRenderBlockM[]>(() => [
  ...orderedContentBlocks.value,
  { key: "signatures", type: "signatures" },
]);

function normalizeImageRowHeight(height?: number) {
  return Math.round(
    Math.min(
      MAX_IMAGE_ROW_HEIGHT,
      Math.max(MIN_IMAGE_ROW_HEIGHT, Number(height) || DEFAULT_IMAGE_ROW_HEIGHT),
    ),
  );
}

function imageRowStyle(block: serviceReportRenderBlockM) {
  return block.type === "image-row"
    ? { "--service-report-image-row-height": `${block.height}px` }
    : undefined;
}

function handleImageResize(event: PointerEvent) {
  if (!activeImageResize || event.pointerId !== activeImageResize.pointerId)
    return;
  event.preventDefault();
  const height = normalizeImageRowHeight(
    activeImageResize.startHeight +
      (event.clientY - activeImageResize.startY) / previewZoom.value,
  );
  emit("update:image-row-height", activeImageResize.blockId, height);
}

function stopImageResize(event?: PointerEvent) {
  if (
    event &&
    activeImageResize &&
    event.pointerId !== activeImageResize.pointerId
  ) {
    return;
  }
  window.removeEventListener("pointermove", handleImageResize);
  window.removeEventListener("pointerup", stopImageResize);
  window.removeEventListener("pointercancel", stopImageResize);
  if (activeImageResize) {
    document.body.style.cursor = activeImageResize.previousCursor;
    document.body.style.userSelect = activeImageResize.previousUserSelect;
  }
  activeImageResize = undefined;
}

function startImageResize(
  event: PointerEvent,
  block: Extract<serviceReportRenderBlockM, { type: "image-row" }>,
) {
  if (event.button !== 0) return;
  event.preventDefault();
  stopImageResize();
  activeImageResize = {
    pointerId: event.pointerId,
    blockId: block.blockId,
    startY: event.clientY,
    startHeight: block.height,
    previousCursor: document.body.style.cursor,
    previousUserSelect: document.body.style.userSelect,
  };
  document.body.style.cursor = "ns-resize";
  document.body.style.userSelect = "none";
  window.addEventListener("pointermove", handleImageResize, { passive: false });
  window.addEventListener("pointerup", stopImageResize);
  window.addEventListener("pointercancel", stopImageResize);
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatServicePeriod() {
  const start = formatDate(props.serviceReport.servicePeriodStart);
  const end = formatDate(props.serviceReport.servicePeriodEnd);
  if (!start && !end) return "—";
  if (!end || start === end) return start || end;
  return `${start} – ${end}`;
}

function setMeasurementRef(
  key: string,
  element: Element | ComponentPublicInstance | null,
) {
  if (element instanceof HTMLElement) measurementElements.set(key, element);
  else measurementElements.delete(key);
}

function paginateReport() {
  const letterheadHeight = measureLetterhead.value?.offsetHeight || 0;
  const firstIntroHeight = measureFirstPageIntro.value?.offsetHeight || 0;
  if (!letterheadHeight || !firstIntroHeight) return;

  const innerHeight =
    PAPER_HEIGHT_PX - PAPER_PADDING_TOP_PX - PAPER_PADDING_BOTTOM_PX - 2;
  const pageCapacities = [
    Math.max(0, innerHeight - letterheadHeight - firstIntroHeight),
    Math.max(0, innerHeight - letterheadHeight),
  ];
  const pages: serviceReportRenderBlockM[][] = [[]];
  let pageIndex = 0;
  let usedHeight = 0;

  renderBlocks.value.forEach((block) => {
    const blockHeight = measurementElements.get(block.key)?.offsetHeight || 0;
    const currentPage = pages[pageIndex];
    const continuationGap =
      block.type === "section" && block.continuation ? 2 : CONTENT_BLOCK_GAP_PX;
    const blockGap = currentPage.length ? continuationGap : 0;
    const capacity = pageIndex === 0 ? pageCapacities[0] : pageCapacities[1];

    if (blockHeight && usedHeight + blockGap + blockHeight > capacity) {
      pageIndex += 1;
      pages.push([]);
      usedHeight = 0;
    }

    const targetPage = pages[pageIndex];
    const targetGap = targetPage.length ? continuationGap : 0;
    targetPage.push(block);
    usedHeight += targetGap + blockHeight;
  });

  reportPages.value = pages.map((blocks, index) => ({
    id: `service-report-page-${index + 1}`,
    blocks,
  }));
}

function schedulePagination() {
  if (!import.meta.client || paginationFrame !== null) return;
  paginationFrame = window.requestAnimationFrame(async () => {
    paginationFrame = null;
    await nextTick();
    paginateReport();
  });
}

function updatePreviewZoom() {
  const width = previewViewport.value?.clientWidth || 794;
  previewZoom.value = Math.min(1, Math.max(0.36, (width - 24) / 794));
}

function parseCssColor(value: string): [number, number, number] {
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  return channels?.length === 3
    ? [channels[0], channels[1], channels[2]]
    : [17, 24, 39];
}

function applyTextTransform(text: string, transform: string) {
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  if (transform === "capitalize") {
    return text.replace(/(^|\s)\S/g, (character) => character.toUpperCase());
  }
  return text;
}

function extractPdfTextFragments(root: HTMLElement): PdfTextFragment[] {
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
            lastVisible -= 1;
          }
          if (firstVisible >= 0 && lastVisible >= firstVisible) {
            const visible = currentLine.slice(firstVisible, lastVisible + 1);
            const lineTop = Math.min(...visible.map(({ rect }) => rect.top));
            const lineBottom = Math.max(...visible.map(({ rect }) => rect.bottom));
            const firstRect = visible[0].rect;
            const lastRect = visible[visible.length - 1].rect;
            const alignment =
              style.textAlign === "right" || style.textAlign === "end"
                ? "right"
                : style.textAlign === "center"
                  ? "center"
                  : "left";
            const left =
              alignment === "right"
                ? lastRect.right - rootRect.left
                : alignment === "center"
                  ? (firstRect.left + lastRect.right) / 2 - rootRect.left
                  : firstRect.left - rootRect.left;
            fragments.push({
              text: applyTextTransform(
                visible
                  .map(({ character }) => character)
                  .join("")
                  .replace(/\s+/g, " "),
                style.textTransform,
              ),
              left,
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

        for (let index = 0; index < sourceText.length; index += 1) {
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

async function waitForImages(root: HTMLElement) {
  await Promise.all(
    Array.from(root.querySelectorAll("img")).map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) return resolve();
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

async function createServiceReportPdf() {
  if (!reportPagesElement.value) return null;
  const previousZoom = previewZoom.value;
  previewZoom.value = 1;

  try {
    await nextTick();
    paginateReport();
    await nextTick();
    await document.fonts?.ready;
    await waitForImages(reportPagesElement.value);

    const pages = Array.from(
      reportPagesElement.value.querySelectorAll<HTMLElement>(
        ".service-report-paper",
      ),
    );
    if (!pages.length) return null;

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
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

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
      const page = pages[pageIndex];
      const pageRect = page.getBoundingClientRect();
      const textFragments = extractPdfTextFragments(page);
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone(clonedDocument) {
          const clonedPage = clonedDocument.querySelector<HTMLElement>(
            `[data-report-page="${pageIndex}"]`,
          );
          if (clonedPage) {
            clonedPage.style.boxShadow = "none";
            clonedPage.style.borderColor = "transparent";
            clonedPage
              .querySelectorAll<HTMLElement>(".no-print")
              .forEach((element) => element.remove());
          }
          clonedPage?.querySelectorAll<HTMLElement>("*").forEach((element) => {
            element.style.setProperty("color", "transparent", "important");
            element.style.setProperty(
              "-webkit-text-fill-color",
              "transparent",
              "important",
            );
            element.style.setProperty("text-shadow", "none", "important");
          });
        },
      });

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.9),
        "JPEG",
        0,
        0,
        pageWidth,
        pageHeight,
        `service-report-page-${pageIndex}`,
        "FAST",
      );

      const mmPerCssPixel = pageWidth / pageRect.width;
      textFragments.forEach((fragment) => {
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
          fragment.left * mmPerCssPixel,
          fragment.baseline * mmPerCssPixel,
          { align: fragment.alignment },
        );
      });
    }

    return pdf;
  } finally {
    previewZoom.value = previousZoom;
  }
}

function pdfFileName() {
  const reference = props.serviceReport.reportNo || "Service Report";
  return `${reference.replace(/[\\/:*?"<>|]+/g, "-")}.pdf`;
}

async function savePdf() {
  if (isSavingPdf.value || isPrinting.value) return;
  isSavingPdf.value = true;
  try {
    const pdf = await createServiceReportPdf();
    if (pdf) pdf.save(pdfFileName());
  } catch (error) {
    console.error("Gagal membuat PDF Service Report:", error);
    useNotificationStore().showError("Gagal membuat PDF Service Report");
  } finally {
    isSavingPdf.value = false;
  }
}

async function printReport() {
  if (isPrinting.value || isSavingPdf.value) return;
  isPrinting.value = true;
  try {
    const pdf = await createServiceReportPdf();
    if (!pdf) return;
    const pdfUrl = URL.createObjectURL(pdf.output("blob"));
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    iframe.onload = () => {
      window.setTimeout(() => iframe.contentWindow?.print(), 300);
    };
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);
    window.setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
      iframe.remove();
    }, 60_000);
  } catch (error) {
    console.error("Gagal menyiapkan print Service Report:", error);
    useNotificationStore().showError("Gagal menyiapkan print Service Report");
  } finally {
    isPrinting.value = false;
  }
}

watch(
  renderBlocks,
  () => {
    schedulePagination();
  },
  { deep: true, flush: "post" },
);

watch(metadataRows, schedulePagination, { deep: true, flush: "post" });

onMounted(async () => {
  updatePreviewZoom();
  await nextTick();
  schedulePagination();
  resizeObserver = new ResizeObserver(() => {
    updatePreviewZoom();
    schedulePagination();
  });
  if (previewViewport.value) resizeObserver.observe(previewViewport.value);
  if (paginationMeasure.value) resizeObserver.observe(paginationMeasure.value);
});

onBeforeUnmount(() => {
  stopImageResize();
  resizeObserver?.disconnect();
  if (paginationFrame !== null) window.cancelAnimationFrame(paginationFrame);
});
</script>

<style scoped>
.service-report-canvas {
  width: 100%;
  color: #111827;
}

.service-report-preview {
  display: flex;
  width: 100%;
  justify-content: center;
  overflow: auto;
}

.service-report-scale {
  position: relative;
  width: 794px;
  flex: 0 0 794px;
  transform-origin: top center;
}

.service-report-pages {
  display: grid;
  gap: 18px;
}

.service-report-paper {
  position: relative;
  display: flex;
  box-sizing: border-box;
  width: 794px;
  height: 1123px;
  min-height: 1123px;
  max-height: 1123px;
  padding: 26px 38px 54px;
  overflow: hidden;
  flex-direction: column;
  border: 1px solid #d8dee8;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
  color: #050505;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12px;
  line-height: 1.35;
}

.report-first-page-intro {
  display: flow-root;
  flex: 0 0 auto;
}

.report-title {
  width: max-content;
  margin: 0 auto 18px;
  font-size: 16px;
  font-weight: 800;
  text-align: center;
  border-bottom: 1px solid #050505;
}

.report-metadata {
  width: 100%;
  margin-bottom: 18px;
  border: 1px solid #111;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  font-size: 12px;
}

.report-metadata th,
.report-metadata td {
  padding: 3px 7px;
  border: 0;
  border-right: 1px solid #111;
  border-bottom: 1px solid #111;
  vertical-align: top;
  line-height: 1.25;
}

.report-metadata tr > :last-child {
  border-right: 0;
}

.report-metadata tbody tr:last-child > * {
  border-bottom: 0;
}

.report-metadata th {
  width: 145px;
  font-weight: 800;
  text-align: left;
}

.report-metadata .metadata-separator {
  width: 13px;
  padding-right: 0;
  padding-left: 4px;
  border-right: 0;
  text-align: center;
}

.report-metadata .metadata-separator + td {
  padding-left: 2px;
  border-left: 0;
}

.report-page-blocks {
  display: flex;
  flex-direction: column;
  padding: 0 9px;
}

.report-page-block {
  position: relative;
  min-width: 0;
}

.report-page-block + .report-page-block {
  margin-top: 16px;
}

.report-page-block--continuation:not(:first-child) {
  margin-top: 2px;
}

.report-image-resize-handle {
  position: absolute;
  right: 0;
  bottom: -8px;
  left: 0;
  z-index: 3;
  display: flex;
  width: 100%;
  height: 16px;
  padding: 0;
  align-items: center;
  justify-content: center;
  touch-action: none;
  cursor: ns-resize;
  border: 0;
  background: transparent;
}

.report-image-resize-handle::before {
  position: absolute;
  right: 0;
  left: 0;
  height: 1px;
  content: "";
  background: transparent;
}

.report-image-resize-handle span {
  position: relative;
  width: 64px;
  height: 5px;
  border: 1px solid #7890aa;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.22);
}

.report-image-resize-handle:hover::before,
.report-image-resize-handle:focus-visible::before {
  background: #7890aa;
}

.report-image-resize-handle:hover span,
.report-image-resize-handle:focus-visible span {
  background: #dce8f5;
}

.report-bottom-line {
  position: absolute;
  right: 38px;
  bottom: 24px;
  left: 38px;
  height: 1px;
  background: #999;
}

.report-pagination-measure {
  position: absolute;
  top: 0;
  left: 0;
  width: 718px;
  visibility: hidden;
  pointer-events: none;
  color: #050505;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12px;
  line-height: 1.35;
}

.pagination-letterhead,
.pagination-block-measure {
  display: flow-root;
}

.pagination-block-measure {
  padding: 0 9px;
}

.service-report-actions {
  display: flex;
  margin-top: 14px;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 9px;
}

@media (max-width: 600px) {
  .service-report-preview {
    justify-content: flex-start;
  }

  .service-report-actions > .v-btn {
    flex: 1 1 190px;
  }
}

@media print {
  .no-print {
    display: none !important;
  }

  .service-report-pages {
    gap: 0;
  }

  .service-report-paper {
    width: 210mm;
    height: 297mm;
    min-height: 297mm;
    max-height: 297mm;
    border: 0;
    box-shadow: none;
    break-after: page;
    page-break-after: always;
  }

  .service-report-paper:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  @page {
    size: A4 portrait;
    margin: 0;
  }
}
</style>
