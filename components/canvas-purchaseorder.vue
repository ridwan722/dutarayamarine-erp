<template>
  <v-dialog v-model="dialogWarna" max-width="360px">
    <v-card class="rounded-xl elevation-8">
      <v-card-title
        class="d-flex align-center justify-space-between pa-4 bg-slate-50"
      >
        <div class="d-flex align-center gap-2">
          <v-icon color="primary" size="20">mdi-palette-outline</v-icon>
          <span class="text-subtitle-1 font-weight-bold color-slate-800"
            >Tema Warna Header</span
          >
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          density="comfortable"
          @click="dialogWarna = false"
        />
      </v-card-title>
      <v-divider />
      <v-card-text class="d-flex justify-center pa-4">
        <v-color-picker
          v-model="warnaBackgroundCustom"
          mode="hex"
          hide-inputs
          show-swatches
          elevation="0"
        />
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-3 bg-slate-50">
        <v-spacer />
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          class="px-5 rounded-lg"
          @click="dialogWarna = false"
        >
          Terapkan
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <div class="top-bar-actions d-flex justify-center align-center mb-4 no-print">
    <v-btn-toggle
      v-model="lang"
      mandatory
      color="primary"
      variant="outlined"
      density="comfortable"
      class="rounded-lg bg-white elevation-1"
    >
      <v-btn value="id" class="px-4 font-weight-bold text-caption">
        <v-icon start size="16">mdi-translate</v-icon>
        Bahasa Indonesia
      </v-btn>
      <v-btn value="en" class="px-4 font-weight-bold text-caption">
        <v-icon start size="16">mdi-earth</v-icon>
        English
      </v-btn>
    </v-btn-toggle>
  </div>

  <div>
    <div id="purchaseorder-to-print" class="offer-card">
      <!-- <div class="watermark">
        <img src="/logowatermark.png" alt="Logo Watermark" />
      </div> -->

      <div class="letterhead">
        <div class="header-section">
          <div class="logo-wrapper">
            <img width="160" src="/logokopsurat.png" alt="Logo Header" />
          </div>

          <div class="letterhead-info">
            <h1 class="company-name">PT. DUTA RAYA MARINE</h1>
            <p class="address-line">
              <!-- Cipta Grand City G-8, Sagulung, Kota Batam, <br />
              Kepulauan Riau 29425 -->

              Ruko Dreamland H3 No. 05 RT. 000 RW. 000, Tanjung Riau,<br />
               Sekupang, Kota Batam, Kepulauan Riau.
            </p>
            <p class="phone-line">
              E-mail: sales@dutarayamarine.com, Phone/WhatsApp : +62823-8450-3953 <br />
              Website: www.dutarayamarine.com
            </p>
          </div>

          <div class="header-spacer" aria-hidden="true"></div>
        </div>

        <div class="header-divider">
          <div
            class="accent-bar"
            :style="{ backgroundColor: warnaBackgroundCustom }"
          ></div>
          <div class="secondary-bar"></div>
        </div>
      </div>

      <div class="content-body">
        <div class="text-center po-document-title">
          <strong style="font-size: 20px">PURCHASE ORDER</strong>
        </div>

        <div class="info-grid-card">
          <section class="grid-col">
            <h2 class="info-heading">
              {{
                lang === "id" ? "Informasi Permintaan" : "Request Information"
              }}
            </h2>
            <div class="meta-row">
              <span class="lbl">{{ lang === "id" ? "No. PO" : "PO No." }}</span>
              <span class="sep">:</span>
              <span class="val bold">{{
                purchaseorder?.no_purchaseorder || ""
              }}</span>
            </div>

            <div class="meta-row">
              <span class="lbl">{{ t.date }}</span>
              <span class="sep">:</span>

              <span class="val">
                {{
                  purchaseorder?.tgl_purchaseorder
                    ? purchaseorder.tgl_purchaseorder
                        .split("-")
                        .reverse()
                        .join("-")
                    : ""
                }}
              </span>
            </div>

            <div class="meta-row">
              <span class="lbl">{{
                lang === "id" ? "Pembayaran" : "Payment"
              }}</span>
              <span class="sep">:</span>
              <span class="val">{{ purchaseorder?.payment }}</span>
            </div>

             <div class="meta-row">
              <span class="lbl">{{
                lang === "id" ? "Perihal" : "Subject"
              }}</span>
              <span class="sep">:</span>
              <span class="val">{{
                purchaseorder?.perihal_purchaseorder
              }}</span>
            </div>
          </section>
          <section class="grid-col">
            <h2 class="info-heading">
              {{ lang === "id" ? "Informasi Vendor" : "Vendor Information" }}
            </h2>
            <div class="meta-row">
              <span class="lbl">{{
                lang === "id" ? "Nama Vendor" : "Vendor Name"
              }}</span
              ><span class="sep">:</span
              ><span class="val">{{ purchaseorder?.nama_vendor }}</span>
            </div>

            <div class="meta-row">
              <span class="lbl">{{ lang === "id" ? "Alamat" : "Address" }}</span
              ><span class="sep">:</span
              ><span class="val">{{ purchaseorder?.alamat_vendor }}</span>
            </div>
            <div class="meta-row">
              <span class="lbl">{{
                lang === "id" ? "No. Penawaran" : "Quotation No."
              }}</span
              ><span class="sep">:</span
              ><span class="val">{{
                purchaseorder?.no_quotation_from_vendor
              }}</span>
            </div>
            <div class="meta-row">
              <span class="lbl">PIC</span><span class="sep">:</span
              ><span class="val">{{ purchaseorder?.pic_vendor }}</span>
            </div>
            <div class="meta-row">
              <span class="lbl">Email</span><span class="sep">:</span
              ><span class="val">{{ purchaseorder?.email_vendor }}</span>
            </div>
            <div class="meta-row">
              <span class="lbl">{{ t.phone }}</span
              ><span class="sep">:</span
              ><span class="val">{{ purchaseorder?.no_telp_vendor }}</span>
            </div>

            <div class="meta-row">
              <span class="lbl">{{
                lang === "id" ? "Mata Uang" : "Currency"
              }}</span>
              <span class="sep">:</span
              ><span class="val">{{ purchaseorder?.currency }}</span>
            </div>
          </section>
        </div>

        <!-- <div class="text-salutation">
          <p class="salutation-title">{{ t.salutationTitle }}</p>
          <p class="salutation-body" v-if="lang === 'id'">
            Bersama ini kami sampaikan penawaran harga sebagai berikut:
          </p>
          <p class="salutation-body" v-else>
            We are pleased to submit our quotation as follows:
          </p>
        </div> -->

        <div class="table-container">
          <table class="modern-table">
            <thead>
              <tr
                :style="{
                  backgroundColor: warnaBackgroundCustom,
                  color: warnaTeksHeader,
                }"
              >
                <th
                  width="36"
                  class="text-center no-print-cell"
                  :style="{ color: warnaTeksHeader }"
                >
                  <v-tooltip location="top">
                    <template #activator="{ props: tooltipProps }">
                      <v-btn
                        v-bind="tooltipProps"
                        class="no-print theme-btn"
                        size="20"
                        variant="flat"
                        icon="mdi-palette"
                        :style="{ color: warnaTeksHeader }"
                        @click="dialogWarna = true"
                      />
                    </template>
                    <span>Ubah Warna Aksentuasi</span>
                  </v-tooltip>
                </th>
                <th
                  width="32"
                  class="text-center print-only-cell"
                  :style="{ color: warnaTeksHeader }"
                >
                  SN
                </th>

                <th
                  width="500"
                  class="text-left"
                  :style="{ color: warnaTeksHeader }"
                >
                  {{ t.thDescription }}
                </th>
                <!-- <th
                  width="60"
                  class="text-center no-print"

                >
                  Kategori
                </th> -->
                <th
                  width="60"
                  class="text-center"
                  :style="{ color: warnaTeksHeader }"
                >
                  {{ t.thQty }}
                </th>
                <th
                  width="65"
                  class="text-center"
                  :style="{ color: warnaTeksHeader }"
                >
                  {{ t.thUom }}
                </th>
                <th
                  width="125"
                  class="text-right"
                  :style="{ color: warnaTeksHeader }"
                >
                  {{ t.thUnitPrice }}
                </th>
                <th
                  width="165"
                  class="text-right"
                  :style="{ color: warnaTeksHeader }"
                >
                  Total Price
                </th>
              </tr>
            </thead>
            <tbody ref="tableBodyRef">
              <template
                v-for="(section, sectionIndex) in purchaseorderSections"
                :key="`section-${sectionIndex}`"
              >
                <!-- <tr v-if="section.title || section.description" class="section-row">
                  <td colspan="6">
                    <strong v-if="section.title">{{ section.title }}</strong>
                    <div v-if="section.description" class="section-description">{{ section.description }}</div>
                  </td>
                </tr> -->
                <tr
                  v-for="(item, itemIndex) in section.items"
                  :key="item.id || `${sectionIndex}-${itemIndex}`"
                  :class="{
                    'zebra-row': (section.startIndex + itemIndex) % 2 === 1,
                  }"
                >
                  <td class="text-center row-num drag-handle" width="36">
                    <div style="display: flex; align-items: center">
                      <v-icon size="12" class="drag-icon no-print mr-1"
                        >mdi-drag-vertical</v-icon
                      >
                      <span>{{ section.startIndex + itemIndex + 1 }}.</span>
                    </div>
                  </td>

                  <td
                    class="text-left text-slate-800"
                    style="white-space: pre-line"
                  >
                    <strong v-if="section.title">{{ section.title }}</strong>
                    <div v-if="section.description" class="section-description">
                      {{ section.description }}
                    </div>
                    <br v-if="section.description && section.title" />{{ item.nama }}
                  </td>
                  <td class="text-center">{{ item.qty }}</td>
                  <td class="text-center text-slate-500">{{ item.uom }}</td>
                  <td class="text-right text-slate-600">
                    {{ formatCurrency(item.price) }}
                  </td>
                  <td class="text-right text-navy">
                    {{ formatCurrency(item.price * item.qty) }}
                  </td>
                </tr>
              </template>
            </tbody>

            <tfoot>
              <tr class="summary-row grand-total-row" v-if="purchaseorderDiscountAmount > 0">
                <td colspan="5" class="text-right  text-navy">
                  Subtotal
                </td>
                <td class="text-right  text-navy gt-text">
                  {{ formatCurrency(purchaseorder?.subtotal_purchaseorder || 0) }}
                </td>
              </tr>

              <tr class="summary-row grand-total-row" v-if="purchaseorderDiscountAmount > 0">
                <td colspan="5" class="text-right  text-navy">
                  {{ lang === "id" ? "Diskon" : "Discount" }}
                  <template v-if="purchaseorder?.tipe_diskon_purchaseorder !== 'nominal'">
                    {{ rupiah(purchaseorder?.diskon_purchaseorder || 0) }} %
                  </template>
                </td>
                <td class="text-right  text-navy gt-text font-italic">
                  - {{ formatCurrency(purchaseorderDiscountAmount) }}
                </td>
              </tr>

              <tr class="summary-row grand-total-row">
                <td colspan="5" class="text-right font-weight-bold text-navy">
                  Total
                </td>
                <td class="text-right font-weight-bold text-navy gt-text">
                  {{ formatCurrency(purchaseorder?.grandtotal_purchaseorder || 0) }}
                </td>
              </tr>

              <!-- <tr class="terbilang-row">
                <td colspan="6">
                  <div class="terbilang-inner">
                    <span class="terbilang-lbl">{{ t.amountInWords }}:</span>
                    <span class="terbilang-val"
                      >#
                      {{
                        jadirupiah(purchaseorder?.grandtotal_purchaseorder || 0)
                      }}
                      Rupiah
                    </span>
                  </div>
                </td>
              </tr> -->
            </tfoot>
          </table>
        </div>

        <!-- <div
          class="closing-paragraph"
          v-if="(detailpenawaran.termCondition?.length ?? 0) > 0"
        >
          <p><strong>TERMS &amp; CONDITIONS:</strong></p>
          <ul class="ml-3" style="list-style: none; padding-left: 0">
            <li
              v-for="(item, index) in detailpenawaran.termCondition"
              :key="index"
            >
              {{ index + 1 }}. {{ item.nama_term }}
            </li>
          </ul>
        </div> -->

        <!-- <div class="closing-paragraph">
          <p><strong>TERMS &amp; CONDITIONS:</strong></p>
          <ul class="ml-3" style="list-style: none; padding-left: 0">
            <li>1. Cash in Advance</li>
          </ul>
        </div> -->

       <div class="signatures-wrapper">
          <div class="sig-block">
            <p class="sig-header">{{ t.sigHeaderLeft }}</p>
            <p class="sig-sub">PT. DUTA RAYA MARINE</p>
            <div class="sig-img-container">
              <img src="/ttd_ridwan.png" v-if="purchaseorder?.sign_po_by == 'Muhammad Ridwan'" alt="Signature" class="sig-image" />
              <img src="/ttd_seilla.png" v-if="purchaseorder?.sign_po_by == 'Seilla Maryana'" alt="Signature" class="sig-image" />
              <img src="/ttd_leo.png" v-if="purchaseorder?.sign_po_by == 'Leo Adiatmaja Sembiring'" alt="Signature" class="sig-image" />
            </div>
            <p class="sig-person-name" v-if="purchaseorder?.sign_po_by == 'Muhammad Ridwan'">Muhammad Ridwan</p>
            <p class="sig-person-name" v-if="purchaseorder?.sign_po_by == 'Seilla Maryana'">Seilla Maryana</p>
             <p class="sig-person-name" v-if="purchaseorder?.sign_po_by == 'Leo Adiatmaja Sembiring'">Leo Adiatmaja Sembiring</p>
          </div>

          <!-- <div class="sig-block">
            <p class="sig-header">{{ t.sigHeaderRight }}</p>
            <p class="sig-sub">
              {{ purchaseorder?.nama_vendor || "" }}
            </p>
            <div class="sig-placeholder"></div>
            <p class="sig-person-name">
              ( .................................... )
            </p>
            <p class="sig-person-role">{{ t.sigRoleRight }}</p>
          </div> -->
        </div>
      </div>

      <div class="page-footer" aria-hidden="true">
        <div class="footer-line"></div>
      </div>
    </div>

    <div
      class="document-actions d-flex flex-wrap justify-center align-center mt-6 mb-12 no-print"
    >
      <v-btn
        width="300"
        height="46"
        color="indigo-darken-3"
        elevation="3"
        prepend-icon="mdi-printer"
        class="quotation-action-btn text-capitalize font-weight-bold rounded-lg text-subtitle-2"
        @click="handlePrint"
      >
        Print Purchase Order (PO)
      </v-btn>
      <v-btn
        width="300"
        height="46"
        color="red-darken-2"
        elevation="3"
        prepend-icon="mdi-file-pdf-box"
        class="quotation-action-btn text-capitalize font-weight-bold rounded-lg text-subtitle-2"
        :loading="isSavingPdf"
        :disabled="isSavingPdf"
        @click="handleSavePdf"
      >
        Save PDF Purchase Order (PO)
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { collection, getDocs } from "firebase/firestore";
import type { penawaranM } from "~/types/penawaranModel";
import moment from "moment";
import type { purchaseorderM } from "~/types/purchaseorderModel";
import { useFirestore } from "vuefire";
const props = defineProps<{
  detailpenawaran: penawaranM;
}>();

