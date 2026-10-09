import { defineStore } from "pinia";
import { useloadingStore } from "./loadingStore";
import type { pettyCashM } from "~/types/pettyCashModel";

export const usepettyCashStore = defineStore("pettyCashAresa", {
    state: () => {
        return {
            dataPettyCash: [] as pettyCashM[],
            detailPettyCash: {} as pettyCashM,
        };
    },

    getters: {
        getDataPettyCash(state) {
            return state.dataPettyCash;
        },
        getDetailPettyCash(state) {
            return state.detailPettyCash;
        },
    },

    actions: {
        async addPettyCashAct(lemparpettyCash: pettyCashM) {
            const notificationStore = useNotificationStore();
            try {
                useloadingStore().setLoading(true);
                await tambahdatabase("pettyCash", lemparpettyCash);
                await this.tarikDataPettyCashAct();
                notificationStore.showSuccess("Data berhasil ditambahkan");
                useloadingStore().setLoading(false);
            } catch (error) {
                notificationStore.showError("Gagal menyimpan data");
                useloadingStore().setLoading(false);
            }
        },

        async updatePettyCashAct(lemparpettyCash: pettyCashM) {
            const notificationStore = useNotificationStore();
            try {
                useloadingStore().setLoading(true);
                await updatedatabase("pettyCash", lemparpettyCash.id!, lemparpettyCash);
                await this.tarikDataPettyCashAct();
                notificationStore.showSuccess("Data berhasil diupdate");
                useloadingStore().setLoading(false);
            } catch (error) {
                notificationStore.showError("Gagal menyimpan data");
                useloadingStore().setLoading(false);
            }
        },

        async addContactPettyCashAct(lemparpettyCash: pettyCashM) {
            const notificationStore = useNotificationStore();
            try {
                useloadingStore().setLoading(true);
                await updatedatabase("pettyCash", lemparpettyCash.id!, lemparpettyCash);
                await this.tarikDataPettyCashAct();
                notificationStore.showSuccess("Data berhasil ditambahkan");
                useloadingStore().setLoading(false);
            } catch (error) {
                notificationStore.showError("Gagal menyimpan data");
                useloadingStore().setLoading(false);
            }
        },

        async deletePettyCashAct(id: string) {
            const notificationStore = useNotificationStore();
            try {
                useloadingStore().setLoading(true);

                await hapusdatabase("pettyCash", id);
                sessionStorage.removeItem("pettyCash");
                await this.tarikDataPettyCashAct();

                notificationStore.showSuccess("Data Berhasil Dihapus");
                useloadingStore().setLoading(false);
            } catch (error) {
                notificationStore.showError("Gagal menghapus data");
            }
        },

        async tarikDataPettyCashAct() {
            const datatarik = await queryambilid("pettyCash");
            this.dataPettyCash = datatarik as unknown as pettyCashM[];
        },

        async tarikDetailPettyCashAct(id: string) {
            const datatarik = await tarikdetaildatabase("pettyCash", id);
            this.detailPettyCash = datatarik as unknown as pettyCashM;
        },
    },
});
