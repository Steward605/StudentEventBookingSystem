<script>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import EventForm from '@/components/EventForm.vue';
import { useAuthStore } from '@/stores/authStore';
import { useMyEventStore } from '@/stores/myEventStore';
import { useVenueStore } from '@/stores/venueStore';

export default {
  components: {
    EventForm
  },
  setup() {
    const auth = useAuthStore();
    const myEventStore = useMyEventStore();
    const venueStore = useVenueStore();
    const router = useRouter();
    const loading = ref(false);
    const error = ref('');
    const initialEvent = computed(() => ({
      organiser: auth.user?.name || '',
      status: 'draft',
      city: 'Kuching',
      capacity: 30,
      price: 0
    }));

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
        await myEventStore.createMyEvent(payload);
        router.push('/organiser');
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    }

    return {venueStore, initialEvent, loading, error, submit};
  }
};
</script>

<template>
  <main class="container py-5">
    <header class="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-center mb-4">
      <div>
        <h1 class="display-6 fw-bold mb-2">Create hosted event</h1>
        <p class="text-muted mb-0">
          Reserve a venue and publish an event for other students to join.
        </p>
      </div>

      <RouterLink class="btn btn-outline-primary btn-pill" to="/organiser">
        Back to organiser dashboard
      </RouterLink>
    </header>

    <div v-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <EventForm :initial-value="initialEvent" :loading="loading" :venues="venueStore.venues" submit-label="Create hosted event" cancel-to="/organiser" show-venue-picker show-status lock-organiser @submit="submit"/>
  </main>
</template>
