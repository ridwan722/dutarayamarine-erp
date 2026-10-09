export interface ProjectSeo {
  metaTitle: string;
  metaDescription: string;
  metaKeywords?: string[];
  ogImage?: string;
}

export interface ProjectDetail {
  duration: string;
  location: string;
  scope: string[]; // Contoh: ["NIB", "Izin Lokasi", "NPWP"]
}

export interface ProjectM {
  id?: string;
  title: string; // Nama Proyek (cth: Pengurusan PT Maju Jaya)
  slug: string; // slug-proyek-ini
  category: string; // Legalitas, Konstruksi, OSS, dsb.
  client: string; // Nama Perusahaan/Individu
  status: "In Progress" | "Completed" | "Pending";
  image: string; // URL Thumbnail
  id_image: string;
  description: string; // Ringkasan proyek
  published_at: string;
  details: ProjectDetail;
  seoMeta?: ProjectSeo;
}
