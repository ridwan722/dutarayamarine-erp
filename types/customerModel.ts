export interface customerM {
  id?: string;
  id_customer?: string;
  nama: string;
  /** Alamat perusahaan. */
  alamat: string;
  /** Field lama yang dipertahankan sementara untuk kompatibilitas data. */
  pic: string;
  no_telp: string;
  email: string;
  vessel: string;
  createdAt: number;
  createdBy: string;
  updatedAt?: number;
  updatedBy?: string;
}
