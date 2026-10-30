<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { ConfirmationDialog } from "#components";
import type { penomoranM } from "~/types/penomoranModel";

definePageMeta({ layout: "admin" });

const penomoranStore = usePenomoranStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);
const isLoading = ref(true);
const isSaving = ref(false);

const form = reactive<penomoranM>({
  no_inv: 0,
  no_penawaran: 0,
});
const original = reactive<penomoranM>({
  no_inv: 0,
  no_penawaran: 0,
});

const nextInvoiceNumber = computed(() => Number(form.no_inv || 0) + 1);
const nextQuotationNumber = computed(
  () => Number(form.no_penawaran || 0) + 1,
);
const isDirty = computed(
  () =>
    Number(form.no_inv) !== Number(original.no_inv) ||
    Number(form.no_penawaran) !== Number(original.no_penawaran),
);

function applyPenomoran(data: penomoranM) {
  const noInv = Number(data.no_inv) || 0;
  const noPenawaran = Number(data.no_penawaran) || 0;

  form.no_inv = noInv;
  form.no_penawaran = noPenawaran;
  original.no_inv = noInv;
  original.no_penawaran = noPenawaran;
}

async function loadPenomoran() {
  isLoading.value = true;
  try {
    const penomoran = await penomoranStore.tarikDataPenomoranAct();
    applyPenomoran(penomoran);
  } catch (error) {
    console.error("Gagal mengambil data penomoran:", error);
    notificationStore.showError("Gagal mengambil data penomoran");
  } finally {
    isLoading.value = false;
  }
}

function resetForm() {
  form.no_inv = original.no_inv;
  form.no_penawaran = original.no_penawaran;
}

function normalizedCounter(value: unknown) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue >= 0
    ? numberValue
    : null;
}

async function savePenomoran() {
  if (isSaving.value || !isDirty.value) return;

  const noInv = normalizedCounter(form.no_inv);
  const noPenawaran = normalizedCounter(form.no_penawaran);
  if (noInv === null || noPenawaran === null) {
    return notificationStore.showError(
      "Nomor invoice dan penawaran harus berupa angka bulat 0 atau lebih",
    );
  }

  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Perubahan Penomoran",
    `Nomor invoice berikutnya menjadi ${noInv + 1} dan nomor penawaran berikutnya menjadi ${noPenawaran + 1}. Lanjutkan?`,
    { confirmText: "Simpan" },
  );
  if (!confirmed) return;

  isSaving.value = true;
  try {
    const saved = await penomoranStore.updatePenomoranAct({
      no_inv: noInv,
      no_penawaran: noPenawaran,
    });
    if (saved) applyPenomoran(saved);
  } finally {
    isSaving.value = false;
  }
}

onMounted(loadPenomoran);
</script>

<template>
  <div class="numbering-page">
    <ConfirmationDialog ref="confirmationDialog" />

    <v-btn
      variant="text"
      color="grey-darken-3"
      prepend-icon="mdi-arrow-left"
      class="back-button text-none"
      @click="$router.go(-1)"
    >
      Kembali
    </v-btn>

    <header class="numbering-hero">
      <div>
        <!-- <span class="eyebrow">Master Data</span> -->
        <h1>Pengaturan Penomoran Invoice & Quotation</h1>
        <p>
          Atur nomor terakhir yang sudah digunakan. Sistem akan memakai angka
          berikutnya ketika membuat invoice atau quotation baru.
        </p>
      </div>
      <v-btn
        icon="mdi-refresh"
        variant="outlined"
        color="grey-darken-1"
        :loading="isLoading"
        aria-label="Muat ulang penomoran"
        @click="loadPenomoran"
      />
    </header>

    <v-skeleton-loader
      v-if="isLoading"
      class="numbering-card"
      type="heading, paragraph, paragraph, actions"
    />

    <form v-else class="numbering-card" @submit.prevent="savePenomoran">
      <!-- <header class="card-header">
        <div>
          <span class="section-label">Dokumen Firestore</span>
          <h2>Penomoran Inv & Quotation</h2>
        </div>
        <span :class="['change-status', { changed: isDirty }]">
          {{ isDirty ? "Ada perubahan" : "Tersimpan" }}
        </span>
      </header> -->

      <div class="counter-grid">


        <section class="counter-field">
          <div class="counter-icon quotation-icon">
            <v-icon icon="mdi-file-document-outline" size="23" />
          </div>
          <div class="counter-content">
            <label for="no-penawaran">Nomor Penawaran Terakhir</label>
            <p>Field Firestore: <code>no_penawaran</code></p>
            <v-text-field
              id="no-penawaran"
              v-model.number="form.no_penawaran"
              type="number"
              min="0"
              step="1"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              inputmode="numeric"
            />
            <span class="next-number">
              Nomor penawaran berikutnya:
              <strong>{{ nextQuotationNumber }}</strong>
            </span>
          </div>
        </section>

        <section class="counter-field">
          <div class="counter-icon invoice-icon">
            <v-icon icon="mdi-receipt-text-outline" size="23" />
          </div>
          <div class="counter-content">
            <label for="no-inv">Nomor Invoice Terakhir</label>
            <p>Field Firestore: <code>no_inv</code></p>
            <v-text-field
              id="no-inv"
              v-model.number="form.no_inv"
              type="number"
              min="0"
              step="1"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              inputmode="numeric"
            />
            <span class="next-number">
              Nomor invoice berikutnya:
              <strong>{{ nextInvoiceNumber }}</strong>
            </span>
          </div>
        </section>
      </div>

      <aside class="numbering-note">
        <v-icon icon="mdi-information-outline" size="18" />
        <p>
          Masukkan nomor terakhir yang sudah terpakai, bukan nomor yang akan
          digunakan. Contoh: jika nilainya 1, invoice / Quotation berikutnya adalah 2.
        </p>
      </aside>

      <footer class="card-actions">
        <v-btn
          variant="outlined"
          color="grey-darken-1"
          class="text-none"
          :disabled="!isDirty || isSaving"
          @click="resetForm"
        >
          Batalkan Perubahan
        </v-btn>
        <v-btn
          type="submit"
          color="primary"
          variant="flat"
          prepend-icon="mdi-content-save-outline"
          class="text-none"
          :disabled="!isDirty"
          :loading="isSaving"
        >
          Simpan Penomoran
        </v-btn>
      </footer>
    </form>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.numbering-page {
  width: 100%;
  max-width: 1080px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 8px 14px 32px;
  color: #243447;
}

