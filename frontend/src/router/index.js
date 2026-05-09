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
import ProfileView from '@/views/ProfileView.vue';
import NotFoundView from '@/views/NotFoundView.vue';
import AdminLayout from '@/layouts/AdminLayout.vue';
import AdminUsersView from '@/views/AdminUsersView.vue';
import OrganiserDashboardView from '@/views/OrganiserDashboardView.vue';
import OrganiserCreateEventView from '@/views/OrganiserCreateEventView.vue';
import OrganiserEditEventView from '@/views/OrganiserEditEventView.vue';
import OrganiserAttendeesView from '@/views/OrganiserAttendeesView.vue';

const adminMeta = {
  requiresAuth: true,
  requiresAdmin: true,
  navGroup: 'admin',
  hideGlobalBreadcrumbs: true
};
const adminDashboardCrumb = { label: 'Admin Dashboard', to: '/admin' };
const organiserMeta = {
  requiresAuth: true,
  requiresStudent: true,
  requiresVerifiedStudent: true,
  navGroup: 'organiser'
};
const organiserDashboardCrumb = { label: 'Organiser Dashboard', to: '/organiser' };
const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/events', name: 'events', component: EventsView },
  { path: '/events/create', redirect: '/admin/events/create' },
  {
    path: '/events/:id/book',
    name: 'booking',
    component: BookingView,
    props: true,
    meta: {
      requiresAuth: true,
      requiresStudent: true,
      breadcrumbs: [
        { label: 'Events', to: '/events' },
        { label: 'Event details', to: route => ({ name: 'event-detail', params: { id: route.params.id } }) },
        { label: 'Book tickets' }
      ]
    }
  },
  {
    path: '/events/:id',
    name: 'event-detail',
    component: EventDetailView,
    props: true,
    meta: {
      breadcrumbs: [
        { label: 'Events', to: '/events' },
        { label: 'Event details' }
      ]
    }
  },
  { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { guestOnly: true } },
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true, requiresStudent: true } },
  { path: '/history', name: 'history', component: HistoryView, meta: { requiresAuth: true, requiresStudent: true } },
  {
    path: '/organiser',
    name: 'organiser-dashboard',
    component: OrganiserDashboardView,
    meta: {
      ...organiserMeta,
      breadcrumbs: [{ label: 'Organiser Dashboard' }]
    }
  },
  {
    path: '/organiser/events/create',
    name: 'organiser-create-event',
    component: OrganiserCreateEventView,
    meta: {
      ...organiserMeta,
      breadcrumbs: [organiserDashboardCrumb, { label: 'Create event' }]
    }
  },
  {
    path: '/organiser/events/:id/edit',
    name: 'organiser-edit-event',
    component: OrganiserEditEventView,
    props: true,
    meta: {
      ...organiserMeta,
      breadcrumbs: [organiserDashboardCrumb, { label: 'Edit event' }]
    }
  },
  {
    path: '/organiser/events/:id/attendees',
    name: 'organiser-event-attendees',
    component: OrganiserAttendeesView,
    props: true,
    meta: {
      ...organiserMeta,
      breadcrumbs: [organiserDashboardCrumb, { label: 'Attendees' }]
    }
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: adminMeta,
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: AdminDashboardView,
        meta: { breadcrumbs: [{ label: 'Admin Dashboard' }] }
      },
      {
        path: 'events',
        name: 'admin-events',
        component: ManageEventsView,
        meta: { breadcrumbs: [adminDashboardCrumb, { label: 'Manage events' }] }
      },
      {
        path: 'events/create',
        name: 'create-event',
        component: CreateEventView,
        meta: { breadcrumbs: [adminDashboardCrumb, { label: 'Create event' }] }
      },
      {
        path: 'events/:id/edit',
        name: 'edit-event',
        component: EditEventView,
        props: true,
        meta: { breadcrumbs: [adminDashboardCrumb, { label: 'Manage events', to: '/admin/events' }, { label: 'Edit event' }] }
      },
      {
        path: 'bookings',
        name: 'admin-bookings',
        component: AdminBookingsView,
        meta: { breadcrumbs: [adminDashboardCrumb, { label: 'Bookings' }] }
      },
      {
        path: 'users',
        name: 'admin-users',
        component: AdminUsersView,
        meta: { breadcrumbs: [adminDashboardCrumb, { label: 'Registered users' }] }
      }
    ]
  },
  { path: '/profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },
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
  if (to.meta.requiresVerifiedStudent && !auth.isVerifiedStudent) {
    return { name: 'dashboard' };
  }
});

export default router;