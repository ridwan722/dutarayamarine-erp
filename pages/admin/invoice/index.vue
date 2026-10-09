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

  <!-- /// DIALOG BUAT INVOICE \\\ -->
  <v-dialog
    v-model="data.dialogTambahInvoice"
    max-width="700"
    scrollable
    :persistent="readingPo || savingInvoice"
  >
    <v-card class="overflow-hidden elevation-3 border-0">
      <v-card-item class="bg-grey-lighten-4 pa-3 text-center">
        <h4 class="font-weight-bold text-grey-darken-3">
          {{ data.invoiceAddEdit === "add" ? "Create" : "Edit" }} Invoice
        </h4>
        <span class="text-body-2 text-grey"
          >{{ newInvoice.id }}</span
        >
      </v-card-item>

      <v-card-text class="pa-3">
        <div class="text-subtitle-2 font-weight-bold text-primary mb-3">
          Informasi Utama
        </div>
        <v-row density="comfortable">
          <v-col cols="12" sm="6">
            <a-select-new
              v-model="newInvoice.id_customer"
              label="Customer"
              placeholder="Select"
              item-title="nama"
              item-value="id"
              :items="customerStore.getDataCustomer"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <a-date-picker-new
              v-model="newInvoice.tanggal"
              label="Tanggal Invoice"
            />
          </v-col>
        </v-row>
        <a-textarea-new
          v-model="newInvoice.alamat_customer"
          class="mt-2"
          label="Address"
          disabled
          placeholder="*Auto"
        />

        <v-row>
          <v-col>
            <a-text-field-new
              v-model="newInvoice.pic"
              class="mt-2"
              label="PIC"
              disabled
              placeholder="*Auto"
            />
          </v-col>
          <v-col>
            <a-text-field-new
              v-model="newInvoice.no_telp"
              class="mt-2"
              label="No Telp"
              disabled
              placeholder="*Auto"
            />
          </v-col>
          <v-col>
            <a-text-field-new
              v-model="newInvoice.email"
              class="mt-2"
              label="Email"
              disabled
              placeholder="@gmail.com"
            />
          </v-col>
          <v-col>
            <a-text-field-new
              v-model="newInvoice.vessel"
              class="mt-2"
              label="Vessel"
              disabled
              placeholder="*Auto"
            />
          </v-col>
        </v-row>
        <v-divider class="my-2 border-opacity-50" />

        <a-text-field-new
          v-model="newInvoice.no_preorder"
          class="mt-2"
          label="No. Pre Order (PO)"
          placeholder="opsional"
        />

        <div class="mt-3">
          <div class="po-upload-row">
            <!-- Upload -->
            <div class="po-upload-wrapper">
              <label for="invoice-po-files" class="po-upload-label">
                Dokumen PO
              </label>

              <div class="po-upload-box">
                <input
                  id="invoice-po-files"
                  type="file"
                  multiple
                  :disabled="readingPo || savingInvoice"
                  @change="tambahDokumenPo"
                  class="po-file-input"
                />

                <div class="po-upload-icon">↑</div>

                <div class="po-upload-text">
                  <div class="po-upload-title">Pilih File</div>
                  <div class="po-upload-info">Maks. 650 KB</div>
                </div>
              </div>

              <div v-if="readingPo" class="po-reading">Membaca file PO...</div>
            </div>

            <!-- Hasil Upload -->
            <div
              v-if="newInvoice.doc_preorder?.length"
              class="po-files-wrapper"
            >
              <div class="po-upload-label">File Terpilih</div>

              <div class="po-file-list">
                <div
                  v-for="(document, index) in newInvoice.doc_preorder"
                  :key="index"
                  class="po-file-item"
                >
                  <a
                    :href="document.dataUrl"
                    :download="document.name"
                    class="po-file-name"
                  >
                    📄 {{ document.name }}
                  </a>

                  <button
                    type="button"
                    class="po-file-remove"
                    :disabled="readingPo || savingInvoice"
                    :aria-label="`Hapus ${document.name}`"
                    @click="newInvoice.doc_preorder?.splice(index, 1)"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <a-textarea-new
          v-model="newInvoice.perihal"
          class="mt-2"
          label="Subject"
          placeholder="subject"
        />

        <div class="d-flex align-center justify-space-between mb-3">
          <span class="text-subtitle-2 font-weight-bold text-primary">
            Rincian Item & Layanan
          </span>
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-plus"
            class="text-none font-weight-semibold rounded-lg"
            @click="tambahBarisInvoice"
          >
            Tambah Baris
          </v-btn>
        </div>

        <div
          v-for="(item, index) in newInvoice.item_pekerjaan"
          :key="index"
          class="bg-grey-lighten-5 rounded-lg pa-4 mb-4 border border-dashed"
        >
          <v-row>
            <v-col>
              <a-textarea-new
                v-model="item.nama"
                label="Description"
                placeholder="Description"
              />
            </v-col>
            <v-col cols="3">
              <a-select-new
                v-model="item.kategori_item"
                label="Kategori"
                :items="[
                  'Unit',
                  'Pcs',
                  'Kg',
                  'Lot',
                  'Set',
                  'Meter',
                  'Box',
                  'Liter',
                ]"
              />
            </v-col>
          </v-row>

          <v-row align="center" density="compact" class="mb-2">
            <v-col cols="6" md="2">
              <a-field-number-new
                v-model="item.qty"
                label="Qty"
                placeholder="0"
              />
            </v-col>
            <v-col cols="6" md="3">
              <a-select-new
                :items="[
                  'Unit',
                  'Pcs',
                  'Kg',
                  'Lot',
                  'Set',
                  'Meter',
                  'Box',
                  'Liter',
                ]"
                v-model="item.uom"
                label="UOM"
                placeholder="Select"
              />
            </v-col>
            <v-col cols="6" md="3">
              <a-field-number-new
                v-model="item.amount"
                label="Amount/unit"
                placeholder="0"
              />
            </v-col>
            <v-col cols="6" md="3">
              <a-field-number-new
                v-model="item.subtotal_item"
                label="Subtotal"
                placeholder="0"
                disabled
              />
            </v-col>
            <v-col cols="1" class="text-center">
              <v-btn
                icon="mdi-trash-can-outline"
                size="small"
                variant="text"
                color="error"
                class="mt-5"
                @click="hapusBarisInvoice(index)"
              />
            </v-col>
          </v-row>
        </div>

        <!-- Bagian Template: Update tabel Terms & Conditions -->
        <div class="mt-4">
          <span class="text-caption">
            <strong>TERMS &amp; CONDITIONS:</strong>
          </span>

          <table
            style="
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
              border: 1px solid #9ca3af;
            "
          >
            <tbody>
              <tr
                v-for="(item, index) in sortedTermConditions"
                :key="item?.id ?? index"
              >
                <td
                  style="
                    width: 25px;
                    padding: 3px 5px;
                    vertical-align: top;
                    text-align: center;
                    border: 1px solid #9ca3af;
                  "
                >
                  {{ index + 1 }}.
                </td>

                <td style="width: 30px; border: 1px solid #9ca3af">
                  <v-checkbox
                    v-model="newInvoice.termCondition"
                    :value="{
                      id: item?.id ?? '',
                      nama_term: item?.nama_term ?? '',
                      createdAt: item?.createdAt ?? 0,
                      createdBy: item?.createdBy ?? '',
                    }"
                    :value-comparator="sameTermCondition"
                    density="compact"
                    hide-details
                    color="primary"
                    style="
                      margin: -6px 0 0 0;
                      padding: 0;
                      transform: scale(0.7);
                      transform-origin: center;
                    "
                  />
                </td>

                <td
                  style="
                    padding: 4px 6px;
                    vertical-align: top;
                    line-height: 1.4;
                    border: 1px solid #9ca3af;
                  "
                >
                  {{ item?.nama_term }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <v-card
          variant="flat"
          class="bg-blue-grey-lighten-5 rounded-xl pa-4 mt-4"
        >
          <v-row justify="end" align="center">
            <v-col cols="12" md="6">
              <div
                class="d-flex align-center justify-space-between px-3 py-1 bg-grey-lighten-5 rounded-lg border"
              >
                <span class="text-body-2 font-weight-medium text-grey-darken-2"
                  >Sertakan PPN 11%</span
                >
                <v-switch
                  v-model="newInvoice.pakai_ppn"
                  color="primary"
                  hide-details
                  density="compact"
                />
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div
                class="d-flex justify-space-between text-body-2 text-grey-darken-2 mb-1"
              >
                <span>Subtotal</span>
                <span class="font-weight-medium text-grey-darken-3"
                  >Rp {{ rupiah(subtotal_invoice) }}</span
                >
              </div>
              <div
                v-if="newInvoice.pakai_ppn == true"
                class="d-flex justify-space-between text-body-2 text-grey-darken-2 mb-2"
              >
                <span>PPN 11%</span>
                <span class="font-weight-medium text-grey-darken-3"
                  >Rp {{ rupiah(ppnInvoice) }}</span
                >
              </div>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between align-center">
                <span
                  class="text-subtitle-1 font-weight-bold text-grey-darken-4"
                  >Grand Total</span
                >
                <span class="text-h6 font-weight-black text-primary"
                  >Rp {{ rupiah(grandtotal_invoice) }}</span
                >
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4 bg-grey-lighten-5">
        <v-spacer />
        <v-btn
          size="x-small"
          variant="outlined"
          color="grey-darken-1"
          class="px-5 text-none"
          :disabled="readingPo || savingInvoice"
          @click="data.dialogTambahInvoice = false"
        >
          Batal
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="x-small"
          class="px-6 text-none font-weight-bold"
          :disabled="readingPo || savingInvoice"
          :loading="savingInvoice"
          @click="simpanInvoiceDialog"
        >
          {{
            data.invoiceAddEdit === "add"
              ? "Simpan Invoice"
              : "Simpan Perubahan"
          }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-row align="center">
    <v-col cols="12">
      <v-breadcrumbs>
        <v-breadcrumbs-item>
          <span class="font-weight-medium text-h5">Invoice</span>
        </v-breadcrumbs-item>
      </v-breadcrumbs>
    </v-col>
  </v-row>

  <v-card class="border rounded-lg" flat>
    <v-card-title class="pa-3">
      <v-row align="center">
        <v-col>
          <a-text-field-new
            v-model="data.searchInvoice"
            placeholder="Cari no. invoice / customer"
            style="max-width: 280px"
          />
        </v-col>
        <!-- <v-col>
          <a-select-new
            v-model="data.filterStatus"
            label=""
            placeholder="Semua Status"
            :items="filterStatusOptions"
          />
        </v-col> -->
        <v-col class="text-right">
          <!-- <v-btn
            color="primary"
            variant="flat"
            size="small"
            class="text-capitalize px-3 ml-2"
            prepend-icon="mdi-plus"
            @click="openDialogTambahInvoice"
          >
            Create Invoice
          </v-btn> -->

          <v-btn
            color="green"
            variant="flat"
            size="small"
            class="text-capitalize px-3 ml-2"
            prepend-icon="mdi-database-export"
            @click="getallinvoice()"
          >
            Tarik Semua Status Invoice
          </v-btn>

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
      <template v-slot:item.no="{ index }"> {{ index + 1 }}.</template>

      <template v-slot:item.tanggal="{ item }">{{
        rubahtanggallengkap(item.tanggal)
      }}</template>

      <!-- <template v-slot:item.no_inv="{ item }">
        <NuxtLink
          :to="'/admin/invoice/' + item.no_inv"
          class="penawaran-link font-weight-medium"
        >
          #INV/DRM/2026/{{ item.no_inv }}
        </NuxtLink>
      </template> -->
      <template v-slot:item.no_inv="{ item }">
        <div class="text-center">
          <NuxtLink :to="'/admin/invoice/' + item.no_inv" class="quotation-link">
            <span class="quotation-badge">
              #INV/DRM/2026/{{ item.no_inv }}
            </span>
          </NuxtLink>
        </div>
      </template>

      <template v-slot:item.nama_customer="{ item }">
        <div style="display: flex; align-items: center">
          <v-icon color="primary" class="mb-1 mr-2">mdi-domain</v-icon>
          {{ item.nama_customer }}
        </div>
      </template>

      <template v-slot:item.no_penawaran="{ item }">
        <NuxtLink
          :to="'/admin/penawaran/' + item.id_penawaran"
          class="penawaran-link font-weight-medium"
        >
          {{ item.no_penawaran }}
        </NuxtLink>
      </template>

      <template v-slot:item.grandtotal_invoice="{ item }"
        >Rp {{ rupiah(item.grandtotal_invoice) }}</template
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
          <v-btn
            size="27"
            variant="tonal"
            color="warning"
            class="rounded-lg mr-1"
            v-if="item.status == 'Draft'"
            @click="openDialogEditInvoice(item)"
          >
            <v-icon icon="mdi-pencil-outline" />
            <v-tooltip activator="parent" location="top"
              >Edit Invoice</v-tooltip
            >
            <!-- :disabled="item.id_penawaran !== ''" -->
          </v-btn>
          <v-btn
            size="27"
            variant="tonal"
            color="grey"
            class="rounded-lg"
            v-if="item.status == 'Draft'"
            @click="hapusInvoice(item.id_penawaran!, item.id!)"
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
            icon="mdi-receipt-text-outline"
          />
          <div class="text-body-1">Belum ada data Invoice</div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import moment from "moment";
import type { ConfirmationDialog } from "#components";
import type { customerM } from "~/types/customerModel";
import type { invoiceM, invoicePoDocumentM } from "~/types/invoice";
import { useinvoiceStore } from "~/stores/invoiceStore";

definePageMeta({
  layout: "admin",
});

const router = useRouter();
const customerStore = usecustomerStore();
const invoiceStore = useinvoiceStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);
const termconditionStore = usetermconditionStore();

const filterStatusOptions = [
  { label: "Semua Status", value: "" },
  { label: "Draft", value: "Draft" },
  { label: "Terkirim", value: "Terkirim" },
  { label: "Lunas", value: "Lunas" },
];

const data = reactive({
  tab: "invoice",
  searchCustomer: "",
  dialogCustomer: false,
  dialogTambahInvoice: false,
  invoiceAddEdit: "add" as "add" | "edit",
  editOriginalCustomerId: "",
  customerAddEdit: "add" as "add" | "edit",
  headCustomer: [
    { title: "Nama Customer", value: "nama", sortable: true },
    { title: "PIC", value: "pic", sortable: true },
    { title: "Alamat", value: "alamat", sortable: true },
    { title: "Aksi", align: "center" as const, value: "aksi", width: "100px" },
  ],
  searchInvoice: "",
  filterStatus: "",
  showAllInvoice: false,
  headInvoice: [
    { title: "No", value: "no", width: "10px" },
    { title: "Tanggal", value: "tanggal", sortable: true, width: "150px" },
    { title: "Based On Quotation", value: "no_penawaran", sortable: true },
    { title: "No. Invoice", value: "no_inv", sortable: true },
    { title: "Client", value: "nama_customer", sortable: true },
    { title: "Subject", value: "perihal", sortable: true },
    { title: "Total", value: "grandtotal_invoice", sortable: true, width: "140px" },
    { title: "Status Inv", value: "status", sortable: true },
    { title: "Aksi", align: "center" as const, value: "aksi", width: "100px" },
  ],
});

function emptyInvoice(): invoiceM {
  return {
    no_inv: "",
    id_customer: "",
    nama_customer: "",
    alamat_customer: "",
    no_preorder: "",
    doc_preorder: [],
    vessel: "",
    no_telp: "",
    sign_by: "",
    email: "",
    pic: "",
    tanggal: moment().format("YYYY-MM-DD"),
    perihal: "",
    item_pekerjaan: [
      {
        nama: "",
        qty: 1,
        uom: "Unit",
        kategori_item: "",
        amount: 0,
        subtotal_item: 0,
      },
    ],
    pakai_ppn: false,
    subtotal_invoice: 0,
    ppn: 0,
    grandtotal_invoice: 0,
    status: "",
    createdAt: 0,
    createdBy: "",
    termCondition: [],
    tanggal_bayar: "",
    doc_bukti_bayar: [],
  };
}

const sortedTermConditions = computed(() => {
  const terms = [...termconditionStore.getDataTermcondition];
  const selected = newInvoice.value.termCondition || [];

  // Yang dipilih mengikuti urutan saat dipilih
  const selectedTerms = selected
    .map((selectedItem: any) => {
      return terms.find((term: any) =>
        term.id
          ? term.id === selectedItem.id
          : term.nama_term === selectedItem.nama_term,
      );
    })
    .filter(Boolean);

  // Yang belum dipilih tetap mengikuti urutan asli
  const unselectedTerms = terms.filter(
    (term: any) =>
      !selected.some((selectedItem: any) =>
        term.id
          ? term.id === selectedItem.id
          : term.nama_term === selectedItem.nama_term,
      ),
  );

  return [...selectedTerms, ...unselectedTerms];
});

const newInvoice = ref<invoiceM>(emptyInvoice());
const readingPo = ref(false);
const savingInvoice = ref(false);
const MAX_INVOICE_BYTES = 900_000;

async function tambahDokumenPo(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = "";
  if (!files.length || readingPo.value || savingInvoice.value) return;

  const draft = newInvoice.value;
  const existingBytes = new TextEncoder().encode(
    JSON.stringify(draft),
  ).byteLength;
  const fileBytes = files.reduce(
    (total, file) => total + 4 * Math.ceil(file.size / 3),
    0,
  );
  if (existingBytes + fileBytes > MAX_INVOICE_BYTES) {
    return notificationStore.showError(
      "Total dokumen PO terlalu besar. Kurangi ukuran atau jumlah file.",
    );
  }

  readingPo.value = true;
  try {
    const documents: invoicePoDocumentM[] = [];
    for (const file of files) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("File PO tidak dapat dibaca"));
        reader.onerror = () =>
          reject(reader.error || new Error("File PO tidak dapat dibaca"));
        reader.onabort = () =>
          reject(new Error("Pembacaan file PO dibatalkan"));
        reader.readAsDataURL(file);
      });
      documents.push({
        name: file.name,
        dataUrl,
        size: file.size,
        contentType: file.type || "application/octet-stream",
      });
    }
    const doc_preorder = [...(draft.doc_preorder || []), ...documents];
    if (
      new TextEncoder().encode(JSON.stringify({ ...draft, doc_preorder }))
        .byteLength > MAX_INVOICE_BYTES
    ) {
      return notificationStore.showError(
        "Ukuran invoice beserta dokumen PO terlalu besar. Kurangi ukuran atau jumlah file.",
      );
    }
    if (newInvoice.value === draft && data.dialogTambahInvoice)
      draft.doc_preorder = doc_preorder;
  } catch (error) {
    notificationStore.showError(
      "File PO tidak dapat dibaca. Silakan coba lagi.",
    );
  } finally {
    readingPo.value = false;
  }
}

