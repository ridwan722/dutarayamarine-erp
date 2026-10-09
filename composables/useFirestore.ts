import {
  useCollection,
  useDocument,
  useFirebaseStorage,
  useFirestore,
  useStorageFile,
} from "vuefire";

import {
  collection,
  getDoc,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { getDownloadURL, ref as storageRef } from "firebase/storage";
import _ from "lodash";
import { getToken } from "firebase/messaging";
import { serverTimestamp } from "firebase/firestore";

export const taridatadatabase = async (col: string) => {
  const db = useFirestore();
  const colRef = useCollection(collection(db, col));
  return colRef;
};

export const setdatabase = async (
  col: string,
  id: string,
  document: Object
) => {
  try {
    sessionStorage.removeItem(col);
    const db = useFirestore();
    await setDoc(doc(db, col, id), document, { merge: true });
    return { error: 0, msg: "data berhasil disimpan" };
  } catch (error) {
    return { error: 100, msg: "data gagal disimpan" };
  }
};

export const tambahdatabase = async (col: string, document: Object) => {
  sessionStorage.removeItem(col);
  const db = useFirestore();
  const colRef = collection(db, col);
  const docRef = await addDoc(colRef, document);
  return docRef;
};

export const waktuServer = () => serverTimestamp();

export const batching = async (documents: any) => {
  try {
    const db = useFirestore();
    // console.log75)
    const batch = writeBatch(db);
    const b = [] as any;
    documents.forEach((document: any) => {
      const docRef = doc(db, document.collection, document.id);

      const type = document.type;
      // console.logtype)
      if (type == "set") {
        batch.set(docRef, document.data);
      } else if (type == "update") {
        batch.update(docRef, document.data);
      } else {
        batch.delete(docRef);
      }
      b.push(document.id);
    });

    await Promise.all(b);
    return await batch
      .commit()
      .then(() => {
        return "ok";
      })
      .catch((error) => {
        console.log(error);
        return "failed";
      });
  } catch (error) {
    console.log(error);
  }
};

export const updatedatabase = async (
  col: string,
  id: string,
  document: any
) => {
  sessionStorage.removeItem(col);
  const db = useFirestore();

  const docRef = doc(db, col, id);

  await updateDoc(docRef, document);

  return docRef;
};

export const tarikdetaildatabase = async (col: string, id: string) => {
  const db = useFirestore();
  return useDocument(doc(db, col, id));
};
export const cekeksis = async (col: string, id: string) => {
  const db = useFirestore();
  const b = doc(db, col, id);
  const c = await getDoc(b);
  if (c.exists()) {
    return true;
  } else {
    return false;
  }
};

export const hapusdatabase = async (col: string, id: string) => {
  sessionStorage.removeItem(col);
  const db = useFirestore();
  const docRef = doc(db, col, id);
  return await deleteDoc(docRef);
};

// export const uploadFile = async (file: any, col: string) => {
//   const picturestore = usePictureStore();

//   const metadata = {
//     contentType: "image/jpeg",
//   };
//   // console.log(file, col)
//   const storage = useFirebaseStorage();

//   const mountainFileRef = storageRef(storage, col);

//   const {
//     url,
//     // gives you a percentage between 0 and 1 of the upload progress
//     uploadProgress,
//     uploadError,
//     // firebase upload task
//     uploadTask,
//     upload,
//   } = useStorageFile(mountainFileRef);
//   await upload(file, metadata);
//   return await getDownloadURL(mountainFileRef).then((downloadURL) => {
//     picturestore.setPic(downloadURL);
//     useloadingStore().setLoading(false);
//     return downloadURL;
//   });
// };

export const setToken = async () => {
  // console.log('settoken 93')
  const userstore = useUserStore();
  const { $messaging } = useNuxtApp();
  const datauser = userstore.getUser;
  const email = userstore.getEmail;

  const iduser = localStorage.getItem("uid");
  // console.log(iduser, 'iduser')
  let iddevice = localStorage.getItem("id_device");
  if (_.isNull(iddevice)) {
    iddevice = makerandom();
    localStorage.setItem("id_device", iddevice);
  }

  const role = userstore.getrole;
  const idfcmtoken = iduser + "_" + iddevice;
  let b = await cekeksis("fcm_token", idfcmtoken);
  let c;
  // console.log(b,'b')
  // console.log('token',b)
  if (!b) {
    c = await getToken($messaging, {
      vapidKey:
        "BIOoaOE9VJ2rFbsu57KSMQyjIRIyiLkLPy01_cD4YZiWxenkI10VbgjDVznO6KLtRIHh20jjwF8MWS8pYH3I_Es",
    });
    await setdatabase("tokenfcm", idfcmtoken, {
      token: c,
      topic: role + "_topic",
      email,
      iddevice,
    });
    // console.log('ambil token')
  }
  return c;
};

export const refreshingTokenfcm = async (token: string) => {
  const userstore = useUserStore();
  const { $messaging } = useNuxtApp();
  // console.log($messaging)
  // console.log('tokenset')
  let b;
  // console.log(b)
  const datauser = userstore.getUser;
  const iduser = datauser!["uid"];
  const role = userstore.getrole;

  b = token;
  localStorage.setItem("fcm", b);
  await setdatabase("tokenfcm", iduser, { token: b, topic: role });
  // console.log('ambil token')
};

export const tarikdetaildatabase2 = async (col: string, id: string) => {
  const db = useFirestore();
  const docRef = doc(db, col, id);
  const b = await getDoc(docRef);
  // console.logb.data())
  return b.data();
};

export const queryTarikDataLeadsByStatus = async (status: string) => {
  const db = useFirestore();
  const colRef = collection(db, "customer");

  const q = query(colRef, where("status", "==", status));
  const snapshot = await getDocs(q);

  const datas = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // 🔥 sort di frontend
  return _.orderBy(datas, ["created_at"], ["desc"]);
};
