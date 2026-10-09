export interface penawaranM {
  id?: string;
  id_penawaran?: string;
  no_penawaran?: string;

  id_perusahaan: string;
  pic: string;
  nama_perusahaan: string;
  alamat_perusahaan?: string;
  no_telp: string;
  email: string;
  vessel: string;

  tanggal_penawaran: string;

  created_at: number;
  created_by: string;

  status: string;

  tanggal_kirim_penawaran?: string;

  sign_by?: string;

  terkirim_at?: number;
  terkirim_by?: string;
  grandtotal_pengeluaran?: number;
  perihal: string; 
  pengeluaran?: pengeluaranM[];
  penawaran_item: penawaranItemM[]; 
  subtotal_penawaran: number;
  grand_total_penawaran: number;
  terbilang: string;

  spk_at?: number;
  spk_by?: string;
  tanggal_spk?: string;

  termCondition?: { id: string; nama_term: string }[];
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
}

