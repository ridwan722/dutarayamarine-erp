<script setup lang="ts">
import { collection, doc, updateDoc } from "firebase/firestore";
import { useCollection, useDocument, useFirestore } from "vuefire";
import { persistPengeluaranDocuments } from "~/composables/useInvoiceAresaDigital";
import dialogBuatPengeluaran from "~/components/Admin/Penawaran/dialog-buat-pengeluaran.vue";
import type {
  buktiPengeluaranM,
  penawaranM,
  pengeluaranM,
} from "~/types/penawaranModel";

definePageMeta({
  layout: "admin",
});

const route = useRoute();
const db = useFirestore();

const idPenawaran = computed(() => String(route.params.id));
const addPengeluaranDialog = ref(false);

const penawaranRef = computed(() => doc(db, "penawaran", idPenawaran.value));
const pengeluaranFileChunksRef = computed(() =>
  collection(db, "penawaran", idPenawaran.value, "pengeluaran_file_chunks"),
);

const { data: penawaran, pending, error } = useDocument(penawaranRef);
const { data: pengeluaranFileChunks } = useCollection(
  pengeluaranFileChunksRef,
);

const detailPenawaran = computed(
  () => penawaran.value as penawaranM | undefined,
);

const fileDataUrls = computed(() => {
  const groupedChunks = new Map<
    string,
    { index: number; data: string }[]
  >();
  for (const chunk of pengeluaranFileChunks.value ?? []) {
    const fileId = chunk.fileId as string | undefined;
    if (!fileId) continue;
    const fileChunks = groupedChunks.get(fileId) ?? [];
    fileChunks.push({
      index: Number(chunk.index) || 0,
      data: String(chunk.data || ""),
    });
    groupedChunks.set(fileId, fileChunks);
  }

  const dataUrls = new Map<string, string>();
  for (const [fileId, chunks] of groupedChunks) {
    dataUrls.set(
      fileId,
      chunks
        .sort((a, b) => a.index - b.index)
        .map((chunk) => chunk.data)
        .join(""),
    );
  }
  return dataUrls;
});

const pengeluaran = computed(() => {
  return (detailPenawaran.value?.pengeluaran ?? [])
    .map((expense) => ({
      ...expense,
      doc_pengeluaran: (expense.doc_pengeluaran ?? []).map((document) => ({
        ...document,
        dataUrl:
          document.dataUrl ||
          (document.fileId ? fileDataUrls.value.get(document.fileId) : "") ||
          "",
      })),
    }))
    .sort((a, b) => {
      return (
        new Date(b.tanggal_pengeluaran).getTime() -
        new Date(a.tanggal_pengeluaran).getTime()
      );
    });
});

/* =====================================================
   EDIT
===================================================== */

const editDialog = ref(false);
const savingEdit = ref(false);
const deletingPengeluaranId = ref<string | null>(null);
const editIndex = ref<number | null>(null);
const editFiles = ref<File[]>([]);
const notificationStore = useNotificationStore();

const editForm = reactive<pengeluaranM>({
  id_pengeluaran: "",
  tanggal_pengeluaran: "",
  keterangan: "",
  nominal: 0,
  qty: 1,
  satuan: "",
  nama_vendor: "",
  no_telp_vendor: "",
  lokasi_vendor: "",
  dikeluarkan_oleh: "",
  doc_pengeluaran: [],
  status_pengeluaran: ""
});

/* =====================================================
   TABLE HEADER
===================================================== */

const headers = [
  {
    title: "NO",
    key: "no",
    width: "55px",
    sortable: false,
  },
  {
    title: "TANGGAL",
    key: "tanggal_pengeluaran",
    width: "120px",
  },
  {
    title: "KETERANGAN",
    key: "keterangan",
    minWidth: "220px",
  },
  {
    title: "Dikeluarkan oleh",
    key: "dikeluarkan_oleh",
    maxWidth: "100px"
  },
  {
    title: "NOMINAL",
    key: "nominal",
    align: "end",
    width: "150px",
  },
  {
    title: "QTY",
    key: "qty",
    width: "90px",
  },
  {
    title: "VENDOR",
    key: "nama_vendor",
    minWidth: "180px",
  },

  {
    title: "Lampiran",
    key: "bukti",
    minWidth: "100px",
  },

  {
    title: "Status",
    key: "status_pengeluaran",
    minWidth: "50px",
  },
  {
    title: "AKSI",
    key: "actions",
    width: "110px",
    sortable: false,
    align: "center",
  },
];

