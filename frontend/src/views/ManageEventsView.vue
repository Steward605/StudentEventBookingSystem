<script>
  import { computed, onMounted, ref } from 'vue';
  import LoadingState from '@/components/LoadingState.vue';
  import EmptyState from '@/components/EmptyState.vue';
  import { useEventStore } from '@/stores/eventStore';
  import { formatCurrency, formatDate } from '@/utils/formatters';

  export default {
    components: {LoadingState, EmptyState},
    setup() {
      const eventStore = useEventStore();
      const deletingId = ref(null);
      const actionError = ref('');
      const sortedEvents = computed(() => [...eventStore.events].sort((a, b) => `${a.event_date} ${a.start_time}`.localeCompare(`${b.event_date} ${b.start_time}`)));
      onMounted(() => eventStore.fetchEvents());
      async function deleteEvent(event) {
        const confirmed = window.confirm(`Delete ${event.title}? This will also remove related bookings.`);
        if (!confirmed) return;
        deletingId.value = event.id;
        actionError.value = '';
        try {
          await eventStore.deleteEvent(event.id);
        } catch (err) {
          actionError.value = err.message;
        } finally {
          deletingId.value = null;
        }
      }

      return {eventStore, sortedEvents, deletingId, actionError, deleteEvent, formatCurrency, formatDate};
    }
  };
</script>

<template>
  <div class="container section-pad app-shell">
    <div class="row align-items-end mb-4">
      <div class="col-lg-8">
        <p class="text-primary fw-semibold mb-2">Admin</p>
        <h1 class="display-6 fw-bold">Manage events</h1>
        <p class="text-muted mb-0">Edit, delete, or preview events that appear in the student catalogue.</p>
      </div>
      <div class="col-lg-4 text-lg-end mt-3 mt-lg-0">
        <RouterLink class="btn btn-primary" to="/admin/events/create">Create event</RouterLink>
      </div>
    </div>

    <LoadingState v-if="eventStore.loading" />
    <div v-else-if="eventStore.error" class="alert alert-danger" role="alert">{{ eventStore.error }}</div>
    <div v-else>
      <div v-if="actionError" class="alert alert-danger" role="alert">{{ actionError }}</div>
      <EmptyState v-if="sortedEvents.length === 0" title="No events found" message="Create the first event for the platform." />
      <div v-else class="card card-lift bg-white p-3 p-md-4">
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <caption class="visually-hidden">Admin event management table</caption>
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Date</th>
                <th scope="col">Category</th>
                <th scope="col">Seats left</th>
                <th scope="col">Price</th>
                <th scope="col" class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in sortedEvents" :key="event.id">
                <td>
                  <p class="fw-semibold mb-1">{{ event.title }}</p>
                  <p class="small text-muted mb-0">{{ event.location }}, {{ event.city }}</p>
                </td>
                <td>{{ formatDate(event.event_date) }}</td>
                <td><span class="badge badge-soft rounded-pill">{{ event.category }}</span></td>
                <td>{{ event.seats_left }} / {{ event.capacity }}</td>
                <td>{{ formatCurrency(event.price) }}</td>
                <td class="text-end">
                  <div class="btn-group btn-group-sm" role="group" :aria-label="`Actions for ${event.title}`">
                    <RouterLink class="btn btn-outline-secondary" :to="`/events/${event.id}`">Preview</RouterLink>
                    <RouterLink class="btn btn-outline-primary" :to="`/admin/events/${event.id}/edit`">Edit</RouterLink>
                    <button class="btn btn-outline-danger" type="button" :disabled="deletingId === event.id" @click="deleteEvent(event)">
                      {{ deletingId === event.id ? 'Deleting...' : 'Delete' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>