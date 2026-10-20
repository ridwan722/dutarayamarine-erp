<template>
  <!-- MOBILE BOTTOM SHEET DIALOG FOR EDIT ITEM -->
  <v-dialog v-model="itemModal.show" max-width="480px" scrollable>
    <v-card class="item-dialog-card">
      <v-card-title class="item-dialog-header">
        <span>Edit Detail Item</span>
        <v-btn icon size="small" variant="text" @click="itemModal.show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="item-dialog-body" v-if="activeItem">
        <div class="form-group">
          <label class="form-label">Tipe Item</label>
          <a-select-new v-model="activeItem.type">
            <option value="price">Harga / Biaya</option>
            <option value="included">Termasuk (Included)</option>
            <option value="description">Keterangan Saja</option>
          </a-select-new>
        </div>

        <div class="form-group">
          <label class="form-label">Deskripsi / Nama Item</label>
          <a-textarea-new
            v-model="activeItem.description"
            placeholder="Nama item / part number"
            rows="3"
          />
        </div>

        <template v-if="['price', 'included'].includes(activeItem.type)">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Qty</label>
              <a-field-number-new v-model="activeItem.qty" placeholder="1" />
            </div>

            <div class="form-group">
              <label class="form-label">Satuan (Unit)</label>
              <a-select-new
                v-model="activeItem.uom"
                :items="['Set', 'Sets', 'Lot', 'Pcs', 'Unit']"
              >
              </a-select-new>
            </div>
          </div>
        </template>

        <template v-if="activeItem.type === 'price'">
          <div class="form-group">
            <label class="form-label"
              >Harga Satuan ({{ currency || "IDR" }})</label
            >
            <a-field-number-new
              v-model="activeItem.price"
              placeholder="0"
              :allow-decimal="currency !== 'IDR'"
              :step="currency === 'IDR' ? 1 : 0.01"
            />
          </div>
        </template>
      </v-card-text>

      <v-card-actions class="item-dialog-actions">
        <v-btn color="error" variant="text" @click="deleteActiveItem">
          Hapus
        </v-btn>
        <v-spacer />
        <v-btn
          color="#111827"
          theme="dark"
          variant="flat"
          @click="itemModal.show = false"
        >
          Selesai
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog
    v-model="isOpen"
    max-width="1040"
    scrollable
    persistent
    class="po-dialog-overlay"
  >
    <v-card class="po-card" elevation="0">
      <header class="po-header">
        <div class="po-header-content">
          <div class="po-header-icon" aria-hidden="true">
            <v-icon icon="mdi-truck-delivery-outline" size="20" />
          </div>
          <div>
            <h2 class="po-title">
              {{
                isEditing
                  ? "Edit Purchase Order (PO)"
                  : "Keluarkan Purchase Order (PO)"
              }}
            </h2>
            <p class="po-subtitle">
              Nomor purchase order dibuat otomatis saat disimpan
            </p>
          </div>
        </div>

        <div class="po-header-actions">
          <span class="po-status">
            <span class="po-status-dot"></span>
            {{ isEditing ? "Edit Mode" : "Draft" }}
          </span>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            color="grey-darken-1"
            aria-label="Tutup dialog purchase order"
            @click="isOpen = false"
          />
        </div>
      </header>

      <v-progress-linear
        v-if="isLoadingPurchaseorder"
        indeterminate
        color="primary"
      />

      <v-card-text class="po-content">
        <section class="po-form-section">
          <div class="po-form-section-header">
            <div>
              <span class="po-form-section-index">01</span>
              <h3>Vendor Information</h3>
            </div>
            <p>Pilih vendor untuk purchase order ini.</p>
          </div>

          <div class="po-vendor-picker">
            <a-date-picker-new
              v-model="tgl_purchaseorder"
              label="Tanggal PO"
              class="po-date-field"
            />
            <a-select-new
              v-model="selectedVendorId"
              :items="vendorOptions"
              item-title="nama_vendor"
              item-value="id_vendor"
              label="Pilih Vendor"
              class="po-vendor-select"
            />
          </div>

          <dl class="po-vendor-details">
            <div class="po-vendor-detail">
              <dt>Vendor</dt>
              <dd>
                {{
                  selectedVendor?.nama_vendor ||
                  editingPurchaseorder?.nama_vendor ||
                  "—"
                }}
              </dd>
            </div>
            <div class="po-vendor-detail po-vendor-address">
              <dt>Address</dt>
              <dd>
                {{
                  selectedVendor?.alamat_vendor ||
                  editingPurchaseorder?.alamat_vendor ||
                  "—"
                }}
              </dd>
            </div>
            <div class="po-vendor-detail">
              <dt>PIC</dt>
              <dd>
                {{
                  selectedVendor?.pic_vendor ||
                  editingPurchaseorder?.pic_vendor ||
                  "—"
                }}
              </dd>
            </div>
            <div class="po-vendor-detail">
              <dt>Phone Number</dt>
              <dd>
                {{
                  selectedVendor?.no_telp_vendor ||
                  editingPurchaseorder?.no_telp_vendor ||
                  "—"
                }}
              </dd>
            </div>
            <div class="po-vendor-detail">
              <dt>Email</dt>
              <dd>
                {{
                  selectedVendor?.email_vendor ||
                  editingPurchaseorder?.email_vendor ||
                  "—"
                }}
              </dd>
            </div>
          </dl>
        </section>

        <section class="po-transaction-section">
          <div class="po-transaction-heading">
            <div>
              <h3>Transaction Details</h3>
              <p>Referensi, pembayaran, currency, dan subject purchase order.</p>
            </div>
            <a-select-new
              v-model="currency"
              :items="['IDR', 'SGD', 'USD']"
              label="Currency"
              class="po-currency-field"
            />
          </div>

          <div class="po-transaction-fields">
            <a-text-field-new v-model="payment" label="Payment" />
            <a-text-field-new
              v-model="no_quotation_from_vendor"
              label="NO Quotation (vendor)"
            />
            <a-text-field-new
              v-model="perihal_purchaseorder"
              label="Subject"
              class="po-subject-field"
            />
          </div>
        </section>

        <div class="po-items-heading">
          <div>
            <span class="po-form-section-index">02</span>
            <h3>Purchase Order Items</h3>
          </div>
          <p>Rincian pekerjaan dan item purchase order.</p>
        </div>
        <div class="po-items-editor">
          <div
            v-for="(section, sectionIndex) in form.sections"
            :key="sectionIndex"
            class="po-section"
          >
          <!-- SECTION HEADER -->
          <div class="section-header">
            <div class="section-number">{{ sectionIndex + 1 }}</div>
            <input
              v-model="section.title"
              placeholder="Judul pekerjaan"
              class="section-title-input"
            />
            <button
              v-if="form.sections.length > 1"
              type="button"
              class="btn-delete-icon"
              @click="form.sections.splice(sectionIndex, 1)"
            >
              <v-icon size="16" color="#ef4444">mdi-delete-outline</v-icon>
            </button>
          </div>

          <!-- DESCRIPTION -->
          <div class="section-description">
            <a-textarea-new
              v-model="section.description"
              placeholder="Deskripsi pekerjaan / scope of works"
              rows="2"
              class="section-textarea"
            />
          </div>

          <!-- 1. DESKTOP VIEW: TABLE (Tampil di > 768px) -->
          <div class="table-wrapper desktop-only">
            <table class="item-table">
              <thead>
                <tr>
                  <th class="col-item">Item</th>
                  <th class="col-qty">Qty</th>
                  <th class="col-unit">Unit</th>
                  <th class="col-price">Harga ({{ currency || "IDR" }})</th>
                  <th class="col-total">Total</th>
                  <th class="col-action"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, itemIndex) in section.items"
                  :key="itemIndex"
                  :class="
                    itemIndex % 2 === 0 ? 'item-row-even' : 'item-row-odd'
                  "
                >
                  <td class="item-cell">
                    <a-textarea-new
                      v-model="item.description"
                      placeholder="Nama item / part number"
                      :rows="item.type === 'description' ? 1 : 2"
                      class="item-input"
                    />
                  </td>
                  <td class="item-cell item-center">
                    <template v-if="['price', 'included'].includes(item.type)">
                      <a-field-number-new
                        v-model="item.qty"
                        placeholder="1"
                        class="table-number-input"
                      />
                    </template>
                    <span v-else class="empty-value">—</span>
                  </td>
                  <td class="item-cell">
                    <template v-if="['price', 'included'].includes(item.type)">
                      <a-select-new
                        v-model="item.uom"
                        :items="['Set', 'Sets', 'Lot', 'Pcs', 'Unit']"
                      >
                      </a-select-new>
                    </template>
                    <span v-else class="empty-value">—</span>
                  </td>
                  <td class="item-cell">
                    <template v-if="item.type === 'price'">
                      <a-field-number-new
                        v-model="item.price"
                        placeholder="0"
                        class="table-number-input"
                        :allow-decimal="currency !== 'IDR'"
                        :step="currency === 'IDR' ? 1 : 0.01"
                      />
                    </template>
                    <span
                      v-else-if="item.type === 'included'"
                      class="included-value"
                      >Included</span
                    >
                    <span v-else class="empty-value">—</span>
                  </td>
                  <td class="item-cell text-right">
                    <template v-if="item.type === 'price'">
                      <div class="item-total">
                        {{
                          formatCurrency(
                            (Number(item.qty) || 0) * (Number(item.price) || 0),
                          )
                        }}
                      </div>
                    </template>
                    <span
                      v-else-if="item.type === 'included'"
                      class="included-total"
                      >Included</span
                    >
                    <span v-else class="empty-value">—</span>
                  </td>
                  <td class="item-cell text-center">
                    <button
                      type="button"
                      class="btn-delete-icon"
                      @click="section.items.splice(itemIndex, 1)"
                    >
                      <v-icon size="14" color="#9ca3af">mdi-close</v-icon>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 2. MOBILE VIEW: CARDS (Tampil di <= 767px) -->
          <div class="mobile-only mobile-items-list">
            <div
              v-for="(item, itemIndex) in section.items"
              :key="itemIndex"
              class="mobile-item-card"
              @click="openItemModal(sectionIndex, itemIndex)"
            >
              <div class="mobile-item-main">
                <div class="mobile-item-title">
                  {{ item.description || "Top tap untuk isi detail item..." }}
                </div>
                <div class="mobile-item-sub">
                  <template v-if="item.type === 'price'">
                    {{ item.qty || 0 }} {{ item.uom }} x
                    {{ formatCurrency(Number(item.price) || 0) }}
                  </template>
                  <template v-else-if="item.type === 'included'">
                    {{ item.qty || 0 }} {{ item.uom }} (Included)
                  </template>
                  <template v-else> Hanya Keterangan </template>
                </div>
              </div>

              <div class="mobile-item-right">
                <div class="mobile-item-total">
                  <template v-if="item.type === 'price'">
                    {{
                      formatCurrency(
                        (Number(item.qty) || 0) * (Number(item.price) || 0),
                      )
                    }}
                  </template>
                  <template v-else-if="item.type === 'included'">
                    Included
                  </template>
                  <template v-else> — </template>
                </div>
                <v-icon size="16" color="#9ca3af">mdi-chevron-right</v-icon>
              </div>
            </div>
          </div>

          <!-- BUTTON ADD ITEM -->
          <div class="section-actions">
            <button
              type="button"
              class="add-item-button"
              @click="addItem(sectionIndex)"
            >
              <v-icon size="14">mdi-plus</v-icon>
              Tambah Item
            </button>
          </div>
          </div>

          <!-- ADD SECTION -->
          <button
            type="button"
            class="add-section-button"
            @click="
              form.sections.push({
                title: '',
                description: '',
                diskon_purchaseorder: 0,
                id_vendor: '',
                nama_vendor: '',
                items: [
                  {
                    description: '',
                    type: 'price',
                    qty: 1,
                    uom: 'Set',
                    price: 0,
                  },
                ],
              })
            "
          >
            <v-icon size="14">mdi-plus</v-icon>
            Tambah Pekerjaan / Section Baru
          </button>
        </div>

        <div class="po-commercial-grid">
          <section class="po-form-section po-summary-section">
            <div class="po-form-section-header">
              <div>
                <span class="po-form-section-index">03</span>
                <h3>Commercial Summary</h3>
              </div>
              <p>Nilai purchase order dan diskon.</p>
            </div>

            <div class="summary-wrapper">
              <div class="summary">
                <div class="summary-row">
                  <span class="summary-label">Subtotal</span>
                  <span class="summary-value">{{
                    formatCurrency(subtotal_purchaseorder)
                  }}</span>
                </div>

                <div class="summary-row discount-row">
                  <div class="discount-label">
                    <span>Diskon</span>
                    <div class="discount-fields ml-2">
                      <label class="discount-field">
                        <span class="discount-field-caption">Persen</span>
                        <span
                          class="discount-input-wrapper"
                          :class="{
                            'discount-input-active':
                              discountInputMode === 'percent',
                          }"
                        >
                          <input
                            v-model.number="discountPercentModel"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            class="discount-input"
                          />
                          <span class="discount-percent">%</span>
                        </span>
                      </label>

                      <span class="discount-or">atau</span>

                      <label class="discount-field discount-field-nominal">
                        <span class="discount-field-caption">
                          Nominal ({{ currency || "IDR" }})
                        </span>
                        <span
                          class="discount-input-wrapper nominal-input-wrapper"
                          :class="{
                            'discount-input-active':
                              discountInputMode === 'nominal',
                          }"
                        >
                          <span class="discount-currency">
                            {{ currency || "IDR" }}
                          </span>
                          <input
                            v-model.number="discountNominalModel"
                            type="number"
                            min="0"
                            :max="subtotal_purchaseorder"
                            :step="currency === 'IDR' ? 1 : 0.01"
                            class="discount-input nominal-discount-input"
                          />
                        </span>
                      </label>
                    </div>
                  </div>
                  <span class="discount-value">
                    - {{ formatCurrency(discountAmount) }}
                  </span>
                </div>

                <div class="grand-total-row">
                  <span>Grand Total</span>
                  <span class="grand-total-amount">
                    {{ formatCurrency(grandtotal_purchaseorder) }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section class="po-form-section po-sign-section">
            <div class="po-form-section-header">
              <div>
                <span class="po-form-section-index">04</span>
                <h3>Authorization</h3>
              </div>
              <p>Penandatangan purchase order.</p>
            </div>

            <a-select-new
              v-model="sign_po_by"
              :items="[
                'Seilla Maryana',
                'Leo Adiatmaja Sembiring',
                'Muhammad Ridwan',
              ]"
              label="Sign Purchase Order By ?"
            />

            <div v-if="sign_po_by" class="po-signature-preview">
              <div
                v-if="sign_po_by === 'Leo Adiatmaja Sembiring'"
                class="signature-content"
              >
                <v-img width="130" height="65" contain src="/ttd_leo.png" />
                <div class="signature-line"></div>
                <div class="signature-name">Leo Adiatmaja Sembiring</div>
              </div>

              <div
                v-if="sign_po_by === 'Seilla Maryana'"
                class="signature-content"
              >
                <v-img width="130" height="65" contain src="/ttd_seilla.png" />
                <div class="signature-line"></div>
                <div class="signature-name">Seilla Maryana</div>
              </div>

              <div
                v-if="sign_po_by === 'Muhammad Ridwan'"
                class="signature-content"
              >
                <v-img width="130" height="65" contain src="/ttd_ridwan.png" />
                <div class="signature-line"></div>
                <div class="signature-name">Muhammad Ridwan</div>
              </div>
            </div>
          </section>
        </div>
      </v-card-text>

      <footer class="po-dialog-footer">
        <p>
          Pastikan vendor, item, dan nilai purchase order sudah sesuai sebelum
          disimpan.
        </p>
        <div>
          <v-btn
            color="grey-darken-1"
            variant="outlined"
            size="small"
            class="text-none po-cancel-btn"
            @click="isOpen = false"
          >
            Cancel
          </v-btn>

          <v-btn
            size="small"
            color="primary"
            variant="flat"
            prepend-icon="mdi-content-save-outline"
            class="text-none po-save-btn"
            :loading="isSaving"
            :disabled="
              isLoadingPurchaseorder || isSaving || purchaseorderLoadFailed
            "
            @click="addpurchaseorder"
          >
            {{
              isEditing ? "Simpan Perubahan PO" : "Simpan Purchase Order (PO)"
            }}
          </v-btn>
        </div>
      </footer>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { collection, getDocs } from "firebase/firestore";
