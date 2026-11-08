<script setup lang="ts">
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";

definePageMeta({ layout: "blank" });

const auth = getAuth();
const userStore = useUserStore();
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const errorMessage = ref("");
const isSubmitting = ref(false);
const glassCard = ref<HTMLElement | null>(null);
const loginForm = ref<HTMLFormElement | null>(null);
const isKeyboardOpen = ref(false);
const keyboardShift = ref(0);

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
  const isLoginInputFocused =
    activeElement instanceof HTMLInputElement &&
    Boolean(glassCard.value?.contains(activeElement));

  if (viewportHeight > viewportBaseline) {
    viewportBaseline = viewportHeight;
  }

  const coveredHeight = Math.max(0, viewportBaseline - viewportHeight);

  if (!isLoginInputFocused) {
    // Keep the card in place while focus moves to the submit button. Moving it
    // before the click completes can cancel the tap on some mobile browsers.
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

  const form = loginForm.value;
  if (!form) return;

  const formRect = form.getBoundingClientRect();
  const formBottomWithoutShift = formRect.bottom + keyboardShift.value;
  const visibleBottom = (viewport?.offsetTop ?? 0) + viewportHeight;

  keyboardShift.value = Math.max(
    0,
    Math.ceil(formBottomWithoutShift - visibleBottom + 10),
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

  // Recheck shortly after the viewport event as a fallback for mobile
  // browsers that report the final keyboard position on the next frame.
  viewportSettleTimer = window.setTimeout(() => {
    viewportSettleTimer = null;

    const activeElement = document.activeElement;
    const isLoginInputFocused =
      activeElement instanceof HTMLInputElement &&
      Boolean(glassCard.value?.contains(activeElement));

    if (!isLoginInputFocused && isKeyboardOpen.value) {
      viewportBaseline = getViewportHeight();
      resetKeyboardLayout();
      return;
    }

    scheduleKeyboardLayout();
  }, 100);
};

onMounted(async () => {
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

  if (userStore.isLoggedIn && userStore.active) {
    const { firstAllowedPath } = await import("~/utils/access-control");
    await navigateTo(
      firstAllowedPath(userStore.getPermissions, userStore.getRole),
    );
  }
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

watch(errorMessage, async () => {
  await nextTick();
  scheduleKeyboardLayout();
});

const login = async () => {
  errorMessage.value = "";
  if (!email.value.trim() || !password.value) {
    errorMessage.value = "Email dan password wajib diisi.";
    return;
  }

  isSubmitting.value = true;
  try {
    const normalizedEmail = email.value.trim().toLowerCase();
    await signInWithEmailAndPassword(auth, normalizedEmail, password.value);
    await new Promise<void>((resolve) => {
      const startedAt = Date.now();
      const timer = window.setInterval(() => {
        if (
          (userStore.profileReady &&
            userStore.getEmail.toLowerCase() === normalizedEmail) ||
          Date.now() - startedAt > 5000
        ) {
          window.clearInterval(timer);
          resolve();
        }
      }, 50);
    });

    if (!userStore.isLoggedIn || !userStore.active) {
      throw new Error("Akun ini dinonaktifkan.");
    }

    const { firstAllowedPath } = await import("~/utils/access-control");
    await navigateTo(
      firstAllowedPath(userStore.getPermissions, userStore.getRole),
    );
  } catch (error: any) {
    await signOut(auth).catch(() => undefined);
    const code = error?.code ?? "";
    errorMessage.value = code.includes("invalid-credential")
      ? "Email atau password tidak sesuai."
      : code.includes("too-many-requests")
        ? "Terlalu banyak percobaan. Silakan coba lagi nanti."
        : error?.message || "Login gagal. Silakan coba lagi.";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div
    class="login-page"
    :class="{ 'login-page--keyboard-open': isKeyboardOpen }"
    :style="{ '--keyboard-shift': `${keyboardShift}px` }"
  >
    <div class="bg-glow glow-top" />
    <div class="bg-glow glow-bottom" />
    <div class="grid-pattern" />

    <main class="main-container">
      <div ref="glassCard" class="glass-card">
        <div class="logo-badge">
          <img src="/logokopsurat.png" alt="Duta Raya Marine" class="logo-img" />
        </div>

        <div class="text-group">
          <h1>Masuk ke <span>DUTA RAYA MARINE</span></h1>
          <p>Gunakan akun ERP yang terdaftar untuk melanjutkan.</p>
        </div>

        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4 text-left"
        >
          {{ errorMessage }}
        </v-alert>

        <form ref="loginForm" class="login-form" @submit.prevent="login">
          <div class="field-group">
            <label for="login-email">Email</label>
            <div
              class="field-shell"
              :class="{ 'field-shell--error': errorMessage }"
            >
              <span class="field-icon" aria-hidden="true">
                <v-icon icon="mdi-email-outline" size="19" />
              </span>
              <input
                id="login-email"
                v-model="email"
                type="email"
                autocomplete="username"
                inputmode="email"
                placeholder="nama@dutarayamarine.com"
                :disabled="isSubmitting"
                :aria-invalid="Boolean(errorMessage)"
                aria-describedby="login-email-hint"
                @input="errorMessage = ''"
              />
            </div>
            <!-- <small id="login-email-hint"
              >Gunakan email yang terdaftar di ERP.</small
            > -->
          </div>

          <div class="field-group">
            <div class="field-label-row">
              <label for="login-password">Password</label>
              <NuxtLink to="/reset-password" class="forgot-password-link">
                Lupa password?
              </NuxtLink>
            </div>
            <div
              class="field-shell"
              :class="{ 'field-shell--error': errorMessage }"
            >
              <span class="field-icon" aria-hidden="true">
                <v-icon icon="mdi-lock-outline" size="19" />
              </span>
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Masukkan password"
                :disabled="isSubmitting"
                :aria-invalid="Boolean(errorMessage)"
                @input="errorMessage = ''"
              />
              <button
                type="button"
                class="password-toggle"
                :aria-label="
                  showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                "
                :disabled="isSubmitting"
                @click="showPassword = !showPassword"
              >
                <v-icon
                  :icon="
                    showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
                  "
                  size="19"
                />
              </button>
            </div>
          </div>

          <v-btn
            type="submit"
            color="error"
            class="login-button"
            size="small"
            block
            :loading="isSubmitting"
          >
            Masuk <v-icon end icon="mdi-arrow-right" />
          </v-btn>
        </form>
      </div>
    </main>

    <footer>DRM &copy; 2026 Enterprise System</footer>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  width: 300px;
  height: 300px;
  top: -70px;
  right: -50px;
  background: rgba(220, 38, 38, 0.28);
}
.glow-bottom {
  width: 330px;
  height: 330px;
  bottom: 20px;
  left: -90px;
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
.glass-card {
  padding: 34px 28px 30px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 28px;
  background: rgba(18, 24, 38, 0.78);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(16px);
}
.logo-badge {
  width: 108px;
  height: 88px;
  margin: 0 auto 24px;
  padding: 5px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: #fff;
}
.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.text-group {
  text-align: center;
  margin-bottom: 26px;
}
.text-group h1 {
  margin: 0 0 9px;
  font-size: 24px;
  line-height: 1.3;
}
.text-group h1 span {
  display: block;
  color: #ef4444;
}
.text-group p {
  margin: 0;
  color: #94a3b8;
  font-size: 13.5px;
}
.login-form {
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
.field-group > label,
.field-label-row label {
  color: #dce5ef;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.01em;
}
.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.forgot-password-link {
  color: #aebdd0;
  font-size: 10px;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
}
.forgot-password-link:hover {
  color: #f87171;
}
.forgot-password-link:focus-visible {
  border-radius: 3px;
  outline: 2px solid rgba(248, 113, 113, 0.65);
  outline-offset: 3px;
}
.field-shell {
  display: flex;
  height: 54px;
  padding: 0 7px 0 9px;
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
  border-color: rgba(248, 113, 113, 0.5);
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
  transition:
    color 0.2s ease,
    background 0.2s ease;
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
.field-group > small {
  padding-left: 2px;
  color: #6f8097;
  font-size: 10px;
  line-height: 1.35;
}
.password-toggle {
  display: grid;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  padding: 0;
  place-items: center;
  color: #8695a8;
  background: transparent;
  border: 0;
  border-radius: 9px;
  cursor: pointer;
  transition: 0.2s ease;
}
.password-toggle:hover {
  color: #e4ebf3;
  background: rgba(255, 255, 255, 0.07);
}
.password-toggle:focus-visible {
  outline: 2px solid #f87171;
  outline-offset: 1px;
}
.password-toggle:disabled {
  cursor: wait;
  opacity: 0.45;
}
.login-button {
  height: 42px !important;
  margin-top: 3px;
  text-transform: none !important;
  font-weight: 700;
  border-radius: 13px !important;
  box-shadow: 0 10px 24px rgba(220, 38, 38, 0.24) !important;
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
  .login-page--keyboard-open .main-container {
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
  .glass-card {
    padding: 28px 20px 25px;
    border-radius: 23px;
  }
  .logo-badge {
    margin-bottom: 20px;
  }
  .text-group {
    margin-bottom: 23px;
  }
}
</style>
