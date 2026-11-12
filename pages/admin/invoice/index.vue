<template>
  <ConfirmationDialog ref="confirmationDialog" />
  <div class="invoice-page-topbar">
    <v-btn
      icon="mdi-arrow-left"
      variant="text"
      color="grey-darken-3"
      size="small"
      class="invoice-back-btn"
      aria-label="Kembali"
      @click="$router.go(-1)"
    />

    <div class="invoice-page-heading">
      <div>
        <h1>Invoice</h1>
        <!-- <p>Kelola invoice, status pembayaran, dan nilai transaksi client.</p> -->
      </div>
    </div>

    <!-- <v-btn
      variant="outlined"
      size="small"
      class="invoice-page-refresh-btn text-none"
      prepend-icon="mdi-refresh"
      :loading="isRefreshing"
      :disabled="isRefreshing"
      @click="refreshData"
    >
      Refresh
    </v-btn> -->
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
            <p>
              {{
                newInvoice.no_inv
                  ? `Nomor ${invoiceNumberDisplay} tidak dapat diubah`
                  : "Nomor invoice dibuat otomatis saat disimpan"
              }}
            </p>
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
        <v-alert
          v-if="data.invoiceAddEdit === 'edit' && newInvoice.id_penawaran && newInvoice.id_penawaran !== '-'"
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-sync-circle"
          class="invoice-sync-notice"
        >
          <strong>Revisi tersinkron otomatis.</strong>
          Perubahan client, subject, Description, Qty, UOM, harga, dan nilai akan
          diterapkan ke Quotation serta seluruh invoice termin terkait. Status,
          bukti pembayaran, SPK, dokumen, dan pengeluaran tidak diubah.
        </v-alert>

        <section class="invoice-form-section">
          <div class="invoice-section-header">
            <div>
              <span>01</span>
              <h3>Invoice &amp; Client Information</h3>
            </div>
            <p>
              Nomor invoice terkunci. Perusahaan, PIC, vessel, dan lokasi dapat
              diperbarui.
            </p>
          </div>

          <div class="invoice-document-fields">
            <a-text-field-new
              :model-value="invoiceNumberDisplay"
              label="No. Invoice"
              hint="Nomor invoice tidak dapat diubah"
              persistent-hint
              disabled
            />
            <a-date-picker-new
              v-model="newInvoice.tanggal"
              label="Tanggal Invoice"
            />
          </div>

          <div class="invoice-client-picker">
            <a-autocomplete-new
              v-model="newInvoice.id_customer"
              label="Perusahaan"
              placeholder="Pilih perusahaan"
              item-title="label"
              item-value="value"
              :items="invoiceCompanyOptions"
              :disabled="Boolean(assignedInvoiceCompanyId)"
            />
            <a-select-new
              v-model="newInvoice.id_pic"
              label="PIC"
              placeholder="Pilih PIC"
              item-title="label"
              item-value="value"
              :items="invoicePicOptions"
              :disabled="!newInvoice.id_customer"
            />
          </div>

          <div
            v-if="!assignedInvoiceCompanyId"
            class="invoice-client-master-actions"
          >
            <v-btn
              class="invoice-master-client-btn text-none"
              variant="text"
              color="grey-darken-1"
              prepend-icon="mdi-account-cog-outline"
              @click="router.push('/admin/master/client')"
            >
              Kelola Master Perusahaan &amp; PIC
            </v-btn>
          </div>

          <dl class="invoice-client-details">
            <div class="invoice-client-address">
              <dt>Address</dt>
              <dd>{{ newInvoice.alamat_customer || "—" }}</dd>
            </div>
            <div>
              <dt>Phone Number</dt>
              <dd>{{ newInvoice.no_telp || "—" }}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{{ newInvoice.email || "—" }}</dd>
            </div>
          </dl>

          <div class="invoice-operation-fields">
            <a-text-field-new
              v-model="newInvoice.vessel"
              label="Vessel"
              placeholder="Nama vessel"
            />
            <a-autocomplete-new
              v-model="newInvoice.location"
              label="Location"
              placeholder="Pilih lokasi pekerjaan"
              :items="invoiceLocationOptions"
            />
          </div>
        </section>

        <section class="invoice-form-section">
          <div class="invoice-section-header">
            <div>
              <span>02</span>
              <h3>Purchase Order &amp; Subject</h3>
            </div>
            <p>
              Informasi PO bersifat opsional dan dapat dilengkapi dengan
              dokumen.
            </p>
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
            <a-text-field-new
              :model-value="newInvoice.no_penawaran || 'Invoice langsung'"
              label="Based On Quotation"
              disabled
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

                <div v-if="readingPo" class="po-reading">
                  Membaca file PO...
                </div>
              </div>

              <!-- Hasil Upload -->
              <div
                v-if="newInvoice.doc_preorder?.length"
                class="po-files-wrapper"
              >
                <div class="po-upload-label">File Terpilih</div>

                <div class="po-selected-list">
                  <article
                    v-for="(document, index) in newInvoice.doc_preorder"
                    :key="`${document.name}-${index}`"
                    class="po-selected-file"
                  >
                    <div
                      class="po-preview-frame"
                      :class="{
                        'po-preview-frame--document':
                          poDocumentKind(document) === 'document' ||
                          !document.dataUrl,
                      }"
                    >
                      <img
                        v-if="
                          poDocumentKind(document) === 'image' &&
                          document.dataUrl
                        "
                        :src="document.dataUrl"
                        :alt="`Preview ${document.name}`"
                      />
                      <iframe
                        v-else-if="
                          poDocumentKind(document) === 'pdf' &&
                          document.dataUrl
                        "
                        :src="`${document.dataUrl}#toolbar=0&navpanes=0&view=FitH`"
                        :title="`Preview ${document.name}`"
                      />
                      <div v-else class="po-preview-placeholder">
                        <v-icon :icon="poDocumentIcon(document)" size="38" />
                        <span>{{ poDocumentTypeLabel(document) }}</span>
                      </div>
                      <span
                        v-if="
                          poDocumentKind(document) !== 'document' &&
                          document.dataUrl
                        "
                        class="po-preview-badge"
                      >
                        Preview
                      </span>
                    </div>

                    <div class="po-selected-details">
                      <span class="po-ready-label">
                        <v-icon icon="mdi-check-circle" size="14" />
                        Siap disimpan bersama invoice
                      </span>
                      <strong class="po-selected-name" :title="document.name">
                        {{ document.name }}
                      </strong>
                      <div class="po-selected-meta">
                        <span>{{ poDocumentTypeLabel(document) }}</span>
                        <span aria-hidden="true">•</span>
                        <span>{{ formatPoFileSize(document.size) }}</span>
                      </div>
                      <small
                        v-if="
                          poDocumentKind(document) === 'document' ||
                          !document.dataUrl
                        "
                      >
                        Preview tidak tersedia, tetapi file tetap dapat
                        disimpan.
                      </small>

                      <div class="po-file-actions">
                        <button
                          type="button"
                          class="po-file-action"
                          :disabled="!document.dataUrl"
                          @click="openPoDocument(document)"
                        >
                          <v-icon icon="mdi-open-in-new" size="16" />
                          Lihat
                        </button>
                        <button
                          type="button"
                          class="po-file-action po-file-action--remove"
                          :disabled="readingPo || savingInvoice"
                          :aria-label="`Hapus ${document.name}`"
                          @click="newInvoice.doc_preorder?.splice(index, 1)"
                        >
                          <v-icon icon="mdi-delete-outline" size="16" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>

        </section>

        <section class="invoice-currency-section">
          <div class="invoice-currency-heading">
            <div>
              <h3>Transaction Currency</h3>
              <p>Currency dan subject yang digunakan pada invoice.</p>
            </div>
            <a-select-new
              v-model="newInvoice.currency_inv"
              class="invoice-currency-field"
              label="Currency"
              :items="[
                { title: 'IDR', value: 'IDR' },
                { title: 'USD', value: 'USD' },
                { title: 'SGD', value: 'SGD' },
              ]"
            />
          </div>
          <a-textarea-new
            v-model="newInvoice.perihal"
            label="Subject"
            placeholder="Invoice subject"
            rows="2"
          />
        </section>

        <InvoiceItemsEditor
          v-model="newInvoice.item_pekerjaan"
          :currency="newInvoice.currency_inv || 'IDR'"
        />

        <section class="invoice-form-section invoice-authorization-section">
          <div class="invoice-section-header">
            <div>
              <span>04</span>
              <h3>Authorization</h3>
            </div>
            <p>Pilih penandatangan yang akan tercantum pada invoice.</p>
          </div>
          <a-select-new
            v-model="newInvoice.sign_by"
            :items="[
              'Seilla Maryana',
              'Leo Adiatmaja Sembiring',
              'Muhammad Ridwan',
              'Lilis',
            ]"
            label="Sign By"
            class="invoice-sign-field"
          />
        </section>

        <!-- Bagian Template: Update tabel Terms & Conditions -->
        <section class="invoice-form-section">
          <div class="invoice-section-header">
            <div>
              <span>05</span>
              <h3>Terms &amp; Conditions</h3>
            </div>
            <p>Pilih ketentuan yang akan dicantumkan pada invoice.</p>
          </div>

          <div class="invoice-term-table-wrap">
            <table class="invoice-term-table">
              <tbody>
                <tr
                  v-for="(item, index) in sortedTermConditions"
                  :key="item?.id ?? index"
                >
                  <td class="invoice-term-number">{{ index + 1 }}.</td>

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
            <div>
              <span>06</span>
              <h3>Commercial Summary</h3>
            </div>
            <p>Ringkasan pajak, termin, dan nilai akhir invoice.</p>
          </div>
          <v-row justify="end" align="center">
            <v-col cols="12" md="6">
              <div class="invoice-discount-fields">
                <v-text-field
                  v-model.number="discountPercentInvoice"
                  label="Discount (%)"
                  type="number"
                  suffix="%"
                  min="0"
                  max="100"
                  step="0.01"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <v-text-field
                  v-model.number="newInvoice.discount_invoice"
                  label="Discount Amount"
                  type="number"
                  min="0"
                  :prefix="newInvoice.currency_inv === 'IDR' ? 'Rp' : newInvoice.currency_inv"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </div>
              <div
                class="d-flex align-center justify-space-between px-3 py-1 mt-3 bg-grey-lighten-5 rounded-lg border"
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
                <span class="font-weight-medium text-grey-darken-3">{{
                  formatInvoiceCurrency(
                    subtotal_invoice,
                    newInvoice.currency_inv,
                  )
                }}</span>
              </div>
              <div
                v-if="discountInvoice > 0"
                class="d-flex justify-space-between text-body-2 text-grey-darken-2 mb-1"
              >
                <span>Discount</span>
                <span class="font-weight-medium text-grey-darken-3"
                  >-
                  {{
                    formatInvoiceCurrency(
                      discountInvoice,
                      newInvoice.currency_inv,
                    )
                  }}</span
                >
              </div>
              <div
                class="d-flex flex-wrap align-center justify-space-between ga-2 text-body-2 text-grey-darken-2 mb-1"
              >
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
                <span
                  v-if="newInvoice.down_payment"
                  class="font-weight-medium text-grey-darken-3"
                >
                  {{
                    formatInvoiceCurrency(dpNominal, newInvoice.currency_inv)
                  }}
                </span>
              </div>
              <div
                v-if="newInvoice.pakai_ppn == true"
                class="d-flex justify-space-between text-body-2 text-grey-darken-2 mb-2"
              >
                <span>PPN 11%</span>
                <span class="font-weight-medium text-grey-darken-3">{{
                  formatInvoiceCurrency(ppnInvoice, newInvoice.currency_inv)
                }}</span>
              </div>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between align-center">
                <span
                  class="text-subtitle-1 font-weight-bold text-grey-darken-4"
                  >Grand Total</span
                >
                <span class="text-h6 font-weight-black text-primary">{{
                  formatInvoiceCurrency(
                    grandtotal_invoice,
                    newInvoice.currency_inv,
                  )
                }}</span>
              </div>
            </v-col>
          </v-row>
        </section>
      </v-card-text>

      <footer class="invoice-dialog-footer">
        <p>
          Pastikan detail client, item, dan total invoice sudah sesuai sebelum
          disimpan.
        </p>
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

  <v-dialog
    v-model="soaDialogOpen"
    max-width="840"
    scrollable
    :fullscreen="display.mdAndDown.value"
    persistent
  >
    <v-card class="soa-dialog-card" elevation="0">
      <header class="soa-dialog-header">
        <div>
          <h2>{{ editingSoa ? "Edit" : "Create" }} Statement of Account</h2>
          <p>Pilih perusahaan, invoice, tanggal, dan penandatangan.</p>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Tutup form SOA"
          :disabled="savingSoa"
          @click="soaDialogOpen = false"
        />
      </header>

      <v-card-text class="soa-dialog-body">
        <div class="soa-form-fields">
          <v-select
            v-model="soaForm.id_perusahaan"
            :items="soaCompanyOptions"
            item-title="nama"
            item-value="id"
            label="Perusahaan"
            placeholder="Pilih perusahaan"
            variant="outlined"
            density="compact"
            hide-details
            class="soa-v-select"
            :no-data-text="
              isLoading
                ? 'Memuat invoice...'
                : 'Tidak ada perusahaan dengan invoice Draft'
            "
          />

          <v-text-field
            v-model="soaForm.tanggal_soa"
            label="Tanggal SOA"
            type="date"
            :min="minimumSoaDate || undefined"
            variant="outlined"
            density="compact"
            hide-details
            class="soa-v-select"
          />

          <v-select
            v-model="soaForm.sign_by"
            :items="soaSigners"
            label="Sign By"
            placeholder="Pilih penandatangan"
            variant="outlined"
            density="compact"
            hide-details
            class="soa-v-select"
          />
        </div>

        <div class="soa-invoice-picker-heading">
          <div>
            <h3>Invoice</h3>
            <p>
              {{ soaInvoiceIds.length }} invoice dipilih
              <template v-if="soaSelectionGroup">
                · {{ soaSelectionGroup.currency }}
              </template>
            </p>
          </div>
          <strong v-if="soaInvoiceIds.length" class="soa-picker-total">
            {{
              formatInvoiceCurrency(
                selectedSoaOutstanding,
                soaSelectionGroup?.currency,
              )
            }}
          </strong>
        </div>

        <div v-if="soaForm.id_perusahaan" class="soa-invoice-table-wrap">
          <table class="soa-invoice-table">
            <thead>
              <tr>
                <th class="soa-invoice-check-cell"></th>
                <th class="soa-invoice-id-cell">Invoice</th>
                <th>Perusahaan</th>
                <th class="soa-invoice-date-cell">Tanggal</th>
                <th>Subject</th>
                <th class="soa-invoice-amount-cell">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="invoice in soaSelectableInvoices"
                :key="invoice.id"
              >
                <td class="soa-invoice-check-cell">
                  <v-checkbox
                    :model-value="isSoaInvoiceSelected(invoice)"
                    :disabled="!canSelectSoaInvoice(invoice)"
                    density="compact"
                    hide-details
                    color="primary"
                    @update:model-value="setSoaInvoiceSelected(invoice, $event)"
                  />
                </td>
                <td class="soa-invoice-reference">
                  {{ invoice.reference }}
                </td>
                <td>
                  {{ soaSelectedCompany?.nama || invoice.nama_customer || "—" }}
                </td>
                <td class="soa-invoice-date-cell">
                  {{ formatSoaInvoiceDate(invoice.tanggal) }}
                </td>
                <td class="soa-invoice-perihal">
                  {{ invoice.perihal || "—" }}
                </td>
                <td class="soa-invoice-amount-cell">
                  {{
                    formatInvoiceCurrency(
                      invoice.amount,
                      invoice.currency,
                    )
                  }}
                  <small>{{ invoice.currency }}</small>
                </td>
              </tr>
              <tr v-if="!soaSelectableInvoices.length">
                <td colspan="6" class="soa-invoice-empty-row">
                  <v-icon icon="mdi-receipt-text-remove-outline" size="20" />
                  Tidak ada invoice yang tersedia untuk perusahaan ini.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="soa-invoice-empty soa-invoice-empty--prompt">
          <v-icon icon="mdi-domain-search" size="22" />
          <span>
            Pilih perusahaan untuk menampilkan invoice yang dapat dipilih.
          </span>
        </div>

        <div
          v-if="soaForm.id_perusahaan && soaSelectableInvoices.length"
          class="soa-company-summary"
        >
          <v-icon icon="mdi-domain" size="16" />
          <span>Perusahaan dipilih</span>
          <strong>{{ soaSelectedCompany?.nama || "—" }}</strong>
          <small>Pilih invoice dengan mata uang yang sama.</small>
        </div>
      </v-card-text>

      <footer class="soa-dialog-footer">
        <span>Invoice baru harus berstatus Draft.</span>
        <div>
          <v-btn
            variant="outlined"
            class="text-none"
            :disabled="savingSoa"
            @click="soaDialogOpen = false"
          >
            Batal
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-none"
            prepend-icon="mdi-content-save-outline"
            :disabled="
              !soaInvoiceIds.length || !soaForm.sign_by || savingSoa
            "
            :loading="savingSoa"
            @click="saveSoa"
          >
            {{ editingSoa ? "Simpan Perubahan" : "Simpan SOA" }}
          </v-btn>
        </div>
      </footer>
    </v-card>
  </v-dialog>

  <v-dialog v-model="soaPreviewOpen" max-width="1240" scrollable>
    <v-card class="soa-preview-dialog-card" elevation="0">
      <header class="soa-preview-dialog-header">
        <div>
          <h2>Statement of Account</h2>
          <!-- <p v-if="activeSoa">
            {{ activeSoa.nama_customer }} · {{ activeSoa.currency }}
          </p> -->
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Tutup preview SOA"
          @click="soaPreviewOpen = false"
        />
      </header>
      <v-card-text class="soa-preview-dialog-body">
        <canvas-soa v-if="activeSoa" :soa-detail="activeSoa" />
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog
    v-if="false"
    v-model="serviceReportDialogOpen"
    max-width="1680"
    :fullscreen="display.mdAndDown.value"
    persistent
  >
    <v-card class="service-report-dialog" elevation="0">
      <header class="service-report-dialog-header">
        <div class="service-report-dialog-heading">
          <span class="service-report-dialog-icon">
            <v-icon icon="mdi-clipboard-text-outline" size="21" />
          </span>
          <div>
            <h2>{{ activeServiceReportInvoice?.service_report ? "Edit" : "Buat" }} Service Report</h2>
            <p>
              {{ activeServiceReportInvoice?.nama_customer || "Client" }}
              <span v-if="activeServiceReportInvoice?.no_inv">· INV/{{ activeServiceReportInvoice.no_inv }}</span>
            </p>
          </div>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Tutup editor Service Report"
          :disabled="savingServiceReport"
          @click="closeServiceReportDialog"
        />
      </header>

      <div class="service-report-dialog-content">
        <aside class="service-report-editor">
          <section class="service-report-form-section">
            <div class="service-report-form-title">
              <span><v-icon icon="mdi-table-edit" size="17" /></span>
              <div>
                <h3>Informasi Report</h3>
                <p>Data utama yang tampil pada tabel dokumen.</p>
              </div>
            </div>
            <div class="service-report-field-grid">
              <v-text-field v-model="serviceReportForm.vesselProject" label="Vessel / Project" variant="outlined" density="compact" hide-details />
              <v-text-field v-model="serviceReportForm.attention" label="Attention" variant="outlined" density="compact" hide-details />
              <v-text-field v-model="serviceReportForm.location" label="Location" variant="outlined" density="compact" hide-details />
              <v-text-field
                v-model="serviceReportForm.reportNo"
                label="Report No"
                variant="outlined"
                density="compact"
                hide-details
                readonly
                prepend-inner-icon="mdi-lock-outline"
                :loading="loadingServiceReportNumber"
                class="service-report-number-field"
              />
              <v-text-field v-model="serviceReportForm.servicePeriodStart" label="Mulai Service" type="date" variant="outlined" density="compact" hide-details />
              <v-text-field v-model="serviceReportForm.servicePeriodEnd" label="Selesai Service" type="date" variant="outlined" density="compact" hide-details />
              <v-textarea v-model="serviceReportForm.scopeOfWork" label="Scope of Work" rows="2" auto-grow variant="outlined" density="compact" hide-details class="service-report-field-full" />
            </div>
          </section>

          <section class="service-report-form-section">
            <div class="service-report-form-title service-report-form-title--action">
              <span><v-icon icon="mdi-format-list-numbered" size="17" /></span>
              <div>
                <h3>Point Report</h3>
                <p>Setiap point berisi subjudul dan beberapa item.</p>
              </div>
              <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" class="text-none" @click="addServiceReportSection">
                Tambah Point
              </v-btn>
            </div>

            <div class="service-report-section-list">
              <article
                v-for="(section, sectionIndex) in serviceReportForm.sections"
                :key="section.id"
                class="service-report-section-card"
              >
                <div class="service-report-section-head">
                  <span>{{ String(sectionIndex + 1).padStart(2, "0") }}</span>
                  <strong>Kelompok Point</strong>
                  <v-btn
                    icon="mdi-trash-can-outline"
                    size="x-small"
                    color="red-darken-1"
                    variant="text"
                    :disabled="serviceReportForm.sections.length === 1"
                    :aria-label="`Hapus point ${sectionIndex + 1}`"
                    @click="removeServiceReportSection(sectionIndex)"
                  />
                </div>
                <div class="service-report-section-fields">
                  <v-text-field v-model="section.point" label="Point" placeholder="Contoh: Scope of Work" variant="outlined" density="compact" hide-details />
                  <v-text-field v-model="section.sub" label="Sub" placeholder="Contoh: Description of Work Performed" variant="outlined" density="compact" hide-details />
                </div>
                <div class="service-report-items-label">
                  <span>Item</span>
                  <small>{{ section.items.length }} item</small>
                </div>
                <div class="service-report-items">
                  <div v-for="(_, itemIndex) in section.items" :key="`${section.id}-${itemIndex}`" class="service-report-item-row">
                    <span>{{ String.fromCharCode(97 + (itemIndex % 26)) }}.</span>
                    <v-textarea v-model="section.items[itemIndex]" :placeholder="`Isi item ${itemIndex + 1}`" rows="1" auto-grow variant="outlined" density="compact" hide-details />
                    <v-btn icon="mdi-close" size="x-small" variant="text" color="grey-darken-1" :disabled="section.items.length === 1" :aria-label="`Hapus item ${itemIndex + 1}`" @click="removeServiceReportItem(sectionIndex, itemIndex)" />
                  </div>
                </div>
                <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-plus" class="text-none service-report-add-item" @click="addServiceReportItem(sectionIndex)">
                  Tambah Item
                </v-btn>
              </article>
            </div>
          </section>

          <section class="service-report-form-section">
            <div class="service-report-form-title">
              <span><v-icon icon="mdi-image-multiple-outline" size="17" /></span>
              <div>
                <h3>Dokumentasi Foto</h3>
                <p>Foto otomatis tersusun maksimal 3 kolom per baris.</p>
              </div>
            </div>
            <label class="service-report-upload" :class="{ 'service-report-upload--busy': readingServiceReportImages }">
              <input type="file" accept="image/*" multiple :disabled="readingServiceReportImages" @change="addServiceReportImages" />
              <v-progress-circular v-if="readingServiceReportImages" indeterminate size="27" width="3" color="primary" />
              <v-icon v-else icon="mdi-cloud-upload-outline" size="27" color="primary" />
              <strong>{{ readingServiceReportImages ? "Memproses foto..." : "Pilih foto dokumentasi" }}</strong>
              <small>JPG, PNG, atau WEBP · foto akan dikompres otomatis</small>
            </label>
            <div v-if="serviceReportForm.images.length" class="service-report-image-list">
              <figure v-for="(image, imageIndex) in serviceReportForm.images" :key="image.id">
                <img :src="image.dataUrl" :alt="image.name" />
                <figcaption><span>{{ imageIndex + 1 }}. {{ image.name }}</span></figcaption>
                <v-btn icon="mdi-close" size="x-small" color="red-darken-1" variant="flat" :aria-label="`Hapus ${image.name}`" @click="removeServiceReportImage(imageIndex)" />
              </figure>
            </div>
          </section>
        </aside>

        <main class="service-report-preview-pane">
          <div class="service-report-preview-toolbar">
            <div>
              <v-icon icon="mdi-eye-outline" size="18" />
              <strong>Live Preview</strong>
            </div>
            <v-chip size="x-small" variant="tonal" color="primary">A4 · Portrait</v-chip>
          </div>
          <div class="service-report-preview-scroll">
            <canvas-service-report
              :service-report="serviceReportForm"
              :invoice="activeServiceReportInvoice"
              :show-actions="true"
            />
          </div>
        </main>
      </div>

      <footer class="service-report-dialog-footer">
        <span>Perubahan tersimpan di invoice ini.</span>
        <div>
          <v-btn variant="outlined" color="grey-darken-1" class="text-none" :disabled="savingServiceReport" @click="closeServiceReportDialog">Batal</v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save-outline" class="text-none" :loading="savingServiceReport" :disabled="readingServiceReportImages || savingServiceReport" @click="saveServiceReport">
            Simpan Service Report
          </v-btn>
        </div>
      </footer>
    </v-card>
  </v-dialog>

  <!-- <section class="invoice-overview" aria-label="Ringkasan status invoice">
    <button
      v-for="item in invoiceStatusOverview"
      :key="item.status || 'all'"
      type="button"
      class="invoice-overview-card"
      :class="[
        `invoice-overview-card--${item.tone}`,
        { 'invoice-overview-card--active': data.filterStatus === item.status },
      ]"
      :aria-pressed="data.filterStatus === item.status"
      @click="applyInvoiceStatusShortcut(item.status)"
    >
      <span class="invoice-overview-icon">
        <v-icon :icon="item.icon" size="16" />
      </span>
      <span class="invoice-overview-copy">
        <small>{{ item.label }}</small>
        <strong>{{ item.count }}</strong>
      </span>
      <span
        v-if="data.filterStatus === item.status"
        class="invoice-overview-active-dot"
        aria-hidden="true"
      ></span>
    </button>
  </section> -->

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
        <v-btn
          variant="outlined"
          size="small"
          class="invoice-export-btn text-none"
          prepend-icon="mdi-download-outline"
          :disabled="!invoiceTampilTersaring.length"
          @click="exportInvoiceCsv"
        >
          Export CSV
        </v-btn>
        <v-btn
          variant="outlined"
          size="small"
          class="invoice-page-refresh-btn text-none"
          prepend-icon="mdi-refresh"
          :loading="isRefreshing"
          :disabled="isRefreshing"
          @click="refreshData"
        >
          Refresh
        </v-btn>
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
      </div>
    </div>

    <v-divider />

    <section v-show="data.showInvoiceFilters" class="invoice-filter-panel">
      <!-- <div class="invoice-filter-heading">
        <div>
          <span class="invoice-filter-eyebrow">Filter pencarian</span>
          <p>
            Filter dapat digabungkan dan akan tetap tersimpan saat membuka
            detail invoice.
          </p>
        </div>
      </div> -->

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
            <option value="">All</option>
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
          label
          variant="flat"
          color="red"
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
        <span class="invoice-date-cell">{{
          rubahtanggallengkap(item.tanggal)
        }}</span>
      </template>

      <template #item.no_inv="{ item }">
        <NuxtLink
          :to="`/admin/invoice/${item.no_inv}`"
          class="invoice-reference"
        >
          #INV/DRM/{{ invoiceYear(item.tanggal) }}/{{ item.no_inv }}
          <v-icon icon="mdi-arrow-top-right" size="12" />
        </NuxtLink>
      </template>

      <template #item.nama_customer="{ item }">
        <div class="invoice-client-cell">
          <div class="invoice-client-name">{{ item.nama_customer || "—" }}</div>
          <div class="invoice-client-meta">
            <span
              ><v-icon icon="mdi-ferry" size="12" />{{
                item.vessel || "—"
              }}</span
            >
            <i aria-hidden="true"></i>
            <span
              ><v-icon icon="mdi-account-outline" size="12" />{{
                item.pic || "—"
              }}</span
            >
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
        <NuxtLink
          :to="`/admin/invoice/${item.no_inv}`"
          class="invoice-reference"
        >
          {{ item.perihal || "—" }}
          <!-- <v-icon icon="mdi-arrow-top-right" size="12" /> -->
        </NuxtLink>
        <!-- <div class="invoice-subject-cell">{{ item.perihal || "—" }}</div> -->
      </template>

      <template #item.grandtotal_invoice="{ item }">
        <strong class="invoice-amount-cell">
          {{
            formatInvoiceCurrency(item.grandtotal_invoice, item.currency_inv)
          }}
        </strong>
      </template>

      <template #item.status="{ item }">
        <div class="invoice-status-cell">
          <v-chip
            size="x-small"
            :color="statusColor(item.status)"
            variant="tonal"
            class="invoice-table-status"
          >
            <v-icon start icon="mdi-circle" size="6" />
            {{ item.status || "Draft" }}
          </v-chip>
          <v-tooltip v-if="isInvoiceInSoa(item)" text="SOA" location="top">
            <template #activator="{ props: tooltipProps }">
              <v-icon
                v-bind="tooltipProps"
                icon="mdi-message-alert"
                size="14"
                color="primary"
                aria-label="SOA"
              />
            </template>
          </v-tooltip>
        </div>
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
            <v-list
              density="compact"
              min-width="195"
              class="invoice-action-menu"
            >
              <v-list-item
                :to="`/admin/invoice/${item.id}`"
                prepend-icon="mdi-eye-outline"
                title="Detail invoice"
              />
              <v-list-item
                prepend-icon="mdi-file-sync-outline"
                title="Revisi invoice"
                subtitle="Sinkronkan dengan quotation tanpa mengubah status pembayaran"
                @click="openDialogEditInvoice(item)"
              />
              <template v-if="item.status === 'Draft'">
                <v-divider class="my-1" />
                <v-list-item
                  prepend-icon="mdi-delete-outline"
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
          <v-icon
            size="34"
            color="grey-lighten-1"
            icon="mdi-receipt-text-outline"
          />
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

    <div class="invoice-table-total-wrapper">
      <div class="invoice-table-total-card">
        <div class="invoice-table-total-heading">
          <span>Total Amount</span>
          <small>{{ invoiceTampilTersaring.length }} invoice</small>
        </div>
        <div
          v-if="invoiceTableTotals.length"
          class="invoice-table-total-values"
        >
          <div
            v-for="total in invoiceTableTotals"
            :key="total.currency"
            class="invoice-table-total-row"
          >
            <span>{{ total.currency }}</span>
            <strong>
              {{ formatInvoiceCurrency(total.amount, total.currency) }}
            </strong>
          </div>
        </div>
        <strong v-else class="invoice-table-total-empty">—</strong>
      </div>
    </div>
  </v-card>

  <v-card class="soa-list-card" flat>
    <header class="soa-list-header">
      <div class="soa-list-title">
        <span class="soa-list-icon"
          ><v-icon icon="mdi-message-alert" size="18" color="primary"
        /></span>
        <div>
          <h2>Daftar SOA</h2>
          <p>{{ soaRecords.length }} Statement of Account tersimpan</p>
        </div>
      </div>
      <div class="soa-list-header-actions">
        <v-btn
          variant="outlined"
          size="small"
          class="invoice-page-create-btn invoice-page-soa-btn text-none"
          prepend-icon="mdi-message-plus"
          :disabled="isLoading"
          @click="openSoaDialog"
        >
          Create SOA
        </v-btn>
        <v-btn
          size="small"
          variant="outlined"
          class="invoice-page-refresh-btn text-none"
          prepend-icon="mdi-refresh"
          :loading="loadingSoa"
          :disabled="loadingSoa"
          @click="loadSoaRecords(true)"
        >
          Refresh
        </v-btn>
      </div>
    </header>

    <v-data-table
      :headers="soaHeaders"
      :items="soaRecords"
      :loading="loadingSoa"
      :items-per-page="-1"
      density="compact"
      hide-default-footer
      class="soa-list-table"
    >
      <template #item.no="{ index }">
        <span class="invoice-row-index">{{ index + 1 }}</span>
      </template>

      <template #item.tanggal_soa="{ item }">
        {{ formatSoaLongDate(item.tanggal_soa) }}
      </template>

      <template #item.nama_customer="{ item }">
        <strong class="soa-list-customer">{{
          item.nama_customer || "—"
        }}</strong>
      </template>

      <template #item.invoiceCount="{ item }">
        {{ item.invoiceIds?.length || item.invoices?.length || 0 }} invoice
      </template>

      <template #item.outstanding="{ item }">
        <strong class="soa-list-amount">
          {{ formatInvoiceCurrency(soaOutstanding(item), item.currency) }}
        </strong>
      </template>

      <template #item.sign_by="{ item }">
        <span class="soa-list-signer">{{ item.sign_by || "—" }}</span>
      </template>

      <template #item.aksi="{ item }">
        <v-btn
          icon="mdi-pencil-outline"
          size="small"
          variant="text"
          color="primary"
          aria-label="Edit Statement of Account"
          @click="openSoaDialog(item)"
        />
        <v-btn
          icon="mdi-eye-outline"
          size="small"
          variant="text"
          color="primary"
          aria-label="Lihat Statement of Account"
          @click="openSoaPreview(item)"
        />
      </template>

      <template #no-data>
        <div class="soa-list-empty">
          <v-icon icon="mdi-file-document-outline" size="30" />
          <span>Belum ada SOA yang dibuat.</span>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { reactive, ref, computed, nextTick, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import moment from "moment";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";
import { useFirestore } from "vuefire";
import type { ConfirmationDialog } from "#components";
import InvoiceItemsEditor from "~/components/Admin/Invoice/invoice-items-editor.vue";
import type { customerM } from "~/types/customerModel";
import type { masterPicM } from "~/types/masterPicModel";
import type {
  invoiceCurrencyM,
  invoiceItemM,
  invoiceM,
  invoicePoDocumentM,
  serviceReportImageM,
  serviceReportM,
  serviceReportSectionM,
} from "~/types/invoice";
import { useinvoiceStore } from "~/stores/invoiceStore";
import {
  buildCompanyMaster,
  buildLegacyMasterPics,
  mergeMasterPics,
  normalizeCompanyName as normalizeMasterCompanyName,
} from "~/utils/customer-master";
import type { CompanyMasterRow } from "~/utils/customer-master";

interface SoaInvoiceSnapshot {
  id: string;
  no_inv: string;
  tanggal: string;
  perihal: string;
  projectName: string;
  debit: number;
  credit: number;
  balance: number;
  remark?: string;
}

interface SoaRecord {
  id: string;
  tanggal_soa: string;
  id_perusahaan: string;
  nama_customer: string;
  attn: string;
  currency: invoiceCurrencyM;
  sign_by: string;
  invoiceIds: string[];
  invoices: SoaInvoiceSnapshot[];
  createdAt: number;
  createdBy: string;
}

interface SoaCompanyOption {
  id: string;
  nama: string;
}

interface SoaInvoiceOption {
  id: string;
  reference: string;
  tanggal: string;
  nama_customer: string;
  perihal: string;
  amount: number;
  currency: invoiceCurrencyM;
  invoice?: invoiceM;
  snapshot?: SoaInvoiceSnapshot;
}

definePageMeta({
  layout: "admin",
});

const router = useRouter();
const route = useRoute();
const display = useDisplay();
const db = useFirestore();
const customerStore = usecustomerStore();
const masterPicStore = useMasterPicStore();
const invoiceStore = useinvoiceStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const loadingStore = useloadingStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);
const termconditionStore = usetermconditionStore();
const soaSigners = [
  "Seilla Maryana",
  "Leo Adiatmaja Sembiring",
  "Muhammad Ridwan",
  "Lilis",
];
const soaDialogOpen = ref(false);
const soaPreviewOpen = ref(false);
const savingSoa = ref(false);
const loadingSoa = ref(false);
const soaRecords = ref<SoaRecord[]>([]);
const editingSoa = ref<SoaRecord | null>(null);
const soaLinkedInvoiceIds = computed(
  () =>
    new Set(
      soaRecords.value.flatMap((soa) => [
        ...(soa.invoiceIds || []),
        ...(soa.invoices || []).map((invoice) => invoice.id),
      ]),
    ),
);
const activeSoa = ref<SoaRecord | null>(null);
const serviceReportDialogOpen = ref(false);
const savingServiceReport = ref(false);
const readingServiceReportImages = ref(false);
const loadingServiceReportNumber = ref(false);
const activeServiceReportInvoice = ref<invoiceM | null>(null);