import { useFirestore } from "vuefire";
import {
  createPurchaseorder,
  updatePurchaseorder,
} from "~/composables/useInvoiceAresaDigital";
import type { penawaranM } from "~/types/penawaranModel";
import type { vendorM } from "~/types/vendorModel";
import type {
  purchaseorderM,
  purchaseorderSectionM,
} from "~/types/purchaseorderModel";
import moment from "moment";

const props = defineProps<{
  modelValue: boolean;
  penawaran: penawaranM;
}>();
const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "saved"): void;
}>();
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const vendorStore = usevendorStore();
const db = useFirestore();
const perihal_purchaseorder = ref("");
const payment = ref("");
const sign_po_by = ref("");
const tgl_purchaseorder = ref("");
const no_quotation_from_vendor = ref("");
const currency = ref("IDR");
const formatCurrency = (value: number) => {
  const code = currency.value || "IDR";
  const locale = code === "IDR" ? "id-ID" : code === "SGD" ? "en-SG" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    currencyDisplay: "code",
    minimumFractionDigits: code === "IDR" ? 0 : 2,
    maximumFractionDigits: code === "IDR" ? 0 : 2,
  }).format(Number(value) || 0);
};
const selectedVendorId = ref("");
const editingPurchaseorder = ref<purchaseorderM | null>(null);
const isLoadingPurchaseorder = ref(false);
const isSaving = ref(false);
const purchaseorderLoadFailed = ref(false);
const isEditing = computed(() =>
  Boolean(editingPurchaseorder.value?.id_purchaseorder),
);
const discountInputMode = ref<"percent" | "nominal">("percent");
const vendorOptions = computed(() =>
  vendorStore.getDataVendor.map((vendor) => ({
    ...vendor,
    // queryambilid menambahkan ID dokumen sebagai `id`, bukan `id_vendor`.
    id_vendor: vendor.id_vendor ?? (vendor as vendorM & { id?: string }).id,
  })),
);
const selectedVendor = computed<vendorM | undefined>(() =>
  vendorOptions.value.find(
    (vendor) => vendor.id_vendor === selectedVendorId.value,
  ),
);

