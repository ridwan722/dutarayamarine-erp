<template>
  <div class="file-input-group">
    <!-- Label dan nama file -->
    <div class="label-section">
      <div class="label-wrapper">
        <label class="main-label">{{ label }}</label>
      </div>
    </div>

    <!-- Upload box -->
    <label class="upload-box" :class="{ disabled }">
      <v-icon icon="mdi-paperclip" size="20" class="upload-icon" />
      <span class="upload-text">{{ fileName || placeholderUpload }}</span>
      <input
        type="file"
        class="hidden-input"
        :disabled="disabled"
        @change="onFileChange"
      />
    </label>

    <!-- Progress bar (optional) -->
    <div v-if="progress > 0" class="progress-bar">
      <div class="progress" :style="{ width: progress + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  label: {
    type: String,
    default: "Nama Doc",
  },
  modelValueName: String,
  modelValueFile: File,
  placeholderName: {
    type: String,
    default: "",
  },
  placeholderUpload: {
    type: String,
    default: "Upload",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValueName", "update:modelValueFile"]);

const editMode = ref(false);
const localName = ref(props.modelValueName || "");
const fileName = ref("");
const progress = ref(0);

watch(
  () => props.modelValueName,
  (val) => {
    if (!editMode.value) localName.value = val;
  }
);

function onEditDone() {
  editMode.value = false;
  emit("update:modelValueName", localName.value);
}

function onFileChange(e) {
  const file = e.target.files[0];
  if (file) {
    fileName.value = file.name;
    emit("update:modelValueFile", file);

    // Simulasi progress upload (opsional)
    progress.value = 0;
    const interval = setInterval(() => {
      progress.value += 10;
      if (progress.value >= 100) clearInterval(interval);
    }, 80);
  }
}
</script>

<style scoped>
.file-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  width: 100%;
  font-family: system-ui, sans-serif;
}

/* Label Section */
.label-section {
  display: flex;
  flex-direction: column;
}

.label-wrapper {
  display: flex;
  align-items: center;
  gap: 3px;
}

.main-label {
  font-size: 13px;
  color: #444;
}

.edit-icon {
  color: #7a7a7a;
  cursor: pointer;
  transition: 0.2s;
}
.edit-icon:hover {
  color: #1e90ff;
}

.name-input {
  border: none;
  border-bottom: 2px solid #1e90ff;
  outline: none;
  padding: 4px 0;
  font-size: 15px;
  width: fit-content;
}

.name-display {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-top: 2px;
}

.underline {
  height: 3px;
  width: 100px;
  background: #007bff;
  border-radius: 1px;
  margin-top: 2px;
}

/* Upload Section */
.upload-box {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #c4c4c4;
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.3s;
  background-color: white;
}

.upload-box:hover {
  border-color: #007bff;
}

.upload-box.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.upload-icon {
  color: #9e9ea7;
}

.upload-text {
  color: #9e9ea7;
  font-size: 15px;
}

.hidden-input {
  display: none;
}

/* Progress Bar */
.progress-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
}
</style>
