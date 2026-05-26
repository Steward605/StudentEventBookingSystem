<script>
import { computed, onMounted, ref } from 'vue';
import Paginate from 'vuejs-paginate-next';
import LoadingState from '@/components/LoadingState.vue';
import EmptyState from '@/components/EmptyState.vue';
import { useBookingStore } from '@/stores/bookingStore';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default {
  components: {
    LoadingState,
    EmptyState,
    paginate: Paginate
  },
  setup() {
    const bookingStore = useBookingStore();
    const loading = ref(true);
    const error = ref('');
    const activeStatus = ref('all');
    const currentPage = ref(1);
    const cancellingId = ref(null);
    const perPage = 5;
    const statusFilters = [
      { value: 'all', label: 'All bookings' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'cancelled', label: 'Cancelled' }
    ];

    const filteredBookings = computed(() => bookingStore.bookings);
    const confirmedCount = computed(() => Number(bookingStore.summary.confirmedRecords || 0));
    const cancelledCount = computed(() => Number(bookingStore.summary.cancelledRecords || 0));
    const totalRecords = computed(() => Number(bookingStore.summary.totalRecords || 0));
    const totalSeats = computed(() => Number(bookingStore.summary.confirmedSeats || 0));
    const statusResultLabel = computed(() => {
      const count = bookingStore.pagination.totalItems ?? filteredBookings.value.length;
      const activeFilter = statusFilters.find(filter => filter.value === activeStatus.value);
      const label = activeFilter?.label.toLowerCase() || 'bookings';
      return `${count} ${count === 1 ? 'record' : 'records'} shown for ${label}`;
    });
    const paginationLabel = computed(() => {
      const { page, limit, totalItems } = bookingStore.pagination;

      if (!totalItems) {
        return 'No booking records found';
      }

      const start = (page - 1) * limit + 1;
      const end = Math.min(page * limit, totalItems);
      return `Showing ${start}-${end} of ${totalItems} booking records`;
    });

    function reservedSeatCount(booking) {
      return Number(booking.seat_count ?? booking.ticket_count ?? 0);
    }

    function seatLabel(count) {
      return Number(count) === 1 ? 'seat' : 'seats';
    }
    const summaryCards = computed(() => [
      { label: 'Total records', value: totalRecords.value, helper: 'All booking attempts' },
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

    function buildParams(page = 1) {
      return {
        ...(activeStatus.value !== 'all' ? { status: activeStatus.value } : {}),
        page,
        limit: perPage
      };
    }

    async function fetchPage(page = 1, shouldScroll = false) {
      currentPage.value = page;
      error.value = '';

      try {
        await bookingStore.fetchBookings(buildParams(page));
        if (bookingStore.error) {
          error.value = bookingStore.error;
        }
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }

      if (shouldScroll) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    function setStatus(status) {
      if (activeStatus.value === status) {
        return;
      }

      activeStatus.value = status;
      fetchPage(1);
    }

    function goToPage(pageNum) {
      const totalPages = bookingStore.pagination.totalPages || 1;
      if (pageNum < 1 || pageNum > totalPages || pageNum === bookingStore.pagination.page) {
        return;
      }

      fetchPage(pageNum, true);
    }

    async function cancelBooking(booking) {
      if (booking.status !== 'confirmed') {
        return;
      }
      cancellingId.value = booking.id;
      error.value = '';
      try {
        await bookingStore.cancelBooking(booking.id);
        await fetchPage(currentPage.value);
        if (filteredBookings.value.length === 0 && currentPage.value > 1 && bookingStore.pagination.totalItems > 0) {
          await fetchPage(currentPage.value - 1);
        }
      } catch (err) {
        error.value = err.message;
      } finally {
        cancellingId.value = null;
      }
    }

    onMounted(async () => {
      await fetchPage(1);
    });

    return {bookingStore, loading, error, activeStatus, currentPage, statusFilters, filteredBookings, summaryCards, statusResultLabel, paginationLabel, cancellingId, bookingTotal, reservedSeatCount, seatLabel, eventRoute, statusClass, setStatus, goToPage, cancelBooking, formatCurrency, formatDate};
  }
};
</script>

<template>
  <div class="container section-pad history-page">
    <LoadingState v-if="loading" />

    <div v-else>
      <header class="history-header mb-4">
        <div>
          <p class="text-primary fw-semibold mb-2">History</p>
          <h1 class="display-6 fw-bold mb-2">Booking history</h1>
          <p class="text-muted mb-0">Review confirmed and cancelled bookings without the dashboard summary layout.</p>
        </div>

        <div class="history-counts" aria-label="Booking history summary">
          <span>{{ summaryCards[0].value }} records</span>
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
          <button v-for="filter in statusFilters" :key="filter.value" type="button" :class="['history-filter-button', { 'is-active': activeStatus === filter.value }]" :aria-pressed="activeStatus === filter.value" @click="setStatus(filter.value)">
            {{ filter.label }}
          </button>
        </div>
      </section>

      <EmptyState v-if="filteredBookings.length === 0" title="No bookings found" message="Bookings matching this filter will appear here."/>

      <section v-else class="history-list" aria-label="Booking history records">
        <p class="text-muted mb-0" aria-live="polite">{{ statusResultLabel }}</p>

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

        <div class="d-flex flex-column align-items-center gap-2 mt-2">
          <p class="text-muted small mb-0" aria-live="polite">{{ paginationLabel }}</p>

          <paginate v-model="currentPage" :page-count="bookingStore.pagination.totalPages" :page-range="3" :margin-pages="1" :click-handler="goToPage" :prev-text="'Previous'" :next-text="'Next'" :container-class="'pagination flex-wrap justify-content-center mb-0'" :page-class="'page-item'" :page-link-class="'page-link'" :prev-class="'page-item'" :prev-link-class="'page-link'" :next-class="'page-item'" :next-link-class="'page-link'" :break-view-class="'page-item disabled'" :break-view-link-class="'page-link'"/>
        </div>
      </section>
    </div>
  </div>
</template>
