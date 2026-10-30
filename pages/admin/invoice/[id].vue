<template>
  <div>
    <ConfirmationDialog ref="confirmationDialog" />

    <div class="invoice-page-nav">
      <v-btn
        variant="text"
        prepend-icon="mdi-arrow-left"
        size="small"
        class="invoice-back-button"
        @click="$router.go(-1)"
      >
        Kembali
      </v-btn>
    </div>

    <!-- // DIALOG SELESAI \\ -->
    <v-dialog
      v-model="data.dialogSelesai"
      max-width="700"
      scrollable
      :persistent="readingBuktiBayar"
    >
      <v-card class="finish-invoice-dialog" rounded="xl">
        <!-- HEADER -->
        <div class="finish-dialog-header">
          <div class="finish-header-icon">
            <v-icon icon="mdi-check-circle-outline" size="28" />
          </div>

          <div>
            <div class="finish-header-title">Selesaikan Invoice</div>
            <div class="finish-header-subtitle">
              Lengkapi tanggal pembayaran dan bukti pembayaran
            </div>
          </div>
        </div>

        <v-divider />

        <v-card-text class="pa-6">
          <!-- TANGGAL PEMBAYARAN -->
          <div class="form-section">
            <div class="section-title">
              <v-icon
                icon="mdi-calendar-check-outline"
                size="19"
                class="mr-2"
              />
              Informasi Pembayaran
            </div>

            <a-date-picker-new
              label="Tanggal Dibayar"
              v-model="invoiceDetail.tanggal_bayar"
            />
          </div>

          <!-- UPLOAD BUKTI BAYAR -->
          <div class="form-section mt-6">
            <div class="section-title">
              <v-icon icon="mdi-file-document-outline" size="19" class="mr-2" />
              Bukti Pembayaran
            </div>

            <div class="upload-card">
              <label for="upload-po" class="upload-area">
                <input
                  id="upload-po"
                  type="file"
                  multiple
                  class="po-file-input"
                  :disabled="readingBuktiBayar"
                  @change="addfile"
                />

                <div class="upload-icon-wrapper">
                  <v-icon icon="mdi-cloud-upload-outline" size="30" />
                </div>

                <div class="upload-content">
                  <div class="upload-title">Klik untuk memilih file</div>

                  <div class="upload-description">
                    Upload bukti pembayaran invoice
                  </div>

                  <div class="upload-limit">Maksimal ukuran file 650 KB</div>
                </div>
              </label>

              <!-- LOADING -->
              <div v-if="readingBuktiBayar" class="upload-loading">
                <v-progress-circular
                  indeterminate
                  size="20"
                  width="2"
                  class="mr-2"
                />
                Membaca file...
              </div>
            </div>

            <!-- FILE TERPILIH -->
            <div v-if="poFiles.length" class="selected-files mt-4">
              <div class="selected-files-header">
                <div class="selected-files-title">File Terpilih</div>

                <div class="file-count">{{ poFiles.length }} file</div>
              </div>

              <div class="po-file-list">
                <div
                  v-for="(file, index) in poFiles"
                  :key="index"
                  class="po-file-item"
                >
                  <div class="file-left">
                    <div class="file-icon">
                      <v-icon icon="mdi-file-check-outline" size="20" />
                    </div>

                    <div class="file-info">
                      <div class="po-file-name">
                        {{ file.name }}
                      </div>

                      <div class="file-size">
                        {{ Math.ceil(file.size / 1024) }} KB
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="po-file-remove"
                    :disabled="readingBuktiBayar"
                    @click="poFiles.splice(index, 1)"
                  >
                    <v-icon icon="mdi-close" size="18" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>

        <!-- FOOTER -->
        <v-divider />

        <v-card-actions class="dialog-footer">
          <v-btn
            variant="text"
            color="grey-darken-1"
            :disabled="readingBuktiBayar || savingInvoice"
            @click="data.dialogSelesai = false"
          >
            Batal
          </v-btn>

          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            prepend-icon="mdi-check-circle-outline"
            :loading="savingInvoice"
            :disabled="readingBuktiBayar || savingInvoice"
            @click="ubahStatusSelesai"
          >
            Simpan Bukti Bayar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- // DIALOG TAMBAH DO/WR \\ -->
    <v-dialog
      v-model="data.dialogTambahDoWr"
      max-width="520"
      scrollable
      :persistent="readingDoWr"
      @after-leave="resetDoWrFiles"
    >
      <v-card class="do-wr-dialog" rounded="lg">
        <div class="do-wr-dialog-header">
          <div class="do-wr-dialog-heading">
            <div class="do-wr-dialog-icon">
              <v-icon icon="mdi-file-document-plus-outline" size="20" />
            </div>

            <div>
              <div class="do-wr-dialog-title">Tambah Dokumen DO/WR</div>
              <div class="do-wr-dialog-subtitle">
                Lampirkan delivery order atau work completion report.
              </div>
            </div>
          </div>

          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            aria-label="Tutup dialog"
            :disabled="readingDoWr || savingInvoice"
            @click="tutupDialogDoWr"
          />
        </div>

        <v-divider />

        <v-card-text class="do-wr-dialog-body">
          <label
            for="upload-do-wr"
            class="do-wr-upload-area"
            :class="{ 'do-wr-upload-area--disabled': readingDoWr }"
          >
            <input
              id="upload-do-wr"
              type="file"
              multiple
              class="po-file-input"
              :disabled="readingDoWr"
              @change="addDoWrFiles"
            />

            <v-icon icon="mdi-tray-arrow-up" size="22" />

            <div class="do-wr-upload-copy">
              <div class="do-wr-upload-title">Pilih dokumen</div>
              <div class="do-wr-upload-description">
                PDF, gambar, atau dokumen Office · maks. sekitar 650 KB total
              </div>
            </div>
          </label>

          <div
            v-if="savedDoWrDocuments.length || doWrFiles.length"
            class="do-wr-selected-files"
          >
            <div class="do-wr-selected-header">
              <span>
                {{ savedDoWrDocuments.length + doWrFiles.length }} dokumen
              </span>
              <span v-if="doWrFiles.length">
                {{ doWrFiles.length }} baru · {{ formatFileSize(doWrTotalBytes) }}
              </span>
            </div>

            <div class="do-wr-file-list">
              <div
                v-for="(document, index) in savedDoWrDocuments"
                :key="`saved-${index}-${document.name}`"
                class="do-wr-file-item"
              >
                <v-icon
                  icon="mdi-file-check-outline"
                  size="19"
                  class="do-wr-file-icon"
                />

                <div class="do-wr-file-info">
                  <button
                    type="button"
                    class="do-wr-file-name do-wr-file-link"
                    :disabled="readingDoWr"
                    @click="bukaDokumenLampiran(document)"
                  >
                    {{ document.name }}
                  </button>
                  <div class="do-wr-file-size">
                    Tersimpan · {{ formatFileSize(Number(document.size) || 0) }}
                  </div>
                </div>

                <v-btn
                  icon="mdi-delete-outline"
                  variant="text"
                  size="x-small"
                  color="error"
                  :aria-label="`Hapus ${document.name}`"
                  :disabled="readingDoWr"
                  @click="removeSavedDoWrDocument(index)"
                />
              </div>

              <div
                v-for="(file, index) in doWrFiles"
                :key="`${file.name}-${file.size}-${file.lastModified}`"
                class="do-wr-file-item"
              >
                <v-icon
                  icon="mdi-file-document-outline"
                  size="19"
                  class="do-wr-file-icon"
                />

                <div class="do-wr-file-info">
                  <div class="do-wr-file-name">{{ file.name }}</div>
                  <div class="do-wr-file-size">
                    File baru · {{ formatFileSize(file.size) }}
                  </div>
                </div>

                <v-btn
                  icon="mdi-close"
                  variant="text"
                  size="x-small"
                  aria-label="Hapus dokumen"
                  :disabled="readingDoWr"
                  @click="removeDoWrFile(index)"
                />
              </div>
            </div>
          </div>

          <div v-if="readingDoWr" class="do-wr-upload-progress">
            <div class="do-wr-progress-label">
              <span class="text-truncate">
                Menyiapkan {{ activeDoWrFileName || "dokumen" }}
              </span>
              <span>{{ doWrUploadProgress }}%</span>
            </div>
            <v-progress-linear
              :model-value="doWrUploadProgress"
              color="primary"
              height="4"
              rounded
            />
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="do-wr-dialog-footer">
          <v-spacer />

          <v-btn
            variant="text"
            :disabled="readingDoWr || savingInvoice"
            @click="tutupDialogDoWr"
          >
            Batal
          </v-btn>

          <v-btn
            color="primary"
            variant="flat"
            :loading="savingInvoice"
            :disabled="
              !hasDoWrChanges || readingDoWr || savingInvoice
            "
            @click="simpanDoWr"
          >
            Simpan Dokumen
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <a-icon-success
      v-if="invoiceDetail.status == 'Selesai'"
      class="invoice-success-banner"
    />

    <section class="invoice-overview" aria-label="Ringkasan invoice">
      <header class="invoice-overview-header">
        <div class="invoice-overview-identity">
          <div class="invoice-document-mark" aria-hidden="true">
            <v-icon icon="mdi-file-document-outline" size="21" />
          </div>

          <div class="invoice-overview-copy">
            <div class="invoice-overview-kicker">Detail Invoice</div>
            <div class="invoice-title-row">
              <h3>INV/DRM/{{ invoiceYear }}/{{ invoiceDetail.no_inv }}</h3>
              <span class="invoice-status-badge">
                <span class="invoice-status-dot" aria-hidden="true"></span>
                {{ invoiceDetail.status }}
              </span>
            </div>
            <div class="invoice-customer-name">
              {{ invoiceDetail.nama_customer || "-" }}
            </div>
            <p class="invoice-subject">{{ invoiceDetail.perihal || "-" }}</p>
          </div>
        </div>

        <div class="invoice-overview-actions">
          <v-btn
            v-if="invoiceDetail.status == 'Draft'"
            color="primary"
            variant="flat"
            size="small"
            prepend-icon="mdi-check-circle-outline"
            class="invoice-payment-action"
            @click="openDialogSelesai"
          >
            Upload Bukti Bayar
          </v-btn>

          <div class="invoice-created-at">
            <span>Dibuat</span>
            <strong>{{ rubahtanggalunix(invoiceDetail.createdAt) }}</strong>
          </div>
        </div>
      </header>

      <div class="invoice-overview-links">
        <NuxtLink
          :to="'/admin/penawaran/' + invoiceDetail.id_penawaran"
          class="invoice-context-link"
        >
          <span class="invoice-context-icon">
            <v-icon icon="mdi-file-document-outline" size="16" />
          </span>
          <span>
            <small>Quotation</small>
            <strong>{{ invoiceDetail.no_penawaran || "-" }}</strong>
          </span>
          <v-icon icon="mdi-arrow-top-right" size="16" />
        </NuxtLink>

        <NuxtLink
          :to="`/admin/penawaran/${invoiceDetail.id_penawaran}/pengeluaran`"
          class="invoice-context-link"
        >
          <span class="invoice-context-icon">
            <v-icon icon="mdi-wallet-outline" size="16" />
          </span>
          <span>
            <small>Project</small>
            <strong>Pengeluaran Project</strong>
          </span>
          <v-icon icon="mdi-arrow-right" size="16" />
        </NuxtLink>
      </div>
    </section>

    <section class="invoice-information-panel" aria-label="Dokumen invoice">
      <div class="invoice-panel-heading">
        <div>
          <h2>Dokumen & Referensi</h2>
          <p>Referensi transaksi dan lampiran yang terkait dengan invoice.</p>
        </div>
      </div>

      <div class="invoice-information-grid">
        <article class="invoice-information-column">
          <div class="invoice-information-title">
            <span>Purchase Order</span>
            <v-icon icon="mdi-file-document-outline" size="17" />
          </div>

          <dl class="invoice-reference-details">
            <div>
              <dt>Nomor PO</dt>
              <dd>{{ invoiceDetail.no_preorder || "-" }}</dd>
            </div>
            <div>
              <dt>Tanggal PO</dt>
              <dd>{{ invoiceDetail.tanggal_preorder || "-" }}</dd>
            </div>
          </dl>

          <div class="invoice-file-group">
            <span class="invoice-file-label">Lampiran</span>
            <div
              v-if="invoiceDetail.doc_preorder?.length"
              class="invoice-file-list"
            >
              <a
                v-for="(item, index) in invoiceDetail.doc_preorder"
                :key="index"
                :href="item.dataUrl"
                class="invoice-file-link"
                target="_blank"
                rel="noopener noreferrer"
                @click.prevent="bukaDokumenLampiran(item)"
              >
                <v-icon icon="mdi-paperclip" size="15" />
                <span>{{ item.name }}</span>
                <v-icon icon="mdi-open-in-new" size="13" />
              </a>
            </div>
            <div v-else class="invoice-file-empty">Belum ada dokumen</div>
          </div>
        </article>

        <article class="invoice-information-column">
          <div class="invoice-information-title">
            <span>Pembayaran</span>
            <v-icon icon="mdi-credit-card-check-outline" size="17" />
          </div>

          <dl class="invoice-reference-details invoice-reference-details--single">
            <div>
              <dt>Tanggal Bayar</dt>
              <dd>{{ invoiceDetail.tanggal_bayar || "-" }}</dd>
            </div>
          </dl>

          <div class="invoice-file-group">
            <span class="invoice-file-label">Bukti pembayaran</span>
            <div
              v-if="invoiceDetail.doc_bukti_bayar?.length"
              class="invoice-file-list"
            >
              <a
                v-for="(item, index) in invoiceDetail.doc_bukti_bayar"
                :key="index"
                :href="item.dataUrl"
                class="invoice-file-link"
                target="_blank"
                rel="noopener noreferrer"
                @click.prevent="bukaDokumenLampiran(item)"
              >
                <v-icon icon="mdi-paperclip" size="15" />
                <span>{{ item.name }}</span>
                <v-icon icon="mdi-open-in-new" size="13" />
              </a>
            </div>
            <div v-else class="invoice-file-empty">Belum ada dokumen</div>
          </div>
        </article>

        <article class="invoice-information-column">
          <div class="invoice-information-title">
            <span>Delivery Order / WCR</span>
            <v-icon icon="mdi-truck-check-outline" size="17" />
          </div>

          <p class="invoice-information-description">
            Delivery Order atau Work Completion Report.
          </p>

          <v-btn
            variant="outlined"
            color="blue-grey-darken-2"
            size="small"
            prepend-icon="mdi-plus"
            class="invoice-do-action"
            @click="openDialogDoWr"
          >
            Add / Edit Dokumen
          </v-btn>

          <div class="invoice-file-group invoice-file-group--do">
            <span class="invoice-file-label">Dokumen tersimpan</span>
            <div
              v-if="invoiceDetail.doc_do_wr?.length"
              class="invoice-file-list"
            >
              <a
                v-for="(item, index) in invoiceDetail.doc_do_wr"
                :key="index"
                :href="item.dataUrl"
                class="invoice-file-link"
                target="_blank"
                rel="noopener noreferrer"
                @click.prevent="bukaDokumenLampiran(item)"
              >
                <v-icon icon="mdi-paperclip" size="15" />
                <span>{{ item.name }}</span>
                <v-icon icon="mdi-open-in-new" size="13" />
              </a>
            </div>
            <div v-else class="invoice-file-empty">Belum ada dokumen</div>
          </div>
        </article>
      </div>
    </section>

    <section class="invoice-financial-panel" aria-label="Ringkasan keuangan">
      <div class="invoice-panel-heading invoice-financial-heading">
        <div>
          <h2>Ringkasan Keuangan</h2>
          <p>Posisi nilai invoice dan pengeluaran project saat ini.</p>
        </div>
      </div>

      <div class="invoice-financial-grid">
        <div class="invoice-financial-item">
          <span>Total Invoice</span>
          <strong>
            {{ formatInvoiceCurrency(invoiceDetail.grandtotal_invoice) }}
          </strong>
        </div>

        <div class="invoice-financial-item">
          <span>Total Pengeluaran</span>
          <strong>
            {{ formatInvoiceCurrency(invoiceDetail.grandtotal_pengeluaran) }}
          </strong>
        </div>

        <div class="invoice-financial-item invoice-financial-item--balance">
          <span>Sisa Saldo Invoice</span>
          <strong>
            {{
              formatInvoiceCurrency(
                invoiceDetail.grandtotal_invoice -
                  invoiceDetail.grandtotal_pengeluaran,
              )
            }}
          </strong>
        </div>
      </div>
    </section>

    <div
      ref="invoiceWrapper"
      class="penawaran-wrapper"
      :style="{
        height:
          isMobile && invoiceHeight ? `${invoiceHeight}px` : undefined,
      }"
    >
      <div
        ref="invoiceContent"
        class="penawaran-content"
        :style="{
          transform: isMobile ? `scale(${invoiceScale})` : undefined,
        }"
      >
        <canvas-invoice
          :invoice-detail="invoiceDetail"
          :quotation-grand-total="quotationGrandTotal"
          :related-invoices="relatedInvoices"
        />
      </div>
    </div>

    <v-divider class="my-1 mt-10" opacity="100" color="primary"></v-divider>

    <div
      ref="deliveryOrderWrapper"
      class="penawaran-wrapper mt-8"
      :style="{
        height:
          isMobile && deliveryOrderHeight
            ? `${deliveryOrderHeight}px`
            : undefined,
      }"
    >
      <div
        ref="deliveryOrderContent"
        class="penawaran-content"
        :style="{
          transform: isMobile ? `scale(${deliveryOrderScale})` : undefined,
        }"
      >
        <DeliveryOrder :invoice-detail="invoiceDetail" />
      </div>
    </div>
    <!-- <div class="preview-container d-flex justify-center mt-8">
      <work-complete-report :invoice-detail="invoiceDetail" />
    </div> -->
  </div>
