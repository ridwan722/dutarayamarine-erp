import { useCollection, useFirestore } from 'vuefire'


import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  QueryConstraint,
} from "firebase/firestore";
import moment from 'moment';

export const queryambilid = async (col: string) => {
  const db = useFirestore();
  const colRef = collection(db, col)

  const snapshot = await getDocs(colRef);
  const docs = Array.from(snapshot.docs).map((doc) => {
    const id = doc.id;
    const data = doc.data();
    return { id, ...data };
  });
  const datas = await Promise.all(docs);
  // console.log(14, datas)

  return datas;
};

export const queryambilidsesion = async (col: string) => {
  const datasesion = await getsesion(col);
  if (datasesion.length > 0) {
    return datasesion;
  }
  const db = useFirestore();
  const colRef = collection(db, col);
  const snapshot = await getDocs(colRef);
  const docs = Array.from(snapshot.docs).map((doc) => {
    const id = doc.id;
    const data = doc.data();
    return { id, ...data };
  });
  const datas = await Promise.all(docs);
  // console.log14, datas)
  await setsesion(col, datas);
  return datas;
};

export const querymitemkategoribystatus = async (status: string) => {
  const db = useFirestore();
  const colRef = collection(db, "m_item_kategori");
  const querydriver = query(colRef, where("status", "==", status));
  const snapshot = await getDocs(querydriver);
  const docs = Array.from(snapshot.docs).map((doc) => {
    const id = doc.id;
    const data = doc.data();
    return { id, ...data };
  });
  const datas = await Promise.all(docs);
  // console.log14, datas)

  return datas;
};

export const queryPenawaranBystatus = async (status: string) => {
  const db = useFirestore();
  const colRef = collection(db, "penawaran");
  const querydriver = query(colRef, where("status", "==", status));
  const snapshot = await getDocs(querydriver);
  const docs = Array.from(snapshot.docs).map((doc) => {
    const id = doc.id;
    const data = doc.data();
    return { id, ...data };
  });
  const datas = await Promise.all(docs);
  // console.log14, datas)

  return datas;
};