onMounted(() => {
  if (!vendorStore.getDataVendor.length) {
    void vendorStore.tarikDataVendorAct();
  }
});

const resetForm = () => {
  editingPurchaseorder.value = null;
  perihal_purchaseorder.value = "";
  payment.value = "";
  sign_po_by.value = "Seilla Maryana";
  tgl_purchaseorder.value = moment().format("YYYY-MM-DD");
  no_quotation_from_vendor.value = "";
  currency.value = "IDR";
  selectedVendorId.value = "";
  discountInputMode.value = "percent";
  form.value = {
    sections: [
      {
        title: "",
        description: "",
        diskon_purchaseorder: 0,
        id_vendor: "",
        nama_vendor: "",
        items: [
          { description: "", type: "price", qty: 1, uom: "Set", price: 0 },
        ],
      },
    ],
    diskon_purchaseorder: 0,
    diskon_nominal_purchaseorder: 0,
  };
};

const loadPurchaseorder = async () => {
  const idPenawaran = props.penawaran?.id_penawaran;
  if (!idPenawaran) {
    resetForm();
    return;
  }

  isLoadingPurchaseorder.value = true;
  purchaseorderLoadFailed.value = false;
  try {
    const snapshot = await getDocs(
      collection(db, "penawaran", idPenawaran, "purchaseorder"),
    );
    const existingDoc = snapshot.docs[0];
    if (!existingDoc) {
      resetForm();
      return;
    }

    const purchaseorder = {
      ...existingDoc.data(),
      id_purchaseorder: existingDoc.id,
    } as purchaseorderM;
    editingPurchaseorder.value = purchaseorder;
    perihal_purchaseorder.value = purchaseorder.perihal_purchaseorder || "";
    payment.value = purchaseorder.payment || "";
    sign_po_by.value = purchaseorder.sign_po_by || "";
    tgl_purchaseorder.value = purchaseorder.tgl_purchaseorder || "";
    no_quotation_from_vendor.value =
      purchaseorder.no_quotation_from_vendor || "";
    currency.value = purchaseorder.currency || "IDR";
    selectedVendorId.value = purchaseorder.id_vendor || "";
    discountInputMode.value =
      purchaseorder.tipe_diskon_purchaseorder === "nominal"
        ? "nominal"
        : "percent";
    form.value = {
      diskon_purchaseorder: Number(purchaseorder.diskon_purchaseorder) || 0,
      diskon_nominal_purchaseorder:
        Number(purchaseorder.diskon_nominal_purchaseorder) || 0,
      sections: (purchaseorder.item_purchaseorder || []).map((section) => ({
        title: section.title || "",
        description: section.description || "",
        diskon_purchaseorder: 0,
        id_vendor: purchaseorder.id_vendor,
        nama_vendor: purchaseorder.nama_vendor,
        items: (section.items || []).map((item) => ({
          description: item.nama || "",
          type: item.type || "price",
          qty: Number(item.qty) || 0,
          uom: item.uom || "Set",
          price: Number(item.price) || 0,
        })),
      })),
    };
    if (discountInputMode.value === "nominal") {
      syncDiscountFromNominal();
    } else {
      syncDiscountFromPercent();
    }
    if (!form.value.sections.length) resetForm();
  } catch (error) {
    console.error("Gagal mengambil Purchase Order:", error);
    purchaseorderLoadFailed.value = true;
    useNotificationStore().showError("Gagal memuat Purchase Order");
  } finally {
    isLoadingPurchaseorder.value = false;
  }
};

