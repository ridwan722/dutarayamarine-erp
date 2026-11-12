<template>
  <section class="invoice-editor-items" aria-labelledby="invoice-editor-items-title">
    <header class="invoice-editor-items__header">
      <div>
        <span>03</span>
        <div>
          <h3 id="invoice-editor-items-title">Invoice Items</h3>
          <p>Description, category, Qty, UOM, dan harga invoice.</p>
        </div>
      </div>
      <strong>{{ items.length }} item</strong>
    </header>

    <div class="invoice-editor-items__body">
      <article
        v-for="(item, index) in items"
        :key="`invoice-item-${index}`"
        class="invoice-editor-item"
      >
        <div class="invoice-editor-item__heading">
          <span>Item {{ String(index + 1).padStart(2, "0") }}</span>
          <v-btn
            icon="mdi-delete-outline"
            size="x-small"
            variant="text"
            color="error"
            :disabled="items.length === 1"
            :aria-label="`Hapus item ${index + 1}`"
            @click="removeItem(index)"
          />
        </div>

        <v-textarea
          :model-value="item.nama"
          label="Description"
          placeholder="Masukkan deskripsi pekerjaan atau barang"
          variant="outlined"
          density="compact"
          rows="2"
          auto-grow
          hide-details
          @update:model-value="updateItem(index, { nama: String($event || '') })"
        />

        <div class="invoice-editor-item__category">
          <label>Category</label>
          <v-btn-toggle
            :model-value="item.kategori_item"
            mandatory
            color="primary"
            variant="outlined"
            density="compact"
            @update:model-value="
              updateItem(index, { kategori_item: String($event || 'Barang') })
            "
          >
            <v-btn value="Barang" size="small" class="text-none">Barang</v-btn>
            <v-btn value="Jasa" size="small" class="text-none">Jasa</v-btn>
            <v-btn value="Barang & Jasa" size="small" class="text-none">
              Barang &amp; Jasa
            </v-btn>
          </v-btn-toggle>
        </div>

        <div class="invoice-editor-item__fields">
          <v-text-field
            :model-value="item.qty"
            label="Qty"
            type="number"
            min="0"
            step="1"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="updateNumber(index, 'qty', $event)"
          />
          <v-select
            :model-value="item.uom"
            :items="uomOptions"
            label="UOM"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="updateItem(index, { uom: String($event || '') })"
          />
          <v-text-field
            :model-value="item.amount"
            :label="`Amount/unit (${currency})`"
            type="number"
            min="0"
            :step="currency === 'IDR' ? 1 : 0.01"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="updateNumber(index, 'amount', $event)"
          />
          <v-text-field
            :model-value="formatCurrency(itemSubtotal(item))"
            label="Subtotal"
            variant="outlined"
            density="compact"
            readonly
            hide-details
          />
        </div>
      </article>

      <button type="button" class="invoice-editor-items__add" @click="addItem">
        <v-icon icon="mdi-plus" size="16" />
        Tambah item pekerjaan
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type {
  invoiceCurrencyM,
  invoiceItemM,
} from "~/types/invoice";

const props = withDefaults(
  defineProps<{
    modelValue: invoiceItemM[];
    currency?: invoiceCurrencyM;
  }>(),
  { currency: "IDR" },
);

const emit = defineEmits<{
  "update:modelValue": [value: invoiceItemM[]];
}>();

const uomOptions = [
  "Unit",
  "Pcs",
  "Kg",
  "Lot",
  "Set",
  "Meter",
  "Box",
  "Liter",
  "Jerigen",
  "Can",
  "Pail",
];

const items = computed(() =>
  Array.isArray(props.modelValue) ? props.modelValue : [],
);
const currency = computed(() => props.currency || "IDR");

function emptyItem(): invoiceItemM {
  return {
    nama: "",
    qty: 1,
    kategori_item: "Barang",
    uom: "Unit",
    amount: 0,
    subtotal_item: 0,
  };
}

