import type { customerM } from "~/types/customerModel";
import type { masterPicM } from "~/types/masterPicModel";

export type CompanyMasterRow = customerM & {
  id: string;
  id_customer: string;
  sourceIds: string[];
};

export function normalizeCompanyName(value: string | null | undefined) {
  return (value || "").trim().toLocaleLowerCase("id-ID").replace(/\s+/g, " ");
}

export function buildCompanyMaster(customers: customerM[]): CompanyMasterRow[] {
  const groups = new Map<string, customerM[]>();

  customers.forEach((customer) => {
    const key = normalizeCompanyName(customer.nama);
    if (!key) return;
    const group = groups.get(key) || [];
    group.push(customer);
    groups.set(key, group);
  });

  return [...groups.values()]
    .map((group) => {
      const ordered = [...group].sort((a, b) => {
        const dateDifference = Number(a.createdAt || 0) - Number(b.createdAt || 0);
        if (dateDifference) return dateDifference;
        return String(a.id_customer || a.id || "").localeCompare(
          String(b.id_customer || b.id || ""),
        );
      });
      const primary = ordered[0];
      const primaryId = primary.id_customer || primary.id || "";
      const addressSource = ordered.find((item) => item.alamat?.trim()) || primary;

      return {
        ...primary,
        id: primaryId,
        id_customer: primaryId,
        nama: primary.nama.trim(),
        alamat: addressSource.alamat?.trim() || "",
        sourceIds: ordered
          .map((item) => item.id_customer || item.id || "")
          .filter(Boolean),
      };
    })
    .sort((a, b) =>
      a.nama.localeCompare(b.nama, "id-ID", { sensitivity: "base" }),
    );
}

export function buildLegacyMasterPics(
  customers: customerM[],
  companies: CompanyMasterRow[],
): masterPicM[] {
  const companyByName = new Map(
    companies.map((company) => [normalizeCompanyName(company.nama), company]),
  );

  return customers
    .filter((customer) =>
      Boolean(customer.pic?.trim() || customer.no_telp?.trim() || customer.email?.trim()),
    )
    .map((customer) => {
      const company = companyByName.get(normalizeCompanyName(customer.nama));
      const legacyCustomerId = customer.id_customer || customer.id || "";
      return {
        id: `legacy-${legacyCustomerId}`,
        id_master_pic: `legacy-${legacyCustomerId}`,
        id_perusahaan: company?.id_customer || legacyCustomerId,
        nama_perusahaan: company?.nama || customer.nama,
        pic: customer.pic?.trim() || "",
        no_telp: customer.no_telp?.trim() || "",
        email: customer.email?.trim() || "",
        createdAt: customer.createdAt || 0,
        createdBy: customer.createdBy || "",
        updatedAt: customer.updatedAt,
        updatedBy: customer.updatedBy,
        legacyCustomerId,
      };
    });
}

export function mergeMasterPics(
  masterPics: masterPicM[],
  legacyPics: masterPicM[],
  companies: CompanyMasterRow[],
) {
  const canonicalId = new Map<string, string>();
  companies.forEach((company) => {
    company.sourceIds.forEach((id) => canonicalId.set(id, company.id_customer || id));
  });

  const normalizedMaster = masterPics.map((pic) => ({
    ...pic,
    id_perusahaan: canonicalId.get(pic.id_perusahaan) || pic.id_perusahaan,
  }));
  const keys = new Set(
    normalizedMaster.map(
      (pic) => `${pic.id_perusahaan}|${pic.pic.trim().toLocaleLowerCase("id-ID")}`,
    ),
  );

  return [
    ...normalizedMaster,
    ...legacyPics.filter((pic) => {
      const key = `${pic.id_perusahaan}|${pic.pic.trim().toLocaleLowerCase("id-ID")}`;
      if (keys.has(key)) return false;
      keys.add(key);
      return true;
    }),
  ].sort((a, b) => a.pic.localeCompare(b.pic, "id-ID", { sensitivity: "base" }));
}
