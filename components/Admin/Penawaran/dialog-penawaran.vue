<template>
  <ConfirmationDialog ref="confirmationDialog" />

  <v-dialog
    v-model="data.dialogTambahMasterPerusahaan"
    max-width="320"
    persistent
  >
    <v-card class="rounded border elevation-1 bg-white">
      <!-- Header Padat -->
      <div
        class="px-4 py-2-5 pa-3 d-flex align-center justify-space-between border-b"
      >
        <span class="text-caption font-weight-bold text-grey-darken-3"
          >Tambah Master Perusahaan</span
        >
        <v-btn
          icon="mdi-close"
          variant="text"
          density="compact"
          size="x-small"
          color="grey-darken-1"
          @click="data.dialogTambahMasterPerusahaan = false"
        />
      </div>

      <v-card-text class="pa-3">
        <a-text-field-new
          v-model="newCustomer.nama"
          label="Nama Perusahaan"
          placeholder="Nama perusahaan"
          variant="outlined"
          density="compact"
          hide-details
        />
        <a-textarea-new
          v-model="newCustomer.alamat"
          label="Alamat Perusahaan"
          placeholder="Alamat lengkap perusahaan"
          rows="2"
          variant="outlined"
          density="compact"
          hide-details
          auto-grow
        />
      </v-card-text>

      <!-- Footer Padat -->
      <div
        class="px-3 py-2 border-t d-flex justify-end gap-1 bg-grey-lighten-5"
      >
        <v-btn
          variant="text"
          color="grey-darken-1"
          size="x-small"
          class="text-none px-3"
          :disabled="savingCustomer"
          @click="data.dialogTambahMasterPerusahaan = false"
        >
          Batal
        </v-btn>
        <v-btn
          color="grey-darken-4"
          size="x-small"
          variant="flat"
          class="text-none px-3 text-white"
          :loading="savingCustomer"
          @click="simpanMasterPerusahaan"
        >
          Simpan
        </v-btn>
      </div>
    </v-card>
  </v-dialog>

  <!-- Dialog Tambah / Edit Quotation -->
  <v-dialog
    v-model="data.dialogTambahPenawaran"
    max-width="1120"
    scrollable
    :fullscreen="display.xs.value"
    :persistent="quotationDialogPersistent"
    class="quotation-dialog-overlay"
  >
    <v-card class="quotation-dialog-card" elevation="0">
      <header class="quotation-dialog-header">
        <div class="quotation-dialog-heading">
          <div class="quotation-dialog-icon" aria-hidden="true">
            <v-icon icon="mdi-file-document-edit-outline" size="20" />
          </div>
          <div>
            <h2>
              {{
                data.penawaranAddEdit === "add"
                  ? "Create"
                  : data.penawaranAddEdit === "revision"
                    ? "Revision"
                    : "Edit"
              }}
              Quotation
            </h2>
            <p>
              {{
                data.penawaranAddEdit === "revision"
                  ? "Revisi disimpan ke riwayat quotation dengan nomor yang sama"
                  : "Nomor quotation dibuat otomatis saat disimpan"
              }}
            </p>
          </div>
        </div>

        <div class="quotation-dialog-header-actions">
          <span class="quotation-status">
            <span class="quotation-status-dot"></span>
            {{ newPenawaran.status || "Draft" }}
          </span>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            color="grey-darken-1"
            aria-label="Tutup dialog quotation"
            @click="data.dialogTambahPenawaran = false"
          />
        </div>
      </header>

      <v-card-text class="quotation-dialog-workspace">
        <nav class="quotation-dialog-menu" aria-label="Menu form quotation">
          <!-- <p class="quotation-dialog-menu-label">Menu Pengisian</p> -->
          <button
            v-for="section in quotationFormSections"
            :key="section.id"
            type="button"
            class="quotation-dialog-menu-item"
            :class="{
              'quotation-dialog-menu-item--active':
                activeQuotationSection === section.id,
            }"
            :aria-current="
              activeQuotationSection === section.id ? 'step' : undefined
            "
            @click="activeQuotationSection = section.id"
          >
            <span class="quotation-dialog-menu-copy">
              <strong>{{ section.title }}</strong>
              <!-- <small>{{ section.description }}</small> -->
            </span>
            <v-icon
              class="quotation-dialog-menu-arrow"
              icon="mdi-chevron-right"
              size="18"
            />
          </button>
        </nav>

        <div class="quotation-dialog-body">
        <div
          v-show="activeQuotationSection === 'client'"
          class="quotation-dialog-panel"
        >
          <section class="quotation-form-section quotation-client-section">
            <header class="quotation-client-heading">
              <div>
                <span>Client information</span>
                <h3>Client &amp; quotation details</h3>
              </div>
              <p>Pilih client dan PIC, lalu lengkapi subject quotation.</p>
            </header>

            <div class="quotation-client-workspace">
              <div class="quotation-client-form-column">
                <div class="quotation-client-picker">
                  <a-autocomplete-new
                    class="quotation-client-select quotation-company-field"
                    v-model="newPenawaran.id_perusahaan"
                    label="Perusahaan"
                    placeholder="Pilih perusahaan"
                    item-title="label"
                    item-value="value"
                    :items="companyOptions"
                    :disabled="hasCompanyScope"
                  />
                  <a-select-new
                    class="quotation-client-select"
                    v-model="newPenawaran.id_pic"
                    label="PIC"
                    placeholder="Pilih PIC"
                    item-title="label"
                    item-value="value"
                    :items="picOptionsForCompany"
                    :disabled="!newPenawaran.id_perusahaan"
                  />
                  <a-date-picker-new
                    class="quotation-date-field"
                    v-model="newPenawaran.tanggal_penawaran"
                    label="Quotation Date"
                  />
                </div>

                <div
                  v-if="!hasCompanyScope"
                  class="quotation-client-master-actions"
                >
                  <v-btn
                    class="quotation-add-client-btn text-none"
                    variant="outlined"
                    color="primary"
                    prepend-icon="mdi-domain-plus"
                    @click="opendialogTambahMasterPerusahaan"
                  >
                    Tambah Perusahaan
                  </v-btn>
                  <v-btn
                    class="quotation-add-client-btn text-none"
                    variant="text"
                    color="grey-darken-1"
                    prepend-icon="mdi-account-cog-outline"
                    @click="router.push('/admin/master/client')"
                  >
                    Kelola Master PIC
                  </v-btn>
                </div>

                <div class="quotation-subject-grid">
                  <a-textarea-new
                    class="quotation-subject-field"
                    v-model="newPenawaran.perihal"
                    label="Subject"
                    placeholder="Tuliskan subject quotation"
                    rows="2"
                  />
                  <a-select-new
                    class="quotation-currency-field"
                    v-model="newPenawaran.currency"
                    label="Currency"
                    :items="[
                      { title: 'IDR', value: 'IDR' },
                      { title: 'USD', value: 'USD' },
                      { title: 'SGD', value: 'SGD' },
                    ]"
                  />
                </div>

                <div class="quotation-operation-block">
                  <div class="quotation-operation-heading">
                    <strong>Operational details</strong>
                    <span>Opsional, isi jika quotation terkait vessel.</span>
                  </div>
                  <div class="quotation-operation-fields">
                    <a-text-field-new
                      class="quotation-client-select"
                      v-model="newPenawaran.vessel"
                      label="Vessel"
                      placeholder="Nama vessel"
                    />
                    <a-autocomplete-new
                      class="quotation-client-select"
                      v-model="newPenawaran.location"
                      label="Location"
                      placeholder="Pilih lokasi"
                      item-title="label"
                      item-value="id_customer"
                      :items="[
  'Batam',
  'Jakarta',
  'Lamongan',
  'Agats',
  'Ambon',
  'Amurang',
  'Atapupu',
  'Bacan',
  'Bahodopi',
  'Bali',
  'Balikpapan',
  'Banjarmasin',
  'Banten',
  'Batu Ampar',
  'Batulicin',
  'Bau-Bau',
  'Belawan',
  'Bengkalis',
  'Bengkulu',
  'Benoa',
  'Berau',
  'Biak',
  'Bima',
  'Bintan',
  'Bitung',
  'Bontang',
  'Boom Baru',
  'Celukan Bawang',
  'Cilegon',
  'Cilacap',
  'Cirebon',
  'Donggala',
  'Dumai',
  'Ende',
  'Fakfak',
  'Garongkong',
  'Gilimanuk',
  'Gorontalo',
  'Gresik',
  'Jayapura',
  'Kabil',
  'Kaimana',
  'Kendari',
  'Ketapang',
  'Kijing',
  'Kolaka',
  'Kotabaru',
  'Kuala Tanjung',
  'Kumai',
  'Kupang',
  'Labuan Bajo',
  'Lampung',
  'Lembar',
  'Lombok',
  'Makassar',
  'Manado',
  'Manokwari',
  'Maumere',
  'Medan',
  'Merak',
  'Merauke',
  'Morowali',
  'Muntok',
  'Nabire',
  'Namlea',
  'Nunukan',
  'Padang',
  'Padang Bai',
  'Palaran',
  'Palembang',
  'Palopo',
  'Palu',
  'Pangkal Pinang',
  'Pangkalan Bun',
  'Panjang',
  'Pantoloan',
  'Parepare',
  'Pekanbaru',
  'Pontianak',
  'Samarinda',
  'Sampit',
  'Sangatta',
  'Sape',
  'Saumlaki',
  'Sekupang',
  'Selat Panjang',
  'Semarang',
  'Semayang',
  'Serui',
  'Sibolga',
  'Soekarno Hatta Makassar',
  'Sorong',
  'Surabaya',
  'Tanjung Balai Karimun',
  'Tanjung Emas',
  'Tanjung Intan',
  'Tanjung Pandan',
  'Tanjung Perak',
  'Tanjung Pinang',
  'Tanjung Priok',
  'Tanjung Redeb',
  'Tanjung Uban',
  'Tanjung Wangi',
  'Tarakan',
  'Teluk Bayur',
  'Tembilahan',
  'Tenau',
  'Ternate',
  'Tidore',
  'Timika',
  'Tobelo',
  'Trisakti',
  'Tual',
  'Tuban',
  'Waingapu'
]"
                    />
                  </div>
                </div>
              </div>

              <aside class="quotation-client-summary" aria-label="Ringkasan client">
                <div class="quotation-client-summary-heading">
                  <span aria-hidden="true">CL</span>
                  <div>
                    <small>Selected client</small>
                    <strong>{{ newPenawaran.nama_perusahaan || "Belum dipilih" }}</strong>
                  </div>
                </div>

                <dl class="quotation-client-details">
                  <div class="quotation-client-detail quotation-client-address">
                    <dt>Address</dt>
                    <dd>{{ newPenawaran.alamat_perusahaan || "—" }}</dd>
                  </div>
                  <div class="quotation-client-detail">
                    <dt>PIC</dt>
                    <dd>{{ newPenawaran.pic || "—" }}</dd>
                  </div>
                  <div class="quotation-client-detail">
                    <dt>Phone Number</dt>
                    <dd>{{ newPenawaran.no_telp || "—" }}</dd>
                  </div>
                  <div class="quotation-client-detail">
                    <dt>Email</dt>
                    <dd>{{ newPenawaran.email || "—" }}</dd>
                  </div>
                </dl>
              </aside>
            </div>
          </section>
        </div>

        <section
          v-show="activeQuotationSection === 'items'"
          class="quotation-form-section quotation-items-section"
        >


          <div
            ref="quotationItemsSortableContainer"
            class="quotation-sortable-items"
          >
            <div
              v-for="(item, index) in newPenawaran.penawaran_item"
              :key="quotationItemKey(item)"
              class="quotation-line-item"
              @focusin="activeSuggestionIndex = index"
              @focusout="activeSuggestionIndex = null"
            >
              <div class="quotation-line-item-header">
                <div>
                  <button
                    type="button"
                    class="quotation-item-drag-handle"
                    :aria-label="`Pindahkan item ${index + 1}`"
                    title="Tarik untuk mengubah urutan item"
                    @keydown.up.prevent="moveQuotationItem(index, index - 1)"
                    @keydown.down.prevent="moveQuotationItem(index, index + 1)"
                  >
                    <v-icon icon="mdi-drag-vertical" size="18" />
                  </button>
                  <span class="quotation-line-number">
                    {{ String(index + 1).padStart(2, "0") }}
                  </span>

                </div>
                <v-btn
                  size="small"
                  variant="outlined"
                  color="error"
                  prepend-icon="mdi-delete-outline"
                  class="quotation-delete-item-btn text-none"
                  aria-label="Hapus item quotation"
                  @click="hapusBarisPenawaran(index)"
                >
                  Delete
                  <v-tooltip activator="parent" location="top">
                    Delete item
                  </v-tooltip>
                </v-btn>
              </div>

              <a-textarea-new
                v-model="item.nama"
                label="Description"
                placeholder="Describe the product, service, or scope of work"
                rows="2"
              />

              <div
                v-if="
                  activeSuggestionIndex === index &&
                  barangSesuaiNama(item.nama).length
                "
                class="quotation-suggestions"
              >
                <span>HPP history</span>
                <div>
                  <v-chip
                    v-for="(barang, idxBarang) in barangSesuaiNama(item.nama)"
                    :key="barang.id ?? idxBarang"
                    size="x-small"
                    variant="outlined"
                    color="grey-darken-1"
                  >
                    {{ barang.nama_barang }} · Rp
                    {{ rupiah(barang.harga_hpp) }}
                  </v-chip>
                </div>
              </div>

              <div class="quotation-category">
                <span class="quotation-field-label">Category</span>
                <div class="quotation-category-options">
                  <a-checkbox
                    label="Barang"
                    :model-value="item.kategori_item === 'Barang'"
                    @update:model-value="
                      setKategoriItem(item, 'Barang', $event)
                    "
                  />
                  <a-checkbox
                    label="Jasa"
                    :model-value="item.kategori_item === 'Jasa'"
                    @update:model-value="setKategoriItem(item, 'Jasa', $event)"
                  />
                  <a-checkbox
                    label="Barang & Jasa"
                    :model-value="item.kategori_item === 'Barang & Jasa'"
                    @update:model-value="
                      setKategoriItem(item, 'Barang & Jasa', $event)
                    "
                  />
                </div>
              </div>

              <div class="quotation-item-fields">
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
                    'Roll',
                    'Box',
                    'Liter',
                    'Jerigen',
                    'Can',
                    'Pail',
                    'Pack',
                  ]"
                  v-model="item.uom"
                  label="UOM"
                  placeholder="Select"
                />
                <div class="quotation-hpp-field">
                  <a-field-number-new
                    v-model="item.harga_hpp"
                    label="Harga Modal"
                    placeholder="0"
                  />
                  <div
                    v-if="item.harga_hpp > 0"
                    class="quotation-markup-actions"
                  >
                    <button
                      v-for="persentase in [10, 20, 30, 50]"
                      :key="persentase"
                      type="button"
                      :class="{
                        'is-active': isMarkupActive(item, persentase),
                      }"
                      :disabled="!Number(item.harga_hpp)"
                      :aria-pressed="isMarkupActive(item, persentase)"
                      @click="terapkanMarkup(item, persentase)"
                    >
                      +{{ persentase }}%
                    </button>
                    <div class="quotation-custom-markup">
                      <input
                        v-model="customMarkupPercentages[quotationItemKey(item)]"
                        type="text"
                        inputmode="decimal"
                        placeholder="Custom"
                        :aria-label="`Persentase markup manual item ${index + 1}`"
                        @keydown.enter.prevent="terapkanMarkupManual(item)"
                      />
                      <span>%</span>
                      <button
                        type="button"
                        class="quotation-custom-markup-apply"
                        :disabled="!canApplyCustomMarkup(item)"
                        :aria-label="`Terapkan markup manual item ${index + 1}`"
                        title="Terapkan markup manual"
                        @click="terapkanMarkupManual(item)"
                      >
                        <v-icon icon="mdi-check" size="14" />
                      </button>
                    </div>
                  </div>
                </div>
                <a-field-number-new
                  v-model="item.amount"
                  :label="`Unit Price (${currencyLabel(newPenawaran.currency)})`"
                  placeholder="0"
                  :allow-decimal="newPenawaran.currency !== 'IDR'"
                  :step="newPenawaran.currency === 'IDR' ? 1 : 0.01"
                />
                <a-text-field-new
                  :model-value="
                    formatCurrency(
                      Number(item.qty || 0) * Number(item.amount || 0),
                      newPenawaran.currency,
                    )
                  "
                  label="Subtotal"
                  placeholder="0"
                  disabled
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            class="quotation-add-row-secondary"
            @click="tambahBarisPenawaran"
          >
            <v-icon icon="mdi-plus" size="16" />
            Add another item
          </button>
        </section>

        <div
          v-show="activeQuotationSection === 'commercial'"
          class="quotation-commercial-grid"
        >
          <section class="quotation-form-section quotation-summary-section">

            <div class="quotation-discount-fields">
              <v-text-field
                v-model.number="discountPercentPenawaran"
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
                v-model="discountAmountInput"
                label="Discount Amount"
                type="text"
                inputmode="decimal"
                :prefix="currencyInputPrefix"
                density="compact"
                variant="outlined"
                hide-details
                @focus="startEditingDiscountAmount"
                @blur="finishEditingDiscountAmount"
              />
            </div>

            <div class="quotation-totals">
              <div>
                <span>Subtotal</span>
                <strong>
                  {{ formatCurrency(subtotalPenawaran, newPenawaran.currency) }}
                </strong>
              </div>
              <div>
                <span>Discount ({{ discountPercentPenawaran }}%)</span>
                <strong class="quotation-discount-value">
                  -
                  {{
                    formatCurrency(
                      discountAmountPenawaran,
                      newPenawaran.currency,
                    )
                  }}
                </strong>
              </div>
              <div class="quotation-grand-total">
                <span>Total Quotation</span>
                <strong>
                  {{
                    formatCurrency(grandTotalPenawaran, newPenawaran.currency)
                  }}
                </strong>
              </div>
            </div>
          </section>

          <section class="quotation-form-section quotation-sign-section">
            <div class="quotation-section-header">
              <div>
                <!-- <span class="quotation-section-index">04</span> -->
                <!-- <h3>Authorization</h3> -->
              </div>
              <p>Penandatangan quotation.</p>
            </div>

            <a-select-new
              v-model="newPenawaran.sign_by"
              label="Sign By"
              :items="[
                'Seilla Maryana',
                'Leo Adiatmaja Sembiring',
                'Muhammad Ridwan',
                'Lilis',
              ]"
            />

            <div
              v-if="newPenawaran.sign_by"
              class="quotation-signature-preview"
            >
              <div
                v-if="newPenawaran.sign_by == 'Leo Adiatmaja Sembiring'"
                class="signature-content"
              >
                <v-img width="130" height="65" contain src="/ttd_leo.png" />
                <div class="signature-line"></div>
                <div class="signature-name">Leo Adiatmaja Sembiring</div>
              </div>

              <div
                v-if="newPenawaran.sign_by == 'Seilla Maryana'"
                class="signature-content"
              >
                <v-img width="130" height="65" contain src="/ttd_seilla_hitam.png" />
                <div class="signature-line"></div>
                <div class="signature-name">Seilla Maryana</div>
              </div>

              <div
                v-if="newPenawaran.sign_by == 'Muhammad Ridwan'"
                class="signature-content"
              >
                <v-img width="130" height="65" contain src="/ttd_ridwan.png" />
                <div class="signature-line"></div>
                <div class="signature-name">Muhammad Ridwan</div>
              </div>
              

              <div
                 v-if="newPenawaran.sign_by == 'Lilis'"
                class="signature-content"
              >
                <v-img width="130" height="65" contain src="/ttd_lilis_hitam.png" />
                <div class="signature-line"></div>
                <div class="signature-name">Lilis</div>
              </div>
            </div>
          </section>
        </div>

        <section
          v-show="activeQuotationSection === 'terms'"
          class="quotation-form-section quotation-terms-section"
        >
          <!-- <div class="quotation-section-header quotation-terms-header">
            <div>
              <span class="quotation-section-index">05</span>
              <h3>T&amp;C</h3>
            </div>
            <span class="quotation-selected-count">
              {{ (newPenawaran.termCondition ?? []).length }} selected
            </span>
          </div> -->

          <div class="quotation-term-controls">
            <div class="quotation-term-search">
              <v-icon icon="mdi-magnify" size="17" />
              <a-text-field-new
                v-model="termConditionSearch"
                placeholder="Cari atau tulis term baru"
                @keydown.enter.prevent="tambahTermConditionDariPencarian"
              />
              <v-btn
                v-if="termConditionSearch"
                icon="mdi-close"
                size="x-small"
                variant="text"
                color="grey-darken-1"
                aria-label="Hapus pencarian term dan condition"
                @click="termConditionSearch = ''"
              />
            </div>
            <v-btn
              size="small"
              color="primary"
              variant="outlined"
              :prepend-icon="existingTermCondition ? undefined : 'mdi-plus'"
              class="quotation-term-add-btn text-none"
              :disabled="!canAddTermCondition"
              :loading="savingTermCondition"
              @click="tambahTermConditionDariPencarian"
            >
              {{
                existingTermCondition
                  ? searchedTermConditionIsSelected
                    ? "Selected"
                    : "Available"
                  : "Add master T&C"
              }}
            </v-btn>
          </div>

          <div class="quotation-terms-lists">
            <div class="quotation-terms-table-wrap">
              <table class="quotation-terms-table">
                <caption>
                  Dipilih
                </caption>
                <thead>
                  <tr>
                    <th scope="col" aria-label="Ubah urutan"></th>
                    <th scope="col">No.</th>
                    <th scope="col">Selected</th>
                    <th scope="col">Description</th>
                  </tr>
                </thead>
                <tbody ref="termConditionsSortableContainer">
                  <tr
                    v-for="(item, index) in selectedTermConditions"
                    :key="termConditionKey(item)"
                    class="quotation-term-row"
                  >
                    <td>
                      <button
                        type="button"
                        class="quotation-term-drag-handle"
                        :aria-label="`Pindahkan term ${index + 1}`"
                        title="Tarik untuk mengubah urutan term"
                        @keydown.up.prevent="moveTermCondition(index, index - 1)"
                        @keydown.down.prevent="
                          moveTermCondition(index, index + 1)
                        "
                      >
                        <v-icon icon="mdi-drag-vertical" size="17" />
                      </button>
                    </td>
                    <td>{{ index + 1 }}</td>
                    <td>
                      <v-checkbox
                        v-model="newPenawaran.termCondition"
                        :value="item"
                        :value-comparator="sameTermCondition"
                        density="compact"
                        hide-details
                        color="primary"
                        class="quotation-term-checkbox"
                        @update:model-value="scheduleTermConditionSelectionSync"
                      />
                    </td>
                    <td>{{ item.nama_term }}</td>
                  </tr>
                  <tr v-if="!selectedTermConditions.length">
                    <td colspan="4" class="quotation-terms-empty">
                      <strong>Belum ada T&amp;C yang dipilih.</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="quotation-terms-table-wrap">
              <table
                class="quotation-terms-table quotation-terms-table--available"
              >
                <caption>
                  Pilihan
                </caption>
                <thead>
                  <tr>
                    <th scope="col">No.</th>
                    <th scope="col">Select</th>
                    <th scope="col">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, index) in availableTermConditions"
                    :key="termConditionKey(item)"
                    class="quotation-term-row"
                  >
                    <td>{{ index + 1 }}</td>
                    <td>
                      <v-checkbox
                        v-model="newPenawaran.termCondition"
                        :value="{
                          id: item.id ?? '',
                          nama_term: item.nama_term,
                        }"
                        :value-comparator="sameTermCondition"
                        density="compact"
                        hide-details
                        color="primary"
                        class="quotation-term-checkbox"
                        @update:model-value="scheduleTermConditionSelectionSync"
                      />
                    </td>
                    <td>{{ item.nama_term }}</td>
                  </tr>
                  <tr v-if="!availableTermConditions.length">
                    <td colspan="3" class="quotation-terms-empty">
                      <strong>
                        {{
                          termConditionSearch
                            ? "Term tidak ditemukan."
                            : "Semua T&C sudah dipilih."
                        }}
                      </strong>
                      <span v-if="canAddTermCondition">
                        Klik “Add master T&amp;C” untuk menyimpannya ke master.
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
        </div>
      </v-card-text>

      <footer class="quotation-dialog-footer">
        <p>
          Pastikan client, item, dan nilai quotation sudah sesuai sebelum
          disimpan.
        </p>
        <div>
          <v-btn
            size="small"
            variant="outlined"
            color="grey-darken-1"
            class="text-none quotation-cancel-btn"
            @click="data.dialogTambahPenawaran = false"
          >
            Cancel
          </v-btn>
          <v-btn
            size="small"
            color="primary"
            variant="flat"
            class="text-none quotation-save-btn"
            prepend-icon="mdi-content-save-outline"
            @click="simpanPenawaranDialog"
          >
            {{
              data.penawaranAddEdit === "add"
                ? "Save Quotation"
                : data.penawaranAddEdit === "revision"
                  ? "Save Revision"
                  : "Save Changes"
            }}
          </v-btn>
        </div>
      </footer>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {
  reactive,
  ref,
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import moment from "moment";
import Sortable from "sortablejs";
import type { ConfirmationDialog } from "#components";
import type { penawaranM } from "~/types/penawaranModel";
import type { barangM } from "~/types/barangModel";
import type { customerM } from "~/types/customerModel";
import type { masterPicM } from "~/types/masterPicModel";
import type { termconditionM } from "~/types/termconditionModel";
import { queryambilid } from "~/composables/useFirestoreQuery";
import {
  buildCompanyMaster,
  buildLegacyMasterPics,
  mergeMasterPics,
  normalizeCompanyName,
} from "~/utils/customer-master";

type PenawaranDialogMode = "add" | "edit" | "revision";
type QuotationFormSection =
  | "client"
  | "items"
  | "commercial"
  | "terms";

const quotationFormSections = [
  {
    id: "client",
    number: "01",
    title: "Client & Subject",
    description: "Client dan informasi quotation",
  },
  {
    id: "items",
    number: "02",
    title: "Items",
    description: "Item, Qty, UOM, dan harga",
  },
  {
    id: "commercial",
    number: "03",
    title: "Summary",
    description: "Total dan penandatangan quotation",
  },
  {
    id: "terms",
    number: "04",
    title: "Terms & Conditions",
    description: "Ketentuan quotation",
  },
] as const satisfies ReadonlyArray<{
  id: QuotationFormSection;
  number: string;
  title: string;
  description: string;
}>;

const emit = defineEmits<{
  saved: [quotation: penawaranM, mode: PenawaranDialogMode];
}>();

const router = useRouter();
const route = useRoute();
const display = useDisplay();
const customerStore = usecustomerStore();
const masterPicStore = useMasterPicStore();
const termconditionStore = usetermconditionStore();
const barangStore = usebarangStore();
const penawaranStore = usePenawaranStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);
const activeSuggestionIndex = ref<number | null>(null);
const savingCustomer = ref(false);
const activeQuotationSection = ref<QuotationFormSection>("client");

