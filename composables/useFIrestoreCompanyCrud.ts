import { useFirestore } from 'vuefire'
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'

/**
 * 🔹 Fungsi universal untuk CRUD dalam konteks multi perusahaan
 * Contoh path:
 * m_perusahaan/{perusahaanId}/m_akun
 */
export const useFirestoreCompanyCrud = () => {
  const db = useFirestore()

  // Ambil semua data koleksi dalam perusahaan
  const getAll = async (perusahaanId: string, col: string) => {
    const colRef = collection(db, `m_perusahaan/${perusahaanId}/${col}`)
    const snap = await getDocs(colRef)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  // Ambil data berdasarkan field tertentu
  const getWhere = async (perusahaanId: string, col: string, field: string, value: any) => {
    const colRef = collection(db, `m_perusahaan/${perusahaanId}/${col}`)
    const q = query(colRef, where(field, '==', value))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  // Tambah data baru (auto id)
  const addData = async (perusahaanId: string, col: string, data: any) => {
    const colRef = collection(db, `m_perusahaan/${perusahaanId}/${col}`)
    await addDoc(colRef, {
      ...data,
      created_at: Date.now(),
      updated_at: Date.now(),
    })
  }

  // Set data dengan id tertentu
  const setData = async (perusahaanId: string, col: string, id: string, data: any) => {
    const docRef = doc(db, `m_perusahaan/${perusahaanId}/${col}/${id}`)
    await setDoc(docRef, {
      ...data,
      updated_at: Date.now(),
    })
  }

  // Update data
  const updateData = async (perusahaanId: string, col: string, id: string, data: any) => {
    const docRef = doc(db, `m_perusahaan/${perusahaanId}/${col}/${id}`)
    await updateDoc(docRef, {
      ...data,
      updated_at: Date.now(),
    })
  }

  // Hapus data
  const deleteData = async (perusahaanId: string, col: string, id: string) => {
    const docRef = doc(db, `m_perusahaan/${perusahaanId}/${col}/${id}`)
    await deleteDoc(docRef)
  }

  return {
    getAll,
    getWhere,
    addData,
    setData,
    updateData,
    deleteData,
  }
}
