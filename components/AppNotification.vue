<template>
  <v-snackbar
    v-model="notificationStore.snackbar"
    location="top"
    :timeout="3000"
    flat
    class="modern-snackbar-auto"
  >
    <div class="snackbar-content-wrapper" :class="notificationStore.type">
      <div class="d-flex align-center">
        <v-icon
          :icon="getIcon(notificationStore.type)"
          size="20"
          color="white"
          class="ml-1 mr-3"
        />

        <div class="message-text">
          {{ notificationStore.message }}
        </div>

        <v-btn
          variant="text"
          icon="mdi-close"
          size="x-small"
          color="white"
          class="ml-3 opacity-60 hover-opacity-100"
          @click="notificationStore.snackbar = false"
        ></v-btn>
      </div>
    </div>
  </v-snackbar>
</template>

<script setup lang="ts">
import { useNotificationStore } from "~/stores/notificationStore";

const notificationStore = useNotificationStore();

function getIcon(type: string): string {
  switch (type) {
    case "success": return "mdi-check-circle";
    case "error": return "mdi-alert-circle";
    case "info": return "mdi-information";
    default: return "mdi-bell";
  }
}
</script>

<style scoped>
/* Reset Default Vuetify */
.modern-snackbar-auto :deep(.v-snackbar__wrapper) {
  background: transparent !important;
  box-shadow: none !important;
  min-width: 0 !important; /* Kunci untuk lebar otomatis */
  width: auto !important;
  top: 24px !important; /* Jarak yang pas agar tidak terlalu mepet ke atas */
  margin: 0 auto !important; /* Memastikan benar-benar di tengah */
}

.modern-snackbar-auto :deep(.v-snackbar__content) {
  padding: 0 !important;
}

/* Container Utama */
.snackbar-content-wrapper {
  display: inline-block; /* Mengikuti panjang konten */
  padding: 10px 16px;
  border-radius: 50px; /* Bentuk Pill sempurna */
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  white-space: nowrap; /* Mencegah teks turun ke bawah jika tidak perlu */
}

/* Warna Background */
.success { background-color: rgba(34, 197, 94, 0.9); }
.error   { background-color: rgba(239, 68, 68, 0.9); }
.info    { background-color: rgba(59, 130, 246, 0.9); }

/* Tipografi */
.message-text {
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* Utility */
.opacity-60 { opacity: 0.6; }
.hover-opacity-100:hover { opacity: 1 !important; }

/* Animasi Muncul dari Atas */
.v-snack-transition-enter-active {
  transition: all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.1) !important;
}
</style>