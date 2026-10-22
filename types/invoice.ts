import type { termconditionM } from "./termconditionModel";
import type { pengeluaranM } from "./penawaranModel";

export interface invoiceItemM {
  nama: string;
  qty: number;
  kategori_item: string;
  uom: string;
  amount: number;
  subtotal_item: number;
}

export interface invoicePoDocumentM {
  name: string;
  dataUrl: string;
  size: number;
  contentType: string;
}

export interface invoiceBuktiBayarM {
  name: string;
  dataUrl: string;
  size: number;
  contentType: string;
}

export interface invoiceDoWrM {
  name: string;
  dataUrl: string;
  size: number;
  contentType: string;
}

export type invoiceCurrencyM = "IDR" | "USD" | "SGD";

export interface invoiceM {
  id?: string;
  id_invoice?: string;
  no_inv: string;

  id_customer: string;
  nama_customer: string;
  alamat_customer: string;
  vessel: string;
  no_telp: string;
  email: string;
  pic: string;

  location: string;

  id_penawaran?: string;
  no_penawaran?: string;
  tanggal_penawaran?: string;

  tanggal: string;
  currency_inv?: invoiceCurrencyM;
  perihal: string;
  item_pekerjaan: invoiceItemM[];
  pakai_ppn: boolean;
  subtotal_invoice: number;
  discount_invoice: number;
  ppn: number;
  grandtotal_invoice: number;
sign_by: string,
  status: string;
  createdAt: number;
  createdBy: string;
  dikirimAt?: number;
  dikirimBy?: string;
  selesaiAt?: number;
  selesaiBy?: string;

  termCondition: termconditionM[];

  tanggal_preorder?: string;
  no_preorder?: string;
  doc_preorder?: invoicePoDocumentM[];

  // BUKTI BAYAR
  tanggal_bayar: string,
  doc_bukti_bayar: invoiceBuktiBayarM[]
  doc_do_wr: invoiceDoWrM[]
  down_payment: boolean;
  dp_persen: number;
  pengeluaran?: pengeluaranM[];
  grandtotal_pengeluaran?: number;
}
