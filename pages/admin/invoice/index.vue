<template>
  <ConfirmationDialog ref="confirmationDialog" />
  <div class="invoice-page-topbar">
    <v-btn
      variant="text"
      color="grey-darken-3"
      icon="mdi-arrow-left"
      @click="$router.go(-1)"
      class="invoice-back-btn text-capitalize font-weight-bold"
    >

    </v-btn>

    <div class="invoice-page-heading">
      <div>
        <h1>Invoice</h1>
        <!-- <p>Manage invoice, client, payment status, and transaction value.</p> -->
      </div>
    </div>
  </div>

  <!-- /// DIALOG BUAT INVOICE \\\ -->
  <v-dialog
    v-model="data.dialogTambahInvoice"
    max-width="1040"
    scrollable
    :fullscreen="display.mdAndDown.value"
    :persistent="readingPo || savingInvoice"
    class="invoice-dialog-overlay"
  >
    <v-card class="invoice-dialog-card" elevation="0">
      <header class="invoice-dialog-header">
        <div class="invoice-dialog-heading">
          <div class="invoice-dialog-icon" aria-hidden="true">
            <v-icon icon="mdi-receipt-text-edit-outline" size="20" />
          </div>
          <div>
            <h2>
              {{ data.invoiceAddEdit === "add" ? "Create" : "Edit" }} Invoice
            </h2>
            <p>{{ newInvoice.no_inv ? `Invoice ${newInvoice.no_inv}` : "Invoice details and billing information" }}</p>
          </div>
        </div>
        <div class="invoice-dialog-header-actions">
          <span class="invoice-dialog-status">
            <span></span>{{ newInvoice.status || "Draft" }}
          </span>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            color="grey-darken-1"
            aria-label="Tutup dialog invoice"
            :disabled="readingPo || savingInvoice"
            @click="data.dialogTambahInvoice = false"
          />
        </div>
      </header>

      <v-card-text class="invoice-dialog-body">
        <section class="invoice-form-section">
          <div class="invoice-section-header">
            <div><span>01</span><h3>Client Information</h3></div>
            <p>Detail client yang terhubung dengan invoice.</p>
          </div>
          <div class="invoice-client-picker">
            <a-text-field-new
              v-model="newInvoice.nama_customer"
              label="Customer"
              disabled
            />
            <a-date-picker-new
              v-model="newInvoice.tanggal"
              label="Tanggal Invoice"
            />
          </div>
          <dl class="invoice-client-details">
            <div class="invoice-client-address"><dt>Address</dt><dd>{{ newInvoice.alamat_customer || "—" }}</dd></div>
            <div><dt>PIC</dt><dd>{{ newInvoice.pic || "—" }}</dd></div>
            <div><dt>Phone Number</dt><dd>{{ newInvoice.no_telp || "—" }}</dd></div>
            <div><dt>Email</dt><dd>{{ newInvoice.email || "—" }}</dd></div>
            <div><dt>Vessel</dt><dd>{{ newInvoice.vessel || "—" }}</dd></div>
          </dl>
        </section>

        <section class="invoice-form-section">
          <div class="invoice-section-header">
            <div><span>02</span><h3>Purchase Order &amp; Subject</h3></div>
            <p>Informasi PO bersifat opsional dan dapat dilengkapi dengan dokumen.</p>
          </div>
          <div class="invoice-po-fields">
            <a-text-field-new
              v-model="newInvoice.no_preorder"
              label="No. Pre Order (PO)"
              placeholder="opsional"
            />
            <a-date-picker-new
              v-model="newInvoice.tanggal_preorder"
              label="Tanggal Pre Order (PO)"
            />
            <a-select-new
              v-model="newInvoice.currency_inv"
              label="Currency Invoice"
              :items="['IDR', 'USD', 'SGD']"
            />
          </div>

        <div class="mt-3">
          <div class="po-upload-row">
            <!-- Upload -->
            <div class="po-upload-wrapper">
              <label for="invoice-po-files" class="po-upload-label">
                Dokumen PO
              </label>

              <div class="po-upload-box">
                <input
                  id="invoice-po-files"
                  type="file"
                  multiple
                  :disabled="readingPo || savingInvoice"
                  @change="tambahDokumenPo"
                  class="po-file-input"
                />

                <div class="po-upload-icon">↑</div>

                <div class="po-upload-text">
                  <div class="po-upload-title">Pilih File</div>
                  <div class="po-upload-info">Maks. 650 KB</div>
                </div>
              </div>

              <div v-if="readingPo" class="po-reading">Membaca file PO...</div>
            </div>

            <!-- Hasil Upload -->
            <div
              v-if="newInvoice.doc_preorder?.length"
              class="po-files-wrapper"
            >
              <div class="po-upload-label">File Terpilih</div>

              <div class="po-file-list">
                <div
                  v-for="(document, index) in newInvoice.doc_preorder"
                  :key="index"
                  class="po-file-item"
                >
                  <a
                    :href="document.dataUrl"
                    :download="document.name"
                    class="po-file-name"
                  >
                    📄 {{ document.name }}
                  </a>

                  <button
                    type="button"
                    class="po-file-remove"
                    :disabled="readingPo || savingInvoice"
                    :aria-label="`Hapus ${document.name}`"
                    @click="newInvoice.doc_preorder?.splice(index, 1)"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <a-textarea-new
          v-model="newInvoice.perihal"
          class="invoice-subject-field"
          label="Subject"
          placeholder="subject"
        />
        </section>

        <section class="invoice-form-section invoice-items-section">
        <div class="invoice-section-header invoice-items-header">
          <div><span>03</span><h3>Invoice Items</h3></div>
          <v-btn
            size="small"
            variant="outlined"
            color="primary"
            prepend-icon="mdi-plus"
            class="invoice-add-row-btn text-none"
            @click="tambahBarisInvoice"
          >
            Add Item
          </v-btn>
        </div>

        <div
          v-for="(item, index) in newInvoice.item_pekerjaan"
          :key="index"
          class="invoice-line-item"
        >
          <div class="invoice-line-item-header">
            <span>Item {{ String(index + 1).padStart(2, "0") }}</span>
            <v-btn
              icon="mdi-trash-can-outline"
              size="x-small"
              variant="text"
              color="error"
              aria-label="Hapus item invoice"
              @click="hapusBarisInvoice(index)"
            />
          </div>
          <div class="invoice-item-description">
              <a-textarea-new
                v-model="item.nama"
                label="Description"
                placeholder="Description"
              />
          </div>
          <div class="invoice-item-fields">
              <a-select-new
                v-model="item.kategori_item"
                label="Kategori"
                :items="[
                  'Unit',
                  'Pcs',
                  'Kg',
                  'Lot',
                  'Set',
                  'Meter',
                  'Box',
                  'Liter',
                ]"
              />
              <a-field-number-new
                v-model="item.qty"
                label="Qty"
                placeholder="0"
              />
              <a-select-new
                :items="[
                  'Unit',
                  'Pcs',
                  'Kg',
                  'Lot',
                  'Set',
                  'Meter',
                  'Box',
                  'Liter',
                ]"
                v-model="item.uom"
                label="UOM"
                placeholder="Select"
              />
              <a-field-number-new
                v-model="item.amount"
                :label="`Amount/unit (${newInvoice.currency_inv || 'IDR'})`"
                placeholder="0"
                :allow-decimal="newInvoice.currency_inv !== 'IDR'"
                :step="newInvoice.currency_inv === 'IDR' ? 1 : 0.01"
              />
              <a-field-number-new
                v-model="item.subtotal_item"
                label="Subtotal"
                placeholder="0"
                disabled
              />
          </div>
        </div>

        <a-select-new
          v-model="newInvoice.sign_by"
          :items="[
            'Seilla Maryana',
            'Leo Adiatmaja Sembiring',
            'Muhammad Ridwan',
            'Lilis',
          ]"
          label="Sign By / Yang Bertanda Tangan ?"
          class="invoice-sign-field"
        />
        </section>

        <!-- Bagian Template: Update tabel Terms & Conditions -->
        <section class="invoice-form-section">
          <div class="invoice-section-header">
            <div><span>04</span><h3>Terms &amp; Conditions</h3></div>
            <p>Pilih ketentuan yang akan dicantumkan pada invoice.</p>
          </div>

          <div class="invoice-term-table-wrap">
          <table class="invoice-term-table">
            <tbody>
              <tr
                v-for="(item, index) in sortedTermConditions"
                :key="item?.id ?? index"
              >
                <td class="invoice-term-number">
                  {{ index + 1 }}.
                </td>

                <td class="invoice-term-check">
                  <v-checkbox
                    v-model="newInvoice.termCondition"
                    :value="{
                      id: item?.id ?? '',
                      nama_term: item?.nama_term ?? '',
                      createdAt: item?.createdAt ?? 0,
                      createdBy: item?.createdBy ?? '',
                    }"
                    :value-comparator="sameTermCondition"
                    density="compact"
                    hide-details
                    color="primary"
                    class="invoice-term-checkbox"
                  />
                </td>

                <td class="invoice-term-name">
                  {{ item?.nama_term }}
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </section>

        <section class="invoice-form-section invoice-summary-section">
          <div class="invoice-section-header">
            <div><span>05</span><h3>Commercial Summary</h3></div>
            <p>Ringkasan pajak, termin, dan nilai akhir invoice.</p>
          </div>
          <v-row justify="end" align="center">
            <v-col cols="12" md="6">
              <div
                class="d-flex align-center justify-space-between px-3 py-1 bg-grey-lighten-5 rounded-lg border"
              >
                <span class="text-body-2 font-weight-medium text-grey-darken-2"
                  >Sertakan PPN 11%</span
                >
                <v-switch
                  v-model="newInvoice.pakai_ppn"
                  color="primary"
                  hide-details
                  density="compact"
                />
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div
                class="d-flex justify-space-between text-body-2 text-grey-darken-2 mb-1"
              >
                <span>Subtotal</span>
                <span class="font-weight-medium text-grey-darken-3"
                  >{{ formatInvoiceCurrency(subtotal_invoice, newInvoice.currency_inv) }}</span
                >
              </div>
              <div
                v-if="discountInvoice > 0"
                class="d-flex justify-space-between text-body-2 text-grey-darken-2 mb-1"
              >
                <span>Discount</span>
                <span class="font-weight-medium text-grey-darken-3"
                  >- {{ formatInvoiceCurrency(discountInvoice, newInvoice.currency_inv) }}</span
                >
              </div>
              <div class="d-flex flex-wrap align-center justify-space-between ga-2 text-body-2 text-grey-darken-2 mb-1">
                <v-checkbox
                  v-model="newInvoice.down_payment"
                  label="Termin"
                  density="compact"
                  hide-details
                />
                <a-text-field-new
                  v-if="newInvoice.down_payment"
                  v-model="newInvoice.dp_persen"
                  type="number"
                  label="Persentase"
                  suffix="%"
                  style="max-width: 130px"
                />
                <span v-if="newInvoice.down_payment" class="font-weight-medium text-grey-darken-3">
                  {{ formatInvoiceCurrency(dpNominal, newInvoice.currency_inv) }}
                </span>
              </div>
              <div
                v-if="newInvoice.pakai_ppn == true"
                class="d-flex justify-space-between text-body-2 text-grey-darken-2 mb-2"
              >
                <span>PPN 11%</span>
                <span class="font-weight-medium text-grey-darken-3"
                  >{{ formatInvoiceCurrency(ppnInvoice, newInvoice.currency_inv) }}</span
                >
              </div>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between align-center">
                <span
                  class="text-subtitle-1 font-weight-bold text-grey-darken-4"
                  >Grand Total</span
                >
                <span class="text-h6 font-weight-black text-primary"
                  >{{ formatInvoiceCurrency(grandtotal_invoice, newInvoice.currency_inv) }}</span
                >
              </div>
            </v-col>
          </v-row>
        </section>
      </v-card-text>

      <footer class="invoice-dialog-footer">
        <p>Pastikan detail client, item, dan total invoice sudah sesuai sebelum disimpan.</p>
        <div>
        <v-btn
          size="small"
          variant="outlined"
          color="grey-darken-1"
          class="invoice-cancel-btn text-none"
          :disabled="readingPo || savingInvoice"
          @click="data.dialogTambahInvoice = false"
        >
          Batal
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          prepend-icon="mdi-content-save-outline"
          class="invoice-save-btn text-none"
          :disabled="readingPo || savingInvoice"
          :loading="savingInvoice"
          @click="simpanInvoiceDialog"
        >
          {{
            data.invoiceAddEdit === "add"
              ? "Simpan Invoice"
              : "Simpan Perubahan"
          }}
        </v-btn>
        </div>
      </footer>
    </v-card>
  </v-dialog>

  <v-card class="invoice-list-card" flat>
    <div class="invoice-list-toolbar">
      <div class="invoice-list-search">
        <v-icon icon="mdi-magnify" size="17" />
        <div class="invoice-list-search-field">
          <a-text-field-new
            v-model="data.searchInvoice"
            placeholder="Cari nomor invoice, client, quotation, subject, atau status"
          />
        </div>
        <v-btn
          v-if="data.searchInvoice"
          icon="mdi-close"
          size="x-small"
          variant="text"
          color="grey-darken-1"
          aria-label="Hapus pencarian"
          @click="data.searchInvoice = ''"
        />
      </div>

      <div class="invoice-list-tools">
        <span class="invoice-result-count">
          {{ invoiceTampilTersaring.length }} invoice
        </span>
        <v-btn
          size="small"
          class="invoice-filter-toggle invoice-toolbar-btn text-none"
          variant="outlined"
          :prepend-icon="
            data.showInvoiceFilters
              ? 'mdi-filter-variant-minus'
              : 'mdi-filter-variant-plus'
          "
          @click="data.showInvoiceFilters = !data.showInvoiceFilters"
        >
          Filter{{
            activeInvoiceFilterCount ? ` (${activeInvoiceFilterCount})` : ""
          }}
        </v-btn>
        <v-btn
          icon="mdi-refresh"
          size="small"
          variant="text"
          class="invoice-refresh-btn"
          aria-label="Refresh invoice"
          @click="refreshData"
        >
          <v-tooltip activator="parent" location="top">Refresh Data</v-tooltip>
        </v-btn>
      </div>
    </div>

    <v-divider />

    <section v-show="data.showInvoiceFilters" class="invoice-filter-panel">
      <div class="invoice-filter-heading">
        <div>
          <span class="invoice-filter-eyebrow">Filter pencarian</span>
          <p>
            Filter dapat digabungkan dan akan tetap tersimpan saat membuka
            detail invoice.
          </p>
        </div>
      </div>

      <div class="invoice-filter-grid">
        <div class="invoice-filter-field">
          <a-date-range-filter
            v-model:start="data.filterDateFrom"
            v-model:end="data.filterDateTo"
            placeholder="Rentang tanggal"
            aria-label="Pilih rentang tanggal invoice"
          />
        </div>

        <label class="invoice-filter-field">
          <input
            v-model.trim="data.filterInvoiceNo"
            type="search"
            placeholder="No. invoice"
          />
        </label>

        <label class="invoice-filter-field invoice-filter-select">
          <select v-model="data.filterClient" aria-label="Client">
            <option value="">Client</option>
            <option
              v-for="client in availableInvoiceClients"
              :key="client"
              :value="client"
            >
              {{ client }}
            </option>
          </select>
          <v-icon
            icon="mdi-chevron-down"
            size="14"
            class="invoice-filter-select-icon"
          />
        </label>

        <label class="invoice-filter-field">
          <input
            v-model.trim="data.filterQuotation"
            type="search"
            placeholder="No. quotation"
          />
        </label>

        <label class="invoice-filter-field">
          <input
            v-model.trim="data.filterSubject"
            type="search"
            placeholder="Subject atau deskripsi item"
          />
        </label>

        <label class="invoice-filter-field">
          <input
            :value="data.filterAmount"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            placeholder="Total amount"
            aria-label="Total amount"
            @input="updateInvoiceAmountFilter"
          />
        </label>

        <label class="invoice-filter-field invoice-filter-select">
          <select v-model="data.filterStatus" aria-label="Status invoice">
            <option value="">Status</option>
            <option
              v-for="status in availableInvoiceStatuses"
              :key="status"
              :value="status"
            >
              {{ status }}
            </option>
          </select>
          <v-icon
            icon="mdi-chevron-down"
            size="14"
            class="invoice-filter-select-icon"
          />
        </label>

        <v-chip
          v-if="hasActiveInvoiceFilters"
          label
          variant="tonal"
          color="error"
          prepend-icon="mdi-filter-off-outline"
          class="invoice-filter-reset text-none"
          role="button"
          tabindex="0"
          @click="resetInvoiceFilters"
          @keydown.enter="resetInvoiceFilters"
          @keydown.space.prevent="resetInvoiceFilters"
        >
          Reset filter
        </v-chip>
      </div>
    </section>

    <v-divider
      v-show="data.showInvoiceFilters"
      class="invoice-filter-divider"
    />

    <v-data-table
      :headers="data.headInvoice"
      :items="invoiceTampilTersaring"
      :loading="isLoading"
      :items-per-page="-1"
      density="compact"
      :sort-by="[{ key: 'createdAt', order: 'desc' }]"
      :hover="true"
      hide-default-footer
      class="invoice-list-table"
    >
      <template #item.no="{ index }">
        <span class="invoice-row-index">{{ index + 1 }}</span>
      </template>

      <template #item.tanggal="{ item }">
        <span class="invoice-date-cell">{{ rubahtanggallengkap(item.tanggal) }}</span>
      </template>

      <template #item.no_inv="{ item }">
        <NuxtLink :to="`/admin/invoice/${item.no_inv}`" class="invoice-reference">
          #INV/DRM/{{ invoiceYear(item.tanggal) }}/{{ item.no_inv }}
          <v-icon icon="mdi-arrow-top-right" size="12" />
        </NuxtLink>
      </template>

      <template #item.nama_customer="{ item }">
        <div class="invoice-client-cell">
          <div class="invoice-client-name">{{ item.nama_customer || "—" }}</div>
          <div class="invoice-client-meta">
            <span><v-icon icon="mdi-ferry" size="12" />{{ item.vessel || "—" }}</span>
            <i aria-hidden="true"></i>
            <span><v-icon icon="mdi-account-outline" size="12" />{{ item.pic || "—" }}</span>
          </div>
        </div>
      </template>

      <template #item.no_penawaran="{ item }">
        <NuxtLink
          v-if="item.id_penawaran && item.id_penawaran !== '-'"
          :to="`/admin/penawaran/${item.id_penawaran}`"
          class="invoice-quotation-reference"
        >
          {{ item.no_penawaran || "Quotation" }}
        </NuxtLink>
        <span v-else class="invoice-empty-value">—</span>
      </template>

      <template #item.perihal="{ item }">
        <div class="invoice-subject-cell">{{ item.perihal || "—" }}</div>
      </template>

      <template #item.grandtotal_invoice="{ item }">
        <strong class="invoice-amount-cell">
          {{ formatInvoiceCurrency(item.grandtotal_invoice, item.currency_inv) }}
        </strong>
      </template>

      <template #item.status="{ item }">
        <v-chip
          size="x-small"
          :color="statusColor(item.status)"
          variant="tonal"
          class="invoice-table-status"
        >
          <v-icon start icon="mdi-circle" size="6" />
          {{ item.status || "Draft" }}
        </v-chip>
      </template>

      <template #item.aksi="{ item }">
        <div class="invoice-row-actions">
          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                icon="mdi-dots-horizontal"
                size="small"
                variant="text"
                color="grey-darken-1"
                class="invoice-action-trigger"
                aria-label="Buka menu aksi invoice"
              />
            </template>
            <v-list density="compact" min-width="195" class="invoice-action-menu">
              <v-list-item
                :to="`/admin/invoice/${item.id}`"
                prepend-icon="mdi-eye-outline"
                title="Detail invoice"
              />
              <v-list-item
                v-if="item.status === 'Draft'"
                prepend-icon="mdi-pencil-outline"
                title="Edit invoice"
                @click="openDialogEditInvoice(item)"
              />
              <template v-if="item.status === 'Draft'">
                <v-divider class="my-1" />
                <v-list-item
                  prepend-icon="mdi-trash-can-outline"
                  title="Delete invoice"
                  class="invoice-menu-danger"
                  @click="hapusInvoice(item.id_penawaran!, item.id!)"
                />
              </template>
            </v-list>
          </v-menu>
        </div>
      </template>

      <template #no-data>
        <div class="invoice-empty-state">
          <v-icon size="34" color="grey-lighten-1" icon="mdi-receipt-text-outline" />
          <div>
            {{
              hasActiveInvoiceFilters
                ? "Invoice tidak ditemukan"
                : "Belum ada data invoice"
            }}
          </div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import moment from "moment";
