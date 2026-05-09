<script>
import { computed } from 'vue';
import { formatCurrency, formatDate, formatTimeRange } from '@/utils/formatters';

export default {
  props: {
    event: {type: Object, required: true},
    reservedSeats: { type: Number, default: 1 }
  },
  setup(props) {
    const safeReservedSeats = computed(() => Math.max(1, Number(props.reservedSeats) || 1));
    const total = computed(() => Number(props.event.price || 0) * safeReservedSeats.value);
    const locationLabel = computed(() => [props.event.location, props.event.city].filter(Boolean).join(', ') || 'Location to be confirmed');
    return {safeReservedSeats, total, locationLabel, formatCurrency, formatDate, formatTimeRange};
  }
};
</script>

<template>
  <aside class="booking-summary" aria-labelledby="booking-summary-title">
    <p class="text-primary fw-semibold mb-2">Review</p>
    <h2 id="booking-summary-title" class="h4 fw-bold mb-3">Booking summary</h2>

    <div class="summary-event">
      <p class="fw-bold mb-1">{{ event.title }}</p>
      <p class="text-muted small mb-0">{{ formatDate(event.event_date) }} · {{ formatTimeRange(event.start_time, event.end_time) }}</p>
      <p class="text-muted small mb-0">{{ locationLabel }}</p>
    </div>

    <dl class="summary-list">
      <div class="summary-row">
        <dt>Seats reserved</dt>
        <dd>{{ safeReservedSeats }}</dd>
      </div>
      <div class="summary-row">
        <dt>Price each</dt>
        <dd>{{ formatCurrency(event.price) }}</dd>
      </div>
      <div class="summary-row">
        <dt>Seats left</dt>
        <dd>{{ event.seats_left }}</dd>
      </div>
      <div class="summary-row summary-total">
        <dt>Total</dt>
        <dd>{{ formatCurrency(total) }}</dd>
      </div>
    </dl>

    <p class="summary-note mb-0">You can review all confirmed bookings from the history page after submission.</p>
  </aside>
</template>