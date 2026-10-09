<template>
  <div class="group" ref="rootRef">
    <label v-if="label" class="input-label">{{ label }}</label>

    <!-- Field (klik di mana saja buka dropdown) -->
    <div
      class="input"
      :class="{ 'input-error': hasError, disabled: disabled }"
      @click="openDropdown"
      role="button"
      tabindex="0"
      @keydown.enter.prevent="openDropdown"
      :style="{
        width: width ? (typeof width === 'number' ? width + 'px' : width) : '100%',
        fontSize: fontsize,
        paddingLeft: iconPath ? iconSize + 16 + 'px' : '0.5rem',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }"
    >
      <!-- icon kiri (opsional dari props) -->
      <svg
        v-if="iconPath"
        viewBox="0 0 24 24"
        aria-hidden="true"
        class="icon"
        :style="{ width: iconSize + 'px', height: iconSize + 'px' }"
      >
        <g v-html="iconPath"></g>
      </svg>

      <!-- value / placeholder -->
      <span v-if="displayValue">{{ displayValue }}</span>
      <span v-else class="placeholder">{{ placeholder }}</span>

      <!-- icon jam kanan -->
      <svg
        viewBox="0 0 24 24"
        class="clock-icon"
        xmlns="http://www.w3.org/2000/svg"
        @click.stop="openDropdown"
      >
        <path
          fill="currentColor"
          d="M12 20q3.35 0 5.675-2.325T20 12q0-3.35-2.325-5.675T12 4q-3.35 0-5.675 
             2.325T4 12q0 3.35 2.325 5.675T12 20Zm0 2q-4.15 0-7.075-2.925T2 
             12q0-4.15 2.925-7.075T12 2q4.15 0 7.075 
             2.925T22 12q0 4.15-2.925 7.075T12 
             22Zm1-6l-4.6-4.6V7h2v3.9l3.6 3.6L13 16Z"
        />
      </svg>
    </div>

    <!-- Hint & Error -->
    <div v-if="persistentHint || (!hasError && hint)" class="hint-message">{{ hint }}</div>
    <div v-if="!hideDetails && hasError && showError" class="error-message">{{ firstErrorMessage }}</div>

    <!-- Dropdown (absolute, muncul di bawah field) -->
    <div v-if="open" class="dropdown" :style="{ width: dropdownWidth }">
      <div class="dropdown-body">
        <div class="col hours">
          <div class="col-title">Jam</div>
          <ul>
            <li
              v-for="h in hours"
              :key="h"
              :class="{ active: tempHour === pad(h) }"
              @click.stop="selectHour(h)"
            >
              {{ pad(h) }}
            </li>
          </ul>
        </div>

        <div class="col minutes">
          <div class="col-title">Menit</div>
          <ul>
            <li
              v-for="m in minutes"
              :key="m"
              :class="{ active: tempMinute === pad(m) }"
              @click.stop="selectMinute(m)"
            >
              {{ pad(m) }}
            </li>
          </ul>
        </div>
      </div>

      <div class="dropdown-actions">
        <button class="btn" @click.stop="cancel">Batal</button>
        <button class="btn primary" @click.stop="confirm">OK</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, defineExpose, nextTick } from "vue";

const props = defineProps({
  modelValue: String, // "HH:mm"
  label: String,
  placeholder: { type: String, default: "Pilih jam.." },
  iconPath: String,
  iconSize: { type: Number, default: 16 },
  fontsize: { type: String, default: "14px" },
  width: [Number, String],
  disabled: { type: Boolean, default: false },
  rules: { type: Array, default: () => [] },
  hideDetails: { type: Boolean, default: false },
  hint: String,
  persistentHint: { type: Boolean, default: false },
  minuteStep: { type: Number, default: 5 }, // step menit, default 5
});

const emit = defineEmits(["update:modelValue"]);

const rootRef = ref(null);
const open = ref(false);
const tempHour = ref("00");
const tempMinute = ref("00");

const errorMessages = ref([]);
const showError = ref(false);

const pad = (n) => String(n).padStart(2, "0");

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = computed(() => {
  const step = Math.max(1, Number(props.minuteStep) || 1);
  const arr = [];
  for (let m = 0; m < 60; m += step) arr.push(m);
  return arr;
});

const displayValue = computed(() => props.modelValue || "");

const dropdownWidth = computed(() => {
  if (!props.width) return "300px";
  if (typeof props.width === "number") return props.width + "px";
  return props.width;
});

