import { getAuth, onAuthStateChanged, type User } from "firebase/auth";

export default defineNuxtPlugin(() => {
  const userstore = useUserStore();
  const auth = getAuth();

  return new Promise<void>((resolve) => {
    onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // Ambil custom claims
        const tokenResult = await firebaseUser.getIdTokenResult(true);
        const claims = tokenResult.claims as {
          role?: string;
          id_perusahaan?: string;
          [key: string]: any;
        };

        // Set store
        userstore.setUser(firebaseUser);
        userstore.setEmail(firebaseUser.email ?? "");
        userstore.setDisplayname(firebaseUser.displayName ?? "");
        userstore.setRole(claims.role ?? "");
        userstore.setidPerusahaan(claims.id_perusahaan ?? "");
      } else {
        userstore.logout();
      }

      // tandai auth selesai → middleware aman
      userstore.__authReady = true;

      resolve();
    });
  });
});
