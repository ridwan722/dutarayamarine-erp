```vue
<template>
  <div class="form-group">
    <label v-if="label" class="input-label">
      {{ label }}
    </label>

    <div class="select-wrapper">
      <select
        ref="inputRef"
        class="input-field select-field"
        :class="{
          'input-error': hasError,
          'input-disabled': disabled,
        }"
        :value="modelValue"
        :disabled="disabled"
        @change="onChange"
        @blur="validate"
      >
        <option
          v-if="placeholder"
          value=""
          disabled
        >
          {{ placeholder }}
        </option>

        <option
          v-for="item in items"
          :key="getValue(item)"
          :value="getValue(item)"
        >
          {{ getLabel(item) }}
        </option>
      </select>

      <span class="select-arrow">
        ▼
      </span>
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
import { ref, computed } from "vue";

const props = defineProps({
  modelValue: {
    type: [String, Number, null],
    default: "",
  },

  label: {
    type: String,
    default: "",
  },

  placeholder: {
    type: String,
    default: "Pilih...",
  },

  items: {
    type: Array,
    default: () => [],
  },

  itemTitle: {
    type: String,
    default: "title",
  },

  itemValue: {
    type: String,
    default: "value",
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
});

const emit = defineEmits(["update:modelValue"]);

const inputRef = ref(null);
const errorMessages = ref([]);
const showError = ref(false);

function getLabel(item) {
  if (typeof item === "object") {
    return item[props.itemTitle];
  }

  return item;
}

function getValue(item) {
  if (typeof item === "object") {
    return item[props.itemValue];
  }

  return item;
}

function onChange(event) {
  if (props.disabled) return;

  let value = event.target.value;

  const selectedItem = props.items.find(
    (item) => String(getValue(item)) === value
  );

  if (
    selectedItem &&
    typeof selectedItem === "object"
  ) {
    value = getValue(selectedItem);
  }

  emit("update:modelValue", value);

  errorMessages.value = [];
  showError.value = false;
}

function validate() {
  errorMessages.value = [];

  props.rules.forEach((rule) => {
    const result = rule(props.modelValue);

    if (result !== true) {
      errorMessages.value.push(
        result || "Pilihan tidak valid"
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

.select-wrapper {
  position: relative;
  width: 100%;
}

.input-field {
  width: 100%;
  height: 32px;

  padding: 5px 28px 5px 8px;

  font-size: 12px;
  font-family: inherit;
  color: #212529;

  background: #fff;
  border: 1px solid #ced4da;
  border-radius: 4px;

  outline: none;

  appearance: none;

  cursor: pointer;

  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
}

.input-field:focus {
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.08);
}

.input-field:hover:not(:disabled) {
  border-color: #adb5bd;
}

.input-field:disabled {
  background: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
  opacity: 1;
}

.input-field.input-error {
  border-color: #dc3545;
}

.select-arrow {
  position: absolute;
  right: 9px;
  top: 50%;

  transform: translateY(-50%);

  font-size: 8px;
  color: #6c757d;

  pointer-events: none;
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
