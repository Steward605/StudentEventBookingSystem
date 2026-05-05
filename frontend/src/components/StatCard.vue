<script>
  export default {
    props: {
      label: { type: String, required: true },
      value: { type: [String, Number], required: true },
      helper: { type: String, default: '' }
    }
  };
</script>

<template>
  <div class="stat-card p-4 h-100">
    <p class="text-muted mb-1">{{ label }}</p>
    <p class="display-6 fw-bold mb-1">{{ value }}</p>
    <p v-if="helper" class="small text-muted mb-0">{{ helper }}</p>
  </div>
</template>
