<template>
  <button
    v-if="!to"
    class="button"
    :style="{
      '--button-height': height,
      '--button-width': width,
      '--button-bg': background
        ? background
        : color
        ? `linear-gradient(45deg, ${color}, ${darkenColor(color)})`
        : defaultGradient
    }"
  >
    <span :style="{ fontSize }">
      <v-icon
        v-if="icon"
        :icon="icon"
        class="button-icon"
        :style="{ fontSize: iconSize }"
      />
      {{ text }}
    </span>
  </button>

  <NuxtLink
    v-else
    :to="to"
    class="button"
    :prefetch="true"
    :style="{
      '--button-height': height,
      '--button-width': width,
      '--button-bg': color
        ? `linear-gradient(45deg, ${color}, ${darkenColor(color)})`
        : defaultGradient
    }"
  >
    <span :style="{ fontSize }">
      <v-icon
        v-if="icon"
        :icon="icon"
        class="button-icon"
        :style="{ fontSize: iconSize }"
      />
      {{ text }}
    </span>
  </NuxtLink>
</template>

<script setup>
const props = defineProps({
  text: String,
  to: {
    type: String,
    default: "",
  },
  height: {
    type: String,
    default: "auto",
  },
  width: {
    type: String,
    default: "auto",
  },
  fontSize: {
    type: String,
    default: "1.2rem",
  },
  color: {
    type: String,
    default: "",
  },
  background: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: "", // contoh: "mdi-check"
  },
  iconSize: {
    type: String,
    default: "1.2em", // ukuran default icon
  },
});

const defaultGradient = 'linear-gradient(45deg, #1867C0, #1867C0)'

function darkenColor(hex, amount = 20) {
  if (!hex.startsWith('#') || hex.length !== 7) return hex
  const num = parseInt(hex.slice(1), 16)
  const r = Math.max(0, (num >> 16) - amount)
  const g = Math.max(0, ((num >> 8) & 0x00FF) - amount)
  const b = Math.max(0, (num & 0x0000FF) - amount)
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`
}
</script>

<style scoped>
.button {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 2px;
  background: var(--button-bg);
  box-shadow: 0px 6px 24px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  cursor: pointer;
  border: none;
  text-decoration: none;
  width: var(--button-width, 100%);
  height: var(--button-height, auto);
  transition: all 0.3s ease-in-out;
}

.button::after {
  content: "";
  width: 0%;
  height: 100%;
  background: rgba(0, 0, 0, 1.3);
  position: absolute;
  transition: all 0.4s ease-in-out;
  right: 0;
  top: 0;
  z-index: 1;
}

.button:hover::after {
  right: auto;
  left: 0;
  width: 100%;
}

.button span {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  text-decoration: none;
  width: 100%;
  padding: 8px 16px;
  color: #fff;
  z-index: 2;
  transition: all 0.3s ease-in-out;
  text-transform: none;
  font-size: 1.1rem;
  font-weight: bold;
  position: relative;
}

.button-icon {
  display: inline-flex;
}
</style>
