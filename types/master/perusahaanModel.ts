export interface perusahaanM {
  id?: string;
  nama_perusahaan: string;
  nama_group_pt: string;
  nama_surat?: string;
  alamat_perusahaan: string;
  telepon_perusahaan: string;
  createdAt: number;
  createdBy: string;
  updatedAt?: number;
  updatedBy?: string;
}

/* ================= CABANG ================= */
export interface cabangM {
  id?: string;
  id_perusahaan: string;
  nama_perusahaan: string;
  nama_group_pt: string;
  nama_cabang: string;
  alamat_cabang: string;
  createdAt: number;
  createdBy: string;
  updatedAt?: number;
  updatedBy?: string;
}