import type { ConfirmationDialog } from "#components";
import type { customerM } from "~/types/customerModel";
import type {
  invoiceCurrencyM,
  invoiceM,
  invoicePoDocumentM,
} from "~/types/invoice";
import { useinvoiceStore } from "~/stores/invoiceStore";

definePageMeta({
  layout: "admin",
});

const router = useRouter();
const display = useDisplay();
const customerStore = usecustomerStore();
const invoiceStore = useinvoiceStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);
const termconditionStore = usetermconditionStore();

const data = reactive({
  tab: "invoice",
  searchCustomer: "",
  dialogCustomer: false,
  dialogTambahInvoice: false,
  invoiceAddEdit: "add" as "add" | "edit",
  editOriginalCustomerId: "",
  customerAddEdit: "add" as "add" | "edit",
  headCustomer: [
    { title: "Nama Customer", value: "nama", sortable: true },
    { title: "PIC", value: "pic", sortable: true },
    { title: "Alamat", value: "alamat", sortable: true },
    { title: "Aksi", align: "center" as const, value: "aksi", width: "100px" },
  ],
  searchInvoice: "",
  showInvoiceFilters: true,
  filterDateFrom: "",
  filterDateTo: "",
  filterInvoiceNo: "",
  filterClient: "",
  filterQuotation: "",
  filterSubject: "",
  filterAmount: "",
  filterStatus: "",
  showAllInvoice: false,
  headInvoice: [
    { title: "No", value: "no", width: "48px", align: "center" as const, sortable: false },
    { title: "Date", value: "tanggal", sortable: true, width: "116px" },
    { title: "Invoice Ref", value: "no_inv", sortable: true, width: "190px" },
    { title: "Client", value: "nama_customer", sortable: true, width: "250px" },
    { title: "Based On", value: "no_penawaran", sortable: true, width: "150px" },
    { title: "Subject", value: "perihal", sortable: true, width: "220px" },
    { title: "Total Amount", value: "grandtotal_invoice", sortable: true, width: "155px", align: "end" as const },
    { title: "Status", value: "status", sortable: true, width: "104px" },
    { title: "Action", align: "center" as const, value: "aksi", width: "58px", sortable: false },
  ],
});

