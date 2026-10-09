import { useFirestore } from "vuefire";
import {
    collection,
    doc,
    getDocs,
    query,
    runTransaction,
    where,
    writeBatch,
    getFirestore,
    onSnapshot,
    getDoc,
} from "firebase/firestore";
import _, { update } from "lodash";
import moment from "moment";
import { getAuth } from "firebase/auth";
import type { invoiceM } from "~/types/invoice";
import type { penawaranM } from "~/types/penawaranModel";
import { arrayUnion } from "firebase/firestore";
import type { CompanyInspectionReport } from "~/types/beritaAcaraModel";
import type { purchaseorderM } from "~/types/purchaseorderModel";

// export const setinvoice = async (data: invoiceM) => {
//     const db = useFirestore();
//     const auth = getAuth();
//     const now = moment().unix();
//     const email = auth.currentUser?.email;
//     return await runTransaction(db, async (transaction) => {
//         const nomorInvRef = doc(db, "penomoran", "nomor"); // baku nomor ref
//         const getnomor = await transaction.get(nomorInvRef);
//         const datanomor = getnomor.data();
//         const newnumber = datanomor!.no_inv + 1;
//         const stringnewnumber = _.toString(newnumber); // 3
//         const padnumber = stringnewnumber.padStart(5, "0"); // 03
//         const year = moment().format("YYYY"); // hasilnya: "25"
//         const bulan = moment().format("MM"); // 7
//         const day = moment().format("DD"); // 05
//         const getromawi = await romawian(_.toNumber(bulan)); // 7 jadi VII
//         const no_inv = padnumber; // FI-03/PT-TAP/VII/2024
//         const id_inv = padnumber; // FI-03/PT-TAP/VII/2024
//         const setdata = {
//             ...data,
//             no_inv,
//             id_inv,
//         };
//         const invoiceRef = doc(db, "invoice", id_inv);
//         const penawaranRef = doc(db, "penawaran", data.id_penawaran);
//         const penawaraninvRef = doc(
//             db,
//             "penawaran",
//             data.id_penawaran,
//             "invoice",
//             id_inv,
//         );
//         for (const element of data.items) {
//             const itemRef = doc(db, "m_item_kategori", element.id_kategori_item!);
//             const iteminvRef = doc(
//                 db,
//                 "m_item_kategori",
//                 element.id_kategori_item!,
//                 "invoice",
//                 id_inv,
//             );
//             const itempenawaranRef = doc(
//                 db,
//                 "m_item_kategori",
//                 element.id_kategori_item!,
//                 "penawaran",
//                 data.id_penawaran,
//             );
//             const cabangitemkategoriRef = doc(
//                 db,
//                 "m_cabang/" + data.id_cabang_perusahaan + "/m_item_kategori",
//                 element.id_kategori_item!,
//             );
//             transaction.update(cabangitemkategoriRef, {
//                 status: "Invoice",
//                 updatedAt: now,
//                 updatedBy: email,
//                 invoiceAt: now,
//                 invoiceBy: email,
//             });
//             transaction.set(iteminvRef, setdata);
//             transaction.update(itemRef, {
//                 status: "Invoice",
//                 updatedAt: now,
//                 updatedBy: email,
//                 invoiceAt: now,
//                 invoiceBy: email,
//             });
//             transaction.update(itempenawaranRef, {
//                 status: "Invoice",
//                 updatedAt: now,
//                 updatedBy: email,
//                 penawaranAt: now,
//                 penawaranBy: email,
//             });
//         }
//         transaction.update(nomorInvRef, { no_inv: newnumber });
//         transaction.set(invoiceRef, setdata);
//         transaction.update(penawaranRef, {
//             status: "Invoice",
//             updatedAt: now,
//             updatedBy: email,
//             invoiceAt: now,
//             invoiceBy: email,
//         });
//         transaction.set(penawaraninvRef, setdata);
//         return;
//     })
//         .then(() => {
//             return "ok";
//         })
//         .catch((error) => {
//             return error.message;
//         });
// };