const data = reactive({
  dialogTambahPenawaran: false,
  dialogTambahMasterPerusahaan: false,
  penawaranAddEdit: "add" as PenawaranDialogMode,
  editOriginalTermconditionId: "",
  editOriginalBarangId: "",
});

let dialogDependenciesPromise: Promise<void> | null = null;

function ensureDialogDependencies() {
  if (!dialogDependenciesPromise) {
    dialogDependenciesPromise = Promise.all([
      customerStore.getDataCustomer.length
        ? Promise.resolve()
        : customerStore.tarikDataCustomerAct(),
      masterPicStore.getDataMasterPic.length
        ? Promise.resolve()
        : masterPicStore.tarikDataMasterPicAct(),
      termconditionStore.getDataTermcondition.length
        ? Promise.resolve()
        : termconditionStore.tarikDataTermconditionAct(),
      barangStore.getDataBarang.length
        ? Promise.resolve()
        : barangStore.tarikDataBarangAct(),
    ]).then(() => undefined);
  }

  return dialogDependenciesPromise;
}

onMounted(() => {
  void ensureDialogDependencies();
});

const newCustomer = ref<customerM>(emptyCustomer());

const companies = computed(() => buildCompanyMaster(customerStore.getDataCustomer));
const assignedCompanyId = computed(() => userStore.getIdPerusahaan.trim());
const hasCompanyScope = computed(() => Boolean(assignedCompanyId.value));
const accessibleCompanies = computed(() => {
  if (!assignedCompanyId.value) return companies.value;

  return companies.value.filter(
    (company) =>
      company.id_customer === assignedCompanyId.value ||
      company.sourceIds.includes(assignedCompanyId.value),
  );
});
const legacyMasterPics = computed(() =>
  buildLegacyMasterPics(customerStore.getDataCustomer, companies.value),
);
const allMasterPics = computed(() =>
  mergeMasterPics(
    masterPicStore.getDataMasterPic,
    legacyMasterPics.value,
    companies.value,
  ),
);
const companyOptions = computed(() =>
  accessibleCompanies.value.map((company) => ({
    ...company,
    label: company.nama,
    value: company.id_customer,
  })),
);
const picOptionsForCompany = computed(() =>
  allMasterPics.value
    .filter((pic) => pic.id_perusahaan === newPenawaran.value.id_perusahaan)
    .map((pic) => ({
      ...pic,
      label: pic.pic,
      value: pic.id_master_pic || pic.id,
    })),
);

