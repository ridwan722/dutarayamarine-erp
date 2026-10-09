import { defineStore } from "pinia";
import type { akunM, kategoriAkunM } from "~/types/akutansi";

export const useMasterAkunStore = defineStore("m_akun", {
  state: () => {
    return {
      dataMasterAkun: [] as akunM[],
      dataMasterKategoriAkun: [] as kategoriAkunM[],
    };
  },

  getters: {
    getDataAkun(state) {
      return state.dataMasterAkun;
    },

    getDataKategoriAkun(state) {
      return state.dataMasterKategoriAkun;
    },
  },

  actions: {
    // Template Kategori Akun
    async updateMasterTemplateKategoriAkunAct(
      lemparTemplateKategoriAkun: kategoriAkunM
    ) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await updatedatabase(
          "m_template_kategori",
          lemparTemplateKategoriAkun.id!,
          lemparTemplateKategoriAkun
        );
        sessionStorage.removeItem('m_template_kategori');
        this.tarikDataTemplateKategoriAkunAct();

        notificationStore.showSuccess("Perubahan berhasil disimpan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal memperbarui data");
      }
    },

    async addMasterTemplateKategoriAkunAct(lemparKategoriAkun: kategoriAkunM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await setdatabase(
          "m_template_kategori",
          lemparKategoriAkun.id!,
          lemparKategoriAkun
        );
        sessionStorage.removeItem('m_template_kategori');
        this.tarikDataTemplateKategoriAkunAct();

        notificationStore.showSuccess("Data berhasil ditambahkan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menyimpan data");
        useloadingStore().setLoading(false);
      }
    },

    async deleteMasterTemplateKategoriAkunAct(id: string) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await hapusdatabase("m_template_kategori", id);
        sessionStorage.removeItem('m_template_kategori');
        this.tarikDataTemplateKategoriAkunAct();

        notificationStore.showSuccess("Data Berhasil Dihapus");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menghapus data");
      }
    },

    async tarikDataTemplateKategoriAkunAct() {
      const datatarik = await queryambilidsesion("m_template_kategori");
      this.dataMasterKategoriAkun = datatarik as unknown as kategoriAkunM[];
    },

    // Kategori Akun
    async updateMasterKategoriAkunAct(lemparKategoriAkun: kategoriAkunM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await updatedatabase(
          "m_kategori_akun",
          lemparKategoriAkun.id!,
          lemparKategoriAkun
        );
        sessionStorage.removeItem('m_kategori_akun');
        this.tarikDataKategoriAkunAct();

        notificationStore.showSuccess("Perubahan berhasil disimpan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal memperbarui data");
      }
    },

    async addMasterKategoriAkunAct(lemparKategoriAkun: kategoriAkunM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await tambahdatabase("m_kategori_akun", lemparKategoriAkun);
        sessionStorage.removeItem('m_kategori_akun');
        this.tarikDataKategoriAkunAct();

        notificationStore.showSuccess("Data berhasil ditambahkan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menyimpan data");
        useloadingStore().setLoading(false);
      }
    },

    async deleteMasterKategoriAkunAct(id: string) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await hapusdatabase("m_kategori_akun", id);
        sessionStorage.removeItem('m_kategori_akun');
        this.tarikDataKategoriAkunAct();

        notificationStore.showSuccess("Data Berhasil Dihapus");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menghapus data");
      }
    },

    async tarikDataKategoriAkunAct() {
      const datatarik = await queryambilidsesion("m_kategori_akun");
      this.dataMasterKategoriAkun = datatarik as unknown as kategoriAkunM[];
    },

    // Akun
    async updateMasterAkunAct(lemparAkun: akunM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await updatedatabase("m_akun", lemparAkun.id!, lemparAkun);
        sessionStorage.removeItem('m_akun');
        this.tarikDataAkunAct();

        notificationStore.showSuccess("Perubahan berhasil disimpan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal memperbarui data");
      }
    },

    async addMasterAkunAct(lemparAkun: akunM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await tambahdatabase("m_akun", lemparAkun);
        sessionStorage.removeItem('m_akun');
        this.tarikDataAkunAct();

        notificationStore.showSuccess("Data berhasil ditambahkan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menyimpan data");
        useloadingStore().setLoading(false);
      }
    },

    async deleteMasterAkunAct(id: string) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await hapusdatabase("m_akun", id);
        sessionStorage.removeItem('m_akun');
        this.tarikDataAkunAct();

        notificationStore.showSuccess("Data Berhasil Dihapus");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menghapus data");
      }
    },

    async tarikDataAkunAct() {
      const datatarik = await queryambilidsesion("m_akun");
      this.dataMasterAkun = datatarik as unknown as akunM[];
    },

    // Template Akun
    async updateMasterTemplateAkunAct(lemparTemplateAkun: akunM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await updatedatabase(
          "m_template_akun",
          lemparTemplateAkun.id!,
          lemparTemplateAkun
        );
        sessionStorage.removeItem('m_template_akun');
        this.tarikDataTemplateAkunAct();

        notificationStore.showSuccess("Perubahan berhasil disimpan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal memperbarui data");
      }
    },

    async addMasterTemplateAkunAct(lemparTemplateAkun: akunM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await setdatabase(
          "m_template_akun",
          lemparTemplateAkun.id!,
          lemparTemplateAkun
        );
        sessionStorage.removeItem('m_template_akun');
        this.tarikDataTemplateAkunAct();

        notificationStore.showSuccess("Data berhasil ditambahkan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menyimpan data");
        useloadingStore().setLoading(false);
      }
    },

    async deleteMasterTemplateAkunAct(id: string) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await hapusdatabase("m_template_akun", id);
        sessionStorage.removeItem('m_template_akun');
        this.tarikDataTemplateAkunAct();

        notificationStore.showSuccess("Data Berhasil Dihapus");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menghapus data");
      }
    },

    async tarikDataTemplateAkunAct() {
      const datatarik = await queryambilidsesion("m_template_akun");
      this.dataMasterAkun = datatarik as unknown as akunM[];
    },
  },
});
