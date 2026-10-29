<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import moment from "moment";
import Sortable from "sortablejs";
import type { ConfirmationDialog } from "#components";
import type { projectWebM, projectWebPhotoM } from "~/types/projectWebModel";

definePageMeta({ layout: "admin" });

const projectWebStore = useProjectWebStore();
const notificationStore = useNotificationStore();
const userStore = useUserStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);
const isLoading = ref(true);
const isSaving = ref(false);
const deletingProjectId = ref("");
const detailProject = ref<projectWebM | null>(null);
const pendingFiles = ref<File[]>([]);
const pendingPreviewUrls = ref<string[]>([]);
const removedPhotos = ref<projectWebPhotoM[]>([]);
const photoDrafts = ref<ProjectPhotoDraft[]>([]);
const photoGrid = ref<HTMLElement | null>(null);
const photoProcessingProgress = ref(0);
const translatingFields = ref<Set<string>>(new Set());
const photoObjectUrls = new Map<string, string>();
const translationTimers = new Map<string, ReturnType<typeof setTimeout>>();
const translationRequestVersions = new Map<string, number>();
const fieldEditVersions = new Map<string, number>();
const MAX_PROJECT_BYTES = 900_000;
const PROJECT_SIZE_SAFETY_BYTES = 25_000;
const TRANSLATION_DEBOUNCE_MS = 700;
let translationErrorShown = false;
let photoDraftSequence = 0;
let photoSortable: Sortable | null = null;

type ProjectLanguage = "id" | "en";

interface TranslationResponse {
  translatedText: string;
}

type ProjectPhotoDraft =
  | {
      id: string;
      kind: "existing";
      photo: projectWebPhotoM;
    }
  | {
      id: string;
      kind: "pending";
      file: File;
      previewUrl: string;
    };

const data = reactive({
  searchProject: "",
  dialogForm: false,
  dialogDetail: false,
  formMode: "add" as "add" | "edit",
});

const projectHeaders = [
  { title: "No.", value: "no", sortable: false, width: "52px" },
  { title: "Dibuat", value: "createdAt", sortable: true, width: "85px" },
  { title: "Project", value: "judul", sortable: true, width: "370px" },
  { title: "Konten", value: "konten", sortable: false, width: "165px" },
  { title: "Foto", value: "foto", sortable: false, width: "145px" },
  {
    title: "Aksi",
    value: "aksi",
    sortable: false,
    align: "center" as const,
    width: "132px",
  },
];

function emptyProject(): projectWebM {
  return {
    judul: "",
    sub_judul: "",
    paragraf: [""],
    paragraf_en: [""],
    foto: [],
    paragraf_penutup: "",
    paragraf_penutup_en: "",
    createdAt: 0,
  };
}

const projectForm = ref<projectWebM>(emptyProject());
const isTranslating = computed(() => translatingFields.value.size > 0);
const projects = computed(() => projectWebStore.getDataProjectWeb);
const totalPhotos = computed(() =>
  projects.value.reduce((total, project) => total + project.foto.length, 0),
);
const totalParagraphs = computed(() =>
  projects.value.reduce(
    (total, project) => total + project.paragraf.filter(Boolean).length,
    0,
  ),
);
const filteredProjects = computed(() => {
  const query = data.searchProject.trim().toLocaleLowerCase("id-ID");
  return [...projects.value]
    .filter((project) => {
      if (!query) return true;
      return [
        project.judul,
        project.sub_judul,
        project.paragraf.join(" "),
        project.paragraf_en.join(" "),
        project.paragraf_penutup,
        project.paragraf_penutup_en,
      ].some((value) => value.toLocaleLowerCase("id-ID").includes(query));
    })
    .sort(
      (a, b) => createdAtSeconds(b.createdAt) - createdAtSeconds(a.createdAt),
    );
});

onMounted(async () => {
  try {
    isLoading.value = true;
    await projectWebStore.tarikDataProjectWebAct();
  } catch (error) {
    console.error("Gagal mengambil project website:", error);
    notificationStore.showError("Gagal mengambil data project website");
  } finally {
    isLoading.value = false;
  }
});

watch(
  [() => data.dialogForm, () => photoDrafts.value.length],
  async ([isOpen, photoCount]) => {
    destroyPhotoSortable();
    if (!isOpen || !photoCount) return;
    await nextTick();
    initializePhotoSortable();
  },
  { flush: "post" },
);

onBeforeUnmount(() => {
  destroyPhotoSortable();
  resetTranslationState();
  resetPendingFiles();
  photoObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  photoObjectUrls.clear();
});

function createdAtSeconds(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    value &&
    typeof value === "object" &&
    "seconds" in value &&
    typeof value.seconds === "number"
  ) {
    return value.seconds;
  }
  return 0;
}

function formatCreatedAt(value: unknown) {
  const seconds = createdAtSeconds(value);
  return seconds ? moment.unix(seconds).format("DD MMM YYYY") : "—";
}

