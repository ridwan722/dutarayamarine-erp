<template>
  <ConfirmationDialog ref="confirmationDialog" />
  <v-dialog v-model="data.dialog_tambah_berita_acara">

        <dialog-tambah-berita-acara
          @close="data.dialog_tambah_berita_acara = false"
          @saved="handleSaved"
          mode="create"
        />
  </v-dialog>

  <v-dialog v-model="data.dialog_edit_berita_acara">

        <dialog-tambah-berita-acara
          mode="edit"
          :data-edit="data.selectedBeritaAcara"
          @close="data.dialog_edit_berita_acara = false"
          @saved="handleSaved"
        />
  </v-dialog>

  <v-row align="center">
    <v-col cols="9">
      <v-breadcrumbs>
        <v-breadcrumbs-item active>
          <span class="font-weight-medium text-h5"> Berita Acara </span>
        </v-breadcrumbs-item>
      </v-breadcrumbs>
    </v-col>

    <v-col cols="3">
      <v-btn
        size="28"
        variant="outlined"
        color="grey-darken-1"
        class="border mr-3"
        @click="refreshData"
      >
        <v-icon size="18">mdi-refresh</v-icon>
        <v-tooltip activator="parent" location="top"> Refresh Data </v-tooltip>
      </v-btn>

      <v-btn
        color="primary"
        @click="openDialogAdd"
        variant="flat"
        size="small"
        class="text-capitalize px-3"
        prepend-icon="mdi-plus"
      >
        Tambah Berita Acara
      </v-btn>
    </v-col>
  </v-row>

  <v-card flat rounded="lg" class="border">
    <v-card-title class="pa-3">
      <v-row align="center">
        <v-col cols="12" sm="10">
          <a-text-field-new
            v-model="data.search"
            placeholder="Search"
            style="max-width: 280px"
          />
        </v-col>

        <v-col cols="12" sm="2" class="text-caption text-grey-darken-1">
          <!-- Total: {{ masterBeritaAcaraStore.getDataBeritaAcara.length }} Berita Acara -->
        </v-col>
      </v-row>
    </v-card-title>

    <v-divider />

    <v-data-table
      :headers="data.headUser"
      :search="data.search"
      :items="masterBeritaAcaraStore.getDataBeritaAcara"
      density="compact"
      :hover="true"
      :items-per-page="data.itemsPerPage"
    >
      <template v-slot:item.no="{ index }">
        <span class="text-caption font-weight-bold text-grey-darken-1">
          {{ (data.page - 1) * data.itemsPerPage + index + 1 }}
        </span>
      </template>

      <template v-slot:item.total_alat="{ item }">
        <span class="text-caption font-weight-bold text-grey-darken-1">
          <!-- {{ item.daftar_alat.length }} -->
        </span>
      </template>

      <template v-slot:item.aksi="{ item }">
        <div class="d-flex justify-center">
          <v-btn
            size="27"
            variant="tonal"
            color="primary"
            class="rounded-lg mr-1"
            :to="'/admin/berita-acara/' + item.id"
          >
            <v-icon icon="mdi-eye" />
            <v-tooltip activator="parent" location="top">Detail</v-tooltip>
          </v-btn>

          <v-btn
            size="27"
            variant="tonal"
            color="info"
            class="rounded-lg mr-1"
            @click="editBeritaAcara(item)"
          >
            <v-icon icon="mdi-pencil-outline" />
            <v-tooltip activator="parent" location="top">Edit</v-tooltip>
          </v-btn>

          <v-btn
            size="27"
            variant="tonal"
            color="grey"
            class="rounded-lg"
            @click="hapusBeritaAcara(item.id!)"
          >
            <v-icon icon="mdi-trash-can-outline" />
            <v-tooltip activator="parent" location="top">Hapus</v-tooltip>
          </v-btn>
        </div>
      </template>

      <template v-slot:no-data>
        <div class="py-8 text-center text-grey-darken-1">
          <v-icon
            size="48"
            color="grey-lighten-1"
            class="mb-2"
            icon="mdi-account-multiple-outline"
          />

          <div class="text-body-1">Tidak ada data users</div>
        </div>
      </template>

      <template v-slot:bottom>
        <v-divider />

        <div class="bg-grey-lighten-5 px-4 py-2">
          <v-row no-gutters align="center">
            <v-col
              cols="12"
              md="8"
              class="d-flex align-center flex-wrap"
              style="gap: 8px"
            >
              <div
                class="d-flex align-center bg-white border rounded-lg px-3 py-1 shadow-sm mr-2"
              >
                <v-icon
                  size="16"
                  color="primary"
                  icon="mdi-database-outline"
                  class="mr-2"
                />
                <span class="text-caption font-weight-medium">
                  <span class="text-grey">Menampilkan</span>
                  <!-- <strong class="text-primary ml-1">
                    {{ (data.page - 1) * data.itemsPerPage + 1 }}-{{
                      Math.min(
                        data.page * data.itemsPerPage,
                        masterBeritaAcaraStore.getDataBeritaAcara.length,
                      )
                    }}
                  </strong>
                  <span class="text-grey mx-1">/</span>
                  <strong>{{
                    masterBeritaAcaraStore.getDataBeritaAcara.length
                  }}</strong> -->
                  <span class="text-grey mx-1">Data</span>
                </span>
              </div>
            </v-col>

            <v-col
              cols="12"
              md="4"
              class="d-flex justify-md-end justify-center mt-2 mt-md-0"
            >
              <div
                class="d-flex align-center bg-white border rounded-lg px-3 py-0"
                style="min-width: 140px; height: 32px"
              >
                <v-icon
                  size="14"
                  color="grey"
                  icon="mdi-layers-outline"
                  class="mr-2"
                />
                <span
                  class="text-caption text-grey-darken-1 mr-2"
                  style="white-space: nowrap"
                  >Tampilkan:</span
                >

                <v-select
                  v-model="data.itemsPerPage"
                  :items="[
                    { title: '10', value: 10 },
                    { title: '25', value: 25 },
                    { title: '50', value: 50 },
                    { title: 'Semua', value: -1 },
                  ]"
                  variant="plain"
                  density="compact"
                  hide-details
                  class="mt-n2"
                  @update:model-value="data.page = 1"
                >
                  <template v-slot:selection="{ item }">
                    <span class="text-caption font-weight-black text-primary">{{
                      item.title
                    }}</span>
                  </template>
                </v-select>
              </div>
            </v-col>
          </v-row>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import _ from "lodash";