export const updatepenawaran = async (data: penawaranM) => {
    console.log("DATAUPDATE", data);
    const db = useFirestore();
    const auth = getAuth();
    const now = moment().unix();
    const email = auth.currentUser?.email;

    return await runTransaction(db, async (transaction) => {
        for (const element of data.penawaran_item) {
            const itempenawaranRef = doc(
                db,
                "m_item_kategori",
                element.id_kategori_item!,
                "penawaran",
                data.id!,
            );
            transaction.update(itempenawaranRef, { ...data });
        }
        const invoiceRef = doc(db, "penawaran", data.id!);
        transaction.update(invoiceRef, { ...data });
        return;
    })
        .then(() => {
            return "ok";
        })
        .catch((error) => {
            return error.message;
        });
};

export const updatesetujuiPenawaran = async (data: penawaranM) => {
    console.log("DATAUPDATE", data);
    const db = useFirestore();
    const auth = getAuth();
    const now = moment().unix();
    const email = auth.currentUser?.email;

    return await runTransaction(db, async (transaction) => {
        for (const element of data.items) {
            const itemkategoriRef = doc(
                db,
                "m_item_kategori",
                element.id_kategori_item!,
            );
            const itempenawaranRef = doc(
                db,
                "m_item_kategori",
                element.id_kategori_item!,
                "penawaran",
                data.id!,
            );
            transaction.update(itemkategoriRef, {
                periode: element.periode_penawaran,
            });
            transaction.update(itempenawaranRef, { ...data });
        }
        const invoiceRef = doc(db, "penawaran", data.id!);
        transaction.update(invoiceRef, { ...data });
        return;
    })
        .then(() => {
            return "ok";
        })
        .catch((error) => {
            return error.message;
        });
};


export const uploadPemberkasanPenawaran = async (data: penawaranM) => {
    const db = useFirestore();
    const auth = getAuth();
    const now = moment().unix();
    const email = auth.currentUser?.email;
    return await runTransaction(db, async (transaction) => {
        for (const element of data.berkas!) {
            const itemkategoriRef = doc(
                db,
                "m_item_kategori",
                element.id_kategori_item!,
            );
            const itempenawaranRef = doc(
                db,
                "m_item_kategori",
                element.id_kategori_item!,
                "penawaran",
                data.id!,
            );
            const newdokumen = {
                file_dokumen: element.file_dokumen,
                nama_dokumen: element.nama_dokumen,
                id_dokumen: element.id_dokumen,
                no_dokumen: element.no_dokumen,
                periode_mulai: element.periode_mulai,
                periode_selesai: element.periode_selesai
            }
            // transaction.update(itemkategoriRef, {
            //     dokumen: [newdokumen],
            // });
            transaction.update(itemkategoriRef, {
                dokumen_berkas: arrayUnion(newdokumen),
            });
            transaction.update(itempenawaranRef, { ...data });
        }
        const penawaranRef = doc(db, "penawaran", data.id!);
        transaction.update(penawaranRef, { ...data });
        return;
    })
        .then(() => {
            return "ok";
        })
        .catch((error) => {
            return error.message;
        });
};


