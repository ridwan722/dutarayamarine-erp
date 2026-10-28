import { defineStore } from "pinia";
import {
  collection,
  deleteField,
  doc,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { useFirestore } from "vuefire";
import type { legalitasM } from "~/types/legalitasModel";

const COLLECTION = "legalitas";

const initialLegalDocuments: legalitasM[] = [
  {
    id: "sk-pengesahan",
    title: "SK Pengesahan Badan Hukum",
    shortTitle: "SK Pengesahan",
    description:
      "Surat keputusan pengesahan badan hukum PT Duta Raya Marine dari Kementerian Hukum dan HAM.",
    reference: "Kementerian Hukum dan HAM",
    downloadName: "DRM-SK-Pengesahan-Badan-Hukum.pdf",
    icon: "mdi-gavel",
    file: {
      name: "cetak_sk_4026092321106948.pdf",
      dataUrl: "/legalitas/cetak_sk_4026092321106948.pdf",
      size: 343861,
      contentType: "application/pdf",
    },
    createdAt: 0,
    createdBy: "system",
    bundled: true,
  },
  {
    id: "akta-pendirian",
    title: "Akta Pendirian Perusahaan",
    shortTitle: "Akta Pendirian",
    description:
      "Dokumen pendirian dan dasar hukum pembentukan PT Duta Raya Marine.",
    reference: "Dokumen Pendirian Perseroan",
    downloadName: "DRM-Akta-Pendirian-Perusahaan.pdf",
    icon: "mdi-office-building-outline",
    file: {
      name: "Pendirian DRME.PDF",
      dataUrl: "/legalitas/Pendirian%20DRME.PDF",
      size: 17494040,
      contentType: "application/pdf",
    },
    createdAt: 0,
    createdBy: "system",
    bundled: true,
  },
  {
    id: "nib",
    title: "Nomor Induk Berusaha (NIB)",
    shortTitle: "NIB Perusahaan",
    description:
      "Identitas pelaku usaha dan bukti registrasi resmi PT Duta Raya Marine pada sistem perizinan berusaha.",
    reference: "Nomor Induk Berusaha",
    downloadName: "DRM-Nomor-Induk-Berusaha.pdf",
    icon: "mdi-identifier",
    file: {
      name: "NIB  PT DUTA RAYA MARINE.pdf",
      dataUrl: "/legalitas/NIB%20%20PT%20DUTA%20RAYA%20MARINE.pdf",
      size: 702246,
      contentType: "application/pdf",
    },
    createdAt: 0,
    createdBy: "system",
    bundled: true,
  },
  {
    id: "sertifikat-standar",
    title: "Sertifikat Standar KBLI 33121",
    shortTitle: "Sertifikat Standar",
    description:
      "Sertifikat standar kegiatan usaha reparasi kapal, perahu, dan bangunan terapung.",
    reference: "KBLI 33121",
    downloadName: "DRM-Sertifikat-Standar-KBLI-33121.pdf",
    icon: "mdi-certificate-outline",
    file: {
      name: "SERTIFIKAT STANDART 33121.pdf",
      dataUrl: "/legalitas/SERTIFIKAT%20STANDART%2033121.pdf",
      size: 640745,
      contentType: "application/pdf",
    },
    createdAt: 0,
    createdBy: "system",
    bundled: true,
  },
  {
    id: "npwp-perusahaan",
    title: "NPWP PT Duta Raya Marine",
    shortTitle: "NPWP Perusahaan",
    description:
      "Dokumen identitas perpajakan resmi milik PT Duta Raya Marine.",
    reference: "Nomor Pokok Wajib Pajak",
    downloadName: "DRM-NPWP-PT-Duta-Raya-Marine.pdf",
    icon: "mdi-card-account-details-outline",
    file: {
      name: "NPWP PT. Duta Raya Marine.pdf",
      dataUrl: "/legalitas/NPWP%20PT.%20Duta%20Raya%20Marine.pdf",
      size: 1008189,
      contentType: "application/pdf",
    },
    createdAt: 0,
    createdBy: "system",
    bundled: true,
  },
  {
    id: "dokumen-bank",
    title: "Dokumen Pendukung Pengajuan Bank",
    shortTitle: "Dokumen Bank",
    description:
      "Berkas NPWP dan identitas pendukung yang digunakan untuk proses administrasi perbankan.",
    reference: "Dokumen Administrasi Bank",
    downloadName: "DRM-Dokumen-Pendukung-Pengajuan-Bank.pdf",
    icon: "mdi-bank-outline",
    file: {
      name: "NPWP & KTP pengajuan bank.pdf",
      dataUrl: "/legalitas/NPWP%20%26%20KTP%20pengajuan%20bank.pdf",
      size: 703445,
      contentType: "application/pdf",
    },
    createdAt: 0,
    createdBy: "system",
    bundled: true,
  },
];

export const useLegalitasStore = defineStore("legalitasStore", {
  state: () => ({
    dataLegalitas: [] as legalitasM[],
  }),

  getters: {
    getDataLegalitas(state) {
      return state.dataLegalitas;
    },
  },

  actions: {
    async tarikDataLegalitasAct() {
      const documents = (await queryambilid(COLLECTION)) as legalitasM[];
      this.dataLegalitas = documents.sort((left, right) => {
        if (Boolean(left.bundled) !== Boolean(right.bundled)) {
          return left.bundled ? 1 : -1;
        }
        return (right.createdAt || 0) - (left.createdAt || 0);
      });
    },

    async initializeLegalitasAct() {
      try {
        await this.tarikDataLegalitasAct();
        const db = useFirestore();

        const documentsWithLegacyCategory = this.dataLegalitas.filter(
          (documentData) => "category" in documentData,
        );
        if (documentsWithLegacyCategory.length) {
          const cleanupBatch = writeBatch(db);
          documentsWithLegacyCategory.forEach((documentData) => {
            cleanupBatch.update(doc(db, COLLECTION, documentData.id!), {
              category: deleteField(),
            });
          });
          await cleanupBatch.commit();
          await this.tarikDataLegalitasAct();
        }

        if (this.dataLegalitas.length) return;

        const batch = writeBatch(db);
        initialLegalDocuments.forEach((documentData) => {
          const documentRef = doc(db, COLLECTION, documentData.id!);
          batch.set(documentRef, documentData);
        });
        await batch.commit();
        await this.tarikDataLegalitasAct();
      } catch (error) {
        // Dokumen bawaan tetap dapat diakses jika Firestore sedang bermasalah.
        this.dataLegalitas = initialLegalDocuments;
        throw error;
      }
    },

    async addLegalitasAct(data: legalitasM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        const db = useFirestore();
        const documentRef = doc(collection(db, COLLECTION));
        await setDoc(documentRef, { ...data, id: documentRef.id });
        await this.tarikDataLegalitasAct();
        notificationStore.showSuccess("Dokumen legalitas berhasil ditambahkan");
        return true;
      } catch (error) {
        console.error("Gagal menyimpan dokumen legalitas:", error);
        notificationStore.showError("Gagal menyimpan dokumen legalitas");
        return false;
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async updateLegalitasAct(data: legalitasM) {
      const notificationStore = useNotificationStore();
      if (!data.id) {
        notificationStore.showError("ID dokumen legalitas tidak ditemukan");
        return false;
      }

      try {
        useloadingStore().setLoading(true);
        await updatedatabase(COLLECTION, data.id, data);
        await this.tarikDataLegalitasAct();
        notificationStore.showSuccess("Dokumen legalitas berhasil diperbarui");
        return true;
      } catch (error) {
        console.error("Gagal memperbarui dokumen legalitas:", error);
        notificationStore.showError("Gagal memperbarui dokumen legalitas");
        return false;
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async deleteLegalitasAct(id: string) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await hapusdatabase(COLLECTION, id);
        await this.tarikDataLegalitasAct();
        notificationStore.showSuccess("Dokumen legalitas berhasil dihapus");
        return true;
      } catch (error) {
        console.error("Gagal menghapus dokumen legalitas:", error);
        notificationStore.showError("Gagal menghapus dokumen legalitas");
        return false;
      } finally {
        useloadingStore().setLoading(false);
      }
    },
  },
});
