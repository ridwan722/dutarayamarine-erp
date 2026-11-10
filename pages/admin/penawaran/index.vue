<template>
  <ConfirmationDialog ref="confirmationDialog" />
  <DialogPenawaran ref="dialogPenawaran" />

  <!-- Header & Top Action -->
  <div class="quotation-page-heading">
    <div class="quotation-page-title">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        color="grey-darken-3"
        size="small"
        class="quotation-back-btn"
        aria-label="Kembali"
        @click="$router.go(-1)"
      />
      <div>
        <h1>Quotation</h1>
        <!-- <p>Manage quotation, client, status, and transaction value.</p> -->
      </div>
    </div>
    <div class="quotation-page-actions">
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
      <v-btn
        variant="outlined"
        size="small"
        class="quotation-page-refresh-btn text-none"
        prepend-icon="mdi-refresh"
        :loading="isRefreshing"
        :disabled="isRefreshing"
        @click="refreshData"
      >
        Refresh
      </v-btn>
    </div>
  </div>

  <summary-quotation :loading="isLoading" />

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
      </div>
    </div>

    <v-divider />

    <section
      v-show="data.showQuotationFilters"
      class="quotation-filter-panel"
    >

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
            <option value="">All</option>
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
      :loading="isLoading"
      :items-per-page="-1"
      density="compact"
      :sort-by="[{ key: 'created_at', order: 'desc' }]"
      :hover="true"
      hide-default-footer
      class="quotation-list-table"
    >
      <template v-slot:item.no="{ index }">
        <span class="quotation-row-index">{{ index + 1 }}.</span>
      </template>

      <template v-slot:item.no_penawaran="{ item }">
        <NuxtLink
          :to="quotationDetailRoute(item)"
          class="quotation-reference quotation-reference--number"
        >
          <span class="quotation-reference-main">
            <span>{{ item.no_penawaran }}</span>
            <v-icon icon="mdi-arrow-top-right" size="12" />
          </span>
          <v-chip
            v-if="Number(item.revision_count) > 0"
            size="x-small"
            color="indigo"
            variant="tonal"
            class="quotation-revision-chip"
          >
            {{ activeRevisionChipLabel(item) }}
          </v-chip>
        </NuxtLink>
      </template>

      <template v-slot:item.perihal="{ item }">
        <!-- <div class="subject-cell">
          <span>{{ item.perihal }}</span>
        </div> -->
         <NuxtLink
          :to="quotationDetailRoute(item)"
          class="quotation-reference"
        >
          {{ item.perihal }}
          <!-- <v-icon icon="mdi-arrow-top-right" size="12" /> -->
        </NuxtLink>
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
                :to="quotationDetailRoute(item)"
                :disabled="item.status == 'Cancel'"
                prepend-icon="mdi-eye-outline"
                title="Detail quotation"
              />
              <!-- <v-list-item
                :disabled="item.status !== 'Draft'"
                prepend-icon="mdi-pencil-outline"
                title="Edit quotation"
                @click="openDialogEditPenawaran(item)"
              /> -->
              <v-list-item
                v-if="item.status !== 'Cancel'"
                :disabled="item.status !== 'Draft'"
                prepend-icon="mdi-file-document-plus-outline"
                title="Revisi"
                @click="openDialogRevisiPenawaran(item)"
              />
              <v-divider class="my-1" />
              <v-list-item
                :disabled="item.status !== 'Draft'"
                prepend-icon="mdi-delete-outline"
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
  onMounted,
  watch,
} from "vue";
import { useDisplay } from "vuetify";
import type { ConfirmationDialog } from "#components";
import DialogPenawaran from "~/components/Admin/Penawaran/dialog-penawaran.vue";
import type { penawaranM } from "~/types/penawaranModel";
import { queryambilid } from "~/composables/useFirestoreQuery";

definePageMeta({
  layout: "admin",
});

const display = useDisplay();
const penawaranStore = usePenawaranStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);
const dialogPenawaran = ref<InstanceType<typeof DialogPenawaran> | null>(null);
const isLoading = ref(!penawaranStore.hasCachedData());
const isRefreshing = ref(false);
const activeRevisionRows = ref<Record<string, penawaranM>>({});
let activeRevisionLoadVersion = 0;

