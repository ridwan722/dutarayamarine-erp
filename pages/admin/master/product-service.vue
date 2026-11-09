<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { getAuth } from "firebase/auth";
import moment from "moment";
import type { ConfirmationDialog } from "#components";
import type {
  categoryProductServiceM,
  categoryProductServicePhotoM,
} from "~/types/category_product_service";
import type {
  productServiceM,
  productServicePhotoM,
} from "~/types/product_service";

definePageMeta({ layout: "admin" });

interface PendingPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

type TranslationLanguage = "id" | "en";

interface TranslationResponse {
  translatedText: string;
}

const MAX_PHOTOS = 8;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const TRANSLATION_DEBOUNCE_MS = 700;
const productServiceStore = useProductServiceStore();
const categoryProductServiceStore = useCategoryProductServiceStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);
const isLoading = ref(true);
const isLoadingCategory = ref(true);
const isSaving = ref(false);
const isSavingCategory = ref(false);
const deletingId = ref("");
const deletingCategoryId = ref("");
const tagInput = ref("");
const tagInputElement = ref<HTMLInputElement | null>(null);
const pendingPhotos = ref<PendingPhoto[]>([]);
const removedPhotos = ref<productServicePhotoM[]>([]);
const pendingCategoryPhotos = ref<PendingPhoto[]>([]);
const removedCategoryPhotos = ref<categoryProductServicePhotoM[]>([]);
const translatingFields = ref<Set<TranslationLanguage>>(new Set());
const translationTimers = new Map<
  TranslationLanguage,
  ReturnType<typeof setTimeout>
>();
const translationRequestVersions = new Map<TranslationLanguage, number>();
const fieldEditVersions = new Map<TranslationLanguage, number>();
let translationErrorShown = false;

const state = reactive({
  search: "",
  categoryId: "",
  dialogForm: false,
  formMode: "add" as "add" | "edit",
  dialogCategory: false,
  categoryFormMode: "add" as "add" | "edit",
});

const headers = [
  { title: "No.", value: "no", sortable: false, width: "56px" },
  {
    title: "Product / Service",
    value: "nama_product_service",
    sortable: true,
  },
  {
    title: "Kategori",
    value: "id_category_product_service",
    sortable: false,
    width: "220px",
  },
  { title: "Foto", value: "foto", sortable: false, width: "120px" },
  { title: "Dibuat", value: "createdAt", sortable: true, width: "130px" },
  {
    title: "Aksi",
    value: "aksi",
    sortable: false,
    align: "center" as const,
    width: "104px",
  },
];

function emptyProductService(): productServiceM {
  return {
    id_category_product_service: [],
    nama_product_service: "",
    description: "",
    description_en: "",
    tags: [],
    foto: [],
    createdAt: 0,
  };
}

function emptyCategory(): categoryProductServiceM {
  return {
    category_product_service: "",
    foto: [],
    createdAt: 0,
  };
}

const form = ref<productServiceM>(emptyProductService());
const categoryForm = ref<categoryProductServiceM>(emptyCategory());
const isTranslating = computed(() => translatingFields.value.size > 0);
const products = computed(() => productServiceStore.getDataProductService);
const categories = computed(
  () => categoryProductServiceStore.getDataCategoryProductService,
);
const categorizedProductCount = computed(
  () =>
    products.value.filter((item) => item.id_category_product_service.length)
      .length,
);
const totalPhotos = computed(() =>
  products.value.reduce((total, item) => total + item.foto.length, 0),
);
const filteredProducts = computed(() => {
  const query = state.search.trim().toLocaleLowerCase("id-ID");

  return [...products.value]
    .filter((item) => {
      const categoryMatches =
        !state.categoryId ||
        item.id_category_product_service.includes(state.categoryId);
      const queryMatches =
        !query ||
        [
          item.nama_product_service,
          item.description,
          item.description_en,
          item.tags.join(" "),
          productCategoryNames(item).join(" "),
        ].some((value) => value.toLocaleLowerCase("id-ID").includes(query));
      return categoryMatches && queryMatches;
    })
    .sort(
      (a, b) => createdAtSeconds(b.createdAt) - createdAtSeconds(a.createdAt),
    );
});

onMounted(async () => {
  isLoading.value = true;
  isLoadingCategory.value = true;
  const [productResult, categoryResult] = await Promise.allSettled([
    productServiceStore.tarikDataProductServiceAct(),
    categoryProductServiceStore.tarikDataCategoryProductServiceAct(),
  ]);
  if (productResult.status === "rejected") {
    console.error(
      "Gagal mengambil data product/service:",
      productResult.reason,
    );
    notificationStore.showError("Gagal mengambil data product/service");
  }
  if (categoryResult.status === "rejected") {
    console.error("Gagal mengambil data kategori:", categoryResult.reason);
    notificationStore.showError("Gagal mengambil data kategori");
  }
  isLoading.value = false;
  isLoadingCategory.value = false;
});

onBeforeUnmount(() => {
  resetTranslationState();
  resetPendingPhotos();
  resetPendingCategoryPhotos();
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

function itemInitial(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "PS";
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

function categoryName(categoryId: string) {
  return (
    categories.value.find(
      (category) => category.id_category_product_service === categoryId,
    )?.category_product_service || "Kategori tidak ditemukan"
  );
}

function productCategoryNames(item: productServiceM) {
  return item.id_category_product_service.map(categoryName);
}

function categoryUsageCount(categoryId?: string) {
  if (!categoryId) return 0;
  return products.value.filter((item) =>
    item.id_category_product_service.includes(categoryId),
  ).length;
}

function cloneProductService(item: productServiceM): productServiceM {
  return {
    ...item,
    id_category_product_service: [...item.id_category_product_service],
    tags: [...item.tags],
    foto: item.foto.map((photo) => ({ ...photo })),
  };
}

function toggleProductCategory(categoryId?: string) {
  if (!categoryId) return;
  const selectedCategories = form.value.id_category_product_service;
  const index = selectedCategories.indexOf(categoryId);
  if (index >= 0) selectedCategories.splice(index, 1);
  else selectedCategories.push(categoryId);
}

function openAddCategoryDialog() {
  resetPendingCategoryPhotos();
  state.categoryFormMode = "add";
  categoryForm.value = emptyCategory();
  state.dialogCategory = true;
}

function openEditCategoryDialog(category: categoryProductServiceM) {
  resetPendingCategoryPhotos();
  state.categoryFormMode = "edit";
  categoryForm.value = {
    ...category,
    foto: category.foto.map((photo) => ({ ...photo })),
  };
  state.dialogCategory = true;
}

function closeCategoryDialog() {
  if (isSavingCategory.value) return;
  state.dialogCategory = false;
  resetPendingCategoryPhotos();
  categoryForm.value = emptyCategory();
}

function resetPendingCategoryPhotos() {
  pendingCategoryPhotos.value.forEach((photo) =>
    URL.revokeObjectURL(photo.previewUrl),
  );
  pendingCategoryPhotos.value = [];
  removedCategoryPhotos.value = [];
}

function addCategoryPhotoFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const selectedFiles = Array.from(input.files || []);
  input.value = "";
  if (!selectedFiles.length) return;

  const validFiles = selectedFiles.filter((file) => {
    if (!file.type.startsWith("image/")) {
      notificationStore.showError(`${file.name} bukan file gambar`);
      return false;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      notificationStore.showError(`Ukuran ${file.name} melebihi 5 MB`);
      return false;
    }
    return true;
  });
  const availableSlots = Math.max(
    0,
    MAX_PHOTOS -
      categoryForm.value.foto.length -
      pendingCategoryPhotos.value.length,
  );
  if (validFiles.length > availableSlots) {
    notificationStore.showInfo(
      `Maksimal ${MAX_PHOTOS} foto untuk satu kategori`,
    );
  }

  pendingCategoryPhotos.value.push(
    ...validFiles.slice(0, availableSlots).map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    })),
  );
}

function removeExistingCategoryPhoto(photo: categoryProductServicePhotoM) {
  const index = categoryForm.value.foto.indexOf(photo);
  if (index < 0) return;
  const [removedPhoto] = categoryForm.value.foto.splice(index, 1);
  if (removedPhoto) removedCategoryPhotos.value.push(removedPhoto);
}

