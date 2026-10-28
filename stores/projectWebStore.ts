import { defineStore } from "pinia";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import {
  deleteObject,
  ref as storageRef,
} from "firebase/storage";
import { useFirebaseStorage, useFirestore } from "vuefire";
import type {
  projectWebM,
  projectWebPhotoM,
} from "~/types/projectWebModel";

const COLLECTION = "project-web";

function normalizeProject(
  data: Partial<projectWebM>,
  id: string,
): projectWebM {
  const paragraphs = Array.isArray(data.paragraf)
    ? data.paragraf.map((item) => String(item || ""))
    : [];
  const englishParagraphs = Array.isArray(data.paragraf_en)
    ? data.paragraf_en.map((item) => String(item || ""))
    : [];

  return {
    id_project_web: id,
    judul: String(data.judul || ""),
    sub_judul: String(data.sub_judul || ""),
    paragraf: paragraphs,
    paragraf_en: paragraphs.map((_, index) => englishParagraphs[index] || ""),
    foto: Array.isArray(data.foto)
      ? data.foto
          .filter((item): item is projectWebPhotoM => Boolean(item?.url))
          .map((item) => ({
            name: String(item.name || "Foto project"),
            url: String(item.url),
            ...(item.storagePath
              ? { storagePath: String(item.storagePath) }
              : {}),
            ...(typeof item.size === "number" ? { size: item.size } : {}),
            ...(item.contentType
              ? { contentType: String(item.contentType) }
              : {}),
          }))
      : [],
    paragraf_penutup: String(data.paragraf_penutup || ""),
    paragraf_penutup_en: String(data.paragraf_penutup_en || ""),
    createdAt: Number(data.createdAt) || 0,
    ...(data.createdBy ? { createdBy: String(data.createdBy) } : {}),
    ...(data.updatedAt ? { updatedAt: Number(data.updatedAt) } : {}),
    ...(data.updatedBy ? { updatedBy: String(data.updatedBy) } : {}),
  };
}

export const useProjectWebStore = defineStore("projectWebStore", {
  state: () => ({
    dataProjectWeb: [] as projectWebM[],
  }),

  getters: {
    getDataProjectWeb(state) {
      return state.dataProjectWeb;
    },
  },

  actions: {
    async tarikDataProjectWebAct() {
      const db = useFirestore();
      const snapshot = await getDocs(collection(db, COLLECTION));
      this.dataProjectWeb = snapshot.docs.map((projectDocument) =>
        normalizeProject(projectDocument.data(), projectDocument.id),
      );
    },

    async deleteProjectPhotosAct(photos: projectWebPhotoM[]) {
      const paths = photos
        .map((photo) => photo.storagePath)
        .filter((path): path is string => Boolean(path));
      if (!paths.length) return;

      const storage = useFirebaseStorage();
      const results = await Promise.allSettled(
        paths.map((path) => deleteObject(storageRef(storage, path))),
      );
      const failures = results.filter((result) => result.status === "rejected");
      if (failures.length) {
        console.warn("Sebagian foto project gagal dihapus dari Storage", failures);
      }
    },

    async addProjectWebAct(data: projectWebM) {
      const notificationStore = useNotificationStore();
      const loadingStore = useloadingStore();

      try {
        loadingStore.setLoading(true);
        const db = useFirestore();
        const projectRef = doc(collection(db, COLLECTION));
        const project = normalizeProject(data, projectRef.id);

        await setDoc(projectRef, project, { merge: true });
        this.dataProjectWeb = [project, ...this.dataProjectWeb];
        notificationStore.showSuccess("Project website berhasil ditambahkan");
        return project;
      } catch (error) {
        console.error("Gagal menyimpan project website:", error);
        notificationStore.showError("Gagal menyimpan project website");
        return null;
      } finally {
        loadingStore.setLoading(false);
      }
    },

    async updateProjectWebAct(
      data: projectWebM,
      removedPhotos: projectWebPhotoM[] = [],
    ) {
      const notificationStore = useNotificationStore();
      const loadingStore = useloadingStore();
      const id = data.id_project_web;

      if (!id) {
        notificationStore.showError("ID project website tidak ditemukan");
        return null;
      }

      try {
        loadingStore.setLoading(true);
        const db = useFirestore();
        const project = normalizeProject(data, id);

        await setDoc(doc(db, COLLECTION, id), project, { merge: true });
        this.dataProjectWeb = this.dataProjectWeb.map((item) =>
          item.id_project_web === id ? project : item,
        );
        if (removedPhotos.length) {
          await this.deleteProjectPhotosAct(removedPhotos);
        }
        notificationStore.showSuccess("Project website berhasil diperbarui");
        return project;
      } catch (error) {
        console.error("Gagal memperbarui project website:", error);
        notificationStore.showError("Gagal memperbarui project website");
        return null;
      } finally {
        loadingStore.setLoading(false);
      }
    },

    async deleteProjectWebAct(project: projectWebM) {
      const notificationStore = useNotificationStore();
      const loadingStore = useloadingStore();
      const id = project.id_project_web;

      if (!id) {
        notificationStore.showError("ID project website tidak ditemukan");
        return false;
      }

      try {
        loadingStore.setLoading(true);
        const db = useFirestore();
        await deleteDoc(doc(db, COLLECTION, id));
        this.dataProjectWeb = this.dataProjectWeb.filter(
          (item) => item.id_project_web !== id,
        );
        await this.deleteProjectPhotosAct(project.foto || []);
        notificationStore.showSuccess("Project website berhasil dihapus");
        return true;
      } catch (error) {
        console.error("Gagal menghapus project website:", error);
        notificationStore.showError("Gagal menghapus project website");
        return false;
      } finally {
        loadingStore.setLoading(false);
      }
    },
  },
});