import type { ConfirmationDialog } from "#components";
import type { CompanyInspectionReport } from "~/types/beritaAcaraModel";
import DialogTambahBeritaAcara from "~/components/dialog-tambah-berita-acara.vue";

definePageMeta({
  layout: "admin",
});

const masterBeritaAcaraStore = useBeritaAcaraStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);

onMounted(async () => {
  await masterBeritaAcaraStore.tarikDataBeritaAcaraAct();
});

const data = reactive({
  search: "",
  dialogAdd: false,
  dialog_tambah_berita_acara: false,
  dialog_edit_berita_acara: false,
  selectedBeritaAcara: null as CompanyInspectionReport | null,
  dialogEdit: false,
  page: 1,
  itemsPerPage: 15,
  headUser: [
    { title: "No", align: "center" as const, value: "no", width: "50px" },
    { title: "Tanggal", value: "tanggal_berita_acara", sortable: true, width: "150px" },
    { title: "Pihak Pertama", value: "pihak_pertama", sortable: true },
    { title: "Jabatan", value: "jabatan", sortable: true },
    { title: "Nama Kapal", value: "nama_kapal", sortable: true },
    { title: "Lokasi", value: "lokasi", sortable: true },
    {
      title: "Aksi",
      value: "aksi",
      align: "center" as const,
      width: "100px",
    },
  ],
});

const openDialogAdd = () => {
  data.dialog_tambah_berita_acara = true;
  // navigateTo("/admin/berita_acara/buat-laporan");
};

const hapusBeritaAcara = async (id: string) => {
  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus",
    "Anda yakin ingin menghapus user ini?",
  );

  if (!confirmed) {
    return notificationStore.showError("Penghapusan dibatalkan");
  }

  await masterBeritaAcaraStore.deleteBeritaAcaraAct(id);
};

