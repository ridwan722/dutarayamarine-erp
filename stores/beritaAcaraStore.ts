import { defineStore } from "pinia";
import type { CompanyInspectionReport } from "~/types/beritaAcaraModel";

export const useBeritaAcaraStore = defineStore("beritaAcaraStore", {
  state: () => {
    return {
      dataBeritaAcara: [] as CompanyInspectionReport[],
    };
  },

  getters: {
    getDataBeritaAcara(state) {
      return state.dataBeritaAcara;
    },
  },

  actions: {
    // 1. Aksi untuk menarik data dari database
    async tarikDataBeritaAcaraAct() {
      try {
        const datatarik = await queryambilidsesion("berita_acara");
        this.dataBeritaAcara = datatarik as unknown as CompanyInspectionReport[];
      } catch (error) {
        console.error("Gagal menarik data Berita Acara:", error);
      }
    },

    // 2. Aksi untuk menambahkan laporan Berita Acara baru
    async addBeritaAcaraAct(lempar: CompanyInspectionReport) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        const result = await setberitaacara(lempar);
        if (result !== "ok") {
          throw new Error(result || "Gagal menyimpan laporan Berita Acara");
        }
        sessionStorage.removeItem("berita_acara");

        await this.tarikDataBeritaAcaraAct();
        notificationStore.showSuccess("Laporan berhasil ditambahkan");
        return true;
      } catch (error) {
        notificationStore.showError("Gagal menyimpan laporan Berita Acara");
        return false;
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    // 3. Aksi untuk memperbarui laporan Laporann yang ada
    async updateBeritaAcaraAct(lempar: CompanyInspectionReport) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await updatedatabase("berita_acara", lempar.id!, lempar);
        sessionStorage.removeItem("berita_acara");

        await this.tarikDataBeritaAcaraAct();
        notificationStore.showSuccess("Perubahan berhasil disimpan");
        return true;
      } catch (error) {
        notificationStore.showError("Gagal memperbarui data Laporann");
        return false;
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    // 4. Aksi untuk menghapus data laporan Laporann
    async deleteBeritaAcaraAct(id: string) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await hapusdatabase("berita_acara", id);
        sessionStorage.removeItem("berita_acara");

        await this.tarikDataBeritaAcaraAct();
        notificationStore.showSuccess("Laporan berhasil dihapus");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menghapus data Laporann");
        useloadingStore().setLoading(false);
      }
    },
  },
});
