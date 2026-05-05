<script>
  export default {
    props: {
      title: { type: String, default: 'No results found' },
      message: { type: String, default: 'Try adjusting your filters or check again later.' }
    }
  };
</script>

<template>
  <div class="text-center bg-white border rounded-4 p-5">
    <p class="display-6 mb-2" aria-hidden="true">◇</p>
    <h2 class="h4">{{ title }}</h2>
    <p class="text-muted mb-0">{{ message }}</p>
  </div>
</template>
