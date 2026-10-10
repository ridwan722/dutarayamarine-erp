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

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const reportDate = computed(() =>
  formatTanggalPanjang(props.invoiceDetail?.tanggal) === "-"
    ? "10 October 2026"
    : formatTanggalPanjang(props.invoiceDetail?.tanggal),
);
const vesselName = computed(
  () => (props.invoiceDetail as any)?.vessel,
);

const namaCustomer = computed(
  () => (props.invoiceDetail as any)?.nama_customer,
);

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
          Work Completion Report
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


    pdf.save(`WCR-DRM ${props.invoiceDetail.perihal}.pdf`);
  } catch (error) {
    console.error("Gagal menyimpan PDF Work Completion Report:", error);

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
        <div class="header-section text-center mb-6">
          <div class="d-flex align-center justify-center mb-2">
            <img src="/logokopsurat.png" class="logo-header mr-3" alt="Logo Perusahaan" />
            <h1 class="company-name">PT. DUTA RAYA MARINE</h1>
          </div>
          <div class="company-address">
            Ruko Dream Land Blok A No.05, Dreamland Square, Marina City, <br />
            Tanjung Riau, Kec. Sekupang, Kota Batam 29425.<br />
            Hp. +62821 9998 8670
          </div>
          <div class="document-title mt-4">WORK COMPLETION REPORT</div>
        </div>

        <div class="info-section mb-6">
          <table class="info-table">
            <tbody>
              <tr>
                <td width="140">Vessel</td><td width="15">:</td>
                <td>{{ vesselName }}</td>
              </tr>
              <tr><td>Location</td><td>:</td><td>Batam</td></tr>
              <tr><td>Date</td><td>:</td><td>10 October 2026</td></tr>
            </tbody>
          </table>
        </div>

        <section class="report-body mb-6">
          <p class="report-intro">
            This is to confirm that PT. Duta Raya Marine has completed the {{ props.invoiceDetail.perihal }} onboard {{ vesselName }}, including:
          </p>
          <ol class="work-list">
            <li>Supply and installation of Dryer CAD-14</li>
            <li>Installation of hydraulic hoses, valves, fittings, and accessories</li>
            <li>Cable pulling and installation approximately 20 meters</li>
            <li>Commissioning and testing of the installed unit</li>
            <li>Witnessed and verified by Second Engineer⁠</li>
          </ol>
          <p class="report-closing">
            The work has been completed satisfactorily in accordance with the site requirements.
          </p>
        </section>

        <div class="signature-section mt-6 page-break-section">
           <div class="signature-column text-center">
            <div class="signature-heading">Your sincerely,</div>
            <strong>PT. DUTA RAYA MARINE</strong>
            <div class="signature-space"></div>
            <div class="signature-line"></div>
            <div class="signature-caption">Name / Date</div>
          </div>
          <div class="signature-column text-center">
            <div class="signature-heading">Acknowledged by,</div>
            <strong>{{ invoiceDetail.nama_customer || "Customer" }}</strong>
            <div class="signature-space"></div>
            <div class="signature-line"></div>
            <div class="signature-caption">Name / Date</div>
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
        Save PDF Report
      </v-btn>
       <v-btn
        color="primary"
        variant="elevated"
        prepend-icon="mdi-printer"
        class="ml-2"
        @click="printDeliveryOrder"
      >
        Cetak Report
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.delivery-order-wrapper { width: 100%; margin-top: 20px; }
.action-bar { width: 100%; max-width: 850px; margin: 0 auto; }
.invoice-paper-wrapper { width: 100%; }
.invoice-paper {
  font-family: Arial, Helvetica, sans-serif;
  color: #000;
  line-height: 1.4;
  background-color: #fff !important;
}
.logo-header { width: 70px; max-width: 70px; height: auto; object-fit: contain; }
.company-name { font-size: 24px; font-weight: 800; letter-spacing: .5px; margin: 0; }
.company-address { font-size: 11px; font-weight: 600; line-height: 1.3; }
.document-title { font-size: 18px; font-weight: bold; letter-spacing: 1px; text-decoration: underline; }
.info-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.info-table td { padding: 2px 0; font-weight: 600; }
.report-body { font-size: 13px; line-height: 1.6; }
.report-intro, .report-closing { margin: 0; }
.work-list { margin: 6px 0 8px; padding-left: 28px; }
.work-list li { padding-left: 2px; }
.signature-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  font-size: 13px;
  font-weight: 600;
}
.signature-column { min-width: 0; }
.signature-heading { margin-bottom: 4px; }
.signature-space { height: 105px; }
.signature-line { width: 75%; margin: 0 auto 5px; border-top: 1px solid #000; }
.signature-person { display: block; }
.signature-caption { font-size: 11px; font-weight: 400; }
.page-break-section { page-break-inside: avoid; break-inside: avoid; }
@media print {
  @page { size: A4 portrait; margin: 0; }
  .no-print { display: none !important; }
  .invoice-paper { box-shadow: none !important; border: none !important; }
}
</style>