</template>

<script setup lang="ts">
import moment from "moment";
import type { ConfirmationDialog } from "#components";
import type {
  invoiceCurrencyM,
  invoiceM,
  invoiceBuktiBayarM,
  invoiceDoWrM,
} from "~/types/invoice";
import { uploadStore } from "~/stores/uploadStore";
import { queryambilid } from "~/composables/useFirestoreQuery";
import { tarikdetaildatabase2 } from "~/composables/useFirestore";

definePageMeta({
  layout: "admin",
});

const invoiceStore = useinvoiceStore();
const uploadStoreInstance = uploadStore();
const notificationStore = useNotificationStore();
const userStore = useUserStore();
const route = useRoute();

const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);

const dialogDikirim = ref(false);
const readingBuktiBayar = ref(false);
const readingDoWr = ref(false);
const savingInvoice = ref(false);
const doWrUploadProgress = ref(0);
const activeDoWrFileName = ref("");
const MAX_INVOICE_BYTES = 900 * 1024;
const quotationGrandTotal = ref(0);
const relatedInvoices = ref<invoiceM[]>([]);
const invoiceWrapper = ref<HTMLElement | null>(null);
const invoiceContent = ref<HTMLElement | null>(null);
const isMobile = ref(
  import.meta.client && window.matchMedia("(max-width: 600px)").matches,
);
const invoiceScale = ref(1);
const invoiceHeight = ref(0);
const deliveryOrderWrapper = ref<HTMLElement | null>(null);
const deliveryOrderContent = ref<HTMLElement | null>(null);
const deliveryOrderScale = ref(1);
const deliveryOrderHeight = ref(0);