function emptyCustomer(): customerM {
  return {
    nama: "",
    pic: "",
    alamat: "",
    no_telp: "",
    email: "",
    vessel: "",
    createdAt: 0,
    createdBy: "",
  };
}

function opendialogTambahMasterPerusahaan() {
  newCustomer.value = emptyCustomer();
  data.dialogTambahMasterPerusahaan = true;
}

async function simpanMasterPerusahaan() {
  const customer = newCustomer.value;
  if (!customer.nama.trim())
    return notificationStore.showError("Nama perusahaan tidak boleh kosong");
  if (!customer.alamat.trim())
    return notificationStore.showError("Alamat perusahaan tidak boleh kosong");

  if (
    companies.value.some(
      (item) =>
        normalizeCompanyName(item.nama) === normalizeCompanyName(customer.nama),
    )
  ) {
    return notificationStore.showError("Nama perusahaan sudah terdaftar");
  }

  customer.nama = customer.nama.trim();
  customer.alamat = customer.alamat.trim();
  customer.createdAt = moment().unix();
  customer.createdBy = userStore.getEmail || "";
  savingCustomer.value = true;
  try {
    const saved = await customerStore.addCustomerAct({ ...customer });
    if (!saved) return;
    const savedCustomer = buildCompanyMaster(customerStore.getDataCustomer).find(
      (item) => normalizeCompanyName(item.nama) === normalizeCompanyName(customer.nama),
    );
    if (savedCustomer) applyCompany(savedCustomer, true);
    data.dialogTambahMasterPerusahaan = false;
  } finally {
    savingCustomer.value = false;
  }
}

function barangSesuaiNama(namaItem: string | null | undefined) {
  const query = namaItem?.trim().toLocaleLowerCase("id-ID") ?? "";
  if (!query) return [];

  return barangStore.getDataBarang.filter((barang) =>
    barang.nama_barang.toLocaleLowerCase("id-ID").includes(query),
  );
}

function emptyPenawaran(): penawaranM {
  const generatedNo = generateNoPenawaran();
  return {
    no_penawaran: generatedNo,
    id_perusahaan: "",
    id_pic: "",
    pic: "",
    vessel: "",
    nama_perusahaan: "",
    alamat_perusahaan: "",
    no_telp: "",
    email: "",
    location: "",
    tanggal_penawaran: moment().format("YYYY-MM-DD"),
    created_at: 0,
    created_by: "",
    sign_by: "Seilla Maryana",
    status: "Draft",
    perihal: "",
    currency: "IDR",
    penawaran_item: [
      {
        nama: "",
        qty: 1,
        uom: "Unit",
        kategori_item: "Barang",
        amount: 0,
        subtotal_item: 0,
        harga_hpp: 0,
      },
    ],
    subtotal_penawaran: 0,
    discount_penawaran: 0,
    grand_total_penawaran: 0,
    terbilang: "",
    termCondition: [],
  };
}

function formatCurrency(value: number | null | undefined, currency?: string) {
  const code = currency === "USD" || currency === "SGD" ? currency : "IDR";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: code,
    maximumFractionDigits: code === "IDR" ? 0 : 2,
  }).format(Number(value) || 0);
}

function currencyLabel(currency?: string) {
  switch (currency) {
    case "USD":
      return "USD";
    case "SGD":
      return "SGD";
    default:
      return "IDR";
  }
}

type TermConditionOrderItem = { id?: string; nama_term: string };

const termConditionOrder = ref<string[]>([]);

function termConditionKey(term: TermConditionOrderItem) {
  return term.id
    ? `id:${term.id}`
    : `name:${normalizeTermCondition(term.nama_term).toLocaleLowerCase("id-ID")}`;
}