function projectInitial(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "PW";
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

function cloneProject(project: projectWebM): projectWebM {
  return {
    ...project,
    paragraf: [...project.paragraf],
    paragraf_en: [...project.paragraf_en],
    foto: project.foto.map((photo) => ({ ...photo })),
  };
}

function displayPhotoUrl(photo: projectWebPhotoM) {
  if (!photo.url.startsWith("data:")) return photo.url;

  const cachedUrl = photoObjectUrls.get(photo.url);
  if (cachedUrl) return cachedUrl;

  try {
    const separatorIndex = photo.url.indexOf(",");
    const header = photo.url.slice(0, separatorIndex);
    const encodedData = photo.url.slice(separatorIndex + 1);
    const mimeType =
      header.match(/^data:([^;]+)/)?.[1] || photo.contentType || "image/webp";
    const binary = header.includes(";base64")
      ? atob(encodedData)
      : decodeURIComponent(encodedData);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    const objectUrl = URL.createObjectURL(
      new Blob([bytes], { type: mimeType }),
    );
    photoObjectUrls.set(photo.url, objectUrl);
    return objectUrl;
  } catch (error) {
    console.warn(`Foto ${photo.name} gagal dibuat menjadi Blob URL.`, error);
    return photo.url;
  }
}

function paragraphFieldKey(index: number, language: ProjectLanguage) {
  return `paragraph:${index}:${language}`;
}

function closingFieldKey(language: ProjectLanguage) {
  return `closing:${language}`;
}

function isTranslatingField(key: string) {
  return translatingFields.value.has(key);
}

function setFieldTranslating(key: string, translating: boolean) {
  const next = new Set(translatingFields.value);
  if (translating) next.add(key);
  else next.delete(key);
  translatingFields.value = next;
}

function resetTranslationState() {
  translationTimers.forEach((timer) => clearTimeout(timer));
  translationTimers.clear();
  translationRequestVersions.clear();
  fieldEditVersions.clear();
  translatingFields.value = new Set();
  translationErrorShown = false;
}

function markFieldEdited(key: string) {
  fieldEditVersions.set(key, (fieldEditVersions.get(key) || 0) + 1);
}

async function translateText(
  text: string,
  sourceLanguage: ProjectLanguage,
  targetLanguage: ProjectLanguage,
) {
  const response = await $fetch<TranslationResponse>("/api/translate", {
    method: "POST",
    body: {
      text,
      source: sourceLanguage,
      target: targetLanguage,
    },
  });
  const translatedText = response.translatedText?.trim();
  if (!translatedText) throw new Error("Hasil terjemahan kosong");
  return translatedText;
}

function scheduleTranslation(options: {
  text: string;
  source: ProjectLanguage;
  target: ProjectLanguage;
  targetKey: string;
  isSourceCurrent: () => boolean;
  apply: (translatedText: string) => void;
}) {
  const existingTimer = translationTimers.get(options.targetKey);
  if (existingTimer) clearTimeout(existingTimer);

  const requestVersion =
    (translationRequestVersions.get(options.targetKey) || 0) + 1;
  translationRequestVersions.set(options.targetKey, requestVersion);

  const text = options.text.trim();
  if (!text) {
    translationTimers.delete(options.targetKey);
    setFieldTranslating(options.targetKey, false);
    options.apply("");
    return;
  }

  const targetEditVersion = fieldEditVersions.get(options.targetKey) || 0;
  setFieldTranslating(options.targetKey, true);

  const timer = setTimeout(async () => {
    translationTimers.delete(options.targetKey);
    try {
      const translatedText = await translateText(
        text,
        options.source,
        options.target,
      );

      const isLatestRequest =
        translationRequestVersions.get(options.targetKey) === requestVersion;
      const targetWasNotEdited =
        (fieldEditVersions.get(options.targetKey) || 0) === targetEditVersion;
      if (isLatestRequest && targetWasNotEdited && options.isSourceCurrent()) {
        options.apply(translatedText);
        translationErrorShown = false;
      }
    } catch (error) {
      console.error("Terjemahan otomatis gagal:", error);
      if (!translationErrorShown) {
        const message = error instanceof Error ? error.message : "";
        notificationStore.showError(
          message ||
            "Terjemahan otomatis gagal. Isi kolom pasangan secara manual atau coba lagi.",
        );
        translationErrorShown = true;
      }
    } finally {
      if (
        translationRequestVersions.get(options.targetKey) === requestVersion
      ) {
        setFieldTranslating(options.targetKey, false);
      }
    }
  }, TRANSLATION_DEBOUNCE_MS);

  translationTimers.set(options.targetKey, timer);
}

function updateParagraph(
  index: number,
  language: ProjectLanguage,
  value: unknown,
) {
  const nextValue = String(value ?? "");
  const sourceKey = paragraphFieldKey(index, language);
  markFieldEdited(sourceKey);

  if (language === "id") {
    projectForm.value.paragraf[index] = nextValue;
    scheduleTranslation({
      text: nextValue,
      source: "id",
      target: "en",
      targetKey: paragraphFieldKey(index, "en"),
      isSourceCurrent: () => projectForm.value.paragraf[index] === nextValue,
      apply: (translatedText) => {
        projectForm.value.paragraf_en[index] = translatedText;
      },
    });
    return;
  }

  projectForm.value.paragraf_en[index] = nextValue;
  scheduleTranslation({
    text: nextValue,
    source: "en",
    target: "id",
    targetKey: paragraphFieldKey(index, "id"),
    isSourceCurrent: () => projectForm.value.paragraf_en[index] === nextValue,
    apply: (translatedText) => {
      projectForm.value.paragraf[index] = translatedText;
    },
  });
}

function updateClosingParagraph(language: ProjectLanguage, value: unknown) {
  const nextValue = String(value ?? "");
  markFieldEdited(closingFieldKey(language));

  if (language === "id") {
    projectForm.value.paragraf_penutup = nextValue;
    scheduleTranslation({
      text: nextValue,
      source: "id",
      target: "en",
      targetKey: closingFieldKey("en"),
      isSourceCurrent: () => projectForm.value.paragraf_penutup === nextValue,
      apply: (translatedText) => {
        projectForm.value.paragraf_penutup_en = translatedText;
      },
    });
    return;
  }

  projectForm.value.paragraf_penutup_en = nextValue;
  scheduleTranslation({
    text: nextValue,
    source: "en",
    target: "id",
    targetKey: closingFieldKey("id"),
    isSourceCurrent: () => projectForm.value.paragraf_penutup_en === nextValue,
    apply: (translatedText) => {
      projectForm.value.paragraf_penutup = translatedText;
    },
  });
}

function translateMissingContent() {
  projectForm.value.paragraf.forEach((paragraph, index) => {
    const englishParagraph = projectForm.value.paragraf_en[index] || "";
    if (paragraph.trim() && !englishParagraph.trim()) {
      scheduleTranslation({
        text: paragraph,
        source: "id",
        target: "en",
        targetKey: paragraphFieldKey(index, "en"),
        isSourceCurrent: () => projectForm.value.paragraf[index] === paragraph,
        apply: (translatedText) => {
          projectForm.value.paragraf_en[index] = translatedText;
        },
      });
    } else if (!paragraph.trim() && englishParagraph.trim()) {
      scheduleTranslation({
        text: englishParagraph,
        source: "en",
        target: "id",
        targetKey: paragraphFieldKey(index, "id"),
        isSourceCurrent: () =>
          projectForm.value.paragraf_en[index] === englishParagraph,
        apply: (translatedText) => {
          projectForm.value.paragraf[index] = translatedText;
        },
      });
    }
  });

  const closingId = projectForm.value.paragraf_penutup;
  const closingEn = projectForm.value.paragraf_penutup_en;
  if (closingId.trim() && !closingEn.trim()) {
    scheduleTranslation({
      text: closingId,
      source: "id",
      target: "en",
      targetKey: closingFieldKey("en"),
      isSourceCurrent: () => projectForm.value.paragraf_penutup === closingId,
      apply: (translatedText) => {
        projectForm.value.paragraf_penutup_en = translatedText;
      },
    });
  } else if (!closingId.trim() && closingEn.trim()) {
    scheduleTranslation({
      text: closingEn,
      source: "en",
      target: "id",
      targetKey: closingFieldKey("id"),
      isSourceCurrent: () =>
        projectForm.value.paragraf_penutup_en === closingEn,
      apply: (translatedText) => {
        projectForm.value.paragraf_penutup = translatedText;
      },
    });
  }
}

function nextPhotoDraftId() {
  photoDraftSequence += 1;
  return `project-photo-${photoDraftSequence}`;
}

function initializePhotoDrafts() {
  photoDrafts.value = projectForm.value.foto.map((photo) => ({
    id: nextPhotoDraftId(),
    kind: "existing" as const,
    photo,
  }));
}

function photoDraftUrl(item: ProjectPhotoDraft) {
  return item.kind === "existing"
    ? displayPhotoUrl(item.photo)
    : item.previewUrl;
}

function photoDraftName(item: ProjectPhotoDraft) {
  return item.kind === "existing" ? item.photo.name : item.file.name;
}

function movePhotoDraft(fromIndex: number, toIndex: number) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= photoDrafts.value.length ||
    toIndex >= photoDrafts.value.length
  ) {
    return;
  }

  const next = [...photoDrafts.value];
  const [movedPhoto] = next.splice(fromIndex, 1);
  if (!movedPhoto) return;
  next.splice(toIndex, 0, movedPhoto);
  photoDrafts.value = next;
}

function destroyPhotoSortable() {
  photoSortable?.destroy();
  photoSortable = null;
}

function initializePhotoSortable() {
  if (!photoGrid.value) return;

  photoSortable = new Sortable(photoGrid.value, {
    animation: 170,
    draggable: ".photo-preview",
    handle: ".photo-drag-handle",
    filter: ".photo-remove",
    preventOnFilter: false,
    ghostClass: "photo-sortable-ghost",
    chosenClass: "photo-sortable-chosen",
    dragClass: "photo-sortable-drag",
    delay: 0,
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 3,
    scroll: true,
    onEnd(event) {
      const fromIndex = event.oldDraggableIndex ?? event.oldIndex;
      const toIndex = event.newDraggableIndex ?? event.newIndex;
      if (fromIndex === undefined || toIndex === undefined) return;
      movePhotoDraft(fromIndex, toIndex);
    },
  });
}

function removePhotoDraft(item: ProjectPhotoDraft) {
  if (item.kind === "existing") {
    const photoIndex = projectForm.value.foto.indexOf(item.photo);
    if (photoIndex >= 0) {
      const [photo] = projectForm.value.foto.splice(photoIndex, 1);
      if (photo) removedPhotos.value.push(photo);
    }
  } else {
    const fileIndex = pendingFiles.value.indexOf(item.file);
    if (fileIndex >= 0) pendingFiles.value.splice(fileIndex, 1);

    const previewIndex = pendingPreviewUrls.value.indexOf(item.previewUrl);
    if (previewIndex >= 0) pendingPreviewUrls.value.splice(previewIndex, 1);
    URL.revokeObjectURL(item.previewUrl);
  }

  photoDrafts.value = photoDrafts.value.filter((photo) => photo.id !== item.id);
}

function resetPendingFiles() {
  pendingPreviewUrls.value.forEach((url) => URL.revokeObjectURL(url));
  pendingFiles.value = [];
  pendingPreviewUrls.value = [];
  removedPhotos.value = [];
  photoDrafts.value = [];
  photoDraftSequence = 0;
  photoProcessingProgress.value = 0;
}

function openDialogAddProject() {
  resetTranslationState();
  resetPendingFiles();
  data.formMode = "add";
  projectForm.value = emptyProject();
  initializePhotoDrafts();
  data.dialogForm = true;
}