/* =====================================================
   FORMAT
===================================================== */

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const totalPengeluaran = computed(() => {
  return pengeluaran.value.reduce(
    (total, item) => total + Number(item.nominal || 0),
    0,
  );
});

const formatTanggal = (tanggal: string) => {
  if (!tanggal) return "-";

  const date = new Date(tanggal);

  if (Number.isNaN(date.getTime())) {
    return tanggal;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

/* =====================================================
   OPEN EDIT
===================================================== */

const openEdit = (item: any, index: number) => {
  editIndex.value = index;

  editForm.id_pengeluaran = item.id_pengeluaran || "";
  editForm.tanggal_pengeluaran = item.tanggal_pengeluaran || "";
  editForm.keterangan = item.keterangan || "";
  editForm.nominal = Number(item.nominal || 0);
  editForm.qty = Number(item.qty || 1);
  editForm.satuan = item.satuan || "";
  editForm.nama_vendor = item.nama_vendor || "";
  editForm.no_telp_vendor = item.no_telp_vendor || "";
  editForm.lokasi_vendor = item.lokasi_vendor || "";
  editForm.dikeluarkan_oleh = item.dikeluarkan_oleh || "";
  editForm.doc_pengeluaran = [...(item.doc_pengeluaran || [])];
  editForm.status_pengeluaran = item.status_pengeluaran || "";
  editFiles.value = [];

  editDialog.value = true;
};

const addEditFile = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files?.length) {
    editFiles.value = [...editFiles.value, ...Array.from(target.files)];
  }
  target.value = "";
};

const readEditFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("File bukti tidak dapat dibaca"));
    reader.onerror = () =>
      reject(reader.error || new Error("File bukti tidak dapat dibaca"));
    reader.readAsDataURL(file);
  });

/* =====================================================
   CLOSE EDIT
===================================================== */

const closeEdit = () => {
  if (savingEdit.value) return;

  editDialog.value = false;
  editIndex.value = null;
};

/* =====================================================
   SAVE EDIT
===================================================== */

const saveEdit = async () => {
  if (
    editIndex.value === null ||
    !detailPenawaran.value ||
    !Array.isArray(detailPenawaran.value.pengeluaran)
  ) {
    return;
  }
  if (
    !editForm.keterangan.trim() ||
    !editForm.tanggal_pengeluaran ||
    !editForm.dikeluarkan_oleh
  ) {
    notificationStore.showError(
      "Keterangan, tanggal, dan dikeluarkan oleh wajib diisi",
    );
    return;
  }
  if (
    !Number.isFinite(editForm.nominal) ||
    editForm.nominal <= 0 ||
    !Number.isFinite(editForm.qty) ||
    editForm.qty <= 0
  ) {
    notificationStore.showError("Nominal dan qty harus lebih dari 0");
    return;
  }

  try {
    savingEdit.value = true;

    const index = editIndex.value;

    const pengeluaranBaru = [...detailPenawaran.value.pengeluaran];

    const dataLama = pengeluaranBaru[index];

    if (!dataLama) {
      return;
    }

    const newDocuments: buktiPengeluaranM[] = [];
    for (const file of editFiles.value) {
      newDocuments.push({
        name: file.name,
        dataUrl: await readEditFile(file),
        size: file.size,
        contentType: file.type || "application/octet-stream",
      });
    }
    const doc_pengeluaran = await persistPengeluaranDocuments(
      idPenawaran.value,
      dataLama.id_pengeluaran,
      [...editForm.doc_pengeluaran, ...newDocuments],
    );

    pengeluaranBaru[index] = {
      ...dataLama,

      id_pengeluaran: editForm.id_pengeluaran || dataLama.id_pengeluaran,

      tanggal_pengeluaran: editForm.tanggal_pengeluaran,
      keterangan: editForm.keterangan,
      nominal: Number(editForm.nominal || 0),
      qty: Number(editForm.qty || 0),
      satuan: editForm.satuan,
      nama_vendor: editForm.nama_vendor,
      no_telp_vendor: editForm.no_telp_vendor,
      lokasi_vendor: editForm.lokasi_vendor,
      dikeluarkan_oleh: editForm.dikeluarkan_oleh,
      status_pengeluaran: editForm.status_pengeluaran,
      doc_pengeluaran,
    };

    await updateDoc(doc(db, "penawaran", idPenawaran.value), {
      pengeluaran: pengeluaranBaru,
    });

    editDialog.value = false;
    editIndex.value = null;
  } catch (err) {
    console.error("Gagal mengedit pengeluaran:", err);
  } finally {
    savingEdit.value = false;
  }
};

