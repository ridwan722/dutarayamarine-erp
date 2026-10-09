<template>
  <div
    v-if="modelValue"
    class="modal-overlay"
  >
  <!-- @click.self="emit('update:modelValue', false)" -->
    <div class="modal-card">
      <!-- Header -->
      <div class="modal-header">
        <div class="title-group">
          <svg
            class="icon-doc"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
            />
          </svg>
          <span class="modal-title">Create Invoice</span>
          <!-- <span class="text-body-2 text-grey"
            ># tarik data penomoran invoice + 1</span
          > -->
        </div>
        <button class="btn-close" @click="emit('update:modelValue', false)">
          &times;
        </button>
      </div>

      <!-- Content Body -->
      <div class="modal-body">
        <!-- Customer Info Section -->
        <div class="section-title">Informasi Pelanggan</div>
        <div class="form-grid">
          <a-text-field-new type="text" v-model="form.nama_customer" disabled />
          <a-text-field-new type="text" v-model="form.pic" disabled />
          <a-text-field-new type="text" v-model="form.no_telp" disabled />
          <a-text-field-new type="text" v-model="form.email" disabled />
        </div>

        <a-textarea-new v-model="form.alamat_customer" disabled />

        <v-divider class="my-3" />

        <a-date-picker-new v-model="form.tanggal" label="Invoice Date" />

        <v-divider class="my-3" />

        <v-row no-gutters>
          <v-col class="pa-1">
            <a-text-field-new
              label="No. Pre Order (PO)"
              v-model="form.no_preorder"
              placeholder="No Preorder"
            />
          </v-col>
          <v-col class="pa-1">
            <a-date-picker-new
              v-model="form.tanggal_preorder"
              label="Tanggal Pre Order (PO)"
            />
          </v-col>
        </v-row>

        <div class="po-upload-row mt-2">
          <!-- Upload -->
          <div class="po-upload-wrapper">
            <label for="upload-po" class="po-upload-label"> Upload PO </label>

            <div class="po-upload-box">
              <input
                id="upload-po"
                type="file"
                multiple
                :disabled="saving"
                @change="addfile"
                class="po-file-input"
              />

              <div class="po-upload-icon">↑</div>

              <div class="po-upload-text">
                <div class="po-upload-title">Pilih File</div>
                <div class="po-upload-info">Maks. 650 KB</div>
              </div>
            </div>
          </div>

          <!-- Hasil Upload -->
          <div v-if="poFiles.length" class="po-files-wrapper">
            <div class="po-upload-label">File Terpilih</div>

            <div class="po-file-list">
              <div
                v-for="(file, index) in poFiles"
                :key="index"
                class="po-file-item"
              >
                <div class="po-file-name">📄 {{ file.name }}</div>

                <button
                  type="button"
                  class="po-file-remove"
                  :disabled="saving"
                  @click="poFiles.splice(index, 1)"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
        <v-divider class="my-2" />
        <a-textarea-new class="mt-2" label="Subject" v-model="form.perihal" />

        <!-- Items Table Section -->
        <div class="section-title mt-3">Description</div>
        <div class="table-container">
          <table class="compact-table">
            <thead>
              <tr>
                <th style="width: 5%">No.</th>
                <th style="width: 45%" class="text-left">Description</th>
                <th style="width: 8%; text-align: center">Qty</th>
                <th style="width: 10%; text-align: center">UOM</th>
                <th style="width: 15%; text-align: right">Amount/pcs</th>
                <th style="width: 15%; text-align: right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in form.item_pekerjaan" :key="index">
                <td class="text-center">{{ index + 1 }}.</td>
                <td class="text-left">
                  {{ item.nama }}
                </td>
                <td class="text-center">
                  {{ item.qty }}
                </td>
                <td class="text-center">
                  {{ item.uom }}
                </td>
                <td class="text-right">Rp {{ rupiah(item.amount) }}</td>
                <td class="text-right font-bold text-subtotal">
                  Rp {{ rupiah(itemSubtotal(item)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary and signer cards -->
        <div class="summary-sign-row">
          <v-card class="sign-card" elevation="0">
            <!-- Content -->
            <v-card-text class="sign-card-content">
              <a-select-new
                v-model="form.sign_by"
                :items="[
                  'Seilla Maryana',
                  'Leo Adiatmaja Sembiring',
                  'Muhammad Ridwan',
                  'Lilis Trisnawati',
                ]"
                class="sign-select"
                label="Sign By / Yang Bertanda Tangan ?"
              />
              <!-- Signature -->
              <div v-if="form.sign_by" class="signature-box">
                <div
                  v-if="form.sign_by == 'Leo Adiatmaja Sembiring'"
                  class="signature-content"
                >
                  <v-img width="130" height="65" contain src="/ttd_leo.png" />

                  <div class="signature-line"></div>

                  <div class="signature-name">Leo Adiatmaja Sembiring</div>
                </div>

                <div
                  v-if="form.sign_by == 'Seilla Maryana'"
                  class="signature-content"
                >
                  <v-img
                    width="130"
                    height="65"
                    contain
                    src="/ttd_seilla.png"
                  />

                  <div class="signature-line"></div>

                  <div class="signature-name">Seilla Maryana</div>
                </div>

                <div
                  v-if="form.sign_by == 'Muhammad Ridwan'"
                  class="signature-content"
                >
                  <v-img
                    width="130"
                    height="65"
                    contain
                    src="/ttd_ridwan.png"
                  />

                  <div class="signature-line"></div>

                  <div class="signature-name">Muhammad Ridwan</div>
                </div>

                <div
                  v-if="form.sign_by == 'Lilis Trisnawati'"
                  class="signature-content"
                >
                  <v-img
                    width="130"
                    height="65"
                    contain
                    src="/ttd_ridwan.png"
                  />

                  <div class="signature-line"></div>

                  <div class="signature-name">Lilis Trisnawati</div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <div class="summary-wrapper">
            <div class="summary-box">
              <div class="summary-row">
                <span class="text-muted">Subtotal</span>
                <span class="font-medium">Rp {{ rupiah(subtotal) }}</span>
              </div>

              <div
                class="summary-row align-center"
                style="display: flex; align-items: center; gap: 12px"
              >
                <label
                  class="checkbox-label"
                  style="
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                  "
                >
                  <input
                    type="checkbox"
                    v-model="form.down_payment"
                    style="cursor: pointer"
                  />
                  <span style="cursor: pointer">DP</span>
                </label>

                <div
                  v-if="form.down_payment"
                  style="display: flex; align-items: center; gap: 4px"
                >
                  <a-text-field-new
                    v-model="form.dp_persen"
                    type="number"
                    placeholder="50"
                    suffix="%"
                    class="text-right"
                    style="width: 70px"
                  />
                </div>

                <span
                  v-if="form.down_payment"
                  class="font-medium"
                  style="white-space: nowrap"
                >
                  Rp {{ rupiah(dpNominal) }}
                </span>
              </div>

              <div class="summary-row align-center">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="form.pakai_ppn" />
                  <span>PPN 11%</span>
                </label>
                <span class="font-medium">Rp {{ rupiah(ppn) }}</span>
              </div>

              <div class="divider"></div>

              <div class="summary-row total-row">
                <span class="font-bold">Grand Total</span>
                <span class="grand-total-val">Rp {{ rupiah(grandTotal) }}</span>
              </div>
            </div>
          </div>
        </div>

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
                    v-model="form.termCondition"
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
      </div>

      <!-- Footer Actions -->
      <div class="modal-footer">
        <button
          class="btn btn-secondary"
          @click="emit('update:modelValue', false)"
        >
          Batal
        </button>
        <button class="btn btn-primary" :disabled="saving" @click="save">
          <span v-if="saving">Memproses...</span>
          <span v-else>Simpan Invoice</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import moment from "moment";
import type {
  invoiceItemM,
  invoiceM,
  invoicePoDocumentM,
} from "~/types/invoice";
import type { penawaranM } from "~/types/penawaranModel";

const props = defineProps<{ modelValue: boolean; penawaran: penawaranM }>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  saved: [];
}>();

const termconditionStore = usetermconditionStore();
const poFiles = ref<File[]>([]);
// Leave room for Firestore field overhead and invoice numbering.
const MAX_INVOICE_BYTES = 900_000;
const penawaranStore = usePenawaranStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const saving = ref(false);

const sameTermCondition = (a: any, b: any) => {
  if (!a || !b) return false;
  return a.id && b.id ? a.id === b.id : a.nama_term === b.nama_term;
};

const emptyForm = (): invoiceM => ({
  no_inv: "",
  id_customer: "",
  nama_customer: "",
  alamat_customer: "",
  vessel: "",
  no_telp: "",
  email: "",
  pic: "",
  tanggal: "",
  perihal: "",
  sign_by: "",
  item_pekerjaan: [],
  pakai_ppn: false,
  subtotal_invoice: 0,
  ppn: 0,
  grandtotal_invoice: 0,
  status: "",
  createdAt: 0,
  createdBy: "",
  termCondition: [],
  no_preorder: "",
  tanggal_preorder: "",
  doc_preorder: [],
  tanggal_bayar: "",
  doc_bukti_bayar: [],
  down_payment: false,
  dp_persen: 0,
});

onMounted(async () => {
  await termconditionStore.tarikDataTermconditionAct();
});

const form = ref<invoiceM>(emptyForm());
const itemSubtotal = (item: invoiceItemM) =>
  Number(item.qty || 0) * Number(item.amount || 0);
const subtotal = computed(() =>
  form.value.item_pekerjaan.reduce((sum, item) => sum + itemSubtotal(item), 0),
);
const ppn = computed(() =>
  form.value.pakai_ppn ? Math.round(subtotal.value * 0.11) : 0,
);
const grandTotal = computed(() => {
  if (form.value.down_payment) {
    return dpNominal.value + ppn.value;
  }

  return subtotal.value + ppn.value;
});
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;

    poFiles.value = [];

    form.value = {
      ...emptyForm(),

      id_customer: props.penawaran.id_perusahaan,
      nama_customer: props.penawaran.nama_perusahaan,
      alamat_customer: props.penawaran.alamat_perusahaan || "",
      no_telp: props.penawaran.no_telp || "",
      email: props.penawaran.email || "",
      vessel: props.penawaran.vessel || "",
      perihal: props.penawaran.perihal || "",
      sign_by: props.penawaran.sign_by || "",
      pic: props.penawaran.pic,
      tanggal: moment().format("YYYY-MM-DD"),
      item_pekerjaan: (props.penawaran.penawaran_item || []).map((item) => ({
        nama: item.nama,
        qty: item.qty,
        kategori_item: item.kategori_item,
        uom: item.uom,
        amount: item.amount,
        subtotal_item: item.subtotal_item,
      })),

      // termCondition: (props.penawaran.termCondition || []).map((item: any) => ({
      //   id: item.id ?? "",
      //   nama_term: item.nama_term,
      //   createdAt: item.createdAt ?? 0,
      //   createdBy: item.createdBy ?? "",
      // })),
    };
  },
);