export const queryPenawaranBystatusarray = async (statusList: string[]) => {
  const db = useFirestore();
  const colRef = collection(db, "penawaran");

  // Gunakan "in" query untuk filter multi status (maksimal 10 nilai)
  const q = query(colRef, where("status", "in", statusList));
  const snapshot = await getDocs(q);

  // Mapping data dengan id dokumen
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const queryInvoiceBystatus = async (status: string) => {
  const db = useFirestore();
  const colRef = collection(db, "invoice");
  const querydriver = query(colRef, where("status", "==", status));
  const snapshot = await getDocs(querydriver);
  const docs = Array.from(snapshot.docs).map((doc) => {
    const id = doc.id;
    const data = doc.data();
    return { id, ...data };
  });
  const datas = await Promise.all(docs);
  // console.log14, datas)

  return datas;
};

export const querycabangItemKategoriBystatus = async (id: string, status: string) => {
  const db = useFirestore();
  const colRef = collection(db, "m_cabang/" + id + "/m_item_kategori");
  const querydriver = query(colRef, where("status", "==", status));
  const snapshot = await getDocs(querydriver);
  const docs = Array.from(snapshot.docs).map((doc) => {
    const id = doc.id;
    const data = doc.data();
    return { id, ...data };
  });
  const datas = await Promise.all(docs);
  // console.log14, datas)

  return datas;
};

export const queryCabangPerusahaan = async (id: string) => {
  const db = useFirestore();
  const colRef = collection(db, "m_cabang");
  const querybarangdata = query(colRef, where("id_perusahaan", "==", id));
  const snapshot = await getDocs(querybarangdata);
  const docs = Array.from(snapshot.docs).map((doc) => {
    const id = doc.id;
    const data = doc.data();
    return { id, ...data };
  });
  const datas = await Promise.all(docs);
  // console.log14, datas)

  return datas;
};


export const queryrekapanposalesbyemail = async (
  tgl_awal: string,
  tgl_akhir: string,
  status: string,
  email: string
) => {
  const db = useFirestore();
  const colRef = collection(db, "m_item_kategori");
  let querybarangdata;
  querybarangdata = query(colRef, where('tanggal', '>=', tgl_awal), where('tanggal', '<=', tgl_akhir), where('status', '==', status), where("created_by", "==", email))
  if (status == '' && email == "") {
    querybarangdata = query(colRef, where('tanggal', '>=', tgl_awal), where('tanggal', '<=', tgl_akhir))
  } else if (tgl_awal == '' && tgl_akhir == '') {
    querybarangdata = query(colRef, where('status', '==', status), where("created_by", "==", email))
  } else if (tgl_awal == '' && tgl_akhir == '' && email == "") {
    querybarangdata = query(colRef, where('status', '==', status))
  } else if (tgl_awal == '' && tgl_akhir == '' && status == "") {
    querybarangdata = query(colRef, where('created_by', '==', email))
  } else if (status == '') {
    querybarangdata = query(colRef, where('tanggal', '>=', tgl_awal), where('tanggal', '<=', tgl_akhir), where("created_by", "==", email))
  } else {
    querybarangdata = query(colRef, where('tanggal', '>=', tgl_awal), where('tanggal', '<=', tgl_akhir), where("status", "==", status))
  }

  try {
    const snapshot = await getDocs(querybarangdata);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
  } catch (err: any) {
    console.error("Firestore query error:", err);
    throw err; // ini supaya Anda tahu kalau Firestore butuh index
  }
};



export const queryRekapanitemkategoriByStatusCabangPerusahaanPeriode = async (
  tgl_awal?: string,
  tgl_akhir?: string,
  nama_perusahaan?: string,
  nama_cabang?: string,
  status?: string
) => {
  const db = useFirestore();
  const colRef = collection(db, "m_item_kategori");

  const constraints: QueryConstraint[] = [];

  // 🔹 Filter periode.mulai
  if (tgl_awal) {
    constraints.push(where("periode.mulai", ">=", tgl_awal));
  }

  if (tgl_akhir) {
    constraints.push(where("periode.mulai", "<=", tgl_akhir));
  }

  // 🔹 Filter status
  if (status) {
    constraints.push(where("status", "==", status));
  }

  if (nama_perusahaan) {
    constraints.push(where("nama_perusahaan", "==", nama_perusahaan));
  }

  if (nama_cabang) {
    constraints.push(where("nama_cabang", "==", nama_cabang));
  }

  const q = query(colRef, ...constraints);

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err: any) {
    console.error("Firestore query error:", err);
    throw err; // biasanya error index
  }
};

export const queryRekapanunmanageByStatusCabangPerusahaanPeriode = async (
  tgl_awal?: string,
  tgl_akhir?: string,
  nama_perusahaan?: string,
  nama_cabang?: string,
  status?: string
) => {
  const db = useFirestore();
  const colRef = collection(db, "unmanage_item_kategori");

  const constraints: QueryConstraint[] = [];

  // 🔹 Filter periode.mulai
  if (tgl_awal) {
    constraints.push(where("periode.mulai", ">=", tgl_awal));
  }

  if (tgl_akhir) {
    constraints.push(where("periode.mulai", "<=", tgl_akhir));
  }

  // 🔹 Filter status
  if (status) {
    constraints.push(where("status", "==", status));
  }

  if (nama_perusahaan) {
    constraints.push(where("nama_perusahaan", "==", nama_perusahaan));
  }

  if (nama_cabang) {
    constraints.push(where("nama_cabang", "==", nama_cabang));
  }

  const q = query(colRef, ...constraints);

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err: any) {
    console.error("Firestore query error:", err);
    throw err; // biasanya error index
  }
};

