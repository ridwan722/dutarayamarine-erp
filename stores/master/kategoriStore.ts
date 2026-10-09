import { defineStore } from "pinia";
import type { invoiceM } from "~/types/InvoiceModel";
import type {
  itemKategoriM,
  masterObjectKategoriM,
} from "~/types/master/kategoriModel";
import type { penawaranM } from "~/types/penawaranModel";

export const useMasterKategoriStore = defineStore("masterKategoriStore", {
  state: () => {
    return {
      dataObjectKategori: [] as masterObjectKategoriM[],
      dataItemKategori: [] as itemKategoriM[],
      detailItemKategori: {} as itemKategoriM,
      tgl_awal: "",
      tgl_akhir: "",

      dataPenawaran: [] as penawaranM[],
      dataInvoice: [] as invoiceM[],
    };
  },

  getters: {
    getDataObjectKategori(state) {
      return state.dataObjectKategori;
    },

    getDetailItemKategori(state) {
      return state.detailItemKategori;
    },

    getDataItemKategori(state) {
      return state.dataItemKategori;
    },

    getDataItemKategoriPenawaran(state) {
      return state.dataPenawaran;
    },

    getDataItemKategoriInvoice(state) {
      return state.dataInvoice;
    },
  },

  actions: {
    // Object Kategori
    async updateObjectKategoriAct(lemparObject: masterObjectKategoriM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await updatedatabase(
          "m_object_kategori",
          lemparObject.id!,
          lemparObject
        );
        sessionStorage.removeItem("m_object_kategori");
        this.tarikDataObjectKategoriAct();
        notificationStore.showSuccess("Perubahan berhasil disimpan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal memperbarui data");
      }
    },

    async addMasterObjectKategoriAct(lemparObject: masterObjectKategoriM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        const id = makeSlug(lemparObject.nama);
        await setdatabase("m_object_kategori", id, lemparObject);
        sessionStorage.removeItem("m_object_kategori");
        this.tarikDataObjectKategoriAct();
        notificationStore.showSuccess("Data berhasil ditambahkan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menyimpan data");
        useloadingStore().setLoading(false);
      }
    },

    async deleteMasterObjectKategoriAct(id: string) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await hapusdatabase("m_object_kategori", id);
        sessionStorage.removeItem("m_object_kategori");
        this.tarikDataObjectKategoriAct();

        notificationStore.showSuccess("Data Berhasil Dihapus");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menghapus data");
      }
    },

    async tarikDataObjectKategoriAct() {
      const datatarik = await queryambilidsesion("m_object_kategori");
      this.dataObjectKategori = datatarik as unknown as masterObjectKategoriM[];
    },

    // Item Kategori
    async addMasterItemKategoriAct(lemparItem: itemKategoriM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        const id = makeSlug(
          lemparItem.nama_perusahaan +
          "-" +
          lemparItem.nama_cabang +
          "-" +
          lemparItem.kode_kategori_item
        );
        // await setdatabase("m_item_kategori", lemparItem.kode_kategori_item, lemparItem);

        const datbatching = [
          {
            type: "set",
            id: id,
            collection: "m_item_kategori",
            data: lemparItem,
          },

          {
            type: "set",
            id: id,
            collection:
              "m_perusahaan_erp/" +
              lemparItem.id_perusahaan +
              "/m_item_kategori",
            data: lemparItem,
          },

          {
            type: "set",
            id: id,
            collection: "m_cabang/" + lemparItem.id_cabang + "/m_item_kategori",
            data: lemparItem,
          },
        ];
        await batching(datbatching);
        sessionStorage.removeItem("m_item_kategori");
        this.tarikDataItemKategoriAct();
        notificationStore.showSuccess("Data berhasil ditambahkan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menyimpan data");
        useloadingStore().setLoading(false);
      }
    },

    async updateMasterItemKategoriAct(lemparItem: itemKategoriM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        const id = makeSlug(
          lemparItem.nama_perusahaan +
          "-" +
          lemparItem.nama_cabang +
          "-" +
          lemparItem.kode_kategori_item
        );

        const datbatching = [
          {
            type: "update",
            id: id,
            collection: "m_item_kategori",
            data: lemparItem,
          },

          {
            type: "update",
            id: id,
            collection:
              "m_perusahaan_erp/" +
              lemparItem.id_perusahaan +
              "/m_item_kategori",
            data: lemparItem,
          },

          {
            type: "update",
            id: id,
            collection: "m_cabang/" + lemparItem.id_cabang + "/m_item_kategori",
            data: lemparItem,
          },
        ];
        await batching(datbatching);
        sessionStorage.removeItem("m_item_kategori");
        this.tarikDataItemKategoriAct();
        notificationStore.showSuccess("Data berhasil ditambahkan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menyimpan data");
        useloadingStore().setLoading(false);
      }
    },

    async deleteMasterItemKategoriAct(lemparItem: itemKategoriM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        // await hapusdatabase("m_item_kategori", id);

        const datbatching = [
          {
            type: "delete",
            id: lemparItem.id!,
            collection: "m_item_kategori",
            data: lemparItem,
          },

          {
            type: "delete",
            id: lemparItem.id!,
            collection:
              "m_perusahaan_erp/" +
              lemparItem.id_perusahaan +
              "/m_item_kategori",
            data: lemparItem,
          },

          {
            type: "delete",
            id: lemparItem.id!,
            collection: "m_cabang/" + lemparItem.id_cabang + "/m_item_kategori",
            data: lemparItem,
          },
        ];
        await batching(datbatching);
        sessionStorage.removeItem("m_item_kategori");
        this.tarikDataItemKategoriAct();

        notificationStore.showSuccess("Data Berhasil Dihapus");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menghapus data");
      }
    },

    async tarikDataItemKategoriAct() {
      const datatarik = await queryambilidsesion("m_item_kategori");
      this.dataItemKategori = datatarik as unknown as itemKategoriM[];
    },

    async tarikDataItemKategoriPenawaran(id: string) {
      const datatarik = await queryambilid("m_item_kategori/" + id + "/penawaran");
      this.dataPenawaran = datatarik as unknown as penawaranM[];
    },

    async tarikDataItemKategoriInvoice(id: string) {
      const datatarik = await queryambilid("m_item_kategori/" + id + "/invoice");
      this.dataInvoice = datatarik as unknown as invoiceM[];
    },

    async tarikDataItemKategoribystatus(status: string) {
      const datatarik = await querymitemkategoribystatus(status);
      this.dataItemKategori = datatarik as unknown as itemKategoriM[];
    },

    async tarikDetailItemKategoriAct(id: string) {
      const datatarik = await tarikdetaildatabase("m_item_kategori", id);
      this.detailItemKategori = datatarik as unknown as itemKategoriM;
    },

    async queryrekapanitemkategori(
      tgl_awal: string,
      tgl_akhir: string,
      nama_perusahaan: string,
      nama_cabang: string,
      status: string,
    ) {
      try {
        useloadingStore().setLoading(true);

        this.tgl_awal = tgl_awal;
        this.tgl_akhir = tgl_akhir;
        const datatarik = await queryRekapanitemkategoriByStatusCabangPerusahaanPeriode
          (
            tgl_awal,
            tgl_akhir,
            nama_perusahaan,
            nama_cabang,
            status
          );
        this.dataItemKategori = datatarik as unknown as itemKategoriM[];
        useloadingStore().setLoading(false);
      } catch (error) {
        useloadingStore().setLoading(false);
      }
    },

  },
});
