import { defineStore } from "pinia";
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut } from "firebase/auth";
import { deleteApp, getApp, initializeApp } from "firebase/app";
import { deleteDoc, doc, getFirestore, setDoc, updateDoc } from "firebase/firestore";
import type { usersM } from "~/types/master/usersModel";

export const useMasterUsersStore = defineStore("users", {
  state: () => ({ dataMasterUsers: [] as usersM[] }),

  getters: {
    getDataUsers: (state) => state.dataMasterUsers,
  },

  actions: {
    async addMasterUsersAct(user: usersM, password: string) {
      const secondaryApp = initializeApp(
        getApp().options,
        `create-user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      );
      const secondaryAuth = getAuth(secondaryApp);
      let createdUser: any = null;

      try {
        const credential = await createUserWithEmailAndPassword(
          secondaryAuth,
          user.email.trim().toLowerCase(),
          password,
        );
        createdUser = credential.user;
        const profile: usersM = {
          ...user,
          uid: credential.user.uid,
          email: user.email.trim().toLowerCase(),
          active: user.active !== false,
          permissions: user.permissions ?? [],
        };
        delete (profile as any).id;
        await setDoc(doc(getFirestore(), "users", credential.user.uid), profile);
      } catch (error) {
        // Hindari akun Authentication tanpa profil jika penyimpanan Firestore gagal.
        if (createdUser) await createdUser.delete().catch(() => undefined);
        throw error;
      } finally {
        await signOut(secondaryAuth).catch(() => undefined);
        await deleteApp(secondaryApp).catch(() => undefined);
      }

      sessionStorage.removeItem("users");
      await this.tarikDataUsersAct();
    },

    async updateMasterUsersAct(user: usersM) {
      if (!user.id) throw new Error("ID user tidak ditemukan");
      const payload = { ...user } as any;
      delete payload.id;
      delete payload.companyLabel;
      await updateDoc(doc(getFirestore(), "users", user.id), payload);
      sessionStorage.removeItem("users");
      await this.tarikDataUsersAct();
    },

    async deleteMasterUsersAct(id: string) {
      await deleteDoc(doc(getFirestore(), "users", id));
      sessionStorage.removeItem("users");
      await this.tarikDataUsersAct();
    },

    async sendResetPassword(email: string) {
      await sendPasswordResetEmail(getAuth(), email.trim().toLowerCase());
    },

    async tarikDataUsersAct() {
      const data = await queryambilidsesion("users");
      this.dataMasterUsers = (data as unknown as usersM[]).map((user) => ({
        ...user,
        id_perusahaan: user.id_perusahaan ?? "",
        active: user.active !== false,
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
      }));
    },
  },
});
