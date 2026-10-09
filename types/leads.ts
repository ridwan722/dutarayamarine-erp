export interface leadsM {
  // 1. Identitas Utama (Primary Key)
  id?: string;

  // 2. Informasi Utama Customer
  nama_customer: string;
  nama_pt: string;
  no_telfon: string;
  status?: string;
  tanggal?: string;

  // 3. Informasi Alamat/Lokasi
  address_leads?: string;
  city_leads?: string;
  country_leads?: string;

  // 4. Metadata & Audit Trails (Selalu di bawah)
  createdAt: number;
  createdBy: string;
  updatedAt?: number;
  updatedBy?: string;
}
