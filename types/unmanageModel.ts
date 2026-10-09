import type { ItemDokumenM } from "./master/kategoriModel";

export interface unmanageM {
    id?: string;
    id_kategori_item?: string;
    id_cabang: string;
    nama_cabang: string;
    id_perusahaan: string;
    nama_perusahaan: string;
    nama_group_pt: string;
    id_object_kategori: string;
    nama_kategori_object: string;
    nama_kategori_item: string;
    kode_kategori_item: string;
    dokumen: ItemDokumenM[];
    alasan_unmanage?: string;
    jumlahUnit: number;
    ukuran?: string[];
    periode: {
        mulai: string;
        selesai: string;
    };
    nominal?: number;
    keterangan: string;
    createdAt: number;
    createdBy: string;
    itemKategoriAt?: number;
    itemKategoriBy?: string;
    updatedAt?: number;
    updatedBy?: string;
    status?: string;
}