export const addberkasPenawaraninv = async (data: invoiceM) => {
    const db = useFirestore();
    const auth = getAuth();
    const now = moment().unix();
    const email = auth.currentUser?.email;

    return await runTransaction(db, async (transaction) => {

        // ✅ LOOP ITEMS DENGAN GUARD
        for (const element of data.items || []) {

            if (!element?.id_kategori_item) {
                console.warn("SKIP ITEM INVALID:", element);
                continue;
            }

            if (!data.id_penawaran || !data.id_inv) {
                throw new Error("ID penawaran / invoice tidak valid");
            }

            const itempenawaranRef = doc(
                db,
                "m_item_kategori",
                element.id_kategori_item,
                "penawaran",
                data.id_penawaran
            );

            const iteminvRef = doc(
                db,
                "m_item_kategori",
                element.id_kategori_item,
                "invoice",
                data.id_inv
            );

            // ✅ JANGAN KIRIM FULL OBJECT (INI PENTING)
            const payloadItem = {
                id_penawaran: data.id_penawaran,
                nama_kategori_item: element.nama_kategori_item ?? "",
                item_kode_bayar: data.item_kode_bayar ?? [],
                berkas: data.berkas ?? [],
                updatedAt: now,
                updatedBy: email,
            };

            transaction.update(itempenawaranRef, payloadItem);
            transaction.update(iteminvRef, payloadItem);
        }

        // ✅ REF UTAMA
        const penawaranRef = doc(db, "penawaran", data.id_penawaran);
        const invoiceRef = doc(db, "invoice", data.id_inv!);
        const penawaraninvRef = doc(
            db,
            "penawaran",
            data.id_penawaran,
            "invoice",
            data.id_inv!
        );

        // ✅ CLEAN FINAL DATA
        const payloadMain = {
            ...data,
            updatedAt: now,
            updatedBy: email,
        };

        transaction.update(penawaraninvRef, payloadMain);
        transaction.update(penawaranRef, payloadMain);
        transaction.update(invoiceRef, payloadMain);

        return;
    })
        .then(() => "ok")
        .catch((error) => {
            console.error("FIRESTORE ERROR:", error);
            return error.message;
        });
};



export const updateinvoice = async (data: invoiceM) => {
    const db = useFirestore();
    const idInvoice = data.id_inv || data.id; // Ambil salah satu yang ada

    if (!idInvoice) return "Error: ID Invoice tidak ditemukan";

    return await runTransaction(db, async (transaction) => {
        // 1. Update ke m_item_kategori (Loop items)
        if (data.items && Array.isArray(data.items)) {
            for (const element of data.items) {
                const iteminvRef = doc(
                    db,
                    "m_item_kategori",
                    element.id_kategori_item!,
                    "invoice",
                    idInvoice,
                );
                transaction.update(iteminvRef, { ...data });
            }
        }

        // 2. Update ke Invoice Utama
        const invoiceRef = doc(db, "invoice", idInvoice);
        transaction.update(invoiceRef, { ...data });

        // 3. Update ke Penawaran
        if (data.id_penawaran) {
            const penawaraninvRef = doc(
                db,
                "penawaran",
                data.id_penawaran,
                "invoice",
                idInvoice
            );
            transaction.update(penawaraninvRef, { ...data });
        }

        return;
    })
        .then(() => "ok")
        .catch((error) => {
            console.error("Transaction Error:", error);
            return error.message;
        });
};


export const updatetandaterimainvoice = async (data: invoiceM) => {
    const db = useFirestore();
    const idInvoice = data.id_inv || data.id; // Ambil salah satu yang ada

    if (!idInvoice) return "Error: ID Invoice tidak ditemukan";

    return await runTransaction(db, async (transaction) => {
        // 1. Update ke m_item_kategori (Loop items)
        if (data.items && Array.isArray(data.items)) {
            for (const element of data.items) {
                const iteminvRef = doc(
                    db,
                    "m_item_kategori",
                    element.id_kategori_item!,
                    "invoice",
                    idInvoice,
                );
                const itemkategoriRef = doc(
                    db,
                    "m_item_kategori",
                    element.id_kategori_item!,
                );
                transaction.update(iteminvRef, { ...data });
                transaction.update(itemkategoriRef, {
                    periode: element.periode_penawaran,
                });
            }
        }

        // 2. Update ke Invoice Utama
        const invoiceRef = doc(db, "invoice", idInvoice);
        transaction.update(invoiceRef, { ...data });

        // 3. Update ke Penawaran
        if (data.id_penawaran) {
            const penawaraninvRef = doc(
                db,
                "penawaran",
                data.id_penawaran,
                "invoice",
                idInvoice
            );
            transaction.update(penawaraninvRef, { ...data });
        }

        return;
    })
        .then(() => "ok")
        .catch((error) => {
            console.error("Transaction Error:", error);
            return error.message;
        });
};



