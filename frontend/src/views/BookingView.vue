<script>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import BookingSummary from '@/components/BookingSummary.vue';
import LoadingState from '@/components/LoadingState.vue';
import { useEventStore } from '@/stores/eventStore';
import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/authStore';

export default {
  components: {BookingSummary, LoadingState},
  setup() {
    const route = useRoute();
    const eventStore = useEventStore();
    const bookingStore = useBookingStore();
    const auth = useAuthStore();
    const event = ref(null);
    const loading = ref(true);
    const submitting = ref(false);
    const error = ref('');
    const success = ref('');
    const bookingReference = ref('');
    const copyStatus = ref('');
    const attemptedSubmit = ref(false);

    const form = reactive({
      seat_count: 1,
      attendee_name: auth.user?.name || '',
      attendee_email: auth.user?.email || ''
    });

    const seatsLeft = computed(() => Number(event.value?.seats_left ?? 0));
    const maxSeats = computed(() => Math.max(1, Math.min(seatsLeft.value || 1, 6)));
    const isSoldOut = computed(() => seatsLeft.value <= 0);

    const fieldErrors = computed(() => {
      const errors = {};
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const seatCount = Number(form.seat_count);
      if (!form.attendee_name.trim()) errors.attendee_name = 'Enter the attendee name.';
      if (!form.attendee_email.trim()) errors.attendee_email = 'Enter the attendee email address.';
      else if (!emailPattern.test(form.attendee_email.trim())) errors.attendee_email = 'Enter a valid email address.';
      if (!Number.isInteger(seatCount) || seatCount < 1) errors.seat_count = 'Choose at least 1 seat.';
      else if (event.value && seatCount > maxSeats.value) errors.seat_count = `Choose ${maxSeats.value} seats or fewer.`;
      if (isSoldOut.value) errors.seat_count = 'This event is sold out.';
      return errors;
    });

    const hasErrors = computed(() => Object.keys(fieldErrors.value).length > 0);
    const canSubmit = computed(() => !submitting.value && !hasErrors.value && !success.value);

    function showError(name) {
      return attemptedSubmit.value && Boolean(fieldErrors.value[name]);
    }

    async function copyBookingReference() {
      if (!bookingReference.value) return;

      try {
        await navigator.clipboard.writeText(bookingReference.value);
        copyStatus.value = 'Reference copied';
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = bookingReference.value;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
          document.execCommand('copy');
          copyStatus.value = 'Reference copied';
        } catch {
          copyStatus.value = 'Copy failed. Select and copy the reference manually.';
        } finally {
          document.body.removeChild(textarea);
        }
      }

      window.setTimeout(() => {
        copyStatus.value = '';
      }, 2200);
    }

    async function submitBooking() {
      attemptedSubmit.value = true;
      error.value = '';
      success.value = '';
      copyStatus.value = '';

      if (hasErrors.value) {
        error.value = Object.values(fieldErrors.value)[0];
        return;
      }

      submitting.value = true;

      try {
        const booking = await bookingStore.createBooking({
          event_id: Number(route.params.id),
          seat_count: Number(form.seat_count),
          attendee_name: form.attendee_name.trim(),
          attendee_email: form.attendee_email.trim()
        });

        bookingReference.value = booking.booking_reference;
        success.value = 'Booking confirmed. Your reference number is shown below.';
      } catch (err) {
        error.value = err.message;
      } finally {
        submitting.value = false;
      }
    }

    onMounted(async () => {
      try {
        event.value = await eventStore.fetchEvent(route.params.id);
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    });

    return {event, loading, submitting, error, success, bookingReference, copyStatus, form, maxSeats, isSoldOut, attemptedSubmit, fieldErrors, canSubmit, showError, copyBookingReference, submitBooking};
  }
};
</script>

