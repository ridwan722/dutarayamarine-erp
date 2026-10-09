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
    v-model="data.dialogCustomer"
    :width="$vuetify.display.mdAndUp ? '380px' : '90%'"
  >
    <v-card class="rounded-lg">
      <v-card-title
        class="px-4 text-subtitle-1 font-weight-bold bg-primary pa-3"
      >
        {{
          data.customerAddEdit === "add" ? "TAMBAH CLIENT" : "EDIT CLIENT"
        }}
      </v-card-title>

      <v-card-text>
        <a-text-field-new
          v-model="newCustomer.nama"
          label="Client"
          placeholder="PT."
        />
        <a-textarea-new
          v-model="newCustomer.alamat"
          label="Address"
          placeholder="Alamat Customer"
        />
        <a-text-field-new
          v-model="newCustomer.pic"
          label="PIC"
          placeholder="isi"
        />
        <a-text-field-new
          v-model="newCustomer.no_telp"
          label="Phone Number"
          placeholder="+00 0000"
        />
         <a-text-field-new
          v-model="newCustomer.email"
          label="Email"
          placeholder="@gmail.com"
        />

        <a-text-field-new
          v-model="newCustomer.vessel"
          label="Vessel"
          placeholder="vessel"
        />
      </v-card-text>

      <v-card-actions class="pa-3 bg-grey-lighten-4">
        <v-btn
          variant="flat"
          color="grey-darken-2"
          @click="data.dialogCustomer = false"
          class="text-capitalize px-3"
          size="small"
        >
          Batal
        </v-btn>
        <v-btn
          color="primary"
          @click="simpanCustomer"
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
          <span class="font-weight-medium text-h5">Master Client</span>
        </v-breadcrumbs-item>
      </v-breadcrumbs>
    </v-col>
    <v-col cols="2">
      <v-btn
        color="primary"
        @click="openDialogAddCustomer"
        variant="flat"
        size="small"
        class="text-capitalize px-3"
        prepend-icon="mdi-plus"
      >
        Add Client
      </v-btn>
    </v-col>
  </v-row>

  <v-card class="border rounded-lg" flat>
    <v-data-table
      :headers="data.headCustomer"
      :items="customerStore.getDataCustomer"
      :search="data.searchCustomer"
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
            @click="openDialogEditCustomer(item)"
          >
            <v-icon icon="mdi-pencil-outline" />
            <v-tooltip activator="parent" location="top">Edit</v-tooltip>
          </v-btn>
          <v-btn
            size="27"
            variant="tonal"
            color="error"
            class="rounded-lg"
            @click="hapusCustomer(item.id!)"
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
          <div class="text-body-1">Belum ada data Customer</div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from "vue";
import moment from "moment";
import type { ConfirmationDialog } from "#components";
import type { customerM } from "~/types/customerModel";

definePageMeta({
  layout: "admin",
});

const customerStore = usecustomerStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);

const data = reactive({
  tab: "invoice",
  searchCustomer: "",
  dialogCustomer: false,
  editOriginalCustomerId: "",
  customerAddEdit: "add" as "add" | "edit",
  headCustomer: [
    { title: "No.", value: "no", sortable: false, width: "40px" },
    { title: "Client", value: "nama", sortable: true, width: "240px" },
    { title: "PIC", value: "pic", sortable: true, width: "150px" },
    { title: "Vessel", value: "vessel", sortable: true, width: "150px" },
    {
    title: "Address",
    value: "alamat",
    sortable: true,
    width: "450px",
  },
    { title: "Phone Number", value: "no_telp", sortable: true },
     { title: "Email", value: "email", sortable: true },
    { title: "Aksi", align: "center" as const, value: "aksi", width: "100px" },
  ],
  filterStatus: "",
});

function emptyCustomer(): customerM {
  return {
    nama: "",
    pic: "",
    alamat: "",
    no_telp: "",
    email: "",
    vessel: "",
    createdAt: 0,
    createdBy: "",
  };
}

const newCustomer = ref<customerM>(emptyCustomer());

onMounted(async () => {
  await customerStore.tarikDataCustomerAct();
});

function openDialogAddCustomer() {
  data.customerAddEdit = "add";
  newCustomer.value = emptyCustomer();
  data.dialogCustomer = true;
}

function openDialogEditCustomer(item: customerM) {
  data.customerAddEdit = "edit";
  newCustomer.value = { ...item };
  data.dialogCustomer = true;
}

async function simpanCustomer() {
  if (!newCustomer.value.nama) {
    return notificationStore.showError("Nama Client tidak boleh kosong");
  }
  if (!newCustomer.value.alamat) {
    return notificationStore.showError("Address tidak boleh kosong");
  }

  if (!newCustomer.value.pic) {
    return notificationStore.showError("PIC tidak boleh kosong");
  }

  if (!newCustomer.value.no_telp) {
    return notificationStore.showError("Phone Number tidak boleh kosong");
  }

  if (!newCustomer.value.email) {
    return notificationStore.showError("Email tidak boleh kosong");
  }

  if (!newCustomer.value.vessel) {
    return notificationStore.showError("Vessel tidak boleh kosong");
  }

  if (data.customerAddEdit === "add") {
    newCustomer.value.createdAt = moment().unix();
    newCustomer.value.createdBy = userStore.getEmail;
    await customerStore.addCustomerAct(newCustomer.value);
  } else {
    newCustomer.value.updatedAt = moment().unix();
    newCustomer.value.updatedBy = userStore.getEmail;
    await customerStore.updateCustomerAct(newCustomer.value);
  }
  data.dialogCustomer = false;
}

async function hapusCustomer(id: string) {
  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus",
    "Anda yakin ingin menghapus customer ini?",
    { variant: "danger" },
  );
  if (!confirmed) return notificationStore.showError("Penghapusan dibatalkan");
  await customerStore.deleteCustomerAct(id);
}
</script>
