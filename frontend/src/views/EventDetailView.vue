<script>
  import { computed, onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import LoadingState from '@/components/LoadingState.vue';
  import { useEventStore } from '@/stores/eventStore';
  import { useAuthStore } from '@/stores/authStore';
  import { api } from '@/services/api';
  import { formatCurrency, formatDate, formatTimeRange } from '@/utils/formatters';

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
      const seatBadge = computed(() => {
        if (!event.value) return 'Unknown';
        if (event.value.seats_left <= 0) return 'Sold out';
        if (event.value.seats_left <= 10) return 'Limited seats';
        return 'Seats available';
      });
      async function loadWeather(city) {
        try {
          const data = await api.get(`/external/weather?city=${encodeURIComponent(city)}`);
          weather.value = data;
        } catch (err) {
          weatherError.value = 'Weather information is currently unavailable.';
        }
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

      return {auth, event, loading, error, weather, weatherError, seatBadge, formatCurrency, formatDate, formatTimeRange};
    }
  };
</script>

<template>
  <div class="container section-pad app-shell">
    <LoadingState v-if="loading" />
    <div v-else-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
    <article v-else-if="event" class="row g-4">
      <div class="col-lg-7">
        <img :src="event.image_url" :alt="`${event.title} event banner`" class="detail-image mb-4" />
        <span class="badge badge-soft rounded-pill mb-3">{{ event.category }}</span>
        <h1 class="display-6 fw-bold">{{ event.title }}</h1>
        <p class="lead text-muted">{{ event.description }}</p>

        <section class="card card-lift bg-white p-4 my-4" aria-labelledby="accessibility-title">
          <h2 id="accessibility-title" class="h4">Accessibility notes</h2>
          <p class="mb-0">{{ event.accessibility_notes }}</p>
        </section>
      </div>

      <div class="col-lg-5">
        <aside class="card card-lift bg-white p-4 sticky-lg-top" style="top: 6rem" aria-labelledby="event-details-title">
          <h2 id="event-details-title" class="h4">Event details</h2>
          <dl class="row mb-4">
            <dt class="col-5 text-muted">Date</dt>
            <dd class="col-7">{{ formatDate(event.event_date) }}</dd>
            <dt class="col-5 text-muted">Time</dt>
            <dd class="col-7">{{ formatTimeRange(event.start_time, event.end_time) }}</dd>
            <dt class="col-5 text-muted">Location</dt>
            <dd class="col-7">{{ event.location }}, {{ event.city }}</dd>
            <dt class="col-5 text-muted">Price</dt>
            <dd class="col-7">{{ formatCurrency(event.price) }}</dd>
            <dt class="col-5 text-muted">Seats</dt>
            <dd class="col-7">{{ event.seats_left }} / {{ event.capacity }} left</dd>
          </dl>

          <div class="alert" :class="event.seats_left > 0 ? 'alert-primary' : 'alert-warning'" role="status">
            {{ seatBadge }}
          </div>

          <div v-if="auth.isAdmin" class="d-grid gap-2">
            <RouterLink class="btn btn-primary btn-lg" :to="`/admin/events/${event.id}/edit`">Edit event</RouterLink>
            <RouterLink class="btn btn-outline-secondary" to="/admin/events">Back to manage events</RouterLink>
          </div>

          <template v-else>
            <RouterLink v-if="event.seats_left > 0 && auth.isAuthenticated" class="btn btn-primary btn-lg w-100" :to="`/events/${event.id}/book`">
              Book tickets
            </RouterLink>
            <RouterLink v-else-if="event.seats_left > 0" class="btn btn-primary btn-lg w-100" :to="{ name: 'login', query: { redirect: `/events/${event.id}/book` } }">
              Log in to book
            </RouterLink>
            <button v-else class="btn btn-secondary btn-lg w-100" disabled>Sold out</button>
          </template>

          <section class="mt-4 pt-4 border-top" aria-labelledby="weather-title">
            <h3 id="weather-title" class="h6 text-uppercase text-muted">Weather near the venue</h3>
            <p v-if="weather" class="mb-0">{{ weather.location }}: {{ weather.current.temperature_2m }}°C, wind {{ weather.current.wind_speed_10m }} km/h</p>
            <p v-else class="text-muted mb-0">{{ weatherError || 'Loading weather...' }}</p>
          </section>
        </aside>
      </div>
    </article>
  </div>
</template>