const deletePengeluaran = async (item: any) => {
  const idPengeluaran = item.id_pengeluaran;
  if (!idPengeluaran || !detailPenawaran.value) return;
  if (
    !window.confirm(
      `Hapus pengeluaran "${item.keterangan || "ini"}"? Tindakan ini tidak dapat dibatalkan.`,
    )
  ) {
    return;
  }

  try {
    deletingPengeluaranId.value = idPengeluaran;
    const pengeluaranBaru = (detailPenawaran.value.pengeluaran ?? []).filter(
      (expense) => expense.id_pengeluaran !== idPengeluaran,
    );
    const grandtotalPengeluaran = pengeluaranBaru.reduce(
      (total, expense) => total + (Number(expense.nominal) || 0),
      0,
    );

    await updateDoc(doc(db, "penawaran", idPenawaran.value), {
      pengeluaran: pengeluaranBaru,
      grandtotal_pengeluaran: grandtotalPengeluaran,
    });
    try {
      await persistPengeluaranDocuments(idPenawaran.value, idPengeluaran, []);
    } catch (cleanupError) {
      console.error("Gagal membersihkan lampiran pengeluaran:", cleanupError);
    }
    notificationStore.showSuccess("Pengeluaran berhasil dihapus");
  } catch (err) {
    console.error("Gagal menghapus pengeluaran:", err);
    notificationStore.showError("Gagal menghapus pengeluaran");
  } finally {
    deletingPengeluaranId.value = null;
  }
};

const imagePreviewDialog = ref(false);
const imagePreviewUrl = ref("");

const previewImage = (dataUrl: string) => {
  if (!dataUrl) return;

  imagePreviewUrl.value = dataUrl;
  imagePreviewDialog.value = true;
};
</script>