function serviceReportId(prefix: string) {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ? `${prefix}-${uuid}` : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyServiceReportSection(
  overrides: Partial<serviceReportSectionM> = {},
): serviceReportSectionM {
  return {
    id: serviceReportId("section"),
    point: "",
    sub: "",
    items: [""],
    ...overrides,
  };
}

function emptyServiceReport(): serviceReportM {
  return {
    vesselProject: "",
    attention: "",
    location: "",
    servicePeriodStart: moment().format("YYYY-MM-DD"),
    servicePeriodEnd: moment().format("YYYY-MM-DD"),
    scopeOfWork: "",
    reportNo: "",
    sections: [emptyServiceReportSection()],
    images: [],
    createdAt: 0,
    createdBy: "",
  };
}

const serviceReportForm = ref<serviceReportM>(emptyServiceReport());
const soaInvoiceIds = ref<string[]>([]);
const soaForm = reactive({
  id_perusahaan: "",
  tanggal_soa: moment().format("YYYY-MM-DD"),
  sign_by: "",
});
const soaHeaders = [
  {
    title: "No",
    value: "no",
    sortable: false,
    width: "56px",
    align: "center" as const,
  },
  {
    title: "Tanggal SOA",
    value: "tanggal_soa",
    sortable: true,
    width: "150px",
  },
  { title: "Customer", value: "nama_customer", sortable: true, width: "240px" },
  { title: "Mata Uang", value: "currency", sortable: true, width: "100px" },
  { title: "Invoice", value: "invoiceCount", sortable: false, width: "110px" },
  {
    title: "Outstanding",
    value: "outstanding",
    sortable: false,
    width: "180px",
    align: "end" as const,
  },
  { title: "Sign By", value: "sign_by", sortable: true, width: "190px" },
  {
    title: "Aksi",
    value: "aksi",
    sortable: false,
    align: "center" as const,
    width: "96px",
  },
];

const data = reactive({
  tab: "invoice",
  searchCustomer: "",
  dialogCustomer: false,
  dialogTambahInvoice: false,
  invoiceAddEdit: "add" as "add" | "edit",
  editOriginalCustomerId: "",
  editOriginalInvoiceNumber: "",
  editOriginalInvoiceInternalId: "",
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
    {
      title: "No",
      value: "no",
      width: "48px",
      align: "center" as const,
      sortable: false,
    },
    { title: "Date", value: "tanggal", sortable: true, width: "116px" },
    { title: "Invoice Ref", value: "no_inv", sortable: true, width: "150px" },
    { title: "Client", value: "nama_customer", sortable: true, width: "210px" },
    {
      title: "Based On",
      value: "no_penawaran",
      sortable: true,
      width: "150px",
    },
    { title: "Subject", value: "perihal", sortable: true, width: "220px" },
    {
      title: "Total Amount",
      value: "grandtotal_invoice",
      sortable: true,
      width: "155px",
      align: "end" as const,
    },
    { title: "Status", value: "status", sortable: true, width: "120px" },
    {
      title: "Action",
      align: "center" as const,
      value: "aksi",
      width: "58px",
      sortable: false,
    },
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
  return Object.fromEntries(invoiceFilterKeys.map((key) => [key, data[key]]));
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
    id_pic: "",
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
    item_pekerjaan: [emptyInvoiceItem()],
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

function emptyInvoiceItem(): invoiceItemM {
  return {
    nama: "",
    qty: 1,
    uom: "Unit",
    kategori_item: "Barang",
    amount: 0,
    subtotal_item: 0,
  };
}

function normalizeInvoiceItems(value: unknown): invoiceItemM[] {
  const sourceItems = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? Object.values(value as Record<string, unknown>)
      : [];
  if (!sourceItems.length) return [emptyInvoiceItem()];

  const items = sourceItems
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    )
    .map((item) => {
      const qty = Number(item.qty ?? item.quantity);
      const amount = Number(item.amount ?? item.harga ?? item.harga_jual);
      const normalizedQty = Number.isFinite(qty) ? qty : 1;
      const normalizedAmount = Number.isFinite(amount) ? amount : 0;

      return {
        nama: String(
          item.nama || item.description || item.nama_item || item.keterangan || "",
        ),
        qty: normalizedQty,
        kategori_item: String(item.kategori_item || item.kategori || "Barang"),
        uom: String(item.uom || item.satuan || "Unit"),
        amount: normalizedAmount,
        subtotal_item: normalizedQty * normalizedAmount,
      };
    });

  return items.length ? items : [emptyInvoiceItem()];
}

function hasInvoiceItems(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(
    value &&
      typeof value === "object" &&
      Object.keys(value as Record<string, unknown>).length,
  );
}

const sortedTermConditions = computed(() => {
  const terms = [...termconditionStore.getDataTermcondition];
  const selected = newInvoice.value.termCondition || [];

  // Yang dipilih mengikuti urutan saat dipilih
  const selectedTerms = selected.map((selectedItem: any) => {
    return (
      terms.find((term: any) =>
        term.id
          ? term.id === selectedItem.id
          : term.nama_term === selectedItem.nama_term,
      ) || selectedItem
    );
  });

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

const invoiceLocationOptions = [
  "Batam", "Jakarta", "Lamongan", "Agats", "Ambon", "Amurang", "Atapupu",
  "Bacan", "Bahodopi", "Bali", "Balikpapan", "Banjarmasin", "Banten",
  "Batu Ampar", "Batulicin", "Bau-Bau", "Belawan", "Bengkalis", "Bengkulu",
  "Benoa", "Berau", "Biak", "Bima", "Bintan", "Bitung", "Bontang",
  "Boom Baru", "Celukan Bawang", "Cilegon", "Cilacap", "Cirebon", "Donggala",
  "Dumai", "Ende", "Fakfak", "Garongkong", "Gilimanuk", "Gorontalo",
  "Gresik", "Jayapura", "Kabil", "Kaimana", "Kendari", "Ketapang", "Kijing",
  "Kolaka", "Kotabaru", "Kuala Tanjung", "Kumai", "Kupang", "Labuan Bajo",
  "Lampung", "Lembar", "Lombok", "Makassar", "Manado", "Manokwari",
  "Maumere", "Medan", "Merak", "Merauke", "Morowali", "Muntok", "Nabire",
  "Namlea", "Nunukan", "Padang", "Padang Bai", "Palaran", "Palembang",
  "Palopo", "Palu", "Pangkal Pinang", "Pangkalan Bun", "Panjang", "Pantoloan",
  "Parepare", "Pekanbaru", "Pontianak", "Samarinda", "Sampit", "Sangatta",
  "Sape", "Saumlaki", "Sekupang", "Selat Panjang", "Semarang", "Semayang",
  "Serui", "Sibolga", "Soekarno Hatta Makassar", "Sorong", "Surabaya",
  "Tanjung Balai Karimun", "Tanjung Emas", "Tanjung Intan", "Tanjung Pandan",
  "Tanjung Perak", "Tanjung Pinang", "Tanjung Priok", "Tanjung Redeb",
  "Tanjung Uban", "Tanjung Wangi", "Tarakan", "Teluk Bayur", "Tembilahan",
  "Tenau", "Ternate", "Tidore", "Timika", "Tobelo", "Trisakti", "Tual",
  "Tuban", "Waingapu",
];

const invoiceCompanies = computed(() =>
  buildCompanyMaster(customerStore.getDataCustomer),
);
const assignedInvoiceCompanyId = computed(() =>
  userStore.getIdPerusahaan.trim(),
);
const accessibleInvoiceCompanies = computed(() => {
  if (!assignedInvoiceCompanyId.value) return invoiceCompanies.value;
  return invoiceCompanies.value.filter(
    (company) =>
      company.id_customer === assignedInvoiceCompanyId.value ||
      company.sourceIds.includes(assignedInvoiceCompanyId.value),
  );
});
const invoiceCompanyOptions = computed(() => {
  const options = accessibleInvoiceCompanies.value.map((company) => ({
    ...company,
    label: company.nama,
    value: company.id_customer,
  }));
  const currentCompanyId = newInvoice.value.id_customer;
  if (
    currentCompanyId &&
    newInvoice.value.nama_customer &&
    !options.some((option) => option.value === currentCompanyId)
  ) {
    options.unshift({
      id: currentCompanyId,
      id_customer: currentCompanyId,
      sourceIds: [currentCompanyId],
      nama: newInvoice.value.nama_customer,
      alamat: newInvoice.value.alamat_customer || "",
      pic: newInvoice.value.pic || "",
      no_telp: newInvoice.value.no_telp || "",
      email: newInvoice.value.email || "",
      vessel: newInvoice.value.vessel || "",
      createdAt: newInvoice.value.createdAt || 0,
      createdBy: newInvoice.value.createdBy || "",
      label: newInvoice.value.nama_customer,
      value: currentCompanyId,
    });
  }
  return options;
});
const invoiceLegacyMasterPics = computed(() =>
  buildLegacyMasterPics(customerStore.getDataCustomer, invoiceCompanies.value),
);
const invoiceMasterPics = computed(() =>
  mergeMasterPics(
    masterPicStore.getDataMasterPic,
    invoiceLegacyMasterPics.value,
    invoiceCompanies.value,
  ),
);
const invoicePicOptions = computed(() => {
  const options = invoiceMasterPics.value
    .filter((pic) => pic.id_perusahaan === newInvoice.value.id_customer)
    .map((pic) => ({
      ...pic,
      label: pic.pic,
      value: pic.id_master_pic || pic.id,
    }));
  if (
    newInvoice.value.pic &&
    !options.some(
      (option) =>
        option.pic.trim().toLocaleLowerCase("id-ID") ===
        newInvoice.value.pic.trim().toLocaleLowerCase("id-ID"),
    )
  ) {
    const currentPicId =
      newInvoice.value.id_pic ||
      `invoice-current-${newInvoice.value.id || "pic"}`;
    options.unshift({
      id: currentPicId,
      id_master_pic: currentPicId,
      id_perusahaan: newInvoice.value.id_customer,
      nama_perusahaan: newInvoice.value.nama_customer,
      pic: newInvoice.value.pic,
      no_telp: newInvoice.value.no_telp || "",
      email: newInvoice.value.email || "",
      createdAt: newInvoice.value.createdAt || 0,
      createdBy: newInvoice.value.createdBy || "",
      label: newInvoice.value.pic,
      value: currentPicId,
    });
  }
  return options;
});
const invoiceNumberDisplay = computed(() => {
  if (!newInvoice.value.no_inv) return "Dibuat otomatis saat disimpan";
  return `INV/DRM/${invoiceYear(newInvoice.value.tanggal)}/${newInvoice.value.no_inv}`;
});

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

const soaDraftInvoices = computed(() =>
  invoiceStore.getDataInvoice.filter(
    (invoice) =>
      String(invoice.status || "")
        .trim()
        .toLocaleLowerCase("id-ID") === "draft",
  ),
);

function normalizeCompanyName(value?: string) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("id-ID");
}

const soaCompanyOptions = computed<SoaCompanyOption[]>(() => {
  const companies = new Map<string, SoaCompanyOption>();

  customerStore.getDataCustomer.forEach((company: customerM) => {
    const id = (company.id_customer || company.id || "").trim();
    if (!id) return;

    const hasDraftInvoice = soaDraftInvoices.value.some((invoice) => {
      const invoiceCompanyId = invoice.id_customer?.trim();
      if (invoiceCompanyId) return invoiceCompanyId === id;
      return (
        normalizeCompanyName(invoice.nama_customer) ===
        normalizeCompanyName(company.nama)
      );
    });

    if (hasDraftInvoice) companies.set(id, { id, nama: company.nama });
  });

  soaDraftInvoices.value.forEach((invoice) => {
    const id = invoice.id_customer?.trim();
    if (!id || companies.has(id)) return;
    companies.set(id, {
      id,
      nama: invoice.nama_customer?.trim() || "Perusahaan tanpa nama",
    });
  });

  const currentCompany = editingSoa.value;
  if (currentCompany?.id_perusahaan && currentCompany.nama_customer) {
    companies.set(currentCompany.id_perusahaan, {
      id: currentCompany.id_perusahaan,
      nama: currentCompany.nama_customer,
    });
  }

  return [...companies.values()].sort((first, second) =>
    first.nama.localeCompare(second.nama, "id-ID"),
  );
});

const soaSelectedCompany = computed(
  () =>
    soaCompanyOptions.value.find(
      (company) => company.id === soaForm.id_perusahaan,
    ) || null,
);

watch(
  () => soaForm.id_perusahaan,
  () => {
    soaInvoiceIds.value = [];
  },
  { flush: "sync" },
);

const soaSelectableInvoices = computed<SoaInvoiceOption[]>(() => {
  const company = soaSelectedCompany.value;
  if (!company) return [];

  const editingInvoiceIds = new Set([
    ...(editingSoa.value?.invoiceIds || []),
    ...(editingSoa.value?.invoices || []).map((invoice) => invoice.id),
  ]);
  const companyInvoices = invoiceStore.getDataInvoice
    .filter((invoice) => {
      const id = invoiceDocumentId(invoice);
      const invoiceCompanyId = invoice.id_customer?.trim();
      const belongsToCompany = invoiceCompanyId
        ? invoiceCompanyId === company.id
        : normalizeCompanyName(invoice.nama_customer) ===
          normalizeCompanyName(company.nama);
      const isDraft =
        String(invoice.status || "")
          .trim()
          .toLocaleLowerCase("id-ID") === "draft";
      return (
        belongsToCompany &&
        (isDraft || editingInvoiceIds.has(id))
      );
    })
    .map((invoice): SoaInvoiceOption => ({
      id: invoiceDocumentId(invoice),
      reference: invoiceReference(invoice),
      tanggal: invoice.tanggal || "",
      nama_customer: invoice.nama_customer || company.nama,
      perihal: invoice.perihal || "",
      amount: Math.max(0, Number(invoice.grandtotal_invoice) || 0),
      currency: normalizeInvoiceCurrency(invoice.currency_inv),
      invoice,
    }));

  const availableInvoiceIds = new Set(
    companyInvoices.map((invoice) => invoice.id),
  );
  const retainedSnapshots = (editingSoa.value?.invoices || [])
    .filter(
      (snapshot) =>
        soaInvoiceIds.value.includes(snapshot.id) &&
        !availableInvoiceIds.has(snapshot.id),
    )
    .map((snapshot): SoaInvoiceOption => ({
      id: snapshot.id,
      reference: snapshot.no_inv || snapshot.id,
      tanggal: snapshot.tanggal || "",
      nama_customer: company.nama,
      perihal: snapshot.perihal || "",
      amount: Math.max(0, Number(snapshot.debit) || 0),
      currency: normalizeInvoiceCurrency(editingSoa.value?.currency),
      snapshot,
    }));

  return [...companyInvoices, ...retainedSnapshots].sort((first, second) =>
    String(second.tanggal || "").localeCompare(String(first.tanggal || "")),
  );
});

const selectedSoaInvoices = computed(() =>
  soaSelectableInvoices.value.filter((invoice) =>
    soaInvoiceIds.value.includes(invoice.id),
  ),
);

const minimumSoaDate = computed(() =>
  selectedSoaInvoices.value.reduce((latestDate, invoice) => {
    const invoiceDate = String(invoice.tanggal || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(invoiceDate)) return latestDate;
    return invoiceDate > latestDate ? invoiceDate : latestDate;
  }, ""),
);

watch(minimumSoaDate, (minimumDate) => {
  if (minimumDate && soaForm.tanggal_soa < minimumDate) {
    soaForm.tanggal_soa = minimumDate;
  }
});

const soaSelectionGroup = computed(() => {
  const first = selectedSoaInvoices.value[0];
  const company = soaSelectedCompany.value;
  if (!company) return null;

  return {
    id_customer: company.id,
    nama_customer: company.nama,
    currency:
      first?.currency ||
      (editingSoa.value && editingSoa.value.id_perusahaan === company.id
        ? normalizeInvoiceCurrency(editingSoa.value.currency)
        : null),
    attn: editingSoa.value?.attn || "Account / Finance Dept",
  };
});

const selectedSoaOutstanding = computed(() =>
  selectedSoaInvoices.value.reduce(
    (total, item) =>
      total +
      (item.invoice
        ? invoiceOutstanding(item.invoice)
        : Number(item.snapshot?.balance) || 0),
    0,
  ),
);

function invoiceDocumentId(invoice: invoiceM) {
  return invoice.id || invoice.id_invoice || invoice.no_inv;
}

function isInvoiceInSoa(invoice: invoiceM) {
  return soaLinkedInvoiceIds.value.has(invoiceDocumentId(invoice));
}

function invoiceReference(invoice: invoiceM) {
  return `#INV/DRM/${invoiceYear(invoice.tanggal)}/${invoice.no_inv || invoiceDocumentId(invoice)}`;
}

function invoiceOutstanding(invoice: invoiceM) {
  if (isInvoicePaid(invoice)) {
    return 0;
  }
  return Math.max(0, Number(invoice.grandtotal_invoice) || 0);
}

function isInvoicePaid(invoice: invoiceM) {
  return ["selesai", "lunas"].includes(
    String(invoice.status || "")
      .trim()
      .toLocaleLowerCase("id-ID"),
  );
}

function isSoaInvoiceSelected(invoice: SoaInvoiceOption) {
  return soaInvoiceIds.value.includes(invoice.id);
}

function canSelectSoaInvoice(invoice: SoaInvoiceOption) {
  if (isSoaInvoiceSelected(invoice)) return true;

  const linkedToCurrentSoa = [
    ...(editingSoa.value?.invoiceIds || []),
    ...(editingSoa.value?.invoices || []).map((item) => item.id),
  ].includes(invoice.id);
  if (soaLinkedInvoiceIds.value.has(invoice.id) && !linkedToCurrentSoa) {
    return false;
  }

  return (
    !soaSelectionGroup.value?.currency ||
    invoice.currency === soaSelectionGroup.value.currency
  );
}

function setSoaInvoiceSelected(invoice: SoaInvoiceOption, selected: unknown) {
  const id = invoice.id;
  if (selected) {
    if (!canSelectSoaInvoice(invoice)) return;
    if (!soaInvoiceIds.value.includes(id)) soaInvoiceIds.value.push(id);
    return;
  }
  soaInvoiceIds.value = soaInvoiceIds.value.filter((itemId) => itemId !== id);
}

function formatSoaInvoiceDate(value?: string) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(date);
}

function formatSoaLongDate(value?: string) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function soaOutstanding(soa: SoaRecord) {
  return (soa.invoices || []).reduce(
    (total, invoice) => total + (Number(invoice.balance) || 0),
    0,
  );
}

function openSoaDialog(soa?: SoaRecord) {
  editingSoa.value = soa || null;
  soaForm.id_perusahaan = soa?.id_perusahaan || "";
  soaForm.tanggal_soa = soa?.tanggal_soa || moment().format("YYYY-MM-DD");
  soaForm.sign_by = soa?.sign_by || "";
  soaInvoiceIds.value = soa
    ? [
        ...new Set([
          ...(soa.invoiceIds || []),
          ...(soa.invoices || []).map((invoice) => invoice.id),
        ]),
      ]
    : [];
  soaDialogOpen.value = true;
}

function openSoaPreview(soa: SoaRecord) {
  activeSoa.value = soa;
  soaPreviewOpen.value = true;
}

function formatServiceReportNumber(invoice: invoiceM, sequence: number) {
  const year = invoiceYear(invoice.tanggal || moment().format("YYYY-MM-DD"));
  return `SR/DRM/${year}/${String(sequence).padStart(5, "0")}`;
}

function highestSavedServiceReportSequence() {
  return invoiceStore.getDataInvoice.reduce((highest, item) => {
    const match = item.service_report?.reportNo?.trim().match(/\/(\d+)$/);
    return Math.max(highest, Number(match?.[1]) || 0);
  }, 0);
}

async function loadNextServiceReportNumber(invoice: invoiceM) {
  if (invoice.service_report?.reportNo) return;
  loadingServiceReportNumber.value = true;
  try {
    const snapshot = await getDoc(doc(db, "penomoran", "nomor"));
    const currentSequence = Math.max(
      snapshot.exists() ? Number(snapshot.data().no_service_report) || 0 : 0,
      highestSavedServiceReportSequence(),
    );
    if (
      activeServiceReportInvoice.value === invoice &&
      serviceReportDialogOpen.value
    ) {
      serviceReportForm.value.reportNo = formatServiceReportNumber(
        invoice,
        currentSequence + 1,
      );
    }
  } catch (error) {
    console.error("Gagal membaca penomoran Service Report:", error);
    notificationStore.showError("Nomor Service Report belum dapat dimuat");
  } finally {
    loadingServiceReportNumber.value = false;
  }
}

function cloneServiceReport(report: serviceReportM): serviceReportM {
  return JSON.parse(JSON.stringify(report)) as serviceReportM;
}

function defaultServiceReportForInvoice(invoice: invoiceM): serviceReportM {
  const existingReport = invoice.service_report;
  if (existingReport) {
    const cloned = cloneServiceReport(existingReport);
    cloned.sections = (cloned.sections || []).map((section) => ({
      ...section,
      id: section.id || serviceReportId("section"),
      items: section.items?.length ? section.items : [""],
    }));
    if (!cloned.sections.length) cloned.sections = [emptyServiceReportSection()];
    cloned.images = cloned.images || [];
    return cloned;
  }

  const invoiceItems = (invoice.item_pekerjaan || [])
    .map((item) => item.nama?.trim())
    .filter(Boolean) as string[];
  return {
    ...emptyServiceReport(),
    vesselProject: invoice.vessel || "",
    attention: invoice.nama_customer || invoice.pic || "",
    location: invoice.location || "",
    servicePeriodStart: invoice.tanggal || moment().format("YYYY-MM-DD"),
    servicePeriodEnd: invoice.tanggal || moment().format("YYYY-MM-DD"),
    scopeOfWork: invoice.perihal || "",
    reportNo: "",
    sections: [
      emptyServiceReportSection({
        point: "Scope of Work",
        sub: "Description of Work Performed:",
        items: invoiceItems.length ? invoiceItems : [""],
      }),
    ],
  };
}

function openServiceReportDialog(invoice: invoiceM) {
  activeServiceReportInvoice.value = invoice;
  serviceReportForm.value = defaultServiceReportForInvoice(invoice);
  serviceReportDialogOpen.value = true;
  void loadNextServiceReportNumber(invoice);
}

function closeServiceReportDialog() {
  if (savingServiceReport.value || readingServiceReportImages.value) return;
  serviceReportDialogOpen.value = false;
  activeServiceReportInvoice.value = null;
  serviceReportForm.value = emptyServiceReport();
}

function addServiceReportSection() {
  serviceReportForm.value.sections.push(emptyServiceReportSection());
}

function removeServiceReportSection(index: number) {
  if (serviceReportForm.value.sections.length <= 1) return;
  serviceReportForm.value.sections.splice(index, 1);
}

function addServiceReportItem(sectionIndex: number) {
  serviceReportForm.value.sections[sectionIndex]?.items.push("");
}

function removeServiceReportItem(sectionIndex: number, itemIndex: number) {
  const items = serviceReportForm.value.sections[sectionIndex]?.items;
  if (!items || items.length <= 1) return;
  items.splice(itemIndex, 1);
}

function removeServiceReportImage(index: number) {
  serviceReportForm.value.images.splice(index, 1);
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Foto tidak dapat dibaca"));
    reader.onerror = () => reject(reader.error || new Error("Foto tidak dapat dibaca"));
    reader.readAsDataURL(blob);
  });
}

