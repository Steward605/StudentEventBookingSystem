<script>
import { onMounted, ref } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingState from '@/components/LoadingState.vue';
import { useMyEventStore } from '@/stores/myEventStore';
import { formatDate } from '@/utils/formatters';

export default {
  components: {
    EmptyState,
    LoadingState
  },
  props: {
    id: {
      type: [String, Number],
      required: true
    }
  },
  setup(props) {
    const myEventStore = useMyEventStore();
    const event = ref(null);
    const error = ref('');
    const pageLoading = ref(true);
    onMounted(async () => {
      try {
        const [eventData] = await Promise.all([
          myEventStore.fetchMyEvent(props.id),
          myEventStore.fetchAttendees(props.id)
        ]);
        event.value = eventData;
      } catch (err) {
        error.value = err.message;
      } finally {
        pageLoading.value = false;
      }
    });
    function statusClass(status) {
      if (status === 'confirmed') {
        return 'seat-status-success';
      }
      if (status === 'cancelled') {
        return 'seat-status-danger';
      }
      return 'seat-status-warning';
    }
    return {myEventStore, event, error, pageLoading, statusClass, formatDate};
  }
};
</script>

<template>
  <main class="container py-5">
    <LoadingState v-if="pageLoading" />

    <div v-else>
      <header class="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-center mb-4">
        <div>
          <p class="text-primary fw-semibold mb-2">Event attendees</p>
          <h1 class="display-6 fw-bold mb-2">{{ event?.title || 'Hosted event' }}</h1>
          <p class="text-muted mb-0">
            View the students who joined this event and their booking references.
          </p>
        </div>

        <RouterLink class="btn btn-outline-primary btn-pill" to="/organiser">
          Back to organiser dashboard
        </RouterLink>
      </header>

      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <section class="admin-panel" aria-labelledby="attendees-title">
        <div class="admin-panel-header">
          <div>
            <p class="text-primary fw-semibold mb-1">Bookings</p>
            <h2 id="attendees-title" class="h4 fw-bold mb-0">Attendee list</h2>
          </div>
        </div>

        <EmptyState v-if="myEventStore.attendees.length === 0" title="No attendees yet" message="Confirmed bookings will appear here once students join your event."/>

        <div v-else class="admin-table-wrap">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Attendee</th>
                <th scope="col">Account</th>
                <th scope="col">Tickets</th>
                <th scope="col">Reference</th>
                <th scope="col">Status</th>
                <th scope="col">Booked</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="attendee in myEventStore.attendees" :key="attendee.id">
                <td>
                  <div class="fw-bold">{{ attendee.attendee_name }}</div>
                  <div class="text-muted small">{{ attendee.attendee_email }}</div>
                </td>

                <td>
                  <div>{{ attendee.account_name }}</div>
                  <div class="text-muted small">{{ attendee.account_email }}</div>
                </td>

                <td>{{ attendee.ticket_count }}</td>

                <td>
                  <code>{{ attendee.booking_reference }}</code>
                </td>

                <td>
                  <span :class="['seat-status', statusClass(attendee.status)]">
                    {{ attendee.status }}
                  </span>
                </td>

                <td>{{ formatDate(attendee.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
</template>