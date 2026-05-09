<script>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import EventForm from '@/components/EventForm.vue';
import { useEventStore } from '@/stores/eventStore';
import { useVenueStore } from '@/stores/venueStore';

export default {
  components: {
    EventForm
  },
  setup() {
    const eventStore = useEventStore();
    const venueStore = useVenueStore();
    const router = useRouter();
    const loading = ref(false);
    const error = ref('');
    onMounted(async () => {
      try {
        await venueStore.fetchVenues();
      } catch (err) {
        error.value = err.message;
      }
    });

    async function submit(payload) {
      loading.value = true;
      error.value = '';

      try {
        await eventStore.createEvent(payload);
        router.push('/admin/events');
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    }

    return {venueStore, loading, error, submit};
  }
};
</script>

<template>
  <div class="admin-content-page admin-form-page">
    <header class="admin-page-header">
      <div>
        <p class="text-primary fw-semibold mb-2">Admin</p>
        <h1 class="display-6 fw-bold mb-2">Create event</h1>
        <p class="text-muted mb-0">
          Add a new student event to the public catalogue.
        </p>
      </div>

      <div class="admin-page-actions">
        <RouterLink class="btn btn-outline-primary btn-pill" to="/admin/events">
          Back to events
        </RouterLink>

        <RouterLink class="btn btn-outline-primary btn-pill" to="/events">
          Preview catalogue
        </RouterLink>
      </div>
    </header>

    <div v-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <EventForm
      :loading="loading"
      :venues="venueStore.venues"
      submit-label="Create event"
      cancel-to="/admin/events"
      show-venue-picker
      show-status
      @submit="submit"
    />
  </div>
</template>