<template>
  <dialog-buat-pengeluaran
    v-if="detailPenawaran"
    v-model="addPengeluaranDialog"
    :id-penawaran="idPenawaran"
    :penawaran="detailPenawaran"
  />

  <v-container fluid class="expense-page pa-4 pa-md-5">
    <v-dialog v-model="imagePreviewDialog" max-width="900">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          Pratinjau Bukti

          <v-btn
            icon="mdi-close"
            variant="text"
            @click="imagePreviewDialog = false"
          />
        </v-card-title>

        <v-card-text class="pa-2">
          <img
            v-if="imagePreviewUrl"
            :src="imagePreviewUrl"
            alt="Bukti Pengeluaran"
            class="w-100"
            style="max-height: 75vh; object-fit: contain"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- =================================================
         HEADER
    ================================================== -->

    <div class="page-header mb-4">
      <div class="d-flex align-center mb-3">
        <v-btn
          icon="mdi-arrow-left"
          variant="tonal"
          color="grey-darken-2"
          size="small"
          class="back-button mr-3"
          @click="$router.go(-1)"
        />

        <div>

          <h1 class="page-title">Pengeluaran Project</h1>
        </div>
      </div>

      <!-- PROJECT INFORMATION -->

      <v-card class="project-card" elevation="0">
        <div class="project-content">
          <div class="project-main">
            <div class="project-label">PROJECT</div>

            <div class="project-title">
              {{ detailPenawaran?.perihal || "Memuat data..." }}
            </div>

            <div class="company-name">
              <v-icon icon="mdi-domain" size="15" class="mr-1" />

              {{ detailPenawaran?.nama_perusahaan || "-" }}
            </div>
          </div>

          <div class="project-reference">
            <div class="reference-label">QUOTATION NO.</div>

            <div class="reference-number">
              {{ detailPenawaran?.no_penawaran || idPenawaran }}
            </div>
          </div>
        </div>
      </v-card>
    </div>

    <!-- =================================================
         SUMMARY
    ================================================== -->

    <div class="summary-grid mb-4">
      <v-card class="summary-card summary-primary" elevation="0">
        <div class="summary-icon">
          <v-icon icon="mdi-cash-minus" size="19" />
        </div>

        <div class="summary-info">
          <div class="summary-label">TOTAL PENGELUARAN</div>

          <div class="summary-value">
            {{ rupiah.format(totalPengeluaran) }}
          </div>
        </div>
      </v-card>

      <v-card class="summary-card" elevation="0">
        <div class="summary-icon neutral">
          <v-icon icon="mdi-receipt-text-outline" size="19" />
        </div>

        <div class="summary-info">
          <div class="summary-label">JUMLAH TRANSAKSI</div>

          <div class="summary-value">
            {{ pengeluaran.length }}

            <span class="summary-unit"> transaksi </span>
          </div>
        </div>
      </v-card>
    </div>

    <!-- =================================================
         ALERT ERROR
    ================================================== -->

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4 corporate-alert"
      icon="mdi-alert-circle-outline"
    >
      <div class="font-weight-medium">Gagal mengambil data pengeluaran.</div>

      <div class="text-caption mt-1">
        Silakan refresh halaman atau coba kembali beberapa saat lagi.
      </div>
    </v-alert>

    <!-- =================================================
         DATA TIDAK DITEMUKAN
    ================================================== -->

    <v-alert
      v-else-if="!pending && !detailPenawaran"
      type="warning"
      variant="tonal"
      class="mb-4 corporate-alert"
      icon="mdi-alert-outline"
    >
      <div class="font-weight-medium">Data penawaran tidak ditemukan.</div>
    </v-alert>

    <!-- =================================================
         TABLE
    ================================================== -->

    <v-card v-else class="table-card" elevation="0">
      <div class="table-header">
        <div>
          <div class="table-title">Daftar Pengeluaran</div>

          <div class="table-subtitle">
            Rincian biaya yang tercatat pada project ini
          </div>
        </div>

        <div class="d-flex align-center ga-2">
          <v-chip
            variant="tonal"
            size="small"
            prepend-icon="mdi-format-list-bulleted"
            class="transaction-chip"
          >
            {{ pengeluaran.length }} transaksi
          </v-chip>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            size="small"
            :disabled="!detailPenawaran"
            @click="addPengeluaranDialog = true"
          >
            Tambah Pengeluaran
          </v-btn>
        </div>
      </div>

      <v-divider />

      <div class="table-wrapper">
        <v-data-table
          :headers="headers"
          :items="pengeluaran"
          :loading="pending"
          item-value="id_pengeluaran"
          hover
          class="corporate-table"
          hide-default-footer
        >
          <!-- LOADING -->

          <template #loading>
            <v-skeleton-loader type="table-row@6" class="pa-4" />
          </template>

          <!-- EMPTY -->

          <template #no-data>
            <div class="empty-state">
              <div class="empty-icon">
                <v-icon icon="mdi-receipt-text-outline" size="30" />
              </div>

              <div class="empty-title">Belum ada pengeluaran</div>

              <div class="empty-description">
                Belum terdapat data pengeluaran untuk project ini.
              </div>
            </div>
          </template>

          <!-- NOMOR -->

          <template #item.no="{ index }">
            <span class="row-number">
              {{ String(index + 1).padStart(2, "0") }}
            </span>
          </template>

          <!-- TANGGAL -->

          <template #item.tanggal_pengeluaran="{ item }">
            <div class="date-cell">
              {{ formatTanggal(item.tanggal_pengeluaran) }}
            </div>
          </template>

          <!-- KETERANGAN -->

          <template #item.keterangan="{ item }">
            <div class="description-cell">
              {{ item.keterangan || "-" }}
            </div>
          </template>

          <!-- NOMINAL -->

          <template #item.nominal="{ item }">
            <div class="nominal-cell">
              {{ rupiah.format(Number(item.nominal || 0)) }}
            </div>
          </template>

          <!-- QTY -->

          <template #item.qty="{ item }">
            <div class="qty-cell">
              <span class="qty-number">
                {{ item.qty ?? 0 }}
              </span>

              <span class="qty-unit">
                {{ item.satuan || "-" }}
              </span>
            </div>
          </template>

          <!-- VENDOR -->

          <template #item.nama_vendor="{ item }">
            <div class="vendor-cell mt-2">
              <div class="vendor-icon">
                <v-icon icon="mdi-store-outline" size="15" />
              </div>

              <span>
                {{ item.nama_vendor || "-" }}
              </span>
              
            </div>
             <div class="vendor-cell mt-2 ml-1">
              <div >
                <v-icon icon="mdi-phone-outline" size="15" />
              </div>

              <span>
                {{ item.no_telp_vendor || "-" }}
              </span>
              
            </div>

            <div class="vendor-cell mt-2 mb-4 ml-1">
              <div>
                <v-icon icon="mdi-store-outline" size="15" />
              </div>

              <span>
                {{ item.lokasi_vendor || "-" }}
              </span>
              
            </div>
          </template>

          <template #item.bukti="{ item }">
            <v-tooltip
              v-if="item.doc_pengeluaran?.length"
              text="Pratinjau Gambar"
              location="top"
            >
              <template #activator="{ props }">
                <button
                  v-bind="props"
                  type="button"
                  class="btn-image-preview"
                  @click="previewImage(item.doc_pengeluaran[0].dataUrl)"
                >
                  <v-icon size="20">mdi-image-outline</v-icon>
                </button>
              </template>
            </v-tooltip>

            <span v-else class="text-disabled">-</span>
          </template>

          <!-- DIKELUARKAN OLEH -->

          <template #item.dikeluarkan_oleh="{ item }">
            <div >
              {{ item.dikeluarkan_oleh || "-" }}
            </div>
          </template>
          
          <template #item.status_pengeluaran="{ item }">
  <div
    class="issued-by-cell"
    :style="{
      color: item.status_pengeluaran === 'Hutang'
        ? '#f44336'
        : item.status_pengeluaran === 'Lunas'
          ? '#4caf50'
          : '',
      backgroundColor: item.status_pengeluaran === 'Hutang'
        ? '#ffebee'
        : item.status_pengeluaran === 'Lunas'
          ? '#e8f5e9'
          : '',
      padding: '4px 10px',
      borderRadius: '6px',
      display: 'inline-block',
      fontWeight: '500'
    }"
  >
    {{ item.status_pengeluaran || "-" }}
  </div>
