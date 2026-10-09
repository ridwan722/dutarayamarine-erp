<template>
  <div class="group">
    <label v-if="label" class="input-label">{{ label }}</label>

    <!-- 🔥 WRAPPER AGAR ICON TETAP DI DALAM FIELD -->
    <div class="input-wrapper">
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
          paddingRight: editable ? '36px' : '0.5rem',   // ✔ ruang ikon kanan
        }"
        rows="1"
      ></textarea>

      <!-- ✏ ICON EDIT (TETAP DI DALAM FIELD) -->
      <svg
        v-if="editable"
        viewBox="0 0 24 24"
        class="edit-icon"
        @click.stop="onEditClick"
      >
        <path
          fill="currentColor"
          d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02
          0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
        />
      </svg>
    </div>

    <!-- Hint -->
    <div v-if="persistentHint || (!hasError && hint)" class="hint-message">{{ hint }}</div>

    <!-- Error -->
    <div v-if="!hideDetails && hasError && showError" class="error-message">{{ firstErrorMessage }}</div>
  </div>
</template>


<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  modelValue: [String, Number],
  label: String,

  editable: {
  type: Boolean,
  default: false,
},

  placeholder: {
    type: String,
    default: "isi..",
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

const errorMessages = ref([]);
const showError = ref(false);
function onEditClick() {
  console.log("Edit icon clicked!");
  // bisa trigger fokus / buka modal dsb
  textareaRef.value?.focus();
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

/* WRAPPER BIAR ICON TIDAK KELUAR */
.input-wrapper {
  position: relative;
  width: 100%;
}

.input {
  width: 100%;
  border: 1px solid #c4c4c4;
  border-radius: 8px;
  background: #fff;
  color: #0d0c22;
  transition: border-color .3s, box-shadow .3s;
  padding: .5rem;
  font-family: inherit;
  height: 2.4rem;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  resize: none;
}

.input:focus {
  border-color: #0581ee;
  box-shadow: 0 0 0 3px rgba(59, 174, 246, 0.15);
}

/* ✏ ICON SUDAH FIX DI DALAM FIELD */
.edit-icon {
  position: absolute;
  right: 10px;
  top: 44%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  cursor: pointer;
  color: #9e9ea7;
}
/* Kembalikan efek hover seperti sebelum edit */
.input:hover {
  border-color: #0581ee;
  box-shadow: 0 0 0 3px rgba(59,174,246,0.15);
  background-color: #fff;
}
.input-wrapper:hover .edit-icon {
  color: #0581ee;
}


.edit-icon:hover {
  color: #0581ee;
}

.input-label {
  font-size: 13px;
  margin-bottom: 4px;
}

.error-message {
  font-size: 12px;
  color: red;
  margin-top: 4px;
}

.hint-message {
  font-size: 12px;
  color: #9e9ea7;
  margin-top: 4px;
}

</style>