const subtotal_invoice = computed(() =>
  newInvoice.value.item_pekerjaan.reduce(
    (total, item) => total + (Number(item.amount) || 0),
    0,
  ),
);
const ppnInvoice = computed(() =>
  newInvoice.value.pakai_ppn ? Math.round(subtotal_invoice.value * 0.11) : 0,
);
const grandtotal_invoice = computed(
  () => subtotal_invoice.value + ppnInvoice.value,
);

watch(
  () => newInvoice.value.id_customer,
  (idCustomer) => {
    if (
      data.invoiceAddEdit === "edit" &&
      idCustomer === data.editOriginalCustomerId
    ) {
      return;
    }
    const customer = customerStore.getDataCustomer.find(
      (item) => item.id === idCustomer,
    );

    if (!customer) return;
    newInvoice.value.id_customer = customer.id ?? "";
    newInvoice.value.nama_customer = customer.nama;
    newInvoice.value.alamat_customer = customer.alamat;
    newInvoice.value.pic = customer.pic;
    newInvoice.value.vessel = customer.vessel;
    newInvoice.value.no_telp = customer.no_telp;
    newInvoice.value.email = customer.email;
  },
);

onMounted(async () => {
  await customerStore.tarikDataCustomerAct();
  useloadingStore().setLoading(true);
  await invoiceStore.tarikDataInvoiceAct();
  data.showAllInvoice = true;
  useloadingStore().setLoading(false);
  termconditionStore.tarikDataTermconditionAct();
});

