```vue
<template>
  <div class="form-group">
    <label v-if="label" class="input-label">
      {{ label }}
    </label>

    <div class="input-wrapper">
      <textarea
        ref="inputRef"
        class="input-field textarea-field"
        :class="{
          'input-error': hasError,
          'input-disabled': disabled,
        }"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :rows="rows"
        :maxlength="maxlength"
        @input="onInput"
        @blur="validate"
      ></textarea>
    </div>

    <div
      v-if="persistentHint || (!hasError && hint)"
      class="hint-message"
    >
      {{ hint }}
    </div>

    <div
      v-if="!hideDetails && hasError && showError"
      class="error-message"
    >
      {{ firstErrorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from "vue";

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },

  label: {
    type: String,
    default: "",
  },

  placeholder: {
    type: String,
    default: "Isi...",
  },

  disabled: {
    type: Boolean,
    default: false,
  },

  rows: {
    type: Number,
    default: 3,
  },

  maxlength: {
    type: [Number, String],
    default: null,
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

const emit = defineEmits(["update:modelValue"]);

const inputRef = ref(null);
const errorMessages = ref([]);
const showError = ref(false);

function resizeTextarea() {
  const textarea = inputRef.value;

  if (!textarea) return;

  // Reset dulu
  textarea.style.height = "48px";

  // Kalau isi lebih tinggi dari 2 baris, ikuti isi
  textarea.style.height = `${Math.max(48, textarea.scrollHeight)}px`;
}

function onInput(event) {
  if (props.disabled) return;

  emit("update:modelValue", event.target.value);

  errorMessages.value = [];
  showError.value = false;

  nextTick(() => {
    resizeTextarea();
  });
}

function validate() {
  errorMessages.value = [];

  props.rules.forEach((rule) => {
    const result = rule(props.modelValue);

    if (result !== true) {
      errorMessages.value.push(
        result || "Input tidak valid"
      );
    }
  });

  showError.value = true;

  return errorMessages.value.length === 0;
}

const hasError = computed(() => {
  return errorMessages.value.length > 0;
});

const firstErrorMessage = computed(() => {
  return hasError.value
    ? errorMessages.value[0]
    : "";
});

onMounted(() => {
  nextTick(() => {
    resizeTextarea();
  });
});

defineExpose({
  validate,
  focus: () => inputRef.value?.focus(),
});
</script>

<style scoped>
.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.input-label {
  font-size: 11px;
  font-weight: 600;
  color: #495057;
  line-height: 1.2;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.input-field {
  width: 100%;
  padding: 6px 8px;

  font-size: 12px;
  font-family: inherit;
  color: #212529;

  background: #fff;
  border: 1px solid #ced4da;
  border-radius: 4px;

  outline: none;

  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
}

.textarea-field {
  min-height: 48px;
  line-height: 1.5;

  /* Jangan pakai resize vertical */
  resize: none;

  /* Tinggi mengikuti isi */
  overflow: hidden;
}

.input-field:focus {
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.08);
}

.input-field:hover:not(:disabled) {
  border-color: #adb5bd;
}

.input-field::placeholder {
  color: #adb5bd;
}

.input-field:disabled,
.input-field.input-disabled {
  background: #e9ecef;
  color: #6c757d;
  border-color: #ced4da;
  cursor: not-allowed;
  opacity: 1;
}

.input-field.input-error {
  border-color: #dc3545;
}

.input-field.input-error:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.08);
}

.hint-message {
  font-size: 11px;
  color: #6c757d;
}

.error-message {
  font-size: 11px;
  color: #dc3545;
}
</style>
```
