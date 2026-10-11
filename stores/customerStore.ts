import { defineStore } from "pinia";
import type { customerM } from "~/types/customerModel";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
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
      } catch (error) {
        notificationStore.showError("Gagal menyimpan customer");
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async updateCustomerAct(data: customerM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await updatedatabase(COLLECTION, data.id!, data);
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
  },
});
