import { defineStore } from "pinia";
import {
  deleteDataRTB,
  getdatartb,
  setDataRTB,
  updateDataRTB,
  hapusartikelindex, // Reusable untuk clear cache jika perlu
} from "~/composables/firestore-realtime";
import type { ProjectM } from "~/types/projectRealTimeModel";

export const useProjectRealTimeStore = defineStore("ProjectStore", {
  state: () => ({
    dataProject: [] as ProjectM[],
  }),

  getters: {
    getDataProject: (state) => state.dataProject,
  },

  actions: {
    getNotifStore() {
      return useNotificationStore();
    },
    getLoadingStore() {
      return useloadingStore();
    },

    async saveProject(project: ProjectM) {
      const notif = this.getNotifStore();
      const loading = this.getLoadingStore();
      try {
        loading.setLoading(true);
        // Menggunakan slug sebagai key unik di Firebase
        await setDataRTB("projects", project.slug, project);
        await hapusartikelindex();
        notif.showSuccess("Project Berhasil Disimpan!");
        await this.tarikDataProject();
      } catch (error) {
        notif.showError("Gagal menyimpan project.");
      } finally {
        loading.setLoading(false);
      }
    },

    async deleteProject(id: string) {
      const notif = this.getNotifStore();
      const loading = this.getLoadingStore();
      try {
        loading.setLoading(true);
        await deleteDataRTB("projects", id);
        await this.tarikDataProject();
        notif.showSuccess("Project Berhasil Dihapus.");
      } catch (error) {
        notif.showError("Gagal menghapus project.");
      } finally {
        loading.setLoading(false);
      }
    },

    async tarikDataProject() {
      const datatarik = await getdatartb("projects");
      this.dataProject = (datatarik || []) as unknown as ProjectM[];
    },
  },
});
