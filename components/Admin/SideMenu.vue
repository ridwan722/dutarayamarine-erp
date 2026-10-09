<template>
  <v-list
    v-model:opened="openedGroups"
    class="sidebar-container pa-3 bg-transparent aresa-sidebar"
    open-strategy="multiple"
    nav
  >
    <v-list-item
      to="/admin/"
      value="dashboard"
      class="nav-item mb-2"
      prepend-icon="mdi-grid-large"
      title="Dashboard"
      density="comfortable"
    />

    <div class="nav-section-label">Master</div>

    <v-list-group value="master" class="nav-group mb-1">
      <template #activator="{ props }">
        <v-list-item
          v-bind="props"
          class="nav-item"
          prepend-icon="mdi-layers-outline"
          title="Master Data"
        />
      </template>

      <div class="nav-submenu">
        <v-list-item to="/admin/master/users" title="User Management" />
        <!-- <v-list-item to="/admin/master/perusahaan" title="Perusahaan" /> -->
      </div>
    </v-list-group>

    <!-- <v-list-item
      class="nav-item mb-1"
      title="Kas (new)"
      prepend-icon="mdi-cash-multiple"
      @click="openPinDialog"
    /> -->
    <v-list-item
      class="nav-item mb-1"
      title="Kas"
      prepend-icon="mdi-cash-multiple"
      to="/admin/petty-cash"
    />

    <v-list-item
      class="nav-item mb-1"
      title="Laporan Inspeksi"
      prepend-icon="mdi-chart-box-outline"
      to="/admin/berita_acara"
    />

    <v-list-group value="penawaran" class="nav-group mb-1">
      <template #activator="{ props }">
        <v-list-item
          v-bind="props"
          class="nav-item"
          prepend-icon="mdi-receipt-text-outline"
          title="INV Duta Raya Marine"
        />
      </template>

      <div class="nav-submenu">
        <v-list-item to="/admin/invoice" title="Invoice" />
        <v-list-item to="/admin/invoice/dikirim" title="Dikirim" />
        <v-list-item to="/admin/invoice/selesai" title="Selesai" />
      </div>
    </v-list-group>
  </v-list>

  <div v-if="pinDialog" class="pin-overlay">
    <div class="pin-card">
      <div class="pin-header">
        <div class="pin-icon-wrapper">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h3>PIN Akses Kas</h3>
        <p>Silakan masukkan PIN keamanan Anda untuk melanjutkan</p>
      </div>

      <div class="pin-body">
        <div class="input-container" :class="{ 'has-error': pinError }">
          <input
            v-model="inputPin"
            type="password"
            placeholder="••••••"
            autofocus
            @keyup.enter="verifyPin"
          />
          <label>PIN Keamanan</label>
        </div>

        <div v-if="pinError" class="error-message">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          PIN salah! Akses ditolak.
        </div>
      </div>

      <div class="pin-actions">
        <button class="btn btn-secondary" @click="closePinDialog">Batal</button>
        <button class="btn btn-primary" @click="verifyPin">Masuk</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useMasterPerusahaanStore } from "~/stores/master/perusahaanStore";

const router = useRouter();

const openedGroups = ref(["penawaran", "invoice"]);

const perusahaanStore = useMasterPerusahaanStore();

// STATE VALIDASI PIN
const pinDialog = ref(false);
const inputPin = ref("");
const pinError = ref(false);
const targetRoute = "/admin/petty-cash";

const openPinDialog = () => {
  pinDialog.value = true;
  inputPin.value = "";
  pinError.value = false;
};

const closePinDialog = () => {
  pinDialog.value = false;
  inputPin.value = "";
  pinError.value = false;
};

const verifyPin = () => {
  if (inputPin.value === "mandala") {
    // Set token izin akses sementara di sessionStorage browser
    sessionStorage.setItem("is_petty_cash_authorized", "true");
    pinDialog.value = false;

    // Alihkan ke rute halaman tujuan
    router.push(targetRoute);
  } else {
    pinError.value = true;
    inputPin.value = "";
  }
};

</script>

<style scoped>
.nav-section-label {
  padding: 20px 12px 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.989);
}

.nav-item {
  border-radius: 8px !important;
  color: rgb(255, 255, 255) !important;
  transition: all 0.2s ease-in-out;
  min-height: 40px !important;
  will-change: transform;
  cursor: pointer;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
  color: #ffffff !important;
  transform: scale(1.02) translateX(4px);
}

.nav-item :deep(.v-list-item__prepend .v-icon) {
  opacity: 0.5;
  font-size: 19px;
  color: #ffffff !important;
  transition: opacity 0.2s ease;
}

