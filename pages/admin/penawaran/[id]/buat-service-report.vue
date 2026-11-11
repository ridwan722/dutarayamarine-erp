<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { doc, getDoc } from "firebase/firestore";
import { useFirestore } from "vuefire";
import ServiceReportEditor from "~/components/Admin/Penawaran/dialog-service-report.vue";
import { queryambilid } from "~/composables/useFirestoreQuery";
import type { invoiceM, serviceReportM } from "~/types/invoice";
import type { penawaranM } from "~/types/penawaranModel";

definePageMeta({ layout: "admin" });

const route = useRoute();
const router = useRouter();
const db = useFirestore();
const penawaranStore = usePenawaranStore();
const invoiceStore = useinvoiceStore();
const quotationId = String(route.params.id || "");
const loading = ref(true);
const errorMessage = ref("");
const penawaran = ref<penawaranM | null>(null);
const sourceInvoiceId = ref("");
const isLeaving = ref(false);

const requestedInvoiceId = computed(() => {
  const value = route.query.invoiceId;
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
});
const requestedRevisionId = computed(() => {
  const value = route.query.revisi;
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
});

const returnTarget = computed(() =>
  sourceInvoiceId.value
    ? `/admin/invoice/${encodeURIComponent(sourceInvoiceId.value)}`
    : {
        path: `/admin/penawaran/${encodeURIComponent(quotationId)}`,
        query: requestedRevisionId.value
          ? { revisi: requestedRevisionId.value }
          : {},
      },
);

async function loadQuotation() {
  if (!quotationId) {
    errorMessage.value = "ID quotation tidak ditemukan.";
    loading.value = false;
    return;
  }

  try {
    const quotationSnapshot = await getDoc(doc(db, "penawaran", quotationId));
    if (!quotationSnapshot.exists()) {
      errorMessage.value = "Quotation tidak ditemukan.";
      return;
    }

    const rootQuotation = {
      ...quotationSnapshot.data(),
      id: quotationSnapshot.id,
      id_penawaran: quotationSnapshot.id,
    } as penawaranM;
    let quotation = rootQuotation;

    if (requestedRevisionId.value) {
      try {
        const revisionSnapshot = await getDoc(
          doc(
            db,
            "penawaran",
            quotationId,
            "revisi_penawaran",
            requestedRevisionId.value,
          ),
        );
        if (revisionSnapshot.exists()) {
          const revision = revisionSnapshot.data() as penawaranM;
          quotation = {
            ...rootQuotation,
            ...revision,
            id: quotationId,
            id_penawaran: quotationId,
            id_revisi: revision.id_revisi || revisionSnapshot.id,
            root_penawaran_id: quotationId,
            status: rootQuotation.status,
            revision_count: rootQuotation.revision_count,
            active_revision_id: rootQuotation.active_revision_id,
            active_revision_number: rootQuotation.active_revision_number,
            materialized_revision_id: rootQuotation.materialized_revision_id,
            materialized_revision_number:
              rootQuotation.materialized_revision_number,
            dokumen_spk: rootQuotation.dokumen_spk,
            tanggal_spk: rootQuotation.tanggal_spk,
            spk_at: rootQuotation.spk_at,
            spk_by: rootQuotation.spk_by,
          } as penawaranM;
        }
      } catch (error) {
        console.warn("Revisi quotation untuk Service Report belum dimuat:", error);
      }
    }

    let sourceInvoice: invoiceM | null = null;
    if (requestedInvoiceId.value) {
      try {
        const invoiceSnapshot = await getDoc(
          doc(db, "invoice", requestedInvoiceId.value),
        );
        if (invoiceSnapshot.exists()) {
          const invoice = {
            ...invoiceSnapshot.data(),
            id: invoiceSnapshot.id,
          } as invoiceM;
          if (String(invoice.id_penawaran || "") === quotationId) {
            sourceInvoice = invoice;
            sourceInvoiceId.value = invoiceSnapshot.id;
          }
        }
      } catch (error) {
        console.warn("Invoice asal Service Report belum dapat dimuat:", error);
      }
    }

    let existingReport = sourceInvoice
      ? sourceInvoice.service_report || quotation.service_report
      : quotation.service_report;
    if (!existingReport) {
      try {
        const linkedInvoices = (await queryambilid(
          `penawaran/${quotationId}/invoice`,
        )) as invoiceM[];
        existingReport = linkedInvoices.find((invoice) => invoice.service_report)
          ?.service_report;
      } catch (error) {
        console.warn("Daftar invoice quotation belum dapat dimuat:", error);
      }
    }
    if (existingReport) {
      quotation = { ...quotation, service_report: existingReport };
    }

    const expectedMode = existingReport ? "revisi" : "buat";
    if (route.query.mode !== expectedMode) {
      try {
        await router.replace({
          path: route.path,
          query: { ...route.query, mode: expectedMode },
        });
      } catch (error) {
        console.warn("Mode tab Service Report belum dapat diperbarui:", error);
      }
    }

    penawaran.value = quotation;
  } catch (error) {
    console.error("Gagal memuat quotation untuk Service Report:", error);
    errorMessage.value = "Quotation gagal dimuat. Silakan coba kembali.";
  } finally {
    loading.value = false;
  }
}

function leavePage() {
  if (isLeaving.value) return;
  isLeaving.value = true;
  void router.replace(returnTarget.value);
}

function handleSaved(report: serviceReportM) {
  if (penawaran.value) {
    penawaran.value = { ...penawaran.value, service_report: report };
    penawaranStore.$patch({
      detailPenawaran: { ...penawaran.value },
    });
  }

  if (
    sourceInvoiceId.value &&
    invoiceStore.getDetailInvoice.id === sourceInvoiceId.value
  ) {
    invoiceStore.$patch({
      detailInvoice: {
        ...invoiceStore.getDetailInvoice,
        service_report: report,
      },
    });
  }

  leavePage();
}

onMounted(loadQuotation);
</script>

<template>
  <div class="service-report-route">
    <div v-if="loading" class="service-report-route-state">
      <v-progress-circular indeterminate color="primary" size="34" />
      <span>Memuat quotation...</span>
    </div>

    <v-card v-else-if="errorMessage" class="service-report-route-error" flat>
      <v-alert type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>
      <v-btn
        variant="outlined"
        prepend-icon="mdi-arrow-left"
        class="text-none"
        @click="leavePage"
      >
        Kembali
      </v-btn>
    </v-card>

    <ServiceReportEditor
      v-else-if="penawaran"
      :penawaran="penawaran"
      :invoice-id="sourceInvoiceId"
      @saved="handleSaved"
      @cancel="leavePage"
    />
  </div>
</template>

<style scoped>
.service-report-route {
  width: 100%;
}

.service-report-route-state {
  display: flex;
  min-height: 420px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 14px;
  color: #64748b;
  font-size: 14px;
}

.service-report-route-error {
  max-width: 680px;
  margin: 36px auto;
  padding: 20px;
}
</style>