function orderTermConditions<T extends TermConditionOrderItem>(terms: T[]) {
  const orderIndex = new Map(
    termConditionOrder.value.map((key, index) => [key, index]),
  );

  return [...terms].sort((left, right) => {
    const leftIndex = orderIndex.get(termConditionKey(left));
    const rightIndex = orderIndex.get(termConditionKey(right));

    if (leftIndex !== undefined && rightIndex !== undefined) {
      return leftIndex - rightIndex;
    }
    if (leftIndex !== undefined) return -1;
    if (rightIndex !== undefined) return 1;
    return left.nama_term.localeCompare(right.nama_term, "id-ID");
  });
}

const selectedTermConditions = computed(
  () => newPenawaran.value.termCondition ?? [],
);

const availableTermConditions = computed(() => {
  const search = normalizeTermCondition(
    termConditionSearch.value,
  ).toLocaleLowerCase("id-ID");

  return orderTermConditions(
    termconditionStore.getDataTermcondition.filter(
      (term) =>
        !isTermConditionSelected(term) &&
        normalizeTermCondition(term.nama_term)
          .toLocaleLowerCase("id-ID")
          .includes(search),
    ),
  );
});

function generateNoPenawaran(): string {
  const year = moment().format("YYYY");
  const pattern = new RegExp(`^QT/ICI/${year}/DRM/(\\d{5})$`);
  const lastSequence = (penawaranStore.getDataPenawaran || []).reduce(
    (highest, penawaran) => {
      const match = penawaran.no_penawaran?.match(pattern);
      return match ? Math.max(highest, Number(match[1])) : highest;
    },
    0,
  );

  return `QT/DRM/${year}/${String(lastSequence + 1).padStart(5, "0")}`;
}

const newPenawaran = ref<penawaranM>(emptyPenawaran());

const quotationItemsHaveContent = computed(() => {
  const items = newPenawaran.value.penawaran_item || [];
  if (items.length > 1) return true;

  return items.some((item) => {
    const description = String(item.nama || "").trim();
    const qty = Number(item.qty);
    const amount = Number(item.amount);
    const cost = Number(item.harga_hpp);
    const uom = String(item.uom || "").trim();
    const category = String(item.kategori_item || "").trim();

    return Boolean(
      description ||
        (Number.isFinite(qty) && qty !== 1) ||
        (Number.isFinite(amount) && amount > 0) ||
        (Number.isFinite(cost) && cost > 0)
    );
  });
});

const quotationDialogPersistent = computed(() => {
  // Edit dan revisi selalu membawa data tersimpan, sehingga perilaku lama
  // tetap dipertahankan. Pada Create, kunci dialog hanya setelah item mulai
  // diisi agar dialog kosong tetap mudah ditutup.
  if (data.penawaranAddEdit !== "add") return true;
  return quotationItemsHaveContent.value;
});
const revisionSourcePenawaran = ref<penawaranM | null>(null);
const termConditionSearch = ref("");
const savingTermCondition = ref(false);
const customMarkupPercentages = ref<Record<string, string | number>>({});
const quotationItemsSortableContainer = ref<HTMLElement | null>(null);
const termConditionsSortableContainer = ref<HTMLTableSectionElement | null>(
  null,
);
const quotationItemKeys = new WeakMap<object, string>();
let quotationItemKeySequence = 0;
let quotationItemsSortable: Sortable | null = null;
let termConditionsSortable: Sortable | null = null;

function quotationItemKey(item: penawaranM["penawaran_item"][number]) {
  const existingKey = quotationItemKeys.get(item);
  if (existingKey) return existingKey;

  quotationItemKeySequence += 1;
  const key = `quotation-item-${quotationItemKeySequence}`;
  quotationItemKeys.set(item, key);
  return key;
}

function normalizeTermCondition(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

const existingTermCondition = computed(() => {
  const search = normalizeTermCondition(
    termConditionSearch.value,
  ).toLocaleLowerCase("id-ID");
  if (!search) return undefined;

  return termconditionStore.getDataTermcondition.find(
    (term) =>
      normalizeTermCondition(term.nama_term).toLocaleLowerCase("id-ID") ===
      search,
  );
});

const searchedTermConditionIsSelected = computed(() => {
  const existingTerm = existingTermCondition.value;
  return existingTerm ? isTermConditionSelected(existingTerm) : false;
});

const canAddTermCondition = computed(
  () =>
    Boolean(normalizeTermCondition(termConditionSearch.value)) &&
    !existingTermCondition.value &&
    !savingTermCondition.value,
);

async function tambahTermConditionDariPencarian() {
  if (savingTermCondition.value) return;

  const termName = normalizeTermCondition(termConditionSearch.value);
  if (!termName) {
    return notificationStore.showError("Term & Condition tidak boleh kosong");
  }
  if (existingTermCondition.value) {
    return notificationStore.showInfo("Term & Condition sudah ada di master");
  }

  savingTermCondition.value = true;
  try {
    const payload: termconditionM = {
      nama_term: termName,
      createdAt: moment().unix(),
      createdBy: userStore.getEmail,
    };
    await termconditionStore.addTermconditionAct(payload);

    const normalizedName = termName.toLocaleLowerCase("id-ID");
    const addedTerm = termconditionStore.getDataTermcondition.find(
      (term) =>
        normalizeTermCondition(term.nama_term).toLocaleLowerCase("id-ID") ===
        normalizedName,
    );
    if (!addedTerm) return;

    const addedTermKey = termConditionKey(addedTerm);
    if (!termConditionOrder.value.includes(addedTermKey)) {
      termConditionOrder.value.push(addedTermKey);
    }

    newPenawaran.value.termCondition ??= [];
    const selectedTerm = {
      id: addedTerm.id ?? "",
      nama_term: addedTerm.nama_term,
    };
    if (
      !newPenawaran.value.termCondition.some((term) =>
        sameTermCondition(term, selectedTerm),
      )
    ) {
      newPenawaran.value.termCondition.push(selectedTerm);
    }
    rebuildTermConditionOrderFromSelection();
    termConditionSearch.value = "";
  } finally {
    savingTermCondition.value = false;
  }
}

function sameTermCondition(
  left: NonNullable<penawaranM["termCondition"]>[number],
  right: NonNullable<penawaranM["termCondition"]>[number],
) {
  return left.id && right.id
    ? left.id === right.id
    : left.nama_term === right.nama_term;
}

function isTermConditionSelected(term: TermConditionOrderItem) {
  const comparableTerm = {
    id: term.id ?? "",
    nama_term: term.nama_term,
  };

  return (newPenawaran.value.termCondition ?? []).some((selectedTerm) =>
    sameTermCondition(selectedTerm, comparableTerm),
  );
}

function initializeTermConditionOrder() {
  const availableTerms = [...termconditionStore.getDataTermcondition].sort(
    (left, right) => left.nama_term.localeCompare(right.nama_term, "id-ID"),
  );
  const availableKeys = new Set(availableTerms.map(termConditionKey));
  const selectedKeys = (newPenawaran.value.termCondition ?? [])
    .map(termConditionKey)
    .filter((key, index, keys) => {
      return availableKeys.has(key) && keys.indexOf(key) === index;
    });
  const selectedKeySet = new Set(selectedKeys);

  termConditionOrder.value = [
    ...selectedKeys,
    ...availableTerms
      .map(termConditionKey)
      .filter((key) => !selectedKeySet.has(key)),
  ];
}

function rebuildTermConditionOrderFromSelection() {
  const selectedKeys = (newPenawaran.value.termCondition ?? [])
    .map(termConditionKey)
    .filter((key, index, keys) => keys.indexOf(key) === index);
  const availableKeys = orderTermConditions(
    termconditionStore.getDataTermcondition.filter(
      (term) => !isTermConditionSelected(term),
    ),
  ).map(termConditionKey);

  termConditionOrder.value = [
    ...selectedKeys,
    ...availableKeys.filter((key) => !selectedKeys.includes(key)),
  ];
}

function scheduleTermConditionSelectionSync() {
  void nextTick(rebuildTermConditionOrderFromSelection);
}

function moveQuotationItem(fromIndex: number, toIndex: number) {
  const items = newPenawaran.value.penawaran_item;
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return;
  }

  const [movedItem] = items.splice(fromIndex, 1);
  if (!movedItem) return;
  items.splice(toIndex, 0, movedItem);
  activeSuggestionIndex.value = null;
}

function moveTermCondition(fromIndex: number, toIndex: number) {
  const selectedTerms = newPenawaran.value.termCondition ?? [];
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= selectedTerms.length ||
    toIndex >= selectedTerms.length
  ) {
    return;
  }

  const [movedTerm] = selectedTerms.splice(fromIndex, 1);
  if (!movedTerm) return;
  selectedTerms.splice(toIndex, 0, movedTerm);
  rebuildTermConditionOrderFromSelection();
}

function sortableEventIndexes(event: Sortable.SortableEvent) {
  return {
    fromIndex: event.oldDraggableIndex ?? event.oldIndex,
    toIndex: event.newDraggableIndex ?? event.newIndex,
  };
}

function destroyQuotationSortables() {
  quotationItemsSortable?.destroy();
  termConditionsSortable?.destroy();
  quotationItemsSortable = null;
  termConditionsSortable = null;
}

function initializeQuotationSortables() {
  destroyQuotationSortables();

  if (quotationItemsSortableContainer.value) {
    quotationItemsSortable = new Sortable(
      quotationItemsSortableContainer.value,
      {
        animation: 160,
        draggable: ".quotation-line-item",
        handle: ".quotation-item-drag-handle",
        ghostClass: "quotation-sortable-ghost",
        chosenClass: "quotation-sortable-chosen",
        dragClass: "quotation-sortable-drag",
        delay: 120,
        delayOnTouchOnly: true,
        touchStartThreshold: 4,
        forceFallback: true,
        fallbackOnBody: true,
        fallbackTolerance: 3,
        scroll: true,
        onEnd(event) {
          const { fromIndex, toIndex } = sortableEventIndexes(event);
          if (fromIndex === undefined || toIndex === undefined) return;
          moveQuotationItem(fromIndex, toIndex);
        },
      },
    );
  }

  if (termConditionsSortableContainer.value) {
    termConditionsSortable = new Sortable(
      termConditionsSortableContainer.value,
      {
        animation: 160,
        draggable: ".quotation-term-row",
        handle: ".quotation-term-drag-handle",
        ghostClass: "quotation-sortable-ghost",
        chosenClass: "quotation-sortable-chosen",
        dragClass: "quotation-sortable-drag",
        delay: 120,
        delayOnTouchOnly: true,
        touchStartThreshold: 4,
        forceFallback: true,
        fallbackOnBody: true,
        fallbackTolerance: 3,
        scroll: true,
        onEnd(event) {
          const { fromIndex, toIndex } = sortableEventIndexes(event);
          if (fromIndex === undefined || toIndex === undefined) return;
          moveTermCondition(fromIndex, toIndex);
        },
      },
    );
  }
}

watch(
  () => data.dialogTambahPenawaran,
  async (isOpen) => {
    destroyQuotationSortables();
    if (!isOpen) return;

    await nextTick();
    initializeQuotationSortables();
  },
  { flush: "post" },
);

