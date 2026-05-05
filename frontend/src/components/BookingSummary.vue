<script>
  import { computed } from 'vue';
  import { formatCurrency, formatDate } from '@/utils/formatters';
  export default {
    props: {
      event: { type: Object, required: true },
      tickets: { type: Number, default: 1 }
    },
    setup(props) {
      const total = computed(() => Number(props.event.price || 0) * props.tickets);
      return {
        total,
        formatCurrency,
        formatDate
      };
    }
  };
</script>

<template>
  <aside class="card card-lift p-4" aria-labelledby="booking-summary-title">
    <h2 id="booking-summary-title" class="h5">Booking summary</h2>
    <p class="mb-1 fw-semibold">{{ event.title }}</p>
    <p class="text-muted small mb-3">{{ formatDate(event.event_date) }} at {{ event.start_time }}</p>
    <div class="d-flex justify-content-between border-top pt-3">
      <span>Tickets</span>
      <strong>{{ tickets }}</strong>
    </div>
    <div class="d-flex justify-content-between mt-2">
      <span>Price each</span>
      <strong>{{ formatCurrency(event.price) }}</strong>
    </div>
    <div class="d-flex justify-content-between mt-3 fs-5">
      <span>Total</span>
      <strong>{{ formatCurrency(total) }}</strong>
    </div>
  </aside>
</template>