watch(isOpen, (opened) => {
  if (opened) void loadPurchaseorder();
});

interface Item {
  description: string;
  type: "price" | "included" | "description";
  qty: number;
  uom: string;
  price: number;
}

interface Section {
  title: string;
  description: string;
  items: Item[];
  diskon_purchaseorder: number;
  nama_vendor: string;
  id_vendor?: string;
}

const form = ref<{
  sections: Section[];
  diskon_purchaseorder: number;
  diskon_nominal_purchaseorder: number;
}>({
  sections: [
    {
      title: "",
      description: "",
      diskon_purchaseorder: 0,
      id_vendor: "",
      nama_vendor: "",
      items: [
        {
          description: "",
          type: "price",
          qty: 1,
          uom: "Set",
          price: 0,
        },
      ],
    },
  ],
  diskon_purchaseorder: 0,
  diskon_nominal_purchaseorder: 0,
});

// Modal State
const itemModal = ref({
  show: false,
  sectionIndex: -1,
  itemIndex: -1,
});

const activeItem = computed(() => {
  if (
    itemModal.value.sectionIndex >= 0 &&
    itemModal.value.itemIndex >= 0 &&
    form.value.sections[itemModal.value.sectionIndex]?.items[
      itemModal.value.itemIndex
    ]
  ) {
    return form.value.sections[itemModal.value.sectionIndex].items[
      itemModal.value.itemIndex
    ];
  }
  return null;
});

