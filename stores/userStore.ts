import { defineStore } from "pinia";

export const useUserStore = defineStore("userstore", {
 state: () => ({
  user: null,
  email: "",
  displayName: "",
  role: "",
  idPerusahaan: "",
  __authReady: false, // ⭐ penting
}),

  getters: {
    isLoggedIn: (state) => !!state.user,
    isAdmin: (state) => state.role === "Administrator",
    isMasterPerusahaan: (state) =>
      state.role === "master_perusahaan" || state.role === "masterperusahaan",

    getUser: (s) => s.user,
    getEmail: (s) => s.email,
    getDisplayName: (s) => s.displayName,
    getRole: (s) => s.role,
    getIdPerusahaan: (s) => s.idPerusahaan,
  },

  actions: {
    setUser(user: any) {
      this.user = user;
    },

    setEmail(email: string) {
      this.email = email;
    },

    setDisplayname(name: string) {
      this.displayName = name;
    },

    setRole(role: string) {
      this.role = role;
    },

    setidPerusahaan(id: string) {
      this.idPerusahaan = id;
    },

    logout() {
      this.$reset();
    },
  },
});