const db = useFirestore();
const purchaseorder = ref<purchaseorderM | null>(null);
const loadPurchaseorder = async () => {
  const idPenawaran = props.detailpenawaran?.id_penawaran;
  if (!idPenawaran) {
    purchaseorder.value = null;
    return;
  }

  try {
    const snapshot = await getDocs(
      collection(db, "penawaran", idPenawaran, "purchaseorder"),
    );
    purchaseorder.value = snapshot.docs.length
      ? (snapshot.docs[0].data() as purchaseorderM)
      : null;
  } catch (error) {
    console.error("Gagal mengambil Purchase Order dari penawaran:", error);
    purchaseorder.value = null;
  }
};

onMounted(loadPurchaseorder);
watch(() => props.detailpenawaran?.id_penawaran, loadPurchaseorder);

const purchaseorderSections = computed(() => {
  let itemCount = 0;
  return (purchaseorder.value?.item_purchaseorder || []).map((section) => {
    const items = section.items || [];
    const startIndex = itemCount;
    itemCount += items.length;
    return { ...section, items, startIndex };
  });
});

const purchaseorderDiscountAmount = computed(() => {
  const currentPurchaseorder = purchaseorder.value;
  if (!currentPurchaseorder) return 0;

  const subtotal = Math.max(
    Number(currentPurchaseorder.subtotal_purchaseorder) || 0,
    0,
  );
  const savedNominal = currentPurchaseorder.diskon_nominal_purchaseorder;
  if (savedNominal !== undefined && savedNominal !== null) {
    return Math.min(Math.max(Number(savedNominal) || 0, 0), subtotal);
  }

  const percent = Math.min(
    Math.max(Number(currentPurchaseorder.diskon_purchaseorder) || 0, 0),
    100,
  );
  return subtotal * (percent / 100);
});