const INVOICE_FILTER_STORAGE_KEY = "admin-invoice-list-filters-v2";
const invoiceFilterKeys = [
  "searchInvoice",
  "filterDateFrom",
  "filterDateTo",
  "filterInvoiceNo",
  "filterClient",
  "filterQuotation",
  "filterSubject",
  "filterAmount",
  "filterStatus",
] as const;

function invoiceFilterSnapshot() {
  return Object.fromEntries(
    invoiceFilterKeys.map((key) => [key, data[key]]),
  );
}

function restoreInvoiceFilters() {
  try {
    const storedFilters = sessionStorage.getItem(INVOICE_FILTER_STORAGE_KEY);
    if (!storedFilters) return;

    const parsedFilters = JSON.parse(storedFilters) as Record<string, unknown>;
    invoiceFilterKeys.forEach((key) => {
      if (typeof parsedFilters[key] === "string") {
        data[key] = parsedFilters[key];
      }
    });
    if (
      typeof parsedFilters.filterDate === "string" &&
      !data.filterDateFrom &&
      !data.filterDateTo
    ) {
      data.filterDateFrom = parsedFilters.filterDate;
      data.filterDateTo = parsedFilters.filterDate;
    }
  } catch {
    sessionStorage.removeItem(INVOICE_FILTER_STORAGE_KEY);
  }
}

