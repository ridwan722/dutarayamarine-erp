<script setup lang="ts">
import { ref } from "vue";

const dialog = ref(false);
const title = ref("");
const message = ref("");
const confirmText = ref("Konfirmasi");
const cancelText = ref("Batal");
const variant = ref<"default" | "danger">("default");

let resolvePromise: (value: boolean) => void;

/**
 * SHOW CONFIRM DIALOG
 */
function show(
  dialogTitle: string,
  dialogMessage: string,
  options?: {
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "danger";
  }
): Promise<boolean> {
  title.value = dialogTitle;
  message.value = dialogMessage;
  confirmText.value = options?.confirmText ?? "Konfirmasi";
  cancelText.value = options?.cancelText ?? "Batal";
  variant.value = options?.variant ?? "default";

  dialog.value = true;

  return new Promise((resolve) => {
    resolvePromise = resolve;
  });
}

function onConfirm() {
  dialog.value = false;
  resolvePromise(true);
}

function onCancel() {
  dialog.value = false;
  resolvePromise(false);
}

defineExpose({ show });
</script>

<template>
  <v-dialog
    v-model="dialog"
    max-width="380"
    content-class="modern-dialog-wrapper"
    persistent
    overlay-opacity="0.3"
    overlay-color="#1e293b"
  >
    <div class="modern-card">
      <div class="header-decoration" :class="variant">
        <div class="blur-blob"></div>
        <div class="icon-box">
          <svg v-if="variant === 'danger'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
      </div>

      <div class="body-content">
        <h2 class="title">{{ title }}</h2>
        <p class="description">{{ message }}</p>
      </div>

      <div class="footer-actions">
        <button class="btn-cancel" @click="onCancel">
          {{ cancelText }}
        </button>
        <button 
          class="btn-confirm" 
          :class="variant" 
          @click="onConfirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </v-dialog>
</template>

<style scoped>
/* Main Card */
.modern-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 30px 25px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  font-family: 'Inter', sans-serif; /* Pastikan font ini tersedia atau gunakan sans-serif standar */
}

/* Header & Icon Visuals */
.header-decoration {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.icon-box {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  background: white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.header-decoration.default .icon-box { color: #3b82f6; border: 1.5px solid #dbeafe; }
.header-decoration.danger .icon-box { color: #ef4444; border: 1.5px solid #fee2e2; }

.icon-box svg { width: 28px; height: 28px; }

/* Background Blur Effect (Subtle) */
.blur-blob {
  position: absolute;
  width: 80px;
  height: 80px;
  filter: blur(24px);
  opacity: 0.15;
  top: -10px;
}
.header-decoration.default .blur-blob { background: #3b82f6; }
.header-decoration.danger .blur-blob { background: #ef4444; }

/* Typography */
.body-content {
  text-align: center;
  margin-bottom: 32px;
}

.title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 10px;
  letter-spacing: -0.02em;
}

.description {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.6;
  padding: 0 10px;
}

/* Buttons */
.footer-actions {
  display: flex;
  gap: 12px;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
}

.btn-cancel {
  background: #f1f5f9;
  color: #475569;
}

.btn-cancel:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.btn-confirm.default {
  background: #0f172a; /* Dark sleek color */
  color: white;
}

.btn-confirm.default:hover {
  background: #334155;
  transform: translateY(-2px);
  box-shadow: 0 8px 15px -3px rgba(15, 23, 42, 0.25);
}

.btn-confirm.danger {
  background: #ef4444;
  color: white;
}

.btn-confirm.danger:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 8px 15px -3px rgba(239, 68, 68, 0.25);
}

.btn-confirm:active { transform: translateY(0); }

/* V-Dialog Customization */
:deep(.v-dialog) {
  border-radius: 24px !important;
}
</style>