onBeforeUnmount(destroyQuotationSortables);
const subtotalPenawaran = computed(() =>
  newPenawaran.value.penawaran_item.reduce(
    (total, item) =>
      total + (Number(item.qty) || 0) * (Number(item.amount) || 0),
    0,
  ),
);
const discountPercentPenawaran = computed({
  get: () =>
    Math.min(
      100,
      Math.max(0, Number(newPenawaran.value.discount_penawaran) || 0),
    ),
  set: (value: number) => {
    newPenawaran.value.discount_penawaran = Math.min(
      100,
      Math.max(0, Number(value) || 0),
    );
  },
});
const discountAmountPenawaran = computed({
  get: () => {
    const amount =
      (subtotalPenawaran.value * discountPercentPenawaran.value) / 100;
    return newPenawaran.value.currency === "IDR"
      ? Math.round(amount)
      : Math.round(amount * 100) / 100;
  },
  set: (value: number) => {
    const amount = Math.min(
      subtotalPenawaran.value,
      Math.max(0, Number(value) || 0),
    );
    discountPercentPenawaran.value =
      subtotalPenawaran.value > 0
        ? (amount / subtotalPenawaran.value) * 100
        : 0;
  },
});
const currencyInputPrefix = computed(() => {
  switch (newPenawaran.value.currency) {
    case "USD":
      return "US$";
    case "SGD":
      return "S$";
    default:
      return "Rp";
  }
});
const discountAmountInput = ref("");
const isEditingDiscountAmount = ref(false);

function formatDiscountAmount(value: number) {
  const isIdr = newPenawaran.value.currency === "IDR";
  const locale = isIdr
    ? "id-ID"
    : newPenawaran.value.currency === "SGD"
      ? "en-SG"
      : "en-US";
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: isIdr ? 0 : 2,
    maximumFractionDigits: isIdr ? 0 : 2,
  }).format(value);
}

function parseDiscountAmount(value: string) {
  const numericValue =
    newPenawaran.value.currency === "IDR"
      ? value.replace(/\D/g, "")
      : value.replace(/,/g, "").replace(/[^\d.]/g, "");
  return Number(numericValue) || 0;
}

function startEditingDiscountAmount() {
  isEditingDiscountAmount.value = true;
  discountAmountInput.value =
    newPenawaran.value.currency === "IDR"
      ? formatDiscountAmount(discountAmountPenawaran.value)
      : String(discountAmountPenawaran.value);
}

function finishEditingDiscountAmount() {
  isEditingDiscountAmount.value = false;
  discountAmountInput.value = formatDiscountAmount(
    discountAmountPenawaran.value,
  );
}

watch(discountAmountInput, (value) => {
  if (isEditingDiscountAmount.value) {
    discountAmountPenawaran.value = parseDiscountAmount(value);
  }
});

watch(
  [discountAmountPenawaran, () => newPenawaran.value.currency],
  ([amount]) => {
    if (
      !isEditingDiscountAmount.value ||
      newPenawaran.value.currency === "IDR"
    ) {
      discountAmountInput.value = formatDiscountAmount(amount);
    }
  },
  { immediate: true },
);

const grandTotalPenawaran = computed(() =>
  Math.max(0, subtotalPenawaran.value - discountAmountPenawaran.value),
);

const syncingClientSelection = ref(false);

function clearPicSelection() {
  newPenawaran.value.id_pic = "";
  newPenawaran.value.pic = "";
  newPenawaran.value.no_telp = "";
  newPenawaran.value.email = "";
}

function applyCompany(customer: customerM, resetPic = false) {
  newPenawaran.value.id_perusahaan = customer.id_customer || customer.id || "";
  newPenawaran.value.nama_perusahaan = customer.nama;
  newPenawaran.value.alamat_perusahaan = customer.alamat;
  if (resetPic) clearPicSelection();
}

function applyMasterPic(pic: masterPicM) {
  newPenawaran.value.id_pic = pic.id_master_pic || pic.id || "";
  newPenawaran.value.pic = pic.pic;
  newPenawaran.value.no_telp = pic.no_telp;
  newPenawaran.value.email = pic.email;
}

watch(
  () => newPenawaran.value.id_perusahaan,
  (idCustomer) => {
    if (syncingClientSelection.value) return;
    if (!idCustomer) {
      newPenawaran.value.nama_perusahaan = "";
      newPenawaran.value.alamat_perusahaan = "";
      clearPicSelection();
      return;
    }
    const company = companies.value.find(
      (item) =>
        item.id_customer === idCustomer || item.sourceIds.includes(idCustomer),
    );
    if (!company) return;
    applyCompany(company, true);
  },
);

watch(
  () => newPenawaran.value.id_pic,
  (idPic) => {
    if (syncingClientSelection.value) return;
    if (!idPic) {
      clearPicSelection();
      return;
    }
    const pic = allMasterPics.value.find(
      (item) => (item.id_master_pic || item.id) === idPic,
    );
    if (pic) applyMasterPic(pic);
  },
);
function openDialogTambahPenawaran() {
  data.penawaranAddEdit = "add";
  activeQuotationSection.value = "client";
  revisionSourcePenawaran.value = null;
  data.editOriginalTermconditionId = "";
  termConditionSearch.value = "";
  customMarkupPercentages.value = {};
  newPenawaran.value = emptyPenawaran();
  if (assignedCompanyId.value) {
    const assignedCompany = accessibleCompanies.value[0];
    if (assignedCompany) applyCompany(assignedCompany, true);
  }
  initializeTermConditionOrder();
  data.dialogTambahPenawaran = true;
}

function openDialogEditPenawaran(item: penawaranM) {
  revisionSourcePenawaran.value = null;
  activeQuotationSection.value = "client";
  const company =
    companies.value.find(
      (candidate) =>
        candidate.id_customer === item.id_perusahaan ||
        candidate.sourceIds.includes(item.id_perusahaan),
    ) ??
    companies.value.find(
      (candidate) =>
        normalizeCompanyName(candidate.nama) ===
        normalizeCompanyName(item.nama_perusahaan),
    );

  syncingClientSelection.value = true;
  const penawaran = JSON.parse(JSON.stringify(item)) as penawaranM;
  penawaran.termCondition ??= [];
  penawaran.id_pic ??= "";
  newPenawaran.value = penawaran;
  if (company) {
    applyCompany(company);
    const selectedPic =
      allMasterPics.value.find(
        (pic) => (pic.id_master_pic || pic.id) === item.id_pic,
      ) ??
      allMasterPics.value.find(
        (pic) =>
          pic.id_perusahaan === company.id_customer &&
          pic.pic.trim().toLocaleLowerCase("id-ID") ===
            (item.pic || "").trim().toLocaleLowerCase("id-ID"),
      );
    if (selectedPic) applyMasterPic(selectedPic);
  }
  nextTick(() => {
    syncingClientSelection.value = false;
  });

  data.penawaranAddEdit = "edit";
  termConditionSearch.value = "";
  customMarkupPercentages.value = {};
  initializeTermConditionOrder();
  data.dialogTambahPenawaran = true;
}

function openDialogRevisiPenawaran(item: penawaranM) {
  const source = JSON.parse(JSON.stringify(item)) as penawaranM;
  openDialogEditPenawaran(item);

  const revisionDraft = JSON.parse(
    JSON.stringify(newPenawaran.value),
  ) as penawaranM;
  delete revisionDraft.id;
  delete revisionDraft.id_penawaran;
  delete revisionDraft.id_invoice;
  delete revisionDraft.id_revisi;
  delete revisionDraft.no_revisi;
  delete revisionDraft.updated_at;
  delete revisionDraft.updated_by;
  delete revisionDraft.revision_count;
  delete revisionDraft.active_revision_id;
  delete revisionDraft.active_revision_number;
  delete revisionDraft.materialized_revision_id;
  delete revisionDraft.materialized_revision_number;
  delete revisionDraft.terkirim_at;
  delete revisionDraft.terkirim_by;
  delete revisionDraft.tanggal_kirim_penawaran;
  delete revisionDraft.spk_at;
  delete revisionDraft.spk_by;
  delete revisionDraft.tanggal_spk;
  delete revisionDraft.dokumen_spk;
  delete revisionDraft.pengeluaran;
  delete revisionDraft.grandtotal_pengeluaran;
  revisionDraft.created_at = 0;
  revisionDraft.created_by = "";
  revisionDraft.status = "Draft";

  revisionSourcePenawaran.value = source;
  newPenawaran.value = revisionDraft;
  data.penawaranAddEdit = "revision";
}

async function openRequestedRevisionFromRoute() {
  const requestedRevision = Array.isArray(route.query.revisi)
    ? route.query.revisi[0]
    : route.query.revisi;
  if (!requestedRevision) return;

  let source = [
    ...penawaranStore.getDataPenawaranTampil,
    ...penawaranStore.getDataPenawaran,
  ].find(
    (item) =>
      (item.id || item.id_penawaran) === String(requestedRevision),
  );

  const requestedSourceRevision = Array.isArray(route.query.dari_revisi)
    ? route.query.dari_revisi[0]
    : route.query.dari_revisi;
  if (source && requestedSourceRevision) {
    const rootId = source.id || source.id_penawaran!;
    const revisions = (await queryambilid(
      `penawaran/${rootId}/revisi_penawaran`,
    )) as penawaranM[];
    const selectedSourceRevision = revisions.find(
      (revision) => revision.id === String(requestedSourceRevision),
    );
    if (selectedSourceRevision) {
      source = {
        ...source,
        ...selectedSourceRevision,
        id: rootId,
        id_penawaran: rootId,
        id_revisi: selectedSourceRevision.id,
        root_penawaran_id: rootId,
      };
    }
  }

  const nextQuery = { ...route.query };
  delete nextQuery.revisi;
  delete nextQuery.dari_revisi;
  await router.replace({ path: route.path, query: nextQuery });

  if (!source) {
    notificationStore.showError("Penawaran sumber revisi tidak ditemukan");
    return;
  }
  openDialogRevisiPenawaran(source);
}

function tambahBarisPenawaran() {
  newPenawaran.value.penawaran_item.push({
    nama: "",
    amount: 0,
    uom: "Unit",
    kategori_item: "Barang",
    qty: 1,
    subtotal_item: 0,
    harga_hpp: 0,
  });
}

function setKategoriItem(
  item: { kategori_item: string },
  kategori: string,
  checked: boolean,
) {
  if (checked) item.kategori_item = kategori;
}

function terapkanMarkup(
  item: { harga_hpp?: number; amount: number },
  persentase: number,
) {
  const hargaHpp = Number(item.harga_hpp) || 0;
  if (hargaHpp <= 0) return;

  item.amount = hargaHpp * (1 + persentase / 100);
}

function isMarkupActive(
  item: { harga_hpp?: number; amount: number },
  persentase: number,
) {
  const hargaHpp = Number(item.harga_hpp) || 0;
  const amount = Number(item.amount) || 0;
  if (hargaHpp <= 0 || amount <= 0) return false;

  const expectedAmount = hargaHpp * (1 + persentase / 100);
  return Math.abs(amount - expectedAmount) < 0.000001;
}

function customMarkupPercentage(
  item: penawaranM["penawaran_item"][number],
) {
  const rawValue = customMarkupPercentages.value[quotationItemKey(item)];
  if (rawValue === undefined || String(rawValue).trim() === "") return NaN;
  return Number(String(rawValue).trim().replace(",", "."));
}

