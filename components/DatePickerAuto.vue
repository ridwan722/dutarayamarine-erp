<template>
    <v-menu 
      v-model="isMenuOpen" 
      :close-on-content-click="false"
    >
      <!-- Activator -->
      <template v-slot:activator="{ props }">
        <v-text-field 
          :label="label" 
          v-model="formattedDate"
          readonly 
          v-bind="props"
          variant="solo" 
          append-inner-icon="mdi-calendar"
        />
      </template>
  
      <!-- Date Picker -->
      <v-date-picker 
        v-model="selectedDate" 
        hide-actions 
        title="" 
        :color="color"
      />
    </v-menu>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch, defineProps, defineEmits } from "vue";
  import moment from "moment";
  
  const props = defineProps<{
    label?: string;
    color?: string;
    modelValue?: string; // format: YYYY-MM-DD
  }>();
  
  const emit = defineEmits(["update:modelValue"]);
  
  const isMenuOpen = ref(false);
  
  // Pastikan selectedDate langsung Date, bukan array
  const selectedDate = ref<Date | null>(
    props.modelValue ? new Date(props.modelValue) : null
  );
  
  // Format tampilan di input
  const formattedDate = computed(() => {
    return selectedDate.value
      ? moment(selectedDate.value).format("YYYY-MM-DD")
      : "";
  });
  
  // Update ke parent saat user pilih tanggal
  watch(selectedDate, (val) => {
    if (val) {
      emit("update:modelValue", formattedDate.value);
      setTimeout(() => {
        isMenuOpen.value = false;
      }, 0);
    }
  });
  
  // Update internal saat prop modelValue berubah dari luar
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        selectedDate.value = new Date(newVal);
      } else {
        selectedDate.value = null;
      }
    }
  );
  </script>
  
  <style scoped>
  .v-overlay__content:has(> .v-date-picker) {
    min-width: 20 !important;
  }
  .v-picker-title {
    padding: 0 !important;
  }
  </style>
  