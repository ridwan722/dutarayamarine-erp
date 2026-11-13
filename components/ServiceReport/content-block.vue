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
      :class="{ 'report-photo--first-column': imageIndex % 2 === 0 }"
    >
      <div class="report-photo-image-frame">
        <img
          v-if="!image.isPlaceholder"
          :src="image.dataUrl"
          :alt="image.description || image.name || `Foto ${imageIndex + 1}`"
        />
      </div>
      <figcaption class="report-photo-caption">
        {{ image.description || "" }}
      </figcaption>
    </figure>
  </section>

  <section v-else class="report-signatures" aria-label="Kolom tanda tangan">
    <p class="signature-date">{{ props.signatureDate }}</p>

    <div class="signature-company-row">
      <strong>PT. Duta Raya Marine</strong>
      <strong>PT. Limin Marine and Offshore</strong>
    </div>

    <div class="signature-fields-row">
      <div class="signature-party">
        <span class="signature-line" />
        <div class="signature-details">
          <span>Name</span><span>:</span><span class="font-weight-bold">{{ props.technicianName }}</span>
          <span>Title</span><span>:</span><span class="font-weight-bold">{{ props.technicianTitle }}</span>
        </div>
      </div>
      <div class="signature-party">
        <span class="signature-line" />
        <div class="signature-details">
          <span>Name</span><span>:</span><span />
          <span>Title</span><span>:</span><span />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { serviceReportRenderBlockM } from "~/types/invoice";

const props = withDefaults(
  defineProps<{
    block: serviceReportRenderBlockM;
    signatureDate?: string;
    technicianName?: string;
    technicianTitle?: string;
  }>(),
  { signatureDate: "", technicianName: "", technicianTitle: "" },
);

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
  box-sizing: border-box;
  height: calc(var(--service-report-image-row-height, 230px) + 30px);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  overflow: hidden;
  border: 1.5px solid #111;
  break-inside: avoid;
}

.report-photo {
  box-sizing: border-box;
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  margin: 0;
  overflow: hidden;
  background: #fff;
}

.report-photo--first-column {
  border-right: 1.5px solid #111;
}

.report-photo-caption {
  display: flex;
  box-sizing: border-box;
  min-width: 0;
  height: 30px;
  flex: 0 0 30px;
  padding: 2px 8px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-top: 1.5px solid #111;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.15;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-photo-image-frame {
  display: flex;
  width: 100%;
  height: 0;
  flex: 1 1 0;
  min-height: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #fff;
}

.report-photo img {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
}

.report-signatures {
  padding: 14px 0 0;
  break-inside: avoid;
}

.signature-date {
  margin: 0;
  font-size: 12px;
}

.signature-company-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 30px;
  margin-top: 17px;
}

.signature-company-row strong {
  font-size: 15px;
  font-weight: 800;
}

.signature-fields-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 30px;
  margin-top: 5px;
}

.signature-party {
  display: flex;
  min-width: 0;
  min-height: 180px;
  justify-content: flex-end;
  flex-direction: column;
}

.signature-line {
  width: 100%;
  border-top: 1.5px solid #111;
}

.signature-details {
  display: grid;
  grid-template-columns: 72px 12px minmax(0, 1fr);
  column-gap: 3px;
  row-gap: 1px;
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.65;
}

.signature-details span:nth-child(3n + 1) {
  white-space: nowrap;
}
</style>
