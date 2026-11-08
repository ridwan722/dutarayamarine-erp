<script setup lang="ts">
import { useMasterUsersStore } from "~/stores/master/userStore";

definePageMeta({ layout: "blank" });
useHead({ title: "Reset Password | DRM ERP" });

const usersStore = useMasterUsersStore();
const email = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const isSubmitting = ref(false);
const resetCard = ref<HTMLElement | null>(null);
const resetSubmitArea = ref<HTMLElement | null>(null);
const isKeyboardOpen = ref(false);
const keyboardShift = ref(0);
const emailDestination = computed(() => email.value.trim().toLowerCase());

let viewportBaseline = 0;
let viewportAnimationFrame: number | null = null;
let viewportSettleTimer: number | null = null;
let removeViewportListeners: (() => void) | undefined;

const getViewportHeight = () =>
  window.visualViewport?.height ?? window.innerHeight;

const resetKeyboardLayout = () => {
  isKeyboardOpen.value = false;
  keyboardShift.value = 0;
};

const updateKeyboardLayout = () => {
  const viewport = window.visualViewport;
  const viewportHeight = getViewportHeight();
  const activeElement = document.activeElement;
  const isResetInputFocused =
    activeElement instanceof HTMLInputElement &&
    Boolean(resetCard.value?.contains(activeElement));

  if (viewportHeight > viewportBaseline) {
    viewportBaseline = viewportHeight;
  }

  const coveredHeight = Math.max(0, viewportBaseline - viewportHeight);

  if (!isResetInputFocused) {
    if (!isKeyboardOpen.value || coveredHeight < 80) {
      viewportBaseline = viewportHeight;
      resetKeyboardLayout();
    }
    return;
  }

  if (coveredHeight < 120) {
    resetKeyboardLayout();
    return;
  }

  isKeyboardOpen.value = true;

  const submitArea = resetSubmitArea.value;
  if (!submitArea) return;

  const submitRect = submitArea.getBoundingClientRect();
  const submitBottomWithoutShift = submitRect.bottom + keyboardShift.value;
  const visibleBottom = (viewport?.offsetTop ?? 0) + viewportHeight;

  keyboardShift.value = Math.max(
    0,
    Math.ceil(submitBottomWithoutShift - visibleBottom + 10),
  );
};

const scheduleKeyboardLayout = () => {
  if (viewportAnimationFrame !== null) {
    window.cancelAnimationFrame(viewportAnimationFrame);
  }

  viewportAnimationFrame = window.requestAnimationFrame(() => {
    viewportAnimationFrame = null;
    updateKeyboardLayout();
  });
};

const scheduleSettledKeyboardLayout = () => {
  scheduleKeyboardLayout();

  if (viewportSettleTimer !== null) {
    window.clearTimeout(viewportSettleTimer);
  }

  viewportSettleTimer = window.setTimeout(() => {
    viewportSettleTimer = null;

    const activeElement = document.activeElement;
    const isResetInputFocused =
      activeElement instanceof HTMLInputElement &&
      Boolean(resetCard.value?.contains(activeElement));

    if (!isResetInputFocused && isKeyboardOpen.value) {
      viewportBaseline = getViewportHeight();
      resetKeyboardLayout();
      return;
    }

    scheduleKeyboardLayout();
  }, 100);
};

onMounted(() => {
  viewportBaseline = getViewportHeight();

  const viewport = window.visualViewport;
  viewport?.addEventListener("resize", scheduleSettledKeyboardLayout);
  viewport?.addEventListener("scroll", scheduleKeyboardLayout);
  window.addEventListener("resize", scheduleSettledKeyboardLayout);
  document.addEventListener("focusin", scheduleKeyboardLayout);
  document.addEventListener("focusout", scheduleSettledKeyboardLayout);

  removeViewportListeners = () => {
    viewport?.removeEventListener("resize", scheduleSettledKeyboardLayout);
    viewport?.removeEventListener("scroll", scheduleKeyboardLayout);
    window.removeEventListener("resize", scheduleSettledKeyboardLayout);
    document.removeEventListener("focusin", scheduleKeyboardLayout);
    document.removeEventListener("focusout", scheduleSettledKeyboardLayout);
  };
});

onBeforeUnmount(() => {
  removeViewportListeners?.();
  if (viewportAnimationFrame !== null) {
    window.cancelAnimationFrame(viewportAnimationFrame);
  }
  if (viewportSettleTimer !== null) {
    window.clearTimeout(viewportSettleTimer);
  }
});

watch([errorMessage, successMessage], async () => {
  await nextTick();
  scheduleKeyboardLayout();
});

function clearFeedback() {
  errorMessage.value = "";
  successMessage.value = "";
}

