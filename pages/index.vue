<script setup>
definePageMeta({
  layout: "blank",
});

const pinDialog = ref(false);
const pin = ref("");
const pinError = ref("");
const isSubmitting = ref(false);

function openPinDialog() {
  pin.value = "";
  pinError.value = "";
  pinDialog.value = true;
}

async function verifyPin() {
  if (!/^\d{6}$/.test(pin.value)) {
    pinError.value = "PIN harus terdiri dari 6 angka.";
    return;
  }

  isSubmitting.value = true;
  pinError.value = "";

  try {
    await $fetch("/api/admin-access", {
      method: "POST",
      body: { pin: pin.value },
    });
    pinDialog.value = false;
    await navigateTo("/admin");
  } catch {
    pin.value = "";
    pinError.value = "PIN tidak sesuai. Silakan coba lagi.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="welcome-page">
    <div class="bg-glow glow-top"></div>
    <div class="bg-glow glow-bottom"></div>
    <div class="grid-pattern"></div>

    <main class="main-container">
      <div class="glass-card">
        <div class="logo-wrapper">
          <div class="logo-badge">
            <img
              src="/public/Logo-DRM.png"
              alt="SNS Logo"
              class="logo-img"
            />
          </div>
        </div>

        <div class="text-group">
          <h1 class="hero-title">
            Selamat Datang di <br />
            <span class="brand-gradient">DUTA RAYA MARINE</span>
          </h1>
          <p class="hero-subtitle">
            Platform administrasi terpadu untuk mengelola operasional, performa, dan data bisnis Anda.
          </p>
        </div>

        <div class="action-wrapper">
          <v-btn
            color="primary"
            class="btn-login"
            rounded="xl"
            size="x-large"
            block
            elevation="0"
            @click="openPinDialog"
          >
            Masuk
            <v-icon end icon="mdi-arrow-right" class="btn-icon" />
          </v-btn>
        </div>
      </div>
    </main>

    <v-dialog v-model="pinDialog" max-width="390" persistent>
      <v-card class="pin-dialog pa-2">
        <v-card-text class="pa-6 text-center">
          <div class="pin-icon mb-4">
            <v-icon size="26">mdi-shield-key-outline</v-icon>
          </div>
          <div class="text-h6 font-weight-bold text-slate mb-2">Masukkan PIN</div>
          <p class="pin-description mb-5">Masukkan 6 digit PIN untuk mengakses DRM Admin.</p>
          <v-text-field
            v-model="pin"
            :error-messages="pinError"
            :disabled="isSubmitting"
            autofocus
            hide-details="auto"
            inputmode="numeric"
            maxlength="6"
            placeholder="••••••"
            type="password"
            variant="outlined"
            class="pin-input"
            @update:model-value="pin = pin.replace(/\D/g, '').slice(0, 6)"
            @keyup.enter="verifyPin"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-6 pt-0">
          <v-btn variant="text" :disabled="isSubmitting" @click="pinDialog = false">Batal</v-btn>
          <v-spacer />
          <v-btn color="primary" :loading="isSubmitting" variant="flat" @click="verifyPin">Masuk</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <footer class="footer-bar">
      <span>DRM &copy; 2026 Enterprise System</span>
      <span class="version-tag">v1.0.0</span>
    </footer>
  </div>
</template>

<style scoped>

.welcome-page {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  background-color: #0b0f19; 
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}


.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  z-index: 0;
}

.glow-top {
  width: 280px;
  height: 280px;
  background: rgba(37, 99, 235, 0.35); 
  top: -60px;
  right: -40px;
}

.glow-bottom {
  width: 300px;
  height: 300px;
  background: rgba(14, 165, 233, 0.2); 
  bottom: 40px;
  left: -80px;
}

.grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 32px 32px;
  z-index: 1;
}


.main-container {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 440px;
  padding: 24px 16px;
  margin: auto 0;
  display: flex;
  justify-content: center;
}


.glass-card {
  width: 100%;
  background: rgba(18, 24, 38, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  padding: 36px 24px 32px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}


.logo-wrapper {
  margin-bottom: 24px;
}

.logo-badge {
  background: rgba(250, 250, 250, 0.988);
  border: 1px solid rgb(252, 252, 252);
  padding: 1px 4px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

.logo-img {
  height: 88px;
  width: auto;
  object-fit: contain;
}


.badge-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 99px;
  background: rgba(37, 99, 235, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background-color: #3b82f6;
  border-radius: 50%;
  box-shadow: 0 0 8px #3b82f6;
}


.hero-title {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.25;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin-bottom: 12px;
}

.brand-gradient {
  background: linear-gradient(135deg, #fa6060 0%, #f63b3b 50%, #d40606 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

.hero-subtitle {
  font-size: 13.5px;
  line-height: 1.6;
  color: #94a3b8;
  margin-bottom: 32px;
  font-weight: 400;
  padding: 0 4px;
}


.action-wrapper {
  width: 100%;
}

.btn-login {
  background: linear-gradient(135deg, #eb2525 0%, #d81d1d 100%) !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  font-size: 15px !important;
  letter-spacing: 0.2px;
  height: 52px !important;
  text-transform: none !important;
  box-shadow: 0 8px 20px rgba(235, 37, 37, 0.35) !important;
  transition: all 0.3s ease !important;
}

.btn-login:active {
  transform: scale(0.98);
}

.btn-icon {
  transition: transform 0.2s ease;
}

.btn-login:hover .btn-icon {
  transform: translateX(4px);
}


.footer-bar {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #64748b;
}

.version-tag {
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  color: #475569;
}

.pin-dialog { border-radius: 20px !important; }
.pin-icon { width: 54px; height: 54px; margin: auto; display: grid; place-items: center; border-radius: 16px; color: #2563eb; background: #eff6ff; }
.text-slate { color: #1e293b; }
.pin-description { color: #64748b; font-size: 13px; line-height: 1.5; }
.pin-input :deep(input) { letter-spacing: 10px; font-size: 21px; font-weight: 700; text-align: center; }
</style>
