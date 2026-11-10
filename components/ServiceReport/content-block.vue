<template>
  <section v-if="block.type === 'section'" class="report-section">
    <h2 v-if="block.showHeader">
      {{ block.pointNumber }}. {{ block.section.point || "Point" }}
    </h2>
    <p v-if="block.showHeader && block.section.sub" class="section-subtitle">
      {{ block.section.sub }}
    </p>
    <div v-if="items.length" class="section-items">
      <div v-for="(item, itemIndex) in items" :key="itemIndex">
        <span>{{ itemLabel(block.itemOffset + itemIndex) }}.</span>
        <p>{{ item }}</p>
      </div>
    </div>
  </section>

  <section v-else-if="block.type === 'image-row'" class="report-gallery-row">
    <figure
      v-for="(image, imageIndex) in block.images"
      :key="image.id || imageIndex"
      class="report-photo"
    >
      <img
        :src="image.dataUrl"
        :alt="image.name || `Foto ${imageIndex + 1}`"
      />
    </figure>
  </section>

  <section v-else class="report-signatures" aria-label="Kolom tanda tangan">
    <div class="signature-main-row">
      <div class="signature-field">
        <span class="signature-line" />
        <strong>CHARGEHAND NAME / SIGNATURE</strong>
      </div>
      <div class="signature-field">
        <span class="signature-line" />
        <strong>CLIENT</strong>
      </div>
      <div class="signature-field signature-field--date">
        <span class="signature-line" />
        <strong>DATE</strong>
      </div>
    </div>

    <div class="signature-time-row">
      <div class="signature-time-field">
        <strong>TIME &amp; DATE COMMENCEMENT</strong>
        <span />
      </div>
      <div class="signature-time-field">
        <strong>COMPLETION</strong>
        <span />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { serviceReportRenderBlockM } from "~/types/invoice";

const props = defineProps<{ block: serviceReportRenderBlockM }>();

const items = computed(() =>
  props.block.type === "section"
    ? (props.block.section.items || []).filter((item) => item?.trim())
    : [],
);

function itemLabel(index: number) {
  return String.fromCharCode(97 + (index % 26));
}
</script>

<style scoped>
.report-section {
  break-inside: avoid;
}

.report-section h2 {
  margin: 0 0 3px;
  font-size: 12px;
  font-weight: 800;
}

.section-subtitle {
  margin: 0 0 2px;
}

.section-items {
  display: grid;
  gap: 1px;
  margin: 0;
  padding-left: 10px;
}

.section-items > div {
  display: grid;
  grid-template-columns: 15px minmax(0, 1fr);
  align-items: start;
}

.section-items span,
.section-items p {
  margin: 0;
}

.report-gallery-row {
  display: grid;
  height: var(--service-report-image-row-height, 170px);
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  break-inside: avoid;
}

.report-photo {
  box-sizing: border-box;
  height: 100%;
  margin: 0;
  overflow: hidden;
  border: 1px solid #aeb7c2;
  border-radius: 2px;
  background: #f3f4f6;
}

.report-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.report-signatures {
  padding-top: 16px;
  break-inside: avoid;
}

.signature-main-row {
  display: grid;
  grid-template-columns: 1.25fr 1.25fr 0.9fr;
  gap: 28px;
}

.signature-field {
  display: flex;
  min-width: 0;
  min-height: 105px;
  justify-content: flex-end;
  flex-direction: column;
}

.signature-line {
  width: 100%;
  border-top: 1.5px solid #111;
}

.signature-field strong {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
}

.signature-time-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 30px;
  margin-top: 50px;
}

.signature-time-field {
  display: flex;
  min-width: 0;
  align-items: flex-end;
  gap: 5px;
}

.signature-time-field strong {
  flex: 0 0 auto;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.2;
}

.signature-time-field span {
  min-width: 36px;
  flex: 1;
  border-bottom: 1.5px solid #111;
}
</style>