function openDialogEditProject(project: projectWebM) {
  resetTranslationState();
  resetPendingFiles();
  data.formMode = "edit";
  projectForm.value = cloneProject(project);
  initializePhotoDrafts();
  if (!projectForm.value.paragraf.length) projectForm.value.paragraf = [""];
  while (
    projectForm.value.paragraf_en.length < projectForm.value.paragraf.length
  ) {
    projectForm.value.paragraf_en.push("");
  }
  data.dialogForm = true;
  translateMissingContent();
}

function closeFormDialog() {
  if (isSaving.value) return;
  data.dialogForm = false;
  resetTranslationState();
  resetPendingFiles();
}

function openDetailDialog(project: projectWebM) {
  detailProject.value = cloneProject(project);
  data.dialogDetail = true;
}

function editDetailProject() {
  if (!detailProject.value) return;
  const project = cloneProject(detailProject.value);
  data.dialogDetail = false;
  openDialogEditProject(project);
}

function addParagraph() {
  projectForm.value.paragraf.push("");
  projectForm.value.paragraf_en.push("");
}

function removeParagraph(index: number) {
  resetTranslationState();
  if (projectForm.value.paragraf.length === 1) {
    projectForm.value.paragraf[0] = "";
    projectForm.value.paragraf_en[0] = "";
    return;
  }
  projectForm.value.paragraf.splice(index, 1);
  projectForm.value.paragraf_en.splice(index, 1);
  translateMissingContent();
}

function addPhotoFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const selectedFiles = Array.from(input.files || []);
  input.value = "";
  if (!selectedFiles.length) return;

  const validFiles = selectedFiles.filter((file) => {
    if (!file.type.startsWith("image/")) {
      notificationStore.showError(`${file.name} bukan file gambar`);
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      notificationStore.showError(`Ukuran ${file.name} melebihi 10 MB`);
      return false;
    }
    return true;
  });
  const availableSlots = Math.max(
    0,
    12 - projectForm.value.foto.length - pendingFiles.value.length,
  );
  if (validFiles.length > availableSlots) {
    notificationStore.showInfo("Maksimal 12 foto untuk satu project");
  }
  const acceptedFiles = validFiles.slice(0, availableSlots);
  const acceptedPreviews = acceptedFiles.map((file) =>
    URL.createObjectURL(file),
  );
  pendingFiles.value.push(...acceptedFiles);
  pendingPreviewUrls.value.push(...acceptedPreviews);
  photoDrafts.value.push(
    ...acceptedFiles.map((file, index) => ({
      id: nextPhotoDraftId(),
      kind: "pending" as const,
      file,
      previewUrl: acceptedPreviews[index]!,
    })),
  );
}

function documentBytes(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function readProjectPhoto(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Foto project tidak dapat dibaca"));
    };
    reader.onerror = () =>
      reject(reader.error || new Error("Foto project tidak dapat dibaca"));
    reader.onabort = () =>
      reject(new Error("Pembacaan foto project dibatalkan"));
    reader.readAsDataURL(file);
  });
}

async function prepareProjectPhoto(
  file: File,
  maxDataUrlBytes: number,
): Promise<projectWebPhotoM> {
  const estimatedDataUrlBytes = 4 * Math.ceil(file.size / 3) + 100;
  if (estimatedDataUrlBytes <= maxDataUrlBytes) {
    return {
      name: file.name,
      url: await readProjectPhoto(file),
      size: file.size,
      contentType: file.type || "application/octet-stream",
    };
  }

  if (
    typeof createImageBitmap !== "function" ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml"
  ) {
    throw new Error(
      `Foto ${file.name} terlalu besar dan formatnya tidak dapat dikompres.`,
    );
  }

  const bitmap = await createImageBitmap(file);
  try {
    let scale = Math.min(1, 1_600 / Math.max(bitmap.width, bitmap.height));
    let quality = 0.82;
    const baseName = file.name.replace(/\.[^.]+$/, "") || "foto-project";

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(320, Math.round(bitmap.width * scale));
      canvas.height = Math.max(240, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Foto project tidak dapat diproses");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );
      if (!blob) throw new Error(`Foto ${file.name} gagal dikompres`);

      const dataUrl = await readProjectPhoto(blob);
      if (documentBytes(dataUrl) <= maxDataUrlBytes) {
        return {
          name: `${baseName}.webp`,
          url: dataUrl,
          size: blob.size,
          contentType: "image/webp",
        };
      }

      if (quality > 0.52) quality -= 0.1;
      else {
        scale *= 0.78;
        quality = 0.72;
      }
    }
  } finally {
    bitmap.close();
  }

  throw new Error(
    `Foto ${file.name} masih terlalu besar setelah dikompres. Gunakan foto yang lebih kecil.`,
  );
}

async function prepareProjectPhotos(
  files: File[],
  payloadWithoutNewPhotos: projectWebM,
) {
  if (!files.length) return [] as projectWebPhotoM[];

  const availableBytes =
    MAX_PROJECT_BYTES -
    documentBytes(payloadWithoutNewPhotos) -
    PROJECT_SIZE_SAFETY_BYTES;
  const maxDataUrlBytes = Math.floor(availableBytes / files.length);
  if (maxDataUrlBytes < 25_000) {
    throw new Error(
      "Data project terlalu besar untuk ditambah foto. Kurangi isi atau jumlah foto.",
    );
  }

  const photos: projectWebPhotoM[] = [];
  for (const [index, file] of files.entries()) {
    photos.push(await prepareProjectPhoto(file, maxDataUrlBytes));
    photoProcessingProgress.value = Math.round(
      ((index + 1) / files.length) * 100,
    );
  }
  return photos;
}

async function saveProject() {
  if (isSaving.value) return;
  if (isTranslating.value) {
    return notificationStore.showInfo("Tunggu terjemahan otomatis selesai");
  }

  const judul = projectForm.value.judul.trim();
  const subJudul = projectForm.value.sub_judul.trim();
  const paragraphPairs = projectForm.value.paragraf
    .map((paragraph, index) => ({
      id: paragraph.trim(),
      en: (projectForm.value.paragraf_en[index] || "").trim(),
    }))
    .filter((paragraph) => paragraph.id || paragraph.en);
  const paragraf = paragraphPairs.map((paragraph) => paragraph.id);
  const paragrafEn = paragraphPairs.map((paragraph) => paragraph.en);
  const paragrafPenutup = projectForm.value.paragraf_penutup.trim();
  const paragrafPenutupEn = projectForm.value.paragraf_penutup_en.trim();

  if (!judul) return notificationStore.showError("Judul tidak boleh kosong");
  if (!subJudul)
    return notificationStore.showError("Subjudul tidak boleh kosong");
  if (!paragraphPairs.length)
    return notificationStore.showError("Tambahkan minimal satu paragraf");
  if (paragraphPairs.some((paragraph) => !paragraph.id)) {
    return notificationStore.showError(
      "Lengkapi semua paragraf Bahasa Indonesia",
    );
  }
  if (paragraphPairs.some((paragraph) => !paragraph.en)) {
    return notificationStore.showError(
      "Lengkapi semua paragraf Bahasa Inggris",
    );
  }
  if (!paragrafPenutup) {
    return notificationStore.showError(
      "Paragraf penutup Bahasa Indonesia tidak boleh kosong",
    );
  }
  if (!paragrafPenutupEn) {
    return notificationStore.showError(
      "Paragraf penutup Bahasa Inggris tidak boleh kosong",
    );
  }

  isSaving.value = true;
  useloadingStore().setLoading(true);
  try {
    const payload: projectWebM = {
      ...projectForm.value,
      judul,
      sub_judul: subJudul,
      paragraf,
      paragraf_en: paragrafEn,
      paragraf_penutup: paragrafPenutup,
      paragraf_penutup_en: paragrafPenutupEn,
    };
    const newPhotos = await prepareProjectPhotos(pendingFiles.value, payload);
    const preparedPhotos = new Map<File, projectWebPhotoM>();
    pendingFiles.value.forEach((file, index) => {
      const photo = newPhotos[index];
      if (photo) preparedPhotos.set(file, photo);
    });
    payload.foto = photoDrafts.value.flatMap((item) => {
      if (item.kind === "existing") return [item.photo];
      const preparedPhoto = preparedPhotos.get(item.file);
      return preparedPhoto ? [preparedPhoto] : [];
    });

    if (documentBytes(payload) > MAX_PROJECT_BYTES) {
      return notificationStore.showError(
        "Ukuran project beserta foto terlalu besar. Kurangi jumlah foto.",
      );
    }

    const saved =
      data.formMode === "add"
        ? await projectWebStore.addProjectWebAct({
            ...payload,
            createdAt: moment().unix(),
            createdBy: userStore.getEmail,
          })
        : await projectWebStore.updateProjectWebAct(
            {
              ...payload,
              updatedAt: moment().unix(),
              updatedBy: userStore.getEmail,
            },
            removedPhotos.value,
          );

    if (saved) {
      data.dialogForm = false;
      resetTranslationState();
      resetPendingFiles();
    }
  } catch (error) {
    console.error("Gagal menyimpan project atau membaca foto:", error);
    notificationStore.showError(
      error instanceof Error
        ? error.message
        : "Gagal menyimpan project atau membaca foto",
    );
  } finally {
    isSaving.value = false;
    useloadingStore().setLoading(false);
  }
}