function removePendingCategoryPhoto(photo: PendingPhoto) {
  URL.revokeObjectURL(photo.previewUrl);
  pendingCategoryPhotos.value = pendingCategoryPhotos.value.filter(
    (item) => item.id !== photo.id,
  );
}

async function saveCategory() {
  if (isSavingCategory.value) return;
  const categoryNameValue = categoryForm.value.category_product_service
    .trim()
    .replace(/\s+/g, " ");
  if (!categoryNameValue) {
    return notificationStore.showError("Nama kategori tidak boleh kosong");
  }
  const duplicateCategory = categories.value.some(
    (category) =>
      category.id_category_product_service !==
        categoryForm.value.id_category_product_service &&
      category.category_product_service.toLocaleLowerCase("id-ID") ===
        categoryNameValue.toLocaleLowerCase("id-ID"),
  );
  if (duplicateCategory) {
    return notificationStore.showError("Nama kategori sudah digunakan");
  }

  isSavingCategory.value = true;
  try {
    const previousCategoryId = categoryForm.value.id_category_product_service;
    const payload = {
      ...categoryForm.value,
      category_product_service: categoryNameValue,
    };
    const files = pendingCategoryPhotos.value.map((photo) => photo.file);
    const saved =
      state.categoryFormMode === "add"
        ? await categoryProductServiceStore.addCategoryProductServiceAct(
            {
              ...payload,
              createdAt: moment().unix(),
              createdBy: userStore.getEmail,
            },
            files,
          )
        : await categoryProductServiceStore.updateCategoryProductServiceAct(
            {
              ...payload,
              updatedAt: moment().unix(),
              updatedBy: userStore.getEmail,
            },
            files,
            removedCategoryPhotos.value,
          );
    if (saved) {
      if (
        previousCategoryId &&
        previousCategoryId !== saved.id_category_product_service
      ) {
        if (state.categoryId === previousCategoryId) {
          state.categoryId = saved.id_category_product_service || "";
        }
        isLoading.value = true;
        try {
          await productServiceStore.tarikDataProductServiceAct();
        } finally {
          isLoading.value = false;
        }
      }
      state.dialogCategory = false;
      resetPendingCategoryPhotos();
      categoryForm.value = emptyCategory();
    }
  } finally {
    isSavingCategory.value = false;
  }
}

async function deleteCategory(category: categoryProductServiceM) {
  const id = category.id_category_product_service;
  if (!id) return notificationStore.showError("ID kategori tidak ditemukan");
  const usageCount = categoryUsageCount(id);
  if (usageCount) {
    return notificationStore.showError(
      `Kategori masih digunakan oleh ${usageCount} product/service`,
    );
  }

  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus Kategori",
    `Anda yakin ingin menghapus kategori “${category.category_product_service}”?`,
    { variant: "danger" },
  );
  if (!confirmed) return notificationStore.showInfo("Penghapusan dibatalkan");

  deletingCategoryId.value = id;
  try {
    const deleted =
      await categoryProductServiceStore.deleteCategoryProductServiceAct(id);
    if (deleted && state.categoryId === id) state.categoryId = "";
  } finally {
    deletingCategoryId.value = "";
  }
}

function addTagsFromInput() {
  const values = tagInput.value
    .split(/[,;\n]+/)
    .map((value) => value.trim().replace(/\s+/g, " "))
    .filter(Boolean);
  if (!values.length) return;

  const existingTags = new Set(
    form.value.tags.map((tag) => tag.toLocaleLowerCase("id-ID")),
  );
  let hasLongTag = false;
  values.forEach((tag) => {
    if (tag.length > 60) {
      hasLongTag = true;
      return;
    }
    const tagKey = tag.toLocaleLowerCase("id-ID");
    if (existingTags.has(tagKey)) return;
    existingTags.add(tagKey);
    form.value.tags.push(tag);
  });
  tagInput.value = "";

  if (hasLongTag) {
    notificationStore.showInfo("Panjang satu tag maksimal 60 karakter");
  }
}

function handleTagKeydown(event: KeyboardEvent) {
  if (event.isComposing) return;
  if (event.key === "Enter" || event.key === "," || event.key === ";") {
    event.preventDefault();
    addTagsFromInput();
    return;
  }
  if (event.key === "Backspace" && !tagInput.value && form.value.tags.length) {
    form.value.tags.pop();
  }
}

function removeTag(index: number) {
  form.value.tags.splice(index, 1);
  tagInputElement.value?.focus();
}

function descriptionValue(language: TranslationLanguage) {
  return language === "id" ? form.value.description : form.value.description_en;
}

function setDescription(language: TranslationLanguage, value: string) {
  if (language === "id") form.value.description = value;
  else form.value.description_en = value;
}

function isTranslatingField(language: TranslationLanguage) {
  return translatingFields.value.has(language);
}

function setFieldTranslating(
  language: TranslationLanguage,
  translating: boolean,
) {
  const next = new Set(translatingFields.value);
  if (translating) next.add(language);
  else next.delete(language);
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

async function translateText(
  text: string,
  source: TranslationLanguage,
  target: TranslationLanguage,
) {
  const token = await getAuth().currentUser?.getIdToken();
  const response = await $fetch<TranslationResponse>("/api/translate", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: { text, source, target },
  });
  const translatedText = response.translatedText?.trim();
  if (!translatedText) throw new Error("Hasil terjemahan kosong");
  return translatedText;
}

function scheduleDescriptionTranslation(
  source: TranslationLanguage,
  target: TranslationLanguage,
) {
  const existingTimer = translationTimers.get(target);
  if (existingTimer) clearTimeout(existingTimer);

  const requestVersion = (translationRequestVersions.get(target) || 0) + 1;
  translationRequestVersions.set(target, requestVersion);
  const sourceText = descriptionValue(source).trim();

  if (!sourceText) {
    translationTimers.delete(target);
    setFieldTranslating(target, false);
    setDescription(target, "");
    return;
  }

  const targetEditVersion = fieldEditVersions.get(target) || 0;
  setFieldTranslating(target, true);
  const timer = setTimeout(async () => {
    translationTimers.delete(target);
    try {
      const translatedText = await translateText(sourceText, source, target);
      const isLatestRequest =
        translationRequestVersions.get(target) === requestVersion;
      const targetWasNotEdited =
        (fieldEditVersions.get(target) || 0) === targetEditVersion;
      const sourceIsCurrent = descriptionValue(source).trim() === sourceText;

      if (isLatestRequest && targetWasNotEdited && sourceIsCurrent) {
        setDescription(target, translatedText);
        translationErrorShown = false;
      }
    } catch (error) {
      console.error("Terjemahan deskripsi gagal:", error);
      if (!translationErrorShown) {
        notificationStore.showError(
          "Terjemahan otomatis gagal. Isi deskripsi pasangan secara manual atau coba lagi.",
        );
        translationErrorShown = true;
      }
    } finally {
      if (translationRequestVersions.get(target) === requestVersion) {
        setFieldTranslating(target, false);
      }
    }
  }, TRANSLATION_DEBOUNCE_MS);

  translationTimers.set(target, timer);
}

function updateDescription(language: TranslationLanguage, event: Event) {
  const target = event.target as HTMLTextAreaElement;
  const value = target.value;
  fieldEditVersions.set(language, (fieldEditVersions.get(language) || 0) + 1);
  setDescription(language, value);
  scheduleDescriptionTranslation(language, language === "id" ? "en" : "id");
}

function translateMissingDescription() {
  if (form.value.description.trim() && !form.value.description_en.trim()) {
    scheduleDescriptionTranslation("id", "en");
  } else if (
    !form.value.description.trim() &&
    form.value.description_en.trim()
  ) {
    scheduleDescriptionTranslation("en", "id");
  }
}

function resetPendingPhotos() {
  pendingPhotos.value.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
  pendingPhotos.value = [];
  removedPhotos.value = [];
}

