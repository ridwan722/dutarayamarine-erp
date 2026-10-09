<script setup lang="ts">
definePageMeta({
  layout: "blank",
});

import { ref, onMounted } from "vue";
import { getAuth, applyActionCode } from "firebase/auth";
import { useNotificationStore } from "../stores/notificationStore";
import { useloadingStore } from "../stores/loadingStore";
import { activateCompanyApi } from "../composables/api-user";

const notificationStore = useNotificationStore();
const loadingStore = useloadingStore();

const statusMessage = ref("Memverifikasi akun Anda...");
const verified = ref(false);

onMounted(async () => {
  const auth = getAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const oobCode = urlParams.get("oobCode");

  if (!oobCode) {
    statusMessage.value = "Kode verifikasi tidak ditemukan di URL.";
    return;
  }

  try {
    loadingStore.setLoading(true);

    // ✅ 1️⃣ Jalankan verifikasi email di Firebase
    await applyActionCode(auth, oobCode);
    console.log("✅ Email berhasil diverifikasi");

    // ✅ 2️⃣ Refresh status user (jika belum login, abaikan)
    await auth.currentUser?.reload();
    const user = auth.currentUser;

    // ⚠️ 3️⃣ Jika belum login, beri tahu user
    if (!user) {
      statusMessage.value =
        "Email Anda sudah diverifikasi. Silakan login kembali untuk aktivasi perusahaan.";
      return;
    }

    if (user.emailVerified) {
      console.log("✅ Email verified untuk UID:", user.uid);

      // ✅ 4️⃣ Jalankan aktivasi perusahaan di backend
      const result = await activateCompanyApi(user.uid);

      if (result.error === 0) {
        verified.value = true;
        statusMessage.value =
          "✅ Akun dan perusahaan Anda berhasil diaktifkan! Anda sudah dapat masuk ke sistem.";
        notificationStore.showSuccess("Perusahaan berhasil diaktifkan!");
      } else {
        statusMessage.value = "❌ Gagal mengaktifkan perusahaan.";
        notificationStore.showError(result.message);
      }
    } else {
      statusMessage.value = "Email belum terverifikasi.";
    }
  } catch (err: any) {
    console.error("❌ Error verifikasi:", err);
    statusMessage.value = "Terjadi kesalahan saat verifikasi email.";
    notificationStore.showError(err.message);
  } finally {
    loadingStore.setLoading(false);
  }
});
</script>

<template>
  <div class="welcome-page">
    <div class="content-area">
      <div class="form-container text-center">
        <div class="title-container">
          <p class="title">Aktivasi Akun</p>
          <span class="subtitle">
            Terima kasih telah memverifikasi email Anda. Kami sedang memproses
            aktivasi akun perusahaan Anda.
          </span>
        </div>

        <div class="status-box mt-6">
          <p v-if="!verified" class="text-body-1">{{ statusMessage }}</p>
          <p v-else class="text-body-1 text-success font-weight-bold">
            {{ statusMessage }}
          </p>
        </div>

        <v-btn
          v-if="verified"
          color="primary"
          class="mt-5"
          variant="flat"
          rounded="xl"
          to="/login"
        >
          Masuk ke Sistem
        </v-btn>

        <p class="note">© 2026 SNS Accounting System | Terms of Use</p>
      </div>
    </div>

    <footer class="footer-bar">SNS © 2026</footer>
  </div>
</template>

<style scoped>
.welcome-page {
  position: relative;
  min-height: 100vh;
  background-color: #f1f3f7;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.content-area {
  padding: 15px 20px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
}
.form-container {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 25px 30px;
  background-color: #ffffff;
  box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-family: "Inter", sans-serif;
}
.title-container {
  text-align: center;
  margin-bottom: 5px;
}
.title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #212121;
}
.subtitle {
  font-size: 0.8rem;
  color: #6c757d;
  line-height: 1.3rem;
}
.status-box {
  width: 100%;
  padding: 20px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
}
.note {
  font-size: 0.7rem;
  color: #adb5bd;
  margin-top: 15px;
}
.footer-bar {
  width: 100%;
  background-color: #007bff;
  color: #fff;
  text-align: center;
  font-size: 11px;
  padding: 6px 0;
  margin-top: auto;
}
</style>