watch(
  () => invoiceFilterKeys.map((key) => data[key]),
  () => {
    sessionStorage.setItem(
      INVOICE_FILTER_STORAGE_KEY,
      JSON.stringify(invoiceFilterSnapshot()),
    );
  },
);

function emptyInvoice(): invoiceM {
  return {
    no_inv: "",
    id_customer: "",
    nama_customer: "",
    alamat_customer: "",
    no_preorder: "",
    tanggal_preorder: "",
    doc_preorder: [],
    vessel: "",
    no_telp: "",
    sign_by: "",
    email: "",
    pic: "",
    tanggal: moment().format("YYYY-MM-DD"),
    currency_inv: "IDR",
    perihal: "",
    item_pekerjaan: [
      {
        nama: "",
        qty: 1,
        uom: "Unit",
        kategori_item: "",
        amount: 0,
        subtotal_item: 0,
      },
    ],
    pakai_ppn: false,
    subtotal_invoice: 0,
    discount_invoice: 0,
    ppn: 0,
    grandtotal_invoice: 0,
    down_payment: false,
    dp_persen: 0,
    status: "",
    createdAt: 0,
    createdBy: "",
    termCondition: [],
    tanggal_bayar: "",
    doc_bukti_bayar: [],
    doc_do_wr: [],
  };
}

const sortedTermConditions = computed(() => {
  const terms = [...termconditionStore.getDataTermcondition];
  const selected = newInvoice.value.termCondition || [];

  // Yang dipilih mengikuti urutan saat dipilih
  const selectedTerms = selected
    .map((selectedItem: any) => {
      return terms.find((term: any) =>
        term.id
          ? term.id === selectedItem.id
          : term.nama_term === selectedItem.nama_term,
      );
    })
    .filter(Boolean);

  // Yang belum dipilih tetap mengikuti urutan asli
  const unselectedTerms = terms.filter(
    (term: any) =>
      !selected.some((selectedItem: any) =>
        term.id
          ? term.id === selectedItem.id
          : term.nama_term === selectedItem.nama_term,
      ),
  );

  return [...selectedTerms, ...unselectedTerms];
});

const newInvoice = ref<invoiceM>(emptyInvoice());

function normalizeInvoiceCurrency(currency?: string): invoiceCurrencyM {
  return currency === "USD" || currency === "SGD" ? currency : "IDR";
}

function formatInvoiceCurrency(value: number, currency?: string) {
  const code = normalizeInvoiceCurrency(currency);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: code,
    maximumFractionDigits: code === "IDR" ? 0 : 2,
  }).format(Number(value) || 0);
}

const readingPo = ref(false);
const savingInvoice = ref(false);
const isLoading = ref(true);
const MAX_INVOICE_BYTES = 900_000;

async function tambahDokumenPo(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = "";
  if (!files.length || readingPo.value || savingInvoice.value) return;

  const draft = newInvoice.value;
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

  readingPo.value = true;
  try {
    const documents: invoicePoDocumentM[] = [];
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
    const doc_preorder = [...(draft.doc_preorder || []), ...documents];
    if (
      new TextEncoder().encode(JSON.stringify({ ...draft, doc_preorder }))
        .byteLength > MAX_INVOICE_BYTES
    ) {
      return notificationStore.showError(
        "Ukuran invoice beserta dokumen PO terlalu besar. Kurangi ukuran atau jumlah file.",
      );
    }
    if (newInvoice.value === draft && data.dialogTambahInvoice)
      draft.doc_preorder = doc_preorder;
  } catch (error) {
    notificationStore.showError(
      "File PO tidak dapat dibaca. Silakan coba lagi.",
    );
  } finally {
    readingPo.value = false;
  }
}

const subtotal_invoice = computed(() =>
  newInvoice.value.item_pekerjaan.reduce(
    (total, item) => total + (Number(item.qty) || 0) * (Number(item.amount) || 0),
    0,
  ),
);
const discountInvoice = computed(
  () => Number(newInvoice.value.discount_invoice) || 0,
);
const netSubtotal = computed(
  () => subtotal_invoice.value - discountInvoice.value,
);
const dpNominal = computed(() =>
  Math.round(
    (netSubtotal.value * (Number(newInvoice.value.dp_persen) || 0)) / 100,
  ),
);
const ppnInvoice = computed(() =>
  newInvoice.value.pakai_ppn ? Math.round(netSubtotal.value * 0.11) : 0,
);
const grandtotal_invoice = computed(
  () =>
    (newInvoice.value.down_payment ? dpNominal.value : netSubtotal.value) +
    ppnInvoice.value,
);

