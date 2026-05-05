<script>
import { nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppNavbar from './components/AppNavbar.vue';
import AppFooter from './components/AppFooter.vue';
import AccessibleToast from './components/AccessibleToast.vue';

export default {
  components: {AppNavbar, AppFooter, AccessibleToast},
  setup() {
    const route = useRoute();
    const mainContent = ref(null);

    watch(() => route.fullPath, async () => {
      await nextTick();
      mainContent.value?.focus({ preventScroll: true });
    });

    return {mainContent};
  }
};
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <AppNavbar />
  <main id="main-content" ref="mainContent" class="app-shell" tabindex="-1">
    <RouterView />
  </main>
  <AccessibleToast />
  <AppFooter />
</template>