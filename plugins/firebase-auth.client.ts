import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { collection, doc, getDoc, getDocs, getFirestore, limit, query, where } from "firebase/firestore";

export default defineNuxtPlugin(() => {
  const userstore = useUserStore();
  const auth = getAuth();

  return new Promise<void>((resolve) => {
    onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      userstore.profileReady = false;
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

        try {
          // Profil aplikasi (termasuk hak akses menu) disimpan di Firestore.
          const db = getFirestore(firebaseUser.app);
          const profileSnapshot = await getDoc(doc(db, "users", firebaseUser.uid));
          let profile: any = profileSnapshot.exists()
            ? { id: profileSnapshot.id, ...profileSnapshot.data() }
            : null;

          // Kompatibilitas untuk data lama yang document id-nya bukan Firebase UID.
          if (!profile && firebaseUser.email) {
            const legacy = await getDocs(
              query(collection(db, "users"), where("email", "==", firebaseUser.email), limit(1)),
            );
            const first = legacy.docs[0];
            if (first) profile = { id: first.id, ...first.data() };
          }

          if (profile) userstore.setProfile(profile);
        } catch (error) {
          console.error("Gagal memuat profil dan hak akses user:", error);
        }
        if (!userstore.active) await auth.signOut();
      } else {
        userstore.logout();
      }

      // tandai auth selesai → middleware aman
      userstore.__authReady = true;
      userstore.profileReady = true;

      resolve();
    });
  });
});
