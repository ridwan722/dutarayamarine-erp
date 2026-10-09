<template>
  <div class="date-wrapper">
    <label v-if="label" class="date-label">{{ label }}</label>

    <div class="date-input-wrapper" @click="openPicker">
      <input
        ref="dateInput"
        type="date"
        class="date-input"
        v-model="model"
        :placeholder="placeholder"
        :style="{ '--input-height': height }"
        @keydown.prevent
      />
      <!-- Icon kalender custom -->
      <svg class="calendar-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7 10h10M7 14h5M16 2v2M8 2v2M3 6h18M5 6v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  modelValue: String,
  label: String,
  placeholder: {
    type: String,
    default: "",
  },
  height: {
    type: String,
    default: "40px",
  },
});

const emit = defineEmits(["update:modelValue"]);
const model = defineModel("modelValue");

const dateInput = ref(null);

function openPicker() {
  if (dateInput.value) {
    // Chromium browsers
    if (typeof dateInput.value.showPicker === "function") {
      dateInput.value.showPicker();
    } else {
      // fallback untuk browser lain
      dateInput.value.focus();
      dateInput.value.click();
    }
  }
}
</script>

<style scoped>
.date-wrapper {
  width: 100%;
  position: relative;
}

.date-label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: rgb(65, 65, 65);
}

.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer;
}

.date-input {
  width: 100%;
  height: var(--input-height, 40px);
  padding: 10px 36px 10px 12px;
  border: solid 1px #c4c4c4;
  border-radius: 8px;
  font-size: 14px;
  color: #353535;
  outline: none;
  transition: border 0.3s;
  background: white;
  cursor: pointer;
}

/* Fokus style */
.date-input:focus {
  border-color: #0581ee;
  box-shadow: 0 0 0 3px rgba(59, 246, 109, 0.1);
}

/* Sembunyikan ikon kalender default */
.date-input::-webkit-calendar-picker-indicator {
  opacity: 0;
  position: absolute;
  right: 0;
  width: 40px;
  height: 100%;
  cursor: pointer;
}

/* Ikon SVG custom */
.calendar-icon {
  position: absolute;
  right: 10px;
  width: 20px;
  height: 20px;
  fill: none;
  stroke: #6b7280;
  pointer-events: none; /* biar klik tetap ke wrapper */
}
</style>
