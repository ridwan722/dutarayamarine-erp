<script setup>
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";

const props = defineProps({
  modelValue: [String, Number],
  items: {
    type: Array,
    default: () => [],
  },
  itemTitle: {
    type: String,
    default: "label",
  },
  itemValue: {
    type: String,
    default: "value",
  },
  label: String,
  placeholder: {
    type: String,
    default: "Search...",
  },
  height: {
    type: String,
    default: "40px",
  },
  rules: {
    type: Array,
    default: () => [],
  },
  variant: {
    type: String,
    default: "",
  },
  disableCondition: {
    type: Function,
    default: (item) => false,
  },

  // Tambahkan ini
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const search = ref("");
const showDropdown = ref(false);
const wrapperRef = ref(null);
const inputRef = ref(null);

const dropdownPosition = ref({
  top: 0,
  left: 0,
  width: 0,
});

watch(
  () => props.modelValue,
  (val) => {
    const found = props.items.find((opt) => opt[props.itemValue] === val);
    search.value = found ? found[props.itemTitle] : "";
  },
  { immediate: true },
);

const filteredOptions = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return props.items.filter((opt) =>
    String(opt[props.itemTitle]).toLowerCase().includes(keyword),
  );
});

const selectOption = (opt) => {
  // Cegah klik jika disable
  if (props.disableCondition(opt)) return;
  search.value = opt[props.itemTitle];
  emit("update:modelValue", opt[props.itemValue]);
  showDropdown.value = false;
};

const onInput = () => {
  if (props.disabled) return;

  showDropdown.value = true;
  nextTick(() => updateDropdownPosition());
};

const toggleDropdown = () => {
  if (props.disabled) return;

  if (!showDropdown.value) {
    showDropdown.value = true;
    nextTick(() => updateDropdownPosition());
  }
};

const updateDropdownPosition = () => {
  if (inputRef.value) {
    const rect = inputRef.value.getBoundingClientRect();
    dropdownPosition.value = {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    };
  }
};

const handleScrollResize = () => {
  if (showDropdown.value) updateDropdownPosition();
};

const handleClickOutside = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    showDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("scroll", handleScrollResize, true);
  window.addEventListener("resize", handleScrollResize);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("scroll", handleScrollResize, true);
  window.removeEventListener("resize", handleScrollResize);
});
</script>

<template>
  <div
    class="autocomplete-wrapper"
    ref="wrapperRef"
    @click="toggleDropdown"
    tabindex="0"
  >
    <label v-if="label" class="autocomplete-label">{{ label }}</label>

    <div class="autocomplete-input-wrapper">
      <input
        ref="inputRef"
        type="text"
        v-model="search"
        :placeholder="placeholder"
        :disabled="props.disabled"
        @input="onInput"
        class="autocomplete-input"
        @focus="
          !props.disabled &&
          ((showDropdown = true), nextTick(() => updateDropdownPosition()))
        "
        :style="{ height: props.height }"
      />
      <svg class="dropdown-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 10l5 5 5-5z" />
      </svg>
    </div>

    <!-- Dropdown -->
    <Teleport to="body" v-if="showDropdown && filteredOptions.length">
      <div
        class="dropdown-list-teleported"
        :style="{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
        }"
      >
        <div
          v-for="(opt, idx) in filteredOptions"
          :key="idx"
          class="dropdown-item"
          :class="{ disabled: props.disableCondition(opt) }"
          @mousedown.prevent="!props.disableCondition(opt) && selectOption(opt)"
        >
          {{ opt[props.itemTitle] }}
          <span v-if="props.disableCondition(opt)" class="text-muted">
            (Saldo Minus)
          </span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.autocomplete-wrapper {
  position: relative;
  width: 100%;
  outline: none;
}

.autocomplete-label {
  display: block;
  margin-bottom: 3px;
  color: rgb(65, 65, 65);
  font-size: 13px;
}

.autocomplete-input-wrapper {
  display: flex;
  align-items: center;
  position: relative;
}

.autocomplete-input {
  width: 100%;
  padding: 10px 36px 10px 12px;
  border: 1px solid #c4c4c4;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border 0.3s;
  cursor: text;
}

.autocomplete-input:focus {
  border-color: #0581ee;
  box-shadow: 0 0 0 3px rgba(59, 140, 246, 0.1);
}

.dropdown-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  width: 20px;
  height: 20px;
  fill: #6b7280;
  transform: translateY(-50%);
  pointer-events: none;
}

.dropdown-list-teleported {
  position: absolute;
  z-index: 2147483647;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-top: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.dropdown-item {
  padding: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  background-color: white;
  user-select: none;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background-color: #dedede;
}

.dropdown-item.disabled {
  color: #9ca3af;
  background-color: #f9fafb;
  cursor: not-allowed;
  pointer-events: none; /* blok semua klik */
}

.text-muted {
  color: #999;
  font-size: 12px;
  margin-left: 4px;
}
</style>

<style>
/* Pastikan dropdown di atas semua element */
body {
  position: relative;
}
.dropdown-list-teleported {
  z-index: 9999 !important;
}
.autocomplete-input:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.autocomplete-input:disabled::placeholder {
  color: #9ca3af;
}
</style>