async function compressServiceReportImage(file: File): Promise<serviceReportImageM> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error(`Foto ${file.name} tidak dapat dibuka`));
      element.src = objectUrl;
    });
    const maxEdge = 1000;
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Browser tidak mendukung kompresi foto");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const toBlob = (quality: number) =>
      new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Foto gagal dikompres"))),
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
      id: serviceReportId("photo"),
      name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
      dataUrl: await blobToDataUrl(blob),
      size: blob.size,
      contentType: "image/jpeg",
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function addServiceReportImages(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = "";
  if (!files.length || readingServiceReportImages.value) return;
  if (files.some((file) => !file.type.startsWith("image/"))) {
    notificationStore.showError("Semua file dokumentasi harus berupa gambar");
    return;
  }
  readingServiceReportImages.value = true;
  try {
    const images: serviceReportImageM[] = [];
    for (const file of files) images.push(await compressServiceReportImage(file));
    const nextImages = [...serviceReportForm.value.images, ...images];
    const candidate = { ...serviceReportForm.value, images: nextImages };
    const invoiceCandidate = {
      ...activeServiceReportInvoice.value,
      service_report: candidate,
    };
    if (new TextEncoder().encode(JSON.stringify(invoiceCandidate)).byteLength > MAX_INVOICE_BYTES) {
      notificationStore.showError("Total foto terlalu besar untuk invoice ini. Kurangi jumlah foto.");
      return;
    }
    serviceReportForm.value.images = nextImages;
  } catch (error) {
    console.error("Gagal memproses foto Service Report:", error);
    notificationStore.showError("Sebagian foto tidak dapat diproses. Silakan coba lagi.");
  } finally {
    readingServiceReportImages.value = false;
  }
}

