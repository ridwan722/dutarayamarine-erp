```vue
<template>
  <div class="form-group">
    <!-- Label -->
    <label v-if="label" class="input-label">
      {{ label }}
    </label>

    <div class="input-wrapper">
      <!-- Icon kiri -->
      <svg
        v-if="iconPath"
        viewBox="0 0 24 24"
        aria-hidden="true"
        class="icon"
        :style="{
          width: iconSize + 'px',
          height: iconSize + 'px',
        }"
      >
        <g v-html="iconPath"></g>
      </svg>

      <!-- Input -->
      <input
        ref="inputRef"
        type="text"
        class="input-field"
        :class="{
          'input-error': hasError,
          'input-disabled': disabled,
        }"
        :value="formattedValue"
        :placeholder="placeholder"
        :disabled="disabled"
<<<<<<< HEAD
        :inputmode="allowDecimal ? 'decimal' : 'numeric'"
=======
        inputmode="numeric"
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
        autocomplete="off"
        @input="onInput"
        @blur="onBlur"
        @keydown="onKeyDown"
        :style="{
          fontSize: fontsize,
          paddingLeft: iconPath ? iconSize + 16 + 'px' : '8px',
          paddingRight: !disabled ? '28px' : '8px',
          width: width
            ? typeof width === 'number'
              ? width + 'px'
              : width
            : '100%',
        }"
      />

      <!-- Spinner -->
      <div v-if="!disabled" class="spinner">
        <button
          type="button"
          class="spinner-button spinner-up"
          @mousedown.prevent
          @click="increment"
          tabindex="-1"
          aria-label="Tambah"
        >
          ▲
        </button>

        <button
          type="button"
          class="spinner-button spinner-down"
          @mousedown.prevent
          @click="decrement"
          tabindex="-1"
          aria-label="Kurangi"
        >
          ▼
        </button>
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
import { ref, computed, watch } from "vue";

/* =========================
   PROPS
========================= */

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: 0,
  },

  label: {
    type: String,
    default: "",
  },

  placeholder: {
    type: String,
    default: "Masukkan angka...",
  },

  iconPath: {
    type: String,
    default: "",
  },

  iconSize: {
    type: Number,
    default: 16,
  },

  fontsize: {
    type: String,
    default: "12px",
  },

  width: {
    type: [Number, String],
    default: null,
  },

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

  hint: {
    type: String,
    default: "",
  },

  persistentHint: {
    type: Boolean,
    default: false,
  },

  min: {
    type: Number,
    default: 0,
  },

  max: {
    type: Number,
    default: Infinity,
  },

  step: {
    type: Number,
    default: 1,
  },
<<<<<<< HEAD

  allowDecimal: {
    type: Boolean,
    default: false,
  },
=======
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
});

/* =========================
   EMIT
========================= */

const emit = defineEmits(["update:modelValue"]);

/* =========================
   STATE
========================= */

const inputRef = ref(null);

const errorMessages = ref([]);
const showError = ref(false);

const rawValue = ref(props.modelValue);
<<<<<<< HEAD
const editingValue = ref(null);
=======
>>>>>>> 717d304032bc7ebad99f749429671328a324848a

/* =========================
   FORMAT NUMBER
========================= */

function formatNumber(value) {
  if (value === null || value === undefined || value === "" || isNaN(value)) {
    return "";
  }

<<<<<<< HEAD
  return Number(value).toLocaleString("id-ID", {
    maximumFractionDigits: props.allowDecimal ? 2 : 0,
  });
=======
  return Number(value).toLocaleString("id-ID");
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
}

/* =========================
   PARSE NUMBER
========================= */

function parseFormattedNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  /*
   * Hanya ambil angka.
   * Contoh:
   * 1.500 -> 1500
   * 10.000 -> 10000
   */
<<<<<<< HEAD
  const input = String(value);
  if (!props.allowDecimal) {
    return Number(input.replace(/\D/g, ""));
  }

  const normalized = input
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
=======
  return Number(String(value).replace(/\D/g, ""));
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
}

/* =========================
   DISPLAY
========================= */

const formattedValue = computed(() => {
<<<<<<< HEAD
  if (editingValue.value !== null) return editingValue.value;
=======
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
  return formatNumber(rawValue.value);
});

/* =========================
   INPUT
========================= */

function onInput(event) {
  if (props.disabled) return;

<<<<<<< HEAD
  if (props.allowDecimal) {
    editingValue.value = event.target.value;
  }

=======
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
  const numericValue = parseFormattedNumber(event.target.value);

  let value = numericValue;

  /*
   * Min
   */
  if (value < props.min) {
    value = props.min;
  }

  /*
   * Max
   */
  if (value > props.max) {
    value = props.max;
  }

  rawValue.value = value;

  emit("update:modelValue", value);

  /*
   * Reset error ketika user mengetik
   */
  errorMessages.value = [];
  showError.value = false;
}

/* =========================
   KEYBOARD
========================= */

function onKeyDown(event) {
  /*
   * Izinkan:
   * Backspace
   * Delete
   * Arrow
   * Tab
   */
  const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];

  if (allowedKeys.includes(event.key)) {
    return;
  }

  /*
   * Hanya angka
   */
<<<<<<< HEAD
  if (!/^[0-9]$/.test(event.key) && !(props.allowDecimal && event.key === ",")) {
=======
  if (!/^[0-9]$/.test(event.key)) {
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
    event.preventDefault();
  }
}

/* =========================
   BLUR
========================= */

function onBlur() {
<<<<<<< HEAD
  editingValue.value = null;
=======
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
  validate();
}

/* =========================
   INCREMENT
========================= */

function increment() {
  if (props.disabled) return;

<<<<<<< HEAD
  editingValue.value = null;

=======
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
  let value = Number(rawValue.value || 0) + props.step;

  if (value > props.max) {
    value = props.max;
  }

  rawValue.value = value;

  emit("update:modelValue", value);

  errorMessages.value = [];
  showError.value = false;

  inputRef.value?.focus();
}

/* =========================
   DECREMENT
========================= */

function decrement() {
  if (props.disabled) return;

<<<<<<< HEAD
  editingValue.value = null;

=======
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
  let value = Number(rawValue.value || 0) - props.step;

  if (value < props.min) {
    value = props.min;
  }

  rawValue.value = value;

  emit("update:modelValue", value);

  errorMessages.value = [];
  showError.value = false;

  inputRef.value?.focus();
}

/* =========================
   VALIDATE
========================= */

function validate() {
  errorMessages.value = [];

  props.rules.forEach((rule) => {
    const result = rule(rawValue.value);

    if (result !== true) {
      errorMessages.value.push(result || "Input tidak valid");
    }
  });

  showError.value = true;

  return errorMessages.value.length === 0;
}

/* =========================
   ERROR
========================= */

const hasError = computed(() => {
  return errorMessages.value.length > 0;
});

const firstErrorMessage = computed(() => {
  return hasError.value ? errorMessages.value[0] : "";
});

/* =========================
   SYNC MODEL
========================= */

watch(
  () => props.modelValue,
  (value) => {
    rawValue.value = value;
  },
);

/* =========================
   EXPOSE
========================= */

defineExpose({
  validate,

  focus: () => inputRef.value?.focus(),

  increment,

  decrement,
});
</script>

<style scoped>
/* =========================
   FORM GROUP
========================= */

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;

  width: 100%;
}

/* =========================
   LABEL
========================= */

.input-label {
  font-size: 11px;
  font-weight: 600;

  color: #495057;

  line-height: 1.2;
}

/* =========================
   INPUT WRAPPER
========================= */

.input-wrapper {
  position: relative;

  width: 100%;
}

/* =========================
   INPUT
========================= */

.input-field {
  width: 100%;
  height: 32px;

  padding: 5px 28px 5px 8px;

  font-size: 12px;
  font-family: inherit;
  line-height: 20px;

  color: #212529;
  background: #fff;

  border: 1px solid #ced4da;
  border-radius: 4px;

  outline: none;

  box-sizing: border-box;

  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out,
    background-color 0.15s ease-in-out;
}

/* =========================
   FOCUS
========================= */

.input-field:focus {
  border-color: #1976d2;

  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.08);
}

/* =========================
   HOVER
========================= */

.input-field:hover:not(:disabled) {
  border-color: #adb5bd;
}

/* =========================
   PLACEHOLDER
========================= */

.input-field::placeholder {
  color: #adb5bd;

  opacity: 1;
}

/* =========================
   DISABLED
========================= */

.input-field:disabled,
.input-field.input-disabled {
  background: #e9ecef;

  color: #6c757d;

  border-color: #ced4da;

  cursor: not-allowed;

  opacity: 1;
}

/* =========================
   ERROR
========================= */

.input-field.input-error {
  border-color: #dc3545;
}

.input-field.input-error:focus {
  border-color: #dc3545;

  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.08);
}

/* =========================
   ICON
========================= */

.icon {
  position: absolute;

  left: 8px;
  top: 50%;

  transform: translateY(-50%);

  fill: #9c9c9c;

  pointer-events: none;

  z-index: 2;
}

/* =========================
   SPINNER
========================= */

.spinner {
  position: absolute;

  right: 5px;
  top: 50%;

  transform: translateY(-50%);

  display: flex;
  flex-direction: column;

  justify-content: center;

  height: 24px;

  z-index: 2;
}

/* =========================
   SPINNER BUTTON
========================= */

.spinner-button {
  width: 18px;
  height: 11px;

  padding: 0;
  margin: 0;

  border: 0;
  background: transparent;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 7px;

  color: #6c757d;

  cursor: pointer;

  line-height: 1;

  transition: color 0.15s ease;
}

.spinner-button:hover {
  color: #1976d2;
}

.spinner-button:active {
  color: #125da5;
}

/* =========================
   HINT
========================= */

.hint-message {
  font-size: 11px;

  color: #6c757d;

  line-height: 1.3;
}

/* =========================
   ERROR MESSAGE
========================= */

.error-message {
  font-size: 11px;

  color: #dc3545;

  line-height: 1.3;
}
</style>
```