const openItemModal = (sectionIdx: number, itemIdx: number) => {
  itemModal.value.sectionIndex = sectionIdx;
  itemModal.value.itemIndex = itemIdx;
  itemModal.value.show = true;
};

const addItem = (sectionIdx: number) => {
  const newIndex =
    form.value.sections[sectionIdx].items.push({
      description: "",
      type: "price",
      qty: 1,
      uom: "Set",
      price: 0,
    }) - 1;

  // Jika di mobile (lebar layar <= 767px), langsung buka dialog editnya
  if (window.innerWidth <= 767) {
    openItemModal(sectionIdx, newIndex);
  }
};

const deleteActiveItem = () => {
  if (itemModal.value.sectionIndex >= 0 && itemModal.value.itemIndex >= 0) {
    form.value.sections[itemModal.value.sectionIndex].items.splice(
      itemModal.value.itemIndex,
      1,
    );
    itemModal.value.show = false;
  }
};

const subtotal_purchaseorder = computed(() => {
  return form.value.sections.reduce((sectionTotal, section) => {
    return (
      sectionTotal +
      section.items.reduce((itemTotal, item) => {
        if (item.type !== "price") return itemTotal;
        return itemTotal + (Number(item.qty) || 0) * (Number(item.price) || 0);
      }, 0)
    );
  }, 0);
});

const roundCurrencyAmount = (value: number) => {
  const fractionDigits = currency.value === "IDR" ? 0 : 2;
  return Number((Number(value) || 0).toFixed(fractionDigits));
};

const normalizeDiscountPercent = (value: number | string) =>
  Math.min(Math.max(Number(value) || 0, 0), 100);

const normalizeDiscountNominal = (value: number | string) =>
  roundCurrencyAmount(
    Math.min(
      Math.max(Number(value) || 0, 0),
      Math.max(subtotal_purchaseorder.value, 0),
    ),
  );

const syncDiscountFromPercent = () => {
  const percent = normalizeDiscountPercent(form.value.diskon_purchaseorder);
  form.value.diskon_purchaseorder = percent;
  form.value.diskon_nominal_purchaseorder = roundCurrencyAmount(
    subtotal_purchaseorder.value * (percent / 100),
  );
};

