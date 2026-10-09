import { get } from "firebase/database";
import moment from "moment";
import { defineStore } from "pinia";
import type { itemKategoriM } from "~/types/master/kategoriModel";
import type { cabangM, perusahaanM } from "~/types/master/perusahaanModel";

export const useMasterPerusahaanStore = defineStore("MasterPerusahaanStore", {
  state: () => {
    return {
      dataPerusahaan: [] as perusahaanM[],
      dataCabang: [] as cabangM[],
      detailCabang: {} as cabangM,

      dataitemkategori: [] as itemKategoriM[],

      tgl_awal: "",
      tgl_akhir: ""
    };
  },

  getters: {
    getDataPerusahaan(state) {
      return state.dataPerusahaan;
    },

    getDetailCabang(state) {
      return state.detailCabang;
    },

    getDataCabang(state) {
      return state.dataCabang;
    },

    getDataItemKategori(state) {
      return state.dataitemkategori;
    },
  },

  actions: {
    clearDataItemKategori() {
      this.dataitemkategori = [];
    },

    // CRUD PERUSAHAAN
    async updateMasterPerusahaanAct(lemparPerusahaan: perusahaanM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await updatedatabase(
          "m_perusahaan_erp",
          lemparPerusahaan.id!,
          lemparPerusahaan
        );
        sessionStorage.removeItem("m_perusahaan_erp");
        this.tarikDataPerusahaanAct();

        notificationStore.showSuccess("Perubahan berhasil disimpan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal memperbarui data");
      }
    },

    async addMasterPerusahaanAct(lemparPerusahaan: perusahaanM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        const id = makeSlug(lemparPerusahaan.nama_perusahaan);
        await setdatabase("m_perusahaan_erp", id, lemparPerusahaan);
        sessionStorage.removeItem("m_perusahaan_erp");
        this.tarikDataPerusahaanAct();
        notificationStore.showSuccess("Data berhasil ditambahkan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menyimpan data");
        useloadingStore().setLoading(false);
      }
    },

    async deleteMasterPerusahaanAct(id: string) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await hapusdatabase("m_perusahaan_erp", id);
        sessionStorage.removeItem("m_perusahaan_erp");
        this.tarikDataPerusahaanAct();

        notificationStore.showSuccess("Data Berhasil Dihapus");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menghapus data");
      }
    },

    async tarikDataPerusahaanAct() {
      const datatarik = await queryambilidsesion("m_perusahaan_erp");
      this.dataPerusahaan = datatarik as unknown as perusahaanM[];
    },

    // CABANG
    async updateMasterCabangAct(lemparCabang: cabangM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        // await updatedatabase("m_cabang", lemparCabang.id!, lemparCabang);

        const id = makeSlug(
          lemparCabang.nama_perusahaan + "-" + lemparCabang.nama_cabang
        );
        const datbatching = [
          {
            type: "update",
            id: id,
            collection: "m_cabang",
            data: lemparCabang,
          },

          {
            type: "update",
            id: id,
            collection:
              "m_perusahaan_erp/" + lemparCabang.id_perusahaan + "/m_cabang",
            data: lemparCabang,
          },
        ];
        await batching(datbatching);
        sessionStorage.removeItem("m_cabang");
        this.tarikDataCabangAct();

        notificationStore.showSuccess("Perubahan berhasil disimpan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal memperbarui data");
      }
    },

    async addMasterCabangAct(lemparCabang: cabangM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        const id = makeSlug(
          lemparCabang.nama_perusahaan + "-" + lemparCabang.nama_cabang
        );
        // await setdatabase("m_cabang", id, lemparCabang);

        const datbatching = [
          {
            type: "set",
            id: id,
            collection: "m_cabang",
            data: lemparCabang,
          },

          {
            type: "set",
            id: id,
            collection:
              "m_perusahaan_erp/" + lemparCabang.id_perusahaan + "/m_cabang",
            data: lemparCabang,
          },
        ];
        await batching(datbatching);
        sessionStorage.removeItem("m_cabang");
        this.tarikDataCabangAct();
        notificationStore.showSuccess("Data berhasil ditambahkan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menyimpan data");
        useloadingStore().setLoading(false);
      }
    },

    async deleteMasterCabangAct(lemparCabang: cabangM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        // await hapusdatabase("m_cabang", id);

        const id = makeSlug(
          lemparCabang.nama_perusahaan + "-" + lemparCabang.nama_cabang
        );
        // await setdatabase("m_cabang", id, lemparCabang);

        const datbatching = [
          {
            type: "delete",
            id: id,
            collection: "m_cabang",
            data: lemparCabang,
          },

          {
            type: "delete",
            id: id,
            collection:
              "m_perusahaan_erp/" + lemparCabang.id_perusahaan + "/m_cabang",
            data: lemparCabang,
          },
        ];
        await batching(datbatching);
        sessionStorage.removeItem('m_cabang');
        this.tarikDataCabangAct();

        notificationStore.showSuccess("Data Berhasil Dihapus");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menghapus data");
      }
    },

    async tarikDataCabangAct() {
      const datatarik = await queryambilidsesion("m_cabang");
      this.dataCabang = datatarik as unknown as cabangM[];
    },

    async tarikDetailCabangAct(id: string) {
      const datatarik = await tarikdetaildatabase("m_cabang", id);
      this.detailCabang = datatarik as unknown as cabangM;
    },

    async tarikDataCabangItemKategori(id: string) {
      const datatarik = await queryambilid(
        "m_cabang/" + id + "/m_item_kategori"
      );
      this.dataitemkategori = datatarik as unknown as itemKategoriM[];
    },

    async queryrekapancabangitemkategori(
      id_cabang: string,
      tgl_awal: string,
      tgl_akhir: string,
      status: string
    ) {
      try {
        useloadingStore().setLoading(true);

        this.tgl_awal = tgl_awal;
        this.tgl_akhir = tgl_akhir;
        const datatarik = await queryRekapancabangitemkategoriByStatusPeriode
          (
            id_cabang,
            tgl_awal,
            tgl_akhir,
            status
          );
        this.dataitemkategori = datatarik as unknown as itemKategoriM[];
        useloadingStore().setLoading(false);
      } catch (error) {
        useloadingStore().setLoading(false);
      }
    },



    async tarikDataCabangItemKategoriByStatus(id: string, status: string) {
      const datatarik = await querycabangItemKategoriBystatus(
        id, status
      );
      this.dataitemkategori = datatarik as unknown as itemKategoriM[];
    },

    async tarikDataCabangPerusahaan(id: string) {
      const datatarik = await queryCabangPerusahaan(id);
      this.dataCabang = datatarik as unknown as cabangM[];
    },

    async tarikDataItemKategori(
      id_perusahaan: string,
      id_cabang: string,
      id_object: string
    ) {
      if (!id_perusahaan || !id_cabang || !id_object) return [];

      // Ambil semua item kategori
      const data = await queryambilid("m_item_kategori");

      // FILTER MANUAL
      const hasil = Object.values(data || {}).filter((item: any) => {
        return (
          item.id_perusahaan === id_perusahaan &&
          item.id_cabang === id_cabang &&
          item.id_object_kategori === id_object
        );
      });

      this.dataitemkategori = hasil as itemKategoriM[];
    },

    async getrekapancabangbyperusahaan(tanggal_awal: string, tanggal_akhir: string, nama_perusahaan: string) {
      try {
        useloadingStore().setLoading(true);
        const tanggalAwal = moment(tanggal_awal).startOf("day");
        const tanggalakhir = moment(tanggal_akhir).endOf("day");
        useloadingStore().setLoading(true);
        const datatarik = await queryRekapanCabangByPerusahaan(
          tanggalAwal.unix(),
          tanggalakhir.unix(),
          nama_perusahaan
        );

        this.dataCabang = datatarik as unknown as cabangM[];
        useloadingStore().setLoading(false);
      } catch (error) {
        useloadingStore().setLoading(false);
      }
    },
  },
});
