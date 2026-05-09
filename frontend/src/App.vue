<script>
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppNavbar from './components/AppNavbar.vue';
import AppFooter from './components/AppFooter.vue';
import AccessibleToast from './components/AccessibleToast.vue';

export default {
  components: {AppNavbar, AppFooter, AccessibleToast},
  setup() {
    const route = useRoute();
    const mainContent = ref(null);
    const breadcrumbs = computed(() => {
      if (Array.isArray(route.meta.breadcrumbs)) {
        return route.meta.breadcrumbs;
      }
      return route.matched
        .filter(record => record.meta?.breadcrumb)
        .map(record => ({
          label: record.meta.breadcrumb,
          to: record.path
        }));
    });

    watch(() => route.fullPath, async () => {
      await nextTick();
      mainContent.value?.focus({ preventScroll: true });
    });

    return {mainContent, breadcrumbs};
  }
};
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <AppNavbar />
  <main id="main-content" ref="mainContent" class="app-shell" tabindex="-1">
    <nav v-if="breadcrumbs.length > 1" class="app-breadcrumbs" aria-label="Breadcrumb">
      <div class="container">
        <ol class="app-breadcrumb-list">
          <li v-for="(item, index) in breadcrumbs" :key="`${item.label}-${index}`" class="app-breadcrumb-item">
            <RouterLink v-if="item.to && index < breadcrumbs.length - 1" :to="item.to" class="app-breadcrumb-link">
              {{ item.label }}
            </RouterLink>
            <span v-else class="app-breadcrumb-current" aria-current="page">
              {{ item.label }}
            </span>
          </li>
        </ol>
      </div>
    </nav>
    <RouterView />
  </main>
  <AccessibleToast />
  <AppFooter />
</template>