function canApplyCustomMarkup(
  item: penawaranM["penawaran_item"][number],
) {
  const percentage = customMarkupPercentage(item);
  return (
    Number(item.harga_hpp) > 0 &&
    Number.isFinite(percentage) &&
    percentage >= 0
  );
}

function terapkanMarkupManual(
  item: penawaranM["penawaran_item"][number],
) {
  if (!canApplyCustomMarkup(item)) {
    return notificationStore.showError(
      "Isi persentase markup manual dengan angka 0 atau lebih",
    );
  }

  terapkanMarkup(item, customMarkupPercentage(item));
}

async function hapusBarisPenawaran(index: number) {
  if (newPenawaran.value.penawaran_item.length === 1) {
    return notificationStore.showError("Minimal harus ada 1 baris item");
  }

  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus Item",
    `Yakin ingin menghapus item #${index + 1}?`,
    { confirmText: "Hapus", variant: "danger" },
  );
  if (!confirmed) return;

  const itemToDelete = newPenawaran.value.penawaran_item[index];
  if (itemToDelete) {
    delete customMarkupPercentages.value[quotationItemKey(itemToDelete)];
  }
  newPenawaran.value.penawaran_item.splice(index, 1);
}

async function sinkronkanBarangDariPenawaran(
  penawaranItems: penawaranM["penawaran_item"],
) {
  const barangUntukDisinkronkan = new Map<
    string,
    { namaBarang: string; hargaHpp: number }
  >();

  for (const item of penawaranItems) {
    const namaBarang = item.nama?.trim();
    const hargaHpp = Number(item.harga_hpp) || 0;
    if (!namaBarang || hargaHpp <= 0) continue;

    barangUntukDisinkronkan.set(namaBarang.toLocaleLowerCase("id-ID"), {
      namaBarang,
      hargaHpp,
    });
  }

  const barangLamaByName = new Map(
    barangStore.getDataBarang.map((barang) => [
      barang.nama_barang.trim().toLocaleLowerCase("id-ID"),
      barang,
    ]),
  );

  const operations = [...barangUntukDisinkronkan.entries()].map(
    async ([normalizedName, { namaBarang, hargaHpp }]) => {
      const barangLama = barangLamaByName.get(normalizedName);

      if (barangLama) {
        if (Number(barangLama.harga_hpp) !== hargaHpp && barangLama.id) {
          await updatedatabase("barang", barangLama.id, {
            ...barangLama,
            harga_hpp: hargaHpp,
          });
        }
        return;
      }

      const barangBaru: barangM = {
        nama_barang: namaBarang,
        harga_hpp: hargaHpp,
        createdAt: moment().unix(),
        createdBy: userStore.getEmail,
      };
      await tambahdatabase("barang", barangBaru);
    },
  );

  if (!operations.length) return;
  await Promise.all(operations);
  await barangStore.tarikDataBarangAct();
}

function sinkronkanBarangDiLatarBelakang(
  penawaranItems: penawaranM["penawaran_item"],
) {
  void sinkronkanBarangDariPenawaran(penawaranItems).catch((error) => {
    console.error("Gagal menyinkronkan master barang:", error);
    notificationStore.showError(
      "Penawaran tersimpan, tetapi master barang gagal disinkronkan",
    );
  });
}

async function simpanPenawaranDialog() {
  if (!newPenawaran.value.id_perusahaan) {
    return notificationStore.showError("Perusahaan belum dipilih");
  }
  if (!(newPenawaran.value.pic || "").trim()) {
    return notificationStore.showError("PIC belum dipilih");
  }
  if (!(newPenawaran.value.vessel || "").trim()) {
    return notificationStore.showError("Vessel wajib diisi");
  }
  if (
    !newPenawaran.value.tanggal_penawaran ||
    !newPenawaran.value.perihal.trim()
  ) {
    return notificationStore.showError("Location wajib diisi");
  }

  if (!newPenawaran.value.location || !newPenawaran.value.location.trim()) {
    return notificationStore.showError("Location wajib diisi");
  }

  // if (
  //   !newPenawaran.value.penawaran_item.length ||
  //   newPenawaran.value.penawaran_item.some(
  //     (item) => !item.nama || item.qty <= 0 || item.amount <= 0,
  //   )
  // )
  // {
  //   return notificationStore.showError("Setiap item harus dilengkapi");
  // }

  newPenawaran.value.penawaran_item.forEach((item) => {
    item.harga_hpp = Number(item.harga_hpp) || 0;
    item.subtotal_item = Number(item.qty) * Number(item.amount);
  });
  newPenawaran.value.discount_penawaran = discountPercentPenawaran.value;
  newPenawaran.value.subtotal_penawaran = subtotalPenawaran.value;
  newPenawaran.value.grand_total_penawaran = grandTotalPenawaran.value;
  newPenawaran.value.terbilang = terbilang(grandTotalPenawaran.value);

  if (data.penawaranAddEdit === "add") {
    newPenawaran.value.no_penawaran ||= generateNoPenawaran();
    newPenawaran.value.id_penawaran =
      newPenawaran.value.no_penawaran.replaceAll("/", "-");
    newPenawaran.value.created_at = moment().unix();
    newPenawaran.value.created_by = userStore.getEmail;
    useloadingStore().setLoading(true);
    const result = await setPenawaran(newPenawaran.value);
    if (result.status !== "ok") {
      useloadingStore().setLoading(false);
      notificationStore.showError(result.message);
      return;
    }

    penawaranStore.upsertPenawaranLocal(result.data);
    data.dialogTambahPenawaran = false;
    newPenawaran.value = emptyPenawaran();
    useloadingStore().setLoading(false);
    notificationStore.showSuccess("Penawaran berhasil disimpan");
    sinkronkanBarangDiLatarBelakang(result.data.penawaran_item);
    emit("saved", result.data, "add");
    return;
  }

  if (data.penawaranAddEdit === "revision") {
    const source = revisionSourcePenawaran.value;
    if (!source) {
      return notificationStore.showError("Sumber revisi tidak ditemukan");
    }

    const revisionDraft = JSON.parse(
      JSON.stringify(newPenawaran.value),
    ) as penawaranM;
    const savedRevision = await penawaranStore.addRevisionPenawaranAct(
      source,
      revisionDraft,
    );
    if (!savedRevision) return;

    data.dialogTambahPenawaran = false;
    revisionSourcePenawaran.value = null;
    newPenawaran.value = emptyPenawaran();
    sinkronkanBarangDiLatarBelakang(savedRevision.penawaran_item);
    emit("saved", savedRevision, "revision");
    return;
  }

  const updatedPenawaran = JSON.parse(
    JSON.stringify(newPenawaran.value),
  ) as penawaranM;
  const updated = await penawaranStore.updatePenawaranAct(updatedPenawaran);
  if (!updated) return;

  data.dialogTambahPenawaran = false;
  newPenawaran.value = emptyPenawaran();
  sinkronkanBarangDiLatarBelakang(updatedPenawaran.penawaran_item);
  emit("saved", updatedPenawaran, "edit");
}

defineExpose({
  async openAdd() {
    await ensureDialogDependencies();
    openDialogTambahPenawaran();
  },
  async openEdit(item: penawaranM) {
    await ensureDialogDependencies();
    openDialogEditPenawaran(item);
  },
  async openRevision(item: penawaranM) {
    await ensureDialogDependencies();
    openDialogRevisiPenawaran(item);
  },
  async openRequestedRevision() {
    await ensureDialogDependencies();
    await openRequestedRevisionFromRoute();
  },
});
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

.signature-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.signature-line {
  width: 180px;
  border-bottom: 1px solid #737b86;
  margin-top: -2px;
}

.signature-name {
  margin-top: 7px;
  font-size: 11px;
  font-weight: 600;
  color: #303740;
  text-align: center;
}

/* Quotation form dialog */
.quotation-dialog-card {
  display: flex;
  height: 92vh;
  height: 92dvh;
  min-height: 92vh;
  min-height: 92dvh;
  max-height: 92vh;
  max-height: 92dvh;
  flex-direction: column;
  color: #1f2937;
  background: #f5f6f8;
  border: 1px solid #d9dee5;
  border-radius: 10px !important;
  overflow: hidden;
}

.quotation-dialog-workspace {
  display: flex !important;
  min-height: 0;
  padding: 0 !important;
  overflow: hidden !important;
  flex: 1 1 auto;
  background: #f5f6f8;
}

.quotation-dialog-menu {
  display: flex;
  flex: 0 0 208px;
  width: 208px;
  padding: 18px 12px;
  flex-direction: column;
  gap: 6px;
  background: #fbfcfd;
  border-right: 1px solid #dce2e8;
}

.quotation-dialog-menu-label {
  margin: 0 8px 8px;
  color: #8793a0;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.quotation-dialog-menu-item {
  position: relative;
  display: grid;
  min-height: 38px;
  padding: 8px;
  grid-template-columns: minmax(0, 1fr) 18px;
  align-items: center;
  gap: 7px;
  color: #657382;
  font: inherit;
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition:
    color 0.16s ease,
    background-color 0.16s ease,
    border-color 0.16s ease;
}

.quotation-dialog-menu-item:hover {
  color: #354b60;
  background: #f2f6f9;
}

.quotation-dialog-menu-item--active {
  color: #255d91;
  background: #edf4fa;
  border-color: #d5e3ef;
}

.quotation-dialog-menu-item--active::before {
  position: absolute;
  top: 9px;
  bottom: 9px;
  left: -13px;
  width: 3px;
  background: #2f6fa8;
  border-radius: 0 3px 3px 0;
  content: "";
}

.quotation-dialog-menu-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.quotation-dialog-menu-copy strong,
.quotation-dialog-menu-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quotation-dialog-menu-copy strong {
  color: currentColor;
  font-size: 11px;
  font-weight: 700;
}

.quotation-dialog-menu-copy small {
  margin-top: 2px;
  color: #909aa4;
  font-size: 8px;
}

.quotation-dialog-menu-arrow {
  color: #a4adb6;
}

.quotation-dialog-menu-item--active .quotation-dialog-menu-arrow {
  color: #4f7ca6;
}

.quotation-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 72px;
  padding: 14px 20px;
  background: #ffffff;
  border-bottom: 1px solid #dfe3e8;
}

.quotation-dialog-heading,
.quotation-dialog-header-actions,
.quotation-dialog-heading > div:last-child {
  display: flex;
  align-items: center;
  min-width: 0;
}

.quotation-dialog-heading {
  gap: 12px;
}

.quotation-dialog-heading > div:last-child {
  align-items: flex-start;
  flex-direction: column;
}

.quotation-dialog-heading h2 {
  margin: 0;
  color: #202833;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
}

