<script>
import { computed, onMounted, ref } from 'vue';
import StatCard from '@/components/StatCard.vue';
import LoadingState from '@/components/LoadingState.vue';
import EmptyState from '@/components/EmptyState.vue';
import { api } from '@/services/api';
import { formatDate } from '@/utils/formatters';

export default {
  components: {
    StatCard,
    LoadingState,
    EmptyState
  },

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
        label: 'Sold out events',
        value: stats.value?.soldOutEvents ?? 0,
        helper: 'Events at full capacity',
        tone: 'warning'
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

    const systemRows = computed(() => [
      {
        label: 'Registered students',
        value: stats.value?.totalStudents ?? 0
      },
      {
        label: 'Total event capacity',
        value: stats.value?.totalCapacity ?? 0
      },
      {
        label: 'Recent booking records',
        value: recentBookings.value.length
      }
    ]);

    function statusClass(status) {
      if (status === 'confirmed') {
        return 'seat-status-success';
      }

      if (status === 'cancelled') {
        return 'seat-status-danger';
      }

      return 'seat-status-warning';
    }

    function statusLabel(status) {
      return String(status || 'unknown').replace(/_/g, ' ');
    }

    onMounted(async () => {
      try {
        const data = await api.get('/stats/admin-overview');

        stats.value = data.stats;
        recentBookings.value = data.recentBookings || [];
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    });

    return {
      stats,
      recentBookings,
      loading,
      error,
      statCards,
      systemRows,
      statusClass,
      statusLabel,
      formatDate
    };
  }
};
</script>

<template>
  <div class="admin-content-page">
    <LoadingState v-if="loading" />

    <div v-else>
      <header class="admin-page-header mb-4">
        <div>
          <p class="text-primary fw-semibold mb-2">Admin overview</p>
          <h1 class="display-6 fw-bold mb-2">Dashboard summary</h1>
        </div>
      </header>

      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <section v-if="stats" class="row g-3 mb-4" aria-label="Admin platform statistics">
        <div v-for="card in statCards" :key="card.label" class="col-md-6 col-xl-3">
          <StatCard
            :label="card.label"
            :value="card.value"
            :helper="card.helper"
            :tone="card.tone"
          />
        </div>
      </section>

      <div class="row g-4 align-items-stretch">
        <div class="col-xl-8">
          <section class="admin-panel h-100" aria-labelledby="recent-bookings-title">
            <div class="admin-panel-header">
              <div>
                <p class="text-primary fw-semibold mb-1">Latest activity</p>
                <h2 id="recent-bookings-title" class="h4 fw-bold mb-0">Recent platform bookings</h2>
              </div>

              <RouterLink class="btn btn-outline-primary btn-sm btn-pill" to="/admin/bookings">
                View all bookings
              </RouterLink>
            </div>

            <EmptyState
              v-if="recentBookings.length === 0"
              title="No bookings yet"
              message="Student bookings will appear here after tickets are reserved."
            />

            <div v-else class="admin-booking-list">
              <article
                v-for="booking in recentBookings"
                :key="booking.id"
                class="admin-booking-item"
              >
                <div class="admin-booking-main">
                  <div class="admin-booking-title-row">
                    <span :class="['seat-status', statusClass(booking.status)]">
                      {{ statusLabel(booking.status) }}
                    </span>

                    <h3 class="h5 fw-bold mb-0">
                      {{ booking.event_title }}
                    </h3>
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

        <div class="col-xl-4">
          <section class="admin-panel h-100" aria-labelledby="system-summary-title">
            <div class="admin-panel-header">
              <div>
                <p class="text-primary fw-semibold mb-1">System</p>
                <h2 id="system-summary-title" class="h4 fw-bold mb-0">System summary</h2>
              </div>
            </div>

            <dl class="admin-system-list mb-0">
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