function resetErrorText(error: any) {
  const code = String(error?.code || "");
  if (code.includes("invalid-email")) return "Format alamat email tidak valid.";
  if (code.includes("user-not-found"))
    return "Email belum terdaftar di sistem.";
  if (code.includes("too-many-requests")) {
    return "Terlalu banyak permintaan. Silakan coba lagi beberapa saat nanti.";
  }
  if (code.includes("network-request-failed")) {
    return "Koneksi bermasalah. Periksa internet lalu coba kembali.";
  }
  return error?.message || "Link reset password gagal dikirim.";
}

async function requestPasswordReset() {
  clearFeedback();
  const normalizedEmail = email.value.trim().toLowerCase();

  if (!normalizedEmail) {
    errorMessage.value = "Alamat email wajib diisi.";
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errorMessage.value = "Format alamat email tidak valid.";
    return;
  }

  isSubmitting.value = true;
  try {
    await usersStore.sendResetPassword(normalizedEmail);
    email.value = normalizedEmail;
    successMessage.value = `Link reset password telah dikirim ke ${normalizedEmail}. Silakan periksa inbox atau folder spam email tersebut.`;
  } catch (error) {
    errorMessage.value = resetErrorText(error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div
    class="reset-page"
    :class="{ 'reset-page--keyboard-open': isKeyboardOpen }"
    :style="{ '--keyboard-shift': `${keyboardShift}px` }"
  >
    <div class="bg-glow glow-top" />
    <div class="bg-glow glow-bottom" />
    <div class="grid-pattern" />

    <main class="main-container">
      <section ref="resetCard" class="reset-card">
        <div class="logo-badge">
          <img
            src="/logokopsurat.png"
            alt="Duta Raya Marine"
            class="logo-img"
          />
        </div>

        <div class="reset-heading">
          <span class="heading-icon" aria-hidden="true">
            <v-icon icon="mdi-lock-reset" size="23" />
          </span>
          <h1>Reset Password</h1>
          <p>
            Masukkan email akun ERP. Kami akan mengirimkan link untuk membuat
            password baru.
          </p>
        </div>

        <div class="registered-note">
          <v-icon icon="mdi-information-outline" size="17" />
          <span>Email harus sudah terdaftar di sistem Duta Raya Marine.</span>
        </div>

        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          density="compact"
          class="feedback-alert"
        >
          {{ errorMessage }}
        </v-alert>

        <v-alert
          v-if="successMessage"
          type="success"
          variant="tonal"
          density="compact"
          class="feedback-alert"
        >
          {{ successMessage }}
        </v-alert>

        <form class="reset-form" @submit.prevent="requestPasswordReset">
          <div class="field-group">
            <label for="reset-email">Email Account</label>
            <div
              class="field-shell"
              :class="{
                'field-shell--error': errorMessage,
                'field-shell--success': successMessage,
              }"
            >
              <span class="field-icon" aria-hidden="true">
                <v-icon icon="mdi-email-outline" size="19" />
              </span>
              <input
                id="reset-email"
                v-model="email"
                type="email"
                inputmode="email"
                autocomplete="email"
                placeholder="nama@dutarayamarine.com"
                :disabled="isSubmitting"
                @input="clearFeedback"
              />
            </div>
          </div>

          <div
            class="email-review"
            :class="{ 'email-review--filled': emailDestination }"
          >
            <v-icon icon="mdi-email-check-outline" size="18" />
            <div>
              <strong>Periksa kembali email tujuan</strong>
              <span>
                Link reset akan dikirim ke
                <b>{{ emailDestination || "email yang dicantumkan" }}</b
                >. Pastikan alamat email sudah benar sebelum melanjutkan.
              </span>
            </div>
          </div>

          <div ref="resetSubmitArea" class="reset-submit-area">
            <v-btn
              type="submit"
              color="error"
              class="reset-button"
              size="small"
              block
              :loading="isSubmitting"
              :disabled="isSubmitting"
            >
              Kirim Link Reset
              <v-icon end icon="mdi-email-fast-outline" />
            </v-btn>
          </div>

          <NuxtLink to="/" class="back-login-link">
            <v-icon icon="mdi-arrow-left" size="17" />
            Kembali ke halaman login
          </NuxtLink>
        </form>
      </section>
    </main>

    <footer>DRM &copy; 2026 Enterprise System</footer>
  </div>
</template>

<style scoped>
.reset-page {
  position: relative;
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  flex-direction: column;
  color: #f8fafc;
  background: #0b0f19;
  font-family: system-ui, sans-serif;
}
.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
}
.glow-top {
  position: absolute;
  top: -70px;
  right: -50px;
  width: 300px;
  height: 300px;
  background: rgba(220, 38, 38, 0.28);
}
.glow-bottom {
  position: absolute;
  bottom: 20px;
  left: -90px;
  width: 330px;
  height: 330px;
  background: rgba(37, 99, 235, 0.2);
}
.grid-pattern {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 32px 32px;
}
.main-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 460px;
  margin: auto;
  padding: 24px 16px;
  will-change: transform;
}
.reset-card {
  padding: 32px 28px 28px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 28px;
  background: rgba(18, 24, 38, 0.78);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(16px);
}
.logo-badge {
  display: grid;
  width: 94px;
  height: 76px;
  margin: 0 auto 20px;
  padding: 5px;
  place-items: center;
  border-radius: 16px;
  background: #fff;
}
.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.reset-heading {
  text-align: center;
}
.heading-icon {
  display: grid;
  width: 42px;
  height: 42px;
  margin: 0 auto 12px;
  place-items: center;
  color: #f87171;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.18);
  border-radius: 12px;
}
.reset-heading h1 {
  margin: 0;
  color: #f8fafc;
  font-size: 24px;
  line-height: 1.25;
}
.reset-heading p {
  max-width: 350px;
  margin: 9px auto 0;
  color: #94a3b8;
  font-size: 12.5px;
  line-height: 1.55;
}
.registered-note {
  display: flex;
  margin: 20px 0 15px;
  padding: 10px 11px;
  align-items: flex-start;
  gap: 8px;
  color: #aebdd0;
  font-size: 10.5px;
  line-height: 1.45;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 10px;
}
.registered-note .v-icon {
  flex: 0 0 auto;
  margin-top: 1px;
  color: #93a4b8;
}
.feedback-alert {
  margin-bottom: 15px;
  font-size: 11px;
}
.reset-form {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 17px;
}
.field-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.field-group > label {
  color: #dce5ef;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.01em;
}
.field-shell {
  display: flex;
  height: 54px;
  padding: 0 9px;
  align-items: center;
  gap: 10px;
  color: #aebdd0;
  background: rgba(7, 12, 22, 0.54);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 13px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}
