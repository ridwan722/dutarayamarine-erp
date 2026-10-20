<template>
  <div v-if="modelValue" class="invoice-dialog-overlay">
    <div
      class="invoice-dialog-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-invoice-title"
    >
      <header class="invoice-dialog-header">
        <div class="invoice-dialog-heading">
          <div class="invoice-dialog-icon" aria-hidden="true">
            <v-icon icon="mdi-file-document-plus-outline" size="20" />
          </div>
          <div>
            <h2 id="create-invoice-title">Create Invoice</h2>
            <p>Nomor invoice dibuat otomatis saat disimpan</p>
          </div>
        </div>

        <div class="invoice-dialog-header-actions">
          <span class="invoice-status">
            <span class="invoice-status-dot"></span>
            Draft
          </span>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            color="grey-darken-1"
            aria-label="Tutup dialog invoice"
            @click="emit('update:modelValue', false)"
          />
        </div>
      </header>

      <div class="invoice-dialog-body">
        <section class="invoice-form-section">
          <div class="invoice-section-header">
            <div>
              <span class="invoice-section-index">01</span>
              <h3>Client Information</h3>
            </div>
            <p>Detail client diambil dari quotation yang dipilih.</p>
          </div>

          <div class="invoice-date-row">
            <a-date-picker-new
              class="invoice-date-field"
              v-model="form.tanggal"
              label="Invoice Date"
            />
          </div>

          <dl class="invoice-client-details">
            <div class="invoice-client-detail">
              <dt>Client</dt>
              <dd>{{ form.nama_customer || "—" }}</dd>
            </div>
            <div class="invoice-client-detail invoice-client-address">
              <dt>Address</dt>
              <dd>{{ form.alamat_customer || "—" }}</dd>
            </div>
            <div class="invoice-client-detail">
              <dt>PIC</dt>
              <dd>{{ form.pic || "—" }}</dd>
            </div>
            <div class="invoice-client-detail">
              <dt>Phone Number</dt>
              <dd>{{ form.no_telp || "—" }}</dd>
            </div>
            <div class="invoice-client-detail">
              <dt>Email</dt>
              <dd>{{ form.email || "—" }}</dd>
            </div>
          </dl>
        </section>

        <section class="invoice-form-section">
          <div class="invoice-section-header">
            <div>
              <span class="invoice-section-index">02</span>
              <h3>Purchase Order</h3>
            </div>
            <p>Lengkapi referensi PO dan subject invoice.</p>
          </div>

          <div class="invoice-po-fields">
            <a-text-field-new
              v-model="form.no_preorder"
              label="No. Pre Order (PO)"
              placeholder="No Preorder"
            />
            <a-date-picker-new
              v-model="form.tanggal_preorder"
              label="Tanggal Pre Order (PO)"
            />
          </div>

          <div class="invoice-po-upload-row">
            <div class="invoice-po-upload-wrapper">
              <label for="upload-po" class="invoice-field-label">
                Upload PO
              </label>
              <div class="invoice-po-upload-box">
                <input
                  id="upload-po"
                  class="invoice-po-file-input"
                  type="file"
                  multiple
                  :disabled="saving"
                  @change="addfile"
                />
                <span class="invoice-po-upload-icon" aria-hidden="true">
                  <v-icon icon="mdi-tray-arrow-up" size="19" />
                </span>
                <span>
                  <strong>Pilih File</strong>
                  <small>Maks. 650 KB total</small>
                </span>
              </div>
            </div>

            <div v-if="poFiles.length" class="invoice-po-files-wrapper">
              <span class="invoice-field-label">File Terpilih</span>
              <div class="invoice-po-file-list">
                <div
                  v-for="(file, index) in poFiles"
                  :key="index"
                  class="invoice-po-file-item"
                >
                  <span class="invoice-po-file-name">
                    <v-icon icon="mdi-file-outline" size="16" />
                    {{ file.name }}
                  </span>
                  <button
                    type="button"
                    class="invoice-po-file-remove"
                    :disabled="saving"
                    :aria-label="`Hapus ${file.name}`"
                    @click="poFiles.splice(index, 1)"
                  >
                    <v-icon icon="mdi-close" size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <a-textarea-new
            v-model="form.perihal"
            class="invoice-subject-field"
            label="Subject"
            placeholder="Invoice subject"
            rows="2"
          />
        </section>

        <section class="invoice-form-section invoice-items-section">
          <div class="invoice-section-header invoice-items-header">
            <div>
              <span class="invoice-section-index">03</span>
              <h3>Invoice Items</h3>
            </div>
            <span class="invoice-item-count">
              {{ form.item_pekerjaan.length }} items
            </span>
          </div>

          <div class="invoice-items-table-wrap">
            <table class="invoice-items-table">
              <thead>
                <tr>
                  <th scope="col">No.</th>
                  <th scope="col">Description</th>
                  <th scope="col">Qty</th>
                  <th scope="col">UOM</th>
                  <th scope="col">Amount/pcs</th>
                  <th scope="col">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in form.item_pekerjaan" :key="index">
                  <td>{{ String(index + 1).padStart(2, "0") }}</td>
                  <td>{{ item.nama }}</td>
                  <td>{{ item.qty }}</td>
                  <td>{{ item.uom }}</td>
                  <td>Rp {{ rupiah(item.amount) }}</td>
                  <td>Rp {{ rupiah(itemSubtotal(item)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div class="invoice-commercial-grid">
          <section class="invoice-form-section invoice-summary-section">
            <div class="invoice-section-header">
              <div>
                <span class="invoice-section-index">04</span>
                <h3>Commercial Summary</h3>
              </div>
              <p>Nilai tagihan, termin, dan pajak.</p>
            </div>

            <div class="invoice-billing-progress">
              <v-icon icon="mdi-check-circle-outline" size="16" />
              <span>
                Sudah ditagih: <strong>Rp {{ rupiah(billedSubtotal) }}</strong>
              </span>
              <span>
                Sisa: <strong>Rp {{ rupiah(remainingSubtotal) }}</strong>
              </span>
            </div>

            <div class="invoice-totals">
              <div>
                <span>Subtotal</span>
                <strong>Rp {{ rupiah(subtotal) }}</strong>
              </div>
              <div v-if="discountAmount > 0">
                <span>Discount</span>
                <strong class="invoice-discount-value">
                  - Rp {{ rupiah(discountAmount) }}
                </strong>
              </div>
              <div class="invoice-total-option invoice-termin-option">
                <label>
                  <input type="checkbox" v-model="form.down_payment" />
                  <span>Termin</span>
                </label>
                <a-text-field-new
                  v-if="form.down_payment"
                  v-model="form.dp_persen"
                  type="number"
                  placeholder="50"
                  suffix="%"
                  class="invoice-dp-field"
                />
                <strong v-if="form.down_payment">
                  Rp {{ rupiah(dpNominal) }}
                </strong>
              </div>
              <div class="invoice-total-option">
                <label>
                  <input type="checkbox" v-model="form.pakai_ppn" />
                  <span>PPN 11%</span>
                </label>
                <strong>Rp {{ rupiah(ppn) }}</strong>
              </div>
              <div class="invoice-grand-total">
                <span>Grand Total</span>
                <strong>Rp {{ rupiah(grandTotal) }}</strong>
              </div>
            </div>
          </section>

          <section class="invoice-form-section invoice-sign-section">
            <div class="invoice-section-header">
              <div>
                <span class="invoice-section-index">05</span>
                <h3>Authorization</h3>
              </div>
              <p>Penandatangan invoice.</p>
            </div>

            <a-select-new
              v-model="form.sign_by"
              label="Sign By / Yang Bertanda Tangan ?"
              :items="[
                'Seilla Maryana',
                'Leo Adiatmaja Sembiring',
                'Muhammad Ridwan',
                'Lilis',
              ]"
            />

            <div v-if="form.sign_by" class="invoice-signature-preview">
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
                <v-img width="130" height="65" contain src="/ttd_seilla.png" />
                <div class="signature-line"></div>
                <div class="signature-name">Seilla Maryana</div>
              </div>

              <div
                v-if="form.sign_by == 'Muhammad Ridwan'"
                class="signature-content"
              >
                <v-img width="130" height="65" contain src="/ttd_ridwan.png" />
                <div class="signature-line"></div>
                <div class="signature-name">Muhammad Ridwan</div>
              </div>

              <div v-if="form.sign_by == 'Lilis'" class="signature-content">
                <v-img width="130" height="65" contain />
                <div class="signature-line"></div>
                <div class="signature-name">Lilis</div>
              </div>
            </div>
          </section>
        </div>

        <section class="invoice-form-section invoice-terms-section">
          <div class="invoice-section-header invoice-terms-header">
            <div>
              <span class="invoice-section-index">06</span>
              <h3>Terms &amp; Conditions</h3>
            </div>
            <span class="invoice-selected-count">
              {{ (form.termCondition ?? []).length }} selected
            </span>
          </div>

          <div class="invoice-terms-table-wrap">
            <table class="invoice-terms-table">
              <thead>
                <tr>
                  <th scope="col">No.</th>
                  <th scope="col">Select</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in sortedTermConditions"
                  :key="item?.id ?? index"
                >
                  <td>{{ index + 1 }}</td>
                  <td>
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
                      class="invoice-term-checkbox"
                    />
                  </td>
                  <td>{{ item?.nama_term }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <footer class="invoice-dialog-footer">
        <p>
          Pastikan detail PO, nilai invoice, dan terms sudah sesuai sebelum
          disimpan.
        </p>
        <div>
          <v-btn
            size="small"
            variant="outlined"
            color="grey-darken-1"
            class="text-none invoice-cancel-btn"
            @click="emit('update:modelValue', false)"
          >
            Batal
          </v-btn>
          <v-btn
            size="small"
            color="primary"
            variant="flat"
            prepend-icon="mdi-content-save-outline"
            class="text-none invoice-save-btn"
            :disabled="
              saving ||
              loadingPreviousInvoices ||
              previousInvoicesLoadFailed
            "
            @click="save"
          >
            <span v-if="saving">Memproses...</span>
            <span v-else-if="loadingPreviousInvoices">
              Memuat invoice sebelumnya...
            </span>
            <span v-else-if="previousInvoicesLoadFailed">
              Gagal memuat invoice sebelumnya
            </span>
            <span v-else>Simpan Invoice</span>
          </v-btn>
        </div>
      </footer>
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
import { queryambilid } from "~/composables/useFirestoreQuery";

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
const loadingPreviousInvoices = ref(false);
const previousInvoicesLoadFailed = ref(false);
const previousInvoices = ref<invoiceM[]>([]);

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
  location: "",
  tanggal: "",
  perihal: "",
  sign_by: "",
  item_pekerjaan: [],
  pakai_ppn: false,
  subtotal_invoice: 0,
  discount_invoice: 0,
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
const quotationSubtotal = computed(() =>
  Number(props.penawaran.grand_total_penawaran) ||
  Number(props.penawaran.subtotal_penawaran) ||
  (props.penawaran.penawaran_item || []).reduce(
    (sum, item) => sum + Number(item.subtotal_item || item.qty * item.amount || 0),
    0,
  ),
);
const quotationGrossSubtotal = computed(() =>
  Number(props.penawaran.subtotal_penawaran) ||
  (props.penawaran.penawaran_item || []).reduce(
    (sum, item) => sum + Number(item.subtotal_item || item.qty * item.amount || 0),
    0,
  ),
);
const discountRate = computed(() =>
  quotationGrossSubtotal.value > 0
    ? Math.max(0, 1 - quotationSubtotal.value / quotationGrossSubtotal.value)
    : 0,
);
const discountAmount = computed(() =>
  Math.round(subtotal.value * discountRate.value),
);
const netSubtotal = computed(() => subtotal.value - discountAmount.value);
const billedSubtotal = computed(() =>
  previousInvoices.value.reduce((sum, invoice) => {
    const invoiceSubtotal = Number(invoice.subtotal_invoice || 0);
    const invoiceNetSubtotal = Math.max(
      0,
      invoiceSubtotal - Number(invoice.discount_invoice || 0),
    );
    const billed = invoice.down_payment
      ? invoiceNetSubtotal * (Number(invoice.dp_persen || 0) / 100)
      : invoiceNetSubtotal;
    return sum + billed;
  }, 0),
);
const remainingSubtotal = computed(() =>
  Math.max(0, quotationSubtotal.value - billedSubtotal.value),
);
const ppn = computed(() =>
  form.value.pakai_ppn ? Math.round(netSubtotal.value * 0.11) : 0,
);
const grandTotal = computed(() => {
  if (form.value.down_payment) {
    return dpNominal.value + ppn.value;
  }

  return netSubtotal.value + ppn.value;
});
watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return;

    poFiles.value = [];
    previousInvoices.value = [];
    previousInvoicesLoadFailed.value = false;
    loadingPreviousInvoices.value = true;

    form.value = {
      ...emptyForm(),

      id_customer: props.penawaran.id_perusahaan,
      nama_customer: props.penawaran.nama_perusahaan,
      alamat_customer: props.penawaran.alamat_perusahaan || "",
      no_telp: props.penawaran.no_telp || "",
      email: props.penawaran.email || "",
      vessel: props.penawaran.vessel || "",
      perihal: props.penawaran.perihal || "",
      location: props.penawaran.location || "",
      sign_by: props.penawaran.sign_by || "",
      pic: props.penawaran.pic,
      tanggal: moment().format("YYYY-MM-DD"),
      item_pekerjaan: createInvoiceItems(props.penawaran),

      // termCondition: (props.penawaran.termCondition || []).map((item: any) => ({
      //   id: item.id ?? "",
      //   nama_term: item.nama_term,
      //   createdAt: item.createdAt ?? 0,
      //   createdBy: item.createdBy ?? "",
      // })),
    };

    try {
      const penawaranId = props.penawaran.id || props.penawaran.id_penawaran;
      if (penawaranId) {
        previousInvoices.value = (await queryambilid(
          `penawaran/${penawaranId}/invoice`,
        )) as invoiceM[];
      }

      if (billedSubtotal.value > 0 && remainingSubtotal.value > 0) {
        form.value.down_payment = true;
        form.value.dp_persen = Number(
          ((remainingSubtotal.value / netSubtotal.value) * 100).toFixed(6),
        );
      }
    } catch (error) {
      console.error("Gagal memuat invoice sebelumnya:", error);
      previousInvoicesLoadFailed.value = true;
      notificationStore.showError("Gagal memuat total invoice sebelumnya");
    } finally {
      loadingPreviousInvoices.value = false;
    }
  },
);

const dpNominal = computed(() => {
  if (!form.value.down_payment) return 0;

  const persen = Number(form.value.dp_persen || 0);

  return Math.round(netSubtotal.value * (persen / 100));
});

function createInvoiceItems(penawaran: penawaranM): invoiceItemM[] {
  return (penawaran.penawaran_item || []).map((item) => ({
    nama: item.nama,
    qty: Number(item.qty) || 0,
    kategori_item: item.kategori_item,
    uom: item.uom,
    amount: Number(item.amount) || 0,
    subtotal_item:
      Number(item.subtotal_item) ||
      (Number(item.qty) || 0) * (Number(item.amount) || 0),
  }));
}

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
  if (
    saving.value ||
    loadingPreviousInvoices.value ||
    previousInvoicesLoadFailed.value
  ) {
    return;
  }
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

  const currentBilledSubtotal = form.value.down_payment
    ? dpNominal.value
    : netSubtotal.value;
  if (currentBilledSubtotal > remainingSubtotal.value + 0.5) {
    return notificationStore.showError(
      `Nilai invoice melebihi sisa penawaran Rp ${rupiah(remainingSubtotal.value)}`,
    );
  }
  if (remainingSubtotal.value <= 0) {
    return notificationStore.showError(
      "Seluruh nilai penawaran sudah ditagihkan",
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
    discount_invoice: discountAmount.value,
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
  useloadingStore().setLoading(true);
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
    useloadingStore().setLoading(false);
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

/* Invoice form dialog -- aligned with the quotation dialog visual system. */
.invoice-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(22, 29, 37, 0.48);
}

.invoice-dialog-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1040px;
  max-height: calc(100vh - 48px);
  overflow: hidden;
  color: #1f2937;
  background: #f5f6f8;
  border: 1px solid #d9dee5;
  border-radius: 10px;
  box-shadow: 0 18px 48px rgba(20, 30, 43, 0.2);
}

.invoice-dialog-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 72px;
  padding: 14px 20px;
  background: #ffffff;
  border-bottom: 1px solid #dfe3e8;
}

