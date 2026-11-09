<script setup lang="ts">
import moment from "moment";
import type { ConfirmationDialog } from "#components";
import type { CompanyMergePreview } from "~/composables/useCompanyMerge";
import type { customerM } from "~/types/customerModel";
import type { masterPicM } from "~/types/masterPicModel";
import {
  buildCompanyMaster,
  buildLegacyMasterPics,
  mergeMasterPics,
  normalizeCompanyName,
  type CompanyMasterRow,
} from "~/utils/customer-master";

definePageMeta({ layout: "admin" });
useHead({ title: "Master Client & PIC | DRM ERP" });

const customerStore = usecustomerStore();
const masterPicStore = useMasterPicStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const { previewCompanyMerge, mergeCompanies } = useCompanyMerge();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);
const isLoading = ref(true);
const isSaving = ref(false);
const isAnalyzingMerge = ref(false);
const isMerging = ref(false);
const mergeTarget = ref<CompanyMasterRow | null>(null);
const mergeSelectedCompanyIds = ref<string[]>([]);
const mergePreview = ref<CompanyMergePreview | null>(null);
const mergeAcknowledged = ref(false);
let mergePreviewRequest = 0;

const data = reactive({
  searchCompany: "",
  searchPic: "",
  directoryTab: "company" as "company" | "pic",
  dialogCompany: false,
  dialogPic: false,
  dialogMerge: false,
  companyMode: "add" as "add" | "edit",
  picMode: "add" as "add" | "edit",
});

const companyHeaders = [
  { title: "No.", value: "no", sortable: false, width: "54px" },
  { title: "Nama Perusahaan", value: "nama", minWidth: "280px" },
  { title: "Alamat", value: "alamat", minWidth: "360px" },
  {
    title: "Jumlah PIC",
    value: "picCount",
    align: "center" as const,
    width: "110px",
  },
  { title: "Ditambahkan", value: "createdAt", width: "130px" },
  {
    title: "Aksi",
    value: "aksi",
    sortable: false,
    align: "center" as const,
    width: "138px",
  },
];

const picHeaders = [
  { title: "No.", value: "no", sortable: false, width: "54px" },
  { title: "Perusahaan", value: "nama_perusahaan", minWidth: "230px" },
  { title: "Nama PIC", value: "pic", minWidth: "190px" },
  { title: "Nomor Telepon", value: "no_telp", minWidth: "170px" },
  { title: "Email", value: "email", minWidth: "230px" },
  { title: "Sumber", value: "source", align: "center" as const, width: "90px" },
  {
    title: "Aksi",
    value: "aksi",
    sortable: false,
    align: "center" as const,
    width: "100px",
  },
];

const companies = computed(() =>
  buildCompanyMaster(customerStore.getDataCustomer),
);
const legacyPics = computed(() =>
  buildLegacyMasterPics(customerStore.getDataCustomer, companies.value),
);
const masterPics = computed(() =>
  mergeMasterPics(
    masterPicStore.getDataMasterPic,
    legacyPics.value,
    companies.value,
  ),
);

const companyItems = computed(() =>
  companies.value.map((company) => ({
    ...company,
    label: company.nama,
    value: company.id_customer,
  })),
);

const filteredCompanies = computed(() => {
  const query = data.searchCompany.trim().toLocaleLowerCase("id-ID");
  return companies.value.filter(
    (company) =>
      !query ||
      [company.nama, company.alamat].some((value) =>
        String(value || "")
          .toLocaleLowerCase("id-ID")
          .includes(query),
      ),
  );
});

const filteredPics = computed(() => {
  const query = data.searchPic.trim().toLocaleLowerCase("id-ID");
  return masterPics.value.filter((pic) => {
    const company = companyForId(pic.id_perusahaan);
    return (
      !query ||
      [company?.nama, pic.pic, pic.no_telp, pic.email].some((value) =>
        String(value || "")
          .toLocaleLowerCase("id-ID")
          .includes(query),
      )
    );
  });
});

const completePicCount = computed(
  () =>
    masterPics.value.filter((pic) => pic.no_telp.trim() && pic.email.trim())
      .length,
);

const mergeCandidates = computed(() =>
  companies.value.filter(
    (company) => company.id_customer !== mergeTarget.value?.id_customer,
  ),
);

const expandedMergeSourceIds = computed(() => {
  if (!mergeTarget.value) return [];
  const ids = [
    ...mergeTarget.value.sourceIds.filter(
      (id) => id !== mergeTarget.value?.id_customer,
    ),
    ...mergeCandidates.value
      .filter((company) =>
        mergeSelectedCompanyIds.value.includes(company.id_customer),
      )
      .flatMap((company) => company.sourceIds),
  ];
  return [
    ...new Set(ids.filter((id) => id !== mergeTarget.value?.id_customer)),
  ];
});

const emptyCompany = (): customerM => ({
  nama: "",
  alamat: "",
  pic: "",
  no_telp: "",
  email: "",
  vessel: "",
  createdAt: 0,
  createdBy: "",
});

const emptyPic = (): masterPicM => ({
  id_perusahaan: "",
  pic: "",
  no_telp: "",
  email: "",
  createdAt: 0,
  createdBy: "",
});

const companyForm = ref<customerM>(emptyCompany());
const companySourceIds = ref<string[]>([]);
const picForm = ref<masterPicM>(emptyPic());

onMounted(async () => {
  isLoading.value = true;
  try {
    await Promise.all([
      customerStore.tarikDataCustomerAct(),
      masterPicStore.tarikDataMasterPicAct(),
    ]);
  } finally {
    isLoading.value = false;
  }
});

function companyForId(id: string) {
  return companies.value.find(
    (company) => company.id_customer === id || company.sourceIds.includes(id),
  );
}

function companyInitial(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length
    ? words
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
    : "CO";
}

function formatCreatedAt(timestamp: number) {
  return timestamp ? moment.unix(timestamp).format("DD MMM YYYY") : "—";
}

function picCount(company: CompanyMasterRow) {
  return masterPics.value.filter(
    (pic) => pic.id_perusahaan === company.id_customer,
  ).length;
}

