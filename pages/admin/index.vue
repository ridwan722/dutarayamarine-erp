<script setup lang="ts">
import DashboardOverview from "~/components/dashboard/DashboardOverview.vue";

definePageMeta({ layout: "admin" });

// Recover when a new deployment invalidates a lazily loaded JS chunk.
onErrorCaptured((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("Failed to load module script")
  ) {
    window.location.reload();
    return false;
  }
});
</script>

<template>
  <DashboardOverview />
</template>