.invoice-dialog-heading,
.invoice-dialog-header-actions,
.invoice-dialog-heading > div:last-child {
  display: flex;
  align-items: center;
  min-width: 0;
}

.invoice-dialog-heading {
  gap: 12px;
}

.invoice-dialog-heading > div:last-child {
  align-items: flex-start;
  flex-direction: column;
}

.invoice-dialog-heading h2 {
  margin: 0;
  color: #202833;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
}

.invoice-dialog-heading p {
  max-width: 520px;
  margin: 2px 0 0;
  overflow: hidden;
  color: #7a8491;
  font-size: 11px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invoice-dialog-icon {
  display: grid;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  place-items: center;
  color: #315f8c;
  background: #eef3f8;
  border: 1px solid #dce6ef;
  border-radius: 6px;
}

.invoice-dialog-header-actions {
  flex: 0 0 auto;
  gap: 8px;
}

.invoice-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 26px;
  padding: 0 10px;
  color: #586474;
  font-size: 11px;
  font-weight: 600;
  background: #f7f8fa;
  border: 1px solid #dfe3e8;
  border-radius: 4px;
}

.invoice-status-dot {
  width: 6px;
  height: 6px;
  background: #d8972e;
  border-radius: 50%;
}

.invoice-dialog-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding: 18px;
  overflow-y: auto;
  background: #f5f6f8;
}