export const updateinvoiceselesai = async (data: invoiceM) => {
    const db = useFirestore();
    const auth = getAuth();
    const now = moment().unix();
    const email = auth.currentUser?.email;

    return await runTransaction(db, async (transaction) => {
        const invoiceRef = doc(db, "invoice", data.id!);
        if (data.items && Array.isArray(data.items)) {
            for (const element of data.items) {
                const iteminvRef = doc(
                    db,
                    "m_item_kategori",
                    element.id_kategori_item!,
                    "invoice",
                    data.id!,
                );
                const itemkategoriRef = doc(
                    db,
                    "m_item_kategori",
                    element.id_kategori_item!,
                );
                transaction.update(iteminvRef, { ...data });
                transaction.update(itemkategoriRef, {
                    periode: element.periode_penawaran,
                });
            }
        }
        const penawaraninvRef = doc(
            db,
            "penawaran",
            data.id_penawaran,
            "invoice",
            data.id!,
        );
        transaction.update(penawaraninvRef, { ...data });
        transaction.update(invoiceRef, { ...data });
        return;
    })
        .then(() => {
            return "ok";
        })
        .catch((error) => {
            return error.message;
        });
};

export const setrevisipenawaran = async (data: penawaranM) => {
    const db = useFirestore();
    const auth = getAuth();
    const now = moment().unix();
    const email = auth.currentUser?.email;
    return await runTransaction(db, async (transaction) => {
        const datanomor = data.jumlah_revisi!;
        const newnumber = datanomor + 1;
        const stringnewnumber = _.toString(newnumber); // 3
        const padnumber = stringnewnumber.padStart(2, "0"); // 03
        const no_revisi = `${data.id_penawaran}-${padnumber}`;
        const id_revisi = `${data.id_penawaran}-${padnumber}`;
        // const revisipenawaranRef = doc(db, "revisi_penawaran", id_revisi);
        const penawaranrevisiRef = doc(
            db,
            "penawaran",
            data.id_penawaran!,
            "revisi_penawaran",
            id_revisi,
        );
        const penawaranRef = doc(db, "penawaran", data.id_penawaran!);
        // transaction.set(revisipenawaranRef, { ...data, no_revisi, id_revisi, revisi_dari: data.id })
        transaction.set(penawaranrevisiRef, {
            ...data,
            no_revisi,
            id_revisi,
            revisi_dari: data.id_penawaran,
        });
        transaction.update(penawaranRef, {
            jumlah_revisi: newnumber,
            updatedAt: now,
            updatedBy: email,
        });
        return;
    })
        .then(() => {
            return "ok";
        })
        .catch((error) => {
            return error.message;
        });
};

