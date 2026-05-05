<script>
  import { computed, onMounted, reactive, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import BookingSummary from '@/components/BookingSummary.vue';
  import LoadingState from '@/components/LoadingState.vue';
  import { useEventStore } from '@/stores/eventStore';
  import { useBookingStore } from '@/stores/bookingStore';
  import { useAuthStore } from '@/stores/authStore';

  export default {
    components: { BookingSummary, LoadingState },
    setup() {
      const route = useRoute();
      const router = useRouter();
      const eventStore = useEventStore();
      const bookingStore = useBookingStore();
      const auth = useAuthStore();
      const event = ref(null);
      const loading = ref(true);
      const submitting = ref(false);
      const error = ref('');
      const success = ref('');
      const form = reactive({
        ticket_count: 1,
        attendee_name: auth.user?.name || '',
        attendee_email: auth.user?.email || ''
      });
      const maxTickets = computed(() => Math.min(Number(event.value?.seats_left || 1), 6));

      onMounted(async () => {
        try {
          event.value = await eventStore.fetchEvent(route.params.id);
        } catch (err) {
          error.value = err.message;
        } finally {
          loading.value = false;
        }
      });

      async function submitBooking() {
        submitting.value = true;
        error.value = '';
        success.value = '';
        try {
          const booking = await bookingStore.createBooking({
            event_id: Number(route.params.id),
            ticket_count: Number(form.ticket_count),
            attendee_name: form.attendee_name,
            attendee_email: form.attendee_email
          });
          success.value = `Booking confirmed. Reference: ${booking.booking_reference}`;
          window.setTimeout(() => router.push('/history'), 1000);
        } catch (err) {
          error.value = err.message;
        } finally {
          submitting.value = false;
        }
      }

      return {event, loading, submitting, error, success, form, maxTickets, submitBooking};
    }
  };
</script>

<template>
  <div class="container section-pad app-shell">
    <LoadingState v-if="loading" />
    <div v-else-if="error && !event" class="alert alert-danger" role="alert">{{ error }}</div>
    <div v-else-if="event" class="row g-4">
      <div class="col-lg-7">
        <p class="text-primary fw-semibold mb-2">Secure booking</p>
        <h1 class="display-6 fw-bold">Book {{ event.title }}</h1>
        <p class="text-muted">Complete the details below. We will verify real-time seat availability before confirming your booking.</p>

        <form class="card card-lift bg-white p-4" @submit.prevent="submitBooking">
          <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
          <div v-if="success" class="alert alert-success" role="status">{{ success }}</div>

          <div class="mb-3">
            <label for="attendeeName" class="form-label">Attendee name</label>
            <input id="attendeeName" v-model.trim="form.attendee_name" class="form-control" required autocomplete="name" />
          </div>
          <div class="mb-3">
            <label for="attendeeEmail" class="form-label">Attendee email</label>
            <input id="attendeeEmail" v-model.trim="form.attendee_email" class="form-control" type="email" required autocomplete="email" />
          </div>
          <div class="mb-4">
            <label for="ticketCount" class="form-label">Tickets</label>
            <input id="ticketCount" v-model.number="form.ticket_count" class="form-control" type="number" min="1" :max="maxTickets" required />
            <div class="form-text">Maximum {{ maxTickets }} tickets per booking.</div>
          </div>
          <button class="btn btn-primary btn-lg" type="submit" :disabled="submitting">
            {{ submitting ? 'Confirming...' : 'Confirm booking' }}
          </button>
        </form>
      </div>
      <div class="col-lg-5">
        <BookingSummary :event="event" :tickets="Number(form.ticket_count) || 1" />
      </div>
    </div>
  </div>
</template>
