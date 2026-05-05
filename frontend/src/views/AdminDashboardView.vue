<script>
import { computed, onMounted, ref } from 'vue';
import StatCard from '@/components/StatCard.vue';
import LoadingState from '@/components/LoadingState.vue';
import EmptyState from '@/components/EmptyState.vue';
import { api } from '@/services/api';
import { formatDate } from '@/utils/formatters';

export default {
  components: {StatCard, LoadingState, EmptyState},
  setup() {
    const stats = ref(null);
    const recentBookings = ref([]);
    const loading = ref(true);
    const error = ref('');

    const statCards = computed(() => [
      {
        label: 'Total events',
        value: stats.value?.totalEvents ?? 0,
        helper: 'Events in catalogue',
        tone: 'primary'
      },
      {
        label: 'Upcoming events',
        value: stats.value?.upcomingEvents ?? 0,
        helper: 'Events from today onward',
        tone: 'info'
      },
      {
        label: 'Confirmed bookings',
        value: stats.value?.totalBookings ?? 0,
        helper: 'Active booking records',
        tone: 'success'
      },
      {
        label: 'Confirmed tickets',
        value: stats.value?.confirmedTickets ?? 0,
        helper: 'Tickets reserved by students',
        tone: 'warning'
      }
    ]);

    const adminActions = [
      {
        to: '/admin/events/create',
        title: 'Create event',
        text: 'Add a new student-facing event to the catalogue.',
        button: 'Create event',
        primary: true
      },
      {
        to: '/admin/events',
        title: 'Manage events',
        text: 'Edit event details, capacity, pricing, and visibility.',
        button: 'Manage events',
        primary: false
      },
      {
        to: '/admin/bookings',
        title: 'Review bookings',
        text: 'Search booking records and cancel invalid reservations.',
        button: 'Manage bookings',
        primary: false
      }
    ];

    const systemRows = computed(() => [
      {label: 'Registered students', value: stats.value?.totalStudents ?? 0},
      {label: 'Total event capacity', value: stats.value?.totalCapacity ?? 0},
      {label: 'Recent records shown', value: recentBookings.value.length}
    ]);

    function statusClass(status) {
      if (status === 'confirmed') return 'seat-status-success';
      if (status === 'cancelled') return 'seat-status-danger';
      return 'seat-status-warning';
    }

    function statusLabel(status) {
      return String(status || 'unknown').replace(/_/g, ' ');
    }

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

    return {stats, recentBookings, statCards, adminActions, systemRows, loading, error, statusClass, statusLabel, formatDate};
  }
};
</script>

<template>
  <div class="container section-pad app-shell admin-dashboard-page">
    <LoadingState v-if="loading" />

    <div v-else>
      <header class="admin-page-header mb-4">
        <div>
          <p class="text-primary fw-semibold mb-2">Admin dashboard</p>
          <h1 class="display-6 fw-bold mb-2">Manage Student Event Booking System</h1>
          <p class="text-muted mb-0">Review event activity, monitor bookings, and maintain the event catalogue.</p>
        </div>

        <div class="admin-page-actions">
          <RouterLink class="btn btn-primary btn-pill btn-hover-elevate" to="/admin/events/create">Create event</RouterLink>
          <RouterLink class="btn btn-outline-primary btn-pill" to="/events">Preview public site</RouterLink>
        </div>
      </header>

      <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

      <section v-if="stats" class="row g-3 mb-4" aria-label="Admin platform statistics">
        <div v-for="card in statCards" :key="card.label" class="col-md-6 col-xl-3">
          <StatCard :label="card.label" :value="card.value" :helper="card.helper" :tone="card.tone" />
        </div>
      </section>

      <div class="row g-4 align-items-stretch">
        <div class="col-lg-7">
          <section class="admin-panel h-100" aria-labelledby="recent-bookings-title">
            <div class="admin-panel-header">
              <div>
                <p class="text-primary fw-semibold mb-1">Latest activity</p>
                <h2 id="recent-bookings-title" class="h4 fw-bold mb-0">Recent platform bookings</h2>
              </div>
              <RouterLink class="btn btn-outline-primary btn-sm btn-pill" to="/admin/bookings">View all</RouterLink>
            </div>

            <EmptyState v-if="recentBookings.length === 0" title="No bookings yet" message="Student bookings will appear here after tickets are reserved." />

            <div v-else class="admin-booking-list">
              <article v-for="booking in recentBookings" :key="booking.id" class="admin-booking-item">
                <div class="admin-booking-main">
                  <div class="admin-booking-title-row">
                    <span :class="['seat-status', statusClass(booking.status)]">{{ statusLabel(booking.status) }}</span>
                    <h3 class="h5 fw-bold mb-0">{{ booking.event_title }}</h3>
                  </div>

                  <dl class="admin-booking-meta">
                    <div>
                      <dt>Student</dt>
                      <dd>{{ booking.student_name }}</dd>
                    </div>
                    <div>
                      <dt>Tickets</dt>
                      <dd>{{ booking.ticket_count }}</dd>
                    </div>
                    <div>
                      <dt>Date</dt>
                      <dd>{{ formatDate(booking.event_date) }}</dd>
                    </div>
                  </dl>
                </div>

                <div class="admin-booking-reference">
                  <span>Reference</span>
                  <strong>{{ booking.booking_reference || `#${booking.id}` }}</strong>
                </div>
              </article>
            </div>
          </section>
        </div>

        <div class="col-lg-5">
          <section class="admin-panel h-100" aria-labelledby="admin-actions-title">
            <div class="admin-panel-header">
              <div>
                <p class="text-primary fw-semibold mb-1">Controls</p>
                <h2 id="admin-actions-title" class="h4 fw-bold mb-0">Admin actions</h2>
              </div>
            </div>

            <div class="admin-action-list">
              <article v-for="action in adminActions" :key="action.to" class="admin-action-card">
                <div>
                  <h3 class="h6 fw-bold mb-1">{{ action.title }}</h3>
                  <p class="text-muted small mb-0">{{ action.text }}</p>
                </div>
                <RouterLink :class="['btn btn-sm btn-pill', action.primary ? 'btn-primary' : 'btn-outline-primary']" :to="action.to">
                  {{ action.button }}
                </RouterLink>
              </article>
            </div>

            <dl class="admin-system-list mt-4">
              <div v-for="row in systemRows" :key="row.label" class="admin-system-row">
                <dt>{{ row.label }}</dt>
                <dd>{{ row.value }}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>