</template>

          <!-- AKSI -->

          <template #item.actions="{ item, index }">
            <div class="d-flex align-center justify-center">
              <v-btn
                icon="mdi-pencil-outline"
                variant="text"
                size="small"
                color="grey-darken-1"
                :disabled="deletingPengeluaranId !== null"
                @click="openEdit(item, index)"
              >
                <v-icon size="18">mdi-pencil-outline</v-icon>
                <v-tooltip activator="parent" location="top">
                  Edit Pengeluaran
                </v-tooltip>
              </v-btn>

              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                size="small"
                color="error"
                :loading="deletingPengeluaranId === item.id_pengeluaran"
                :disabled="deletingPengeluaranId !== null"
                @click="deletePengeluaran(item)"
              >
                <v-icon size="18">mdi-delete-outline</v-icon>
                <v-tooltip activator="parent" location="top">
                  Hapus Pengeluaran
                </v-tooltip>
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </div>

      <!-- TABLE FOOTER -->

      <v-divider />

      <div class="table-footer">
        <span class="footer-label"> Total Pengeluaran </span>

        <span class="footer-total">
          {{ rupiah.format(totalPengeluaran) }}
        </span>
      </div>
    </v-card>

    <!-- =================================================
         EDIT DIALOG
    ================================================== -->

    <div v-if="editDialog" class="edit-modal-overlay" @click.self="closeEdit">
      <div class="edit-modal-card">
        <div class="edit-modal-header">
          <div class="edit-title-group">
            <v-icon color="primary" size="18"
              >mdi-file-document-edit-outline</v-icon
            >
            <span class="edit-modal-title">Edit Pengeluaran</span>
          </div>
          <button
            class="edit-btn-close"
            :disabled="savingEdit"
            @click="closeEdit"
          >
            &times;
          </button>
        </div>

        <div class="edit-modal-body">
          <a-date-picker-new
            v-model="editForm.tanggal_pengeluaran"
            label="Tanggal Pengeluaran"
            :disabled="savingEdit"
            class="mb-2"
          />
          <a-text-field-new
            v-model="editForm.dikeluarkan_oleh"
            label="Dikeluarkan Oleh"
            placeholder="Nama"
            :disabled="savingEdit"
            class="my-2"
          />
          <a-textarea-new
            v-model="editForm.keterangan"
            label="Keterangan"
            :disabled="savingEdit"
          />
          <div class="edit-form-grid">
            <a-text-field-new
              v-model="editForm.qty"
              label="Qty"
              :disabled="savingEdit"
            />
            <a-select-new
              v-model="editForm.satuan"
              label="Satuan"
              :disabled="savingEdit"
              :items="['Unit', 'Pcs', 'Kg']"
            />
            <a-field-number-new
              v-model="editForm.nominal"
              label="Nominal"
              :disabled="savingEdit"
            />
          </div>

          <div class="edit-section-title mt-3">Informasi Vendor</div>
          <div class="edit-form-grid">
            <a-text-field-new
              v-model="editForm.nama_vendor"
              label="Nama Vendor"
              :disabled="savingEdit"
            />
            <a-text-field-new
              v-model="editForm.no_telp_vendor"
              label="No. Telepon Vendor"
              :disabled="savingEdit"
            />
            <a-text-field-new
              v-model="editForm.lokasi_vendor"
              label="Lokasi Vendor"
              :disabled="savingEdit"
            />
          </div>

          <v-divider class="my-2" />
          <div class="edit-upload-row">
            <div class="edit-upload-wrapper">
              <label for="edit-upload-bukti" class="edit-upload-label"
                >Bill Upload</label
              >
              <div class="edit-upload-box">
                <input
                  id="edit-upload-bukti"
                  type="file"
                  multiple
                  class="edit-file-input"
                  :disabled="savingEdit"
                  @change="addEditFile"
                />
                <div class="edit-upload-icon">↑</div>
                <div>
                  <div class="edit-upload-title">Pilih File</div>
                  <div class="edit-upload-info">Ukuran file bebas</div>
                </div>
              </div>
            </div>
            <div
              v-if="editForm.doc_pengeluaran.length || editFiles.length"
              class="edit-files-wrapper"
            >
              <div class="edit-upload-label">File Terpilih</div>
              <div class="edit-file-list">
                <div
                  v-for="(file, index) in editForm.doc_pengeluaran"
                  :key="`${file.name}-${index}`"
                  class="edit-file-item"
                >
                  <div class="edit-file-name">📄 {{ file.name }}</div>
                  <button
                    type="button"
                    class="edit-file-remove"
                    :disabled="savingEdit"
                    @click="editForm.doc_pengeluaran.splice(index, 1)"
                  >
                    &times;
                  </button>
                </div>
                <div
                  v-for="(file, index) in editFiles"
                  :key="`${file.name}-${file.lastModified}-${index}`"
                  class="edit-file-item"
                >
                  <div class="edit-file-name">📄 {{ file.name }}</div>
                  <button
                    type="button"
                    class="edit-file-remove"
                    :disabled="savingEdit"
                    @click="editFiles.splice(index, 1)"
                  >
                    &times;
                  </button>
                </div>
              </div>
            </div>
          </div>
           <a-select-new
            v-model="editForm.status_pengeluaran"
            :items="['Hutang', 'Lunas']"
            label="Status"
            :disabled="savingEdit"
            class="mt-2"
          />
        </div>

        <div class="edit-modal-footer">
          <button
            class="edit-btn edit-btn-secondary"
            :disabled="savingEdit"
            @click="closeEdit"
          >
            Batal
          </button>
          <button
            class="edit-btn edit-btn-primary"
            :disabled="savingEdit"
            @click="saveEdit"
          >
            {{ savingEdit ? "Memproses..." : "Simpan Pengeluaran" }}
          </button>
        </div>
      </div>
    </div>
  </v-container>
