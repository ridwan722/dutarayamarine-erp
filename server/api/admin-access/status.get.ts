export default defineEventHandler((event) => ({
  authorized: getCookie(event, "sns_admin_access") === "granted",
}));