export const setrevisitopenawaran = async (
    datarevisi: revisipenawaranM,
    datapenawaran: penawaranM,
) => {
    const db = useFirestore();
    const auth = getAuth();
    const now = moment().unix();
    const email = auth.currentUser?.email ?? "-";

    try {
        await runTransaction(db, async (transaction) => {
            /** =========================
             * REF DOKUMEN
             ========================== */
            const penawaranRef = doc(db, "penawaran", datarevisi.id_penawaran!);
            const penawaranrevisiRef = doc(
                db,
                "penawaran",
                datarevisi.id_penawaran!,
                "revisi_penawaran",
                datarevisi.id_revisi!,
            );

            /** =========================
             * AMBIL DATA PENAWARAN AKTIF
             ========================== */
            const penawaranSnap = await transaction.get(penawaranRef);

            if (!penawaranSnap.exists()) {
                throw new Error("Data penawaran tidak ditemukan");
            }

            const penawaranLama = penawaranSnap.data() as penawaranM;

            /** =========================
             * DATA CLEAN (TANPA FIELD REVISI)
             ========================== */
            const penawaranClean = _.omit(datarevisi, [
                "no_revisi",
                "id_revisi",
                "revisi_dari",
                "id",
            ]);

            /** =========================
             * DIFF ITEM (LAMA vs BARU)
             ========================== */
            const oldItemIds = (penawaranLama.items || [])
                .map((i) => i.id_kategori_item)
                .filter(Boolean) as string[];

            const newItemIds = (datarevisi.items || [])
                .map((i) => i.id_kategori_item)
                .filter(Boolean) as string[];

            // ITEM YANG DIHAPUS
            const removedItemIds = oldItemIds.filter(
                (id) => !newItemIds.includes(id),
            );

            /** =========================
             * BALIKKAN ITEM YANG DIHAPUS → DRAFT
             ========================== */
            for (const removedId of removedItemIds) {
                const itemRef = doc(db, "m_item_kategori", removedId);
                const itemPenawaranRef = doc(
                    db,
                    "m_item_kategori",
                    removedId,
                    "penawaran",
                    datarevisi.id_penawaran!,
                );
                const cabangItemRef = doc(
                    db,
                    "m_cabang",
                    datarevisi.id_cabang_perusahaan!,
                    "m_item_kategori",
                    removedId,
                );

                transaction.set(
                    itemRef,
                    {
                        status: "Draft",
                        updatedAt: now,
                        updatedBy: email,
                    },
                    { merge: true },
                );

                transaction.set(
                    cabangItemRef,
                    {
                        status: "Draft",
                        updatedAt: now,
                        updatedBy: email,
                    },
                    { merge: true },
                );
                transaction.delete(itemPenawaranRef);
            }

            /** =========================
             * DATA PENAWARAN UNTUK ITEM AKTIF
             ========================== */
            const setdata = {
                ...penawaranClean,
                status: datapenawaran.status,
                jumlah_revisi: datapenawaran.jumlah_revisi,
                updatedAt: now,
                updatedBy: email,
            };

            /** =========================
             * SET ITEM AKTIF → PENAWARAN
             ========================== */
            for (const element of datarevisi.items || []) {
                const itemId = element.id_kategori_item!;
                const itemRef = doc(db, "m_item_kategori", itemId);

                const itemPenawaranRef = doc(
                    db,
                    "m_item_kategori",
                    itemId,
                    "penawaran",
                    datarevisi.id_penawaran!,
                );

                const cabangItemRef = doc(
                    db,
                    "m_cabang",
                    datarevisi.id_cabang_perusahaan!,
                    "m_item_kategori",
                    itemId,
                );

                // item global
                transaction.set(
                    itemRef,
                    {
                        status: "Penawaran",
                        penawaranAt: now,
                        penawaranBy: email,
                        updatedAt: now,
                        updatedBy: email,
                    },
                    { merge: true },
                );

                // item per cabang
                transaction.set(
                    cabangItemRef,
                    {
                        status: "Penawaran",
                        penawaranAt: now,
                        penawaranBy: email,
                        updatedAt: now,
                        updatedBy: email,
                    },
                    { merge: true },
                );

                // data penawaran per item
                transaction.set(itemPenawaranRef, setdata, { merge: true });
            }

            /** =========================
             * UPDATE DATA REVISI
             ========================== */
            transaction.update(penawaranrevisiRef, {
                ...datarevisi,
                status: "Terpakai",
                updatedAt: now,
                updatedBy: email,
            });

            /** =========================
             * UPDATE PENAWARAN UTAMA
             ========================== */
            transaction.update(penawaranRef, {
                ...penawaranClean,
                items: datarevisi.items || [],
                jumlah_revisi: datapenawaran.jumlah_revisi,
                status: datapenawaran.status,
                updatedAt: now,
                updatedBy: email,
            });
        });

        return "ok";
    } catch (error: any) {
        console.error(error);
        return error.message || "Terjadi kesalahan saat menyimpan revisi";
    }
};