function openDropdown() {
  if (props.disabled) return;
  // isi temp dari nilai sekarang
  if (props.modelValue && typeof props.modelValue === "string" && props.modelValue.includes(":")) {
    const [h, m] = props.modelValue.split(":");
    tempHour.value = h?.padStart(2, "0") ?? "00";
    tempMinute.value = (m?.padStart(2, "0") ?? "00");
  } else {
    tempHour.value = "00";
    tempMinute.value = "00";
  }
  open.value = true;
  // allow nextTick for focus if needed
  nextTick(() => {
    // scroll selected into view
    const root = rootRef.value;
    if (!root) return;
    const selHour = root.querySelector(".hours .active");
    const selMin = root.querySelector(".minutes .active");
    if (selHour && selHour.scrollIntoView) selHour.scrollIntoView({ block: "center" });
    if (selMin && selMin.scrollIntoView) selMin.scrollIntoView({ block: "center" });
  });
}

function closeDropdown() {
  open.value = false;
}

function selectHour(h) {
  tempHour.value = pad(h);
}

function selectMinute(m) {
  tempMinute.value = pad(m);
  // ❌ jangan langsung apply & close
  // const time = `${tempHour.value}:${tempMinute.value}`;
  // emit("update:modelValue", time);
  // open.value = false;
}

function confirm() {
  const time = `${tempHour.value}:${tempMinute.value}`;
  emit("update:modelValue", time);
  open.value = false;
}

function cancel() {
  open.value = false;
}

function onDocClick(e) {
  const root = rootRef.value;
  if (!root) return;
  if (!root.contains(e.target)) {
    open.value = false;
  }
}


onMounted(() => {
  document.addEventListener("mousedown", onDocClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onDocClick);
});

function validate() {
  errorMessages.value = [];
  props.rules.forEach((rule) => {
    const result = rule(props.modelValue);
    if (result !== true) errorMessages.value.push(result);
  });
  showError.value = true;
  return errorMessages.value.length === 0;
}

const hasError = computed(() => errorMessages.value.length > 0);
const firstErrorMessage = computed(() => (hasError.value ? errorMessages.value[0] : ""));

// expose validate dan kontrol dropdown
defineExpose({
  validate,
  openDropdown,
  closeDropdown,
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

/* label */
.input-label {
  font-size: 13px;
  color: rgb(91, 91, 91);
  margin-bottom: 4px;
}

/* field */
.input {
  width: 100%;
  border: 1px solid #c4c4c4;
  border-radius: 8px;
  background-color: #fff;
  color: #0d0c22;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  padding: 0.5rem;
  font-family: inherit;
  line-height: 1.5;
  box-sizing: border-box;
  min-height: 2.3rem;
  display: flex;
  align-items: center;
  position: relative;
}

.input:hover {
  border-color: #0581ee;
  box-shadow: 0 0 0 3px rgba(59, 174, 246, 0.06);
}

.input.disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.placeholder {
  color: #9e9ea7;
}

/* icon kiri */
.icon {
  position: absolute;
  left: 10px;
  fill: #9c9c9c;
  pointer-events: none;
}

/* icon kanan (jam) */
.clock-icon {
  margin-left: auto;
  width: 18px;
  height: 18px;
  color: #9c9c9c;
  flex-shrink: 0;
  cursor: pointer;
}

/* error & hint */
.input-error {
  border-color: red !important;
  box-shadow: none;
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

/* dropdown */
.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 1200;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(11, 23, 35, 0.08);
  padding: 8px;
}

/* body: two columns */
.dropdown-body {
  display: flex;
  gap: 8px;
  padding: 6px;
}

.col {
  width: 120px;
  max-height: 200px;
  overflow: auto;
  border-radius: 6px;
}

.col-title {
  font-size: 12px;
  color: #6b6b6b;
  padding: 6px 8px;
  border-bottom: 1px solid #f0f0f0;
  text-align: left;
}

ul {
  list-style: none;
  margin: 0;
  padding: 6px;
}

li {
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #222;
}

li:hover {
  background: #f3f7ff;
}

li.active {
  background: #0581ee;
  color: white;
}

/* actions */
.dropdown-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px;
  border-top: 1px solid #f0f0f0;
}

.btn {
  border: 1px solid #d0d0d0;
  background: transparent;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.btn.primary {
  background: #0581ee;
  color: white;
  border-color: transparent;
}
</style>
