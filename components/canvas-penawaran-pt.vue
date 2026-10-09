```vue
<template>
  <div class="pdf-wrapper">
    <div id="offer-to-print" class="quotation-page">
      <div class="header">
        <div class="company-brand">
          <img src="/logo-highlander.jpeg" alt="Logo SNS" class="logo" />

          <div class="company-info">
            <h1 class="company-title">PT. HIGHLANDER</h1>
            <p class="company-tagline">Integrated Maritime Management</p>
          </div>
        </div>

        <div class="company-address">
          <p>Ruko Dream Land Blok A No.05,</p>
          <p>Dreamland Square, Marina City Tanjung Riau,</p>
          <p>Kec. Sekupang, Kota Batam 29425</p>
          <p class="phone">Hp.+62 853 6201 8099</p>
        </div>
      </div>

      <div class="header-line"></div>

      <div class="meta-section">
        <div class="left-meta">
          <table class="info-table">
            <tr>
              <td class="label">TO</td>
              <td class="sep">:</td>
              <td class="val font-bold">
                {{ detailpenawaran?.nama_perusahaan }}
              </td>
            </tr>

            <tr>
              <td></td>
              <td></td>
              <td class="val address-text">
                {{ detailpenawaran?.alamat_perusahaan }}
              </td>
            </tr>

            <tr>
              <td class="label">ATTN</td>
              <td class="sep">:</td>
              <td class="val">
                {{ detailpenawaran?.pic }}
              </td>
            </tr>

            <tr>
              <td class="label">SUBJECT</td>
              <td class="sep">:</td>
              <td class="val font-bold">
                {{ detailpenawaran?.perihal }}
              </td>
            </tr>

            <tr>
              <td class="label">VESSEL</td>
              <td class="sep">:</td>
              <td class="val">
                {{ detailpenawaran?.vessel }}
              </td>
            </tr>

            <tr>
              <td class="label">LOCATION</td>
              <td class="sep">:</td>
              <td class="val">Batam</td>
            </tr>
          </table>
        </div>

        <div class="right-meta">
          <h2 class="doc-type">QUOTATION</h2>

          <table class="info-table right-table">
            <tr>
              <td class="label">NO.</td>
              <td class="sep">:</td>
              <td class="val font-bold">
                {{ detailpenawaran?.no_penawaran }}
              </td>
            </tr>

            <tr>
              <td class="label">DATE</td>
              <td class="sep">:</td>
              <td class="val">
                {{ detailpenawaran?.tanggal_penawaran }}
              </td>
            </tr>
          </table>
        </div>
      </div>

      <p class="opening-text">
        Dear Sirs/Madam,<br />
        Thank you for your kind enquiry. We are pleased to submit our quotation
        for your consideration as detailed below.
      </p>

      <table class="quotation-table">
        <colgroup>
          <col style="width: 5%" />
          <col style="width: 55%" />
          <col style="width: 8%" />
          <col style="width: 16%" />
          <col style="width: 16%" />
        </colgroup>

        <thead>
          <tr>
            <th class="text-center">NO.</th>
            <th>DESCRIPTION/SCOPE OF WORK</th>
            <th class="text-center">QTY</th>
            <th class="text-right">UNIT PRICE</th>
            <th class="text-right">TOTAL</th>
          </tr>
        </thead>

        <tbody>
          <tr
            class="row-head"
            v-for="(item, index) in props.detailpenawaran?.penawaran_item"
            :key="index"
          >
            <td class="text-center font-bold">{{ index + 1 }}.</td>

            <td class="font-bold">
              {{ item.nama }}
            </td>

            <td class="text-center">
              {{ item.qty }}
            </td>

            <td class="text-right">Rp {{ rupiah(item.amount) }}</td>

            <td class="text-right">Rp {{ rupiah(item.subtotal_item) }}</td>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <td colspan="3" class="border-none"></td>

            <td class="text-right font-bold total-label">TOTAL</td>

            <td class="text-right font-bold total-value">
              Rp {{ rupiah(props.detailpenawaran?.grand_total_penawaran) }}
            </td>
          </tr>
        </tfoot>
      </table>

      <div class="terms-container">
        <h3 class="terms-header">TERMS & CONDITIONS</h3>

        <ul
          class="terms-main-list"
          v-for="(item, index) in props.detailpenawaran?.termCondition"
          :key="index"
        >
          <li>
            {{ item.nama_term }}
          </li>
        </ul>
      </div>

      <div class="signatures">
        <div class="sig-col">
          <p>Your sincerely,</p>

          <div class="sig-space"></div>

          <p class="sig-line">PT. HIGHLANDER</p>
        </div>

        <div class="sig-col">
          <p>Confirmed by Client,</p>

          <div class="sig-space"></div>

          <p class="sig-line">Client's Name</p>
        </div>
      </div>

      <!-- BUTTON -->
      <div class="no-print action-bar">
        <button class="btn-print" @click="handlePrint">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 6 2 18 2 18 9"></polyline>

            <path
              d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
            ></path>

            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>

          Cetak PDF / Print
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { penawaranM } from "~/types/penawaranModel";

const props = defineProps<{
  detailpenawaran: penawaranM;
}>();

const handlePrint = () => {
  window.print();
};
</script>

<style scoped>
.action-bar {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
}

.btn-print {
  display: flex;
  align-items: center;
  gap: 8px;

  background-color: #1b365d;
  color: #ffffff;

  border: none;
  padding: 10px 18px;

  font-size: 13px;
  font-weight: bold;

  border-radius: 6px;

  cursor: pointer;

  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);

  transition: background-color 0.2s ease;
}

.btn-print:hover {
  background-color: #a61c1c;
}

.pdf-wrapper {
  width: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;

  background-color: #e0e0e0;

  padding: 20px 0;
}

.quotation-page {
  width: 210mm;
  min-height: 297mm;

  background: #ffffff;

  padding: 35px 40px;

  box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);

  font-family: Arial, Helvetica, sans-serif;

  color: #000000;

  font-size: 9.5px;

  line-height: 1.35;

  box-sizing: border-box;
}

.header {
  display: flex;

  justify-content: space-between;
  align-items: flex-start;
}

.company-brand {
  display: flex;

  align-items: center;

  gap: 12px;
}

.logo {
  width: 65px;
  height: auto;
}

.company-title {
  font-size: 14px;

  font-weight: bold;

  color: #1b365d;

  margin: 0;
}

.company-tagline {
  font-size: 9px;

  color: #a61c1c;

  margin: 2px 0 0 0;

  font-weight: bold;

  font-style: italic;
}

.company-address {
  text-align: right;

  font-size: 8.5px;

  color: #333;
}

.company-address p {
  margin: 0;
}

.company-address .phone {
  margin-top: 2px;

  font-weight: bold;
}

.header-line {
  border-bottom: 2px solid #a61c1c;

  margin: 10px 0 14px 0;
}

.meta-section {
  display: flex;

  justify-content: space-between;

  margin-bottom: 12px;
}

.left-meta {
  width: 60%;
}

.right-meta {
  width: 38%;

  text-align: right;
}

.doc-type {
  font-size: 18px;

  font-weight: bold;

  color: #1b365d;

  margin: 0 0 6px 0;
}

.info-table {
  border-collapse: collapse;

  width: 100%;
}

.info-table td {
  padding: 1px 0;

  vertical-align: top;

  font-size: 9.5px;
}

.info-table .label {
  width: 55px;

  font-weight: bold;
}

.info-table .sep {
  width: 10px;
}

.address-text {
  line-height: 1.25;
}

.right-table {
  display: inline-table;

  width: auto;
}

.right-table td {
  text-align: left;
}

.opening-text {
  margin: 10px 0 12px 0;

  font-size: 9.5px;
}

.quotation-table {
  width: 100%;

  table-layout: fixed;

  border-collapse: collapse;

  border: 1px solid #1b365d;

  margin-bottom: 12px;
}

.quotation-table th {
  background-color: #e30606;

  color: #ffffff;

  font-size: 9px;

  font-weight: bold;

  padding: 6px 8px;

  border: 1px solid #1b365d;

  text-align: left;
}

.quotation-table td {
  padding: 4px 8px;

  border-left: 1px solid #1b365d;
  border-right: 1px solid #1b365d;

  vertical-align: top;

  font-size: 9px;

  word-wrap: break-word;
}

.row-head td {
  border-top: 1px solid #1b365d;

  padding-top: 6px;

  padding-bottom: 4px;

  background-color: #fbfbfb;
}

.quotation-table tfoot td {
  border: none !important;

  padding-top: 6px;
}

.border-none {
  border: none !important;
}

.total-label {
  font-size: 10px;

  padding-right: 8px;

  vertical-align: middle;
}

.total-value {
  font-size: 10.5px;

  border: 1px solid #1b365d !important;

  background-color: #f4f6f9;

  padding: 5px 8px !important;

  vertical-align: middle;
}

.terms-container {
  margin-top: 10px;
}

.terms-header {
  font-size: 9.5px;

  font-weight: bold;

  color: #1b365d;

  margin: 0 0 4px 0;

  text-decoration: underline;
}

.terms-main-list {
  margin: 0;

  padding-left: 14px;

  font-size: 8.5px;
}

.terms-main-list > li {
  margin-bottom: 3px;
}

.signatures {
  display: flex;

  justify-content: space-between;

  margin-top: 25px;
}

.sig-col {
  width: 40%;

  font-size: 9px;
}

.sig-col p {
  margin: 0;
}

.sig-space {
  height: 55px;
}

.sig-line {
  border-top: 1px solid #000;

  padding-top: 2px;

  width: 160px;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.font-bold {
  font-weight: bold;
}

@media print {
  body * {
    visibility: hidden !important;
  }

  #offer-to-print,
  #offer-to-print * {
    visibility: visible !important;
  }

  #offer-to-print {
    position: absolute !important;

    left: 0 !important;
    top: 0 !important;

    width: 210mm !important;

    min-height: 297mm !important;

    margin: 0 !important;

    padding: 35px 40px !important;

    box-sizing: border-box !important;

    background: #ffffff !important;

    box-shadow: none !important;
  }

  .pdf-wrapper {
    display: block !important;

    width: auto !important;

    padding: 0 !important;

    margin: 0 !important;

    background: transparent !important;
  }

  .no-print {
    display: none !important;
  }

  .quotation-table {
    width: 100% !important;

    page-break-inside: auto !important;

    break-inside: auto !important;
  }

  .quotation-table thead {
    display: table-header-group !important;
  }

  .quotation-table tfoot {
    display: table-footer-group !important;
  }

  .quotation-table tr {
    page-break-inside: avoid !important;

    break-inside: avoid !important;
  }

  .terms-container,
  .signatures {
    page-break-inside: avoid !important;

    break-inside: avoid !important;
  }

  .quotation-table th,
  .total-value {
    -webkit-print-color-adjust: exact !important;

    print-color-adjust: exact !important;
  }

  @page {
    size: A4 portrait;

    margin: 0;
  }
}
</style>
