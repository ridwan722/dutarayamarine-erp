import type { termconditionM } from "./termconditionModel";

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

export interface invoiceM {
  id?: string;
  id_invoice?: string;
  no_inv: string;
<<<<<<< HEAD

=======
  no_preorder?:string;
  doc_preorder?: invoicePoDocumentM[];
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
  id_customer: string;
  nama_customer: string;
  alamat_customer: string;
  vessel: string;
<<<<<<< HEAD
  no_telp: string;
  email: string;
  pic: string,

  id_penawaran?: string,
  no_penawaran?: string,
  tanggal_penawaran?: string,

=======
  id_penawaran?: string,
  no_penawaran?: string,
  no_telp: string;
  email: string;
  pic: string,
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
  tanggal: string;
  perihal: string;
  item_pekerjaan: invoiceItemM[];
  pakai_ppn: boolean;
  subtotal_invoice: number;
  ppn: number;
  grandtotal_invoice: number;
<<<<<<< HEAD
sign_by: string,
=======
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
  status: string;
  createdAt: number;
  createdBy: string;
  dikirimAt?: number;
  dikirimBy?: string;
  selesaiAt?: number;
  selesaiBy?: string;
<<<<<<< HEAD

  termCondition: termconditionM[];

  tanggal_preorder?: string;
  no_preorder?: string;
  doc_preorder?: invoicePoDocumentM[];

  // BUKTI BAYAR
  tanggal_bayar: string,
  doc_bukti_bayar: invoiceBuktiBayarM[]
  down_payment: false,
  dp_persen: 0,
=======
  termCondition: termconditionM[];

  // BUKTI BAYAR
  tanggal_bayar: string,
  doc_bukti_bayar: invoiceBuktiBayarM[]
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
}