const syncDiscountFromNominal = () => {
  const nominal = normalizeDiscountNominal(
    form.value.diskon_nominal_purchaseorder,
  );
  form.value.diskon_nominal_purchaseorder = nominal;
  form.value.diskon_purchaseorder = subtotal_purchaseorder.value
    ? Number(((nominal / subtotal_purchaseorder.value) * 100).toFixed(8))
    : 0;
};

const discountPercentModel = computed<number>({
  get: () => form.value.diskon_purchaseorder,
  set: (value) => {
    discountInputMode.value = "percent";
    form.value.diskon_purchaseorder = normalizeDiscountPercent(value);
    syncDiscountFromPercent();
  },
});

const discountNominalModel = computed<number>({
  get: () => form.value.diskon_nominal_purchaseorder,
  set: (value) => {
    discountInputMode.value = "nominal";
    form.value.diskon_nominal_purchaseorder = normalizeDiscountNominal(value);
    syncDiscountFromNominal();
  },
});

watch([subtotal_purchaseorder, currency], () => {
  if (discountInputMode.value === "nominal") {
    syncDiscountFromNominal();
  } else {
    syncDiscountFromPercent();
  }
});

const discountAmount = computed(() => {
  if (discountInputMode.value === "percent") {
    return roundCurrencyAmount(
      subtotal_purchaseorder.value *
        (normalizeDiscountPercent(form.value.diskon_purchaseorder) / 100),
    );
  }

  return normalizeDiscountNominal(form.value.diskon_nominal_purchaseorder);
});

const grandtotal_purchaseorder = computed(() => {
  return Math.max(0, subtotal_purchaseorder.value - discountAmount.value);
});

async function addpurchaseorder() {
  const penawaran = props.penawaran || usePenawaranStore().getDetailPenawaran;
  if (!penawaran.id_penawaran || !penawaran.no_penawaran) {
    useNotificationStore().showError("Data penawaran tidak ditemukan");
    return;
  }
  const vendor = selectedVendor.value;
  if (!vendor?.id_vendor && !editingPurchaseorder.value?.id_vendor) {
    useNotificationStore().showError("Silakan pilih vendor");
    return;
  }

  const item_purchaseorder: purchaseorderSectionM[] = form.value.sections.map(
    (section) => ({
      title: section.title,
      description: section.description,
      items: section.items.map((item) => ({
        nama: item.description,
        type: item.type,
        qty: Number(item.qty) || 0,
        uom: item.uom as purchaseorderSectionM["items"][number]["uom"],
        price: Number(item.price) || 0,
      })),
    }),
  );

  if (discountInputMode.value === "nominal") {
    syncDiscountFromNominal();
  } else {
    syncDiscountFromPercent();
  }

  const dataPurchaseorder: purchaseorderM = {
    id_penawaran: penawaran.id_penawaran,
    no_penawaran: penawaran.no_penawaran,
    tanggal_penawaran: penawaran.tanggal_penawaran,
    perihal_purchaseorder: perihal_purchaseorder.value.trim(),
    payment: payment.value.trim(),
    sign_po_by: sign_po_by.value.trim(),
    tgl_purchaseorder: tgl_purchaseorder.value.trim(),
    no_quotation_from_vendor: no_quotation_from_vendor.value.trim(),
    currency: currency.value.trim(),
    item_purchaseorder,
    subtotal_purchaseorder: subtotal_purchaseorder.value,
    diskon_purchaseorder: Number(form.value.diskon_purchaseorder) || 0,
    diskon_nominal_purchaseorder: discountAmount.value,
    tipe_diskon_purchaseorder: discountInputMode.value,
    grandtotal_purchaseorder: grandtotal_purchaseorder.value,
    termCondition: editingPurchaseorder.value?.termCondition || [],
    id_vendor: vendor?.id_vendor || editingPurchaseorder.value!.id_vendor,
    nama_vendor: vendor?.nama_vendor || editingPurchaseorder.value!.nama_vendor,
    pic_vendor: vendor?.pic_vendor || editingPurchaseorder.value!.pic_vendor,
    no_telp_vendor:
      vendor?.no_telp_vendor || editingPurchaseorder.value!.no_telp_vendor,
    alamat_vendor:
      vendor?.alamat_vendor || editingPurchaseorder.value!.alamat_vendor,
    email_vendor:
      vendor?.email_vendor || editingPurchaseorder.value!.email_vendor,
  };

  try {
    isSaving.value = true;
    if (editingPurchaseorder.value?.id_purchaseorder) {
      await updatePurchaseorder(
        editingPurchaseorder.value.id_purchaseorder,
        dataPurchaseorder,
      );
      useNotificationStore().showSuccess("Purchase Order berhasil diperbarui");
    } else {
      await createPurchaseorder(dataPurchaseorder);
      useNotificationStore().showSuccess("Purchase Order berhasil dibuat");
    }
    emit("saved");
    isOpen.value = false;
  } catch (error) {
    console.error("Gagal menyimpan Purchase Order:", error);
    useNotificationStore().showError("Gagal menyimpan Purchase Order");
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.desktop-only {
  display: block !important;
}
.mobile-only {
  display: none !important;
}

@media (max-width: 767px) {
  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: block !important;
  }
}

.po-card {
  color: #1f2937;
  background: #f5f6f8;
  border: 1px solid #d9dee5;
  border-radius: 10px !important;
  overflow: hidden;
}

.po-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 72px;
  padding: 14px 20px;
  background: #ffffff;
  border-bottom: 1px solid #dfe3e8;
}