let invoicePreviewObserver: ResizeObserver | null = null;
let invoiceMeasureFrame: number | null = null;

const updateInvoicePreviewLayout = () => {
  const mobile = window.matchMedia("(max-width: 600px)").matches;
  isMobile.value = mobile;

  if (!mobile) {
    invoiceScale.value = 1;
    invoiceHeight.value = 0;
    deliveryOrderScale.value = 1;
    deliveryOrderHeight.value = 0;
    return;
  }

  const measurePreview = (
    wrapper: HTMLElement | null,
    content: HTMLElement | null,
  ) => {
    if (!wrapper || !content) return null;

    const wrapperWidth = wrapper.clientWidth;
    const documentWidth = content.scrollWidth;
    const documentHeight = content.scrollHeight;
    if (!wrapperWidth || !documentWidth) return null;

    const scale = Math.min(1, wrapperWidth / documentWidth);
    return {
      scale,
      height: Math.ceil(documentHeight * scale),
    };
  };

  const invoiceMeasurement = measurePreview(
    invoiceWrapper.value,
    invoiceContent.value,
  );
  if (invoiceMeasurement) {
    invoiceScale.value = invoiceMeasurement.scale;
    invoiceHeight.value = invoiceMeasurement.height;
  }

  const deliveryOrderMeasurement = measurePreview(
    deliveryOrderWrapper.value,
    deliveryOrderContent.value,
  );
  if (deliveryOrderMeasurement) {
    deliveryOrderScale.value = deliveryOrderMeasurement.scale;
    deliveryOrderHeight.value = deliveryOrderMeasurement.height;
  }
};

