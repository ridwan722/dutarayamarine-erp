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

    <!-- ========================================================= -->
    <!-- INVOICE PAPER - TIDAK DIUBAH -->
    <!-- ========================================================= -->

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
                  <!-- Cipta Grand City G-8, Sagulung, Kota Batam, <br />
                  Kepulauan Riau 29425 <br /> -->

                  Ruko Dreamland H3 No. 05, Tanjung Riau,<br />
               Sekupang, Kota Batam, Kepulauan Riau. <br />
                  <v-divider class="mx-auto" style="max-width: 60%;" opacity="50"></v-divider>
             Jl. Raya Pasar Minggu No. 15A, Jakarta Selatan.
              <v-divider class="mx-auto" style="max-width: 60%;" opacity="50"></v-divider>
                </p>
                <p class="phone-line">
                  E-mail: sales@dutarayamarine.com, Phone/WhatsApp : +62823-8450-3953 
                  <br />
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
          <div class="text-center my-3 font-weight-bold">
            <span class="font-weight-bold" style="font-size: 23px"
              >INVOICE</span
            >
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
                    <td>
                      <span>{{ invoiceDetail.nama_customer }}</span>
                    </td>
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
                    <td>
                      <span>{{ invoiceDetail.pic }}</span>
                    </td>
                  </tr>

                  <tr>
                    <td width="80">
                      {{ invoiceLanguage === "id" ? "Kapal" : "Vessel" }}
                    </td>
                    <td width="10">:</td>
                    <td>
                      <span>{{ invoiceDetail.vessel }}</span>
                    </td>
                  </tr>

                  <tr>
                    <td width="80">
                      {{ invoiceLanguage === "id" ? "Lokasi" : "Location" }}
                    </td>
                    <td width="10">:</td>
                    <td>
                      <span> {{ invoiceDetail.location }}</span>
                    </td>
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
                    <td>
                      {{ invoiceDetail.no_penawaran }}
                    </td>
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
                    <td>
                      {{ formatTanggal(invoiceDetail.tanggal_penawaran!) }}
                    </td>
                  </tr>

                  <tr>
                    <td width="110">
                      {{ invoiceLanguage === "id" ? "No. PO" : "PO No." }}
                    </td>
                    <td width="10">:</td>
                    <td>
                      {{ invoiceDetail.no_preorder }}
                    </td>
                  </tr>

                  <tr>
                    <td width="110">
                      {{ invoiceLanguage === "id" ? "Tanggal PO" : "PO Date" }}
                    </td>
                    <td width="10">:</td>
                    <td>
                      {{ formatTanggal(invoiceDetail.tanggal_preorder!) }}
                    </td>
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
                <th width="5%">QTY</th>
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
                  <div class="text-center">
                    <span>{{ index + 1 }}.</span>
                  </div>
                </td>

                <td class="desc-cell">
                  <div>
                    <span
                      v-for="(line, lineIndex) in item.nama.split(/\r?\n/)"
                      :key="lineIndex"
                      class="description-line"
                    >
                      {{ line }}
                    </span>
                  </div>
                </td>

                <td class="qty-cell v-align-middle">
                  <div class="align-center text-center">
                    <span>{{ item.qty }}</span>
                  </div>
                </td>

                <td class="qty-cell v-align-middle">
                  <div class="align-center text-center">
                    <span>{{ item.uom }}</span>
                  </div>
                </td>

                <td class="amount-cell v-align-middle">
                  <div class="d-flex justify-space-between align-center">
                    <span>{{ invoiceCurrencyPrefix }}</span>
                    <span>{{ formatInvoiceNumber(item.amount) }}</span>
                  </div>
                </td>
              </tr>

              <tr v-if="invoiceDetail.dp_persen > 0 || invoiceAmountLabel !== 'Down Payment' || invoiceDetail.pakai_ppn || invoiceDetail.discount_invoice > 0">
                <td></td>
                <td></td>
                <td></td>

                <td class="footer-label">
                  <span>Total</span>
                </td>

                <td class="footer-value">
                  <div class="d-flex justify-space-between">
                    <span>{{ invoiceCurrencyPrefix }}</span>
                    <span>{{ formatInvoiceNumber(invoiceDetail.subtotal_invoice) }}</span>
                  </div>
                </td>
              </tr>
              <tr v-if="invoiceDetail.dp_persen > 0 && invoiceAmountLabel !== 'Down Payment' && invoiceDetail.pakai_ppn || invoiceDetail.discount_invoice > 0">
                <td></td>
                <td></td>
                <td></td>

                <td class="footer-label">
                  <span>Discount</span>
                </td>

                <td class="footer-value">
                  <div class="d-flex justify-space-between font-italic">
                    <span>{{ invoiceCurrencyPrefix }}</span>
                    <span>{{ formatInvoiceNumber(invoiceDetail.discount_invoice) }}</span>
                  </div>
                </td>
              </tr>


              <tr v-if="invoiceAmountLabel === 'Balance' && previousBilledSubtotal > 0">
                <td></td>
                <td></td>
                <td></td>

                <td class="footer-label">
                  <span>DP {{ previousDpPercent }}%</span>
                </td>

                <td class="footer-value">
                  <div class="d-flex justify-space-between">
                    <span>{{ invoiceCurrencyPrefix }}</span>
                    <span>{{ formatInvoiceNumber(previousBilledSubtotal) }}</span>
                  </div>
                </td>
              </tr>

              <tr v-if="invoiceDetail.pakai_ppn == true">
                <td></td>
                <td></td>
                <td></td>

                <td class="footer-label">
                  <strong>{{
                    invoiceLanguage === "id" ? "PPN 11%" : "VAT 11%"
                  }}</strong>
                </td>

                <td class="footer-value">
                  <div class="d-flex justify-space-between">
                    <span>{{ invoiceCurrencyPrefix }}</span>
                    <span>{{ formatInvoiceNumber(invoiceDetail.ppn) }}</span>
                  </div>
                </td>
              </tr>

              <tr
                v-if="invoiceDetail.dp_persen > 0 || invoiceAmountLabel !== 'Down Payment'"
              >
                <td></td>
                <td></td>
                <td></td>

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
              Amount in words: # {{
                numberToWordsEnglish(invoiceDetail.grandtotal_invoice)
              }}
              {{ invoiceCurrencyName }}.
            </span>
          </div>

          <table class="w-100" v-if="invoiceDetail.termCondition?.length > 0">
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

                    <ul class="remark-list-style" style="list-style: none">
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
            <div class="d-flex justify-space-between">
              <div class="bank-details">
                <div>
                  <table class="bank-table">

                     <tbody v-if="invoiceDetail.sign_by == 'Lilis'">
                      <tr>
                        <td>
                          {{
                            invoiceLanguage === "id" ? "NAMA BANK" : "BANK NAME"
                          }}
                        </td>
                        <td>:</td>
                        <td
                          class="editable-display-value"
                          contenteditable="true"
                          spellcheck="false"
                          aria-label="Ubah tampilan nama bank"
                          @keydown.enter.prevent="blurEditableDisplay"
                        >BCA</td>
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
                          class="editable-display-value"
                          contenteditable="true"
                          spellcheck="false"
                          aria-label="Ubah tampilan nomor rekening"
                          @keydown.enter.prevent="blurEditableDisplay"
                        >2671 6250 74</td>
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
                        >Lilis Trisnawati</td>
                      </tr>
                    </tbody>

                    <tbody v-if="invoiceDetail.sign_by == 'Seilla Maryana'">
                      <tr>
                        <td>
                          {{
                            invoiceLanguage === "id" ? "NAMA BANK" : "BANK NAME"
                          }}
                        </td>
                        <td>:</td>
                        <td class="editable-display-value"
                          contenteditable="true"
                          spellcheck="false"
                          aria-label="Ubah tampilan nama bank"
                          @keydown.enter.prevent="blurEditableDisplay">BCA</td>
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
                        <td>8551 0635 77</td>
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
                        <td class="editable-display-value"
                          contenteditable="true"
                          spellcheck="false"
                          aria-label="Ubah tampilan nama penerima"
                          @keydown.enter.prevent="blurEditableDisplay">Seilla Maryana</td>
                      </tr>
                    </tbody>

                    <tbody
                      v-if="invoiceDetail.sign_by == 'Leo Adiatmaja Sembiring'"
                    >
                      <tr>
                        <td>
                          {{
                            invoiceLanguage === "id" ? "NAMA BANK" : "BANK NAME"
                          }}
                        </td>
                        <td>:</td>
                        <td class="editable-display-value"
                          contenteditable="true"
                          spellcheck="false"
                          aria-label="Ubah tampilan nama bank"
                          @keydown.enter.prevent="blurEditableDisplay">BCA</td>
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
                        <td>8550 7530 23</td>
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
                        <td class="editable-display-value"
                          contenteditable="true"
                          spellcheck="false"
                          aria-label="Ubah tampilan nama penerima"
                          @keydown.enter.prevent="blurEditableDisplay">Leo Adiatmaja Sembiring</td>
                      </tr>
                    </tbody>

                    <tbody v-if="invoiceDetail.sign_by == 'Muhammad Ridwan'">
                      <tr>
                        <td>
                          {{
                            invoiceLanguage === "id" ? "NAMA BANK" : "BANK NAME"
                          }}
                        </td>
                        <td>:</td>
                        <td class="editable-display-value"
                          contenteditable="true"
                          spellcheck="false"
                          aria-label="Ubah tampilan nama bank"
                          @keydown.enter.prevent="blurEditableDisplay">BCA</td>
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
                        <td>8691 8096 92</td>
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
                        <td class="editable-display-value"
                          contenteditable="true"
                          spellcheck="false"
                          aria-label="Ubah tampilan nama penerima"
                          @keydown.enter.prevent="blurEditableDisplay">Muhammad Ridwan</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-8 signature-area">
            <span class="font-italic">{{
              invoiceLanguage === "id" ? "Hormat kami," : "Yours sincerely,"
            }}</span
            ><br />

            <strong>PT. DUTA RAYA MARINE</strong>

            <v-img
              v-if="invoiceDetail.sign_by == 'Seilla Maryana'"
              src="/public/ttd_seilla.png"
              width="150"
            />
            <v-img
              v-if="invoiceDetail.sign_by == 'Leo Adiatmaja Sembiring'"
              src="/public/ttd_leo.png"
              width="150"
              class="ml-3"
            />
            <v-img
              v-if="invoiceDetail.sign_by == 'Muhammad Ridwan'"
              src="/public/ttd_ridwan.png"
              width="150"
              class="ml-3"
            />

            <div
              v-if="invoiceDetail.sign_by == 'Lilis'"
              width="150"
              class="ml-3 mt-5 mb-8 font-italic text-grey-lighten-1 text-caption"
            >
              No Signature Required
            </div>

            <strong v-if="invoiceDetail.sign_by == 'Muhammad Ridwan'"
              >Muhammad Ridwan</strong
            >
            <strong v-if="invoiceDetail.sign_by == 'Seilla Maryana'"
              >Seilla Maryana</strong
            >
            <strong v-if="invoiceDetail.sign_by == 'Leo Adiatmaja Sembiring'"
              >Leo Adiatmaja Sembiring</strong
            >
            <strong v-if="invoiceDetail.sign_by == 'Lilis'"
              >Lilis</strong
            >
          </div>
        </v-card>
      </div>
    </div>

    <!-- ACTIONS -->
    <div class="d-flex justify-center gap-3 mt-4">
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
        class="ml-2"
      >
        Save PDF Invoice
      </v-btn>
    </div>

    <v-divider class="my-1 mt-10" opacity="100" color="primary"></v-divider>

    <div class="preview-container d-flex justify-center mt-8">
      <DeliveryOrder :invoice-detail="invoiceDetail" />
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
const isSavingPdf = ref(false);
const readingBuktiBayar = ref(false);
const readingDoWr = ref(false);
const savingInvoice = ref(false);
const doWrUploadProgress = ref(0);
const activeDoWrFileName = ref("");
const MAX_INVOICE_BYTES = 900 * 1024;
const invoiceLanguage = ref<"id" | "en">("en");
const quotationGrandTotal = ref(0);
const relatedInvoices = ref<invoiceM[]>([]);