export const queryRekapancabangitemkategoriByStatusPeriode = async (
  id_cabang: string,
  tgl_awal?: string,
  tgl_akhir?: string,
  status?: string
) => {
  const db = useFirestore();
  const colRef = collection(db, "m_cabang/" + id_cabang + "/m_item_kategori");

  const constraints: QueryConstraint[] = [];

  // 🔹 Filter periode.mulai
  if (tgl_awal) {
    constraints.push(where("periode.mulai", ">=", tgl_awal));
  }

  if (tgl_akhir) {
    constraints.push(where("periode.mulai", "<=", tgl_akhir));
  }

  // 🔹 Filter status
  if (status) {
    constraints.push(where("status", "==", status));
  }

  const q = query(colRef, ...constraints);

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err: any) {
    console.error("Firestore query error:", err);
    throw err; // biasanya error index
  }
};

export const queryRekapanPenawaranByStatus = async (
  tgl_awal?: string,
  tgl_akhir?: string,
  nama_perusahaan?: string,
  nama_cabang?: string,
  status?: string
) => {
  const db = useFirestore();
  const colRef = collection(db, "penawaran");

  const constraints: QueryConstraint[] = [];
  // 🔹 Filter Tanggal
  if (tgl_awal) {
    constraints.push(where("tanggal", ">=", tgl_awal));
  }
  if (tgl_akhir) {
    constraints.push(where("tanggal", "<=", tgl_akhir));
  }
  // 🔹 Filter Status
  if (status) {
    constraints.push(where("status", "==", status));
  }
  if (nama_perusahaan) {
    constraints.push(where("nama_perusahaan", "==", nama_perusahaan));
  }

  if (nama_cabang) {
    constraints.push(where("nama_cabang_perusahaan", "==", nama_cabang));
  }

  const q = query(colRef, ...constraints);
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err: any) {
    console.error("Firestore query error:", err);
    throw err; // biasanya error index
  }
};

export const queryRekapanInvoiceByStatus = async (
  tgl_awal?: string,
  tgl_akhir?: string,
  nama_perusahaan?: string,
  nama_cabang?: string,
  status?: string
) => {
  const db = useFirestore();
  const colRef = collection(db, "invoice");

  const constraints: QueryConstraint[] = [];
  // 🔹 Filter Tanggal
  if (tgl_awal) {
    constraints.push(where("tanggal", ">=", tgl_awal));
  }
  if (tgl_akhir) {
    constraints.push(where("tanggal", "<=", tgl_akhir));
  }
  // 🔹 Filter Status
  if (status) {
    constraints.push(where("status", "==", status));
  }
  if (nama_perusahaan) {
    constraints.push(where("nama_perusahaan", "==", nama_perusahaan));
  }

  if (nama_cabang) {
    constraints.push(where("nama_cabang_perusahaan", "==", nama_cabang));
  }
  const q = query(colRef, ...constraints);
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err: any) {
    console.error("Firestore query error:", err);
    throw err; // biasanya error index
  }
};

export const queryRekapanCabangByPerusahaan = async (
  tgl_awal: number,
  tgl_akhir: number,
  nama_perusahaan: string,
) => {
  const db = useFirestore();
  const colRef = collection(db, "m_cabang");
  let querybarangdata;

  if (nama_perusahaan !== "" && tgl_awal && tgl_akhir) {
    // ✅ support true & false
    querybarangdata = query(
      colRef,
      where("createdAt", ">=", tgl_awal),
      where("createdAt", "<=", tgl_akhir),
      where("nama_perusahaan", "==", nama_perusahaan)
    );
  } else if (nama_perusahaan === "" && tgl_awal && tgl_akhir) {
    querybarangdata = query(
      colRef,
      where("createdAt", ">=", tgl_awal),
      where("createdAt", "<=", tgl_akhir)
    );
  } else if (nama_perusahaan !== "" && !tgl_awal && !tgl_akhir) {
    // ✅ tetap bisa filter false
    querybarangdata = query(
      colRef,
      where("nama_perusahaan", "==", nama_perusahaan)
    );
  } else {
    querybarangdata = query(colRef);
  }

  try {
    const snapshot = await getDocs(querybarangdata);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
  } catch (err: any) {
    console.error("Firestore query error:", err);
    throw err;
  }
};


