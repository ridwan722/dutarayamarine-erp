import { defineStore } from 'pinia'

export const useloadingStore = defineStore('loading', {
  state: () => {
    return {
      isLoading : false,
    }
  },
  getters: {
    getLoading(state) {
      return state.isLoading
    }
  },
  actions: {
   async setLoading (payload : boolean) {
      this.isLoading = payload
    }
  }
})