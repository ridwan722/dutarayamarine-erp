import { defineStore } from "pinia";

export const useUserStore = defineStore("userstore", {
 state: () => ({
  user: null,
  email: "",
  displayName: "",
  role: "",
  idPerusahaan: "",
  namaPerusahaan: "",
  permissions: [] as string[],
  active: true,
  profileId: "",
  profileReady: false,
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
    getNamaPerusahaan: (s) => s.namaPerusahaan,
    getPermissions: (s) => s.permissions,
    canAccess: (s) => (permission: string) =>
      s.role.toLowerCase() === "administrator" || s.permissions.includes(permission),
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

    setProfile(profile: any) {
      this.profileId = profile.id ?? "";
      this.email = profile.email ?? this.email;
      this.displayName = profile.displayName ?? "";
      this.role = profile.role ?? "";
      this.idPerusahaan = profile.id_perusahaan ?? "";
      this.namaPerusahaan = profile.nama_perusahaan ?? "";
      this.permissions = Array.isArray(profile.permissions) ? profile.permissions : [];
      this.active = profile.active !== false;
    },

    logout() {
      this.$reset();
      // Logout adalah kondisi auth yang sudah diketahui, bukan proses rehydrate.
      // Biarkan middleware langsung melanjutkan ke halaman login.
      this.__authReady = true;
      this.profileReady = true;
    },
  },
});
