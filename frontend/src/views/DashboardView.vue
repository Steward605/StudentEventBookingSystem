<script>
import { computed, onMounted, ref } from 'vue';
import StatCard from '@/components/StatCard.vue';
import LoadingState from '@/components/LoadingState.vue';
import EmptyState from '@/components/EmptyState.vue';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default {
  components: {StatCard, LoadingState, EmptyState},
  setup() {
    const auth = useAuthStore();
    const bookingStore = useBookingStore();
    const stats = ref(null);
    const loading = ref(true);
    const error = ref('');
    const confirmedBookings = computed(() => bookingStore.bookings.filter(booking => booking.status === 'confirmed'));
    const upcomingBookings = computed(() => {
      return [...confirmedBookings.value]
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
        .slice(0, 3);
    });
    const totalTickets = computed(() => confirmedBookings.value.reduce((sum, booking) => sum + Number(booking.ticket_count || 0), 0));
    const statsCards = computed(() => [
      {label: 'My bookings', value: stats.value?.myBookings ?? confirmedBookings.value.length, helper: 'Confirmed bookings'},
      {label: 'My tickets', value: stats.value?.myTickets ?? totalTickets.value, helper: 'Total confirmed tickets'},
      {label: 'Upcoming', value: stats.value?.upcomingEvents ?? upcomingBookings.value.length, helper: 'Future booked events'},
      {label: 'Platform events', value: stats.value?.totalEvents ?? 0, helper: 'Available in catalogue'}
    ]);

    const accountRows = computed(() => [
      {label: 'Email', value: auth.user?.email || 'Not provided'},
      {label: 'Campus', value: auth.user?.campus || 'Not provided'},
      {label: 'Role', value: auth.user?.role || 'student'}
    ]);

    function bookingTotal(booking) {
      return Number(booking.price || 0) * Number(booking.ticket_count || 0);
    }

    function eventRoute(booking) {
      return booking.event_id ? `/events/${booking.event_id}` : '/events';
    }

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

    return {auth, statsCards, loading, error, upcomingBookings, accountRows, bookingTotal, eventRoute, formatCurrency, formatDate};
  }
};
</script>

<template>
  <div class="container section-pad app-shell">
    <LoadingState v-if="loading" />

    <div v-else>
      <header class="dashboard-header mb-4">
        <div>
          <p class="text-primary fw-semibold mb-2">Dashboard</p>
          <h1 class="display-6 fw-bold mb-2">Welcome, {{ auth.user?.name }}</h1>
          <p class="text-muted mb-0">Track bookings, review your account details, and continue discovering campus events.</p>
        </div>

        <div class="dashboard-header-actions">
          <RouterLink class="btn btn-primary btn-pill btn-hover-elevate" to="/events">Book another event</RouterLink>
          <RouterLink class="btn btn-outline-primary btn-pill" to="/history">View history</RouterLink>
        </div>
      </header>

      <div v-if="auth.isPendingVerification" class="alert alert-info" role="status">
        Your student account is pending verification. Once an admin verifies your account, you can host events and reserve venues.
      </div>

      <div v-else-if="auth.isRejectedVerification" class="alert alert-warning" role="status">
        Your organiser verification was rejected. You can still book events, but you cannot host events or reserve venues.
      </div>

      <div v-else-if="auth.isVerifiedStudent" class="alert alert-success" role="status">
        Your student account is verified. You can now host events and reserve venues.
        <RouterLink class="alert-link" to="/organiser">Open organiser dashboard</RouterLink>.
      </div>

      <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

      <section class="row g-3 mb-4" aria-label="Dashboard statistics">
        <div v-for="card in statsCards" :key="card.label" class="col-md-6 col-xl-3">
          <StatCard :label="card.label" :value="card.value" :helper="card.helper" />
        </div>
      </section>

      <div class="row g-4 align-items-stretch">
        <div class="col-lg-7">
          <section class="dashboard-panel h-100" aria-labelledby="upcoming-title">
            <div class="dashboard-panel-header">
              <div>
                <p class="text-primary fw-semibold mb-1">Bookings</p>
                <h2 id="upcoming-title" class="h4 fw-bold mb-0">Upcoming bookings</h2>
              </div>
              <RouterLink class="btn btn-outline-primary btn-sm btn-pill" to="/history">View all</RouterLink>
            </div>

            <EmptyState v-if="upcomingBookings.length === 0" title="No confirmed bookings yet" message="Browse events and reserve your first ticket." />

            <div v-else class="dashboard-booking-list">
              <article v-for="booking in upcomingBookings" :key="booking.id" class="dashboard-booking-card">
                <div>
                  <span class="seat-status seat-status-success">Confirmed</span>
                  <h3 class="h5 fw-bold mt-2 mb-1">{{ booking.title }}</h3>
                  <p class="text-muted mb-1">{{ formatDate(booking.event_date) }} · {{ booking.ticket_count }} {{ Number(booking.ticket_count) === 1 ? 'ticket' : 'tickets' }}</p>
                  <p class="small mb-0">Reference: <strong>{{ booking.booking_reference }}</strong></p>
                </div>

                <div class="dashboard-booking-actions">
                  <strong>{{ formatCurrency(bookingTotal(booking)) }}</strong>
                  <RouterLink class="btn btn-sm btn-outline-primary btn-pill" :to="eventRoute(booking)">View event</RouterLink>
                </div>
              </article>
            </div>
          </section>
        </div>

        <div class="col-lg-5">
          <section class="dashboard-panel h-100" aria-labelledby="account-title">
            <div class="dashboard-panel-header">
              <div>
                <p class="text-primary fw-semibold mb-1">Account</p>
                <h2 id="account-title" class="h4 fw-bold mb-0">Account snapshot</h2>
              </div>
              <RouterLink class="btn btn-outline-primary btn-sm btn-pill" to="/profile">Edit</RouterLink>
            </div>

            <dl class="account-snapshot-list">
              <div v-for="row in accountRows" :key="row.label" class="account-snapshot-row">
                <dt>{{ row.label }}</dt>
                <dd :class="{ 'text-capitalize': row.label === 'Role' }">{{ row.value }}</dd>
              </div>
            </dl>

            <div class="dashboard-help-card mt-4">
              <h3 class="h6 fw-bold mb-2">Next best action</h3>
              <p class="text-muted small mb-3">Keep your profile accurate so booking forms can be filled faster.</p>
              <RouterLink class="btn btn-primary btn-sm btn-pill" to="/profile">Update profile</RouterLink>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>