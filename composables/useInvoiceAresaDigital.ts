import { useFirestore } from "vuefire";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  runTransaction,
  where,
  writeBatch,
} from "firebase/firestore";
import type { invoiceM } from "~/types/invoice";
import moment from "moment";
import { getAuth } from "firebase/auth";
import _ from "lodash";
import type { pengeluaranM } from "~/types/penawaranModel";
import type { purchaseorderM } from "~/types/purchaseorderModel";


export const createInvoicePenawaran = async (data: invoiceM) => {
  const db = useFirestore();
  const auth = getAuth();
  const now = moment().unix();
  const email = auth.currentUser?.email ?? "system";
  const [existingMirroredInvoices, existingRootInvoices] = await Promise.all([
    getDocs(
      query(collection(db, "penawaran", data.id_penawaran!, "invoice"), limit(2)),
    ),
    getDocs(
      query(
        collection(db, "invoice"),
        where("id_penawaran", "==", data.id_penawaran!),
        limit(2),
      ),
    ),
  ]);
  const existingInvoiceIds = [
    ...new Set([
      ...existingMirroredInvoices.docs.map((invoice) => invoice.id),
      ...existingRootInvoices.docs.map((invoice) => invoice.id),
    ]),
  ];

  return await runTransaction(db, async (transaction) => {
    const nomorInvRef = doc(db, "penomoran", "nomor");
    const getnomor = await transaction.get(nomorInvRef);

    if (!getnomor.exists()) {
      throw new Error("Dokumen penomoran/nomor tidak ditemukan");
    }

    const penawaranRef = doc(db, "penawaran", data.id_penawaran!);
    const penawaranSnapshot = await transaction.get(penawaranRef);
    if (!penawaranSnapshot.exists()) {
      throw new Error("Penawaran untuk invoice tidak ditemukan");
    }

    const datanomor = getnomor.data();
    const newnumber = datanomor!.no_inv + 1;
    const stringnewnumber = _.toString(newnumber).padStart(5, "0");
    const no_inv = `${stringnewnumber}`;
    const id_invoice = `${stringnewnumber}`;
    const existingExpenses: pengeluaranM[] = Array.isArray(
      penawaranSnapshot.data().pengeluaran,
    )
      ? penawaranSnapshot.data().pengeluaran
      : [];
    const currentInvoiceId = String(penawaranSnapshot.data().id_invoice ?? "");
    const isFirstInvoice =
      existingInvoiceIds.length === 0 && !currentInvoiceId;
    const soleExistingInvoiceId =
      existingInvoiceIds.length === 1 &&
      (!currentInvoiceId || currentInvoiceId === existingInvoiceIds[0])
        ? existingInvoiceIds[0]
        : "";
    const legacyDestinationId = isFirstInvoice
      ? id_invoice
      : soleExistingInvoiceId;
    const hasLegacyExpenses = existingExpenses.some((expense) => !expense.invoice_out);
    const penawaranExpenses = legacyDestinationId && hasLegacyExpenses
      ? existingExpenses.map((expense) =>
          expense.invoice_out
            ? expense
            : { ...expense, invoice_out: legacyDestinationId },
        )
      : existingExpenses;
    const previousInvoiceRef =
      soleExistingInvoiceId && hasLegacyExpenses
        ? doc(db, "invoice", soleExistingInvoiceId)
        : null;
    if (previousInvoiceRef) {
      const previousInvoice = await transaction.get(previousInvoiceRef);
      if (!previousInvoice.exists()) {
        throw new Error(`Invoice ${soleExistingInvoiceId} tidak ditemukan`);
      }
      const previousPenawaranId = previousInvoice.data().id_penawaran;
      if (previousPenawaranId && previousPenawaranId !== data.id_penawaran) {
        throw new Error(`Invoice ${soleExistingInvoiceId} tidak terkait dengan penawaran ini`);
      }
    }
    const invoiceExpenses = penawaranExpenses.filter(
      (expense) => expense.invoice_out === id_invoice,
    );
    const setdata: invoiceM = {
      ...data,
      pengeluaran: invoiceExpenses,
      grandtotal_pengeluaran: invoiceExpenses.reduce(
        (total, expense) => total + (Number(expense.nominal) || 0),
        0,
      ),
      no_inv,
      id_invoice,
      createdAt: now,
      createdBy: email,
    };

    //Ref dokumen utama laporan

    const invoiceRef = doc(db, "invoice", id_invoice);
    const penawaraninvoiceRef = doc(db, "penawaran", data.id_penawaran!, "invoice", id_invoice);
    // Simpan dokumen utama laporan
    transaction.set(invoiceRef, setdata, { merge: true });
    transaction.set(penawaraninvoiceRef, setdata, { merge: true });
    if (previousInvoiceRef) {
      const previousExpenses = penawaranExpenses.filter(
        (expense) => expense.invoice_out === soleExistingInvoiceId,
      );
      const previousValues = {
        pengeluaran: previousExpenses,
        grandtotal_pengeluaran: previousExpenses.reduce(
          (total, expense) => total + (Number(expense.nominal) || 0),
          0,
        ),
      };
      transaction.update(previousInvoiceRef, previousValues);
      transaction.set(
        doc(db, "penawaran", data.id_penawaran!, "invoice", soleExistingInvoiceId),
        previousValues,
        { merge: true },
      );
    }
    transaction.update(penawaranRef, {
      id_invoice,
      ...(legacyDestinationId && hasLegacyExpenses
        ? { pengeluaran: penawaranExpenses }
        : {}),
    });
    transaction.update(nomorInvRef, { no_inv: newnumber });

    return { ...setdata, id: id_invoice };
  });
};

