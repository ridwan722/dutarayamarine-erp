<template>
  <section class="quotation-summary-section">
    <button
      type="button"
      class="summary-toggle"
      :class="{ 'summary-toggle--open': isSummaryVisible }"
      :aria-expanded="isSummaryVisible"
      aria-controls="quotation-summary-content"
      @click="isSummaryVisible = !isSummaryVisible"
    >
      <span class="summary-toggle-heading">
        <span class="summary-toggle-icon">
          <v-icon icon="mdi-chart-box-outline" size="18" />
        </span>
        <span>
          <strong>Quotation Summary</strong>
          <!-- <small>Nilai aktif dan distribusi status quotation</small> -->
        </span>
      </span>
      <span class="summary-toggle-action">
        {{ isSummaryVisible ? "Hide" : "Show" }}
        <v-icon
          :icon="isSummaryVisible ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          size="17"
        />
      </span>
    </button>

    <Transition name="summary-reveal">
      <div
        v-if="isSummaryVisible"
        id="quotation-summary-content"
        class="quotation-summary"
        aria-label="Ringkasan quotation"
      >
    <article class="summary-value-panel">
      <span class="summary-panel-glow" aria-hidden="true"></span>

      <header class="summary-value-header">
        <div class="summary-title-group">
          <span class="summary-brand-icon">
            <v-icon icon="mdi-chart-timeline-variant-shimmer" size="21" />
          </span>
          <div>
            <!-- <span class="summary-eyebrow">Quotation overview</span> -->
            <h2>Nilai quotation</h2>
          </div>
        </div>
        <span class="summary-live-badge">
          <i aria-hidden="true"></i>
          Live
        </span>
      </header>

      <div class="summary-value-body">
        <v-skeleton-loader
          v-if="loading"
          type="heading, text"
          class="summary-skeleton summary-skeleton--value"
        />
        <div v-else class="summary-currency-list">
          <div
            v-for="total in activeTotals"
            :key="total.currency"
            class="summary-currency"
            :title="formatFullAmount(total.amount, total.currency)"
          >
            <span>{{ total.currency }}</span>
            <strong>{{ formatAmount(total.amount, total.currency) }}</strong>
          </div>
        </div>
        <p>Akumulasi nilai selain quotation berstatus cancel.</p>
      </div>

      <footer class="summary-value-footer">
        <div class="summary-footer-stat">
          <span>Total quotation</span>
          <strong v-if="!loading">{{ quotations.length }}</strong>
          <span v-else class="summary-loading-dot"></span>
        </div>
        <div class="summary-footer-divider"></div>
        <div class="summary-footer-stat">
          <span>Quotation aktif</span>
          <strong v-if="!loading">{{ activeQuotations.length }}</strong>
          <span v-else class="summary-loading-dot"></span>
        </div>
        <div class="summary-footer-divider"></div>
        <div class="summary-footer-stat summary-footer-stat--month">
          <span>{{ currentMonthLabel }}</span>
          <strong v-if="!loading">{{ currentMonthCount }} baru</strong>
          <span v-else class="summary-loading-dot"></span>
        </div>
      </footer>
    </article>

    <article class="summary-pipeline-panel">
      <header class="summary-pipeline-header">
        <div>
          <!-- <span class="summary-eyebrow">Status distribution</span> -->
          <h2>Pipeline quotation</h2>
        </div>
        <span class="summary-total-badge">
          {{ loading ? "—" : quotations.length }} total
        </span>
      </header>

      <div class="summary-pipeline-body">
        <div class="summary-donut" :style="donutStyle">
          <div class="summary-donut-center">
            <strong>{{ loading ? "—" : `${conversionRate}%` }}</strong>
            <span>converted</span>
          </div>
        </div>

        <div class="summary-status-list">
          <div
            v-for="item in statusSummary"
            :key="item.label"
            class="summary-status-item"
          >
            <div class="summary-status-heading">
              <span>
                <i :class="`summary-dot--${item.tone}`"></i>
                {{ item.label }}
              </span>
              <strong>{{ loading ? "—" : item.count }}</strong>
            </div>
            <div class="summary-progress-track">
              <span
                :class="`summary-progress--${item.tone}`"
                :style="{ width: `${percentage(item.count)}%` }"
              ></span>
            </div>
            <span class="summary-status-caption">
              {{
                loading
                  ? "Memuat data"
                  : `${percentage(item.count)}% dari total`
              }}
            </span>
          </div>
        </div>
      </div>

      <footer class="summary-pipeline-footer">
        <span class="summary-insight-icon">
          <v-icon icon="mdi-lightning-bolt-outline" size="15" />
        </span>
        <p>
          <strong>{{ invoiceCount }} quotation</strong> sudah berhasil masuk ke
          tahap invoice.
        </p>
      </footer>
    </article>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const penawaranStore = usePenawaranStore();
