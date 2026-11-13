<template>
  <div class="sr-page-shell">
    <v-card class="sr-page-card" elevation="0">
      <header class="sr-header">
        <div class="sr-heading">
          <span><v-icon icon="mdi-hammer-screwdriver" size="21" /></span>
          <div>
            <h2>{{ hasExistingReport ? "Revisi" : "Buat" }} Service Report</h2>
            <p>
              {{ penawaran.nama_perusahaan || "Client" }} ·
              {{ penawaran.no_penawaran || "Quotation" }}
            </p>
          </div>
        </div>
        <div class="sr-header-actions">
          <span class="sr-save-reminder" role="status">
            <v-icon icon="mdi-information-outline" size="15" />
            Simpan sebelum ekspor PDF
          </span>
          <div class="sr-header-buttons">
            <v-btn
              variant="text"
              color="grey-darken-2"
              prepend-icon="mdi-arrow-left"
              size="small"
              class="text-none sr-action-btn sr-action-btn--back"
              :disabled="saving || imageProcessing"
              @click="close"
            >
              Kembali
            </v-btn>
            <v-btn
              :color="hasExistingReport ? 'orange-darken-2' : 'primary'"
              variant="flat"
              prepend-icon="mdi-content-save-outline"
              size="small"
              class="text-none sr-action-btn sr-action-btn--save"
              :loading="saving"
              :disabled="imageProcessing || saving"
              :aria-label="hasExistingReport ? 'Simpan Revisi' : 'Simpan'"
              @click="save"
            >
              {{ hasExistingReport ? "Simpan Revisi" : "Simpan" }}
            </v-btn>
          </div>
        </div>
      </header>

      <div class="sr-content">
        <aside class="sr-editor">
          <nav class="sr-editor-menu" aria-label="Menu editor service report">
            <button
              type="button"
              class="sr-editor-menu-item"
              :class="{ 'sr-editor-menu-item--active': activeEditorMenu === 'report' }"
              :aria-pressed="activeEditorMenu === 'report'"
              @click="activeEditorMenu = 'report'"
            >
              <v-icon icon="mdi-file-document-edit-outline" size="16" />
              <span>Isi Report</span>
            </button>
            <button
              type="button"
              class="sr-editor-menu-item"
              :class="{ 'sr-editor-menu-item--active': activeEditorMenu === 'order' }"
              :aria-pressed="activeEditorMenu === 'order'"
              @click="activeEditorMenu = 'order'"
            >
              <v-icon icon="mdi-order-bool-ascending" size="16" />
              <span>Layers</span>
            </button>
          </nav>

          <div v-show="activeEditorMenu === 'report'" class="sr-editor-panel">
          <section class="sr-section">
            <div class="sr-section-title">
              <span><v-icon icon="mdi-table-edit" size="17" /></span>
              <div>
                <h3>Informasi Report</h3>
                <!-- <p>Data utama yang tampil pada dokumen.</p> -->
              </div>
            </div>
            <div class="sr-field-grid">
              <v-text-field
                v-model="form.vesselProject"
                label="Vessel / Project"
                variant="outlined"
                density="compact"
                hide-details
                readonly
              />
              <v-text-field
                v-model="form.attention"
                label="Attention"
                variant="outlined"
                density="compact"
                hide-details
                readonly
              />
              <v-text-field
                v-model="form.location"
                label="Location"
                variant="outlined"
                density="compact"
                hide-details
              />
              <v-text-field
                readonly
                v-model="form.reportNo"
                label="Report No"
                variant="outlined"
                density="compact"
                hide-details
                prepend-inner-icon="mdi-lock-outline"
                :loading="loadingNumber"
              />
              <v-text-field
                v-model="form.servicePeriodStart"
                label="Mulai Service"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
              />
              <v-text-field
                v-model="form.servicePeriodEnd"
                label="Selesai Service"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
              />
              <v-textarea
                v-model="form.scopeOfWork"
                label="Scope of Work"
                rows="2"
                auto-grow
                variant="outlined"
                density="compact"
                hide-details
                class="sr-full-field"
              />
            </div>
          </section>

          <section class="sr-section">
            <div class="sr-section-title">
              <span><v-icon icon="mdi-signature-freehand" size="17" /></span>
              <div>
                <h3>Tanda Tangan</h3>
              </div>
            </div>
            <div class="sr-field-grid">
              <v-text-field
                v-model="form.nama_teknisi"
                label="Nama Teknisi"
                variant="outlined"
                density="compact"
                hide-details
              />
              <v-text-field
                v-model="form.jabatan_teknisi"
                label="Jabatan Teknisi"
                variant="outlined"
                density="compact"
                hide-details
              />
            </div>
          </section>

          <section class="sr-section">
            <div class="sr-section-title sr-section-title--action">
              <span><v-icon icon="mdi-format-list-numbered" size="17" /></span>
              <div>
                <h3>Point Report</h3>
              </div>
            </div>

            <div ref="pointList" class="sr-point-list">
              <article
                v-for="(section, sectionIndex) in form.sections"
                :key="section.id"
                :data-section-id="section.id"
                class="sr-point-card"
              >
                <div class="sr-point-head">
                  <span>{{ String(sectionIndex + 1).padStart(2, "0") }}</span>
                  <strong>Kelompok Point</strong>
                  <v-btn
                    icon="mdi-trash-can-outline"
                    size="x-small"
                    color="red-darken-1"
                    variant="text"
                    :disabled="form.sections.length === 1"
                    @click="removeSection(sectionIndex)"
                  />
                </div>
                <div class="sr-point-fields sr-point-fields--stacked">
                  <v-text-field
                    v-model="section.point"
                    label="Point"
                    placeholder="Contoh: Scope of Work"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </div>
                <div class="sr-point-fields sr-point-fields--stacked">
                  <v-textarea
                    v-model="section.sub"
                    label="Sub point"
                    placeholder="Description of Work Performed"
                    rows="1"
                    auto-grow
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </div>
                <div class="sr-item-label">
                  <span>Item</span
                  ><small>{{ section.items.length }} item</small>
                </div>
                <div class="sr-items">
                  <div
                    v-for="(_, itemIndex) in section.items"
                    :key="`${section.id}-${itemIndex}`"
                    class="sr-item-row"
                  >
                    <span
                      >{{ String.fromCharCode(97 + (itemIndex % 26)) }}.</span
                    >
                    <v-textarea
                      v-model="section.items[itemIndex]"
                      :placeholder="`Isi item`"
                      :ref="
                        (element) =>
                          setItemTextareaRef(section.id, itemIndex, element)
                      "
                      rows="1"
                      auto-grow
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                    <v-btn
                      icon="mdi-close"
                      size="x-small"
                      variant="text"
                      :disabled="section.items.length === 1"
                      @click="removeItem(sectionIndex, itemIndex)"
                    />
                  </div>
                </div>
                <v-btn
                  size="small"
                  variant="text"
                  color="primary"
                  prepend-icon="mdi-plus"
                  class="text-none sr-add-item"
                  @click="addItem(sectionIndex)"
                  >Tambah Item</v-btn
                >
              </article>
            </div>
          </section>

          <div class="text-center">
            <v-btn
              size="small"
              color="primary"
              variant="tonal"
              prepend-icon="mdi-plus"
              class="text-none mb-3"
              @click="addSection"
              >Tambah Point</v-btn
            >
          </div>

          <section class="sr-section">
            <div class="sr-section-title">
              <span
                ><v-icon icon="mdi-image-multiple-outline" size="17"
              /></span>
              <div>
                <h3>Dokumentasi Foto</h3>
              </div>
            </div>
            <input
              ref="imageInput"
              class="sr-upload-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              @change="addImages"
            />
            <div v-if="form.images.length" ref="photoGrid" class="sr-images">
              <figure
                v-for="(image, imageIndex) in form.images"
                :key="image.id"
                :data-image-id="image.id"
                class="sr-image-item"
              >
                <div class="sr-image-preview">
                  <img
                    v-if="!image.isPlaceholder"
                    :src="image.dataUrl"
                    :alt="image.description || image.name"
                    draggable="false"
                  />
                  <div v-else class="sr-image-placeholder" aria-hidden="true">
                    <v-icon icon="mdi-file-outline" size="30" />
                    <span>Dokumen kosong</span>
                  </div>
                  <figcaption>
                    {{ imageIndex + 1 }}. {{ image.name }}
                  </figcaption>
                  <button
                    type="button"
                    class="sr-image-drag-handle"
                    :aria-label="`Geser foto ${imageIndex + 1}`"
                    :title="`Geser foto ${imageIndex + 1}`"
                  >
                    <v-icon icon="mdi-drag" size="15" />
                    {{ imageIndex + 1 }}
                  </button>
                  <v-btn
                    class="sr-image-remove"
                    icon="mdi-close"
                    size="x-small"
                    color="red-darken-1"
                    variant="flat"
                    @click="removeImage(imageIndex)"
                  />
                </div>
                <v-text-field
                  v-if="!image.isPlaceholder"
                  v-model="image.description"
                  placeholder="Deskripsi gambar"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="sr-image-description"
                />
                <div v-else class="sr-image-placeholder-note">
                  Slot kosong ini tetap tampil putih pada dokumen.
                </div>
              </figure>
            </div>
            <div class="sr-photo-actions">
              <button
                type="button"
                class="sr-upload-primary"
                :class="{ 'sr-upload-primary--busy': imageProcessing }"
                :disabled="imageProcessing"
                @click="openImagePicker"
              >
                <v-progress-circular
                  v-if="imageProcessing"
                  indeterminate
                  size="22"
                  width="3"
                />
                <span>{{
                  loadingStoredImages
                    ? "Memuat foto..."
                    : readingImages
                      ? "Memproses foto..."
                      : "Upload Foto"
                }}</span>
              </button>
              <small class="sr-upload-hint">
                JPG, PNG, atau WEBP · jumlah foto tidak dibatasi
              </small>
              <button
                type="button"
                class="sr-placeholder-button"
                :disabled="imageProcessing"
                @click="addEmptyDocument"
              >
                <v-icon icon="mdi-view-grid-plus-outline" size="18" />
                <span>Tambah Slot Kosong</span>
              </button>
              <div class="sr-photo-tip">
                <v-icon icon="mdi-drag" size="14" />
                <span>
                  Slot kosong dapat ditarik ke posisi mana pun seperti foto.
                </span>
              </div>
            </div>
          </section>
          </div>

          <section
            v-show="activeEditorMenu === 'order'"
            class="sr-section sr-editor-panel"
          >
            <div class="sr-section-title">
              <span><v-icon icon="mdi-order-bool-ascending" size="17" /></span>
              <div>
                <h3>Layers</h3>
              </div>
            </div>

            <div ref="contentBlocksContainer" class="sr-content-order-list">
              <article
                v-for="(block, blockIndex) in contentBlocks"
                :key="block.id"
                :data-block-id="block.id"
                class="sr-content-order-item"
              >
                <button
                  type="button"
                  class="sr-content-drag-handle"
                  :aria-label="`Geser blok urutan ${blockIndex + 1}`"
                  :title="`Geser blok urutan ${blockIndex + 1}`"
                >
                  <v-icon icon="mdi-drag-vertical" size="18" />
                </button>

                <div class="sr-content-order-copy">
                  <strong v-if="block.type === 'section'">
                    {{
                      sectionForBlock(block)?.point || "Point belum diberi nama"
                    }}
                  </strong>
                  <strong v-else>Baris Foto</strong>
                  <small v-if="block.type === 'section'">
                    {{ sectionForBlock(block)?.sub || "Tanpa subjudul" }}
                  </small>
                  <div v-else class="sr-content-order-photos">
                    <span
                      v-for="image in imagesForBlock(block)"
                      :key="image.id"
                      class="sr-content-order-photo"
                    >
                      <img
                        v-if="!image.isPlaceholder"
                        :src="image.dataUrl"
                        :alt="image.name"
                      />
                      <v-icon v-else icon="mdi-file-outline" size="14" />
                    </span>
                  </div>
                </div>

                <span class="sr-content-order-badge">
                  {{
                    block.type === "section"
                      ? "Point"
                      : `${block.imageIds.length}/2 slot · ${normalizeImageRowHeight(block.height)}px`
                  }}
                </span>
              </article>
            </div>
          </section>
        </aside>

        <main class="sr-preview-pane">
          <div class="sr-preview-toolbar">
            <div>
              <v-icon icon="mdi-eye-outline" size="18" /><strong
                >Live Preview</strong
              >
            </div>
            <v-chip size="x-small" variant="tonal" color="primary"
              >A4 · Portrait</v-chip
            >
          </div>
          <div class="sr-preview-scroll">
            <canvas-service-report
              :service-report="form"
              :show-actions="true"
              :editable="true"
              @update:image-row-height="updateImageRowHeight"
            />
          </div>
        </main>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import Sortable from "sortablejs";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  type ComponentPublicInstance,
} from "vue";
import { doc, getDoc, runTransaction } from "firebase/firestore";
import { useFirestore } from "vuefire";
import {
  deleteServiceReportImages,
  hydrateServiceReportImages,
  persistServiceReportImages,
} from "~/composables/useServiceReportImages";
import type {
  serviceReportContentBlockM,
  serviceReportImageM,
  serviceReportImageRowBlockM,
  serviceReportM,
  serviceReportSectionBlockM,
  serviceReportSectionM,
} from "~/types/invoice";
import type { penawaranM } from "~/types/penawaranModel";