.invoice-form-section {
  padding: 18px;
  background: #ffffff;
  border: 1px solid #dfe3e8;
  border-radius: 7px;
}

.invoice-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.invoice-section-header > div {
  display: flex;
  align-items: center;
  gap: 9px;
}

.invoice-section-header h3 {
  margin: 0;
  color: #27313d;
  font-size: 13px;
  font-weight: 700;
  line-height: 22px;
}

.invoice-section-header p {
  margin: 3px 0 0;
  color: #8a939f;
  font-size: 10px;
  line-height: 1.5;
  text-align: right;
}

.invoice-section-index {
  display: inline-grid;
  width: 24px;
  height: 22px;
  place-items: center;
  color: #566575;
  font-size: 9px;
  font-weight: 700;
  background: #f1f3f5;
  border: 1px solid #e0e4e8;
  border-radius: 4px;
}

.invoice-date-row {
  display: grid;
  grid-template-columns: 220px;
  margin-bottom: 14px;
}

.invoice-date-field {
  min-width: 0;
}

.invoice-client-details {
  display: grid;
  grid-template-columns:
    minmax(145px, 1.2fr) minmax(190px, 1.7fr)
    repeat(3, minmax(100px, 1fr));
  gap: 1px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #dfe3e8;
  border: 1px solid #dfe3e8;
  border-radius: 5px;
}

