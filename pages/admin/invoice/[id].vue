<template>
  <div>
    <ConfirmationDialog ref="confirmationDialog" />

    <!-- KEMBALI -->
    <v-btn
      variant="text"
      color="grey-darken-3"
      prepend-icon="mdi-arrow-left"
      @click="$router.go(-1)"
      class="text-capitalize font-weight-bold mb-2"
    >
      Kembali
    </v-btn>

    <v-dialog v-model="dialogDikirim" max-width="500" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="bg-primary text-white pa-4">
          Kirim Invoice
        </v-card-title>

        <v-card-actions class="pa-4 bg-grey-lighten-4">
          <v-spacer />

          <v-btn
            variant="outlined"
            color="grey-darken-1"
            @click="tutupDialogDikirim"
          >
            Batal
          </v-btn>

          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-send"
            @click="ubahStatusDikirim"
          >
            Simpan & Kirim
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

    <a-icon-success v-if="invoiceDetail.status == 'Selesai'" />

    <!-- ========================================================= -->
    <!-- HEADER INVOICE - COMPACT CORPORATE -->
    <!-- ========================================================= -->

    <div class="preview-container d-flex justify-center">
      <v-card
        flat
        class="invoice-top-card border rounded-lg mb-3 elevation-1"
        width="850"
      >
        <div class="invoice-top-inner">
          <!-- LEFT -->
          <div class="invoice-main-info">
            <div class="invoice-icon-box">
              <v-icon size="21" color="white">
                mdi-file-document-outline
              </v-icon>
            </div>

            <div class="invoice-heading">
              <div class="invoice-eyebrow">INVOICE</div>

              <div class="invoice-number">
                #INV/DRM/2026/{{ invoiceDetail.id }}
              </div>

              <NuxtLink
                :to="'/admin/penawaran/' + invoiceDetail.id_penawaran"
                class="quotation-link"
              >
                <span>Quotation</span>
                <strong>{{ invoiceDetail.no_penawaran }}</strong>
                <v-icon size="13">mdi-open-in-new</v-icon>
              </NuxtLink>
              <v-divider class="my-2"></v-divider>

              <div class="text-caption">
                {{ invoiceDetail.perihal }}
              </div>
              <div class="text-caption font-weight-bold" style="display: flex">
                <v-icon color="#1e3a5f" class="mr-1">mdi-domain</v-icon
                >{{ invoiceDetail.nama_customer }}
              </div>
            </div>
          </div>

          <!-- RIGHT -->
          <div class="invoice-meta">
            <div class="invoice-status-row">
              <v-chip size="small" variant="flat" class="invoice-status" label>
                {{ invoiceDetail.status }}
              </v-chip>

              <v-chip
                v-if="invoiceDetail.status == 'Draft'"
                prepend-icon="mdi-check-circle-outline"
                color="primary"
                size="small"
                class="invoice-complete-btn"
                label
                @click="openDialogSelesai"
              >
                Upload Bukti Bayar (Selesai)
              </v-chip>
            </div>

            <div class="invoice-created">
              <div class="created-item">
                <v-icon size="15">mdi-account-circle-outline</v-icon>
                <span>{{ invoiceDetail.createdBy }}</span>
              </div>

              <span class="created-separator">•</span>

              <div class="created-item">
                <v-icon size="15">mdi-clock-outline</v-icon>
                <span>{{ rubahtanggalunix(invoiceDetail.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </v-card>
    </div>

    <!-- ========================================================= -->
    <!-- REFERENCE CARD - COMPACT -->
    <!-- ========================================================= -->

    <div class="preview-container d-flex justify-center">
      <v-card
        flat
        class="invoice-reference-card border rounded-lg mb-3 elevation-1"
        width="850"
      >
        <div class="reference-grid">
          <!-- INVOICE BASED ON -->
          <div class="reference-block reference-left">
            <div class="reference-label">INVOICE BASED ON</div>

            <div class="reference-value">
              {{ invoiceDetail.no_preorder || "-" }}
            </div>
          </div>

          <!-- PURCHASE ORDER -->
          <div class="reference-block reference-right">
            <div class="reference-label">PURCHASE ORDER DOCUMENT</div>

            <div v-if="invoiceDetail.doc_preorder?.length" class="po-list">
              <v-chip
                v-for="(item, index) in invoiceDetail.doc_preorder"
                :key="index"
                size="small"
                variant="outlined"
                class="po-chip font-weight-medium"
                label
                :href="item.dataUrl"
                @click.prevent="bukaDokumenPo(item)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <v-icon size="14" class="mr-1">
                  mdi-file-document-outline
                </v-icon>

                {{ item.name }}
              </v-chip>
            </div>

            <div v-else class="reference-empty">No document attached</div>
          </div>

          <!-- DIVIDER -->
          <div class="reference-divider"></div>

          <!-- TANGGAL BAYAR -->
          <div class="reference-block reference-left payment-block">
            <div class="reference-label">TANGGAL BAYAR</div>

            <div class="reference-value">
              {{ invoiceDetail.tanggal_bayar || "-" }}
            </div>
          </div>

          <!-- BUKTI BAYAR -->
          <div class="reference-block reference-right payment-block">
            <div class="reference-label">DOC. BUKTI BAYAR</div>

            <div v-if="invoiceDetail.doc_bukti_bayar?.length" class="po-list">
              <v-chip
                v-for="(item, index) in invoiceDetail.doc_bukti_bayar"
                :key="index"
                size="small"
                variant="outlined"
                class="po-chip font-weight-medium"
                label
                :href="item.dataUrl"
                @click.prevent="bukaDokumenPo(item)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <v-icon size="14" class="mr-1">
                  mdi-file-document-outline
                </v-icon>

                {{ item.name }}
              </v-chip>
            </div>

            <div v-else class="reference-empty">No document attached</div>
          </div>
        </div>
      </v-card>
    </div>

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
                  Cipta Grand City G-8, Sagulung, Kota Batam, <br />
                  Kepulauan Riau 29425
                </p>
                <p class="phone-line">
                  E-mail: sales@dutarayamarine.com, HP : (+62) 853 6201 8099
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
                      <span>Batam</span>
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
                          : "Quotation No"
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
                    <td width="10"></td>
                    <td>
                      {{ formatTanggal(invoiceDetail.tanggal_penawaran!) }}
                    </td>
                  </tr>

                  <tr>
                    <td width="110">
                      {{ invoiceLanguage === "id" ? "No. PO" : "PO No" }}
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
                        invoiceLanguage === "id" ? "No. Invoice" : "Invoice No"
                      }}
                    </td>
                    <td width="10">:</td>
                    <td>INV/DRM/2026/{{ invoiceDetail.no_inv }}</td>
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
                    <td>IDR – (Rupiah)</td>
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
                    <span style="white-space: pre-line">
                      {{ item.nama }}
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
                    <span>Rp</span>
                    <span>{{ rupiah(item.amount) }}</span>
                  </div>
                </td>
              </tr>

              <tr>
                <td></td>
                <td></td>
                <td></td>

                <td class="footer-label">
                  <span>TOTAL</span>
                </td>

                <td class="footer-value">
                  <div class="d-flex justify-space-between">
                    <span>Rp</span>
                    <span>{{ rupiah(invoiceDetail.subtotal_invoice) }}</span>
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
                    <span>Rp</span>
                    <span>{{ rupiah(invoiceDetail.ppn) }}</span>
                  </div>
                </td>
              </tr>

              <tr v-if="invoiceDetail.dp_persen > 0">
                <td></td>
                <td></td>
                <td></td>

                <td class="footer-label">
                  <strong
                    >{{
                      invoiceLanguage === "id" ? "Uang Muka" : "Down Payment"
                    }}
                    {{ invoiceDetail.dp_persen }} %</strong
                  >
                </td>

                <td class="footer-value">
                  <div class="d-flex justify-space-between">
                    <span>Rp</span>
                    <strong>{{
                      rupiah(invoiceDetail.grandtotal_invoice)
                    }}</strong>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="terbilang-strip">
            <span v-if="invoiceLanguage === 'id'">
              Terbilang: #{{
                jadirupiah(invoiceDetail.grandtotal_invoice)
              }}
              Rupiah.
            </span>
            <span v-else>
              Amount in words: #{{
                numberToWordsEnglish(invoiceDetail.grandtotal_invoice)
              }}
              Rupiah.
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
                    <tbody v-if="invoiceDetail.sign_by == 'Seilla Maryana'">
                      <tr>
                        <td>
                          {{
                            invoiceLanguage === "id" ? "NAMA BANK" : "BANK NAME"
                          }}
                        </td>
                        <td>:</td>
                        <td>BCA</td>
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
                        <td>Seilla Maryana</td>
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
                        <td>BCA</td>
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
                        <td>Leo Adiatmaja Sembiring</td>
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
                        <td>BCA</td>
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
                        <td>Muhammad Ridwan</td>
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
              v-if="invoiceDetail.sign_by == 'Lilis Trisnawati'"
              width="150"
              class="ml-3 font-italic text-grey-lighten-1 text-caption"
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
            <strong v-if="invoiceDetail.sign_by == 'Lilis Trisnawati'"
              >Lilis Trisnawati</strong
            >
          </div>
        </v-card>
      </div>
    </div>

    <!-- ACTIONS -->
    <div class="d-flex justify-center gap-3 mt-4">
      <v-btn
        prepend-icon="mdi-file-pdf-box"
        color="red-darken-1"
        variant="elevated"
        :loading="isSavingPdf"
        @click="handleSavePdf"
        class="mr-2"
      >
        Save PDF Invoice
      </v-btn>

      <v-btn
        prepend-icon="mdi-printer"
        color="indigo"
        variant="elevated"
        @click="printInvoice"
      >
        Print Invoice
      </v-btn>
    </div>

    <v-divider class="my-1 mt-10" opacity="100" color="primary"></v-divider>

    <div class="preview-container d-flex justify-center mt-8">
      <DeliveryOrder :invoice-detail="invoiceDetail" />
    </div>
  </div>