</template>

<style scoped>
/* =====================================================
   PAGE
===================================================== */

.expense-page {
  max-width: 1800px;
  margin: 0 auto;
  color: #1f2937;
}

/* =====================================================
   PAGE HEADER
===================================================== */

.page-header {
  width: 100%;
}

.back-button {
  border-radius: 8px;
}

.page-eyebrow {
  font-size: 9px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #9ca3af;
  margin-bottom: 3px;
}

.page-title {
  margin: 0;
  font-size: 21px;
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.2px;
  color: #111827;
}

/* =====================================================
   PROJECT CARD
===================================================== */

.project-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.project-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 78px;
  padding: 14px 18px;
}

.project-main {
  min-width: 0;
}

.project-label,
.reference-label {
  font-size: 9px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #9ca3af;
  margin-bottom: 5px;
}

.project-title {
  font-size: 15px;
  line-height: 1.3;
  font-weight: 650;
  color: #111827;
  word-break: break-word;
}

.company-name {
  display: flex;
  align-items: center;
  margin-top: 4px;
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

.project-reference {
  flex-shrink: 0;
  min-width: 160px;
  padding-left: 20px;
  margin-left: 20px;
  border-left: 1px solid #e5e7eb;
}

.reference-number {
  font-family: monospace;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
}

/* =====================================================
   SUMMARY
===================================================== */

.summary-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 10px;
}