const scheduleInvoicePreviewLayout = () => {
  if (invoiceMeasureFrame !== null) return;

  invoiceMeasureFrame = window.requestAnimationFrame(() => {
    invoiceMeasureFrame = null;
    updateInvoicePreviewLayout();
  });
};

onMounted(async () => {
  useloadingStore().setLoading(true);
  try {
    await invoiceStore.tarikDetailInvoiceAct(route.params.id as string);

    const penawaranId = invoiceStore.getDetailInvoice.id_penawaran;
    if (penawaranId) {
      const [penawaran, invoices] = await Promise.all([
        tarikdetaildatabase2("penawaran", penawaranId),
        queryambilid(`penawaran/${penawaranId}/invoice`),
      ]);
      quotationGrandTotal.value = Number(penawaran?.grand_total_penawaran || 0);
      relatedInvoices.value = invoices as invoiceM[];
    }
  } finally {
    useloadingStore().setLoading(false);
  }
});

onMounted(() => {
  updateInvoicePreviewLayout();

  invoicePreviewObserver = new ResizeObserver(scheduleInvoicePreviewLayout);
  [
    invoiceWrapper.value,
    invoiceContent.value,
    deliveryOrderWrapper.value,
    deliveryOrderContent.value,
  ].forEach((element) => {
    if (element) invoicePreviewObserver?.observe(element);
  });

  window.addEventListener("resize", scheduleInvoicePreviewLayout, {
    passive: true,
  });
});

const data = reactive({
  dialogSelesai: false,
  dialogTambahDoWr: false,
});

function openDialogSelesai() {
  data.dialogSelesai = true;
}

function openDialogDoWr() {
  resetDoWrFiles();
  const documents = invoiceDetail.value.doc_do_wr || [];
  savedDoWrDocuments.value = [...documents];
  originalDoWrDocuments.value = [...documents];
  data.dialogTambahDoWr = true;
}

function tutupDialogDoWr() {
  if (readingDoWr.value || savingInvoice.value) return;
  data.dialogTambahDoWr = false;
}

const invoiceDetail = computed(() => invoiceStore.getDetailInvoice);
const invoiceYear = computed(() => invoiceDetail.value.tanggal?.slice(0, 4));
const invoiceCurrency = computed<invoiceCurrencyM>(() => {
  const currency = invoiceDetail.value.currency_inv;
  return currency === "USD" || currency === "SGD" ? currency : "IDR";
});
const invoiceCurrencyPrefix = computed(() =>
  invoiceCurrency.value === "IDR" ? "Rp" : invoiceCurrency.value,
);

function formatInvoiceNumber(value?: number) {
  const fractionDigits = invoiceCurrency.value === "IDR" ? 0 : 2;
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number(value) || 0);
}

function formatInvoiceCurrency(value?: number) {
  return `${invoiceCurrencyPrefix.value} ${formatInvoiceNumber(value)}`;
}

const poObjectUrls = new Map<string, string>();

async function tambahDokumenBb(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);

  input.value = "";

  if (!files.length || readingBuktiBayar.value || savingInvoice.value) return;

  const draft = invoiceDetail.value;

  const existingBytes = new TextEncoder().encode(
    JSON.stringify(draft),
  ).byteLength;

  const fileBytes = files.reduce(
    (total, file) => total + 4 * Math.ceil(file.size / 3),
    0,
  );

  if (existingBytes + fileBytes > MAX_INVOICE_BYTES) {
    return notificationStore.showError(
      "Total dokumen PO terlalu besar. Kurangi ukuran atau jumlah file.",
    );
  }

  readingBuktiBayar.value = true;

  try {
    const documents: invoiceBuktiBayarM[] = [];

    for (const file of files) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () =>
          typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("File PO tidak dapat dibaca"));

        reader.onerror = () =>
          reject(reader.error || new Error("File PO tidak dapat dibaca"));

        reader.onabort = () =>
          reject(new Error("Pembacaan file PO dibatalkan"));

        reader.readAsDataURL(file);
      });

      documents.push({
        name: file.name,
        dataUrl,
        size: file.size,
        contentType: file.type || "application/octet-stream",
      });
    }

    const doc_bukti_bayar = [...(draft.doc_bukti_bayar || []), ...documents];

    if (
      new TextEncoder().encode(JSON.stringify({ ...draft, doc_bukti_bayar }))
        .byteLength > MAX_INVOICE_BYTES
    ) {
      return notificationStore.showError(
        "Ukuran invoice beserta dokumen PO terlalu besar. Kurangi ukuran atau jumlah file.",
      );
    }

    if (invoiceDetail.value === draft && data.dialogSelesai)
      draft.doc_bukti_bayar = doc_bukti_bayar;
  } catch (error) {
    notificationStore.showError(
      "File PO tidak dapat dibaca. Silakan coba lagi.",
    );
  } finally {
    readingBuktiBayar.value = false;
  }
}

