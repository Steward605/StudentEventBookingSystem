<script>
import { computed, onMounted } from 'vue';
import EventCard from '@/components/EventCard.vue';
import LoadingState from '@/components/LoadingState.vue';
import EmptyState from '@/components/EmptyState.vue';
import { useEventStore } from '@/stores/eventStore';

export default {
  components: {EventCard, LoadingState, EmptyState},
  setup() {
    const eventStore = useEventStore();
    const featuredEvents = computed(() => eventStore.featuredEvents);
    const totalEvents = computed(() => eventStore.events.length);
    const totalCategories = computed(() => eventStore.categories.length);
    const freeEvents = computed(() => eventStore.events.filter(event => Number(event.price) === 0).length);
    onMounted(() => {
      if (eventStore.events.length === 0) eventStore.fetchEvents();
    });

    return {eventStore, featuredEvents, totalEvents, totalCategories, freeEvents};
  }
};
</script>

<template>
  <section class="hero home-hero py-5" aria-labelledby="home-title">
    <div class="container py-lg-5">
      <div class="row align-items-center g-5">
        <div class="col-lg-7">
          <span class="badge text-bg-light text-primary rounded-pill mb-3">
            University event booking system
          </span>

          <h1 id="home-title" class="display-4 fw-bold lh-1 mb-3">
            Student Event Booking System
          </h1>

          <p class="lead mb-4">
            Browse approved campus events, reserve available seats, and keep a record of your event bookings.
          </p>

          <div class="d-flex flex-column flex-sm-row gap-3 mb-4">
            <RouterLink class="btn btn-light btn-lg btn-pill btn-hover-elevate" to="/events">
              View events
            </RouterLink>

            <RouterLink class="btn btn-outline-light btn-lg btn-pill" to="/login">
              Student login
            </RouterLink>
          </div>

          <dl class="home-metrics" aria-label="Event system summary">
            <div class="home-metric">
              <dt>{{ totalEvents }}</dt>
              <dd>Listed events</dd>
            </div>
            <div class="home-metric">
              <dt>{{ totalCategories }}</dt>
              <dd>Categories</dd>
            </div>
            <div class="home-metric">
              <dt>{{ freeEvents }}</dt>
              <dd>Free events</dd>
            </div>
          </dl>
        </div>

        <div class="col-lg-5">
          <aside class="hero-card home-hero-card p-4 p-md-5" aria-labelledby="hero-card-title">
            <p class="text-primary fw-semibold mb-2">System access</p>
            <h2 id="hero-card-title" class="h3 fw-bold mb-3">
              Event services for students and staff
            </h2>
            <dl class="home-access-list mb-4">
              <div>
                <dt>Students</dt>
                <dd>Browse events, reserve seats, and review booking history.</dd>
              </div>
              <div>
                <dt>Organisers</dt>
                <dd>Create and manage hosted events after account verification.</dd>
              </div>
              <div>
                <dt>Administrators</dt>
                <dd>Manage users, event records, and booking records.</dd>
              </div>
            </dl>
            <RouterLink class="btn btn-primary btn-pill w-100" to="/events">
              Open event catalogue
            </RouterLink>
          </aside>
        </div>
      </div>
    </div>
  </section>

  <section class="section-pad" aria-labelledby="featured-events-title">
    <div class="container">
      <div class="row align-items-end g-3 mb-4">
        <div class="col-lg-8">
          <p class="text-primary fw-semibold mb-2">Featured events</p>
          <h2 id="featured-events-title" class="h1 fw-bold mb-2">Upcoming campus events</h2>
          <p class="text-muted mb-0">View a selection of events currently available for student booking.</p>
        </div>
        <div class="col-lg-4 text-lg-end">
          <RouterLink to="/events" class="btn btn-outline-primary btn-pill">View all events</RouterLink>
        </div>
      </div>

      <div v-if="eventStore.error" class="alert alert-danger" role="alert">{{ eventStore.error }}</div>
      <LoadingState v-if="eventStore.loading" />
      <EmptyState v-else-if="featuredEvents.length === 0" title="No featured events yet" message="Events will appear here once they are available." />

      <div v-else class="row g-4">
        <div v-for="event in featuredEvents" :key="event.id" class="col-md-6 col-xl-4">
          <EventCard :event="event" />
        </div>
      </div>
    </div>
  </section>
</template>
