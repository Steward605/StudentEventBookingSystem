<script>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

export default {
  setup() {
    const auth = useAuthStore();
    const route = useRoute();
    const router = useRouter();
    const isMenuOpen = ref(false);

    const navLinks = computed(() => {
      if (auth.isAdmin) {
        return [
          { to: '/admin', label: 'Admin Dashboard' },
          { to: '/admin/events', label: 'Manage Events' },
          { to: '/admin/bookings', label: 'Bookings' },
          { to: '/admin/events/create', label: 'Create Event' },
          { to: '/events', label: 'Public Site' },
          { to: '/profile', label: 'Profile' }
        ];
      }

      return [
        { to: '/', label: 'Home' },
        { to: '/events', label: 'Events' },
        ...(auth.isAuthenticated ? [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/history', label: 'History' },
          { to: '/profile', label: 'Profile' }
        ] : [])
      ];
    });

    const homePath = computed(() => auth.isAdmin ? '/admin' : '/');
    const userInitial = computed(() => auth.user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U');
    const userLabel = computed(() => auth.user?.name || 'Signed in user');

    function toggleMenu() {
      isMenuOpen.value = !isMenuOpen.value;
    }

    function closeMenu() {
      isMenuOpen.value = false;
    }

    function logout() {
      auth.logout();
      closeMenu();
      router.push('/');
    }

    watch(() => route.fullPath, closeMenu);

    return {auth, navLinks, homePath, userInitial, userLabel, isMenuOpen, toggleMenu, closeMenu, logout};
  }
};
</script>

<template>
  <nav class="navbar navbar-expand-lg app-navbar sticky-top" aria-label="Primary navigation" @keydown.esc="closeMenu">
    <div class="container navbar-container">
      <RouterLink class="navbar-brand app-brand" :to="homePath" aria-label="Student Event Booking System home" @click="closeMenu">
        <span class="brand-mark">SEB</span>
        <span class="brand-copy">
          <strong>Student Event</strong>
          <span>Booking System</span>
        </span>
      </RouterLink>

      <button class="navbar-toggler app-navbar-toggler" type="button" aria-controls="primaryNav" :aria-expanded="isMenuOpen ? 'true' : 'false'" aria-label="Toggle primary navigation" @click="toggleMenu">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div id="primaryNav" :class="['collapse navbar-collapse navbar-menu', { show: isMenuOpen }]">
        <ul class="navbar-nav app-nav-list me-auto mb-3 mb-lg-0">
          <li v-for="link in navLinks" :key="link.to" class="nav-item">
            <RouterLink v-slot="{ href, navigate, isActive }" :to="link.to" custom>
              <a :href="href" :class="['nav-link app-nav-link', { active: isActive }]" :aria-current="isActive ? 'page' : undefined" @click="navigate">
                {{ link.label }}
              </a>
            </RouterLink>
          </li>
        </ul>

        <div class="nav-actions">
          <div v-if="auth.isAuthenticated" class="user-chip" aria-label="Current user">
            <span class="user-avatar" aria-hidden="true">{{ userInitial }}</span>
            <span class="user-name">{{ userLabel }}</span>
          </div>

          <button v-if="auth.isAuthenticated" class="btn btn-outline-primary btn-sm btn-pill" type="button" @click="logout">Log out</button>

          <template v-else>
            <RouterLink class="btn btn-outline-primary btn-sm btn-pill" to="/login" @click="closeMenu">Log in</RouterLink>
            <RouterLink class="btn btn-primary btn-sm btn-pill" to="/register" @click="closeMenu">Register</RouterLink>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>