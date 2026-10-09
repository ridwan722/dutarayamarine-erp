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
    v-model="data.dialogTnc"
    :width="$vuetify.display.mdAndUp ? '380px' : '90%'"
  >
    <v-card class="rounded-lg">
      <v-card-title
        class="px-4 text-subtitle-1 font-weight-bold bg-primary pa-3"
      >
        {{ data.tncAddEdit === "add" ? "TAMBAH T&C" : "EDIT T&C" }}
      </v-card-title>

      <v-card-text>
        <a-textarea-new
          v-model="newTnc.nama_term"
          label="T&C"
          placeholder="input term & condition"
        />
      </v-card-text>

      <v-card-actions class="pa-3 bg-grey-lighten-4">
        <v-btn
          variant="flat"
          color="grey-darken-2"
          @click="data.dialogTnc = false"
          class="text-capitalize px-3"
          size="small"
        >
          Batal
        </v-btn>
        <v-btn
          color="primary"
          @click="simpanTnc"
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
          <span class="font-weight-medium text-h5"
            >Master Term & Condition</span
          >
        </v-breadcrumbs-item>
      </v-breadcrumbs>
    </v-col>
    <v-col cols="2">
      <v-btn
        color="primary"
        @click="openDialogAddTnc"
        variant="flat"
        size="small"
        class="text-capitalize px-3"
        prepend-icon="mdi-plus"
      >
        Add T&C
      </v-btn>
    </v-col>
  </v-row>

  <v-card class="border rounded-lg" flat>
    <v-data-table
      :headers="data.headTnc"
      :items="termconditionStore.getDataTermcondition"
      :search="data.searchTnc"
      density="compact"
      :sort-by="[{ key: 'createdAt', order: 'desc' }]"
      :hover="true"
      :items-per-page="-1"
      hide-default-footer
    >
      <template v-slot:item.no="{ index }">
        <div>{{ index + 1 }}.</div>
      </template>
      <template v-slot:item.harga_hpp="{ item }">
        Rp {{ rupiah(item.harga_hpp) }}
      </template>

      <template v-slot:item.aksi="{ item }">
        <div class="d-flex justify-center">
          <!-- <v-btn
            size="27"
            variant="tonal"
            color="info"
            class="rounded-lg mr-1"
            @click="openDialogEditTnc(item)"
          >
            <v-icon icon="mdi-pencil-outline" />
            <v-tooltip activator="parent" location="top">Edit</v-tooltip>
          </v-btn> -->
          <v-btn
            size="27"
            variant="tonal"
            color="grey"
            class="rounded-lg"
            @click="hapusTnc(item.id!)"
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
          <div class="text-body-1">Belum ada data TNC</div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from "vue";
import moment from "moment";
import type { ConfirmationDialog } from "#components";
import type { termconditionM } from "~/types/termconditionModel";

definePageMeta({
  layout: "admin",
});

const termconditionStore = usetermconditionStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);

const data = reactive({
  tab: "invoice",
  searchTnc: "",
  dialogTnc: false,
  tncAddEdit: "add" as "add" | "edit",
  headTnc: [
    { title: "No.", value: "no", sortable: false },
    { title: "Nama Term Condition", value: "nama_term", sortable: true },
    { title: "Aksi", align: "center" as const, value: "aksi" },
  ],
  filterStatus: "",
});

function emptyTnc(): termconditionM {
  return {
    nama_term: "",
    createdAt: 0,
    createdBy: "",
  };
}

const newTnc = ref<termconditionM>(emptyTnc());

onMounted(async () => {
  await termconditionStore.tarikDataTermconditionAct();
});

function openDialogAddTnc() {
  data.tncAddEdit = "add";
  newTnc.value = emptyTnc();
  data.dialogTnc = true;
}

function openDialogEditTnc(item: termconditionM) {
  data.tncAddEdit = "edit";
  newTnc.value = { ...item };
  data.dialogTnc = true;
}

async function simpanTnc() {
  if (!newTnc.value.nama_term) {
    return notificationStore.showError("Nama Client tidak boleh kosong");
  }

  if (data.tncAddEdit === "add") {
    newTnc.value.createdAt = moment().unix();
    newTnc.value.createdBy = userStore.getEmail;
    await termconditionStore.addTermconditionAct(newTnc.value);
  } else {
    newTnc.value.updatedAt = moment().unix();
    newTnc.value.updatedBy = userStore.getEmail;
    await termconditionStore.updateTermconditionAct(newTnc.value);
  }
  data.dialogTnc = false;
}

async function hapusTnc(id: string) {
  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus",
    "Anda yakin ingin menghapus T&C ini?",
    { variant: "danger" },
  );
  if (!confirmed) return notificationStore.showError("Penghapusan dibatalkan");
  await termconditionStore.deleteTermconditionAct(id);
}
</script>
