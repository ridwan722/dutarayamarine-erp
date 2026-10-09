<template>
  <div
    ref="container"
    class="tab-container"
    :style="{
      backgroundColor: '#e0e0e0',
      borderRadius: radius + 'px',
      padding: '2px',
    }"
  >
    <template v-for="(tab, i) in tabs" :key="i">
      <input
        type="radio"
        :name="`tab-group-${_uid}`"
        :id="`tab-${i}-${_uid}`"
        class="tab"
        :checked="modelValue === i"
        @change="$emit('update:modelValue', i)"
      />
      <label
        class="tab_label"
        :for="`tab-${i}-${_uid}`"
        :style="{
          flex: width ? '0 0 auto' : '1 1 auto',
          width: width ? width + 'px' : 'auto',
          height: height ? height + 'px' : '32px',
          fontSize: fontSize,
          color: modelValue === i ? '#fff' : '#333',
          fontWeight: modelValue === i ? '600' : '500',
        }"
      >
        {{ tab }}
      </label>
    </template>

    <!-- indikator biru bergeser -->
    <div
      class="indicator"
      :style="{
        width: indicatorWidth + 'px',
        height: indicatorHeight + 'px',
        left: indicatorLeft + 'px',
        borderRadius: radius - 2 + 'px',
      }"
    ></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from "vue";

const props = defineProps({
  modelValue: Number,
  tabs: {
    type: Array,
    default: () => ["Tab 1", "Tab 2", "Tab 3"],
  },
  width: Number,
  height: Number,
  radius: {
    type: Number,
    default: 8,
  },
  fontSize: {
    type: String,
    default: "0.85rem",
  },
});

const emit = defineEmits(["update:modelValue"]);

const container = ref(null);
const indicatorWidth = ref(0);
const indicatorHeight = ref(0);
const indicatorLeft = ref(0);

const updateIndicator = () => {
  const labels = container.value?.querySelectorAll(".tab_label");
  if (!labels || !labels[props.modelValue]) return;
  const active = labels[props.modelValue];
  const { offsetLeft, offsetWidth, offsetHeight } = active;
  indicatorWidth.value = offsetWidth;
  indicatorHeight.value = offsetHeight;
  indicatorLeft.value = offsetLeft;
};

onMounted(async () => {
  await nextTick();
  updateIndicator();
  window.addEventListener("resize", updateIndicator);
});

watch(
  () => props.modelValue,
  async () => {
    await nextTick();
    updateIndicator();
  }
);

watch(
  () => props.tabs,
  async () => {
    await nextTick();
    updateIndicator();
  }
);
</script>

<style scoped>
.tab-container {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  background: #e0e0e0;
  overflow: hidden;
}

.tab_label {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  text-align: center;
  transition: color 0.25s ease;
}

.tab {
  position: absolute;
  z-index: -1;
  opacity: 0;
}

/* indikator biru bergeser */
.indicator {
  position: absolute;
  top: 2px;
  z-index: 5;
  background-color: #007bff;
  transition: all 0.25s ease-out;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}
</style>
