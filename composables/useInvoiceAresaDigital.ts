import { useFirestore } from "vuefire";
import {
  collection,
  doc,
  getDocs,
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
    };

    //Ref dokumen utama laporan

    const invoiceRef = doc(db, "invoice", id_invoice);
    const penawaraninvoiceRef = doc(db, "penawaran", data.id_penawaran!, "invoice", id_invoice);
    // Simpan dokumen utama laporan
    transaction.set(invoiceRef, setdata, { merge: true });
    transaction.set(penawaraninvoiceRef, setdata, { merge: true });
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
) => {
  const db = useFirestore();
  const chunksRef = collection(
    db,
    "penawaran",
    idPenawaran,
    "pengeluaran_file_chunks",
  );
  const oldChunks = await getDocs(
    query(chunksRef, where("id_pengeluaran", "==", idPengeluaran)),
  );

  let batch = writeBatch(db);
  let operations = 0;
  const commitBatchIfFull = async () => {
    if (operations < PENGELUARAN_FILE_CHUNKS_PER_BATCH) return;
    await batch.commit();
    batch = writeBatch(db);
    operations = 0;
  };

  for (const chunk of oldChunks.docs) {
    batch.delete(chunk.ref);
    operations++;
    await commitBatchIfFull();
  }

  const storedDocuments: typeof documents = [];
  for (const document of documents) {
    const fileId = document.fileId || doc(chunksRef).id;
    const dataUrl = document.dataUrl || "";
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
) => {
  if (!id_penawaran) {
    throw new Error("ID penawaran tidak ditemukan");
  }

  const db = useFirestore();

  const idPengeluaran =
    data.id_pengeluaran || doc(collection(db, "penawaran")).id;
  const storedDocuments = await persistPengeluaranDocuments(
    id_penawaran,
    idPengeluaran,
    data.doc_pengeluaran ?? [],
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

  console.log("DATA PENGELUARAN:", setdata);

  const penawaranRef = doc(db, "penawaran", id_penawaran);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(penawaranRef);

    if (!snapshot.exists()) {
      throw new Error("Penawaran tidak ditemukan");
    }

    const existingData = snapshot.data();

    const pengeluaran: pengeluaranM[] = Array.isArray(
      existingData.pengeluaran,
    )
      ? existingData.pengeluaran
      : [];

    if (
      !pengeluaran.some(
        (item) => item.id_pengeluaran === setdata.id_pengeluaran,
      )
    ) {
      pengeluaran.push(setdata);
    }

    const total_pengeluaran = pengeluaran.reduce(
      (total, item) => total + (Number(item.nominal) || 0),
      0,
    );

    transaction.update(penawaranRef, {
      pengeluaran,
      grandtotal_pengeluaran: total_pengeluaran,
    });
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
