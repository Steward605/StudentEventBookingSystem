<script>
import { computed, onMounted, ref } from 'vue';
import LoadingState from '@/components/LoadingState.vue';
import EmptyState from '@/components/EmptyState.vue';
import { useBookingStore } from '@/stores/bookingStore';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default {
  components: {
    LoadingState,
    EmptyState
  },
  setup() {
    const bookingStore = useBookingStore();
    const loading = ref(true);
    const error = ref('');
    const activeStatus = ref('all');
    const cancellingId = ref(null);
    const statusFilters = [
      { value: 'all', label: 'All bookings' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'cancelled', label: 'Cancelled' }
    ];
    const sortedBookings = computed(() => {
      return [...bookingStore.bookings].sort((a, b) => {
        const dateA = new Date(`${a.event_date || ''} ${a.start_time || '00:00'}`);
        const dateB = new Date(`${b.event_date || ''} ${b.start_time || '00:00'}`);
        return dateB - dateA;
      });
    });
    const filteredBookings = computed(() => {
      if (activeStatus.value === 'all') {
        return sortedBookings.value;
      }

      return sortedBookings.value.filter(booking => booking.status === activeStatus.value);
    });

    const confirmedCount = computed(() => bookingStore.bookings.filter(booking => booking.status === 'confirmed').length);
    const cancelledCount = computed(() => bookingStore.bookings.filter(booking => booking.status === 'cancelled').length);

    function reservedSeatCount(booking) {
      return Number(booking.seat_count ?? booking.ticket_count ?? 0);
    }

    function seatLabel(count) {
      return Number(count) === 1 ? 'seat' : 'seats';
    }
    const totalSeats = computed(() => {
      return bookingStore.bookings
        .filter(booking => booking.status === 'confirmed')
        .reduce((sum, booking) => sum + reservedSeatCount(booking), 0);
    });
    const summaryCards = computed(() => [
      { label: 'Total records', value: bookingStore.bookings.length, helper: 'All booking attempts' },
      { label: 'Confirmed', value: confirmedCount.value, helper: 'Active reservations' },
      { label: 'Cancelled', value: cancelledCount.value, helper: 'Removed reservations' },
      { label: 'Seats held', value: totalSeats.value, helper: 'Confirmed seats' }
    ]);

    function bookingTotal(booking) {
      return Number(booking.price || 0) * reservedSeatCount(booking);
    }

    function eventRoute(booking) {
      return booking.event_id ? `/events/${booking.event_id}` : '/events';
    }
    function statusClass(status) {
      if (status === 'confirmed') {
        return 'text-bg-success';
      }
      if (status === 'cancelled') {
        return 'text-bg-secondary';
      }
      return 'text-bg-light';
    }

    async function cancelBooking(booking) {
      if (booking.status !== 'confirmed') {
        return;
      }
      cancellingId.value = booking.id;
      error.value = '';
      try {
        await bookingStore.cancelBooking(booking.id);
      } catch (err) {
        error.value = err.message;
      } finally {
        cancellingId.value = null;
      }
    }

    onMounted(async () => {
      try {
        await bookingStore.fetchBookings();
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    });

    return {bookingStore, loading, error, activeStatus, statusFilters, filteredBookings, summaryCards, cancellingId, bookingTotal, reservedSeatCount, seatLabel, eventRoute, statusClass, cancelBooking, formatCurrency, formatDate};
  }
};
</script>

<template>
  <div class="container section-pad app-shell">
    <LoadingState v-if="loading" />

    <div v-else>
      <header class="history-header mb-4">
        <div>
          <p class="text-primary fw-semibold mb-2">History</p>
          <h1 class="display-6 fw-bold mb-2">Booking history</h1>
          <p class="text-muted mb-0">Review confirmed and cancelled bookings without the dashboard summary layout.</p>
        </div>

        <div class="history-counts" aria-label="Booking history summary">
          <span>{{ bookingStore.bookings.length }} records</span>
          <span>{{ summaryCards[1].value }} confirmed</span>
          <span>{{ summaryCards[2].value }} cancelled</span>
        </div>
      </header>

      <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

      <section class="history-toolbar mb-4" aria-labelledby="history-filter-title">
        <div>
          <p class="text-primary fw-semibold mb-1">Records</p>
          <h2 id="history-filter-title" class="h4 fw-bold mb-0">Filter booking records</h2>
        </div>

        <div class="history-filter-control" role="group" aria-label="Filter booking history">
          <button v-for="filter in statusFilters" :key="filter.value" type="button" :class="['history-filter-button', { 'is-active': activeStatus === filter.value }]" :aria-pressed="activeStatus === filter.value" @click="activeStatus = filter.value">
            {{ filter.label }}
          </button>
        </div>
      </section>

      <EmptyState v-if="filteredBookings.length === 0" title="No bookings found" message="Bookings matching this filter will appear here."/>

      <section v-else class="history-list" aria-label="Booking history records">
        <article v-for="booking in filteredBookings" :key="booking.id" class="history-card">
          <img class="history-thumbnail" :src="booking.image_url" :alt="booking.title" loading="lazy"/>

          <div class="history-card-main">
            <div class="history-card-title-row">
              <span :class="['badge rounded-pill', statusClass(booking.status)]">
                {{ booking.status }}
              </span>

              <h2 class="h5 fw-bold mb-0">{{ booking.title }}</h2>
            </div>

            <dl class="detail-list mt-3 mb-3">
              <div class="detail-list-row">
                <dt>Date</dt>
                <dd>{{ formatDate(booking.event_date) }}</dd>
              </div>

              <div class="detail-list-row">
                <dt>Time</dt>
                <dd>{{ booking.start_time }} - {{ booking.end_time }}</dd>
              </div>

              <div class="detail-list-row">
                <dt>Location</dt>
                <dd>{{ booking.location }}, {{ booking.city }}</dd>
              </div>

              <div class="detail-list-row">
                <dt>Seats</dt>
                <dd>
                  {{ reservedSeatCount(booking) }}
                  {{ seatLabel(reservedSeatCount(booking)) }}
                </dd>
              </div>
            </dl>

            <p class="history-reference-row mb-0">
              <span>Reference</span>
              <strong>{{ booking.booking_reference }}</strong>
            </p>
          </div>

          <div class="history-card-aside">
            <p class="text-muted fw-semibold mb-1">Total</p>
            <strong class="h5 d-block mb-3">{{ formatCurrency(bookingTotal(booking)) }}</strong>

            <div class="d-grid gap-2">
              <RouterLink class="btn btn-sm btn-outline-primary btn-pill" :to="eventRoute(booking)">
                View event
              </RouterLink>

              <button v-if="booking.status === 'confirmed'" class="btn btn-sm btn-outline-danger btn-pill" type="button" :disabled="cancellingId === booking.id" @click="cancelBooking(booking)">
                {{ cancellingId === booking.id ? 'Cancelling...' : 'Cancel' }}
              </button>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>
