import type { get } from "firebase/database";
import { defineStore } from "pinia";
import type { penawaranM } from "~/types/penawaranModel";

export const usePenawaranStore = defineStore("PenawaranStore", {
  state: () => {
    return {
      dataPenawaran: [] as penawaranM[],
      dataPenawaranTampil: [] as penawaranM[], // DATA FILTER (Untuk Tabel di Halaman)
      detailPenawaran: {} as penawaranM,
      tgl_awal: "",
      tgl_akhir: "",

      // KHUSUS COUNTER SIDEBAR
      dataPenawaranDraft: [] as penawaranM[],

      // Revisi disimpan sebagai subkoleksi dari dokumen penawaran.
      dataRevisiPenawaran: [] as Record<string, any>[],

    };
  },

  getters: {
    getDataPenawaran(state) {
      return state.dataPenawaran;
    },

    getDataPenawaranTampil(state) {
      return state.dataPenawaranTampil;
    },

    getDataRevisiPenawaran(state) {
      return state.dataRevisiPenawaran;
    },

    getDetailPenawaran(state) {
      return state.detailPenawaran;
    },

    getPenawaranByStatus: (state) => {
      return (status: string) =>
        state.dataPenawaran.filter((p) => p.status === status);
    },

    getPenawaranById: (state) => {
      return (id: string) =>
        state.dataPenawaran.find((p) => p.id! === id);
    },
  },

  actions: {
    // CREATE
    async addPenawaranAct(lemparPenawaran: penawaranM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await setdatabase(
          "penawaran",
          lemparPenawaran.id_penawaran || lemparPenawaran.no_penawaran!,
          lemparPenawaran
        );

        await this.tarikDataPenawaranAct();

        notificationStore.showSuccess("Penawaran berhasil ditambahkan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menyimpan penawaran");
        useloadingStore().setLoading(false);
      }
    },

    // UPDATE
    async updatePenawaranAct(lemparPenawaran: penawaranM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await updatedatabase(
          "penawaran",
          lemparPenawaran.id || lemparPenawaran.id_penawaran || lemparPenawaran.no_penawaran!,
          lemparPenawaran
        );

        // await this.tarikDataPenawaranAct();

        notificationStore.showSuccess("Penawaran berhasil diperbarui");
        return true;
      } catch (error) {
        notificationStore.showError("Gagal memperbarui penawaran");
        return false;
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    // DELETE
    async deletePenawaranAct(lemparinvoice: penawaranM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await hapusdatabase(
          "penawaran",
          lemparinvoice.id || lemparinvoice.id_penawaran || lemparinvoice.no_penawaran!
        );
        await this.tarikdatapenawaranbystatusarray(["Draft", "INVOICE"]);

        notificationStore.showSuccess("Penawaran berhasil dihapus");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menghapus penawaran");
        useloadingStore().setLoading(false);
      }
    },

    // READ
    // async tarikDataPenawaranAct() {
    //   const datatarik = await queryambilid("penawaran");
    //   this.dataPenawaran = datatarik as unknown as penawaranM[];
    // },

    async tarikDataPenawaranAct() {
      const datatarik = await queryambilid("penawaran");
      const hasil = datatarik as unknown as penawaranM[];
      this.dataPenawaran = hasil; // Simpan ke Master
      this.dataPenawaranTampil = hasil; // Default tampilkan semua
    },



    // Ambil data berdasarkan status (Panggil ini di halaman Proses/Sent/dll)
    async tarikdatapenawaranbystatus(status: string) {
      this.dataPenawaranTampil = [];
      const datatarik = await queryPenawaranBystatus(status);
      // JANGAN TIMPA this.dataPenawaran
      this.dataPenawaranTampil = datatarik as unknown as penawaranM[];
    },

    /**
     * KHUSUS SIDEBAR
     * STATUS DRAFT
     */
    async tarikdatapenawaranbystatusDraft(status: string) {
      const datatarik =
        await queryPenawaranBystatus(status);

      this.dataPenawaranDraft =
        datatarik as unknown as penawaranM[];
    },


    async tarikdatapenawaranbystatusarray(status: string[]) {
      const datatarik = await queryPenawaranBystatusarray(status);
      this.dataPenawaranTampil = datatarik as unknown as penawaranM[];
      // JANGAN timpa this.dataPenawaran di sini!
    },

    async tarikDetailPenawaranAct(id: string) {
      const datatarik = await tarikdetaildatabase("penawaran", id);
      this.detailPenawaran = datatarik as unknown as penawaranM;
    },

    async tarikDataPenawaranrevisAct(idPenawaran: string) {
      const datatarik = await queryambilid(
        `penawaran/${idPenawaran}/revisi_penawaran`,
      );
      this.dataRevisiPenawaran = datatarik as Record<string, any>[];
    },

    // async tarikdatapenawaranbystatus(status: string) {
    //   const datatarik = await queryPenawaranBystatus(status);
    //   this.dataPenawaran = datatarik as unknown as penawaranM[];
    // },

    //  async tarikdatapenawaranbystatusarray(status: string[]) {
    //   const datatarik = await queryPenawaranBystatusarray(status);
    //   this.dataPenawaran = datatarik as unknown as penawaranM[];
    // },

    async queryrekapanpenawaran(
      tgl_awal: string,
      tgl_akhir: string,
      nama_perusahaan: string,
      nama_cabang: string,
      status: string
    ) {
      try {
        useloadingStore().setLoading(true);

        this.tgl_awal = tgl_awal;
        this.tgl_akhir = tgl_akhir;
        const datatarik = await queryRekapanPenawaranByStatus
          (
            tgl_awal,
            tgl_akhir,
            nama_perusahaan,
            nama_cabang,
            status
          );
        this.dataPenawaran = datatarik as unknown as penawaranM[];
        useloadingStore().setLoading(false);
      } catch (error) {
        useloadingStore().setLoading(false);
      }
    },
  },
});
