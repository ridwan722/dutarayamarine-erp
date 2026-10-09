import { defineStore } from "pinia";
import type { masterDokumenM } from "~/types/master/dokumenModel";

export const useMasterDokumenStore = defineStore("masterDokumenStore", {
  state: () => {
    return {
      dataDokumen: [] as masterDokumenM[],
    };
  },

  getters: {
    getDataDokumen(state) {
      return state.dataDokumen;
    },
  },

  actions: {
    async updateMasterDokumenAct(lempar: masterDokumenM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await updatedatabase("m_dokumen", lempar.id!, lempar);
        sessionStorage.removeItem("m_dokumen");
        this.tarikDataMasterDokumenAct();
        notificationStore.showSuccess("Perubahan berhasil disimpan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal memperbarui data");
      }
    },

    async addMasterDokumenAct(lempar: masterDokumenM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        const id = makeSlug(lempar.nama_dokumen);
        await setdatabase("m_dokumen", id, lempar);
        sessionStorage.removeItem("m_dokumen");
        this.tarikDataMasterDokumenAct();
        notificationStore.showSuccess("Data berhasil ditambahkan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menyimpan data");
        useloadingStore().setLoading(false);
      }
    },

    async deleteMasterDokumenAct(id: string) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await hapusdatabase("m_dokumen", id);
        sessionStorage.removeItem("m_dokumen");
        this.tarikDataMasterDokumenAct();

        notificationStore.showSuccess("Data Berhasil Dihapus");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menghapus data");
      }
    },

    async tarikDataMasterDokumenAct() {
      const datatarik = await queryambilidsesion("m_dokumen");
      this.dataDokumen = datatarik as unknown as masterDokumenM[];
    },
  },
});
