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
  storagePath?: string;
  firestoreFileId?: string;
  chunkCount?: number;
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
  storagePath?: string;
  firestoreFileId?: string;
  chunkCount?: number;
}

export interface serviceReportSectionM {
  id: string;
  point: string;
  sub: string;
  items: string[];
}

export interface serviceReportImageM {
  id: string;
  name: string;
  description?: string;
  dataUrl: string;
  size: number;
  contentType: string;
  isPlaceholder?: boolean;
  storagePath?: string;
  firestoreImageId?: string;
}

export interface serviceReportSectionBlockM {
  id: string;
  type: "section";
  sectionId: string;
}

export interface serviceReportImageRowBlockM {
  id: string;
  type: "image-row";
  imageIds: string[];
  height?: number;
}

export type serviceReportContentBlockM =
  | serviceReportSectionBlockM
  | serviceReportImageRowBlockM;

export type serviceReportRenderBlockM =
  | {
      key: string;
      type: "section";
      section: serviceReportSectionM;
      sectionId: string;
      pointNumber: number;
      itemOffset: number;
      showHeader: boolean;
      continuation: boolean;
    }
  | {
      key: string;
      type: "image-row";
      blockId: string;
      images: serviceReportImageM[];
      height: number;
    }
  | {
      key: "signatures";
      type: "signatures";
    };

export interface serviceReportM {
  quotationId?: string;
  vesselProject: string;
  attention: string;
  location: string;
  servicePeriodStart: string;
  servicePeriodEnd: string;
  scopeOfWork: string;
  reportNo: string;
  nama_teknisi?: string;
  jabatan_teknisi?: string;
  sections: serviceReportSectionM[];
  images: serviceReportImageM[];
  contentBlocks?: serviceReportContentBlockM[];
  createdAt: number;
  createdBy: string;
  updatedAt?: number;
  updatedBy?: string;
}

export type invoiceCurrencyM = "IDR" | "USD" | "SGD";

export interface invoiceM {
  id?: string;
  id_invoice?: string;
  no_inv: string;

  id_customer: string;
  id_pic?: string;
  nama_customer: string;
  alamat_customer: string;
  vessel: string;
  no_telp: string;
  email: string;
  pic: string;

  location: string;

  id_penawaran?: string;
  no_penawaran?: string;
  id_revisi_penawaran?: string;
  nomor_revisi_penawaran?: number;
  tanggal_penawaran?: string;

  // Audit revisi invoice. Field ini tidak mengubah status workflow/pembayaran.
  invoice_revision_count?: number;
  invoice_revision_number?: number;
  invoice_revision_id?: string;
  invoice_revision_at?: number;
  invoice_revision_by?: string;

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
  service_report?: serviceReportM;
  down_payment: boolean;
  dp_persen: number;
  pengeluaran?: pengeluaranM[];
  grandtotal_pengeluaran?: number;
}