const lang = ref<"id" | "en">("en");

const labelSubTotal = ref("TOTAL AMOUNT");

watch(lang, (newLang) => {
  labelSubTotal.value = newLang === "id" ? "TOTAL HARGA" : "TOTAL AMOUNT";
});

const dialogWarna = ref(false);
const warnaBackgroundCustom = ref("#061b3c");
const showTable = ref(true);
const tableBodyRef = ref<HTMLElement | null>(null);
const isSavingPdf = ref(false);

const t = computed(() => {
  if (lang.value === "id") {
    return {
      refNo: "No. Purchase Order",
      date: "Tanggal",
      to: "Kepada",
      attn: "Up.",
      phone: "No. Telp",
      email: "Email",
      address: "Alamat",
      location: "Lokasi",
      subject: "Perihal",
      vessel: "Kapal/Vessel",
      salutationTitle: "Dengan hormat,",
      thDescription: "DESKRIPSI / KETERANGAN",
      thQty: "QTY",
      thUom: "SATUAN",
      thUnitPrice: "HARGA SATUAN",
      subtotal: "SUBTOTAL",
      grandTotal: "GRAND TOTAL",
      amountInWords: "Terbilang",
      closingText:
        "Demikian surat penawaran harga ini kami sampaikan untuk menjadi bahan pertimbangan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.",
      sigHeaderLeft: "Hormat Kami,",
      sigHeaderRight: "Disetujui Oleh,",
      sigRoleRight: "Cap & Tanda Tangan",
    };
  }
  return {
    refNo: "Purchase Order No.",
    date: "PO Date",
    to: "To",
    attn: "Attn",
    phone: "Phone",
    email: "Email",
    location: "Location",
    address: "Address",
    subject: "Subject",
    vessel: "Vessel",
    salutationTitle: "Dear Sir/Madam,",
    thDescription: "DESCRIPTION",
    thQty: "QTY",
    thUom: "UOM",
    thUnitPrice: "UNIT/PRICE",
    subtotal: "SUBTOTAL",
    grandTotal: "GRAND TOTAL",
    amountInWords: "Amount in words",
    closingText:
      "We hereby submit our price quotation for your consideration. Thank you for your attention and cooperation.",
    sigHeaderLeft: "Yours faithfully,",
    sigHeaderRight: "Approve by,",
    sigRoleRight: "Stamp & Signature",
  };
});

