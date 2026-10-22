<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useFirestore } from "vuefire";
import {
  fetchPurchaseOrderIndex,
  type IndexedPurchaseOrder,
} from "~/composables/usePurchaseOrderIndex";

definePageMeta({ layout: "admin" });

const db = useFirestore();
const notificationStore = useNotificationStore();
const purchaseOrders = ref<IndexedPurchaseOrder[]>([]);
const search = ref("");
const loading = ref(false);
const loadError = ref("");

const headers = [
  {
    title: "No",
    value: "no",
    width: "48px",
    align: "center" as const,
    sortable: false,
  },
  { title: "Date", value: "tgl_purchaseorder", width: "122px" },
  { title: "PO Ref", value: "no_purchaseorder", width: "210px" },
  { title: "Vendor", value: "nama_vendor", width: "230px" },
  { title: "Based On", value: "no_penawaran", width: "165px" },
  { title: "Subject", value: "perihal_purchaseorder", width: "220px" },
  {
    title: "Total Amount",
    value: "grandtotal_purchaseorder",
    width: "170px",
    align: "end" as const,
  },
  {
    title: "Action",
    value: "aksi",
    width: "58px",
    align: "center" as const,
    sortable: false,
  },
];

const filteredPurchaseOrders = computed(() => {
  const query = search.value.trim().toLocaleLowerCase("id-ID");
  if (!query) return purchaseOrders.value;

  return purchaseOrders.value.filter((item) =>
    [
      item.no_purchaseorder,
      item.nama_vendor,
      item.pic_vendor,
      item.no_quotation_from_vendor,
      item.no_penawaran,
      item.perihal_purchaseorder,
      item.payment,
      item.currency,
      item.grandtotal_purchaseorder,
    ].some((value) =>
      String(value ?? "")
        .toLocaleLowerCase("id-ID")
        .includes(query),
    ),
  );
});

function purchaseOrderTarget(item: IndexedPurchaseOrder) {
  return `/admin/penawaran/${encodeURIComponent(item.id_penawaran)}#purchase-order-preview`;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value?: number, currency?: string) {
  const code = ["IDR", "USD", "SGD"].includes(currency || "")
    ? currency!
    : "IDR";
  const locale = code === "IDR" ? "id-ID" : code === "SGD" ? "en-SG" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    currencyDisplay: "code",
    minimumFractionDigits: code === "IDR" ? 0 : 2,
    maximumFractionDigits: code === "IDR" ? 0 : 2,
  }).format(Number(value) || 0);
}