async function saveServiceReport() {
  if (savingServiceReport.value || readingServiceReportImages.value) return;
  const invoice = activeServiceReportInvoice.value;
  const invoiceId = invoice && invoiceDocumentId(invoice);
  if (!invoice || !invoiceId) {
    notificationStore.showError("Invoice untuk Service Report tidak ditemukan");
    return;
  }
  if (!serviceReportForm.value.vesselProject.trim()) {
    notificationStore.showError("Vessel / Project wajib diisi");
    return;
  }

  const sections = serviceReportForm.value.sections.map((section) => ({
    ...section,
    point: section.point.trim(),
    sub: section.sub.trim(),
    items: section.items.map((item) => item.trim()).filter(Boolean),
  }));
  if (sections.some((section) => !section.point || !section.items.length)) {
    notificationStore.showError("Setiap point wajib memiliki nama dan minimal satu item");
    return;
  }

  const existing = invoice.service_report;
  const baseServiceReport: serviceReportM = {
    ...cloneServiceReport(serviceReportForm.value),
    sections,
    createdAt: existing?.createdAt || Date.now(),
    createdBy: existing?.createdBy || userStore.getEmail,
    updatedAt: Date.now(),
    updatedBy: userStore.getEmail,
  };
  const updatedInvoice: invoiceM = {
    ...invoice,
    service_report: baseServiceReport,
  };
  if (new TextEncoder().encode(JSON.stringify(updatedInvoice)).byteLength > MAX_INVOICE_BYTES) {
    notificationStore.showError("Service Report terlalu besar. Kurangi jumlah foto.");
    return;
  }

  savingServiceReport.value = true;
  loadingStore.setLoading(true);
  try {
    let savedReport = baseServiceReport;
    await runTransaction(db, async (transaction) => {
      let reportNo = existing?.reportNo?.trim() || "";
      if (!reportNo) {
        const numberingRef = doc(db, "penomoran", "nomor");
        const numberingSnapshot = await transaction.get(numberingRef);
        const currentSequence = Math.max(
          numberingSnapshot.exists()
            ? Number(numberingSnapshot.data().no_service_report) || 0
            : 0,
          highestSavedServiceReportSequence(),
        );
        const nextSequence = currentSequence + 1;
        reportNo = formatServiceReportNumber(invoice, nextSequence);
        transaction.set(
          numberingRef,
          { no_service_report: nextSequence },
          { merge: true },
        );
      }

      savedReport = { ...baseServiceReport, reportNo };
      const plainInvoice = JSON.parse(
        JSON.stringify({ ...updatedInvoice, service_report: savedReport }),
      ) as invoiceM;
      const { id: _documentId, ...invoiceUpdate } = plainInvoice;
      transaction.update(doc(db, "invoice", invoiceId), invoiceUpdate);

      if (invoiceUpdate.id_penawaran && invoiceUpdate.id_penawaran !== "-") {
        transaction.set(
          doc(
            db,
            "penawaran",
            invoiceUpdate.id_penawaran,
            "invoice",
            invoiceId,
          ),
          invoiceUpdate,
          { merge: true },
        );
      }
    });

    serviceReportForm.value.reportNo = savedReport.reportNo;
    sessionStorage.removeItem("invoice");
    if (invoice.id_penawaran && invoice.id_penawaran !== "-") {
      sessionStorage.removeItem(`penawaran/${invoice.id_penawaran}/invoice`);
    }
    await invoiceStore.tarikDataInvoiceAct();
    notificationStore.showSuccess(
      existing ? "Service Report berhasil diperbarui" : "Service Report berhasil dibuat",
    );
    serviceReportDialogOpen.value = false;
    activeServiceReportInvoice.value = null;
    serviceReportForm.value = emptyServiceReport();
  } catch (error) {
    console.error("Gagal menyimpan Service Report:", error);
    notificationStore.showError("Service Report gagal disimpan");
  } finally {
    savingServiceReport.value = false;
    loadingStore.setLoading(false);
  }
}