function openAddDialog() {
  if (!categories.value.length) {
    notificationStore.showInfo(
      "Tambahkan minimal satu kategori sebelum membuat product/service",
    );
    openAddCategoryDialog();
    return;
  }
  resetTranslationState();
  resetPendingPhotos();
  tagInput.value = "";
  state.formMode = "add";
  form.value = emptyProductService();
  state.dialogForm = true;
}

function openEditDialog(item: productServiceM) {
  resetTranslationState();
  resetPendingPhotos();
  tagInput.value = "";
  state.formMode = "edit";
  form.value = cloneProductService(item);
  state.dialogForm = true;
  translateMissingDescription();
}

function closeFormDialog() {
  if (isSaving.value) return;
  state.dialogForm = false;
  resetTranslationState();
  resetPendingPhotos();
  tagInput.value = "";
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
    if (file.size > MAX_PHOTO_SIZE) {
      notificationStore.showError(`Ukuran ${file.name} melebihi 5 MB`);
      return false;
    }
    return true;
  });
  const availableSlots = Math.max(
    0,
    MAX_PHOTOS - form.value.foto.length - pendingPhotos.value.length,
  );
  if (validFiles.length > availableSlots) {
    notificationStore.showInfo(`Maksimal ${MAX_PHOTOS} foto untuk satu item`);
  }

  pendingPhotos.value.push(
    ...validFiles.slice(0, availableSlots).map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    })),
  );
}

function removeExistingPhoto(photo: productServicePhotoM) {
  const index = form.value.foto.indexOf(photo);
  if (index < 0) return;
  const [removedPhoto] = form.value.foto.splice(index, 1);
  if (removedPhoto) removedPhotos.value.push(removedPhoto);
}

function removePendingPhoto(photo: PendingPhoto) {
  URL.revokeObjectURL(photo.previewUrl);
  pendingPhotos.value = pendingPhotos.value.filter(
    (item) => item.id !== photo.id,
  );
}

async function saveProductService() {
  if (isSaving.value) return;
  if (isTranslating.value) {
    return notificationStore.showInfo("Tunggu terjemahan otomatis selesai");
  }

  const name = form.value.nama_product_service.trim().replace(/\s+/g, " ");
  addTagsFromInput();
  const description = form.value.description.trim();
  const descriptionEn = form.value.description_en.trim();
  if (!name) {
    return notificationStore.showError(
      "Nama product/service tidak boleh kosong",
    );
  }
  const duplicateProduct = products.value.some(
    (item) =>
      item.id_product_service !== form.value.id_product_service &&
      item.nama_product_service.toLocaleLowerCase("id-ID") ===
        name.toLocaleLowerCase("id-ID"),
  );
  if (duplicateProduct) {
    return notificationStore.showError("Nama product/service sudah digunakan");
  }
  if (!form.value.id_category_product_service.length) {
    return notificationStore.showError("Pilih minimal satu kategori");
  }
  if (!description) {
    return notificationStore.showError(
      "Deskripsi Bahasa Indonesia tidak boleh kosong",
    );
  }
  if (!descriptionEn) {
    return notificationStore.showError(
      "Deskripsi Bahasa Inggris tidak boleh kosong",
    );
  }

  isSaving.value = true;
  try {
    const payload: productServiceM = {
      ...form.value,
      nama_product_service: name,
      description,
      description_en: descriptionEn,
    };
    const files = pendingPhotos.value.map((photo) => photo.file);
    const saved =
      state.formMode === "add"
        ? await productServiceStore.addProductServiceAct(
            {
              ...payload,
              createdAt: moment().unix(),
              createdBy: userStore.getEmail,
            },
            files,
          )
        : await productServiceStore.updateProductServiceAct(
            {
              ...payload,
              updatedAt: moment().unix(),
              updatedBy: userStore.getEmail,
            },
            files,
            removedPhotos.value,
          );

    if (saved) {
      state.dialogForm = false;
      resetPendingPhotos();
    }
  } finally {
    isSaving.value = false;
  }
}

async function deleteProductService(item: productServiceM) {
  if (!item.id_product_service) {
    return notificationStore.showError("ID product/service tidak ditemukan");
  }
  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus Product/Service",
    `Anda yakin ingin menghapus “${item.nama_product_service}” beserta seluruh fotonya?`,
    { variant: "danger" },
  );
  if (!confirmed) return notificationStore.showInfo("Penghapusan dibatalkan");

  deletingId.value = item.id_product_service;
  try {
    await productServiceStore.deleteProductServiceAct(item);
  } finally {
    deletingId.value = "";
  }
}
</script>

