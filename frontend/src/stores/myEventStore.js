import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';

export const useMyEventStore = defineStore('myEvents', () => {
  const events = ref([]);
  const attendees = ref([]);
  const loading = ref(false);
  const error = ref('');
  const publishedEvents = computed(() => events.value.filter(event => event.status === 'published'));
  const draftEvents = computed(() => events.value.filter(event => event.status === 'draft'));
  const cancelledEvents = computed(() => events.value.filter(event => event.status === 'cancelled'));
  const totalTickets = computed(() => {
    return events.value.reduce((sum, event) => sum + Number(event.booked_tickets || 0), 0);
  });
  async function fetchMyEvents() {
    loading.value = true;
    error.value = '';
    try {
      const data = await api.get('/my-events');
      events.value = Array.isArray(data.events) ? data.events : [];
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }
  async function fetchMyEvent(id) {
    const data = await api.get(`/my-events/${id}`);
    return data.event;
  }
  async function createMyEvent(payload) {
    const data = await api.post('/my-events', payload);
    await fetchMyEvents();
    return data.event;
  }
  async function updateMyEvent(id, payload) {
    const data = await api.put(`/my-events/${id}`, payload);
    await fetchMyEvents();
    return data.event;
  }
  async function cancelMyEvent(id) {
    await api.delete(`/my-events/${id}`);
    await fetchMyEvents();
  }
  async function fetchAttendees(id) {
    loading.value = true;
    error.value = '';
    try {
      const data = await api.get(`/my-events/${id}/attendees`);
      attendees.value = Array.isArray(data.attendees) ? data.attendees : [];
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {events, attendees, loading, error, publishedEvents, draftEvents, cancelledEvents, totalTickets, fetchMyEvents, fetchMyEvent, createMyEvent, updateMyEvent, cancelMyEvent, fetchAttendees};
});