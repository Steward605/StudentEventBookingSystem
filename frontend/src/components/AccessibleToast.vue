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
  <Teleport to="body">
    <Transition name="global-toast-fade">
      <div v-if="auth.message" class="global-toast" role="status" aria-live="polite" aria-atomic="true">
        <span class="global-toast-text">{{ auth.message }}</span>

        <button type="button" class="global-toast-close" aria-label="Close notification" @click="auth.clearMessage">
          ×
        </button>
      </div>
    </Transition>
  </Teleport>
</template>