function bukaDokumenLampiran(document: invoiceBuktiBayarM | invoiceDoWrM) {
  try {
    let url = document.dataUrl;

    if (url.startsWith("data:")) {
      const cachedUrl = poObjectUrls.get(url);

      if (cachedUrl) {
        url = cachedUrl;
      } else {
        const separator = url.indexOf(",");
        const header = url.slice(0, separator);

        if (separator < 0 || !header.endsWith(";base64")) {
          throw new Error("Format dokumen PO tidak valid");
        }

        const bytes = Uint8Array.from(atob(url.slice(separator + 1)), (char) =>
          char.charCodeAt(0),
        );

        const contentType =
          header.slice(5).split(";")[0] ||
          document.contentType ||
          "application/octet-stream";

        const objectUrl = URL.createObjectURL(
          new Blob([bytes], { type: contentType }),
        );

        poObjectUrls.set(url, objectUrl);
        url = objectUrl;
      }
    }

    window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    notificationStore.showError(
      "Dokumen tidak dapat dibuka. Silakan coba unggah ulang file.",
    );
  }
}

onBeforeUnmount(() => {
  poObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  poObjectUrls.clear();

  invoicePreviewObserver?.disconnect();
  window.removeEventListener("resize", scheduleInvoicePreviewLayout);
  if (invoiceMeasureFrame !== null) {
    window.cancelAnimationFrame(invoiceMeasureFrame);
  }
});

function bukaDialogDikirim() {
  uploadStoreInstance.setReset();
  dialogDikirim.value = true;
}

function tutupDialogDikirim() {
  uploadStoreInstance.setReset();
  dialogDikirim.value = false;
}

async function ubahStatusDikirim() {
  const id = route.params.id as string;

  const invoice = JSON.parse(JSON.stringify(invoiceDetail.value)) as invoiceM;

  invoice.status = "Dikirim";
  invoice.dokumen_dikirim = uploadStoreInstance.getUrlRef;
  invoice.dikirimAt = moment().unix();
  invoice.dikirimBy = userStore.getEmail;

  const updated = await invoiceStore.updateInvoiceAct(id, invoice);

  if (!updated) return;

  await invoiceStore.tarikDetailInvoiceAct(id);

  tutupDialogDikirim();

  navigateTo("/admin/invoice/dikirim");
}

const poFiles = ref<File[]>([]);
const doWrFiles = ref<File[]>([]);
const savedDoWrDocuments = ref<invoiceDoWrM[]>([]);
const originalDoWrDocuments = ref<invoiceDoWrM[]>([]);
const doWrTotalBytes = computed(() =>
  doWrFiles.value.reduce((total, file) => total + file.size, 0),
);
const hasDoWrChanges = computed(() => {
  if (doWrFiles.value.length) return true;
  if (savedDoWrDocuments.value.length !== originalDoWrDocuments.value.length) {
    return true;
  }

  return savedDoWrDocuments.value.some(
    (document, index) =>
      document.dataUrl !== originalDoWrDocuments.value[index]?.dataUrl,
  );
});

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readPoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("File PO tidak dapat dibaca"));
    };

    reader.onerror = () =>
      reject(reader.error || new Error("File PO tidak dapat dibaca"));

    reader.onabort = () => reject(new Error("Pembacaan file PO dibatalkan"));

    reader.readAsDataURL(file);
  });
}

function addfile(event: Event) {
  const target = event.target as HTMLInputElement;

  if (target.files && target.files.length > 0) {
    poFiles.value = [...poFiles.value, ...Array.from(target.files)];
  }

  target.value = "";
}

function addDoWrFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = "";

  if (!files.length) return;

  const validFiles = files.filter((file) => file.size > 0);
  if (validFiles.length !== files.length) {
    notificationStore.showError("File kosong tidak dapat diunggah.");
  }

  const knownFiles = new Set(
    doWrFiles.value.map(
      (file) => `${file.name}-${file.size}-${file.lastModified}`,
    ),
  );
  const uniqueFiles = validFiles.filter(
    (file) => !knownFiles.has(`${file.name}-${file.size}-${file.lastModified}`),
  );

  doWrFiles.value = [...doWrFiles.value, ...uniqueFiles];
}

function removeDoWrFile(index: number) {
  if (readingDoWr.value) return;
  doWrFiles.value.splice(index, 1);
}

function removeSavedDoWrDocument(index: number) {
  if (readingDoWr.value) return;
  savedDoWrDocuments.value.splice(index, 1);
}

function resetDoWrFiles() {
  if (readingDoWr.value) return;
  doWrFiles.value = [];
  savedDoWrDocuments.value = [];
  originalDoWrDocuments.value = [];
  doWrUploadProgress.value = 0;
  activeDoWrFileName.value = "";
}

function readDoWrFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Dokumen DO/WR tidak dapat dibaca"));
    reader.onerror = () =>
      reject(reader.error || new Error("Dokumen DO/WR tidak dapat dibaca"));
    reader.onabort = () =>
      reject(new Error("Pembacaan dokumen DO/WR dibatalkan"));
    reader.readAsDataURL(file);
  });
}

async function simpanDoWr() {
  if (savingInvoice.value || readingDoWr.value) return;
  if (!hasDoWrChanges.value) return;

  savingInvoice.value = true;
  readingDoWr.value = true;
  doWrUploadProgress.value = doWrFiles.value.length ? 0 : 100;

  try {
    const id = route.params.id as string;
    const invoice = JSON.parse(JSON.stringify(invoiceDetail.value)) as invoiceM;
    invoice.doc_do_wr = [...savedDoWrDocuments.value];

    const estimatedFileBytes = doWrFiles.value.reduce(
      (total, file) => total + 4 * Math.ceil(file.size / 3),
      0,
    );
    const currentInvoiceBytes = new TextEncoder().encode(
      JSON.stringify(invoice),
    ).byteLength;

    if (currentInvoiceBytes + estimatedFileBytes > MAX_INVOICE_BYTES) {
      notificationStore.showError(
        "Total dokumen DO/WR terlalu besar. Kurangi ukuran atau jumlah file baru (maksimal sekitar 650 KB total).",
      );
      return;
    }

    const newDocuments: invoiceDoWrM[] = [];
    const totalBytes = doWrTotalBytes.value;
    let completedBytes = 0;

    for (const file of doWrFiles.value) {
      activeDoWrFileName.value = file.name;
      const document: invoiceDoWrM = {
        name: file.name,
        dataUrl: await readDoWrFile(file),
        size: file.size,
        contentType: file.type || "application/octet-stream",
      };

      completedBytes += file.size;
      doWrUploadProgress.value = totalBytes
        ? Math.round((completedBytes / totalBytes) * 100)
        : 100;
      newDocuments.push(document);
    }

    invoice.doc_do_wr = [
      ...savedDoWrDocuments.value,
      ...newDocuments,
    ];

    if (
      new TextEncoder().encode(JSON.stringify(invoice)).byteLength >
      MAX_INVOICE_BYTES
    ) {
      notificationStore.showError(
        "Ukuran invoice beserta dokumen DO/WR terlalu besar. Kurangi ukuran atau jumlah file.",
      );
      return;
    }

    const updated = await invoiceStore.updateInvoiceAct(id, invoice, {
      showLoading: false,
    });
    if (!updated) return;

    data.dialogTambahDoWr = false;
  } catch (error) {
    console.error("Gagal menyimpan dokumen DO/WR:", error);
    notificationStore.showError(
      "Dokumen DO/WR gagal dibaca atau disimpan. Silakan coba lagi.",
    );
  } finally {
    readingDoWr.value = false;
    savingInvoice.value = false;
    activeDoWrFileName.value = "";
  }
}