const PENGELUARAN_FILE_CHUNK_LENGTH = 600_000;
const PENGELUARAN_FILE_CHUNKS_PER_BATCH = 10;

export const persistPengeluaranDocuments = async (
  idPenawaran: string,
  idPengeluaran: string,
  documents: pengeluaranM["doc_pengeluaran"],
  removeExistingChunks = true,
) => {
  const db = useFirestore();
  const chunksRef = collection(
    db,
    "penawaran",
    idPenawaran,
    "pengeluaran_file_chunks",
  );
  const oldChunks = removeExistingChunks
    ? await getDocs(
        query(chunksRef, where("id_pengeluaran", "==", idPengeluaran)),
      )
    : null;

  let batch = writeBatch(db);
  let operations = 0;
  const commitBatchIfFull = async () => {
    if (operations < PENGELUARAN_FILE_CHUNKS_PER_BATCH) return;
    await batch.commit();
    batch = writeBatch(db);
    operations = 0;
  };

  const retainedFileIds = new Set(
    documents
      .map((document) => document.fileId)
      .filter((fileId): fileId is string => Boolean(fileId)),
  );

  for (const chunk of oldChunks?.docs ?? []) {
    if (retainedFileIds.has(String(chunk.data().fileId || ""))) continue;
    batch.delete(chunk.ref);
    operations++;
    await commitBatchIfFull();
  }

  const storedDocuments: typeof documents = [];
  for (const document of documents) {
    const fileId = document.fileId || doc(chunksRef).id;
    const dataUrl = document.dataUrl || "";

    // New attachments are stored as binary files in Firebase Storage. Keep
    // only their regular download URL in Firestore instead of chunking it.
    if (document.storagePath || /^https?:\/\//i.test(dataUrl)) {
      storedDocuments.push({ ...document, dataUrl });
      continue;
    }

    // A document with a fileId is already persisted. Keep its chunks intact;
    // only new files (without a fileId) need to be written.
    if (document.fileId) {
      storedDocuments.push({ ...document, dataUrl: "" });
      continue;
    }
    if (!dataUrl) {
      throw new Error(`Lampiran ${document.name || "pengeluaran"} kosong`);
    }

    const totalChunks = Math.max(
      1,
      Math.ceil(dataUrl.length / PENGELUARAN_FILE_CHUNK_LENGTH),
    );

    for (let index = 0; index < totalChunks; index++) {
      const chunkRef = doc(
        chunksRef,
        `${fileId}_${String(index).padStart(6, "0")}`,
      );
      batch.set(chunkRef, {
        id_pengeluaran: idPengeluaran,
        fileId,
        index,
        totalChunks,
        data: dataUrl.slice(
          index * PENGELUARAN_FILE_CHUNK_LENGTH,
          (index + 1) * PENGELUARAN_FILE_CHUNK_LENGTH,
        ),
      });
      operations++;
      await commitBatchIfFull();
    }

    storedDocuments.push({ ...document, fileId, dataUrl: "" });
  }

  if (operations) await batch.commit();
  return storedDocuments;
};