function itemSubtotal(item: invoiceItemM) {
  return (Number(item.qty) || 0) * (Number(item.amount) || 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency.value,
    maximumFractionDigits: currency.value === "IDR" ? 0 : 2,
  }).format(value || 0);
}

function updateItem(index: number, patch: Partial<invoiceItemM>) {
  emit(
    "update:modelValue",
    items.value.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const updated = { ...item, ...patch };
      return {
        ...updated,
        subtotal_item: itemSubtotal(updated),
      };
    }),
  );
}

function updateNumber(index: number, field: "qty" | "amount", value: unknown) {
  const parsed = Number(value);
  updateItem(index, { [field]: Number.isFinite(parsed) ? parsed : 0 });
}

function addItem() {
  emit("update:modelValue", [...items.value, emptyItem()]);
}

function removeItem(index: number) {
  if (items.value.length <= 1) return;
  emit(
    "update:modelValue",
    items.value.filter((_, itemIndex) => itemIndex !== index),
  );
}
</script>

<style scoped>
.invoice-editor-items {
  display: block !important;
  overflow: visible !important;
  background: #fff;
  border: 1px solid #dfe3e8;
  border-radius: 7px;
}

.invoice-editor-items__header {
  display: flex !important;
  min-height: 58px;
  padding: 13px 16px;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  background: #fafbfc;
  border-bottom: 1px solid #e4e8ec;
}

.invoice-editor-items__header > div {
  display: flex;
  align-items: center;
  gap: 9px;
}

.invoice-editor-items__header > div > span {
  display: grid;
  width: 28px;
  height: 24px;
  place-items: center;
  color: #5a6877;
  font-size: 9px;
  font-weight: 700;
  background: #f1f3f5;
  border: 1px solid #dce2e7;
  border-radius: 4px;
}

.invoice-editor-items__header h3 {
  margin: 0;
  color: #2c3743;
  font-size: 13px;
  font-weight: 700;
}

.invoice-editor-items__header p {
  margin: 2px 0 0;
  color: #8a949f;
  font-size: 10px;
}

.invoice-editor-items__header > strong {
  padding: 4px 8px;
  color: #536474;
  font-size: 10px;
  background: #eef2f6;
  border-radius: 999px;
}

.invoice-editor-items__body {
  display: block !important;
  padding: 14px;
}

.invoice-editor-item {
  display: block !important;
  padding: 13px;
  background: #fff;
  border: 1px solid #dfe4e8;
  border-radius: 6px;
}

.invoice-editor-item + .invoice-editor-item {
  margin-top: 12px;
}

.invoice-editor-item__heading {
  display: flex;
  margin-bottom: 10px;
  align-items: center;
  justify-content: space-between;
}

.invoice-editor-item__heading > span {
  color: #74808c;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.invoice-editor-item__category {
  display: flex;
  margin: 12px 0;
  align-items: center;
  gap: 16px;
}

.invoice-editor-item__category > label {
  color: #495057;
  font-size: 11px;
  font-weight: 600;
}

.invoice-editor-item__fields {
  display: grid;
  grid-template-columns:
    minmax(70px, 0.55fr) minmax(100px, 0.75fr)
    minmax(170px, 1.2fr) minmax(170px, 1.2fr);
  gap: 10px;
}

.invoice-editor-items__add {
  display: flex !important;
  width: 100%;
  min-height: 38px;
  margin-top: 12px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #365d82;
  font: inherit;
  font-size: 11px;
  font-weight: 650;
  background: #f8fbfd;
  border: 1px dashed #aebdca;
  border-radius: 5px;
  cursor: pointer;
}

.invoice-editor-items__add:hover {
  background: #eef5fa;
  border-color: #7597b5;
}

@media (max-width: 959px) {
  .invoice-editor-item__fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 599px) {
  .invoice-editor-items__header p {
    display: none;
  }

  .invoice-editor-items__body {
    padding: 10px;
  }

  .invoice-editor-item__category {
    align-items: flex-start;
    flex-direction: column;
    gap: 7px;
  }

  .invoice-editor-item__fields {
    grid-template-columns: 1fr;
  }
}
</style>
