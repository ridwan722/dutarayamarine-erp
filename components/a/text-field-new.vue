```vue
<template>
  <div class="form-group">
    <!-- Label -->
    <label v-if="label" class="input-label">
      {{ label }}
    </label>

    <!-- Input Wrapper -->
    <div class="input-wrapper">
      <textarea
        ref="textareaRef"
        class="input-field"
        :class="{
          'input-error': hasError,
          'input-disabled': disabled,
          'has-edit-icon': editable,
        }"
        :value="displayValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :rows="rows"
        @input="onInput"
        @blur="validate"
        :style="{
          width: width ? width + 'px' : '100%',
          fontSize: fontsize,
          paddingLeft: iconPath
            ? iconSize + 16 + 'px'
            : '8px',
          paddingRight: editable
            ? '36px'
            : '8px',
        }"
      ></textarea>

      <!-- Edit Icon -->
      <svg
        v-if="editable"
        viewBox="0 0 24 24"
        class="edit-icon"
        @click.stop="onEditClick"
      >
        <path
          fill="currentColor"
          d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z
          M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34
          a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75
          1.83-1.83z"
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
import { ref, computed } from "vue";

/* =========================
   PROPS
========================= */
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },

  label: {
    type: String,
    default: "",
  },

  editable: {
    type: Boolean,
    default: false,
  },

  placeholder: {
    type: String,
    default: "isi..",
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

  rows: {
    type: Number,
    default: 1,
  },
});

/* =========================
   EMIT
========================= */
const emit = defineEmits(["update:modelValue"]);

/* =========================
   STATE
========================= */
const textareaRef = ref(null);
const errorMessages = ref([]);
const showError = ref(false);

/* =========================
   FORMAT NUMBER
========================= */
function formatNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  return value
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/* =========================
   PARSE NUMBER
========================= */
function parseNumber(value) {
  if (!value) return 0;

  const cleanValue = value
    .toString()
    .replace(/\./g, "")
    .replace(/,/g, ".");

  return Number(cleanValue);
}

/* =========================
   DISPLAY VALUE
========================= */
const displayValue = computed(() => {
  if (
    typeof props.modelValue === "number"
  ) {
    return formatNumber(props.modelValue);
  }

  return props.modelValue ?? "";
});

/* =========================
   INPUT
========================= */
function onInput(event) {
  if (props.disabled) return;

  const rawValue = event.target.value;

  /*
   * Kalau modelValue berupa Number,
   * otomatis format ribuan.
   */
  if (typeof props.modelValue === "number") {
    const numberValue = parseNumber(rawValue);

    emit(
      "update:modelValue",
      isNaN(numberValue) ? 0 : numberValue
    );
  } else {
    emit(
      "update:modelValue",
      rawValue
    );
  }

  /*
   * Hapus error ketika user mulai mengetik lagi.
   */
  if (errorMessages.value.length) {
    errorMessages.value = [];
    showError.value = false;
  }
}

/* =========================
   EDIT CLICK
========================= */
function onEditClick() {
  if (props.disabled) return;

  textareaRef.value?.focus();
}

/* =========================
   VALIDATE
========================= */
function validate() {
  errorMessages.value = [];

  if (!props.rules.length) {
    showError.value = false;
    return true;
  }

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

/* =========================
   ERROR
========================= */
const hasError = computed(() => {
  return errorMessages.value.length > 0;
});

const firstErrorMessage = computed(() => {
  return hasError.value
    ? errorMessages.value[0]
    : "";
});

/* =========================
   EXPOSE
========================= */
defineExpose({
  validate,
  focus: () => textareaRef.value?.focus(),
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

.form-group.span-2 {
  grid-column: span 2;
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
   WRAPPER
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
  min-height: 32px;
  height: 32px;

  padding: 5px 8px;

  font-size: 12px;
  font-family: inherit;
  line-height: 20px;

  color: #212529;
  background: #fff;

  border: 1px solid #ced4da;
  border-radius: 4px;

  outline: none;

  resize: vertical;

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

.input-field.input-disabled,
.input-field:disabled {
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
   EDIT ICON
========================= */

.edit-icon {
  position: absolute;

  right: 8px;
  top: 16px;

  width: 16px;
  height: 16px;

  transform: translateY(-50%);

  color: #9e9ea7;

  cursor: pointer;

  transition: color 0.15s ease;
}

.edit-icon:hover {
  color: #1976d2;
}

.input-wrapper:hover .edit-icon {
  color: #1976d2;
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

### Pemakaian

Normal:

```vue
<InputTextarea
  v-model="form.nama"
  label="Nama"
  placeholder="Masukkan nama"
/>
```

Disabled:

```vue
<InputTextarea
  v-model="form.kode"
  label="Kode"
  disabled
/>
```

Dengan edit icon:

```vue
<InputTextarea
  v-model="form.nama"
  label="Nama"
  editable
/>
```

Dengan validation:

```vue
<InputTextarea
  ref="namaRef"
  v-model="form.nama"
  label="Nama"
  :rules="[
    (v) => !!v || 'Nama wajib diisi',
  ]"
/>
```

Kalau mau menjalankan validation dari parent:

```js
namaRef.value?.validate();
```

Untuk **tampilan**, sekarang karakteristiknya mengikuti component pertama: label kecil `11px`, input `32px`, border `#ced4da`, radius `4px`, disabled `#e9ecef`, dan desain minimalis.