async function loadSoaRecords(showSuccess = false) {
  if (loadingSoa.value) return;
  loadingSoa.value = true;
  try {
    const companyId = userStore.getIdPerusahaan.trim();
    const soaCollection = collection(db, "soa");
    const soaQuery = companyId
      ? query(soaCollection, where("id_perusahaan", "==", companyId))
      : soaCollection;
    const snapshot = await getDocs(soaQuery);
    soaRecords.value = snapshot.docs
      .map((document) => ({
        ...(document.data() as Omit<SoaRecord, "id">),
        id: document.id,
      }))
      .sort((first, second) => second.createdAt - first.createdAt);
    if (showSuccess)
      notificationStore.showSuccess("Daftar SOA berhasil diperbarui");
  } catch (error) {
    console.error("Gagal memuat daftar SOA:", error);
    notificationStore.showError("Daftar SOA gagal dimuat");
  } finally {
    loadingSoa.value = false;
  }
}

function createSoaSnapshot(invoice: invoiceM): SoaInvoiceSnapshot {
  const debit = Math.max(0, Number(invoice.grandtotal_invoice) || 0);
  const isPaid = isInvoicePaid(invoice);
  const credit = isPaid ? debit : 0;

  return {
    id: invoiceDocumentId(invoice),
    no_inv: `INV/DRM/${invoiceYear(invoice.tanggal)}/${invoice.no_inv || invoiceDocumentId(invoice)}`,
    tanggal: invoice.tanggal || "",
    perihal: invoice.perihal || "",
    projectName: invoice.vessel || invoice.perihal || "",
    debit,
    credit,
    balance: Math.max(0, debit - credit),
    remark: isPaid ? "Paid" : "",
  };
}

async function saveSoa() {
  if (savingSoa.value) return;
  const selectedCompany = soaSelectedCompany.value;
  if (!selectedCompany) {
    notificationStore.showError("Pilih perusahaan terlebih dahulu");
    return;
  }
  if (!soaForm.tanggal_soa) {
    notificationStore.showError("Tanggal SOA belum dipilih");
    return;
  }
  if (!soaForm.sign_by) {
    notificationStore.showError("Sign By belum dipilih");
    return;
  }
  const selectionGroup = soaSelectionGroup.value;
  if (!soaInvoiceIds.value.length || !selectionGroup?.currency) {
    notificationStore.showError("Pilih minimal satu invoice untuk SOA");
    return;
  }

  savingSoa.value = true;
  try {
    const selectedOptions = selectedSoaInvoices.value;
    const snapshotsById = new Map<string, SoaInvoiceSnapshot>();
    const existingSnapshotsById = new Map<string, SoaInvoiceSnapshot>(
      (editingSoa.value?.invoices || []).map((snapshot) => [
        snapshot.id,
        snapshot,
      ] as const),
    );
    selectedOptions.forEach((option) => {
      snapshotsById.set(
        option.id,
        option.invoice
          ? (existingSnapshotsById.get(option.id) ||
            createSoaSnapshot(option.invoice))
          : option.snapshot!,
      );
    });
    (editingSoa.value?.invoices || []).forEach((snapshot) => {
      if (
        soaInvoiceIds.value.includes(snapshot.id) &&
        !snapshotsById.has(snapshot.id)
      ) {
        snapshotsById.set(snapshot.id, snapshot);
      }
    });

    const payload: Omit<SoaRecord, "id"> = {
      tanggal_soa: soaForm.tanggal_soa,
      id_perusahaan: selectedCompany.id,
      nama_customer: selectedCompany.nama,
      attn: selectionGroup.attn,
      currency: selectionGroup.currency,
      sign_by: soaForm.sign_by,
      invoiceIds: [...soaInvoiceIds.value],
      invoices: [...snapshotsById.values()],
      createdAt: editingSoa.value?.createdAt || Date.now(),
      createdBy: editingSoa.value?.createdBy || userStore.getEmail,
    };

    let savedSoa: SoaRecord;
    if (editingSoa.value) {
      await updateDoc(doc(db, "soa", editingSoa.value.id), payload);
      savedSoa = { ...payload, id: editingSoa.value.id };
      soaRecords.value = soaRecords.value.map((soa) =>
        soa.id === savedSoa.id ? savedSoa : soa,
      );
      notificationStore.showSuccess("SOA berhasil diperbarui");
    } else {
      const documentRef = await addDoc(collection(db, "soa"), payload);
      savedSoa = { ...payload, id: documentRef.id };
      soaRecords.value = [savedSoa, ...soaRecords.value];
      notificationStore.showSuccess("SOA berhasil dibuat");
    }

    soaDialogOpen.value = false;
    editingSoa.value = null;
    openSoaPreview(savedSoa);
  } catch (error) {
    console.error("Gagal menyimpan SOA:", error);
    notificationStore.showError(
      editingSoa.value ? "SOA gagal diperbarui" : "SOA gagal dibuat",
    );
  } finally {
    savingSoa.value = false;
  }
}

const readingPo = ref(false);
const savingInvoice = ref(false);
const isLoading = ref(!invoiceStore.hasCachedData());
const isRefreshing = ref(false);
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

function poDocumentExtension(document: invoicePoDocumentM) {
  const fileName = String(document.name || "");
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  return extension === fileName.toLowerCase() ? "" : extension;
}

function poDocumentKind(
  document: invoicePoDocumentM,
): "image" | "pdf" | "document" {
  const extension = poDocumentExtension(document);
  const contentType = String(document.contentType || "").toLowerCase();
  if (
    contentType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "webp"].includes(extension)
  ) {
    return "image";
  }
  if (contentType === "application/pdf" || extension === "pdf") return "pdf";
  return "document";
}

function poDocumentTypeLabel(document: invoicePoDocumentM) {
  const extension = poDocumentExtension(document);
  if (extension) return extension.toUpperCase();
  if (poDocumentKind(document) === "image") return "GAMBAR";
  if (poDocumentKind(document) === "pdf") return "PDF";
  return "DOKUMEN";
}

function poDocumentIcon(document: invoicePoDocumentM) {
  const kind = poDocumentKind(document);
  if (kind === "pdf") return "mdi-file-pdf-box";
  if (kind === "image") return "mdi-file-image-outline";
  return "mdi-file-document-outline";
}

function formatPoFileSize(bytes = 0) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function openPoDocument(document: invoicePoDocumentM) {
  if (!document.dataUrl) {
    notificationStore.showError("Preview dokumen PO tidak tersedia");
    return;
  }

  const link = window.document.createElement("a");
  link.href = document.dataUrl;
  if (poDocumentKind(document) === "document") {
    link.download = document.name;
  } else {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  window.document.body.appendChild(link);
  link.click();
  link.remove();
}

const subtotal_invoice = computed(() =>
  newInvoice.value.item_pekerjaan.reduce(
    (total, item) =>
      total + (Number(item.qty) || 0) * (Number(item.amount) || 0),
    0,
  ),
);
const discountInvoice = computed(
  () => Number(newInvoice.value.discount_invoice) || 0,
);
const netSubtotal = computed(() =>
  Math.max(0, subtotal_invoice.value - discountInvoice.value),
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

const discountPercentInvoice = computed({
  get: () =>
    subtotal_invoice.value > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Number(
              ((discountInvoice.value / subtotal_invoice.value) * 100).toFixed(2),
            ),
          ),
        )
      : 0,
  set: (value: number) => {
    const percentage = Math.min(100, Math.max(0, Number(value) || 0));
    const amount = subtotal_invoice.value * (percentage / 100);
    newInvoice.value.discount_invoice =
      newInvoice.value.currency_inv === "IDR"
        ? Math.round(amount)
        : Math.round(amount * 100) / 100;
  },
});

const syncingInvoiceClient = ref(false);

function clearInvoicePic() {
  newInvoice.value.id_pic = "";
  newInvoice.value.pic = "";
  newInvoice.value.no_telp = "";
  newInvoice.value.email = "";
}

function applyInvoiceCompany(
  company: CompanyMasterRow,
  resetPic = false,
) {
  newInvoice.value.id_customer = company.id_customer || company.id || "";
  newInvoice.value.nama_customer = company.nama;
  newInvoice.value.alamat_customer = company.alamat || "";
  if (resetPic) clearInvoicePic();
}

function applyInvoicePic(pic: masterPicM) {
  newInvoice.value.id_pic = pic.id_master_pic || pic.id || "";
  newInvoice.value.pic = pic.pic;
  newInvoice.value.no_telp = pic.no_telp || "";
  newInvoice.value.email = pic.email || "";
}

watch(
  () => newInvoice.value.id_customer,
  (idCustomer) => {
    if (syncingInvoiceClient.value) return;
    if (!idCustomer) {
      newInvoice.value.nama_customer = "";
      newInvoice.value.alamat_customer = "";
      clearInvoicePic();
      return;
    }
    const company = invoiceCompanies.value.find(
      (item) =>
        item.id_customer === idCustomer || item.sourceIds.includes(idCustomer),
    );
    if (company) applyInvoiceCompany(company, true);
  },
);

watch(
  () => newInvoice.value.id_pic,
  (idPic) => {
    if (syncingInvoiceClient.value) return;
    if (!idPic) {
      clearInvoicePic();
      return;
    }
    const pic = invoiceMasterPics.value.find(
      (item) => (item.id_master_pic || item.id) === idPic,
    );
    if (pic) applyInvoicePic(pic);
  },
);

onMounted(async () => {
  restoreInvoiceFilters();
  data.showAllInvoice = true;
  const needsInvoiceData = !invoiceStore.hasCachedData();
  isLoading.value = needsInvoiceData;

  try {
    const initialRequests: Promise<unknown>[] = [];
    if (!customerStore.getDataCustomer.length) {
      initialRequests.push(customerStore.tarikDataCustomerAct());
    }
    if (!masterPicStore.getDataMasterPic.length) {
      initialRequests.push(masterPicStore.tarikDataMasterPicAct());
    }
    if (needsInvoiceData) {
      initialRequests.push(invoiceStore.tarikDataInvoiceAct());
    }
    initialRequests.push(loadSoaRecords());
    await Promise.all(initialRequests);
  } finally {
    isLoading.value = false;
  }

  if (!termconditionStore.getDataTermcondition.length) {
    void termconditionStore.tarikDataTermconditionAct();
  }

  const requestedRevisionId = Array.isArray(route.query.revisi)
    ? route.query.revisi[0]
    : route.query.revisi;
  if (requestedRevisionId) {
    const requestedInvoice = invoiceStore.getDataInvoice.find(
      (invoice) =>
        (invoice.id || invoice.id_invoice) === String(requestedRevisionId),
    );
    if (requestedInvoice) {
      openDialogEditInvoice(requestedInvoice);
      const nextQuery = { ...route.query };
      delete nextQuery.revisi;
      void router.replace({ path: route.path, query: nextQuery });
    } else {
      notificationStore.showError("Invoice yang akan direvisi tidak ditemukan");
    }
  }
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
  const defaultStatuses = ["Draft", "Dikirim", "Selesai"];
  const storedStatuses = invoiceStore.getDataInvoice
    .map((invoice) => invoice.status || "Draft")
    .filter(Boolean);

  return [...new Set([...defaultStatuses, ...storedStatuses])];
});

