<script>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import Paginate from 'vuejs-paginate-next';
import LoadingState from '@/components/LoadingState.vue';
import EmptyState from '@/components/EmptyState.vue';
import { useEventStore } from '@/stores/eventStore';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default {
  components: {LoadingState, EmptyState, paginate: Paginate},
  setup() {
    const eventStore = useEventStore();
    const deletingId = ref(null);
    const pendingDelete = ref(null);
    const actionError = ref('');
    const filters = reactive({search: '', category: '', availability: 'all'});
    const currentPage = ref(1);
    const perPage = 10;
    let debounceTimer;

    const filteredEvents = computed(() => eventStore.events);

    const resultLabel = computed(() => {
      const totalItems = eventStore.pagination?.totalItems ?? filteredEvents.value.length;
      return `${totalItems} ${totalItems === 1 ? 'event' : 'events'} shown`;
    });

    function buildAdminParams(page = 1) {
      return {
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.availability !== 'all' ? { availability: filters.availability } : {}),
        page,
        limit: perPage
      };
    }

    function fetchAdminEvents(page = 1) {
      currentPage.value = page;
      return eventStore.fetchEvents(buildAdminParams(page));
    }

    function applyFilters() {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        fetchAdminEvents(1);
      }, 250);
    }

    function goToPage(pageNum) {
      const totalPages = eventStore.pagination?.totalPages || 1;
      if (pageNum < 1 || pageNum > totalPages || pageNum === eventStore.pagination.page) {
        return;
      }
      fetchAdminEvents(pageNum);
    }

    const summaryCards = computed(() => {
      return [
        { label: 'Total events', value: eventStore.summary?.totalEvents ?? eventStore.pagination?.totalItems ?? 0 },
        { label: 'Available', value: eventStore.summary?.availableEvents ?? 0 },
        { label: 'Sold out', value: eventStore.summary?.soldOutEvents ?? 0 },
        { label: 'Categories', value: eventStore.summary?.totalCategories ?? eventStore.categories.length }
      ];
    });

    const hasActiveFilters = computed(() => Boolean(filters.search || filters.category || filters.availability !== 'all'));

    function seatStatusClass(event) {
      const seatsLeft = Number(event.seats_left ?? 0);
      if (seatsLeft <= 0) return 'seat-status-danger';
      if (seatsLeft < 20) return 'seat-status-warning';
      return 'seat-status-success';
    }

    function seatStatusLabel(event) {
      const seatsLeft = Number(event.seats_left ?? 0);
      if (seatsLeft <= 0) return 'Sold out';
      return `${seatsLeft} left`;
    }

    function clearFilters() {
      filters.search = '';
      filters.category = '';
      filters.availability = 'all';
    }

    function requestDelete(event) {
      pendingDelete.value = event;
      actionError.value = '';
    }

    function closeDeleteDialog() {
      if (deletingId.value) return;
      pendingDelete.value = null;
      actionError.value = '';
    }

    async function confirmDeleteEvent() {
      if (!pendingDelete.value) return;
      deletingId.value = pendingDelete.value.id;
      actionError.value = '';
      try {
        await eventStore.deleteEvent(pendingDelete.value.id);
        pendingDelete.value = null;
      } catch (err) {
        actionError.value = err.message;
      } finally {
        deletingId.value = null;
      }
    }

    watch(filters, applyFilters);

    onMounted(() => fetchAdminEvents(1));

    onBeforeUnmount(() => {
      window.clearTimeout(debounceTimer);
    });

    return {eventStore, filters, filteredEvents, summaryCards, hasActiveFilters, currentPage, resultLabel, deletingId, pendingDelete, actionError, seatStatusClass, seatStatusLabel, clearFilters, goToPage, requestDelete, closeDeleteDialog, confirmDeleteEvent, formatCurrency, formatDate};
  }
};
</script>

