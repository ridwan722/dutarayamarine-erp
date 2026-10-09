```vue id="51827d"
<template>
  <div class="form-group">
    <!-- Label -->
    <label v-if="label" class="input-label">
      {{ label }}
    </label>

    <!-- Date Input -->
    <div
      class="date-input-wrapper"
      :class="{
        'input-error-wrapper': hasError,
      }"
      @click="openPicker"
    >
      <input
        ref="dateInput"
        type="date"
        class="input-field date-input"
        :class="{
          'input-error': hasError,
          'input-disabled': disabled,
        }"
        :value="modelValue"
        :disabled="disabled"
        :min="min"
        :max="max"
        @input="onInput"
        @blur="validate"
        @keydown.prevent
      />

      <!-- Custom Calendar Icon -->
      <svg
        class="calendar-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M7 10h10
             M7 14h5
             M16 2v2
             M8 2v2
             M3 6h18
             M5 6v14
             a2 2 0 0 0 2 2
             h10
             a2 2 0 0 0 2-2
             V6"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <!-- Hint -->
    <div
      v-if="persistentHint || (!hasError && hint)"
      class="hint-message"
    >
      {{ hint }}
    </div>

    <!-- Error -->
    <div
      v-if="!hideDetails && hasError && showError"
      class="error-message"
    >
      {{ firstErrorMessage }}
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
} from "vue";

/* =========================
   PROPS
========================= */

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },

  label: {
    type: String,
    default: "",
  },

  placeholder: {
    type: String,
    default: "",
  },

  height: {
    type: [String, Number],
    default: "32px",
  },

  disabled: {
    type: Boolean,
    default: false,
  },

  min: {
    type: String,
    default: "",
  },

  max: {
    type: String,
    default: "",
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
});

/* =========================
   EMIT
========================= */

const emit = defineEmits([
  "update:modelValue",
]);

/* =========================
   STATE
========================= */

const dateInput = ref(null);

const errorMessages = ref([]);
const showError = ref(false);

/* =========================
   INPUT
========================= */

function onInput(event) {
  if (props.disabled) return;

  emit(
    "update:modelValue",
    event.target.value
  );

  /*
   * Reset error ketika tanggal berubah
   */
  errorMessages.value = [];
  showError.value = false;
}

/* =========================
   OPEN PICKER
========================= */

function openPicker() {
  if (props.disabled) return;

  if (!dateInput.value) return;

  /*
   * Chromium / Chrome / Edge
   */
  if (
    typeof dateInput.value.showPicker ===
    "function"
  ) {
    try {
      dateInput.value.showPicker();
      return;
    } catch (error) {
      // fallback
    }
  }

  /*
   * Browser fallback
   */
  dateInput.value.focus();
  dateInput.value.click();
}

/* =========================
   VALIDATE
========================= */

function validate() {
  errorMessages.value = [];

  props.rules.forEach((rule) => {
    const result =
      rule(props.modelValue);

    if (result !== true) {
      errorMessages.value.push(
        result ||
          "Tanggal tidak valid"
      );
    }
  });

  showError.value = true;

  return (
    errorMessages.value.length === 0
  );
}

/* =========================
   ERROR
========================= */

const hasError = computed(() => {
  return (
    errorMessages.value.length > 0
  );
});

const firstErrorMessage =
  computed(() => {
    return hasError.value
      ? errorMessages.value[0]
      : "";
  });

/* =========================
   EXPOSE
========================= */

defineExpose({
  validate,

  focus: () =>
    dateInput.value?.focus(),

  openPicker,
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
   DATE WRAPPER
========================= */

.date-input-wrapper {
  position: relative;

  width: 100%;
}

/* =========================
   INPUT
========================= */

.date-input {
  width: 100%;
  height: v-bind(height);

  padding: 5px 34px 5px 8px;

  font-size: 12px;
  font-family: inherit;

  color: #212529;
  background: #fff;

  border: 1px solid #ced4da;
  border-radius: 4px;

  outline: none;

  box-sizing: border-box;

  cursor: pointer;

  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out,
    background-color 0.15s ease-in-out;
}

/* =========================
   HOVER
========================= */

.date-input:hover:not(:disabled) {
  border-color: #adb5bd;
}

/* =========================
   FOCUS
========================= */

.date-input:focus {
  border-color: #1976d2;

  box-shadow:
    0 0 0 2px
    rgba(25, 118, 210, 0.08);
}

/* =========================
   DISABLED
========================= */

.date-input:disabled,
.date-input.input-disabled {
  background: #e9ecef;

  color: #6c757d;

  border-color: #ced4da;

  cursor: not-allowed;

  opacity: 1;
}

/* =========================
   ERROR
========================= */

.date-input.input-error {
  border-color: #dc3545;
}

.date-input.input-error:focus {
  border-color: #dc3545;

  box-shadow:
    0 0 0 2px
    rgba(220, 53, 69, 0.08);
}

/* =========================
   DEFAULT CALENDAR ICON
========================= */

.date-input::-webkit-calendar-picker-indicator {
  opacity: 0;

  position: absolute;

  right: 0;

  width: 32px;
  height: 100%;

  cursor: pointer;
}

/* =========================
   CUSTOM CALENDAR ICON
========================= */

.calendar-icon {
  position: absolute;

  right: 9px;
  top: 50%;

  width: 16px;
  height: 16px;

  transform: translateY(-50%);

  color: #6c757d;

  pointer-events: none;

  transition: color 0.15s ease;
}

.date-input-wrapper:hover
.calendar-icon {
  color: #1976d2;
}

.date-input:disabled
+ .calendar-icon {
  color: #adb5bd;
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