const isSummaryVisible = ref(false);

const quotations = computed(() => penawaranStore.getDataPenawaranTampil);

function normalizedStatus(status: string | null | undefined) {
  return String(status || "").trim().toUpperCase();
}

const draftCount = computed(
  () =>
    quotations.value.filter(
      (quotation) => normalizedStatus(quotation.status) === "DRAFT",
    ).length,
);

const invoiceCount = computed(
  () =>
    quotations.value.filter(
      (quotation) => normalizedStatus(quotation.status) === "INVOICE",
    ).length,
);

const cancelledCount = computed(
  () =>
    quotations.value.filter(
      (quotation) => normalizedStatus(quotation.status) === "CANCEL",
    ).length,
);

const activeQuotations = computed(() =>
  quotations.value.filter(
    (quotation) => normalizedStatus(quotation.status) !== "CANCEL",
  ),
);

const currentDate = new Date();
const currentMonthKey = `${currentDate.getFullYear()}-${String(
  currentDate.getMonth() + 1,
).padStart(2, "0")}`;

const currentMonthLabel = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
}).format(currentDate);

const currentMonthCount = computed(
  () =>
    quotations.value.filter((quotation) =>
      String(quotation.tanggal_penawaran || "").startsWith(currentMonthKey),
    ).length,
);

const activeTotals = computed(() => {
  const totals = new Map<string, number>();

  activeQuotations.value.forEach((quotation) => {
    const currency = String(quotation.currency || "IDR").toUpperCase();
    totals.set(
      currency,
      (totals.get(currency) || 0) +
        (Number(quotation.grand_total_penawaran) || 0),
    );
  });

  if (!totals.size) totals.set("IDR", 0);

  const currencyOrder = ["IDR", "USD", "SGD"];
  return [...totals.entries()]
    .sort(([left], [right]) => {
      const leftIndex = currencyOrder.indexOf(left);
      const rightIndex = currencyOrder.indexOf(right);
      return (
        (leftIndex < 0 ? 99 : leftIndex) -
        (rightIndex < 0 ? 99 : rightIndex)
      );
    })
    .map(([currency, amount]) => ({ currency, amount }));
});

const statusSummary = computed(() => [
  {
    label: "Draft",
    count: draftCount.value,
    tone: "draft",
  },
  {
    label: "Invoice",
    count: invoiceCount.value,
    tone: "invoice",
  },
  {
    label: "Cancel",
    count: cancelledCount.value,
    tone: "cancel",
  },
]);

const conversionRate = computed(() => percentage(invoiceCount.value));

const donutStyle = computed<Record<string, string>>(() => {
  const draftEnd = percentage(draftCount.value);
  const invoiceEnd = draftEnd + percentage(invoiceCount.value);
  const cancelEnd = invoiceEnd + percentage(cancelledCount.value);

  return {
    "--draft-end": `${draftEnd}%`,
    "--invoice-end": `${invoiceEnd}%`,
    "--cancel-end": `${Math.min(cancelEnd, 100)}%`,
  };
});

