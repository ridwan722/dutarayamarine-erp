import { defineStore } from "pinia";
import { doc, writeBatch } from "firebase/firestore";
import { useFirestore } from "vuefire";
import type { invoiceM } from "~/types/invoice";

const COLLECTION = "invoice";

export const useinvoiceStore = defineStore("invoiceStore", {
  state: () => ({
    dataInvoice: [] as invoiceM[],
    detailInvoice: {} as invoiceM,
  }),

  getters: {
    getDataInvoice(state) {
      return state.dataInvoice;
    },
    getDetailInvoice(state) {
      return state.detailInvoice;
    },
  },

  actions: {
    async tarikDataInvoiceAct() {
      const datatarik = await queryambilid(COLLECTION);
      this.dataInvoice = datatarik as unknown as invoiceM[];
    },

    async tarikDetailInvoiceAct(id: string) {
      const datatarik = await tarikdetaildatabase2(COLLECTION, id);
      if (!datatarik) {
        throw new Error("Invoice tidak ditemukan");
      }
      this.detailInvoice = {
        ...(datatarik as invoiceM),
        id,
      };
      return this.detailInvoice;
    },

    async createInvoiceAct(data: invoiceM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        const result = await createInvoice(data);
        // sessionStorage.removeItem(COLLECTION);
        notificationStore.showSuccess("Invoice berhasil dibuat");
        return result;
      } catch (error) {
        notificationStore.showError("Gagal membuat invoice");
        return null;
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async updateInvoiceAct(id: string, data: invoiceM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        const plainData = JSON.parse(JSON.stringify(data)) as invoiceM;
        const { id: _documentId, ...updateData } = plainData;

        const db = useFirestore();
        const batch = writeBatch(db);
        batch.update(doc(db, COLLECTION, id), updateData);

        const idPenawaran = updateData.id_penawaran;
        if (idPenawaran && idPenawaran !== "-") {
          batch.set(
            doc(db, "penawaran", idPenawaran, COLLECTION, id),
            updateData,
            { merge: true },
          );
        }

        await batch.commit();
        sessionStorage.removeItem(COLLECTION);
        if (idPenawaran && idPenawaran !== "-") {
          sessionStorage.removeItem(`penawaran/${idPenawaran}/${COLLECTION}`);
        }
        this.detailInvoice = { ...plainData, id };
        notificationStore.showSuccess("Perubahan berhasil disimpan");
        return true;
      } catch (error) {
        console.error("Gagal memperbarui invoice Solusi Nusa Segara:", error);
        notificationStore.showError("Gagal memperbarui invoice");
        return false;
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async deleteInvoiceAct(id_penawaran: string, id: string) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await hapusdatabase(COLLECTION, id);
        await hapusdatabase("penawaran/" + id_penawaran + "/invoice", id);
        await updatedatabase("penawaran", id_penawaran, { status: "Draft" });
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataInvoiceAct();
        notificationStore.showSuccess("Invoice berhasil dihapus");
      } catch (error) {
        notificationStore.showError("Gagal menghapus invoice");
      } finally {
        useloadingStore().setLoading(false);
      }
    },
  },
});
