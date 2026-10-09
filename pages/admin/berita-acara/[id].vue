<template>
  <div class="page-container pa-6">
    <div v-if="loading" class="text-center py-12 no-print">
      <v-progress-circular
        indeterminate
        color="primary"
        size="48"
      ></v-progress-circular>
      <div class="mt-3 text-body-2 text-grey-darken-1 font-weight-medium">
        Memuat detail Berita Acara...
      </div>
    </div>

    <div v-else class="laporan-wrapper">
      <v-card class="mx-auto" max-width="900" flat>
        <v-card-text>
          <!-- Tombol Kembali -->
          <v-btn
            color="primary"
            variant="text"
            prepend-icon="mdi-arrow-left"
            @click="kembali"
            class="mb-6 no-print"
          >
            Kembali
          </v-btn>

          <!-- Area Cetak Laporan -->
          <div class="print-area">
            <!-- Judul Tengah -->
            <div class="text-center mb-8">
              <h1 class="text-h6 font-weight-bold uppercase">
                {{ detailData?.judul_berita_acara || 'BERITA ACARA' }}
              </h1>
            </div>

            <!-- Paragraf Pembuka -->
            <div class="mb-4">
              <p class="text-body-1">Dengan ini saya yang bertanda tangan di bawah ini :</p>
            </div>

            <!-- Detail PIC & Customer -->
            <div class="mb-6 detail-table">
              <v-table density="compact" class="font-size-body-1" style="width: auto;">
                <tbody>
                  <tr>
                    <td class="font-weight-medium px-1" style="width: 140px;">Nama</td>
                    <td class="px-1">:</td>
                    <td class="px-1">{{ detailData?.pic || '-' }}</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium px-1">Jabatan</td>
                    <td class="px-1">:</td>
                    <td class="px-1">Master</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium px-1">Client</td>
                    <td class="px-1">:</td>
                    <td class="px-1">{{ detailData?.nama_customer || '-' }}</td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium px-1">No. Telp</td>
                    <td class="px-1">:</td>
                    <td class="px-1">{{ detailData?.no_telp || '-' }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>

            <!-- Isi Laporan -->
            <div class="mb-4 description-section">
              <p class="text-body-1 mb-3">
                Pada Hari ini,
                {{ detailData?.tanggal_berita_acara ? moment(detailData.tanggal_berita_acara).format('dddd') : 'Senin' }}
                tanggal
                {{ detailData?.tanggal_berita_acara ? moment(detailData.tanggal_berita_acara).format('DD MMMM YYYY') : '-' }}
                Pukul 22:00 LT Kapal ikat di {{ detailData?.alamat || 'PT. BES Batam' }} dan telah dilakukan pemasangan radar (Terminasi dan komisinning).
              </p>
              <p class="text-body-1 mb-3">
                Dengan hasil radar sudah berfungsi dengan normal dan sesuai regulasi.
              </p>
              <p class="text-body-1 mb-3">
                Demikian Berita Acara ini saya buat dengan sebenar-benarnya dan untuk digunakan sebagaimana mestinya.
              </p>
              <p class="text-body-1 mb-3">
                Atas perhatian dan kerjasamanya saya ucapkan terima kasih.
              </p>
            </div>

            <!-- Bagian Tanda Tangan -->
            <v-row class="signature-section mt-12" no-gutters>
              <!-- Kolom Kiri: Diketahui -->
              <v-col cols="6" class="text-left signature-col">
                <p class="text-body-1 mb-10">Diketahui,</p>
                <div class="signature-area text-center" style="width: 250px;">
                  <div class="signature-image-wrapper mb-2">
                    <!-- Ilustrasi Coretan Tanda Tangan Tangan -->
                    <svg width="150" height="60" viewBox="0 0 150 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 40 C 30 10, 40 50, 50 20 C 60 5, 70 45, 90 25 C 100 15, 120 40, 140 20" stroke="black" stroke-width="2" fill="none"/>
                      <path d="M30 35 C 50 45, 80 15, 120 30" stroke="black" stroke-width="1.5" fill="none"/>
                    </svg>
                  </div>
                  <p class="text-body-1 font-weight-medium mb-0">Leo Adiatmaja Sembiring</p>
                  <p class="text-body-2 text-grey-darken-1 mb-0">PT. DUTA RAYA MARINE</p>
                </div>
              </v-col>

              <!-- Kolom Kanan: Yang Membuat / Customer -->
              <v-col cols="6" class="text-right signature-col">
                <div class="mb-10 text-right">
                  <p class="text-body-1 mb-1">
                    Batam, {{ detailData?.tanggal_berita_acara ? moment(detailData.tanggal_berita_acara).format('DD MMMM YYYY') : '-' }}
                  </p>
                  <p class="text-body-1 font-weight-bold mb-1">Yang Membuat,</p>
                </div>

                <div class="text-right d-flex flex-column align-end">
                  <!-- Stempel Stamp Kotak -->
                  <div class="ship-stamp-box pa-3 text-left mb-4" style="width: 260px; border: 2px solid #000;">
                    <p class="text-body-1 font-weight-bold mb-1 text-center text-uppercase">
                      {{ detailData?.nama_customer || 'LIMIN INFINITY' }}
                    </p>
                    <v-divider class="my-2 border-black" />
                    <p class="text-caption mb-0">CALL SIGN : YD AK 2</p>
                    <p class="text-caption mb-0">IMO No. : 9705570</p>
                    <p class="text-caption mb-0">GRT/NRT : 1023 / 406</p>
                    <p class="text-caption mb-0">ID CUST : {{ detailData?.id_customer || '-' }}</p>
                  </div>

                  <!-- Tanda Tangan Master / PIC -->
                  <div class="text-center" style="width: 260px;">
                    <p class="text-body-1 font-weight-medium mb-0 text-decoration-underline">
                      {{ detailData?.pic || 'Amos Simba Rapa' }}
                    </p>
                    <p class="text-body-2 text-grey-darken-1 mb-0">Master</p>
                  </div>
                </div>
              </v-col>
            </v-row>

          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import _ from "lodash";
import moment from "moment";
import "moment/locale/id";
moment.locale("id");

import { useBeritaAcaraStore } from "~/stores/beritaAcaraStore";
import type { CompanyInspectionReport } from "~/types/beritaAcaraModel";

definePageMeta({
  layout: "admin",
});

const route = useRoute();
const router = useRouter();
const beritaAcaraStore = useBeritaAcaraStore();

// State
const loading = ref(true);
const detailData = ref<CompanyInspectionReport | null>(null);

// Fungsi Kembali ke Halaman Sebelumnya
const kembali = () => {
  router.back();
};

// Ambil data detail saat halaman di-load
const loaddetailBeritaAcara = async () => {
  try {
    loading.value = true;
    await beritaAcaraStore.tarikDataBeritaAcaraAct();
    const beritaAcaraId = route.params.id as string;

    if (beritaAcaraId) {
      const allBeritaAcara = beritaAcaraStore.getDataBeritaAcara;
      const match = _.find(allBeritaAcara, (o: CompanyInspectionReport) => o.id === beritaAcaraId);

      if (match) {
        detailData.value = _.cloneDeep(match);
      }
    }
  } catch (error) {
    console.error("Gagal memuat detail laporan:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loaddetailBeritaAcara();
});
</script>

<style scoped>
.laporan-wrapper {
  background-color: #f5f5f5;
  min-height: calc(100vh - 128px);
}

.print-area {
  font-family: 'Times New Roman', Times, serif;
  line-height: 1.6;
  color: #000;
  padding: 20px;
}

.detail-table :deep(td) {
  border-bottom: none !important;
  height: auto !important;
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}

.detail-table :deep(tr:hover) {
  background-color: transparent !important;
}

.description-section p {
  text-align: justify;
}

.border-black {
  border-color: #000 !important;
  opacity: 1 !important;
}

.uppercase {
  text-transform: uppercase;
}

/* Penyesuaian Cetak */
@media print {
  .no-print {
    display: none !important;
  }
  .laporan-wrapper {
    background-color: #fff !important;
    padding: 0 !important;
  }
  .v-card {
    box-shadow: none !important;
  }
  .print-area {
    padding: 0 !important;
  }
}
</style>