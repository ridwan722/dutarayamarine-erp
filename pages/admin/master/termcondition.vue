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

  <!-- /// DIALOG TAMBAH TNC SEKALIGUS (BULK) \\\ -->
  <v-dialog
    v-model="data.dialogBulkTnc"
    :width="$vuetify.display.mdAndUp ? '550px' : '90%'"
  >
    <v-card class="rounded-lg">
      <v-card-title
        class="px-4 text-subtitle-1 font-weight-bold bg-primary pa-3 d-flex justify-space-between align-center"
      >
        <span>TAMBAH T&C</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          density="compact"
          color="white"
          @click="data.dialogBulkTnc = false"
        />
      </v-card-title>

      <v-card-text class="pt-4">
        <div class="text-caption text-grey-darken-1 mb-2">
          Tempel (paste) daftar T&C di bawah ini. Pisahkan tiap poin dengan baris baru (Enter). Nomor urut di awal baris akan otomatis dibersihkan.
        </div>
        <v-textarea
          v-model="bulkInputText"
          label="Daftar T&C"
          placeholder="1. Lead Time : 5 days&#10;2. Price is Franco Jakarta...&#10;3. Payment term : 30 days"
          rows="10"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-card-text>

      <v-card-actions class="pa-3 bg-grey-lighten-4">
        <v-spacer />
        <v-btn
          variant="flat"
          color="grey-darken-2"
          @click="data.dialogBulkTnc = false"
          class="text-capitalize px-3"
          size="small"
        >
          Batal
        </v-btn>
        <v-btn
          color="primary"
          @click="simpanBulkTnc"
          :loading="data.loadingBulk"
          variant="flat"
          class="text-capitalize px-3"
          size="small"
        >
          Simpan Semua
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-row align="center">
    <v-col cols="10" class="d-flex align-center">
      <v-breadcrumbs class="pa-0">
        <v-breadcrumbs-item>
          <span class="font-weight-medium text-h5"
            >Master Term & Condition</span
          >
        </v-breadcrumbs-item>
      </v-breadcrumbs>
    </v-col>
    <v-col cols="2" class="d-flex justify-end">
      <v-btn
        color="primary"
        @click="openDialogBulkTnc"
        variant="flat"
        size="small"
        class="text-capitalize px-3"
        prepend-icon="mdi-plus"
      >
        Add T&C
      </v-btn>
    </v-col>
  </v-row>

  <v-card class="border rounded-lg mt-3" flat>
    <v-data-table
      :headers="data.headTnc"
      :items="termconditionStore.getDataTermcondition"
      :search="data.searchTnc"
      density="compact"
      :sort-by="[{ key: 'nama_term', order: 'asc' }]"
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
import { reactive, ref, onMounted } from "vue";
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
  dialogBulkTnc: false,
  loadingBulk: false,
  headTnc: [
    { title: "No.", value: "no", sortable: false },
    { title: "Nama Term Condition", value: "nama_term", sortable: true },
    { title: "Aksi", align: "center" as const, value: "aksi" },
  ],
  filterStatus: "",
});

const bulkInputText = ref("");

onMounted(async () => {
  await termconditionStore.tarikDataTermconditionAct();
});

function openDialogBulkTnc() {
  bulkInputText.value = "";
  data.dialogBulkTnc = true;
}

async function simpanBulkTnc() {
  if (!bulkInputText.value.trim()) {
    return notificationStore.showError("Teks input tidak boleh kosong");
  }

  data.loadingBulk = true;
  try {
    // 1. Ambil daftar T&C yang sudah ada untuk pengecekan duplikasi
    const existingTerms = new Set(
      (termconditionStore.getDataTermcondition || []).map((item) =>
        item.nama_term.trim().toLowerCase()
      )
    );

    // 2. Bersihkan awalan angka (misal: "1. ", "2) ") dan hapus spasi berlebih
    const lines = bulkInputText.value
      .split("\n")
      .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((line) => line.length > 0);

    const nowUnix = moment().unix();
    const userEmail = userStore.getEmail;

    let addedCount = 0;
    let skippedCount = 0;

    for (const itemText of lines) {
      const normalizedText = itemText.toLowerCase();

      // Pengecekan duplikat: jika sudah ada, lewati
      if (existingTerms.has(normalizedText)) {
        skippedCount++;
        continue;
      }

      const payload: termconditionM = {
        nama_term: itemText,
        createdAt: nowUnix,
        createdBy: userEmail,
      };

      await termconditionStore.addTermconditionAct(payload);
      
      existingTerms.add(normalizedText);
      addedCount++;
    }

    // Notifikasi ringkasan
    if (addedCount > 0) {
      let message = `Berhasil menambahkan ${addedCount} T&C baru.`;
      if (skippedCount > 0) {
        message += ` (${skippedCount} data diabaikan karena sudah ada)`;
      }
      notificationStore.showSuccess(message);
    } else {
      notificationStore.showInfo("Semua T&C yang dimasukkan sudah ada di database.");
    }

    data.dialogBulkTnc = false;
    bulkInputText.value = "";
  } catch (err) {
    notificationStore.showError("Gagal menyimpan beberapa data T&C");
  } finally {
    data.loadingBulk = false;
  }
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