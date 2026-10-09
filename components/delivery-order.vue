<script setup lang="ts">
import type { invoiceM } from "~/types/invoice";

const props = defineProps<{
  invoiceDetail: invoiceM;
}>();

const printArea = ref<HTMLElement | null>(null);
const isSavingPdf = ref(false);

const formatTanggal = (tanggal: string) => {
  if (!tanggal) return "-";

  const date = new Date(tanggal);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(date)
    .replace(/\//g, "-");
};

const formatTanggalPanjang = (tanggal: string | undefined | null) => {
  if (!tanggal) return "-";

  const date = new Date(tanggal);

  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

function printDeliveryOrder() {
  const content = printArea.value;

  if (!content) return;

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    console.error("Tidak dapat membuka print window.");
    return;
  }

  /* Ambil semua CSS dari halaman */
  const styles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]'),
  )
    .map((style) => style.outerHTML)
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>

    <html>

      <head>

        <meta charset="UTF-8" />

        <title>
          Delivery Order
        </title>

        ${styles}

        <style>

          


          html,
          body {
            margin: 0 !important;
            padding: 0 !important;

            width: 100% !important;

            background: #ffffff !important;

            font-family: Arial, Helvetica, sans-serif;
          }


          


          .delivery-order-wrapper {
            width: 100% !important;

            margin: 0 !important;
            padding: 0 !important;
          }


          


          .no-print {
            display: none !important;
          }


          


          .invoice-paper {
            width: 210mm !important;

            min-width: 210mm !important;
            max-width: 210mm !important;

            min-height: 297mm !important;

            margin: 0 !important;

            padding: 15mm !important;

            box-sizing: border-box !important;

            background: #ffffff !important;

            border: none !important;

            border-radius: 0 !important;

            box-shadow: none !important;

            overflow: hidden !important;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }

          .main-table {
            page-break-inside: auto;
          }

          .main-table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }


          .signature-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

        </style>

      </head>


      <body>

        ${content.innerHTML}


        <script>

          window.onload = function () {

            setTimeout(function () {

              window.print();

            }, 300);

          };


          window.onafterprint = function () {

            window.close();

          };

        <\/script>

      </body>

    </html>
  `);

  printWindow.document.close();
}

const handleSavePdf = async () => {
  const targetElement = printArea.value;

  if (!targetElement || isSavingPdf.value) return;

  isSavingPdf.value = true;

  try {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    // Clone element supaya tampilan asli tidak terganggu
    const clonedElement = targetElement.cloneNode(true) as HTMLElement;

    // Buat container sementara
    const tempContainer = document.createElement("div");

    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-99999px";
    tempContainer.style.top = "0";
    tempContainer.style.width = "850px";
    tempContainer.style.background = "#ffffff";
    tempContainer.style.padding = "0";
    tempContainer.style.margin = "0";

    tempContainer.appendChild(clonedElement);
    document.body.appendChild(tempContainer);

    // Hilangkan tombol/action dari PDF
    clonedElement.querySelectorAll(".no-print").forEach((element) => {
      (element as HTMLElement).style.display = "none";
    });

    // Hilangkan shadow dan border card
    clonedElement.querySelectorAll(".invoice-paper").forEach((element) => {
      const el = element as HTMLElement;

      el.style.boxShadow = "none";
      el.style.border = "none";
      el.style.borderRadius = "0";
    });

    // Pastikan background putih
    clonedElement.style.background = "#ffffff";

    // Tunggu gambar/logo selesai load
    const images = Array.from(clonedElement.querySelectorAll("img"));

    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();

        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      }),
    );

    // Render HTML menjadi canvas
    const canvas = await html2canvas(clonedElement, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 15000,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 850,
    });

    // Hapus temporary element
    document.body.removeChild(tempContainer);

    // =========================
    // CREATE PDF
    // =========================

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Rasio canvas -> PDF
    const ratio = pdfWidth / canvasWidth;

    // Tinggi canvas yang muat dalam 1 halaman A4
    const pageCanvasHeight = Math.floor(pdfHeight / ratio);

    let offsetY = 0;
    let pageIndex = 0;

    while (offsetY < canvasHeight) {
      if (pageIndex > 0) {
        pdf.addPage();
      }

      const remainingHeight = canvasHeight - offsetY;

      const currentCanvasHeight = Math.min(pageCanvasHeight, remainingHeight);

      // Canvas untuk halaman ini
      const pageCanvas = document.createElement("canvas");

      pageCanvas.width = canvasWidth;
      pageCanvas.height = currentCanvasHeight;

      const ctx = pageCanvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas context tidak tersedia.");
      }

      ctx.fillStyle = "#ffffff";

      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      // Potong bagian canvas sesuai halaman
      ctx.drawImage(
        canvas,
        0,
        offsetY,
        canvasWidth,
        currentCanvasHeight,
        0,
        0,
        canvasWidth,
        currentCanvasHeight,
      );

      const imageData = pageCanvas.toDataURL("image/jpeg", 0.95);

      // Tinggi gambar dalam PDF
      const imageHeight = currentCanvasHeight * ratio;

      pdf.addImage(
        imageData,
        "JPEG",
        0,
        0,
        pdfWidth,
        imageHeight,
        undefined,
        "FAST",
      );

      offsetY += currentCanvasHeight;
      pageIndex++;
    }

    // =========================
    // FILE NAME
    // =========================

    const year = new Date().getFullYear();

    // invoiceDetail adalah props, JANGAN pakai .value
    const invoiceId = props.invoiceDetail?.id || "DO";

    pdf.save(`Delivery-Order-DRM-${year}.pdf`);
  } catch (error) {
    console.error("Gagal menyimpan PDF Delivery Order:", error);

    alert(
      "Gagal membuat PDF. Silakan buka Console (F12) untuk melihat detail error.",
    );
  } finally {
    isSavingPdf.value = false;
  }
};
</script>

<template>
  <div class="delivery-order-wrapper">
    <div ref="printArea" class="invoice-paper-wrapper">
      <v-card width="850" class="pa-10 invoice-paper elevation-2 mx-auto">
        <!-- HEADER -->

        <div class="header-section text-center mb-6">
          <div class="d-flex align-center justify-center mb-2">
            <img
              src="/Logo-DRM.png"
              class="logo-header mr-3"
              alt="Logo Perusahaan"
            />

            <h1 class="company-name">PT. DUTA RAYA MARINE</h1>
          </div>

          <div class="company-address">
            Ruko Dream Land Blok A No.05, Dreamland Square, Marina City, <br />
            Tanjung Riau, Kec. Sekupang, Kota Batam 29425.

            <br />

            Hp. +62853 6201 8099
          </div>

          <div class="document-title mt-4">DELIVERY ORDER</div>
        </div>

        <!-- =========================================
             CUSTOMER / INVOICE INFO
        ========================================== -->

        <div class="info-section mb-6">
          <table class="info-table">
            <tbody>
              <tr>
                <td width="140">Company Name</td>

                <td width="15">:</td>

                <td>
                  {{ invoiceDetail.nama_customer }}
                </td>
              </tr>

              <tr>
                <td style="vertical-align: top">Address</td>

                <td style="vertical-align: top">:</td>

                <td style="vertical-align: top">
                  {{ invoiceDetail.alamat_customer }}
                </td>
              </tr>

              <tr>
                <td>Quotation No.</td>

                <td>:</td>

                <td>{{ invoiceDetail.no_penawaran }}</td>
              </tr>

              <tr>
                <td>PO No.</td>

                <td>:</td>

                <td>{{ invoiceDetail.no_preorder }}</td>
              </tr>

              <tr>
                <td>Invoice No.</td>

                <td>:</td>

                <td>INV/DRM/2026/{{ invoiceDetail.no_inv }}</td>
              </tr>

              <tr>
                <td>Vessel</td>

                <td>:</td>

                <td>
                  {{ (invoiceDetail as any).vessel || "-" }}
                </td>
              </tr>

              <tr>
                <td>Location</td>

                <td>:</td>

                <td>Batam</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- =========================================
             ITEM TABLE
        ========================================== -->

        <table class="main-table mb-6">
          <thead>
            <tr>
              <th width="4%" class="text-center">No</th>

              <th width="47%">Desc</th>

              <th width="15%" class="text-center">Qty</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(item, index) in invoiceDetail.item_pekerjaan"
              :key="'do-item-' + index"
            >
              <td class="text-center v-align-top" v-if="item.kategori_item == 'Barang' || item.kategori_item == 'Barang & Jasa'">{{ index + 1 }}.</td>

              <td class="v-align-top" v-if="item.kategori_item == 'Barang' || item.kategori_item == 'Barang & Jasa'">
                <div style="white-space: pre-line">
                  {{ item.nama }}
                </div>
              </td>

              <td class="text-center v-align-top" v-if="item.kategori_item == 'Barang' || item.kategori_item == 'Barang & Jasa'">
                {{ item.qty }}

                {{ item.uom || "Unit" }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- =========================================
             SIGNATURE
        ========================================== -->

        <div class="signature-section mt-6 page-break-section">
          <div class="mb-4 text-caption">
            Received by :
            {{
              formatTanggalPanjang(invoiceDetail.tanggal)
            }}
            <!-- ___ / __________ / 20___ -->
          </div>

          <div class="stamp-box mb-3"></div>

          <div class="received-details">
            <div class="d-flex align-center mb-1">
              <span class="label-field"> Name </span>

              <span>
                : ...........................................................
              </span>
            </div>

            <div class="d-flex align-center">
              <span class="label-field"> Date </span>

              <span>
                : ...........................................................
              </span>
            </div>
          </div>
        </div>
      </v-card>
    </div>
    <div class="no-print action-bar d-flex justify-center gap-2 mt-4">

      <v-btn
        color="red"
        variant="elevated"
        prepend-icon="mdi-file-pdf-box"
        :loading="isSavingPdf"
        @click="handleSavePdf"
      >
        Save PDF Delivery Order
      </v-btn>
       <v-btn
        color="primary"
        variant="elevated"
        prepend-icon="mdi-printer"
        class="ml-2"
        @click="printDeliveryOrder"
      >
        Cetak Delivery Order
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.delivery-order-wrapper {
  width: 100%;
  margin-top: 20px;
}

.action-bar {
  width: 100%;
  max-width: 850px;

  margin: 0 auto;
}

.invoice-paper-wrapper {
  width: 100%;
}

.invoice-paper {
  font-family: Arial, Helvetica, sans-serif;

  color: #000;

  line-height: 1.4;

  background-color: #fff !important;
}

.logo-header {
  width: 70px;

  max-width: 70px;

  height: auto;

  object-fit: contain;
}

.company-name {
  font-size: 24px;

  font-weight: 800;

  letter-spacing: 0.5px;

  margin: 0;
}

.company-address {
  font-size: 11px;

  font-weight: 600;

  line-height: 1.3;
}

.document-title {
  font-size: 18px;

  font-weight: bold;

  letter-spacing: 1px;

  text-decoration: underline;
}

.info-table {
  width: 100%;

  border-collapse: collapse;

  font-size: 13px;
}

.info-table td {
  padding: 2px 0;

  font-weight: 600;
}

.main-table {
  width: 100%;

  border-collapse: collapse;
}

.main-table th {
  border: 1px solid #000;

  padding: 6px 8px;

  font-weight: bold;

  font-size: 13px;

  text-align: left;

  background-color: transparent !important;
}

.main-table td {
  border: 1px solid #000;

  padding: 6px 8px;

  font-size: 13px;
}

.v-align-top {
  vertical-align: top !important;
}

.signature-section {
  font-size: 13px;

  font-weight: 600;
}

.stamp-box {
  width: 220px;

  height: 100px;

  border: 1px solid #000;
}

.label-field {
  width: 50px;

  display: inline-block;
}

.page-break-section {
  page-break-inside: avoid;

  break-inside: avoid;
}

@media screen {
  .invoice-paper {
    background: #fff !important;
  }
}

@media print {
  @page {
    size: A4 portrait;

    margin: 0;
  }

  .no-print {
    display: none !important;
  }

  .invoice-paper {
    box-shadow: none !important;

    border: none !important;
  }
}
</style>