function percentage(count: number) {
  if (!quotations.value.length) return 0;
  return Math.round((count / quotations.value.length) * 100);
}

function formatAmount(value: number, currency: string) {
  const normalizedCurrency = currency.toUpperCase();
  const isRupiah = normalizedCurrency === "IDR";
  const symbols: Record<string, string> = {
    IDR: "Rp",
    USD: "US$",
    SGD: "S$",
  };
  const amount = new Intl.NumberFormat(isRupiah ? "id-ID" : "en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);

  return `${symbols[normalizedCurrency] || normalizedCurrency} ${amount}`;
}

function formatFullAmount(value: number, currency: string) {
  const normalizedCurrency = currency.toUpperCase();
  const isRupiah = normalizedCurrency === "IDR";
  const symbols: Record<string, string> = {
    IDR: "Rp",
    USD: "US$",
    SGD: "S$",
  };
  const amount = new Intl.NumberFormat(isRupiah ? "id-ID" : "en-US", {
    minimumFractionDigits: isRupiah ? 0 : 2,
    maximumFractionDigits: isRupiah ? 0 : 2,
  }).format(value);

  return `${symbols[normalizedCurrency] || normalizedCurrency} ${amount}`;
}
</script>

<style scoped>
.quotation-summary-section {
  margin-bottom: 16px;
}

.summary-toggle {
  display: flex;
  width: 100%;
  min-height: 48px;
  padding: 7px 11px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #344454;
  font: inherit;
  text-align: left;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #dfe4e8;
  border-radius: 8px;
  box-shadow: 0 2px 7px rgba(30, 49, 66, 0.035);
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.summary-toggle:hover {
  background: #fafcfd;
  border-color: #cdd8e1;
  box-shadow: 0 4px 11px rgba(30, 49, 66, 0.055);
}

.summary-toggle--open {
  background: #f8fafc;
  border-color: #d4dee6;
}

.summary-toggle-heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.summary-toggle-heading > span:last-child {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.summary-toggle-icon {
  display: grid;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  place-items: center;
  color: #315f8c;
  background: #eaf1f7;
  border-radius: 6px;
}

.summary-toggle-heading strong {
  color: #314151;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.35;
}

.summary-toggle-heading small {
  margin-top: 1px;
  overflow: hidden;
  color: #8d98a3;
  font-size: 8.5px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-toggle-action {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 3px;
  color: #627486;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.025em;
}

.quotation-summary {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(430px, 0.85fr);
  gap: 12px;
  margin-top: 9px;
}

.summary-reveal-enter-active,
.summary-reveal-leave-active {
  overflow: hidden;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.summary-reveal-enter-from,
.summary-reveal-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.summary-value-panel,
.summary-pipeline-panel {
  position: relative;
  min-width: 0;
  min-height: 228px;
  overflow: hidden;
  border-radius: 10px;
}

.summary-value-panel {
  display: flex;
  padding: 20px 22px 0;
  color: #ffffff;
  flex-direction: column;
  background:
    radial-gradient(circle at 86% 14%, rgba(117, 178, 226, 0.24), transparent 28%),
    linear-gradient(135deg, #1d3d5d 0%, #285b83 58%, #2f6e9d 100%);
  border: 1px solid rgba(23, 62, 94, 0.25);
  box-shadow: 0 9px 22px rgba(35, 76, 110, 0.13);
}

.summary-panel-glow {
  position: absolute;
  top: -90px;
  right: -38px;
  width: 230px;
  height: 230px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 50%;
  pointer-events: none;
}

.summary-panel-glow::before,
.summary-panel-glow::after {
  position: absolute;
  content: "";
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: inherit;
}

.summary-panel-glow::before { inset: 27px; }
.summary-panel-glow::after { inset: 55px; }

.summary-value-header,
.summary-pipeline-header {
  display: flex;
  position: relative;
  z-index: 1;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.summary-title-group {
  display: flex;
  align-items: center;
  gap: 11px;
}

.summary-brand-icon {
  display: grid;
  flex: 0 0 39px;
  width: 39px;
  height: 39px;
  place-items: center;
  color: #d9edff;
  background: rgba(255, 255, 255, 0.11);
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 8px;
  backdrop-filter: blur(6px);
}

.summary-eyebrow {
  display: block;
  color: rgba(255, 255, 255, 0.56);
  font-size: 8px;
  font-weight: 750;
  letter-spacing: 0.105em;
  line-height: 1.4;
  text-transform: uppercase;
}

.summary-value-header h2,
.summary-pipeline-header h2 {
  margin: 2px 0 0;
  color: #ffffff;
  font-size: 13px;
  font-weight: 650;
  letter-spacing: -0.01em;
  line-height: 1.25;
}

.summary-live-badge {
  display: inline-flex;
  height: 24px;
  padding: 0 9px;
  align-items: center;
  gap: 6px;
  color: #d9efff;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
}

.summary-live-badge i {
  width: 6px;
  height: 6px;
  background: #79d6aa;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(121, 214, 170, 0.13);
}

.summary-value-body {
  position: relative;
  z-index: 1;
  margin: 21px 0 16px;
}

.summary-currency-list {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px 30px;
}

.summary-currency {
  display: flex;
  min-width: 112px;
  flex-direction: column;
}

.summary-currency span {
  color: rgba(255, 255, 255, 0.57);
  font-size: 8px;
  font-weight: 750;
  letter-spacing: 0.1em;
}

.summary-currency strong {
  margin-top: 2px;
  color: #ffffff;
  font-size: clamp(20px, 2vw, 27px);
  font-weight: 720;
  letter-spacing: -0.035em;
  line-height: 1.15;
}

.summary-value-body p {
  margin: 7px 0 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 8.5px;
}

.summary-value-footer {
  display: flex;
  position: relative;
  z-index: 1;
  min-height: 52px;
  margin: auto -22px 0;
  padding: 0 22px;
  align-items: center;
  gap: 18px;
  background: rgba(8, 32, 52, 0.18);
  border-top: 1px solid rgba(255, 255, 255, 0.09);
}

.summary-footer-stat {
  display: flex;
  min-width: 78px;
  flex-direction: column;
}

.summary-footer-stat span {
  color: rgba(255, 255, 255, 0.47);
  font-size: 7.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.summary-footer-stat strong {
  margin-top: 1px;
  color: #ffffff;
  font-size: 11px;
  font-weight: 650;
}

.summary-footer-stat--month { margin-left: auto; }

.summary-footer-divider {
  width: 1px;
  height: 23px;
  background: rgba(255, 255, 255, 0.11);
}

.summary-loading-dot {
  width: 30px;
  height: 8px;
  margin-top: 4px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 3px;
}

.summary-pipeline-panel {
  padding: 19px 20px 0;
  background: #ffffff;
  border: 1px solid #dde3e8;
  box-shadow: 0 5px 18px rgba(30, 49, 66, 0.045);
}

.summary-pipeline-header .summary-eyebrow { color: #9aa4af; }

.summary-pipeline-header h2 {
  color: #273747;
  font-size: 14px;
}

.summary-total-badge {
  padding: 4px 8px;
  color: #647382;
  font-size: 8px;
  font-weight: 700;
  background: #f2f5f7;
  border: 1px solid #e4e9ed;
  border-radius: 5px;
}

.summary-pipeline-body {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 21px;
  margin-top: 17px;
  align-items: center;
}

.summary-donut {
  display: grid;
  position: relative;
  width: 108px;
  height: 108px;
  place-items: center;
  background: conic-gradient(
    #d49a44 0 var(--draft-end),
    #31836b var(--draft-end) var(--invoice-end),
    #bd6262 var(--invoice-end) var(--cancel-end),
    #e9edf1 var(--cancel-end) 100%
  );
  border-radius: 50%;
  transform: rotate(-90deg);
}

.summary-donut::after {
  position: absolute;
  width: 73px;
  height: 73px;
  content: "";
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(31, 57, 78, 0.035);
}

.summary-donut-center {
  display: flex;
  position: relative;
  z-index: 1;
  align-items: center;
  flex-direction: column;
  transform: rotate(90deg);
}

.summary-donut-center strong {
  color: #263746;
  font-size: 18px;
  font-weight: 750;
  letter-spacing: -0.03em;
  line-height: 1;
}

.summary-donut-center span {
  margin-top: 3px;
  color: #9aa4ad;
  font-size: 7px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.summary-status-list {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 9px;
}

.summary-status-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.summary-status-heading > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #536170;
  font-size: 9px;
  font-weight: 650;
}

.summary-status-heading i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.summary-status-heading strong {
  color: #344454;
  font-size: 10px;
  font-weight: 750;
}

.summary-dot--draft,
.summary-progress--draft { background: #d49a44; }
.summary-dot--invoice,
.summary-progress--invoice { background: #31836b; }
.summary-dot--cancel,
.summary-progress--cancel { background: #bd6262; }

.summary-progress-track {
  height: 3px;
  margin-top: 4px;
  overflow: hidden;
  background: #edf0f2;
  border-radius: 99px;
}

.summary-progress-track > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width 0.35s ease;
}

.summary-status-caption {
  display: block;
  margin-top: 2px;
  color: #a0a8b1;
  font-size: 7.5px;
}

.summary-pipeline-footer {
  display: flex;
  min-height: 39px;
  margin: 13px -20px 0;
  padding: 0 20px;
  align-items: center;
  gap: 7px;
  background: #fafbfc;
  border-top: 1px solid #edf0f2;
}

.summary-insight-icon {
  display: grid;
  width: 23px;
  height: 23px;
  place-items: center;
  color: #557d9f;
  background: #eaf1f6;
  border-radius: 5px;
}

.summary-pipeline-footer p {
  margin: 0;
  color: #808b96;
  font-size: 8px;
}

.summary-pipeline-footer strong {
  color: #526271;
  font-weight: 700;
}

.summary-skeleton {
  background: transparent !important;
}

.summary-skeleton--value {
  width: 230px;
  max-width: 100%;
  filter: invert(1);
  opacity: 0.35;
}

@media (max-width: 1050px) {
  .quotation-summary {
    grid-template-columns: 1fr;
  }

  .summary-pipeline-panel { min-height: 220px; }
  .summary-pipeline-body { grid-template-columns: 120px minmax(0, 1fr); }
}

@media (max-width: 599px) {
  .summary-toggle { min-height: 45px; }
  .summary-toggle-heading small { display: none; }
  .summary-toggle-action { font-size: 0; }
  .quotation-summary { gap: 9px; }

  .summary-value-panel,
  .summary-pipeline-panel {
    min-height: 0;
    border-radius: 8px;
  }

  .summary-value-panel { padding: 16px 16px 0; }
  .summary-value-body { margin: 20px 0 16px; }
  .summary-currency-list { gap: 11px 20px; }
  .summary-currency strong { font-size: 21px; }

  .summary-value-footer {
    margin-inline: -16px;
    padding-inline: 16px;
    gap: 10px;
  }

  .summary-footer-stat { min-width: 0; }
  .summary-footer-stat--month { text-align: right; }

  .summary-pipeline-panel { padding: 16px 16px 0; }
  .summary-pipeline-body {
    grid-template-columns: 88px minmax(0, 1fr);
    gap: 15px;
  }

  .summary-donut {
    width: 86px;
    height: 86px;
  }

  .summary-donut::after {
    width: 58px;
    height: 58px;
  }

  .summary-donut-center strong { font-size: 15px; }

  .summary-pipeline-footer {
    margin-inline: -16px;
    padding-inline: 16px;
  }
}

@media (max-width: 380px) {
  .summary-footer-divider { display: none; }
  .summary-value-footer { justify-content: space-between; }
  .summary-footer-stat:nth-child(3) { display: none; }
}
</style>
