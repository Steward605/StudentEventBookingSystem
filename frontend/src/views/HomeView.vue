<script>
  import { onMounted } from 'vue';
  import EventCard from '@/components/EventCard.vue';
  import LoadingState from '@/components/LoadingState.vue';
  import { useEventStore } from '@/stores/eventStore';

  export default {
    components: {EventCard, LoadingState},
    setup() {
      const eventStore = useEventStore();
      onMounted(() => {
        if (eventStore.events.length === 0) eventStore.fetchEvents();
      });

      return {eventStore};
    }
  };
</script>

<template>
  <section class="hero py-5">
    <div class="container py-lg-5">
      <div class="row align-items-center g-4">
        <div class="col-lg-7">
          <span class="badge text-bg-light text-primary rounded-pill mb-3">Student experience platform</span>
          <h1 class="display-4 fw-bold lh-1 mb-3">Find campus events and manage your bookings in one place.</h1>
          <p class="lead mb-4">Student Event Booking System helps students browse upcoming activities, reserve tickets, and keep track of events they have joined.</p>
          <div class="d-flex flex-column flex-sm-row gap-3">
            <RouterLink class="btn btn-light btn-lg" to="/events">Explore events</RouterLink>
            <RouterLink class="btn btn-outline-light btn-lg" to="/register">Create account</RouterLink>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="hero-card text-dark p-4">
            <p class="text-muted mb-1">This month</p>
            <h2 class="h4">Curated student activities</h2>
            <ul class="list-unstyled mb-0">
              <li class="py-2 border-bottom">Design showcases and prototype reviews</li>
              <li class="py-2 border-bottom">Career clinics and portfolio sessions</li>
              <li class="py-2">Community, wellbeing, and student club events</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section-pad">
    <div class="container">
      <div class="row align-items-end mb-4">
        <div class="col-md-8">
          <p class="text-primary fw-semibold mb-2">Featured events</p>
          <h2 class="h1">Plan your next campus experience</h2>
        </div>
        <div class="col-md-4 text-md-end">
          <RouterLink to="/events" class="btn btn-outline-primary">View all events</RouterLink>
        </div>
      </div>

      <LoadingState v-if="eventStore.loading" />
      <div v-else class="row g-4">
        <div v-for="event in eventStore.featuredEvents" :key="event.id" class="col-md-6 col-xl-4">
          <EventCard :event="event" />
        </div>
      </div>
    </div>
  </section>

  <section class="pb-5 mb-5">
    <div class="container">
      <div class="text-center mb-5">
        <h2 class="h1 fw-bold text-dark">Everything you need for campus life</h2>
        <p class="text-muted mx-auto mt-3" style="max-width: 600px;">
          Stop relying on scattered noticeboards and messy group chats. Our platform streamlines your entire extracurricular journey.
        </p>
      </div>

      <div class="row g-4">
        <div class="col-md-4">
          <div class="card premium-card bg-white p-4 p-xl-5 h-100 border-0 text-center">
            <div class="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-4 mx-auto" style="width: 4.5rem; height: 4.5rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16.016a7.5 7.5 0 0 0 1.962-14.74A1 1 0 0 0 9 0H7a1 1 0 0 0-.962 1.276A7.5 7.5 0 0 0 8 16.016zm6.5-7.516a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/>
                <path d="m6.94 7.44 4.95-2.83-2.83 4.95-4.949 2.83 2.828-4.95z"/>
              </svg>
            </div>
            <h3 class="h5 fw-bold">Discover Opportunities</h3>
            <p class="text-muted mb-0 small">Find workshops, networking sessions, and club events that perfectly align with your career goals and interests.</p>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="card premium-card bg-white p-4 p-xl-5 h-100 border-0 text-center">
            <div class="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-4 mx-auto" style="width: 4.5rem; height: 4.5rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4 4.85v.9h1v-.9H4Zm7 0v.9h1v-.9h-1Zm-7 1.8v.9h1v-.9H4Zm7 0v.9h1v-.9h-1Zm-7 1.8v.9h1v-.9H4Zm7 0v.9h1v-.9h-1Zm-7 1.8v.9h1v-.9H4Zm7 0v.9h1v-.9h-1Z"/>
                <path d="M1.5 3A1.5 1.5 0 0 0 0 4.5V6a.5.5 0 0 0 .5.5 1.5 1.5 0 1 1 0 3 .5.5 0 0 0-.5.5v1.5A1.5 1.5 0 0 0 1.5 13h13a1.5 1.5 0 0 0 1.5-1.5v-1.5a.5.5 0 0 0-.5-.5 1.5 1.5 0 1 1 0-3 .5.5 0 0 0 .5-.5V4.5A1.5 1.5 0 0 0 14.5 3h-13ZM1 4.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5v1.05a2.5 2.5 0 1 0 0 4.9v1.05a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-1.05a2.5 2.5 0 0 0 0-4.9V4.5Z"/>
              </svg>
            </div>
            <h3 class="h5 fw-bold">Hassle-Free Booking</h3>
            <p class="text-muted mb-0 small">Reserve your spot instantly with real-time seat availability and manage all your digital tickets in one place.</p>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="card premium-card bg-white p-4 p-xl-5 h-100 border-0 text-center">
            <div class="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-4 mx-auto" style="width: 4.5rem; height: 4.5rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M0 0h1v15h15v1H0V0Zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5Z"/>
              </svg>
            </div>
            <h3 class="h5 fw-bold">Track Your Journey</h3>
            <p class="text-muted mb-0 small">Build an impressive extracurricular portfolio by keeping a verifiable history of your campus participation.</p>
          </div>
        </div>
      </div>

      <div class="text-center mt-5 pt-4 border-top">
        <h3 class="h4 fw-bold mb-3">Ready to upgrade your student experience?</h3>
        <RouterLink class="btn btn-primary btn-lg rounded-pill px-5 py-3 btn-hover-elevate fw-semibold shadow-sm" to="/register">
          Create your free account
        </RouterLink>
      </div>
    </div>
  </section>
</template>
