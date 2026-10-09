<<<<<<< HEAD
```vue
=======
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
<template>
  <div class="checkbox-wrapper-46">
    <input
      type="checkbox"
      class="inp-cbx"
      :id="uid"
      :value="value"
      :checked="isChecked"
      @change="toggle"
    />

    <label :for="uid" class="cbx">
      <span>
        <svg viewBox="0 0 12 10" height="10px" width="12px">
          <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
        </svg>
      </span>

      <span v-if="label">{{ label }}</span>
    </label>
  </div>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  modelValue: {
    type: [Array, Boolean],
    default: false
  },
  value: {
    type: [String, Number],
    default: true
  },
  label: String
})

const emit = defineEmits(["update:modelValue"])

const uid = `cbx-${Math.random().toString(36).slice(2)}`

const isChecked = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(props.value)
  }
<<<<<<< HEAD

=======
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
  return props.modelValue
})

function toggle(e) {
  if (Array.isArray(props.modelValue)) {
    const newValue = [...props.modelValue]

    if (e.target.checked) {
      newValue.push(props.value)
    } else {
      const i = newValue.indexOf(props.value)
<<<<<<< HEAD

      if (i > -1) {
        newValue.splice(i, 1)
      }
=======
      if (i > -1) newValue.splice(i, 1)
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
    }

    emit("update:modelValue", newValue)
  } else {
    emit("update:modelValue", e.target.checked)
  }
}
</script>

<style scoped>
.checkbox-wrapper-46 {
  display: inline-flex;
  align-items: center;
  min-height: 18px;
}

.checkbox-wrapper-46 input[type="checkbox"] {
  display: none;
  visibility: hidden;
}

.checkbox-wrapper-46 .cbx {
  user-select: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

<<<<<<< HEAD
/* CHECKBOX */
.checkbox-wrapper-46 .cbx span {
  display: inline-flex;
  align-items: center;
}

=======
.checkbox-wrapper-46 .cbx span {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

/* BOX CHECKBOX */
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
.checkbox-wrapper-46 .cbx span:first-child {
  flex-shrink: 0;
  position: relative;
  width: 18px;
  height: 18px;
  min-width: 18px;
  min-height: 18px;
  border-radius: 3px;
<<<<<<< HEAD
  border: 1px solid #c4c9d4;
  background: #fff;
=======
  border: 1px solid #9098a9;
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
  transition: all 0.2s ease;
  box-sizing: border-box;
}

<<<<<<< HEAD
/* CHECK ICON */
=======
/* SVG CHECK */
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
.checkbox-wrapper-46 .cbx span:first-child svg {
  position: absolute;
  top: 3px;
  left: 2px;
  fill: none;
<<<<<<< HEAD
  stroke: #fff;
=======
  stroke: white;
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 16px;
  stroke-dashoffset: 16px;
<<<<<<< HEAD
  transition: all 0.25s ease;
=======
  transition: all 0.3s ease;
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
}

/* RIPPLE */
.checkbox-wrapper-46 .cbx span:first-child:before {
  content: "";
  position: absolute;
  inset: 0;
  background: #506eec;
  transform: scale(0);
  border-radius: 50%;
}

<<<<<<< HEAD
/* LABEL */
.checkbox-wrapper-46 .cbx span:last-child {
  padding-left: 6px;
  font-size: 12px;
  font-weight: 400;
  color: #667085;
  line-height: 18px;
  white-space: nowrap;
=======
/* LABEL TEXT */
.checkbox-wrapper-46 .cbx span:last-child {
  padding-left: 5px;
  line-height: 1.2;
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
}

/* HOVER */
.checkbox-wrapper-46 .cbx:hover span:first-child {
<<<<<<< HEAD
  border-color: #8b96ad;
}

/* CHECKED */
=======
  border-color: #506eec;
}

/* CHECKED STATE */
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
.checkbox-wrapper-46 .inp-cbx:checked + .cbx span:first-child {
  background: #506eec;
  border-color: #506eec;
  animation: wave-46 0.4s ease;
}

/* CHECK ICON ANIMATION */
.checkbox-wrapper-46 .inp-cbx:checked + .cbx span:first-child svg {
  stroke-dashoffset: 0;
}

<<<<<<< HEAD
/* WAVE */
=======
/* WAVE ANIMATION */
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
@keyframes wave-46 {
  50% {
    transform: scale(0.9);
  }
}

<<<<<<< HEAD
/* SAFETY */
=======
/* SAFETY (agar tidak kepotong di table/flex/grid) */
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
.checkbox-wrapper-46,
.checkbox-wrapper-46 * {
  overflow: visible;
}
<<<<<<< HEAD
</style>
```
=======
</style>
>>>>>>> 717d304032bc7ebad99f749429671328a324848a
