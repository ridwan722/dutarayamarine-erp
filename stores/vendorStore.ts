import { defineStore } from "pinia";
import type { vendorM } from "~/types/vendorModel";
import { collection, doc, setDoc } from "firebase/firestore";
import { useFirestore } from "vuefire";

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
      const vendors = datatarik as (vendorM & { id?: string })[];
      this.dataVendor = await Promise.all(
        vendors.map(async (vendor) => {
          const id_vendor = vendor.id_vendor || vendor.id;
          if (!vendor.id_vendor && id_vendor) {
            try {
              await updatedatabase(COLLECTION, id_vendor, { id_vendor });
            } catch (error) {
              console.error(`Gagal menyimpan ID vendor ${id_vendor}:`, error);
            }
          }
          return { ...vendor, id_vendor };
        }),
      );
    },

    async addVendorAct(data: vendorM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        const db = useFirestore();
        const vendorRef = doc(collection(db, COLLECTION));
        await setDoc(vendorRef, { ...data, id_vendor: vendorRef.id });
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
      if (!id) {
        notificationStore.showError("ID Vendor tidak ditemukan");
        return;
      }

      try {
        useloadingStore().setLoading(true);
        await hapusdatabase(COLLECTION, id);
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataVendorAct();
        notificationStore.showSuccess("Vendor berhasil dihapus");
      } catch (error) {
        console.error("Gagal menghapus Vendor:", error);
        notificationStore.showError("Gagal menghapus Vendor");
      } finally {
        useloadingStore().setLoading(false);
      }
    },
  },
});
