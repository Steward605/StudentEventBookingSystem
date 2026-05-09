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

    function resolveBreadcrumbTo(item) {
      if (!item?.to) {
        return null;
      }
      if (typeof item.to === 'function') {
        return item.to(route);
      }
      return item.to;
    }

    watch(() => route.fullPath, async () => {
      await nextTick();
      mainContent.value?.focus({ preventScroll: true });
    });

    return {mainContent, breadcrumbs, resolveBreadcrumbTo};
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
            <RouterLink v-if="resolveBreadcrumbTo(item) && index < breadcrumbs.length - 1" :to="resolveBreadcrumbTo(item)" class="app-breadcrumb-link">
              {{ item.label }}
            </RouterLink>
            <span v-else class="app-breadcrumb-current" :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined">
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