function terbilangIndonesia(angka: number): string {
  const bil = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];
  if (angka < 12) return bil[angka];
  if (angka < 20) return terbilangIndonesia(angka - 10) + " Belas";
  if (angka < 100)
    return (
      terbilangIndonesia(Math.floor(angka / 10)) +
      " Puluh " +
      terbilangIndonesia(angka % 10)
    );
  if (angka < 200) return "Seratus " + terbilangIndonesia(angka - 100);
  if (angka < 1000)
    return (
      terbilangIndonesia(Math.floor(angka / 100)) +
      " Ratus " +
      terbilangIndonesia(angka % 100)
    );
  if (angka < 2000) return "Seribu " + terbilangIndonesia(angka - 1000);
  if (angka < 1000000)
    return (
      terbilangIndonesia(Math.floor(angka / 1000)) +
      " Ribu " +
      terbilangIndonesia(angka % 1000)
    );
  if (angka < 1000000000)
    return (
      terbilangIndonesia(Math.floor(angka / 1000000)) +
      " Juta " +
      terbilangIndonesia(angka % 1000000)
    );
  if (angka < 1000000000000)
    return (
      terbilangIndonesia(Math.floor(angka / 1000000000)) +
      " Miliar " +
      terbilangIndonesia(angka % 1000000000)
    );
  return "";
}

function numberToWordsEnglish(n: number): string {
  if (n === 0) return "Zero";
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Fourty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convert(num: number): string {
    if (num < 20) return units[num];
    if (num < 100)
      return (
        tens[Math.floor(num / 10)] + (num % 10 ? " " + units[num % 10] : "")
      );
    if (num < 1000)
      return (
        units[Math.floor(num / 100)] +
        " Hundred" +
        (num % 100 ? " " + convert(num % 100) : "")
      );
    if (num < 1000000)
      return (
        convert(Math.floor(num / 1000)) +
        " Thousand" +
        (num % 1000 ? " " + convert(num % 1000) : "")
      );
    if (num < 1000000000)
      return (
        convert(Math.floor(num / 1000000)) +
        " Million" +
        (num % 1000000 ? " " + convert(num % 1000000) : "")
      );
    return (
      convert(Math.floor(num / 1000000000)) +
      " Billion" +
      (num % 1000000000 ? " " + convert(num % 1000000000) : "")
    );
  }

  return convert(n).trim();
}

const teksTerbilang = computed(() => {
  const total = props.detailpenawaran?.grand_total_penawaran || 0;
  if (!total) return "-";

  if (lang.value === "id") {
    return `${terbilangIndonesia(total).replace(/\s+/g, " ").trim()} Rupiah`;
  }
  return `${numberToWordsEnglish(total).replace(/\s+/g, " ").trim()} Rupiah`;
});

const warnaTeksHeader = computed(() => {
  const hex = warnaBackgroundCustom.value.replace("#", "");
  if (hex.length !== 6) return "#0f2b48";

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#0f2b48" : "#ffffff";
});

const formatTanggal = (tanggal: string) => {
  if (!tanggal) return "-";
  return new Intl.DateTimeFormat(lang.value === "id" ? "id-ID" : "en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(tanggal));
};

const rubahtanggalpenawaran = (tgl: any) => formatTanggal(tgl);
const rupiah = (val: number) => new Intl.NumberFormat("id-ID").format(val || 0);
const formatCurrency = (value: number) => {
  const code = purchaseorder.value?.currency || "IDR";
  const locale = code === "IDR" ? "id-ID" : code === "SGD" ? "en-SG" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    currencyDisplay: "code",
    minimumFractionDigits: code === "IDR" ? 0 : 2,
    maximumFractionDigits: code === "IDR" ? 0 : 2,
  }).format(Number(value) || 0);
};

const loadWatermarkImage = (): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = "/logowatermark.png";
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
};

type PdfTextFragment = {
  text: string;
  left: number;
  top: number;
  height: number;
  baseline: number;
  fontSizePx: number;
  fontWeight: number;
  isItalic: boolean;
  color: [number, number, number];
  alignment: "left" | "center";
};

const parseCssColor = (value: string): [number, number, number] => {
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  return channels?.length === 3
    ? [channels[0], channels[1], channels[2]]
    : [30, 41, 59];
};

const applyTextTransform = (text: string, transform: string) => {
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  if (transform === "capitalize") {
    return text.replace(/(^|\s)\S/g, (character) => character.toUpperCase());
  }
  return text;
};

