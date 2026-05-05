<script>
  import { computed, onMounted, ref } from 'vue';
  import StatCard from '@/components/StatCard.vue';
  import LoadingState from '@/components/LoadingState.vue';
  import { api } from '@/services/api';
  import { useAuthStore } from '@/stores/authStore';
  import { useBookingStore } from '@/stores/bookingStore';
  import { formatDate } from '@/utils/formatters';

  export default {
    components: {StatCard, LoadingState},
    setup() {
      const auth = useAuthStore();
      const bookingStore = useBookingStore();
      const stats = ref(null);
      const loading = ref(true);
      const error = ref('');
      const upcomingBookings = computed(() => {
        return bookingStore.bookings.filter(booking => booking.status === 'confirmed').slice(0, 3);
      });

      onMounted(async () => {
        try {
          const [statsData] = await Promise.all([
            api.get('/stats/overview'),
            bookingStore.fetchBookings()
          ]);
          stats.value = statsData.stats;
        } catch (err) {
          error.value = err.message;
        } finally {
          loading.value = false;
        }
      });

      return {auth, stats, loading, error, upcomingBookings, formatDate};
    }
  };
</script>

<template>
  <div class="container section-pad app-shell">
    <LoadingState v-if="loading" />
    <div v-else>
      <div class="row align-items-end mb-4">
        <div class="col-lg-8">
          <p class="text-primary fw-semibold mb-2">Dashboard</p>
          <h1 class="display-6 fw-bold">Welcome, {{ auth.user?.name }}</h1>
          <p class="text-muted mb-0">Track your event activity and quickly return to important actions.</p>
        </div>
        <div class="col-lg-4 text-lg-end mt-3 mt-lg-0">
          <RouterLink class="btn btn-primary" to="/events">Book another event</RouterLink>
        </div>
      </div>

      <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

      <div v-if="stats" class="row g-3 mb-4">
        <div class="col-md-6 col-xl-3">
          <StatCard label="My bookings" :value="stats.myBookings" helper="Confirmed bookings" />
        </div>
        <div class="col-md-6 col-xl-3">
          <StatCard label="My tickets" :value="stats.myTickets" helper="Total confirmed tickets" />
        </div>
        <div class="col-md-6 col-xl-3">
          <StatCard label="Upcoming" :value="stats.upcomingEvents" helper="Future booked events" />
        </div>
        <div class="col-md-6 col-xl-3">
          <StatCard label="Platform events" :value="stats.totalEvents" helper="Available in catalogue" />
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-7">
          <section class="card card-lift bg-white p-4" aria-labelledby="upcoming-title">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h2 id="upcoming-title" class="h4 mb-0">Recent bookings</h2>
              <RouterLink to="/history">View all</RouterLink>
            </div>
            <div v-if="upcomingBookings.length === 0" class="text-muted">No confirmed bookings yet.</div>
            <div v-for="booking in upcomingBookings" :key="booking.id" class="timeline-row mb-3">
              <p class="fw-semibold mb-1">{{ booking.title }}</p>
              <p class="small text-muted mb-0">{{ formatDate(booking.event_date) }} · {{ booking.ticket_count }} ticket(s)</p>
            </div>
          </section>
        </div>
        <div class="col-lg-5">
          <section class="card card-lift bg-white p-4" aria-labelledby="account-title">
            <h2 id="account-title" class="h4">Account snapshot</h2>
            <dl class="row mb-0">
              <dt class="col-4 text-muted">Email</dt>
              <dd class="col-8">{{ auth.user?.email }}</dd>
              <dt class="col-4 text-muted">Campus</dt>
              <dd class="col-8">{{ auth.user?.campus }}</dd>
              <dt class="col-4 text-muted">Role</dt>
              <dd class="col-8 text-capitalize">{{ auth.user?.role }}</dd>
            </dl>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
