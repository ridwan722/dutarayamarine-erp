import { defineStore } from "pinia";
import { useloadingStore } from "./loadingStore";
import type { pettyCashM } from "~/types/pettyCashModel";
import {
    collection,
    doc,
    getDocs,
    setDoc,
    writeBatch,
} from "firebase/firestore";
import { useFirestore } from "vuefire";

const PETTY_CASH_IMAGE_CHUNK_LENGTH = 600_000;
const PETTY_CASH_CHUNKS_PER_BATCH = 10;

async function persistPettyCashImages(id: string, images: string[]) {
    const db = useFirestore();
    const chunksRef = collection(db, "pettyCash", id, "bukti_chunks");
    const existing = await getDocs(chunksRef);
    let batch = writeBatch(db);
    let operationCount = 0;

    const commitIfFull = async () => {
        if (operationCount < PETTY_CASH_CHUNKS_PER_BATCH) return;
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
    };

    for (const chunk of existing.docs) {
        batch.delete(chunk.ref);
        operationCount++;
        await commitIfFull();
    }

    for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
        const image = images[imageIndex];
        const totalChunks = Math.max(1, Math.ceil(image.length / PETTY_CASH_IMAGE_CHUNK_LENGTH));
        for (let index = 0; index < totalChunks; index++) {
            const chunkRef = doc(chunksRef, `${imageIndex}_${String(index).padStart(6, "0")}`);
            batch.set(chunkRef, {
                imageIndex,
                index,
                totalChunks,
                data: image.slice(index * PETTY_CASH_IMAGE_CHUNK_LENGTH, (index + 1) * PETTY_CASH_IMAGE_CHUNK_LENGTH),
            });
            operationCount++;
            await commitIfFull();
        }
    }

    if (operationCount) await batch.commit();
}

async function loadPettyCashImages(id: string): Promise<string[] | null> {
    const db = useFirestore();
    const chunksRef = collection(db, "pettyCash", id, "bukti_chunks");
    const snapshot = await getDocs(chunksRef);
    if (snapshot.empty) return null;

    const grouped = new Map<number, { index: number; data: string }[]>();
    snapshot.docs.forEach((item) => {
        const chunk = item.data();
        const items = grouped.get(chunk.imageIndex) ?? [];
        items.push({ index: chunk.index, data: chunk.data });
        grouped.set(chunk.imageIndex, items);
    });
    return [...grouped.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, chunks]) => chunks.sort((a, b) => a.index - b.index).map((chunk) => chunk.data).join(""));
}

export const usepettyCashStore = defineStore("pettyCashAresa", {
    state: () => {
        return {
            dataPettyCash: [] as pettyCashM[],
            detailPettyCash: {} as pettyCashM,
        };
    },

    getters: {
        getDataPettyCash(state) {
            return state.dataPettyCash;
        },
        getDetailPettyCash(state) {
            return state.detailPettyCash;
        },
    },

    actions: {
        async addPettyCashAct(lemparpettyCash: pettyCashM) {
            const notificationStore = useNotificationStore();
            try {
                useloadingStore().setLoading(true);
                const db = useFirestore();
                const newDoc = doc(collection(db, "pettyCash"));
                const images = Array.isArray(lemparpettyCash.bukti)
                    ? lemparpettyCash.bukti
                    : lemparpettyCash.bukti ? [lemparpettyCash.bukti] : [];
                await persistPettyCashImages(newDoc.id, images);
                await setDoc(newDoc, { ...lemparpettyCash, id: newDoc.id, bukti: [] });
                await this.tarikDataPettyCashAct();
                notificationStore.showSuccess("Data berhasil ditambahkan");
                return true;
            } catch (error) {
                console.error("Gagal menambahkan petty cash", error);
                notificationStore.showError("Gagal menyimpan data");
                return false;
            } finally {
                useloadingStore().setLoading(false);
            }
        },

        async updatePettyCashAct(lemparpettyCash: pettyCashM) {
            const notificationStore = useNotificationStore();
            try {
                useloadingStore().setLoading(true);
                const images = Array.isArray(lemparpettyCash.bukti)
                    ? lemparpettyCash.bukti
                    : lemparpettyCash.bukti ? [lemparpettyCash.bukti] : [];
                await persistPettyCashImages(lemparpettyCash.id!, images);
                await updatedatabase("pettyCash", lemparpettyCash.id!, { ...lemparpettyCash, bukti: [] });
                await this.tarikDataPettyCashAct();
                notificationStore.showSuccess("Data berhasil diupdate");
                return true;
            } catch (error) {
                console.error("Gagal mengupdate petty cash", error);
                notificationStore.showError("Gagal menyimpan data");
                return false;
            } finally {
                useloadingStore().setLoading(false);
            }
        },

        async addContactPettyCashAct(lemparpettyCash: pettyCashM) {
            const notificationStore = useNotificationStore();
            try {
                useloadingStore().setLoading(true);
                await updatedatabase("pettyCash", lemparpettyCash.id!, lemparpettyCash);
                await this.tarikDataPettyCashAct();
                notificationStore.showSuccess("Data berhasil ditambahkan");
                useloadingStore().setLoading(false);
            } catch (error) {
                notificationStore.showError("Gagal menyimpan data");
                useloadingStore().setLoading(false);
            }
        },

        async deletePettyCashAct(id: string) {
            const notificationStore = useNotificationStore();
            try {
                useloadingStore().setLoading(true);

                await persistPettyCashImages(id, []);
                await hapusdatabase("pettyCash", id);
                sessionStorage.removeItem("pettyCash");
                await this.tarikDataPettyCashAct();

                notificationStore.showSuccess("Data Berhasil Dihapus");
                useloadingStore().setLoading(false);
            } catch (error) {
                notificationStore.showError("Gagal menghapus data");
            }
        },

        async tarikDataPettyCashAct() {
            const datatarik = await queryambilid("pettyCash");
            this.dataPettyCash = await Promise.all(
                (datatarik as unknown as pettyCashM[]).map(async (item) => {
                    if (!item.id) return item;
                    const bukti = await loadPettyCashImages(item.id);
                    return bukti ? { ...item, bukti } : item;
                }),
            );
        },

        async tarikDetailPettyCashAct(id: string) {
            const datatarik = await tarikdetaildatabase("pettyCash", id);
            this.detailPettyCash = datatarik as unknown as pettyCashM;
        },
    },
});
