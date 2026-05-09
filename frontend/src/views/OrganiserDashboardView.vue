<script>
import { computed, onMounted, ref } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingState from '@/components/LoadingState.vue';
import { useMyEventStore } from '@/stores/myEventStore';
import { formatDate, formatPrice, formatTime } from '@/utils/formatters';

export default {
  components: {
    EmptyState,
    LoadingState
  },
  setup() {
    const myEventStore = useMyEventStore();
    const error = ref('');
    const summaryRows = computed(() => [
      {
        label: 'Hosted events',
        value: myEventStore.events.length
      },
      {
        label: 'Published',
        value: myEventStore.publishedEvents.length
      },
      {
        label: 'Drafts',
        value: myEventStore.draftEvents.length
      },
      {
        label: 'Tickets joined',
        value: myEventStore.totalTickets
      }
    ]);

    onMounted(async () => {
      try {
        await myEventStore.fetchMyEvents();
      } catch (err) {
        error.value = err.message;
      }
    });

    function statusClass(status) {
      if (status === 'published') {
        return 'seat-status-success';
      }
      if (status === 'cancelled') {
        return 'seat-status-danger';
      }
      return 'seat-status-warning';
    }

    return {myEventStore, error, summaryRows, statusClass, formatDate, formatTime, formatPrice};
  }
};
</script>

<template>
  <main class="container py-5">
    <LoadingState v-if="myEventStore.loading" />
    <div v-else>
      <header class="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-center mb-4">
        <div>
          <p class="text-primary fw-semibold mb-2">Verified student organiser</p>
          <h1 class="display-6 fw-bold mb-2">Manage my hosted events</h1>
          <p class="text-muted mb-0">
            Create events, book venues, track attendees, and update your event details.
          </p>
        </div>
        <RouterLink class="btn btn-primary btn-pill btn-hover-elevate" to="/organiser/events/create">
          Create event
        </RouterLink>
      </header>

      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <section class="row g-3 mb-4" aria-label="Organiser summary">
        <div v-for="row in summaryRows" :key="row.label" class="col-sm-6 col-xl-3">
          <div class="admin-mini-stat">
            <p class="text-muted small mb-1">{{ row.label }}</p>
            <p class="h4 fw-bold mb-0">{{ row.value }}</p>
          </div>
        </div>
      </section>

      <section class="admin-panel" aria-labelledby="my-events-title">
        <div class="admin-panel-header">
          <div>
            <p class="text-primary fw-semibold mb-1">Events</p>
            <h2 id="my-events-title" class="h4 fw-bold mb-0">My event list</h2>
          </div>
        </div>

        <EmptyState v-if="myEventStore.events.length === 0" title="No hosted events yet" message="Create your first event and reserve a venue for students to join."/>

        <div v-else class="admin-table-wrap">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Venue</th>
                <th scope="col">Schedule</th>
                <th scope="col">Bookings</th>
                <th scope="col">Price</th>
                <th scope="col">Status</th>
                <th scope="col" class="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="event in myEventStore.events" :key="event.id">
                <td>
                  <div class="fw-bold">{{ event.title }}</div>
                  <div class="text-muted small">{{ event.category }}</div>
                </td>

                <td>
                  <div>{{ event.venue_name || event.location }}</div>
                  <div class="text-muted small">{{ event.venue_campus || event.city }}</div>
                </td>

                <td>
                  <div>{{ formatDate(event.event_date) }}</div>
                  <div class="text-muted small">{{ formatTime(event.start_time) }} – {{ formatTime(event.end_time) }}</div>
                </td>

                <td>
                  {{ event.booked_tickets || 0 }} / {{ event.capacity }}
                </td>

                <td>{{ formatPrice(event.price) }}</td>

                <td>
                  <span :class="['seat-status', statusClass(event.status)]">
                    {{ event.status }}
                  </span>
                </td>

                <td class="text-end">
                  <div class="btn-group btn-group-sm">
                    <RouterLink class="btn btn-outline-primary" :to="`/organiser/events/${event.id}/attendees`">
                      Attendees
                    </RouterLink>

                    <RouterLink class="btn btn-outline-primary" :to="`/organiser/events/${event.id}/edit`">
                      Edit
                    </RouterLink>

                    <RouterLink class="btn btn-outline-secondary" :to="`/events/${event.id}`">
                      View
                    </RouterLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
</template>