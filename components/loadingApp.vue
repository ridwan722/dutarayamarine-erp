<template>
  <v-dialog class="bg-dialog" v-model="isLoading" max-width="300" persistent>
    <!-- Card removed, now using a plain div for structure with no background or elevation -->
    <div class="d-flex flex-column align-center justify-center p-6">
      
      <!-- Container for the large loader animation -->
      <div class="large-loader-container">
        <div class="loader"></div>
      </div>

    </div>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";
import { useloadingStore } from "~/stores/loadingStore";

// Using the same store logic for dialog visibility
const loadingstore = useloadingStore();
const isLoading = computed(() => loadingstore.getLoading);
</script>

<style scoped>
.bg-dialog {
  /* Simple darkened backdrop, blur can be re-enabled if needed on the container */
  background-color: rgba(245, 243, 243, 0.956) !important;
}

/* Base style for the loader, updated for large size using EMs relative to container */
.loader {
 position: relative;
 width: 1em; /* Width is relative to the font-size of large-loader-container */
 height: 1em; /* Height is relative to the font-size */
 transform: rotate(165deg);
}

.loader:before, .loader:after {
 content: "";
 position: absolute;
 top: 50%;
 left: 50%;
 display: block;
 width: 0.2em; /* Dot size */
 height: 0.2em;
 border-radius: 0.1em;
 transform: translate(-50%, -50%);
}

.loader:before {
 animation: before8 2s infinite;
}

.loader:after {
 animation: after6 2s infinite;
}

@keyframes before8 {
 0% {
  width: 0.2em;
  box-shadow: 0.4em -0.2em rgb(225, 20, 20), -0.4em 0.2em rgba(111, 202, 220, 0.903);
 }

 35% {
  width: 1em; /* Expanded horizontal width */
  box-shadow: 0 -0.2em rgb(225, 20, 20), 0 0.2em rgba(111, 202, 220, 0.93);
 }

 70% {
  width: 0.2em;
  box-shadow: -0.4em -0.2em rgb(225, 20, 20), 0.4em 0.2em rgba(111, 202, 220, 0.919);
 }

 100% {
  box-shadow: 0.4em -0.2em rgb(225, 95, 20), -0.4em 0.2em rgba(111, 202, 220, 0.935);
 }
}

@keyframes after6 {
 0% {
  height: 0.2em;
  box-shadow: 0.2em 0.4em rgb(61, 96, 184), -0.2em -0.4em rgba(233, 169, 32, 0.955);
 }

 35% {
  height: 1em; /* Expanded vertical height */
  box-shadow: 0.2em 0 rgb(61, 110, 184), -0.2em 0 rgba(233, 169, 32, 0.925);
 }

 70% {
  height: 0.2em;
  box-shadow: 0.2em -0.4em rgb(61, 102, 184), -0.2em 0.4em rgba(233, 169, 32, 0.933);
 }

 100% {
  box-shadow: 0.2em 0.4em rgba(61, 98, 184, 0.94), -0.2em -0.4em rgba(233, 169, 32, 0.966);
 }
}

.large-loader-container {
  /* Controls the base size of the loader via font-size. 
     Using ems in the loader code makes it scale.
     Setting font-size here determines how large '1em' is for the loader. */
  font-size: 80px; /* Adjust this value to get the desired loader size */
  width: 100%; /* Take full available width for proper alignment */
  height: 1.5em; /* Ensure sufficient height, slightly larger than 1em */
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader {
 position: absolute; /* Kept from original to ensure centering */
 /* Standard centering technique inside flex parent or absolute parent */
 top: 50%;
 left: 50%;
 transform: translate(-50%, -50%) rotate(165deg);
}

</style>