async function deleteProject(project: projectWebM) {
  if (!project.id_project_web) {
    return notificationStore.showError("ID project website tidak ditemukan");
  }
  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus Project",
    `Anda yakin ingin menghapus “${project.judul}” beserta seluruh fotonya?`,
    { variant: "danger" },
  );
  if (!confirmed) return notificationStore.showInfo("Penghapusan dibatalkan");

  deletingProjectId.value = project.id_project_web;
  try {
    await projectWebStore.deleteProjectWebAct(project);
  } finally {
    deletingProjectId.value = "";
  }
}
</script>

<template>
  <div class="project-page">
    <ConfirmationDialog ref="confirmationDialog" />

    <v-btn
      variant="text"
      color="grey-darken-3"
      prepend-icon="mdi-arrow-left"
      class="back-button text-none"
      @click="$router.go(-1)"
    >
      Kembali
    </v-btn>

    <header class="project-hero">
      <div class="project-hero-copy">
        <span class="eyebrow">Master Data</span>
        <h1>Project Website</h1>
        <p>
          <a
            href="https://www.dutarayamarine.com"
            target="_blank"
            rel="noopener noreferrer"
            class="website-link"
          >
            www.dutarayamarine.com
            <v-icon icon="mdi-open-in-new" size="11" />
          </a>
        </p>
        <p>
          Susun konten project yang akan ditampilkan di website Duta Raya
          Marine, lengkap dengan narasi dan galeri foto.
        </p>
      </div>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        class="text-none add-button"
        @click="openDialogAddProject"
      >
        Tambah Project
      </v-btn>
    </header>

    <!-- <section class="project-summary" aria-label="Ringkasan project website">
      <article class="summary-card summary-card--primary">
        <span class="summary-icon"><v-icon icon="mdi-briefcase-outline" size="20" /></span>
        <div><small>Total Project</small><strong>{{ projects.length }}</strong><span>Konten project tersimpan</span></div>
      </article>
      <article class="summary-card">
        <span class="summary-icon summary-icon--green"><v-icon icon="mdi-text-box-multiple-outline" size="20" /></span>
        <div><small>Total Paragraf</small><strong>{{ totalParagraphs }}</strong><span>Narasi seluruh project</span></div>
      </article>
      <article class="summary-card">
        <span class="summary-icon summary-icon--violet"><v-icon icon="mdi-image-multiple-outline" size="20" /></span>
        <div><small>Total Foto</small><strong>{{ totalPhotos }}</strong><span>Foto dalam galeri project</span></div>
      </article>
    </section> -->

    <section class="project-directory">
      <header class="directory-header">
        <div>
          <span class="section-kicker">Website Project Directory</span>
          <div class="directory-title-row">
            <h2>Daftar Project</h2>
            <span>{{ filteredProjects.length }} data</span>
          </div>
        </div>
        <label class="project-search">
          <v-icon icon="mdi-magnify" size="18" />
          <input
            v-model="data.searchProject"
            type="search"
            placeholder="Cari judul, subjudul, atau isi project..."
          />
          <button
            v-if="data.searchProject"
            type="button"
            aria-label="Hapus pencarian"
            @click="data.searchProject = ''"
          >
            <v-icon icon="mdi-close" size="16" />
          </button>
        </label>
      </header>

      <div class="project-table-wrap">
        <v-data-table
          :headers="projectHeaders"
          :items="filteredProjects"
          :loading="isLoading"
          :items-per-page="-1"
          item-value="id_project_web"
          class="project-table"
          density="comfortable"
          hide-default-footer
          hover
        >
          <template #item.no="{ index }"
            ><span class="row-number">{{ index + 1 }}</span></template
          >
          <template #item.judul="{ item }">
            <div class="project-identity">
              <span class="project-avatar">{{
                projectInitial(item.judul)
              }}</span>
              <div>
                <strong>{{ item.judul }}</strong
                ><small>{{ item.sub_judul }}</small>
              </div>
            </div>
          </template>
          <template #item.konten="{ item }">
            <div class="count-cell">
              <v-icon icon="mdi-text-long" size="15" /><span
                >{{ item.paragraf.length }} paragraf</span
              >
            </div>
          </template>
          <template #item.foto="{ item }">
            <div class="photo-cell">
              <img
                v-if="item.foto[0]"
                :src="displayPhotoUrl(item.foto[0])"
                :alt="item.foto[0].name"
              />
              <span v-else class="photo-placeholder"
                ><v-icon icon="mdi-image-off-outline" size="16"
              /></span>
              <span>{{ item.foto.length }} foto</span>
            </div>
          </template>
          <template #item.createdAt="{ item }"
            ><span class="date-cell">{{
              formatCreatedAt(item.createdAt)
            }}</span></template
          >
          <template #item.aksi="{ item }">
            <div class="table-actions">
              <!-- <button type="button" class="table-action-button table-action-button--view" title="Lihat detail project" aria-label="Lihat detail project" @click="openDetailDialog(item)">
                <v-icon icon="mdi-eye-outline" size="16" />
              </button> -->
              <button
                type="button"
                class="table-action-button table-action-button--edit"
                title="Edit project"
                aria-label="Edit project"
                @click="openDialogEditProject(item)"
              >
                <v-icon icon="mdi-pencil-outline" size="16" />
              </button>
              <button
                type="button"
                class="table-action-button table-action-button--delete"
                title="Hapus project"
                aria-label="Hapus project"
                :disabled="deletingProjectId === item.id_project_web"
                @click="deleteProject(item)"
              >
                <v-progress-circular
                  v-if="deletingProjectId === item.id_project_web"
                  indeterminate
                  size="14"
                  width="2"
                />
                <v-icon v-else icon="mdi-delete-outline" size="16" />
              </button>
            </div>
          </template>
          <template #no-data>
            <div class="empty-state">
              <span class="empty-icon"
                ><v-icon icon="mdi-briefcase-search-outline" size="30"
              /></span>
              <strong>{{
                data.searchProject
                  ? "Project tidak ditemukan"
                  : "Belum ada project"
              }}</strong>
              <p>
                {{
                  data.searchProject
                    ? "Coba gunakan kata kunci lain."
                    : "Tambahkan project pertama untuk konten website."
                }}
              </p>
            </div>
          </template>
        </v-data-table>
      </div>

      <div class="project-mobile-list">
        <div v-if="isLoading" class="mobile-loading">
          <v-skeleton-loader v-for="index in 3" :key="index" type="article" />
        </div>
        <div v-else-if="!filteredProjects.length" class="empty-state">
          <span class="empty-icon"
            ><v-icon icon="mdi-briefcase-search-outline" size="30"
          /></span>
          <strong>{{
            data.searchProject ? "Project tidak ditemukan" : "Belum ada project"
          }}</strong>
          <p>
            {{
              data.searchProject
                ? "Coba gunakan kata kunci lain."
                : "Tambahkan project pertama untuk konten website."
            }}
          </p>
        </div>
        <template v-else>
          <article
            v-for="project in filteredProjects"
            :key="project.id_project_web"
            class="project-mobile-card"
          >
            <img
              v-if="project.foto[0]"
              :src="displayPhotoUrl(project.foto[0])"
              :alt="project.foto[0].name"
              class="mobile-cover"
            />
            <div v-else class="mobile-cover mobile-cover--empty">
              <v-icon icon="mdi-image-off-outline" size="24" />
            </div>
            <div class="mobile-card-content">
              <strong>{{ project.judul }}</strong>
              <p>{{ project.sub_judul }}</p>
              <small
                >{{ project.paragraf.length }} paragraf ·
                {{ project.foto.length }} foto ·
                {{ formatCreatedAt(project.createdAt) }}</small
              >
            </div>
            <div class="mobile-actions">
              <!-- <button type="button" aria-label="Lihat detail project" @click="openDetailDialog(project)"><v-icon icon="mdi-eye-outline" size="17" /></button> -->
              <button
                type="button"
                aria-label="Edit project"
                @click="openDialogEditProject(project)"
              >
                <v-icon icon="mdi-pencil-outline" size="17" />
              </button>
              <button
                type="button"
                class="delete-action"
                aria-label="Hapus project"
                @click="deleteProject(project)"
              >
                <v-icon icon="mdi-delete-outline" size="17" />
              </button>
            </div>
          </article>
        </template>
      </div>
    </section>

    <v-dialog
      v-model="data.dialogForm"
      max-width="860"
      :fullscreen="$vuetify.display.smAndDown"
      persistent
    >
      <form class="project-dialog" @submit.prevent="saveProject">
        <header class="dialog-header">
          <div class="dialog-heading">
            <span class="dialog-icon"
              ><v-icon icon="mdi-briefcase-edit-outline" size="20"
            /></span>
            <div>
              <h2>
                {{
                  data.formMode === "add"
                    ? "Tambah Project Website"
                    : "Edit Project Website"
                }}
              </h2>
              <p>Lengkapi informasi, narasi, dan galeri project.</p>
            </div>
          </div>
          <button
            type="button"
            class="dialog-close"
            :disabled="isSaving"
            aria-label="Tutup dialog"
            @click="closeFormDialog"
          >
            <v-icon icon="mdi-close" size="20" />
          </button>
        </header>

        <div class="dialog-body">
          <section class="dialog-section">
            <div class="dialog-section-heading">
              <span>01</span>
              <div>
                <h3>Informasi Utama</h3>
                <p>Judul dan ringkasan singkat yang tampil pada website.</p>
              </div>
            </div>
            <div class="form-grid">
              <a-text-field-new
                v-model="projectForm.judul"
                label="Judul"
                placeholder="Contoh: Overhaul Main Engine"
              />
              <a-text-field-new
                v-model="projectForm.sub_judul"
                label="Subjudul"
                placeholder="Ringkasan singkat project"
              />
            </div>
          </section>

          <section class="dialog-section">
            <div class="dialog-section-heading section-heading-action">
              <span>02</span>
              <div>
                <h3>Isi Project</h3>
                <p>
                  Isi salah satu bahasa; kolom pasangannya diterjemahkan
                  otomatis.
                </p>
              </div>
              <button type="button" class="add-inline" @click="addParagraph">
                <v-icon icon="mdi-plus" size="15" /> Tambah Paragraf
              </button>
            </div>
            <div class="paragraph-list">
              <div
                v-for="(_, index) in projectForm.paragraf"
                :key="index"
                class="paragraph-item"
              >
                <span class="paragraph-number">{{ index + 1 }}</span>
                <div class="translation-fields">
                  <a-textarea-new
                    :model-value="projectForm.paragraf[index]"
                    :label="`Paragraf ${index + 1} · Bahasa Indonesia`"
                    placeholder="Tuliskan isi paragraf dalam Bahasa Indonesia"
                    rows="3"
                    :hint="
                      isTranslatingField(paragraphFieldKey(index, 'id'))
                        ? 'Menerjemahkan dari Bahasa Inggris...'
                        : ''
                    "
                    :persistent-hint="
                      isTranslatingField(paragraphFieldKey(index, 'id'))
                    "
                    @update:model-value="updateParagraph(index, 'id', $event)"
                  />
                  <a-textarea-new
                    :model-value="projectForm.paragraf_en[index]"
                    :label="`Paragraph ${index + 1} · English`"
                    placeholder="Write the paragraph in English"
                    rows="3"
                    :hint="
                      isTranslatingField(paragraphFieldKey(index, 'en'))
                        ? 'Translating from Indonesian...'
                        : ''
                    "
                    :persistent-hint="
                      isTranslatingField(paragraphFieldKey(index, 'en'))
                    "
                    @update:model-value="updateParagraph(index, 'en', $event)"
                  />
                </div>
                <button
                  type="button"
                  class="remove-item"
                  :aria-label="`Hapus paragraf ${index + 1}`"
                  @click="removeParagraph(index)"
                >
                  <v-icon icon="mdi-delete-outline" size="17" />
                </button>
              </div>
            </div>
          </section>

          <section class="dialog-section">
            <div class="dialog-section-heading">
              <span>03</span>
              <div>
                <h3>Galeri Foto</h3>
                <p>
                  Maksimal 12 foto. Geser tombol nomor untuk mengatur urutan;
                  foto pertama menjadi cover.
                </p>
              </div>
            </div>
            <label class="photo-uploader">
              <input
                type="file"
                accept="image/*"
                multiple
                @change="addPhotoFiles"
              />
              <span class="upload-icon"
                ><v-icon icon="mdi-cloud-upload-outline" size="22"
              /></span>
              <span
                ><strong>Pilih foto project</strong
                ><small>JPG, PNG, WEBP, atau format gambar lainnya</small></span
              >
            </label>

            <div v-if="photoDrafts.length" ref="photoGrid" class="photo-grid">
              <figure
                v-for="(item, index) in photoDrafts"
                :key="item.id"
                class="photo-preview"
                :class="{ 'photo-preview--new': item.kind === 'pending' }"
              >
                <img
                  :src="photoDraftUrl(item)"
                  :alt="photoDraftName(item)"
                  draggable="false"
                />
                <figcaption>{{ photoDraftName(item) }}</figcaption>
                <button
                  type="button"
                  class="photo-drag-handle"
                  :aria-label="`Geser ${photoDraftName(item)}. Posisi ${index + 1}`"
                  :title="`Geser foto posisi ${index + 1}`"
                >
                  <v-icon icon="mdi-drag" size="16" />{{ index + 1 }}
                </button>
                <span v-if="index === 0" class="cover-badge">Cover</span>
                <span v-if="item.kind === 'pending'" class="new-badge"
                  >Baru</span
                >
                <button
                  type="button"
                  class="photo-remove"
                  :aria-label="`Hapus ${photoDraftName(item)}`"
                  @click="removePhotoDraft(item)"
                >
                  <v-icon icon="mdi-close" size="14" />
                </button>
              </figure>
            </div>
          </section>

          <section class="dialog-section">
            <div class="dialog-section-heading">
              <span>04</span>
              <div>
                <h3>Paragraf Penutup</h3>
                <p>
                  Isi salah satu bahasa; kolom pasangannya diterjemahkan
                  otomatis.
                </p>
              </div>
            </div>
            <div class="translation-fields">
              <a-textarea-new
                :model-value="projectForm.paragraf_penutup"
                label="Paragraf Penutup · Bahasa Indonesia"
                placeholder="Tuliskan penutup project dalam Bahasa Indonesia"
                rows="3"
                :hint="
                  isTranslatingField(closingFieldKey('id'))
                    ? 'Menerjemahkan dari Bahasa Inggris...'
                    : ''
                "
                :persistent-hint="isTranslatingField(closingFieldKey('id'))"
                @update:model-value="updateClosingParagraph('id', $event)"
              />
              <a-textarea-new
                :model-value="projectForm.paragraf_penutup_en"
                label="Closing Paragraph · English"
                placeholder="Write the project closing paragraph in English"
                rows="3"
                :hint="
                  isTranslatingField(closingFieldKey('en'))
                    ? 'Translating from Indonesian...'
                    : ''
                "
                :persistent-hint="isTranslatingField(closingFieldKey('en'))"
                @update:model-value="updateClosingParagraph('en', $event)"
              />
            </div>
          </section>
        </div>

        <footer class="dialog-footer">
          <p v-if="isTranslating">Menerjemahkan konten project...</p>
          <p v-else-if="isSaving && pendingFiles.length">
            {{
              photoProcessingProgress
                ? `Menyiapkan foto ${photoProcessingProgress}%`
                : "Membaca dan mengompres foto..."
            }}
          </p>
          <p v-else>
            Pastikan urutan paragraf dan foto sudah sesuai sebelum disimpan.
          </p>
          <div>
            <v-btn
              variant="outlined"
              color="grey-darken-1"
              class="text-none dialog-cancel"
              :disabled="isSaving"
              @click="closeFormDialog"
              >Batal</v-btn
            >
            <v-btn
              type="submit"
              color="primary"
              variant="flat"
              prepend-icon="mdi-content-save-outline"
              class="text-none dialog-save"
              :loading="isSaving"
              :disabled="isSaving || isTranslating"
            >
              {{
                data.formMode === "add" ? "Simpan Project" : "Simpan Perubahan"
              }}
            </v-btn>
          </div>
        </footer>
      </form>
    </v-dialog>

    <v-dialog
      v-model="data.dialogDetail"
      max-width="920"
      :fullscreen="$vuetify.display.smAndDown"
    >
      <article v-if="detailProject" class="detail-dialog">
        <header class="detail-header">
          <div class="detail-header-copy">
            <span class="eyebrow">Project Detail</span>
            <h2>{{ detailProject.judul }}</h2>
            <p>{{ detailProject.sub_judul }}</p>
          </div>
          <button
            type="button"
            class="dialog-close"
            aria-label="Tutup detail"
            @click="data.dialogDetail = false"
          >
            <v-icon icon="mdi-close" size="20" />
          </button>
        </header>

        <div class="detail-body">
          <div v-if="detailProject.foto.length" class="detail-gallery">
            <a
              v-for="photo in detailProject.foto"
              :key="photo.storagePath || photo.url"
              :href="displayPhotoUrl(photo)"
              target="_blank"
              rel="noopener noreferrer"
              :title="`Buka ${photo.name}`"
            >
              <img :src="displayPhotoUrl(photo)" :alt="photo.name" /><span>{{
                photo.name
              }}</span>
            </a>
          </div>
          <div v-else class="detail-no-photo">
            <v-icon icon="mdi-image-off-outline" size="34" /><span
              >Project ini belum memiliki foto</span
            >
          </div>

          <section class="detail-content">
            <div class="detail-meta">
              <span
                ><v-icon icon="mdi-calendar-outline" size="15" />{{
                  formatCreatedAt(detailProject.createdAt)
                }}</span
              >
              <span
                ><v-icon icon="mdi-text-long" size="15" />{{
                  detailProject.paragraf.length
                }}
                paragraf</span
              >
              <span
                ><v-icon icon="mdi-image-multiple-outline" size="15" />{{
                  detailProject.foto.length
                }}
                foto</span
              >
            </div>
            <div class="detail-language-grid">
              <article class="detail-language-card" lang="id">
                <header class="detail-language-heading">
                  <span class="language-code">ID</span>
                  <div>
                    <h3>Bahasa Indonesia</h3>
                    <small>Konten utama</small>
                  </div>
                </header>
                <div class="detail-paragraphs">
                  <p
                    v-for="(paragraph, index) in detailProject.paragraf.filter(
                      Boolean,
                    )"
                    :key="`id-${index}`"
                  >
                    {{ paragraph }}
                  </p>
                </div>
                <blockquote>{{ detailProject.paragraf_penutup }}</blockquote>
              </article>

              <article
                class="detail-language-card detail-language-card--en"
                lang="en"
              >
                <header class="detail-language-heading">
                  <span class="language-code">EN</span>
                  <div>
                    <h3>English</h3>
                    <small>English content</small>
                  </div>
                </header>
                <template
                  v-if="
                    detailProject.paragraf_en.some(Boolean) ||
                    detailProject.paragraf_penutup_en
                  "
                >
                  <div class="detail-paragraphs">
                    <p
                      v-for="(
                        paragraph, index
                      ) in detailProject.paragraf_en.filter(Boolean)"
                      :key="`en-${index}`"
                    >
                      {{ paragraph }}
                    </p>
                  </div>
                  <blockquote>
                    {{ detailProject.paragraf_penutup_en }}
                  </blockquote>
                </template>
                <p v-else class="detail-language-empty">
                  Versi Bahasa Inggris belum tersedia.
                </p>
              </article>
            </div>
          </section>
        </div>

        <footer class="detail-footer">
          <v-btn
            variant="outlined"
            color="grey-darken-1"
            class="text-none"
            @click="data.dialogDetail = false"
            >Tutup</v-btn
          >
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-pencil-outline"
            class="text-none"
            @click="editDetailProject"
            >Edit Project</v-btn
          >
        </footer>
      </article>
    </v-dialog>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}