function quotationRootId(quotation: penawaranM) {
  return quotation.id || quotation.id_penawaran || "";
}

async function loadActiveRevisionRows(quotations: penawaranM[]) {
  const loadVersion = ++activeRevisionLoadVersion;
  const rowsWithRevisions = quotations.filter(
    (quotation) =>
      quotationRootId(quotation) && Number(quotation.revision_count) > 0,
  );

  const entries = await Promise.all(
    rowsWithRevisions.map(async (quotation) => {
      const rootId = quotationRootId(quotation);
      try {
        const revisions = (await queryambilid(
          `penawaran/${rootId}/revisi_penawaran`,
        )) as penawaranM[];
        const normalizedRevisions = revisions
          .map((revision) => ({
            ...revision,
            id_revisi: revision.id_revisi || revision.id || "",
          }))
          .sort(
            (left, right) =>
              Number(left.revision_number || 0) -
                Number(right.revision_number || 0) ||
              Number(left.created_at || 0) - Number(right.created_at || 0),
          );

        let activeRevision: penawaranM | undefined;
        if (quotation.active_revision_id) {
          activeRevision = normalizedRevisions.find(
            (revision) =>
              revision.id_revisi === quotation.active_revision_id,
          );
        } else if (Number(quotation.active_revision_number) > 0) {
          activeRevision = normalizedRevisions.find(
            (revision) =>
              Number(revision.revision_number) ===
              Number(quotation.active_revision_number),
          );
        } else if (
          quotation.active_revision_id === undefined &&
          quotation.active_revision_number === undefined
        ) {
          // Kompatibilitas data lama: sebelum ada penunjuk aktif, revisi
          // bernomor paling tinggi dianggap sebagai versi berjalan.
          activeRevision = normalizedRevisions.at(-1);
        }

        return [rootId, activeRevision] as const;
      } catch (error) {
        console.error(
          `Gagal memuat revisi aktif quotation ${rootId}:`,
          error,
        );
        return [rootId, undefined] as const;
      }
    }),
  );

  if (loadVersion !== activeRevisionLoadVersion) return;
  activeRevisionRows.value = Object.fromEntries(
    entries.filter(
      (entry): entry is readonly [string, penawaranM] => Boolean(entry[1]),
    ),
  );
}

const activeQuotationRows = computed(() =>
  penawaranStore.getDataPenawaranTampil.map((quotation) => {
    const rootId = quotationRootId(quotation);
    const revision = activeRevisionRows.value[rootId];
    if (!revision) return quotation;

    return {
      ...quotation,
      ...revision,
      id: rootId,
      id_penawaran: rootId,
      id_revisi: revision.id_revisi,
      root_penawaran_id: rootId,
      revision_count: quotation.revision_count,
      active_revision_id:
        quotation.active_revision_id || revision.id_revisi || "",
      active_revision_number:
        Number(quotation.active_revision_number) ||
        Number(revision.revision_number) ||
        0,
      // Revisi boleh mengganti isi quotation, tetapi tidak boleh mengubah
      // posisi baris pada tabel utama. Urutan tetap memakai tanggal dibuatnya
      // dokumen induk (revisi 00), bukan tanggal revisi terbaru.
      created_at: quotation.created_at,
      createdAt: quotation.createdAt,
      status: quotation.status,
    } as penawaranM;
  }),
);

watch(
  () =>
    penawaranStore.getDataPenawaranTampil.map((quotation) => [
      quotationRootId(quotation),
      quotation.revision_count,
      quotation.active_revision_id,
      quotation.active_revision_number,
    ]),
  () => {
    void loadActiveRevisionRows(penawaranStore.getDataPenawaranTampil);
  },
  { immediate: true, deep: true },
);