const dpNominal = computed(() => {
  if (!form.value.down_payment) return 0;

  const persen = Number(form.value.dp_persen || 0);

  return Math.round(subtotal.value * (persen / 100));
});

const sortedTermConditions = computed(() => {
  const terms = [...termconditionStore.getDataTermcondition];
  const selected = form.value.termCondition || [];

  const selectedTerms = selected
    .map((selectedItem: any) => {
      return terms.find((term: any) =>
        term.id
          ? term.id === selectedItem.id
          : term.nama_term === selectedItem.nama_term,
      );
    })
    .filter(Boolean);

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

async function save() {
  if (saving.value) return;
  if (
    !form.value.tanggal ||
    !form.value.id_customer ||
    !form.value.nama_customer ||
    !form.value.pic
  ) {
    return notificationStore.showError(
      "Data customer, PIC, dan tanggal wajib diisi",
    );
  }
  if (
    !form.value.item_pekerjaan.length ||
    form.value.item_pekerjaan.some(
      (item) => !item.nama || item.qty <= 0 || item.amount <= 0,
    )
  ) {
    return notificationStore.showError(
      "Setiap item wajib memiliki nama, qty, dan harga",
    );
  }

  form.value.item_pekerjaan.forEach((item) => {
    item.subtotal_item = itemSubtotal(item);
  });
  const payload: invoiceM = {
    ...form.value,
    subtotal_invoice: subtotal.value,
    ppn: ppn.value,
    status: "Draft",
    grandtotal_invoice: grandTotal.value,
    id_penawaran: props.penawaran.id,
    no_penawaran: props.penawaran.no_penawaran,
    tanggal_preorder: form.value.tanggal_preorder,
    tanggal_penawaran: props.penawaran.tanggal_penawaran,
    createdAt: moment().unix(),
    createdBy: userStore.getEmail,
  };

  saving.value = true;
  try {
    const estimatedFileBytes = poFiles.value.reduce(
      (total, file) => total + 4 * Math.ceil(file.size / 3),
      0,
    );
    if (estimatedFileBytes > MAX_INVOICE_BYTES) {
      return notificationStore.showError(
        "Total file PO terlalu besar. Kurangi ukuran atau jumlah file (maksimal sekitar 650 KB total).",
      );
    }

    const documents: invoicePoDocumentM[] = [];
    for (const file of poFiles.value) {
      documents.push({
        name: file.name,
        dataUrl: await readPoFile(file),
        size: file.size,
        contentType: file.type || "application/octet-stream",
      });
    }
    payload.doc_preorder = documents;

    if (
      new TextEncoder().encode(JSON.stringify(payload)).byteLength >
      MAX_INVOICE_BYTES
    ) {
      return notificationStore.showError(
        "Ukuran invoice beserta file PO terlalu besar. Kurangi ukuran atau jumlah file PO.",
      );
    }

    const result = await createInvoicePenawaran(payload);
    if (!result) return;

    const penawaran = JSON.parse(JSON.stringify(props.penawaran)) as penawaranM;
    const penawaranUpdated = await penawaranStore.updatePenawaranAct({
      ...penawaran,
      status: "INVOICE",
    });
    if (!penawaranUpdated) return;

    emit("update:modelValue", false);
    emit("saved");
  } catch (error) {
    console.error("Gagal menyimpan invoice atau membaca file PO:", error);
    notificationStore.showError(
      "Gagal menyimpan invoice atau membaca file PO. Silakan coba lagi.",
    );
  } finally {
    saving.value = false;
  }
}

function readPoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("File PO tidak dapat dibaca"));
    };
    reader.onerror = () =>
      reject(reader.error || new Error("File PO tidak dapat dibaca"));
    reader.onabort = () => reject(new Error("Pembacaan file PO dibatalkan"));
    reader.readAsDataURL(file);
  });
}