.back-button {
  min-height: 32px;
  margin-bottom: 8px;
  padding-inline: 7px !important;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0;
}

.numbering-hero,
.numbering-card {
  background: #fff;
  border: 1px solid #e0e5ea;
  border-radius: 9px;
  box-shadow: 0 8px 24px rgba(34, 51, 68, 0.045);
}

.numbering-hero {
  display: flex;
  min-height: 126px;
  padding: 22px 24px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.eyebrow,
.section-label {
  color: #587a9b;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.numbering-hero h1 {
  margin: 5px 0;
  color: #1d2937;
  font-size: 25px;
  font-weight: 750;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.numbering-hero p {
  max-width: 680px;
  margin: 0;
  color: #778493;
  font-size: 12px;
  line-height: 1.6;
}

.numbering-card {
  margin-top: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  min-height: 76px;
  padding: 16px 20px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e5e9ed;
}

.card-header h2 {
  margin: 4px 0 0;
  color: #263442;
  font-size: 16px;
  font-weight: 720;
}

.change-status {
  padding: 5px 10px;
  color: #39725a;
  font-size: 10px;
  font-weight: 700;
  background: #eaf6ef;
  border: 1px solid #d3eadc;
  border-radius: 999px;
}

.change-status.changed {
  color: #94691e;
  background: #fff7e5;
  border-color: #f2dfb4;
}

.counter-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 20px;
}

.counter-field {
  display: flex;
  min-width: 0;
  padding: 18px;
  align-items: flex-start;
  gap: 14px;
  background: #fafbfc;
  border: 1px solid #dfe5ea;
  border-radius: 8px;
}

.counter-icon {
  display: grid;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 7px;
}

.invoice-icon {
  color: #315f8c;
  background: #eaf1f7;
}

.quotation-icon {
  color: #6a5790;
  background: #f0edf7;
}

.counter-content {
  min-width: 0;
  flex: 1;
}

.counter-content label {
  display: block;
  color: #2c3a49;
  font-size: 13px;
  font-weight: 700;
}

.counter-content p {
  margin: 3px 0 12px;
  color: #87919c;
  font-size: 10px;
}

.counter-content code {
  color: #526b82;
}

.next-number {
  display: block;
  margin-top: 9px;
  color: #73808d;
  font-size: 10px;
}

.next-number strong {
  color: #2e526f;
  font-size: 12px;
}

.numbering-note {
  display: flex;
  margin: 0 20px 20px;
  padding: 11px 13px;
  align-items: flex-start;
  gap: 9px;
  color: #5f7182;
  background: #f3f7fa;
  border: 1px solid #dce7ef;
  border-radius: 6px;
}

.numbering-note .v-icon {
  flex: 0 0 auto;
  margin-top: 1px;
  color: #4c718f;
}

.numbering-note p {
  margin: 0;
  font-size: 10px;
  line-height: 1.55;
}

.card-actions {
  display: flex;
  min-height: 66px;
  padding: 12px 20px;
  align-items: center;
  justify-content: flex-end;
  gap: 9px;
  background: #fafbfc;
  border-top: 1px solid #e5e9ed;
}

.card-actions .v-btn {
  min-width: 150px;
  min-height: 36px;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0;
  border-radius: 5px;
}

@media (max-width: 700px) {
  .numbering-page {
    padding: 6px 8px 24px;
  }

  .numbering-hero {
    padding: 18px;
  }

  .numbering-hero h1 {
    font-size: 22px;
  }

  .counter-grid {
    grid-template-columns: 1fr;
    padding: 14px;
  }

  .numbering-note {
    margin: 0 14px 14px;
  }

  .card-actions {
    padding: 12px 14px;
  }
}

@media (max-width: 480px) {
  .numbering-hero {
    align-items: flex-start;
  }

  .counter-field {
    padding: 14px;
  }

  .counter-icon {
    display: none;
  }

  .card-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .card-actions .v-btn {
    width: 100%;
  }
}
</style>
