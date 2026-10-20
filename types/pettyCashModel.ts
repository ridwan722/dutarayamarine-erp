export type OfficeTransactionCategory =
  | "Setoran Modal"
  | "Pendapatan Lainnya"
  | "Pengembalian Dana"
  | "Aset & Inventaris"
  | "Peralatan Kantor"
  | "Operasional Kantor"
  | "Utilitas"
  | "Transportasi"
  | "Konsumsi"
  | "Perawatan & Perbaikan"
  | "Sewa"
  | "Gaji & Tunjangan"
  | "Pajak & Administrasi"
  | "Lainnya";

// Debet/Kredit tetap diterima agar dokumen lama dapat dibaca dan diedit.
export type PettyCashCategory =
  | OfficeTransactionCategory
  | "Debet"
  | "Kredit";
export type PettyCashType = "in" | "out";

export interface pettyCashM {
  id?: string;
  createdBy?: string;
  createdAt?: number;
  updatedBy?: string;
  updatedAt?: number;
  dikeluarkan_oleh: string;
  amount: number;
  keterangan: string;
  // String tetap didukung untuk transaksi lama, array untuk bukti baru.
  bukti: string | string[];
  type: PettyCashType;
  tanggal: string;
  kategori: PettyCashCategory;
  nama_item?: string;
  qty?: number;
  satuan?: string;
  lokasi_aset?: string;
}
