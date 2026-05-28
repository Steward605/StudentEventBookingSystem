<script>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import LoadingState from '@/components/LoadingState.vue';
import { useEventStore } from '@/stores/eventStore';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { formatCurrency, formatDate, formatTimeRange } from '@/utils/formatters';

const fallbackSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#e8eefc"/>
      <stop offset="52%" stop-color="#d9e7ff"/>
      <stop offset="100%" stop-color="#eff7ff"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="700" fill="url(#g)"/>
  <circle cx="930" cy="120" r="180" fill="#cde3ff" opacity="0.8"/>
  <circle cx="180" cy="620" r="220" fill="#ffffff" opacity="0.72"/>
  <rect x="140" y="170" width="920" height="360" rx="48" fill="#ffffff" opacity="0.76"/>
  <text x="600" y="335" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="#193dc4">Student Event</text>
  <text x="600" y="405" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#475467">Campus booking experience</text>
</svg>
`);

export default {
  components: {LoadingState},
  setup() {
    const route = useRoute();
    const eventStore = useEventStore();
    const auth = useAuthStore();
    const event = ref(null);
    const loading = ref(true);
    const error = ref('');
    const weather = ref(null);
    const weatherError = ref('');
    const weatherLoading = ref(false);
    const imageFailed = ref(false);
    const fallbackImage = `data:image/svg+xml;charset=UTF-8,${fallbackSvg}`;

    const eventId = computed(() => Number(route.params.id));
    const seatsLeft = computed(() => Number(event.value?.seats_left ?? 0));
    const capacity = computed(() => Number(event.value?.capacity ?? 0));
    const isSoldOut = computed(() => seatsLeft.value <= 0);
    const imageSource = computed(() => imageFailed.value || !event.value?.image_url ? fallbackImage : event.value.image_url);
    const imageAlt = computed(() => event.value?.title ? `${event.value.title} event banner` : 'Event banner');
    const locationLabel = computed(() => {
      if (!event.value) return '';
      return [event.value.location, event.value.city].filter(Boolean).join(', ');
    });

    const seatBadge = computed(() => {
      if (isSoldOut.value) return {label: 'Sold out', className: 'seat-notice-danger'};
      if (seatsLeft.value <= 10) return {label: 'Limited seats available', className: 'seat-notice-warning'};
      return {label: 'Seats available', className: 'seat-notice-success'};
    });

    const detailRows = computed(() => {
      if (!event.value) return [];
      return [
        {label: 'Date', value: formatDate(event.value.event_date)},
        {label: 'Time', value: formatTimeRange(event.value.start_time, event.value.end_time)},
        {label: 'Location', value: locationLabel.value || 'Location to be confirmed'},
        {label: 'Price', value: formatCurrency(event.value.price)},
        {label: 'Seats', value: `${seatsLeft.value} of ${capacity.value} left`}
      ];
    });

    const bookingRoute = computed(() => `/events/${eventId.value}/book`);
    const loginRoute = computed(() => ({name: 'login', query: {redirect: bookingRoute.value}}));

    async function loadWeather(city) {
      if (!city) {
        weatherError.value = 'Weather information is unavailable because the event city is missing.';
        return;
      }

      weatherLoading.value = true;
      weatherError.value = '';

      try {
        weather.value = await api.get(`/external/weather?city=${encodeURIComponent(city)}`);
      } catch {
        weatherError.value = 'Weather information is currently unavailable.';
      } finally {
        weatherLoading.value = false;
      }
    }

    function useFallbackImage() {
      imageFailed.value = true;
    }

    onMounted(async () => {
      try {
        event.value = await eventStore.fetchEvent(route.params.id);
        loadWeather(event.value.city);
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    });

    return {auth, event, loading, error, weather, weatherError, weatherLoading, imageSource, imageAlt, seatsLeft, isSoldOut, seatBadge, detailRows, bookingRoute, loginRoute, useFallbackImage};
  }
};
</script>

<template>
  <div class="container section-pad event-detail-page">
    <LoadingState v-if="loading" />

    <section v-else-if="error" class="error-panel" aria-labelledby="event-error-title">
      <h1 id="event-error-title" class="h4 fw-bold">Event could not be loaded</h1>
      <p class="text-muted mb-4">{{ error }}</p>
      <RouterLink class="btn btn-primary btn-pill" to="/events">Back to events</RouterLink>
    </section>

    <article v-else-if="event" class="event-detail-layout">
      <div class="event-detail-main">
        <div class="detail-media-card mb-4">
          <img :src="imageSource" :alt="imageAlt" class="event-detail-image" loading="eager" @error="useFallbackImage" />
          <span class="detail-category-badge">{{ event.category }}</span>
        </div>

        <section class="detail-main-card" aria-labelledby="event-title">
          <p class="text-primary fw-semibold mb-2">Event details</p>
          <h1 id="event-title" class="display-6 fw-bold mb-3">{{ event.title }}</h1>
          <p class="lead text-muted mb-0">{{ event.description }}</p>
        </section>

        <section class="detail-main-card mt-4" aria-labelledby="accessibility-title">
          <div class="detail-section-heading">
            <div>
              <p class="text-primary fw-semibold mb-1">Accessibility</p>
              <h2 id="accessibility-title" class="h4 fw-bold mb-0">Accessibility notes</h2>
            </div>
          </div>
          <p class="text-muted mb-0">{{ event.accessibility_notes || 'No accessibility notes have been provided for this event yet.' }}</p>
        </section>
      </div>

      <div class="event-detail-sidebar">
        <aside class="event-detail-panel" aria-labelledby="event-details-title">
          <div class="d-flex align-items-start justify-content-between gap-3 mb-4">
            <div>
              <p class="text-primary fw-semibold mb-1">Booking information</p>
              <h2 id="event-details-title" class="h4 fw-bold mb-0">Summary</h2>
            </div>
            <span :class="['seat-notice', seatBadge.className]" role="status">{{ seatBadge.label }}</span>
          </div>

          <dl class="detail-list">
            <div v-for="row in detailRows" :key="row.label" :class="['detail-list-row', { 'detail-list-row-wide': row.label === 'Location' }]">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>

          <div v-if="auth.isAdmin" class="d-grid gap-2 mt-4">
            <RouterLink class="btn btn-primary btn-lg btn-pill" :to="`/admin/events/${event.id}/edit`">Edit event</RouterLink>
            <RouterLink class="btn btn-outline-primary btn-pill" to="/admin/events">Back to manage events</RouterLink>
          </div>

          <div v-else class="d-grid gap-2 mt-4">
            <RouterLink v-if="!isSoldOut && auth.isAuthenticated" class="btn btn-primary btn-lg btn-pill btn-hover-elevate" :to="bookingRoute">Book tickets</RouterLink>
            <RouterLink v-else-if="!isSoldOut" class="btn btn-primary btn-lg btn-pill btn-hover-elevate" :to="loginRoute">Log in to book</RouterLink>
            <button v-else class="btn btn-secondary btn-lg btn-pill" type="button" disabled>Sold out</button>
            <RouterLink class="btn btn-outline-primary btn-pill" to="/events">Browse more events</RouterLink>
          </div>

          <section class="weather-card mt-4" aria-labelledby="weather-title">
            <h3 id="weather-title" class="h6 fw-bold text-uppercase text-muted mb-2">Weather near the venue</h3>
            <p v-if="weatherLoading" class="text-muted mb-0" role="status">Loading weather...</p>
            <p v-else-if="weather" class="mb-0">{{ weather.location }}: {{ weather.current.temperature_2m }}°C, wind {{ weather.current.wind_speed_10m }} km/h</p>
            <p v-else class="text-muted mb-0">{{ weatherError || 'Weather information is unavailable.' }}</p>
          </section>
        </aside>
      </div>
    </article>
  </div>
</template>