const filteredInvoice = computed(() => {
  if (!data.showAllInvoice) {
    return invoiceStore.getDataInvoice.filter(
      (invoice) => invoice.status === "Draft",
    );
  }
  if (!data.filterStatus) return invoiceStore.getDataInvoice;
  return invoiceStore.getDataInvoice.filter(
    (inv) => inv.status === data.filterStatus,
  );
});

async function getallinvoice() {
  useloadingStore().setLoading(true);
  try {
    data.filterStatus = "";
    sessionStorage.removeItem("invoice");
    await invoiceStore.tarikDataInvoiceAct();
    data.showAllInvoice = true;
    notificationStore.showSuccess("Semua invoice (all status) berhasil dimuat");
  } catch (error) {
    console.error("Gagal memuat semua invoice:", error);
    notificationStore.showError("Gagal memuat semua invoice");
  } finally {
    useloadingStore().setLoading(false);
  }
}

function statusColor(status: string) {
  if (status === "INVOICE") return "warning";
  if (status === "Draft") return "primary";
  return "grey";
}

function openDialogTambahInvoice() {
  data.invoiceAddEdit = "add";
  data.editOriginalCustomerId = "";
  newInvoice.value = emptyInvoice();
  data.dialogTambahInvoice = true;
}

function openDialogEditInvoice(item: invoiceM) {
  const customer = customerStore.getDataCustomer.find(
    (dataCustomer) =>
      dataCustomer.id === item.id_customer ||
      dataCustomer.nama === item.id_customer ||
      dataCustomer.nama === item.nama_customer ||
      dataCustomer.pic === item.pic ||
      dataCustomer.vessel === item.vessel,
  );

  const invoice = JSON.parse(JSON.stringify(item)) as invoiceM;
  if (customer?.id) {
    invoice.id_customer = customer.id;
    invoice.nama_customer = customer.nama;
  }

  data.invoiceAddEdit = "edit";
  data.editOriginalCustomerId = invoice.id_customer;
  newInvoice.value = invoice;
  data.dialogTambahInvoice = true;
}

