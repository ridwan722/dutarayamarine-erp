import { defineStore } from "pinia";
import type { termconditionM } from "~/types/termconditionModel";

const COLLECTION = "termcondition";

export const usetermconditionStore = defineStore("termconditionStore", {
  state: () => ({
    dataTermcondition: [] as termconditionM[],
  }),

  getters: {
    getDataTermcondition(state) {
      return state.dataTermcondition;
    },
  },

  actions: {
    async tarikDataTermconditionAct() {
      const datatarik = await queryambilid(COLLECTION);
      this.dataTermcondition = datatarik as unknown as termconditionM[];
    },

    async addTermconditionAct(data: termconditionM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await tambahdatabase(COLLECTION, data);
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataTermconditionAct();
        notificationStore.showSuccess("T&C berhasil ditambahkan");
      } catch (error) {
        notificationStore.showError("Gagal menyimpan T&C");
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async updateTermconditionAct(data: termconditionM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await updatedatabase(COLLECTION, data.id!, data);
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataTermconditionAct();
        notificationStore.showSuccess("Perubahan berhasil disimpan");
      } catch (error) {
        notificationStore.showError("Gagal memperbarui T&C");
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async deleteTermconditionAct(id: string) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await hapusdatabase(COLLECTION, id);
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataTermconditionAct();
        notificationStore.showSuccess("T&C berhasil dihapus");
      } catch (error) {
        notificationStore.showError("Gagal menghapus T&C");
      } finally {
        useloadingStore().setLoading(false);
      }
    },
  },
});
