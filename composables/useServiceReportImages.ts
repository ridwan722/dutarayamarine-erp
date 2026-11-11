import {
  collection,
  doc,
  getDocs,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import type { serviceReportImageM, serviceReportM } from "~/types/invoice";

const SERVICE_REPORT_IMAGES_COLLECTION = "service_report_images";
const FIRESTORE_IMAGE_BATCH_SIZE = 25;

function imagesCollection(db: Firestore, quotationId: string) {
  return collection(
    db,
    "penawaran",
    quotationId,
    SERVICE_REPORT_IMAGES_COLLECTION,
  );
}

export function reportNeedsImageHydration(report?: serviceReportM | null) {
  return Boolean(
    report?.images?.some(
      (image) => !image.dataUrl && Boolean(image.firestoreImageId),
    ),
  );
}

export async function hydrateServiceReportImages(
  db: Firestore,
  quotationId: string,
  report: serviceReportM,
): Promise<serviceReportM> {
  if (!quotationId || !reportNeedsImageHydration(report)) return report;

  const snapshot = await getDocs(imagesCollection(db, quotationId));
  const dataUrlById = new Map<string, string>();
  snapshot.forEach((imageDocument) => {
    const dataUrl = imageDocument.data().dataUrl;
    if (typeof dataUrl === "string" && dataUrl) {
      dataUrlById.set(imageDocument.id, dataUrl);
    }
  });

  return {
    ...report,
    images: (report.images || []).map((image) => {
      if (image.dataUrl || !image.firestoreImageId) return image;
      return {
        ...image,
        dataUrl: dataUrlById.get(image.firestoreImageId) || "",
      };
    }),
  };
}

export async function persistServiceReportImages(
  db: Firestore,
  quotationId: string,
  images: serviceReportImageM[],
  updatedBy: string,
  writtenImageIds: string[],
) {
  const imageCollection = imagesCollection(db, quotationId);
  const newImageIdByLocalId = new Map<string, string>();
  const pendingImages = images
    .filter(
      (image) =>
        image.dataUrl?.startsWith("data:") && !image.firestoreImageId,
    )
    .map((image) => {
      const firestoreImageId = doc(imageCollection).id;
      newImageIdByLocalId.set(image.id, firestoreImageId);
      return { image, firestoreImageId };
    });

  for (
    let start = 0;
    start < pendingImages.length;
    start += FIRESTORE_IMAGE_BATCH_SIZE
  ) {
    const pendingBatch = pendingImages.slice(
      start,
      start + FIRESTORE_IMAGE_BATCH_SIZE,
    );
    const batch = writeBatch(db);
    pendingBatch.forEach(({ image, firestoreImageId }) => {
      batch.set(doc(imageCollection, firestoreImageId), {
        imageId: image.id,
        name: image.name || "Foto Service Report.jpg",
        dataUrl: image.dataUrl,
        size: Number(image.size) || 0,
        contentType: image.contentType || "image/jpeg",
        updatedAt: Date.now(),
        updatedBy: updatedBy || "-",
      });
    });
    await batch.commit();
    writtenImageIds.push(
      ...pendingBatch.map(({ firestoreImageId }) => firestoreImageId),
    );
  }

  return images.map((image): serviceReportImageM => {
    const firestoreImageId =
      image.firestoreImageId || newImageIdByLocalId.get(image.id);
    if (!firestoreImageId) return { ...image };
    return {
      id: image.id,
      name: image.name || "Foto Service Report.jpg",
      description: image.description || "",
      dataUrl: "",
      size: Number(image.size) || 0,
      contentType: image.contentType || "image/jpeg",
      firestoreImageId,
    };
  });
}

export async function deleteServiceReportImages(
  db: Firestore,
  quotationId: string,
  firestoreImageIds: string[],
) {
  const uniqueIds = [...new Set(firestoreImageIds.filter(Boolean))];
  const imageCollection = imagesCollection(db, quotationId);

  for (
    let start = 0;
    start < uniqueIds.length;
    start += FIRESTORE_IMAGE_BATCH_SIZE
  ) {
    const batch = writeBatch(db);
    uniqueIds
      .slice(start, start + FIRESTORE_IMAGE_BATCH_SIZE)
      .forEach((firestoreImageId) => {
        batch.delete(doc(imageCollection, firestoreImageId));
      });
    await batch.commit();
  }
}
