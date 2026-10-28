export interface projectWebPhotoM {
  name: string;
  url: string;
  storagePath?: string;
  size?: number;
  contentType?: string;
}

export interface projectWebM {
  id_project_web?: string;
  judul: string;
  sub_judul: string;
  paragraf: string[];
  paragraf_en: string[];
  foto: projectWebPhotoM[];
  paragraf_penutup: string;
  paragraf_penutup_en: string;
  createdAt: number;
  createdBy?: string;
  updatedAt?: number;
  updatedBy?: string;
}
