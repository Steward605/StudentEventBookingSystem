import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import HomeView from '@/views/HomeView.vue';
import EventsView from '@/views/EventsView.vue';
import EventDetailView from '@/views/EventDetailView.vue';
import BookingView from '@/views/BookingView.vue';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import DashboardView from '@/views/DashboardView.vue';
import HistoryView from '@/views/HistoryView.vue';
import CreateEventView from '@/views/CreateEventView.vue';
import EditEventView from '@/views/EditEventView.vue';
import AdminDashboardView from '@/views/AdminDashboardView.vue';
import ManageEventsView from '@/views/ManageEventsView.vue';
import AdminBookingsView from '@/views/AdminBookingsView.vue';
import NotFoundView from '@/views/NotFoundView.vue';

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/events', name: 'events', component: EventsView },
  { path: '/events/create', redirect: '/admin/events/create' },
  { path: '/events/:id/book', name: 'booking', component: BookingView, props: true, meta: { requiresAuth: true, requiresStudent: true } },
  { path: '/events/:id', name: 'event-detail', component: EventDetailView, props: true },
  { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { guestOnly: true } },
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true, requiresStudent: true } },
  { path: '/history', name: 'history', component: HistoryView, meta: { requiresAuth: true, requiresStudent: true } },
  { path: '/admin',  name: 'admin-dashboard',  component: AdminDashboardView,  meta: { requiresAuth: true, requiresAdmin: true, navGroup: 'admin' } },
  { path: '/admin/events',  name: 'admin-events',  component: ManageEventsView,  meta: { requiresAuth: true, requiresAdmin: true, navGroup: 'admin' } },
  { path: '/admin/events/create',  name: 'create-event',  component: CreateEventView,  meta: { requiresAuth: true, requiresAdmin: true, navGroup: 'admin' } },
  { path: '/admin/events/:id/edit',  name: 'edit-event',  component: EditEventView,  props: true,  meta: { requiresAuth: true, requiresAdmin: true, navGroup: 'admin' } },
  { path: '/admin/bookings',  name: 'admin-bookings',  component: AdminBookingsView,  meta: { requiresAuth: true, requiresAdmin: true, navGroup: 'admin' } },
  { path: '/profile', name: 'profile', component: () => import('@/views/ProfileView.vue'), meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

router.beforeEach(to => {
  const auth = useAuthStore();
  const roleHome = auth.isAdmin ? { name: 'admin-dashboard' } : { name: 'dashboard' };

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return roleHome;
  }
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'dashboard' };
  }
  if (to.meta.requiresStudent && auth.isAdmin) {
    return { name: 'admin-dashboard' };
  }
});

export default router;