.invoice-client-detail {
  min-width: 0;
  min-height: 52px;
  padding: 8px 11px;
  background: #fafbfc;
}

.invoice-client-detail dt {
  margin-bottom: 3px;
  color: #828c98;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.035em;
  line-height: 1.25;
  text-transform: uppercase;
}

.invoice-client-detail dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: #354150;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
}

.invoice-po-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.invoice-po-upload-row {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  align-items: start;
  gap: 14px;
  margin-top: 13px;
}

.invoice-po-upload-wrapper,
.invoice-po-files-wrapper {
  min-width: 0;
}

.invoice-field-label {
  display: block;
  margin-bottom: 6px;
  color: #5f6874;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.invoice-po-upload-box {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 62px;
  padding: 10px 12px;
  color: #435365;
  background: #fbfcfd;
  border: 1px dashed #b8c2cc;
  border-radius: 5px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.invoice-po-upload-box:hover {
  background: #f5f8fb;
  border-color: #7f9db9;
}

.invoice-po-file-input {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.invoice-po-file-input:disabled {
  cursor: not-allowed;
}

.invoice-po-upload-icon {
  display: grid;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  place-items: center;
  color: #315f8c;
  background: #eef3f8;
  border: 1px solid #dce6ef;
  border-radius: 5px;
}

.invoice-po-upload-box > span:last-child {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.invoice-po-upload-box strong {
  font-size: 11px;
  font-weight: 600;
}

.invoice-po-upload-box small {
  margin-top: 2px;
  color: #8a939f;
  font-size: 9px;
}

.invoice-po-file-list {
  display: grid;
  gap: 6px;
}

.invoice-po-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 40px;
  padding: 6px 8px 6px 10px;
  background: #fbfcfd;
  border: 1px solid #dfe3e8;
  border-radius: 5px;
}

.invoice-po-file-name {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  overflow: hidden;
  color: #4f5d6c;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invoice-po-file-name .v-icon {
  flex: 0 0 auto;
  color: #778493;
}

.invoice-po-file-remove {
  display: grid;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  padding: 0;
  place-items: center;
  color: #8b95a1;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}

.invoice-po-file-remove:hover:not(:disabled) {
  color: #b54747;
  background: #fff3f3;
}

.invoice-po-file-remove:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.invoice-subject-field {
  display: block;
  margin-top: 13px;
}

.invoice-items-section {
  padding: 0;
}

.invoice-items-header {
  align-items: center;
  margin: 0;
  padding: 16px 18px;
  border-bottom: 1px solid #e4e7eb;
}

.invoice-item-count,
.invoice-selected-count {
  padding: 4px 8px;
  color: #596777;
  font-size: 10px;
  font-weight: 600;
  background: #f2f4f6;
  border: 1px solid #e0e4e8;
  border-radius: 4px;
}

.invoice-items-table-wrap,
.invoice-terms-table-wrap {
  overflow-x: auto;
}

.invoice-items-table {
  width: 100%;
  color: #485462;
  font-size: 11px;
  border-collapse: collapse;
}

.invoice-items-table th {
  height: 34px;
  padding: 7px 10px;
  color: #657281;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-align: left;
  text-transform: uppercase;
  background: #f5f6f8;
  border-bottom: 1px solid #dfe3e8;
}

.invoice-items-table td {
  min-height: 42px;
  padding: 9px 10px;
  line-height: 1.45;
  vertical-align: top;
  border-bottom: 1px solid #e8ebee;
}

.invoice-items-table tbody tr:last-child td {
  border-bottom: 0;
}

.invoice-items-table tbody tr:hover {
  background: #fafbfc;
}

.invoice-items-table th:first-child,
.invoice-items-table td:first-child {
  width: 50px;
  text-align: center;
}

.invoice-items-table th:nth-child(2) {
  width: 42%;
}

.invoice-items-table th:nth-child(3),
.invoice-items-table td:nth-child(3),
.invoice-items-table th:nth-child(4),
.invoice-items-table td:nth-child(4) {
  width: 9%;
  text-align: center;
}

.invoice-items-table th:nth-child(5),
.invoice-items-table td:nth-child(5),
.invoice-items-table th:nth-child(6),
.invoice-items-table td:nth-child(6) {
  width: 17%;
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

.invoice-items-table td:nth-child(6) {
  color: #303a46;
  font-weight: 700;
}

.invoice-commercial-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
  gap: 14px;
  align-items: stretch;
}

.invoice-summary-section,
.invoice-sign-section {
  min-width: 0;
}

.invoice-billing-progress {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px 12px;
  min-height: 38px;
  margin-bottom: 12px;
  padding: 8px 10px;
  color: #526272;
  font-size: 10px;
  background: #f4f8f6;
  border: 1px solid #d7e8df;
  border-radius: 5px;
}

.invoice-billing-progress .v-icon {
  color: #438060;
}

.invoice-billing-progress strong {
  color: #344b3f;
  font-weight: 700;
}

.invoice-totals {
  border-top: 1px solid #e1e5ea;
}

.invoice-totals > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 38px;
  color: #697585;
  font-size: 11px;
  border-bottom: 1px solid #edf0f2;
}

.invoice-totals strong {
  color: #303a46;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.invoice-totals .invoice-discount-value {
  color: #b54747;
}

.invoice-total-option label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #566575;
  font-weight: 600;
  cursor: pointer;
}

.invoice-total-option input[type="checkbox"] {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: #1867c0;
  cursor: pointer;
}

.invoice-termin-option {
  display: grid !important;
  grid-template-columns: minmax(80px, 1fr) 78px auto;
}

.invoice-dp-field {
  width: 78px;
}

.invoice-dp-field :deep(.form-group) {
  margin: 0;
}

.invoice-dp-field :deep(.input-field) {
  min-height: 30px !important;
  padding-block: 4px !important;
}

.invoice-totals .invoice-grand-total {
  min-height: 50px;
  color: #263443;
  border-bottom: 0;
}

.invoice-grand-total span {
  font-size: 12px;
  font-weight: 700;
}

.invoice-grand-total strong {
  color: #173f66;
  font-size: 17px;
  font-weight: 700;
}

.invoice-signature-preview {
  display: grid;
  min-height: 112px;
  margin-top: 12px;
  padding: 12px;
  place-items: center;
  background: #fafbfc;
  border: 1px solid #e1e5ea;
  border-radius: 5px;
}

.invoice-terms-header {
  align-items: center;
}

.invoice-terms-table-wrap {
  border: 1px solid #dfe3e8;
  border-radius: 5px;
}

.invoice-terms-table {
  width: 100%;
  color: #485462;
  font-size: 11px;
  border-collapse: collapse;
}

.invoice-terms-table th {
  height: 32px;
  padding: 7px 10px;
  color: #657281;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-align: left;
  text-transform: uppercase;
  background: #f5f6f8;
  border-bottom: 1px solid #dfe3e8;
}

.invoice-terms-table th:first-child,
.invoice-terms-table td:first-child {
  width: 44px;
  text-align: center;
}

.invoice-terms-table th:nth-child(2),
.invoice-terms-table td:nth-child(2) {
  width: 58px;
  padding: 0;
  text-align: center;
}

.invoice-terms-table td {
  min-height: 38px;
  padding: 6px 10px;
  line-height: 1.45;
  vertical-align: middle;
  border-bottom: 1px solid #e8ebee;
}

.invoice-terms-table tbody tr:last-child td {
  border-bottom: 0;
}

.invoice-terms-table tbody tr:hover {
  background: #fafbfc;
}

.invoice-term-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 38px;
  margin: 0;
}

