import type { serviceReportM } from "./invoice";

export interface penawaranM {
  id?: string;
  id_penawaran?: string;
  id_invoice?: string;
  no_penawaran?: string;

  id_perusahaan: string;
  id_pic?: string;
  pic: string;
  nama_perusahaan: string;
  alamat_perusahaan?: string;
  no_telp: string;
  email: string;
  vessel: string;

  location: string;

  tanggal_penawaran: string;

  created_at: number;
  created_by: string;
  updated_at?: number;
  updated_by?: string;
  createdAt?: number;
  createdBy?: string;
  updatedAt?: number;
  updatedBy?: string;

  revision_number?: number;
  revision_count?: number;
  active_revision_id?: string;
  active_revision_number?: number;
  materialized_revision_id?: string;
  materialized_revision_number?: number;
  id_revisi?: string;
  no_revisi?: string;
  root_penawaran_id?: string;
  revision_of?: string;
  revision_created_at?: number;
  revision_created_by?: string;
  revision_source?: "quotation" | "invoice";
  revision_source_invoice_id?: string;

  status: string;

  tanggal_kirim_penawaran?: string;

  sign_by?: string;

  terkirim_at?: number;
  terkirim_by?: string;
  grandtotal_pengeluaran?: number;
  perihal: string; 
  currency: string;
  pengeluaran?: pengeluaranM[];
  penawaran_item: penawaranItemM[]; 
  subtotal_penawaran: number;
  discount_penawaran: number;
  grand_total_penawaran: number;
  terbilang: string;

  spk_at?: number;
  spk_by?: string;
  tanggal_spk?: string;
  dokumen_spk?: dokumenSpkM;
  service_report?: serviceReportM;

  termCondition?: { id: string; nama_term: string }[];
}

export interface dokumenSpkM {
  name: string;
  url?: string;
  dataUrl?: string;
  size: number;
  contentType: string;
  storagePath?: string;
  firestoreFileId?: string;
  chunkCount?: number;
  uploadedAt: number;
  uploadedBy: string;
}

export interface penawaranItemM {
  nama: string;
  harga_hpp?: number;
  qty: number;
  kategori_item: string;
  uom: string;
  amount: number;
  subtotal_item: number;
}

export interface pengeluaranM {
  id_pengeluaran: string;
  invoice_out?: string;
  tanggal_pengeluaran: string;
  dikeluarkan_oleh: string;
  keterangan: string;
  nominal: number;
  satuan: string;
  qty: number;

  status_pengeluaran: string,

  doc_pengeluaran: buktiPengeluaranM[];
  nama_vendor: string;
  no_telp_vendor: string;
  lokasi_vendor: string;
}


export interface buktiPengeluaranM {
  name: string;
  dataUrl: string;
  size: number;
  contentType: string;
  fileId?: string;
  storagePath?: string;
}