.field-shell:hover {
  border-color: rgba(148, 163, 184, 0.38);
  background: rgba(7, 12, 22, 0.7);
}
.field-shell:focus-within {
  background: rgba(7, 12, 22, 0.82);
  border-color: rgba(239, 68, 68, 0.82);
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.11);
}
.field-shell--error {
  border-color: rgba(248, 113, 113, 0.55);
}
.field-shell--success {
  border-color: rgba(74, 222, 128, 0.45);
}
.field-icon {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #9eabbc;
  background: rgba(255, 255, 255, 0.055);
  border-radius: 9px;
}
.field-shell:focus-within .field-icon {
  color: #f87171;
  background: rgba(239, 68, 68, 0.11);
}
.field-shell input {
  min-width: 0;
  height: 100%;
  flex: 1;
  color: #f4f7fb;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  background: transparent;
  border: 0;
  outline: 0;
}
.field-shell input::placeholder {
  color: #637187;
  opacity: 1;
}
.field-shell input:disabled {
  cursor: wait;
  opacity: 0.65;
}
.email-review {
  display: flex;
  margin-top: -4px;
  padding: 10px 11px;
  align-items: flex-start;
  gap: 8px;
  color: #8f9caf;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 10px;
}
.email-review > .v-icon {
  flex: 0 0 auto;
  margin-top: 1px;
  color: #7f8da0;
}
.email-review > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}
.email-review strong {
  color: #c3ceda;
  font-size: 10px;
  font-weight: 700;
}
.email-review span {
  color: #8492a6;
  font-size: 9.5px;
  line-height: 1.45;
}
.email-review b {
  color: #b9c6d4;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.email-review--filled {
  background: rgba(37, 99, 235, 0.055);
  border-color: rgba(96, 165, 250, 0.16);
}
.email-review--filled > .v-icon {
  color: #7fb4eb;
}
.email-review--filled b {
  color: #d6eaff;
}
.reset-button {
  height: 42px !important;
  text-transform: none !important;
  font-weight: 700;
  border-radius: 13px !important;
  box-shadow: 0 10px 24px rgba(220, 38, 38, 0.24) !important;
}
.reset-submit-area {
  width: 100%;
}
.back-login-link {
  display: inline-flex;
  min-height: 32px;
  margin: -2px auto 0;
  padding: 4px 7px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #9eabbc;
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
  border-radius: 7px;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}
.back-login-link:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.05);
}
.back-login-link:focus-visible {
  outline: 2px solid rgba(248, 113, 113, 0.65);
  outline-offset: 2px;
}
footer {
  position: relative;
  z-index: 1;
  padding: 18px;
  color: #64748b;
  text-align: center;
  font-size: 11px;
}

@media (max-width: 1024px) {
  .reset-page--keyboard-open .main-container {
    transform: translate3d(
      0,
      calc(0px - var(--keyboard-shift, 0px)),
      0
    );
  }
}

@media (max-width: 480px) {
  .main-container {
    padding-inline: 12px;
  }
  .reset-card {
    padding: 27px 20px 23px;
    border-radius: 23px;
  }
  .logo-badge {
    margin-bottom: 17px;
  }
  .reset-heading h1 {
    font-size: 22px;
  }
}
</style>
