<template>
  <ConfirmationDialog ref="confirmationDialog" />

  <v-dialog
    v-model="data.dialogAdd"
    :width="$vuetify.display.mdAndUp ? '380px' : '90%'"
  >
    <v-card class="rounded-lg">
      <v-card-title
        class="px-4 text-subtitle-1 font-weight-bold bg-primary pa-3"
      >
        {{ titleaddedit }}
      </v-card-title>

      <v-card-text>
        <a-text-field-new
          v-model="newPerusahaan.nama_group_pt"
          label="Nama Group"
          placeholder="Group Perusahaan"
        />

        <a-text-field-new
          v-model="newPerusahaan.nama_perusahaan"
          label="Nama Perusahaan"
          placeholder="Nama Perusahaan"
          :disabled="data.addedit == 'edit'"
        />

        <a-text-field-new
          v-model="newPerusahaan.telepon_perusahaan"
          label="No. Telepon"
          placeholder="No. Telp"
        />

        <a-textarea-new
          v-model="newPerusahaan.alamat_perusahaan"
          label="Alamat"
          placeholder="Alamat Perusahaan"
        />
      </v-card-text>

      <v-card-actions class="pa-3 bg-grey-lighten-4">
        <v-btn
          variant="flat"
          color="grey-darken-2"
          @click="data.dialogAdd = false"
          class="text-capitalize px-3"
          size="small"
        >
          Batal
        </v-btn>

        <v-btn
          color="primary"
          @click="validate"
          variant="flat"
          class="text-capitalize px-3"
          size="small"
        >
          {{ bottomAddEdit }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Main Content -->
  <v-row align="center">
    <v-col cols="9">
      <v-breadcrumbs>
        <v-breadcrumbs-item>
          <span class="font-weight-medium text-h5"> Master Perusahaan </span>
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
        <v-icon size="18" icon="mdi-refresh" />
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
        Tambah Perusahaan
      </v-btn>
    </v-col>
  </v-row>

  <v-card class="border rounded-lg" flat>
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
          Total: {{ perusahaanStore.getDataPerusahaan.length }} perusahaan
        </v-col>
      </v-row>
    </v-card-title>

    <v-divider />

    <v-data-table
      :headers="data.headPerusahaan"
      :items="perusahaanStore.getDataPerusahaan"
      :search="data.search"
      density="compact"
      :sort-by="[{ key: 'createdAt', order: 'desc' }]"
      :hover="true"
      :items-per-page="data.itemsPerPage"
      v-model:page="data.page"
    >
      <template v-slot:item.no="{ index }">
        <span class="text-caption font-weight-bold text-grey-darken-1">
          {{ (data.page - 1) * data.itemsPerPage + index + 1 }}
        </span>
      </template>

      <!-- <template v-slot:item.id="{ item }">
        <v-chip
          size="x-small"
          color="grey-darken-1"
          variant="tonal"
          class="font-weight-medium rounded-sm px-2"
          style="font-family: monospace"
        >
          {{ item.id }}
        </v-chip>
      </template> -->

      <!-- <template v-slot:item.id="{ item }">
        <v-chip
          size="x-small"
          color="grey-darken-1"
          variant="tonal"
          class="font-weight-medium rounded-sm px-2"
          style="font-family: monospace"
        >
          {{ item.id }}
        </v-chip>
      </template> -->

      <template v-slot:item.nama_perusahaan="{ item }">
        <v-chip
          size="small"
          variant="flat"
          color="blue-grey-lighten-5"
          class="text-blue-grey-darken-3 font-weight-bold border"
        >
          <v-avatar start color="blue-grey-darken-1" size="18">
            <span class="text-white" style="font-size: 8px">
              {{ item.nama_perusahaan.substring(0, 1) }}
            </span>
          </v-avatar>
          {{ item.nama_perusahaan.toUpperCase() }}
        </v-chip>
      </template>

      <template v-slot:item.telepon_perusahaan="{ item }">
        <v-chip
          v-if="item.telepon_perusahaan"
          size="x-small"
          variant="outlined"
          color="success"
          prepend-icon="mdi-phone"
          class="font-weight-medium"
        >
          {{ item.telepon_perusahaan }}
        </v-chip>

        <span v-else class="text-caption text-grey-lighten-1 font-italic">
          Tidak ada data
        </span>
      </template>

      <template v-slot:item.alamat_perusahaan="{ item }">
        <div class="py-2" v-if="item.alamat_perusahaan">
          <div class="d-flex align-start">
            <v-icon
              size="16"
              color="blue-darken-1"
              icon="mdi-map-marker-radius"
              class="mr-2 mt-1"
            />

            <div class="address-text">
              {{ item.alamat_perusahaan }}
            </div>
          </div>
        </div>

        <span v-else class="text-caption text-grey-lighten-1 font-italic">
          Tidak ada data
        </span>
      </template>

      <template v-slot:item.aksi="{ item }">
        <div class="d-flex justify-center">
          <v-btn
            size="27"
            variant="tonal"
            color="info"
            class="rounded-lg mr-1"
            @click="openDialogEdit(item)"
          >
            <v-icon icon="mdi-pencil-outline" />
            <v-tooltip activator="parent" location="top">Edit</v-tooltip>
          </v-btn>

          <v-btn
            size="27"
            variant="tonal"
            color="error"
            class="rounded-lg"
            @click="hapusPerusahaan(item.id!)"
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
            icon="mdi-domain"
          />

          <div class="text-body-1">Tidak ada data Perusahaan</div>
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
                  <strong class="text-primary ml-1">
                    {{ (data.page - 1) * data.itemsPerPage + 1 }}-{{
                      Math.min(
                        data.page * data.itemsPerPage,
                        perusahaanStore.getDataPerusahaan.length,
                      )
                    }}
                  </strong>
                  <span class="text-grey mx-1">/</span>
                  <strong>{{
                    perusahaanStore.getDataPerusahaan.length
                  }}</strong>
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
import moment from "moment";
import { reactive } from "vue";
import type { ConfirmationDialog } from "#components";
import type { perusahaanM } from "~/types/master/perusahaanModel";
import { useMasterPerusahaanStore } from "~/stores/master/perusahaanStore";

const perusahaanStore = useMasterPerusahaanStore();
const useuserstore = useUserStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);
const notificationStore = useNotificationStore();

