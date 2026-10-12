import { defineStore } from "pinia";
import type { leadsM } from "~/types/leadsModel";
import { collection, doc, setDoc } from "firebase/firestore";
import { useFirestore } from "vuefire";

const COLLECTION = "leads";

export const useleadsStore = defineStore("leadsStore", {
  state: () => ({
    dataLeads: [] as leadsM[],
  }),

  getters: {
    getDataLeads(state) {
      return state.dataLeads;
    },
  },

  actions: {
    async tarikDataLeadsAct() {
      const datatarik = await queryambilid(COLLECTION);
      const leadss = datatarik as (leadsM & { id?: string })[];
      this.dataLeads = await Promise.all(
        leadss.map(async (leads) => {
          const id_leads = leads.id_leads || leads.id;
          if (!leads.id_leads && id_leads) {
            try {
              await updatedatabase(COLLECTION, id_leads, { id_leads });
            } catch (error) {
              console.error(`Gagal menyimpan ID leads ${id_leads}:`, error);
            }
          }
          return { ...leads, id_leads };
        }),
      );
    },

    async addLeadsAct(data: leadsM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        const db = useFirestore();
        const leadsRef = doc(collection(db, COLLECTION));
        await setDoc(leadsRef, { ...data, id_leads: leadsRef.id });
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataLeadsAct();
        notificationStore.showSuccess("leads berhasil ditambahkan");
      } catch (error) {
        notificationStore.showError("Gagal menyimpan leads");
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async updateLeadsAct(data: leadsM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await updatedatabase(COLLECTION, data.id_leads!, data);
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataLeadsAct();
        notificationStore.showSuccess("Perubahan berhasil disimpan");
      } catch (error) {
        notificationStore.showError("Gagal memperbarui leads");
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async deleteLeadsAct(id: string) {
      const notificationStore = useNotificationStore();
      if (!id) {
        notificationStore.showError("ID leads tidak ditemukan");
        return;
      }

      try {
        useloadingStore().setLoading(true);
        await hapusdatabase(COLLECTION, id);
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataLeadsAct();
        notificationStore.showSuccess("leads berhasil dihapus");
      } catch (error) {
        console.error("Gagal menghapus leads:", error);
        notificationStore.showError("Gagal menghapus leads");
      } finally {
        useloadingStore().setLoading(false);
      }
    },
  },
});