<template>
  <div class="catalog-page">
    <ConfirmationDialog ref="confirmationDialog" />

    <div class="catalog-page-heading">
      <div class="catalog-page-title">
        <v-btn
          icon="mdi-arrow-left"
          variant="text"
          color="grey-darken-3"
          size="small"
          class="catalog-back-btn"
          aria-label="Kembali"
          @click="$router.go(-1)"
        />
        <div>
          <h1>Product &amp; Service</h1>
        </div>
      </div>
    </div>

    <section class="catalog-summary" aria-label="Ringkasan product dan service">
      <article class="summary-card">
        <span class="summary-icon summary-icon--blue"
          ><v-icon icon="mdi-shape-outline" size="21"
        /></span>
        <div>
          <small>Total Kategori</small><strong>{{ categories.length }}</strong
          ><span>Kategori tersedia</span>
        </div>
      </article>

      <article class="summary-card summary-card--primary">
        <span class="summary-icon"
          ><v-icon icon="mdi-view-grid-outline" size="21"
        /></span>
        <div>
          <small>Total Product / Service</small
          ><strong>{{ products.length }}</strong
          ><span>Seluruh katalog</span>
        </div>
      </article>
    </section>

    <section class="category-management">
      <header class="category-management-header">
        <div>
          <div class="directory-title-row">
            <h2>Kategori</h2>
            <span>{{ categories.length }} kategori</span>
          </div>
          <p>
            Buat kategori terlebih dahulu, lalu pilih satu atau beberapa
            kategori saat membuat product.
          </p>
        </div>
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-plus"
          class="text-none category-add-button"
          @click="openAddCategoryDialog"
        >
          Tambah Kategori
        </v-btn>
      </header>
      <div v-if="isLoadingCategory" class="category-loading">
        <v-skeleton-loader v-for="index in 4" :key="index" type="chip" />
      </div>
      <div v-else-if="!categories.length" class="category-empty">
        <v-icon icon="mdi-shape-plus-outline" size="24" />
        <div>
          <strong>Belum ada kategori</strong
          ><span
            >Tambahkan kategori pertama sebelum membuat product/service.</span
          >
        </div>
      </div>
      <div v-else class="category-list">
        <article
          v-for="category in categories"
          :key="category.id_category_product_service"
          class="category-card"
        >
          <img
            v-if="category.foto[0]"
            class="category-card-image"
            :src="category.foto[0].url"
            :alt="category.foto[0].name"
          />
          <span v-else class="category-card-icon"
            ><v-icon icon="mdi-shape-outline" size="18"
          /></span>
          <div>
            <strong>{{ category.category_product_service }}</strong>
            <small
              >{{
                categoryUsageCount(category.id_category_product_service)
              }}
              product/service</small
            >
          </div>
          <div class="category-card-actions">
            <button
              type="button"
              title="Edit kategori"
              :aria-label="`Edit kategori ${category.category_product_service}`"
              @click="openEditCategoryDialog(category)"
            >
              <v-icon icon="mdi-pencil-outline" size="15" />
            </button>
            <button
              type="button"
              class="delete"
              title="Hapus kategori"
              :aria-label="`Hapus kategori ${category.category_product_service}`"
              :disabled="
                deletingCategoryId === category.id_category_product_service
              "
              @click="deleteCategory(category)"
            >
              <v-progress-circular
                v-if="
                  deletingCategoryId === category.id_category_product_service
                "
                indeterminate
                size="13"
                width="2"
              />
              <v-icon v-else icon="mdi-delete-outline" size="15" />
            </button>
          </div>
        </article>
      </div>
    </section>

    <section class="catalog-directory">
      <header class="directory-header">
        <div>
          <div class="directory-title-row">
            <h2>Daftar Product &amp; Service</h2>
            <span>{{ filteredProducts.length }} data</span>
          </div>
        </div>
        <div class="directory-tools">
          <label class="category-select">
            <v-icon icon="mdi-filter-variant" size="17" />
            <select v-model="state.categoryId" aria-label="Filter kategori">
              <option value="">Semua kategori</option>
              <option
                v-for="category in categories"
                :key="category.id_category_product_service"
                :value="category.id_category_product_service"
              >
                {{ category.category_product_service }}
              </option>
            </select>
          </label>
          <label class="catalog-search">
            <v-icon icon="mdi-magnify" size="18" />
            <input
              v-model="state.search"
              type="search"
              placeholder="Cari nama, deskripsi, atau tag..."
            />
            <button
              v-if="state.search"
              type="button"
              aria-label="Hapus pencarian"
              @click="state.search = ''"
            >
              <v-icon icon="mdi-close" size="16" />
            </button>
          </label>
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-plus"
            class="text-none add-button"
            @click="openAddDialog"
          >
            Tambah Item
          </v-btn>
        </div>
      </header>

      <div class="catalog-table-wrap">
        <v-data-table
          :headers="headers"
          :items="filteredProducts"
          :loading="isLoading"
          :items-per-page="-1"
          item-value="id_product_service"
          class="catalog-table"
          density="comfortable"
          hide-default-footer
          hover
        >
          <template #item.no="{ index }">
            <span class="row-number">{{ index + 1 }}</span>
          </template>
          <template #item.nama_product_service="{ item }">
            <div class="catalog-identity">
              <img
                v-if="item.foto[0]"
                :src="item.foto[0].url"
                :alt="item.foto[0].name"
              />
              <span v-else class="catalog-avatar">{{
                itemInitial(item.nama_product_service)
              }}</span>
              <div>
                <strong>{{ item.nama_product_service }}</strong>
                <small>{{ item.description }}</small>
                <div v-if="item.tags.length" class="catalog-tags">
                  <span v-for="tag in item.tags.slice(0, 3)" :key="tag">{{
                    tag
                  }}</span>
                  <span v-if="item.tags.length > 3"
                    >+{{ item.tags.length - 3 }}</span
                  >
                </div>
              </div>
            </div>
          </template>
          <template #item.id_category_product_service="{ item }">
            <div class="product-categories">
              <span
                v-for="(category, index) in productCategoryNames(item).slice(
                  0,
                  2,
                )"
                :key="`${category}-${index}`"
                class="category-badge"
                >{{ category }}</span
              >
              <span
                v-if="item.id_category_product_service.length > 2"
                class="category-more"
                >+{{ item.id_category_product_service.length - 2 }}</span
              >
              <span
                v-if="!item.id_category_product_service.length"
                class="category-missing"
                >Belum dipilih</span
              >
            </div>
          </template>
          <template #item.foto="{ item }">
            <span class="photo-count">
              <v-icon icon="mdi-image-multiple-outline" size="16" />
              {{ item.foto.length }} foto
            </span>
          </template>
          <template #item.createdAt="{ item }">
            <span class="date-cell">{{ formatCreatedAt(item.createdAt) }}</span>
          </template>
          <template #item.aksi="{ item }">
            <div class="table-actions">
              <button
                type="button"
                class="table-action table-action--edit"
                title="Edit item"
                aria-label="Edit item"
                @click="openEditDialog(item)"
              >
                <v-icon icon="mdi-pencil-outline" size="16" />
              </button>
              <button
                type="button"
                class="table-action table-action--delete"
                title="Hapus item"
                aria-label="Hapus item"
                :disabled="deletingId === item.id_product_service"
                @click="deleteProductService(item)"
              >
                <v-progress-circular
                  v-if="deletingId === item.id_product_service"
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
              <span
                ><v-icon icon="mdi-package-variant-remove" size="31"
              /></span>
              <strong>{{
                state.search || state.categoryId
                  ? "Data tidak ditemukan"
                  : "Belum ada product atau service"
              }}</strong>
              <p>
                {{
                  state.search || state.categoryId
                    ? "Coba ubah kata kunci atau filter kategori."
                    : "Tambahkan item pertama untuk mulai mengisi katalog."
                }}
              </p>
            </div>
          </template>
        </v-data-table>
      </div>

      <div class="catalog-mobile-list">
        <div v-if="isLoading" class="mobile-loading">
          <v-skeleton-loader v-for="index in 3" :key="index" type="article" />
        </div>
        <div v-else-if="!filteredProducts.length" class="empty-state">
          <span><v-icon icon="mdi-package-variant-remove" size="31" /></span>
          <strong>Data tidak ditemukan</strong>
          <p>Coba ubah kata kunci atau filter kategori.</p>
        </div>
        <article
          v-for="item in filteredProducts"
          v-else
          :key="item.id_product_service"
          class="mobile-card"
        >
          <img
            v-if="item.foto[0]"
            :src="item.foto[0].url"
            :alt="item.foto[0].name"
          />
          <span v-else class="mobile-placeholder"
            ><v-icon icon="mdi-image-outline"
          /></span>
          <div class="mobile-card-copy">
            <div class="product-categories">
              <span
                v-for="(category, index) in productCategoryNames(item).slice(
                  0,
                  2,
                )"
                :key="`${category}-${index}`"
                class="category-badge"
                >{{ category }}</span
              >
              <span
                v-if="item.id_category_product_service.length > 2"
                class="category-more"
                >+{{ item.id_category_product_service.length - 2 }}</span
              >
              <span
                v-if="!item.id_category_product_service.length"
                class="category-missing"
                >Belum dipilih</span
              >
            </div>
            <strong>{{ item.nama_product_service }}</strong>
            <p>{{ item.description }}</p>
            <div v-if="item.tags.length" class="catalog-tags mobile-tags">
              <span v-for="tag in item.tags.slice(0, 2)" :key="tag">{{
                tag
              }}</span>
              <span v-if="item.tags.length > 2"
                >+{{ item.tags.length - 2 }}</span
              >
            </div>
            <small
              >{{ item.foto.length }} foto ·
              {{ formatCreatedAt(item.createdAt) }}</small
            >
          </div>
          <div class="mobile-actions">
            <button
              type="button"
              aria-label="Edit item"
              @click="openEditDialog(item)"
            >
              <v-icon icon="mdi-pencil-outline" size="17" />
            </button>
            <button
              type="button"
              class="delete"
              aria-label="Hapus item"
              @click="deleteProductService(item)"
            >
              <v-icon icon="mdi-delete-outline" size="17" />
            </button>
          </div>
        </article>
      </div>
    </section>

    <v-dialog
      v-model="state.dialogForm"
      max-width="920"
      :fullscreen="$vuetify.display.smAndDown"
      persistent
    >
      <form class="catalog-dialog" @submit.prevent="saveProductService">
        <header class="dialog-header">
          <div class="dialog-heading">
            <span
              ><v-icon
                :icon="
                  state.formMode === 'add' ? 'mdi-plus' : 'mdi-pencil-outline'
                "
                size="20"
            /></span>
            <div>
              <h2>
                {{
                  state.formMode === "add"
                    ? "Tambah Product / Service"
                    : "Edit Product / Service"
                }}
              </h2>
              <p>Lengkapi informasi katalog dan foto pendukung.</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup dialog"
            :disabled="isSaving"
            @click="closeFormDialog"
          >
            <v-icon icon="mdi-close" size="20" />
          </button>
        </header>

        <div class="dialog-body">
          <section class="form-section">
            <div class="section-heading">
              <span>01</span>
              <div>
                <h3>Informasi Utama</h3>
                <p>Nama, jenis, dan deskripsi yang akan ditampilkan.</p>
              </div>
            </div>
            <label class="field-label">
              <span>Nama Product / Service <b>*</b></span>
              <input
                v-model="form.nama_product_service"
                type="text"
                maxlength="120"
                placeholder="Contoh: Marine Inspection"
                autofocus
              />
            </label>
            <fieldset class="category-picker">
              <legend>
                Kategori <b>*</b> <small>Bisa pilih lebih dari satu</small>
              </legend>
              <p v-if="isLoadingCategory" class="category-picker-state">
                Memuat kategori...
              </p>
              <p
                v-else-if="!categories.length"
                class="category-picker-state category-picker-state--warning"
              >
                Belum ada kategori. Tutup form product dan tambahkan kategori
                terlebih dahulu.
              </p>
              <button
                v-for="category in categories"
                v-else
                :key="category.id_category_product_service"
                type="button"
                :class="{
                  active:
                    category.id_category_product_service &&
                    form.id_category_product_service.includes(
                      category.id_category_product_service,
                    ),
                }"
                @click="
                  toggleProductCategory(category.id_category_product_service)
                "
              >
                <v-icon icon="mdi-shape-outline" size="18" />
                <span
                  ><strong>{{ category.category_product_service }}</strong
                  ><small
                    >{{
                      categoryUsageCount(category.id_category_product_service)
                    }}
                    item menggunakan kategori ini</small
                  ></span
                >
                <v-icon
                  :icon="
                    category.id_category_product_service &&
                    form.id_category_product_service.includes(
                      category.id_category_product_service,
                    )
                      ? 'mdi-checkbox-marked-circle'
                      : 'mdi-checkbox-blank-circle-outline'
                  "
                  size="18"
                />
              </button>
            </fieldset>
            <div class="tag-field">
              <span>Tag</span>
              <div class="tag-editor" @click="tagInputElement?.focus()">
                <span
                  v-for="(tag, index) in form.tags"
                  :key="`${tag}-${index}`"
                  class="tag-chip"
                >
                  {{ tag }}
                  <button
                    type="button"
                    :aria-label="`Hapus tag ${tag}`"
                    @click.stop="removeTag(index)"
                  >
                    <v-icon icon="mdi-close" size="13" />
                  </button>
                </span>
                <input
                  ref="tagInputElement"
                  v-model="tagInput"
                  type="text"
                  maxlength="300"
                  :placeholder="
                    form.tags.length
                      ? 'Tambah tag...'
                      : 'Ketik tag lalu tekan Enter'
                  "
                  aria-label="Tambahkan tag"
                  @keydown="handleTagKeydown"
                  @blur="addTagsFromInput"
                />
                <button
                  v-if="tagInput.trim()"
                  type="button"
                  class="tag-add-button"
                  aria-label="Tambahkan tag"
                  @mousedown.prevent
                  @click.stop="addTagsFromInput"
                >
                  <v-icon icon="mdi-plus" size="15" />
                </button>
              </div>
              <small>
                Tekan Enter atau koma untuk menambahkan beberapa tag. Tag dapat
                dihapus dengan tombol ×.
              </small>
            </div>
            <div class="translation-grid">
              <label
                class="field-label translation-field"
                :class="{ translating: isTranslatingField('id') }"
              >
                <span>
                  <i>ID</i> Deskripsi Bahasa Indonesia <b>*</b>
                  <em v-if="isTranslatingField('id')">
                    <v-progress-circular indeterminate size="11" width="2" />
                    Menerjemahkan
                  </em>
                </span>
                <textarea
                  :value="form.description"
                  rows="6"
                  maxlength="1500"
                  placeholder="Jelaskan product atau service dalam Bahasa Indonesia..."
                  @input="updateDescription('id', $event)"
                />
                <small>{{ form.description.length }}/1500 karakter</small>
              </label>
              <label
                class="field-label translation-field"
                :class="{ translating: isTranslatingField('en') }"
              >
                <span>
                  <i>EN</i> English Description <b>*</b>
                  <em v-if="isTranslatingField('en')">
                    <v-progress-circular indeterminate size="11" width="2" />
                    Translating
                  </em>
                </span>
                <textarea
                  :value="form.description_en"
                  rows="6"
                  maxlength="1500"
                  placeholder="Describe the product or service in English..."
                  @input="updateDescription('en', $event)"
                />
                <small>{{ form.description_en.length }}/1500 characters</small>
              </label>
            </div>
          </section>

          <section class="form-section">
            <div class="section-heading">
              <span>02</span>
              <div>
                <h3>Galeri Foto</h3>
                <p>
                  Maksimal {{ MAX_PHOTOS }} foto, masing-masing maksimal 5 MB.
                </p>
              </div>
            </div>
            <label
              v-if="form.foto.length + pendingPhotos.length < MAX_PHOTOS"
              class="photo-uploader"
            >
              <input
                type="file"
                accept="image/*"
                multiple
                @change="addPhotoFiles"
              />
              <span><v-icon icon="mdi-cloud-upload-outline" size="24" /></span>
              <div>
                <strong>Pilih foto</strong
                ><small>JPG, PNG, WEBP, atau format gambar lainnya</small>
              </div>
            </label>
            <div
              v-if="form.foto.length || pendingPhotos.length"
              class="photo-grid"
            >
              <figure
                v-for="photo in form.foto"
                :key="photo.storagePath || photo.url"
              >
                <img :src="photo.url" :alt="photo.name" />
                <figcaption>{{ photo.name }}</figcaption>
                <button
                  type="button"
                  :aria-label="`Hapus ${photo.name}`"
                  @click="removeExistingPhoto(photo)"
                >
                  <v-icon icon="mdi-close" size="15" />
                </button>
              </figure>
              <figure v-for="photo in pendingPhotos" :key="photo.id">
                <img :src="photo.previewUrl" :alt="photo.file.name" />
                <figcaption>{{ photo.file.name }} <em>baru</em></figcaption>
                <button
                  type="button"
                  :aria-label="`Hapus ${photo.file.name}`"
                  @click="removePendingPhoto(photo)"
                >
                  <v-icon icon="mdi-close" size="15" />
                </button>
              </figure>
            </div>
          </section>
        </div>

        <footer class="dialog-footer">
          <p v-if="isTranslating">
            <v-progress-circular indeterminate size="14" width="2" />
            Menerjemahkan deskripsi...
          </p>
          <p v-else>
            <v-icon icon="mdi-information-outline" size="16" /> Kolom bertanda *
            wajib diisi.
          </p>
          <div>
            <v-btn
              variant="outlined"
              color="grey-darken-1"
              class="text-none"
              :disabled="isSaving"
              @click="closeFormDialog"
              >Batal</v-btn
            >
            <v-btn
              type="submit"
              color="primary"
              variant="flat"
              prepend-icon="mdi-content-save-outline"
              class="text-none"
              :loading="isSaving"
              :disabled="isSaving || isTranslating"
            >
              {{
                state.formMode === "add" ? "Simpan Item" : "Simpan Perubahan"
              }}
            </v-btn>
          </div>
        </footer>
      </form>
    </v-dialog>

    <v-dialog v-model="state.dialogCategory" max-width="640" persistent>
      <form class="category-dialog" @submit.prevent="saveCategory">
        <header class="dialog-header">
          <div class="dialog-heading">
            <span
              ><v-icon
                :icon="
                  state.categoryFormMode === 'add'
                    ? 'mdi-shape-plus-outline'
                    : 'mdi-pencil-outline'
                "
                size="20"
            /></span>
            <div>
              <h2>
                {{
                  state.categoryFormMode === "add"
                    ? "Tambah Kategori"
                    : "Edit Kategori"
                }}
              </h2>
              <p>
                Kategori dapat dipakai oleh lebih dari satu product/service.
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup dialog kategori"
            :disabled="isSavingCategory"
            @click="closeCategoryDialog"
          >
            <v-icon icon="mdi-close" size="20" />
          </button>
        </header>
        <div class="category-dialog-body">
          <label class="field-label category-name-field">
            <span>Nama Kategori <b>*</b></span>
            <input
              v-model="categoryForm.category_product_service"
              type="text"
              maxlength="100"
              placeholder="Contoh: Marine Equipment"
              autofocus
            />
            <small
              >{{ categoryForm.category_product_service.length }}/100
              karakter</small
            >
          </label>
          <section class="category-photo-field">
            <div class="category-photo-heading">
              <div>
                <strong>Foto Kategori</strong>
                <small
                  >Maksimal {{ MAX_PHOTOS }} foto, masing-masing maksimal 5
                  MB.</small
                >
              </div>
              <span
                >{{
                  categoryForm.foto.length + pendingCategoryPhotos.length
                }}/{{ MAX_PHOTOS }}</span
              >
            </div>
            <label
              v-if="
                categoryForm.foto.length + pendingCategoryPhotos.length <
                MAX_PHOTOS
              "
              class="photo-uploader"
            >
              <input
                type="file"
                accept="image/*"
                multiple
                @change="addCategoryPhotoFiles"
              />
              <span><v-icon icon="mdi-cloud-upload-outline" size="24" /></span>
              <div>
                <strong>Pilih foto kategori</strong
                ><small>JPG, PNG, WEBP, atau format gambar lainnya</small>
              </div>
            </label>
            <div
              v-if="categoryForm.foto.length || pendingCategoryPhotos.length"
              class="photo-grid category-photo-grid"
            >
              <figure
                v-for="photo in categoryForm.foto"
                :key="photo.storagePath || photo.url"
              >
                <img :src="photo.url" :alt="photo.name" />
                <figcaption>{{ photo.name }}</figcaption>
                <button
                  type="button"
                  :aria-label="`Hapus ${photo.name}`"
                  @click="removeExistingCategoryPhoto(photo)"
                >
                  <v-icon icon="mdi-close" size="15" />
                </button>
              </figure>
              <figure v-for="photo in pendingCategoryPhotos" :key="photo.id">
                <img :src="photo.previewUrl" :alt="photo.file.name" />
                <figcaption>{{ photo.file.name }} <em>baru</em></figcaption>
                <button
                  type="button"
                  :aria-label="`Hapus ${photo.file.name}`"
                  @click="removePendingCategoryPhoto(photo)"
                >
                  <v-icon icon="mdi-close" size="15" />
                </button>
              </figure>
            </div>
          </section>
        </div>
        <footer class="dialog-footer category-dialog-footer">
          <p>
            <v-icon icon="mdi-information-outline" size="16" /> Nama kategori
            harus unik.
          </p>
          <div>
            <v-btn
              variant="outlined"
              color="grey-darken-1"
              class="text-none"
              :disabled="isSavingCategory"
              @click="closeCategoryDialog"
              >Batal</v-btn
            >
            <v-btn
              type="submit"
              color="primary"
              variant="flat"
              prepend-icon="mdi-content-save-outline"
              class="text-none"
              :loading="isSavingCategory"
              :disabled="isSavingCategory"
            >
              {{
                state.categoryFormMode === "add"
                  ? "Simpan Kategori"
                  : "Simpan Perubahan"
              }}
            </v-btn>
          </div>
        </footer>
      </form>
    </v-dialog>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}
