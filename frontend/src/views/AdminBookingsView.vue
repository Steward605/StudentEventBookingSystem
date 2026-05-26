<script>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import Paginate from 'vuejs-paginate-next';
import EmptyState from '@/components/EmptyState.vue';
import LoadingState from '@/components/LoadingState.vue';
import { api } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default {
  components: {EmptyState, LoadingState, paginate: Paginate},
  setup() {
    const bookings = ref([]);
    const summary = ref({
      totalRecords: 0,
      confirmedRecords: 0,
      cancelledRecords: 0,
      reservedSeats: 0
    });
    const pagination = ref({
      page: 1,
      limit: 8,
      totalItems: 0,
      totalPages: 1
    });
    const currentPage = ref(1);
    const loading = ref(true);
    const cancellingId = ref(null);
    const removingId = ref(null);
    const pendingCancel = ref(null);
    const pendingRemove = ref(null);
    const error = ref('');
    const cancelError = ref('');
    const removeError = ref('');
    const copyStatus = ref('');
    const filters = reactive({search: '', status: 'all'});
    const perPage = 8;
    let debounceTimer;

    const filteredBookings = computed(() => bookings.value);
    const summaryCards = computed(() => {
      return [
        {label: 'Total records', value: summary.value.totalRecords},
        {label: 'Confirmed', value: summary.value.confirmedRecords},
        {label: 'Cancelled', value: summary.value.cancelledRecords},
        {label: 'Reserved seats', value: summary.value.reservedSeats}
      ];
    });

    const hasActiveFilters = computed(() => Boolean(filters.search || filters.status !== 'all'));
    const resultLabel = computed(() => {
      const count = pagination.value.totalItems ?? filteredBookings.value.length;
      return `${count} ${count === 1 ? 'booking' : 'bookings'} shown`;
    });
    const paginationLabel = computed(() => {
      const { page, limit, totalItems } = pagination.value;

      if (!totalItems) {
        return 'No booking records found';
      }

      const start = (page - 1) * limit + 1;
      const end = Math.min(page * limit, totalItems);
      return `Showing ${start}-${end} of ${totalItems} booking records`;
    });

    function buildParams(page = 1) {
      return {
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.status !== 'all' ? { status: filters.status } : {}),
        page,
        limit: perPage
      };
    }

    function buildQuery(params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.set(key, value);
        }
      });
      return query.toString() ? `?${query.toString()}` : '';
    }

    async function loadBookings(page = currentPage.value) {
      currentPage.value = page;
      loading.value = true;
      error.value = '';

      try {
        const data = await api.get(`/bookings/all${buildQuery(buildParams(page))}`);
        bookings.value = data.bookings || [];
        summary.value = data.summary || summary.value;
        pagination.value = data.pagination || {
          page,
          limit: perPage,
          totalItems: bookings.value.length,
          totalPages: 1
        };
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    }

    function bookingTitle(booking) {
      return booking.title || booking.event_title || 'Untitled event';
    }

    function bookingTotal(booking) {
      return Number(booking.price || 0) * Number(booking.seat_count ?? booking.ticket_count ?? 0);
    }

    function statusClass(status) {
      if (status === 'confirmed') return 'seat-status-success';
      if (status === 'cancelled') return 'seat-status-danger';
      return 'seat-status-warning';
    }

    function statusLabel(status) {
      return String(status || 'unknown').replace(/_/g, ' ');
    }

    function clearFilters() {
      filters.search = '';
      filters.status = 'all';
    }

    function goToPage(pageNum) {
      const totalPages = pagination.value.totalPages || 1;
      if (pageNum < 1 || pageNum > totalPages || pageNum === pagination.value.page) {
        return;
      }
      loadBookings(pageNum);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function requestCancel(booking) {
      pendingCancel.value = booking;
      cancelError.value = '';
    }

    function closeCancelDialog() {
      if (cancellingId.value) return;
      pendingCancel.value = null;
      cancelError.value = '';
    }

    async function confirmCancelBooking() {
      if (!pendingCancel.value) return;
      cancellingId.value = pendingCancel.value.id;
      cancelError.value = '';
      error.value = '';
      try {
        await api.delete(`/bookings/${pendingCancel.value.id}`);
        pendingCancel.value = null;
        await loadBookings(currentPage.value);
        if (bookings.value.length === 0 && currentPage.value > 1 && pagination.value.totalItems > 0) {
          await loadBookings(currentPage.value - 1);
        }
      } catch (err) {
        cancelError.value = err.message;
      } finally {
        cancellingId.value = null;
      }
    }

    function requestRemove(booking) {
      pendingRemove.value = booking;
      removeError.value = '';
    }

    function closeRemoveDialog() {
      if (removingId.value) return;
      pendingRemove.value = null;
      removeError.value = '';
    }

    async function confirmRemoveBookingRecord() {
      if (!pendingRemove.value) return;
      removingId.value = pendingRemove.value.id;
      removeError.value = '';
      error.value = '';
      try {
        await api.delete(`/bookings/${pendingRemove.value.id}/record`);
        pendingRemove.value = null;
        await loadBookings(currentPage.value);
        if (bookings.value.length === 0 && currentPage.value > 1 && pagination.value.totalItems > 0) {
          await loadBookings(currentPage.value - 1);
        }
      } catch (err) {
        removeError.value = err.message;
      } finally {
        removingId.value = null;
      }
    }

    async function copyReference(reference) {
      if (!reference) return;
      try {
        await navigator.clipboard.writeText(reference);
        copyStatus.value = reference;
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = reference;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
          document.execCommand('copy');
          copyStatus.value = reference;
        } catch {
          copyStatus.value = '';
        } finally {
          document.body.removeChild(textarea);
        }
      }

      window.setTimeout(() => {
        copyStatus.value = '';
      }, 2200);
    }

    watch(filters, () => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        loadBookings(1);
      }, 250);
    });

    onMounted(loadBookings);
    onBeforeUnmount(() => {
      window.clearTimeout(debounceTimer);
    });

    return { bookings, filteredBookings, summaryCards, pagination, currentPage, resultLabel, paginationLabel, loading, cancellingId, removingId, pendingCancel, pendingRemove, error, cancelError, removeError, copyStatus, filters, hasActiveFilters, loadBookings, goToPage, bookingTitle, bookingTotal, statusClass, statusLabel, clearFilters, requestCancel, requestRemove, closeCancelDialog, closeRemoveDialog, confirmCancelBooking, confirmRemoveBookingRecord, copyReference, formatCurrency, formatDate };
  }
};
</script>