export const setrevisiinvoice = async (data: invoiceM) => {
    const db = useFirestore();
    const auth = getAuth();
    const now = moment().unix();
    const email = auth.currentUser?.email;
    return await runTransaction(db, async (transaction) => {
        const datanomor = data.jumlah_revisi!;
        const newnumber = datanomor + 1;
        const stringnewnumber = _.toString(newnumber); // 3
        const padnumber = stringnewnumber.padStart(2, "0"); // 03
        const no_revisi = `${data.id_inv}-${padnumber}`;
        const id_revisi = `${data.id_inv}-${padnumber}`;
        // const revisiinvoiceRef = doc(db, "revisi_invoice", id_revisi);
        const invoicerevisiRef = doc(
            db,
            "invoice",
            data.id_inv!,
            "revisi_invoice",
            id_revisi,
        );
        const invoiceRef = doc(db, "invoice", data.id_inv!);
        const penawaranInvoiceRef = doc(db, "penawaran", data.id_penawaran, "invoice", data.id_inv!);
        // transaction.set(revisiinvoiceRef, { ...data, no_revisi, id_revisi, revisi_dari: data.id })
        transaction.set(invoicerevisiRef, {
            ...data,
            no_revisi,
            id_revisi,
            revisi_dari: data.id_inv,
        });
        transaction.update(invoiceRef, {
            jumlah_revisi: newnumber,
            updatedAt: now,
            updatedBy: email,
        });
        transaction.update(penawaranInvoiceRef, {
            jumlah_revisi: newnumber,
            updatedAt: now,
            updatedBy: email,
        });
        return;
    })
        .then(() => {
            return "ok";
        })
        .catch((error) => {
            return error.message;
        });
};

