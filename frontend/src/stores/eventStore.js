import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';

export const useEventStore = defineStore('events', () => {
  const events = ref([]);
  const categories = ref([]);
  const loading = ref(false);
  const error = ref('');

  const featuredEvents = computed(() => events.value.slice(0, 3));

  async function fetchEvents(params = {}) {
    loading.value = true;
    error.value = '';
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') query.set(key, value);
      });
      const suffix = query.toString() ? `?${query.toString()}` : '';
      const data = await api.get(`/events${suffix}`);
      events.value = data.events;
      categories.value = data.categories;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchEvent(id) {
    const data = await api.get(`/events/${id}`);
    return data.event;
  }

  async function createEvent(payload) {
    const data = await api.post('/events', payload);
    events.value = [data.event, ...events.value];
    return data.event;
  }

  async function updateEvent(id, payload) {
    const data = await api.put(`/events/${id}`, payload);
    events.value = events.value.map(event => event.id === id ? data.event : event);
    return data.event;
  }

  async function deleteEvent(id) {
    await api.delete(`/events/${id}`);
    events.value = events.value.filter(event => event.id !== id);
  }

  return {events, categories, loading, error, featuredEvents, fetchEvents, fetchEvent, createEvent, updateEvent, deleteEvent};
});
