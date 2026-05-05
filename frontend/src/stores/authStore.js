import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('student_event_booking_system_user') || 'null'));
  const token = ref(localStorage.getItem('student_event_booking_system_token') || '');
  const message = ref('');

  const isAuthenticated = computed(() => Boolean(token.value && user.value));
  const isAdmin = computed(() => user.value?.role === 'admin');

  function persist(authPayload) {
    user.value = authPayload.user;
    token.value = authPayload.token;
    localStorage.setItem('student_event_booking_system_user', JSON.stringify(authPayload.user));
    localStorage.setItem('student_event_booking_system_token', authPayload.token);
  }

  async function login(credentials) {
    const data = await api.post('/auth/login', credentials);
    persist(data);
    message.value = `Welcome back, ${data.user.name}.`;
  }

  async function register(payload) {
    const data = await api.post('/auth/register', payload);
    persist(data);
    message.value = `Account created for ${data.user.name}.`;
  }

  async function refreshProfile() {
    if (!token.value) return;
    const data = await api.get('/users/me');
    user.value = data.user;
    localStorage.setItem('student_event_booking_system_user', JSON.stringify(data.user));
  }

  async function updateProfile(payload) {
    const data = await api.put('/users/me', payload);
    user.value = data.user;
    localStorage.setItem('student_event_booking_system_user', JSON.stringify(data.user));
    message.value = 'Profile updated successfully.';
  }

  function logout() {
    user.value = null;
    token.value = '';
    localStorage.removeItem('student_event_booking_system_user');
    localStorage.removeItem('student_event_booking_system_token');
    message.value = 'You have logged out.';
  }

  function clearMessage() {
    message.value = '';
  }

  return {
    user,
    token,
    message,
    isAuthenticated,
    isAdmin,
    login,
    register,
    refreshProfile,
    updateProfile,
    logout,
    clearMessage
  };
});
