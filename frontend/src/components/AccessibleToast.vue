<script>
  import { watch } from 'vue';
  import { useAuthStore } from '@/stores/authStore';
  export default {
    setup() {
      const auth = useAuthStore();
      watch(() => auth.message, value => {
        if (value) {
          window.setTimeout(() => auth.clearMessage(), 3500);
        }
      });

      return { auth };
    }
  };
</script>

<template>
  <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 1080">
    <div v-if="auth.message" class="toast show align-items-center text-bg-primary border-0" role="status" aria-live="polite" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">{{ auth.message }}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Close" @click="auth.clearMessage"></button>
      </div>
    </div>
  </div>
</template>