function invoiceOverviewIcon(status: string) {
  const normalizedStatus = normalizeFilterValue(status);
  if (!normalizedStatus) return "mdi-receipt-text-outline";
  if (normalizedStatus === "draft") return "mdi-file-edit-outline";
  if (["dikirim", "invoice"].includes(normalizedStatus)) {
    return "mdi-send-check-outline";
  }
  if (["selesai", "lunas"].includes(normalizedStatus)) {
    return "mdi-check-decagram-outline";
  }
  if (normalizedStatus === "cancel") return "mdi-file-cancel-outline";
  return "mdi-file-document-outline";
}

function invoiceOverviewTone(status: string) {
  const normalizedStatus = normalizeFilterValue(status);
  if (!normalizedStatus) return "all";
  if (normalizedStatus === "draft") return "draft";
  if (["dikirim", "invoice"].includes(normalizedStatus)) return "sent";
  if (["selesai", "lunas"].includes(normalizedStatus)) return "paid";
  if (normalizedStatus === "cancel") return "cancel";
  return "neutral";
}

const invoiceStatusOverview = computed(() => {
  const statusCounts = new Map<string, number>();
  invoiceStore.getDataInvoice.forEach((invoice) => {
    const status = String(invoice.status || "Draft").trim() || "Draft";
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
  });

  const workflowOrder = ["Draft", "Dikirim", "Selesai"];
  const statuses = [...new Set([...workflowOrder, ...statusCounts.keys()])]
    .filter((status) => workflowOrder.includes(status) || statusCounts.has(status))
    .sort((first, second) => {
      const firstIndex = workflowOrder.indexOf(first);
      const secondIndex = workflowOrder.indexOf(second);
      if (firstIndex !== -1 || secondIndex !== -1) {
        if (firstIndex === -1) return 1;
        if (secondIndex === -1) return -1;
        return firstIndex - secondIndex;
      }
      return first.localeCompare(second, "id-ID");
    });

  return [
    {
      status: "",
      label: "Semua Invoice",
      count: invoiceStore.getDataInvoice.length,
      icon: invoiceOverviewIcon(""),
      tone: invoiceOverviewTone(""),
    },
    ...statuses.map((status) => ({
      status,
      label: status,
      count: statusCounts.get(status) || 0,
      icon: invoiceOverviewIcon(status),
      tone: invoiceOverviewTone(status),
    })),
  ];
});

function applyInvoiceStatusShortcut(status: string) {
  data.filterStatus = status;
}

const availableInvoiceClients = computed(() => {
  const clients = invoiceStore.getDataInvoice
    .map((invoice) => invoice.nama_customer?.trim())
    .filter((client): client is string => Boolean(client));

  return [...new Set(clients)].sort((a, b) => a.localeCompare(b, "id-ID"));
});

function normalizeFilterValue(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("id-ID");
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

const hasActiveInvoiceFilters = computed(() =>
  display.xs.value
    ? Boolean(data.searchInvoice.trim() || data.filterStatus)
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
    if (data.filterStatus && invoiceStatus !== data.filterStatus) return false;
    if (display.xs.value) return true;
    if (!containsFilterValue(invoiceQuery, [invoice.no_inv, invoiceReference]))
      return false;
    if (
      selectedClient &&
      normalizeFilterValue(invoice.nama_customer) !== selectedClient
    )
      return false;
    if (
      !containsFilterValue(quotationQuery, [
        invoice.no_penawaran,
        invoice.id_penawaran,
      ])
    )
      return false;
    if (
      !containsFilterValue(subjectQuery, [invoice.perihal, ...itemDescriptions])
    )
      return false;
    if (data.filterDateFrom && invoiceDate < data.filterDateFrom) return false;
    if (data.filterDateTo && invoiceDate > data.filterDateTo) return false;
    if (
      amountQuery &&
      !String(invoiceAmount).replace(/\D/g, "").includes(amountQuery)
    )
      return false;

    return true;
  });
});

const invoiceTableTotals = computed(() => {
  const totals = new Map<invoiceCurrencyM, number>();

  invoiceTampilTersaring.value.forEach((invoice) => {
    const currency = normalizeInvoiceCurrency(invoice.currency_inv);
    totals.set(
      currency,
      (totals.get(currency) || 0) + (Number(invoice.grandtotal_invoice) || 0),
    );
  });

  const currencyOrder: invoiceCurrencyM[] = ["IDR", "USD", "SGD"];
  return currencyOrder
    .filter((currency) => totals.has(currency))
    .map((currency) => ({
      currency,
      amount: totals.get(currency) || 0,
    }));
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

function escapeInvoiceCsvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function exportInvoiceCsv() {
  if (!invoiceTampilTersaring.value.length) {
    return notificationStore.showInfo("Tidak ada data invoice untuk diekspor");
  }

  const headers = [
    "Tanggal",
    "No. Invoice",
    "Client",
    "PIC",
    "Vessel",
    "No. Quotation",
    "Subject",
    "Currency",
    "Total Amount",
    "Status",
  ];
  const rows = invoiceTampilTersaring.value.map((invoice) => [
    invoice.tanggal,
    invoiceReference(invoice),
    invoice.nama_customer,
    invoice.pic,
    invoice.vessel,
    invoice.no_penawaran,
    invoice.perihal,
    normalizeInvoiceCurrency(invoice.currency_inv),
    Number(invoice.grandtotal_invoice) || 0,
    invoice.status || "Draft",
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeInvoiceCsvCell).join(","))
    .join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const downloadUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = downloadUrl;
  downloadLink.download = `invoice-${moment().format("YYYY-MM-DD")}.csv`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  URL.revokeObjectURL(downloadUrl);
  notificationStore.showSuccess(
    `${invoiceTampilTersaring.value.length} invoice berhasil diekspor`,
  );
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
  data.editOriginalInvoiceNumber = "";
  data.editOriginalInvoiceInternalId = "";
  newInvoice.value = emptyInvoice();
  const assignedCompany = accessibleInvoiceCompanies.value[0];
  if (assignedInvoiceCompanyId.value && assignedCompany) {
    applyInvoiceCompany(assignedCompany, true);
  }
  data.dialogTambahInvoice = true;
}

async function loadInvoiceForEditor(item: invoiceM): Promise<invoiceM> {
  const rowInvoice =
    ((item as invoiceM & { raw?: invoiceM }).raw as invoiceM | undefined) ||
    item;
  const invoiceId = String(
    rowInvoice.id || rowInvoice.id_invoice || rowInvoice.no_inv || "",
  ).trim();
  if (!invoiceId) return rowInvoice;

  const rootSnapshot = await getDoc(doc(db, "invoice", invoiceId));
  const rootInvoice = rootSnapshot.exists()
    ? (rootSnapshot.data() as invoiceM)
    : null;
  const quotationId = String(
    rootInvoice?.id_penawaran || rowInvoice.id_penawaran || "",
  ).trim();
  let mirroredInvoice: invoiceM | null = null;

  if (quotationId && quotationId !== "-") {
    const mirroredSnapshot = await getDoc(
      doc(db, "penawaran", quotationId, "invoice", invoiceId),
    );
    if (mirroredSnapshot.exists()) {
      mirroredInvoice = mirroredSnapshot.data() as invoiceM;
    }
  }

  const itemSource = [
    rootInvoice?.item_pekerjaan,
    mirroredInvoice?.item_pekerjaan,
    rowInvoice.item_pekerjaan,
  ].find(hasInvoiceItems);

  return {
    ...rowInvoice,
    ...(mirroredInvoice || {}),
    ...(rootInvoice || {}),
    id: invoiceId,
    item_pekerjaan: normalizeInvoiceItems(itemSource),
  } as invoiceM;
}

async function openDialogEditInvoice(item: invoiceM) {
  let storedInvoice: invoiceM;
  try {
    storedInvoice = await loadInvoiceForEditor(item);
  } catch (error) {
    console.error("Gagal memuat detail invoice untuk diedit:", error);
    notificationStore.showError(
      "Detail dan item invoice gagal dimuat dari database",
    );
    return;
  }

  const company =
    invoiceCompanies.value.find(
      (candidate) =>
        candidate.id_customer === storedInvoice.id_customer ||
        candidate.sourceIds.includes(storedInvoice.id_customer),
    ) ||
    invoiceCompanies.value.find(
      (candidate) =>
        normalizeMasterCompanyName(candidate.nama) ===
        normalizeMasterCompanyName(storedInvoice.nama_customer),
    );

  const sourceInvoice = JSON.parse(JSON.stringify(storedInvoice)) as Record<
    string,
    unknown
  >;
  const invoice = {
    ...emptyInvoice(),
    ...sourceInvoice,
    // Data invoice lama bisa tidak memiliki array item atau menyimpan item
    // kosong. Jangan biarkan nilai itu menimpa satu baris default form.
    item_pekerjaan: normalizeInvoiceItems(sourceInvoice.item_pekerjaan),
  } as invoiceM;

  syncingInvoiceClient.value = true;
  newInvoice.value = invoice;
  if (company) {
    applyInvoiceCompany(company);
    const selectedPic =
      invoiceMasterPics.value.find(
        (pic) => (pic.id_master_pic || pic.id) === storedInvoice.id_pic,
      ) ||
      invoiceMasterPics.value.find(
        (pic) =>
          pic.id_perusahaan === company.id_customer &&
          pic.pic.trim().toLocaleLowerCase("id-ID") ===
            String(storedInvoice.pic || "").trim().toLocaleLowerCase("id-ID"),
      );
    if (selectedPic) applyInvoicePic(selectedPic);
  }
  if (!newInvoice.value.id_pic && invoice.pic) {
    newInvoice.value.id_pic =
      invoice.id_pic || `invoice-current-${invoice.id || "pic"}`;
  }
  data.invoiceAddEdit = "edit";
  data.editOriginalCustomerId = newInvoice.value.id_customer;
  data.editOriginalInvoiceNumber = storedInvoice.no_inv;
  data.editOriginalInvoiceInternalId =
    storedInvoice.id_invoice || storedInvoice.id || "";
  data.dialogTambahInvoice = true;
  void nextTick(() => {
    syncingInvoiceClient.value = false;
  });
}

function tambahBarisInvoice() {
  if (!Array.isArray(newInvoice.value.item_pekerjaan)) {
    newInvoice.value.item_pekerjaan = [];
  }
  newInvoice.value.item_pekerjaan.push(emptyInvoiceItem());
}

function setInvoiceItemCategory(
  item: { kategori_item: string },
  category: string,
  checked: boolean,
) {
  if (checked) item.kategori_item = category;
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
  if (!(newInvoice.value.pic || "").trim()) {
    return notificationStore.showError("PIC belum dipilih");
  }
  if (!(newInvoice.value.vessel || "").trim()) {
    return notificationStore.showError("Vessel wajib diisi");
  }
  if (!(newInvoice.value.location || "").trim()) {
    return notificationStore.showError("Location wajib diisi");
  }
  if (
    !newInvoice.value.item_pekerjaan.length ||
    newInvoice.value.item_pekerjaan.some(
      (item) =>
        !item.nama ||
        !item.kategori_item ||
        !item.uom ||
        Number(item.qty) <= 0 ||
        Number(item.amount) <= 0,
    )
  ) {
    return notificationStore.showError(
      "Setiap item wajib memiliki description, category, Qty, UOM, dan harga",
    );
  }
  if (
    newInvoice.value.down_payment &&
    (!Number.isFinite(Number(newInvoice.value.dp_persen)) ||
      Number(newInvoice.value.dp_persen) <= 0 ||
      Number(newInvoice.value.dp_persen) > 100)
  ) {
    return notificationStore.showError(
      "Persentase termin harus antara 1 dan 100",
    );
  }
  if (
    Number(newInvoice.value.discount_invoice) < 0 ||
    Number(newInvoice.value.discount_invoice) > subtotal_invoice.value
  ) {
    return notificationStore.showError(
      "Discount tidak boleh negatif atau melebihi subtotal invoice",
    );
  }

  newInvoice.value.item_pekerjaan.forEach((item) => {
    item.subtotal_item = Number(item.qty) * Number(item.amount);
  });

  newInvoice.value.subtotal_invoice = subtotal_invoice.value;
  newInvoice.value.ppn = ppnInvoice.value;
  newInvoice.value.grandtotal_invoice = grandtotal_invoice.value;
  if (data.invoiceAddEdit === "edit") {
    // Nomor invoice adalah identitas dokumen dan tidak boleh berubah melalui
    // form revisi, termasuk bila value DOM dimanipulasi dari browser.
    newInvoice.value.no_inv = data.editOriginalInvoiceNumber;
    newInvoice.value.id_invoice = data.editOriginalInvoiceInternalId;
  }
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

    const linkedToQuotation = Boolean(
      newInvoice.value.id_penawaran && newInvoice.value.id_penawaran !== "-",
    );
    if (linkedToQuotation) {
      const confirmed = await confirmationDialog.value?.show(
        "Simpan Revisi Tersinkron",
        "Perubahan data komersial akan diterapkan ke quotation dan seluruh invoice termin terkait. Status pembayaran, bukti bayar, SPK, dokumen, dan pengeluaran tetap dipertahankan. Lanjutkan?",
        { confirmText: "Simpan & Sinkronkan", variant: "default" },
      );
      if (!confirmed) return;

      const revised = await invoiceStore.reviseLinkedTransactionAct(
        newInvoice.value.id,
        newInvoice.value,
      );
      if (!revised) return;
    } else {
      const updated = await invoiceStore.updateInvoiceAct(
        newInvoice.value.id,
        newInvoice.value,
      );
      if (!updated) return;
    }

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
  if (isRefreshing.value) return;

  isRefreshing.value = true;
  try {
    sessionStorage.removeItem("invoice");
    await Promise.all([invoiceStore.tarikDataInvoiceAct(), loadSoaRecords()]);
    notificationStore.showSuccess("Data berhasil diperbarui");
  } catch (error) {
    console.error("Gagal memperbarui data invoice:", error);
    notificationStore.showError("Data invoice gagal diperbarui");
  } finally {
    isRefreshing.value = false;
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.invoice-page-topbar {
  display: flex;
  width: 100%;
  margin-bottom: 12px;
  padding-top: 2px;
  align-items: center;
  gap: 14px;
}

.invoice-back-btn {
  flex: 0 0 auto;
}

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

.invoice-overview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 150px));
  gap: 7px;
  margin-bottom: 10px;
  justify-content: start;
}

.invoice-overview-card {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 52px;
  padding: 7px 9px;
  align-items: center;
  gap: 8px;
  color: #4a5969;
  font: inherit;
  text-align: left;
  background: #ffffff;
  border: 1px solid #dfe4e9;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.025);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.invoice-overview-card:hover {
  border-color: #b9c7d4;
  box-shadow: 0 5px 14px rgba(15, 23, 42, 0.055);
  transform: translateY(-1px);
}

.invoice-overview-card--active {
  border-color: #8cabc7;
  box-shadow: 0 0 0 2px rgba(49, 95, 140, 0.08);
}

.invoice-overview-icon {
  display: grid;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  place-items: center;
  color: #4b667f;
  background: #eef3f7;
  border-radius: 5px;
}

.invoice-overview-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.invoice-overview-copy small {
  overflow: hidden;
  color: #7a8592;
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 0.035em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.invoice-overview-copy strong {
  margin-top: 1px;
  color: #263647;
  font-size: 15px;
  font-weight: 750;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.invoice-overview-active-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 5px;
  height: 5px;
  background: #3f78a8;
  border-radius: 50%;
}

.invoice-overview-card--draft .invoice-overview-icon {
  color: #2f6796;
  background: #eaf2f9;
}

.invoice-overview-card--sent .invoice-overview-icon {
  color: #9b671a;
  background: #fff5df;
}

.invoice-overview-card--paid .invoice-overview-icon {
  color: #2d7857;
  background: #e8f5ee;
}

.invoice-overview-card--cancel .invoice-overview-icon {
  color: #ae4c59;
  background: #fceff1;
}

.invoice-overview-card--neutral .invoice-overview-icon {
  color: #667382;
  background: #f0f2f4;
}

.invoice-list-card {
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #dfe3e8;
  border-radius: 8px !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.025) !important;
}

.soa-dialog-card,
.soa-preview-dialog-card {
  overflow: hidden;
  border: 1px solid #dfe3e8 !important;
  border-radius: 10px !important;
  background: #fff !important;
}

.soa-dialog-header,
.soa-preview-dialog-header {
  display: flex;
  min-height: 62px;
  padding: 13px 18px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #e9edf1;
}

.soa-dialog-header h2,
.soa-preview-dialog-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 17px;
  font-weight: 750;
  line-height: 1.3;
}