// The visual layer only contains backgrounds, borders and images. Text is
// written as native PDF text so it stays sharp without a large bitmap.
const extractPdfTextFragments = (root: Element): PdfTextFragment[] => {
  const rootRect = root.getBoundingClientRect();
  const fragments: PdfTextFragment[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  let textNode = walker.nextNode() as Text | null;
  while (textNode) {
    const parent = textNode.parentElement;
    const sourceText = textNode.data;
    if (
      parent &&
      sourceText.trim() &&
      !parent.closest(".no-print, .drag-icon, .no-print-cell")
    ) {
      const style = window.getComputedStyle(parent);
      const fontSizePx = Number.parseFloat(style.fontSize);
      if (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) !== 0 &&
        fontSizePx > 0 &&
        parent.getClientRects().length
      ) {
        type CharacterRect = { character: string; rect: DOMRect };
        let currentLine: CharacterRect[] = [];
        let currentTop: number | null = null;
        const range = document.createRange();

        const flushLine = () => {
          const firstVisible = currentLine.findIndex(
            ({ character }) => !/\s/.test(character),
          );
          let lastVisible = currentLine.length - 1;
          while (
            lastVisible >= firstVisible &&
            /\s/.test(currentLine[lastVisible]?.character || "")
          ) {
            lastVisible--;
          }

          if (firstVisible >= 0 && lastVisible >= firstVisible) {
            const visibleCharacters = currentLine.slice(
              firstVisible,
              lastVisible + 1,
            );
            const centeredSignatureLine = parent.closest(".sig-person-name");
            const lineTop = Math.min(
              ...visibleCharacters.map(({ rect }) => rect.top),
            );
            const lineBottom = Math.max(
              ...visibleCharacters.map(({ rect }) => rect.bottom),
            );
            const normalizedText = visibleCharacters
              .map(({ character }) => character)
              .join("")
              .replace(/\s+/g, " ");

            fragments.push({
              text: applyTextTransform(normalizedText, style.textTransform),
              left: centeredSignatureLine
                ? centeredSignatureLine.getBoundingClientRect().left -
                  rootRect.left +
                  centeredSignatureLine.getBoundingClientRect().width / 2
                : visibleCharacters[0].rect.left - rootRect.left,
              top: lineTop - rootRect.top,
              height: lineBottom - lineTop,
              baseline: lineTop - rootRect.top + (lineBottom - lineTop) * 0.8,
              fontSizePx,
              fontWeight: Number.parseInt(style.fontWeight, 10) || 400,
              isItalic: style.fontStyle === "italic",
              color: parseCssColor(style.color),
              alignment: centeredSignatureLine ? "center" : "left",
            });
          }

          currentLine = [];
          currentTop = null;
        };

        for (let index = 0; index < sourceText.length; index++) {
          const character = sourceText[index];
          if (character === "\n" || character === "\r") {
            flushLine();
            continue;
          }

          range.setStart(textNode, index);
          range.setEnd(textNode, index + 1);
          const rect = range.getBoundingClientRect();
          if (!rect.width && !rect.height) continue;

          if (currentTop !== null && Math.abs(rect.top - currentTop) > 0.75) {
            flushLine();
          }
          if (currentTop === null) currentTop = rect.top;
          currentLine.push({ character, rect });
        }
        flushLine();
      }
    }

    textNode = walker.nextNode() as Text | null;
  }

  return fragments;
};

