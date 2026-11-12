<template>
  <v-snackbar
    v-model="notificationStore.snackbar"
    location="top"
    :timeout="2500"
    flat
    class="interactive-snackbar"
  >
    <div class="toast-card" :class="`toast-${notificationStore.type || 'info'}`">
      <!-- Icon Status & Background-nya -->
      <div 
        class="toast-icon-wrap"
        :class="{
          'anim-shake': notificationStore.type === 'error',
          'anim-loop-pop': notificationStore.type === 'success'
        }"
      >
        <v-icon :icon="getIcon(notificationStore.type)" size="18" />
      </div>

      <!-- Pesan & Teks -->
      <div class="toast-body">
        <span class="toast-message">{{ notificationStore.message }}</span>
      </div>

      <!-- Tombol Tutup -->
      <button
        type="button"
        class="toast-close-btn"
        aria-label="Close"
        @click="notificationStore.snackbar = false"
      >
        <v-icon icon="mdi-close" size="14" />
      </button>

      <!-- Progress bar durasi (2.5 detik) -->
      <div class="toast-progress-bar">
        <div class="toast-progress-fill" :style="{ animationDuration: '2500ms' }"></div>
      </div>
    </div>
  </v-snackbar>
</template>

<script setup lang="ts">
import { useNotificationStore } from "~/stores/notificationStore";

const notificationStore = useNotificationStore();

function getIcon(type: string): string {
  switch (type) {
    case "success": return "mdi-check";
    case "error": return "mdi-alert-circle-outline";
    case "warning": return "mdi-alert-outline";
    case "info":
    default: return "mdi-information-outline";
  }
}
</script>

<style scoped>
/* Posisi Center Atas Presisi */
.interactive-snackbar :deep(.v-snackbar__wrapper) {
  background: transparent !important;
  box-shadow: none !important;
  width: auto !important;
  max-width: 480px !important;
  min-width: 320px !important;
  top: 0px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  margin: 0 !important;
  padding: 0 !important;
}

.interactive-snackbar :deep(.v-snackbar__content) {
  padding: 0 !important;
  overflow: visible !important;
}

/* Kartu Utama (Diam Stabil) */
.toast-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #eaedf2;
  border-radius: 10px;
  padding: 12px 16px;
  box-shadow: 
    0 10px 25px -5px rgba(0, 0, 0, 0.05),
    0 8px 10px -6px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

/* Wrap Icon Dasar */
.toast-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Animasi Error (Sekali getar saat muncul) */
.toast-icon-wrap.anim-shake {
  animation: shakeIcon 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

/* Animasi Success (Pop / Berdenyut terus-menerus selama tampil) */
.toast-icon-wrap.anim-loop-pop {
  animation: loopPopIcon 1s ease-in-out infinite;
}

/* Teks Pesan */
.toast-body {
  flex: 1;
  min-width: 0;
}

.toast-message {
  margin: 0;
  font-size: 0.835rem;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.4;
  word-break: break-word;
}

/* Tombol Tutup */
.toast-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.toast-close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* Varian Warna Status */
.toast-success .toast-icon-wrap { background: #dcfce7; color: #15803d; }
.toast-success { border-left: 3px solid #16a34a; }

.toast-error .toast-icon-wrap { background: #fee2e2; color: #b91c1c; }
.toast-error { border-left: 3px solid #dc2626; }

.toast-warning .toast-icon-wrap { background: #fef3c7; color: #b45309; }
.toast-warning { border-left: 3px solid #d97706; }

.toast-info .toast-icon-wrap { background: #e0f2fe; color: #0369a1; }
.toast-info { border-left: 3px solid #0284c7; }

/* Progress Bar */
.toast-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #f1f5f9;
}

.toast-progress-fill {
  height: 100%;
  width: 100%;
  transform-origin: left;
  animation: shrinkLinear linear forwards;
}

.toast-success .toast-progress-fill { background: #16a34a; }
.toast-error .toast-progress-fill { background: #dc2626; }
.toast-warning .toast-progress-fill { background: #d97706; }
.toast-info .toast-progress-fill { background: #0284c7; }

@keyframes shrinkLinear {
  0% { transform: scaleX(1); }
  100% { transform: scaleX(0); }
}

/* KEYFRAMES ANIMASI */

/* Efek Getar Sekali untuk Error */
@keyframes shakeIcon {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

/* Efek Pop Berdenyut Terus Menerus (Looping) untuk Success / Checklist */
@keyframes loopPopIcon {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

/* Transisi Umum Snackbar Masuk dari Atas */
.v-snack-transition-enter-active,
.v-snack-transition-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.v-snack-transition-enter-from,
.v-snack-transition-leave-to {
  opacity: 0;
  transform: translate(-50%, -12px) scale(0.95);
}
</style>