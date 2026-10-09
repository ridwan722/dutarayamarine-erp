<template>
  <div class="group">
    <label v-if="label" class="input-label">{{ label }}</label>

    <svg
      v-if="iconPath"
      viewBox="0 0 24 24"
      aria-hidden="true"
      class="icon"
      :style="{ width: iconSize + 'px', height: iconSize + 'px' }"
    >
      <g v-html="iconPath"></g>
    </svg>

    <textarea
      ref="textareaRef"
      class="input"
      :class="{ 'input-error': hasError }"
      :value="displayValue"
      @input="onInput"
      :placeholder="placeholder"
      :disabled="disabled"
      :style="{
        width: width ? width + 'px' : '100%',
        fontSize: fontsize,
        paddingLeft: iconPath ? iconSize + 16 + 'px' : '0.5rem',
      }"
      rows="2"
    ></textarea>

    <!-- Hint -->
    <div v-if="persistentHint || (!hasError && hint)" class="hint-message">{{ hint }}</div>

    <!-- Error -->
    <div v-if="!hideDetails && hasError && showError" class="error-message">{{ firstErrorMessage }}</div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, computed, defineExpose } from "vue";

const props = defineProps({
  modelValue: [String, Number],
  label: String,
  placeholder: {
    type: String,
    default: "Tulis di sini...",
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

const textareaRef = ref(null);
const errorMessages = ref([]);
const showError = ref(false);

watch(
  () => props.modelValue,
  () => {
    nextTick(() => resizeTextarea());
  }
);


function resizeTextarea() {
  const el = textareaRef.value;
  if (el) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseNumber(value) {
  return Number(value.replace(/\./g, ""));
}

const displayValue = computed(() => {
  if (typeof props.modelValue === "number") {
    return formatNumber(props.modelValue);
  }
  return props.modelValue;
});

function onInput(event) {
  const rawValue = event.target.value;

  if (!props.disabled) {
    if (typeof props.modelValue === "number") {
      const numberValue = parseNumber(rawValue);
      emit("update:modelValue", isNaN(numberValue) ? 0 : numberValue);
    } else {
      emit("update:modelValue", rawValue);
    }
    nextTick(() => resizeTextarea());
  }
}

function validate() {
  errorMessages.value = [];
  props.rules.forEach((rule) => {
    const result = rule(props.modelValue);
    if (result !== true) {
      errorMessages.value.push(result);
    }
  });
  showError.value = true;
  return errorMessages.value.length === 0;
}

const hasError = computed(() => errorMessages.value.length > 0);
const firstErrorMessage = computed(() => (hasError.value ? errorMessages.value[0] : ""));

onMounted(() => {
  resizeTextarea();
});

defineExpose({ validate });
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
  margin-bottom: 4px;
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
  overflow: hidden;
  resize: none;
  box-sizing: border-box;
  min-height: 2.4rem; /* ≈ 2 baris */
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
