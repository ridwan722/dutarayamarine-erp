export default defineEventHandler(async (event) => {
  const body = await readBody<{ pin?: string }>(event);
  const config = useRuntimeConfig(event);

  if (!/^\d{6}$/.test(body.pin ?? "") || body.pin !== config.adminAccessPin) {
    throw createError({ statusCode: 401, statusMessage: "PIN tidak valid" });
  }

  setCookie(event, "sns_admin_access", "granted", {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "strict",
    secure: !import.meta.dev,
  });

  return { authorized: true };
});
