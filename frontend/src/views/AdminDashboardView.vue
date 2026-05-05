<script>
  import { onMounted, ref } from 'vue';
  import StatCard from '@/components/StatCard.vue';
  import LoadingState from '@/components/LoadingState.vue';
  import { api } from '@/services/api';
  import { formatDate } from '@/utils/formatters';

  export default {
    components: {StatCard, LoadingState},
    setup() {
      const stats = ref(null);
      const recentBookings = ref([]);
      const loading = ref(true);
      const error = ref('');
      onMounted(async () => {
        try {
          const data = await api.get('/stats/admin-overview');
          stats.value = data.stats;
          recentBookings.value = data.recentBookings;
        } catch (err) {
          error.value = err.message;
        } finally {
          loading.value = false;
        }
      });

      return {stats, recentBookings, loading, error, formatDate};
    }
  };
</script>

<template>
  <div class="container section-pad app-shell">
    <LoadingState v-if="loading" />
    <div v-else>
      <div class="row align-items-end mb-4">
        <div class="col-lg-8">
          <p class="text-primary fw-semibold mb-2">Admin dashboard</p>
          <h1 class="display-6 fw-bold">Manage Student Event Booking System</h1>
          <p class="text-muted mb-0">Review event activity, monitor bookings, and maintain the event catalogue.</p>
        </div>
        <div class="col-lg-4 text-lg-end mt-3 mt-lg-0">
          <RouterLink class="btn btn-primary" to="/admin/events/create">Create event</RouterLink>
        </div>
      </div>

      <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

      <div v-if="stats" class="row g-3 mb-4">
        <div class="col-md-6 col-xl-3">
          <StatCard label="Total events" :value="stats.totalEvents" helper="Events in catalogue" />
        </div>
        <div class="col-md-6 col-xl-3">
          <StatCard label="Upcoming events" :value="stats.upcomingEvents" helper="Events from today onward" />
        </div>
        <div class="col-md-6 col-xl-3">
          <StatCard label="Confirmed bookings" :value="stats.totalBookings" helper="Active booking records" />
        </div>
        <div class="col-md-6 col-xl-3">
          <StatCard label="Confirmed tickets" :value="stats.confirmedTickets" helper="Tickets reserved by students" />
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-7">
          <section class="card card-lift bg-white p-4" aria-labelledby="recent-bookings-title">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h2 id="recent-bookings-title" class="h4 mb-0">Recent platform bookings</h2>
              <RouterLink to="/admin/bookings">View all</RouterLink>
            </div>
            <div v-if="recentBookings.length === 0" class="text-muted">No bookings have been made yet.</div>
            <div v-for="booking in recentBookings" :key="booking.id" class="timeline-row mb-3">
              <p class="fw-semibold mb-1">{{ booking.event_title }}</p>
              <p class="small text-muted mb-0">
                {{ booking.student_name }} · {{ booking.ticket_count }} ticket(s) · {{ formatDate(booking.event_date) }} · {{ booking.status }}
              </p>
            </div>
          </section>
        </div>
        <div class="col-lg-5">
          <section class="card card-lift bg-white p-4" aria-labelledby="admin-actions-title">
            <h2 id="admin-actions-title" class="h4">Admin actions</h2>
            <div class="d-grid gap-2">
              <RouterLink class="btn btn-primary" to="/admin/events">Manage events</RouterLink>
              <RouterLink class="btn btn-outline-primary" to="/admin/bookings">Manage bookings</RouterLink>
              <RouterLink class="btn btn-outline-secondary" to="/events">Preview public event catalogue</RouterLink>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>