export const setrevisitoinvoice = async (
    datarevisi: invoiceM,
    datainvoice: invoiceM,
) => {
    const db = useFirestore();
    const auth = getAuth();
    const now = moment().unix();
    const email = auth.currentUser?.email ?? "-";

    try {
        await runTransaction(db, async (transaction) => {
            /** =========================
             * REF DOKUMEN
             ========================== */
            const invoiceRef = doc(db, "invoice", datarevisi.id_inv!);
            const penawaranInvoiceRef = doc(db, "penawaran", datarevisi.id_penawaran, "invoice", datarevisi.id_inv!);
            const invoicerevisiRef = doc(
                db,
                "invoice",
                datarevisi.id_inv!,
                "revisi_invoice",
                datarevisi.id_revisi!,
            );

            /** =========================
             * AMBIL DATA invoice AKTIF
             ========================== */
            const invoiceSnap = await transaction.get(invoiceRef);

            if (!invoiceSnap.exists()) {
                throw new Error("Data invoice tidak ditemukan");
            }

            const invoiceLama = invoiceSnap.data() as invoiceM;

            /** =========================
             * DATA CLEAN (TANPA FIELD REVISI)
             ========================== */
            const invoiceClean = _.omit(datarevisi, [
                "no_revisi",
                "id_revisi",
                "revisi_dari",
                "id",
            ]);

            /** =========================
             * DIFF ITEM (LAMA vs BARU)
             ========================== */
            const oldItemIds = (invoiceLama.items || [])
                .map((i) => i.id_kategori_item)
                .filter(Boolean) as string[];

            const newItemIds = (datarevisi.items || [])
                .map((i) => i.id_kategori_item)
                .filter(Boolean) as string[];

            // ITEM YANG DIHAPUS
            const removedItemIds = oldItemIds.filter(
                (id) => !newItemIds.includes(id),
            );

            /** =========================
             * BALIKKAN ITEM YANG DIHAPUS → DRAFT
             ========================== */
            for (const removedId of removedItemIds) {
                const itemRef = doc(db, "m_item_kategori", removedId);
                const iteminvoiceRef = doc(
                    db,
                    "m_item_kategori",
                    removedId,
                    "invoice",
                    datarevisi.id_inv!,
                );
                const cabangItemRef = doc(
                    db,
                    "m_cabang",
                    datarevisi.id_cabang_perusahaan!,
                    "m_item_kategori",
                    removedId,
                );

                transaction.set(
                    itemRef,
                    {
                        status: "Draft",
                        updatedAt: now,
                        updatedBy: email,
                    },
                    { merge: true },
                );

                transaction.set(
                    cabangItemRef,
                    {
                        status: "Draft",
                        updatedAt: now,
                        updatedBy: email,
                    },
                    { merge: true },
                );
                transaction.delete(iteminvoiceRef);
            }

            /** =========================
             * DATA invoice UNTUK ITEM AKTIF
             ========================== */
            const setdata = {
                ...invoiceClean,
                status: datainvoice.status,
                jumlah_revisi: datainvoice.jumlah_revisi,
                updatedAt: now,
                updatedBy: email,
            };

            /** =========================
             * SET ITEM AKTIF → invoice
             ========================== */
            for (const element of datarevisi.items || []) {
                const itemId = element.id_kategori_item!;
                const itemRef = doc(db, "m_item_kategori", itemId);

                const iteminvoiceRef = doc(
                    db,
                    "m_item_kategori",
                    itemId,
                    "invoice",
                    datarevisi.id_inv!,
                );

                const cabangItemRef = doc(
                    db,
                    "m_cabang",
                    datarevisi.id_cabang_perusahaan!,
                    "m_item_kategori",
                    itemId,
                );

                // item global
                transaction.set(
                    itemRef,
                    {
                        status: "invoice",
                        invoiceAt: now,
                        invoiceBy: email,
                        updatedAt: now,
                        updatedBy: email,
                    },
                    { merge: true },
                );

                // item per cabang
                transaction.set(
                    cabangItemRef,
                    {
                        status: "invoice",
                        invoiceAt: now,
                        invoiceBy: email,
                        updatedAt: now,
                        updatedBy: email,
                    },
                    { merge: true },
                );

                // data invoice per item
                transaction.set(iteminvoiceRef, setdata, { merge: true });
            }

            /** =========================
             * UPDATE DATA REVISI
             ========================== */
            transaction.update(invoicerevisiRef, {
                ...datarevisi,
                status: "Terpakai",
                updatedAt: now,
                updatedBy: email,
            });

            /** =========================
             * UPDATE invoice UTAMA
             ========================== */
            transaction.update(invoiceRef, {
                ...invoiceClean,
                items: datarevisi.items || [],
                jumlah_revisi: datainvoice.jumlah_revisi,
                status: datainvoice.status,
                updatedAt: now,
                updatedBy: email,
            });

            transaction.update(penawaranInvoiceRef, {
                ...invoiceClean,
                items: datarevisi.items || [],
                jumlah_revisi: datainvoice.jumlah_revisi,
                status: datainvoice.status,
                updatedAt: now,
                updatedBy: email,
            });
        });

        return "ok";
    } catch (error: any) {
        console.error(error);
        return error.message || "Terjadi kesalahan saat menyimpan revisi";
    }
};

export const setberitaacara = async (data: CompanyInspectionReport) => {
    console.log(data, "cek data composables");
    const db = useFirestore();
    const auth = getAuth();
    const now = moment().unix();
    // Auth may still be restoring its session when the form is submitted.
    // Fall back to the already-hydrated Pinia user, and never write undefined.
    const email = auth.currentUser?.email || useUserStore().getEmail || "-";

    try {
        return await runTransaction(db, async (transaction) => {
            const nomorInvRef = doc(db, "penomoran", "nomor");
            const getnomor = await transaction.get(nomorInvRef);

            if (!getnomor.exists()) {
                throw new Error("Dokumen penomoran/nomor tidak ditemukan");
            }

            const datanomor = getnomor.data();
            const newnumber = datanomor!.no_berita_acara + 1;
            const stringnewnumber = _.toString(newnumber).padStart(3, "0");
            const no_berita_acara = `BA-DRM-${stringnewnumber}`;
            const id_berita_acara = `BA-DRM-${stringnewnumber}`;
            const setdata = {
                ...data,
                no_berita_acara,
                id_berita_acara,
                createdAt: now,
                createdBy: email,
            };

            // 3️⃣ Ref dokumen utama laporan
            const beritaAcaraRef = doc(db, "berita_acara", id_berita_acara);
            // Simpan dokumen utama laporan
            transaction.set(beritaAcaraRef, setdata, { merge: true });
            transaction.update(nomorInvRef, { no_berita_acara: newnumber });
        }).then(() => {
            return "ok";
        });
    } catch (error: any) {
        console.error("Firestore transaction error:", error);
        return error.message;
    }
};