async function ubahStatusSelesai() {
  if (savingInvoice.value) return;
  if (!invoiceDetail.value.tanggal_bayar) {
    notificationStore.showError("Tanggal di Bayar wajib diisi!");
    return;
  }

  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Selesai",
    "Anda yakin ingin mengubah status invoice menjadi Selesai?",
  );

  if (!confirmed) return;

  savingInvoice.value = true;
  readingBuktiBayar.value = true;

  try {
    const id = route.params.id as string;

    const invoice = JSON.parse(JSON.stringify(invoiceDetail.value)) as invoiceM;

    const newDocuments: invoiceBuktiBayarM[] = [];

    for (const file of poFiles.value) {
      newDocuments.push({
        name: file.name,
        dataUrl: await readPoFile(file),
        size: file.size,
        contentType: file.type || "application/octet-stream",
      });
    }

    invoice.doc_bukti_bayar = [
      ...(invoiceDetail.value.doc_bukti_bayar || []),
      ...newDocuments,
    ];

    invoice.status = "Selesai";
    invoice.tanggal_bayar = invoiceDetail.value.tanggal_bayar;
    invoice.selesaiAt = moment().unix();
    invoice.selesaiBy = userStore.getEmail;

    const updated = await invoiceStore.updateInvoiceAct(id, invoice);
    if (!updated) return;

    poFiles.value = [];
    data.dialogSelesai = false;

    await invoiceStore.tarikDetailInvoiceAct(id);
  } catch (error) {
    notificationStore.showError("Bukti pembayaran gagal dibaca atau disimpan.");
  } finally {
    readingBuktiBayar.value = false;
    savingInvoice.value = false;
  }
}

</script>

<style scoped>
.penawaran-wrapper {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.penawaran-content {
  width: 100%;
  transform-origin: top left;
}

@media (max-width: 600px) {
  .penawaran-content {
    width: max-content;
    min-width: 100%;
  }
}

/* ============================================================
   INVOICE OVERVIEW
   ============================================================ */

.invoice-page-nav,
.invoice-overview,
.invoice-information-panel,
.invoice-financial-panel {
  width: min(100%, 960px);
  margin-right: auto;
  margin-left: auto;
}

.invoice-page-nav {
  margin-bottom: 10px;
}

.invoice-back-button {
  min-width: 0 !important;
  padding-inline: 4px 10px !important;
  color: #475569 !important;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0 !important;
  text-transform: none;
}

.invoice-overview,
.invoice-information-panel,
.invoice-financial-panel {
  overflow: hidden;
  border: 1px solid #dfe4ea;
  border-radius: 10px;
  background: #ffffff;
}

.invoice-overview,
.invoice-information-panel {
  margin-bottom: 14px;
}

.invoice-financial-panel {
  margin-bottom: 18px;
}

.invoice-overview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 32px;
  padding: 24px 26px 22px;
}

.invoice-overview-identity {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
}

.invoice-document-mark {
  display: grid;
  place-items: center;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  border: 1px solid #dbe2e9;
  border-radius: 7px;
  background: #f7f9fb;
  color: #243b53;
}

.invoice-overview-copy {
  min-width: 0;
}

.invoice-overview-kicker {
  margin-bottom: 5px;
  color: #7b8794;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  line-height: 1.2;
  text-transform: uppercase;
}

.invoice-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 9px;
}

.invoice-title-row h1 {
  margin: 0;
  color: #172b3f;
  font-size: clamp(19px, 2.2vw, 25px);
  font-weight: 720;
  letter-spacing: -0.025em;
  line-height: 1.25;
}

.invoice-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  padding: 3px 9px;
  border: 1px solid #d9e1e8;
  border-radius: 999px;
  color: #46586a;
  background: #f8fafb;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;
  text-transform: uppercase;
}

.invoice-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3f6f8f;
}

.invoice-customer-name {
  margin-top: 9px;
  color: #263849;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
}

.invoice-subject {
  max-width: 600px;
  margin: 3px 0 0;
  color: #657384;
  font-size: 12px;
  line-height: 1.55;
}

.invoice-overview-actions {
  display: flex;
  align-items: flex-end;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 13px;
}

.invoice-payment-action {
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0 !important;
  text-transform: none;
}

.invoice-created-at {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: #82909d;
  font-size: 10px;
  line-height: 1.3;
  white-space: nowrap;
}

.invoice-created-at strong {
  color: #526171;
  font-weight: 650;
}

.invoice-overview-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid #e5e9ee;
  background: #fafbfc;
}

.invoice-context-link {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 13px 18px;
  color: #33475b;
  text-decoration: none;
  transition: background-color 0.15s ease;
}

.invoice-context-link + .invoice-context-link {
  border-left: 1px solid #e5e9ee;
}

.invoice-context-link:hover {
  background: #f3f6f8;
}

.invoice-context-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid #dce3ea;
  border-radius: 6px;
  background: #ffffff;
  color: #51677a;
}

.invoice-context-link > span:nth-child(2) {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.invoice-context-link small {
  color: #8a96a3;
  font-size: 9px;
  font-weight: 650;
  letter-spacing: 0.06em;
  line-height: 1.3;
  text-transform: uppercase;
}

.invoice-context-link strong {
  overflow: hidden;
  color: #2f4356;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invoice-panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 17px 20px;
  border-bottom: 1px solid #e5e9ee;
}

.invoice-panel-heading h2 {
  margin: 0;
  color: #243648;
  font-size: 13px;
  font-weight: 750;
  letter-spacing: -0.01em;
  line-height: 1.35;
}

.invoice-panel-heading p {
  margin: 2px 0 0;
  color: #82909d;
  font-size: 10px;
  line-height: 1.45;
}

.invoice-information-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.invoice-information-column {
  min-width: 0;
  padding: 18px 20px 20px;
}

.invoice-information-column + .invoice-information-column {
  border-left: 1px solid #e5e9ee;
}

.invoice-information-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 15px;
  color: #34495c;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.02em;
  line-height: 1.35;
  text-transform: uppercase;
}

