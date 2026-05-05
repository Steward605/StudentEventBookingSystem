<script>
  import { onMounted } from 'vue';
  import LoadingState from '@/components/LoadingState.vue';
  import EmptyState from '@/components/EmptyState.vue';
  import { useBookingStore } from '@/stores/bookingStore';
  import { formatCurrency, formatDate } from '@/utils/formatters';

  export default {
    components: {LoadingState, EmptyState},
    setup() {
      const bookingStore = useBookingStore();
      onMounted(() => bookingStore.fetchBookings());
      async function cancelBooking(booking) {
        const confirmed = window.confirm(`Cancel booking ${booking.booking_reference}?`);
        if (confirmed) await bookingStore.cancelBooking(booking.id);
      }

      return {bookingStore, cancelBooking, formatCurrency, formatDate};
    }
  };
</script>

<template>
  <div class="container section-pad app-shell">
    <div class="mb-4">
      <p class="text-primary fw-semibold mb-2">Activity history</p>
      <h1 class="display-6 fw-bold">Your bookings</h1>
      <p class="text-muted">View your confirmed and cancelled bookings in one place.</p>
    </div>

    <LoadingState v-if="bookingStore.loading" />
    <div v-else-if="bookingStore.error" class="alert alert-danger" role="alert">{{ bookingStore.error }}</div>
    <EmptyState v-else-if="bookingStore.bookings.length === 0" title="No bookings yet" message="Browse events and reserve your first ticket." />
    <div v-else class="vstack gap-3">
      <article v-for="booking in bookingStore.bookings" :key="booking.id" class="card card-lift bg-white p-3 p-md-4">
        <div class="row g-3 align-items-center">
          <div class="col-md-3">
            <img :src="booking.image_url" :alt="`${booking.title} thumbnail`" class="img-fluid rounded-4" />
          </div>
          <div class="col-md-6">
            <span class="badge rounded-pill" :class="booking.status === 'confirmed' ? 'text-bg-success' : 'text-bg-secondary'">{{ booking.status }}</span>
            <h2 class="h4 mt-2">{{ booking.title }}</h2>
            <p class="text-muted mb-1">{{ formatDate(booking.event_date) }} · {{ booking.start_time }}</p>
            <p class="mb-0 small">Reference: <strong>{{ booking.booking_reference }}</strong></p>
          </div>
          <div class="col-md-3 text-md-end">
            <p class="mb-1">{{ booking.ticket_count }} ticket(s)</p>
            <p class="fw-bold">{{ formatCurrency(Number(booking.price) * Number(booking.ticket_count)) }}</p>
            <button v-if="booking.status === 'confirmed'" class="btn btn-outline-danger btn-sm" type="button" @click="cancelBooking(booking)">Cancel</button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
