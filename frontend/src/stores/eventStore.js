import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';

const DEFAULT_EVENT_LIMIT = 12;

export const useEventStore = defineStore('events', () => {
  const events = ref([]);
  const categories = ref([]);
  const loading = ref(false);
  const error = ref('');

  const pagination = ref({
    page: 1,
    limit: DEFAULT_EVENT_LIMIT,
    totalItems: 0,
    totalPages: 1
  });

  const summary = ref({
    totalEvents: 0,
    availableEvents: 0,
    soldOutEvents: 0,
    totalCategories: 0
  });

  const lastParams = ref({
    page: 1,
    limit: DEFAULT_EVENT_LIMIT
  });

  const featuredEvents = computed(() => events.value.slice(0, 3));

  async function fetchEvents(params = {}) {
    const requestParams = {
      page: 1,
      limit: DEFAULT_EVENT_LIMIT,
      ...params
    };

    loading.value = true;
    error.value = '';

    try {
      const query = new URLSearchParams();
      Object.entries(requestParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.set(key, value);
        }
      });
      const suffix = query.toString() ? `?${query.toString()}` : '';
      const data = await api.get(`/events${suffix}`);
      events.value = Array.isArray(data.events) ? data.events : [];
      categories.value = Array.isArray(data.categories) ? data.categories : [];
      pagination.value = data.pagination || {
        page: Number(requestParams.page) || 1,
        limit: Number(requestParams.limit) || DEFAULT_EVENT_LIMIT,
        totalItems: events.value.length,
        totalPages: 1
      };
      summary.value = data.summary || {
        totalEvents: pagination.value.totalItems,
        availableEvents: events.value.filter(event => Number(event.seats_left ?? 0) > 0).length,
        soldOutEvents: events.value.filter(event => Number(event.seats_left ?? 0) <= 0).length,
        totalCategories: categories.value.length
      };
      lastParams.value = {
        ...requestParams,
        page: pagination.value.page,
        limit: pagination.value.limit
      };
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function refreshEvents() {
    return fetchEvents(lastParams.value);
  }

  async function fetchEvent(id) {
    const data = await api.get(`/events/${id}`);
    return data.event;
  }

  async function createEvent(payload) {
    const data = await api.post('/events', payload);
    await refreshEvents();
    return data.event;
  }

  async function updateEvent(id, payload) {
    const data = await api.put(`/events/${id}`, payload);
    await refreshEvents();
    return data.event;
  }

  async function deleteEvent(id) {
    await api.delete(`/events/${id}`);
    const shouldMoveBackOnePage = events.value.length === 1 && pagination.value.page > 1;
    const nextPage = shouldMoveBackOnePage ? pagination.value.page - 1 : pagination.value.page;
    await fetchEvents({
      ...lastParams.value,
      page: nextPage
    });
  }

  return {events, categories, loading, error, pagination, summary, featuredEvents, fetchEvents, refreshEvents, fetchEvent, createEvent, updateEvent, deleteEvent};
});