.summary-card {
  min-height: 72px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.summary-primary {
  background: #fafbfc;
  border-color: #e1e5ea;
}

.summary-icon {
  width: 36px;
  height: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: #eef2f6;
  color: #526b84;
}

.summary-icon.neutral {
  background: #f3f4f6;
  color: #6b7280;
}

.summary-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #9ca3af;
  margin-bottom: 3px;
}

.summary-value {
  font-size: 16px;
  line-height: 1.2;
  font-weight: 700;
  color: #111827;
}

.summary-unit {
  font-size: 10px;
  font-weight: 500;
  color: #9ca3af;
}

/* =====================================================
   ALERT
===================================================== */

.corporate-alert {
  border-radius: 8px !important;
}

/* =====================================================
   TABLE CARD
===================================================== */

.table-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
}

.table-header {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 18px;
}

.table-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.table-subtitle {
  margin-top: 2px;
  font-size: 11px;
  color: #9ca3af;
}

.transaction-chip {
  font-size: 11px !important;
  flex-shrink: 0;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

/* =====================================================
   DATA TABLE
===================================================== */

.corporate-table {
  min-width: 1130px;
}

.corporate-table :deep(th) {
  height: 42px !important;
  background: #f8fafc !important;
  border-bottom: 1px solid #e5e7eb !important;
  color: #6b7280 !important;
  font-size: 9px !important;
  font-weight: 700 !important;
  letter-spacing: 0.6px;
  white-space: nowrap;
}

.corporate-table :deep(td) {
  height: 52px !important;
  border-bottom: 1px solid #f0f1f3 !important;
  color: #374151;
  font-size: 12px;
}

.corporate-table :deep(tbody tr:hover) {
  background: #fafbfc !important;
}

.corporate-table :deep(tbody tr:last-child td) {
  border-bottom: none !important;
}

/* =====================================================
   TABLE CELLS
===================================================== */

.row-number {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
}

.date-cell {
  font-size: 11px;
  color: #4b5563;
  white-space: nowrap;
}

.description-cell {
  max-width: 320px;
  line-height: 1.4;
  font-weight: 500;
  color: #374151;
}

.nominal-cell {
  font-size: 12px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.qty-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 5px;
  background: #f3f4f6;
  white-space: nowrap;
}

.qty-number {
  font-size: 11px;
  font-weight: 700;
  color: #374151;
}

.qty-unit {
  font-size: 10px;
  color: #6b7280;
}

.vendor-cell {
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 500;
}

.vendor-icon {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 6px;
  background: #f3f4f6;
  color: #6b7280;
}

.phone-link {
  display: inline-flex;
  align-items: center;
  color: #526b84;
  text-decoration: none;
  white-space: nowrap;
  font-size: 11px;
}

.phone-link:hover {
  text-decoration: underline;
}

.location-cell {
  display: flex;
  align-items: center;
  color: #6b7280;
  font-size: 11px;
  line-height: 1.4;
}

.issued-by-cell {
  font-size: 11px;
  font-weight: 500;
  color: #4b5563;
  white-space: nowrap;
}

/* =====================================================
   EMPTY STATE
===================================================== */

.empty-state {
  padding: 45px 20px;
  text-align: center;
}

.empty-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  border-radius: 10px;
  background: #f3f4f6;
  color: #9ca3af;
}

