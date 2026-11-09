<script setup lang="ts">
import _ from "lodash";
import { useRoute, useRouter } from "vue-router";
import { usePenawaranStore } from "~/stores/penawaranStore";
import type { ConfirmationDialog } from "#components";

import "@vueup/vue-quill/dist/vue-quill.snow.css";
import DialogPenawaran from "~/components/Admin/Penawaran/dialog-penawaran.vue";
import dialogBuatInvoice from "~/components/Admin/Penawaran/dialog-buat-invoice.vue";
import dialogBuatPengeluaran from "~/components/Admin/Penawaran/dialog-buat-pengeluaran.vue";
import {
  Bytes,
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { nextTick, ref } from "vue";
import { useDocument, useFirestore } from "vuefire";
import { queryambilid } from "~/composables/useFirestoreQuery";
import type { invoiceM } from "~/types/invoice";
import type { dokumenSpkM, penawaranM } from "~/types/penawaranModel";

const purchaseorderPreviewKey = ref(0);
const hasPurchaseOrder = ref(false);
const invoiceLinks = ref<(invoiceM & { id: string })[]>([]);
const invoiceLinksLoading = ref(true);
const revisionHistory = ref<penawaranM[]>([]);
const originalPenawaran = ref<penawaranM | null>(null);
const revisionHistoryLoading = ref(false);
const revisionHistoryLoaded = ref(false);
const revisionSelectionSaving = ref(false);
const revisionSelectionOverride = ref<string | null>(null);
const revisionDeletingId = ref("");
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);
const dialogPenawaran = ref<InstanceType<typeof DialogPenawaran> | null>(null);
const dialogSpk = ref(false);
const spkFile = ref<File | null>(null);
const spkSaving = ref(false);
const spkUploadProgress = ref(0);

const MAX_SPK_FILE_BYTES = 10 * 1024 * 1024;
const SPK_CHUNK_BYTES = 700 * 1024;
const SPK_FILES_COLLECTION = "penawaran_spk";

definePageMeta({ layout: "admin" });

const route = useRoute();
const router = useRouter();
const penawaranstore = usePenawaranStore();
const penawaranId = String(route.params.id);
const db = useFirestore();

const basePenawaran = computed(() => penawaranstore.getDetailPenawaran);
const requestedRevisionId = computed(() => {
  const value = Array.isArray(route.query.revisi)
    ? route.query.revisi[0]
    : route.query.revisi;
  return value ? String(value) : "";
});
const selectedRevisionId = computed(() => {
  if (revisionSelectionOverride.value !== null) {
    return revisionSelectionOverride.value;
  }
  if (requestedRevisionId.value) return requestedRevisionId.value;

  const storedRevisionId = basePenawaran.value.active_revision_id;
  if (
    storedRevisionId &&
    revisionHistory.value.some(
      (revision) => revision.id_revisi === storedRevisionId,
    )
  ) {
    return storedRevisionId;
  }

  const storedRevisionNumber = basePenawaran.value.active_revision_number;
  if (storedRevisionNumber === 0) return "";
  if (Number(storedRevisionNumber) > 0) {
    return (
      revisionHistory.value.find(
        (revision) =>
          Number(revision.revision_number) === Number(storedRevisionNumber),
      )?.id_revisi || ""
    );
  }

  // Data lama belum mempunyai penunjuk revisi aktif. Gunakan revisi terbaru
  // agar perilakunya sama dengan quotation yang baru dibuat.
  if (
    basePenawaran.value.active_revision_id === undefined &&
    basePenawaran.value.active_revision_number === undefined
  ) {
    return revisionHistory.value.at(-1)?.id_revisi || "";
  }

  return "";
});
const selectedRevision = computed(() =>
  revisionHistory.value.find(
    (revision) => revision.id_revisi === selectedRevisionId.value,
  ),
);
const detailpenawaran = computed(() => {
  const base = basePenawaran.value;
  const revision = selectedRevisionId.value
    ? selectedRevision.value
    : originalPenawaran.value;
  if (!revision) return base;

  return {
    ...base,
    ...revision,
    id: penawaranId,
    id_penawaran: penawaranId,
    id_revisi: revision.id_revisi,
    root_penawaran_id: penawaranId,
    status: base.status,
    revision_count: base.revision_count,
    active_revision_id: base.active_revision_id,
    active_revision_number: base.active_revision_number,
    materialized_revision_id: base.materialized_revision_id,
    materialized_revision_number: base.materialized_revision_number,
    dokumen_spk: base.dokumen_spk,
    tanggal_spk: base.tanggal_spk,
    spk_at: base.spk_at,
    spk_by: base.spk_by,
  } as penawaranM;
});

// Saat masuk dari halaman daftar, dokumen lengkap sebenarnya sudah ada di
// Pinia. Pakai data tersebut langsung agar halaman tidak menunggu Firestore.
const cachedPenawaran = [
  ...penawaranstore.getDataPenawaranTampil,
  ...penawaranstore.getDataPenawaran,
].find((item) => (item.id || item.id_penawaran) === penawaranId);

if (cachedPenawaran) {
  penawaranstore.$patch({ detailPenawaran: cachedPenawaran });
} else {
  const currentDetail = penawaranstore.getDetailPenawaran;
  const currentDetailId = currentDetail?.id || currentDetail?.id_penawaran;
  if (currentDetailId && currentDetailId !== penawaranId) {
    // Jangan sempat menampilkan quotation sebelumnya ketika berpindah langsung
    // dari satu halaman detail ke halaman detail lainnya.
    penawaranstore.$patch({ detailPenawaran: {} as penawaranM });
  }
}

// Listener dibuat langsung di scope halaman agar bisa memakai cache lokal
// Firestore dan otomatis dilepas ketika pengguna meninggalkan halaman. Nilai
// cache Pinia tidak ditimpa sampai dokumen segar benar-benar tersedia.
const livePenawaran = useDocument<penawaranM>(
  doc(db, "penawaran", penawaranId),
);
watch(
  livePenawaran,
  (penawaran) => {
    if (penawaran) {
      penawaranstore.$patch({ detailPenawaran: penawaran });
    }
  },
  { immediate: true },
);

watch(
  basePenawaran,
  (penawaran) => {
    if (
      !originalPenawaran.value &&
      penawaran?.no_penawaran &&
      (penawaran.materialized_revision_id === undefined ||
        Number(penawaran.materialized_revision_number) === 0)
    ) {
      originalPenawaran.value = JSON.parse(
        JSON.stringify(penawaran),
      ) as penawaranM;
    }
  },
  { immediate: true },
);

