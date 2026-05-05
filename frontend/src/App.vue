<script>
  import AppNavbar from './components/AppNavbar.vue';
  import AppFooter from './components/AppFooter.vue';
  import AccessibleToast from './components/AccessibleToast.vue';
  export default {
    components: {
      AppNavbar,
      AppFooter,
      AccessibleToast
    }
  };
</script>

<template>
  <AppNavbar />
  <main id="main-content" tabindex="-1">
    <RouterView />
  </main>
  <AccessibleToast />
  <AppFooter />
</template>