function addfile(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    poFiles.value = [...poFiles.value, ...Array.from(target.files)];
  }
  target.value = "";
}
</script>

<style scoped>
/* Reset & Base Fonts */
* {
  box-sizing: border-box;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
}

/* Modal Structure */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-card {
  background: #ffffff;
  width: 100%;
  max-width: 860px;
  max-height: 90vh;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

/* Header */
.modal-header {
  padding: 10px 16px;
  background-color: #f59e0b;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-doc {
  width: 18px;
  height: 18px;
  fill: #1976d2;
}

.modal-title {
  font-size: 14px;
  font-weight: 700;
  color: #212529;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6c757d;
  line-height: 1;
}

.btn-close:hover {
  color: #000;
}

/* Body */
.modal-body {
  padding: 12px 16px;
  overflow-y: auto;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #6c757d;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.mt-3 {
  margin-top: 12px;
}

/* Grid Layout */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group.span-2 {
  grid-column: span 2;
}

.form-group label {
  font-size: 11px;
  font-weight: 600;
  color: #495057;
}

.input-field {
  width: 100%;
  padding: 5px 8px;
  font-size: 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  outline: none;
  background: #fff;
  transition: border-color 0.15s ease-in-out;
}

.input-field:focus {
  border-color: #1976d2;
}

.input-field.disabled {
  background: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
}

.textarea {
  resize: vertical;
}

/* Compact Table */
.table-container {
  border: 1px solid #dee2e6;
  border-radius: 4px;
  overflow: hidden;
}

.compact-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.compact-table th {
  background: #f1f3f5;
  color: #343a40;
  font-weight: 600;
  padding: 6px 8px;
  border-bottom: 1px solid #dee2e6;
}

.compact-table td {
  padding: 4px;
  border-bottom: 1px solid #e9ecef;
}

.table-input {
  width: 100%;
  padding: 4px 6px;
  font-size: 12px;
  border: 1px solid #ced4da;
  border-radius: 3px;
  outline: none;
}

.table-input:focus {
  border-color: #1976d2;
}

/* Text Align Helpers */
.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}
.font-bold {
  font-weight: 700;
}
.font-medium {
  font-weight: 500;
}
.text-muted {
  color: #000000;
}
.text-subtotal {
  padding-right: 8px;
  font-size: 12px;
}