<template>
  <div class="container section-pad app-shell">
    <header class="admin-management-header mb-4">
      <div>
        <p class="text-primary fw-semibold mb-2">Admin</p>
        <h1 class="display-6 fw-bold mb-2">Manage bookings</h1>
        <p class="text-muted mb-0">Search student booking records, inspect references, and cancel invalid reservations.</p>
      </div>

      <div class="admin-page-actions">
        <button class="btn btn-outline-primary btn-pill" type="button" :disabled="loading" @click="loadBookings(1)">
          {{ loading ? 'Refreshing...' : 'Refresh records' }}
        </button>
      </div>
    </header>

    <LoadingState v-if="loading" />

    <div v-else-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

    <div v-else>
      <section class="admin-summary-grid mb-4" aria-label="Booking management summary">
        <article v-for="card in summaryCards" :key="card.label" class="admin-summary-card">
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
        </article>
      </section>

      <section class="admin-filter-panel glass-panel mb-4" aria-labelledby="booking-admin-filter-title">
        <div class="admin-filter-header">
          <div>
            <h2 id="booking-admin-filter-title" class="h5 fw-bold mb-1">Filter bookings</h2>
            <p class="text-muted small mb-0">Search by reference, student, event name, email, or status.</p>
          </div>
          <button v-if="hasActiveFilters" class="btn btn-outline-primary btn-sm btn-pill" type="button" @click="clearFilters">Clear filters</button>
        </div>

        <div class="row g-3 align-items-end">
          <div class="col-lg-8">
            <label for="bookingSearch" class="form-label">Search bookings</label>
            <input id="bookingSearch" v-model.trim="filters.search" class="form-control" type="search" placeholder="Search booking reference, student, or event..." autocomplete="off" />
          </div>

          <div class="col-lg-4">
            <label for="bookingStatus" class="form-label">Status</label>
            <select id="bookingStatus" v-model="filters.status" class="form-select">
              <option value="all">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </section>

      <EmptyState v-if="summaryCards[0].value === 0" title="No bookings found" message="Student bookings will appear here after seats are reserved." />

      <EmptyState v-else-if="filteredBookings.length === 0" title="No matching bookings" message="Try a different keyword or status filter." />

      <section v-else class="admin-management-list" aria-labelledby="booking-admin-results-title">
        <div class="admin-results-heading">
          <h2 id="booking-admin-results-title" class="h4 fw-bold mb-0">Booking records</h2>
          <p class="text-muted mb-0">{{ resultLabel }}</p>
        </div>

        <article v-for="booking in filteredBookings" :key="booking.id" class="admin-record-card">
          <div class="admin-record-main">
            <div class="admin-record-title-row">
              <span :class="['seat-status', statusClass(booking.status)]">{{ statusLabel(booking.status) }}</span>
              <h3 class="h4 fw-bold mb-0">{{ bookingTitle(booking) }}</h3>
            </div>

            <dl class="admin-record-meta admin-booking-record-meta">
              <div>
                <dt>Reference</dt>
                <dd class="admin-reference-inline">
                  <strong>{{ booking.booking_reference }}</strong>
                  <button class="admin-copy-button" type="button" :aria-label="`Copy booking reference ${booking.booking_reference}`" @click="copyReference(booking.booking_reference)">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M8 7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-1v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3h1V7Zm2 1h3a3 3 0 0 1 3 3v3h1a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v1Zm-3 2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H7Z" />
                    </svg>
                  </button>
                </dd>
              </div>
              <div>
                <dt>Student</dt>
                <dd>{{ booking.student_name }}<br /><span class="text-muted">{{ booking.student_email }}</span></dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{{ formatDate(booking.event_date) }}</dd>
              </div>
              <div>
                <dt>Seats</dt>
                <dd>{{ booking.seat_count ?? booking.ticket_count }}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{{ formatCurrency(bookingTotal(booking)) }}</dd>
              </div>
            </dl>

            <p v-if="copyStatus === booking.booking_reference" class="admin-copy-status" aria-live="polite">Reference copied</p>
          </div>

          <div class="admin-record-actions">
            <button v-if="booking.status === 'confirmed'" class="btn btn-outline-danger btn-sm btn-pill" type="button" :disabled="cancellingId === booking.id" @click="requestCancel(booking)">
              {{ cancellingId === booking.id ? 'Cancelling...' : 'Cancel booking' }}
            </button>
            <button v-else-if="booking.status === 'cancelled'" class="btn btn-danger btn-sm btn-pill" type="button" :disabled="removingId === booking.id" @click="requestRemove(booking)">
              {{ removingId === booking.id ? 'Removing...' : 'Remove record' }}
            </button>
            <span v-else class="admin-no-action">No action available</span>
          </div>
        </article>

        <div class="d-flex flex-column align-items-center gap-2 mt-4">
          <p class="text-muted small mb-0" aria-live="polite">{{ paginationLabel }}</p>

          <paginate v-model="currentPage" :page-count="pagination.totalPages" :page-range="3" :margin-pages="1" :click-handler="goToPage" :prev-text="'Previous'" :next-text="'Next'" :container-class="'pagination flex-wrap justify-content-center mb-0'" :page-class="'page-item'" :page-link-class="'page-link'" :prev-class="'page-item'" :prev-link-class="'page-link'" :next-class="'page-item'" :next-link-class="'page-link'" :break-view-class="'page-item disabled'" :break-view-link-class="'page-link'"/>
        </div>
      </section>
    </div>

    <div v-if="pendingCancel" class="admin-confirm-backdrop" role="presentation" @click.self="closeCancelDialog">
      <section class="admin-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-booking-title" aria-describedby="cancel-booking-description">
        <p class="text-danger fw-semibold mb-2">Cancel booking</p>
        <h2 id="cancel-booking-title" class="h4 fw-bold mb-2">Cancel this booking?</h2>
        <p id="cancel-booking-description" class="text-muted mb-3">This will cancel reference <strong>{{ pendingCancel.booking_reference }}</strong> for {{ bookingTitle(pendingCancel) }}.</p>

        <div v-if="cancelError" class="alert alert-danger" role="alert">{{ cancelError }}</div>

        <div class="d-flex flex-column flex-sm-row gap-2 justify-content-end">
          <button class="btn btn-outline-primary btn-pill" type="button" :disabled="Boolean(cancellingId)" @click="closeCancelDialog">Keep booking</button>
          <button class="btn btn-danger btn-pill" type="button" :disabled="Boolean(cancellingId)" @click="confirmCancelBooking">
            {{ cancellingId ? 'Cancelling...' : 'Yes, cancel it' }}
          </button>
        </div>
      </section>
    </div>
    <div v-if="pendingRemove" class="admin-confirm-backdrop" role="presentation" @click.self="closeRemoveDialog">
      <section class="admin-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="remove-booking-title" aria-describedby="remove-booking-description">
        <p class="text-danger fw-semibold mb-2">Remove cancelled record</p>
        <h2 id="remove-booking-title" class="h4 fw-bold mb-2">Remove this cancelled booking?</h2>
        <p id="remove-booking-description" class="text-muted mb-3">
          This will permanently remove reference
          <strong>{{ pendingRemove.booking_reference }}</strong>
          for {{ bookingTitle(pendingRemove) }} from the admin booking records.
        </p>
        <div v-if="removeError" class="alert alert-danger" role="alert">{{ removeError }}</div>
        <div class="d-flex flex-column flex-sm-row gap-2 justify-content-end">
          <button class="btn btn-outline-primary btn-pill" type="button" :disabled="Boolean(removingId)" @click="closeRemoveDialog">
            Keep record
          </button>
          <button class="btn btn-danger btn-pill" type="button" :disabled="Boolean(removingId)" @click="confirmRemoveBookingRecord">
            {{ removingId ? 'Removing...' : 'Yes, remove record' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