async function loadRevisionHistory() {
  revisionHistoryLoading.value = true;
  try {
    const revisions = (await queryambilid(
      `penawaran/${penawaranId}/revisi_penawaran`,
    )) as penawaranM[];

    const normalizedRevisions = revisions
      .map((revision) => {
        const revisionId = revision.id_revisi || revision.id || "";
        const legacyRevisionNumber = Number(
          revisionId.match(/(?:-R|-)(\d+)$/)?.[1],
        );

        return {
          ...revision,
          id: penawaranId,
          id_penawaran: penawaranId,
          id_revisi: revisionId,
          revision_number:
            Number(revision.revision_number) || legacyRevisionNumber || 0,
          root_penawaran_id: penawaranId,
        };
      })
      .sort(
        (left, right) =>
          Number(left.revision_number || 0) -
            Number(right.revision_number || 0) ||
          Number(left.created_at || 0) - Number(right.created_at || 0),
      );
    const originalRevisionId = `${penawaranId}-R00`;
    const storedOriginal = normalizedRevisions.find(
      (revision) => revision.id_revisi === originalRevisionId,
    );
    if (storedOriginal) {
      originalPenawaran.value = storedOriginal;
    }
    revisionHistory.value = normalizedRevisions.filter(
      (revision) => revision.id_revisi !== originalRevisionId,
    );

    if (
      requestedRevisionId.value &&
      !revisionHistory.value.some(
        (revision) => revision.id_revisi === requestedRevisionId.value,
      )
    ) {
      replaceRevisionRoute();
    }
  } catch (error) {
    console.error("Gagal memuat riwayat revisi quotation:", error);
  } finally {
    revisionHistoryLoading.value = false;
    revisionHistoryLoaded.value = true;
  }
}

void loadRevisionHistory();

function replaceRevisionRoute(revisionId = "") {
  const nextQuery = { ...route.query };
  if (revisionId) nextQuery.revisi = revisionId;
  else delete nextQuery.revisi;
  void router.replace({ path: route.path, query: nextQuery });
}

async function activateRevision(revisionId = "") {
  if (revisionSelectionSaving.value) return;

  const revision = revisionId
    ? revisionHistory.value.find((item) => item.id_revisi === revisionId)
    : undefined;
  if (revisionId && !revision) return;

  const previousRevisionId = selectedRevisionId.value;
  revisionSelectionOverride.value = revisionId;
  replaceRevisionRoute(revisionId);
  revisionSelectionSaving.value = true;

  try {
    const materialized = await penawaranstore.activateRevisionPenawaranAct(
      penawaranId,
      revisionId,
    );
    if (!materialized) {
      replaceRevisionRoute(previousRevisionId);
    }
  } catch (error) {
    console.error("Gagal mengganti revisi aktif quotation:", error);
    replaceRevisionRoute(previousRevisionId);
    useNotificationStore().showError("Gagal mengganti revisi aktif");
  } finally {
    revisionSelectionOverride.value = null;
    revisionSelectionSaving.value = false;
  }
}

const activeRevisionTab = computed<string>({
  get: () => selectedRevisionId.value || "original",
  set: (revisionId) => {
    const nextRevisionId = revisionId === "original" ? "" : revisionId;
    if (nextRevisionId !== selectedRevisionId.value) {
      void activateRevision(nextRevisionId);
    }
  },
});

let automaticMaterializationTarget = "";

async function ensureActiveRevisionIsMaterialized() {
  if (
    !revisionHistoryLoaded.value ||
    revisionHistoryLoading.value ||
    revisionSelectionSaving.value ||
    !revisionHistory.value.length
  )
    return;

  const targetRevisionId = selectedRevisionId.value;
  if (
    targetRevisionId &&
    !revisionHistory.value.some(
      (revision) => revision.id_revisi === targetRevisionId,
    )
  )
    return;

  const materializedTarget = targetRevisionId || `${penawaranId}-R00`;
  if (
    basePenawaran.value.materialized_revision_id === materializedTarget ||
    automaticMaterializationTarget === materializedTarget
  )
    return;

  automaticMaterializationTarget = materializedTarget;
  revisionSelectionSaving.value = true;
  try {
    await penawaranstore.activateRevisionPenawaranAct(
      penawaranId,
      targetRevisionId,
    );
  } finally {
    revisionSelectionSaving.value = false;
    automaticMaterializationTarget = "";
  }
}

watch(
  [
    revisionHistoryLoaded,
    selectedRevisionId,
    () => basePenawaran.value.materialized_revision_id,
  ],
  () => {
    void ensureActiveRevisionIsMaterialized();
  },
  { immediate: true },
);

function openRevisionDialog() {
  void dialogPenawaran.value?.openRevision(detailpenawaran.value);
}

async function handlePenawaranDialogSaved(
  _quotation: penawaranM,
  mode: "add" | "edit" | "revision",
) {
  if (mode === "revision") await loadRevisionHistory();
}

function revisionIsUsedByInvoice(revision: penawaranM) {
  const revisionId = revision.id_revisi || "";
  const revisionNumber = Number(revision.revision_number) || 0;

  return invoiceLinks.value.some((invoice) => {
    if (invoice.id_revisi_penawaran) {
      return invoice.id_revisi_penawaran === revisionId;
    }
    return Number(invoice.nomor_revisi_penawaran) === revisionNumber;
  });
}

function canDeleteRevision(revision: penawaranM) {
  const revisionId = revision.id_revisi || "";
  const revisionNumber = Number(revision.revision_number) || 0;
  if (!revisionId || revisionNumber <= 0 || invoiceLinksLoading.value) {
    return false;
  }

  const revisionIsActive =
    selectedRevisionId.value === revisionId ||
    basePenawaran.value.active_revision_id === revisionId ||
    basePenawaran.value.materialized_revision_id === revisionId ||
    Number(basePenawaran.value.active_revision_number) === revisionNumber ||
    Number(basePenawaran.value.materialized_revision_number) === revisionNumber;

  return !revisionIsActive && !revisionIsUsedByInvoice(revision);
}

async function deleteRevision(revision: penawaranM) {
  const revisionId = revision.id_revisi || "";
  if (!revisionId || revisionDeletingId.value || !canDeleteRevision(revision)) {
    return;
  }

  const confirmed = await confirmationDialog.value?.show(
    "Hapus Revisi Quotation",
    `Yakin ingin menghapus ${revisionLabel(revision)}? Tindakan ini tidak dapat dipulihkan.`,
    { confirmText: "Hapus", variant: "danger" },
  );
  if (!confirmed) return;

  revisionDeletingId.value = revisionId;
  try {
    const deleted = await penawaranstore.deleteRevisionPenawaranAct(
      penawaranId,
      revision,
    );
    if (deleted) await loadRevisionHistory();
  } finally {
    revisionDeletingId.value = "";
  }
}

function revisionLabel(quotation: penawaranM) {
  const revisionNumber = Number(quotation.revision_number) || 0;
  return revisionNumber
    ? `Rev. ${String(revisionNumber).padStart(2, "0")}`
    : "Versi Awal";
}

