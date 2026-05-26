import { ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';

const DEFAULT_BOOKING_LIMIT = 6;

export const useBookingStore = defineStore('bookings', () => {
  const bookings = ref([]);
  const loading = ref(false);
  const error = ref('');
  const pagination = ref({
    page: 1,
    limit: DEFAULT_BOOKING_LIMIT,
    totalItems: 0,
    totalPages: 1
  });
  const summary = ref({
    totalRecords: 0,
    confirmedRecords: 0,
    cancelledRecords: 0,
    confirmedSeats: 0
  });
  const lastParams = ref({});

  function buildQuery(params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, value);
      }
    });

    return query.toString() ? `?${query.toString()}` : '';
  }

  function fallbackSummary(items) {
    return {
      totalRecords: items.length,
      confirmedRecords: items.filter(booking => booking.status === 'confirmed').length,
      cancelledRecords: items.filter(booking => booking.status === 'cancelled').length,
      confirmedSeats: items
        .filter(booking => booking.status === 'confirmed')
        .reduce((sum, booking) => sum + Number(booking.seat_count ?? booking.ticket_count ?? 0), 0)
    };
  }

  async function fetchBookings(params = {}) {
    loading.value = true;
    error.value = '';
    try {
      const data = await api.get(`/bookings${buildQuery(params)}`);
      bookings.value = Array.isArray(data.bookings) ? data.bookings : [];
      summary.value = data.summary || fallbackSummary(bookings.value);
      pagination.value = data.pagination || {
        page: Number(params.page) || 1,
        limit: Number(params.limit) || Math.max(bookings.value.length, 1),
        totalItems: bookings.value.length,
        totalPages: 1
      };
      lastParams.value = { ...params };
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

  async function refreshBookings() {
    return fetchBookings(lastParams.value);
  }

  return { bookings, loading, error, pagination, summary, fetchBookings, refreshBookings, createBooking, cancelBooking };
});