async function refreshData() {
  useloadingStore().setLoading(true);
  sessionStorage.removeItem("berita_acara");
  await masterBeritaAcaraStore.tarikDataBeritaAcaraAct();
  useloadingStore().setLoading(false);
  notificationStore.showSuccess("Data berhasil diperbarui");
}

const handleSaved = async () => {
  data.dialog_tambah_berita_acara = false;

  // refresh data jika diperlukan
  await masterBeritaAcaraStore.tarikDataBeritaAcaraAct();
};

const editBeritaAcara = (item: CompanyInspectionReport) => {
  data.selectedBeritaAcara = _.cloneDeep(item);

  data.dialog_edit_berita_acara = true;
};
</script>

<style scoped>
:deep() thead th {
  font-weight: bold !important;
  border: 1px solid #cbcbcb !important;
  background-color: #dddddd !important;
}

:deep() tbody td {
  border-right: 1px solid #e0e0e0 !important;
}

.page-shell {
  background-color: #f8fafc;
  min-height: 100vh;
  padding: 24px 32px 48px;
  font-family:
    "Inter",
    system-ui,
    -apple-system,
    sans-serif;
  color: #0f172a;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
  margin: 0;
}

.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.vertical-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 24px;
}

@media (max-width: 768px) {
  .info-form-grid {
    grid-template-columns: 1fr;
  }
}

.panel-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.02),
    0 1px 2px -1px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.panel-header {
  padding: 16px 20px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.title-icon {
  width: 18px;
  height: 18px;
  color: #3b82f6;
}

.counter-pill {
  background-color: #eff6ff;
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  margin-left: 4px;
}

.panel-body {
  padding: 20px;
}

.panel-body.flat-body {
  padding: 0;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.dot-required {
  color: #ef4444;
}

.input-control {
  width: 100%;
  padding: 9px 12px;
  font-size: 0.875rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background-color: #ffffff;
  color: #0f172a;
  outline: none;
  transition: all 0.15s ease-in-out;
  box-sizing: border-box;
}

.input-control:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.input-control:disabled {
  background-color: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.select-wrapper {
  position: relative;
}

.select-wrapper::after {
  content: "";
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid #64748b;
  pointer-events: none;
}

.select-control {
  appearance: none;
  padding-right: 32px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 11px;
  font-size: 0.775rem;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
}

.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
  box-shadow: 0 1px 2px 0 rgba(37, 99, 235, 0.2);
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: #10b981;
  color: #ffffff;
}

.btn-secondary:hover {
  background-color: #059669;
}

.btn-ghost {
  background-color: transparent;
  color: #64748b;
  border-color: #e2e8f0;
}

.btn-ghost:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}

.btn-icon {
  width: 10px;
  height: 10px;
}

.table-frame {
  overflow-x: auto;
}

.ui-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.85rem;
}

.ui-table th {
  background-color: #f8fafc;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.ui-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.table-row {
  transition: background-color 0.12s ease;
}

.table-row:hover {
  background-color: #f8fafc;
}

.th-num,
.td-num {
  width: 44px;
  text-align: center;
}
.th-act,
.td-act {
  width: 50px;
  text-align: center;
}

.num-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: #f1f5f9;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
}

.cell-input {
  width: 100%;
  padding: 6px 10px;
  font-size: 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background-color: #ffffff;
  color: #0f172a;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease;
}

.cell-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.status-select-wrap {
  border-radius: 6px;
  padding: 2px;
}

.status-select-wrap.is-pass .cell-input {
  background-color: #f0fdf4;
  color: #166534;
  border-color: #bbf7d0;
  font-weight: 600;
}

.status-select-wrap.is-fail .cell-input {
  background-color: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
  font-weight: 600;
}

.action-btn-danger {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.action-btn-danger svg {
  width: 18px;
  height: 18px;
}

.action-btn-danger:hover:not(:disabled) {
  background-color: #fef2f2;
  color: #ef4444;
}

.action-btn-danger:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.empty-state {
  padding: 48px 24px;
  text-align: center;
  background-color: #f8fafc;
  margin: 20px;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
}

.empty-icon-wrap {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  color: #94a3b8;
}

.empty-state h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.empty-state p {
  font-size: 0.825rem;
  color: #64748b;
  margin: 0 0 16px 0;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
