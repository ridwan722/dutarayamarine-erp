/* ============================================================
   MASTER DATA
============================================================ */

export interface CreateUserResponse {
  message: string;
  reg_id: string;
  uid: string,
  id_perusahaan : string
}


export interface akunM {
  id: string;
  kode_akun: string;
  nama_akun: string;
  tipe: string;
  kategori: string;
  posisi: string;
  parent?: string;
  aktif: boolean;
  kelompok: string;
  id_kategori?: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface kategoriAkunM {
  id: string;
  nama: string;
  tipe: string;
  posisi: string;
  kelompok: string;
  urutan: number;
  deskripsi?: string;
  aktif: boolean;
  id_perusahaan?: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface perusahaanM {
  id?: string;
  nama: string;
  alamat: string;
  npwp: string;
  telepon: string;
  email: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface usersM {
  id?: string;
  uid?: string;
  email: string;
  nama: string;
  role: string;
  id_perusahaan: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface departemenM {
  id?: string;
  nama: string;
  keterangan?: string;
  id_perusahaan: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface proyekM {
  id?: string;
  nama: string;
  kode: string;
  deskripsi?: string;
  pic?: string;
  client?: string;

  id_perusahaan?: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface vendorM {
  id?: string;
  nama: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  id_perusahaan: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface customerM {
  id?: string;
  nama: string;
  telepon?: string;
  email?: string;
  alamat?: string;
  id_perusahaan: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface produkM {
  id?: string;
  nama: string;
  sku: string;
  kategori: string;
  satuan: string;
  harga_beli: number;
  harga_jual: number;
  stok: number;
  id_perusahaan: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

/* ============================================================
   SALDO
============================================================ */

export interface saldoAwalM {
  id?: string;
  kode_akun: string;
  nama_akun: string;
  saldo_awal: number;
  posisi: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface saldoHarianM {
  id?: string;
  kode_akun: string;
  nama_akun: string;
  posisi: "Debit" | "Kredit";
  tanggal: string;
  total_debit: number;
  total_kredit: number;
  saldo: number;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

/* ============================================================
   KAS & BANK
============================================================ */

export interface akunKasM {
  id?: string;
  kode: string;
  nama: string;
}

export interface transaksiKasM {
  id?: string;
  tanggal: string;
  tipe: string;
  akun_kas: akunKasM[];
  akun_lawan: akunKasM[];
  keterangan: string;
  total: number;
  status_jurnal: boolean;
  id_perusahaan: string;

  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface transferBankM {
  id?: string;
  tanggal: string;
  dari_akun: akunKasM;
  ke_akun: akunKasM;
  jumlah: number;
  keterangan?: string;
  status_jurnal: boolean;
  id_perusahaan: string;

  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface rekonsiliasiBankM {
  id?: string;
  tanggal: string;
  akun: akunKasM;
  saldo_seharusnya: number;
  saldo_bank: number;
  selisih: number;
  catatan?: string;
  status_jurnal: boolean;
  id_perusahaan: string;

  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

/* ============================================================
   SALES / PENJUALAN
============================================================ */

export interface quotationM {
  id?: string;
  nomor: string;
  tanggal: string;
  customer_id: string;
  items: { produk_id: string; qty: number; harga: number; subtotal: number }[];
  total: number;
  status: "draft" | "approved";
  status_jurnal: boolean;
  id_perusahaan: string;

  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface invoicePenjualanM {
  id?: string;
  nomor: string;
  customer_id: string;
  tanggal: string;
  jatuh_tempo: string;
  items: { produk_id: string; qty: number; harga: number; subtotal: number }[];
  total: number;
  status: "belum_bayar" | "parsial" | "lunas";
  status_jurnal: boolean;
  id_perusahaan: string;

  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface pembayaranPenjualanM {
  id?: string;
  invoice_id: string;
  tanggal: string;
  jumlah: number;
  metode: string;
  akun_kas: akunKasM;
  status_jurnal: boolean;
  id_perusahaan: string;

  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface piutangM {
  id?: string;
  customer_id: string;
  invoice_id: string;
  saldo: number;
  last_update: string;
  id_perusahaan: string;
}

/* ============================================================
   PURCHASE / PEMBELIAN
============================================================ */

export interface purchaseRequestM {
  id?: string;
  nomor: string;
  tanggal: string;
  items: { produk_id: string; qty: number }[];
  status: "draft" | "approved";
  status_jurnal: boolean;
  id_perusahaan: string;

  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface purchaseOrderM {
  id?: string;
  nomor: string;
  vendor_id: string;
  tanggal: string;
  items: { produk_id: string; qty: number; harga: number; subtotal: number }[];
  total: number;
  status: "open" | "closed";
  status_jurnal: boolean;
  id_perusahaan: string;

  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface penerimaanBarangM {
  id?: string;
  po_id: string;
  tanggal: string;
  items: { produk_id: string; qty: number }[];
  status_jurnal: boolean;
  id_perusahaan: string;

  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface hutangM {
  id?: string;
  vendor_id: string;
  po_id: string;
  saldo: number;
  jatuh_tempo: string;
  status: "belum_bayar" | "parsial" | "lunas";
  id_perusahaan: string;
}

/* ============================================================
   INVENTORY
============================================================ */

export interface kartuStokM {
  id?: string;
  produk_id: string;
  tanggal: string;
  tipe: "in" | "out";
  qty: number;
  sumber: string;
  ref?: string;
  status_jurnal: boolean;
  id_perusahaan: string;

  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface penyesuaianStokM {
  id?: string;
  produk_id: string;
  tanggal: string;
  qty_selisih: number;
  alasan?: string;
  status_jurnal: boolean;
  id_perusahaan: string;

  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

/* ============================================================
   PRODUKSI
============================================================ */

export interface bomM {
  id?: string;
  produk_id: string;
  components: { bahan_id: string; qty: number }[];
  id_perusahaan: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface workOrderM {
  id?: string;
  nomor: string;
  produk_id: string;
  qty: number;
  tanggal_mulai: string;
  tanggal_selesai?: string;
  status: "draft" | "proses" | "selesai";
  id_perusahaan: string;

  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface produksiTahapM {
  id?: string;
  wo_id: string;
  tahap: "forming" | "las" | "penggabungan" | "cuci" | "pengecatan";
  pic?: string;
  waktu_mulai: string;
  waktu_selesai?: string;
  id_perusahaan: string;

  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface consumptionMaterialM {
  id?: string;
  wo_id: string;
  bahan_id: string;
  qty: number;
  tanggal: string;
  status_jurnal: boolean;
  id_perusahaan: string;

  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

/* ============================================================
   JURNAL
============================================================ */

export interface jurnalM {
  id?: string;
  tanggal: string;
  no_bukti?: string;
  keterangan: string;
  ref?: string | null;
  total_debit: number;
  total_kredit: number;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface jurnalDetailM {
  id?: string;
  kode_akun: string;
  nama_akun: string;
  posisi: "Debit" | "Kredit";
  nominal: number;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

export interface logJurnalM {
  id?: string;
  id_jurnal: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

/* ============================================================
   LAPORAN CACHE
============================================================ */

export interface laporanCacheM {
  id?: string;
  periode: string;
  jenis: "neraca_saldo" | "laba_rugi" | "neraca";
  data: Record<string, any>;
  generated_at: any;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}

