<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

export default {
  setup() {
    const route = useRoute();

    const adminNavItems = [
      {
        label: 'Overview',
        to: '/admin',
        activeRouteNames: ['admin-dashboard']
      },
      {
        label: 'Events',
        to: '/admin/events',
        activeRouteNames: ['admin-events', 'edit-event']
      },
      {
        label: 'Create event',
        to: '/admin/events/create',
        activeRouteNames: ['create-event']
      },
      {
        label: 'Bookings',
        to: '/admin/bookings',
        activeRouteNames: ['admin-bookings']
      },
      {
        label: 'Users',
        to: '/admin/users',
        activeRouteNames: ['admin-users']
      }
    ];

    function isActive(item) {
      return item.activeRouteNames.includes(route.name);
    }

    const currentPage = computed(() => {
      return adminNavItems.find(item => isActive(item)) || adminNavItems[0];
    });

    return {
      adminNavItems,
      currentPage,
      isActive
    };
  }
};
</script>

<template>
  <div class="admin-layout-shell">
    <aside class="admin-sidebar" aria-label="Admin navigation">
      <section class="admin-sidebar-card" aria-labelledby="admin-sidebar-title">
        <div class="admin-sidebar-header">
          <p class="admin-sidebar-kicker mb-2">Admin dashboard</p>

          <h2 id="admin-sidebar-title" class="admin-sidebar-title">
            {{ currentPage.label }}
          </h2>
        </div>

        <nav class="admin-sidebar-nav" aria-label="Admin pages">
          <RouterLink
            v-for="item in adminNavItems"
            :key="item.to"
            :to="item.to"
            :aria-current="isActive(item) ? 'page' : undefined"
            :class="['admin-sidebar-link', { 'admin-sidebar-link-active': isActive(item) }]"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </section>
    </aside>

    <main class="admin-layout-main">
      <RouterView />
    </main>
  </div>
</template>