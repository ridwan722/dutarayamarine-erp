import { defineStore } from "pinia";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useFirestore } from "vuefire";
import type { penomoranM } from "~/types/penomoranModel";

const COLLECTION = "penomoran";
const DOCUMENT_ID = "nomor";

const emptyPenomoran = (): penomoranM => ({
  no_inv: 0,
  no_penawaran: 0,
});

export const usePenomoranStore = defineStore("penomoranStore", {
  state: () => ({
    dataPenomoran: emptyPenomoran(),
  }),

  getters: {
    getDataPenomoran(state) {
      return state.dataPenomoran;
    },
  },

  actions: {
    async tarikDataPenomoranAct() {
      const db = useFirestore();
      const snapshot = await getDoc(doc(db, COLLECTION, DOCUMENT_ID));
      const data = snapshot.exists()
        ? (snapshot.data() as Partial<penomoranM>)
        : emptyPenomoran();

      this.dataPenomoran = {
        no_inv: Number(data.no_inv) || 0,
        no_penawaran: Number(data.no_penawaran) || 0,
      };

      return { ...this.dataPenomoran };
    },

    async updatePenomoranAct(data: penomoranM) {
      const notificationStore = useNotificationStore();
      const payload: penomoranM = {
        no_inv: Number(data.no_inv),
        no_penawaran: Number(data.no_penawaran),
      };

      try {
        const db = useFirestore();
        await setDoc(doc(db, COLLECTION, DOCUMENT_ID), payload, {
          merge: true,
        });
        this.dataPenomoran = { ...payload };
        notificationStore.showSuccess("Penomoran berhasil diperbarui");
        return { ...payload };
      } catch (error) {
        console.error("Gagal memperbarui penomoran:", error);
        notificationStore.showError("Gagal memperbarui penomoran");
        return null;
      }
    },
  },
});
