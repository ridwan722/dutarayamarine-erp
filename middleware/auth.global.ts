import { doc, getDoc, getFirestore } from "firebase/firestore";

export default defineNuxtRouteMiddleware(async (to) => {
  const user = useUserStore();

  // 🔥 Tunggu Firebase Auth rehydrate
  if (!user.__authReady) {
    await untilAuthIsReady(user);
  }

  if (to.path.startsWith("/admin")) {
    if (!user.isLoggedIn) return navigateTo("/");

    const { permissionForPath } = await import("~/utils/access-control");
    const permission = permissionForPath(to.path);
    if (!permission || !user.canAccess(permission)) return navigateTo("/unauthorized");

    const companyId = user.getIdPerusahaan.trim();
    if (companyId) {
      const routeScope = await getTransactionCompanyScope(to.path);
      if (routeScope && routeScope !== companyId) {
        return navigateTo("/unauthorized");
      }
    }
  }
});

async function getTransactionCompanyScope(path: string) {
  const segments = path.split("/").filter(Boolean).map(decodeURIComponent);
  if (segments[0] !== "admin" || !segments[2]) return "";

  let collectionName = "";
  let companyField = "";

  if (segments[1] === "penawaran") {
    collectionName = "penawaran";
    companyField = "id_perusahaan";
  } else if (
    segments[1] === "invoice" &&
    !["selesai", "dikirim"].includes(segments[2])
  ) {
    collectionName = "invoice";
    companyField = "id_customer";
  } else {
    return "";
  }

  try {
    const snapshot = await getDoc(
      doc(getFirestore(), collectionName, segments[2]),
    );
    if (!snapshot.exists()) return "";
    return String(snapshot.data()[companyField] || "");
  } catch (error) {
    console.error("Gagal memvalidasi akses perusahaan:", error);
    return "";
  }
}

function untilAuthIsReady(user: any) {
  return new Promise((resolve) => {
    if (!process.client) {
      // ❗ Di server kita tidak punya Firebase Auth async
      // jadi langsung lanjut saja
      return resolve(true);
    }

    const interval = setInterval(() => {
      if (user.__authReady) {
        clearInterval(interval);
        resolve(true);
      }
    }, 30);
  });
}
