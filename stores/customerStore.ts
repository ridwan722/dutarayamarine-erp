import { defineStore } from "pinia";
import type { customerM } from "~/types/customerModel";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useFirestore } from "vuefire";

const COLLECTION = "customer";

export const usecustomerStore = defineStore("customerStore", {
  state: () => ({
    dataCustomer: [] as customerM[],
  }),

  getters: {
    getDataCustomer(state) {
      return state.dataCustomer;
    },
  },

  actions: {
    async tarikDataCustomerAct() {
      const db = useFirestore();
      const snapshot = await getDocs(collection(db, COLLECTION));
      this.dataCustomer = await Promise.all(
        snapshot.docs.map(async (customerDoc) => {
          const data = customerDoc.data() as customerM;
          const idCustomer = data.id_customer || customerDoc.id;

          if (!data.id_customer) {
            try {
              await updateDoc(doc(db, COLLECTION, customerDoc.id), {
                id_customer: idCustomer,
              });
            } catch (error) {
              console.error(
                `Gagal menambahkan id_customer pada client ${customerDoc.id}:`,
                error,
              );
            }
          }

          return {
            ...data,
            id: customerDoc.id,
            id_customer: idCustomer,
          };
        }),
      );
    },

    async cariNamaPerusahaanAct(companyId: string) {
      if (!companyId) return "";

      const cachedCustomer = this.dataCustomer.find(
        (customer) =>
          customer.id_customer === companyId || customer.id === companyId,
      );
      if (cachedCustomer?.nama) return cachedCustomer.nama;

      const db = useFirestore();
      const directSnapshot = await getDoc(doc(db, COLLECTION, companyId));
      if (directSnapshot.exists()) {
        return String(directSnapshot.data().nama || "");
      }

      const matchingSnapshot = await getDocs(
        query(
          collection(db, COLLECTION),
          where("id_customer", "==", companyId),
          limit(1),
        ),
      );
      return String(matchingSnapshot.docs[0]?.data().nama || "");
    },

    async addCustomerAct(data: customerM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        const customerRef = await tambahdatabase(COLLECTION, data);
        // Simpan ID dokumen Firestore di dalam data customer.
        await updatedatabase(COLLECTION, customerRef.id, {
          id: customerRef.id,
          id_customer: customerRef.id,
        });
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataCustomerAct();
        notificationStore.showSuccess("Customer berhasil ditambahkan");
        return true;
      } catch (error) {
        notificationStore.showError("Gagal menyimpan customer");
        return false;
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async updateCustomerAct(data: customerM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await updatedatabase(COLLECTION, data.id_customer!, data);
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataCustomerAct();
        notificationStore.showSuccess("Perubahan berhasil disimpan");
      } catch (error) {
        notificationStore.showError("Gagal memperbarui customer");
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async deleteCustomerAct(id: string) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await hapusdatabase(COLLECTION, id);
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataCustomerAct();
        notificationStore.showSuccess("Customer berhasil dihapus");
      } catch (error) {
        notificationStore.showError("Gagal menghapus customer");
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async updateCustomerGroupAct(ids: string[], data: Partial<customerM>) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await Promise.all(ids.map((id) => updatedatabase(COLLECTION, id, data)));
        await this.tarikDataCustomerAct();
        notificationStore.showSuccess("Perusahaan berhasil diperbarui");
        return true;
      } catch (error) {
        console.error("Gagal memperbarui grup perusahaan:", error);
        notificationStore.showError("Gagal memperbarui perusahaan");
        return false;
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async deleteCustomerGroupAct(ids: string[]) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await Promise.all(ids.map((id) => hapusdatabase(COLLECTION, id)));
        await this.tarikDataCustomerAct();
        notificationStore.showSuccess("Perusahaan berhasil dihapus");
        return true;
      } catch (error) {
        console.error("Gagal menghapus grup perusahaan:", error);
        notificationStore.showError("Gagal menghapus perusahaan");
        return false;
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async clearLegacyPicAct(id: string) {
      try {
        await updatedatabase(COLLECTION, id, {
          pic: "",
          no_telp: "",
          email: "",
          vessel: "",
        });
        await this.tarikDataCustomerAct();
        return true;
      } catch (error) {
        console.error("Gagal membersihkan data PIC lama:", error);
        useNotificationStore().showError("Gagal memproses data PIC lama");
        return false;
      }
    },
  },
});