.soa-dialog-header p,
.soa-preview-dialog-header p {
  margin: 3px 0 0;
  color: #7c8795;
  font-size: 10px;
}

.soa-dialog-body {
  display: flex;
  padding: 14px 18px !important;
  flex-direction: column;
  gap: 12px;
}

.soa-form-fields {
  display: grid;
  grid-template-columns: minmax(220px, 1.35fr) minmax(155px, 0.8fr) minmax(
      190px,
      1fr
    );
  align-items: start;
  gap: 10px;
}

.soa-v-select :deep(.v-field) {
  border-radius: 6px;
}

.soa-v-select :deep(.v-field__input),
.soa-v-select :deep(.v-label) {
  font-size: 11px;
}

.soa-invoice-picker-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 1px;
}

.soa-invoice-picker-heading h3 {
  margin: 0;
  color: #273548;
  font-size: 12px;
  font-weight: 750;
}

.soa-invoice-picker-heading p {
  margin: 2px 0 0;
  color: #818b98;
  font-size: 9px;
}

.soa-picker-total {
  color: #253b55;
  font-size: 11px;
  white-space: nowrap;
}

.soa-invoice-table-wrap {
  max-height: min(44vh, 370px);
  overflow: auto;
  border: 1px solid #e1e6eb;
  border-radius: 7px;
}

.soa-invoice-table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
  table-layout: fixed;
}

.soa-invoice-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  height: 33px;
  padding: 0 8px;
  background: #f7f8fa;
  color: #7a8797;
  font-size: 8px;
  font-weight: 750;
  letter-spacing: 0.04em;
  text-align: left;
  text-transform: uppercase;
}

.soa-invoice-table td {
  height: 42px;
  padding: 5px 8px;
  border-top: 1px solid #edf0f3;
  color: #526174;
  font-size: 9px;
}

.soa-invoice-table tbody tr:hover {
  background: #fafbfd;
}

.soa-invoice-table .soa-invoice-check-cell {
  width: 42px;
  padding-right: 2px;
  padding-left: 5px;
  text-align: center;
}

.soa-invoice-reference {
  color: #344b65 !important;
  font-weight: 700;
  white-space: nowrap;
  min-width: fit-content;
}

.soa-invoice-id-cell {
  width: 130px;
  white-space: nowrap;
}

.soa-invoice-date-cell {
  width: 90px;
  white-space: nowrap;
}

.soa-invoice-perihal {
  overflow-wrap: anywhere;
  vertical-align: top;
  white-space: normal;
}

.soa-invoice-amount-cell {
  width: 145px;
  text-align: right !important;
  white-space: nowrap;
}

.soa-invoice-amount-cell small {
  display: block;
  margin-top: 1px;
  color: #99a2ad;
  font-size: 8px;
}

.soa-invoice-empty-row {
  height: 82px !important;
  color: #8792a0 !important;
  text-align: center;
}

.soa-invoice-empty-row :deep(.v-icon) {
  margin-right: 5px;
  vertical-align: middle;
}

.soa-invoice-empty,
.soa-list-empty {
  display: flex;
  min-height: 94px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #8893a0;
  font-size: 10px;
}

.soa-invoice-empty--prompt {
  border: 1px dashed #d8dee6;
  border-radius: 7px;
  background: #fafbfd;
}

.soa-company-summary {
  display: flex;
  min-height: 30px;
  align-items: center;
  gap: 6px;
  color: #758294;
  font-size: 9px;
}

.soa-company-summary strong {
  color: #43556a;
  font-weight: 700;
}

.soa-company-summary small {
  margin-left: auto;
  color: #929ba7;
  font-size: 8px;
}

.soa-dialog-footer {
  display: flex;
  min-height: 54px;
  padding: 9px 18px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-top: 1px solid #e9edf1;
  background: #fcfcfd;
}

.soa-dialog-footer > span {
  color: #7c8795;
  font-size: 9px;
}

.soa-dialog-footer > div {
  display: flex;
  flex: 0 0 auto;
  gap: 7px;
}

.soa-preview-dialog-header {
  min-height: 56px;
}

.soa-preview-dialog-body {
  padding: 16px !important;
  background: #f4f6f8;
}

.soa-list-card {
  overflow: hidden;
  margin-top: 14px;
  border: 1px solid #dfe3e8;
  border-radius: 8px !important;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.025) !important;
}

.soa-list-header {
  display: flex;
  min-height: 66px;
  padding: 12px 16px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.soa-list-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;
}

.soa-list-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.soa-list-icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 8px;
  background: #eff3f7;
  color: #526579;
}

.soa-list-title h2 {
  margin: 0;
  color: #29384b;
  font-size: 13px;
  font-weight: 750;
}

.soa-list-title p {
  margin: 3px 0 0;
  color: #8a94a1;
  font-size: 10px;
}

.soa-list-customer {
  color: #2c3c50;
  font-size: 11px;
}

.soa-list-amount {
  color: #34465a;
  white-space: nowrap;
}

.soa-list-signer {
  color: #697688;
  font-size: 10px;
}

.soa-list-table :deep(.v-table__wrapper) {
  border-top: 1px solid #edf0f3;
}

.soa-list-table :deep(th) {
  height: 37px !important;
  color: #7d8998 !important;
  font-size: 9px !important;
  font-weight: 700 !important;
  letter-spacing: 0.045em;
  text-transform: uppercase;
}

