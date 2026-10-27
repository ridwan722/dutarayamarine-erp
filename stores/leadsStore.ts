import { defineStore } from "pinia";
import type { leadsM } from "~/types/leadsModel";
import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
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
      const db = useFirestore();
      const snapshot = await getDocs(collection(db, COLLECTION));
      this.dataLeads = snapshot.docs.map((leadDocument) => ({
        ...(leadDocument.data() as leadsM),
        // ID dokumen harus menjadi sumber utama agar delete selalu menuju
        // dokumen Firestore yang benar, termasuk untuk data leads lama.
        id_leads: leadDocument.id,
      }));
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
        return true;
      } catch (error) {
        console.error("Gagal menyimpan leads:", error);
        notificationStore.showError("Gagal menyimpan leads");
        return false;
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
        const db = useFirestore();
        await deleteDoc(doc(db, COLLECTION, id));
        this.dataLeads = this.dataLeads.filter(
          (leads) => leads.id_leads !== id,
        );
        notificationStore.showSuccess("leads berhasil dihapus");
        return true;
      } catch (error) {
        console.error("Gagal menghapus leads:", error);
        notificationStore.showError("Gagal menghapus leads");
        return false;
      } finally {
        useloadingStore().setLoading(false);
      }
    },
  },
});
