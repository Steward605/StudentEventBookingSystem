<script>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

export default {
  setup() {
    const auth = useAuthStore();
    const route = useRoute();
    const router = useRouter();
    const isMenuOpen = ref(false);
    const isAccountMenuOpen = ref(false);
    const accountMenuRef = ref(null);
    const navLinks = computed(() => {
      if (auth.isAdmin) {
        return [
          { to: '/admin/events', label: 'Manage Events' },
          { to: '/admin/bookings', label: 'Bookings' },
          { to: '/admin/events/create', label: 'Create Event' },
          { to: '/events', label: 'Public Site' }
        ];
      }

      return [
        { to: '/', label: 'Home' },
        { to: '/events', label: 'Events' }
      ];
    });

    const accountLinks = computed(() => {
      if (!auth.isAuthenticated) {
        return [];
      }
      if (auth.isAdmin) {
        return [
          { to: '/admin', label: 'Admin Dashboard' },
          { to: '/profile', label: 'Profile Settings' }
        ];
      }
      return [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/history', label: 'Booking History' },
        { to: '/profile', label: 'Profile Settings' }
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

    function toggleAccountMenu() {
      isAccountMenuOpen.value = !isAccountMenuOpen.value;
    }

    function closeAccountMenu() {
      isAccountMenuOpen.value = false;
    }

    function handleDocumentClick(event) {
      if (!isAccountMenuOpen.value) {
        return;
      }
      const menuRoot = accountMenuRef.value;
      if (menuRoot && !menuRoot.contains(event.target)) {
        closeAccountMenu();
      }
    }

    function closeAllMenus() {
      closeMenu();
      closeAccountMenu();
    }

    function logout() {
      auth.logout();
      closeAllMenus();
      router.push('/');
    }

    watch(() => route.fullPath, closeAllMenus);
    onMounted(() => {
      document.addEventListener('click', handleDocumentClick);
      document.addEventListener('touchstart', handleDocumentClick);
    });
    onBeforeUnmount(() => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('touchstart', handleDocumentClick);
    });

    return {auth, navLinks, accountLinks, homePath, userInitial, userLabel, isMenuOpen, isAccountMenuOpen, accountMenuRef, toggleMenu, closeMenu, toggleAccountMenu, closeAccountMenu, closeAllMenus, logout};
  }
};
</script>

<template>
  <nav class="navbar navbar-expand-lg app-navbar sticky-top" aria-label="Primary navigation" @keydown.esc="closeAllMenus">
    <div class="container navbar-container">
      <RouterLink class="navbar-brand app-brand" :to="homePath" aria-label="Student Event Booking System home" @click="closeAllMenus">
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
          <div v-if="auth.isAuthenticated" ref="accountMenuRef" class="account-menu-wrap">
            <button type="button" class="user-chip account-menu-trigger" :aria-expanded="isAccountMenuOpen ? 'true' : 'false'" aria-haspopup="true" @click="toggleAccountMenu">
              <span class="user-avatar" aria-hidden="true">{{ userInitial }}</span>
              <span class="user-name">{{ userLabel }}</span>
              <span class="account-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div v-if="isAccountMenuOpen" class="account-dropdown" role="menu">
              <p class="account-dropdown-kicker">Account menu</p>
              <RouterLink v-for="link in accountLinks" :key="link.to" class="account-dropdown-item" :to="link.to" role="menuitem" @click="closeAllMenus">
                {{ link.label }}
              </RouterLink>
              <div class="account-dropdown-divider"></div>
              <button class="account-dropdown-item account-dropdown-danger" type="button" role="menuitem" @click="logout">
                Log out
              </button>
            </div>
          </div>

          <template v-else>
            <RouterLink class="btn btn-outline-primary btn-sm btn-pill" to="/login" @click="closeAllMenus">Log in</RouterLink>
            <RouterLink class="btn btn-primary btn-sm btn-pill" to="/register" @click="closeAllMenus">Register</RouterLink>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>