.quotation-dialog-heading p {
  max-width: 520px;
  margin: 2px 0 0;
  overflow: hidden;
  color: #7a8491;
  font-size: 11px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quotation-dialog-icon {
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

.quotation-dialog-header-actions {
  flex: 0 0 auto;
  gap: 8px;
}

.quotation-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 26px;
  padding: 0 10px;
  color: #586474;
  font-size: 11px;
  font-weight: 600;
  background: #f7f8fa;
  border: 1px solid #dfe3e8;
  border-radius: 4px;
}

.quotation-status-dot {
  width: 6px;
  height: 6px;
  background: #d8972e;
  border-radius: 50%;
}

.quotation-dialog-body {
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  padding: 18px !important;
  background: #ffffff;
}

.quotation-dialog-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.quotation-form-section {
  padding: 22px 24px;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.quotation-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.quotation-section-header > div {
  display: flex;
  align-items: center;
  gap: 9px;
}

.quotation-section-header h3 {
  margin: 0;
  color: #27313d;
  font-size: 13px;
  font-weight: 700;
  line-height: 22px;
}

.quotation-section-header p {
  margin: 3px 0 0;
  color: #8a939f;
  font-size: 10px;
  line-height: 1.5;
  text-align: right;
}

.quotation-section-index {
  display: inline-grid;
  width: 24px;
  height: 22px;
  place-items: center;
  color: #566575;
  font-size: 9px;
  font-weight: 700;
  background: #f1f3f5;
  border: 1px solid #e0e4e8;
  border-radius: 4px;
}

.quotation-client-section {
  padding-bottom: 26px;
}

.quotation-client-heading {
  display: flex;
  margin-bottom: 20px;
  padding-bottom: 14px;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid #e6e9ed;
}

.quotation-client-heading > div {
  min-width: 0;
}

.quotation-client-heading span {
  display: block;
  margin-bottom: 4px;
  color: #8a939f;
  font-size: 8.5px;
  font-weight: 750;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.quotation-client-heading h3 {
  margin: 0;
  color: #27313d;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
}

.quotation-client-heading p {
  max-width: 320px;
  margin: 0;
  color: #87919d;
  font-size: 10px;
  line-height: 1.45;
  text-align: right;
}

.quotation-client-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 250px;
  align-items: start;
  gap: 20px;
}

.quotation-client-form-column {
  min-width: 0;
}

.quotation-client-picker {
  display: grid;
  grid-template-columns: minmax(180px, 1.2fr) minmax(150px, 0.9fr) 164px;
  align-items: flex-end;
  gap: 10px;
}

.quotation-date-field {
  min-width: 0;
}

.quotation-client-select {
  flex: 1 1 auto;
  min-width: 0;
}

.quotation-add-client-btn {
  flex: 0 0 auto;
  height: 32px !important;
  padding-inline: 13px !important;
  font-size: 11px !important;
  letter-spacing: 0 !important;
  border-radius: 4px !important;
}

.quotation-client-master-actions {
  display: flex;
  margin: 7px 0 16px;
  align-items: center;
  gap: 4px;
}

.quotation-subject-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 145px;
  align-items: start;
  gap: 10px;
}

.quotation-subject-field {
  min-width: 0;
}

.quotation-operation-block {
  margin-top: 18px;
  padding-top: 15px;
  border-top: 1px solid #e7eaee;
}

.quotation-operation-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
}

.quotation-operation-heading strong {
  color: #3d4855;
  font-size: 10.5px;
  font-weight: 700;
}

.quotation-operation-heading span {
  color: #929ba6;
  font-size: 9px;
  line-height: 1.4;
  text-align: right;
}

.quotation-operation-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 9px;
}

.quotation-client-summary {
  overflow: hidden;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  background: #fafbfc;
}

.quotation-client-summary-heading {
  display: flex;
  min-height: 62px;
  padding: 12px 13px;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #e5e8ec;
  background: #ffffff;
}

.quotation-client-summary-heading > span {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  place-items: center;
  border: 1px solid #dce3e9;
  border-radius: 7px;
  background: #f0f4f7;
  color: #4d6072;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.quotation-client-summary-heading > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.quotation-client-summary-heading small {
  color: #8b95a0;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.quotation-client-summary-heading strong {
  overflow: hidden;
  color: #2f3945;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quotation-client-details {
  display: block;
  margin: 0;
  padding: 2px 13px;
}

.quotation-client-detail {
  min-width: 0;
  min-height: 0;
  padding: 10px 0;
  background: transparent;
  border-bottom: 1px solid #e8ebee;
}

.quotation-client-detail:last-child {
  border-bottom: 0;
}

.quotation-client-detail dt {
  margin-bottom: 3px;
  color: #828c98;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.035em;
  line-height: 1.25;
  text-transform: uppercase;
}

.quotation-client-detail dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: #354150;
  font-size: 10.5px;
  font-weight: 500;
  line-height: 1.4;
}

.quotation-currency-section {
  margin: 0 24px;
  padding: 20px 0 4px;
  background: transparent;
  border: 0;
  border-top: 1px solid #e3e7eb;
  border-radius: 0;
}

.quotation-currency-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 13px;
}

.quotation-currency-heading > div:first-child {
  min-width: 0;
}

.quotation-currency-section h3 {
  margin: 0;
  color: #27313d;
  font-size: 12px;
  font-weight: 700;
}

.quotation-currency-section p {
  margin: 2px 0 0;
  color: #8a939f;
  font-size: 10px;
}

.quotation-currency-fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.quotation-currency-field {
  min-width: 0;
  width: 100%;
}

.quotation-items-section {
  padding: 0;
}

.quotation-items-header {
  align-items: center;
  margin: 0;
  padding: 16px 18px;
  border-bottom: 1px solid #e4e7eb;
}

.quotation-add-row-btn {
  height: 30px !important;
  padding-inline: 11px !important;
  font-size: 10px !important;
  letter-spacing: 0 !important;
  border-radius: 4px !important;
}

.quotation-line-item {
  margin: 0 24px;
  padding: 20px 0;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #e3e7eb;
  border-radius: 0;
}

.quotation-line-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 26px;
  margin: -3px 0 10px;
}

.quotation-line-item-header > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quotation-item-drag-handle,
.quotation-term-drag-handle {
  display: inline-grid;
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  padding: 0;
  place-items: center;
  color: #7a8795;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.quotation-item-drag-handle {
  margin-left: -5px;
}

.quotation-item-drag-handle:hover,
.quotation-term-drag-handle:hover {
  color: #315f8c;
  background: #edf3f8;
  border-color: #d4e0eb;
}

.quotation-item-drag-handle:focus-visible,
.quotation-term-drag-handle:focus-visible {
  outline: 2px solid rgba(24, 103, 192, 0.32);
  outline-offset: 1px;
}

.quotation-item-drag-handle:active,
.quotation-term-drag-handle:active {
  cursor: grabbing;
}

.quotation-sortable-ghost {
  opacity: 0.35;
}

.quotation-sortable-chosen {
  background: #f2f7fb !important;
  border-color: #9db8d1 !important;
}

.quotation-sortable-drag {
  opacity: 0.95;
  box-shadow: 0 10px 28px rgba(31, 50, 70, 0.18);
}

.quotation-delete-item-btn {
  min-width: 76px;
  height: 28px !important;
  padding-inline: 9px !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  border-radius: 4px !important;
}

.quotation-line-number {
  min-width: 25px;
  color: #315f8c;
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.quotation-line-title {
  color: #687482;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.quotation-suggestions {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 8px;
}

.quotation-suggestions > span {
  flex: 0 0 auto;
  padding-top: 4px;
  color: #7a8491;
  font-size: 10px;
  font-weight: 600;
}

.quotation-suggestions > div {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.quotation-category {
  display: flex;
  align-items: center;
  gap: 18px;
  margin: 13px 0;
}

.quotation-field-label {
  color: #495057;
  font-size: 11px;
  font-weight: 600;
}

.quotation-category-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
}

.quotation-item-fields {
  display: grid;
  grid-template-columns:
    minmax(66px, 0.55fr) minmax(90px, 0.75fr) minmax(150px, 1.2fr)
    minmax(155px, 1.25fr) minmax(165px, 1.3fr);
  gap: 10px;
  align-items: start;
}

.quotation-markup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.quotation-markup-actions button {
  min-width: 42px;
  height: 23px;
  padding: 0 7px;
  color: #21764b;
  font: inherit;
  font-size: 10px;
  font-weight: 600;
  background: #f3faf6;
  border: 1px solid #bddfc9;
  border-radius: 4px;
  cursor: pointer;
}

.quotation-markup-actions button:hover:not(:disabled) {
  color: #155e3a;
  background: #e6f5ec;
  border-color: #81bf98;
}

.quotation-markup-actions > button.is-active {
  color: #ffffff;
  background: #21764b;
  border-color: #21764b;
  box-shadow: 0 0 0 2px rgba(33, 118, 75, 0.14);
}

.quotation-markup-actions > button.is-active:hover:not(:disabled) {
  color: #ffffff;
  background: #155e3a;
  border-color: #155e3a;
}

.quotation-markup-actions button:focus-visible,
.quotation-add-row-secondary:focus-visible {
  outline: 2px solid rgba(24, 103, 192, 0.3);
  outline-offset: 2px;
}

.quotation-markup-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.quotation-custom-markup {
  display: grid;
  grid-template-columns: 52px auto 24px;
  align-items: center;
  height: 23px;
  overflow: hidden;
  color: #4f5d68;
  background: #ffffff;
  border: 1px solid #bddfc9;
  border-radius: 4px;
}

.quotation-custom-markup input {
  width: 52px;
  height: 21px;
  padding: 0 5px;
  color: #33404d;
  font: inherit;
  font-size: 10px;
  background: transparent;
  border: 0;
  outline: 0;
}

.quotation-custom-markup input::placeholder {
  color: #929ca6;
}

.quotation-custom-markup span {
  padding-right: 3px;
  font-size: 9px;
  font-weight: 600;
}

.quotation-markup-actions .quotation-custom-markup-apply {
  min-width: 24px;
  width: 24px;
  height: 21px;
  padding: 0;
  color: #21764b;
  background: #f3faf6;
  border: 0;
  border-left: 1px solid #d6e8dd;
  border-radius: 0;
}

.quotation-markup-actions .quotation-custom-markup-apply:hover:not(:disabled) {
  background: #e6f5ec;
}

.quotation-custom-markup:focus-within {
  border-color: #70ad87;
  box-shadow: 0 0 0 2px rgba(33, 118, 75, 0.12);
}

.quotation-add-row-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: calc(100% - 48px);
  min-height: 38px;
  margin: 14px 24px 22px;
  color: #4f6377;
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  background: #f9fbfc;
  border: 1px dashed #b8c2cc;
  border-radius: 5px;
  cursor: pointer;
}

.quotation-add-row-secondary:hover {
  color: #245b8f;
  background: #f7fafc;
  border-color: #7f9db9;
}

.quotation-commercial-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  align-items: stretch;
}

.quotation-summary-section,
.quotation-sign-section {
  min-width: 0;
}

.quotation-discount-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.quotation-discount-fields :deep(.v-field) {
  border-radius: 4px;
}

.quotation-discount-fields :deep(.v-field__input) {
  min-height: 38px;
  padding-block: 6px;
  font-size: 12px;
}

.quotation-discount-fields :deep(.v-label) {
  font-size: 11px;
}

.quotation-totals {
  border-top: 1px solid #e1e5ea;
}

.quotation-totals > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 35px;
  color: #697585;
  font-size: 11px;
  border-bottom: 1px solid #edf0f2;
}

