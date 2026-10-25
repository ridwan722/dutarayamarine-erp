<template>
  <v-menu
    v-model="menuOpen"
    :close-on-content-click="false"
    location="bottom start"
    :offset="4"
  >
    <template #activator="{ props: activatorProps }">
      <button
        v-bind="activatorProps"
        type="button"
        class="date-range-trigger"
        :class="{ 'date-range-trigger-active': start || end }"
        :aria-label="ariaLabel"
      >
        <span :class="{ 'date-range-placeholder': !start && !end }">
          {{ displayValue }}
        </span>
        <v-icon icon="mdi-calendar-range-outline" size="14" />
      </button>
    </template>

    <v-card class="date-range-card" elevation="6">
      <v-date-picker
        :model-value="selectedDates"
        multiple="range"
        color="primary"
        title="Pilih rentang tanggal"
        show-adjacent-months
        @update:model-value="updateSelectedDates"
      />

      <div class="date-range-footer">
        <span>
          {{
            selectedDates.length === 1
              ? "Pilih tanggal akhir"
              : "Pilih tanggal awal dan akhir"
          }}
        </span>
        <v-btn
          v-if="start || end"
          size="x-small"
          variant="text"
          color="error"
          class="text-none"
          @click="clearRange"
        >
          Hapus
        </v-btn>
      </div>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    start?: string;
    end?: string;
    placeholder?: string;
    ariaLabel?: string;
  }>(),
  {
    start: "",
    end: "",
    placeholder: "Rentang tanggal",
    ariaLabel: "Pilih rentang tanggal",
  },
);

const emit = defineEmits<{
  "update:start": [value: string];
  "update:end": [value: string];
}>();

const menuOpen = ref(false);
const selectedDates = ref<Date[]>([]);

const displayValue = computed(() => {
  if (!props.start && !props.end) return props.placeholder;
  if (props.start && !props.end) return formatDisplayDate(props.start);
  return `${formatDisplayDate(props.start)} – ${formatDisplayDate(props.end)}`;
});

watch(menuOpen, (isOpen) => {
  if (isOpen) selectedDates.value = buildDateRange(props.start, props.end);
});

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatIsoDate(value: unknown) {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  const date = parseDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function buildDateRange(start: string, end: string) {
  const startDate = parseDate(start);
  const endDate = parseDate(end || start);
  if (!startDate || !endDate) return [];

  const dates: Date[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function updateSelectedDates(value: unknown) {
  const dates = Array.isArray(value) ? value : [];
  selectedDates.value = dates
    .map((date) => (date instanceof Date ? date : new Date(String(date))))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (selectedDates.value.length < 2) return;
  emit("update:start", formatIsoDate(selectedDates.value[0]));
  emit(
    "update:end",
    formatIsoDate(selectedDates.value[selectedDates.value.length - 1]),
  );
  nextTick(() => {
    menuOpen.value = false;
  });
}

function clearRange() {
  selectedDates.value = [];
  emit("update:start", "");
  emit("update:end", "");
  menuOpen.value = false;
}
</script>

<style scoped>
.date-range-trigger {
  display: flex;
  width: 100%;
  height: 31px;
  min-width: 0;
  padding: 5px 8px;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
  overflow: hidden;
  color: #344050;
  font: inherit;
  font-size: 10.5px;
  line-height: 19px;
  text-align: left;
  outline: none;
  background: #ffffff;
  border: 1px solid #d8dde3;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.date-range-trigger span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date-range-trigger:focus,
.date-range-trigger[aria-expanded="true"] {
  border-color: #7da5cc;
  box-shadow: 0 0 0 2px rgba(49, 95, 140, 0.08);
}

.date-range-placeholder { color: #a3abb4; }

.date-range-card { overflow: hidden; }
.date-range-card :deep(.v-picker) { box-shadow: none !important; }

.date-range-footer {
  display: flex;
  min-height: 38px;
  padding: 5px 10px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #7b8591;
  font-size: 10px;
  border-top: 1px solid #e6e9ed;
}
</style>