watch(
  () => newInvoice.value.id_customer,
  (idCustomer) => {
    if (
      data.invoiceAddEdit === "edit" &&
      idCustomer === data.editOriginalCustomerId
    ) {
      return;
    }
    const customer = customerStore.getDataCustomer.find(
      (item) => item.id === idCustomer,
    );

    if (!customer) return;
    newInvoice.value.id_customer = customer.id ?? "";
    newInvoice.value.nama_customer = customer.nama;
    newInvoice.value.alamat_customer = customer.alamat;
    newInvoice.value.pic = customer.pic;
    newInvoice.value.vessel = customer.vessel;
    newInvoice.value.no_telp = customer.no_telp;
    newInvoice.value.email = customer.email;
  },
);

onMounted(async () => {
  restoreInvoiceFilters();
  try {
    isLoading.value = true;
    await customerStore.tarikDataCustomerAct();
    await invoiceStore.tarikDataInvoiceAct();
    data.showAllInvoice = true;
  } finally {
    isLoading.value = false;
  }
  termconditionStore.tarikDataTermconditionAct();
});

const filteredInvoice = computed(() => {
  if (!data.showAllInvoice) {
    return invoiceStore.getDataInvoice.filter(
      (invoice) => invoice.status === "Draft",
    );
  }
  return invoiceStore.getDataInvoice;
});

const availableInvoiceStatuses = computed(() => {
  const defaultStatuses = [
    "Draft",
    "Selesai",
  ];
  const storedStatuses = invoiceStore.getDataInvoice
    .map((invoice) => invoice.status || "Draft")
    .filter(Boolean);

  return [...new Set([...defaultStatuses, ...storedStatuses])];
});

const availableInvoiceClients = computed(() => {
  const clients = invoiceStore.getDataInvoice
    .map((invoice) => invoice.nama_customer?.trim())
    .filter((client): client is string => Boolean(client));

  return [...new Set(clients)].sort((a, b) => a.localeCompare(b, "id-ID"));
});

function normalizeFilterValue(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase("id-ID");
}

function containsFilterValue(query: string, values: unknown[]) {
  if (!query) return true;
  return values.some((value) => normalizeFilterValue(value).includes(query));
}

const activeInvoiceFilterCount = computed(
  () =>
    [
      data.searchInvoice,
      data.filterDateFrom || data.filterDateTo,
      data.filterInvoiceNo,
      data.filterClient,
      data.filterQuotation,
      data.filterSubject,
      data.filterAmount,
      data.filterStatus,
    ].filter((value) => String(value).trim() !== "").length,
);

const hasActiveInvoiceFilters = computed(
  () =>
    display.xs.value
      ? Boolean(data.searchInvoice.trim())
      : activeInvoiceFilterCount.value > 0,
);

const invoiceTampilTersaring = computed(() => {
  const globalQuery = normalizeFilterValue(data.searchInvoice);
  const invoiceQuery = normalizeFilterValue(data.filterInvoiceNo);
  const quotationQuery = normalizeFilterValue(data.filterQuotation);
  const subjectQuery = normalizeFilterValue(data.filterSubject);
  const selectedClient = normalizeFilterValue(data.filterClient);
  const amountQuery = data.filterAmount.replace(/\D/g, "");

  return filteredInvoice.value.filter((invoice) => {
    const invoiceStatus = invoice.status || "Draft";
    const invoiceCurrency = normalizeInvoiceCurrency(invoice.currency_inv);
    const invoiceAmount = Number(invoice.grandtotal_invoice) || 0;
    const invoiceDate = String(invoice.tanggal || "").slice(0, 10);
    const invoiceReference = `INV/DRM/${invoiceYear(invoice.tanggal)}/${invoice.no_inv}`;
    const itemDescriptions = (invoice.item_pekerjaan || []).map(
      (item) => item.nama,
    );
    const searchableValues = [
      invoiceReference,
      invoice.no_inv,
      invoice.tanggal,
      invoice.no_penawaran,
      invoice.id_penawaran,
      invoice.no_preorder,
      invoice.tanggal_preorder,
      invoice.nama_customer,
      invoice.alamat_customer,
      invoice.vessel,
      invoice.pic,
      invoice.email,
      invoice.no_telp,
      invoice.location,
      invoice.perihal,
      ...itemDescriptions,
      invoiceCurrency,
      invoiceAmount,
      invoiceStatus,
      invoice.sign_by,
      invoice.createdBy,
    ];

    if (!containsFilterValue(globalQuery, searchableValues)) return false;
    if (display.xs.value) return true;
    if (
      !containsFilterValue(invoiceQuery, [invoice.no_inv, invoiceReference])
    ) return false;
    if (
      selectedClient &&
      normalizeFilterValue(invoice.nama_customer) !== selectedClient
    ) return false;
    if (
      !containsFilterValue(quotationQuery, [
        invoice.no_penawaran,
        invoice.id_penawaran,
      ])
    ) return false;
    if (
      !containsFilterValue(subjectQuery, [invoice.perihal, ...itemDescriptions])
    ) return false;
    if (data.filterDateFrom && invoiceDate < data.filterDateFrom) return false;
    if (data.filterDateTo && invoiceDate > data.filterDateTo) return false;
    if (data.filterStatus && invoiceStatus !== data.filterStatus) return false;
    if (
      amountQuery &&
      !String(invoiceAmount).replace(/\D/g, "").includes(amountQuery)
    ) return false;

    return true;
  });
});

function updateInvoiceAmountFilter(event: Event) {
  const input = event.target as HTMLInputElement;
  const digits = input.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  data.filterAmount = digits;
}

function resetInvoiceFilters() {
  invoiceFilterKeys.forEach((key) => {
    data[key] = "";
  });
  sessionStorage.removeItem(INVOICE_FILTER_STORAGE_KEY);
}

function invoiceYear(date: string) {
  const year = moment(date, "YYYY-MM-DD", true).format("YYYY");
  return year === "Invalid date" ? moment().format("YYYY") : year;
}

function statusColor(status: string) {
  if (status === "Draft") return "primary";
  if (status === "Dikirim" || status === "INVOICE") return "warning";
  if (status === "Selesai" || status === "Lunas") return "success";
  if (status === "Cancel") return "error";
  return "grey";
}

function openDialogTambahInvoice() {
  data.invoiceAddEdit = "add";
  data.editOriginalCustomerId = "";
  newInvoice.value = emptyInvoice();
  data.dialogTambahInvoice = true;
}

function openDialogEditInvoice(item: invoiceM) {
  const customer = customerStore.getDataCustomer.find(
    (dataCustomer) =>
      dataCustomer.id === item.id_customer ||
      dataCustomer.nama === item.id_customer ||
      dataCustomer.nama === item.nama_customer ||
      dataCustomer.pic === item.pic ||
      dataCustomer.vessel === item.vessel,
  );

  const invoice = {
    ...emptyInvoice(),
    ...JSON.parse(JSON.stringify(item)),
  } as invoiceM;
  if (customer?.id) {
    invoice.id_customer = customer.id;
    invoice.nama_customer = customer.nama;
  }

  data.invoiceAddEdit = "edit";
  data.editOriginalCustomerId = invoice.id_customer;
  newInvoice.value = invoice;
  data.dialogTambahInvoice = true;
}

