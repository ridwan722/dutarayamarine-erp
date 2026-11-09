import { defineStore } from "pinia";
import { collection, doc, getDocs, runTransaction } from "firebase/firestore";
import { useFirestore } from "vuefire";
import type { dokumenSpkM, penawaranM } from "~/types/penawaranModel";

type RootPenawaran = penawaranM & { jumlah_revisi?: number };

const operationalPenawaranKeys: (keyof penawaranM)[] = [
  "status",
  "id_invoice",
  "tanggal_kirim_penawaran",
  "terkirim_at",
  "terkirim_by",
  "spk_at",
  "spk_by",
  "tanggal_spk",
  "dokumen_spk",
  "pengeluaran",
  "grandtotal_pengeluaran",
];

function plainPenawaran(penawaran: penawaranM) {
  return JSON.parse(JSON.stringify(penawaran)) as penawaranM;
}

function revisionContent(penawaran: penawaranM) {
  const content = plainPenawaran(penawaran);
  delete content.id;
  delete content.id_penawaran;
  delete content.id_revisi;
  delete content.no_revisi;
  delete content.root_penawaran_id;
  delete content.revision_of;
  delete content.revision_number;
  delete content.revision_count;
  delete content.revision_created_at;
  delete content.revision_created_by;
  delete content.active_revision_id;
  delete content.active_revision_number;
  delete content.materialized_revision_id;
  delete content.materialized_revision_number;
  return content;
}

function originalRevisionId(rootPenawaranId: string) {
  return `${rootPenawaranId}-R00`;
}

function buildOriginalRevision(
  rootData: RootPenawaran,
  rootPenawaranId: string,
) {
  const snapshot = revisionContent(rootData);
  const revisionId = originalRevisionId(rootPenawaranId);

  return {
    ...snapshot,
    id_penawaran: rootPenawaranId,
    id_revisi: revisionId,
    no_revisi: "Rev. 00",
    root_penawaran_id: rootPenawaranId,
    revision_of: rootPenawaranId,
    revision_number: 0,
    revision_created_at:
      Number(rootData.created_at || rootData.createdAt) || 0,
    revision_created_by:
      rootData.created_by || rootData.createdBy || "-",
  } as penawaranM;
}

function buildMaterializedRoot(
  currentRoot: RootPenawaran,
  selectedRevision: penawaranM,
  rootPenawaranId: string,
  revisionCount: number,
  activeRevisionId: string,
  activeRevisionNumber: number,
  now: number,
  actor: string,
) {
  const versionContent = revisionContent(selectedRevision);
  const operationalData: Partial<penawaranM> = {};
  for (const key of operationalPenawaranKeys) {
    const value = currentRoot[key];
    if (value !== undefined) {
      (operationalData as Record<string, unknown>)[key] = value;
    }
  }

  const materializedId =
    activeRevisionId || originalRevisionId(rootPenawaranId);
  const materialized = {
    ...versionContent,
    ...operationalData,
    id_penawaran: rootPenawaranId,
    no_penawaran:
      currentRoot.no_penawaran || selectedRevision.no_penawaran || "",
    created_at:
      Number(currentRoot.created_at || currentRoot.createdAt) || 0,
    created_by:
      currentRoot.created_by || currentRoot.createdBy || "-",
    createdAt:
      Number(currentRoot.createdAt || currentRoot.created_at) || 0,
    createdBy:
      currentRoot.createdBy || currentRoot.created_by || "-",
    revision_number: activeRevisionNumber,
    revision_count: revisionCount,
    active_revision_id: activeRevisionId,
    active_revision_number: activeRevisionNumber,
    materialized_revision_id: materializedId,
    materialized_revision_number: activeRevisionNumber,
    updated_at: now,
    updated_by: actor,
    updatedAt: now,
    updatedBy: actor,
  } as penawaranM;

  if (activeRevisionId) {
    materialized.id_revisi = activeRevisionId;
    materialized.no_revisi = `Rev. ${String(activeRevisionNumber).padStart(2, "0")}`;
    materialized.root_penawaran_id = rootPenawaranId;
  }

  return materialized;
}