export const createPengeluaran = async (
  data: pengeluaranM,
  id_penawaran: string,
  _knownInvoiceId?: string,
) => {
  if (!id_penawaran) {
    throw new Error("ID penawaran tidak ditemukan");
  }

  const db = useFirestore();

  // A quotation can have several invoices; its id_invoice only points to the
  // latest one and must not decide which invoice owns an expense.
  const [mirroredInvoices, rootInvoices] = await Promise.all([
    getDocs(collection(db, "penawaran", id_penawaran, "invoice")),
    getDocs(
      query(collection(db, "invoice"), where("id_penawaran", "==", id_penawaran)),
    ),
  ]);
  const relatedInvoiceIds = [
    ...new Set([
      ...mirroredInvoices.docs.map((invoice) => invoice.id),
      ...rootInvoices.docs.map((invoice) => invoice.id),
    ]),
  ];
  const requestedInvoiceId = String(data.invoice_out ?? "").trim();
  if (requestedInvoiceId && !relatedInvoiceIds.includes(requestedInvoiceId)) {
    throw new Error("Invoice yang dipilih tidak terkait dengan penawaran ini");
  }
  if (!requestedInvoiceId && relatedInvoiceIds.length > 1) {
    throw new Error("Pilih invoice untuk pengeluaran ini");
  }
  const invoiceId = requestedInvoiceId || relatedInvoiceIds[0] || "";

  const idPengeluaran =
    data.id_pengeluaran || doc(collection(db, "penawaran")).id;
  const storedDocuments = await persistPengeluaranDocuments(
    id_penawaran,
    idPengeluaran,
    data.doc_pengeluaran ?? [],
    false,
  );

  const setdata: pengeluaranM = {
    ...data,
    id_pengeluaran: idPengeluaran,

    // Pastikan angka benar-benar number
    nominal: Number(data.nominal) || 0,
    qty: Number(data.qty) || 0,

    // Pastikan string tidak undefined
    keterangan: data.keterangan ?? "",
    satuan: data.satuan ?? "",
    dikeluarkan_oleh: data.dikeluarkan_oleh ?? "",
    nama_vendor: data.nama_vendor ?? "",
    no_telp_vendor: data.no_telp_vendor ?? "",
    lokasi_vendor: data.lokasi_vendor ?? "",
    status_pengeluaran: data.status_pengeluaran ?? "Hutang",
    tanggal_pengeluaran: data.tanggal_pengeluaran ?? "",
    doc_pengeluaran: storedDocuments,
  };
  if (invoiceId) setdata.invoice_out = invoiceId;
  else delete setdata.invoice_out;

  const penawaranRef = doc(db, "penawaran", id_penawaran);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(penawaranRef);

    if (!snapshot.exists()) {
      throw new Error("Penawaran tidak ditemukan");
    }

    const existingData = snapshot.data();
    const invoiceRefs = relatedInvoiceIds.map((id) => doc(db, "invoice", id));
    for (const invoiceRef of invoiceRefs) {
      const invoiceSnapshot = await transaction.get(invoiceRef);
      if (!invoiceSnapshot.exists()) {
        throw new Error(`Invoice ${invoiceRef.id} tidak ditemukan`);
      }
      const invoicePenawaranId = invoiceSnapshot.data().id_penawaran;
      if (invoicePenawaranId && invoicePenawaranId !== id_penawaran) {
        throw new Error(`Invoice ${invoiceRef.id} tidak terkait dengan penawaran ini`);
      }
    }

    const pengeluaran: pengeluaranM[] = Array.isArray(existingData.pengeluaran)
      ? [...existingData.pengeluaran]
      : [];

    if (pengeluaran.some((item) => item.id_pengeluaran === setdata.id_pengeluaran)) {
      throw new Error("ID pengeluaran sudah tersimpan. Muat ulang lalu coba kembali.");
    }
    pengeluaran.push(setdata);

    const total_pengeluaran = pengeluaran.reduce(
      (total, item) => total + (Number(item.nominal) || 0),
      0,
    );

    transaction.update(penawaranRef, {
      pengeluaran,
      grandtotal_pengeluaran: total_pengeluaran,
    });
    for (const invoiceRef of invoiceRefs) {
      const invoiceExpenses = pengeluaran.filter(
        (expense) =>
          expense.invoice_out === invoiceRef.id ||
          (!expense.invoice_out && invoiceRefs.length === 1),
      );
      const invoiceValues = {
        pengeluaran: invoiceExpenses,
        grandtotal_pengeluaran: invoiceExpenses.reduce(
          (total, expense) => total + (Number(expense.nominal) || 0),
          0,
        ),
      };
      transaction.update(invoiceRef, {
        ...invoiceValues,
      });
      transaction.set(
        doc(db, "penawaran", id_penawaran, "invoice", invoiceRef.id),
        invoiceValues,
        { merge: true },
      );
    }
  });

  sessionStorage.removeItem("penawaran");

  return setdata;
};

