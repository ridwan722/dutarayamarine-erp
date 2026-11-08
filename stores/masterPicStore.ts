import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { defineStore } from "pinia";
import { useFirestore } from "vuefire";
import type { masterPicM } from "~/types/masterPicModel";

const COLLECTION = "master_pic";

export const useMasterPicStore = defineStore("masterPicStore", {
  state: () => ({
    dataMasterPic: [] as masterPicM[],
  }),

  getters: {
    getDataMasterPic: (state) => state.dataMasterPic,
  },

  actions: {
    async tarikDataMasterPicAct() {
      const db = useFirestore();
      const snapshot = await getDocs(collection(db, COLLECTION));
      this.dataMasterPic = await Promise.all(
        snapshot.docs.map(async (picDoc) => {
          const data = picDoc.data() as masterPicM;
          const idMasterPic = data.id_master_pic || picDoc.id;

          if (!data.id_master_pic) {
            try {
              await updateDoc(doc(db, COLLECTION, picDoc.id), {
                id_master_pic: idMasterPic,
              });
            } catch (error) {
              console.error(
                `Gagal menambahkan id_master_pic pada ${picDoc.id}:`,
                error,
              );
            }
          }

          return {
            ...data,
            id: picDoc.id,
            id_master_pic: idMasterPic,
          };
        }),
      );
    },

    async addMasterPicAct(data: masterPicM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        const picRef = await tambahdatabase(COLLECTION, data);
        await updatedatabase(COLLECTION, picRef.id, {
          id: picRef.id,
          id_master_pic: picRef.id,
        });
        await this.tarikDataMasterPicAct();
        notificationStore.showSuccess("PIC berhasil ditambahkan");
        return true;
      } catch (error) {
        console.error("Gagal menyimpan master PIC:", error);
        notificationStore.showError("Gagal menyimpan PIC");
        return false;
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async updateMasterPicAct(data: masterPicM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        const id = data.id_master_pic || data.id;
        if (!id) throw new Error("ID master PIC tidak ditemukan");
        await updatedatabase(COLLECTION, id, data);
        await this.tarikDataMasterPicAct();
        notificationStore.showSuccess("PIC berhasil diperbarui");
        return true;
      } catch (error) {
        console.error("Gagal memperbarui master PIC:", error);
        notificationStore.showError("Gagal memperbarui PIC");
        return false;
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async deleteMasterPicAct(id: string) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await hapusdatabase(COLLECTION, id);
        await this.tarikDataMasterPicAct();
        notificationStore.showSuccess("PIC berhasil dihapus");
        return true;
      } catch (error) {
        console.error("Gagal menghapus master PIC:", error);
        notificationStore.showError("Gagal menghapus PIC");
        return false;
      } finally {
        useloadingStore().setLoading(false);
      }
    },
  },
});
