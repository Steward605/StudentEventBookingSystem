<script>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import EventForm from '@/components/EventForm.vue';
import LoadingState from '@/components/LoadingState.vue';
import { useMyEventStore } from '@/stores/myEventStore';
import { useVenueStore } from '@/stores/venueStore';
export default {
  components: {
    EventForm,
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
    const venueStore = useVenueStore();
    const router = useRouter();
    const event = ref(null);
    const loading = ref(false);
    const pageLoading = ref(true);
    const error = ref('');
    onMounted(async () => {
      try {
        const [eventData] = await Promise.all([
          myEventStore.fetchMyEvent(props.id),
          venueStore.fetchVenues()
        ]);
        event.value = eventData;
      } catch (err) {
        error.value = err.message;
      } finally {
        pageLoading.value = false;
      }
    });
    async function submit(payload) {
      loading.value = true;
      error.value = '';
      try {
        await myEventStore.updateMyEvent(props.id, payload);
        router.push('/organiser');
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    }
    async function cancelEvent() {
      const confirmed = window.confirm('Cancel this event? Students will no longer be able to book it.');
      if (!confirmed) {
        return;
      }
      loading.value = true;
      error.value = '';
      try {
        await myEventStore.cancelMyEvent(props.id);
        router.push('/organiser');
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    }

    return {venueStore, event, loading, pageLoading, error, submit, cancelEvent};
  }
};
</script>

<template>
  <main class="container py-5">
    <LoadingState v-if="pageLoading" />

    <div v-else>
      <header class="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-center mb-4">
        <div>
          <p class="text-primary fw-semibold mb-2">Student organiser</p>
          <h1 class="display-6 fw-bold mb-2">Edit hosted event</h1>
          <p class="text-muted mb-0">
            Update the details, venue, schedule, or publishing status of your event.
          </p>
        </div>

        <div class="d-flex flex-wrap gap-2">
          <RouterLink class="btn btn-outline-primary btn-pill" to="/organiser">
            Back to organiser dashboard
          </RouterLink>

          <button class="btn btn-outline-danger btn-pill" type="button" :disabled="loading" @click="cancelEvent">
            Cancel event
          </button>
        </div>
      </header>

      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <EventForm v-if="event" :initial-value="event" :loading="loading" :venues="venueStore.venues" submit-label="Save changes" cancel-to="/organiser" show-venue-picker show-status lock-organiser @submit="submit"/>
    </div>
  </main>
</template>