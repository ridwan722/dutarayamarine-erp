import {
  collection,
  collectionGroup,
  getDocs,
  type Firestore,
} from "firebase/firestore";
import type { purchaseorderM } from "~/types/purchaseorderModel";

export type IndexedPurchaseOrder = purchaseorderM & { id: string };

export type PurchaseOrderIndexResult = {
  items: IndexedPurchaseOrder[];
  partial: boolean;
};

/**
 * Mengambil PO hanya dari penawaran/{id}/purchaseorder.
 *
 * Collection-group dipakai sebagai jalur utama. Beberapa deployment lama tidak
 * mengizinkan collection-group, sehingga tersedia fallback ke setiap dokumen
 * penawaran agar halaman index tetap dapat digunakan.
 */
export async function fetchPurchaseOrderIndex(
  db: Firestore,
): Promise<PurchaseOrderIndexResult> {
  try {
    const snapshot = await getDocs(collectionGroup(db, "purchaseorder"));
    const items = snapshot.docs
      .filter((item) => item.ref.parent.parent?.parent.id === "penawaran")
      .map((item) => ({
        ...(item.data() as purchaseorderM),
        id: item.id,
        id_penawaran: item.ref.parent.parent!.id,
      }));

    return { items, partial: false };
  } catch (collectionGroupError) {
    console.warn(
      "Collection-group Purchase Order tidak tersedia, memakai fallback:",
      collectionGroupError,
    );

    const quotationSnapshot = await getDocs(collection(db, "penawaran"));
    const quotationIds = quotationSnapshot.docs.map((item) => item.id);
    const items: IndexedPurchaseOrder[] = [];
    let partial = false;

    // Batasi jumlah read paralel agar tetap ringan saat jumlah quotation besar.
    for (let offset = 0; offset < quotationIds.length; offset += 8) {
      const batch = quotationIds.slice(offset, offset + 8);
      const results = await Promise.allSettled(
        batch.map((quotationId) =>
          getDocs(
            collection(db, "penawaran", quotationId, "purchaseorder"),
          ),
        ),
      );

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          partial = true;
          return;
        }

        items.push(
          ...result.value.docs.map((item) => ({
            ...(item.data() as purchaseorderM),
            id: item.id,
            id_penawaran: batch[index]!,
          })),
        );
      });
    }

    return { items, partial };
  }
}