.invoice-information-title .v-icon {
  color: #718293;
}

.invoice-reference-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.invoice-reference-details--single {
  grid-template-columns: 1fr;
}

.invoice-reference-details div {
  min-width: 0;
}

.invoice-reference-details dt,
.invoice-file-label {
  display: block;
  margin-bottom: 4px;
  color: #8a96a3;
  font-size: 9px;
  font-weight: 650;
  letter-spacing: 0.05em;
  line-height: 1.3;
  text-transform: uppercase;
}

.invoice-reference-details dd {
  margin: 0;
  overflow: hidden;
  color: #293d50;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invoice-information-description {
  min-height: 34px;
  margin: 0 0 12px;
  color: #6d7c8b;
  font-size: 10px;
  line-height: 1.55;
}

.invoice-do-action {
  min-width: 0;
  margin-bottom: 14px;
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0 !important;
  text-transform: none;
}

.invoice-file-group {
  margin-top: 16px;
}

.invoice-file-group--do {
  margin-top: 0;
}

.invoice-file-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.invoice-file-link {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  min-width: 0;
  padding: 7px 8px;
  border: 1px solid #e1e6eb;
  border-radius: 6px;
  color: #43586b;
  background: #fafbfc;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.25;
  text-decoration: none;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.invoice-file-link:hover {
  border-color: #b8c6d2;
  background: #f4f7f9;
}

.invoice-file-link span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invoice-file-link .v-icon {
  color: #6b7f90;
}

.invoice-file-empty {
  padding: 8px 0;
  color: #9aa5b1;
  font-size: 10px;
  line-height: 1.4;
}

.invoice-financial-heading {
  border-bottom: 0;
  padding-bottom: 10px;
}

.invoice-financial-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 0 20px 20px;
}

.invoice-financial-item {
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid #e2e7ec;
  background: #ffffff;
}

.invoice-financial-item:first-child {
  border-radius: 7px 0 0 7px;
}

.invoice-financial-item + .invoice-financial-item {
  border-left: 0;
}

.invoice-financial-item:last-child {
  border-radius: 0 7px 7px 0;
}

.invoice-financial-item span {
  display: block;
  margin-bottom: 6px;
  color: #7e8b98;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1.3;
  text-transform: uppercase;
}

.invoice-financial-item strong {
  display: block;
  overflow: hidden;
  color: #293d50;
  font-size: clamp(13px, 1.6vw, 16px);
  font-weight: 750;
  letter-spacing: -0.01em;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invoice-financial-item--balance {
  border-color: #cad7e1;
  background: #f4f7f9;
}

.invoice-financial-item--balance strong {
  color: #193b55;
  font-size: clamp(13px, 1.6vw, 16px);
}

:deep(.invoice-success-banner.success-container) {
  width: min(100%, 960px);
  min-height: 0;
  margin: 0 auto 14px;
  padding: 0;
}

:deep(.invoice-success-banner .modern-success-message) {
  justify-content: flex-start;
  gap: 8px;
  max-width: none;
  margin: 0;
  padding: 9px 12px;
  border: 1px solid #bfdac8;
  border-radius: 8px;
  color: #28633c;
  background: #f3f8f4;
  box-shadow: none;
  font-family: inherit;
}

:deep(.invoice-success-banner .modern-success-message:hover) {
  transform: none;
  box-shadow: none;
}

:deep(.invoice-success-banner .icon-wrapper) {
  width: 24px;
  min-width: 24px;
  height: 24px;
  border: 0;
  background: transparent;
  box-shadow: none;
  animation: none;
}

:deep(.invoice-success-banner .success-icon) {
  width: 18px;
  height: 18px;
}

:deep(.invoice-success-banner .text-wrapper .title) {
  color: #28633c;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.04em;
}

:deep(.invoice-success-banner .modern-success-message::before) {
  display: none;
}


/* ============================================================
   UPLOAD
   ============================================================ */

.po-upload-row {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
}

.po-upload-wrapper {
  flex-shrink: 0;
}

.po-files-wrapper {
  flex: 1;
  min-width: 0;
}

.po-upload-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.po-upload-box {
  position: relative;
  width: 150px;
  height: 82px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
  transition: 0.2s;
}

.po-upload-box:hover {
  border-color: #64748b;
  background: #f1f5f9;
}

.po-file-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.po-upload-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 17px;
}

.po-upload-title {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.po-upload-info {
  margin-top: 2px;
  font-size: 10px;
  color: #94a3b8;
}

.po-file-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.po-file-item {
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

.po-file-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: #475569;
}

.po-file-remove {
  flex-shrink: 0;
  border: 0;
  background: transparent;
  color: #94a3b8;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.po-file-remove:hover:not(:disabled) {
  color: #dc2626;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */

@media (max-width: 900px) {
  .invoice-information-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .invoice-information-column:nth-child(3) {
    grid-column: 1 / -1;
    border-top: 1px solid #e5e9ee;
    border-left: 0;
  }

  .invoice-information-description {
    min-height: 0;
  }
}

@media (max-width: 640px) {
  .invoice-page-nav {
    margin-bottom: 8px;
  }

  .invoice-overview,
  .invoice-information-panel,
  .invoice-financial-panel {
    border-radius: 8px;
  }

  .invoice-overview,
  .invoice-information-panel {
    margin-bottom: 10px;
  }

  .invoice-overview-header {
    align-items: stretch;
    flex-direction: column;
    gap: 18px;
    padding: 18px 16px 16px;
  }

  .invoice-overview-identity {
    gap: 11px;
  }

  .invoice-document-mark {
    flex-basis: 34px;
    width: 34px;
    height: 34px;
  }

  .invoice-title-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 7px;
  }

  .invoice-title-row h1 {
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  .invoice-overview-actions {
    align-items: stretch;
    width: 100%;
    gap: 10px;
  }

  .invoice-payment-action {
    width: 100%;
  }

  .invoice-created-at {
    justify-content: space-between;
    width: 100%;
    padding-top: 10px;
    border-top: 1px solid #e7ebef;
  }

  .invoice-overview-links {
    grid-template-columns: 1fr;
  }

  .invoice-context-link {
    min-height: 56px;
    padding: 12px 16px;
  }

  .invoice-context-link + .invoice-context-link {
    border-top: 1px solid #e5e9ee;
    border-left: 0;
  }

  .invoice-panel-heading {
    padding: 15px 16px;
  }

  .invoice-information-grid {
    grid-template-columns: 1fr;
  }

  .invoice-information-column,
  .invoice-information-column:nth-child(3) {
    grid-column: auto;
    padding: 16px;
    border-left: 0;
  }

  .invoice-information-column + .invoice-information-column,
  .invoice-information-column:nth-child(3) {
    border-top: 1px solid #e5e9ee;
  }

  .invoice-financial-heading {
    padding-bottom: 8px;
  }

  .invoice-financial-grid {
    grid-template-columns: 1fr;
    gap: 0;
    padding: 0 16px 16px;
  }

  .invoice-financial-item,
  .invoice-financial-item:first-child,
  .invoice-financial-item:last-child {
    border-radius: 0;
  }

  .invoice-financial-item:first-child {
    border-radius: 7px 7px 0 0;
  }

  .invoice-financial-item + .invoice-financial-item {
    border-top: 0;
    border-left: 1px solid #e2e7ec;
  }

  .invoice-financial-item:last-child {
    border-radius: 0 0 7px 7px;
  }

  .invoice-financial-item--balance {
    border-color: #cad7e1 !important;
  }

  .po-upload-row {
    flex-direction: column;
  }
}

/* ============================================================
   DO / WCR UPLOAD DIALOG
   ============================================================ */

.do-wr-dialog {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12) !important;
}

.do-wr-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px 16px;
  background: #ffffff;
}

