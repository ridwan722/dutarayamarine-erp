```vue
<template>
  <div class="form-group">
    <label v-if="label" class="input-label">
      {{ label }}
    </label>

    <div
      ref="wrapperRef"
      class="autocomplete-wrapper"
    >
      <input
        ref="inputRef"
        type="text"
        class="input-field"
        :class="{
          'input-error': hasError,
          'input-disabled': disabled,
        }"
        :value="searchText"
        :placeholder="placeholder"
        :disabled="disabled"
        autocomplete="off"
        @input="onSearch"
        @focus="onFocus"
        @blur="onBlur"
        @keydown.down.prevent="moveDown"
        @keydown.up.prevent="moveUp"
        @keydown.enter.prevent="selectActive"
        @keydown.esc="closeDropdown"
      />

      <span
        v-if="searchText && !disabled"
        class="clear-icon"
        @mousedown.prevent="clearValue"
      >
        ×
      </span>

      <span
        v-else
        class="search-arrow"
      >
        ▼
      </span>

      <!-- Dropdown -->
      <div
        v-if="isOpen && filteredItems.length"
        class="dropdown"
      >
        <div
          v-for="(item, index) in filteredItems"
          :key="getValue(item)"
          class="dropdown-item"
          :class="{
            active: index === activeIndex,
          }"
          @mousedown.prevent="selectItem(item)"
        >
          {{ getLabel(item) }}
        </div>
      </div>

      <div
        v-if="isOpen && !filteredItems.length"
        class="dropdown no-data"
      >
        Data tidak ditemukan
      </div>
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
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
} from "vue";

const props = defineProps({
  modelValue: {
    type: [String, Number, Object, null],
    default: null,
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

  minChars: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits([
  "update:modelValue",
  "select",
]);

const inputRef = ref(null);
const wrapperRef = ref(null);

const searchText = ref("");
const isOpen = ref(false);
const activeIndex = ref(-1);

const errorMessages = ref([]);
const showError = ref(false);

/* =========================
   ITEM HELPER
========================= */

function getLabel(item) {
  if (typeof item === "object") {
    return item?.[props.itemTitle] ?? "";
  }

  return String(item ?? "");
}

function getValue(item) {
  if (typeof item === "object") {
    return item?.[props.itemValue];
  }

  return item;
}

/* =========================
   SELECTED LABEL
========================= */

function getSelectedLabel(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const item = props.items.find(
    (item) =>
      getValue(item) === value
  );

  if (item) {
    return getLabel(item);
  }

  if (typeof value === "object") {
    return getLabel(value);
  }

  return String(value);
}

/* =========================
   WATCH MODEL
========================= */

watch(
  () => props.modelValue,
  (value) => {
    searchText.value =
      getSelectedLabel(value);
  },
  {
    immediate: true,
  }
);

/* =========================
   FILTER
========================= */

const filteredItems = computed(() => {
  const keyword =
    searchText.value
      .toLowerCase()
      .trim();

  if (
    keyword.length < props.minChars
  ) {
    return props.items;
  }

  return props.items.filter(
    (item) =>
      getLabel(item)
        .toLowerCase()
        .includes(keyword)
  );
});

/* =========================
   SEARCH
========================= */

function onSearch(event) {
  if (props.disabled) return;

  searchText.value =
    event.target.value;

  isOpen.value = true;
  activeIndex.value = -1;

  /*
   * Saat user mengetik,
   * selected value direset.
   */
  emit("update:modelValue", null);

  errorMessages.value = [];
  showError.value = false;
}

/* =========================
   FOCUS
========================= */

function onFocus() {
  if (props.disabled) return;

  isOpen.value = true;
}

/* =========================
   SELECT
========================= */

function selectItem(item) {
  const value = getValue(item);

  searchText.value =
    getLabel(item);

  emit(
    "update:modelValue",
    value
  );

  emit("select", item);

  isOpen.value = false;
  activeIndex.value = -1;

  errorMessages.value = [];
  showError.value = false;
}

/* =========================
   KEYBOARD
========================= */

function moveDown() {
  if (!isOpen.value) {
    isOpen.value = true;
    return;
  }

  if (!filteredItems.value.length)
    return;

  activeIndex.value++;

  if (
    activeIndex.value >=
    filteredItems.value.length
  ) {
    activeIndex.value = 0;
  }
}

function moveUp() {
  if (!isOpen.value) return;

  if (!filteredItems.value.length)
    return;

  activeIndex.value--;

  if (activeIndex.value < 0) {
    activeIndex.value =
      filteredItems.value.length - 1;
  }
}

function selectActive() {
  if (
    activeIndex.value < 0 ||
    !filteredItems.value[
      activeIndex.value
    ]
  ) {
    return;
  }

  selectItem(
    filteredItems.value[
      activeIndex.value
    ]
  );
}

/* =========================
   CLEAR
========================= */

function clearValue() {
  if (props.disabled) return;

  searchText.value = "";

  emit(
    "update:modelValue",
    null
  );

  isOpen.value = true;
  activeIndex.value = -1;
}

/* =========================
   BLUR
========================= */

function onBlur() {
  /*
   * Delay supaya click dropdown
   * masih sempat diproses.
   */
  setTimeout(() => {
    isOpen.value = false;
    validate();

    /*
     * Kembalikan text ke selected value
     * jika user mengetik tapi tidak memilih.
     */
    if (
      props.modelValue !== null &&
      props.modelValue !== undefined
    ) {
      searchText.value =
        getSelectedLabel(
          props.modelValue
        );
    }
  }, 150);
}

/* =========================
   CLOSE
========================= */

function closeDropdown() {
  isOpen.value = false;
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
        result || "Pilihan tidak valid"
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
  return errorMessages.value.length > 0;
});

const firstErrorMessage = computed(() => {
  return hasError.value
    ? errorMessages.value[0]
    : "";
});

/* =========================
   CLICK OUTSIDE
========================= */

function handleClickOutside(event) {
  if (
    wrapperRef.value &&
    !wrapperRef.value.contains(
      event.target
    )
  ) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener(
    "mousedown",
    handleClickOutside
  );
});

onBeforeUnmount(() => {
  document.removeEventListener(
    "mousedown",
    handleClickOutside
  );
});

/* =========================
   EXPOSE
========================= */

defineExpose({
  validate,
  focus: () =>
    inputRef.value?.focus(),
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

.autocomplete-wrapper {
  position: relative;
  width: 100%;
}

.input-field {
  width: 100%;
  height: 32px;

  padding: 5px 30px 5px 8px;

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

.input-field:focus {
  border-color: #1976d2;

  box-shadow:
    0 0 0 2px
    rgba(25, 118, 210, 0.08);
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
  cursor: not-allowed;
  opacity: 1;
}

.input-field.input-error {
  border-color: #dc3545;
}

.input-field.input-error:focus {
  border-color: #dc3545;

  box-shadow:
    0 0 0 2px
    rgba(220, 53, 69, 0.08);
}

/* =========================
   ICON
========================= */

.search-arrow {
  position: absolute;

  right: 9px;
  top: 50%;

  transform: translateY(-50%);

  font-size: 8px;
  color: #6c757d;

  pointer-events: none;
}

.clear-icon {
  position: absolute;

  right: 8px;
  top: 50%;

  transform: translateY(-50%);

  width: 16px;
  height: 16px;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 17px;
  line-height: 1;

  color: #9e9ea7;

  cursor: pointer;
}

.clear-icon:hover {
  color: #dc3545;
}

/* =========================
   DROPDOWN
========================= */

.dropdown {
  position: absolute;

  left: 0;
  right: 0;
  top: calc(100% + 3px);

  z-index: 1000;

  max-height: 220px;
  overflow-y: auto;

  background: #fff;

  border: 1px solid #ced4da;
  border-radius: 4px;

  box-shadow:
    0 4px 12px
    rgba(0, 0, 0, 0.08);
}

.dropdown-item {
  padding: 7px 9px;

  font-size: 12px;
  color: #212529;

  cursor: pointer;

  transition:
    background-color 0.1s ease;
}

.dropdown-item:hover,
.dropdown-item.active {
  background: #f1f5f9;
  color: #1976d2;
}

.no-data {
  padding: 9px;

  font-size: 11px;
  color: #6c757d;

  text-align: center;
}

/* =========================
   DETAILS
========================= */

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
