<script>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import EventForm from '@/components/EventForm.vue';
  import { useEventStore } from '@/stores/eventStore';

  export default {
    components: {EventForm},
    setup() {
      const eventStore = useEventStore();
      const router = useRouter();
      const loading = ref(false);
      const error = ref('');
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

      return {loading, error, submit};
    }
  };
</script>

<template>
  <div class="container section-pad app-shell">
    <div class="row justify-content-center">
      <div class="col-xl-9">
        <div class="mb-4">
          <p class="text-primary fw-semibold mb-2">Admin</p>
          <h1 class="display-6 fw-bold">Create event</h1>
          <p class="text-muted">Add a new student event to the public catalogue.</p>
        </div>
        <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
        <EventForm :loading="loading" submit-label="Create event" @submit="submit" />
      </div>
    </div>
  </div>
</template>