.do-wr-dialog-heading {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  min-width: 0;
}

.do-wr-dialog-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 34px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #334155;
}

.do-wr-dialog-title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
}

.do-wr-dialog-subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
}

.do-wr-dialog-body {
  padding: 20px !important;
}

.do-wr-upload-area {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 78px;
  padding: 15px 16px;
  border: 1px dashed #b8c4d2;
  border-radius: 9px;
  background: #f8fafc;
  color: #475569;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.do-wr-upload-area:hover {
  border-color: #64748b;
  background: #f4f7fa;
}

.do-wr-upload-area:focus-within {
  border-color: #1867c0;
  box-shadow: 0 0 0 3px rgba(24, 103, 192, 0.1);
}

.do-wr-upload-area--disabled {
  cursor: wait;
  opacity: 0.65;
}

.do-wr-upload-copy {
  min-width: 0;
}

.do-wr-upload-title {
  color: #1e293b;
  font-size: 13px;
  font-weight: 700;
}

.do-wr-upload-description {
  margin-top: 2px;
  color: #64748b;
  font-size: 11px;
  line-height: 1.45;
}

.do-wr-selected-files {
  margin-top: 16px;
}

.do-wr-selected-header,
.do-wr-progress-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #64748b;
  font-size: 11px;
}

.do-wr-selected-header {
  margin-bottom: 7px;
}

.do-wr-file-list {
  display: flex;
  flex-direction: column;
  max-height: 260px;
  overflow-y: auto;
  border-top: 1px solid #e2e8f0;
}

.do-wr-file-item {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 48px;
  padding: 7px 2px;
  border-bottom: 1px solid #e2e8f0;
}

.do-wr-file-icon {
  flex: 0 0 auto;
  color: #64748b;
}

.do-wr-file-info {
  min-width: 0;
  flex: 1;
}

.do-wr-file-name {
  overflow: hidden;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.do-wr-file-link {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.do-wr-file-link:hover:not(:disabled) {
  color: #1867c0;
  text-decoration: underline;
}

.do-wr-file-link:disabled {
  cursor: default;
}

.do-wr-file-size {
  margin-top: 1px;
  color: #94a3b8;
  font-size: 10px;
}

.do-wr-upload-progress {
  margin-top: 16px;
  padding: 11px 12px;
  border-radius: 8px;
  background: #f8fafc;
}

.do-wr-progress-label {
  margin-bottom: 7px;
  color: #475569;
}

.do-wr-dialog-footer {
  min-height: 62px;
  padding: 11px 16px !important;
  background: #ffffff;
  gap: 4px;
}

.finish-invoice-dialog {
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

/* HEADER */
.finish-dialog-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

.finish-header-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8f5e9;
  color: #2e7d32;
  flex-shrink: 0;
}

.finish-header-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.3;
}

.finish-header-subtitle {
  margin-top: 3px;
  font-size: 13px;
  color: #6b7280;
}

/* SECTION */
.form-section {
  width: 100%;
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 700;
  color: #374151;
}

/* UPLOAD */
.upload-card {
  width: 100%;
}

.upload-area {
  position: relative;
  min-height: 150px;
  padding: 25px;
  border: 1.5px dashed #cbd5e1;
  border-radius: 14px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-area:hover {
  border-color: #1976d2;
  background: #f5f9ff;
}

.po-file-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-icon-wrapper {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e3f2fd;
  color: #1976d2;
  flex-shrink: 0;
}

.upload-content {
  text-align: left;
}

.upload-title {
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
}

.upload-description {
  margin-top: 3px;
  font-size: 13px;
  color: #6b7280;
}

.upload-limit {
  margin-top: 7px;
  font-size: 11px;
  color: #9ca3af;
}

/* LOADING */
.upload-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  padding: 10px;
  border-radius: 9px;
  background: #f8fafc;
  color: #6b7280;
  font-size: 13px;
}

/* SELECTED FILE */
.selected-files {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.selected-files-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.selected-files-title {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.file-count {
  padding: 3px 9px;
  border-radius: 20px;
  background: #e3f2fd;
  color: #1976d2;
  font-size: 11px;
  font-weight: 600;
}

.po-file-list {
  padding: 6px;
}

.po-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 9px;
  transition: background 0.15s ease;
}

.po-file-item:hover {
  background: #f8fafc;
}

.file-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.file-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ecfdf5;
  color: #059669;
  flex-shrink: 0;
}

.file-info {
  min-width: 0;
}

.po-file-name {
  max-width: 480px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.file-size {
  margin-top: 2px;
  font-size: 11px;
  color: #9ca3af;
}

.po-file-remove {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.po-file-remove:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* FOOTER */
.dialog-footer {
  min-height: 72px;
  padding: 14px 24px;
  background: #fafafa;
  gap: 8px;
}

/* MOBILE */
@media (max-width: 600px) {
  .do-wr-dialog-header {
    padding: 16px;
  }

  .do-wr-dialog-body {
    padding: 16px !important;
  }

  .do-wr-upload-area {
    align-items: flex-start;
  }

  .finish-dialog-header {
    padding: 18px;
  }

  .finish-header-title {
    font-size: 16px;
  }

  .finish-header-subtitle {
    font-size: 12px;
  }

  .upload-area {
    flex-direction: column;
    text-align: center;
    padding: 22px 15px;
  }

  .upload-content {
    text-align: center;
  }

  .dialog-footer {
    padding: 12px 16px;
  }

  .po-file-name {
    max-width: 250px;
  }
}

</style>