export const createInvoice = async (data: invoiceM) => {
  const db = useFirestore();
  const auth = getAuth();
  const now = moment().unix();
  const email = auth.currentUser?.email ?? "system";

  return await runTransaction(db, async (transaction) => {
    const nomorInvRef = doc(db, "penomoran", "nomor");
    const getnomor = await transaction.get(nomorInvRef);

    if (!getnomor.exists()) {
      throw new Error("Dokumen penomoran/nomor tidak ditemukan");
    }

    const datanomor = getnomor.data();
    const newnumber = datanomor!.no_inv + 1;
    const stringnewnumber = _.toString(newnumber).padStart(5, "0");
    const no_inv = `${stringnewnumber}`;
    const id_invoice = `${stringnewnumber}`;
    const setdata: invoiceM = {
      ...data,
      no_inv,
      id_invoice,
      createdAt: now,
      createdBy: email,
      id_penawaran: "-",
      no_penawaran: "-",
    };

    //Ref dokumen utama laporan

    const invoiceRef = doc(db, "invoice", id_invoice);
    // Simpan dokumen utama laporan
    transaction.set(invoiceRef, setdata, { merge: true });
    transaction.update(nomorInvRef, { no_inv: newnumber });

    return { ...setdata, id: id_invoice };
  });
};


export const createPurchaseorder = async (data: purchaseorderM) => {
  const db = useFirestore();
  const now = moment().unix();

  return await runTransaction(db, async (transaction) => {
    const nomorInvRef = doc(db, "penomoran", "nomor");
    const getnomor = await transaction.get(nomorInvRef);

    if (!getnomor.exists()) {
      throw new Error("Dokumen penomoran/nomor tidak ditemukan");
    }

    const datanomor = getnomor.data();
    const newnumber = datanomor!.no_penawaran;
    const stringnewnumber = _.toString(newnumber).padStart(5, "0");
    const year = moment().format("YYYY");
    const no_purchaseorder = `PO/DRM/${year}/${stringnewnumber}`;;
    const id_purchaseorder = `PO-DRM-${year}-${stringnewnumber}`;
    const setdata: purchaseorderM = {
      ...data,
      no_purchaseorder, 
      id_purchaseorder,
      createdAt: now,
    };

    //Ref dokumen utama laporan

    const purchaseorderRef = doc(db, "purchaseorder", id_purchaseorder);
    const penawaranpurchaseorderRef = doc(db, "penawaran", data.id_penawaran!, "purchaseorder", id_purchaseorder);
    // Simpan dokumen utama laporan
    transaction.set(purchaseorderRef, setdata, { merge: true });
    transaction.set(penawaranpurchaseorderRef, setdata, { merge: true });

    return { ...setdata, id: id_purchaseorder };
  });
};

export const updatePurchaseorder = async (
  idPurchaseorder: string,
  data: purchaseorderM,
) => {
  const db = useFirestore();
  const setdata: purchaseorderM = {
    ...data,
    id_purchaseorder: idPurchaseorder,
    updatedAt: moment().unix(),
  };

  await runTransaction(db, async (transaction) => {
    const purchaseorderRef = doc(db, "purchaseorder", idPurchaseorder);
    const penawaranpurchaseorderRef = doc(
      db,
      "penawaran",
      data.id_penawaran,
      "purchaseorder",
      idPurchaseorder,
    );
    transaction.set(purchaseorderRef, setdata, { merge: true });
    transaction.set(penawaranpurchaseorderRef, setdata, { merge: true });
  });

  return setdata;
};
