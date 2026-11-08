import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  type DocumentData,
  type DocumentReference,
} from "firebase/firestore";
import { useFirestore } from "vuefire";

export interface CompanyMergePreview {
  targetId: string;
  targetName: string;
  sourceIds: string[];
  sourceNames: string[];
  penawaran: number;
  invoices: number;
  mirroredInvoices: number;
  masterPics: number;
  beritaAcara: number;
  legacyPics: number;
  totalReferences: number;
}

type MergeOperation = {
  type: "update" | "set";
  ref: DocumentReference<DocumentData>;
  data: Record<string, unknown>;
};

interface MergeAnalysis {
  preview: CompanyMergePreview;
  target: { id: string; data: Record<string, any> };
  sources: Array<{ id: string; data: Record<string, any> }>;
  penawaranDocs: Array<{ ref: DocumentReference<DocumentData>; data: Record<string, any> }>;
  invoiceDocs: Array<{ ref: DocumentReference<DocumentData>; data: Record<string, any> }>;
  mirroredInvoiceRefs: DocumentReference<DocumentData>[];
  masterPicDocs: Array<{ ref: DocumentReference<DocumentData>; data: Record<string, any> }>;
  beritaAcaraDocs: Array<{ ref: DocumentReference<DocumentData>; data: Record<string, any> }>;
  legacyPics: Array<Record<string, any>>;
}

const normalizePicName = (value: unknown) =>
  String(value || "").trim().toLocaleLowerCase("id-ID").replace(/\s+/g, " ");

