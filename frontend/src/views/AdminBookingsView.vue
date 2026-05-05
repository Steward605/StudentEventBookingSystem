<script>
  import { computed, onMounted, ref } from 'vue';
  import EmptyState from '@/components/EmptyState.vue';
  import LoadingState from '@/components/LoadingState.vue';
  import { api } from '@/services/api';
  import { formatCurrency, formatDate } from '@/utils/formatters';

  export default {
    components: {EmptyState, LoadingState},
    setup() {
      const bookings = ref([]);
      const loading = ref(true);
      const cancellingId = ref(null);
      const error = ref('');
      const query = ref('');
      const filteredBookings = computed(() => {
        const keyword = query.value.trim().toLowerCase();
        if (!keyword) return bookings.value;
        return bookings.value.filter(booking => [
          booking.title,
          booking.student_name,
          booking.student_email,
          booking.booking_reference,
          booking.status
        ].some(value => String(value).toLowerCase().includes(keyword)));
      });
      async function loadBookings() {
        loading.value = true;
        error.value = '';
        try {
          const data = await api.get('/bookings/all');
          bookings.value = data.bookings;
        } catch (err) {
          error.value = err.message;
        } finally {
          loading.value = false;
        }
      }
      async function cancelBooking(booking) {
        const confirmed = window.confirm(`Cancel booking ${booking.booking_reference}?`);
        if (!confirmed) return;
        cancellingId.value = booking.id;
        error.value = '';
        try {
          await api.delete(`/bookings/${booking.id}`);
          bookings.value = bookings.value.map(item => item.id === booking.id ? { ...item, status: 'cancelled' } : item);
        } catch (err) {
          error.value = err.message;
        } finally {
          cancellingId.value = null;
        }
      }
      onMounted(loadBookings);

      return {bookings, filteredBookings, loading, cancellingId, error, query, cancelBooking, formatCurrency, formatDate};
    }
  };
</script>

<template>
  <div class="container section-pad app-shell">
    <div class="row align-items-end mb-4">
      <div class="col-lg-8">
        <p class="text-primary fw-semibold mb-2">Admin</p>
        <h1 class="display-6 fw-bold">Manage bookings</h1>
        <p class="text-muted mb-0">View student bookings and cancel invalid records when needed.</p>
      </div>
      <div class="col-lg-4 mt-3 mt-lg-0">
        <label for="bookingSearch" class="form-label visually-hidden">Search bookings</label>
        <input id="bookingSearch" v-model.trim="query" class="form-control" placeholder="Search bookings" />
      </div>
    </div>

    <LoadingState v-if="loading" />
    <div v-else-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
    <EmptyState v-else-if="bookings.length === 0" title="No bookings found" message="Student bookings will appear here after tickets are reserved." />
    <div v-else class="card card-lift bg-white p-3 p-md-4">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <caption class="visually-hidden">Admin booking management table</caption>
          <thead>
            <tr>
              <th scope="col">Reference</th>
              <th scope="col">Student</th>
              <th scope="col">Event</th>
              <th scope="col">Date</th>
              <th scope="col">Tickets</th>
              <th scope="col">Status</th>
              <th scope="col" class="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="booking in filteredBookings" :key="booking.id">
              <td class="fw-semibold">{{ booking.booking_reference }}</td>
              <td>
                <p class="mb-1">{{ booking.student_name }}</p>
                <p class="small text-muted mb-0">{{ booking.student_email }}</p>
              </td>
              <td>
                <p class="mb-1">{{ booking.title }}</p>
                <p class="small text-muted mb-0">{{ formatCurrency(Number(booking.price) * Number(booking.ticket_count)) }}</p>
              </td>
              <td>{{ formatDate(booking.event_date) }}</td>
              <td>{{ booking.ticket_count }}</td>
              <td><span class="badge rounded-pill" :class="booking.status === 'confirmed' ? 'text-bg-success' : 'text-bg-secondary'">{{ booking.status }}</span></td>
              <td class="text-end">
                <button v-if="booking.status === 'confirmed'" class="btn btn-outline-danger btn-sm" type="button" :disabled="cancellingId === booking.id" @click="cancelBooking(booking)">
                  {{ cancellingId === booking.id ? 'Cancelling...' : 'Cancel' }}
                </button>
                <span v-else class="text-muted small">No action</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="filteredBookings.length === 0" class="text-muted mb-0 mt-3">No bookings match your search.</p>
    </div>
  </div>
</template>