function tambahBarisInvoice() {
  newInvoice.value.item_pekerjaan.push({
    nama: "",
    // kode_barang: "",
    amount: 0,
    kategori_item: "",
    uom: "",
    qty: 0,
    subtotal_item: 0,
  });
}

function sameTermCondition(a: any, b: any) {
  if (!a || !b) return a === b;

  // Prioritas berdasarkan ID
  if (a.id && b.id) {
    return a.id === b.id;
  }

  // Fallback berdasarkan nama term
  return a.nama_term === b.nama_term;
}

function hapusBarisInvoice(index: number) {
  if (newInvoice.value.item_pekerjaan.length === 1) {
    return notificationStore.showError("Minimal harus ada 1 baris item");
  }
  newInvoice.value.item_pekerjaan.splice(index, 1);
}

async function simpanInvoiceDialog() {
  if (readingPo.value || savingInvoice.value) return;
  if (!newInvoice.value.id_customer) {
    return notificationStore.showError("Customer belum dipilih");
  }
  if (
    !newInvoice.value.item_pekerjaan.length ||
    newInvoice.value.item_pekerjaan.some(
      (item) => !item.nama || Number(item.qty) <= 0 || Number(item.amount) <= 0,
    )
  ) {
    return notificationStore.showError(
      "Setiap baris item harus punya description, qty, dan amount",
    );
  }
  if (
    newInvoice.value.down_payment &&
    (!Number.isFinite(Number(newInvoice.value.dp_persen)) ||
      Number(newInvoice.value.dp_persen) <= 0 ||
      Number(newInvoice.value.dp_persen) > 100)
  ) {
    return notificationStore.showError("Persentase termin harus antara 1 dan 100");
  }

  newInvoice.value.item_pekerjaan.forEach((item) => {
    item.subtotal_item = Number(item.qty) * Number(item.amount);
  });

  newInvoice.value.subtotal_invoice = subtotal_invoice.value;
  newInvoice.value.ppn = ppnInvoice.value;
  newInvoice.value.grandtotal_invoice = grandtotal_invoice.value;
  if (
    new TextEncoder().encode(JSON.stringify(newInvoice.value)).byteLength >
    MAX_INVOICE_BYTES
  ) {
    return notificationStore.showError(
      "Ukuran invoice beserta dokumen PO terlalu besar. Kurangi ukuran atau jumlah file.",
    );
  }

  savingInvoice.value = true;
  try {
    if (data.invoiceAddEdit === "add") {
      newInvoice.value.createdAt = moment().unix();
      newInvoice.value.createdBy = userStore.getEmail;

      const result = await invoiceStore.createInvoiceAct(newInvoice.value);
      if (!result) return;

      data.dialogTambahInvoice = false;
      newInvoice.value = emptyInvoice();
      await router.push(`/admin/invoice/${result.id}`);
      return;
    }

    if (!newInvoice.value.id) {
      return notificationStore.showError("ID invoice tidak ditemukan");
    }

    const updated = await invoiceStore.updateInvoiceAct(
      newInvoice.value.id,
      newInvoice.value,
    );
    if (!updated) return;

    await invoiceStore.tarikDataInvoiceAct();
    data.dialogTambahInvoice = false;
    newInvoice.value = emptyInvoice();
  } catch (error) {
    notificationStore.showError(
      "Gagal menyimpan perubahan invoice. Silakan coba lagi.",
    );
  } finally {
    savingInvoice.value = false;
  }
}

async function hapusInvoice(id_penawaran: string, id: string) {
  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus Invoice",
    "Anda yakin ingin menghapus invoice ini? Tindakan ini tidak bisa dipulihkan",
    { variant: "danger" },
  );
  if (!confirmed) return notificationStore.showInfo("Penghapusan dibatalkan");
  await invoiceStore.deleteInvoiceAct(id_penawaran, id);
}

async function refreshData() {
  useloadingStore().setLoading(true);
  sessionStorage.removeItem("invoice");
  await invoiceStore.tarikDataInvoiceAct();
  useloadingStore().setLoading(false);
  notificationStore.showSuccess("Data berhasil diperbarui");
}
</script>

<style scoped>
* { box-sizing: border-box; }

.invoice-page-topbar {
  display: flex;
  margin-bottom: 1px;
  align-items: center;
  gap: 14px;
}

.invoice-back-btn { flex: 0 0 auto; }

.invoice-page-heading {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: flex-end;
  justify-content: flex-start;
  text-align: left;
}

.invoice-page-heading h1 {
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.invoice-page-heading p {
  margin: 3px 0 0;
  color: #7b8490;
  font-size: 11px;
  line-height: 1.4;
}

.invoice-list-card {
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #dfe3e8;
  border-radius: 8px !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.025) !important;
}