.po-header-content,
.po-header-actions,
.po-header-content > div:last-child {
  display: flex;
  align-items: center;
  min-width: 0;
}

.po-header-content {
  gap: 12px;
}

.po-header-content > div:last-child {
  align-items: flex-start;
  flex-direction: column;
}

.po-header-icon {
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

.po-header-actions {
  flex: 0 0 auto;
  gap: 8px;
}

.po-status {
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

.po-status-dot {
  width: 6px;
  height: 6px;
  background: #d8972e;
  border-radius: 50%;
}

.po-title {
  margin: 0;
  color: #202833;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
}

.po-subtitle {
  max-width: 520px;
  margin: 2px 0 0;
  overflow: hidden;
  color: #7a8491;
  font-size: 11px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.po-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px !important;
  background: #f5f6f8;
}

.po-form-section {
  padding: 18px;
  background: #ffffff;
  border: 1px solid #dfe3e8;
  border-radius: 7px;
}

.po-form-section-header,
.po-items-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.po-form-section-header > div,
.po-items-heading > div {
  display: flex;
  align-items: center;
  gap: 9px;
}

.po-form-section-header h3,
.po-items-heading h3 {
  margin: 0;
  color: #27313d;
  font-size: 13px;
  font-weight: 700;
  line-height: 22px;
}

.po-form-section-header p,
.po-items-heading p {
  margin: 3px 0 0;
  color: #8a939f;
  font-size: 10px;
  line-height: 1.5;
  text-align: right;
}

.po-form-section-index {
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

.po-vendor-picker {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 14px;
}

.po-date-field,
.po-vendor-select {
  min-width: 0;
}

.po-vendor-details {
  display: grid;
  grid-template-columns:
    minmax(145px, 1.2fr) minmax(190px, 1.7fr)
    repeat(3, minmax(100px, 1fr));
  gap: 1px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #dfe3e8;
  border: 1px solid #dfe3e8;
  border-radius: 5px;
}

.po-vendor-detail {
  min-width: 0;
  min-height: 52px;
  padding: 8px 11px;
  background: #fafbfc;
}

.po-vendor-detail dt {
  margin-bottom: 3px;
  color: #828c98;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.035em;
  line-height: 1.25;
  text-transform: uppercase;
}

.po-vendor-detail dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: #354150;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
}

.po-transaction-section {
  padding: 13px 18px;
  background: #ffffff;
  border: 1px solid #dfe3e8;
  border-radius: 7px;
}

.po-transaction-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 13px;
}

.po-transaction-heading > div:first-child {
  min-width: 0;
}

.po-transaction-heading h3 {
  margin: 0;
  color: #27313d;
  font-size: 12px;
  font-weight: 700;
}

.po-transaction-heading p {
  margin: 2px 0 0;
  color: #8a939f;
  font-size: 10px;
}

.po-currency-field {
  flex: 0 0 160px;
  width: 160px;
}

.po-transaction-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.po-subject-field {
  grid-column: 1 / -1;
}

.po-items-heading {
  align-items: center;
  margin: 0;
  padding: 16px 18px;
  background: #ffffff;
  border: 1px solid #dfe3e8;
  border-radius: 7px;
}

.po-commercial-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
  gap: 14px;
}

.po-summary-section,
.po-sign-section {
  min-width: 0;
}

.po-signature-preview {
  display: grid;
  min-height: 112px;
  margin-top: 12px;
  padding: 12px;
  place-items: center;
  background: #fafbfc;
  border: 1px solid #e1e5ea;
  border-radius: 5px;
}

.signature-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.signature-line {
  width: 180px;
  margin-top: -2px;
  border-bottom: 1px solid #737b86;
}

.signature-name {
  margin-top: 7px;
  color: #303740;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
}

.po-section {
  margin-bottom: 10px;
  margin-top: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.section-number {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 4px;
  background: #f4630f;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}

.section-title-input {
  flex: 1;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  outline: none;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
}

.section-description {
  padding: 8px;
}

.mobile-items-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
}

.mobile-item-card:active {
  background: #f3f4f6;
}

.mobile-item-title {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mobile-item-sub {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}

.mobile-item-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mobile-item-total {
  font-size: 12px;
  font-weight: 600;
  color: #111827;
}

.table-wrapper {
  width: 100%;
}

.item-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 12px;
}

.item-table th {
  padding: 8px 6px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 11px;
  font-weight: 600;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}

.col-item {
  width: 42%;
  text-align: left;
}
.col-qty {
  width: 10%;
  text-align: center;
}
.col-unit {
  width: 12%;
  text-align: center;
}
.col-price {
  width: 16%;
  text-align: right;
}
.col-total {
  width: 16%;
  text-align: right;
}
.col-action {
  width: 4%;
  text-align: center;
}

.item-cell {
  padding: 6px;
  vertical-align: middle;
  border-bottom: 1px solid #eef0f2;
}

.unit-select {
  width: 100%;
  height: 30px;
  padding: 0 4px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  font-size: 11px;
}

.btn-delete-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.section-actions {
  padding: 8px;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
}

.add-item-button,
.add-section-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: #374151;
  font-size: 12px;
  cursor: pointer;
}

