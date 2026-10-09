import { defineStore } from "pinia";
import type { vendorM } from "~/types/vendorModel";

const COLLECTION = "vendor";

export const usevendorStore = defineStore("vendorStore", {
  state: () => ({
    dataVendor: [] as vendorM[],
  }),

  getters: {
    getDataVendor(state) {
      return state.dataVendor;
    },
  },

  actions: {
    async tarikDataVendorAct() {
      const datatarik = await queryambilid(COLLECTION);
      this.dataVendor = datatarik as unknown as vendorM[];
    },

    async addVendorAct(data: vendorM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await tambahdatabase(COLLECTION, data);
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataVendorAct();
        notificationStore.showSuccess("Vendor berhasil ditambahkan");
      } catch (error) {
        notificationStore.showError("Gagal menyimpan Vendor");
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async updateVendorAct(data: vendorM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await updatedatabase(COLLECTION, data.id_vendor!, data);
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataVendorAct();
        notificationStore.showSuccess("Perubahan berhasil disimpan");
      } catch (error) {
        notificationStore.showError("Gagal memperbarui Vendor");
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async deleteVendorAct(id: string) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await hapusdatabase(COLLECTION, id);
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataVendorAct();
        notificationStore.showSuccess("Vendor berhasil dihapus");
      } catch (error) {
        notificationStore.showError("Gagal menghapus Vendor");
      } finally {
        useloadingStore().setLoading(false);
      }
    },
  },
});
