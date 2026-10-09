import { defineStore } from 'pinia'
export const usePictureStore = defineStore('picture', {
  state: () => {
    return {
      statusupload: false,
      picture: '',
      pictures : [] as string[]
    }
  },
  getters: {
    getter_pic(state) {
      return state.picture
    },
    getter_pictures(state) {
      return state.pictures
    },
    getstatusupload(state) {
      return state.statusupload
    },
  },

  actions: {
    reset() {
      this.picture = ''
      this.pictures = [] as string[]
      this.statusupload = false
    },
    setStatusUpload(status: boolean) {
      this.statusupload = status
    },
    async setPic(url: string) {
      this.picture = url
    },
    async pushPic(url : string){
      this.pictures.push(url)
    },
    async removePic(url: string) {
      const index = this.pictures.indexOf(url)
      if (index !== -1) {
        this.pictures.splice(index, 1)
      }
    }
  },
})