.invoice-term-checkbox :deep(.v-input__control),
.invoice-term-checkbox :deep(.v-selection-control) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.invoice-term-checkbox :deep(.v-selection-control) {
  min-height: 38px;
}

.invoice-dialog-footer {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 64px;
  padding: 12px 20px;
  background: #ffffff;
  border-top: 1px solid #dfe3e8;
}

.invoice-dialog-footer p {
  margin: 0;
  color: #7b8591;
  font-size: 10px;
  line-height: 1.45;
}

.invoice-dialog-footer > div {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.invoice-cancel-btn,
.invoice-save-btn {
  min-width: 104px;
  height: 34px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  border-radius: 4px !important;
}

.invoice-save-btn {
  min-width: 142px;
}

.invoice-dialog-card :deep(.input-field),
.invoice-dialog-card :deep(.date-input-wrapper) {
  border-radius: 4px;
}

@media (max-width: 959px) {
  .invoice-dialog-overlay {
    padding: 0;
  }

  .invoice-dialog-card {
    height: 100vh;
    max-height: 100vh;
    border: 0;
    border-radius: 0;
  }

  .invoice-dialog-body {
    padding: 14px;
  }

  .invoice-client-details {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .invoice-client-address {
    grid-column: span 1;
  }

  .invoice-commercial-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 599px) {
  .invoice-dialog-header {
    min-height: 64px;
    padding: 11px 12px;
  }

  .invoice-dialog-heading {
    gap: 9px;
  }

  .invoice-dialog-icon {
    flex-basis: 32px;
    width: 32px;
    height: 32px;
  }

  .invoice-dialog-heading h2 {
    font-size: 14px;
  }

  .invoice-dialog-heading p,
  .invoice-status {
    display: none;
  }

  .invoice-dialog-body {
    gap: 10px;
    padding: 10px;
  }

  .invoice-form-section {
    padding: 14px;
  }

  .invoice-section-header {
    margin-bottom: 13px;
  }

  .invoice-section-header p {
    display: none;
  }

  .invoice-date-row,
  .invoice-client-details,
  .invoice-po-fields,
  .invoice-po-upload-row {
    grid-template-columns: 1fr;
  }

  .invoice-client-address {
    grid-column: auto;
  }

  .invoice-items-header {
    padding: 13px 14px;
  }

  .invoice-items-table {
    min-width: 720px;
  }

  .invoice-termin-option {
    grid-template-columns: minmax(70px, 1fr) 72px auto;
    gap: 8px !important;
  }

  .invoice-dp-field {
    width: 72px;
  }

  .invoice-dialog-footer {
    align-items: stretch;
    padding: 10px 12px;
  }

  .invoice-dialog-footer p {
    display: none;
  }

  .invoice-dialog-footer > div {
    display: grid;
    flex: 1;
    grid-template-columns: 1fr 1.4fr;
  }

  .invoice-cancel-btn,
  .invoice-save-btn {
    width: 100%;
    min-width: 0;
  }
}
</style>
