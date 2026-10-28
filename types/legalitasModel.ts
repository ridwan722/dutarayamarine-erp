export interface legalitasFileM {
  name: string;
  dataUrl: string;
  size: number;
  contentType: string;
}

export interface legalitasM {
  id?: string;
  title: string;
  shortTitle: string;
  description: string;
  reference: string;
  downloadName: string;
  icon: string;
  file: legalitasFileM;
  createdAt: number;
  createdBy: string;
  updatedAt?: number;
  updatedBy?: string;
  bundled?: boolean;
}