<template>
  <div class="container section-pad booking-page">
    <LoadingState v-if="loading" />

    <section v-else-if="error && !event" class="error-panel" aria-labelledby="booking-error-title">
      <h1 id="booking-error-title" class="h4 fw-bold">Booking page could not be loaded</h1>
      <p class="text-muted mb-4">{{ error }}</p>
      <RouterLink class="btn btn-primary btn-pill" to="/events">Back to events</RouterLink>
    </section>

    <div v-else-if="event" class="row g-4 align-items-stretch booking-layout">
      <div class="col-lg-7 booking-main-column">
        <header class="mb-4">
          <p class="text-primary fw-semibold mb-2">Secure booking</p>
          <h1 class="display-6 fw-bold mb-2">Book {{ event.title }}</h1>
          <p class="text-muted mb-0">Complete the form below. Seat availability is checked again when you submit.</p>
        </header>

        <section v-if="success" class="confirmation-panel mb-0" aria-labelledby="booking-confirmed-title" role="status">
          <p class="text-primary fw-semibold mb-2">Confirmed</p>
          <h2 id="booking-confirmed-title" class="h4 fw-bold mb-2">Your booking is complete</h2>
          <p class="text-muted mb-3">{{ success }}</p>

          <div class="booking-reference-box">
            <div class="booking-reference-top">
              <span>Reference number</span>
              <button class="copy-reference-button" type="button" :aria-label="`Copy booking reference ${bookingReference}`" @click="copyBookingReference">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M8 7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-1v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3h1V7Zm2 1h3a3 3 0 0 1 3 3v3h1a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v1Zm-3 2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H7Z" />
                </svg>
              </button>
            </div>
            <strong>{{ bookingReference }}</strong>
            <p class="copy-reference-status" aria-live="polite">{{ copyStatus }}</p>
          </div>

          <div class="d-flex flex-column flex-sm-row gap-2 mt-4">
            <RouterLink class="btn btn-primary btn-pill" to="/history">View booking history</RouterLink>
            <RouterLink class="btn btn-outline-primary btn-pill" to="/events">Browse more events</RouterLink>
          </div>
        </section>

        <form v-else class="booking-form-card" novalidate @submit.prevent="submitBooking">
          <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

          <div class="booking-progress mb-4" aria-label="Booking steps">
            <span class="active">Details</span>
            <span>Review</span>
            <span>Confirm</span>
          </div>

          <div class="mb-3">
            <label for="attendeeName" class="form-label">Attendee name</label>
            <input id="attendeeName" v-model.trim="form.attendee_name" class="form-control" :class="{ 'is-invalid': showError('attendee_name') }" required autocomplete="name" :aria-invalid="showError('attendee_name') ? 'true' : 'false'" aria-describedby="attendeeNameHelp attendeeNameError" />
            <div id="attendeeNameHelp" class="form-text">Use the name that should appear on the booking record.</div>
            <div v-if="showError('attendee_name')" id="attendeeNameError" class="invalid-feedback">{{ fieldErrors.attendee_name }}</div>
          </div>

          <div class="mb-3">
            <label for="attendeeEmail" class="form-label">Attendee email</label>
            <input id="attendeeEmail" v-model.trim="form.attendee_email" class="form-control" :class="{ 'is-invalid': showError('attendee_email') }" type="email" required autocomplete="email" :aria-invalid="showError('attendee_email') ? 'true' : 'false'" aria-describedby="attendeeEmailHelp attendeeEmailError" />
            <div id="attendeeEmailHelp" class="form-text">The booking reference will be associated with this email.</div>
            <div v-if="showError('attendee_email')" id="attendeeEmailError" class="invalid-feedback">{{ fieldErrors.attendee_email }}</div>
          </div>

          <div class="mb-4">
            <label for="seatCount" class="form-label">Seats</label>
            <input id="seatCount" v-model.number="form.seat_count" class="form-control" :class="{ 'is-invalid': showError('seat_count') }" type="number" min="1" :max="maxSeats" required inputmode="numeric" :disabled="isSoldOut" :aria-invalid="showError('seat_count') ? 'true' : 'false'" aria-describedby="seatCountHelp seatCountError" />

            <div id="seatCountHelp" class="form-text">Maximum {{ maxSeats }} seats per booking. {{ event.seats_left }} seats left.</div>
            <div v-if="showError('seat_count')" id="seatCountError" class="invalid-feedback">{{ fieldErrors.seat_count }}</div>
          </div>

          <div class="d-flex flex-column flex-sm-row gap-2">
            <button class="btn btn-primary btn-lg btn-pill btn-hover-elevate" type="submit" :disabled="!canSubmit">
              {{ submitting ? 'Confirming...' : 'Confirm booking' }}
            </button>
            <RouterLink class="btn btn-outline-primary btn-lg btn-pill" :to="`/events/${event.id}`">Back to event</RouterLink>
          </div>
        </form>
      </div>

      <div class="col-lg-5 booking-summary-column">
        <BookingSummary :event="event" :reserved-seats="Number(form.seat_count) || 1" />
      </div>
    </div>
  </div>
</template>
