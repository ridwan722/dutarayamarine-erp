<template>
  <div class="group">
    <label v-if="label" class="input-label">{{ label }}</label>

    <!-- Icon kiri -->
    <svg
      v-if="iconPath"
      viewBox="0 0 24 24"
      aria-hidden="true"
      class="icon"
      :style="{ width: iconSize + 'px', height: iconSize + 'px' }"
    >
      <g v-html="iconPath"></g>
    </svg>

    <!-- Input + Spinner -->
    <div class="input-wrapper">
      <input
        type="text"
        ref="inputRef"
        class="input"
        :class="{ 'input-error': hasError }"
        :value="formattedValue"
        @input="onInput"
        @blur="onBlur"
        @keypress="onKeyPress"
        :placeholder="placeholder"
        :disabled="disabled"
        :style="{
          fontSize: fontsize,
          paddingLeft: iconPath ? iconSize + 16 + 'px' : '0.5rem',
        }"
      />

      <!-- Panah naik-turun -->
      <div v-if="!disabled" class="spinner">
        <div class="spinner-up" @click="increment">▲</div>
        <div class="spinner-down" @click="decrement">▼</div>
      </div>
    </div>

    <!-- Hint -->
    <div v-if="persistentHint || (!hasError && hint)" class="hint-message">
      {{ hint }}
    </div>

    <!-- Error -->
    <div v-if="!hideDetails && hasError && showError" class="error-message">
      {{ firstErrorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineExpose, watch } from "vue";

const props = defineProps({
  modelValue: [String, Number],
  label: String,
  placeholder: {
    type: String,
    default: "Masukkan angka...",
  },
  iconPath: String,
  iconSize: {
    type: Number,
    default: 16,
  },
  fontsize: {
    type: String,
    default: "14px",
  },
  width: [Number, String],
  disabled: {
    type: Boolean,
    default: false,
  },
  rules: {
    type: Array,
    default: () => [],
  },
  hideDetails: {
    type: Boolean,
    default: false,
  },
  hint: String,
  persistentHint: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const inputRef = ref(null);
const errorMessages = ref([]);
const showError = ref(false);

// Raw number (unformatted)
const rawValue = ref(props.modelValue);

// Format angka ke format ribuan Indonesia
function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return "";
  return Number(value).toLocaleString("id-ID");
}

// Hapus karakter non-digit
function parseFormattedNumber(value) {
  return Number(String(value).replace(/\D/g, ""));
}

// Format untuk ditampilkan
const formattedValue = computed(() => formatNumber(rawValue.value));

function onInput(event) {
  const inputVal = event.target.value;
  const numericVal = parseFormattedNumber(inputVal);
  rawValue.value = numericVal;
  emit("update:modelValue", numericVal);
}

function onBlur() {
  validate();
}

function onKeyPress(e) {
  if (!/[0-9]/.test(e.key)) {
    e.preventDefault();
  }
}

function increment() {
  if (props.disabled) return;
  rawValue.value = Number(rawValue.value || 0) + 1;
  emit("update:modelValue", rawValue.value);
}

function decrement() {
  if (props.disabled) return;
  const newVal = Number(rawValue.value || 0) - 1;
  rawValue.value = newVal < 0 ? 0 : newVal;
  emit("update:modelValue", rawValue.value);
}

function validate() {
  errorMessages.value = [];
  props.rules.forEach((rule) => {
    const result = rule(rawValue.value);
    if (result !== true) {
      errorMessages.value.push(result);
    }
  });
  showError.value = true;
  return errorMessages.value.length === 0;
}

const hasError = computed(() => errorMessages.value.length > 0);
const firstErrorMessage = computed(() =>
  hasError.value ? errorMessages.value[0] : ""
);

// Sinkronisasi nilai luar
watch(
  () => props.modelValue,
  (val) => {
    rawValue.value = val;
  }
);

defineExpose({
  validate,
});
</script>

<style scoped>
.group {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  width: 100%;
}

.input-label {
  font-size: 13px;
  color: rgb(91, 91, 91);
  margin-bottom: 2px;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.input {
  width: 100%;
  border: 1px solid #c4c4c4;
  border-radius: 8px;
  background-color: #fff;
  color: #0d0c22;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  padding: 0.5rem;
  font-family: inherit;
  line-height: 1.5;
  box-sizing: border-box;
  padding-right: 2rem;
}

.input::placeholder {
  color: #9e9ea7;
}

.input:focus,
.input:hover {
  border-color: #0581ee;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(59, 174, 246, 0.1);
  outline: none;
}

.input-error {
  border-color: red !important;
}

.spinner {
  position: absolute;
  right: 0.4rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  cursor: pointer;
}

.spinner-up,
.spinner-down {
  font-size: 8px;
  color: #777;
  padding: 2px;
  line-height: 1;
  user-select: none;
}

.spinner-up:hover,
.spinner-down:hover {
  color: #0581ee;
}

.error-message {
  color: red;
  font-size: 12px;
  margin-top: 4px;
}

.hint-message {
  color: #9e9ea7;
  font-size: 12px;
  margin-top: 4px;
}

.icon {
  position: absolute;
  top: 2.6rem;
  left: 0.5rem;
  fill: #9c9c9c;
  pointer-events: none;
}
</style>