.website-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #315f8c;
  font-weight: 650;
  text-decoration: none;
}
.project-page {
  width: 100%;
  max-width: 1500px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 2px 0px 0px;
  color: #243447;
}
.back-button {
  min-height: 32px;
  margin-bottom: 8px;
  padding-inline: 7px !important;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0;
}
.project-hero,
.project-directory,
.summary-card {
  background: #fff;
  border: 1px solid #e0e5ea;
  box-shadow: 0 6px 18px rgba(34, 51, 68, 0.035);
}
.project-hero {
  display: flex;
  min-height: 118px;
  padding: 20px 22px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border-radius: 8px;
}
.project-hero-copy {
  min-width: 0;
}
.eyebrow,
.section-kicker {
  color: #587a9b;
  font-size: 8px;
  font-weight: 750;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}
.project-hero h1 {
  margin: 4px 0;
  color: #1d2937;
  font-size: 25px;
  font-weight: 750;
  letter-spacing: -0.025em;
  line-height: 1.15;
}
.project-hero p {
  max-width: 720px;
  margin: 0;
  color: #778493;
  font-size: 11px;
  line-height: 1.55;
}
.add-button {
  flex: 0 0 auto;
  min-width: 150px;
  height: 36px !important;
  font-size: 10px !important;
  font-weight: 650 !important;
  letter-spacing: 0 !important;
  border-radius: 5px !important;
}
.project-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}
.summary-card {
  display: flex;
  min-height: 96px;
  padding: 15px 17px;
  align-items: center;
  gap: 13px;
  border-radius: 7px;
}
.summary-card--primary {
  background: #f8fafc;
  border-color: #d9e2eb;
}
.summary-icon {
  display: grid;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  place-items: center;
  color: #315f8c;
  background: #eaf1f7;
  border-radius: 6px;
}
.summary-icon--green {
  color: #2c7957;
  background: #e9f5ef;
}
.summary-icon--violet {
  color: #6a5790;
  background: #f0edf7;
}
.summary-card > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.summary-card small {
  color: #737f8c;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.summary-card strong {
  margin: 2px 0 1px;
  color: #253444;
  font-size: 20px;
  font-weight: 750;
  line-height: 1.1;
}
.summary-card > div > span {
  color: #9099a3;
  font-size: 9px;
}
.project-directory {
  margin-top: 10px;
  overflow: hidden;
  border-radius: 8px;
}
.directory-header {
  display: flex;
  min-height: 72px;
  padding: 13px 18px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-bottom: 1px solid #e5e9ed;
}
.directory-title-row {
  display: flex;
  margin-top: 3px;
  align-items: center;
  gap: 8px;
}
.directory-title-row h2 {
  margin: 0;
  color: #263442;
  font-size: 15px;
  font-weight: 720;
  letter-spacing: -0.015em;
}
.directory-title-row > span {
  padding: 2px 7px;
  color: #6f7e8d;
  font-size: 8px;
  font-weight: 650;
  background: #f0f3f6;
  border-radius: 10px;
}
.project-search {
  display: flex;
  width: min(440px, 48vw);
  height: 34px;
  padding: 0 9px;
  align-items: center;
  gap: 7px;
  color: #8793a0;
  background: #f8fafb;
  border: 1px solid #d7dee5;
  border-radius: 5px;
}
.project-search:focus-within {
  background: #fff;
  border-color: #7f9fbd;
  box-shadow: 0 0 0 2px rgba(49, 95, 140, 0.08);
}
.project-search input {
  min-width: 0;
  flex: 1;
  color: #354454;
  font: inherit;
  font-size: 10px;
  background: transparent;
  border: 0;
  outline: 0;
}
.project-search input::placeholder {
  color: #9aa4ae;
}
.project-search button {
  display: grid;
  width: 23px;
  height: 23px;
  padding: 0;
  place-items: center;
  color: #7f8994;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}
.project-table-wrap {
  width: 100%;
  overflow-x: auto;
}
.project-table {
  width: 100%;
  min-width: 1010px;
}
.project-table :deep(.v-data-table__th) {
  height: 36px !important;
  padding: 0 11px !important;
  color: #687584 !important;
  font-size: 8px !important;
  font-weight: 750 !important;
  letter-spacing: 0.055em !important;
  text-transform: uppercase !important;
  background: #f5f7f9 !important;
  border-bottom-color: #dfe4e9 !important;
}
.project-table :deep(.v-data-table__td) {
  min-height: 62px !important;
  padding: 9px 11px !important;
  color: #4b5968;
  font-size: 10px;
  border-bottom-color: #e8ecef !important;
}
.project-table :deep(tbody tr:hover) {
  background: #fafcfd !important;
}
.row-number {
  display: block;
  color: #84909c;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.project-identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
}
.project-avatar {
  display: grid;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  place-items: center;
  color: #315f8c;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.04em;
  background: #edf3f8;
  border: 1px solid #dbe6ef;
  border-radius: 6px;
}
.project-identity > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.project-identity strong {
  overflow: hidden;
  color: #2d3b49;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.project-identity small {
  max-width: 290px;
  margin-top: 2px;
  overflow: hidden;
  color: #8b959f;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.count-cell,
.photo-cell {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #687685;
}
.photo-cell img,
.photo-placeholder {
  width: 35px;
  height: 28px;
  object-fit: cover;
  border-radius: 4px;
}
.photo-placeholder {
  display: grid;
  place-items: center;
  color: #9aa4ae;
  background: #edf1f4;
}
.date-cell {
  color: #687685;
  font-size: 9px;
}
.table-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.table-action-button {
  display: grid;
  width: 27px;
  height: 27px;
  padding: 0;
  place-items: center;
  color: #637181;
  background: #fff;
  border: 1px solid #dce2e7;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.15s ease;
}
.table-action-button:hover:not(:disabled) {
  transform: translateY(-1px);
}
.table-action-button--view:hover {
  color: #315f8c;
  background: #edf4fa;
  border-color: #cbdce9;
}
.table-action-button--edit:hover {
  color: #876f2d;
  background: #fbf7e9;
  border-color: #e9dfb9;
}
.table-action-button--delete:hover {
  color: #a94444;
  background: #fbefef;
  border-color: #ebcccc;
}
.table-action-button:disabled {
  opacity: 0.55;
  cursor: wait;
}
.empty-state {
  display: flex;
  min-height: 190px;
  padding: 28px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: #82909d;
  text-align: center;
}
.empty-icon {
  display: grid;
  width: 52px;
  height: 52px;
  margin-bottom: 10px;
  place-items: center;
  color: #6989a7;
  background: #eef3f7;
  border-radius: 50%;
}
.empty-state strong {
  color: #455463;
  font-size: 12px;
}
.empty-state p {
  margin: 4px 0 0;
  font-size: 9px;
}
.project-mobile-list {
  display: none;
}
.project-dialog,
.detail-dialog {
  display: flex;
  width: 100%;
  min-width: 0;
  max-height: min(92vh, 860px);
  overflow: hidden;
  flex-direction: column;
  color: #263545;
  background: #f5f6f8;
  border: 1px solid #d9dee4;
  border-radius: 9px;
  box-shadow: 0 22px 60px rgba(20, 31, 43, 0.24);
}
.dialog-header,
.detail-header {
  display: flex;
  flex: 0 0 auto;
  min-height: 66px;
  padding: 12px 16px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background: #fff;
  border-bottom: 1px solid #dfe4e8;
}
.dialog-heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}
.dialog-icon {
  display: grid;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  place-items: center;
  color: #315f8c;
  background: #edf3f8;
  border: 1px solid #dbe6ef;
  border-radius: 6px;
}
.dialog-heading h2,
.detail-header h2 {
  margin: 0;
  color: #202c38;
  font-size: 15px;
  font-weight: 730;
}
.dialog-heading p {
  margin: 2px 0 0;
  color: #818c97;
  font-size: 9px;
}
.dialog-close {
  display: grid;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  padding: 0;
  place-items: center;
  color: #75818d;
  background: transparent;
  border: 0;
  border-radius: 5px;
  cursor: pointer;
}
.dialog-close:hover:not(:disabled) {
  background: #f0f3f5;
}
.dialog-body {
  display: flex;
  min-height: 0;
  padding: 10px;
  overflow-y: auto;
  flex-direction: column;
  gap: 8px;
}
.dialog-section {
  padding: 13px;
  background: #fff;
  border: 1px solid #dfe4e8;
  border-radius: 6px;
}
.dialog-section-heading {
  display: flex;
  margin-bottom: 11px;
  align-items: flex-start;
  gap: 8px;
}
.dialog-section-heading > span {
  display: grid;
  flex: 0 0 22px;
  width: 22px;
  height: 21px;
  place-items: center;
  color: #607080;
  font-size: 8px;
  font-weight: 700;
  background: #f0f3f5;
  border: 1px solid #e0e5e9;
  border-radius: 4px;
}
.dialog-section-heading h3 {
  margin: 0;
  color: #33404e;
  font-size: 11px;
  line-height: 1.25;
}
.dialog-section-heading p {
  margin: 2px 0 0;
  color: #8b959f;
  font-size: 8px;
}
.section-heading-action > div {
  flex: 1;
}
.add-inline {
  display: inline-flex;
  min-height: 28px;
  padding: 0 8px;
  align-items: center;
  gap: 3px;
  color: #315f8c;
  font-size: 9px;
  font-weight: 650;
  background: #edf3f8;
  border: 1px solid #d7e3ed;
  border-radius: 4px;
  cursor: pointer;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.paragraph-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.paragraph-item {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 29px;
  align-items: start;
  gap: 7px;
}
.translation-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.paragraph-number {
  display: grid;
  width: 24px;
  height: 24px;
  margin-top: 5px;
  place-items: center;
  color: #6a7886;
  font-size: 8px;
  font-weight: 700;
  background: #f1f4f6;
  border-radius: 4px;
}
.remove-item {
  display: grid;
  width: 29px;
  height: 29px;
  margin-top: 3px;
  padding: 0;
  place-items: center;
  color: #9f5151;
  background: #fff6f6;
  border: 1px solid #edd6d6;
  border-radius: 4px;
  cursor: pointer;
}
.photo-uploader {
  display: flex;
  min-height: 76px;
  padding: 13px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #52677b;
  background: #f8fafc;
  border: 1px dashed #b9c9d7;
  border-radius: 6px;
  cursor: pointer;
}
.photo-uploader:hover {
  background: #f3f7fa;
  border-color: #7698b6;
}
.photo-uploader input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.upload-icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  color: #315f8c;
  background: #e7eff6;
  border-radius: 6px;
}
.photo-uploader > span:last-child {
  display: flex;
  flex-direction: column;
}
.photo-uploader strong {
  font-size: 10px;
}
.photo-uploader small {
  margin-top: 2px;
  color: #8b96a1;
  font-size: 8px;
}
.photo-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}
.photo-preview {
  position: relative;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  background: #f0f3f5;
  border: 1px solid #dce2e7;
  border-radius: 5px;
  cursor: grab;
  user-select: none;
  transition:
    border-color 0.16s,
    box-shadow 0.16s,
    transform 0.16s;
}
.photo-preview:active {
  cursor: grabbing;
}
.photo-preview img {
  display: block;
  width: 100%;
  height: 95px;
  object-fit: cover;
  pointer-events: none;
  -webkit-user-drag: none;
}
.photo-preview figcaption {
  padding: 5px 7px;
  overflow: hidden;
  color: #697786;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.photo-remove {
  position: absolute;
  top: 5px;
  right: 5px;
  display: grid;
  width: 23px;
  height: 23px;
  padding: 0;
  place-items: center;
  color: #fff;
  background: rgba(34, 45, 56, 0.72);
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}
.photo-remove:hover {
  background: rgba(150, 55, 55, 0.88);
}
.photo-drag-handle {
  position: absolute;
  top: 5px;
  left: 5px;
  display: inline-flex;
  min-width: 34px;
  height: 30px;
  padding: 0 7px;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #fff;
  font-size: 8px;
  font-weight: 750;
  background: rgba(34, 45, 56, 0.82);
  border: 0;
  border-radius: 15px;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
.photo-drag-handle:active {
  cursor: grabbing;
}
.photo-drag-handle:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
.new-badge,
.cover-badge {
  position: absolute;
  padding: 2px 5px;
  color: #fff;
  font-size: 7px;
  font-weight: 700;
  border-radius: 8px;
  pointer-events: none;
}
.new-badge {
  top: 8px;
  left: 47px;
  background: #3e8161;
}
.cover-badge {
  bottom: 27px;
  left: 6px;
  background: #315f8c;
}
.photo-sortable-ghost {
  opacity: 0.28;
}
.photo-sortable-chosen {
  border-color: #6f94b6;
  box-shadow: 0 0 0 2px rgba(49, 95, 140, 0.13);
}
.photo-sortable-drag {
  transform: rotate(1deg);
  box-shadow: 0 12px 28px rgba(26, 43, 58, 0.2);
}

@media (pointer: coarse) {
  .photo-drag-handle {
    min-width: 42px;
    height: 38px;
    padding: 0 9px;
    border-radius: 19px;
  }
  .photo-remove {
    width: 36px;
    height: 36px;
  }
  .new-badge {
    left: 55px;
  }
}
.dialog-footer,
.detail-footer {
  display: flex;
  flex: 0 0 auto;
  min-height: 58px;
  padding: 9px 14px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #fff;
  border-top: 1px solid #dfe4e8;
}
.dialog-footer p {
  margin: 0;
  color: #7d8893;
  font-size: 9px;
}
.dialog-footer > div {
  display: flex;
  gap: 7px;
}
.dialog-cancel,
.dialog-save {
  min-width: 96px;
  height: 32px !important;
  font-size: 10px !important;
  font-weight: 650 !important;
  letter-spacing: 0 !important;
  border-radius: 4px !important;
}
.dialog-save {
  min-width: 140px;
}
.detail-header {
  align-items: flex-start;
  padding: 17px 19px;
}
.detail-header-copy {
  min-width: 0;
  flex: 1 1 auto;
}
.detail-header h2 {
  max-width: 100%;
  margin-top: 4px;
  overflow-wrap: anywhere;
  word-break: break-word;
  font-size: 19px;
  line-height: 1.25;
}
.detail-header p {
  max-width: 100%;
  margin: 4px 0 0;
  overflow-wrap: anywhere;
  word-break: break-word;
  color: #788592;
  font-size: 10px;
  line-height: 1.45;
}
.detail-body {
  min-height: 0;
  padding: 12px;
  overflow-y: auto;
  flex: 1 1 auto;
}
.detail-gallery {
  display: grid;
  grid-auto-rows: 140px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.detail-gallery a {
  position: relative;
  overflow: hidden;
  background: #edf1f4;
  border-radius: 6px;
}
.detail-gallery a:first-child:nth-last-child(n + 2) {
  grid-column: span 2;
  grid-row: span 2;
}
.detail-gallery img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}
.detail-gallery a:hover img {
  transform: scale(1.025);
}
.detail-gallery span {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 22px 8px 7px;
  overflow: hidden;
  color: #fff;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: linear-gradient(transparent, rgba(15, 23, 31, 0.72));
}
.detail-no-photo {
  display: flex;
  min-height: 130px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 7px;
  color: #8c98a3;
  font-size: 9px;
  background: #edf1f4;
  border-radius: 6px;
}
.detail-content {
  margin-top: 10px;
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #e0e5e9;
  border-radius: 6px;
}
.detail-meta {
  display: flex;
  padding-bottom: 12px;
  align-items: center;
  gap: 18px;
  color: #748290;
  font-size: 9px;
  border-bottom: 1px solid #e8ecef;
}
.detail-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.detail-language-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding-top: 14px;
}
.detail-language-card {
  min-width: 0;
  padding: 14px;
  background: #fbfcfd;
  border: 1px solid #e1e7eb;
  border-radius: 6px;
}
.detail-language-card--en {
  background: #f9fbfd;
  border-color: #d9e4ed;
}
.detail-language-heading {
  display: flex;
  padding-bottom: 10px;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #e5eaee;
}
.detail-language-heading > div {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.detail-language-heading h3 {
  margin: 0;
  color: #344554;
  font-size: 11px;
}
.detail-language-heading small {
  color: #8a97a3;
  font-size: 8px;
}
.language-code {
  display: grid;
  flex: 0 0 29px;
  width: 29px;
  height: 25px;
  place-items: center;
  color: #315f8c;
  font-size: 8px;
  font-weight: 750;
  background: #e8f0f7;
  border-radius: 4px;
}
.detail-language-card--en .language-code {
  color: #396f60;
  background: #e8f3ef;
}
.detail-paragraphs {
  padding: 8px 0;
}
.detail-paragraphs p {
  margin: 12px 0;
  color: #445363;
  font-size: 11px;
  line-height: 1.8;
  white-space: pre-line;
}
.detail-content blockquote {
  margin: 12px 0 0;
  padding: 12px 14px;
  color: #3e5264;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.7;
  background: #f1f5f8;
  border-left: 3px solid #587a9b;
  border-radius: 0 5px 5px 0;
}
.detail-language-empty {
  margin: 18px 0 4px;
  color: #8a97a3;
  font-size: 10px;
  font-style: italic;
}
.detail-footer {
  justify-content: flex-end;
}

@media (max-width: 760px) {
  .project-page {
    padding: 0px 0px 0px;
  }
  .project-hero {
    min-height: 0;
    padding: 16px;
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
  }
  .project-hero h1 {
    font-size: 21px;
  }
  .add-button {
    width: 100%;
  }
  .project-summary {
    grid-template-columns: 1fr;
    gap: 7px;
  }
  .summary-card {
    min-height: 76px;
    padding: 11px 13px;
  }
  .directory-header {
    padding: 12px;
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }
  .project-search {
    width: 100%;
  }
  .project-table-wrap {
    display: none;
  }
  .project-mobile-list {
    display: block;
    padding: 8px;
  }
  .project-mobile-card {
    display: grid;
    grid-template-columns: 74px minmax(0, 1fr) auto;
    min-height: 82px;
    margin-bottom: 7px;
    overflow: hidden;
    background: #fff;
    border: 1px solid #e0e5e9;
    border-radius: 6px;
  }
  .mobile-cover {
    width: 74px;
    height: 100%;
    min-height: 82px;
    object-fit: cover;
  }
  .mobile-cover--empty {
    display: grid;
    place-items: center;
    color: #97a2ac;
    background: #edf1f4;
  }
  .mobile-card-content {
    display: flex;
    min-width: 0;
    padding: 10px;
    justify-content: center;
    flex-direction: column;
  }
  .mobile-card-content strong {
    overflow: hidden;
    color: #334252;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mobile-card-content p {
    margin: 2px 0 4px;
    overflow: hidden;
    color: #768391;
    font-size: 8px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mobile-card-content small {
    color: #929ca5;
    font-size: 7px;
  }
  .mobile-actions {
    display: flex;
    padding: 7px;
    justify-content: center;
    flex-direction: column;
    gap: 3px;
  }
  .mobile-actions button {
    display: grid;
    width: 27px;
    height: 27px;
    padding: 0;
    place-items: center;
    color: #637181;
    background: #fff;
    border: 1px solid #dce2e7;
    border-radius: 4px;
  }
  .mobile-actions .delete-action {
    color: #a14d4d;
  }
  .project-dialog,
  .detail-dialog {
    width: 100%;
    height: 100%;
    max-height: none;
    border: 0;
    border-radius: 0;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .translation-fields {
    grid-template-columns: 1fr;
  }
  .section-heading-action {
    flex-wrap: wrap;
  }
  .section-heading-action .add-inline {
    margin-left: 30px;
  }
  .photo-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .dialog-footer {
    align-items: stretch;
    flex-direction: column;
  }
  .dialog-footer p {
    display: none;
  }
  .dialog-footer > div {
    width: 100%;
  }
  .dialog-footer .v-btn {
    flex: 1;
  }
  .detail-gallery {
    grid-auto-rows: 105px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .detail-gallery a:first-child:nth-last-child(n + 2) {
    grid-column: span 2;
    grid-row: span 2;
  }
  .detail-content {
    padding: 14px;
  }
  .detail-meta {
    flex-wrap: wrap;
    gap: 8px 13px;
  }
  .detail-language-grid {
    grid-template-columns: 1fr;
  }
}
</style>