onMounted(async () => {
  restoreQuotationFilters();
  const needsQuotationData = !penawaranStore.hasCachedData();
  isLoading.value = needsQuotationData;

  try {
    if (needsQuotationData) {
      await penawaranStore.tarikDataPenawaranAct();
    } else {
      // Halaman lain dapat menyaring data tampil pada store. Saat kembali ke
      // index, pulihkan master data agar status SPK ikut muncul di tabel.
      penawaranStore.$patch({
        dataPenawaranTampil: [...penawaranStore.getDataPenawaran],
      });
    }
    await dialogPenawaran.value?.openRequestedRevision();
  } finally {
    isLoading.value = false;
  }
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


const availableQuotationStatuses = computed(() => {
  const defaultStatuses = ["Draft", "SPK", "INVOICE", "Cancel"];
  const storedStatuses = activeQuotationRows.value
    .map((quotation) => quotation.status)
    .filter(Boolean);

  return [...new Set([...defaultStatuses, ...storedStatuses])];
});

const availableQuotationClients = computed(() => {
  const clients = activeQuotationRows.value
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

  return activeQuotationRows.value.filter((quotation) => {
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

function quotationDetailRoute(quotation: penawaranM) {
  const rootId = quotationRootId(quotation);
  return {
    path: `/admin/penawaran/${encodeURIComponent(rootId)}`,
    query: quotation.id_revisi
      ? { revisi: quotation.id_revisi }
      : undefined,
  };
}

function activeRevisionChipLabel(quotation: penawaranM) {
  const revisionNumber = Number(quotation.revision_number) || 0;
  if (revisionNumber > 0) {
    return `Rev. ${String(revisionNumber).padStart(2, "0")} aktif`;
  }
  return `${Number(quotation.revision_count) || 0} revisi`;
}

function statusColor(status: string) {
  if (status === "INVOICE") return "warning";
  if (status === "SPK") return "success";
  if (status === "Draft") return "primary";
  if (status === "Ditolak") return "error";
  return "grey";
}

function openDialogTambahPenawaran() {
  void dialogPenawaran.value?.openAdd();
}

function openDialogEditPenawaran(item: penawaranM) {
  void dialogPenawaran.value?.openEdit(item);
}

function openDialogRevisiPenawaran(item: penawaranM) {
  if (item.status !== "Draft") return;
  void dialogPenawaran.value?.openRevision(item);
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
  if (isRefreshing.value) return;

  isRefreshing.value = true;
  try {
    sessionStorage.removeItem("penawaran");
    await penawaranStore.tarikDataPenawaranAct();
    notificationStore.showSuccess("Data Penawaran berhasil diperbarui");
  } catch (error) {
    console.error("Gagal memperbarui data penawaran:", error);
    notificationStore.showError("Data Penawaran gagal diperbarui");
  } finally {
    isRefreshing.value = false;
  }
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

.quotation-page-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.quotation-page-title > div {
  min-width: 0;
}

.quotation-back-btn {
  flex: 0 0 34px;
  width: 34px !important;
  height: 34px !important;
  color: #596675 !important;
  border-radius: 55px !important;
}

.quotation-back-btn:hover {
  background: #eef2f5 !important;
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

.quotation-page-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

.quotation-page-refresh-btn {
  height: 34px !important;
  padding-inline: 12px !important;
  color: #526171 !important;
  font-size: 10.5px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  border-color: #d6dbe1 !important;
  border-radius: 5px !important;
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
   white-space: normal;
  word-break: break-word;
  max-width: 250px;
}

.quotation-reference:hover {
  color: #174a79;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.quotation-reference--number {
  align-items: flex-start;
  flex-direction: column;
  gap: 4px;
}

.quotation-reference-main {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.quotation-revision-chip {
  height: 18px !important;
  margin: 0 !important;
  font-size: 8.5px !important;
  font-weight: 700 !important;
  letter-spacing: 0.02em !important;
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

.quotation-action-trigger[aria-expanded="true"] {
  color: #fcfcfc !important;
  background: #fe9258 !important;
  box-shadow: inset 0 0 0 1px #d3e2ef;
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

@media (max-width: 1199px) {
  .quotation-filter-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 959px) {
  .quotation-filter-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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

  .quotation-list-tools {
    justify-content: flex-end;
  }

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
}
</style>