const handlePrint = async () => {
  const offerElement = document.getElementById("purchaseorder-to-print");
  const letterheadElement = offerElement?.querySelector(".letterhead");
  const contentElement = offerElement?.querySelector(".content-body");
  const footerElement = offerElement?.querySelector(".page-footer");
  if (!letterheadElement || !contentElement || !footerElement) return;

  const { default: html2canvas } = await import("html2canvas");
  const watermarkImage = await loadWatermarkImage();
  const canvasOptions = {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    onclone: (clonedDocument: Document) => {
      clonedDocument
        .querySelectorAll(".no-print, .no-print-cell, .drag-icon")
        .forEach(
          (element) => ((element as HTMLElement).style.display = "none"),
        );
      clonedDocument
        .querySelectorAll(".print-only-cell")
        .forEach(
          (element) => ((element as HTMLElement).style.display = "table-cell"),
        );
    },
  };
  const [letterheadCanvas, contentCanvas, footerCanvas] = await Promise.all([
    html2canvas(letterheadElement as HTMLElement, canvasOptions),
    html2canvas(contentElement as HTMLElement, canvasOptions),
    html2canvas(footerElement as HTMLElement, canvasOptions),
  ]);

  const pageWidth = 1240;
  const pageHeight = 1754;
  const sideMargin = 80;
  const topMargin = 48;
  const footerMargin = 48;
  const contentWidth = pageWidth - sideMargin * 2;
  const letterheadHeight = Math.round(
    (letterheadCanvas.height * contentWidth) / letterheadCanvas.width,
  );
  const footerHeight = Math.round(
    (footerCanvas.height * contentWidth) / footerCanvas.width,
  );
  const contentTop = topMargin + letterheadHeight + 36;
  const contentBottom = pageHeight - footerMargin - footerHeight - 30;
  const sourceSliceHeight = Math.floor(
    ((contentBottom - contentTop) * contentCanvas.width) / contentWidth,
  );

  const pages: string[] = [];
  for (
    let sourceY = 0;
    sourceY < contentCanvas.height;
    sourceY += sourceSliceHeight
  ) {
    const sliceHeight = Math.min(
      sourceSliceHeight,
      contentCanvas.height - sourceY,
    );
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = pageWidth;
    pageCanvas.height = pageHeight;
    const context = pageCanvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, pageWidth, pageHeight);

    context.drawImage(
      letterheadCanvas,
      sideMargin,
      topMargin,
      contentWidth,
      letterheadHeight,
    );
    context.drawImage(
      footerCanvas,
      sideMargin,
      pageHeight - footerMargin - footerHeight,
      contentWidth,
      footerHeight,
    );
    context.drawImage(
      contentCanvas,
      0,
      sourceY,
      contentCanvas.width,
      sliceHeight,
      sideMargin,
      contentTop,
      contentWidth,
      (sliceHeight * contentWidth) / contentCanvas.width,
    );
    // Watermark transparan di belakang konten setiap halaman print
    const watermarkWidth = 540;
    const watermarkHeight =
      (watermarkImage.height / watermarkImage.width) * watermarkWidth;
    context.save();
    context.globalAlpha = 0.105;
    context.drawImage(
      watermarkImage,
      (pageWidth - watermarkWidth) / 2,
      (pageHeight - watermarkHeight) / 2,
      watermarkWidth,
      watermarkHeight,
    );
    context.restore();

    pages.push(pageCanvas.toDataURL("image/png"));
  }

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed; width:0; height:0; border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.write(`
    <html><head><title>Purchase_Order_${purchaseorder.value?.no_purchaseorder || props.detailpenawaran?.no_penawaran || "DRM"}</title>
    <style>@page { size: A4; margin: 0; } body { margin: 0; } .page { display: block; width: 210mm; height: 297mm; break-after: page; }</style>
    </head><body>${pages.map((page) => `<img class="page" src="${page}" />`).join("")}</body></html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 600);
};

const createPaginatedPurchaseorderPdf = async () => {
  const offerElement = document.getElementById("purchaseorder-to-print");
  const letterheadElement = offerElement?.querySelector(".letterhead");
  const contentElement = offerElement?.querySelector(".content-body");
  const footerElement = offerElement?.querySelector(".page-footer");
  if (!offerElement || !letterheadElement || !contentElement || !footerElement) {
    return null;
  }

  // The preview is scaled by its parent on mobile. Remove that transform only
  // while measuring and capturing so every PDF uses the original A4 layout.
  const previewContainer = offerElement.closest<HTMLElement>(".po-content");
  previewContainer?.classList.add("purchaseorder-pdf-unscaled");
  offerElement.classList.add("purchaseorder-pdf-capture");
  void offerElement.offsetHeight;

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    await document.fonts?.ready;

    const letterheadRect = letterheadElement.getBoundingClientRect();
    const contentRect = contentElement.getBoundingClientRect();
    const letterheadTextFragments = extractPdfTextFragments(letterheadElement);
    const contentTextFragments = extractPdfTextFragments(contentElement);

    const preparePrintClone = (clonedDocument: Document) => {
      clonedDocument
        .querySelectorAll(".no-print, .drag-icon, .no-print-cell")
        .forEach((element) => {
          (element as HTMLElement).style.display = "none";
        });
      clonedDocument
        .querySelectorAll(".print-only-cell")
        .forEach((element) => {
          (element as HTMLElement).style.display = "table-cell";
        });
      clonedDocument
        .querySelectorAll(".modern-table tbody tr")
        .forEach((element) => {
          (element as HTMLElement).style.breakInside = "avoid";
          (element as HTMLElement).style.pageBreakInside = "avoid";
        });
      clonedDocument
        .querySelectorAll(".modern-table tbody td")
        .forEach((element) => {
          (element as HTMLElement).style.verticalAlign = "top";
        });

      clonedDocument
        .querySelectorAll("#purchaseorder-to-print *")
        .forEach((element) => {
          const htmlElement = element as HTMLElement;
          htmlElement.style.setProperty("color", "transparent", "important");
          htmlElement.style.setProperty(
            "-webkit-text-fill-color",
            "transparent",
            "important",
          );
          htmlElement.style.setProperty("text-shadow", "none", "important");
        });
    };

    const isSmallViewport = window.matchMedia("(max-width: 600px)").matches;
    const requestedCaptureScale = isSmallViewport ? 2 : 3;
    const maxContentCanvasPixels = isSmallViewport ? 12_000_000 : 40_000_000;
    const safeContentScale = Math.sqrt(
      maxContentCanvasPixels / (contentRect.width * contentRect.height),
    );
    const captureScale = Math.max(
      1,
      Math.min(requestedCaptureScale, safeContentScale),
    );
    const captureOptions = {
      scale: captureScale,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: preparePrintClone,
    };
    const [letterheadCanvas, footerCanvas, contentCanvas, watermarkImage] =
      await Promise.all([
        html2canvas(letterheadElement as HTMLElement, captureOptions),
        html2canvas(footerElement as HTMLElement, captureOptions),
        html2canvas(contentElement as HTMLElement, captureOptions),
        loadWatermarkImage(),
      ]);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
      putOnlyUsedFonts: true,
      precision: 4,
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const sideMargin = 18;
    const topMargin = 8;
    const footerMargin = 8;
    const contentWidth = pageWidth - sideMargin * 2;
    const letterheadHeight =
      (letterheadCanvas.height * contentWidth) / letterheadCanvas.width;
    const footerHeight =
      (footerCanvas.height * contentWidth) / footerCanvas.width;
    const contentTop = topMargin + letterheadHeight + 6;
    const contentBottom = pageHeight - footerMargin - footerHeight;
    const printableContentHeight = contentBottom - contentTop;
    const pixelsPerMm = contentCanvas.width / contentWidth;
    const pageSliceHeight = Math.floor(printableContentHeight * pixelsPerMm);

    const drawPdfTextFragments = (
      fragments: PdfTextFragment[],
      originX: number,
      originY: number,
      mmPerCssPixel: number,
      sourceTop = 0,
      sourceBottom = Number.POSITIVE_INFINITY,
    ) => {
      fragments.forEach((fragment) => {
        const fragmentMiddle = fragment.top + fragment.height / 2;
        if (fragmentMiddle < sourceTop || fragmentMiddle >= sourceBottom) return;

        const fontStyle = fragment.isItalic
          ? fragment.fontWeight >= 600
            ? "bolditalic"
            : "italic"
          : fragment.fontWeight >= 600
            ? "bold"
            : "normal";
        pdf.setFont("helvetica", fontStyle);
        pdf.setFontSize(
          fragment.fontSizePx * mmPerCssPixel * (72 / 25.4),
        );
        pdf.setTextColor(...fragment.color);
        pdf.text(
          fragment.text,
          originX + fragment.left * mmPerCssPixel,
          originY + (fragment.baseline - sourceTop) * mmPerCssPixel,
          { align: fragment.alignment },
        );
      });
    };

    const canvasScale = contentCanvas.width / contentRect.width;
    const keepTogetherRanges: Array<{ top: number; bottom: number }> = [];
    contentElement
      .querySelectorAll(".modern-table tbody tr")
      .forEach((row) => {
        const rect = row.getBoundingClientRect();
        const range = {
          top: Math.floor((rect.top - contentRect.top) * canvasScale) - 2,
          bottom: Math.ceil((rect.bottom - contentRect.top) * canvasScale) + 2,
        };
        if (range.bottom - range.top <= pageSliceHeight) {
          keepTogetherRanges.push(range);
        }
      });

    // Totals and signatures must not be cut between pages.
    [".modern-table tfoot", ".closing-paragraph", ".signatures-wrapper"].forEach(
      (selector) => {
        contentElement.querySelectorAll<HTMLElement>(selector).forEach((block) => {
          const rect = block.getBoundingClientRect();
          const range = {
            top: Math.floor((rect.top - contentRect.top) * canvasScale) - 2,
            bottom: Math.ceil((rect.bottom - contentRect.top) * canvasScale) + 2,
          };
          if (range.bottom - range.top <= pageSliceHeight) {
            keepTogetherRanges.push(range);
          }
        });
      },
    );

    const watermarkCanvas = document.createElement("canvas");
    watermarkCanvas.width = 600;
    watermarkCanvas.height = Math.round(
      (watermarkImage.height / watermarkImage.width) * watermarkCanvas.width,
    );
    const watermarkContext = watermarkCanvas.getContext("2d");
    if (watermarkContext) {
      watermarkContext.fillStyle = "#ffffff";
      watermarkContext.fillRect(
        0,
        0,
        watermarkCanvas.width,
        watermarkCanvas.height,
      );
      watermarkContext.globalAlpha = 0.105;
      watermarkContext.drawImage(
        watermarkImage,
        0,
        0,
        watermarkCanvas.width,
        watermarkCanvas.height,
      );
    }

    const toLosslessPdfImage = (canvas: HTMLCanvasElement) =>
      canvas.toDataURL("image/png");
    const letterheadImage = toLosslessPdfImage(letterheadCanvas);
    const footerImage = toLosslessPdfImage(footerCanvas);
    const watermarkImageData = watermarkCanvas.toDataURL("image/jpeg", 0.92);
    const watermarkWidth = 105;
    const watermarkHeight =
      (watermarkCanvas.height / watermarkCanvas.width) * watermarkWidth;

    const addPageFrame = () => {
      pdf.addImage(
        watermarkImageData,
        "JPEG",
        (pageWidth - watermarkWidth) / 2,
        (pageHeight - watermarkHeight) / 2,
        watermarkWidth,
        watermarkHeight,
        "purchaseorder-watermark",
        "FAST",
      );
      pdf.addImage(
        letterheadImage,
        "PNG",
        sideMargin,
        topMargin,
        contentWidth,
        letterheadHeight,
        "purchaseorder-letterhead",
        "SLOW",
      );
      pdf.addImage(
        footerImage,
        "PNG",
        sideMargin,
        pageHeight - footerMargin - footerHeight,
        contentWidth,
        footerHeight,
        "purchaseorder-footer",
        "SLOW",
      );
      drawPdfTextFragments(
        letterheadTextFragments,
        sideMargin,
        topMargin,
        contentWidth / letterheadRect.width,
        0,
        letterheadRect.height,
      );
    };

    const createContentSlice = (sliceStart: number, sliceHeight: number) => {
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = contentCanvas.width;
      sliceCanvas.height = sliceHeight;
      sliceCanvas
        .getContext("2d")
        ?.drawImage(
          contentCanvas,
          0,
          sliceStart,
          contentCanvas.width,
          sliceHeight,
          0,
          0,
          contentCanvas.width,
          sliceHeight,
        );
      return sliceCanvas;
    };

    let sourceY = 0;
    let pageIndex = 0;
    while (sourceY < contentCanvas.height) {
      const remainingHeight = contentCanvas.height - sourceY;
      const finalPageScale = Math.min(1, pageSliceHeight / remainingHeight);

      if (finalPageScale >= 0.92) {
        if (pageIndex > 0) pdf.addPage();

        const finalPageCanvas = createContentSlice(sourceY, remainingHeight);
        const fittedContentWidth = contentWidth * finalPageScale;
        const fittedContentHeight =
          (remainingHeight / pixelsPerMm) * finalPageScale;

        addPageFrame();
        pdf.addImage(
          toLosslessPdfImage(finalPageCanvas),
          "PNG",
          sideMargin + (contentWidth - fittedContentWidth) / 2,
          contentTop,
          fittedContentWidth,
          fittedContentHeight,
          `purchaseorder-content-${pageIndex}`,
          "SLOW",
        );
        drawPdfTextFragments(
          contentTextFragments,
          sideMargin + (contentWidth - fittedContentWidth) / 2,
          contentTop,
          (contentWidth / contentRect.width) * finalPageScale,
          sourceY / canvasScale,
          contentCanvas.height / canvasScale,
        );
        break;
      }

      let targetY = Math.min(sourceY + pageSliceHeight, contentCanvas.height);
      const crossingRange = keepTogetherRanges.find(
        (range) =>
          range.top > sourceY &&
          range.top < targetY &&
          range.bottom > targetY,
      );
      if (crossingRange) targetY = crossingRange.top;
      if (pageIndex > 0) pdf.addPage();

      const sliceHeight = targetY - sourceY;
      const sliceCanvas = createContentSlice(sourceY, sliceHeight);

      addPageFrame();
      pdf.addImage(
        toLosslessPdfImage(sliceCanvas),
        "PNG",
        sideMargin,
        contentTop,
        contentWidth,
        sliceHeight / pixelsPerMm,
        `purchaseorder-content-${pageIndex}`,
        "SLOW",
      );
      drawPdfTextFragments(
        contentTextFragments,
        sideMargin,
        contentTop,
        contentWidth / contentRect.width,
        sourceY / canvasScale,
        targetY / canvasScale,
      );

      sourceY = targetY;
      pageIndex++;
    }

    return pdf;
  } finally {
    offerElement.classList.remove("purchaseorder-pdf-capture");
    previewContainer?.classList.remove("purchaseorder-pdf-unscaled");
  }
};

const getPurchaseorderPdfFilename = () => {
  const rawPoNumber =
    purchaseorder.value?.no_purchaseorder ||
    purchaseorder.value?.id_purchaseorder ||
    props.detailpenawaran?.no_penawaran ||
    "00000";
  const poNumberParts = rawPoNumber
    .split(/[/-]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const yearFromPoNumber = poNumberParts.find((part) => /^\d{4}$/.test(part));
  const purchaseorderDate = moment(purchaseorder.value?.tgl_purchaseorder);
  const year =
    yearFromPoNumber ||
    (purchaseorderDate.isValid()
      ? purchaseorderDate.format("YYYY")
      : moment().format("YYYY"));
  const poNumber = (poNumberParts.at(-1) || "00000")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `DRM-PO-${year}-${poNumber || "00000"}.pdf`;
};

const handleSavePdf = async () => {
  if (isSavingPdf.value) return;
  isSavingPdf.value = true;

  try {
    const pdf = await createPaginatedPurchaseorderPdf();
    if (!pdf) return;
    pdf.save(getPurchaseorderPdfFilename());
  } catch (error) {
    console.error("Gagal membuat PDF purchase order:", error);
  } finally {
    isSavingPdf.value = false;
  }
};
</script>

<style scoped>
.offer-card {
  width: 210mm;
  min-height: 297mm;
  padding: 2mm 18mm 25mm 18mm;
  margin: 0 auto;
  background: #ffffff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 35px rgba(15, 23, 42, 0.1);
  font-family:
    "Segoe UI",
    -apple-system,
    BlinkMacSystemFont,
    Roboto,
    sans-serif;
  color: #1e293b;
  box-sizing: border-box;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

:global(.po-content.purchaseorder-pdf-unscaled) {
  transform: none !important;
}

.watermark {
  position: absolute;
  top: 67%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.105;
  width: 540px;
  z-index: 0;
  pointer-events: none;
}
.watermark img {
  width: 540px;
}

.header-section {
  display: grid;
  grid-template-columns: 130px minmax(0, 1fr) 130px;
  align-items: center;
  position: relative;
  z-index: 1;
  padding: 2px 0 8px;
}

.logo-wrapper img {
  height: auto;
  display: block;
}

.letterhead-info {
  text-align: center;
}

.company-name {
  font-size: 26px;
  font-weight: 800;
  color: #0f2b48;
  letter-spacing: 0.3px;
  margin: 0;
  line-height: 1.2;
}

.address-line,
.phone-line {
  font-size: 9.5px;
  line-height: 1.4;
  margin: 1px 0 0;
}

.header-divider {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 6px;
  margin-bottom: 6px;
}

.accent-bar {
  height: 4px;
  width: 100%;
  border-radius: 2px;
  transition: background-color 0.2s ease;
}

.secondary-bar {
  height: 1px;
  width: 100%;
  background-color: #cbd5e1;
}

.content-body {
  position: relative;
  z-index: 1;
}

.doc-meta-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.doc-badge {
  font-size: 11px;
  font-weight: 800;
  color: #0f2b48;
  letter-spacing: 0.8px;
  padding: 3px 10px;

  background: #f8fafc;
  text-transform: uppercase;
}

.info-grid-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  padding: 14px 0;
  margin-bottom: 14px;
  color: #102744;
}

.info-heading {
  margin: 0 0 9px;
  color: #102744;
  font-size: 11px;
  font-weight: 700;
}

.meta-row {
  display: flex;
  align-items: flex-start;
  font-size: 10.5px;
  line-height: 1.35;
  margin-bottom: 3px;
}
.meta-row:last-child {
  margin-bottom: 0;
}

.meta-row .lbl {
  width: 100px;
  flex-shrink: 0;
}

.meta-row .sep {
  width: 12px;
  flex-shrink: 0;
}

.meta-row .val {
  min-width: 0;
}

.text-salutation {
  font-size: 11px;
  line-height: 1.5;
  color: #334155;
  margin-bottom: 12px;
}

.salutation-title {
  font-weight: 700;
  margin-bottom: 0px;
  color: #0f2b48;
}

.salutation-body {
  text-align: justify;
  margin: 0;
}

.table-container {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  margin-bottom: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10.5px;
}

.modern-table th {
  padding: 7px 10px;
  font-weight: 700;
  font-size: 9.5px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 1px solid #cbd5e1;
  transition: color 0.3s ease;
}

.modern-table td {
  padding: 7px 10px;
  color: #334155;
  vertical-align: middle;
  border-bottom: 1px solid #f1f5f9;
}

.modern-table tbody tr.zebra-row {
  background-color: #f8fafc;
}

.modern-table tbody tr.section-row td {
  padding: 8px 10px 4px;
  color: #0f2b48;
  background-color: #f8fafc;
  border-bottom: 0;
}

.section-description {
  margin-top: 2px;
  color: #475569;
  font-weight: 400;
}

.modern-table tbody tr:last-child td {
  border-bottom: 1px solid #cbd5e1;
}

.modern-table tfoot .summary-row td {
  padding: 6px 10px;
  font-size: 10px;
  letter-spacing: 0.3px;
  border-bottom: 1px solid #e2e8f0;
}

.modern-table tfoot .subtotal-row {
  background-color: #f8fafc;
}

.modern-table tfoot .grand-total-row {
  background-color: #f1f5f9;
}

.gt-text {
  font-size: 11.5px !important;
}

.terbilang-row td {
  background-color: #f8fafc;
  padding: 8px 10px !important;
  border-bottom: none !important;
}

.terbilang-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
}

.terbilang-lbl {
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.5px;
}

.terbilang-val {
  font-style: italic;
  font-weight: 700;
  color: #0f2b48;
}

.drag-handle {
  cursor: move !important;
  user-select: none;
}

.drag-icon {
  opacity: 0.4;
  transition: opacity 0.2s;
}

.drag-handle:hover .drag-icon {
  opacity: 1;
}

.row-num {
  color: #64748b;
  font-weight: 600;
}

.print-only-cell {
  display: none;
}

.offer-card.purchaseorder-pdf-capture .no-print,
.offer-card.purchaseorder-pdf-capture .drag-icon,
.offer-card.purchaseorder-pdf-capture .no-print-cell {
  display: none !important;
}

.offer-card.purchaseorder-pdf-capture .print-only-cell {
  display: table-cell !important;
}

.closing-paragraph {
  font-size: 10.5px;
  color: #475569;
  line-height: 1.4;
  margin-bottom: 20px;
}

.signatures-wrapper {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  page-break-inside: avoid;
}

.sig-block {
  width: 260px;
  text-align: center;
}

.sig-header {
  font-size: 10.5px;
  font-weight: 600;
  color: #475569;
  margin: 0;
}

.sig-sub {
  font-size: 9.5px;
  font-weight: 700;
  color: #0f2b48;
  margin: 2px 0 0 0;
  text-transform: uppercase;
}

.sig-img-container {
  height: 95px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sig-image {
  max-height: 95px;
  max-width: 130px;
  object-fit: contain;
}

.sig-placeholder {
  height: 95px;
}

.sig-person-name {
  font-size: 10.5px;
  font-weight: 700;
  color: #0f2b48;
  margin: 0;
  border-bottom: 1px solid #94a3b8;
  padding-bottom: 2px;
}

.sig-person-role {
  font-size: 9px;
  color: #64748b;
  margin-top: 2px;
}

.page-footer {
  position: absolute;
  bottom: 0;
  left: 18mm;
  right: 18mm;
  height: 12mm;
  z-index: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
}

.footer-line {
  width: 100%;
  height: 1px;
  background-color: #cbd5e1;
}

.text-navy {
  color: #0f2b48;
}
.text-slate-800 {
  color: #1e293b;
}
.text-slate-600 {
  color: #475569;
}
.text-slate-500 {
  color: #64748b;
}
.text-slate-400 {
  color: #94a3b8;
}
.uppercase {
  text-transform: uppercase;
}

.theme-btn {
  background: transparent !important;
  box-shadow: none !important;
}

:deep(.header-input-field input) {
  text-align: right !important;
  font-size: 9.5px !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  color: var(--header-text-color, #0f2b48) !important;
  padding: 0 !important;
  min-height: unset !important;
  transition: color 0.3s ease;
}

:deep(.header-input-field .v-field__input) {
  padding: 0 !important;
  min-height: 18px !important;
}

@media print {
  .no-print {
    display: none !important;
  }
}

.document-actions {
  gap: 16px;
}

@media (max-width: 600px) {
  .document-actions {
    padding: 0 16px;
  }

  .quotation-action-btn {
    width: 100% !important;
  }
}
</style>
