export const ACCESS_OPTIONS = [
  { key: "dashboard", label: "Dashboard", path: "/admin" },
  { key: "quotation", label: "Quotation", path: "/admin/penawaran" },
  { key: "invoice", label: "Invoice", path: "/admin/invoice" },
  { key: "service_report", label: "Service Report", path: "/admin/service-report" },
  { key: "purchase_order", label: "Purchase Order", path: "/admin/purchase-order" },
  { key: "master_client", label: "Master Client", path: "/admin/master/client" },
  { key: "master_vendor", label: "Master Vendor", path: "/admin/master/vendor" },
  { key: "leads_web", label: "Leads Web", path: "/admin/master/leads-web" },
  { key: "projects_website", label: "Projects Website", path: "/admin/master/project-web" },
  { key: "products_website", label: "Product / Service Website", path: "/admin/master/product-service" },
  { key: "master_barang", label: "Master Barang / Service", path: "/admin/master/barang" },
  { key: "master_terms", label: "Master T&C", path: "/admin/master/termcondition" },
  { key: "petty_cash", label: "Keuangan Kantor", path: "/admin/petty-cash" },
  { key: "legalitas", label: "Legalitas", path: "/admin/legalitas" },
  { key: "numbering", label: "Penomoran", path: "/admin/master/penomoran" },
  { key: "user_management", label: "Master Users", path: "/admin/master/users" },
] as const;

export type AccessKey = (typeof ACCESS_OPTIONS)[number]["key"];

const normalizePath = (path: string) => path.replace(/\/+$/, "") || "/";

export const permissionForPath = (path: string): AccessKey | null => {
  const normalized = normalizePath(path);
  const match = [...ACCESS_OPTIONS]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) =>
      normalized === item.path ||
      (item.path !== "/admin" && normalized.startsWith(`${item.path}/`)),
    );
  return match?.key ?? null;
};

export const firstAllowedPath = (permissions: string[], role = "") => {
  if (role.toLowerCase() === "administrator") return "/admin";
  return ACCESS_OPTIONS.find((item) => permissions.includes(item.key))?.path ?? "/unauthorized";
};
