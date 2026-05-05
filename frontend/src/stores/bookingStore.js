import { ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';

export const useBookingStore = defineStore('bookings', () => {
  const bookings = ref([]);
  const loading = ref(false);
  const error = ref('');

  async function fetchBookings() {
    loading.value = true;
    error.value = '';
    try {
      const data = await api.get('/bookings');
      bookings.value = data.bookings;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function createBooking(payload) {
    const data = await api.post('/bookings', payload);
    bookings.value.unshift(data.booking);
    return data.booking;
  }

  async function cancelBooking(id) {
    await api.delete(`/bookings/${id}`);
    bookings.value = bookings.value.map(booking => (
      booking.id === id ? { ...booking, status: 'cancelled' } : booking
    ));
  }

  return { bookings, loading, error, fetchBookings, createBooking, cancelBooking };
});