function tambahBarisInvoice() {
  newInvoice.value.item_pekerjaan.push({
    nama: "",
    // kode_barang: "",
    amount: 0,
    kategori_item: "",
    uom: "",
    qty: 0,
    subtotal_item: 0,
  });
}

function sameTermCondition(a: any, b: any) {
  if (!a || !b) return a === b;

  // Prioritas berdasarkan ID
  if (a.id && b.id) {
    return a.id === b.id;
  }

  // Fallback berdasarkan nama term
  return a.nama_term === b.nama_term;
}

function hapusBarisInvoice(index: number) {
  if (newInvoice.value.item_pekerjaan.length === 1) {
    return notificationStore.showError("Minimal harus ada 1 baris item");
  }
  newInvoice.value.item_pekerjaan.splice(index, 1);
}

async function simpanInvoiceDialog() {
  if (readingPo.value || savingInvoice.value) return;
  if (!newInvoice.value.id_customer) {
    return notificationStore.showError("Customer belum dipilih");
  }
  if (
    newInvoice.value.item_pekerjaan.some((item) => !item.nama || !item.amount)
  ) {
    return notificationStore.showError(
      "Setiap baris item harus punya description dan amount",
    );
  }

  newInvoice.value.subtotal_invoice = subtotal_invoice.value;
  newInvoice.value.ppn = ppnInvoice.value;
  newInvoice.value.grandtotal_invoice = grandtotal_invoice.value;
  if (
    new TextEncoder().encode(JSON.stringify(newInvoice.value)).byteLength >
    MAX_INVOICE_BYTES
  ) {
    return notificationStore.showError(
      "Ukuran invoice beserta dokumen PO terlalu besar. Kurangi ukuran atau jumlah file.",
    );
  }

  savingInvoice.value = true;
  try {
    if (data.invoiceAddEdit === "add") {
      newInvoice.value.createdAt = moment().unix();
      newInvoice.value.createdBy = userStore.getEmail;

      const result = await invoiceStore.createInvoiceAct(newInvoice.value);
      if (!result) return;

      data.dialogTambahInvoice = false;
      newInvoice.value = emptyInvoice();
      await router.push(`/admin/invoice/${result.id}`);
      return;
    }

    if (!newInvoice.value.id) {
      return notificationStore.showError("ID invoice tidak ditemukan");
    }

    const updated = await invoiceStore.updateInvoiceAct(
      newInvoice.value.id,
      newInvoice.value,
    );
    if (!updated) return;

    await invoiceStore.tarikDataInvoiceAct();
    data.dialogTambahInvoice = false;
    newInvoice.value = emptyInvoice();
  } catch (error) {
    notificationStore.showError(
      "Gagal menyimpan perubahan invoice. Silakan coba lagi.",
    );
  } finally {
    savingInvoice.value = false;
  }
}

