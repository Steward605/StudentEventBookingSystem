import { ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';

export const useVenueStore = defineStore('venues', () => {
  const venues = ref([]);
  const loading = ref(false);
  const error = ref('');
  async function fetchVenues() {
    loading.value = true;
    error.value = '';
    try {
      const data = await api.get('/venues');
      venues.value = Array.isArray(data.venues) ? data.venues : [];
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchVenue(id) {
    const data = await api.get(`/venues/${id}`);
    return data.venue;
  }

  return {venues, loading, error, fetchVenues, fetchVenue};
});