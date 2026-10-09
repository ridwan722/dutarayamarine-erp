<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { uploadStore } from "@/stores/uploadStore";

const props = defineProps({
  label: {
    type: String,
    default: "Upload Foto",
  },
  typefolder: {
    type: String,
    default: "general",
  },
  no_do:{
    type:String,
    default:"-",
  }
});


const useuploadStore = uploadStore();
const fileInput = ref<any>(null);
const fileValue = ref(null); // 🔹 v-model untuk file input

onMounted(() => {
  useuploadStore.setReset();
});

async function uploadPicture() {
  await useuploadStore.simpanFileAction(props.typefolder);
}

function onfilepicked(event: any) {
  const file = event.target.files[0];
  if (!file) return;
  const originalname = file.name
  const filename = originalname.replace(/\s+/g, "_").toLowerCase();
  useuploadStore.setnameFile(filename);
  useuploadStore.setfile(file);
  useuploadStore.setTypeFile(file.type);
  uploadPicture();
}

const progress = computed(() => useuploadStore.getprogressUpload);

// 🔹 Kosongkan input dan nama file ketika progress = 0
watch(progress, (val) => {
  if (val === 0) {
    fileValue.value = null; // hapus nama file di UI
    if (fileInput.value) {
      fileInput.value.reset(); // reset field juga
    }
  }
});
</script>

<template>
  <v-file-input
    ref="fileInput"
    v-model="fileValue"
    :label="props.label"
    
    variant="outlined"
    density="compact"
    style="cursor: pointer"
    rounded="lg"
    @change="onfilepicked"
  />

  <v-progress-linear
    color="#0880F6"
    style="margin-top: -16px"
    class="mb-4"
    :model-value="progress"
    :height="10"
  />
</template>