.empty-title {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.empty-description {
  margin-top: 3px;
  font-size: 11px;
  color: #9ca3af;
}

/* =====================================================
   TABLE FOOTER
===================================================== */

.table-footer {
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 10px 18px;
  background: #fafbfc;
}

.footer-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
}

.footer-total {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

/* =====================================================
   EDIT DIALOG
===================================================== */

.edit-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.4);
  justify-content: center;
}

.edit-modal-card {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.edit-modal-header,
.edit-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f8f9fa;
}

.edit-modal-header {
  border-bottom: 1px solid #e9ecef;
}
.edit-modal-footer {
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #e9ecef;
}
.edit-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.edit-modal-title {
  font-size: 14px;
  font-weight: 700;
  color: #212529;
}

.edit-btn-close,
.edit-file-remove {
  border: 0;
  background: transparent;
  cursor: pointer;
}
.edit-btn-close {
  color: #6c757d;
  font-size: 20px;
  line-height: 1;
}
.edit-modal-body {
  padding: 12px 16px;
  overflow-y: auto;
}
.edit-section-title {
  margin-bottom: 6px;
  color: #6c757d;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.edit-form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.edit-upload-row {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
}
.edit-upload-wrapper {
  flex-shrink: 0;
}
.edit-files-wrapper {
  flex: 1;
  min-width: 0;
}
.edit-upload-label {
  display: block;
  margin-bottom: 6px;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
}
.edit-upload-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 150px;
  height: 82px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
}
.edit-file-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
.edit-upload-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #475569;
  font-size: 17px;
}
.edit-upload-title {
  color: #334155;
  font-size: 12px;
  font-weight: 600;
}
.edit-upload-info {
  margin-top: 2px;
  color: #94a3b8;
  font-size: 10px;
}
.edit-file-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.edit-file-item {
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
.edit-file-name {
  min-width: 0;
  overflow: hidden;
  color: #475569;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.edit-file-remove {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 18px;
  line-height: 1;
}
.edit-file-remove:hover:not(:disabled) {
  color: #dc2626;
}
.edit-btn {
  padding: 5px 14px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.edit-btn-secondary {
  border-color: #ced4da;
  background: #fff;
  color: #495057;
}
.edit-btn-primary {
  background: #1976d2;
  color: #fff;
}
.edit-btn:disabled,
.edit-btn-close:disabled,
.edit-file-remove:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .edit-modal-card {
    max-height: 100vh;
    border-radius: 0;
  }
  .edit-form-grid {
    grid-template-columns: 1fr;
  }
  .edit-upload-row {
    flex-direction: column;
    gap: 12px;
  }
}

/* =====================================================
   TABLET
===================================================== */

@media (max-width: 959px) {
  .expense-page {
    padding: 14px !important;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .project-content {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }

  .project-reference {
    width: 100%;
    min-width: 0;
    padding-left: 0;
    padding-top: 12px;
    margin-left: 0;
    border-left: none;
    border-top: 1px solid #e5e7eb;
  }
}

/* =====================================================
   MOBILE
===================================================== */

@media (max-width: 600px) {
  .expense-page {
    padding: 10px !important;
  }

  .page-title {
    font-size: 19px;
  }

  .page-eyebrow {
    font-size: 8px;
  }

  .project-content {
    padding: 14px;
  }

  .project-title {
    font-size: 14px;
  }

  .company-name {
    font-size: 10px;
  }

  .summary-card {
    min-height: 64px;
    padding: 10px 13px;
    gap: 10px;
  }

  .summary-icon {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }

  .summary-label {
    font-size: 8px;
  }

  .summary-value {
    font-size: 14px;
  }

  .table-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 13px 14px;
  }

  .transaction-chip {
    align-self: flex-start;
  }

  .table-footer {
    justify-content: space-between;
    padding: 10px 14px;
  }

  .footer-total {
    font-size: 13px;
  }

  .edit-dialog-actions {
    padding: 10px 14px;
  }
}
</style>
