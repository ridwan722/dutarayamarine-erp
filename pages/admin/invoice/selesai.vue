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
  <v-row align="center">
    <v-col cols="12">
      <v-breadcrumbs>
        <v-breadcrumbs-item>
          <span class="font-weight-medium text-h5">Invoice Selesai</span>
        </v-breadcrumbs-item>
      </v-breadcrumbs>
    </v-col>
  </v-row>

  <v-card class="border rounded-lg" flat>
    <v-divider />

    <v-card-title class="pa-3">
      <v-row align="center">
        <v-col>
          <a-text-field-new
            v-model="data.searchInvoice"
            placeholder="Cari no. invoice / customer"
            style="max-width: 280px"
          />
        </v-col>

        <v-col class="text-right">
          <v-btn
            size="35"
            variant="outlined"
            class="border ml-3"
            @click="refreshData"
          >
            <v-icon size="23" icon="mdi-refresh" />
            <v-tooltip activator="parent" location="top">
              Refresh Data
            </v-tooltip>
          </v-btn>
        </v-col>
      </v-row>
    </v-card-title>

    <v-divider />

    <v-data-table
      :headers="data.headInvoice"
      :items="filteredInvoice"
      :search="data.searchInvoice"
      density="compact"
      :sort-by="[{ key: 'createdAt', order: 'desc' }]"
      :hover="true"
    >
    <template v-slot:item.no="{ index }"> {{ index + 1 }}</template>
      <template v-slot:item.no_inv="{ item }"
        >#{{ item.no_inv }}</template
      >

      <template v-slot:item.tanggal="{ item }">{{
        rubahtanggallengkap(item.tanggal)
      }}</template>

      <template v-slot:item.grandtotal="{ item }"
        >Rp {{ rupiah(item.grandtotal) }}</template
      >

      <template v-slot:item.status="{ item }">
        <v-chip size="small" :color="statusColor(item.status)" variant="flat">{{
          item.status
        }}</v-chip>
      </template>

      <template v-slot:item.aksi="{ item }">
        <div class="d-flex justify-center">
          <v-btn
            size="27"
            variant="tonal"
            color="info"
            class="rounded-lg mr-1"
            @click="router.push(`/admin/invoice/${item.id}`)"
          >
            <v-icon icon="mdi-eye" />
            <v-tooltip activator="parent" location="top"
              >Detail Invoice</v-tooltip
            >
          </v-btn>
        </div>
      </template>

      <template v-slot:no-data>
        <div class="py-8 text-center text-grey-darken-1">
          <v-icon
            size="48"
            color="grey-lighten-1"
            class="mb-2"
            icon="mdi-receipt-text-outline"
          />
          <div class="text-body-1">Belum ada data Invoice</div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useinvoiceStore } from "~/stores/invoiceStore";

definePageMeta({
  layout: "admin",
});

const router = useRouter();
const invoiceStore = useinvoiceStore();
const notificationStore = useNotificationStore();

const data = reactive({
  tab: "invoice",
  searchCustomer: "",
  dialogCustomer: false,
  dialogTambahInvoice: false,
  invoiceAddEdit: "add" as "add" | "edit",
  editOriginalCustomerName: "",
  customerAddEdit: "add" as "add" | "edit",
  headCustomer: [
    { title: "Nama Customer", value: "nama", sortable: true },
    { title: "Alamat", value: "alamat", sortable: true },
    { title: "Aksi", align: "center" as const, value: "aksi", width: "100px" },
  ],
  searchInvoice: "",
  headInvoice: [
    { title: "No", value: "no", width: "10px" },
    { title: "Tanggal", value: "tanggal", sortable: true },
    { title: "No. Invoice", value: "no_inv", sortable: true },
    { title: "Customer", value: "nama_customer", sortable: true },
    { title: "Total", value: "grandtotal", sortable: true },
    { title: "Status", value: "status", sortable: true },
    { title: "Aksi", align: "center" as const, value: "aksi", width: "100px" },
  ],
});

onMounted(async () => {
  await invoiceStore.tarikDataInvoiceAct();
});

const filteredInvoice = computed(() =>
  invoiceStore.getDataInvoice.filter((invoice) => invoice.status === "Selesai"),
);

function statusColor(status: string) {
  if (status === "Selesai") return "info";
  return "grey";
}

async function refreshData() {
  useloadingStore().setLoading(true);
  try {
    sessionStorage.removeItem("invoice");
    await invoiceStore.tarikDataInvoiceAct();
    notificationStore.showSuccess("Data berhasil diperbarui");
  } finally {
    useloadingStore().setLoading(false);
  }
}
</script>
