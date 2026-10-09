import _ from "lodash";
import { defineStore } from "pinia";
import { useloadingStore } from "./loadingStore";
import type { leadsM } from "~/types/leads";

export const useLeadsStore = defineStore("leadsAresa", {
  state: () => {
    return {
      dataLeads: [] as leadsM[],
      detailLeads: {} as leadsM,
    };
  },

  getters: {
    getDataLeads(state) {
      return state.dataLeads;
    },
    getDetailLeads(state) {
      return state.detailLeads;
    },
  },

  actions: {
    async addLeadsAct(lemparLeads: leadsM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await tambahdatabase("customer", lemparLeads);
        this.tarikDataLeadsAct();
        notificationStore.showSuccess("Data berhasil ditambahkan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menyimpan data");
        useloadingStore().setLoading(false);
      }
    },

    async addContactLeadsAct(lemparLeads: leadsM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await updatedatabase("customer", lemparLeads.id!, lemparLeads);
        this.tarikDataLeadsAct();
        notificationStore.showSuccess("Data berhasil ditambahkan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menyimpan data");
        useloadingStore().setLoading(false);
      }
    },

    async tarikDataLeadsAct() {
      const datatarik = await queryambilid("customer");
      this.dataLeads = datatarik as unknown as leadsM[];
    },

    async tarikDetailLeadsAct(id: string) {
      const datatarik = await tarikdetaildatabase("customer", id);
      this.detailLeads = datatarik as unknown as leadsM;
    },

    async tarikDataLeadsByStatusAct(status: string) {
      const datatarik = await queryTarikDataLeadsByStatus(status);
      this.dataLeads = datatarik as unknown as leadsM[];
    },
  },
});
