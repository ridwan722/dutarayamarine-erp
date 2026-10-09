import { defineStore } from "pinia";
import type { usersM } from "~/types/master/usersModel";

export const useMasterUsersStore = defineStore("users", {
  state: () => {
    return {
      dataMasterUsers: [] as usersM[],
    };
  },

  getters: {
    getDataUsers(state) {
      return state.dataMasterUsers;
    },
  },

  actions: {
    async updateMasterUsersAct(lemparUsers: usersM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await updatedatabase("users", lemparUsers.id!, lemparUsers);
        sessionStorage.removeItem('users')
        this.tarikDataUsersAct();

        notificationStore.showSuccess("Perubahan berhasil disimpan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal memperbarui data");
      }
    },

    async addMasterUsersAct(lemparUsers: usersM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await createUserApiMaster(
          lemparUsers.email,
          lemparUsers.displayName,
          lemparUsers.role
        );
        sessionStorage.removeItem('users')
        this.tarikDataUsersAct();

        notificationStore.showSuccess("Data berhasil ditambahkan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menyimpan data");
        useloadingStore().setLoading(false);
      }
    },

    async deleteMasterUsersAct(id: string) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await hapusdatabase("users", id);
        sessionStorage.removeItem('users')
        this.tarikDataUsersAct();

        notificationStore.showSuccess("Data Berhasil Dihapus");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menghapus data");
      }
    },

    async tarikDataUsersAct() {
      const datatarik = await queryambilidsesion("users");
      this.dataMasterUsers = datatarik as unknown as usersM[];
    },
  },
});