async function loadPurchaseOrders(showSuccess = false) {
  if (loading.value) return;
  loading.value = true;
  loadError.value = "";

  try {
    const result = await fetchPurchaseOrderIndex(db);
    purchaseOrders.value = result.items;

    if (result.partial) {
      loadError.value =
        "Sebagian Purchase Order tidak dapat dimuat. Coba perbarui halaman.";
    } else if (showSuccess) {
      notificationStore.showSuccess("Data Purchase Order berhasil diperbarui");
    }
  } catch (error) {
    console.error("Gagal memuat index Purchase Order:", error);
    loadError.value = "Data Purchase Order tidak dapat dimuat.";
    notificationStore.showError("Gagal memuat Purchase Order");
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadPurchaseOrders());
</script>

<template>
  <v-btn
    variant="text"
    color="grey-darken-3"
    prepend-icon="mdi-arrow-left"
    class="text-capitalize font-weight-bold mb-2"
    @click="$router.go(-1)"
  >
    Kembali
  </v-btn>

  <div class="po-page-heading">
    <div>
      <h1>Purchase Order</h1>
      <p>Kelola daftar purchase order vendor dari seluruh quotation.</p>
    </div>
    <v-btn
      to="/admin/penawaran"
      color="primary"
      variant="flat"
      size="small"
      prepend-icon="mdi-file-document-edit-outline"
      class="text-none"
    >
      Buka Quotation
    </v-btn>
  </div>

  <v-card class="po-list-card" flat>
    <div class="po-list-toolbar">
      <div class="po-list-search">
        <v-icon icon="mdi-magnify" size="17" />
        <div class="po-list-search-field">
          <a-text-field-new
            v-model="search"
            placeholder="Cari nomor PO, vendor, quotation, subject, atau currency"
          />
        </div>
        <v-btn
          v-if="search"
          icon="mdi-close"
          size="x-small"
          variant="text"
          color="grey-darken-1"
          aria-label="Hapus pencarian"
          @click="search = ''"
        />
      </div>

      <div class="po-list-tools">
        <span class="po-result-count">
          {{ filteredPurchaseOrders.length }} purchase order
        </span>
        <v-btn
          icon="mdi-refresh"
          size="small"
          variant="text"
          class="po-refresh-btn"
          aria-label="Refresh Purchase Order"
          :loading="loading"
          @click="loadPurchaseOrders(true)"
        >
          <v-tooltip activator="parent" location="top">Refresh Data</v-tooltip>
        </v-btn>
      </div>
    </div>

    <v-alert
      v-if="loadError"
      type="warning"
      variant="tonal"
      density="compact"
      class="ma-4 mb-0 text-caption"
    >
      {{ loadError }}
    </v-alert>

    <v-divider class="mt-4" />

    <v-data-table
      :headers="headers"
      :items="filteredPurchaseOrders"
      :items-per-page="-1"
      :loading="loading"
      loading-text="Memuat Purchase Order..."
      density="compact"
      :sort-by="[{ key: 'createdAt', order: 'desc' }]"
      hover
      hide-default-footer
      class="po-list-table"
    >
      <template #item.no="{ index }">
        <span class="po-row-index">{{ index + 1 }}</span>
      </template>

      <template #item.tgl_purchaseorder="{ item }">
        <span class="po-date-cell">{{ formatDate(item.tgl_purchaseorder) }}</span>
      </template>

      <template #item.no_purchaseorder="{ item }">
        <NuxtLink :to="purchaseOrderTarget(item)" class="po-reference">
          {{ item.no_purchaseorder || item.id_purchaseorder || item.id }}
          <v-icon icon="mdi-arrow-top-right" size="12" />
        </NuxtLink>
      </template>

      <template #item.nama_vendor="{ item }">
        <div class="po-vendor-cell">
          <div class="po-vendor-name">{{ item.nama_vendor || "—" }}</div>
          <div class="po-vendor-meta">
            <span>
              <v-icon icon="mdi-account-outline" size="12" />
              {{ item.pic_vendor || "—" }}
            </span>
            <i aria-hidden="true" />
            <span>{{ item.no_quotation_from_vendor || "Tanpa ref. vendor" }}</span>
          </div>
        </div>
      </template>

      <template #item.no_penawaran="{ item }">
        <NuxtLink
          :to="`/admin/penawaran/${encodeURIComponent(item.id_penawaran)}`"
          class="po-quotation-reference"
        >
          {{ item.no_penawaran || "Quotation" }}
        </NuxtLink>
      </template>

      <template #item.perihal_purchaseorder="{ item }">
        <div class="po-subject-cell">{{ item.perihal_purchaseorder || "—" }}</div>
      </template>

      <template #item.grandtotal_purchaseorder="{ item }">
        <strong class="po-amount-cell">
          {{ formatCurrency(item.grandtotal_purchaseorder, item.currency) }}
        </strong>
      </template>

      <template #item.aksi="{ item }">
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon="mdi-dots-horizontal"
              size="small"
              variant="text"
              color="grey-darken-1"
              aria-label="Buka menu aksi Purchase Order"
            />
          </template>
          <v-list density="compact" min-width="200" class="po-action-menu">
            <v-list-item
              :to="purchaseOrderTarget(item)"
              prepend-icon="mdi-eye-outline"
              title="Lihat Purchase Order"
            />
            <v-list-item
              :to="`/admin/penawaran/${encodeURIComponent(item.id_penawaran)}`"
              prepend-icon="mdi-file-document-outline"
              title="Buka Quotation"
            />
          </v-list>
        </v-menu>
      </template>

      <template #no-data>
        <div class="po-empty-state">
          <v-icon size="34" color="grey-lighten-1" icon="mdi-clipboard-text-outline" />
          <div>
            {{ search ? "Purchase Order tidak ditemukan" : "Belum ada data Purchase Order" }}
          </div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<style scoped>
* { box-sizing: border-box; }

.po-page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.po-page-heading h1 {
  margin: 0;
  color: #17384b;
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.po-page-heading p {
  margin: 4px 0 0;
  color: #8298a5;
  font-size: 12px;
}

.po-list-card {
  overflow: hidden;
  border: 1px solid #e3ebef;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 8px 25px rgba(31, 62, 77, 0.035);
}

.po-list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px 0;
}

.po-list-search {
  display: flex;
  align-items: center;
  flex: 1 1 480px;
  max-width: 620px;
  min-width: 0;
  height: 38px;
  padding: 0 8px 0 12px;
  border: 1px solid #dfe8ed;
  border-radius: 10px;
  color: #7a929f;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.po-list-search:focus-within {
  border-color: #67aebe;
  box-shadow: 0 0 0 3px rgba(53, 153, 175, 0.09);
}

.po-list-search-field { min-width: 0; flex: 1 1 auto; }
.po-list-search :deep(.form-group),
.po-list-search :deep(.input-wrapper) { height: 32px; }
.po-list-search :deep(.input-field) {
  min-height: 32px;
  padding-inline: 8px;
  border: 0;
  box-shadow: none;
  background: transparent;
}

.po-list-tools { display: flex; align-items: center; gap: 8px; }
.po-result-count {
  color: #718b98;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.po-refresh-btn { color: #527888; }

.po-list-table :deep(.v-data-table__th) {
  height: 43px !important;
  background: #f7fafb !important;
  color: #66818e !important;
  font-size: 10px !important;
  font-weight: 800 !important;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.po-list-table :deep(.v-data-table__td) {
  height: 58px !important;
  border-color: #edf2f4 !important;
  color: #365566;
  font-size: 11px;
}

.po-row-index {
  display: inline-grid;
  place-items: center;
  width: 23px;
  height: 23px;
  border-radius: 7px;
  background: #f0f5f7;
  color: #78909b;
  font-size: 10px;
  font-weight: 800;
}

.po-date-cell { color: #607d8b; white-space: nowrap; }
.po-reference,
.po-quotation-reference {
  color: #247f9a;
  font-weight: 750;
  text-decoration: none;
}
.po-reference { display: inline-flex; align-items: center; gap: 4px; }
.po-reference:hover,
.po-quotation-reference:hover { text-decoration: underline; }

.po-vendor-cell { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.po-vendor-name {
  overflow: hidden;
  color: #244759;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.po-vendor-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  color: #8da1ab;
  font-size: 9px;
}
.po-vendor-meta span {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.po-vendor-meta i { width: 3px; height: 3px; flex: none; border-radius: 50%; background: #bdcbd1; }
.po-subject-cell {
  max-width: 250px;
  line-height: 1.45;
  overflow-wrap: anywhere;
  white-space: normal;
}
.po-amount-cell { color: #173f52; font-size: 11px; white-space: nowrap; }
.po-action-menu :deep(.v-list-item-title) { font-size: 12px; }
.po-empty-state {
  display: flex;
  min-height: 170px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #91a5af;
  font-size: 12px;
}

@media (max-width: 700px) {
  .po-page-heading { align-items: flex-start; flex-direction: column; gap: 12px; }
  .po-page-heading h1 { font-size: 24px; }
  .po-list-toolbar { align-items: stretch; flex-direction: column; gap: 10px; }
  .po-list-search { flex-basis: auto; width: 100%; }
  .po-list-tools { justify-content: space-between; }
}
</style>
