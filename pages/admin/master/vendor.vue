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
    v-model="data.dialogVendor"
    :width="$vuetify.display.mdAndUp ? '380px' : '90%'"
  >
    <v-card class="rounded-lg">
      <v-card-title
        class="px-4 text-subtitle-1 font-weight-bold bg-primary pa-3"
      >
        {{
          data.vendorAddEdit === "add" ? "TAMBAH VENDOR" : "EDIT VENDOR"
        }}
      </v-card-title>

      <v-card-text>
        <a-text-field-new
          v-model="newVendor.nama_vendor"
          label="Nama Vendor"
          placeholder="isi"
        />
        <a-textarea-new
          v-model="newVendor.alamat_vendor"
          label="Address"
          placeholder="Alamat Vendor"
        />
        <a-text-field-new
          v-model="newVendor.pic_vendor"
          label="PIC"
          placeholder="isi"
        />
        <a-text-field-new
          v-model="newVendor.no_telp_vendor"
          label="Phone Number"
          placeholder="+00 0000"
        />
         <a-text-field-new
          v-model="newVendor.email_vendor"
          label="Email"
          placeholder="@gmail.com"
        />
      </v-card-text>

      <v-card-actions class="pa-3 bg-grey-lighten-4">
        <v-btn
          variant="flat"
          color="grey-darken-2"
          @click="data.dialogVendor = false"
          class="text-capitalize px-3"
          size="small"
        >
          Batal
        </v-btn>
        <v-btn
          color="primary"
          @click="simpanVendor"
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
          <span class="font-weight-medium text-h5">Master Vendor</span>
        </v-breadcrumbs-item>
      </v-breadcrumbs>
    </v-col>
    <v-col cols="2">
      <v-btn
        color="primary"
        @click="openDialogAddVendor"
        variant="flat"
        size="small"
        class="text-capitalize px-3"
        prepend-icon="mdi-plus"
      >
        Add Vendor
      </v-btn>
    </v-col>
  </v-row>

  <v-card class="border rounded-lg" flat>
    <v-data-table
      :headers="data.headVendor"
      :items="vendorStore.getDataVendor"
      :search="data.searchVendor"
      density="compact"
      :sort-by="[{ key: 'createdAt', order: 'desc' }]"
      :hover="true"
    >
      <template v-slot:item.no="{ index }">
        <div class="text-center">{{ index + 1 }}.</div>
      </template>


      <template v-slot:item.aksi="{ item }">
        <div class="d-flex justify-center">
          <v-btn
            size="27"
            variant="tonal"
            color="info"
            class="rounded-lg mr-1"
            @click="openDialogEditVendor(item)"
          >
            <v-icon icon="mdi-pencil-outline" />
            <v-tooltip activator="parent" location="top">Edit</v-tooltip>
          </v-btn>
          <v-btn
            size="27"
            variant="tonal"
            color="error"
            class="rounded-lg"
            @click="hapusVendor(item.id_vendor!)"
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
          <div class="text-body-1">Belum ada data Vendor</div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from "vue";
import moment from "moment";
import type { ConfirmationDialog } from "#components";
import type { vendorM } from "~/types/vendorModel";

definePageMeta({
  layout: "admin",
});

const vendorStore = usevendorStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);

const data = reactive({
  tab: "invoice",
  searchVendor: "",
  dialogVendor: false,
  editOriginalVendorId: "",
  vendorAddEdit: "add" as "add" | "edit",
  headVendor: [
    { title: "No.", value: "no", sortable: false, width: "40px" },
    { title: "Nama Vendor", value: "nama_vendor", sortable: true, width: "240px" },
    { title: "PIC", value: "pic_vendor", sortable: true, width: "200px" },
    {
    title: "Address",
    value: "alamat_vendor",
    sortable: true,
    width: "450px",
  },
    { title: "Phone Number", value: "no_telp_vendor", sortable: true },
     { title: "Email", value: "email_vendor", sortable: true },
    { title: "Aksi", align: "center" as const, value: "aksi", width: "100px" },
  ],
  filterStatus: "",
});

function emptyVendor(): vendorM {
  return {
  nama_vendor: "",
  pic_vendor: "",
  no_telp_vendor: "",
  alamat_vendor: "",
  email_vendor: "",
  createdAt: 0,
  createdBy: ""
};
}

const newVendor = ref<vendorM>(emptyVendor());

onMounted(async () => {
  await vendorStore.tarikDataVendorAct();
});

function openDialogAddVendor() {
  data.vendorAddEdit = "add";
  newVendor.value = emptyVendor();
  data.dialogVendor = true;
}

function openDialogEditVendor(item: vendorM) {
  data.vendorAddEdit = "edit";
  newVendor.value = { ...item };
  data.dialogVendor = true;
}

async function simpanVendor() {
  if (!newVendor.value.nama_vendor) {
    return notificationStore.showError("Nama Vendor tidak boleh kosong");
  }
  if (!newVendor.value.alamat_vendor) {
    return notificationStore.showError("Address tidak boleh kosong");
  }

  if (!newVendor.value.pic_vendor) {
    return notificationStore.showError("PIC tidak boleh kosong");
  }

  if (!newVendor.value.no_telp_vendor) {
    return notificationStore.showError("Phone Number tidak boleh kosong");
  }

  if (!newVendor.value.email_vendor) {
    return notificationStore.showError("Email tidak boleh kosong");
  }

  if (data.vendorAddEdit === "add") {
    newVendor.value.createdAt = moment().unix();
    newVendor.value.createdBy = userStore.getEmail;
    await vendorStore.addVendorAct(newVendor.value);
  } else {
    newVendor.value.updatedAt = moment().unix();
    newVendor.value.updatedBy = userStore.getEmail;
    await vendorStore.updateVendorAct(newVendor.value);
  }
  data.dialogVendor = false;
}

async function hapusVendor(id: string) {
  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus",
    "Anda yakin ingin menghapus Vendor ini?",
    { variant: "danger" },
  );
  if (!confirmed) return notificationStore.showError("Penghapusan dibatalkan");
  await vendorStore.deleteVendorAct(id);
}
</script>
