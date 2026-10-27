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
          >Tambah Master Client</span
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

      <!-- Form Body High-Density -->
      <v-card-text class="pa-3">
        <!-- Nama Perusahaan -->

        <a-text-field-new
          v-model="newCustomer.nama"
          placeholder="Nama perusahaan"
          variant="outlined"
          density="compact"
          hide-details
        />
        <div v-if="saranFieldCustomer('nama', newCustomer.nama).length">
          <v-chip
            v-for="nama in saranFieldCustomer('nama', newCustomer.nama)"
            :key="nama"
            size="x-small"
            class="mr-1 mb-1 text-grey"
            @mousedown.prevent
            @click="newCustomer.nama = nama"
          >
            {{ nama }}
          </v-chip>
        </div>

        <a-text-field-new
          v-model="newCustomer.vessel"
          placeholder="vessel"
          variant="outlined"
          density="compact"
          hide-details
        />
        <div v-if="saranFieldCustomer('vessel', newCustomer.vessel).length">
          <v-chip
            v-for="value in saranFieldCustomer('vessel', newCustomer.vessel)"
            :key="value"
            size="x-small"
            class="mr-1 mb-1 text-grey"
            @mousedown.prevent
            @click="newCustomer.vessel = value"
            >{{ value }}</v-chip
          >
        </div>

        <a-text-field-new
          v-model="newCustomer.pic"
          placeholder="PIC name"
          variant="outlined"
          density="compact"
          hide-details
        />
        <div v-if="saranFieldCustomer('pic', newCustomer.pic).length">
          <v-chip
            v-for="value in saranFieldCustomer('pic', newCustomer.pic)"
            :key="value"
            size="x-small"
            class="mr-1 mb-1 text-grey"
            @mousedown.prevent
            @click="newCustomer.pic = value"
            >{{ value }}</v-chip
          >
        </div>

        <a-text-field-new
          v-model="newCustomer.no_telp"
          placeholder="Phone Number"
          variant="outlined"
          density="compact"
          hide-details
        />
        <div v-if="saranFieldCustomer('no_telp', newCustomer.no_telp).length">
          <v-chip
            v-for="value in saranFieldCustomer('no_telp', newCustomer.no_telp)"
            :key="value"
            size="x-small"
            class="mr-1 mb-1 text-grey"
            @mousedown.prevent
            @click="newCustomer.no_telp = value"
            >{{ value }}</v-chip
          >
        </div>

        <a-text-field-new
          v-model="newCustomer.email"
          placeholder="Email"
          variant="outlined"
          density="compact"
          hide-details
        />
        <div v-if="saranFieldCustomer('email', newCustomer.email).length">
          <v-chip
            v-for="value in saranFieldCustomer('email', newCustomer.email)"
            :key="value"
            size="x-small"
            class="mr-1 mb-1 text-grey"
            @mousedown.prevent
            @click="newCustomer.email = value"
            >{{ value }}</v-chip
          >
        </div>

        <a-textarea-new
          v-model="newCustomer.alamat"
          placeholder="Address"
          rows="2"
          variant="outlined"
          density="compact"
          hide-details
          auto-grow
        />
        <div v-if="saranFieldCustomer('alamat', newCustomer.alamat).length">
          <v-chip
            v-for="value in saranFieldCustomer('alamat', newCustomer.alamat)"
            :key="value"
            size="x-small"
            class="mr-1 mb-1 text-grey"
            @mousedown.prevent
            @click="newCustomer.alamat = value"
            >{{ value }}</v-chip
          >
        </div>
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

  <!-- Tombol Kembali -->
  <v-btn
    variant="text"
    color="grey-darken-3"
    prepend-icon="mdi-arrow-left"
    @click="$router.go(-1)"
    class="text-capitalize font-weight-bold mb-2"
  >
    Kembali
  </v-btn>

  <!-- Dialog Tambah / Edit Quotation -->
  <v-dialog
    v-model="data.dialogTambahPenawaran"
    max-width="1040"
    scrollable
    :fullscreen="display.xs.value"
    persistent
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
              {{ data.penawaranAddEdit === "add" ? "Create" : "Edit" }}
              Quotation
            </h2>
            <p>Nomor quotation dibuat otomatis saat disimpan</p>
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

      <v-card-text class="quotation-dialog-body">
        <section class="quotation-form-section">
          <div class="quotation-section-header">
            <div>
              <span class="quotation-section-index">01</span>
              <h3>Client Information</h3>
            </div>
            <p>Pilih client untuk mengisi detail kontak secara otomatis.</p>
          </div>

          <div class="quotation-client-picker">
            <a-date-picker-new
              class="quotation-date-field"
              v-model="newPenawaran.tanggal_penawaran"
              label="Quotation Date"
            />
            <a-autocomplete-new
              class="quotation-client-select"
              v-model="newPenawaran.id_perusahaan"
              label="Client"
              placeholder="Select client | perusahaan - vessel - pic"
              item-title="label"
              item-value="id_customer"
              :items="
                customerStore.getDataCustomer
                  .map((customer) => ({
                    ...customer,
                    label: [customer.nama, customer.vessel, customer.pic]
                      .filter(Boolean)
                      .join(' - '),
                  }))
                  .sort((a, b) =>
                    a.label.localeCompare(b.label, 'id-ID', {
                      sensitivity: 'base',
                    }),
                  )
              "
            />
            <v-btn
              class="quotation-add-client-btn text-none"
              variant="outlined"
              color="primary"
              prepend-icon="mdi-account-plus-outline"
              aria-label="Tambah client"
              @click="opendialogTambahMasterPerusahaan"
            >
              Add Client
              <v-tooltip activator="parent" location="top">
                Add New Client
              </v-tooltip>
            </v-btn>
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
            <div class="quotation-client-detail">
              <dt>Vessel</dt>
              <dd>{{ newPenawaran.vessel || "—" }}</dd>
            </div>
          </dl>

          <a-select-new
            class="quotation-client-select mt-2"
            v-model="newPenawaran.location"
            label="Location"
            placeholder="Select location"
            item-title="label"
            item-value="id_customer"
            :items="['Batam', 'Jakarta', 'Lamongan']"
          />
        </section>

        <section class="quotation-currency-section">
          <div class="quotation-currency-heading">
            <div>
              <h3>Transaction Currency</h3>
              <p>Currency dan subject yang digunakan pada quotation.</p>
            </div>
            <a-select-new
              class="quotation-currency-field"
              v-model="newPenawaran.currency"
              :items="[
                { title: 'IDR', value: 'IDR' },
                { title: 'USD', value: 'USD' },
                { title: 'SGD', value: 'SGD' },
              ]"
            />
          </div>
          <div class="quotation-currency-fields">
            <a-textarea-new
              v-model="newPenawaran.perihal"
              label="Subject"
              placeholder="Quotation subject"
              rows="2"
            />
          </div>
        </section>

        <section class="quotation-form-section quotation-items-section">
          <div class="quotation-section-header quotation-items-header">
            <div>
              <span class="quotation-section-index">02</span>
              <h3>Quotation Items</h3>
            </div>
            <!-- <v-btn
              size="small"
              variant="outlined"
              color="primary"
              prepend-icon="mdi-plus"
              class="quotation-add-row-btn text-none"
              @click="tambahBarisPenawaran"
            >
              Add Item
            </v-btn> -->
          </div>

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
                  <span class="quotation-line-title">Item detail</span>
                </div>
                <v-btn
                  size="small"
                  variant="outlined"
                  color="error"
                  prepend-icon="mdi-trash-can-outline"
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
                    'Box',
                    'Liter',
                    'Jerigen',
                    'Can',
                    'Pail',
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
                      v-for="persentase in [10, 20, 30]"
                      :key="persentase"
                      type="button"
                      :disabled="!Number(item.harga_hpp)"
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

        <div class="quotation-commercial-grid">
          <section class="quotation-form-section quotation-summary-section">
            <div class="quotation-section-header">
              <div>
                <span class="quotation-section-index">03</span>
                <h3>Commercial Summary</h3>
              </div>
              <p>Nilai quotation dan diskon.</p>
            </div>
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
                <span class="quotation-section-index">04</span>
                <h3>Authorization</h3>
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
                <v-img width="130" height="65" contain src="/ttd_seilla.png" />
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
                <v-img width="130" height="65" contain />
                <div class="signature-line"></div>
                <div class="signature-name">Lilis</div>
              </div>
            </div>
          </section>
        </div>

        <section class="quotation-form-section quotation-terms-section">
          <div class="quotation-section-header quotation-terms-header">
            <div>
              <span class="quotation-section-index">05</span>
              <h3>Terms &amp; Conditions</h3>
            </div>
            <span class="quotation-selected-count">
              {{ (newPenawaran.termCondition ?? []).length }} selected
            </span>
          </div>

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
              {{ existingTermCondition ? "Available" : "Add master T&C" }}
            </v-btn>
          </div>

          <div class="quotation-terms-table-wrap">
            <table class="quotation-terms-table">
              <thead>
                <tr>
                  <th scope="col" aria-label="Ubah urutan"></th>
                  <th scope="col">No.</th>
                  <th scope="col">Select</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody ref="termConditionsSortableContainer">
                <tr
                  v-for="(item, index) in sortedTermConditions"
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
                      @keydown.down.prevent="moveTermCondition(index, index + 1)"
                    >
                      <v-icon icon="mdi-drag-vertical" size="17" />
                    </button>
                  </td>
                  <td>{{ index + 1 }}</td>
                  <td>
                    <v-checkbox
                      v-model="newPenawaran.termCondition"
                      :value="{ id: item.id ?? '', nama_term: item.nama_term }"
                      :value-comparator="sameTermCondition"
                      density="compact"
                      hide-details
                      color="primary"
                      class="quotation-term-checkbox"
                      @update:model-value="scheduleSelectedTermOrderSync"
                    />
                  </td>
                  <td>{{ item.nama_term }}</td>
                </tr>
                <tr v-if="!sortedTermConditions.length">
                  <td colspan="4" class="quotation-terms-empty">
                    <strong>Term tidak ditemukan.</strong>
                    <span v-if="canAddTermCondition">
                      Klik “Tambah T&amp;C” untuk menyimpannya ke master.
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
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
                : "Save Changes"
            }}
          </v-btn>
        </div>
      </footer>
    </v-card>
  </v-dialog>

  <!-- Header & Top Action -->
  <div class="quotation-page-heading">
    <div>
      <h1>Quotation</h1>
      <p>Manage quotation, client, status, and transaction value.</p>
    </div>
    <v-btn
      color="primary"
      variant="flat"
      size="small"
      class="quotation-create-btn text-none"
      prepend-icon="mdi-plus"
      @click="openDialogTambahPenawaran"
    >
      New Quotation
    </v-btn>
  </div>

  <!-- Main Table Card -->
  <v-card class="quotation-list-card" flat>
    <div class="quotation-list-toolbar">
      <div class="quotation-list-search">
        <v-icon icon="mdi-magnify" size="17" />
        <div class="quotation-list-search-field">
          <a-text-field-new
            v-model="data.searchPenawaran"
            placeholder="Cari nomor, client, subject, atau status"
          />
        </div>
        <v-btn
          v-if="data.searchPenawaran"
          icon="mdi-close"
          size="x-small"
          variant="text"
          color="grey-darken-1"
          aria-label="Hapus pencarian"
          @click="kosonginPencarian"
        />
      </div>

      <div class="quotation-list-tools">
        <span class="quotation-result-count">
          {{ penawaranTampilTersaring.length }} quotation
        </span>
        <v-btn
          size="small"
          class="quotation-filter-toggle quotation-toolbar-btn text-none"
          variant="outlined"
          :prepend-icon="
            data.showQuotationFilters
              ? 'mdi-filter-variant-minus'
              : 'mdi-filter-variant-plus'
          "
          @click="data.showQuotationFilters = !data.showQuotationFilters"
        >
          Filter{{
            activeQuotationFilterCount
              ? ` (${activeQuotationFilterCount})`
              : ""
          }}
        </v-btn>
        <v-btn
          icon="mdi-refresh"
          size="small"
          variant="text"
          class="quotation-refresh-btn"
          aria-label="Refresh quotation"
          @click="refreshData"
        >
          <v-tooltip activator="parent" location="top">
            Refresh Data
          </v-tooltip>
        </v-btn>
      </div>
    </div>

    <v-divider />

    <section
      v-show="data.showQuotationFilters"
      class="quotation-filter-panel"
    >
      <div class="quotation-filter-heading">
        <div>
          <span class="quotation-filter-eyebrow">Filter pencarian</span>
          <p>
            Filter dapat digabungkan dan akan tetap tersimpan saat membuka
            detail quotation.
          </p>
        </div>
      </div>

      <div class="quotation-filter-grid">
        <div class="quotation-filter-field">
          <a-date-range-filter
            v-model:start="data.filterDateFrom"
            v-model:end="data.filterDateTo"
            placeholder="Rentang tanggal"
            aria-label="Pilih rentang tanggal quotation"
          />
        </div>

        <label class="quotation-filter-field">
          <input
            v-model.trim="data.filterQuotationNo"
            type="search"
            placeholder="No. quotation"
          />
        </label>

        <label class="quotation-filter-field quotation-filter-select">
          <select v-model="data.filterClient" aria-label="Client">
            <option value="">Client</option>
            <option
              v-for="client in availableQuotationClients"
              :key="client"
              :value="client"
            >
              {{ client }}
            </option>
          </select>
          <v-icon
            icon="mdi-chevron-down"
            size="14"
            class="quotation-filter-select-icon"
          />
        </label>

        <label class="quotation-filter-field">
          <input
            v-model.trim="data.filterSubject"
            type="search"
            placeholder="Subject atau deskripsi item"
          />
        </label>

        <label class="quotation-filter-field">
          <input
            :value="data.filterAmount"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            placeholder="Total amount"
            aria-label="Total amount"
            @input="updateQuotationAmountFilter"
          />
        </label>

        <label class="quotation-filter-field quotation-filter-select">
          <select v-model="data.filterStatus" aria-label="Status quotation">
            <option value="">Status</option>
            <option
              v-for="status in availableQuotationStatuses"
              :key="status"
              :value="status"
            >
              {{ status }}
            </option>
          </select>
          <v-icon
            icon="mdi-chevron-down"
            size="14"
            class="quotation-filter-select-icon"
          />
        </label>

        <v-chip
          label
          variant="flat"
          color="red"
          prepend-icon="mdi-filter-off-outline"
          class="quotation-filter-reset text-none"
          role="button"
          tabindex="0"
          @click="resetQuotationFilters"
          @keydown.enter="resetQuotationFilters"
          @keydown.space.prevent="resetQuotationFilters"
        >
          Reset filter
        </v-chip>
      </div>
    </section>

    <v-divider
      v-show="data.showQuotationFilters"
      class="quotation-filter-divider"
    />

    <!-- Responsive Table -->
    <v-data-table
      :headers="data.headPenawaran"
      :items="penawaranTampilTersaring"
      :items-per-page="-1"
      density="compact"
      :sort-by="[{ key: 'created_at', order: 'desc' }]"
      :hover="true"
      hide-default-footer
      class="quotation-list-table"
    >
      <template v-slot:item.no="{ index }">
        <span class="quotation-row-index">{{ index + 1 }}</span>
      </template>

      <template v-slot:item.no_penawaran="{ item }">
        <NuxtLink
          :to="'/admin/penawaran/' + item.id"
          class="quotation-reference"
        >
          {{ item.no_penawaran }}
          <v-icon icon="mdi-arrow-top-right" size="12" />
        </NuxtLink>
      </template>

      <template v-slot:item.perihal="{ item }">
        <div class="subject-cell">
          <span>{{ item.perihal }}</span>
        </div>
      </template>

      <template v-slot:item.nama_perusahaan="{ item }">
        <div class="quotation-client-cell">
          <div class="quotation-client-name">
            {{ item.nama_perusahaan || "-" }}
          </div>
          <div class="quotation-client-meta">
            <span>
              <v-icon icon="mdi-ferry" size="12" />
              {{ item.vessel || "-" }}
            </span>
            <i aria-hidden="true"></i>
            <span>
              <v-icon icon="mdi-account-outline" size="12" />
              {{ item.pic || "-" }}
            </span>
            <i aria-hidden="true"></i>
            <span>
              <v-icon icon="mdi-map-marker-outline" size="12" />
              {{ item.location || "-" }}
            </span>
          </div>
        </div>
      </template>

      <template v-slot:item.tanggal_penawaran="{ item }">
        <span class="quotation-date-cell">
          {{ rubahtanggallengkap(item.tanggal_penawaran) }}
        </span>
      </template>

      <template v-slot:item.grand_total="{ item }">
        <div class="quotation-price-cell">
          <strong class="quotation-amount-cell">
            {{ formatCurrency(item.grand_total_penawaran, item.currency) }}
          </strong>
          <template v-if="hasQuotationDiscount(item)">
            <del class="quotation-original-amount">
              {{ formatCurrency(quotationOriginalTotal(item), item.currency) }}
            </del>
          </template>
        </div>
      </template>

      <template v-slot:item.status="{ item }">
        <v-chip
          size="x-small"
          :color="statusColor(item.status)"
          variant="tonal"
          class="quotation-table-status"
        >
          <v-icon start icon="mdi-circle" size="6" />
          {{ item.status }}
        </v-chip>
      </template>

      <template v-slot:item.aksi="{ item }">
        <div class="quotation-row-actions">
          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                icon="mdi-dots-horizontal"
                size="small"
                variant="text"
                color="grey-darken-1"
                class="quotation-action-trigger"
                aria-label="Buka menu aksi quotation"
              />
            </template>

            <v-list
              density="compact"
              min-width="205"
              class="quotation-action-menu"
            >
              <v-list-item
                :to="'/admin/penawaran/' + item.id"
                :disabled="item.status == 'Cancel'"
                prepend-icon="mdi-eye-outline"
                title="Detail quotation"
              />
              <v-list-item
                :disabled="item.status !== 'Draft'"
                prepend-icon="mdi-pencil-outline"
                title="Edit quotation"
                @click="openDialogEditPenawaran(item)"
              />
              <v-divider class="my-1" />
              <v-list-item
                :disabled="item.status !== 'Draft'"
                prepend-icon="mdi-trash-can-outline"
                title="Delete quotation"
                class="quotation-menu-danger"
                @click="hapusPenawaran(item)"
              />
              <v-list-item
                v-if="item.status !== 'Cancel'"
                :disabled="item.status !== 'Draft'"
                prepend-icon="mdi-alpha-x-circle-outline"
                title="Cancel quotation"
                class="quotation-menu-danger"
                @click="ubahstatuscancel(item)"
              />
              <v-list-item
                v-if="item.status === 'Cancel'"
                prepend-icon="mdi-keyboard-return"
                title="Return to Draft"
                @click="backtodraft(item)"
              />
            </v-list>
          </v-menu>
        </div>
      </template>

      <template v-slot:no-data>
        <div class="quotation-empty-state">
          <v-icon
            size="34"
            color="grey-lighten-1"
            class="mb-2"
            icon="mdi-file-document-edit-outline"
          />
          <div>
            {{
              hasActiveQuotationFilters
                ? "Quotation tidak ditemukan"
                : "Belum ada data quotation"
            }}
          </div>
        </div>
      </template>
    </v-data-table>
  </v-card>
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
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import moment from "moment";
import Sortable from "sortablejs";
import type { ConfirmationDialog } from "#components";
import type { penawaranM } from "~/types/penawaranModel";
import type { barangM } from "~/types/barangModel";
import type { customerM } from "~/types/customerModel";
import type { termconditionM } from "~/types/termconditionModel";