.invoice-list-toolbar {
  display: flex;
  min-height: 58px;
  padding: 11px 14px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.invoice-list-search {
  display: flex;
  height: 34px;
  max-width: 500px;
  padding: 0 5px 0 10px;
  flex: 1 1 410px;
  align-items: center;
  gap: 7px;
  color: #8993a0;
  background: #ffffff;
  border: 1px solid #d6dbe1;
  border-radius: 5px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.invoice-list-search:focus-within {
  border-color: #7da5cc;
  box-shadow: 0 0 0 2px rgba(49, 95, 140, 0.08);
}

.invoice-list-search-field { min-width: 0; flex: 1 1 auto; }
.invoice-list-search :deep(.form-group),
.invoice-list-search :deep(.input-wrapper) { height: 32px; }
.invoice-list-search :deep(.input-field) {
  height: 32px !important;
  min-height: 32px !important;
  padding: 5px 0 !important;
  overflow: hidden;
  font-size: 11px !important;
  line-height: 20px !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  resize: none;
}

.invoice-list-tools { display: flex; flex: 0 0 auto; align-items: center; gap: 7px; }
.invoice-result-count {
  margin-right: 5px;
  color: #858f9b;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}
.invoice-toolbar-btn {
  height: 30px !important;
  padding-inline: 10px !important;
  color: #526171 !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  border-color: #d6dbe1 !important;
  border-radius: 4px !important;
}
.invoice-refresh-btn {
  width: 30px !important;
  height: 30px !important;
  color: #65717f !important;
  border-radius: 4px !important;
}

.invoice-filter-panel {
  padding: 12px 14px 14px;
  background: #fbfcfd;
}

.invoice-filter-heading {
  display: flex;
  margin-bottom: 10px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.invoice-filter-eyebrow {
  display: block;
  color: #4c5b6b;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.045em;
  line-height: 1.4;
  text-transform: uppercase;
}

.invoice-filter-heading p {
  margin: 2px 0 0;
  color: #8a94a0;
  font-size: 9.5px;
  line-height: 1.4;
}

.invoice-filter-reset {
  width: 100%;
  height: 31px !important;
  align-self: end;
  justify-content: center;
  padding-inline: 8px !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  border-radius: 4px !important;
  cursor: pointer;
}

.invoice-filter-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(100px, 1fr));
  gap: 9px 10px;
}

.invoice-filter-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.invoice-filter-field input,
.invoice-filter-field select {
  width: 100%;
  height: 31px;
  min-width: 0;
  padding: 5px 8px;
  color: #344050;
  font: inherit;
  font-size: 10.5px;
  line-height: 19px;
  outline: none;
  background: #ffffff;
  border: 1px solid #d8dde3;
  border-radius: 4px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.invoice-filter-field select {
  padding-right: 26px;
  appearance: none;
  cursor: pointer;
}

.invoice-filter-select { position: relative; }

.invoice-filter-select-icon {
  position: absolute;
  top: 50%;
  right: 8px;
  color: #7f8995;
  pointer-events: none;
  transform: translateY(-50%);
}

.invoice-filter-field input::placeholder { color: #a3abb4; }
.invoice-filter-field input:focus,
.invoice-filter-field select:focus {
  border-color: #7da5cc;
  box-shadow: 0 0 0 2px rgba(49, 95, 140, 0.08);
}

.invoice-list-table { color: #344050; font-size: 11px; }
.invoice-list-table :deep(table) { min-width: 1320px; }
.invoice-list-table :deep(.v-data-table__th) {
  height: 37px !important;
  padding: 0 12px !important;
  color: #697586 !important;
  font-size: 9px !important;
  font-weight: 700 !important;
  letter-spacing: 0.055em !important;
  text-transform: uppercase;
  background: #f7f8fa !important;
  border-bottom: 1px solid #dfe3e8 !important;
}
.invoice-list-table :deep(.v-data-table-header__content) { gap: 3px; }
.invoice-list-table :deep(.v-data-table__td) {
  height: 56px !important;
  padding: 8px 12px !important;
  line-height: 1.35;
  vertical-align: middle;
  border-bottom-color: #edf0f2 !important;
}
.invoice-list-table :deep(tbody tr) { transition: background-color 0.12s ease; }
.invoice-list-table :deep(tbody tr:hover > td) { background: #fafbfd !important; }

.invoice-row-index { color: #9aa3ae; font-size: 10px; font-variant-numeric: tabular-nums; }
.invoice-date-cell { color: #556170; font-size: 10.5px; white-space: nowrap; }
.invoice-reference {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #285f91;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.005em;
  text-decoration: none;
  white-space: nowrap;
}
.invoice-reference:hover,
.invoice-quotation-reference:hover {
  color: #174a79;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.invoice-client-cell { min-width: 210px; max-width: 260px; }
.invoice-client-name {
  overflow: hidden;
  color: #273444;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.invoice-client-meta {
  display: flex;
  min-width: 0;
  margin-top: 4px;
  overflow: hidden;
  align-items: center;
  gap: 6px;
  color: #7a8592;
  font-size: 9.5px;
  white-space: nowrap;
}
.invoice-client-meta span {
  display: inline-flex;
  min-width: 0;
  max-width: 105px;
  align-items: center;
  gap: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.invoice-client-meta i {
  flex: 0 0 3px;
  width: 3px;
  height: 3px;
  background: #dfe4e8;
  border-radius: 50%;
}
.invoice-quotation-reference {
  color: #526f88;
  font-size: 10px;
  font-weight: 650;
  text-decoration: none;
  white-space: nowrap;
}
.invoice-subject-cell {
  display: -webkit-box;
  min-width: 170px;
  max-width: 230px;
  overflow: hidden;
  color: #556170;
  line-height: 1.42;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.invoice-amount-cell {
  display: block;
  color: #273444;
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}
.invoice-empty-value { color: #9ba4ae; }
.invoice-table-status {
  height: 22px !important;
  padding-inline: 8px !important;
  font-size: 9px !important;
  font-weight: 700 !important;
  letter-spacing: 0.015em !important;
  border-radius: 4px !important;
}
.invoice-row-actions { display: flex; align-items: center; justify-content: center; }
.invoice-action-trigger { width: 28px !important; height: 28px !important; border-radius: 4px !important; }
.invoice-action-trigger:hover { color: #26384b !important; background: #eef1f4 !important; }
.invoice-action-menu {
  padding: 4px !important;
  border: 1px solid #dfe3e8;
  border-radius: 6px !important;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12) !important;
}
.invoice-action-menu :deep(.v-list-item) {
  min-height: 32px !important;
  padding-inline: 9px !important;
  border-radius: 4px !important;
}
.invoice-action-menu :deep(.v-list-item-title) { font-size: 10.5px !important; font-weight: 500; }
.invoice-action-menu :deep(.v-list-item__prepend > .v-icon) { margin-inline-end: 9px !important; font-size: 16px !important; }
.invoice-menu-danger { color: #b44949 !important; }
.invoice-empty-state { padding: 44px 16px; color: #8a949f; font-size: 11px; text-align: center; }
.invoice-empty-state .v-icon { display: block; margin: 0 auto 8px; }

/* Invoice form dialog */
.invoice-dialog-card {
  overflow: hidden;
  color: #1f2937;
  background: #f5f6f8;
  border: 1px solid #d9dee5;
  border-radius: 10px !important;
}
.invoice-dialog-header {
  display: flex;
  min-height: 70px;
  padding: 13px 18px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  background: #ffffff;
  border-bottom: 1px solid #dfe3e8;
}
.invoice-dialog-heading { display: flex; min-width: 0; align-items: center; gap: 11px; }
.invoice-dialog-icon {
  display: grid;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  place-items: center;
  color: #315f8c;
  background: #eef3f8;
  border: 1px solid #dce6ef;
  border-radius: 6px;
}
.invoice-dialog-heading h2 { margin: 0; color: #202833; font-size: 15px; font-weight: 700; }
.invoice-dialog-heading p { margin: 2px 0 0; color: #7d8792; font-size: 10px; }
.invoice-dialog-header-actions { display: flex; align-items: center; gap: 9px; }
.invoice-dialog-status {
  display: inline-flex;
  height: 25px;
  padding: 0 9px;
  align-items: center;
  gap: 6px;
  color: #5e6a77;
  font-size: 9px;
  font-weight: 650;
  background: #f6f7f8;
  border: 1px solid #e1e5e8;
  border-radius: 12px;
}
.invoice-dialog-status > span { width: 6px; height: 6px; background: #3a83bd; border-radius: 50%; }
.invoice-dialog-body {
  display: flex;
  padding: 14px !important;
  flex-direction: column;
  gap: 12px;
  background: #f5f6f8;
}
.invoice-form-section {
  padding: 16px;
  background: #ffffff;
  border: 1px solid #dfe3e8;
  border-radius: 7px;
}
.invoice-section-header {
  display: flex;
  margin-bottom: 14px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.invoice-section-header > div { display: flex; align-items: center; gap: 8px; }
.invoice-section-header > div > span {
  display: inline-grid;
  width: 23px;
  height: 21px;
  place-items: center;
  color: #5a6877;
  font-size: 8px;
  font-weight: 700;
  background: #f1f3f5;
  border: 1px solid #e0e4e8;
  border-radius: 4px;
}
.invoice-section-header h3 { margin: 0; color: #2c3743; font-size: 12px; font-weight: 700; line-height: 21px; }
.invoice-section-header p { margin: 3px 0 0; color: #8a949f; font-size: 9px; text-align: right; }
.invoice-client-picker,
.invoice-po-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.invoice-client-details {
  display: grid;
  grid-template-columns: 1.8fr repeat(4, minmax(0, 1fr));
  gap: 1px;
  margin: 12px 0 0;
  overflow: hidden;
  background: #e2e6ea;
  border: 1px solid #e2e6ea;
  border-radius: 5px;
}
.invoice-client-details > div { min-width: 0; padding: 8px 9px; background: #f8f9fa; }
.invoice-client-details dt {
  margin-bottom: 3px;
  color: #7c8793;
  font-size: 8px;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.invoice-client-details dd {
  margin: 0;
  overflow: hidden;
  color: #3f4b58;
  font-size: 9px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.invoice-subject-field { display: block; margin-top: 12px; }

.invoice-items-section { padding: 0 0 14px; overflow: hidden; }
.invoice-items-header {
  margin: 0;
  padding: 14px 16px;
  align-items: center;
  background: #fafbfc;
  border-bottom: 1px solid #e4e8ec;
}
.invoice-add-row-btn {
  height: 30px !important;
  padding-inline: 10px !important;
  font-size: 9px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  border-radius: 4px !important;
}
.invoice-line-item {
  margin: 12px 14px 0;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #dfe4e8;
  border-radius: 6px;
}
.invoice-line-item-header { display: flex; margin-bottom: 9px; align-items: center; justify-content: space-between; }
.invoice-line-item-header > span { color: #74808c; font-size: 8px; font-weight: 750; letter-spacing: 0.08em; text-transform: uppercase; }
.invoice-item-description { margin-bottom: 9px; }
.invoice-item-fields {
  display: grid;
  grid-template-columns: 1.05fr 0.65fr 0.8fr 1.1fr 1.1fr;
  gap: 9px;
}
.invoice-sign-field { display: block; max-width: 360px; margin: 12px 14px 0; }

.invoice-term-table-wrap {
  max-height: 230px;
  overflow: auto;
  border: 1px solid #dfe4e8;
  border-radius: 5px;
}
.invoice-term-table { width: 100%; font-size: 9px; border-collapse: collapse; }
.invoice-term-table td { border-bottom: 1px solid #e8ecef; }
.invoice-term-table tr:last-child td { border-bottom: 0; }
.invoice-term-number { width: 34px; padding: 6px; color: #87919c; text-align: center; vertical-align: top; }
.invoice-term-check { width: 38px; vertical-align: middle; }
.invoice-term-name { padding: 6px 8px; color: #53606e; line-height: 1.45; }
.invoice-term-checkbox { margin: -6px 0; padding: 0; transform: scale(0.72); transform-origin: center; }
.invoice-summary-section { background: #fbfcfd; }

.invoice-dialog-footer {
  display: flex;
  min-height: 58px;
  padding: 10px 18px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background: #ffffff;
  border-top: 1px solid #dfe3e8;
}
.invoice-dialog-footer p { margin: 0; color: #7c8793; font-size: 9px; }
.invoice-dialog-footer > div { display: flex; gap: 8px; }
.invoice-cancel-btn,
.invoice-save-btn {
  min-width: 104px;
  height: 34px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  border-radius: 4px !important;
}
.invoice-save-btn { min-width: 148px; }
.invoice-dialog-card :deep(.input-field),
.invoice-dialog-card :deep(.date-input-wrapper) { border-radius: 4px; }

.po-upload-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
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
  margin-bottom: 5px;
  font-size: 9px;
  font-weight: 600;
  color: #5f6c7a;
}

/* Upload Box */
.po-upload-box {
  position: relative;
  width: 142px;
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1px dashed #cbd5e1;
  border-radius: 5px;
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
  width: 26px;
  height: 26px;
  border-radius: 5px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 15px;
}

.po-upload-title {
  font-size: 10px;
  font-weight: 600;
  color: #334155;
}

.po-upload-info {
  margin-top: 2px;
  font-size: 8px;
  color: #94a3b8;
}

.po-reading {
  margin-top: 5px;
  color: #718096;
  font-size: 8px;
}

/* Files */
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
  min-height: 31px;
  padding: 5px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
}

.po-file-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 9px;
  color: #475569;
}

.po-file-remove {
  flex-shrink: 0;
  border: 0;
  background: transparent;
  color: #94a3b8;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.po-file-remove:hover:not(:disabled) {
  color: #dc2626;
}

@media (max-width: 1199px) {
  .invoice-filter-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 959px) {
  .invoice-filter-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .invoice-dialog-card {
    height: 100%;
    border: 0;
    border-radius: 0 !important;
  }

  .invoice-dialog-body {
    padding: 14px !important;
  }

  .invoice-item-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .invoice-client-details {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .invoice-client-address {
    grid-column: 1 / -1;
  }
}

@media (max-width: 700px) {
  .invoice-list-toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: 9px;
  }

  .invoice-list-search {
    width: 100%;
    max-width: none;
    flex-basis: auto;
  }

  .invoice-list-tools {
    justify-content: flex-end;
  }

  .invoice-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 599px) {
  .invoice-filter-panel,
  .invoice-filter-divider,
  .invoice-filter-toggle {
    display: none !important;
  }

  .invoice-page-topbar {
    margin-bottom: 12px;
    gap: 8px;
  }

  .invoice-page-heading {
    justify-content: flex-start;
    text-align: left;
  }

  .invoice-page-heading h1 {
    font-size: 18px;
  }

  .invoice-filter-heading p { display: none; }

  .invoice-filter-grid { grid-template-columns: 1fr; }

  .invoice-dialog-header {
    min-height: 64px;
    padding: 11px 12px;
  }

  .invoice-dialog-heading {
    gap: 9px;
  }

  .invoice-dialog-icon {
    flex-basis: 32px;
    width: 32px;
    height: 32px;
  }

  .invoice-dialog-heading h2 {
    font-size: 14px;
  }

  .invoice-dialog-heading p,
  .invoice-dialog-status,
  .invoice-section-header p {
    display: none;
  }

  .invoice-dialog-body {
    gap: 10px;
    padding: 10px !important;
  }

  .invoice-form-section {
    padding: 14px;
  }

  .invoice-section-header {
    margin-bottom: 13px;
  }

  .invoice-client-picker,
  .invoice-po-fields,
  .invoice-client-details,
  .invoice-item-fields {
    grid-template-columns: 1fr;
  }

  .invoice-client-address {
    grid-column: auto;
  }

  .po-upload-row {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }

  .po-upload-box {
    width: 100%;
  }

  .invoice-items-header {
    padding: 13px 14px;
  }

  .invoice-line-item {
    margin: 10px 10px 0;
    padding: 12px;
  }

  .invoice-sign-field {
    max-width: none;
    margin: 10px 10px 0;
  }

  .invoice-term-table-wrap {
    max-height: 190px;
  }

  .invoice-dialog-footer {
    align-items: stretch;
    padding: 10px 12px;
  }

  .invoice-dialog-footer p {
    display: none;
  }

  .invoice-dialog-footer > div {
    display: grid;
    flex: 1;
    grid-template-columns: 1fr 1.25fr;
  }

  .invoice-cancel-btn,
  .invoice-save-btn {
    width: 100%;
    min-width: 0;
  }

  .invoice-list-toolbar {
    padding: 10px;
  }

  .invoice-list-tools {
    justify-content: space-between;
  }

  .invoice-result-count {
    margin-right: auto;
  }
}
</style>