function companyFingerprint(name: string) {
  return normalizeCompanyName(name)
    .replace(/\bpt\b/g, "")
    .replace(/&|\band\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

async function refreshMergePreview() {
  const requestId = ++mergePreviewRequest;
  mergeAcknowledged.value = false;
  if (!mergeTarget.value || !expandedMergeSourceIds.value.length) {
    mergePreview.value = null;
    return;
  }

  isAnalyzingMerge.value = true;
  try {
    const preview = await previewCompanyMerge(
      mergeTarget.value.id_customer,
      expandedMergeSourceIds.value,
    );
    if (requestId === mergePreviewRequest) mergePreview.value = preview;
  } catch (error: any) {
    if (requestId === mergePreviewRequest) {
      mergePreview.value = null;
      notificationStore.showError(
        error?.message || "Gagal menganalisis data perusahaan",
      );
    }
  } finally {
    if (requestId === mergePreviewRequest) isAnalyzingMerge.value = false;
  }
}

async function openMergeCompany(company: CompanyMasterRow) {
  mergeTarget.value = company;
  const fingerprint = companyFingerprint(company.nama);
  mergeSelectedCompanyIds.value = companies.value
    .filter(
      (candidate) =>
        candidate.id_customer !== company.id_customer &&
        companyFingerprint(candidate.nama) === fingerprint,
    )
    .map((candidate) => candidate.id_customer);
  mergePreview.value = null;
  mergeAcknowledged.value = false;
  data.dialogMerge = true;
  await refreshMergePreview();
}

function closeMergeDialog() {
  if (isMerging.value) return;
  data.dialogMerge = false;
  mergeTarget.value = null;
  mergeSelectedCompanyIds.value = [];
  mergePreview.value = null;
  mergeAcknowledged.value = false;
}

async function executeCompanyMerge() {
  if (
    !mergeTarget.value ||
    !mergePreview.value ||
    !expandedMergeSourceIds.value.length ||
    !mergeAcknowledged.value
  )
    return;

  const confirmed = await confirmationDialog.value?.show(
    "Gabungkan Perusahaan",
    `Pindahkan seluruh referensi ke ${mergeTarget.value.nama} (${mergeTarget.value.id_customer}) lalu hapus ${expandedMergeSourceIds.value.length} data duplikat?`,
    { variant: "danger" },
  );
  if (!confirmed) return;

  isMerging.value = true;
  let merged = false;
  try {
    const result = await mergeCompanies(
      mergeTarget.value.id_customer,
      expandedMergeSourceIds.value,
    );
    await Promise.all([
      customerStore.tarikDataCustomerAct(),
      masterPicStore.tarikDataMasterPicAct(),
    ]);
    notificationStore.showSuccess(
      `Merge selesai: ${result.totalReferences} referensi dipindahkan dan ${result.sourceIds.length} duplikat dihapus`,
    );
    merged = true;
  } catch (error: any) {
    console.error("Gagal menggabungkan perusahaan:", error);
    notificationStore.showError(
      error?.message || "Gagal menggabungkan perusahaan",
    );
  } finally {
    isMerging.value = false;
    if (merged) closeMergeDialog();
  }
}

watch(
  mergeSelectedCompanyIds,
  () => {
    if (data.dialogMerge) void refreshMergePreview();
  },
  { deep: true },
);

function openAddCompany() {
  data.companyMode = "add";
  companyForm.value = emptyCompany();
  companySourceIds.value = [];
  data.dialogCompany = true;
}

function openEditCompany(company: CompanyMasterRow) {
  data.companyMode = "edit";
  companyForm.value = { ...company };
  companySourceIds.value = [...company.sourceIds];
  data.dialogCompany = true;
}

function closeCompanyDialog() {
  if (!isSaving.value) data.dialogCompany = false;
}

async function saveCompany() {
  const name = companyForm.value.nama.trim();
  const address = companyForm.value.alamat.trim();
  if (!name) return notificationStore.showError("Nama perusahaan wajib diisi");
  if (!address)
    return notificationStore.showError("Alamat perusahaan wajib diisi");

  const duplicate = companies.value.find(
    (company) =>
      normalizeCompanyName(company.nama) === normalizeCompanyName(name) &&
      !companySourceIds.value.includes(company.id_customer || ""),
  );
  if (duplicate)
    return notificationStore.showError("Nama perusahaan sudah terdaftar");

  isSaving.value = true;
  try {
    if (data.companyMode === "add") {
      const saved = await customerStore.addCustomerAct({
        ...emptyCompany(),
        nama: name,
        alamat: address,
        createdAt: moment().unix(),
        createdBy: userStore.getEmail,
      });
      if (!saved) return;
    } else {
      const saved = await customerStore.updateCustomerGroupAct(
        companySourceIds.value,
        {
          nama: name,
          alamat: address,
          updatedAt: moment().unix(),
          updatedBy: userStore.getEmail,
        },
      );
      if (!saved) return;
    }
    data.dialogCompany = false;
  } finally {
    isSaving.value = false;
  }
}

async function deleteCompany(company: CompanyMasterRow) {
  if (picCount(company)) {
    return notificationStore.showError(
      "Perusahaan masih memiliki PIC. Hapus atau pindahkan PIC terlebih dahulu.",
    );
  }
  const confirmed = await confirmationDialog.value?.show(
    "Hapus Perusahaan",
    `Hapus ${company.nama} dari master perusahaan?`,
    { variant: "danger" },
  );
  if (!confirmed) return;
  await customerStore.deleteCustomerGroupAct(company.sourceIds);
}

function openAddPic(companyId = "") {
  data.picMode = "add";
  picForm.value = { ...emptyPic(), id_perusahaan: companyId };
  data.dialogPic = true;
}

function openEditPic(pic: masterPicM) {
  data.picMode = "edit";
  picForm.value = { ...pic };
  data.dialogPic = true;
}

function closePicDialog() {
  if (!isSaving.value) data.dialogPic = false;
}

async function savePic() {
  const company = companyForId(picForm.value.id_perusahaan);
  const name = picForm.value.pic.trim();
  const phone = picForm.value.no_telp.trim();
  const email = picForm.value.email.trim().toLowerCase();
  if (!company) return notificationStore.showError("Perusahaan wajib dipilih");
  if (!name) return notificationStore.showError("PIC wajib diisi");
  if (!phone) return notificationStore.showError("Nomor telepon wajib diisi");
  if (!email) return notificationStore.showError("Email wajib diisi");

  const currentId = picForm.value.id_master_pic || picForm.value.id;
  const duplicate = masterPics.value.find(
    (pic) =>
      pic.id_perusahaan === company.id_customer &&
      pic.pic.trim().toLocaleLowerCase("id-ID") ===
        name.toLocaleLowerCase("id-ID") &&
      (pic.id_master_pic || pic.id) !== currentId,
  );
  if (duplicate)
    return notificationStore.showError(
      "PIC sudah terdaftar pada perusahaan ini",
    );

  isSaving.value = true;
  try {
    const payload: masterPicM = {
      ...picForm.value,
      id_perusahaan: company.id_customer || "",
      nama_perusahaan: company.nama,
      pic: name,
      no_telp: phone,
      email,
    };

    let saved = false;
    if (data.picMode === "add" || picForm.value.legacyCustomerId) {
      payload.createdAt = picForm.value.createdAt || moment().unix();
      payload.createdBy = picForm.value.createdBy || userStore.getEmail;
      delete payload.id;
      delete payload.id_master_pic;
      delete payload.legacyCustomerId;
      saved = await masterPicStore.addMasterPicAct(payload);
      if (saved && picForm.value.legacyCustomerId) {
        await customerStore.clearLegacyPicAct(picForm.value.legacyCustomerId);
      }
    } else {
      payload.updatedAt = moment().unix();
      payload.updatedBy = userStore.getEmail;
      saved = await masterPicStore.updateMasterPicAct(payload);
    }
    if (saved) data.dialogPic = false;
  } finally {
    isSaving.value = false;
  }
}

async function deletePic(pic: masterPicM) {
  const confirmed = await confirmationDialog.value?.show(
    "Hapus PIC",
    `Hapus ${pic.pic || "PIC ini"} dari master PIC?`,
    { variant: "danger" },
  );
  if (!confirmed) return;

  if (pic.legacyCustomerId) {
    await customerStore.clearLegacyPicAct(pic.legacyCustomerId);
    notificationStore.showSuccess("PIC lama berhasil dihapus");
    return;
  }
  const id = pic.id_master_pic || pic.id;
  if (id) await masterPicStore.deleteMasterPicAct(id);
}
</script>

<template>
  <main class="client-page">
    <ConfirmationDialog ref="confirmationDialog" />

    <header class="client-page-heading">
      <div class="client-page-title">
        <v-btn
          icon="mdi-arrow-left"
          variant="text"
          color="grey-darken-3"
          size="small"
          class="client-back-button"
          aria-label="Kembali"
          @click="$router.go(-1)"
        />
        <div>
          <h1>Master Client</h1>
          <p>Kelola perusahaan dan kontak PIC dalam satu tempat.</p>
        </div>
      </div>
      <div class="client-page-actions">
        <v-btn
          size="small"
          variant="outlined"
          color="primary"
          prepend-icon="mdi-account-plus-outline"
          class="text-none"
          @click="openAddPic()"
        >
          Tambah PIC
        </v-btn>
        <v-btn
          size="small"
          color="primary"
          variant="flat"
          prepend-icon="mdi-domain-plus"
          class="text-none"
          @click="openAddCompany"
        >
          Tambah Perusahaan
        </v-btn>
      </div>
    </header>

    <section class="master-directory">
      <div class="directory-navigation">
        <div
          class="directory-tabs"
          role="tablist"
          aria-label="Data master client"
        >
          <button
            type="button"
            role="tab"
            :aria-selected="data.directoryTab === 'company'"
            :class="{
              'directory-tab--active': data.directoryTab === 'company',
            }"
            @click="data.directoryTab = 'company'"
          >
            <v-icon icon="mdi-domain" size="15" />
            Perusahaan
            <span>{{ companies.length }}</span>
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="data.directoryTab === 'pic'"
            :class="{ 'directory-tab--active': data.directoryTab === 'pic' }"
            @click="data.directoryTab = 'pic'"
          >
            <v-icon icon="mdi-account-tie-outline" size="15" />
            PIC
            <span>{{ masterPics.length }}</span>
          </button>
        </div>
        <div class="directory-summary" aria-label="Ringkasan master client">
          <span
            ><strong>{{ companies.length }}</strong> perusahaan</span
          >
          <i aria-hidden="true" />
          <span
            ><strong>{{ masterPics.length }}</strong> PIC</span
          >
          <!-- <i aria-hidden="true" />
          <span
            ><strong>{{ completePicCount }}</strong> kontak lengkap</span
          > -->
        </div>
      </div>

      <header class="directory-toolbar">
        <label v-if="data.directoryTab === 'company'" class="master-search">
          <v-icon icon="mdi-magnify" size="18" />
          <input
            v-model="data.searchCompany"
            type="search"
            placeholder="Cari nama atau alamat perusahaan..."
          />
          <button
            v-if="data.searchCompany"
            type="button"
            aria-label="Hapus pencarian"
            @click="data.searchCompany = ''"
          >
            <v-icon icon="mdi-close" size="16" />
          </button>
        </label>
        <label v-else class="master-search">
          <v-icon icon="mdi-magnify" size="18" />
          <input
            v-model="data.searchPic"
            type="search"
            placeholder="Cari perusahaan, PIC, telepon, atau email..."
          />
          <button
            v-if="data.searchPic"
            type="button"
            aria-label="Hapus pencarian"
            @click="data.searchPic = ''"
          >
            <v-icon icon="mdi-close" size="16" />
          </button>
        </label>
        <div class="directory-toolbar-meta">
          <span
            >{{
              data.directoryTab === "company"
                ? filteredCompanies.length
                : filteredPics.length
            }}
            data ditampilkan</span
          >
        </div>
      </header>

      <div
        v-if="data.directoryTab === 'company'"
        class="table-wrap"
        role="tabpanel"
      >
        <v-data-table
          :headers="companyHeaders"
          :items="filteredCompanies"
          :loading="isLoading"
          :items-per-page="-1"
          density="compact"
          item-value="id_customer"
          class="master-table company-table"
          hide-default-footer
          hover
        >
          <template #item.no="{ index }"
            ><span class="row-number">{{ index + 1 }}</span></template
          >
          <template #item.nama="{ item }">
            <div class="company-identity">
              <!-- <span class="company-avatar">{{
                companyInitial(item.nama)
              }}</span> -->
              <v-icon icon="mdi-domain" size="14" />
              <div>
                <strong>{{ item.nama }}</strong
                ><small>ID {{ item.id_customer }}</small>
              </div>
            </div>
          </template>
          <template #item.alamat="{ item }"
            ><p class="address-cell">{{ item.alamat || "—" }}</p></template
          >
          <template #item.picCount="{ item }">
            <button
              type="button"
              class="pic-count"
              @click="openAddPic(item.id_customer)"
            >
              <v-icon icon="mdi-account-multiple-outline" size="14" />{{
                picCount(item)
              }}
            </button>
          </template>
          <template #item.createdAt="{ item }"
            ><span class="date-cell">{{
              formatCreatedAt(item.createdAt)
            }}</span></template
          >
          <template #item.aksi="{ item }">
            <div class="table-actions">
              <button
                type="button"
                class="action-button action-button--merge"
                title="Gabungkan data duplikat ke perusahaan ini"
                aria-label="Gabungkan perusahaan duplikat"
                @click="openMergeCompany(item)"
              >
                <v-icon icon="mdi-source-merge" size="16" />
              </button>
              <button
                type="button"
                class="action-button action-button--edit"
                aria-label="Edit perusahaan"
                @click="openEditCompany(item)"
              >
                <v-icon icon="mdi-pencil-outline" size="16" />
              </button>
              <button
                type="button"
                class="action-button action-button--delete"
                aria-label="Hapus perusahaan"
                @click="deleteCompany(item)"
              >
                <v-icon icon="mdi-delete-outline" size="16" />
              </button>
            </div>
          </template>
          <template #no-data
            ><div class="empty-state">
              <v-icon icon="mdi-domain-off" size="30" /><strong
                >Perusahaan tidak ditemukan</strong
              >
            </div></template
          >
        </v-data-table>
      </div>
      <div v-else class="table-wrap" role="tabpanel">
        <v-data-table
          :headers="picHeaders"
          :items="filteredPics"
          :loading="isLoading"
          :items-per-page="-1"
          density="compact"
          item-value="id_master_pic"
          class="master-table pic-table"
          hide-default-footer
          hover
        >
          <template #item.no="{ index }"
            ><span class="row-number">{{ index + 1 }}</span></template
          >
          <template #item.nama_perusahaan="{ item }">
            <span class="company-link"
              ><v-icon icon="mdi-domain" size="14" />{{
                companyForId(item.id_perusahaan)?.nama ||
                item.nama_perusahaan ||
                "—"
              }}</span
            >
          </template>
          <template #item.pic="{ item }">
            <div class="pic-identity">
              <span><v-icon icon="mdi-account-outline" size="16" /></span
              ><strong>{{ item.pic || "—" }}</strong>
            </div>
          </template>
          <template #item.no_telp="{ item }"
            ><span class="contact-value"
              ><v-icon icon="mdi-phone-outline" size="14" />{{
                item.no_telp || "—"
              }}</span
            ></template
          >
          <template #item.email="{ item }"
            ><span class="contact-value"
              ><v-icon icon="mdi-email-outline" size="14" />{{
                item.email || "—"
              }}</span
            ></template
          >
          <template #item.source="{ item }"
            ><span
              class="source-badge"
              :class="{ 'source-badge--legacy': item.legacyCustomerId }"
              >{{ item.legacyCustomerId ? "Data lama" : "Master PIC" }}</span
            ></template
          >
          <template #item.aksi="{ item }">
            <div class="table-actions">
              <button
                type="button"
                class="action-button action-button--edit"
                aria-label="Edit PIC"
                @click="openEditPic(item)"
              >
                <v-icon icon="mdi-pencil-outline" size="16" />
              </button>
              <button
                type="button"
                class="action-button action-button--delete"
                aria-label="Hapus PIC"
                @click="deletePic(item)"
              >
                <v-icon icon="mdi-delete-outline" size="16" />
              </button>
            </div>
          </template>
          <template #no-data
            ><div class="empty-state">
              <v-icon icon="mdi-account-search-outline" size="30" /><strong
                >PIC tidak ditemukan</strong
              >
            </div></template
          >
        </v-data-table>
      </div>
    </section>

    <v-dialog
      v-model="data.dialogMerge"
      max-width="780"
      :fullscreen="$vuetify.display.smAndDown"
      :persistent="isMerging"
    >
      <section v-if="mergeTarget" class="master-dialog merge-dialog">
        <header class="dialog-header">
          <div class="dialog-heading">
            <span class="dialog-icon dialog-icon--merge"
              ><v-icon icon="mdi-source-merge" size="20"
            /></span>
            <div>
              <h2>Gabungkan Perusahaan Duplikat</h2>
              <p>
                Seluruh referensi dipindahkan sebelum data duplikat dihapus.
              </p>
            </div>
          </div>
          <button
            type="button"
            class="dialog-close"
            :disabled="isMerging"
            aria-label="Tutup dialog"
            @click="closeMergeDialog"
          >
            <v-icon icon="mdi-close" size="20" />
          </button>
        </header>

        <div class="dialog-body merge-dialog-body">
          <section class="merge-target-card">
            <span class="merge-target-icon"
              ><v-icon icon="mdi-database-check-outline" size="22"
            /></span>
            <div>
              <small>PERUSAHAAN TUJUAN — DATA YANG DIPERTAHANKAN</small
              ><strong>{{ mergeTarget.nama }}</strong
              ><span>ID {{ mergeTarget.id_customer }}</span>
              <p>{{ mergeTarget.alamat || "Alamat belum tersedia" }}</p>
            </div>
          </section>

          <section class="merge-section">
            <div class="merge-section-heading">
              <div>
                <h3>Pilih data duplikat</h3>
                <p>
                  Data terpilih akan diarahkan ke perusahaan tujuan lalu
                  dihapus.
                </p>
              </div>
              <span>{{ expandedMergeSourceIds.length }} dokumen</span>
            </div>
            <div class="merge-candidate-list">
              <label
                v-for="candidate in mergeCandidates"
                :key="candidate.id_customer"
                class="merge-candidate"
                :class="{
                  'merge-candidate--selected': mergeSelectedCompanyIds.includes(
                    candidate.id_customer,
                  ),
                }"
              >
                <input
                  v-model="mergeSelectedCompanyIds"
                  type="checkbox"
                  :value="candidate.id_customer"
                  :disabled="isMerging"
                />
                <span class="company-avatar">{{
                  companyInitial(candidate.nama)
                }}</span>
                <span class="merge-candidate-info"
                  ><strong>{{ candidate.nama }}</strong
                  ><small>ID {{ candidate.id_customer }}</small
                  ><em>{{
                    candidate.alamat || "Alamat belum tersedia"
                  }}</em></span
                >
              </label>
            </div>
          </section>

          <section class="merge-section merge-impact-section">
            <div class="merge-section-heading">
              <div>
                <h3>Dampak migrasi</h3>
                <p>
                  Dihitung langsung dari Firestore sebelum proses dijalankan.
                </p>
              </div>
              <v-progress-circular
                v-if="isAnalyzingMerge"
                indeterminate
                color="primary"
                size="22"
                width="2"
              />
            </div>
            <div v-if="mergePreview" class="merge-impact-grid">
              <div>
                <small>Penawaran</small
                ><strong>{{ mergePreview.penawaran }}</strong>
              </div>
              <div>
                <small>Invoice</small
                ><strong>{{ mergePreview.invoices }}</strong>
              </div>
              <div>
                <small>Salinan Invoice</small
                ><strong>{{ mergePreview.mirroredInvoices }}</strong>
              </div>
              <div>
                <small>Master PIC</small
                ><strong>{{ mergePreview.masterPics }}</strong>
              </div>
              <div>
                <small>Berita Acara</small
                ><strong>{{ mergePreview.beritaAcara }}</strong>
              </div>
              <div>
                <small>PIC Lama Dimigrasi</small
                ><strong>{{ mergePreview.legacyPics }}</strong>
              </div>
            </div>
            <div v-else-if="!isAnalyzingMerge" class="merge-empty-impact">
              Pilih minimal satu perusahaan duplikat untuk melihat dampak
              migrasi.
            </div>
          </section>

          <div class="merge-warning">
            <v-icon icon="mdi-shield-alert-outline" size="19" />
            <span
              ><strong>Urutan aman:</strong> referensi dan PIC dipindahkan lebih
              dahulu. Dokumen perusahaan duplikat hanya dihapus setelah semua
              batch berhasil.</span
            >
          </div>

          <v-checkbox
            v-model="mergeAcknowledged"
            color="primary"
            density="compact"
            hide-details
            :disabled="!mergePreview || isAnalyzingMerge || isMerging"
            label="Saya sudah memeriksa perusahaan tujuan dan data duplikat yang dipilih."
            class="merge-acknowledgement"
          />
        </div>

        <footer class="dialog-footer merge-dialog-footer">
          <p>
            {{
              mergePreview
                ? `${mergePreview.totalReferences} referensi akan dipindahkan ke ID ${mergeTarget.id_customer}.`
                : "Belum ada data yang akan diproses."
            }}
          </p>
          <div>
            <v-btn
              variant="outlined"
              color="grey-darken-1"
              class="text-none"
              :disabled="isMerging"
              @click="closeMergeDialog"
              >Batal</v-btn
            >
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-source-merge"
              class="text-none"
              :loading="isMerging"
              :disabled="
                !mergePreview ||
                !mergeAcknowledged ||
                isAnalyzingMerge ||
                !expandedMergeSourceIds.length
              "
              @click="executeCompanyMerge"
              >Gabungkan Sekarang</v-btn
            >
          </div>
        </footer>
      </section>
    </v-dialog>

    <v-dialog
      v-model="data.dialogCompany"
      max-width="620"
      :fullscreen="$vuetify.display.smAndDown"
      :persistent="isSaving"
    >
      <form class="master-dialog" @submit.prevent="saveCompany">
        <header class="dialog-header">
          <div class="dialog-heading">
            <span class="dialog-icon"
              ><v-icon icon="mdi-domain" size="20"
            /></span>
            <div>
              <h2>
                {{
                  data.companyMode === "add"
                    ? "Tambah Perusahaan"
                    : "Edit Perusahaan"
                }}
              </h2>
            </div>
          </div>
          <button
            type="button"
            class="dialog-close"
            :disabled="isSaving"
            aria-label="Tutup dialog"
            @click="closeCompanyDialog"
          >
            <v-icon icon="mdi-close" size="20" />
          </button>
        </header>
        <div class="dialog-body">
          <section class="dialog-section">
            <a-text-field-new
              v-model="companyForm.nama"
              label="Nama Perusahaan *"
              placeholder="nama perusahaan"
            />
            <a-textarea-new
              v-model="companyForm.alamat"
              label="Address *"
              placeholder="alamat lengkap"
              :rows="3"
            />
          </section>
        </div>
        <footer class="dialog-footer">
          <p>
            Nama perusahaan dibuat tunggal agar tidak berulang pada penawaran.
          </p>
          <div>
            <v-btn
              variant="outlined"
              color="grey-darken-1"
              class="text-none"
              :disabled="isSaving"
              @click="closeCompanyDialog"
              >Batal</v-btn
            ><v-btn
              type="submit"
              color="primary"
              variant="flat"
              prepend-icon="mdi-content-save-outline"
              class="text-none"
              :loading="isSaving"
              >Simpan Perusahaan</v-btn
            >
          </div>
        </footer>
      </form>
    </v-dialog>

    <v-dialog
      v-model="data.dialogPic"
      max-width="680"
      :fullscreen="$vuetify.display.smAndDown"
      :persistent="isSaving"
    >
      <form class="master-dialog" @submit.prevent="savePic">
        <header class="dialog-header">
          <div class="dialog-heading">
            <span class="dialog-icon dialog-icon--pic"
              ><v-icon icon="mdi-account-tie-outline" size="20"
            /></span>
            <div>
              <h2>{{ data.picMode === "add" ? "Tambah PIC" : "Edit PIC" }}</h2>
              <p>Satu perusahaan dapat memiliki beberapa PIC.</p>
            </div>
          </div>
          <button
            type="button"
            class="dialog-close"
            :disabled="isSaving"
            aria-label="Tutup dialog"
            @click="closePicDialog"
          >
            <v-icon icon="mdi-close" size="20" />
          </button>
        </header>
        <div class="dialog-body">
          <section class="dialog-section">
            <a-select-new
              v-model="picForm.id_perusahaan"
              label="Perusahaan *"
              placeholder="Pilih perusahaan"
              item-title="label"
              item-value="value"
              :items="companyItems"
            />
            <div class="dialog-form-grid">
              <a-text-field-new
                v-model="picForm.pic"
                label="PIC *"
                placeholder="pic"
              />
              <a-text-field-new
                v-model="picForm.no_telp"
                label="No. Telepon *"
                placeholder="+00 000"
              />
            </div>
            <a-text-field-new
              v-model="picForm.email"
              label="Email *"
              placeholder="pic@perusahaan.com"
            />
            <div v-if="picForm.legacyCustomerId" class="legacy-note">
              <v-icon icon="mdi-database-sync-outline" size="17" /><span
                >Saat disimpan, data lama ini akan dipindahkan ke collection
                master_pic.</span
              >
            </div>
          </section>
        </div>
        <footer class="dialog-footer">
          <p>.</p>
          <div>
            <v-btn
              variant="outlined"
              color="grey-darken-1"
              class="text-none"
              :disabled="isSaving"
              @click="closePicDialog"
              >Batal</v-btn
            ><v-btn
              type="submit"
              color="primary"
              variant="flat"
              prepend-icon="mdi-content-save-outline"
              class="text-none"
              :loading="isSaving"
              >Simpan PIC</v-btn
            >
          </div>
        </footer>
      </form>
    </v-dialog>
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
}
.client-page {
  width: 100%;
  min-height: 100vh;
  margin: 0 auto;

  color: #243447;
}
.client-page-heading {
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.client-page-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
}
.client-back-button {
  flex: 0 0 auto;
}
.client-page-title h1 {
  margin: 0;
  color: #243241;
  font-size: 18px;
  font-weight: 720;
  letter-spacing: -0.015em;
  line-height: 1.2;
}
.client-page-title p {
  margin: 2px 0 0;
  color: #7e8995;
  font-size: 9px;
  line-height: 1.35;
}
.client-page-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 7px;
}
.client-page-actions .v-btn {
  height: 30px !important;
  padding-inline: 10px !important;
  font-size: 9px !important;
  font-weight: 650 !important;
  letter-spacing: 0 !important;
  border-radius: 4px !important;
}
.master-directory {
  margin-top: 8px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dce2e8;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(31, 45, 61, 0.035);
}
.directory-navigation {
  display: flex;
  min-height: 40px;
  padding: 0 12px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background: #f8fafb;
  border-bottom: 1px solid #dfe5ea;
}
.directory-tabs {
  display: flex;
  min-height: 40px;
  align-items: stretch;
  gap: 2px;
}
.directory-tabs button {
  position: relative;
  display: inline-flex;
  min-width: 116px;
  padding: 0 10px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #687583;
  font-size: 10px;
  font-weight: 650;
  background: transparent;
  border: 0;
}
.directory-tabs button::after {
  position: absolute;
  right: 8px;
  bottom: -1px;
  left: 8px;
  height: 2px;
  content: "";
  background: transparent;
  border-radius: 2px 2px 0 0;
}
.directory-tabs button:hover {
  color: #365b7f;
  background: #f1f5f8;
}
.directory-tabs button.directory-tab--active {
  color: #285b89;
  background: #fff;
}
.directory-tabs button.directory-tab--active::after {
  background: #356f9f;
}
.directory-tabs button span {
  min-width: 19px;
  padding: 1px 5px;
  color: #697784;
  font-size: 8px;
  text-align: center;
  background: #e9eef2;
  border-radius: 8px;
}
.directory-tab--active span {
  color: #285b89 !important;
  background: #e5eef6 !important;
}
.directory-summary {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #7a8793;
  font-size: 8.5px;
  white-space: nowrap;
}
.directory-summary strong {
  color: #405062;
  font-size: 10px;
  font-weight: 720;
}
.directory-summary i {
  width: 1px;
  height: 12px;
  background: #d8dfe5;
}
.directory-toolbar {
  display: flex;
  min-height: 48px;
  padding: 8px 12px;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #e4e9ed;
}
.directory-toolbar-meta {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
}
.directory-toolbar-meta > span {
  color: #87919b;
  font-size: 8.5px;
}
.master-search {
  display: flex;
  width: min(430px, 48vw);
  height: 30px;
  padding: 0 8px;
  align-items: center;
  gap: 7px;
  color: #8793a0;
  background: #f8fafb;
  border: 1px solid #d7dee5;
  border-radius: 4px;
}
.master-search:focus-within {
  background: #fff;
  border-color: #7f9fbd;
  box-shadow: 0 0 0 2px rgba(49, 95, 140, 0.08);
}
.master-search input {
  min-width: 0;
  flex: 1;
  color: #354454;
  font: inherit;
  font-size: 9.5px;
  background: transparent;
  border: 0;
  outline: 0;
}
.master-search input::placeholder {
  color: #9aa4ae;
}
.master-search button {
  display: grid;
  width: 21px;
  height: 21px;
  padding: 0;
  place-items: center;
  color: #7f8994;
  background: transparent;
  border: 0;
  border-radius: 3px;
  cursor: pointer;
}
.table-wrap {
  width: 100%;
  overflow-x: auto;
}
.master-table {
  color: #4b5968;
}
.company-table {
  min-width: 1050px;
}
.pic-table {
  min-width: 1120px;
}
.master-table :deep(.v-data-table__th) {
  height: 32px !important;
  padding: 0 10px !important;
  color: #687584 !important;
  font-size: 7.5px !important;
  font-weight: 750 !important;
  letter-spacing: 0.055em !important;
  text-transform: uppercase !important;
  background: #f5f7f9 !important;
  border-bottom-color: #dfe4e9 !important;
}
.master-table :deep(.v-data-table__td) {
  height: 44px !important;
  padding: 6px 10px !important;
  color: #4b5968;
  font-size: 9.5px;
  border-bottom-color: #e8ecef !important;
}
.master-table :deep(tbody tr:hover) {
  background: #fafcfd !important;
}
.row-number {
  display: block;
  color: #84909c;
  text-align: center;
}
.company-identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}
.company-avatar {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #315f8c;
  font-size: 10px;
  font-weight: 750;
  background: #edf3f8;
  border: 1px solid #dbe6ef;
  border-radius: 6px;
}
.master-table .company-avatar {
  flex-basis: 28px;
  width: 28px;
  height: 28px;
  font-size: 8px;
  border-radius: 4px;
}
.company-identity > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}
.company-identity strong {
  color: #2c3a49;
  font-size: 9.5px;
  font-weight: 700;
}
.company-identity small {
  max-width: 190px;
  overflow: hidden;
  color: #929ca6;
  font-size: 7px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.address-cell {
  max-width: 480px;
  margin: 0;
  color: #697684;
  font-size: 8.5px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.pic-count {
  display: inline-flex;
  padding: 3px 7px;
  align-items: center;
  gap: 4px;
  color: #315f8c;
  font-size: 8.5px;
  font-weight: 700;
  background: #edf4f9;
  border: 1px solid #d8e5ef;
  border-radius: 10px;
  cursor: pointer;
}
.date-cell {
  color: #7c8894;
  font-size: 8.5px;
}
.company-link,
.contact-value {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #0e0e0e;
  font-size: 8.5px;
}
.pic-identity {
  display: flex;
  align-items: center;
  gap: 6px;
}
.pic-identity > span {
  display: grid;
  width: 25px;
  height: 25px;
  place-items: center;
  color: #2c7957;
  background: #e9f5ef;
  border-radius: 50%;
}
.pic-identity strong {
  color: #344453;
  font-size: 9.5px;
}
.source-badge {
  display: inline-flex;
  padding: 3px 7px;
  color: #317252;
  font-size: 7px;
  font-weight: 700;
  background: #e9f5ef;
  border-radius: 12px;
}
.source-badge--legacy {
  color: #92652c;
  background: #fbf1e5;
}
.table-actions {
  display: flex;
  justify-content: center;
  gap: 4px;
}
.action-button {
  display: grid;
  width: 26px;
  height: 26px;
  padding: 0;
  place-items: center;
  background: #fff;
  border: 1px solid;
  border-radius: 4px;
  cursor: pointer;
}
.action-button--merge {
  color: #6a5790;
  border-color: #e0d9ed;
}
.action-button--merge:hover {
  background: #f3f0f8;
}
.action-button--edit {
  color: #316b9a;
  border-color: #d5e3ee;
}
.action-button--edit:hover {
  background: #edf5fa;
}
.action-button--delete {
  color: #b44c58;
  border-color: #edd8dc;
}
.action-button--delete:hover {
  background: #fcf0f2;
}
.empty-state {
  display: flex;
  min-height: 120px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 7px;
  color: #82909d;
}
.master-dialog {
  display: flex;
  width: 100%;
  max-height: calc(100vh - 40px);
  overflow: hidden;
  flex-direction: column;
  color: #263545;
  background: #f5f6f8;
  border: 1px solid #d9dee4;
  border-radius: 9px;
  box-shadow: 0 22px 60px rgba(20, 31, 43, 0.24);
}
.dialog-header {
  display: flex;
  min-height: 68px;
  padding: 11px 15px;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #dfe4e8;
}
.dialog-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dialog-icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  color: #315f8c;
  background: #edf3f8;
  border-radius: 6px;
}
.dialog-icon--pic {
  color: #2c7957;
  background: #e9f5ef;
}
.dialog-icon--merge {
  color: #6a5790;
  background: #f0edf7;
}
.dialog-heading h2 {
  margin: 0;
  color: #202c38;
  font-size: 14px;
  font-weight: 730;
}
.dialog-heading p {
  margin: 2px 0 0;
  color: #818c97;
  font-size: 9px;
}
.dialog-close {
  display: grid;
  width: 30px;
  height: 30px;
  padding: 0;
  place-items: center;
  color: #75818d;
  background: transparent;
  border: 0;
  border-radius: 5px;
  cursor: pointer;
}
.dialog-close:hover {
  background: #f0f3f5;
}
.dialog-body {
  min-height: 0;
  padding: 10px;
  overflow-y: auto;
}
.dialog-section {
  display: grid;
  padding: 14px;
  gap: 10px;
  background: #fff;
  border: 1px solid #dfe4e8;
  border-radius: 6px;
}
.dialog-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.legacy-note {
  display: flex;
  padding: 9px 10px;
  align-items: center;
  gap: 7px;
  color: #835f31;
  font-size: 8px;
  background: #fbf3e8;
  border: 1px solid #f0dfc7;
  border-radius: 5px;
}
.merge-dialog-body {
  display: grid;
  gap: 9px;
}
.merge-target-card {
  display: flex;
  padding: 14px;
  align-items: flex-start;
  gap: 11px;
  color: #324252;
  background: linear-gradient(135deg, #f4f8fb, #fff);
  border: 1px solid #cfdeea;
  border-radius: 7px;
}
.merge-target-icon {
  display: grid;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  place-items: center;
  color: #2f7656;
  background: #e7f3ec;
  border-radius: 7px;
}
.merge-target-card > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.merge-target-card small {
  color: #61788e;
  font-size: 7px;
  font-weight: 760;
  letter-spacing: 0.08em;
}
.merge-target-card strong {
  margin-top: 3px;
  color: #243443;
  font-size: 12px;
}
.merge-target-card span {
  color: #71808e;
  font-size: 8px;
}
.merge-target-card p {
  margin: 5px 0 0;
  color: #647383;
  font-size: 8px;
  line-height: 1.45;
}
.merge-section {
  padding: 13px;
  background: #fff;
  border: 1px solid #dfe4e8;
  border-radius: 7px;
}
.merge-section-heading {
  display: flex;
  margin-bottom: 10px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.merge-section-heading h3 {
  margin: 0;
  color: #344352;
  font-size: 10px;
}
.merge-section-heading p {
  margin: 2px 0 0;
  color: #8a959f;
  font-size: 8px;
}
.merge-section-heading > span {
  padding: 3px 7px;
  color: #5d6d7c;
  font-size: 8px;
  font-weight: 700;
  background: #f0f3f5;
  border-radius: 11px;
}
.merge-candidate-list {
  display: grid;
  gap: 6px;
  max-height: 230px;
  overflow-y: auto;
}
.merge-candidate {
  display: grid;
  min-height: 58px;
  padding: 7px 9px;
  align-items: center;
  grid-template-columns: auto 34px minmax(0, 1fr);
  gap: 9px;
  background: #fafbfc;
  border: 1px solid #e2e7eb;
  border-radius: 6px;
  cursor: pointer;
}
.merge-candidate:hover {
  border-color: #cbd8e3;
}
.merge-candidate--selected {
  background: #f1f6fa;
  border-color: #bcd0e0;
}
.merge-candidate input {
  width: 15px;
  height: 15px;
  accent-color: #315f8c;
}
.merge-candidate-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.merge-candidate-info strong {
  color: #334352;
  font-size: 9px;
}
.merge-candidate-info small {
  margin-top: 1px;
  color: #71808e;
  font-size: 7px;
}
.merge-candidate-info em {
  margin-top: 3px;
  overflow: hidden;
  color: #919ba5;
  font-size: 7px;
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.merge-impact-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}
.merge-impact-grid > div {
  display: flex;
  min-height: 54px;
  padding: 8px 10px;
  justify-content: center;
  flex-direction: column;
  background: #f7f9fa;
  border: 1px solid #e5e9ed;
  border-radius: 5px;
}
.merge-impact-grid small {
  color: #7d8995;
  font-size: 7px;
  font-weight: 700;
  text-transform: uppercase;
}
.merge-impact-grid strong {
  margin-top: 2px;
  color: #304252;
  font-size: 16px;
  line-height: 1;
}
.merge-empty-impact {
  padding: 16px;
  color: #87939f;
  font-size: 8px;
  text-align: center;
  background: #f8fafb;
  border-radius: 5px;
}
.merge-warning {
  display: flex;
  padding: 10px 11px;
  align-items: flex-start;
  gap: 8px;
  color: #805d2e;
  font-size: 8px;
  line-height: 1.5;
  background: #fbf3e8;
  border: 1px solid #eedcbe;
  border-radius: 6px;
}
.merge-warning .v-icon {
  flex: 0 0 auto;
}
.merge-acknowledgement {
  color: #526271;
  font-size: 9px;
  background: #fff;
  border: 1px solid #e0e5e9;
  border-radius: 6px;
}
.merge-dialog-footer p {
  max-width: 400px;
}
.dialog-footer {
  display: flex;
  min-height: 58px;
  padding: 9px 14px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #fff;
  border-top: 1px solid #dfe4e8;
}
.dialog-footer p {
  margin: 0;
  color: #7d8893;
  font-size: 9px;
}
.dialog-footer > div {
  display: flex;
  gap: 7px;
}
.dialog-footer .v-btn {
  height: 32px !important;
  font-size: 9px !important;
  font-weight: 650 !important;
  letter-spacing: 0 !important;
  border-radius: 4px !important;
}

@media (max-width: 767px) {
  .client-page {
    padding: 6px 8px 22px;
  }
  .client-page-heading {
    padding: 4px 0 7px;
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
  }
  .client-page-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .client-page-actions .v-btn {
    width: 100%;
  }
  .master-directory {
    margin-top: 0;
  }
  .directory-navigation {
    padding: 0 8px;
    align-items: stretch;
    flex-direction: column-reverse;
    gap: 0;
  }
  .directory-tabs {
    width: 100%;
  }
  .directory-tabs button {
    min-width: 0;
    flex: 1;
  }
  .directory-summary {
    min-height: 30px;
    justify-content: center;
    border-bottom: 1px solid #e4e9ed;
  }
  .directory-toolbar {
    padding: 8px;
    align-items: stretch;
    flex-direction: column;
    gap: 7px;
  }
  .directory-toolbar-meta {
    justify-content: space-between;
  }
  .master-search {
    width: 100%;
  }
  .master-dialog {
    height: 100%;
    max-height: 100%;
    border: 0;
    border-radius: 0;
  }
  .dialog-heading p,
  .dialog-footer p {
    display: none;
  }
  .dialog-form-grid {
    grid-template-columns: 1fr;
  }
  .merge-impact-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .merge-candidate {
    grid-template-columns: auto 32px minmax(0, 1fr);
  }
  .dialog-footer > div {
    display: grid;
    width: 100%;
    grid-template-columns: 1fr 1.35fr;
  }
  .dialog-footer .v-btn {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 420px) {
  .client-page-title p {
    display: none;
  }
  .client-page-actions {
    grid-template-columns: 1fr;
  }
  .directory-summary span:last-child,
  .directory-summary i:last-of-type {
    display: none;
  }
}
</style>
