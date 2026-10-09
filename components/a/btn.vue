<template>
  <div class="button-wrapper">
    <button
      :style="buttonStyle"
      :disabled="disabled"
      :aria-disabled="disabled ? 'true' : 'false'"
      @click="handleClick"
    >
      <!-- Ikon SVG jika ada -->
      <svg
        v-if="icon"
        :width="iconSize"
        :height="iconSize"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        v-html="icon"
      />
      {{ text }}
    </button>
    <span class="tooltip-text">{{ finalTooltip }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: {
    type: String,
    default: 'Button',
  },
  backgroundColor: {
    type: String,
    default: '#488aec',
  },
  fontSize: {
    type: String,
    default: '13px',
  },
  tooltip: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: '', // SVG path string
  },
  iconSize: {
    type: String,
    default: '16px',
  },
})

const emit = defineEmits(['click'])

const finalTooltip = computed(() => {
  return props.tooltip || props.text
})

function hexToRgb(hex) {
  const sanitized = hex.replace('#', '')
  const bigint = parseInt(sanitized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `${r}, ${g}, ${b}`
}

const buttonStyle = computed(() => {
  const rgb = hexToRgb(props.backgroundColor)
  return {
    backgroundColor: props.backgroundColor,
    fontSize: props.fontSize,
    color: '#fff',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    boxShadow: props.disabled
      ? 'none'
      : `
      0 4px 6px -1px rgba(${rgb}, 0.2),
      0 2px 4px -1px rgba(${rgb}, 0.1)
    `,
    transition: 'all 0.3s ease',
    opacity: props.disabled ? 0.6 : 1,
  }
})

function handleClick(event) {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<style scoped>
.button-wrapper {
  position: relative;
  display: inline-block;
}

button {
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-weight: 700;
  line-height: 1rem;
  text-align: center;
  vertical-align: middle;
  border-radius: 10px;
  gap: 0.5rem;
  user-select: none;
  transition: all 0.3s ease;
  outline: none;
}

button:hover {
  transform: translateY(-1px);
}

button:focus,
button:active {
  opacity: 0.85;
  box-shadow: none;
}

/* Disabled state */
button:disabled,
button[aria-disabled='true'] {
  transform: none !important;
  pointer-events: none;
}

.tooltip-text {
  visibility: hidden;
  opacity: 0;
  background-color: #333;
  color: #fff;
  text-align: center;
  border-radius: 0.375rem;
  padding: 0.4rem 0.7rem;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  white-space: nowrap;
  transition: opacity 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.button-wrapper:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}

svg {
  display: inline-block;
}
</style>
