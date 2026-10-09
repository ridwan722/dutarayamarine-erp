import type { termconditionM } from "./termconditionModel";

export type ItemType = 'price' | 'included' | 'description';
export type ItemUom = 'Set' | 'Sets' | 'Lot' | 'Pcs' | 'Unit';

export interface purchaseorderItemM {
  id?: string;
  nama: string;
  type: ItemType;
  qty: number;
  uom: ItemUom;
  price: number;
}

export interface purchaseorderSectionM {
  title: string;
  description: string;
  items: purchaseorderItemM[];
}

export interface purchaseorderM {
  id_purchaseorder?: string; // PO/DRM/2026/00001
  no_purchaseorder?: string;
  tgl_purchaseorder?: string;
  sign_po_by: string;

  no_quotation_from_vendor: string;

  currency: string;

  id_penawaran: string;
  no_penawaran: string; // QT/DRM/2026/00001
  tanggal_penawaran: string;

  payment: string;
  perihal_purchaseorder: string;

  item_purchaseorder: purchaseorderSectionM[];
  subtotal_purchaseorder: number;
  diskon_purchaseorder: number;
  grandtotal_purchaseorder: number;

  termCondition: termconditionM[];

  id_vendor: string;
  nama_vendor: string;
  pic_vendor: string,
  no_telp_vendor: string;
  alamat_vendor: string;
  email_vendor: string;
  createdAt?: number;
  updatedAt?: number;
  // createdBy: string;
}
