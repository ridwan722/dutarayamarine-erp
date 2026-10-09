<template>
  <v-container class="pa-10 bg-grey-lighten-4 d-flex justify-center">
    <v-card width="800" class="pa-12 elevation-3 bg-white" min-height="1000">
      
      <v-row align="start" class="mb-6">
        <v-col cols="4">
          <v-img
            src="https://images.perkasaracking.co.id/images/be44be2c-309d-4ef8-4d5e-dccf2d7e4f00/logoxs" 
            width="150"
            contain
          ></v-img>
        </v-col>
        <v-col cols="8" class="text-right">
          <h2 class="text-h5 font-weight-black mb-1">PT. KARYA ARESA MANDIRI</h2>
          <div class="text-caption">
            Inspeksi Saluran Kalimalang No. 18, RT 007 RW 008<br>
            Pondok Kelapa, Duren Sawit<br>
            Workshop: Jl. Kebagusan Raya, Mawar No. 54<br>
            Ps. Minggu, Jakarta Selatan 12520<br>
            Telp. +6221 2179 8064
          </div>
        </v-col>
      </v-row>

      <v-divider class="border-opacity-50 mb-6"></v-divider>

      <div class="text-right mb-6">Jakarta, 15 Desember 2026</div>

      <v-row dense class="mb-6">
        <v-col cols="2">Nomor</v-col>
        <v-col cols="10">: 00592/KAM/XII/2026</v-col>
        <v-col cols="2">Perihal</v-col>
        <v-col cols="10">: <b>Penawaran Pengurusan Perpanjangan Izin Sertifikasi Disnaker</b></v-col>
      </v-row>

      <div class="mb-8">
        <div class="font-weight-bold">Kepada Yth :</div>
        <div>PT. Astra International Auto 2000, TBK</div>
        <div>Di</div>
        <div>Jl. MH. Thamrin Blok B2 No. 2 Bintaro Sektor VII Pondok Jaya Pondok Aren</div>
      </div>

      <div class="mb-6" style="text-align: justify; line-height: 1.6;">
        Dengan Hormat, <br><br>
        Kami selaku Perusahaan yang bergerak dibidang Jasa Pengurusan Perizinan bermaksud untuk memberikan Penawaran Pengurusan Perpanjangan Izin Sertifikasi Disnaker kepada PT. Astra International Auto 2000, TBK Cab. Bintaro. Adapun penawaran yang kami berikan sebagai berikut :
      </div>

      <v-table density="compact" class="mb-8 border">
        <thead>
          <tr class="bg-grey-lighten-3">
            <th class="text-center border" width="50">NO</th>
            <th class="text-center border">PEKERJAAN</th>
            <th class="text-center border" width="80">QTY</th>
            <th class="text-center border">HARGA / UNIT</th>
            <th class="text-center border">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in items" :key="index">
            <td class="text-center border">{{ index + 1 }}</td>
            <td class="border">{{ item.name }}</td>
            <td class="text-center border">{{ item.qty }}</td>
            <td class="text-right border">Rp. {{ item.price.toLocaleString('id-ID') }}</td>
            <td class="text-right border">Rp. {{ (item.qty * item.price).toLocaleString('id-ID') }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="bg-grey-lighten-4 font-weight-bold">
            <td colspan="4" class="text-center border">TOTAL</td>
            <td class="text-right border text-h6">Rp. {{ totalHarga.toLocaleString('id-ID') }},-</td>
          </tr>
        </tfoot>
      </v-table>

      <div class="mb-12">
        Demikian surat penawaran ini kami buat atas perhatian dan kerjasamanya kami ucapkan terimakasih.
      </div>

      <v-row class="mt-10">
        <v-col cols="6">
          <div class="mb-15">Hormat kami,</div>
          <div class="font-weight-bold text-decoration-underline">Abdul Khalid</div>
          <div>Manager Operational</div>
        </v-col>
        <v-col cols="6" class="text-center">
          <div class="mb-15">Approve</div>
          <div>( .................................... )</div>
        </v-col>
      </v-row>

    </v-card>
  </v-container>
</template>

<script setup>
const items = ref([
  { name: 'Pesawat Angkat dan Angkut ( Two Posh Lift )', qty: 9, price: 1500000 },
  { name: 'Scissor Lift', qty: 4, price: 1500000 },
  { name: 'Motor Diesel', qty: 1, price: 1500000 },
  { name: 'Instalasi Listrik', qty: 1, price: 1500000 },
])

const totalHarga = computed(() => {
  return items.value.reduce((acc, item) => acc + (item.qty * item.price), 0)
})
</script>

<style scoped>
/* Opsional: CSS untuk memastikan tampilan cetak yang bagus */
@media print {
  .v-container {
    padding: 0 !important;
    background-color: white !important;
  }
  .v-card {
    box-shadow: none !important;
    width: 100% !important;
  }
}

.border {
  border: 1px solid #ddd !important;
}
</style>