<template>
  <div class="container section-pad app-shell">
    <header class="admin-management-header mb-4">
      <div>
        <p class="text-primary fw-semibold mb-2">Admin</p>
        <h1 class="display-6 fw-bold mb-2">Manage events</h1>
        <p class="text-muted mb-0">Edit, delete, filter, or preview events shown in the student catalogue.</p>
      </div>

      <div class="admin-page-actions">
        <RouterLink class="btn btn-primary btn-pill btn-hover-elevate" to="/admin/events/create">Create event</RouterLink>
        <RouterLink class="btn btn-outline-primary btn-pill" to="/events">Preview catalogue</RouterLink>
      </div>
    </header>

    <LoadingState v-if="eventStore.loading" />

    <div v-else-if="eventStore.error" class="alert alert-danger" role="alert">{{ eventStore.error }}</div>

    <div v-else>
      <div v-if="actionError && !pendingDelete" class="alert alert-danger" role="alert">{{ actionError }}</div>

      <section class="admin-summary-grid mb-4" aria-label="Event management summary">
        <article v-for="card in summaryCards" :key="card.label" class="admin-summary-card">
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
        </article>
      </section>

      <section class="admin-filter-panel glass-panel mb-4" aria-labelledby="event-admin-filter-title">
        <div class="admin-filter-header">
          <div>
            <h2 id="event-admin-filter-title" class="h5 fw-bold mb-1">Filter events</h2>
            <p class="text-muted small mb-0">Search by event name, venue, city, or category.</p>
          </div>
          <button v-if="hasActiveFilters" class="btn btn-outline-primary btn-sm btn-pill" type="button" @click="clearFilters">Clear filters</button>
        </div>

        <div class="row g-3 align-items-end">
          <div class="col-lg-5">
            <label for="eventAdminSearch" class="form-label">Search events</label>
            <input id="eventAdminSearch" v-model.trim="filters.search" class="form-control" type="search" placeholder="Search events..." autocomplete="off" />
          </div>

          <div class="col-md-6 col-lg-4">
            <label for="eventAdminCategory" class="form-label">Category</label>
            <select id="eventAdminCategory" v-model="filters.category" class="form-select">
              <option value="">All categories</option>
              <option v-for="category in eventStore.categories" :key="category" :value="category">{{ category }}</option>
            </select>
          </div>

          <div class="col-md-6 col-lg-3">
            <label for="eventAdminAvailability" class="form-label">Availability</label>
            <select id="eventAdminAvailability" v-model="filters.availability" class="form-select">
              <option value="all">All availability</option>
              <option value="available">Available</option>
              <option value="soldOut">Sold out</option>
            </select>
          </div>
        </div>
      </section>

      <EmptyState v-if="eventStore.events.length === 0" title="No events found" message="Create the first event for the platform." />

      <EmptyState v-else-if="filteredEvents.length === 0" title="No matching events" message="Try another search term or change the filters." />

      <section v-else class="admin-management-list" aria-labelledby="event-admin-results-title">
        <div class="admin-results-heading">
          <h2 id="event-admin-results-title" class="h4 fw-bold mb-0">Event records</h2>
          <p class="text-muted mb-0">{{ resultLabel }}</p>
        </div>

        <article v-for="event in filteredEvents" :key="event.id" class="admin-record-card">
          <div class="admin-record-main">
            <div class="admin-record-title-row">
              <span :class="['seat-status', seatStatusClass(event)]">{{ seatStatusLabel(event) }}</span>
              <h3 class="h4 fw-bold mb-0">{{ event.title }}</h3>
            </div>

            <dl class="admin-record-meta">
              <div>
                <dt>Date</dt>
                <dd>{{ formatDate(event.event_date) }}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{{ event.location }}, {{ event.city }}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{{ event.category }}</dd>
              </div>
              <div>
                <dt>Capacity</dt>
                <dd>{{ event.seats_left }} / {{ event.capacity }}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>{{ formatCurrency(event.price) }}</dd>
              </div>
            </dl>
          </div>

          <div class="admin-record-actions">
            <RouterLink class="btn btn-outline-secondary btn-sm btn-pill" :to="`/events/${event.id}`">Preview</RouterLink>
            <RouterLink class="btn btn-outline-primary btn-sm btn-pill" :to="`/admin/events/${event.id}/edit`">Edit</RouterLink>
            <button class="btn btn-outline-danger btn-sm btn-pill" type="button" :disabled="deletingId === event.id" @click="requestDelete(event)">
              {{ deletingId === event.id ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </article>
        <div v-if="eventStore.pagination?.totalPages > 1" class="d-flex justify-content-center mt-4">
          <paginate v-model="currentPage" :page-count="eventStore.pagination.totalPages" :page-range="3" :margin-pages="1" :click-handler="goToPage" :prev-text="'Previous'" :next-text="'Next'" :container-class="'pagination flex-wrap justify-content-center mb-0'" :page-class="'page-item'" :page-link-class="'page-link'" :prev-class="'page-item'" :prev-link-class="'page-link'" :next-class="'page-item'" :next-link-class="'page-link'" :break-view-class="'page-item disabled'" :break-view-link-class="'page-link'"/>
        </div>
      </section>
    </div>

    <div v-if="pendingDelete" class="admin-confirm-backdrop" role="presentation" @click.self="closeDeleteDialog">
      <section class="admin-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-event-title" aria-describedby="delete-event-description">
        <p class="text-danger fw-semibold mb-2">Delete event</p>
        <h2 id="delete-event-title" class="h4 fw-bold mb-2">Delete this event?</h2>
        <p id="delete-event-description" class="text-muted mb-3">This will remove <strong>{{ pendingDelete.title }}</strong> and may also affect related bookings.</p>

        <div v-if="actionError" class="alert alert-danger" role="alert">{{ actionError }}</div>

        <div class="d-flex flex-column flex-sm-row gap-2 justify-content-end">
          <button class="btn btn-outline-primary btn-pill" type="button" :disabled="Boolean(deletingId)" @click="closeDeleteDialog">Keep event</button>
          <button class="btn btn-danger btn-pill" type="button" :disabled="Boolean(deletingId)" @click="confirmDeleteEvent">
            {{ deletingId ? 'Deleting...' : 'Yes, delete it' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>