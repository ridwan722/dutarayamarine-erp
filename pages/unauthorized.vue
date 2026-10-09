<template>
  <div class="welcome-page">
    <div class="content-area">
      <div class="form-container text-center">
        <div class="title-container">
          <v-icon icon="mdi-alert-circle-outline" color="red" size="40" />
          <p class="title mt-2">Akses Ditolak</p>
          <span class="subtitle">
            Anda tidak memiliki izin untuk mengakses halaman ini.<br />
            Silakan masuk dengan akun yang memiliki hak akses yang sesuai.
          </span>
        </div>

        <v-btn
          color="primary"
          class="mt-6"
          variant="flat"
          rounded="xl"
          to="/login"
        >
          Kembali ke Login
          <v-icon icon="mdi-login" end />
        </v-btn>

        <p class="note">© 2026 Aresa Accounting System | Terms of Use</p>
      </div>
    </div>

    <footer class="footer-bar">Aresa © 2026</footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "blank",
});
</script>

<style scoped>
/* ===============================
 * STRUKTUR & LAYOUT DASAR
 * =============================== */
.welcome-page {
  position: relative;
  min-height: 100vh;
  overflow-y: hidden;
  background-color: #f1f3f7;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow-x: hidden;
}

/* ===============================
 * AREA KONTEN UTAMA
 * =============================== */
.content-area {
  padding: 15px 20px;
  z-index: 3;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: -60px;
}

/* ===============================
 * CARD CONTAINER
 * =============================== */
.form-container {
  width: 100%;
  max-width: 400px;
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

/* ===============================
 * TITLE/SUBTITLE
 * =============================== */
.title-container {
  text-align: center;
  margin-bottom: 5px;
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #212121;
}

.subtitle {
  font-size: 0.85rem;
  color: #6c757d;
  line-height: 1.4rem;
  margin-top: 4px;
}

/* ===============================
 * BUTTON
 * =============================== */
.v-btn {
  font-weight: 600;
  text-transform: none;
}

/* ===============================
 * FOOTER & NOTE
 * =============================== */
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
