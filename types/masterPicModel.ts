export interface masterPicM {
  id?: string;
  id_master_pic?: string;
  id_perusahaan: string;
  nama_perusahaan?: string;
  pic: string;
  no_telp: string;
  email: string;
  createdAt: number;
  createdBy: string;
  updatedAt?: number;
  updatedBy?: string;
  /** Penanda data customer lama yang belum dipindahkan ke collection master_pic. */
  legacyCustomerId?: string;
}