const props = withDefaults(
  defineProps<{
    penawaran: penawaranM;
    invoiceId?: string;
  }>(),
  { invoiceId: "" },
);
const emit = defineEmits<{
  cancel: [];
  saved: [report: serviceReportM];
}>();

const db = useFirestore();
const notificationStore = useNotificationStore();
const loadingStore = useloadingStore();
const userStore = useUserStore();
const saving = ref(false);
const readingImages = ref(false);
const loadingStoredImages = ref(false);
const loadingNumber = ref(false);
const activeEditorMenu = ref<"report" | "order">("report");
const imageInput = ref<HTMLInputElement | null>(null);
const photoGrid = ref<HTMLElement | null>(null);
const pointList = ref<HTMLElement | null>(null);
const contentBlocksContainer = ref<HTMLElement | null>(null);
const itemTextareaRefs = new Map<string, HTMLTextAreaElement>();
let photoSortable: Sortable | null = null;
let contentBlocksSortable: Sortable | null = null;
const removedImageFirestoreIds = ref<string[]>([]);
const imageProcessing = computed(
  () => readingImages.value || loadingStoredImages.value,
);
const DEFAULT_IMAGE_ROW_HEIGHT = 230;
const MIN_IMAGE_ROW_HEIGHT = 100;
const MAX_IMAGE_ROW_HEIGHT = 520;
const MAX_IMAGE_EDGE = 800;
const MAX_IMAGE_FILE_SIZE = 15 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function uid(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`;
}

function newSection(
  overrides: Partial<serviceReportSectionM> = {},
): serviceReportSectionM {
  return { id: uid("section"), point: "", sub: "", items: [""], ...overrides };
}

function newSectionBlock(sectionId: string): serviceReportSectionBlockM {
  return { id: uid("content"), type: "section", sectionId };
}

function newImageRowBlock(imageIds: string[]): serviceReportImageRowBlockM {
  return {
    id: uid("content"),
    type: "image-row",
    imageIds,
    height: DEFAULT_IMAGE_ROW_HEIGHT,
  };
}

function normalizeImageRowHeight(height?: number) {
  return Math.round(
    Math.min(
      MAX_IMAGE_ROW_HEIGHT,
      Math.max(
        MIN_IMAGE_ROW_HEIGHT,
        Number(height) || DEFAULT_IMAGE_ROW_HEIGHT,
      ),
    ),
  );
}

function emptyReport(): serviceReportM {
  const section = newSection();
  return {
    vesselProject: "",
    attention: "",
    location: "",
    servicePeriodStart: "",
    servicePeriodEnd: "",
    scopeOfWork: "",
    reportNo: "",
    nama_teknisi: "",
    jabatan_teknisi: "",
    sections: [section],
    images: [],
    contentBlocks: [newSectionBlock(section.id)],
    createdAt: 0,
    createdBy: "",
  };
}

const form = ref<serviceReportM>(emptyReport());
const contentBlocks = computed(() => form.value.contentBlocks || []);
const hasExistingReport = computed(() =>
  Boolean(props.penawaran.service_report),
);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function chunkImageIds(imageIds: string[]) {
  const rows: string[][] = [];
  for (let index = 0; index < imageIds.length; index += 2) {
    rows.push(imageIds.slice(index, index + 2));
  }
  return rows;
}

function syncImageRowsWithImages() {
  const blocks = form.value.contentBlocks || [];
  const imageRows = () =>
    blocks.filter(
      (block): block is serviceReportImageRowBlockM =>
        block.type === "image-row",
    );
  const desiredRows = chunkImageIds(form.value.images.map((image) => image.id));

  while (imageRows().length > desiredRows.length) {
    const lastRow = imageRows().at(-1);
    if (!lastRow) break;
    const blockIndex = blocks.findIndex((block) => block.id === lastRow.id);
    if (blockIndex >= 0) blocks.splice(blockIndex, 1);
  }

  while (imageRows().length < desiredRows.length) {
    const rows = imageRows();
    const lastRow = rows.at(-1);
    const insertAt = lastRow
      ? blocks.findIndex((block) => block.id === lastRow.id) + 1
      : blocks.length;
    blocks.splice(insertAt, 0, newImageRowBlock([]));
  }

  imageRows().forEach((block, index) => {
    block.imageIds = desiredRows[index] || [];
    block.height = normalizeImageRowHeight(block.height);
  });
  form.value.contentBlocks = blocks;
}

function normalizeContentBlocks() {
  const sectionIds = new Set(form.value.sections.map((section) => section.id));
  const imageById = new Map(
    form.value.images.map((image) => [image.id, image] as const),
  );
  const usedSectionIds = new Set<string>();
  const usedImageIds = new Set<string>();
  const normalized: serviceReportContentBlockM[] = [];

  (form.value.contentBlocks || []).forEach((block) => {
    if (block.type === "section") {
      if (
        sectionIds.has(block.sectionId) &&
        !usedSectionIds.has(block.sectionId)
      ) {
        normalized.push({ ...block });
        usedSectionIds.add(block.sectionId);
      }
      return;
    }

    const validImageIds = (block.imageIds || []).filter((imageId) => {
      if (!imageById.has(imageId) || usedImageIds.has(imageId)) return false;
      usedImageIds.add(imageId);
      return true;
    });
    chunkImageIds(validImageIds).forEach((imageIds, rowIndex) => {
      normalized.push(
        rowIndex === 0
          ? {
              ...block,
              imageIds,
              height: normalizeImageRowHeight(block.height),
            }
          : newImageRowBlock(imageIds),
      );
    });
  });

  form.value.sections.forEach((section) => {
    if (!usedSectionIds.has(section.id)) {
      normalized.push(newSectionBlock(section.id));
      usedSectionIds.add(section.id);
    }
  });

  const orderedImageIds = [
    ...normalized.flatMap((block) =>
      block.type === "image-row" ? block.imageIds : [],
    ),
    ...form.value.images
      .map((image) => image.id)
      .filter((imageId) => !usedImageIds.has(imageId)),
  ];
  form.value.images = orderedImageIds
    .map((imageId) => imageById.get(imageId))
    .filter((image): image is serviceReportImageM => Boolean(image));
  form.value.contentBlocks = normalized;
  syncImageRowsWithImages();
}

function sectionForBlock(block: serviceReportContentBlockM) {
  if (block.type !== "section") return undefined;
  return form.value.sections.find((section) => section.id === block.sectionId);
}

function imagesForBlock(block: serviceReportContentBlockM) {
  if (block.type !== "image-row") return [];
  const imageById = new Map(
    form.value.images.map((image) => [image.id, image] as const),
  );
  return block.imageIds
    .map((imageId) => imageById.get(imageId))
    .filter((image): image is serviceReportImageM => Boolean(image));
}

function syncImageOrderFromBlocks() {
  const imageById = new Map(
    form.value.images.map((image) => [image.id, image] as const),
  );
  const orderedIds = (form.value.contentBlocks || []).flatMap((block) =>
    block.type === "image-row" ? block.imageIds : [],
  );
  const usedIds = new Set(orderedIds);
  form.value.images = [
    ...orderedIds
      .map((imageId) => imageById.get(imageId))
      .filter((image): image is serviceReportImageM => Boolean(image)),
    ...form.value.images.filter((image) => !usedIds.has(image.id)),
  ];
}

function quotationYear() {
  const year = Number(
    String(props.penawaran.tanggal_penawaran || "").slice(0, 4),
  );
  return year || new Date().getFullYear();
}

function formatReportNumber(sequence: number) {
  return `SR/DRM/${quotationYear()}/${String(sequence).padStart(5, "0")}`;
}

async function initializeForm() {
  removedImageFirestoreIds.value = [];
  if (props.penawaran.service_report) {
    form.value = clone(props.penawaran.service_report);
    form.value.nama_teknisi = form.value.nama_teknisi || "";
    form.value.jabatan_teknisi = form.value.jabatan_teknisi || "";
    form.value.sections = (form.value.sections || []).map((section) => ({
      ...section,
      id: section.id || uid("section"),
      items: section.items?.length ? section.items : [""],
    }));
    if (!form.value.sections.length) form.value.sections = [newSection()];
    form.value.images = (form.value.images || []).map((image) => ({
      ...image,
      id: image.id || uid("photo"),
    }));
    const quotationId = props.penawaran.id_penawaran || props.penawaran.id;
    if (quotationId) {
      loadingStoredImages.value = true;
      try {
        form.value = await hydrateServiceReportImages(
          db,
          String(quotationId),
          form.value,
        );
      } catch (error) {
        console.error("Gagal memuat foto Service Report:", error);
        notificationStore.showError(
          "Foto Service Report belum dapat dimuat. Silakan coba buka kembali.",
        );
      } finally {
        loadingStoredImages.value = false;
      }
    }
    normalizeContentBlocks();
    return;
  }

  form.value = {
    ...emptyReport(),
    vesselProject: props.penawaran.vessel || "",
    attention: props.penawaran.nama_perusahaan || props.penawaran.pic || "",
    location: props.penawaran.location || "",
    servicePeriodStart: props.penawaran.tanggal_penawaran || "",
    servicePeriodEnd: props.penawaran.tanggal_penawaran || "",
    scopeOfWork: props.penawaran.perihal || "",
    sections: [
      newSection({
        point: "Scope of Work",
        sub: "Description of Work Performed:",
        items: [""],
      }),
    ],
  };
  normalizeContentBlocks();
  void loadNextNumber();
}

async function loadNextNumber() {
  loadingNumber.value = true;
  try {
    const snapshot = await getDoc(doc(db, "penomoran", "nomor"));
    const current = snapshot.exists()
      ? Number(snapshot.data().no_service_report) || 0
      : 0;
    if (!props.penawaran.service_report)
      form.value.reportNo = formatReportNumber(current + 1);
  } catch (error) {
    console.error("Gagal membaca nomor Service Report:", error);
    notificationStore.showError("Nomor Service Report belum dapat dimuat");
  } finally {
    loadingNumber.value = false;
  }
}

function movePhoto(fromIndex: number, toIndex: number) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= form.value.images.length ||
    toIndex >= form.value.images.length
  ) {
    return;
  }
  const [movedImage] = form.value.images.splice(fromIndex, 1);
  if (!movedImage) return;
  form.value.images.splice(toIndex, 0, movedImage);
  syncImageRowsWithImages();
}

function moveContentBlock(fromIndex: number, toIndex: number) {
  const blocks = form.value.contentBlocks || [];
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= blocks.length ||
    toIndex >= blocks.length
  ) {
    return;
  }
  const [movedBlock] = blocks.splice(fromIndex, 1);
  if (!movedBlock) return;
  blocks.splice(toIndex, 0, movedBlock);
  form.value.contentBlocks = blocks;
  syncImageOrderFromBlocks();
}

function updateImageRowHeight(blockId: string, height: number) {
  const block = (form.value.contentBlocks || []).find(
    (contentBlock): contentBlock is serviceReportImageRowBlockM =>
      contentBlock.type === "image-row" && contentBlock.id === blockId,
  );
  if (block) block.height = normalizeImageRowHeight(height);
}

function destroySortables() {
  photoSortable?.destroy();
  contentBlocksSortable?.destroy();
  photoSortable = null;
  contentBlocksSortable = null;
}

function initializePhotoSortable() {
  photoSortable?.destroy();
  photoSortable = null;
  if (!photoGrid.value) return;

  photoSortable = new Sortable(photoGrid.value, {
    animation: 170,
    draggable: ".sr-image-item",
    handle: ".sr-image-drag-handle",
    filter: ".sr-image-remove",
    preventOnFilter: false,
    ghostClass: "sr-sortable-ghost",
    chosenClass: "sr-sortable-chosen",
    dragClass: "sr-sortable-drag",
    forceFallback: true,
    fallbackOnBody: false,
    fallbackClass: "sr-photo-sortable-fallback",
    fallbackTolerance: 3,
    scroll: true,
    onClone(event) {
      const rect = event.item.getBoundingClientRect();
      Object.assign(event.clone.style, {
        boxSizing: "border-box",
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        maxWidth: `${rect.width}px`,
        maxHeight: `${rect.height}px`,
        overflow: "hidden",
        border: "1px solid #94a3b8",
        borderRadius: "7px",
      });
    },
    onEnd(event) {
      const fromIndex = event.oldDraggableIndex ?? event.oldIndex;
      const toIndex = event.newDraggableIndex ?? event.newIndex;
      if (fromIndex === undefined || toIndex === undefined) return;
      movePhoto(fromIndex, toIndex);
    },
  });
}

function initializeContentBlocksSortable() {
  contentBlocksSortable?.destroy();
  contentBlocksSortable = null;
  if (!contentBlocksContainer.value) return;

  contentBlocksSortable = new Sortable(contentBlocksContainer.value, {
    animation: 170,
    draggable: ".sr-content-order-item",
    handle: ".sr-content-drag-handle",
    ghostClass: "sr-sortable-ghost",
    chosenClass: "sr-sortable-chosen",
    dragClass: "sr-sortable-drag",
    delay: 100,
    delayOnTouchOnly: true,
    touchStartThreshold: 4,
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 3,
    scroll: true,
    onEnd(event) {
      const fromIndex = event.oldDraggableIndex ?? event.oldIndex;
      const toIndex = event.newDraggableIndex ?? event.newIndex;
      if (fromIndex === undefined || toIndex === undefined) return;
      moveContentBlock(fromIndex, toIndex);
    },
  });
}

async function initializeSortables() {
  await nextTick();
  initializePhotoSortable();
  initializeContentBlocksSortable();
}

onMounted(async () => {
  await initializeForm();
  await initializeSortables();
});

onBeforeUnmount(destroySortables);

function close() {
  if (saving.value || imageProcessing.value) return;
  emit("cancel");
}

function addSection() {
  const section = newSection();
  form.value.sections.push(section);
  form.value.contentBlocks ||= [];
  form.value.contentBlocks.push(newSectionBlock(section.id));
}
function removeSection(index: number) {
  if (form.value.sections.length <= 1) return;
  const [removedSection] = form.value.sections.splice(index, 1);
  if (!removedSection) return;
  form.value.contentBlocks = (form.value.contentBlocks || []).filter(
    (block) =>
      block.type !== "section" || block.sectionId !== removedSection.id,
  );
}
function itemTextareaKey(sectionId: string, itemIndex: number) {
  return `${sectionId}:${itemIndex}`;
}

function setItemTextareaRef(
  sectionId: string,
  itemIndex: number,
  instance: Element | ComponentPublicInstance | null,
) {
  const key = itemTextareaKey(sectionId, itemIndex);
  if (!instance) {
    itemTextareaRefs.delete(key);
    return;
  }

  const root = instance instanceof Element ? instance : instance.$el;
  const textarea =
    root instanceof HTMLElement
      ? root.querySelector<HTMLTextAreaElement>("textarea")
      : null;
  if (textarea) itemTextareaRefs.set(key, textarea);
  else itemTextareaRefs.delete(key);
}

async function addItem(sectionIndex: number) {
  const section = form.value.sections[sectionIndex];
  if (!section) return;

  section.items.push("");
  const newItemIndex = section.items.length - 1;
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const sectionElement = [
    ...(pointList.value?.querySelectorAll<HTMLElement>(".sr-point-card") || []),
  ].find((element) => element.dataset.sectionId === section.id);
  const itemTextarea =
    itemTextareaRefs.get(itemTextareaKey(section.id, newItemIndex)) ||
    sectionElement
      ?.querySelectorAll<HTMLTextAreaElement>(".sr-item-row textarea")
      .item(newItemIndex);
  itemTextarea?.focus();
}
function removeItem(sectionIndex: number, itemIndex: number) {
  const items = form.value.sections[sectionIndex]?.items;
  if (items && items.length > 1) items.splice(itemIndex, 1);
}
async function removeImage(index: number) {
  const [removedImage] = form.value.images.splice(index, 1);
  if (
    removedImage?.firestoreImageId &&
    !removedImageFirestoreIds.value.includes(removedImage.firestoreImageId)
  ) {
    removedImageFirestoreIds.value.push(removedImage.firestoreImageId);
  }
  syncImageRowsWithImages();
  await nextTick();
  initializePhotoSortable();
}

async function addEmptyDocument() {
  form.value.images.push({
    id: uid("blank"),
    name: "Dokumen kosong",
    description: "",
    dataUrl: "",
    size: 0,
    contentType: "",
    isPlaceholder: true,
  });
  syncImageRowsWithImages();
  await nextTick();
  initializePhotoSortable();
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Foto tidak dapat dibaca"));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function openImagePicker() {
  if (!imageProcessing.value) imageInput.value?.click();
}

type ImageSource = {
  drawable: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

async function decodeImage(file: File): Promise<ImageSource> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        drawable: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // Safari versi lama dapat gagal pada createImageBitmap meski <img> bisa.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () =>
        reject(new Error(`Foto ${file.name} tidak dapat dibuka`));
      element.src = objectUrl;
    });
    return {
      drawable: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => {
        image.src = "";
        URL.revokeObjectURL(objectUrl);
      },
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

async function compressImage(file: File): Promise<serviceReportImageM> {
  const source = await decodeImage(file);
  let sourceReleased = false;
  const releaseSource = () => {
    if (sourceReleased) return;
    sourceReleased = true;
    source.release();
  };
  try {
    const scale = Math.min(
      1,
      MAX_IMAGE_EDGE / Math.max(source.width, source.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Kompresi foto tidak didukung");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source.drawable, 0, 0, canvas.width, canvas.height);
    releaseSource();
    const toBlob = (quality: number) =>
      new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (blob) =>
            blob ? resolve(blob) : reject(new Error("Foto gagal dikompres")),
          "image/jpeg",
          quality,
        ),
      );
    let quality = 0.78;
    let blob = await toBlob(quality);
    while (blob.size > 105_000 && quality > 0.3) {
      quality -= 0.09;
      blob = await toBlob(quality);
    }
    return {
      id: uid("photo"),
      name: `${file.name.replace(/\.[^.]+$/, "")}.jpg`,
      dataUrl: await blobToDataUrl(blob),
      size: blob.size,
      contentType: "image/jpeg",
    };
  } finally {
    releaseSource();
  }
}

async function addImages(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = "";
  if (!files.length || imageProcessing.value) return;
  const unsupportedFile = files.find(
    (file) => !SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase()),
  );
  if (unsupportedFile) {
    return notificationStore.showError(
      `${unsupportedFile.name} bukan JPG, PNG, atau WEBP`,
    );
  }
  const oversizedFile = files.find((file) => file.size > MAX_IMAGE_FILE_SIZE);
  if (oversizedFile) {
    return notificationStore.showError(
      `${oversizedFile.name} terlalu besar. Maksimal 15 MB per foto`,
    );
  }
  readingImages.value = true;
  try {
    const images: serviceReportImageM[] = [];
    for (const file of files) images.push(await compressImage(file));
    form.value.images.push(...images);
    syncImageRowsWithImages();
    await nextTick();
    initializePhotoSortable();
  } catch (error) {
    console.error("Gagal memproses foto Service Report:", error);
    notificationStore.showError(
      error instanceof Error ? error.message : "Foto tidak dapat diproses",
    );
  } finally {
    readingImages.value = false;
  }
}

async function save() {
  if (saving.value || imageProcessing.value) return;
  const id = props.penawaran.id_penawaran || props.penawaran.id;
  if (!id) return notificationStore.showError("ID quotation tidak ditemukan");
  if (!form.value.vesselProject.trim())
    return notificationStore.showError("Vessel / Project wajib diisi");
  normalizeContentBlocks();
  const sections = form.value.sections.map((section) => ({
    ...section,
    point: section.point.trim(),
    sub: section.sub.trim(),
    items: section.items.map((item) => item.trim()).filter(Boolean),
  }));

  const existing = props.penawaran.service_report;
  const writtenImageIds: string[] = [];
  let transactionCommitted = false;
  saving.value = true;
  loadingStore.setLoading(true);
  try {
    const storedImageMetadata = await persistServiceReportImages(
      db,
      String(id),
      form.value.images,
      userStore.getEmail,
      writtenImageIds,
    );
    const storedImageByLocalId = new Map(
      storedImageMetadata.map((image) => [image.id, image] as const),
    );
    const baseReport: serviceReportM = {
      ...clone(form.value),
      quotationId: String(id),
      sections,
      images: storedImageMetadata,
      createdAt: existing?.createdAt || Date.now(),
      createdBy: existing?.createdBy || userStore.getEmail,
      updatedAt: Date.now(),
      updatedBy: userStore.getEmail,
    };
    let savedReport = baseReport;
    await runTransaction(db, async (transaction) => {
      const quotationRef = doc(db, "penawaran", id);
      const quotationSnapshot = await transaction.get(quotationRef);
      const invoiceRef = props.invoiceId
        ? doc(db, "invoice", props.invoiceId)
        : null;
      const invoiceSnapshot = invoiceRef
        ? await transaction.get(invoiceRef)
        : null;
      const storedReport = quotationSnapshot.exists()
        ? (quotationSnapshot.data().service_report as
            | serviceReportM
            | undefined)
        : undefined;
      let reportNo =
        storedReport?.reportNo?.trim() || existing?.reportNo?.trim() || "";
      if (!reportNo) {
        const numberingRef = doc(db, "penomoran", "nomor");
        const snapshot = await transaction.get(numberingRef);
        const next =
          (snapshot.exists()
            ? Number(snapshot.data().no_service_report) || 0
            : 0) + 1;
        reportNo = formatReportNumber(next);
        transaction.set(
          numberingRef,
          { no_service_report: next },
          { merge: true },
        );
      }
      savedReport = { ...baseReport, reportNo };
      const updatedAt = Math.floor(Date.now() / 1000);
      transaction.update(quotationRef, {
        service_report: savedReport,
        updated_at: updatedAt,
        updated_by: userStore.getEmail,
      });
      if (
        invoiceRef &&
        invoiceSnapshot?.exists() &&
        String(invoiceSnapshot.data().id_penawaran || "") === String(id)
      ) {
        transaction.update(invoiceRef, {
          service_report: savedReport,
          updated_at: updatedAt,
          updated_by: userStore.getEmail,
        });
      }
    });
    transactionCommitted = true;
    const savedReportForDisplay: serviceReportM = {
      ...savedReport,
      images: form.value.images.map((image) => ({
        ...image,
        firestoreImageId:
          storedImageByLocalId.get(image.id)?.firestoreImageId ||
          image.firestoreImageId,
      })),
    };
    form.value = clone(savedReportForDisplay);
    try {
      await deleteServiceReportImages(
        db,
        String(id),
        removedImageFirestoreIds.value,
      );
    } catch (cleanupError) {
      console.warn(
        "Foto Service Report lama belum dapat dibersihkan:",
        cleanupError,
      );
    }
    removedImageFirestoreIds.value = [];
    sessionStorage.removeItem("penawaran");
    notificationStore.showSuccess(
      existing
        ? "Service Report berhasil diperbarui"
        : "Service Report berhasil dibuat",
    );
    emit("saved", savedReportForDisplay);
  } catch (error) {
    if (!transactionCommitted && writtenImageIds.length) {
      try {
        await deleteServiceReportImages(db, String(id), writtenImageIds);
      } catch (cleanupError) {
        console.warn(
          "Foto dari penyimpanan Service Report yang gagal belum dapat dibersihkan:",
          cleanupError,
        );
      }
    }
    console.error("Gagal menyimpan Service Report quotation:", error);
    notificationStore.showError(
      transactionCommitted
        ? "Service Report tersimpan, tetapi tampilan gagal diperbarui"
        : "Service Report gagal disimpan",
    );
  } finally {
    saving.value = false;
    loadingStore.setLoading(false);
  }
}
</script>

<style scoped>
.sr-page-card {
  display: flex;
  width: 100%;
  height: min(900px, calc(100vh - 145px));
  min-height: 420px;
  overflow: hidden;
  flex-direction: column;
  border-radius: 14px !important;
  background: #f7f9fc !important;
}
.sr-page-shell {
  display: flex;
  width: 100%;
  justify-content: center;
}
.sr-header {
  position: sticky;
  z-index: 10;
  display: flex;
  padding: 11px 18px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  background: #fff;
}
.sr-header {
  top: 0;
  min-height: 68px;
  border-bottom: 1px solid #e3e8ef;
}
.sr-heading {
  display: flex;
  min-width: 0;
  flex: 1 1 280px;
  align-items: center;
  gap: 11px;
}
.sr-header-actions {
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}
.sr-header-buttons {
  display: flex;
  align-items: center;
  gap: 5px;
}
.sr-action-btn {
  min-height: 36px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
}
.sr-action-btn--save {
  min-width: 100px;
  box-shadow: 0 2px 5px rgba(35, 79, 125, 0.14);
}
.sr-heading > span,
.sr-section-title > span {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border-radius: 9px;
  background: #eaf1fb;
  color: #214f82;
}
.sr-heading h2,
.sr-section-title h3 {
  margin: 0;
  color: #18283a;
  font-size: 16px;
}
.sr-heading p,
.sr-section-title p {
  margin: 3px 0 0;
  color: #7b8797;
  font-size: 9px;
}
.sr-content {
  display: grid;
  min-height: 0;
  flex: 1 1 auto;
  grid-template-columns: minmax(440px, 0.82fr) minmax(620px, 1.18fr);
  overflow: hidden;
}
.sr-editor {
  min-height: 0;
  padding: 14px;
  overflow-y: auto;
  border-right: 1px solid #e1e7ee;
}
.sr-editor-menu {
  display: grid;
  margin-bottom: 12px;
  padding: 4px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  border: 1px solid #dfe6ee;
  border-radius: 10px;
  background: #f1f5f9;
}
.sr-editor-menu-item {
  display: flex;
  min-width: 0;
  min-height: 36px;
  padding: 7px 10px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  color: #64748b;
  font-size: 10px;
  font-weight: 700;
  border: 0;
  border-radius: 7px;
  background: transparent;
}
.sr-editor-menu-item:hover {
  color: #214f82;
  background: rgba(255, 255, 255, 0.65);
}
.sr-editor-menu-item--active {
  color: #214f82;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
}
.sr-section {
  margin-bottom: 12px;
  padding: 14px;
  border: 1px solid #e1e7ee;
  border-radius: 10px;
  background: #fff;
}
.sr-section:last-child {
  margin-bottom: 0;
}
.sr-section-title {
  display: flex;
  margin-bottom: 13px;
  align-items: center;
  gap: 9px;
}
.sr-section-title > span {
  width: 29px;
  height: 29px;
  flex-basis: 29px;
  border-radius: 7px;
  background: #eef3f8;
}
.sr-section-title > div {
  min-width: 0;
  flex: 1;
}
.sr-section-title h3 {
  font-size: 12px;
}
.sr-section-title--action {
  align-items: flex-start;
}
.sr-field-grid,
.sr-point-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}
.sr-point-fields--stacked {
  grid-template-columns: minmax(0, 1fr);
}
.sr-point-fields--stacked + .sr-point-fields--stacked {
  margin-top: 9px;
}
.sr-full-field {
  grid-column: 1 / -1;
}
.sr-section :deep(.v-field) {
  border-radius: 7px;
  font-size: 11px;
}
.sr-section :deep(.v-label) {
  font-size: 10px;
}
.sr-point-list,
.sr-items {
  display: grid;
  gap: 8px;
}
.sr-point-card {
  padding: 11px;
  border: 1px solid #e1e7ed;
  border-radius: 8px;
  background: #fbfcfe;
}
.sr-point-head {
  display: flex;
  margin-bottom: 10px;
  align-items: center;
  gap: 7px;
}
.sr-point-head > span {
  display: grid;
  width: 25px;
  height: 25px;
  place-items: center;
  border-radius: 6px;
  background: #234f7d;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
}
.sr-point-head strong {
  flex: 1;
  color: #536275;
  font-size: 10px;
}
.sr-item-label {
  display: flex;
  margin: 11px 0 6px;
  justify-content: space-between;
  color: #536275;
  font-size: 9px;
  font-weight: 700;
}
.sr-item-label small {
  color: #9aa3af;
  font-size: 8px;
}
.sr-item-row {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 26px;
  align-items: start;
  gap: 4px;
}
.sr-item-row > span {
  padding-top: 9px;
  color: #7c8795;
  font-size: 10px;
  text-align: center;
}
.sr-add-item {
  margin: 5px 0 -4px 18px;
  font-size: 9px !important;
}
.sr-upload-input {
  position: fixed;
  width: 1px;
  height: 1px;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
}
.sr-photo-actions {
  display: flex;
  margin-top: 10px;
  align-items: center;
  flex-direction: column;
  gap: 8px;
}
.sr-upload-primary {
  display: flex;
  width: 100%;
  min-height: 38px;
  padding: 5px 22px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  font: inherit;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.01em;
  border: 0;
  border-radius: 20px;
  background: linear-gradient(100deg, #a147f5 0%, #8438f4 100%);
  box-shadow:
    0 7px 15px rgba(132, 56, 244, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition:
    box-shadow 160ms ease,
    transform 160ms ease,
    filter 160ms ease;
}
.sr-upload-primary:hover:not(:disabled) {
  filter: brightness(1.05);
  transform: translateY(-2px);
  box-shadow:
    0 10px 20px rgba(132, 56, 244, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}
.sr-upload-primary:active:not(:disabled) {
  transform: translateY(0);
}
.sr-upload-primary:focus-visible,
.sr-placeholder-button:focus-visible {
  outline: 3px solid rgba(132, 56, 244, 0.28);
  outline-offset: 2px;
}
.sr-upload-primary:disabled,
.sr-placeholder-button:disabled {
  opacity: 0.6;
  cursor: wait;
}
.sr-upload-hint {
  color: #6f7e90;
  font-size: 8px;
  line-height: 1.3;
  text-align: center;
}
.sr-upload-primary--busy {
  transform: none !important;
}
.sr-placeholder-button {
  display: inline-flex;
  min-height: 38px;
  padding: 8px 16px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  cursor: pointer;
  color: #7532d2;
  font: inherit;
  font-size: 10px;
  font-weight: 700;
  border: 1px solid #d8c0f4;
  border-radius: 999px;
  background: #fbf8ff;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease;
}
.sr-placeholder-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #a875e3;
  background: #f4ebff;
}
.sr-photo-tip {
  display: flex;
  padding: 1px 4px 0;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #7b8797;
  font-size: 8px;
  line-height: 1.35;
  text-align: center;
}
.sr-images {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}
.sr-images figure {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  background: #fff;
}
.sr-image-preview {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
  background: #eef1f5;
}
.sr-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  -webkit-user-drag: none;
  user-select: none;
}
.sr-image-placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
  color: #94a3b8;
  background: #fff;
}
.sr-image-placeholder span {
  font-size: 9px;
  font-weight: 700;
}
.sr-images figcaption {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 14px 5px 4px;
  overflow: hidden;
  background: linear-gradient(transparent, rgba(15, 23, 42, 0.8));
  color: #fff;
  font-size: 7px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sr-image-description {
  padding: 7px;
}
.sr-image-placeholder-note {
  min-height: 54px;
  padding: 10px 8px;
  color: #7b8797;
  font-size: 8px;
  line-height: 1.35;
  text-align: center;
}
.sr-image-description :deep(.v-field) {
  font-size: 10px;
}
.sr-images .sr-image-remove {
  position: absolute;
  top: 5px;
  right: 5px;
}
.sr-image-drag-handle {
  position: absolute;
  top: 5px;
  left: 5px;
  display: inline-flex;
  height: 24px;
  padding: 0 7px;
  align-items: center;
  gap: 2px;
  cursor: grab;
  color: #ffffff;
  font: inherit;
  font-size: 9px;
  font-weight: 800;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(4px);
}
.sr-image-drag-handle:active,
.sr-content-drag-handle:active {
  cursor: grabbing;
}
.sr-content-order-list {
  display: grid;
  gap: 7px;
}
.sr-content-order-item {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  min-height: 54px;
  padding: 7px 9px 7px 6px;
  align-items: center;
  gap: 8px;
  border: 1px solid #dfe6ee;
  border-radius: 8px;
  background: #fbfcfe;
}
.sr-content-drag-handle {
  display: grid;
  width: 28px;
  height: 34px;
  padding: 0;
  place-items: center;
  cursor: grab;
  color: #718096;
  border: 0;
  border-radius: 6px;
  background: transparent;
}
.sr-content-drag-handle:hover {
  color: #214f82;
  background: #eaf1fb;
}
.sr-content-order-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}
.sr-content-order-copy > strong,
.sr-content-order-copy > small {
  overflow-wrap: anywhere;
}
.sr-content-order-copy > strong {
  color: #334155;
  font-size: 10px;
}
.sr-content-order-copy > small {
  color: #8491a1;
  font-size: 8px;
}
.sr-content-order-photos {
  display: flex;
  min-height: 24px;
  align-items: center;
  gap: 4px;
}
.sr-content-order-photo {
  display: grid;
  width: 34px;
  height: 24px;
  place-items: center;
  overflow: hidden;
  color: #94a3b8;
  border: 1px solid #d7dee7;
  border-radius: 4px;
  background: #fff;
}
.sr-content-order-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sr-content-order-badge {
  justify-self: end;
  padding: 3px 6px;
  color: #64748b;
  font-size: 8px;
  font-weight: 700;
  white-space: nowrap;
  border-radius: 999px;
  background: #eef2f7;
}
.sr-sortable-ghost {
  opacity: 0.35;
  border-style: dashed !important;
  border-color: #4f7cac !important;
}
.sr-sortable-chosen {
  border-color: #93b3d5 !important;
}
.sr-sortable-drag {
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
}
.sr-photo-sortable-fallback,
.sr-image-item.sr-sortable-drag {
  box-sizing: border-box !important;
  overflow: hidden !important;
  border: 1px solid #94a3b8 !important;
  border-radius: 7px !important;
  background: #eef1f5;
}
.sr-photo-sortable-fallback img,
.sr-image-item.sr-sortable-drag img {
  display: block;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}
.sr-preview-pane {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: #e9edf2;
}
.sr-preview-toolbar {
  display: flex;
  min-height: 43px;
  padding: 8px 14px;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.88);
}
.sr-preview-toolbar > div {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #526174;
  font-size: 10px;
}
.sr-preview-scroll {
  min-height: 0;
  padding: 18px;
  flex: 1;
  overflow: auto;
}
.sr-save-reminder {
  display: inline-flex;
  min-height: 28px;
  padding: 0 9px;
  align-items: center;
  gap: 3px;
  color: #64748b;
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #f8fafc;
}
.sr-save-reminder :deep(.v-icon) {
  color: #718096;
}
@media (max-width: 959px) {
  .sr-page-card {
    height: calc(100vh - 120px);
    border-radius: 0 !important;
  }
}
@media (max-width: 1080px) {
  .sr-content {
    display: block;
    overflow-y: auto;
  }
  .sr-editor {
    overflow: visible;
    border-right: 0;
  }
  .sr-preview-pane {
    min-height: 680px;
  }
}
@media (max-width: 599px) {
  .sr-header {
    padding: 10px 12px;
  }
  .sr-heading {
    flex-basis: 100%;
  }
  .sr-heading p {
    display: none;
  }
  .sr-header-actions {
    width: 100%;
    flex-wrap: wrap;
    justify-content: space-between;
  }
  .sr-save-reminder {
    flex: 1 1 auto;
    padding: 0 7px;
    font-size: 8px;
  }
  .sr-header-buttons {
    flex: 0 0 auto;
  }
  .sr-action-btn {
    padding-inline: 8px;
  }
  .sr-upload-primary {
    min-height: 54px;
    font-size: 15px;
    border-radius: 17px;
  }
}
@media (max-width: 380px) {
  .sr-header-actions {
    justify-content: flex-end;
  }
  .sr-save-reminder {
    flex-basis: 100%;
    justify-content: flex-end;
    border: 0;
    background: transparent;
  }
  .sr-editor {
    padding: 9px;
  }
  .sr-section {
    padding: 11px;
  }
  .sr-field-grid,
  .sr-point-fields {
    grid-template-columns: 1fr;
  }
  .sr-full-field {
    grid-column: auto;
  }
  .sr-section-title--action {
    flex-wrap: wrap;
  }
  .sr-section-title--action .v-btn {
    width: 100%;
  }
}
</style>
