<template>
  <ConfirmationDialog ref="confirmationDialog" />
<v-btn
    variant="text"
    color="grey-darken-3"
    prepend-icon="mdi-arrow-left"
    @click="$router.go(-1)"
    class="text-capitalize font-weight-bold mb-2"
  >
    Kembali
  </v-btn>
  <!-- /// DIALOG TAMBAH CUTOMER \\\ -->
  <v-dialog
    v-model="data.dialogBarang"
    :width="$vuetify.display.mdAndUp ? '380px' : '90%'"
  >
    <v-card class="rounded-lg">
      <v-card-title
        class="px-4 text-subtitle-1 font-weight-bold bg-primary pa-3"
      >
        {{
          data.barangAddEdit === "add" ? "TAMBAH CLIENT" : "EDIT CLIENT"
        }}
      </v-card-title>

      <v-card-text>
        <a-text-field-new
          v-model="newBarang.nama_barang"
          label="Nama Barang"
          placeholder="nama barang"
        />
        <a-field-number-new
          v-model="newBarang.harga_hpp"
          label="Harga HPP"
          placeholder="0"
        />
      </v-card-text>

      <v-card-actions class="pa-3 bg-grey-lighten-4">
        <v-btn
          variant="flat"
          color="grey-darken-2"
          @click="data.dialogBarang = false"
          class="text-capitalize px-3"
          size="small"
        >
          Batal
        </v-btn>
        <v-btn
          color="primary"
          @click="simpanBarang"
          variant="flat"
          class="text-capitalize px-3"
          size="small"
        >
          Simpan
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-row align="center">
    <v-col cols="10">
      <v-breadcrumbs>
        <v-breadcrumbs-item>
          <span class="font-weight-medium text-h5">Master Barang / Service</span>
        </v-breadcrumbs-item>
      </v-breadcrumbs>
    </v-col>
    <v-col cols="2">
      <v-btn
        color="primary"
        @click="openDialogAddBarang"
        variant="flat"
        size="small"
        class="text-capitalize px-3"
        prepend-icon="mdi-plus"
      >
        Add Barang
      </v-btn>
    </v-col>
  </v-row>

  <v-card class="border rounded-lg" flat>
    <v-data-table
      :headers="data.headBarang"
      :items="barangStore.getDataBarang"
      :search="data.searchBarang"
      density="compact"
      :sort-by="[{ key: 'createdAt', order: 'desc' }]"
      :hover="true"
    >
      <template v-slot:item.no="{ index }">
        <div>{{ index + 1 }}.</div>
      </template>
 <template v-slot:item.harga_hpp="{ item }">
       Rp {{ rupiah(item.harga_hpp)}}
      </template>

      <template v-slot:item.aksi="{ item }">
        <div class="d-flex justify-center">
          <v-btn
            size="27"
            variant="tonal"
            color="info"
            class="rounded-lg mr-1"
            @click="openDialogEditBarang(item)"
          >
            <v-icon icon="mdi-pencil-outline" />
            <v-tooltip activator="parent" location="top">Edit</v-tooltip>
          </v-btn>
          <v-btn
            size="27"
            variant="tonal"
            color="error"
            class="rounded-lg"
            @click="hapusBarang(item.id!)"
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
            icon="mdi-account-outline"
          />
          <div class="text-body-1">Belum ada data Barang</div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from "vue";
import moment from "moment";
import type { ConfirmationDialog } from "#components";
import type { barangM } from "~/types/barangModel";

definePageMeta({
  layout: "admin",
});

const barangStore = usebarangStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);

const data = reactive({
  tab: "invoice",
  searchBarang: "",
  dialogBarang: false,
  editOriginalBarangId: "",
  barangAddEdit: "add" as "add" | "edit",
  headBarang: [
    { title: "No.", value: "no", sortable: false },
    { title: "Nama Barang", value: "nama_barang", sortable: true },
    { title: "Harga HPP", value: "harga_hpp", sortable: true },
    { title: "Aksi", align: "center" as const, value: "aksi" },
  ],
  filterStatus: "",
});

function emptyBarang(): barangM {
  return {
   nama_barang: "",
  harga_hpp: 0,
    createdAt: 0,
    createdBy: "",
  };
}

const newBarang = ref<barangM>(emptyBarang());

onMounted(async () => {
  await barangStore.tarikDataBarangAct();
});

function openDialogAddBarang() {
  data.barangAddEdit = "add";
  newBarang.value = emptyBarang();
  data.dialogBarang = true;
}

function openDialogEditBarang(item: barangM) {
  data.barangAddEdit = "edit";
  newBarang.value = { ...item };
  data.dialogBarang = true;
}

async function simpanBarang() {
  if (!newBarang.value.nama_barang) {
    return notificationStore.showError("Nama Client tidak boleh kosong");
  }
  if (!newBarang.value.harga_hpp) {
    return notificationStore.showError("Address tidak boleh kosong");
  }

  if (data.barangAddEdit === "add") {
    newBarang.value.createdAt = moment().unix();
    newBarang.value.createdBy = userStore.getEmail;
    await barangStore.addBarangAct(newBarang.value);
  } else {
    newBarang.value.updatedAt = moment().unix();
    newBarang.value.updatedBy = userStore.getEmail;
    await barangStore.updateBarangAct(newBarang.value);
  }
  data.dialogBarang = false;
}

async function hapusBarang(id: string) {
  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus",
    "Anda yakin ingin menghapus Barang ini?",
    { variant: "danger" },
  );
  if (!confirmed) return notificationStore.showError("Penghapusan dibatalkan");
  await barangStore.deleteBarangAct(id);
}
</script>
