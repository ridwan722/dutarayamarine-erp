export type PettyCashCategory = "Debet" | "Kredit";
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
}