/* Summary Area */
.summary-wrapper {
  display: flex;
  justify-content: flex-end;
  flex: 0 0 auto;
}

.summary-sign-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 10px;
}

@media (max-width: 700px) {
  .summary-sign-row {
    align-items: stretch;
    flex-direction: column;
  }

  .sign-card,
  .summary-box {
    width: 100%;
    max-width: none;
  }
}

.summary-box {
  width: 300px;
  background: #f59e0b;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.summary-row.align-center {
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.divider {
  height: 1px;
  background: #dee2e6;
  margin: 6px 0;
}

.total-row {
  margin-bottom: 0;
  font-size: 13px;
}

.grand-total-val {
  font-weight: 700;
}

/* Footer & Buttons */
.modal-footer {
  padding: 8px 16px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-secondary {
  background: #fff;
  border-color: #ced4da;
  color: #495057;
}

.btn-secondary:hover {
  background: #f8f9fa;
}

.btn-primary {
  background: #1976d2;
  color: #fff;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
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

.sign-card {
  width: 100%;
  max-width: 380px;
  flex: 0 1 380px;
  margin: 0;
  background: #ffffff;
  border: 1px solid #e1e5ea;
  border-radius: 12px;
  overflow: hidden;
}

.sign-card-header {
  min-height: 62px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sign-card-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: 0.2px;
}

.sign-card-subtitle {
  margin-top: 2px;
  font-size: 11px;
  color: #8a929d;
}

.sign-card-content {
  padding: 18px;
}

.field-label {
  margin-bottom: 7px;
  font-size: 11px;
  font-weight: 600;
  color: #5f6874;
  letter-spacing: 0.2px;
}

.sign-select {
  margin-bottom: 14px;
}

/* Signature area */
.signature-box {
  margin-top: 8px;
  padding: 16px 14px 14px;
  background: #fafbfc;
  border: 1px solid #e5e8ec;
  border-radius: 8px;
}

.signature-label {
  margin-bottom: 8px;
  font-size: 9px;
  font-weight: 700;
  color: #9aa1aa;
  letter-spacing: 1px;
  text-align: center;
}

.signature-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.signature-line {
  width: 180px;
  border-bottom: 1px solid #737b86;
  margin-top: -2px;
}

.signature-name {
  margin-top: 7px;
  font-size: 11px;
  font-weight: 600;
  color: #303740;
  text-align: center;
}
</style>