function formatRevisionDate(quotation: penawaranM) {
  const timestamp = Number(
    quotation.revision_created_at ||
      quotation.created_at ||
      quotation.createdAt,
  );
  const date = timestamp
    ? new Date(timestamp * 1000)
    : new Date(`${quotation.tanggal_penawaran || ""}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "Tanggal tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

// Tautan invoice bukan data utama halaman, jadi muat independen di background
// tanpa menahan preview quotation atau menampilkan loader global.
void queryambilid(`penawaran/${penawaranId}/invoice`)
  .then((invoices) => {
    invoiceLinks.value = invoices as (invoiceM & { id: string })[];
  })
  .catch((error) => {
    console.error("Gagal memuat tautan invoice:", error);
  })
  .finally(() => {
    invoiceLinksLoading.value = false;
  });

void queryambilid(`penawaran/${penawaranId}/purchaseorder`)
  .then((purchaseOrders) => {
    hasPurchaseOrder.value = purchaseOrders.length > 0;
  })
  .catch((error) => {
    console.error("Gagal memuat status Purchase Order:", error);
  });

const quotationInvoiceTarget = computed(() => {
  const quotation = detailpenawaran.value;
  return (
    Number(quotation?.grand_total_penawaran) ||
    Number(quotation?.subtotal_penawaran) ||
    (quotation?.penawaran_item ?? []).reduce(
      (total, item) =>
        total +
        Number(item.subtotal_item || Number(item.qty) * Number(item.amount)),
      0,
    )
  );
});

const invoicedSubtotal = computed(() =>
  invoiceLinks.value.reduce((total, invoice) => {
    const netSubtotal = Math.max(
      0,
      Number(invoice.subtotal_invoice || 0) -
        Number(invoice.discount_invoice || 0),
    );
    const billedAmount = invoice.down_payment
      ? netSubtotal * (Number(invoice.dp_persen || 0) / 100)
      : netSubtotal;

    return total + billedAmount;
  }, 0),
);

const remainingInvoiceAmount = computed(() =>
  Math.max(0, quotationInvoiceTarget.value - invoicedSubtotal.value),
);

const isFullyInvoiced = computed(
  () =>
    invoiceLinks.value.length > 0 &&
    quotationInvoiceTarget.value > 0 &&
    remainingInvoiceAmount.value <= 0.5,
);

const hasSpkDocument = computed(() => {
  const document = detailpenawaran.value?.dokumen_spk;
  return Boolean(
    document?.firestoreFileId || document?.url || document?.dataUrl,
  );
});
const canCreateInvoice = computed(
  () =>
    hasSpkDocument.value &&
    ["SPK", "INVOICE"].includes(String(detailpenawaran.value?.status || "")),
);
const invoiceActionDisabled = computed(
  () =>
    invoiceLinksLoading.value ||
    isFullyInvoiced.value ||
    !canCreateInvoice.value ||
    detailpenawaran.value?.status === "Cancel",
);

function openSpkDialog() {
  spkFile.value = null;
  spkUploadProgress.value = 0;
  dialogSpk.value = true;
}

function selectSpkFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] || null;
  input.value = "";

  if (!file) return;
  if (file.size <= 0) {
    spkFile.value = null;
    return useNotificationStore().showError(
      "File kosong tidak dapat diunggah",
    );
  }
  if (file.size > MAX_SPK_FILE_BYTES) {
    spkFile.value = null;
    return useNotificationStore().showError(
      "Ukuran file SPK maksimal 10 MB",
    );
  }

  spkFile.value = file;
  spkUploadProgress.value = 0;
}

function formatFileSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createSpkChunkId(fileId: string, chunkIndex: number) {
  return `${fileId}-${String(chunkIndex).padStart(4, "0")}`;
}

async function saveSpkFileToFirestore(
  fileId: string,
  file: File,
  onProgress: (completedBytes: number) => void,
) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const chunkCount = Math.ceil(bytes.byteLength / SPK_CHUNK_BYTES);

  for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
    const start = chunkIndex * SPK_CHUNK_BYTES;
    const end = Math.min(start + SPK_CHUNK_BYTES, bytes.byteLength);
    const chunk = bytes.slice(start, end);

    await setDoc(
      doc(
        db,
        SPK_FILES_COLLECTION,
        createSpkChunkId(fileId, chunkIndex),
      ),
      {
        penawaranId,
        fileId,
        chunkIndex,
        chunkCount,
        bytes: Bytes.fromUint8Array(chunk),
      },
    );
    onProgress(end);
  }

  return { fileId, chunkCount };
}

async function deleteFirestoreSpkFile(fileId: string, chunkCount: number) {
  await Promise.all(
    Array.from({ length: chunkCount }, (_, chunkIndex) =>
      deleteDoc(
        doc(
          db,
          SPK_FILES_COLLECTION,
          createSpkChunkId(fileId, chunkIndex),
        ),
      ),
    ),
  );
}

async function saveSpkDocument() {
  if (spkSaving.value) return;
  if (hasSpkDocument.value) {
    return useNotificationStore().showInfo("Dokumen SPK sudah tersimpan");
  }
  if (!spkFile.value) {
    return useNotificationStore().showError("Pilih file SPK terlebih dahulu");
  }
  if (spkFile.value.size > MAX_SPK_FILE_BYTES) {
    return useNotificationStore().showError("Ukuran file SPK maksimal 10 MB");
  }

  spkSaving.value = true;
  spkUploadProgress.value = 0;
  const file = spkFile.value;
  const fileId = doc(collection(db, SPK_FILES_COLLECTION)).id;
  const expectedChunkCount = Math.ceil(file.size / SPK_CHUNK_BYTES);
  let penawaranUpdated = false;

  try {
    const { chunkCount } = await saveSpkFileToFirestore(
      fileId,
      file,
      (completedBytes) => {
        spkUploadProgress.value = file.size
          ? Math.round((completedBytes / file.size) * 100)
          : 100;
      },
    );

    const actor = useUserStore().getEmail || "-";
    const uploadedAt = Math.floor(Date.now() / 1000);
    const document: dokumenSpkM = {
      name: file.name,
      dataUrl: "",
      size: file.size,
      contentType: file.type || "application/octet-stream",
      firestoreFileId: fileId,
      chunkCount,
      uploadedAt,
      uploadedBy: actor,
    };
    const saved = await penawaranstore.saveSpkDocumentAct(
      penawaranId,
      document,
    );
    if (!saved) return;
    penawaranUpdated = true;

    useNotificationStore().showSuccess(
      "SPK berhasil diunggah. Invoice sekarang dapat dibuat.",
    );
    spkFile.value = null;
    dialogSpk.value = false;
  } catch (error) {
    console.error("Gagal mengunggah dokumen SPK:", error);
    useNotificationStore().showError(
      error instanceof Error
        ? error.message
        : "Dokumen SPK gagal diunggah atau disimpan. Silakan coba lagi.",
    );
  } finally {
    if (!penawaranUpdated) {
      void deleteFirestoreSpkFile(fileId, expectedChunkCount).catch((error) => {
        console.warn("Data chunk SPK yang gagal disimpan tidak dapat dibersihkan:", error);
      });
    }
    spkSaving.value = false;
  }
}

const spkObjectUrls = new Map<string, string>();

async function openSpkDocument() {
  const document = detailpenawaran.value?.dokumen_spk;
  if (!document) return;

  const previewWindow = window.open("about:blank", "_blank");
  if (previewWindow) previewWindow.opener = null;

  try {
    let url = document.url || document.dataUrl || "";
    const firestoreFileId = document.firestoreFileId;

    if (firestoreFileId) {
      const cacheKey = `firestore:${firestoreFileId}`;
      const cachedUrl = spkObjectUrls.get(cacheKey);

      if (cachedUrl) {
        url = cachedUrl;
      } else {
        const chunkCount = Number(document.chunkCount);
        if (!Number.isInteger(chunkCount) || chunkCount < 1) {
          throw new Error("Metadata dokumen SPK tidak valid");
        }

        const chunks = await Promise.all(
          Array.from({ length: chunkCount }, async (_, chunkIndex) => {
            const snapshot = await getDoc(
              doc(
                db,
                SPK_FILES_COLLECTION,
                createSpkChunkId(firestoreFileId, chunkIndex),
              ),
            );
            if (!snapshot.exists()) {
              throw new Error("Sebagian data dokumen SPK tidak ditemukan");
            }

            const bytes = snapshot.data().bytes;
            if (!(bytes instanceof Bytes)) {
              throw new Error("Format data dokumen SPK tidak valid");
            }
            return bytes.toUint8Array();
          }),
        );

        url = URL.createObjectURL(
          new Blob(chunks, {
            type: document.contentType || "application/octet-stream",
          }),
        );
        spkObjectUrls.set(cacheKey, url);
      }
    } else if (url.startsWith("data:")) {
      const cachedUrl = spkObjectUrls.get(url);
      if (cachedUrl) {
        url = cachedUrl;
      } else {
        const separator = url.indexOf(",");
        const header = url.slice(0, separator);
        if (separator < 0 || !header.endsWith(";base64")) {
          throw new Error("Format dokumen SPK tidak valid");
        }

        const bytes = Uint8Array.from(
          atob(url.slice(separator + 1)),
          (character) => character.charCodeAt(0),
        );
        const contentType =
          header.slice(5).split(";")[0] ||
          document.contentType ||
          "application/octet-stream";
        const objectUrl = URL.createObjectURL(
          new Blob([bytes], { type: contentType }),
        );
        spkObjectUrls.set(url, objectUrl);
        url = objectUrl;
      }
    }

    if (!url) throw new Error("Dokumen SPK tidak tersedia");
    if (previewWindow) previewWindow.location.replace(url);
    else window.open(url, "_blank", "noopener,noreferrer");
  } catch (error) {
    previewWindow?.close();
    console.error("Gagal membuka dokumen SPK:", error);
    useNotificationStore().showError(
      "Dokumen SPK tidak dapat dibuka. Silakan unggah ulang file.",
    );
  }
}

const data = reactive({
  dialogAdd: false,
  dialogRevisi: false,
  itemsPerPageKategori: 10,
  page: 1,
  itemsPerPage: 10,
  pageKategori: 1,
  dialogPenawaran: false,
  dialogAddPengeluaran: false,
  dialogPurchaseOrder: false,

  new_pemberkasan: {
    id_dokumen: "",
    nama_dokumen: "",
    file_dokumen: "",
    no_dokumen: "",
    id_kategori_item: "",
    nama_kategori_item: "",
    periode_mulai: "",
    periode_selesai: "",
    status_dokumen: "Asli",
  },

  headers_items: [
    { title: "Nama", key: "nama_kategori_item" },
    { title: "Jumlah", key: "jumlahUnit" },
    { title: "Periode Penawaran", value: "periode_penawaran", sortable: true },
    { title: "Nominal", key: "nominal" },
    { title: "Subtotal", key: "subtotal" },
    { title: "Aksi", key: "actions", sortable: false },
  ],
});

async function opendialogaddinv() {
  if (invoiceLinksLoading.value) return;
  if (!canCreateInvoice.value) {
    return useNotificationStore().showError(
      "Upload dokumen SPK sebelum membuat invoice",
    );
  }
  if (detailpenawaran.value.status === "Cancel") {
    return useNotificationStore().showError(
      "Quotation berstatus Cancel tidak dapat dibuatkan invoice",
    );
  }
  if (isFullyInvoiced.value) {
    return useNotificationStore().showInfo(
      "Seluruh nominal quotation sudah ditagih",
    );
  }

  data.dialogAdd = true;
}

async function opendialogaddpengeluaran() {
  data.dialogAddPengeluaran = true;
}

function handlePurchaseOrderSaved() {
  purchaseorderPreviewKey.value += 1;
  hasPurchaseOrder.value = true;
}

const penawaranWrapper = ref<HTMLElement | null>(null);
const penawaranContent = ref<HTMLElement | null>(null);

// Nuxt berjalan sebagai SPA, jadi viewport sudah bisa dibaca saat setup. Ini
// mencegah render desktop sesaat sebelum berubah menjadi tampilan mobile.
const isMobile = ref(
  import.meta.client && window.matchMedia("(max-width: 600px)").matches,
);
const penawaranScale = ref(1);
const penawaranHeight = ref(0);

const poWrapper = ref<HTMLElement | null>(null);
const poContent = ref<HTMLElement | null>(null);

const poScale = ref(1);
const poHeight = ref(0);

let previewObserver: ResizeObserver | null = null;
let previewMeasureFrame: number | null = null;

const measurePreview = (
  wrapper: HTMLElement | null,
  content: HTMLElement | null,
) => {
  if (!wrapper || !content) return null;

  const wrapperWidth = wrapper.clientWidth;
  const documentWidth = content.scrollWidth;
  const documentHeight = content.scrollHeight;
  if (!wrapperWidth || !documentWidth) return null;

  const scale = Math.min(1, wrapperWidth / documentWidth);
  return {
    scale,
    height: Math.ceil(documentHeight * scale),
  };
};

const updatePreviewLayout = () => {
  const mobile = window.matchMedia("(max-width: 600px)").matches;
  isMobile.value = mobile;

  if (!mobile) {
    penawaranScale.value = 1;
    penawaranHeight.value = 0;
    poScale.value = 1;
    poHeight.value = 0;
    return;
  }

  const penawaranMeasurement = measurePreview(
    penawaranWrapper.value,
    penawaranContent.value,
  );
  if (penawaranMeasurement) {
    penawaranScale.value = penawaranMeasurement.scale;
    penawaranHeight.value = penawaranMeasurement.height;
  }

  const poMeasurement = measurePreview(poWrapper.value, poContent.value);
  if (poMeasurement) {
    poScale.value = poMeasurement.scale;
    poHeight.value = poMeasurement.height;
  }
};

const schedulePreviewLayout = () => {
  if (previewMeasureFrame !== null) return;

  previewMeasureFrame = window.requestAnimationFrame(() => {
    previewMeasureFrame = null;
    updatePreviewLayout();
  });
};

async function scrollToPurchaseOrderPreview() {
  if (
    !import.meta.client ||
    route.hash !== "#purchase-order-preview" ||
    !hasPurchaseOrder.value
  )
    return;

  await nextTick();

  if (poWrapper.value) previewObserver?.observe(poWrapper.value);
  if (poContent.value) previewObserver?.observe(poContent.value);
  schedulePreviewLayout();

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      poWrapper.value?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    });
  });
}

watch(
  [() => route.hash, hasPurchaseOrder],
  () => {
    void scrollToPurchaseOrderPreview();
  },
  { immediate: true },
);

onMounted(() => {
  // Ukur langsung pada mount agar skala benar sebelum browser sempat
  // menampilkan preview A4 berukuran desktop.
  updatePreviewLayout();

  previewObserver = new ResizeObserver(schedulePreviewLayout);
  [
    penawaranWrapper.value,
    penawaranContent.value,
    poWrapper.value,
    poContent.value,
  ].forEach((element) => {
    if (element) previewObserver?.observe(element);
  });

  window.addEventListener("resize", schedulePreviewLayout, { passive: true });
});

onBeforeUnmount(() => {
  spkObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  spkObjectUrls.clear();

  previewObserver?.disconnect();
  window.removeEventListener("resize", schedulePreviewLayout);
  if (previewMeasureFrame !== null) {
    window.cancelAnimationFrame(previewMeasureFrame);
  }
});
</script>

<template>
  <ConfirmationDialog ref="confirmationDialog" />
  <DialogPenawaran ref="dialogPenawaran" @saved="handlePenawaranDialogSaved" />

  <!-- DIALOG BUAT INVOICE -->
  <dialog-buat-invoice v-model="data.dialogAdd" :penawaran="detailpenawaran" />
  <!-- @saved="navigateTo('/admin/invoice')" -->

  <dialog-buat-pengeluaran
    v-model="data.dialogAddPengeluaran"
    :id-penawaran="String(route.params.id)"
    :penawaran="detailpenawaran"
  />

  <admin-penawaran-dialog-purchaseorder
    v-model="data.dialogPurchaseOrder"
    :penawaran="detailpenawaran"
    @saved="handlePurchaseOrderSaved"
  />

  <v-dialog v-model="dialogSpk" max-width="520" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center justify-space-between px-5 py-4">
        <div class="d-flex align-center ga-3">
          <v-avatar color="primary" variant="tonal" size="36">
            <v-icon icon="mdi-file-upload-outline" size="20" />
          </v-avatar>
          <div>
            <div class="text-subtitle-1 font-weight-bold">Upload SPK</div>
            <div class="text-caption text-medium-emphasis">
              Dokumen ini wajib sebelum membuat invoice
            </div>
          </div>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          :disabled="spkSaving"
          aria-label="Tutup dialog SPK"
          @click="dialogSpk = false"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="px-5 py-5">
        <label class="spk-upload-field">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            :disabled="spkSaving"
            @change="selectSpkFile"
          />
          <v-icon icon="mdi-tray-arrow-up" size="28" color="primary" />
          <strong>{{ spkFile ? spkFile.name : "Pilih file SPK" }}</strong>
          <span>
            {{
              spkFile
                ? formatFileSize(spkFile.size)
                : "PDF, gambar, atau dokumen Word · maksimal 10 MB"
            }}
          </span>
        </label>

        <div v-if="spkSaving" class="spk-upload-progress">
          <div class="spk-upload-progress-label">
            <span class="text-truncate">
              Menyiapkan {{ spkFile?.name || "dokumen SPK" }}
            </span>
            <span>{{ spkUploadProgress }}%</span>
          </div>
          <v-progress-linear
            :model-value="spkUploadProgress"
            color="primary"
            height="4"
            rounded
          />
        </div>
      </v-card-text>

      <v-card-actions class="px-5 pb-5 pt-0 justify-end">
        <v-btn
          variant="text"
          class="text-none"
          :disabled="spkSaving"
          @click="dialogSpk = false"
        >
          Batal
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          prepend-icon="mdi-upload"
          :loading="spkSaving"
          :disabled="!spkFile"
          @click="saveSpkDocument"
        >
          Upload & Lanjut ke SPK
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <div v-if="detailpenawaran" class="quotation-page">
    <!-- STICKY HEADER WRAPPER -->
    <header class="top-sticky-container">
      <div class="sticky-inner-content">
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
              <h1>Detail Quotation</h1>
              <p>
                Review quotation details, revisions, and related transactions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="grid-wrapper">
      <div class="quotation-grid">
        <aside class="quotation-sidebar">
          <section class="info-card">
            <div class="info-card-header">
              <div class="header-icon">
                <v-icon size="19"> mdi-file-document-outline </v-icon>
              </div>

              <div>
                <div class="info-card-title">Informasi Quotation</div>
                <div class="info-card-description">
                  Detail dokumen penawaran
                </div>
              </div>
            </div>

            <div class="quotation-number-box">
              <div class="quotation-number-heading">
                <div class="field-label">Quotation No.</div>
                <div class="quotation-status-row">
                  <v-chip
                    size="x-small"
                    variant="tonal"
                    color="primary"
                    class="font-weight-medium text-capitalize"
                  >
                    {{ detailpenawaran.status }}
                  </v-chip>
                  <v-chip
                    v-if="Number(detailpenawaran.revision_number) > 0"
                    size="x-small"
                    variant="tonal"
                    color="indigo"
                    class="font-weight-bold"
                  >
                    {{ revisionLabel(detailpenawaran) }}
                  </v-chip>
                </div>
              </div>

              <div class="quotation-number">
                {{ detailpenawaran.no_penawaran }}
              </div>

              <div class="quotation-compact-meta">
                <div
                  class="quotation-meta-row quotation-meta-subject"
                  :title="detailpenawaran.perihal || '-'"
                >
                  <!-- <span class="quotation-meta-label">Subject</span> -->
                  <span class="quotation-meta-value">
                    {{ detailpenawaran.perihal || "-" }}
                  </span>
                </div>

                <div class="quotation-meta-row quotation-meta-client">
                  <v-icon icon="mdi-domain" size="13" />
                  <strong :title="detailpenawaran.nama_perusahaan || '-'">
                    {{ detailpenawaran.nama_perusahaan || "-" }}
                  </strong>
                  <template v-if="detailpenawaran.vessel">
                    <i aria-hidden="true"></i>
                    <v-icon icon="mdi-ferry" size="13" />
                    <span :title="detailpenawaran.vessel">
                      {{ detailpenawaran.vessel }}
                    </span>
                  </template>
                </div>
              </div>
            </div>

            <div class="info-card-footer text-center">
              <button
                v-if="hasSpkDocument"
                type="button"
                class="spk-document-link"
                @click="openSpkDocument"
              >
                <v-icon icon="mdi-file-check-outline" size="17" />
                <span>
                  <strong>Dokumen SPK</strong>
                  <small>{{ detailpenawaran.dokumen_spk?.name }}</small>
                </span>
                <v-icon icon="mdi-open-in-new" size="14" />
              </button>

              <div
                v-if="detailpenawaran.status == 'INVOICE'"
                class="invoice-status"
              >
                <v-icon size="15">mdi-check-circle-outline</v-icon>
                <p>Invoice telah dibuat</p>

                <div v-for="invoice in invoiceLinks" :key="invoice.id">
                  <NuxtLink
                    class="text-primary"
                    :to="`/admin/invoice/${invoice.id}`"
                  >
                    #{{ invoice.no_inv || invoice.id }}
                  </NuxtLink>
                </div>
              </div>

              <div class="action-buttons">
                <div
                  v-if="isFullyInvoiced"
                  class="invoice-fully-billed-notice"
                  role="status"
                >
                  <v-icon size="16">mdi-check-circle</v-icon>
                  <span>Seluruh nominal quotation sudah ditagih.</span>
                </div>

                <div
                  v-else-if="!canCreateInvoice"
                  class="spk-required-notice"
                  role="status"
                >
                  <v-icon size="16">mdi-alert-circle-outline</v-icon>
                  <span>Upload SPK untuk membuka pembuatan invoice.</span>
                </div>

                <div class="action-card-grid">
                  <v-btn
                    v-if="detailpenawaran.status !== 'Cancel'"
                    variant="flat"
                    class="corporate-btn action-card--revision"
                    @click="openRevisionDialog"
                  >
                    <span class="action-card-icon">
                      <v-icon icon="mdi-file-edit-outline" />
                    </span>
                    <span class="action-card-label">Revisi Quotation</span>
                  </v-btn>

                  <v-btn
                    v-if="
                      !hasSpkDocument &&
                      ['Draft', 'SPK', 'INVOICE'].includes(
                        detailpenawaran.status,
                      )
                    "
                    variant="flat"
                    class="corporate-btn action-card--spk"
                    @click="openSpkDialog"
                  >
                    <span class="action-card-icon">
                      <v-icon icon="mdi-file-upload-outline" />
                    </span>
                    <span class="action-card-label">Upload SPK</span>
                  </v-btn>

                  <v-btn
                    variant="flat"
                    class="corporate-btn action-card--invoice"
                    :disabled="invoiceActionDisabled"
                    :loading="invoiceLinksLoading"
                    @click="opendialogaddinv"
                  >
                    <v-icon
                      v-if="invoiceActionDisabled"
                      class="action-card-lock"
                      icon="mdi-lock-outline"
                      aria-hidden="true"
                    />
                    <span class="action-card-icon">
                      <v-icon icon="mdi-file-document-plus-outline" />
                    </span>
                    <span class="action-card-label">Buat Invoice</span>
                  </v-btn>

                  <v-btn
                    variant="flat"
                    class="corporate-btn action-card--po"
                    @click="data.dialogPurchaseOrder = true"
                  >
                    <span class="action-card-icon">
                      <v-icon
                        :icon="
                          hasPurchaseOrder
                            ? 'mdi-check-circle-outline'
                            : 'mdi-dolly'
                        "
                      />
                    </span>
                    <span class="action-card-label">Buat / Edit PO</span>
                  </v-btn>

                  <v-btn
                    :to="`/admin/penawaran/${encodeURIComponent(String(route.params.id))}/pengeluaran`"
                    variant="flat"
                    class="corporate-btn action-card--expense"
                  >
                    <span class="action-card-icon">
                      <v-icon icon="mdi-cash-multiple" />
                    </span>
                    <span class="action-card-label"> Catatan Pengeluaran </span>
                  </v-btn>
                </div>
              </div>
            </div>
          </section>
        </aside>

        <main class="quotation-preview">
          <div class="preview-header">
            <div class="preview-title-wrapper">
              <div class="preview-icon">
                <v-icon size="18"> mdi-file-eye-outline </v-icon>
              </div>

              <div>
                <div class="preview-title">Preview Dokumen</div>
                <!-- <div class="preview-subtitle">Tampilan surat penawaran</div> -->
              </div>
            </div>

            <div class="preview-status">
              <!-- <span class="status-dot"></span>
              Dokumen -->
            </div>
          </div>

          <!-- TAB SELECTION -->
          <div class="preview-tabs-wrapper">
            <div class="preview-revision-heading">
              <v-icon icon="mdi-pencil-circle" size="16" />
              <span>History</span>
              <small v-if="revisionHistory.length">
                {{ revisionHistory.length }}
              </small>
            </div>
            <v-progress-circular
              v-if="revisionHistoryLoading"
              indeterminate
              color="primary"
              size="18"
              width="2"
              class="preview-revision-loading"
            />
            <v-tabs
              v-else
              v-model="activeRevisionTab"
              color="primary"
              density="compact"
              align-tabs="start"
              show-arrows
              class="preview-tabs"
            >
              <v-tab
                value="original"
                class="tab-item"
                :class="{ 'tab-item--active': !selectedRevisionId }"
                :aria-pressed="!selectedRevisionId"
                :disabled="revisionSelectionSaving"
                :title="formatRevisionDate(originalPenawaran || basePenawaran)"
              >
                <span class="revision-tab-number">00</span>
                Versi Awal
              </v-tab>
              <v-tab
                v-for="revision in revisionHistory"
                :key="revision.id_revisi"
                :value="revision.id_revisi"
                class="tab-item"
                :class="{
                  'tab-item--active': selectedRevisionId === revision.id_revisi,
                }"
                :aria-pressed="selectedRevisionId === revision.id_revisi"
                :disabled="revisionSelectionSaving"
                :title="formatRevisionDate(revision)"
              >
                <!-- <span class="revision-tab-number">
                  {{ String(revision.revision_number || 0).padStart(2, "0") }}
                </span> -->
                {{ revisionLabel(revision) }}
                <span
                  v-if="canDeleteRevision(revision)"
                  class="revision-tab-delete"
                  role="button"
                  tabindex="0"
                  :aria-label="`Hapus ${revisionLabel(revision)}`"
                  :title="`Hapus ${revisionLabel(revision)}`"
                  @pointerdown.stop
                  @click.stop="deleteRevision(revision)"
                  @keydown.enter.stop.prevent="deleteRevision(revision)"
                  @keydown.space.stop.prevent="deleteRevision(revision)"
                >
                  <v-progress-circular
                    v-if="revisionDeletingId === revision.id_revisi"
                    indeterminate
                    size="12"
                    width="2"
                  />
                  <v-icon v-else icon="mdi-delete-outline" size="13" />
                </span>
              </v-tab>
            </v-tabs>
          </div>

          <div
            ref="penawaranWrapper"
            class="penawaran-wrapper"
            :style="{
              height:
                isMobile && penawaranHeight
                  ? `${penawaranHeight}px`
                  : undefined,
            }"
          >
            <div
              ref="penawaranContent"
              class="penawaran-content"
              :style="{
                transform: isMobile ? `scale(${penawaranScale})` : undefined,
              }"
            >
              <canvas-penawaran :detailpenawaran="detailpenawaran" />
            </div>
          </div>
          <template v-if="hasPurchaseOrder">
            <v-divider opacity="100" thickness="2" class="my-4" />
            <div
              ref="poWrapper"
              id="purchase-order-preview"
              class="po-wrapper"
              :style="{
                height: isMobile && poHeight ? `${poHeight}px` : undefined,
              }"
            >
              <div
                ref="poContent"
                class="po-content"
                :style="{
                  transform: isMobile ? `scale(${poScale})` : undefined,
                }"
              >
                <canvas-purchaseorder
                  :key="purchaseorderPreviewKey"
                  :detailpenawaran="detailpenawaran"
                />
              </div>
            </div>
          </template>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.po-wrapper {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  position: relative;
  overflow: hidden;
  scroll-margin-top: 150px;
}

.po-content {
  width: 100%;
  transform-origin: top left;
}

@media (max-width: 600px) {
  .po-content {
    width: max-content;
    min-width: 100%;
  }
}
.penawaran-wrapper {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  position: relative;
}

.penawaran-content {
  width: 100%;
  transform-origin: top left;
}

@media (max-width: 600px) {
  .penawaran-content {
    width: max-content;
    min-width: 100%;
  }
}
.quotation-page {
  width: 100%;
  min-height: 100vh;
  background: #ffff;
  box-sizing: border-box;
}

.top-sticky-container {
  position: sticky;
  top: 15px;
  z-index: 100;
  background: #ffff;
  width: 100%;
  padding: 16px 28px 14px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
  box-sizing: border-box;
}

.sticky-inner-content {
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.quotation-page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 0;
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

.grid-wrapper {
  padding: 24px 28px 50px;
}

.quotation-grid {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  gap: 24px;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  align-items: start;
}

.quotation-sidebar {
  width: 100%;
  min-width: 0;
  position: sticky;

  top: calc(145px + -10px);
  max-height: calc(100vh - (105px + 48px));
  overflow-y: auto;

  scrollbar-width: none;
  -ms-overflow-style: none;

  will-change: transform;
  transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.quotation-sidebar::-webkit-scrollbar {
  display: none;
}

.info-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e6eaf0;
  border-radius: 14px;
  overflow: hidden;

  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.03),
    0 8px 24px rgba(15, 23, 42, 0.04);
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 17px 18px;
  border-bottom: 1px solid #edf0f4;
  background: #ffffff;
}

.header-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
}

.info-card-title {
  font-size: 14px;
  font-weight: 750;
  color: #1e293b;
}

.info-card-description {
  margin-top: 2px;
  font-size: 11px;
  color: #94a3b8;
}

.quotation-number-box {
  margin: 9px;
  padding: 12px 13px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #edf1f5;
}

.quotation-number-heading {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.quotation-status-row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 4px;
}

.quotation-status-row :deep(.v-chip) {
  height: 19px;
  padding-inline: 6px;
  font-size: 8px;
}

.field-label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.7px;

  color: #94a3b8;
}

.quotation-number {
  margin-top: 4px;
  font-size: 15px;
  line-height: 1.3;
  font-weight: 800;
  color: #1e3a8a;
  word-break: break-word;
}

.quotation-compact-meta {
  display: flex;
  margin-top: 9px;
  padding-top: 8px;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid #e8edf3;
}

.quotation-meta-row {
  display: flex;
  min-width: 0;
  align-items: center;
  color: #64748b;
  font-size: 10px;
  line-height: 1.35;
}

.quotation-meta-subject {
  gap: 7px;
}

.quotation-meta-label {
  padding: 2px 5px;
  flex: 0 0 auto;
  color: #64748b;
  background: #eef2f6;
  border-radius: 4px;
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.45px;
  text-transform: uppercase;
}

.quotation-meta-value {
  min-width: 0;
  overflow: hidden;
  color: #334155;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quotation-meta-client {
  gap: 5px;
}

.quotation-meta-client strong,
.quotation-meta-client span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quotation-meta-client strong {
  max-width: 60%;
  color: #334155;
  font-weight: 700;
}

.quotation-meta-client span {
  flex: 1;
}

.quotation-meta-client i {
  width: 3px;
  height: 3px;
  margin: 0 2px;
  flex: 0 0 auto;
  background: #cbd5e1;
  border-radius: 50%;
}

.info-card-footer {
  padding: 15px 16px;
  border-top: 1px solid #edf0f4;
  background: #ffffff;
}

.invoice-button {
  font-weight: 650 !important;
  text-transform: none !important;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.15);
}

.quotation-preview {
  min-width: 0;
  width: 100%;
  background: #ffffff;
  border: 1px solid #e6eaf0;
  border-radius: 14px;
  overflow: hidden;

  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.03),
    0 8px 24px rgba(15, 23, 42, 0.04);
}

.preview-header {
  min-height: 22px;
  padding: 6px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e9edf2;
  background: #ffffff;
}

.preview-title-wrapper {
  display: flex;
  align-items: center;
  gap: 11px;
}

.preview-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
}

.preview-title {
  font-size: 13px;
  font-weight: 750;
  color: #1e293b;
}

.preview-subtitle {
  margin-top: 2px;
  font-size: 10px;
  color: #94a3b8;
}

.preview-status {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 9px;
  border-radius: 7px;
  background: #f8fafc;
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
}

.paper-container {
  width: 100%;
  padding: 15px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  box-sizing: border-box;
  overflow-x: auto;
}

.paper-container :deep(.offer-card) {
  margin-left: auto !important;
  margin-right: auto !important;
}

@media (max-width: 1200px) {
  .top-sticky-container {
    padding-left: 20px;
    padding-right: 20px;
  }

  .grid-wrapper {
    padding: 20px 20px 40px;
  }

  .quotation-grid {
    grid-template-columns: minmax(260px, 310px) minmax(0, 1fr);
    gap: 18px;
  }

  .paper-container {
    padding: 0px;
  }
}

@media (max-width: 960px) {
  .top-sticky-container {
    padding-left: 16px;
    padding-right: 16px;
  }

  .grid-wrapper {
    padding: 18px 16px 35px;
  }

  .quotation-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .quotation-sidebar {
    position: static;
    max-height: none;
    overflow-y: visible;
  }

  .info-card {
    width: 100%;
  }

  .quotation-preview {
    width: 100%;
  }

  .paper-container {
    padding: 20px;
  }
}

@media (max-width: 600px) {
  .top-sticky-container {
    padding: 12px 14px 10px;
  }

  .grid-wrapper {
    padding: 14px 10px 30px;
  }

  .info-card {
    border-radius: 12px;
  }

  .info-card-header {
    padding: 14px;
  }

  .header-icon {
    width: 34px;
    height: 34px;
  }

  .quotation-number-box {
    margin: 10px;
    padding: 11px 12px;
  }

  .quotation-number {
    font-size: 14px;
  }

  .info-card-footer {
    padding: 12px;
  }

  .preview-header {
    min-height: 55px;
    padding: 10px 13px;
  }

  .preview-icon {
    width: 31px;
    height: 31px;
  }

  .preview-title {
    font-size: 12px;
  }

  .preview-subtitle {
    font-size: 9px;
  }

  .preview-status {
    display: none;
  }

  .paper-container {
    padding: 10px;
  }
}

.preview-tabs-wrapper {
  display: flex;
  align-items: center;
  min-height: 48px;
  overflow: hidden;
  padding: 0 14px;
  border-bottom: 1px solid #e9edf2;
  background-color: #ffffff;
}

.preview-revision-heading {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 6px;
  min-height: 28px;
  margin-right: 8px;
  padding-right: 12px;
  border-right: 1px solid #e7ebf0;
  color: #52667a;
  font-size: 10px;
  font-weight: 750;
  white-space: nowrap;
}

.preview-revision-heading small {
  display: grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  color: #315f8d;
  background: #eaf1f8;
  font-size: 8px;
  font-weight: 800;
}

.preview-revision-loading {
  margin-left: 6px;
}

.preview-tabs {
  flex: 1 1 auto;
  min-width: 0;
  height: 44px;
}

.preview-tabs :deep(.v-slide-group__content) {
  gap: 4px;
}

.preview-tabs :deep(.v-tab__slider) {
  display: none;
}

.tab-item {
  min-width: auto !important;
  height: 30px !important;
  margin: auto 0;
  padding: 0 9px !important;
  border: 1px solid transparent;
  border-radius: 7px;
  font-size: 10px !important;
  font-weight: 650 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
}

.tab-item.v-tab--selected,
.tab-item--active {
  border-color: #315f8d !important;
  color: #ffffff !important;
  background: #315f8d !important;
}

.revision-tab-delete {
  display: inline-grid;
  width: 18px;
  height: 18px;
  margin-left: 5px;
  place-items: center;
  color: #7b8794;
  border-radius: 5px;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.revision-tab-delete:hover {
  color: #b43c3c;
  background: #feecec;
}

.revision-tab-delete:focus-visible {
  color: #b43c3c;
  background: #feecec;
  outline: 2px solid #e7a8a8;
  outline-offset: 1px;
}

.revision-tab-number {
  display: grid;
  place-items: center;
  min-width: 22px;
  height: 20px;
  margin-right: 6px;
  padding: 0 4px;
  border-radius: 5px;
  color: #718095;
  background: #eef2f6;
  font-size: 8px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.tab-item.v-tab--selected .revision-tab-number,
.tab-item--active .revision-tab-number {
  color: #315f8d;
  background: #ffffff;
}

@media (max-width: 600px) {
  .preview-tabs-wrapper {
    padding: 0 8px;
  }

  .preview-revision-heading {
    margin-right: 4px;
    padding-right: 8px;
  }

  .preview-revision-heading span {
    display: none;
  }

  .tab-item {
    padding: 0 7px !important;
    font-size: 9px !important;
  }
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.action-card-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 7px;
}

.action-card-grid > .corporate-btn {
  grid-column: span 2;
}

.action-card-grid > .corporate-btn:last-child:nth-child(3n + 1) {
  grid-column: 1 / -1;
}

.action-card-grid > .corporate-btn:nth-last-child(2):nth-child(3n + 1),
.action-card-grid > .corporate-btn:last-child:nth-child(3n + 2) {
  grid-column: span 3;
}

.spk-upload-field {
  display: flex;
  min-height: 150px;
  padding: 22px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 7px;
  cursor: pointer;
  color: #334155;
  text-align: center;
  background: #f8fafc;
  border: 1px dashed #93c5fd;
  border-radius: 10px;
}

.spk-upload-field:hover {
  background: #eff6ff;
  border-color: #2563eb;
}

.spk-upload-field input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.spk-upload-field strong {
  max-width: 100%;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spk-upload-field span {
  color: #64748b;
  font-size: 11px;
}

.spk-upload-progress {
  margin-top: 14px;
}

.spk-upload-progress-label {
  display: flex;
  margin-bottom: 6px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #64748b;
  font-size: 10px;
  font-weight: 600;
}

.spk-document-link {
  display: flex;
  width: 100%;
  margin-bottom: 9px;
  padding: 9px 10px;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #166534;
  font: inherit;
  text-align: left;
  text-decoration: none;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 7px;
}

.spk-document-link span {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.spk-document-link strong,
.spk-document-link small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spk-document-link strong {
  font-size: 11px;
}

.spk-document-link small {
  color: #4b5563;
  font-size: 9px;
}

.spk-required-notice {
  display: flex;
  padding: 9px 10px;
  align-items: flex-start;
  gap: 7px;
  color: #92400e;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  text-align: left;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 7px;
}

.spk-required-notice .v-icon {
  flex: 0 0 auto;
  margin-top: 1px;
  color: #d97706;
}

.invoice-fully-billed-notice {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 9px 10px;
  color: #166534;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  text-align: left;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 7px;
}

.invoice-fully-billed-notice .v-icon {
  flex: 0 0 auto;
  margin-top: 1px;
  color: #16a34a;
}

.corporate-btn {
  --action-color: #475569;
  --action-soft: #f1f5f9;
  --action-border: #94a3b8;
  width: 100%;
  position: relative;
  height: 78px !important;
  min-width: 0 !important;
  padding: 8px 6px !important;
  color: #1e293b !important;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%) !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  letter-spacing: 0 !important;
  text-transform: none !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;
}

.corporate-btn :deep(.v-btn__content) {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;
  line-height: 1.25;
  white-space: normal;
}

.action-card-icon {
  display: grid;
  width: 31px;
  height: 31px;
  flex: 0 0 31px;
  place-items: center;
  color: var(--action-color);
  background: var(--action-soft);
  border: 1px solid color-mix(in srgb, var(--action-color) 18%, transparent);
  border-radius: 7px;
  transition: transform 0.18s ease;
}

.action-card-icon .v-icon {
  font-size: 17px !important;
}

.action-card-lock {
  position: absolute !important;
  z-index: 2;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  padding: 3px;
  color: #545961;
  border-radius: 5px;
  font-size: 11px !important;
}

.action-card-label {
  display: block;
  width: 100%;
  color: #334155;
  font-size: 9px;
  font-weight: 650;
  line-height: 1.3;
  text-align: center;
}

.corporate-btn:hover {
  transform: translateY(-2px);
  background: linear-gradient(
    180deg,
    #ffffff 35%,
    var(--action-soft)
  ) !important;
  border-color: var(--action-border) !important;
  box-shadow: 0 7px 16px rgba(15, 23, 42, 0.08) !important;
}

.corporate-btn:hover .action-card-icon {
  transform: translateY(-1px) scale(1.04);
}

.corporate-btn.v-btn--disabled {
  color: #94a3b8 !important;
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
  opacity: 0.7;
}

.corporate-btn.v-btn--disabled:hover {
  transform: none;
  box-shadow: none !important;
}

.action-card--revision {
  --action-color: #4f46e5;
  --action-soft: #eef2ff;
  --action-border: #a5b4fc;
}

.action-card--spk {
  --action-color: #2563eb;
  --action-soft: #eff6ff;
  --action-border: #93c5fd;
}

.action-card--invoice {
  --action-color: #ea580c;
  --action-soft: #fff7ed;
  --action-border: #fdba74;
}

.action-card--po {
  --action-color: #059669;
  --action-soft: #ecfdf5;
  --action-border: #6ee7b7;
}

.action-card--expense {
  --action-color: #475569;
  --action-soft: #f1f5f9;
  --action-border: #94a3b8;
}

/* Status invoice */
.invoice-status {
  /* display: flex; */
  align-items: center;
  gap: 6px;
  margin-bottom: 9px;
  padding: 7px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f8fafc;
  color: #6b7280;
  font-size: 11px;
  font-weight: 500;
}

.invoice-status .v-icon {
  color: #16a34a !important;
}
</style>