.nav-item:hover :deep(.v-list-item__prepend .v-icon) {
  opacity: 1;
}

.v-list-item--active.nav-item {
  background-color: rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
  font-weight: 600;
}
.v-list-item--active.nav-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background-color: #e61919;
  border-radius: 0 4px 4px 0;
}
.v-list-item--active.nav-item :deep(.v-list-item__prepend .v-icon) {
  opacity: 1;
}

.nav-submenu {
  margin-left: 12px;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  padding-left: 8px;
  margin-top: 2px;
  margin-bottom: 8px;
}

.nav-submenu :deep(.v-list-item) {
  min-height: 34px !important;
  font-size: 12.5px !important;
  color: rgba(255, 255, 255, 0.45) !important;
  border-radius: 6px !important;
  padding-inline: 12px !important;
  transition: all 0.2s ease-in-out;
}

.nav-submenu :deep(.v-list-item:hover) {
  background-color: rgba(255, 255, 255, 0.03) !important;
  color: #ffffff !important;
  transform: scale(1.01) translateX(2px);
}

.nav-submenu :deep(.v-list-item--active) {
  color: #ffffff !important;
  background: transparent !important;
  font-weight: 600;
}

.status-badge {
  padding: 1px 6px;
  font-size: 9px;
  font-weight: 800;
  border-radius: 4px;
  line-height: 1.2;
}
.status-badge.orange {
  background: #ff7e00;
  color: #fff;
}
.status-badge.blue {
  background: #195de6;
  color: #fff;
}
.status-badge.gray {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.aresa-sidebar :deep(.v-list-group__indicator) {
  font-size: 14px;
  opacity: 0.3;
}

/* --- Reset & Variables --- */
.pin-overlay * {
  box-sizing: border-box;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  z-index: 99999999;
}

/* --- Overlay Backdrop (Membuat konten di tengah seluruh layar) --- */
.pin-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center; /* Vertikal di tengah */
  justify-content: center; /* Horisontal di tengah */
  z-index: 99999999; /* Memastikan di atas elemen apapun */
  padding: 20px; /* Jarak aman agar tidak nempel layar saat di HP kecil */
}

/* --- Card Container --- */
.pin-card {
  background-color: #1e1e2e;
  color: #ffffff;
  width: 100%;
  max-width: 360px; /* Batas lebar maksimal di desktop */
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  animation: scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); /* Efek pop-up membal halus */
}

/* --- Header --- */
.pin-header {
  padding: 28px 24px 16px 24px;
  text-align: center;
}
.pin-icon-wrapper {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px auto;
}
.pin-header h3 {
  margin: 0 0 6px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #f3f4f6;
}
.pin-header p {
  margin: 0;
  font-size: 0.85rem;
  color: #9ca3af;
  line-height: 1.4;
}

/* --- Body & Input --- */
.pin-body {
  padding: 0 24px;
}
.input-container {
  position: relative;
  margin: 16px 0 8px 0;
}
.input-container input {
  width: 100%;
  padding: 16px;
  background-color: #252538;
  border: 2px solid #374151;
  border-radius: 12px;
  color: #fff;
  font-size: 1.4rem;
  letter-spacing: 6px;
  text-align: center;
  outline: none;
  transition: all 0.2s ease;
}
.input-container input:focus {
  border-color: #3b82f6;
  background-color: #2a2a3f;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}
.input-container label {
  position: absolute;
  left: 50%;
  top: -10px;
  transform: translateX(-50%);
  background-color: #1e1e2e;
  padding: 0 8px;
  font-size: 0.75rem;
  color: #9ca3af;
  pointer-events: none;
  transition: 0.2s ease;
}
.input-container input:focus ~ label {
  color: #3b82f6;
}

/* Error State */
.input-container.has-error input {
  border-color: #ef4444;
  background-color: rgba(239, 68, 68, 0.03);
  animation: shake 0.4s ease-in-out;
}
.input-container.has-error label {
  color: #ef4444;
}
.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #ef4444;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 10px;
  animation: fadeIn 0.2s ease;
}

/* --- Actions / Buttons --- */
.pin-actions {
  display: flex;
  gap: 12px;
  padding: 24px;
}
.btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-secondary {
  background-color: #27273a;
  color: #d1d5db;
}
.btn-secondary:hover {
  background-color: #374151;
  color: #fff;
}
.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
}
.btn-primary:hover {
  background-color: #1d4ed8;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}
.btn:active {
  transform: scale(0.97);
}

/* --- Animations --- */
@keyframes scaleUp {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-6px);
  }
  40%,
  80% {
    transform: translateX(6px);
  }
}
</style>
