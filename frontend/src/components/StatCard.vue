<script>
export default {
  props: {
    label: {type: String, required: true},
    value: {type: [String, Number], required: true},
    helper: {type: String, default: ''},
    tone: {type: String, default: 'primary'}
  }
};
</script>

<template>
  <article :class="['stat-card stat-card-modern h-100', `stat-card-${tone}`]" :aria-label="`${label}: ${value}`">
    <p class="stat-card-label">{{ label }}</p>
    <p class="stat-card-value">{{ value }}</p>
    <p v-if="helper" class="stat-card-helper">{{ helper }}</p>
  </article>
</template>