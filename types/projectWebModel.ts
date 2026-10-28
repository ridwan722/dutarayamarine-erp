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
  foto: projectWebPhotoM[];
  paragraf_penutup: string;
  createdAt: number;
  createdBy?: string;
  updatedAt?: number;
  updatedBy?: string;
}
