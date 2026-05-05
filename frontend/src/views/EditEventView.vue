<script>
  import { onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import EventForm from '@/components/EventForm.vue';
  import LoadingState from '@/components/LoadingState.vue';
  import { useEventStore } from '@/stores/eventStore';

  export default {
    components: {EventForm, LoadingState},
    setup() {
      const route = useRoute();
      const router = useRouter();
      const eventStore = useEventStore();
      const event = ref(null);
      const loading = ref(true);
      const saving = ref(false);
      const error = ref('');
      onMounted(async () => {
        try {
          event.value = await eventStore.fetchEvent(route.params.id);
        } catch (err) {
          error.value = err.message;
        } finally {
          loading.value = false;
        }
      });
      async function submit(payload) {
        saving.value = true;
        error.value = '';
        try {
          await eventStore.updateEvent(route.params.id, payload);
          router.push('/admin/events');
        } catch (err) {
          error.value = err.message;
        } finally {
          saving.value = false;
        }
      }

      return {event, loading, saving, error, submit};
    }
  };
</script>

<template>
  <div class="container section-pad app-shell">
    <LoadingState v-if="loading" />
    <div v-else class="row justify-content-center">
      <div class="col-xl-9">
        <div class="mb-4">
          <p class="text-primary fw-semibold mb-2">Admin</p>
          <h1 class="display-6 fw-bold">Edit event</h1>
          <p class="text-muted">Update the event information shown to students.</p>
        </div>
        <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
        <EventForm v-if="event" :initial-value="event" :loading="saving" submit-label="Save changes" @submit="submit" />
      </div>
    </div>
  </div>
</template>