.catalog-page {
  width: 100%;
  max-width: 1500px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 2px 0 20px;
  color: #243447;
}
.catalog-page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.catalog-page-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.catalog-page-title > div {
  min-width: 0;
}

.catalog-back-btn {
  flex: 0 0 34px;
  width: 34px !important;
  height: 34px !important;
  color: #596675 !important;
  border-radius: 55px !important;
}

.catalog-back-btn:hover {
  background: #eef2f5 !important;
}

.catalog-page-heading h1 {
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.3;
}
.catalog-hero,
.catalog-directory,
.category-management,
.summary-card {
  background: #fff;
  border: 1px solid #e0e5ea;
  box-shadow: 0 6px 18px rgba(34, 51, 68, 0.035);
}
.catalog-hero {
  display: flex;
  min-height: 78px;
  padding: 0px 22px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border-radius: 8px;
}
.eyebrow,
.section-kicker {
  color: #587a9b;
  font-size: 8px;
  font-weight: 750;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}
.catalog-hero h1 {
  margin: 4px 0;
  color: #1d2937;
  font-size: 25px;
  font-weight: 750;
  letter-spacing: -0.025em;
  line-height: 1.15;
}
.catalog-hero p {
  max-width: 720px;
  margin: 0;
  color: #778493;
  font-size: 11px;
  line-height: 1.55;
}
.add-button {
  min-width: 140px;
  height: 34px !important;
  align-self: stretch;
  font-size: 10px !important;
  font-weight: 650 !important;
  letter-spacing: 0 !important;
  border-radius: 5px !important;
}
.catalog-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}
.summary-card {
  display: flex;
  min-height: 94px;
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
  color: #665397;
  background: #f0edf7;
  border-radius: 6px;
}
.summary-icon--blue {
  color: #315f8c;
  background: #eaf1f7;
}
.summary-icon--green {
  color: #2c7957;
  background: #e9f5ef;
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
.summary-card div span {
  color: #9099a3;
  font-size: 9px;
}
.category-management {
  margin-top: 10px;
  overflow: hidden;
  border-radius: 8px;
}
.category-management-header {
  display: flex;
  min-height: 82px;
  padding: 14px 18px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-bottom: 1px solid #e5e9ed;
}
.category-management-header > div {
  min-width: 0;
}
.category-management-header p {
  margin: 4px 0 0;
  color: #8a96a1;
  font-size: 9px;
}
.category-add-button {
  flex: 0 0 auto;
  height: 34px !important;
  font-size: 9px !important;
  font-weight: 650 !important;
  letter-spacing: 0 !important;
}
.category-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 12px;
}
.category-card {
  display: flex;
  min-width: 0;
  min-height: 58px;
  padding: 9px;
  align-items: center;
  gap: 8px;
  background: #fafcfd;
  border: 1px solid #e2e8ec;
  border-radius: 6px;
}
.category-card-icon,
.category-card-image {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border-radius: 5px;
}
.category-card-icon {
  display: grid;
  place-items: center;
  color: #315f8c;
  background: #eaf1f7;
}
.category-card-image {
  object-fit: cover;
  border: 1px solid #dce5eb;
}
.category-card > div:nth-child(2) {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.category-card strong {
  overflow: hidden;
  color: #344352;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.category-card small {
  margin-top: 2px;
  color: #929ca5;
  font-size: 7px;
}
.category-card-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 3px;
}
.category-card-actions button {
  display: grid;
  width: 25px;
  height: 25px;
  padding: 0;
  place-items: center;
  color: #697784;
  background: #fff;
  border: 1px solid #dce3e8;
  border-radius: 4px;
  cursor: pointer;
}
.category-card-actions button:hover {
  color: #315f8c;
  border-color: #b9cbd9;
}
.category-card-actions button.delete:hover {
  color: #a34848;
  background: #fff5f5;
  border-color: #ebcccc;
}
.category-card-actions button:disabled {
  opacity: 0.5;
  cursor: wait;
}
.category-loading {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 12px;
}
.category-empty {
  display: flex;
  min-height: 82px;
  padding: 16px 20px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #7890a3;
}
.category-empty > div {
  display: flex;
  flex-direction: column;
}
.category-empty strong {
  color: #465868;
  font-size: 10px;
}
.category-empty span {
  margin-top: 2px;
  color: #8e9aa4;
  font-size: 8px;
}
.catalog-directory {
  margin-top: 10px;
  overflow: hidden;
  border-radius: 8px;
}
.directory-header {
  display: flex;
  min-height: 78px;
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
.directory-tools {
  display: grid;
  grid-template-columns: 175px minmax(220px, 330px) max-content;
  align-items: center;
  gap: 8px;
}
.category-select {
  display: flex;
  width: 100%;
  height: 34px;
  padding: 0 8px;
  align-items: center;
  gap: 5px;
  color: #7d8994;
  background: #f8fafb;
  border: 1px solid #d7dee5;
  border-radius: 5px;
}
.category-select select {
  min-width: 0;
  height: 100%;
  flex: 1;
  color: #526170;
  font: inherit;
  font-size: 9px;
  background: transparent;
  border: 0;
  outline: 0;
  cursor: pointer;
}
.catalog-search {
  display: flex;
  width: 100%;
  height: 34px;
  padding: 0 9px;
  align-items: center;
  gap: 7px;
  color: #8793a0;
  background: #f8fafb;
  border: 1px solid #d7dee5;
  border-radius: 5px;
}
.catalog-search:focus-within {
  background: #fff;
  border-color: #7f9fbd;
  box-shadow: 0 0 0 2px rgba(49, 95, 140, 0.08);
}
.catalog-search input {
  min-width: 0;
  flex: 1;
  color: #354454;
  font: inherit;
  font-size: 10px;
  background: transparent;
  border: 0;
  outline: 0;
}
.catalog-search input::placeholder {
  color: #9aa4ae;
}
.catalog-search button {
  display: grid;
  width: 23px;
  height: 23px;
  padding: 0;
  place-items: center;
  color: #7f8994;
  background: transparent;
  border: 0;
  cursor: pointer;
}
.catalog-table-wrap {
  width: 100%;
  overflow-x: auto;
}
.catalog-table {
  width: 100%;
  min-width: 880px;
}
.catalog-table :deep(.v-data-table__th) {
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
.catalog-table :deep(.v-data-table__td) {
  min-height: 64px !important;
  padding: 9px 11px !important;
  color: #4b5968;
  font-size: 10px;
  border-bottom-color: #e8ecef !important;
}
.catalog-table :deep(tbody tr:hover) {
  background: #fafcfd !important;
}
.row-number {
  display: block;
  color: #84909c;
  text-align: center;
}
.catalog-identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
}
.catalog-identity img,
.catalog-avatar {
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  border-radius: 6px;
}
.catalog-identity img {
  object-fit: cover;
  border: 1px solid #dfe6eb;
}
.catalog-avatar {
  display: grid;
  place-items: center;
  color: #315f8c;
  font-size: 10px;
  font-weight: 750;
  background: #edf3f8;
  border: 1px solid #dbe6ef;
}
.catalog-identity > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.catalog-identity strong {
  overflow: hidden;
  color: #2d3b49;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.catalog-identity small {
  max-width: 520px;
  margin-top: 3px;
  color: #8b959f;
  font-size: 10px;

  white-space: normal;
  word-break: break-word;
}
.catalog-tags {
  display: flex !important;
  margin-top: 4px;
  flex-flow: row wrap !important;
  gap: 3px;
}
.catalog-tags span {
  display: inline-flex;
  max-width: 105px;
  padding: 2px 5px;
  overflow: hidden;
  color: #557187;
  font-size: 7px;
  font-weight: 650;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #edf3f7;
  border-radius: 8px;
}
.product-categories {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px;
}
.category-badge {
  display: inline-flex;
  max-width: 135px;
  padding: 4px 8px;
  justify-content: center;
  overflow: hidden;
  color: #315f8c;
  font-size: 8px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #eaf1f7;
  border-radius: 20px;
}
.category-more {
  display: inline-flex;
  padding: 3px 6px;
  color: #6d7883;
  font-size: 7px;
  font-weight: 700;
  background: #eef1f3;
  border-radius: 10px;
}
.category-missing {
  color: #a05b43;
  font-size: 8px;
  font-weight: 650;
}
.photo-count {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #687685;
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
.table-action {
  display: grid;
  width: 28px;
  height: 28px;
  padding: 0;
  place-items: center;
  color: #637181;
  background: #fff;
  border: 1px solid #dce2e7;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.15s ease;
}
.table-action:hover:not(:disabled) {
  transform: translateY(-1px);
}
.table-action--edit:hover {
  color: #876f2d;
  background: #fbf7e9;
  border-color: #e9dfb9;
}
.table-action--delete:hover {
  color: #a94444;
  background: #fbefef;
  border-color: #ebcccc;
}
.table-action:disabled {
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
.empty-state > span {
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
.catalog-mobile-list {
  display: none;
}
.catalog-dialog {
  display: flex;
  width: 100%;
  max-height: min(92vh, 850px);
  overflow: hidden;
  flex-direction: column;
  color: #263545;
  background: #f5f6f8;
  border: 1px solid #d9dee4;
  border-radius: 9px;
  box-shadow: 0 22px 60px rgba(20, 31, 43, 0.24);
}
.dialog-header {
  display: flex;
  flex: 0 0 auto;
  min-height: 68px;
  padding: 12px 16px;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #dfe4e8;
}
.dialog-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dialog-heading > span {
  display: grid;
  width: 37px;
  height: 37px;
  place-items: center;
  color: #315f8c;
  background: #edf3f8;
  border-radius: 6px;
}
.dialog-heading h2 {
  margin: 0;
  color: #202c38;
  font-size: 15px;
}
.dialog-heading p {
  margin: 2px 0 0;
  color: #818c97;
  font-size: 9px;
}
.dialog-header > button {
  display: grid;
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
.dialog-header > button:hover {
  background: #f0f3f5;
}
.dialog-body {
  display: flex;
  min-height: 0;
  padding: 10px;
  overflow-y: auto;
  flex-direction: column;
  gap: 9px;
}
.form-section {
  padding: 14px;
  background: #fff;
  border: 1px solid #dfe4e8;
  border-radius: 6px;
}
.section-heading {
  display: flex;
  margin-bottom: 13px;
  align-items: flex-start;
  gap: 8px;
}
.section-heading > span {
  display: grid;
  flex: 0 0 24px;
  width: 24px;
  height: 22px;
  place-items: center;
  color: #607080;
  font-size: 8px;
  font-weight: 700;
  background: #f0f3f5;
  border-radius: 4px;
}
.section-heading h3 {
  margin: 0;
  color: #33404e;
  font-size: 11px;
}
.section-heading p {
  margin: 2px 0 0;
  color: #8b959f;
  font-size: 8px;
}
.field-label {
  display: flex;
  margin-top: 12px;
  flex-direction: column;
  gap: 5px;
}
.field-label > span,
.category-picker legend {
  color: #536170;
  font-size: 9px;
  font-weight: 650;
}
.field-label b,
.category-picker b {
  color: #b34848;
}
.field-label input,
.field-label textarea {
  width: 100%;
  padding: 9px 10px;
  color: #334353;
  font: inherit;
  font-size: 10px;
  background: #fff;
  border: 1px solid #d5dde4;
  border-radius: 5px;
  outline: 0;
  resize: vertical;
}
.field-label input:focus,
.field-label textarea:focus {
  border-color: #7899b7;
  box-shadow: 0 0 0 2px rgba(49, 95, 140, 0.08);
}
.field-label > small {
  align-self: flex-end;
  color: #96a0aa;
  font-size: 8px;
}
.translation-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.translation-field {
  min-width: 0;
}
.translation-field > span {
  display: flex;
  min-height: 18px;
  align-items: center;
  gap: 5px;
}
.translation-field i {
  display: inline-grid;
  width: 23px;
  height: 17px;
  place-items: center;
  color: #315f8c;
  font-size: 7px;
  font-style: normal;
  font-weight: 800;
  letter-spacing: 0.05em;
  background: #eaf1f7;
  border-radius: 3px;
}
.translation-field:nth-child(2) i {
  color: #6b5790;
  background: #f0edf7;
}
.translation-field em {
  display: inline-flex;
  margin-left: auto;
  align-items: center;
  gap: 4px;
  color: #6086a8;
  font-size: 7px;
  font-style: normal;
  font-weight: 600;
}
.translation-field.translating textarea {
  background: #fbfdff;
  border-color: #a9c0d4;
}
.category-picker {
  margin: 12px 0 0;
  padding: 0;
  border: 0;
}
.category-picker legend {
  grid-column: 1/-1;
  margin-bottom: 5px;
}
.category-picker legend > small {
  margin-left: 4px;
  color: #919ca6;
  font-size: 8px;
  font-weight: 500;
}
.category-picker {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.category-picker button {
  display: flex;
  min-height: 56px;
  padding: 9px 11px;
  align-items: center;
  gap: 9px;
  color: #687684;
  text-align: left;
  background: #fafbfc;
  border: 1px solid #dce2e7;
  border-radius: 6px;
  cursor: pointer;
}
.category-picker button.active {
  color: #315f8c;
  background: #f2f7fb;
  border-color: #89a8c3;
  box-shadow: inset 0 0 0 1px rgba(49, 95, 140, 0.08);
}
.category-picker button > span {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.category-picker strong {
  font-size: 10px;
}
.category-picker small {
  margin-top: 2px;
  color: #909aa4;
  font-size: 8px;
}
.category-picker-state {
  grid-column: 1/-1;
  margin: 0;
  padding: 14px;
  color: #75828e;
  font-size: 9px;
  text-align: center;
  background: #f7f9fa;
  border: 1px dashed #d6dde3;
  border-radius: 5px;
}
.category-picker-state--warning {
  color: #9a603f;
  background: #fff8f1;
  border-color: #ead7c4;
}
.tag-field {
  display: flex;
  margin-top: 12px;
  flex-direction: column;
  gap: 5px;
}
.tag-field > span {
  color: #536170;
  font-size: 9px;
  font-weight: 650;
}
.tag-field > small {
  color: #96a0aa;
  font-size: 8px;
}
.tag-editor {
  display: flex;
  min-height: 40px;
  padding: 5px 7px;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  background: #fff;
  border: 1px solid #d5dde4;
  border-radius: 5px;
  cursor: text;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.tag-editor:focus-within {
  border-color: #7899b7;
  box-shadow: 0 0 0 2px rgba(49, 95, 140, 0.08);
}
.tag-editor > input {
  min-width: 145px;
  min-height: 26px;
  padding: 0 3px;
  flex: 1;
  color: #334353;
  font: inherit;
  font-size: 10px;
  background: transparent;
  border: 0;
  outline: 0;
}
.tag-editor > input::placeholder {
  color: #a0a9b2;
}
.tag-chip {
  display: inline-flex;
  max-width: 190px;
  min-height: 25px;
  padding: 3px 4px 3px 8px;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  color: #315f8c;
  font-size: 9px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #eaf1f7;
  border: 1px solid #d6e3ed;
  border-radius: 13px;
}
.tag-chip > button {
  display: grid;
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  padding: 0;
  place-items: center;
  color: #6d879d;
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}
.tag-chip > button:hover {
  color: #9f4848;
  background: #fff;
}
.tag-add-button {
  display: grid;
  flex: 0 0 25px;
  width: 25px;
  height: 25px;
  padding: 0;
  place-items: center;
  color: #315f8c;
  background: #edf3f8;
  border: 0;
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
.photo-uploader > span {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  color: #315f8c;
  background: #e7eff6;
  border-radius: 6px;
}
.photo-uploader > div {
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
.photo-grid figure {
  position: relative;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  background: #f4f6f8;
  border: 1px solid #dfe5e9;
  border-radius: 6px;
}
.photo-grid img {
  display: block;
  width: 100%;
  height: 96px;
  object-fit: cover;
}
.photo-grid figcaption {
  padding: 6px;
  overflow: hidden;
  color: #63707d;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.photo-grid em {
  margin-left: 3px;
  padding: 1px 4px;
  color: #287353;
  font-style: normal;
  background: #e8f4ee;
  border-radius: 8px;
}
.photo-grid button {
  position: absolute;
  top: 5px;
  right: 5px;
  display: grid;
  width: 23px;
  height: 23px;
  padding: 0;
  place-items: center;
  color: #fff;
  background: rgba(25, 35, 45, 0.72);
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}
.dialog-footer {
  display: flex;
  flex: 0 0 auto;
  min-height: 64px;
  padding: 11px 16px;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  background: #fff;
  border-top: 1px solid #dfe4e8;
}
.dialog-footer p {
  display: flex;
  margin: 0;
  align-items: center;
  gap: 5px;
  color: #89949e;
  font-size: 8px;
}
.dialog-footer > div {
  display: flex;
  gap: 8px;
}
.dialog-footer :deep(.v-btn) {
  min-width: 112px;
  height: 34px !important;
  font-size: 9px !important;
  letter-spacing: 0 !important;
}
.category-dialog {
  display: flex;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  flex-direction: column;
  color: #263545;
  background: #f5f6f8;
  border: 1px solid #d9dee4;
  border-radius: 9px;
  box-shadow: 0 22px 60px rgba(20, 31, 43, 0.24);
}
.category-dialog-body {
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
  background: #f5f6f8;
}
.category-name-field {
  margin-top: 0;
  padding: 14px;
  background: #fff;
  border: 1px solid #dfe4e8;
  border-radius: 6px;
}
.category-photo-field {
  margin-top: 10px;
  padding: 14px;
  background: #fff;
  border: 1px solid #dfe4e8;
  border-radius: 6px;
}
.category-photo-heading {
  display: flex;
  margin-bottom: 10px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.category-photo-heading > div {
  display: flex;
  flex-direction: column;
}
.category-photo-heading strong {
  color: #536170;
  font-size: 9px;
}
.category-photo-heading small {
  margin-top: 2px;
  color: #929ca5;
  font-size: 8px;
}
.category-photo-heading > span {
  padding: 3px 7px;
  color: #607486;
  font-size: 8px;
  font-weight: 700;
  background: #eef3f7;
  border-radius: 10px;
}
.category-photo-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.category-dialog-footer {
  min-height: 62px;
}
@media (max-width: 1100px) {
  .category-list,
  .category-loading {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 960px) {
  .directory-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .directory-tools {
    width: 100%;
    grid-template-columns: 175px minmax(0, 1fr) max-content;
  }
}
@media (max-width: 700px) {
  .catalog-page {
    padding-top: 0;
  }
  .catalog-hero {
    padding: 17px;
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }
  .catalog-hero h1 {
    font-size: 22px;
  }
  .add-button {
    width: 100%;
  }
  .catalog-summary {
    grid-template-columns: 1fr;
  }
  .summary-card {
    min-height: 78px;
  }
  .category-management-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .category-add-button {
    width: 100%;
  }
  .category-list,
  .category-loading {
    grid-template-columns: 1fr;
  }
  .directory-tools {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
  .category-select,
  .catalog-search {
    width: 100%;
  }
  .catalog-table-wrap {
    display: none;
  }
  .catalog-mobile-list {
    display: flex;
    padding: 10px;
    flex-direction: column;
    gap: 8px;
  }
  .mobile-loading {
    display: grid;
    gap: 8px;
  }
  .mobile-card {
    display: flex;
    min-width: 0;
    padding: 10px;
    gap: 10px;
    background: #fff;
    border: 1px solid #e2e7eb;
    border-radius: 7px;
  }
  .mobile-card > img,
  .mobile-placeholder {
    flex: 0 0 72px;
    width: 72px;
    height: 72px;
    border-radius: 6px;
  }
  .mobile-card > img {
    object-fit: cover;
  }
  .mobile-placeholder {
    display: grid;
    place-items: center;
    color: #8797a5;
    background: #edf2f5;
  }
  .mobile-card-copy {
    display: flex;
    min-width: 0;
    flex: 1;
    align-items: flex-start;
    flex-direction: column;
  }
  .mobile-card-copy strong {
    max-width: 100%;
    margin-top: 5px;
    overflow: hidden;
    color: #344352;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mobile-card-copy p {
    display: -webkit-box;
    max-width: 100%;
    margin: 3px 0;
    color: #84909b;
    font-size: 8px;
    line-height: 1.45;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
  .mobile-card-copy small {
    margin-top: auto;
    color: #98a1aa;
    font-size: 8px;
    
  }
  .mobile-actions {
    display: flex;
    align-items: flex-start;
    gap: 3px;
  }
  .mobile-actions button {
    display: grid;
    width: 27px;
    height: 27px;
    padding: 0;
    place-items: center;
    color: #6d7883;
    background: #f8fafb;
    border: 1px solid #e0e5e9;
    border-radius: 4px;
  }
  .mobile-actions .delete {
    color: #a34c4c;
  }
  .catalog-dialog {
    height: 100%;
    max-height: none;
    border: 0;
    border-radius: 0;
  }
  .translation-grid {
    grid-template-columns: 1fr;
  }
  .photo-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .dialog-footer {
    align-items: stretch;
    flex-direction: column;
  }
  .dialog-footer > div {
    display: grid;
    grid-template-columns: 1fr 1.35fr;
  }
  .dialog-footer :deep(.v-btn) {
    min-width: 0;
  }
}
@media (max-width: 420px) {
  .mobile-card > img,
  .mobile-placeholder {
    flex-basis: 58px;
    width: 58px;
    height: 58px;
  }
  .mobile-actions {
    flex-direction: column;
  }
  .category-picker {
    grid-template-columns: 1fr;
  }
  .photo-grid img {
    height: 82px;
  }
}
</style>