export const setPenawaran = async (data: penawaranM) => {
    console.log(data, "cek data composables");
    const db = useFirestore();
    // const auth = getAuth();
    const now = moment().unix();
    // Firebase Auth can still be restoring its session when this function runs.
    // The form already supplies created_by from the user store, so use it as a
    // fallback and never send an undefined value to Firestore.
    // const email = auth.currentUser?.email || data.created_by || "-";

    try {
        return await runTransaction(db, async (transaction) => {
            const nomorInvRef = doc(db, "penomoran", "nomor");
            const getnomor = await transaction.get(nomorInvRef);

            if (!getnomor.exists()) {
                throw new Error("Dokumen penomoran/nomor tidak ditemukan");
            }

            const datanomor = getnomor.data();
            const newnumber = datanomor!.no_penawaran + 1;
            const stringnewnumber = _.toString(newnumber).padStart(5, "0");
            const year = moment().format("YYYY");
            const no_penawaran = `QT/DRM/${year}/${stringnewnumber}`;
            const id_penawaran = `QT-DRM-${year}-${stringnewnumber}`;
            const setdata = {
                ...data,
                no_penawaran,
                id_penawaran,
                createdAt: now,
                createdBy: 'Administrator',
            };

            // 3️⃣ Ref dokumen utama laporan
            const penawaranRef = doc(db, "penawaran", id_penawaran);
            // Simpan dokumen utama laporan
            transaction.set(penawaranRef, setdata, { merge: true });
            for (const item of data.penawaran_item) {
                const harga_hpp = Number(item.harga_hpp);
                if (!Number.isFinite(harga_hpp) || harga_hpp <= 0) continue;

                const barangRef = doc(collection(db, "barang"));
                transaction.set(barangRef, {
                    // Keep the existing master barang page compatible.
                    nama_barang: item.nama,
                    harga_hpp,
                    createdAt: now,
                    createdBy: data.created_by || "-",
                });
            }
            transaction.update(nomorInvRef, { no_penawaran: newnumber });
        }).then(() => {
            return "ok";
        });
    } catch (error: any) {
        console.error("Firestore transaction error:", error);
        return error.message;
    }
};


export const setPurchaseOrder = async (data: purchaseorderM) => {
    console.log(data, "cek data composables");
    const db = useFirestore();
    // const auth = getAuth();
    const now = moment().unix();
    // Firebase Auth can still be restoring its session when this function runs.
    // The form already supplies created_by from the user store, so use it as a
    // fallback and never send an undefined value to Firestore.
    // const email = auth.currentUser?.email || data.created_by || "-";

    try {
        return await runTransaction(db, async (transaction) => {
            const nomorInvRef = doc(db, "penomoran", "nomor");
            const getnomor = await transaction.get(nomorInvRef);

            if (!getnomor.exists()) {
                throw new Error("Dokumen penomoran/nomor tidak ditemukan");
            }

            const datanomor = getnomor.data();
            const newnumber = datanomor!.no_penawaran + 1;
            const stringnewnumber = _.toString(newnumber).padStart(5, "0");
            const year = moment().format("YYYY");
            const no_penawaran = `QT/DRM/${year}/${stringnewnumber}`;
            const id_penawaran = `QT-DRM-${year}-${stringnewnumber}`;
       

            // 3️⃣ Ref dokumen utama laporan
            const purchaseOrderRef = doc(db, "purchaseorder", id_penawaran);
            transaction.update(nomorInvRef, { no_penawaran: newnumber });
        }).then(() => {
            return "ok";
        });
    } catch (error: any) {
        console.error("Firestore transaction error:", error);
        return error.message;
    }
};