function blurEditableDisplay(event: KeyboardEvent) {
  (event.currentTarget as HTMLElement | null)?.blur();
}

function numberToWordsEnglish(value: number): string {
  const number = Math.floor(Math.abs(value || 0));
  const units = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Fourty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convert(n: number): string {
    if (n < 20) return units[n];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? ` ${units[n % 10]}` : "");
    if (n < 1000)
      return `${units[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${convert(n % 100)}` : ""}`;
    const scales = [
      [1_000_000_000, "Billion"],
      [1_000_000, "Million"],
      [1000, "Thousand"],
    ] as const;
    for (const [scale, name] of scales) {
      if (n >= scale)
        return `${convert(Math.floor(n / scale))} ${name}${n % scale ? ` ${convert(n % scale)}` : ""}`;
    }
    return "";
  }

  return `${value < 0 ? "Minus " : ""}${convert(number)}`;
}

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

const data = reactive({
  dialogSelesai: false,
  dialogTambahDoWr: false,
});

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
  return invoiceLanguage.value === "id" ? "Rupiah" : "Indonesian Rupiah";
});
const invoiceCurrencyDescription = computed(
  () => `${invoiceCurrency.value} – (${invoiceCurrencyName.value})`,
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

const discountPercent = computed(() => {
  const subtotal = Number(invoiceDetail.value.subtotal_invoice || 0);
  const discount = Number(invoiceDetail.value.discount_invoice || 0);

  return subtotal > 0
    ? Math.round((discount / subtotal) * 10000) / 100
    : 0;
});

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
  const currentId = invoiceDetail.value.id || invoiceDetail.value.id_invoice;
  const invoicesInOrder = [...relatedInvoices.value].sort(
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
    Number(invoiceDetail.value.subtotal_invoice || 0) -
      Number(invoiceDetail.value.discount_invoice || 0),
  ),
);
const invoiceReferenceTotal = computed(
  () => quotationGrandTotal.value || invoiceBaseTotal.value,
);
const previousDpPercent = computed(() =>
  invoiceReferenceTotal.value > 0
    ? Math.round((previousBilledSubtotal.value / invoiceReferenceTotal.value) * 10000) / 100
    : 0,
);
const balancePercent = computed(() =>
  Math.max(0, Math.round((100 - previousDpPercent.value) * 100) / 100),
);

const invoiceAmountLabel = computed(() => {
  const quotationTotal = invoiceReferenceTotal.value;
  const currentAmount = billedSubtotal(invoiceDetail.value);
  const isSingleFullInvoice =
    relatedInvoices.value.length === 1 &&
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
});

const printArea = ref<HTMLElement | null>(null);

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

function printInvoice() {
  const content = printArea.value;

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
        <title>INV - </title>
        ${styles}

        <style>
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }

          .invoice-paper {
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          .logo-header {
            max-width: 100px !important;
            height: auto !important;
          }

          @page {
            margin: 0.5cm;
          }

          .page-break-section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        </style>
      </head>

      <body>
        ${content.innerHTML}

        <script>
          window.onload = () => {
            window.print();
            window.close();
          };
        <\/script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

const handleSavePdf = async () => {
  const targetElement = printArea.value;

  if (!targetElement || isSavingPdf.value) return;

  isSavingPdf.value = true;

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const avoidPositionsCss: {
      top: number;
      bottom: number;
      keepLine: boolean;
    }[] = [];
    let renderedHeightCss = 0;
    let renderedWidthCss = 0;
    const tableBoundsCss = { bottom: 0 };
    const tableHeaderBoundsCss = { top: 0, bottom: 0 };
    const tableColumnPositionsCss: number[] = [];
    const tableRowPositionsCss: number[] = [];

    const fullCanvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,

      onclone: (clonedDocument, clonedTarget) => {
        clonedDocument
          .querySelectorAll(".no-print, .no-print-cell, .drag-icon")
          .forEach((element) => {
            (element as HTMLElement).style.display = "none";
          });

        clonedDocument
          .querySelectorAll(".print-only-cell")
          .forEach((element) => {
            (element as HTMLElement).style.display = "table-cell";
          });

        // Measure the same layout that html2canvas renders. Hiding no-print
        // elements changes vertical positions compared with the live page.
        const containerRect = clonedTarget.getBoundingClientRect();
        renderedHeightCss = containerRect.height;
        renderedWidthCss = containerRect.width;

        const table = clonedTarget.querySelector<HTMLElement>(".main-table");
        const tableHeader = table?.querySelector<HTMLElement>("thead");
        if (table && tableHeader) {
          const tableRect = table.getBoundingClientRect();
          const headerRect = tableHeader.getBoundingClientRect();
          tableBoundsCss.bottom = tableRect.bottom - containerRect.top;
          tableHeaderBoundsCss.top = headerRect.top - containerRect.top;
          tableHeaderBoundsCss.bottom = headerRect.bottom - containerRect.top;

          table.querySelectorAll<HTMLElement>("th, td").forEach((cell) => {
            const cellRect = cell.getBoundingClientRect();
            tableColumnPositionsCss.push(
              cellRect.left - containerRect.left,
              cellRect.right - containerRect.left,
            );
            cell.style.setProperty("border-color", "transparent", "important");
          });

          table.querySelectorAll<HTMLElement>("tr").forEach((row) => {
            const rowRect = row.getBoundingClientRect();
            tableRowPositionsCss.push(
              rowRect.top - containerRect.top,
              rowRect.bottom - containerRect.top,
            );
          });
        }

        const addAvoidPosition = (rect: DOMRect, keepLine = false) => {
          const top = rect.top - containerRect.top;
          const bottom = rect.bottom - containerRect.top;
          if (bottom > top) {
            avoidPositionsCss.push({ top, bottom, keepLine });
          }
        };

        clonedTarget
          .querySelectorAll(
            ".main-table thead, .description-line, .terbilang-strip, .remark-border-box, .page-break-section, .info-grid",
          )
          .forEach((element) => {
            addAvoidPosition(
              element.getBoundingClientRect(),
              element.matches(".main-table thead, .description-line"),
            );
          });

        const textWalker = clonedDocument.createTreeWalker(
          clonedTarget,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) =>
              node.textContent?.trim()
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_REJECT,
          },
        );

        let textNode = textWalker.nextNode();
        while (textNode) {
          const range = clonedDocument.createRange();
          range.selectNodeContents(textNode);
          Array.from(range.getClientRects()).forEach((rect) =>
            addAvoidPosition(rect, true),
          );
          textNode = textWalker.nextNode();
        }
      },
    });

    if (!renderedHeightCss || !renderedWidthCss) {
      throw new Error("Layout invoice untuk PDF tidak ditemukan");
    }

    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const footerGapMm = 5;
    const marginTopSecondPageMm = 12;
    const marginBottomMm = 10;

    const scaleY = fullCanvas.height / renderedHeightCss;
    const scaleX = fullCanvas.width / renderedWidthCss;
    const columnPositionsPx = [
      ...new Set(
        tableColumnPositionsCss.map((position) =>
          Math.round(position * scaleX),
        ),
      ),
    ].sort((a, b) => a - b);
    const rowPositionsPx = [
      ...new Set(
        tableRowPositionsCss.map((position) =>
          Math.round(position * scaleY),
        ),
      ),
    ].sort((a, b) => a - b);

    const textPaddingPx = 3 * scaleY;
    const avoidPositionsPx = avoidPositionsCss
      .map((position) => ({
        top: position.top * scaleY,
        bottom: position.bottom * scaleY,
        keepLine: position.keepLine,
      }))
      .sort((a, b) => a.top - b.top);

    const tableBottomPx = tableBoundsCss.bottom * scaleY;
    const headerTopPx = Math.max(
      0,
      Math.floor(tableHeaderBoundsCss.top * scaleY) - 1,
    );
    const headerBottomPx =
      tableHeaderBoundsCss.bottom > tableHeaderBoundsCss.top
        ? Math.min(
            fullCanvas.height,
            Math.ceil(tableHeaderBoundsCss.bottom * scaleY) + 1,
          )
        : 0;
    let repeatedHeaderImage = "";
    let repeatedHeaderHeightMm = 0;

    if (headerBottomPx > headerTopPx) {
      const headerCanvas = document.createElement("canvas");
      headerCanvas.width = fullCanvas.width;
      headerCanvas.height = headerBottomPx - headerTopPx;
      const headerContext = headerCanvas.getContext("2d");
      if (headerContext) {
        headerContext.drawImage(
          fullCanvas,
          0,
          headerTopPx,
          fullCanvas.width,
          headerCanvas.height,
          0,
          0,
          fullCanvas.width,
          headerCanvas.height,
        );
        repeatedHeaderImage = headerCanvas.toDataURL("image/png");
        repeatedHeaderHeightMm =
          (headerCanvas.height * pdfWidth) / fullCanvas.width;
      }
    }

    const canvasPixelToPdfMm = pdfWidth / fullCanvas.width;
    const tableGridLineWidthMm = Math.max(
      0.2,
      Math.min(scaleX, scaleY) * canvasPixelToPdfMm,
    );

    const prepareTableGridStyle = () => {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(tableGridLineWidthMm);
    };

    const drawTableGridForSlice = (
      sliceStartPx: number,
      sliceHeightPx: number,
      contentTopMm: number,
    ) => {
      if (!columnPositionsPx.length || !rowPositionsPx.length) return;

      const tableLeftPx = columnPositionsPx[0];
      const tableRightPx = columnPositionsPx[columnPositionsPx.length - 1];
      const tableTopPx = rowPositionsPx[0];
      const tableBottomGridPx = rowPositionsPx[rowPositionsPx.length - 1];
      const sliceEndPx = sliceStartPx + sliceHeightPx;
      const visibleTopPx = Math.max(tableTopPx, sliceStartPx);
      const visibleBottomPx = Math.min(tableBottomGridPx, sliceEndPx);

      if (visibleBottomPx <= visibleTopPx) return;

      prepareTableGridStyle();
      const visibleTopMm =
        contentTopMm + (visibleTopPx - sliceStartPx) * canvasPixelToPdfMm;
      const visibleBottomMm =
        contentTopMm + (visibleBottomPx - sliceStartPx) * canvasPixelToPdfMm;

      columnPositionsPx.forEach((position) => {
        const xMm = position * canvasPixelToPdfMm;
        pdf.line(xMm, visibleTopMm, xMm, visibleBottomMm);
      });

      rowPositionsPx.forEach((position) => {
        if (position < visibleTopPx || position > visibleBottomPx) return;
        const yMm =
          contentTopMm + (position - sliceStartPx) * canvasPixelToPdfMm;
        pdf.line(
          tableLeftPx * canvasPixelToPdfMm,
          yMm,
          tableRightPx * canvasPixelToPdfMm,
          yMm,
        );
      });
    };

    const drawRepeatedTableHeaderGrid = (headerTopMm: number) => {
      if (
        !columnPositionsPx.length ||
        !rowPositionsPx.length ||
        !repeatedHeaderHeightMm
      ) return;

      const tableLeftPx = columnPositionsPx[0];
      const tableRightPx = columnPositionsPx[columnPositionsPx.length - 1];
      prepareTableGridStyle();

      columnPositionsPx.forEach((position) => {
        const xMm = position * canvasPixelToPdfMm;
        pdf.line(
          xMm,
          headerTopMm,
          xMm,
          headerTopMm + repeatedHeaderHeightMm,
        );
      });

      rowPositionsPx.forEach((position) => {
        if (position < headerTopPx || position > headerBottomPx) return;
        const yMm =
          headerTopMm + (position - headerTopPx) * canvasPixelToPdfMm;
        pdf.line(
          tableLeftPx * canvasPixelToPdfMm,
          yMm,
          tableRightPx * canvasPixelToPdfMm,
          yMm,
        );
      });
    };

    let currentCanvasY = 0;
    let pageCount = 0;

    while (currentCanvasY < fullCanvas.height) {
      if (pageCount > 0) {
        pdf.addPage();
      }

      const currentTopMarginMm = pageCount > 0 ? marginTopSecondPageMm : 0;

      const currentBottomMarginMm =
        pageCount > 0 ? marginBottomMm : footerGapMm;

      const repeatTableHeader =
        pageCount > 0 &&
        Boolean(repeatedHeaderImage) &&
        currentCanvasY >= headerBottomPx &&
        currentCanvasY < tableBottomPx;
      const contentTopMm =
        currentTopMarginMm +
        (repeatTableHeader ? repeatedHeaderHeightMm : 0);

      const maxUsablePdfHeightMm =
        pdfHeight - contentTopMm - currentBottomMarginMm;

      let targetSliceHeightPx = Math.floor(
        (maxUsablePdfHeightMm * fullCanvas.width) / pdfWidth,
      );

      const remainingCanvasHeightPx = fullCanvas.height - currentCanvasY;

      if (remainingCanvasHeightPx > targetSliceHeightPx) {
        const theoreticalCutY = currentCanvasY + targetSliceHeightPx;

        const conflicts = avoidPositionsPx.filter(
          (pos) =>
            theoreticalCutY > pos.top - textPaddingPx &&
            theoreticalCutY < pos.bottom + textPaddingPx,
        );
        const conflictingElement =
          conflicts.find((pos) => pos.keepLine) || conflicts[0];

        if (conflictingElement) {
          const safeCutY = Math.floor(conflictingElement.top - textPaddingPx);
          if (safeCutY > currentCanvasY) {
            targetSliceHeightPx = safeCutY - currentCanvasY;
          }
        }
      } else {
        targetSliceHeightPx = remainingCanvasHeightPx;
      }

      const pageCanvas = document.createElement("canvas");

      pageCanvas.width = fullCanvas.width;
      pageCanvas.height = targetSliceHeightPx;

      const ctx = pageCanvas.getContext("2d");

      if (ctx) {
        ctx.fillStyle = "#ffffff";

        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        ctx.drawImage(
          fullCanvas,
          0,
          currentCanvasY,
          fullCanvas.width,
          targetSliceHeightPx,
          0,
          0,
          fullCanvas.width,
          targetSliceHeightPx,
        );
      }

      // Keep the captured document lossless; the table grid is added below as
      // vector lines so its thickness stays uniform at every PDF zoom level.
      const imgData = pageCanvas.toDataURL("image/png");

      const slicePdfHeightMm =
        (targetSliceHeightPx * pdfWidth) / fullCanvas.width;

      if (repeatTableHeader) {
        pdf.addImage(
          repeatedHeaderImage,
          "PNG",
          0,
          currentTopMarginMm,
          pdfWidth,
          repeatedHeaderHeightMm,
        );
      }

      pdf.addImage(
        imgData,
        "PNG",
        0,
        contentTopMm,
        pdfWidth,
        slicePdfHeightMm,
      );

      if (repeatTableHeader) {
        drawRepeatedTableHeaderGrid(currentTopMarginMm);
      }
      drawTableGridForSlice(
        currentCanvasY,
        targetSliceHeightPx,
        contentTopMm,
      );

      currentCanvasY += targetSliceHeightPx;
      pageCount++;
    }

    const year = new Date().getFullYear();
    const invoiceId = invoiceDetail.value?.id || route.params.id;

    pdf.save(`INV-DRM-${year}-${invoiceId}.pdf`);
  } catch (error) {
    console.error("Gagal menyimpan PDF:", error);
  } finally {
    isSavingPdf.value = false;
  }
};
</script>

<style scoped>
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
   INVOICE PAPER
   ============================================================ */

.logo-header {
  max-width: 140px;
  height: auto;
  object-fit: contain;
  display: block;
}

.invoice-paper {
  font-family: "Arial", sans-serif;
  color: #000;
  line-height: 1.3;
}

.invoice-title {
  font-size: 32px;
  font-weight: bold;
  border-bottom: none;
}

.company-address {
  font-size: 13px;
  margin-top: 5px;
}

.info-grid {
  display: flex;
  border: 1px solid #000;
}

.info-box-left {
  padding: 10px;
  font-size: 14px;
  width: 55%;
}

.info-box-right {
  padding: 10px;
  font-size: 14px;
  width: 45%;
  border-left: 1px solid #000;
}

.main-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 15px;
}

.main-table th {
  background-color: #b8cce4 !important;
  border: 1px solid #000;
  padding: 8px;
  font-weight: bold;
  font-size: 13px;
}

.main-table td {
  border: 1px solid #000;
  padding: 6px;
  font-size: 14px;
}

.bg-light-blue {
  background-color: #b8cce4 !important;
}

.amount-cell {
  padding-left: 5px !important;
  padding-right: 5px !important;
}

.terbilang-strip {
  border-top: 2px solid #000;
  border-bottom: 2px solid #000;
  padding: 5px 10px;
  margin: 15px 0;
  font-style: italic;
  font-size: 14px;
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
  border: none !important;
  padding: 0px 4px 0px 0px !important;
  vertical-align: top;
  line-height: 1.4;
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

.desc-cell {
  padding: 8px !important;
}

.description-line {
  display: block;
  page-break-inside: avoid;
  break-inside: avoid;
}

.qty-cell {
  vertical-align: top;
  width: 15%;
}

.no-cell {
  width: 5%;
}

.amount-cell {
  vertical-align: top;
  width: 125%;
}

.remark-cell {
  vertical-align: middle;
}

.remark-border-box {
  border: 1px solid #000;
  padding: 8px;
  min-height: 80px;
  height: auto;
}

.remark-list-style {
  list-style: none;
  padding-left: 0;
  margin: 5px 0 0 0;
  font-size: 12px;
}

.footer-label {
  width: 15%;
  padding-right: 10px !important;
  white-space: nowrap;
}

.footer-value {
  width: 20%;
}

.v-align-middle {
  vertical-align: middle !important;
}

.page-break-section {
  page-break-inside: avoid;
  break-inside: avoid;
}

.remark-border-box,
.terbilang-strip {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

.main-table tr {
  page-break-inside: auto;
  break-inside: auto;
}

@media print {
  .no-print {
    display: none !important;
  }

  .editable-display-value {
    background: transparent !important;
    box-shadow: none !important;
  }

  .bg-light-blue,
  .bg-blue-total,
  .main-table th {
    background-color: #b8cce4 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page-break-section {
    page-break-inside: avoid;
    break-inside: avoid;
  }
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
  font-size: 26px;
  font-weight: 800;
  color: #0f2b48;
  letter-spacing: 0.3px;
  margin: 0;
  line-height: 1.2;
}

.address-line,
.phone-line {
  font-size: 11.5px;
  line-height: 1.4;
  margin: 1px 0 0;
}

.header-divider {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 6px;
  margin-bottom: 6px;
}

.accent-bar {
  height: 4px;
  width: 100%;
  border-radius: 2px;
  transition: background-color 0.2s ease;
}

.secondary-bar {
  height: 2px;
  width: 100%;
  background-color: #032752;
}
</style>
