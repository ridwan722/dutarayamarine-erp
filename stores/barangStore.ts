import { defineStore } from "pinia";
import type { barangM } from "~/types/barangModel";

const COLLECTION = "barang";

export const usebarangStore = defineStore("barangStore", {
  state: () => ({
    dataBarang: [] as barangM[],
  }),

  getters: {
    getDataBarang(state) {
      return state.dataBarang;
    },
  },

  actions: {
    async tarikDataBarangAct() {
      const datatarik = await queryambilid(COLLECTION);
      this.dataBarang = datatarik as unknown as barangM[];
    },

    async addBarangAct(data: barangM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await tambahdatabase(COLLECTION, data);
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataBarangAct();
        notificationStore.showSuccess("Barang berhasil ditambahkan");
      } catch (error) {
        notificationStore.showError("Gagal menyimpan Barang");
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async updateBarangAct(data: barangM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await updatedatabase(COLLECTION, data.id!, data);
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataBarangAct();
        notificationStore.showSuccess("Perubahan berhasil disimpan");
      } catch (error) {
        notificationStore.showError("Gagal memperbarui Barang");
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async deleteBarangAct(id: string) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await hapusdatabase(COLLECTION, id);
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataBarangAct();
        notificationStore.showSuccess("Barang berhasil dihapus");
      } catch (error) {
        notificationStore.showError("Gagal menghapus Barang");
      } finally {
        useloadingStore().setLoading(false);
      }
    },
  },
});