.quotation-totals strong {
  color: #303a46;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.quotation-totals .quotation-discount-value {
  color: #b54747;
}

.quotation-totals .quotation-grand-total {
  min-height: 48px;
  color: #263443;
  border-bottom: 0;
}

.quotation-grand-total span {
  font-size: 12px;
  font-weight: 700;
}

.quotation-grand-total strong {
  color: #173f66;
  font-size: 17px;
  font-weight: 700;
}

.quotation-signature-preview {
  display: grid;
  min-height: 112px;
  margin-top: 12px;
  padding: 12px;
  place-items: center;
  background: #fafbfc;
  border: 1px solid #e1e5ea;
  border-radius: 5px;
}

.quotation-terms-header {
  align-items: center;
}

.quotation-selected-count {
  padding: 4px 8px;
  color: #596777;
  font-size: 10px;
  font-weight: 600;
  background: #f2f4f6;
  border: 1px solid #e0e4e8;
  border-radius: 4px;
}

.quotation-terms-lists {
  display: grid;
  gap: 12px;
}

.quotation-term-controls {
  display: flex;
  max-width: 680px;
  margin-bottom: 12px;
  align-items: stretch;
  gap: 8px;
}

.quotation-term-search {
  display: grid;
  min-width: 0;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  flex: 1 1 auto;
  align-items: center;
  gap: 7px;
  padding-left: 9px;
  color: #7b8794;
  background: #ffffff;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.quotation-term-search :deep(.input-field) {
  display: block;
  height: 32px !important;
  min-height: 32px !important;
  padding: 5px 0 !important;
  overflow: hidden;
  line-height: 20px !important;
  border: 0 !important;
  box-shadow: none !important;
  resize: none;
}

.quotation-term-search :deep(.form-group),
.quotation-term-search :deep(.input-wrapper) {
  height: 32px;
}

.quotation-term-add-btn {
  flex: 0 0 auto;
  min-width: 118px;
  height: 34px !important;
  padding-inline: 11px !important;
  font-size: 9px !important;
  font-weight: 650 !important;
  letter-spacing: 0 !important;
  border-radius: 4px !important;
}

.quotation-terms-table-wrap {
  overflow-x: auto;
  border: 1px solid #dfe3e8;
  border-radius: 5px;
}

.quotation-terms-table {
  width: 100%;
  color: #485462;
  font-size: 11px;
  border-collapse: collapse;
}

.quotation-terms-table caption {
  padding: 7px 10px;
  color: #3f4d5c;
  font-size: 10px;
  font-weight: 700;
  text-align: left;
  background: #ffffff;
  border-bottom: 1px solid #dfe3e8;
}

.quotation-terms-table th {
  height: 32px;
  padding: 7px 10px;
  color: #657281;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-align: left;
  text-transform: uppercase;
  background: #f5f6f8;
  border-bottom: 1px solid #dfe3e8;
}

.quotation-terms-table th:first-child,
.quotation-terms-table td:first-child {
  width: 40px;
  padding: 0;
  text-align: center;
}

.quotation-terms-table th:nth-child(2),
.quotation-terms-table td:nth-child(2) {
  width: 44px;
  text-align: center;
}

.quotation-terms-table th:nth-child(3),
.quotation-terms-table td:nth-child(3) {
  width: 58px;
  padding: 0;
  text-align: center;
}

.quotation-terms-table--available th:first-child,
.quotation-terms-table--available td:first-child {
  width: 44px;
}

.quotation-terms-table--available th:nth-child(2),
.quotation-terms-table--available td:nth-child(2) {
  width: 58px;
  padding: 0;
}

.quotation-terms-table--available th:nth-child(3),
.quotation-terms-table--available td:nth-child(3) {
  width: auto;
  padding: 6px 10px;
  text-align: left;
}

.quotation-term-drag-handle {
  margin: 0 auto;
}

.quotation-terms-table td {
  min-height: 38px;
  padding: 6px 10px;
  line-height: 1.45;
  vertical-align: middle;
  border-bottom: 1px solid #e8ebee;
}

.quotation-terms-table tbody tr:last-child td {
  border-bottom: 0;
}

.quotation-terms-table tbody tr:hover {
  background: #fafbfc;
}

.quotation-term-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 38px;
  margin: 0;
}

.quotation-term-checkbox :deep(.v-input__control),
.quotation-term-checkbox :deep(.v-selection-control) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.quotation-term-checkbox :deep(.v-selection-control) {
  min-height: 38px;
}

.quotation-terms-empty {
  height: 52px;
  color: #8b95a1;
  text-align: center !important;
}

.quotation-terms-empty strong,
.quotation-terms-empty span {
  display: block;
}

.quotation-terms-empty strong {
  color: #687582;
  font-size: 10px;
}

.quotation-terms-empty span {
  margin-top: 3px;
  color: #929ca6;
  font-size: 8px;
}

.quotation-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 64px;
  padding: 12px 20px;
  background: #ffffff;
  border-top: 1px solid #dfe3e8;
}

.quotation-dialog-footer p {
  margin: 0;
  color: #7b8591;
  font-size: 10px;
  line-height: 1.45;
}

.quotation-dialog-footer > div {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.quotation-cancel-btn,
.quotation-save-btn {
  min-width: 104px;
  height: 34px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  border-radius: 4px !important;
}

.quotation-save-btn {
  min-width: 142px;
}

.quotation-dialog-card :deep(.input-field),
.quotation-dialog-card :deep(.date-input-wrapper) {
  border-radius: 4px;
}

@media (max-width: 959px) {
  .quotation-dialog-menu {
    flex-basis: 214px;
    width: 214px;
  }

  .quotation-dialog-menu-item {
    grid-template-columns: minmax(0, 1fr);
  }

  .quotation-dialog-menu-arrow {
    display: none;
  }

  .quotation-dialog-body {
    padding: 14px !important;
  }

  .quotation-item-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .quotation-client-workspace {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .quotation-client-picker {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .quotation-company-field {
    grid-column: 1 / -1;
  }

  .quotation-client-details {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-inline: 13px;
  }

  .quotation-client-address {
    grid-column: 1 / -1;
  }

  .quotation-client-detail {
    padding-inline: 10px;
    border-bottom: 1px solid #e8ebee;
  }

  .quotation-client-detail:first-child {
    padding-inline: 0;
  }

  .quotation-client-detail:last-child {
    grid-column: 1 / -1;
    padding-inline: 0;
    border-bottom: 0;
  }

  .quotation-client-detail:nth-child(2) {
    padding-left: 0;
    border-right: 1px solid #e8ebee;
  }

  .quotation-client-detail:nth-child(3) {
    padding-right: 0;
  }

  .quotation-commercial-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 599px) {
  .quotation-dialog-card {
    height: 100vh;
    height: 100dvh;
    min-height: 100vh;
    min-height: 100dvh;
    max-height: 100vh;
    max-height: 100dvh;
    border: 0;
    border-radius: 0 !important;
  }

  .quotation-dialog-header {
    min-height: 64px;
    padding: 11px 12px;
  }

  .quotation-dialog-heading {
    gap: 9px;
  }

  .quotation-dialog-icon {
    flex-basis: 32px;
    width: 32px;
    height: 32px;
  }

  .quotation-dialog-heading h2 {
    font-size: 14px;
  }

  .quotation-dialog-heading p,
  .quotation-status {
    display: none;
  }

  .quotation-dialog-workspace {
    flex-direction: column;
  }

  .quotation-dialog-menu {
    display: flex;
    flex: 0 0 auto;
    width: 100%;
    padding: 6px 8px;
    overflow-x: auto;
    flex-direction: row;
    gap: 4px;
    background: #ffffff;
    border-right: 0;
    border-bottom: 1px solid #dce2e8;
    scrollbar-width: none;
  }

  .quotation-dialog-menu::-webkit-scrollbar {
    display: none;
  }

  .quotation-dialog-menu-label {
    display: none;
  }

  .quotation-dialog-menu-item {
    display: flex;
    flex: 0 0 auto;
    width: max-content;
    min-width: 0;
    min-height: 40px;
    padding: 6px 10px;
    gap: 0;
  }

  .quotation-dialog-menu-item--active::before {
    top: auto;
    right: 10px;
    bottom: -7px;
    left: 10px;
    width: auto;
    height: 3px;
    border-radius: 3px 3px 0 0;
  }

  .quotation-dialog-menu-copy small,
  .quotation-dialog-menu-arrow {
    display: none;
  }

  .quotation-dialog-menu-copy strong {
    font-size: 10px;
    white-space: nowrap;
  }

  .quotation-dialog-body {
    gap: 10px;
    padding: 10px !important;
  }

  .quotation-form-section {
    padding: 18px 16px;
  }

  .quotation-items-section {
    padding: 0;
  }

  .quotation-section-header {
    margin-bottom: 13px;
  }

  .quotation-section-header p {
    display: none;
  }

  .quotation-client-details,
  .quotation-item-fields,
  .quotation-discount-fields {
    grid-template-columns: 1fr;
  }

  .quotation-client-heading {
    margin-bottom: 16px;
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .quotation-client-heading p {
    max-width: none;
    text-align: left;
  }

  .quotation-subject-field,
  .quotation-client-address {
    grid-column: auto;
  }

  .quotation-client-picker {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .quotation-company-field {
    grid-column: auto;
  }

  .quotation-subject-grid {
    grid-template-columns: 1fr;
  }

  .quotation-operation-fields {
    grid-template-columns: 1fr;
  }

  .quotation-client-master-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .quotation-client-master-actions .v-btn {
    width: 100%;
  }

  .quotation-client-detail,
  .quotation-client-detail:first-child,
  .quotation-client-detail:last-child,
  .quotation-client-detail:nth-child(2),
  .quotation-client-detail:nth-child(3) {
    grid-column: auto;
    padding: 9px 0;
    border-right: 0;
    border-bottom: 1px solid #e8ebee;
  }

  .quotation-client-detail:last-child {
    border-bottom: 0;
  }

  .quotation-operation-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .quotation-operation-heading span {
    text-align: left;
  }

  .quotation-currency-section {
    margin: 0 16px;
    padding: 18px 0 2px;
  }

  .quotation-currency-heading {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .quotation-currency-field {
    flex-basis: auto;
    width: 100%;
  }

  .quotation-add-client-btn {
    align-self: flex-start;
  }

  .quotation-items-header {
    padding: 16px;
  }

  .quotation-line-item {
    margin: 0 16px;
    padding: 18px 0;
  }

  .quotation-category {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .quotation-category-options {
    gap: 10px 16px;
  }

  .quotation-add-row-secondary {
    width: calc(100% - 32px);
    margin: 12px 16px 18px;
  }

  .quotation-term-controls {
    max-width: none;
    align-items: stretch;
    flex-direction: column;
  }

  .quotation-term-add-btn {
    width: 100%;
  }

  .quotation-dialog-footer {
    align-items: stretch;
    padding: 10px 12px;
  }

  .quotation-dialog-footer p {
    display: none;
  }

  .quotation-dialog-footer > div {
    display: grid;
    flex: 1;
    grid-template-columns: 1fr 1.25fr;
  }

  .quotation-cancel-btn,
  .quotation-save-btn {
    width: 100%;
    min-width: 0;
  }
}
</style>

