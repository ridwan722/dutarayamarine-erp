export interface categoryProductServicePhotoM {
  name: string;
  url: string;
  storagePath?: string;
  size?: number;
  contentType?: string;
}

export interface categoryProductServiceM {
  id_category_product_service?: string;
  category_product_service: string;
  foto: categoryProductServicePhotoM[];
  createdAt: number;
  createdBy?: string;
  updatedAt?: number;
  updatedBy?: string;
}
