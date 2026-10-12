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
    v-model="data.dialogLeads"
    :width="$vuetify.display.mdAndUp ? '380px' : '90%'"
  >
    <v-card class="rounded-lg">
      <v-card-title
        class="px-4 text-subtitle-1 font-weight-bold bg-primary pa-3"
      >
        {{
          data.leadsAddEdit === "add" ? "TAMBAH LEADS" : "EDIT LEADS"
        }}
      </v-card-title>

      <v-card-text>
        <a-text-field-new
          v-model="newLeads.nama_perusahaan"
          label="Company"
          placeholder="isi"
        />
        <a-textarea-new
          v-model="newLeads.pic"
          label="PIC"
          placeholder="PIC"
        />
        <a-text-field-new
          v-model="newLeads.alamat"
          label="Address"
          placeholder="address"
        />
        <a-text-field-new
          v-model="newLeads.vessel"
          label="Vessel"
          placeholder="+00 0000"
        />
         <a-text-field-new
          v-model="newLeads.inquiry"
          label="inquiry"
          placeholder="inquiry"
        />
      </v-card-text>

      <v-card-actions class="pa-3 bg-grey-lighten-4">
        <v-btn
          variant="flat"
          color="grey-darken-2"
          @click="data.dialogLeads = false"
          class="text-capitalize px-3"
          size="small"
        >
          Batal
        </v-btn>
        <v-btn
          color="primary"
          @click="simpanLeads"
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
          <span class="font-weight-medium text-h5">Leads Web</span>
        </v-breadcrumbs-item>
      </v-breadcrumbs>
    </v-col>
    <v-col cols="2">
      <v-btn
        color="primary"
        @click="openDialogAddLeads"
        variant="flat"
        size="small"
        class="text-capitalize px-3"
        prepend-icon="mdi-plus"
      >
        Add Leads
      </v-btn>
    </v-col>
  </v-row>

  <v-card class="border rounded-lg" flat>
    <v-data-table
      :headers="data.headLeads"
      :items="leadsStore.getDataLeads"
      :search="data.searchLeads"
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
            @click="openDialogEditLeads(item)"
          >
            <v-icon icon="mdi-pencil-outline" />
            <v-tooltip activator="parent" location="top">Edit</v-tooltip>
          </v-btn>
          <v-btn
            size="27"
            variant="tonal"
            color="error"
            class="rounded-lg"
            @click="hapusLeads(item.id_leads!)"
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
          <div class="text-body-1">Belum ada data Leads</div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from "vue";
import moment from "moment";
import type { ConfirmationDialog } from "#components";
import type { leadsM } from "~/types/leadsModel";

definePageMeta({
  layout: "admin",
});

const leadsStore = useleadsStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);

const data = reactive({
  tab: "invoice",
  searchLeads: "",
  dialogLeads: false,
  editOriginalLeadsId: "",
  leadsAddEdit: "add" as "add" | "edit",
  headLeads: [
    { title: "No.", value: "no", sortable: false, width: "40px" },
    { title: "Company", value: "nama_perusahaan", sortable: true, width: "240px" },
    { title: "PIC", value: "pic", sortable: true, width: "200px" },
    {
    title: "Address",
    value: "alamat",
    sortable: true,
    width: "450px",
  },
    { title: "Vessel", value: "vessel", sortable: true },
     { title: "Inquiry", value: "inquiry", sortable: true },
    { title: "Aksi", align: "center" as const, value: "aksi", width: "100px" },
  ],
  filterStatus: "",
});

function emptyLeads(): leadsM {
  return {
  nama_perusahaan: "",
  pic: "",
  alamat: "",
  vessel: "",
  createdAt: 0
};
}

const newLeads = ref<leadsM>(emptyLeads());

onMounted(async () => {
  await leadsStore.tarikDataLeadsAct();
});

function openDialogAddLeads() {
  data.leadsAddEdit = "add";
  newLeads.value = emptyLeads();
  data.dialogLeads = true;
}

function openDialogEditLeads(item: leadsM) {
  data.leadsAddEdit = "edit";
  newLeads.value = { ...item };
  data.dialogLeads = true;
}

async function simpanLeads() {
  if (!newLeads.value.nama_perusahaan) {
    return notificationStore.showError("Nama Leads tidak boleh kosong");
  }
  if (!newLeads.value.pic) {
    return notificationStore.showError("Address tidak boleh kosong");
  }

  if (!newLeads.value.alamat) {
    return notificationStore.showError("PIC tidak boleh kosong");
  }

  if (!newLeads.value.vessel) {
    return notificationStore.showError("Phone Number tidak boleh kosong");
  }

  if (!newLeads.value.inquiry) {
    return notificationStore.showError("Email tidak boleh kosong");
  }

  if (data.leadsAddEdit === "add") {
    newLeads.value.createdAt = moment().unix();
    await leadsStore.addLeadsAct(newLeads.value);
  } else {
    await leadsStore.updateLeadsAct(newLeads.value);
  }
  data.dialogLeads = false;
}

async function hapusLeads(id: string) {
  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus Leads",
    "Anda yakin ingin menghapus Leads ini? Tindakan ini tidak dapat dipulihkan",
    { variant: "danger" },
  );
  if (!confirmed) return notificationStore.showInfo("Penghapusan dibatalkan");
  await leadsStore.deleteLeadsAct(id);
}
</script>
