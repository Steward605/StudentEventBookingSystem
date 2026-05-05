<script>
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/authStore';
  export default {
    setup() {
      const auth = useAuthStore();
      const router = useRouter();
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

      function logout() {
        auth.logout();
        router.push('/');
      }

      return {auth, navLinks, logout};
    }
  };
</script>

<template>
  <nav class="navbar navbar-expand-lg bg-white border-bottom sticky-top" aria-label="Main navigation">
    <div class="container py-2">
      <RouterLink class="navbar-brand d-flex align-items-center gap-2" :to="auth.isAdmin ? '/admin' : '/'" aria-label="Student Event Booking System home">
        <span class="rounded-3 bg-primary text-white px-2 py-1 fw-bold">SEB</span>
        <strong>Student Event Booking System</strong>
      </RouterLink>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div id="mainNav" class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li v-for="link in navLinks" :key="link.to" class="nav-item">
            <RouterLink class="nav-link" :to="link.to">{{ link.label }}</RouterLink>
          </li>
        </ul>

        <div class="d-flex flex-column flex-lg-row gap-2 align-items-lg-center">
          <span v-if="auth.isAuthenticated" class="small text-muted">{{ auth.user?.name }}</span>
          <template v-if="auth.isAuthenticated">
            <button class="btn btn-outline-primary btn-sm" type="button" @click="logout">Log out</button>
          </template>
          <template v-else>
            <RouterLink class="btn btn-outline-primary btn-sm" to="/login">Log in</RouterLink>
            <RouterLink class="btn btn-primary btn-sm" to="/register">Register</RouterLink>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>