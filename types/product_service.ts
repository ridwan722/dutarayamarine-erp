export interface productServicePhotoM {
  name: string;
  url: string;
  storagePath?: string;
  size?: number;
  contentType?: string;
}

export interface productServiceM {
  id_product_service?: string;
  id_category_product_service: string[];
  nama_product_service: string;
  description: string;
  description_en: string;
  tags: string[];
  foto: productServicePhotoM[];
  createdAt: number;
  createdBy?: string;
  updatedAt?: number;
  updatedBy?: string;
}

// Alias sementara agar import lama tetap aman bila tipe ini pernah dipakai.
export type projectWebM = productServiceM;