definePageMeta({
  layout: "admin",
});

const router = useRouter();
const display = useDisplay();
const customerStore = usecustomerStore();
const termconditionStore = usetermconditionStore();
const barangStore = usebarangStore();
const penawaranStore = usePenawaranStore();
const invoiceStore = useinvoiceStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);
const activeSuggestionIndex = ref<number | null>(null);
const savingCustomer = ref(false);

onMounted(async () => {
  restoreQuotationFilters();
  useloadingStore().setLoading(true);
  await penawaranStore.tarikDataPenawaranAct();
  useloadingStore().setLoading(false);
  await customerStore.tarikDataCustomerAct();
  await termconditionStore.tarikDataTermconditionAct();
  await barangStore.tarikDataBarangAct();
});

const kosonginPencarian = () => {
  data.searchPenawaran = "";
};

const data = reactive({
  searchPenawaran: "",
  showQuotationFilters: true,
  filterDateFrom: "",
  filterDateTo: "",
  filterQuotationNo: "",
  filterClient: "",
  filterSubject: "",
  filterAmount: "",
  filterStatus: "",

  dialogTambahPenawaran: false,
  dialogTambahMasterPerusahaan: false,
  penawaranAddEdit: "add" as "add" | "edit",
  editOriginalTermconditionId: "",
  editOriginalBarangId: "",
  headPenawaran: [
    {
      title: "No",
      value: "no",
      width: "48px",
      align: "center" as const,
      sortable: false,
    },
    {
      title: "Date",
      value: "tanggal_penawaran",
      width: "116px",
      sortable: true,
    },
    {
      title: "Quotation Ref",
      value: "no_penawaran",
      width: "168px",
      sortable: true,
    },
    {
      title: "Client",
      value: "nama_perusahaan",
      width: "270px",
      sortable: true,
    },
    {
      title: "Subject",
      value: "perihal",
      width: "240px",
      sortable: true,
    },
    {
      title: "Total Amount",
      value: "grand_total",
      width: "155px",
      align: "end" as const,
      sortable: true,
    },
    {
      title: "Status",
      value: "status",
      width: "104px",
      sortable: true,
    },
    {
      title: "Action",
      align: "center" as const,
      value: "aksi",
      width: "58px",
      sortable: false,
    },
  ],
});

