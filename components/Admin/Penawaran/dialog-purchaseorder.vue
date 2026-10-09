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

  <v-dialog v-model="isOpen" max-width="960px" scrollable persistent>
    <v-card class="po-card">
      <!-- HEADER -->
      <v-card-title class="po-header">
        <div class="po-header-content">
          <v-icon size="30">mdi-human-dolly</v-icon>
          <div>
            <div class="po-title">
              {{
                isEditing
                  ? "Edit Purchase Order (PO)"
                  : "Keluarkan Purchase Order (PO)"
              }}
            </div>
            <div class="po-subtitle">Purchase Order (PO)</div>
          </div>
        </div>
      </v-card-title>

      <v-progress-linear
        v-if="isLoadingPurchaseorder"
        indeterminate
        color="primary"
      />

      <v-card-text class="po-content">
        <a-date-picker-new
          v-model="tgl_purchaseorder"
          label="Tanggal PO"
          class="mb-4"
        />

        <v-row>
          <v-col>
            <a-text-field-new v-model="payment" label="Payment" class="mb-2" />

            <a-text-field-new
              v-model="perihal_purchaseorder"
              label="Subject"
              class="mb-2"
            />
          </v-col>
          <v-col>
            <a-select-new
              v-model="selectedVendorId"
              :items="vendorOptions"
              item-title="nama_vendor"
              item-value="id_vendor"
              label="Pilih Vendor"
              class="mb-2"
            />
            <a-text-field-new
              v-model="no_quotation_from_vendor"
              label="NO Quotation (vendor)"
              class="mb-2"
            />
            <a-select-new
              v-model="currency"
              :items="['IDR', 'SGD', 'USD']"
              label="Currency"
              class="mb-2"
            />
          </v-col>
        </v-row>

        <a-select-new
          v-model="sign_po_by"
          :items="[
            'Seilla Maryana',
            'Leo Adiatmaja Sembiring',
            'Muhammad Ridwan',
          ]"
          label="Sign Purchase Order By ?"
          class="mb-2"
        />

        <v-divider class="my-3"></v-divider>
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

        <!-- SUMMARY -->
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
                <div class="discount-input-wrapper ml-2">
                  <input
                    v-model.number="form.diskon_purchaseorder"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    class="discount-input"
                  />
                  <span class="discount-percent">%</span>
                </div>
              </div>
              <span class="discount-value"
                >- {{ formatCurrency(discountAmount) }}</span
              >
            </div>

            <div class="grand-total-row text-primary">
              <span>Grand Total</span>
              <span class="grand-total-amount">{{
                formatCurrency(grandtotal_purchaseorder)
              }}</span>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="item-dialog-actions justify-end">
        <v-btn color="grey" variant="text" size="small" @click="isOpen = false">
          CANCEL
        </v-btn>

        <v-btn
          size="small"
          color="primary"
          variant="flat"
          :loading="isSaving"
          :disabled="
            isLoadingPurchaseorder || isSaving || purchaseorderLoadFailed
          "
          @click="addpurchaseorder"
        >
          {{ isEditing ? "Simpan Perubahan PO" : "Simpan Purchase Order (PO)" }}
        </v-btn>
      </v-card-actions>
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
    form.value = {
      diskon_purchaseorder: Number(purchaseorder.diskon_purchaseorder) || 0,
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

const form = ref<{ sections: Section[]; diskon_purchaseorder: number }>({
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

const discountAmount = computed(() => {
  const diskon_purchaseorder = Math.min(
    Math.max(Number(form.value.diskon_purchaseorder) || 0, 0),
    100,
  );
  return subtotal_purchaseorder.value * (diskon_purchaseorder / 100);
});

const grandtotal_purchaseorder = computed(() => {
  return subtotal_purchaseorder.value - discountAmount.value;
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
  max-width: 900px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.po-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.po-header-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.po-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.po-subtitle {
  font-size: 11px;
  color: #9ca3af;
}

.po-content {
  padding: 12px;
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
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  margin-top: 10px;
}

.summary {
  width: 100%;
  max-width: 360px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.discount-input-wrapper {
  display: inline-flex;
  align-items: center;
  width: 65px;
  height: 26px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.discount-input {
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

.grand-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
  font-weight: 600;
}

.grand-total-amount {
  font-size: 15px;
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
</style>