export function useCompanyMerge() {
  const db = useFirestore();

  async function analyzeCompanyMerge(
    targetId: string,
    sourceIds: string[],
  ): Promise<MergeAnalysis> {
    const cleanSourceIds = [...new Set(sourceIds.filter((id) => id && id !== targetId))];
    if (!targetId) throw new Error("Perusahaan tujuan belum dipilih");
    if (!cleanSourceIds.length) throw new Error("Pilih minimal satu perusahaan duplikat");

    const [targetSnapshot, ...sourceSnapshots] = await Promise.all([
      getDoc(doc(db, "customer", targetId)),
      ...cleanSourceIds.map((id) => getDoc(doc(db, "customer", id))),
    ]);
    if (!targetSnapshot.exists()) throw new Error("Perusahaan tujuan tidak ditemukan");
    const missingSource = sourceSnapshots.find((snapshot) => !snapshot.exists());
    if (missingSource) throw new Error(`Perusahaan duplikat ${missingSource.id} tidak ditemukan`);

    const target = { id: targetSnapshot.id, data: targetSnapshot.data() };
    const sources = sourceSnapshots.map((snapshot) => ({
      id: snapshot.id,
      data: snapshot.data(),
    }));
    const sourceIdSet = new Set(cleanSourceIds);

    const [penawaranSnapshot, invoiceSnapshot, masterPicSnapshot, beritaAcaraSnapshot] =
      await Promise.all([
        getDocs(collection(db, "penawaran")),
        getDocs(collection(db, "invoice")),
        getDocs(collection(db, "master_pic")),
        getDocs(collection(db, "berita_acara")),
      ]);

    const penawaranDocs = penawaranSnapshot.docs
      .filter((snapshot) => sourceIdSet.has(String(snapshot.data().id_perusahaan || "")))
      .map((snapshot) => ({ ref: snapshot.ref, data: snapshot.data() }));
    const invoiceDocs = invoiceSnapshot.docs
      .filter((snapshot) => sourceIdSet.has(String(snapshot.data().id_customer || "")))
      .map((snapshot) => ({ ref: snapshot.ref, data: snapshot.data() }));
    const masterPicDocs = masterPicSnapshot.docs
      .filter((snapshot) => sourceIdSet.has(String(snapshot.data().id_perusahaan || "")))
      .map((snapshot) => ({ ref: snapshot.ref, data: snapshot.data() }));
    const beritaAcaraDocs = beritaAcaraSnapshot.docs
      .filter((snapshot) => sourceIdSet.has(String(snapshot.data().id_customer || "")))
      .map((snapshot) => ({ ref: snapshot.ref, data: snapshot.data() }));

    const mirroredInvoiceSnapshots = await Promise.all(
      invoiceDocs.map(async ({ ref, data }) => {
        const idPenawaran = String(data.id_penawaran || "");
        if (!idPenawaran || idPenawaran === "-") return null;
        const mirrorRef = doc(db, "penawaran", idPenawaran, "invoice", ref.id);
        return (await getDoc(mirrorRef)).exists() ? mirrorRef : null;
      }),
    );
    const mirroredInvoiceRefs = mirroredInvoiceSnapshots.filter(
      (reference): reference is DocumentReference<DocumentData> => Boolean(reference),
    );

    const existingPicKeys = new Set(
      masterPicSnapshot.docs
        .filter((snapshot) => {
          const companyId = String(snapshot.data().id_perusahaan || "");
          return companyId === targetId || sourceIdSet.has(companyId);
        })
        .map((snapshot) => normalizePicName(snapshot.data().pic))
        .filter(Boolean),
    );
    const legacyPics: Array<Record<string, any>> = [];
    [target, ...sources].forEach((customer) => {
      const picName = String(customer.data.pic || "").trim();
      const key = normalizePicName(picName);
      if (!key || existingPicKeys.has(key)) return;
      existingPicKeys.add(key);
      legacyPics.push({
        pic: picName,
        no_telp: String(customer.data.no_telp || "").trim(),
        email: String(customer.data.email || "").trim().toLowerCase(),
        createdAt: Number(customer.data.createdAt || 0),
        createdBy: String(customer.data.createdBy || ""),
      });
    });

    const preview: CompanyMergePreview = {
      targetId,
      targetName: String(target.data.nama || ""),
      sourceIds: cleanSourceIds,
      sourceNames: sources.map((source) => String(source.data.nama || source.id)),
      penawaran: penawaranDocs.length,
      invoices: invoiceDocs.length,
      mirroredInvoices: mirroredInvoiceRefs.length,
      masterPics: masterPicDocs.length,
      beritaAcara: beritaAcaraDocs.length,
      legacyPics: legacyPics.length,
      totalReferences:
        penawaranDocs.length +
        invoiceDocs.length +
        mirroredInvoiceRefs.length +
        masterPicDocs.length +
        beritaAcaraDocs.length,
    };

    return {
      preview,
      target,
      sources,
      penawaranDocs,
      invoiceDocs,
      mirroredInvoiceRefs,
      masterPicDocs,
      beritaAcaraDocs,
      legacyPics,
    };
  }

  async function commitOperations(operations: MergeOperation[]) {
    const chunkSize = 450;
    for (let index = 0; index < operations.length; index += chunkSize) {
      const batch = writeBatch(db);
      operations.slice(index, index + chunkSize).forEach((operation) => {
        if (operation.type === "set") batch.set(operation.ref, operation.data, { merge: true });
        else batch.update(operation.ref, operation.data);
      });
      await batch.commit();
    }
  }

  async function previewCompanyMerge(targetId: string, sourceIds: string[]) {
    return (await analyzeCompanyMerge(targetId, sourceIds)).preview;
  }

  async function mergeCompanies(targetId: string, sourceIds: string[]) {
    const analysis = await analyzeCompanyMerge(targetId, sourceIds);
    const targetName = String(analysis.target.data.nama || "").trim();
    const now = Math.floor(Date.now() / 1000);
    const actor = getAuth().currentUser?.email || "system";
    const operations: MergeOperation[] = [];

    analysis.penawaranDocs.forEach(({ ref }) => {
      operations.push({
        type: "update",
        ref,
        data: { id_perusahaan: targetId, nama_perusahaan: targetName },
      });
    });
    analysis.invoiceDocs.forEach(({ ref }) => {
      operations.push({
        type: "update",
        ref,
        data: { id_customer: targetId, nama_customer: targetName },
      });
    });
    analysis.mirroredInvoiceRefs.forEach((ref) => {
      operations.push({
        type: "update",
        ref,
        data: { id_customer: targetId, nama_customer: targetName },
      });
    });
    analysis.masterPicDocs.forEach(({ ref }) => {
      operations.push({
        type: "update",
        ref,
        data: { id_perusahaan: targetId, nama_perusahaan: targetName },
      });
    });
    analysis.beritaAcaraDocs.forEach(({ ref }) => {
      operations.push({ type: "update", ref, data: { id_customer: targetId } });
    });
    analysis.legacyPics.forEach((legacyPic) => {
      const picRef = doc(collection(db, "master_pic"));
      operations.push({
        type: "set",
        ref: picRef,
        data: {
          ...legacyPic,
          id: picRef.id,
          id_master_pic: picRef.id,
          id_perusahaan: targetId,
          nama_perusahaan: targetName,
          createdAt: legacyPic.createdAt || now,
          createdBy: legacyPic.createdBy || actor,
          migratedAt: now,
          migratedBy: actor,
        },
      });
    });
    operations.push({
      type: "update",
      ref: doc(db, "customer", targetId),
      data: {
        id: targetId,
        id_customer: targetId,
        nama: targetName,
        pic: "",
        no_telp: "",
        email: "",
        vessel: "",
        updatedAt: now,
        updatedBy: actor,
      },
    });

    // Semua referensi dan PIC dipindahkan lebih dahulu. Dokumen duplikat baru
    // dihapus setelah seluruh batch update berhasil, sehingga aman dijalankan ulang.
    await commitOperations(operations);
    if (analysis.preview.sourceIds.length > 450) {
      throw new Error("Terlalu banyak perusahaan duplikat dalam satu proses merge");
    }
    const deleteBatch = writeBatch(db);
    analysis.preview.sourceIds.forEach((sourceId) => {
      deleteBatch.delete(doc(db, "customer", sourceId));
    });
    await deleteBatch.commit();

    [
      "customer",
      "master_pic",
      "penawaran",
      "invoice",
      "berita_acara",
    ].forEach((key) => sessionStorage.removeItem(key));

    return analysis.preview;
  }

  return { previewCompanyMerge, mergeCompanies };
}
