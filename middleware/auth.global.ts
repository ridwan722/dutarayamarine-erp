export default defineNuxtRouteMiddleware(async (to) => {
  const user = useUserStore();

  // 🔥 Tunggu Firebase Auth rehydrate
  if (!user.__authReady) {
    await untilAuthIsReady(user);
  }

  // Akses admin hanya diberikan setelah PIN tervalidasi oleh server.
  if (to.path.startsWith("/admin")) {
    try {
      const access = await $fetch<{ authorized: boolean }>(
        "/api/admin-access/status",
      );

      if (!access.authorized) return navigateTo("/");
    } catch {
      return navigateTo("/");
    }
  }
});

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