const QUOTATION_FILTER_STORAGE_KEY = "admin-quotation-list-filters-v1";
const quotationFilterKeys = [
  "searchPenawaran",
  "filterDateFrom",
  "filterDateTo",
  "filterQuotationNo",
  "filterClient",
  "filterSubject",
  "filterAmount",
  "filterStatus",
] as const;

function quotationFilterSnapshot() {
  return Object.fromEntries(
    quotationFilterKeys.map((key) => [key, data[key]]),
  );
}

function restoreQuotationFilters() {
  try {
    const storedFilters = sessionStorage.getItem(QUOTATION_FILTER_STORAGE_KEY);
    if (!storedFilters) return;

    const parsedFilters = JSON.parse(storedFilters) as Record<string, unknown>;
    quotationFilterKeys.forEach((key) => {
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
    sessionStorage.removeItem(QUOTATION_FILTER_STORAGE_KEY);
  }
}

watch(
  () => quotationFilterKeys.map((key) => data[key]),
  () => {
    sessionStorage.setItem(
      QUOTATION_FILTER_STORAGE_KEY,
      JSON.stringify(quotationFilterSnapshot()),
    );
  },
);

const newCustomer = ref<customerM>(emptyCustomer());

function saranFieldCustomer(
  field: "nama" | "vessel" | "pic" | "no_telp" | "email" | "alamat",
  value: string | null | undefined,
) {
  const query = value?.trim().toLocaleLowerCase("id-ID") ?? "";
  if (!query) return [];

  return [
    ...new Set(
      customerStore.getDataCustomer
        .map((customer) => customer[field]?.trim())
        .filter(
          (suggestion): suggestion is string =>
            Boolean(suggestion) &&
            suggestion.toLocaleLowerCase("id-ID").includes(query) &&
            suggestion.toLocaleLowerCase("id-ID") !== query,
        ),
    ),
  ];
}

watch(
  () => newCustomer.value.pic,
  (pic) => {
    const query = pic?.trim().toLocaleLowerCase("id-ID");
    if (!query) return;

    const customer = customerStore.getDataCustomer.find(
      (item) => item.pic?.trim().toLocaleLowerCase("id-ID") === query,
    );
    if (!customer) return;

    newCustomer.value.no_telp = customer.no_telp || "";
    newCustomer.value.email = customer.email || "";
    newCustomer.value.alamat = customer.alamat || "";
  },
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
    return notificationStore.showError("Nama Client tidak boleh kosong");
  if (!customer.vessel.trim())
    return notificationStore.showError("Vessel tidak boleh kosong");
  if (!customer.alamat.trim())
    return notificationStore.showError("Address tidak boleh kosong");
  if (!customer.pic.trim())
    return notificationStore.showError("PIC tidak boleh kosong");
  if (!customer.no_telp.trim())
    return notificationStore.showError("Phone Number tidak boleh kosong");
  if (!customer.email.trim())
    return notificationStore.showError("Email tidak boleh kosong");

  customer.createdAt = moment().unix();
  customer.createdBy = userStore.getEmail || "";
  savingCustomer.value = true;
  try {
    const saved = await customerStore.addCustomerAct({ ...customer });
    if (!saved) return;
    const savedCustomer = customerStore.getDataCustomer.find(
      (item) => item.nama === customer.nama && item.vessel === customer.vessel,
    );
    if (savedCustomer) applyCustomer(savedCustomer);
    data.dialogTambahMasterPerusahaan = false;
  } finally {
    savingCustomer.value = false;
  }
}

const availableQuotationStatuses = computed(() => {
  const defaultStatuses = ["Draft", "INVOICE", "Cancel", "Ditolak"];
  const storedStatuses = penawaranStore.getDataPenawaranTampil
    .map((quotation) => quotation.status)
    .filter(Boolean);

  return [...new Set([...defaultStatuses, ...storedStatuses])];
});

const availableQuotationClients = computed(() => {
  const clients = penawaranStore.getDataPenawaranTampil
    .map((quotation) => quotation.nama_perusahaan?.trim())
    .filter((client): client is string => Boolean(client));

  return [...new Set(clients)].sort((a, b) => a.localeCompare(b, "id-ID"));
});

function normalizeQuotationFilter(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase("id-ID");
}

function containsQuotationFilter(query: string, values: unknown[]) {
  if (!query) return true;
  return values.some((value) =>
    normalizeQuotationFilter(value).includes(query),
  );
}

const activeQuotationFilterCount = computed(
  () =>
    [
      data.searchPenawaran,
      data.filterDateFrom || data.filterDateTo,
      data.filterQuotationNo,
      data.filterClient,
      data.filterSubject,
      data.filterAmount,
      data.filterStatus,
    ].filter((value) => String(value).trim() !== "").length,
);

const hasActiveQuotationFilters = computed(
  () =>
    display.xs.value
      ? Boolean(data.searchPenawaran.trim())
      : activeQuotationFilterCount.value > 0,
);

const penawaranTampilTersaring = computed(() => {
  const globalQuery = normalizeQuotationFilter(data.searchPenawaran);
  const quotationQuery = normalizeQuotationFilter(data.filterQuotationNo);
  const subjectQuery = normalizeQuotationFilter(data.filterSubject);
  const selectedClient = normalizeQuotationFilter(data.filterClient);
  const amountQuery = data.filterAmount.replace(/\D/g, "");

  return penawaranStore.getDataPenawaranTampil.filter((quotation) => {
    const quotationAmount = Number(quotation.grand_total_penawaran) || 0;
    const quotationDate = String(quotation.tanggal_penawaran || "").slice(
      0,
      10,
    );
    const itemDescriptions = (quotation.penawaran_item || []).map(
      (item) => item.nama,
    );
    const searchableValues = [
      quotation.no_penawaran,
      quotation.id_penawaran,
      quotation.tanggal_penawaran,
      quotation.nama_perusahaan,
      quotation.alamat_perusahaan,
      quotation.vessel,
      quotation.pic,
      quotation.email,
      quotation.no_telp,
      quotation.location,
      quotation.perihal,
      ...itemDescriptions,
      quotation.currency,
      quotationAmount,
      formatCurrency(quotationAmount, quotation.currency),
      quotation.status,
      quotation.sign_by,
      quotation.created_by,
    ];

    if (!containsQuotationFilter(globalQuery, searchableValues)) return false;
    if (display.xs.value) return true;
    if (
      !containsQuotationFilter(quotationQuery, [
        quotation.no_penawaran,
        quotation.id_penawaran,
      ])
    ) return false;
    if (
      selectedClient &&
      normalizeQuotationFilter(quotation.nama_perusahaan) !== selectedClient
    ) return false;
    if (
      !containsQuotationFilter(subjectQuery, [
        quotation.perihal,
        ...itemDescriptions,
      ])
    ) return false;
    if (data.filterDateFrom && quotationDate < data.filterDateFrom)
      return false;
    if (data.filterDateTo && quotationDate > data.filterDateTo) return false;
    if (data.filterStatus && quotation.status !== data.filterStatus)
      return false;
    if (
      amountQuery &&
      !String(quotationAmount).replace(/\D/g, "").includes(amountQuery)
    ) return false;

    return true;
  });
});

function updateQuotationAmountFilter(event: Event) {
  const input = event.target as HTMLInputElement;
  const digits = input.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  data.filterAmount = digits;
}

function resetQuotationFilters() {
  quotationFilterKeys.forEach((key) => {
    data[key] = "";
  });
  sessionStorage.removeItem(QUOTATION_FILTER_STORAGE_KEY);
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

function quotationOriginalTotal(item: penawaranM) {
  const storedSubtotal = Number(item.subtotal_penawaran) || 0;
  if (storedSubtotal > 0) return storedSubtotal;

  return (item.penawaran_item || []).reduce(
    (total, quotationItem) =>
      total +
      (Number(quotationItem.subtotal_item) ||
        (Number(quotationItem.qty) || 0) *
          (Number(quotationItem.amount) || 0)),
    0,
  );
}

function hasQuotationDiscount(item: penawaranM) {
  const originalTotal = quotationOriginalTotal(item);
  const discountedTotal = Number(item.grand_total_penawaran) || 0;

  return (
    Number(item.discount_penawaran) > 0 && originalTotal > discountedTotal
  );
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

const sortedTermConditions = computed(() => {
  const search = normalizeTermCondition(
    termConditionSearch.value,
  ).toLocaleLowerCase("id-ID");

  return orderTermConditions(
    termconditionStore.getDataTermcondition.filter((term) =>
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
    syncSelectedTermConditionOrder();
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

function syncSelectedTermConditionOrder() {
  const selectedTerms = newPenawaran.value.termCondition;
  if (!selectedTerms?.length) return;

  const orderIndex = new Map(
    termConditionOrder.value.map((key, index) => [key, index]),
  );
  selectedTerms.sort((left, right) => {
    const leftIndex = orderIndex.get(termConditionKey(left));
    const rightIndex = orderIndex.get(termConditionKey(right));

    if (leftIndex === undefined && rightIndex === undefined) return 0;
    if (leftIndex === undefined) return 1;
    if (rightIndex === undefined) return -1;
    return leftIndex - rightIndex;
  });
}

function scheduleSelectedTermOrderSync() {
  void nextTick(syncSelectedTermConditionOrder);
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
  const visibleTerms = [...sortedTermConditions.value];
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= visibleTerms.length ||
    toIndex >= visibleTerms.length
  ) {
    return;
  }

  const [movedTerm] = visibleTerms.splice(fromIndex, 1);
  if (!movedTerm) return;
  visibleTerms.splice(toIndex, 0, movedTerm);

  const visibleKeys = new Set(visibleTerms.map(termConditionKey));
  const reorderedVisibleTerms = [...visibleTerms];
  const allTerms = orderTermConditions(
    termconditionStore.getDataTermcondition,
  ).map((term) => {
    if (!visibleKeys.has(termConditionKey(term))) return term;
    return reorderedVisibleTerms.shift() ?? term;
  });

  termConditionOrder.value = allTerms.map(termConditionKey);
  syncSelectedTermConditionOrder();
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

function applyCustomer(customer: customerM) {
  newPenawaran.value.id_perusahaan = customer.id_customer || "";
  newPenawaran.value.nama_perusahaan = customer.nama;
  newPenawaran.value.alamat_perusahaan = customer.alamat;
  newPenawaran.value.pic = customer.pic;
  newPenawaran.value.no_telp = customer.no_telp;
  newPenawaran.value.vessel = customer.vessel;
  newPenawaran.value.email = customer.email;
}

watch(
  () => newPenawaran.value.id_perusahaan,
  (idCustomer) => {
    const customer = customerStore.getDataCustomer.find(
      (item) => (item.id_customer || item.id) === idCustomer,
    );
    if (!customer) return;
    applyCustomer(customer);
  },
);

function statusColor(status: string) {
  if (status === "INVOICE") return "warning";
  if (status === "Draft") return "primary";
  if (status === "Ditolak") return "error";
  return "grey";
}

function openDialogTambahPenawaran() {
  data.penawaranAddEdit = "add";
  data.editOriginalTermconditionId = "";
  termConditionSearch.value = "";
  customMarkupPercentages.value = {};
  newPenawaran.value = emptyPenawaran();
  initializeTermConditionOrder();
  data.dialogTambahPenawaran = true;
}

function openDialogEditPenawaran(item: penawaranM) {
  const customers = customerStore.getDataCustomer;
  const customer =
    customers.find(
      (dataCustomer) =>
        (dataCustomer.id_customer || dataCustomer.id_customer) ===
        item.id_perusahaan,
    ) ??
    customers.find(
      (dataCustomer) => dataCustomer.nama === item.id_perusahaan,
    ) ??
    customers.find(
      (dataCustomer) => dataCustomer.nama === item.nama_perusahaan,
    );

  const penawaran = JSON.parse(JSON.stringify(item)) as penawaranM;
  penawaran.termCondition ??= [];
  newPenawaran.value = penawaran;
  if (customer) applyCustomer(customer);

  data.penawaranAddEdit = "edit";
  termConditionSearch.value = "";
  customMarkupPercentages.value = {};
  initializeTermConditionOrder();
  data.dialogTambahPenawaran = true;
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

async function sinkronkanBarangDariPenawaran() {
  for (const item of newPenawaran.value.penawaran_item) {
    const namaBarang = item.nama?.trim();
    const hargaHpp = Number(item.harga_hpp) || 0;
    if (!namaBarang || hargaHpp <= 0) continue;

    const barangLama = barangStore.getDataBarang.find(
      (barang) =>
        barang.nama_barang.trim().toLocaleLowerCase() ===
        namaBarang.toLocaleLowerCase(),
    );

    if (barangLama) {
      if (Number(barangLama.harga_hpp) !== hargaHpp) {
        await barangStore.updateBarangAct({
          ...barangLama,
          harga_hpp: hargaHpp,
        });
      }
      continue;
    }

    const barangBaru: barangM = {
      nama_barang: namaBarang,
      harga_hpp: hargaHpp,
      createdAt: moment().unix(),
      createdBy: userStore.getEmail,
    };
    await barangStore.addBarangAct(barangBaru);
  }
}

async function simpanPenawaranDialog() {
  if (!newPenawaran.value.id_perusahaan) {
    return notificationStore.showError("Client belum dipilih");
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

  await sinkronkanBarangDariPenawaran();

  if (data.penawaranAddEdit === "add") {
    newPenawaran.value.no_penawaran ||= generateNoPenawaran();
    newPenawaran.value.id_penawaran =
      newPenawaran.value.no_penawaran.replaceAll("/", "-");
    newPenawaran.value.created_at = moment().unix();
    newPenawaran.value.created_by = userStore.getEmail;
    useloadingStore().setLoading(true);
    const result = await setPenawaran(newPenawaran.value);
    if (result !== "ok") {
      useloadingStore().setLoading(false);
      notificationStore.showError(result || "Gagal menyimpan penawaran");
      return;
    }

    data.dialogTambahPenawaran = false;
    newPenawaran.value = emptyPenawaran();
    useloadingStore().setLoading(false);
    await penawaranStore.tarikDataPenawaranAct();
    return;
  }

  await penawaranStore.updatePenawaranAct(newPenawaran.value);

  data.dialogTambahPenawaran = false;
  newPenawaran.value = emptyPenawaran();
}

async function hapusPenawaran(item: penawaranM) {
  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus Penawaran",
    "Anda yakin ingin menghapus penawaran ini? Tindakan ini tidak bisa dipulihkan",
    { variant: "danger" },
  );
  if (!confirmed) return notificationStore.showInfo("Penghapusan dibatalkan");
  await penawaranStore.deletePenawaranAct(item);
  await penawaranStore.tarikDataPenawaranAct();
}

function ubahstatuscancel(item: penawaranM) {
  confirmationDialog.value
    ?.show(
      "Konfirmasi Cancel",
      "Anda yakin ingin Cancel penawaran ini? Tindakan ini hanya merubah status penawaran menjadi 'CANCEL', dan dapat di kembalikan",
      {
        variant: "danger",
      },
    )

    .then(async (confirmed) => {
      if (!confirmed) return notificationStore.showInfo("Cancel dibatalkan");
      item.status = "Cancel";
      console.log("item.status", item.status);
      console.log("item", item);
      await penawaranStore.updatePenawaranAct(item);
      await penawaranStore.tarikDataPenawaranAct();
    });
}

function backtodraft(item: penawaranM) {
  confirmationDialog.value
    ?.show(
      "Konfirmasi Pengembalian",
      "Anda yakin ingin mengembalikan penawaran ini menjadi Draft?",
      {
        variant: "danger",
      },
    )

    .then(async (confirmed) => {
      if (!confirmed) return notificationStore.showError("Cancel dibatalkan");
      item.status = "Draft";
      console.log("item.status", item.status);
      console.log("item", item);
      await penawaranStore.updatePenawaranAct(item);
      await penawaranStore.tarikDataPenawaranAct();
    });
}

async function refreshData() {
  useloadingStore().setLoading(true);
  sessionStorage.removeItem("penawaran");
  await penawaranStore.tarikDataPenawaranAct();
  useloadingStore().setLoading(false);
  notificationStore.showSuccess("Data Penawaran berhasil diperbarui");
}
</script>

<style scoped>
.quotation-page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.quotation-page-heading h1 {
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.quotation-page-heading p {
  margin: 3px 0 0;
  color: #7b8490;
  font-size: 11px;
  line-height: 1.4;
}

.quotation-create-btn {
  height: 34px !important;
  padding-inline: 14px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  border-radius: 5px !important;
  box-shadow: none !important;
}

.quotation-list-card {
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #dfe3e8;
  border-radius: 8px !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.025) !important;
}

.quotation-list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 58px;
  padding: 11px 14px;
}

.quotation-list-search {
  display: flex;
  flex: 1 1 390px;
  align-items: center;
  gap: 7px;
  max-width: 460px;
  height: 34px;
  padding: 0 5px 0 10px;
  color: #8993a0;
  background: #ffffff;
  border: 1px solid #d6dbe1;
  border-radius: 5px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.quotation-list-search:focus-within {
  border-color: #7da5cc;
  box-shadow: 0 0 0 2px rgba(49, 95, 140, 0.08);
}

.quotation-list-search-field {
  flex: 1 1 auto;
  min-width: 0;
}

.quotation-list-search :deep(.form-group),
.quotation-list-search :deep(.input-wrapper) {
  height: 32px;
}

.quotation-list-search :deep(.input-field) {
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

.quotation-list-tools {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
}

.quotation-result-count {
  margin-right: 5px;
  color: #858f9b;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.quotation-toolbar-btn {
  height: 30px !important;
  padding-inline: 10px !important;
  color: #526171 !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  border-color: #d6dbe1 !important;
  border-radius: 4px !important;
}

.quotation-refresh-btn {
  width: 30px !important;
  height: 30px !important;
  color: #65717f !important;
  border-radius: 4px !important;
}

.quotation-filter-panel {
  padding: 12px 14px 14px;
  background: #fbfcfd;
}

.quotation-filter-heading {
  display: flex;
  margin-bottom: 10px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.quotation-filter-eyebrow {
  display: block;
  color: #4c5b6b;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.045em;
  line-height: 1.4;
  text-transform: uppercase;
}

.quotation-filter-heading p {
  margin: 2px 0 0;
  color: #8a94a0;
  font-size: 9.5px;
  line-height: 1.4;
}

.quotation-filter-reset {
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

.quotation-filter-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(100px, 1fr));
  gap: 9px 10px;
}

.quotation-filter-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.quotation-filter-field input,
.quotation-filter-field select {
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

.quotation-filter-field select {
  padding-right: 26px;
  appearance: none;
  cursor: pointer;
}

.quotation-filter-select { position: relative; }

.quotation-filter-select-icon {
  position: absolute;
  top: 50%;
  right: 8px;
  color: #7f8995;
  pointer-events: none;
  transform: translateY(-50%);
}

.quotation-filter-field input::placeholder { color: #a3abb4; }
.quotation-filter-field input:focus,
.quotation-filter-field select:focus {
  border-color: #7da5cc;
  box-shadow: 0 0 0 2px rgba(49, 95, 140, 0.08);
}

.quotation-list-table {
  color: #344050;
  font-size: 11px;
}

.quotation-list-table :deep(table) {
  min-width: 1160px;
}

.quotation-list-table :deep(.v-data-table__th) {
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

.quotation-list-table :deep(.v-data-table-header__content) {
  gap: 3px;
}

.quotation-list-table :deep(.v-data-table__td) {
  height: 54px !important;
  padding: 8px 12px !important;
  line-height: 1.35;
  vertical-align: middle;
  border-bottom-color: #edf0f2 !important;
}

.quotation-list-table :deep(tbody tr) {
  transition: background-color 0.12s ease;
}

.quotation-list-table :deep(tbody tr:hover > td) {
  background: #fafbfd !important;
}

.quotation-row-index {
  color: #9aa3ae;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.quotation-reference {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #285f91;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-decoration: none;
  white-space: nowrap;
}

.quotation-reference:hover {
  color: #174a79;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.subject-cell {
  display: -webkit-box;
  min-width: 180px;
  max-width: 250px;
  overflow: hidden;
  color: #556170;
  line-height: 1.42;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.quotation-client-cell {
  min-width: 230px;
  max-width: 285px;
}

.quotation-client-name {
  overflow: hidden;
  color: #273444;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quotation-client-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  margin-top: 4px;
  overflow: hidden;
  color: #7a8592;
  font-size: 9.5px;
  white-space: nowrap;
}

.quotation-client-meta span {
  display: inline-flex;
  min-width: 0;
  max-width: 96px;
  align-items: center;
  gap: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quotation-client-meta span:first-child {
  max-width: 105px;
}

.quotation-client-meta i {
  flex: 0 0 3px;
  width: 3px;
  height: 3px;
  background: #eaecee;
  border-radius: 50%;
}

.quotation-date-cell {
  color: #556170;
  font-size: 10.5px;
  white-space: nowrap;
}

.quotation-amount-cell {
  display: inline-block;
  color: #273444;
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.quotation-price-cell {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 1px;
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

.quotation-original-amount {
  color: #8f9aa7;
  font-size: 9.5px;
  font-weight: 500;
  text-decoration-color: #9ca6b1;
  text-decoration-thickness: 1px;
}

.quotation-table-status {
  height: 22px !important;
  padding-inline: 8px !important;
  font-size: 9px !important;
  font-weight: 700 !important;
  letter-spacing: 0.015em !important;
  border-radius: 4px !important;
}

.quotation-row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.quotation-action-trigger {
  width: 28px !important;
  height: 28px !important;
  border-radius: 4px !important;
}

.quotation-action-trigger:hover {
  color: #26384b !important;
  background: #eef1f4 !important;
}

.quotation-action-menu {
  padding: 4px !important;
  border: 1px solid #dfe3e8;
  border-radius: 6px !important;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12) !important;
}

.quotation-action-menu :deep(.v-list-item) {
  min-height: 32px !important;
  padding-inline: 9px !important;
  border-radius: 4px !important;
}

.quotation-action-menu :deep(.v-list-item-title) {
  font-size: 10.5px !important;
  font-weight: 500;
}

.quotation-action-menu :deep(.v-list-item__prepend > .v-icon) {
  margin-inline-end: 9px !important;
  font-size: 16px !important;
}

.quotation-menu-danger:not(.v-list-item--disabled) {
  color: #b44949 !important;
}

.quotation-empty-state {
  padding: 44px 16px;
  color: #8a949f;
  font-size: 11px;
  text-align: center;
}

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
  color: #1f2937;
  background: #f5f6f8;
  border: 1px solid #d9dee5;
  border-radius: 10px !important;
  overflow: hidden;
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
  flex-direction: column;
  gap: 14px;
  padding: 18px !important;
  background: #f5f6f8;
}

.quotation-form-section {
  padding: 18px;
  background: #ffffff;
  border: 1px solid #dfe3e8;
  border-radius: 7px;
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

.quotation-client-picker {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) auto;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 14px;
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

.quotation-client-details {
  display: grid;
  grid-template-columns: minmax(190px, 1.7fr) repeat(4, minmax(100px, 1fr));
  gap: 1px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #dfe3e8;
  border: 1px solid #dfe3e8;
  border-radius: 5px;
}

.quotation-client-detail {
  min-width: 0;
  min-height: 52px;
  padding: 8px 11px;
  background: #fafbfc;
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
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
}

.quotation-currency-section {
  padding: 13px 18px;
  background: #ffffff;
  border: 1px solid #dfe3e8;
  border-radius: 7px;
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
  flex: 0 0 160px;
  width: 160px;
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
  margin: 14px 18px 0;
  padding: 14px;
  background: #fbfcfd;
  border: 1px solid #dfe3e8;
  border-radius: 6px;
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
  width: calc(100% - 36px);
  min-height: 34px;
  margin: 12px 18px 16px;
  color: #4f6377;
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  background: #ffffff;
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
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
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
  height: 72px;
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

@media (max-width: 1199px) {
  .quotation-filter-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 959px) {
  .quotation-filter-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .quotation-dialog-body {
    padding: 14px !important;
  }

  .quotation-item-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .quotation-client-details {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .quotation-client-address {
    grid-column: 1 / -1;
  }

  .quotation-commercial-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .quotation-list-toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: 9px;
  }

  .quotation-list-search {
    width: 100%;
    max-width: none;
    flex-basis: auto;
  }

  .quotation-list-tools { justify-content: flex-end; }

  .quotation-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 599px) {
  .quotation-filter-panel,
  .quotation-filter-divider,
  .quotation-filter-toggle {
    display: none !important;
  }

  .quotation-dialog-card {
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

  .quotation-dialog-body {
    gap: 10px;
    padding: 10px !important;
  }

  .quotation-form-section {
    padding: 14px;
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

  .quotation-subject-field,
  .quotation-client-address {
    grid-column: auto;
  }

  .quotation-client-picker {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .quotation-currency-section {
    padding: 13px 14px;
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
    padding: 13px 14px;
  }

  .quotation-line-item {
    margin: 10px 10px 0;
    padding: 12px;
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
    width: calc(100% - 20px);
    margin: 10px;
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