async function hapusInvoice(id_penawaran: string, id: string) {
  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus",
    "Anda yakin ingin menghapus invoice ini?",
    { variant: "danger" },
  );
  if (!confirmed) return notificationStore.showError("Penghapusan dibatalkan");
  await invoiceStore.deleteInvoiceAct(id_penawaran, id);
}

async function refreshData() {
  useloadingStore().setLoading(true);
  sessionStorage.removeItem("invoice");
  await invoiceStore.tarikDataInvoiceAct();
  useloadingStore().setLoading(false);
  notificationStore.showSuccess("Data berhasil diperbarui");
}
</script>

<style scoped>
.quotation-link {
  text-decoration: none;
}
.quotation-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2px;
  border: 1px solid #dbeafe;
  transition: all 0.1s ease;
}

.quotation-badge:hover {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 3px 8px rgba(37, 99, 235, 0.2);
  transform: translateY(-1px);
}
.penawaran-link {
  color: rgb(11, 66, 194);
  transition: color 0.2s ease;
}

.po-upload-row {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
}

.po-upload-wrapper {
  flex-shrink: 0;
}

.po-files-wrapper {
  flex: 1;
  min-width: 0;
}

.po-upload-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

/* Upload Box */
.po-upload-box {
  position: relative;
  width: 150px;
  height: 82px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
  transition: 0.2s;
}

.po-upload-box:hover {
  border-color: #64748b;
  background: #f1f5f9;
}

.po-file-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.po-upload-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 17px;
}

.po-upload-title {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.po-upload-info {
  margin-top: 2px;
  font-size: 10px;
  color: #94a3b8;
}

/* Files */
.po-file-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.po-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 38px;
  padding: 6px 9px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
}

.po-file-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: #475569;
}

.po-file-remove {
  flex-shrink: 0;
  border: 0;
  background: transparent;
  color: #94a3b8;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.po-file-remove:hover:not(:disabled) {
  color: #dc2626;
}
</style>
