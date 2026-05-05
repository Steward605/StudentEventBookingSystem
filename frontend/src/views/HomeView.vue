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

    const featureCards = [
      {
        title: 'Discover faster',
        text: 'Browse upcoming workshops, club sessions, showcases, and career activities from one clean event hub.',
        icon: '01'
      },
      {
        title: 'Book with confidence',
        text: 'See seat availability before committing, then reserve your spot through a clear step-by-step booking flow.',
        icon: '02'
      },
      {
        title: 'Track participation',
        text: 'Keep your booked and attended events organised so your campus involvement is easy to review later.',
        icon: '03'
      }
    ];

    const processSteps = [
      'Search events by title, category, location, or description.',
      'Compare date, time, price, venue, accessibility notes, and available seats.',
      'Log in, book your ticket, then manage your activity from your dashboard.'
    ];

    onMounted(() => {
      if (eventStore.events.length === 0) eventStore.fetchEvents();
    });

    return {eventStore, featuredEvents, totalEvents, totalCategories, freeEvents, featureCards, processSteps};
  }
};
</script>

<template>
  <section class="hero home-hero py-5" aria-labelledby="home-title">
    <div class="container py-lg-5">
      <div class="row align-items-center g-5">
        <div class="col-lg-7">
          <span class="badge text-bg-light text-primary rounded-pill mb-3">Student experience platform</span>
          <h1 id="home-title" class="display-4 fw-bold lh-1 mb-3">Find campus events and manage your bookings in one place.</h1>
          <p class="lead mb-4">A clearer, faster, and more accessible way for students to discover activities, reserve seats, and keep track of their campus journey.</p>

          <div class="d-flex flex-column flex-sm-row gap-3 mb-4">
            <RouterLink class="btn btn-light btn-lg btn-pill btn-hover-elevate" to="/events">Explore events</RouterLink>
            <RouterLink class="btn btn-outline-light btn-lg btn-pill" to="/register">Create account</RouterLink>
          </div>

          <dl class="home-metrics" aria-label="Platform summary">
            <div class="home-metric">
              <dt>{{ totalEvents }}</dt>
              <dd>Events listed</dd>
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
            <p class="text-primary fw-semibold mb-2">Designed for student life</p>
            <h2 id="hero-card-title" class="h3 fw-bold mb-3">Plan your week without scattered noticeboards.</h2>
            <p class="text-muted mb-4">Everything is grouped into a simple event journey: browse, compare, book, and review.</p>

            <ol class="home-process-list">
              <li v-for="step in processSteps" :key="step">{{ step }}</li>
            </ol>

            <RouterLink class="btn btn-primary btn-pill w-100 mt-3" to="/events">Start browsing</RouterLink>
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
          <h2 id="featured-events-title" class="h1 fw-bold mb-2">Plan your next campus experience</h2>
          <p class="text-muted mb-0">A quick preview of upcoming opportunities students can book.</p>
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

  <section class="pb-5 mb-5" aria-labelledby="platform-benefits-title">
    <div class="container">
      <div class="text-center mb-5">
        <p class="text-primary fw-semibold mb-2">Why it works</p>
        <h2 id="platform-benefits-title" class="h1 fw-bold text-dark">Everything students need for campus life</h2>
        <p class="text-muted mx-auto mt-3 home-section-intro">The interface is structured around quick scanning, confident booking, and accessible information for different users and devices.</p>
      </div>

      <div class="row g-4">
        <div v-for="card in featureCards" :key="card.title" class="col-md-4">
          <article class="card premium-card bg-white p-4 p-xl-5 h-100 border-0 text-center">
            <div class="feature-icon mx-auto mb-4" aria-hidden="true">{{ card.icon }}</div>
            <h3 class="h5 fw-bold">{{ card.title }}</h3>
            <p class="text-muted mb-0 small">{{ card.text }}</p>
          </article>
        </div>
      </div>

      <div class="home-cta-panel mt-5">
        <div>
          <p class="text-primary fw-semibold mb-2">Ready to begin?</p>
          <h3 class="h2 fw-bold mb-2">Upgrade the event booking experience.</h3>
          <p class="text-muted mb-0">Create an account to book tickets, manage your activity history, and update your profile.</p>
        </div>
        <RouterLink class="btn btn-primary btn-lg btn-pill btn-hover-elevate" to="/register">Create your free account</RouterLink>
      </div>
    </div>
  </section>
</template>