.add-section-button {
  width: 100%;
  justify-content: center;
  margin-top: 8px;
}

.summary-wrapper {
  margin: 0;
}

.summary {
  width: 100%;
  padding: 0;
  color: #697585;
  font-size: 11px;
  border-top: 1px solid #e1e5ea;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 38px;
  margin: 0;
  border-bottom: 1px solid #edf0f2;
}

.summary-value {
  color: #303a46;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.discount-row {
  align-items: flex-end;
  min-height: 66px;
  padding: 8px 0;
}

.discount-label,
.discount-fields,
.discount-field {
  display: flex;
}

.discount-label {
  align-items: flex-end;
  flex: 1;
  min-width: 0;
}

.discount-fields {
  align-items: flex-end;
  gap: 7px;
}

.discount-field {
  flex-direction: column;
  gap: 3px;
}

.discount-field-caption {
  color: #6b7280;
  font-size: 9px;
  font-weight: 600;
}

.discount-or {
  padding-bottom: 6px;
  color: #9ca3af;
  font-size: 9px;
}

.discount-input-wrapper {
  display: inline-flex;
  align-items: center;
  width: 65px;
  height: 26px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.discount-input-active {
  border-color: #2563eb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.12);
}

.nominal-input-wrapper {
  width: 170px;
}

.discount-currency {
  align-self: stretch;
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  border-right: 1px solid #e5e7eb;
  background: #f8fafc;
  color: #6b7280;
  font-size: 9px;
  font-weight: 700;
}

.discount-input {
  min-width: 0;
  width: 100%;
  text-align: left;
  padding: 0 4px;
  border: none;
  outline: none;
  font-size: 11px;
}

.discount-percent {
  padding-right: 4px;
  font-size: 11px;
  color: #9ca3af;
}

.discount-value {
  margin-left: 12px;
  color: #b54747;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.grand-total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 50px;
  color: #263443;
  font-size: 12px;
  font-weight: 700;
}

.grand-total-amount {
  color: #173f66;
  font-size: 17px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.po-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 64px;
  padding: 12px 20px;
  background: #ffffff;
  border-top: 1px solid #dfe3e8;
}

.po-dialog-footer p {
  margin: 0;
  color: #7b8591;
  font-size: 10px;
  line-height: 1.45;
}

.po-dialog-footer > div {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.po-cancel-btn,
.po-save-btn {
  min-width: 104px;
  height: 34px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  border-radius: 4px !important;
}

.po-save-btn {
  min-width: 174px;
}

.po-card :deep(.input-field),
.po-card :deep(.date-input-wrapper) {
  border-radius: 4px;
}

.item-dialog-card {
  border-radius: 12px !important;
}

.item-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.item-dialog-body {
  padding: 16px !important;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 11px;
  font-weight: 600;
  color: #4b5563;
}

.form-select {
  height: 36px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0 8px;
  font-size: 13px;
  background: #fff;
  outline: none;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.item-dialog-actions {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 959px) {
  .po-dialog-overlay :deep(.v-overlay__content) {
    width: 100%;
    max-width: none !important;
    height: 100%;
    max-height: 100% !important;
    margin: 0;
  }

  .po-card {
    height: 100%;
    border: 0;
    border-radius: 0 !important;
  }

  .po-content {
    padding: 14px !important;
  }

  .po-vendor-details {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .po-commercial-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .po-header {
    min-height: 64px;
    padding: 11px 12px;
  }

  .po-header-content {
    gap: 9px;
  }

  .po-header-icon {
    flex-basis: 32px;
    width: 32px;
    height: 32px;
  }

  .po-title {
    font-size: 14px;
  }

  .po-subtitle,
  .po-status {
    display: none;
  }

  .po-content {
    gap: 10px;
    padding: 10px !important;
  }

  .po-form-section {
    padding: 14px;
  }

  .po-form-section-header {
    margin-bottom: 13px;
  }

  .po-form-section-header p,
  .po-items-heading p {
    display: none;
  }

  .po-vendor-picker,
  .po-vendor-details,
  .po-transaction-fields {
    grid-template-columns: 1fr;
  }

  .po-transaction-section {
    padding: 13px 14px;
  }

  .po-transaction-heading {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }

  .po-currency-field {
    flex-basis: auto;
    width: 100%;
  }

  .po-subject-field {
    grid-column: auto;
  }

  .po-items-heading {
    padding: 13px 14px;
  }

  .discount-row,
  .discount-label {
    align-items: stretch;
    flex-direction: column;
  }

  .discount-fields {
    margin-left: 0 !important;
    margin-top: 6px;
  }

  .discount-field-nominal,
  .nominal-input-wrapper {
    flex: 1;
    min-width: 0;
  }

  .discount-value {
    align-self: flex-end;
    margin-left: 0;
    margin-top: 7px;
  }

  .po-dialog-footer {
    align-items: stretch;
    padding: 10px 12px;
  }

  .po-dialog-footer p {
    display: none;
  }

  .po-dialog-footer > div {
    display: grid;
    flex: 1;
    grid-template-columns: 1fr 1.4fr;
  }

  .po-cancel-btn,
  .po-save-btn {
    width: 100%;
    min-width: 0;
  }
}
</style>
