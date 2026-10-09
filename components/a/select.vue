<template>
  <div
    class="select-wrapper"
    :style="{
      // Atur lebar menggunakan prop, default ke 100% jika tidak ada
      width: typeof width === 'number' ? width + 'px' : width || '100%',
    }"
  >
    <label v-if="label" class="select-label">{{ label }}</label>

    <div class="select-container">
      <svg
        v-if="iconPath"
        viewBox="0 0 24 24"
        aria-hidden="true"
        class="select-icon"
        :style="{ width: iconSize + 'px', height: iconSize + 'px' }"
      >
        <g v-html="iconPath"></g>
      </svg>

      <select
        class="select-input"
        v-model="internalValue"
        :style="{
          // Tinggi menggunakan prop
          height: height + 'px',
          // Font size menggunakan prop
          fontSize: fontsize,
          // Sesuaikan padding kiri jika ada icon
          paddingLeft: iconPath ? iconSize + 16 + 'px' : '0.75rem',
        }"
      >
        <option disabled value="" hidden>{{ placeholder }}</option>

        <option
          v-for="(item, index) in normalizedItems"
          :key="index"
          :value="item[itemValue]"
          :disabled="item.isInfo"
          :class="{ 'info-option': item.isInfo }"
        >
          {{ item[itemTitle] }}
        </option>
      </select>

      <svg class="arrow-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7 10l5 5 5-5"
          fill="none"
          stroke="#6b7280"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  modelValue: [String, Number],
  label: String,
  placeholder: {
    type: String,
    default: "Pilih",
  },
  iconPath: String,
  iconSize: {
    type: Number,
    default: 16,
  },
  height: {
    type: Number,
    default: 40,
  },
  fontsize: {
    type: String,
    default: "14px",
  },
  width: [Number, String],
  items: {
    type: Array,
    default: () => [],
  },
  itemTitle: {
    type: String,
    default: "label",
  },
  itemValue: {
    type: String,
    default: "value",
  },
});

const emit = defineEmits(["update:modelValue"]);

const internalValue = ref(props.modelValue ?? "");

// Sinkronisasi dua arah (modelValue -> internalValue)
watch(
  () => props.modelValue,
  (val) => {
    if (val !== internalValue.value) internalValue.value = val;
  }
);

// Emit update (internalValue -> modelValue)
watch(internalValue, (val) => {
  emit("update:modelValue", val);
});

// Normalisasi items: Mengubah string array menjadi objek jika diperlukan
const normalizedItems = computed(() =>
  props.items.map((item) =>
    typeof item === "string"
      ? { [props.itemTitle]: item, [props.itemValue]: item }
      : item
  )
);
</script>

<style scoped>
/* Penggunaan unit relatif (rem) untuk responsivitas */

.select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem; /* 4px */
  width: 100%; /* Default width full */
}

.select-label {
  font-size: 0.8125rem; /* 13px */
  color: rgb(65, 65, 65);
}

.select-container {
  position: relative;
  display: flex;
  align-items: center;
}

.select-icon {
  position: absolute;
  left: 0.75rem; /* 12px */
  top: 50%;
  transform: translateY(-50%);
  fill: #9ca3af;
  pointer-events: none;
}

.arrow-icon {
  position: absolute;
  right: 0.75rem; /* 12px */
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem; /* 20px */
  height: 1.25rem; /* 20px */
  pointer-events: none;
}

.select-input {
  width: 100%;
  appearance: none;
  border: 1px solid #c4c4c4;
  border-radius: 0.5rem; /* 8px */
  background-color: #fff;
  color: #454545;
  padding-right: 2.5rem; /* 40px */
  transition: 0.2s ease;
  outline: none;
  cursor: pointer;
}

.select-input:focus,
.select-input:hover {
  border-color: #0581ee;
  box-shadow: 0 0 0 3px rgba(5, 129, 238, 0.1);
}

.info-option {
  font-style: italic;
  color: #09ff84;
  background-color: #f9fafb;
}

/* 📱 Media Query: Penyesuaian untuk Layar Kecil (Mobile) */
@media (max-width: 640px) {
  .select-label {
    font-size: 0.875rem; /* Sedikit lebih besar untuk mobile */
  }

  .select-input {
    /* Pastikan tinggi minimal untuk kemudahan sentuh */
    min-height: 2.5rem; /* 40px */
    /* Sesuaikan padding untuk ruang yang lebih sempit */
    padding-right: 2rem; 
  }
  
  .select-icon {
      left: 0.5rem; /* Kurangi sedikit padding icon */
  }
  
  .arrow-icon {
      right: 0.5rem; /* Kurangi sedikit padding arrow */
  }
}
</style>