</template>

<script setup lang="ts">
import moment from "moment";
import type { ConfirmationDialog } from "#components";
import type { invoiceM, invoiceBuktiBayarM } from "~/types/invoice";
import { uploadStore } from "~/stores/uploadStore";

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
const invoiceLanguage = ref<"id" | "en">("en");

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
  await invoiceStore.tarikDetailInvoiceAct(route.params.id as string);
  useloadingStore().setLoading(false);
});

const data = reactive({
  dialogSelesai: false,
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

const invoiceDetail = computed(() => invoiceStore.getDetailInvoice);

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

function bukaDokumenPo(document: invoiceBuktiBayarM) {
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
      "Dokumen PO tidak dapat dibuka. Silakan coba unggah ulang file.",
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

async function ubahStatusSelesai() {
  if (!invoiceDetail.value.tanggal_bayar) {
    notificationStore.showError("Tanggal di Bayar wajib diisi!");
    return;
  }

  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Selesai",
    "Anda yakin ingin mengubah status invoice menjadi Selesai?",
  );

  if (!confirmed) return;

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

    const fullCanvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,

      onclone: (clonedDocument) => {
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
      },
    });

    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const footerGapMm = 5;
    const marginTopSecondPageMm = 12;
    const marginBottomMm = 10;

    const containerRect = targetElement.getBoundingClientRect();

    const scaleY = fullCanvas.height / containerRect.height;

    const breakableElements = targetElement.querySelectorAll(
      ".main-table tr, .terbilang-strip, .remark-border-box, .page-break-section, .info-grid",
    );

    const avoidPositionsPx: {
      top: number;
      bottom: number;
    }[] = [];

    breakableElements.forEach((el) => {
      const rect = el.getBoundingClientRect();

      const topPx = (rect.top - containerRect.top) * scaleY;

      const bottomPx = (rect.bottom - containerRect.top) * scaleY;

      avoidPositionsPx.push({
        top: topPx,
        bottom: bottomPx,
      });
    });

    let currentCanvasY = 0;
    let pageCount = 0;

    while (currentCanvasY < fullCanvas.height) {
      if (pageCount > 0) {
        pdf.addPage();
      }

      const currentTopMarginMm = pageCount > 0 ? marginTopSecondPageMm : 0;

      const currentBottomMarginMm =
        pageCount > 0 ? marginBottomMm : footerGapMm;

      const maxUsablePdfHeightMm =
        pdfHeight - currentTopMarginMm - currentBottomMarginMm;

      let targetSliceHeightPx =
        (maxUsablePdfHeightMm * fullCanvas.width) / pdfWidth;

      const remainingCanvasHeightPx = fullCanvas.height - currentCanvasY;

      if (remainingCanvasHeightPx > targetSliceHeightPx) {
        const theoreticalCutY = currentCanvasY + targetSliceHeightPx;

        const conflictingElement = avoidPositionsPx.find(
          (pos) => theoreticalCutY > pos.top && theoreticalCutY < pos.bottom,
        );

        if (conflictingElement && conflictingElement.top > currentCanvasY) {
          targetSliceHeightPx = conflictingElement.top - currentCanvasY;
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

      const imgData = pageCanvas.toDataURL("image/png");

      const slicePdfHeightMm =
        (targetSliceHeightPx * pdfWidth) / fullCanvas.width;

      pdf.addImage(
        imgData,
        "PNG",
        0,
        currentTopMarginMm,
        pdfWidth,
        slicePdfHeightMm,
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
   TOP INVOICE CARD
   ============================================================ */

.invoice-top-card {
  background: #ffffff;
  border-color: #e2e8f0 !important;
  overflow: hidden;
}

.invoice-top-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 18px;
}

.invoice-main-info {
  display: flex;
  align-items: center;
  min-width: 0;
}

.invoice-icon-box {
  width: 40px;
  height: 40px;
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #1e3a5f;
  margin-right: 12px;
}

.invoice-heading {
  min-width: 0;
}

.invoice-eyebrow {
  font-size: 10px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #64748b;
  margin-bottom: 4px;
}

.invoice-number {
  font-size: 18px;
  line-height: 1.15;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.quotation-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  text-decoration: none;
  font-size: 11px;
  color: #64748b;
  transition: 0.2s ease;
}

.quotation-link strong {
  color: #2563eb;
  font-weight: 700;
}

.quotation-link:hover strong {
  color: #1d4ed8;
  text-decoration: underline;
}

.invoice-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.invoice-status-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.invoice-status {
  background: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 10px;
  letter-spacing: 0.06em;
}

.invoice-complete-btn {
  font-size: 10px;
  letter-spacing: 0.03em;
}

.invoice-created {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
  color: #64748b;
  font-size: 11px;
  white-space: nowrap;
}

.created-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.created-separator {
  color: #cbd5e1;
}

/* ============================================================
   REFERENCE CARD
   ============================================================ */

.invoice-reference-card {
  background: #ffffff;
  border-color: #e2e8f0 !important;
  overflow: hidden;
}

.reference-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 0;
}

.reference-block {
  padding: 12px 16px;
  min-width: 0;
}

.reference-left {
  border-right: 1px solid #eef2f7;
}

.reference-right {
  text-align: right;
}

.reference-label {
  font-size: 9px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #94a3b8;
  margin-bottom: 4px;
}

.reference-value {
  font-size: 13px;
  line-height: 1.35;
  font-weight: 700;
  color: #1e293b;
}

.reference-divider {
  grid-column: 1 / -1;
  height: 1px;
  background: #eef2f7;
}

.payment-block {
  padding-top: 10px;
  padding-bottom: 10px;
}

.reference-empty {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.3;
}

.po-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 5px;
}

.po-chip {
  height: 26px !important;
  max-width: 100%;
  color: #334155;
  border-color: #dbe3ec !important;
  background: #f8fafc;
  font-size: 11px;
}

.po-chip :deep(.v-chip__content) {
  display: flex;
  align-items: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
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

.desc-cell {
  padding: 8px !important;
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
.main-table tr,
.terbilang-strip {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

@media print {
  .no-print {
    display: none !important;
  }

  .bg-light-blue,
  .bg-blue-total,
  .main-table th {
    background-color: #b8cce4 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    border: 1px solid #000;
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

@media (max-width: 599px) {
  .invoice-top-inner {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
    padding: 13px 14px;
  }

  .invoice-meta {
    width: 100%;
    align-items: flex-start;
  }

  .invoice-created {
    justify-content: flex-start;
  }

  .reference-grid {
    grid-template-columns: 1fr;
  }

  .reference-left {
    border-right: none;
  }

  .reference-right {
    text-align: left;
  }

  .reference-divider {
    grid-column: auto;
  }

  .po-list {
    justify-content: flex-start;
  }

  .po-upload-row {
    flex-direction: column;
  }
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
