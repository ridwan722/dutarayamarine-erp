import { defineStore } from "pinia";
import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
  writeBatch,
} from "firebase/firestore";
import { useFirestore } from "vuefire";
import type { invoiceM } from "~/types/invoice";
import type { penawaranItemM, penawaranM } from "~/types/penawaranModel";
import { terbilang } from "~/composables/numeral";

const COLLECTION = "invoice";

function plainDocument<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function quotationRevisionContent(quotation: penawaranM) {
  const content = plainDocument(quotation);
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

function quotationItemsFromInvoice(
  invoice: invoiceM,
  currentQuotation: penawaranM,
): penawaranItemM[] {
  const currentItems = currentQuotation.penawaran_item || [];

  return (invoice.item_pekerjaan || []).map((item, index) => {
    const normalizedName = String(item.nama || "")
      .trim()
      .toLocaleLowerCase("id-ID");
    const matchingItem =
      currentItems.find(
        (candidate) =>
          String(candidate.nama || "").trim().toLocaleLowerCase("id-ID") ===
          normalizedName,
      ) || currentItems[index];
    const qty = Number(item.qty) || 0;
    const amount = Number(item.amount) || 0;

    return {
      nama: item.nama,
      qty,
      kategori_item: item.kategori_item,
      uom: item.uom,
      amount,
      subtotal_item: qty * amount,
      // Harga HPP hanya dimiliki quotation. Jangan hilangkan ketika invoice
      // menjadi sumber revisi.
      harga_hpp: Number(matchingItem?.harga_hpp) || 0,
    };
  });
}

function invoiceSharedUpdate(
  source: invoiceM,
  subtotal: number,
  discountRate: number,
) {
  const discount = Math.max(0, subtotal * discountRate);
  const normalizedDiscount =
    source.currency_inv === "IDR"
      ? Math.round(discount)
      : Math.round(discount * 100) / 100;
  const netSubtotal = Math.max(0, subtotal - normalizedDiscount);
  const ppn = source.pakai_ppn ? Math.round(netSubtotal * 0.11) : 0;
  const billedSubtotal = source.down_payment
    ? Math.round(netSubtotal * ((Number(source.dp_persen) || 0) / 100))
    : netSubtotal;

  return {
    id_customer: source.id_customer,
    id_pic: source.id_pic,
    nama_customer: source.nama_customer,
    alamat_customer: source.alamat_customer,
    vessel: source.vessel,
    no_telp: source.no_telp,
    email: source.email,
    pic: source.pic,
    location: source.location,
    currency_inv: source.currency_inv,
    perihal: source.perihal,
    item_pekerjaan: plainDocument(source.item_pekerjaan || []),
    sign_by: source.sign_by,
    subtotal_invoice: subtotal,
    discount_invoice: normalizedDiscount,
    ppn,
    grandtotal_invoice: billedSubtotal + ppn,
  };
}

export const useinvoiceStore = defineStore("invoiceStore", {
  state: () => ({
    dataInvoice: [] as invoiceM[],
    dataInvoiceLoaded: false,
    dataInvoiceScope: "",
    dataInvoiceLoadedAt: 0,
    detailInvoice: {} as invoiceM,
  }),

  getters: {
    getDataInvoice(state) {
      return state.dataInvoice;
    },
    getDetailInvoice(state) {
      return state.detailInvoice;
    },
  },

  actions: {
    getCurrentDataScope() {
      const user = useUserStore();
      return `${user.getEmail.trim().toLowerCase()}::${user.getIdPerusahaan.trim()}`;
    },

    hasCachedData() {
      return (
        this.dataInvoiceLoaded &&
        this.dataInvoiceScope === this.getCurrentDataScope()
      );
    },

    async tarikDataInvoiceAct() {
      const companyId = useUserStore().getIdPerusahaan.trim();
      const currentScope = this.getCurrentDataScope();

      // Hindari data akun sebelumnya sempat tampil ketika berganti user.
      if (
        this.dataInvoiceScope !== currentScope &&
        (this.dataInvoiceLoaded || this.dataInvoice.length)
      ) {
        this.dataInvoice = [];
        this.dataInvoiceLoaded = false;
      }

      const datatarik = companyId
        ? await queryambilidwhere(COLLECTION, "id_customer", companyId)
        : await queryambilid(COLLECTION);
      this.dataInvoice = datatarik as unknown as invoiceM[];
      this.dataInvoiceScope = currentScope;
      this.dataInvoiceLoaded = true;
      this.dataInvoiceLoadedAt = Date.now();
    },

    async tarikDetailInvoiceAct(id: string) {
      const datatarik = await tarikdetaildatabase2(COLLECTION, id);
      if (!datatarik) {
        throw new Error("Invoice tidak ditemukan");
      }
      this.detailInvoice = {
        ...(datatarik as invoiceM),
        id,
      };
      return this.detailInvoice;
    },

    async createInvoiceAct(data: invoiceM) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        const result = await createInvoice(data);
        // sessionStorage.removeItem(COLLECTION);
        notificationStore.showSuccess("Invoice berhasil dibuat");
        return result;
      } catch (error) {
        notificationStore.showError("Gagal membuat invoice");
        return null;
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async updateInvoiceAct(
      id: string,
      data: invoiceM,
      options: { showLoading?: boolean } = {},
    ) {
      const notificationStore = useNotificationStore();
      const showLoading = options.showLoading !== false;
      try {
        if (showLoading) useloadingStore().setLoading(true);
        const plainData = JSON.parse(JSON.stringify(data)) as invoiceM;
        const { id: _documentId, ...updateData } = plainData;

        const db = useFirestore();
        const batch = writeBatch(db);
        batch.update(doc(db, COLLECTION, id), updateData);

        const idPenawaran = updateData.id_penawaran;
        if (idPenawaran && idPenawaran !== "-") {
          batch.set(
            doc(db, "penawaran", idPenawaran, COLLECTION, id),
            updateData,
            { merge: true },
          );
        }

        await batch.commit();
        sessionStorage.removeItem(COLLECTION);
        if (idPenawaran && idPenawaran !== "-") {
          sessionStorage.removeItem(`penawaran/${idPenawaran}/${COLLECTION}`);
        }
        this.detailInvoice = { ...plainData, id };
        notificationStore.showSuccess("Perubahan berhasil disimpan");
        return true;
      } catch (error) {
        console.error("Gagal memperbarui invoice Solusi Nusa Segara:", error);
        notificationStore.showError("Gagal memperbarui invoice");
        return false;
      } finally {
        if (showLoading) useloadingStore().setLoading(false);
      }
    },

    /**
     * Merevisi invoice beserta quotation yang menjadi sumbernya dalam satu
     * transaksi Firestore. Semua invoice termin pada quotation yang sama ikut
     * menerima data komersial yang seragam, sedangkan status, tanggal bayar,
     * bukti bayar, dokumen, dan pengeluaran masing-masing tetap dipertahankan.
     */
    async reviseLinkedTransactionAct(id: string, data: invoiceM) {
      const notificationStore = useNotificationStore();
      const idPenawaran = data.id_penawaran;

      // Invoice manual tidak memiliki quotation untuk disinkronkan.
      if (!idPenawaran || idPenawaran === "-") {
        const updated = await this.updateInvoiceAct(id, data);
        return updated
          ? { affectedInvoices: 1, quotationRevisionNumber: 0 }
          : null;
      }

      try {
        useloadingStore().setLoading(true);
        const db = useFirestore();
        const actor = useUserStore().getEmail || "-";
        const now = Math.floor(Date.now() / 1000);
        const plainInvoice = plainDocument(data);
        delete plainInvoice.id;

        // Ambil ID dari kedua lokasi agar data lama yang hanya tersedia pada
        // salah satu collection ikut diperbaiki oleh transaksi ini.
        const [rootInvoicesSnapshot, mirroredInvoicesSnapshot] =
          await Promise.all([
            getDocs(
              query(
                collection(db, COLLECTION),
                where("id_penawaran", "==", idPenawaran),
              ),
            ),
            getDocs(collection(db, "penawaran", idPenawaran, COLLECTION)),
          ]);
        const linkedInvoiceIds = [
          ...new Set([
            id,
            ...rootInvoicesSnapshot.docs.map((snapshot) => snapshot.id),
            ...mirroredInvoicesSnapshot.docs.map((snapshot) => snapshot.id),
          ]),
        ];
        const linkedInvoiceFallbacks = new Map<string, invoiceM>([
          ...rootInvoicesSnapshot.docs.map(
            (snapshot) => [snapshot.id, snapshot.data() as invoiceM] as const,
          ),
          ...mirroredInvoicesSnapshot.docs.map(
            (snapshot) => [snapshot.id, snapshot.data() as invoiceM] as const,
          ),
        ]);

        const result = await runTransaction(db, async (transaction) => {
          const quotationRef = doc(db, "penawaran", idPenawaran);
          const targetInvoiceRef = doc(db, COLLECTION, id);
          const quotationSnapshot = await transaction.get(quotationRef);
          const targetInvoiceSnapshot = await transaction.get(targetInvoiceRef);

          if (!quotationSnapshot.exists()) {
            throw new Error("Quotation yang terhubung tidak ditemukan");
          }
          if (!targetInvoiceSnapshot.exists()) {
            throw new Error("Invoice yang akan direvisi tidak ditemukan");
          }

          const quotation = quotationSnapshot.data() as penawaranM;
          const storedTargetInvoice = targetInvoiceSnapshot.data() as invoiceM;
          if (storedTargetInvoice.id_penawaran !== idPenawaran) {
            throw new Error("Invoice tidak terhubung dengan quotation tersebut");
          }

          const revisionNumber =
            Math.max(
              Number(quotation.revision_count) || 0,
              Number(quotation.active_revision_number) || 0,
              Number(quotation.materialized_revision_number) || 0,
            ) + 1;
          const revisionSuffix = String(revisionNumber).padStart(2, "0");
          const revisionId = `${idPenawaran}-R${revisionSuffix}`;
          const originalRevisionId = `${idPenawaran}-R00`;
          const originalRevisionRef = doc(
            db,
            "penawaran",
            idPenawaran,
            "revisi_penawaran",
            originalRevisionId,
          );
          const revisionRef = doc(
            db,
            "penawaran",
            idPenawaran,
            "revisi_penawaran",
            revisionId,
          );
          const invoiceRevisionNumber =
            (Number(storedTargetInvoice.invoice_revision_count) || 0) + 1;
          const invoiceRevisionSuffix = String(invoiceRevisionNumber).padStart(
            2,
            "0",
          );
          const originalInvoiceRevisionRef = doc(
            db,
            COLLECTION,
            id,
            "revisi_invoice",
            `${id}-R00`,
          );
          const invoiceRevisionRef = doc(
            db,
            COLLECTION,
            id,
            "revisi_invoice",
            `${id}-R${invoiceRevisionSuffix}`,
          );

          const [
            originalRevisionSnapshot,
            revisionSnapshot,
            originalInvoiceRevisionSnapshot,
            invoiceRevisionSnapshot,
            ...linkedInvoiceSnapshots
          ] = await Promise.all([
            transaction.get(originalRevisionRef),
            transaction.get(revisionRef),
            transaction.get(originalInvoiceRevisionRef),
            transaction.get(invoiceRevisionRef),
            ...linkedInvoiceIds.map((invoiceId) =>
              transaction.get(doc(db, COLLECTION, invoiceId)),
            ),
          ]);

          if (revisionSnapshot.exists()) {
            throw new Error(
              `Revisi ${revisionSuffix} sudah ada. Muat ulang lalu coba lagi.`,
            );
          }
          if (invoiceRevisionSnapshot.exists()) {
            throw new Error(
              `Riwayat revisi invoice ${invoiceRevisionSuffix} sudah ada`,
            );
          }
          if (
            !originalRevisionSnapshot.exists() &&
            Number(quotation.materialized_revision_number) > 0
          ) {
            throw new Error(
              "Snapshot versi awal quotation tidak ditemukan. Revisi dibatalkan untuk melindungi riwayat.",
            );
          }

          const quotationItems = quotationItemsFromInvoice(
            plainInvoice,
            quotation,
          );
          const subtotal = quotationItems.reduce(
            (total, item) => total + Number(item.subtotal_item || 0),
            0,
          );
          const requestedDiscount = Math.min(
            subtotal,
            Math.max(0, Number(plainInvoice.discount_invoice) || 0),
          );
          const discountRate = subtotal > 0 ? requestedDiscount / subtotal : 0;
          const discountPercent = discountRate * 100;
          const grandTotal = Math.max(0, subtotal - requestedDiscount);
          const sharedQuotationData = {
            id_perusahaan: plainInvoice.id_customer,
            id_pic: plainInvoice.id_pic,
            nama_perusahaan: plainInvoice.nama_customer,
            alamat_perusahaan: plainInvoice.alamat_customer,
            vessel: plainInvoice.vessel,
            no_telp: plainInvoice.no_telp,
            email: plainInvoice.email,
            pic: plainInvoice.pic,
            location: plainInvoice.location,
            perihal: plainInvoice.perihal,
            currency: plainInvoice.currency_inv || "IDR",
            sign_by: plainInvoice.sign_by,
            penawaran_item: quotationItems,
            subtotal_penawaran: subtotal,
            discount_penawaran: discountPercent,
            grand_total_penawaran: grandTotal,
            terbilang: terbilang(grandTotal),
            termCondition: plainDocument(plainInvoice.termCondition || []),
          };
          const revisionPayload: penawaranM = {
            ...quotationRevisionContent(quotation),
            ...sharedQuotationData,
            id_penawaran: idPenawaran,
            id_revisi: revisionId,
            no_revisi: `Rev. ${revisionSuffix}`,
            root_penawaran_id: idPenawaran,
            revision_of:
              quotation.active_revision_id ||
              quotation.materialized_revision_id ||
              idPenawaran,
            revision_number: revisionNumber,
            revision_created_at: now,
            revision_created_by: actor,
            revision_source: "invoice",
            revision_source_invoice_id: id,
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

          if (!originalRevisionSnapshot.exists()) {
            transaction.set(originalRevisionRef, {
              ...quotationRevisionContent(quotation),
              id_penawaran: idPenawaran,
              id_revisi: originalRevisionId,
              no_revisi: "Rev. 00",
              root_penawaran_id: idPenawaran,
              revision_of: idPenawaran,
              revision_number: 0,
              revision_created_at:
                Number(quotation.created_at || quotation.createdAt) || 0,
              revision_created_by:
                quotation.created_by || quotation.createdBy || "-",
            });
          }
          transaction.set(revisionRef, revisionPayload);
          transaction.update(quotationRef, {
            ...sharedQuotationData,
            revision_number: revisionNumber,
            revision_count: revisionNumber,
            jumlah_revisi: revisionNumber,
            active_revision_id: revisionId,
            active_revision_number: revisionNumber,
            materialized_revision_id: revisionId,
            materialized_revision_number: revisionNumber,
            updated_at: now,
            updated_by: actor,
            updatedAt: now,
            updatedBy: actor,
          });

          if (!originalInvoiceRevisionSnapshot.exists()) {
            transaction.set(originalInvoiceRevisionRef, {
              ...plainDocument(storedTargetInvoice),
              invoice_revision_number: 0,
              invoice_revision_id: `${id}-R00`,
              invoice_revision_at: storedTargetInvoice.createdAt || 0,
              invoice_revision_by: storedTargetInvoice.createdBy || "-",
            });
          }
          transaction.set(invoiceRevisionRef, {
            ...plainInvoice,
            invoice_revision_number: invoiceRevisionNumber,
            invoice_revision_id: `${id}-R${invoiceRevisionSuffix}`,
            invoice_revision_at: now,
            invoice_revision_by: actor,
          });

          linkedInvoiceIds.forEach((invoiceId, index) => {
            const snapshot = linkedInvoiceSnapshots[index];
            const storedInvoice = snapshot?.exists()
              ? (snapshot.data() as invoiceM)
              : linkedInvoiceFallbacks.get(invoiceId) ||
                (invoiceId === id ? storedTargetInvoice : null);
            if (!storedInvoice) return;

            const sourceForCalculation =
              invoiceId === id
                ? plainInvoice
                : {
                    ...storedInvoice,
                    ...invoiceSharedUpdate(plainInvoice, subtotal, discountRate),
                  };
            const sharedInvoiceData = invoiceSharedUpdate(
              sourceForCalculation,
              subtotal,
              discountRate,
            );
            const invoiceUpdate = {
              ...(invoiceId === id ? plainInvoice : {}),
              ...sharedInvoiceData,
              id_penawaran: idPenawaran,
              no_penawaran: quotation.no_penawaran,
              id_revisi_penawaran: revisionId,
              nomor_revisi_penawaran: revisionNumber,
              invoice_revision_count:
                invoiceId === id
                  ? invoiceRevisionNumber
                  : Number(storedInvoice.invoice_revision_count) || 0,
              ...(invoiceId === id
                ? {
                    invoice_revision_number: invoiceRevisionNumber,
                    invoice_revision_id: `${id}-R${invoiceRevisionSuffix}`,
                    invoice_revision_at: now,
                    invoice_revision_by: actor,
                  }
                : {}),
            };

            transaction.set(doc(db, COLLECTION, invoiceId), invoiceUpdate, {
              merge: true,
            });
            transaction.set(
              doc(db, "penawaran", idPenawaran, COLLECTION, invoiceId),
              invoiceUpdate,
              { merge: true },
            );
          });

          return {
            savedInvoice: {
              ...plainInvoice,
              ...invoiceSharedUpdate(plainInvoice, subtotal, discountRate),
              id,
              id_revisi_penawaran: revisionId,
              nomor_revisi_penawaran: revisionNumber,
              invoice_revision_count: invoiceRevisionNumber,
              invoice_revision_number: invoiceRevisionNumber,
              invoice_revision_id: `${id}-R${invoiceRevisionSuffix}`,
              invoice_revision_at: now,
              invoice_revision_by: actor,
            } as invoiceM,
            affectedInvoices: linkedInvoiceIds.length,
            quotationRevisionNumber: revisionNumber,
          };
        });

        sessionStorage.removeItem(COLLECTION);
        sessionStorage.removeItem(`penawaran/${idPenawaran}/${COLLECTION}`);
        sessionStorage.removeItem(
          `penawaran/${idPenawaran}/revisi_penawaran`,
        );
        this.detailInvoice = result.savedInvoice;
        notificationStore.showSuccess(
          `Revisi tersimpan dan tersinkron ke quotation (Rev. ${String(result.quotationRevisionNumber).padStart(2, "0")})`,
        );
        return result;
      } catch (error) {
        console.error("Gagal merevisi transaksi invoice dan quotation:", error);
        notificationStore.showError(
          error instanceof Error
            ? error.message
            : "Gagal menyinkronkan revisi invoice dan quotation",
        );
        return null;
      } finally {
        useloadingStore().setLoading(false);
      }
    },

    async deleteInvoiceAct(id_penawaran: string, id: string) {
      const notificationStore = useNotificationStore();
      try {
        useloadingStore().setLoading(true);
        await hapusdatabase(COLLECTION, id);
        await hapusdatabase("penawaran/" + id_penawaran + "/invoice", id);
        await updatedatabase("penawaran", id_penawaran, { status: "Draft" });
        // sessionStorage.removeItem(COLLECTION);
        await this.tarikDataInvoiceAct();
        notificationStore.showSuccess("Invoice berhasil dihapus");
      } catch (error) {
        notificationStore.showError("Gagal menghapus invoice");
      } finally {
        useloadingStore().setLoading(false);
      }
    },
  },
});