definePageMeta({
  layout: "admin",
});

onMounted(async () => {
  sessionStorage.removeItem("m_perusahaan_erp");
  await perusahaanStore.tarikDataPerusahaanAct();
});

const newPerusahaan = ref<perusahaanM>({
  nama_perusahaan: "",
  nama_group_pt: "",
  alamat_perusahaan: "",
  telepon_perusahaan: "",
  nama_surat: "",
  createdAt: 0,
  createdBy: "",
});

const data = reactive({
  search: "",
  dialogAdd: false,
  dialogEdit: false,
  addedit: "",
  page: 1,
  itemsPerPage: 10,

  headPerusahaan: [
    {
      title: "No",
      align: "center" as const,
      value: "no",
      width: "50px", // Tetapkan lebar kecil karena nomor pasti pendek
    },
    // {
    //   title: "ID",
    //   value: "id",
    //   sortable: true,
    // },
    {
      title: "Nama Group",
      value: "nama_group_pt",
      sortable: true,
    },
    {
      title: "Nama perusahaan",
      value: "nama_perusahaan",
      sortable: true,
    },
    {
      title: "Alamat",
      value: "alamat_perusahaan",
      sortable: true,
    },
    {
      title: "No. Telepon",
      value: "telepon_perusahaan",
      sortable: true,
    },
    {
      title: "Aksi",
      align: "center" as const,
      value: "aksi",
      width: "50px",
    },
  ],
});

const titleaddedit = computed(() => {
  if (data.addedit == "add") {
    return "TAMBAH PERUSAHAAN";
  } else {
    return "EDIT PERUSAHAAN";
  }
});

const bottomAddEdit = computed(() => {
  if (data.addedit == "add") {
    return "Simpan";
  } else {
    return "Edit";
  }
});

function openDialogAdd() {
  data.addedit = "add";
  data.dialogAdd = true;
  newPerusahaan.value = {
    nama_perusahaan: "",
    nama_group_pt: "",
    alamat_perusahaan: "",
    telepon_perusahaan: "",
    nama_surat: "",
    createdAt: 0,
    createdBy: "",
  };
}

async function validate() {
  if (data.addedit == "add") {
    addperusahaan();
  } else {
    saveedit();
  }
}

async function saveedit() {
  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Edit",
    "Anda yakin ingin menyimpan perubahan ini?",
  );

  if (!confirmed) {
    return notificationStore.showError("Perubahan Dibatalkan");
  }

  newPerusahaan.value.updatedAt = moment().unix();
  newPerusahaan.value.updatedBy = useuserstore.getEmail;
  perusahaanStore.updateMasterPerusahaanAct(newPerusahaan.value);
  data.dialogAdd = false;
  refreshData();
}

function openDialogEdit(item: perusahaanM) {
  data.addedit = "edit";
  data.dialogAdd = true;
  newPerusahaan.value = _.assign({}, item);
}

function addperusahaan() {
  if (newPerusahaan.value.nama_group_pt == "") {
    return notificationStore.showError("nama group tidak boleh kosong");
  }
  if (newPerusahaan.value.nama_perusahaan == "") {
    return notificationStore.showError("nama perusahaan tidak boleh kosong");
  }
  if (newPerusahaan.value.telepon_perusahaan == "") {
    return notificationStore.showError("notelfon tidak boleh kosong");
  }
  if (newPerusahaan.value.alamat_perusahaan == "") {
    return notificationStore.showError("alamat perusahaan tidak boleh kosong");
  }
  newPerusahaan.value.createdAt = moment().unix();
  newPerusahaan.value.createdBy = useuserstore.getEmail;
  newPerusahaan.value.nama_surat = newPerusahaan.value.nama_perusahaan;
  perusahaanStore.addMasterPerusahaanAct(newPerusahaan.value);
  newPerusahaan.value = {
    nama_perusahaan: "",
    nama_group_pt: "",
    alamat_perusahaan: "",
    telepon_perusahaan: "",
    nama_surat: "",
    createdAt: 0,
    createdBy: "",
  };
  data.dialogAdd = false;
  refreshData();
}

async function hapusPerusahaan(id: string) {
  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus",
    "Anda yakin ingin menyimpan perubahan ini?",
  );

  if (!confirmed) {
    return notificationStore.showError("Penghapusan Dibatalkan");
  }

  perusahaanStore.deleteMasterPerusahaanAct(id);
  refreshData();
}

async function refreshData() {
  useloadingStore().setLoading(true);
  sessionStorage.removeItem("m_perusahaan_erp");
  await perusahaanStore.tarikDataPerusahaanAct();
  useloadingStore().setLoading(false);
  notificationStore.showSuccess("Data berhasil diperbarui");
}
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
</style>
