<template>
  <ConfirmationDialog ref="confirmationDialog" />

 <v-dialog
  v-model="data.dialogTambahMasterPerusahaan"
  max-width="320"
  persistent
>
  <v-card class="rounded border elevation-1 bg-white">
    <!-- Header Padat -->
    <div class="px-4 py-2-5 pa-3 d-flex align-center justify-space-between border-b">
      <span class="text-caption font-weight-bold text-grey-darken-3">Tambah Master Client</span>
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
          <div v-if="saranFieldCustomer('nama', newCustomer.nama).length" >
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
            >{{ value }}</v-chip>
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
            >{{ value }}</v-chip>
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
            >{{ value }}</v-chip>
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
            >{{ value }}</v-chip>
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
            >{{ value }}</v-chip>
          </div>


    </v-card-text>

    <!-- Footer Padat -->
    <div class="px-3 py-2 border-t d-flex justify-end gap-1 bg-grey-lighten-5">
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
    max-width="800"
    scrollable
    :fullscreen="display.mdAndDown.value"
    persistent
  >
    <v-card class="rounded-xl-md overflow-hidden elevation-3 border-0">
      <v-card-item class="pa-2 bg-primary text-center">
        <h4 class="font-weight-bold text-body-1">
          {{ data.penawaranAddEdit === "add" ? "Create" : "Edit" }} Quotation
        </h4>
        <!-- <p class="text-caption text-grey-darken-1 m-0">
          Lengkapi rincian penawaran harga dan item pekerjaan di bawah ini.
        </p> -->
      </v-card-item>

      <v-card-text class="pa-4">
        <a-date-picker-new
          v-model="newPenawaran.tanggal_penawaran"
          label="Quotation Date"
        />
        <v-row class="mt-2">
          <v-col class="d-flex align-end ga-2">
            <a-select-new
              class="flex-grow-1"
              v-model="newPenawaran.id_perusahaan"
              label="Client"
              placeholder="Select"
              item-title="label"
              item-value="id_customer"
              :items="
                customerStore.getDataCustomer.map((customer) => ({
                  ...customer,
                  label: [customer.nama, customer.vessel]
                    .filter(Boolean)
                    .join(' - '),
                }))
              "
            />
            <v-btn
              class="mb-1 flex-shrink-0 text-none"
              variant="outlined"
              color="grey-darken-2"
              width="28"
              height="28"
              min-width="28"
              rounded="1"
              aria-label="Tambah client"
              @click="opendialogTambahMasterPerusahaan"
            >
              <v-icon icon="mdi-plus-circle" color="primary" size="15" />

              <v-tooltip activator="parent" location="top">
                Add New Client
              </v-tooltip>
            </v-btn>
          </v-col>
        </v-row>
        <a-textarea-new
          class="mt-2"
          v-model="newPenawaran.alamat_perusahaan"
          placeholder="Address"
          disabled
        />
        <v-row no-gutters>
          <v-col cols="6" md="3" class="pa-1">
            <a-text-field-new
              v-model="newPenawaran.pic"
              placeholder="PIC"
              disabled
            />
          </v-col>
          <v-col cols="6" md="3" class="pa-1">
            <a-text-field-new
              v-model="newPenawaran.no_telp"
              placeholder="Phone Number"
              disabled
            />
          </v-col>
          <v-col cols="6" md="3" class="pa-1">
            <a-text-field-new
              v-model="newPenawaran.email"
              placeholder="Email"
              disabled
            />
          </v-col>
          <v-col cols="6" md="3" class="pa-1">
            <a-text-field-new
              v-model="newPenawaran.vessel"
              placeholder="Vessel"
              disabled
            />
          </v-col>
        </v-row>

        <v-divider class="my-2 border-opacity-50" />

        <a-textarea-new
          v-model="newPenawaran.perihal"
          label="Subject"
          placeholder="Quotation Subject"
          rows="2"
        />

        <a-select-new
          v-model="newPenawaran.currency"
          label="Currency"
          :items="[
            { title: 'IDR', value: 'IDR' },
            { title: 'USD', value: 'USD' },
            { title: 'SGD', value: 'SGD' },
          ]"
        />

        <div class="mx-auto text-center mb-3 mt-2">
          <span class="text-subtitle-2 font-weight-bold text-primary">
            Rincian Item
          </span>
        </div>

        <!-- Loop Item Penawaran -->
        <v-row
          v-for="(item, index) in newPenawaran.penawaran_item"
          :key="index"
          class="bg-grey-lighten-5 rounded-lg mx-0 mt-0 mb-4 border border-dashed position-relative"
          @focusin="activeSuggestionIndex = index"
          @focusout="activeSuggestionIndex = null"
        >
          <v-col cols="10" md="11">
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-body-1 font-weight-bold text-primary"
                >#{{ index + 1 }}.</span
              >
            </div>

            <a-textarea-new
              v-model="item.nama"
              label="Description"
              placeholder="Description"
            />

            <span
              v-if="
                activeSuggestionIndex === index &&
                barangSesuaiNama(item.nama).length
              "
              class="text-grey text-caption mr-1"
            >
              Suggestion (Hpp):
            </span>
            <v-chip
              v-for="(barang, idxBarang) in activeSuggestionIndex === index
                ? barangSesuaiNama(item.nama)
                : []"
              :key="barang.id ?? idxBarang"
              size="x-small"
              class="mr-1 mb-1 text-grey"
            >
              {{ barang.nama_barang }} : Rp {{ rupiah(barang.harga_hpp) }}
            </v-chip>

            <div class="d-flex align-center flex-wrap my-2">
              <a-checkbox
                label="Barang"
                :model-value="item.kategori_item === 'Barang'"
                @update:model-value="setKategoriItem(item, 'Barang', $event)"
              />
              <a-checkbox
                label="Jasa"
                class="ml-2"
                :model-value="item.kategori_item === 'Jasa'"
                @update:model-value="setKategoriItem(item, 'Jasa', $event)"
              />
              <a-checkbox
                label="Barang & Jasa"
                class="ml-2"
                :model-value="item.kategori_item === 'Barang & Jasa'"
                @update:model-value="
                  setKategoriItem(item, 'Barang & Jasa', $event)
                "
              />
            </div>

            <v-row density="compact" no-gutters>
              <v-col cols="6" sm="2" class="pa-1">
                <a-field-number-new
                  v-model="item.qty"
                  label="Qty"
                  placeholder="0"
                />
              </v-col>
              <v-col cols="6" sm="2" class="pa-1">
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
              </v-col>
              <v-col cols="12" sm="2" class="pa-1">
                <a-field-number-new
                  v-model="item.harga_hpp"
                  label="Hpp (Opsional)"
                  placeholder="0"
                />
                <v-chip
                  v-if="item.harga_hpp > 0"
                  v-for="persentase in [10, 20, 30]"
                  :key="persentase"
                  size="x-small"
                  color="green"
                  class="mr-1 mt-1"
                  :disabled="!Number(item.harga_hpp)"
                  @click="terapkanMarkup(item, persentase)"
                >
                  <v-icon start size="small"
                    >mdi-arrow-up-drop-circle-outline</v-icon
                  >
                  {{ persentase }}%
                </v-chip>
              </v-col>
              <v-col cols="12" sm="3" class="pa-1">
                <a-field-number-new
                  v-model="item.amount"
                  :label="`Harga satuan (${currencyLabel(newPenawaran.currency)})`"
                  placeholder="0"
                />
              </v-col>
              <v-col cols="12" sm="3" class="pa-1">
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
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="2" md="1">
            <v-btn
              icon="mdi-trash-can-outline"
              size="x-small"
              variant="outlined"
              color="error"
              style="border-radius: 8px; height: 100%"
              @mouseover="
                $event.currentTarget.style.backgroundColor = '#ffebee'
              "
              @mouseout="
                $event.currentTarget.style.backgroundColor = 'transparent'
              "
              @click="hapusBarisPenawaran(index)"
            />
          </v-col>
        </v-row>

        <div class="text-center">
          <v-btn
            size="small"
            variant="flat"
            color="primary"
            prepend-icon="mdi-plus"
            class="text-none font-weight-semibold rounded-lg"
            @click="tambahBarisPenawaran"
          >
            Tambah Baris
          </v-btn>
        </div>

        <v-divider class="my-4 border-opacity-50" />

        <v-card variant="flat" class="quotation-total-card rounded-large pa-4">
          <div
            class="d-flex flex-wrap justify-space-between align-center ga-3 mb-3"
          >
            <div>
              <div class="text-subtitle-1 font-weight-bold text-grey-darken-4">
                Summary
              </div>
            </div>
            <div class="discount-inputs">
              <v-text-field
                v-model.number="discountPercentPenawaran"
                label="Diskon (%)"
                type="number"
                suffix="%"
                min="0"
                max="100"
                step="0.01"
                density="compact"
                variant="outlined"
                hide-details
                class="discount-input"
              />
              <v-text-field
                v-model="discountAmountInput"
                label="Diskon Nominal"
                type="text"
                inputmode="decimal"
                :prefix="currencyInputPrefix"
                density="compact"
                variant="outlined"
                hide-details
                class="discount-input"
                @focus="startEditingDiscountAmount"
                @blur="finishEditingDiscountAmount"
              />
            </div>
          </div>
          <v-divider class="mb-1" />
          <div class="d-flex justify-space-between align-center text-caption">
            <span class="text-medium-emphasis">Subtotal</span>
            <span class="font-weight-medium">
              {{ formatCurrency(subtotalPenawaran, newPenawaran.currency) }}
            </span>
          </div>
          <div
            class="d-flex justify-space-between align-center text-caption mb-1"
          >
            <span class="text-medium-emphasis">
              Discount ({{ discountPercentPenawaran }}%)
            </span>
            <span class="font-weight-medium text-red font-italic">
              -
              {{
                formatCurrency(discountAmountPenawaran, newPenawaran.currency)
              }}
            </span>
          </div>
          <v-divider class="mb-1" />
          <div class="d-flex justify-space-between align-center">
            <span class="text-subtitle-1 text-grey-darken-4">
              Total Quotation
            </span>
            <span class="text-h6 font-weight-black">
              {{ formatCurrency(grandTotalPenawaran, newPenawaran.currency) }}
            </span>
          </div>
        </v-card>

        <v-card class="sign-card mt-3 mx-auto" elevation="0">
          <!-- Header -->
          <div class="sign-card-header">
            <div>
              <div class="sign-card-title">Sign By</div>
              <div class="sign-card-subtitle">Yang Bertanda Tangan</div>
            </div>

            <v-icon size="20" color="grey-darken-1"> mdi-draw-pen </v-icon>
          </div>

          <v-divider />

          <!-- Content -->
          <v-card-text class="sign-card-content">
            <a-select-new
              v-model="newPenawaran.sign_by"
              :items="[
                'Seilla Maryana',
                'Leo Adiatmaja Sembiring',
                'Muhammad Ridwan',
                'Lilis',
              ]"
              class="sign-select"
            />

            <!-- Signature -->
            <div v-if="newPenawaran.sign_by" class="signature-box">
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
          </v-card-text>
        </v-card>

        <div class="mt-4">
          <span class="text-caption">
            <strong>TERMS &amp; CONDITIONS:</strong>
          </span>

          <div class="d-flex align-center">
            <a-text-field-new
              v-model="termConditionSearch"
              placeholder="Cari term&condition"
            />
            <v-btn
              v-if="termConditionSearch"
              class="ml-2 mb-2"
              icon="mdi-close-circle"
              size="24"
              variant="text"
              color="red"
              density="compact"
              aria-label="Hapus pencarian term dan condition"
              @click="termConditionSearch = ''"
            />
          </div>

          <table
            style="
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
              border: 1px solid #9ca3af;
            "
          >
            <tbody>
              <tr
                v-for="(item, index) in sortedTermConditions"
                :key="item.id ?? index"
              >
                <td
                  style="
                    width: 25px;
                    padding: 3px 5px;
                    vertical-align: top;
                    text-align: center;
                    border: 1px solid #9ca3af;
                  "
                >
                  {{ index + 1 }}.
                </td>

                <td
                  style="
                    width: 30px;

                    border: 1px solid #9ca3af;
                  "
                >
                  <v-checkbox
                    v-model="newPenawaran.termCondition"
                    :value="{ id: item.id ?? '', nama_term: item.nama_term }"
                    :value-comparator="sameTermCondition"
                    density="compact"
                    hide-details
                    color="primary"
                    style="
                      margin: -6px 0 0 0;
                      padding: 0;
                      transform: scale(0.7);
                      transform-origin: center;
                    "
                  />
                </td>

                <td
                  style="
                    padding: 4px 6px;
                    vertical-align: top;
                    line-height: 1.4;
                    border: 1px solid #9ca3af;
                  "
                >
                  {{ item.nama_term }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer class="hidden-xs-only" />
        <v-btn
          size="small"
          variant="outlined"
          color="grey-darken-1"
          class="flex-grow-1 flex-sm-grow-0"
          @click="data.dialogTambahPenawaran = false"
        >
          Cancel
        </v-btn>
        <v-btn
          size="small"
          color="primary"
          variant="flat"
          class="font-weight-bold flex-grow-1 flex-sm-grow-0"
          @click="simpanPenawaranDialog"
        >
          {{ data.penawaranAddEdit === "add" ? "Save Quotation" : "Edit" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Header & Top Action -->
  <div
    class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center mb-4 gap-2"
  >
    <h1 class="text-h5 font-weight-bold my-0">Quotation</h1>
    <v-btn
      color="primary"
      variant="flat"
      size="small"
      class="text-capitalize w-100 w-sm-auto"
      prepend-icon="mdi-plus"
      @click="openDialogTambahPenawaran"
    >
      Create New Quotation
    </v-btn>
  </div>

  <!-- Main Table Card -->
  <v-card class="border rounded-lg" flat>
    <v-card-title class="pa-3 pa-sm-4">
      <div class="d-flex align-center gap-2">
        <div class="flex-grow-1" style="display: flex; align-items: center">
          <a-text-field-new
            v-model="data.searchPenawaran"
            placeholder="Cari semua kolom penawaran"
          />
          <v-btn
            v-if="data.searchPenawaran"
            icon
            size="x-small"
            variant="text"
            color="red"
            aria-label="Hapus pencarian"
            class="mb-2"
            @click="kosonginPencarian"
          >
            <v-icon size="20">mdi-close-circle-outline</v-icon>
          </v-btn>
        </div>
        <v-btn
          size="x-small"
          class="border mb-2"
          @click="tariksemua"
          variant="text"
        >
          Get All Status
        </v-btn>
        <v-btn
          size="23"
          variant="outlined"
          class="border flex-shrink-0 mb-2"
          @click="refreshData"
        >
          <v-icon size="15" icon="mdi-refresh" />
          <v-tooltip activator="parent" location="top">
            Refresh Data
          </v-tooltip>
        </v-btn>
      </div>
    </v-card-title>

    <v-divider />

    <!-- Responsive Table -->
    <v-data-table
      :headers="data.headPenawaran"
      :items="penawaranTampilTersaring"
      :items-per-page="-1"
      density="compact"
      :sort-by="[{ key: 'created_at', order: 'desc' }]"
      :hover="true"
      class="text-no-wrap"
    >
      <template v-slot:item.no="{ index }"> {{ index + 1 }}</template>

      <template v-slot:item.no_penawaran="{ item }">
        <div class="text-center">
          <NuxtLink :to="'/admin/penawaran/' + item.id" class="quotation-link">
            <span class="quotation-badge">
              {{ item.no_penawaran }}
            </span>
          </NuxtLink>
        </div>
      </template>

      <template v-slot:item.perihal="{ item }">
        <div class="subject-cell">
          <span>{{ item.perihal }}</span>
        </div>
      </template>

      <template v-slot:item.nama_perusahaan="{ item }">
        <div style="display: flex; align-items: center">
          <v-icon color="primary" class="mb-1 mr-2">mdi-domain</v-icon>
          {{ item.nama_perusahaan }}
        </div>
      </template>

      <template v-slot:item.tanggal_penawaran="{ item }">
        {{ rubahtanggallengkap(item.tanggal_penawaran) }}
      </template>

      <template v-slot:item.grand_total="{ item }">
        <strong>{{
          formatCurrency(item.grand_total_penawaran, item.currency)
        }}</strong>
      </template>

      <template v-slot:item.status="{ item }">
        <v-chip
          size="x-small"
          :color="statusColor(item.status)"
          variant="flat"
          class="font-weight-bold"
        >
          {{ item.status }}
        </v-chip>
      </template>

      <template v-slot:item.aksi="{ item }">
        <div class="d-flex justify-center align-center">
          <v-btn
            :disabled="item.status == 'Cancel'"
            size="28"
            variant="tonal"
            color="info"
            class="rounded-lg mr-1"
            :to="'/admin/penawaran/' + item.id"
          >
            <v-icon size="16" icon="mdi-eye" />
            <v-tooltip activator="parent" location="top"
              >Detail Penawaran</v-tooltip
            >
          </v-btn>

          <v-btn
            :disabled="item.status !== 'Draft'"
            size="28"
            variant="tonal"
            color="warning"
            class="rounded-lg mr-1"
            @click="openDialogEditPenawaran(item)"
          >
            <v-icon size="16" icon="mdi-pencil-outline" />
            <v-tooltip activator="parent" location="top"
              >Edit Penawaran</v-tooltip
            >
          </v-btn>

          <v-btn
            :disabled="item.status !== 'Draft'"
            size="28"
            variant="tonal"
            color="grey"
            class="rounded-lg"
            @click="hapusPenawaran(item)"
          >
            <v-icon size="16" icon="mdi-trash-can-outline" />
            <v-tooltip activator="parent" location="top">Hapus</v-tooltip>
          </v-btn>

          <v-divider vertical class="ml-2"></v-divider>

          <v-btn
            v-if="item.status !== 'Cancel'"
            size="28"
            variant="tonal"
            color="error"
            class="rounded-lg ml-2"
            :disabled="item.status !== 'Draft'"
            @click="ubahstatuscancel(item)"
          >
            <v-icon size="16" icon="mdi-alpha-x-circle-outline" />
            <v-tooltip activator="parent" location="top"
              >Cancel Penawaran</v-tooltip
            >
          </v-btn>

          <!-- KEMBALIKAN -->
          <v-btn
            v-if="item.status === 'Cancel'"
            size="28"
            variant="tonal"
            color="error"
            class="rounded-lg ml-2"
            @click="backtodraft(item)"
          >
            <v-icon size="16" icon="mdi-keyboard-return" />
            <v-tooltip activator="parent" location="top"
              >Kembalikan menjadi Draft</v-tooltip
            >
          </v-btn>
        </div>
      </template>

      <template v-slot:no-data>
        <div class="py-8 text-center text-grey-darken-1">
          <v-icon
            size="48"
            color="grey-lighten-1"
            class="mb-2"
            icon="mdi-file-document-edit-outline"
          />
          <div class="text-body-1">Belum ada data Penawaran</div>
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
import type { penawaranM } from "~/types/penawaranModel";
import type { barangM } from "~/types/barangModel";
import type { customerM } from "~/types/customerModel";

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
  useloadingStore().setLoading(true);
  await penawaranStore.tarikdatapenawaranbystatusarray(["Draft", "INVOICE"]);
  useloadingStore().setLoading(false);
  await customerStore.tarikDataCustomerAct();
  await termconditionStore.tarikDataTermconditionAct();
  await barangStore.tarikDataBarangAct();
});

const tariksemua = async () => {
  await penawaranStore.tarikDataPenawaranAct();
};

const kosonginPencarian = () => {
  data.searchPenawaran = "";
};

const data = reactive({
  searchPenawaran: "",

  dialogTambahPenawaran: false,
  dialogTambahMasterPerusahaan: false,
  penawaranAddEdit: "add" as "add" | "edit",
  editOriginalTermconditionId: "",
  editOriginalBarangId: "",
  headPenawaran: [
    { title: "No", value: "no", width: "10px" },
    { title: "Date", value: "tanggal_penawaran", sortable: true },
    { title: "Quotation Ref No", value: "no_penawaran", sortable: true },
    { title: "Client", value: "nama_perusahaan", sortable: true },
    { title: "Subject", value: "perihal", sortable: true, width: "220px" },
    { title: "Total Amount", value: "grand_total", sortable: true },
    { title: "Status", value: "status", sortable: true },
    { title: "Aksi", align: "center" as const, value: "aksi", width: "120px" },
  ],
});

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

const penawaranTampilTersaring = computed(() => {
  const query = data.searchPenawaran.trim().toLocaleLowerCase("id-ID");
  const items = penawaranStore.getDataPenawaranTampil;

  if (!query) return items;

  const searchableColumns = data.headPenawaran
    .map((header) => header.value)
    .filter(
      (value): value is string =>
        typeof value === "string" && value !== "no" && value !== "aksi",
    );

  return items.filter((item) =>
    searchableColumns.some((key) => {
      const itemKey = key === "grand_total" ? "grand_total_penawaran" : key;
      const value = item[itemKey as keyof typeof item];
      if (value == null) return false;

      const searchableValue =
        key === "grand_total" && typeof value === "number"
          ? `${value} ${rupiah(value)}`
          : String(value);

      return searchableValue.toLocaleLowerCase("id-ID").includes(query);
    }),
  );
});

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

const sortedTermConditions = computed(() => {
  const search = termConditionSearch.value.trim().toLocaleLowerCase();
  const selectedTerms = newPenawaran.value.termCondition ?? [];
  return termconditionStore.getDataTermcondition
    .filter((term) =>
      term.nama_term.toLocaleLowerCase().includes(search),
    )
    .sort((a, b) => {
      const aSelected = selectedTerms.some((selected) =>
        sameTermCondition(selected, {
          id: a.id ?? "",
          nama_term: a.nama_term,
        }),
      );
      const bSelected = selectedTerms.some((selected) =>
        sameTermCondition(selected, {
          id: b.id ?? "",
          nama_term: b.nama_term,
        }),
      );

      if (aSelected !== bSelected) return aSelected ? -1 : 1;
      return a.nama_term.localeCompare(b.nama_term, "id-ID");
    });
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

function sameTermCondition(
  left: NonNullable<penawaranM["termCondition"]>[number],
  right: NonNullable<penawaranM["termCondition"]>[number],
) {
  return left.id && right.id
    ? left.id === right.id
    : left.nama_term === right.nama_term;
}

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
  newPenawaran.value = emptyPenawaran();
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
  item: { harga_hpp: number; amount: number },
  persentase: number,
) {
  const hargaHpp = Number(item.harga_hpp) || 0;
  if (hargaHpp <= 0) return;

  item.amount = hargaHpp * (1 + persentase / 100);
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
    return notificationStore.showError("Tanggal dan perihal wajib diisi");
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
    await penawaranStore.tarikdatapenawaranbystatusarray(["Draft", "INVOICE"]);
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
      await penawaranStore.tarikdatapenawaranbystatusarray([
        "Draft",
        "INVOICE",
      ]);
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
      await penawaranStore.tarikdatapenawaranbystatusarray([
        "Draft",
        "INVOICE",
      ]);
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
.quotation-link {
  text-decoration: none;
}

.subject-cell {
  display: block;
  max-width: 220px;
  min-width: 200px;
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.35;
}

.quotation-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2px;
  border: 1px solid #dbeafe;
  transition: all 0.1s ease;
}

.quotation-badge:hover {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 3px 8px rgba(37, 99, 235, 0.2);
  transform: translateY(-1px);
}

.quotation-total-card {
  background: linear-gradient(135deg, #f4f8ff 0%, #f8fafc 100%);
  border: 1px solid #dbe5f2;
}

.discount-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: min(100%, 360px);
}

.discount-input {
  flex: 1 1 150px;
  min-width: 0;
}

.gap-2 {
  gap: 8px;
}

.sign-card {
  width: 100%;
  max-width: 380px;
  background: #ffffff;
  border: 1px solid #e1e5ea;
  border-radius: 12px;
  overflow: hidden;
}

.sign-card-header {
  min-height: 62px;
  padding: 7px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sign-card-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: 0.2px;
}

.sign-card-subtitle {
  margin-top: 2px;
  font-size: 11px;
  color: #8a929d;
}

.sign-card-content {
  padding: 18px;
}

.field-label {
  margin-bottom: 7px;
  font-size: 11px;
  font-weight: 600;
  color: #5f6874;
  letter-spacing: 0.2px;
}

.sign-select {
  margin-bottom: 14px;
}

/* Signature area */
.signature-box {
  margin-top: 8px;
  padding: 16px 14px 14px;
  background: #fafbfc;
  border: 1px solid #e5e8ec;
  border-radius: 8px;
}

.signature-label {
  margin-bottom: 8px;
  font-size: 9px;
  font-weight: 700;
  color: #9aa1aa;
  letter-spacing: 1px;
  text-align: center;
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
</style>