export const usePenawaranStore = defineStore("PenawaranStore", {
  state: () => {
    return {
      dataPenawaran: [] as penawaranM[],
      dataPenawaranTampil: [] as penawaranM[], // DATA FILTER (Untuk Tabel di Halaman)
      dataPenawaranLoaded: false,
      dataPenawaranScope: "",
      dataPenawaranLoadedAt: 0,
      detailPenawaran: {} as penawaranM,
      tgl_awal: "",
      tgl_akhir: "",

      // KHUSUS COUNTER SIDEBAR
      dataPenawaranDraft: [] as penawaranM[],

      // Data revisi subkoleksi lama tetap tersedia untuk kompatibilitas.
      dataRevisiPenawaran: [] as Record<string, any>[],

    };
  },

  getters: {
    getDataPenawaran(state) {
      return state.dataPenawaran;
    },

    getDataPenawaranTampil(state) {
      return state.dataPenawaranTampil;
    },

    getDataRevisiPenawaran(state) {
      return state.dataRevisiPenawaran;
    },

    getDetailPenawaran(state) {
      return state.detailPenawaran;
    },

    getPenawaranByStatus: (state) => {
      return (status: string) =>
        state.dataPenawaran.filter((p) => p.status === status);
    },

    getPenawaranById: (state) => {
      return (id: string) =>
        state.dataPenawaran.find((p) => p.id! === id);
    },
  },

  actions: {
    getCurrentDataScope() {
      const user = useUserStore();
      return `${user.getEmail.trim().toLowerCase()}::${user.getIdPerusahaan.trim()}`;
    },

    hasCachedData() {
      return (
        this.dataPenawaranLoaded &&
        this.dataPenawaranScope === this.getCurrentDataScope()
      );
    },

    upsertPenawaranLocal(penawaran: penawaranM) {
      const savedPenawaran = JSON.parse(
        JSON.stringify(penawaran),
      ) as penawaranM;
      const savedId = savedPenawaran.id || savedPenawaran.id_penawaran;
      const matchesPenawaran = (item: penawaranM) => {
        const itemId = item.id || item.id_penawaran;
        if (savedId && itemId) return savedId === itemId;

        return Boolean(
          !savedId &&
            !itemId &&
            savedPenawaran.no_penawaran &&
            item.no_penawaran === savedPenawaran.no_penawaran,
        );
      };
      const upsert = (items: penawaranM[]) => {
        const nextItems = [...items];
        const itemIndex = nextItems.findIndex(matchesPenawaran);

        if (itemIndex >= 0) {
          nextItems.splice(itemIndex, 1, savedPenawaran);
        } else {
          nextItems.unshift(savedPenawaran);
        }

        return nextItems;
      };

      this.dataPenawaran = upsert(this.dataPenawaran);
      this.dataPenawaranTampil = upsert(this.dataPenawaranTampil);

      if (matchesPenawaran(this.detailPenawaran)) {
        this.detailPenawaran = savedPenawaran;
      }
    },

    // CREATE
    async addPenawaranAct(lemparPenawaran: penawaranM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await setdatabase(
          "penawaran",
          lemparPenawaran.id_penawaran || lemparPenawaran.no_penawaran!,
          lemparPenawaran
        );

        await this.tarikDataPenawaranAct();

        notificationStore.showSuccess("Penawaran berhasil ditambahkan");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menyimpan penawaran");
        useloadingStore().setLoading(false);
      }
    },

    // UPDATE
    async updatePenawaranAct(lemparPenawaran: penawaranM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await updatedatabase(
          "penawaran",
          lemparPenawaran.id || lemparPenawaran.id_penawaran || lemparPenawaran.no_penawaran!,
          lemparPenawaran
        );

        this.upsertPenawaranLocal(lemparPenawaran);

        notificationStore.showSuccess("Penawaran berhasil diperbarui");
        return true;
      } catch (error) {
        notificationStore.showError("Gagal memperbarui penawaran");
        return false;
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async updatePenawaranStatusAct(idPenawaran: string, status: string) {
      const notificationStore = useNotificationStore();
      try {
        const now = Math.floor(Date.now() / 1000);
        const actor = useUserStore().getEmail || "-";
        await updatedatabase("penawaran", idPenawaran, {
          status,
          updated_at: now,
          updated_by: actor,
          updatedAt: now,
          updatedBy: actor,
        });

        const updateStatus = (items: penawaranM[]) =>
          items.map((item) =>
            (item.id || item.id_penawaran) === idPenawaran
              ? { ...item, status, updated_at: now, updated_by: actor }
              : item,
          );
        this.dataPenawaran = updateStatus(this.dataPenawaran);
        this.dataPenawaranTampil = updateStatus(this.dataPenawaranTampil);
        if (
          (this.detailPenawaran.id || this.detailPenawaran.id_penawaran) ===
          idPenawaran
        ) {
          this.detailPenawaran = {
            ...this.detailPenawaran,
            status,
            updated_at: now,
            updated_by: actor,
          };
        }
        return true;
      } catch (error) {
        console.error("Gagal memperbarui status penawaran:", error);
        notificationStore.showError("Gagal memperbarui status penawaran");
        return false;
      }
    },

    async saveSpkDocumentAct(
      idPenawaran: string,
      dokumenSpk: dokumenSpkM,
    ) {
      const notificationStore = useNotificationStore();
      try {
        const now = Math.floor(Date.now() / 1000);
        const actor = useUserStore().getEmail || "-";
        const currentPenawaran = [
          this.detailPenawaran,
          ...this.dataPenawaran,
          ...this.dataPenawaranTampil,
        ].find(
          (item) => (item.id || item.id_penawaran) === idPenawaran,
        );
        const update = {
          // Data invoice lama yang belum mempunyai lampiran SPK boleh
          // dilengkapi tanpa menurunkan statusnya kembali ke SPK.
          status:
            currentPenawaran?.status === "INVOICE" ? "INVOICE" : "SPK",
          dokumen_spk: dokumenSpk,
          tanggal_spk: new Date(now * 1000).toISOString().slice(0, 10),
          spk_at: now,
          spk_by: actor,
          updated_at: now,
          updated_by: actor,
          updatedAt: now,
          updatedBy: actor,
        };

        await updatedatabase("penawaran", idPenawaran, update);

        const applySpk = (items: penawaranM[]) =>
          items.map((item) =>
            (item.id || item.id_penawaran) === idPenawaran
              ? { ...item, ...update }
              : item,
          );
        this.dataPenawaran = applySpk(this.dataPenawaran);
        this.dataPenawaranTampil = applySpk(this.dataPenawaranTampil);
        if (
          (this.detailPenawaran.id || this.detailPenawaran.id_penawaran) ===
          idPenawaran
        ) {
          this.detailPenawaran = { ...this.detailPenawaran, ...update };
        }

        return true;
      } catch (error) {
        console.error("Gagal menyimpan dokumen SPK:", error);
        notificationStore.showError("Gagal menyimpan dokumen SPK");
        return false;
      }
    },

    async activateRevisionPenawaranAct(
      rootPenawaranId: string,
      revisionId = "",
    ) {
      const notificationStore = useNotificationStore();
      try {
        const db = useFirestore();
        const now = Math.floor(Date.now() / 1000);
        const actor = useUserStore().getEmail || "-";
        const materializedRoot = await runTransaction(
          db,
          async (transaction) => {
            const rootRef = doc(db, "penawaran", rootPenawaranId);
            const originalId = originalRevisionId(rootPenawaranId);
            const originalRef = doc(
              db,
              "penawaran",
              rootPenawaranId,
              "revisi_penawaran",
              originalId,
            );
            const targetRef = revisionId
              ? doc(
                  db,
                  "penawaran",
                  rootPenawaranId,
                  "revisi_penawaran",
                  revisionId,
                )
              : originalRef;

            const rootSnapshot = await transaction.get(rootRef);
            if (!rootSnapshot.exists()) {
              throw new Error("Penawaran induk tidak ditemukan");
            }
            const originalSnapshot = await transaction.get(originalRef);
            const targetSnapshot = revisionId
              ? await transaction.get(targetRef)
              : originalSnapshot;

            const rootData = rootSnapshot.data() as RootPenawaran;
            if (
              !originalSnapshot.exists() &&
              Number(rootData.materialized_revision_number) > 0
            ) {
              throw new Error(
                "Snapshot revisi 00 tidak ditemukan. Data induk tidak diubah untuk mencegah kehilangan versi awal.",
              );
            }

            const originalRevision = originalSnapshot.exists()
              ? (originalSnapshot.data() as penawaranM)
              : buildOriginalRevision(rootData, rootPenawaranId);
            if (revisionId && !targetSnapshot.exists()) {
              throw new Error("Revisi yang dipilih tidak ditemukan");
            }
            const selectedRevision = revisionId
              ? (targetSnapshot.data() as penawaranM)
              : originalRevision;
            const activeRevisionNumber = revisionId
              ? Number(selectedRevision.revision_number) || 0
              : 0;
            const revisionCount = Math.max(
              Number(rootData.revision_count) || 0,
              Number(rootData.jumlah_revisi) || 0,
              activeRevisionNumber,
            );
            const nextRoot = buildMaterializedRoot(
              rootData,
              selectedRevision,
              rootPenawaranId,
              revisionCount,
              revisionId,
              activeRevisionNumber,
              now,
              actor,
            );

            if (!originalSnapshot.exists()) {
              transaction.set(originalRef, originalRevision);
            }
            // Menulis ulang dokumen induk tidak menghapus subcollection.
            // Invoice, PO, dan riwayat revisi tetap berada di path yang sama.
            transaction.set(rootRef, nextRoot);

            return { ...nextRoot, id: rootPenawaranId } as penawaranM;
          },
        );

        this.upsertPenawaranLocal(materializedRoot);
        return materializedRoot;
      } catch (error) {
        console.error("Gagal menerapkan revisi ke penawaran induk:", error);
        notificationStore.showError(
          error instanceof Error
            ? error.message
            : "Gagal menerapkan revisi ke penawaran induk",
        );
        return null;
      }
    },

    async addRevisionPenawaranAct(
      sourcePenawaran: penawaranM,
      revisionDraft: penawaranM,
    ) {
      const notificationStore = useNotificationStore();
      const sourceId =
        sourcePenawaran.id || sourcePenawaran.id_penawaran || "";
      const sourceRevisionId = sourcePenawaran.id_revisi || sourceId;
      const rootPenawaranId =
        sourcePenawaran.root_penawaran_id || sourceId;

      if (!sourceId || !rootPenawaranId || !sourcePenawaran.no_penawaran) {
        notificationStore.showError("Data sumber revisi tidak lengkap");
        return null;
      }

      try {
        useloadingStore().setLoading(true);
        const db = useFirestore();
        const now = Math.floor(Date.now() / 1000);
        const actor = useUserStore().getEmail || "-";
        const plainDraft = JSON.parse(
          JSON.stringify(revisionDraft),
        ) as penawaranM;
        const {
          id: _listId,
          id_penawaran: _draftId,
          id_invoice: _invoiceId,
          revision_count: _draftRevisionCount,
          active_revision_id: _draftActiveRevisionId,
          active_revision_number: _draftActiveRevisionNumber,
          materialized_revision_id: _draftMaterializedRevisionId,
          materialized_revision_number: _draftMaterializedRevisionNumber,
          ...revisionData
        } = plainDraft;

        const revisionResult = await runTransaction(db, async (transaction) => {
          const rootRef = doc(db, "penawaran", rootPenawaranId);
          const rootSnapshot = await transaction.get(rootRef);
          if (!rootSnapshot.exists()) {
            throw new Error("Penawaran awal tidak ditemukan");
          }

          const rootData = rootSnapshot.data() as RootPenawaran;
          const currentRevisionCount = Math.max(
            Number(rootData.revision_count) || 0,
            Number(rootData.jumlah_revisi) || 0,
          );
          const revisionNumber = currentRevisionCount + 1;
          const revisionSuffix = String(revisionNumber).padStart(2, "0");
          const revisionId = `${rootPenawaranId}-R${revisionSuffix}`;
          const revisionRef = doc(
            db,
            "penawaran",
            rootPenawaranId,
            "revisi_penawaran",
            revisionId,
          );
          const originalId = originalRevisionId(rootPenawaranId);
          const originalRef = doc(
            db,
            "penawaran",
            rootPenawaranId,
            "revisi_penawaran",
            originalId,
          );
          const originalSnapshot = await transaction.get(originalRef);
          const revisionSnapshot = await transaction.get(revisionRef);
          if (revisionSnapshot.exists()) {
            throw new Error(
              `Revisi ${revisionSuffix} sudah ada. Muat ulang data lalu coba lagi.`,
            );
          }
          if (
            !originalSnapshot.exists() &&
            Number(rootData.materialized_revision_number) > 0
          ) {
            throw new Error(
              "Snapshot revisi 00 tidak ditemukan. Revisi baru dibatalkan untuk melindungi versi awal.",
            );
          }

          const originalRevision = originalSnapshot.exists()
            ? (originalSnapshot.data() as penawaranM)
            : buildOriginalRevision(rootData, rootPenawaranId);

          const payload: penawaranM = {
            ...revisionData,
            id_penawaran: rootPenawaranId,
            id_revisi: revisionId,
            no_revisi: `Rev. ${revisionSuffix}`,
            no_penawaran:
              rootData.no_penawaran || sourcePenawaran.no_penawaran,
            root_penawaran_id: rootPenawaranId,
            revision_of: sourceRevisionId,
            revision_number: revisionNumber,
            revision_created_at: now,
            revision_created_by: actor,
            created_at: now,
            created_by: actor,
            updated_at: now,
            updated_by: actor,
            createdAt: now,
            createdBy: actor,
            updatedAt: now,
            updatedBy: actor,
            status: "Draft",
          };
          const materializedRoot = buildMaterializedRoot(
            rootData,
            payload,
            rootPenawaranId,
            revisionNumber,
            revisionId,
            revisionNumber,
            now,
            actor,
          );

          if (!originalSnapshot.exists()) {
            transaction.set(originalRef, originalRevision);
          }
          transaction.set(revisionRef, payload);
          transaction.set(rootRef, materializedRoot);

          return {
            savedRevision: {
              ...payload,
              id: rootPenawaranId,
            } as penawaranM,
            materializedRoot: {
              ...materializedRoot,
              id: rootPenawaranId,
            } as penawaranM,
          };
        });
        const { savedRevision, materializedRoot } = revisionResult;
        this.upsertPenawaranLocal(materializedRoot);
        notificationStore.showSuccess(
          `Revisi ${String(savedRevision.revision_number).padStart(2, "0")} berhasil disimpan`,
        );
        return savedRevision;
      } catch (error) {
        console.error("Gagal membuat revisi penawaran:", error);
        notificationStore.showError(
          error instanceof Error
            ? error.message
            : "Gagal membuat revisi penawaran",
        );
        return null;
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async deleteRevisionPenawaranAct(
      rootPenawaranId: string,
      revision: penawaranM,
    ) {
      const notificationStore = useNotificationStore();
      const revisionId = revision.id_revisi || "";
      const revisionNumber = Number(revision.revision_number) || 0;

      if (
        !rootPenawaranId ||
        !revisionId ||
        revisionNumber <= 0 ||
        revisionId === originalRevisionId(rootPenawaranId)
      ) {
        notificationStore.showError("Revisi 00 tidak dapat dihapus");
        return false;
      }

      try {
        useloadingStore().setLoading(true);
        const db = useFirestore();
        const now = Math.floor(Date.now() / 1000);
        const actor = useUserStore().getEmail || "-";
        const revisionCollection = collection(
          db,
          "penawaran",
          rootPenawaranId,
          "revisi_penawaran",
        );
        const invoiceCollection = collection(
          db,
          "penawaran",
          rootPenawaranId,
          "invoice",
        );
        const [revisionSnapshots, invoiceSnapshots] = await Promise.all([
          getDocs(revisionCollection),
          getDocs(invoiceCollection),
        ]);
        const isUsedByInvoice = invoiceSnapshots.docs.some((snapshot) => {
          const invoice = snapshot.data() as {
            id_revisi_penawaran?: string;
            nomor_revisi_penawaran?: number;
          };
          if (invoice.id_revisi_penawaran) {
            return invoice.id_revisi_penawaran === revisionId;
          }
          return Number(invoice.nomor_revisi_penawaran) === revisionNumber;
        });

        if (isUsedByInvoice) {
          throw new Error(
            "Revisi sedang digunakan oleh invoice dan tidak dapat dihapus",
          );
        }

        const highestRemainingRevision = revisionSnapshots.docs.reduce(
          (highest, snapshot) => {
            if (snapshot.id === revisionId) return highest;
            const storedRevision = snapshot.data() as penawaranM;
            return Math.max(
              highest,
              Number(storedRevision.revision_number) || 0,
            );
          },
          0,
        );

        const updatedRoot = await runTransaction(db, async (transaction) => {
          const rootRef = doc(db, "penawaran", rootPenawaranId);
          const revisionRef = doc(
            db,
            "penawaran",
            rootPenawaranId,
            "revisi_penawaran",
            revisionId,
          );
          const rootSnapshot = await transaction.get(rootRef);
          const revisionSnapshot = await transaction.get(revisionRef);

          if (!rootSnapshot.exists()) {
            throw new Error("Penawaran induk tidak ditemukan");
          }
          if (!revisionSnapshot.exists()) {
            throw new Error("Revisi yang akan dihapus tidak ditemukan");
          }

          const rootData = rootSnapshot.data() as RootPenawaran;
          const activeRevisionNumber =
            Number(rootData.active_revision_number) || 0;
          const revisionIsActive =
            rootData.active_revision_id === revisionId ||
            rootData.materialized_revision_id === revisionId ||
            activeRevisionNumber === revisionNumber ||
            Number(rootData.materialized_revision_number) === revisionNumber;
          if (revisionIsActive) {
            throw new Error("Revisi yang sedang digunakan tidak dapat dihapus");
          }

          const currentRevisionCount = Math.max(
            Number(rootData.revision_count) || 0,
            Number(rootData.jumlah_revisi) || 0,
          );
          const nextRevisionCount =
            currentRevisionCount > revisionNumber
              ? currentRevisionCount
              : Math.max(highestRemainingRevision, activeRevisionNumber);
          const rootUpdate = {
            revision_count: nextRevisionCount,
            jumlah_revisi: nextRevisionCount,
            updated_at: now,
            updated_by: actor,
            updatedAt: now,
            updatedBy: actor,
          };

          transaction.delete(revisionRef);
          transaction.update(rootRef, rootUpdate);

          return {
            ...rootData,
            ...rootUpdate,
            id: rootPenawaranId,
          } as penawaranM;
        });

        this.upsertPenawaranLocal(updatedRoot);
        notificationStore.showSuccess(
          `Revisi ${String(revisionNumber).padStart(2, "0")} berhasil dihapus`,
        );
        return true;
      } catch (error) {
        console.error("Gagal menghapus revisi penawaran:", error);
        notificationStore.showError(
          error instanceof Error
            ? error.message
            : "Gagal menghapus revisi penawaran",
        );
        return false;
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    // DELETE
    async deletePenawaranAct(lemparinvoice: penawaranM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);

        await hapusdatabase(
          "penawaran",
          lemparinvoice.id || lemparinvoice.id_penawaran || lemparinvoice.no_penawaran!
        );
        await this.tarikDataPenawaranAct();

        notificationStore.showSuccess("Penawaran berhasil dihapus");
        useloadingStore().setLoading(false);
      } catch (error) {
        notificationStore.showError("Gagal menghapus penawaran");
        useloadingStore().setLoading(false);
      }
    },

    // READ
    // async tarikDataPenawaranAct() {
    //   const datatarik = await queryambilid("penawaran");
    //   this.dataPenawaran = datatarik as unknown as penawaranM[];
    // },

    async tarikDataPenawaranAct() {
      const companyId = useUserStore().getIdPerusahaan.trim();
      const currentScope = this.getCurrentDataScope();

      // Hindari data akun sebelumnya sempat tampil ketika berganti user.
      if (
        this.dataPenawaranScope !== currentScope &&
        (this.dataPenawaranLoaded || this.dataPenawaran.length)
      ) {
        this.dataPenawaran = [];
        this.dataPenawaranTampil = [];
        this.dataPenawaranLoaded = false;
      }

      const datatarik = companyId
        ? await queryambilidwhere("penawaran", "id_perusahaan", companyId)
        : await queryambilid("penawaran");
      const hasil = datatarik as unknown as penawaranM[];
      this.dataPenawaran = hasil; // Simpan ke Master
      this.dataPenawaranTampil = [...hasil]; // Default tampilkan semua
      this.dataPenawaranScope = currentScope;
      this.dataPenawaranLoaded = true;
      this.dataPenawaranLoadedAt = Date.now();
    },



    // Ambil data berdasarkan status (Panggil ini di halaman Proses/Sent/dll)
    async tarikdatapenawaranbystatus(status: string) {
      this.dataPenawaranTampil = [];
      const datatarik = await queryPenawaranBystatus(status);
      // JANGAN TIMPA this.dataPenawaran
      this.dataPenawaranTampil = datatarik as unknown as penawaranM[];
    },

    /**
     * KHUSUS SIDEBAR
     * STATUS DRAFT
     */
    async tarikdatapenawaranbystatusDraft(status: string) {
      const datatarik =
        await queryPenawaranBystatus(status);

      this.dataPenawaranDraft =
        datatarik as unknown as penawaranM[];
    },


    async tarikdatapenawaranbystatusarray(status: string[]) {
      const datatarik = await queryPenawaranBystatusarray(status);
      this.dataPenawaranTampil = datatarik as unknown as penawaranM[];
      // JANGAN timpa this.dataPenawaran di sini!
    },

    async tarikDetailPenawaranAct(id: string) {
      const datatarik = await tarikdetaildatabase("penawaran", id);
      this.detailPenawaran = datatarik as unknown as penawaranM;
    },

    async tarikDataPenawaranrevisAct(idPenawaran: string) {
      const datatarik = await queryambilid(
        `penawaran/${idPenawaran}/revisi_penawaran`,
      );
      this.dataRevisiPenawaran = datatarik as Record<string, any>[];
    },

    // async tarikdatapenawaranbystatus(status: string) {
    //   const datatarik = await queryPenawaranBystatus(status);
    //   this.dataPenawaran = datatarik as unknown as penawaranM[];
    // },

    //  async tarikdatapenawaranbystatusarray(status: string[]) {
    //   const datatarik = await queryPenawaranBystatusarray(status);
    //   this.dataPenawaran = datatarik as unknown as penawaranM[];
    // },

    async queryrekapanpenawaran(
      tgl_awal: string,
      tgl_akhir: string,
      nama_perusahaan: string,
      nama_cabang: string,
      status: string
    ) {
      try {
        useloadingStore().setLoading(true);

        this.tgl_awal = tgl_awal;
        this.tgl_akhir = tgl_akhir;
        const datatarik = await queryRekapanPenawaranByStatus
          (
            tgl_awal,
            tgl_akhir,
            nama_perusahaan,
            nama_cabang,
            status
          );
        this.dataPenawaran = datatarik as unknown as penawaranM[];
        useloadingStore().setLoading(false);
      } catch (error) {
        useloadingStore().setLoading(false);
      }
    },
  },
});