.soa-list-table :deep(td) {
  height: 48px !important;
  color: #536174;
  font-size: 10px;
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
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.invoice-list-search:focus-within {
  border-color: #7da5cc;
  box-shadow: 0 0 0 2px rgba(49, 95, 140, 0.08);
}

.invoice-list-search-field {
  min-width: 0;
  flex: 1 1 auto;
}
.invoice-list-search :deep(.form-group),
.invoice-list-search :deep(.input-wrapper) {
  height: 32px;
}
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

.invoice-list-tools {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
}
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
.invoice-page-refresh-btn {
  height: 34px !important;
  padding-inline: 12px !important;
  flex: 0 0 auto;
  color: #526171 !important;
  font-size: 10.5px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  border-color: #d6dbe1 !important;
  border-radius: 5px !important;
}

.invoice-export-btn {
  height: 34px !important;
  padding-inline: 11px !important;
  flex: 0 0 auto;
  color: #2f6b55 !important;
  font-size: 10.5px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  background: #fbfdfc !important;
  border-color: #cfe0d8 !important;
  border-radius: 5px !important;
}

.invoice-page-create-btn {
  height: 34px !important;
  padding-inline: 12px !important;
  flex: 0 0 auto;
  color: #15579e !important;
  font-size: 10.5px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  border-color: #d6dbe1 !important;
  border-radius: 5px !important;
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
  width: fit-content;
  min-width: 100px;
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
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.invoice-filter-field select {
  padding-right: 26px;
  appearance: none;
  cursor: pointer;
}

.invoice-filter-select {
  position: relative;
}

.invoice-filter-select-icon {
  position: absolute;
  top: 50%;
  right: 8px;
  color: #7f8995;
  pointer-events: none;
  transform: translateY(-50%);
}

.invoice-filter-field input::placeholder {
  color: #a3abb4;
}
.invoice-filter-field input:focus,
.invoice-filter-field select:focus {
  border-color: #7da5cc;
  box-shadow: 0 0 0 2px rgba(49, 95, 140, 0.08);
}

.invoice-list-table {
  color: #344050;
  font-size: 11px;
}
.invoice-list-table :deep(table) {
  min-width: 1280px;
}
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
.invoice-list-table :deep(.v-data-table-header__content) {
  gap: 3px;
}
.invoice-list-table :deep(.v-data-table__td) {
  height: 56px !important;
  padding: 8px 12px !important;
  line-height: 1.35;
  vertical-align: middle;
  border-bottom-color: #edf0f2 !important;
}
.invoice-list-table :deep(tbody tr) {
  transition: background-color 0.12s ease;
}
.invoice-list-table :deep(tbody tr:hover > td) {
  background: #fafbfd !important;
}

.invoice-table-total-wrapper {
  display: flex;
  padding: 10px 14px;
  justify-content: flex-end;
  background: #fbfcfd;
  border-top: 1px solid #e5e9ed;
}

.invoice-table-total-card {
  width: min(100%, 280px);
  padding: 9px 11px;
  background: #ffffff;
  border: 1px solid #dce2e8;
  border-radius: 6px;
  box-shadow: 0 2px 7px rgba(15, 23, 42, 0.035);
}

.invoice-table-total-heading {
  display: flex;
  padding-bottom: 6px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #edf0f2;
}

.invoice-table-total-heading span {
  color: #637080;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.045em;
  text-transform: uppercase;
}

.invoice-table-total-heading small {
  color: #959faa;
  font-size: 8.5px;
  white-space: nowrap;
}

.invoice-table-total-values {
  display: flex;
  padding-top: 6px;
  flex-direction: column;
  gap: 4px;
}

.invoice-table-total-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  font-variant-numeric: tabular-nums;
}

.invoice-table-total-row > span {
  color: #87929e;
  font-size: 9px;
  font-weight: 650;
}

.invoice-table-total-row strong,
.invoice-table-total-empty {
  color: #25394d;
  font-size: 11.5px;
  font-weight: 750;
  text-align: right;
  white-space: nowrap;
}

.invoice-table-total-empty {
  display: block;
  padding-top: 6px;
}

.invoice-row-index {
  color: #9aa3ae;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}
.invoice-date-cell {
  color: #556170;
  font-size: 10.5px;
  white-space: nowrap;
}
.invoice-reference {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  min-width: 0;
  gap: 4px;
  color: #285f91;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.035em;
  text-decoration: none;
  white-space: normal;
  overflow-wrap: anywhere;
}
.invoice-list-table :deep(.v-data-table__td:nth-child(3)) {
  padding-right: 4px !important;
}
.invoice-reference:hover,
.invoice-quotation-reference:hover {
  color: #174a79;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.invoice-client-cell {
  min-width: 0;
  max-width: 100%;
}
.invoice-client-name {
  color: #273444;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
  white-space: normal;
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
.invoice-empty-value {
  color: #9ba4ae;
}
.invoice-table-status {
  height: 22px !important;
  padding-inline: 8px !important;
  font-size: 9px !important;
  font-weight: 700 !important;
  letter-spacing: 0.015em !important;
  border-radius: 4px !important;
}
.invoice-status-cell {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.invoice-row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
}
.invoice-action-trigger {
  width: 28px !important;
  height: 28px !important;
  border-radius: 4px !important;
}
.invoice-action-trigger:hover {
  color: #26384b !important;
  background: #eef1f4 !important;
}
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
.invoice-action-menu :deep(.v-list-item-title) {
  font-size: 10.5px !important;
  font-weight: 500;
}
.invoice-action-menu :deep(.v-list-item__prepend > .v-icon) {
  margin-inline-end: 9px !important;
  font-size: 16px !important;
}
.invoice-menu-danger {
  color: #b44949 !important;
}
.invoice-empty-state {
  padding: 44px 16px;
  color: #8a949f;
  font-size: 11px;
  text-align: center;
}
.invoice-empty-state .v-icon {
  display: block;
  margin: 0 auto 8px;
}

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
.invoice-dialog-heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 11px;
}
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
.invoice-dialog-heading h2 {
  margin: 0;
  color: #202833;
  font-size: 15px;
  font-weight: 700;
}
.invoice-dialog-heading p {
  margin: 2px 0 0;
  color: #7d8792;
  font-size: 10px;
}
.invoice-dialog-header-actions {
  display: flex;
  align-items: center;
  gap: 9px;
}
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
.invoice-dialog-status > span {
  width: 6px;
  height: 6px;
  background: #3a83bd;
  border-radius: 50%;
}
.invoice-dialog-body {
  display: flex;
  padding: 14px !important;
  flex-direction: column;
  gap: 12px;
  background: #f5f6f8;
}
.invoice-sync-notice {
  font-size: 11px;
  line-height: 1.5;
}
.invoice-sync-notice strong {
  display: block;
  margin-bottom: 2px;
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
.invoice-section-header > div {
  display: flex;
  align-items: center;
  gap: 8px;
}
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
.invoice-section-header h3 {
  margin: 0;
  color: #2c3743;
  font-size: 12px;
  font-weight: 700;
  line-height: 21px;
}
.invoice-section-header p {
  margin: 3px 0 0;
  color: #8a949f;
  font-size: 9px;
  text-align: right;
}
.invoice-document-fields {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(220px, 0.65fr);
  gap: 10px;
  margin-bottom: 10px;
}
.invoice-client-picker {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.invoice-client-master-actions {
  display: flex;
  margin: 3px 0 10px;
  justify-content: flex-end;
}
.invoice-master-client-btn {
  min-height: 30px !important;
  padding-inline: 8px !important;
  font-size: 10px !important;
  letter-spacing: 0 !important;
}
.invoice-po-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.invoice-client-details {
  display: grid;
  grid-template-columns: minmax(220px, 1.7fr) repeat(2, minmax(140px, 1fr));
  gap: 1px;
  margin: 0;
  overflow: hidden;
  background: #e2e6ea;
  border: 1px solid #e2e6ea;
  border-radius: 5px;
}
.invoice-client-details > div {
  min-width: 0;
  padding: 8px 9px;
  background: #f8f9fa;
}
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
.invoice-operation-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}
.invoice-currency-section {
  padding: 13px 18px;
  background: #ffffff;
  border: 1px solid #dfe3e8;
  border-radius: 7px;
}
.invoice-currency-heading {
  display: flex;
  margin-bottom: 13px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.invoice-currency-heading > div:first-child {
  min-width: 0;
}
.invoice-currency-heading h3 {
  margin: 0;
  color: #27313d;
  font-size: 12px;
  font-weight: 700;
}
.invoice-currency-heading p {
  margin: 2px 0 0;
  color: #8a939f;
  font-size: 10px;
}
.invoice-currency-field {
  flex: 0 0 160px;
  width: 160px;
}

.invoice-items-section {
  padding: 0 0 14px;
  overflow: hidden;
}
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
.invoice-line-item-header {
  display: flex;
  margin-bottom: 9px;
  align-items: center;
  justify-content: space-between;
}
.invoice-line-item-header > span {
  color: #74808c;
  font-size: 8px;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.invoice-item-description {
  margin-bottom: 9px;
}
.invoice-item-category {
  display: flex;
  margin: 10px 0 12px;
  align-items: center;
  gap: 18px;
}
.invoice-item-category > span {
  color: #495057;
  font-size: 11px;
  font-weight: 600;
}
.invoice-item-category > div {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
}
.invoice-item-fields {
  display: grid;
  grid-template-columns:
    minmax(66px, 0.55fr) minmax(90px, 0.75fr)
    minmax(155px, 1.25fr) minmax(165px, 1.3fr);
  gap: 9px;
}
.invoice-add-row-secondary {
  display: flex;
  width: calc(100% - 28px);
  min-height: 34px;
  margin: 12px 14px 0;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #4f6377;
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  background: #ffffff;
  border: 1px dashed #b8c2cc;
  border-radius: 5px;
  cursor: pointer;
}
.invoice-add-row-secondary:hover {
  color: #245b8f;
  background: #f7fafc;
  border-color: #7f9db9;
}
.invoice-add-row-secondary:focus-visible {
  outline: 2px solid rgba(24, 103, 192, 0.3);
  outline-offset: 2px;
}
.invoice-sign-field {
  display: block;
  max-width: 360px;
  margin: 0;
}
.invoice-discount-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.invoice-term-table-wrap {
  max-height: 230px;
  overflow: auto;
  border: 1px solid #dfe4e8;
  border-radius: 5px;
}
.invoice-term-table {
  width: 100%;
  font-size: 9px;
  border-collapse: collapse;
}
.invoice-term-table td {
  border-bottom: 1px solid #e8ecef;
}
.invoice-term-table tr:last-child td {
  border-bottom: 0;
}
.invoice-term-number {
  width: 34px;
  padding: 6px;
  color: #87919c;
  text-align: center;
  vertical-align: top;
}
.invoice-term-check {
  width: 38px;
  vertical-align: middle;
}
.invoice-term-name {
  padding: 6px 8px;
  color: #53606e;
  line-height: 1.45;
}
.invoice-term-checkbox {
  margin: -6px 0;
  padding: 0;
  transform: scale(0.72);
  transform-origin: center;
}
.invoice-summary-section {
  background: #fbfcfd;
}

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
.invoice-dialog-footer p {
  margin: 0;
  color: #7c8793;
  font-size: 9px;
}
.invoice-dialog-footer > div {
  display: flex;
  gap: 8px;
}
.invoice-cancel-btn,
.invoice-save-btn {
  min-width: 104px;
  height: 34px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  border-radius: 4px !important;
}
.invoice-save-btn {
  min-width: 148px;
}
.invoice-dialog-card :deep(.input-field),
.invoice-dialog-card :deep(.date-input-wrapper) {
  border-radius: 4px;
}

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

.po-selected-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.po-selected-file {
  display: grid;
  grid-template-columns: minmax(165px, 0.8fr) minmax(0, 1.2fr);
  min-width: 0;
  padding: 10px;
  align-items: center;
  gap: 14px;
  border: 1px solid #dbe5f1;
  border-radius: 10px;
  background: #ffffff;
}

.po-preview-frame {
  position: relative;
  display: grid;
  min-width: 0;
  height: 150px;
  overflow: hidden;
  place-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background:
    linear-gradient(45deg, #f8fafc 25%, transparent 25%) 0 0 / 14px 14px,
    linear-gradient(-45deg, #f8fafc 25%, transparent 25%) 0 7px / 14px 14px,
    #ffffff;
}

.po-preview-frame img,
.po-preview-frame iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

.po-preview-frame img {
  object-fit: contain;
}

.po-preview-frame iframe {
  pointer-events: none;
  background: #ffffff;
}

.po-preview-frame--document {
  color: #315f8d;
  background: #f8fafc;
}

.po-preview-placeholder {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 6px;
}

.po-preview-placeholder span {
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.po-preview-badge {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 3px 6px;
  color: #334155;
  font-size: 8px;
  font-weight: 700;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.po-selected-details {
  display: flex;
  min-width: 0;
  padding: 5px 4px 4px 0;
  justify-content: center;
  flex-direction: column;
}

.po-ready-label {
  display: inline-flex;
  width: fit-content;
  margin-bottom: 7px;
  padding: 3px 7px;
  align-items: center;
  gap: 4px;
  color: #15803d;
  font-size: 9px;
  font-weight: 700;
  border-radius: 999px;
  background: #dcfce7;
}

.po-selected-name {
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: #1e293b;
  font-size: 12px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.po-selected-meta {
  display: flex;
  margin-top: 3px;
  align-items: center;
  gap: 5px;
  color: #64748b;
  font-size: 10px;
}

.po-selected-details > small {
  max-width: 280px;
  margin-top: 7px;
  color: #64748b;
  font-size: 9px;
  line-height: 1.4;
}

.po-file-actions {
  display: flex;
  margin-top: 11px;
  align-items: center;
  gap: 7px;
}

.po-file-action {
  display: inline-flex;
  margin: 0;
  padding: 5px 8px;
  align-items: center;
  gap: 4px;
  color: #315f8d;
  font: inherit;
  font-size: 10px;
  font-weight: 700;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
}

.po-file-action:hover:not(:disabled) {
  background: #eff6ff;
}

.po-file-action:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.po-file-action--remove {
  color: #b91c1c;
}

.po-file-action--remove:hover:not(:disabled) {
  border-color: #fecaca;
  background: #fef2f2;
}

.service-report-dialog {
  height: min(94vh, 960px);
  overflow: hidden;
  border: 1px solid #dfe5ec !important;
  border-radius: 14px !important;
  background: #f7f9fc !important;
}

.service-report-dialog-header {
  display: flex;
  min-height: 68px;
  padding: 12px 18px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e3e8ef;
  background: #fff;
}

.service-report-dialog-heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 11px;
}

.service-report-dialog-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border-radius: 9px;
  background: #eaf1fb;
  color: #214f82;
}

.service-report-dialog-heading h2 {
  margin: 0;
  color: #18283a;
  font-size: 16px;
  font-weight: 780;
}

.service-report-dialog-heading p {
  margin: 3px 0 0;
  overflow: hidden;
  color: #7b8797;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-report-dialog-content {
  display: grid;
  min-height: 0;
  flex: 1 1 auto;
  grid-template-columns: minmax(440px, 0.82fr) minmax(620px, 1.18fr);
  overflow: hidden;
}

.service-report-editor {
  min-height: 0;
  padding: 14px;
  overflow-y: auto;
  border-right: 1px solid #e1e7ee;
  background: #f7f9fc;
}

.service-report-form-section {
  margin-bottom: 12px;
  padding: 14px;
  border: 1px solid #e1e7ee;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.025);
}

.service-report-form-title {
  display: flex;
  margin-bottom: 13px;
  align-items: center;
  gap: 9px;
}

.service-report-form-title > span {
  display: grid;
  width: 29px;
  height: 29px;
  flex: 0 0 29px;
  place-items: center;
  border-radius: 7px;
  background: #eef3f8;
  color: #315878;
}

.service-report-form-title > div {
  min-width: 0;
  flex: 1;
}

.service-report-form-title h3 {
  margin: 0;
  color: #27374a;
  font-size: 12px;
  font-weight: 750;
}

.service-report-form-title p {
  margin: 2px 0 0;
  color: #8792a1;
  font-size: 9px;
}

.service-report-form-title--action {
  align-items: flex-start;
}

.service-report-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.service-report-field-full {
  grid-column: 1 / -1;
}

.service-report-field-grid :deep(.v-field),
.service-report-section-card :deep(.v-field) {
  border-radius: 7px;
  font-size: 11px;
}

.service-report-field-grid :deep(.v-label),
.service-report-section-card :deep(.v-label) {
  font-size: 10px;
}

.service-report-section-list {
  display: grid;
  gap: 10px;
}

.service-report-section-card {
  padding: 11px;
  border: 1px solid #e1e7ed;
  border-radius: 8px;
  background: #fbfcfe;
}

.service-report-section-head {
  display: flex;
  margin-bottom: 10px;
  align-items: center;
  gap: 7px;
}

.service-report-section-head > span {
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

.service-report-section-head strong {
  flex: 1;
  color: #536275;
  font-size: 10px;
}

.service-report-section-fields {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 8px;
}

.service-report-items-label {
  display: flex;
  margin: 11px 0 6px;
  align-items: center;
  justify-content: space-between;
  color: #536275;
  font-size: 9px;
  font-weight: 700;
}

.service-report-items-label small {
  color: #9aa3af;
  font-size: 8px;
  font-weight: 500;
}

.service-report-items {
  display: grid;
  gap: 6px;
}

.service-report-item-row {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 26px;
  align-items: start;
  gap: 4px;
}

.service-report-item-row > span {
  padding-top: 9px;
  color: #7c8795;
  font-size: 10px;
  text-align: center;
}

.service-report-add-item {
  margin: 5px 0 -4px 18px;
  font-size: 9px !important;
}

.service-report-upload {
  display: flex;
  min-height: 92px;
  padding: 12px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 3px;
  border: 1px dashed #aebdce;
  border-radius: 8px;
  background: #f8fbff;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.service-report-upload:hover {
  border-color: #4d78a4;
  background: #f2f7fd;
}

.service-report-upload--busy {
  cursor: wait;
  opacity: 0.7;
}

.service-report-upload input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.service-report-upload strong {
  color: #41566e;
  font-size: 10px;
}

.service-report-upload small {
  color: #8b96a5;
  font-size: 8px;
}

.service-report-image-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.service-report-image-list figure {
  position: relative;
  aspect-ratio: 4 / 3;
  margin: 0;
  overflow: hidden;
  border: 1px solid #dfe5ec;
  border-radius: 7px;
  background: #eef1f5;
}

.service-report-image-list img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.service-report-image-list figcaption {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 14px 5px 4px;
  background: linear-gradient(transparent, rgba(15, 23, 42, 0.8));
  color: #fff;
  font-size: 7px;
}

.service-report-image-list figcaption span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-report-image-list .v-btn {
  position: absolute;
  top: 5px;
  right: 5px;
}

.service-report-preview-pane {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: #e9edf2;
}

.service-report-preview-toolbar {
  display: flex;
  min-height: 43px;
  padding: 8px 14px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #d9e0e8;
  background: rgba(255, 255, 255, 0.88);
}

.service-report-preview-toolbar > div {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #526174;
  font-size: 10px;
}

.service-report-preview-scroll {
  min-height: 0;
  padding: 18px;
  flex: 1 1 auto;
  overflow: auto;
}

.service-report-dialog-footer {
  display: flex;
  min-height: 62px;
  padding: 10px 18px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid #e1e7ee;
  background: #fff;
}

.service-report-dialog-footer > span {
  color: #8390a0;
  font-size: 9px;
}

.service-report-dialog-footer > div {
  display: flex;
  gap: 8px;
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

  .service-report-dialog {
    height: 100%;
    border: 0 !important;
    border-radius: 0 !important;
  }

  .service-report-dialog-content {
    grid-template-columns: minmax(390px, 0.9fr) minmax(500px, 1.1fr);
  }

  .invoice-dialog-body {
    padding: 14px !important;
  }

  .invoice-item-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .invoice-document-fields,
  .invoice-operation-fields {
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
  .service-report-dialog-content {
    display: block;
    overflow-y: auto;
  }

  .service-report-editor {
    overflow: visible;
    border-right: 0;
  }

  .service-report-preview-pane {
    min-height: 680px;
    border-top: 1px solid #d9e0e8;
  }

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

  .service-report-dialog-header {
    min-height: 61px;
    padding: 10px 12px;
  }

  .service-report-dialog-heading p {
    display: none;
  }

  .service-report-editor {
    padding: 9px;
  }

  .service-report-form-section {
    padding: 11px;
  }

  .service-report-field-grid,
  .service-report-section-fields {
    grid-template-columns: 1fr;
  }

  .service-report-field-full {
    grid-column: auto;
  }

  .service-report-form-title--action {
    flex-wrap: wrap;
  }

  .service-report-form-title--action .v-btn {
    width: 100%;
    margin-top: 3px;
  }

  .service-report-dialog-footer {
    padding: 9px 10px;
  }

  .service-report-dialog-footer > span {
    display: none;
  }

  .service-report-dialog-footer > div {
    display: grid;
    width: 100%;
    grid-template-columns: 0.8fr 1.4fr;
  }

  .invoice-page-topbar {
    margin-bottom: 12px;
    gap: 8px;
  }

  .invoice-overview {
    display: flex;
    margin-right: -8px;
    padding-right: 8px;
    padding-bottom: 3px;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
  }

  .invoice-overview::-webkit-scrollbar {
    display: none;
  }

  .invoice-overview-card {
    flex: 0 0 132px;
    min-height: 52px;
    scroll-snap-align: start;
  }

  .invoice-page-soa-btn {
    min-width: 0;
    color: red;
    padding: 0 8px !important;
    font-size: 10px !important;
  }

  .invoice-page-refresh-btn {
    min-width: 0;
    padding: 0 8px !important;
    font-size: 10px !important;
  }

  .invoice-export-btn {
    min-width: 0;
    padding: 0 8px !important;
    font-size: 10px !important;
  }

  .invoice-page-heading {
    justify-content: flex-start;
    text-align: left;
  }

  .invoice-page-heading h1 {
    font-size: 18px;
  }

  .invoice-filter-heading p {
    display: none;
  }

  .invoice-filter-grid {
    grid-template-columns: 1fr;
  }

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
  .invoice-document-fields,
  .invoice-po-fields,
  .invoice-client-details,
  .invoice-operation-fields,
  .invoice-item-fields,
  .invoice-discount-fields {
    grid-template-columns: 1fr;
  }

  .invoice-client-address {
    grid-column: auto;
  }

  .invoice-client-master-actions {
    margin-top: 4px;
    justify-content: stretch;
  }

  .invoice-master-client-btn {
    width: 100%;
  }

  .invoice-currency-section {
    padding: 13px 14px;
  }

  .invoice-currency-heading {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }

  .invoice-currency-field {
    width: 100%;
    flex-basis: auto;
  }

  .po-upload-row {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }

  .po-upload-box {
    width: 100%;
  }

  .po-selected-file {
    grid-template-columns: 118px minmax(0, 1fr);
    gap: 11px;
  }

  .po-preview-frame {
    height: 136px;
  }

  .invoice-items-header {
    padding: 13px 14px;
  }

  .invoice-line-item {
    margin: 10px 10px 0;
    padding: 12px;
  }

  .invoice-item-category {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .invoice-add-row-secondary {
    width: calc(100% - 20px);
    margin: 10px;
  }

  .invoice-sign-field {
    max-width: none;
    margin: 0;
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

  .soa-form-fields {
    grid-template-columns: 1fr;
    gap: 7px;
  }

  .soa-dialog-header,
  .soa-dialog-body,
  .soa-dialog-footer {
    padding-right: 14px !important;
    padding-left: 14px !important;
  }

  .soa-dialog-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .soa-dialog-footer > span {
    display: none;
  }

  .soa-dialog-footer > div {
    display: grid;
    grid-template-columns: 1fr 1.3fr;
  }

  .soa-invoice-table-wrap {
    max-height: 48vh;
  }

  .soa-company-summary {
    flex-wrap: wrap;
  }

  .soa-list-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .soa-list-header-actions {
    width: 100%;
    margin-left: 0;
    justify-content: flex-end;
  }
}
</style>
