<script>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import Paginate from 'vuejs-paginate-next';
import EventCard from '@/components/EventCard.vue';
import LoadingState from '@/components/LoadingState.vue';
import EmptyState from '@/components/EmptyState.vue';
import { useEventStore } from '@/stores/eventStore';

export default {
  components: {
    EventCard,
    LoadingState,
    EmptyState,
    paginate: Paginate
  },

  setup() {
    const eventStore = useEventStore();

    const filters = reactive({
      search: '',
      category: '',
      freeOnly: false
    });

    const currentPage = ref(1);
    const filtersExpanded = ref(true);
    const perPage = 12;
    let debounceTimer;

    const hasActiveFilters = computed(() => Boolean(filters.search || filters.category || filters.freeOnly));
    const filterSummary = computed(() => {
      const activeFilters = [];
      const searchTerm = filters.search.trim();
      if (searchTerm) {
        activeFilters.push(`search "${searchTerm}"`);
      }
      if (filters.category) {
        activeFilters.push(`category ${filters.category}`);
      }
      if (filters.freeOnly) {
        activeFilters.push('free events only');
      }
      return activeFilters.length
        ? `Active filters: ${activeFilters.join(', ')}`
        : 'No filters applied';
    });

    const filterPanelDescription = computed(() => {
      return filtersExpanded.value
        ? 'Filters update automatically after typing.'
        : filterSummary.value;
    });

    const resultCount = computed(() => eventStore.pagination.totalItems ?? eventStore.events.length);

    const resultLabel = computed(() => {
      const count = resultCount.value;
      return `${count} ${count === 1 ? 'event' : 'events'} found`;
    });

    const paginationLabel = computed(() => {
      const { page, limit, totalItems } = eventStore.pagination;

      if (!totalItems) {
        return 'No events found';
      }

      const start = (page - 1) * limit + 1;
      const end = Math.min(page * limit, totalItems);

      return `Showing ${start}-${end} of ${totalItems} events`;
    });

    function buildParams(page = 1) {
      return {
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.freeOnly ? { freeOnly: true } : {}),
        page,
        limit: perPage
      };
    }

    function fetchPage(page = 1) {
      currentPage.value = page;
      return eventStore.fetchEvents(buildParams(page));
    }

    function applyFilters() {
      window.clearTimeout(debounceTimer);

      debounceTimer = window.setTimeout(() => {
        fetchPage(1);
      }, 250);
    }

    function clearFilters() {
      filters.search = '';
      filters.category = '';
      filters.freeOnly = false;
    }

    function toggleFilters() {
      filtersExpanded.value = !filtersExpanded.value;
    }

    function goToPage(pageNum) {
      const totalPages = eventStore.pagination.totalPages || 1;
      if (pageNum < 1 || pageNum > totalPages || pageNum === eventStore.pagination.page) {
        return;
      }
      fetchPage(pageNum);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    watch(filters, applyFilters);
    onMounted(() => fetchPage(1));
    onBeforeUnmount(() => {
      window.clearTimeout(debounceTimer);
    });

    return {eventStore, filters, currentPage, filtersExpanded, hasActiveFilters, resultLabel, paginationLabel, filterSummary, filterPanelDescription, clearFilters, toggleFilters, goToPage};
  }
};
</script>

<template>
  <div class="container section-pad app-shell">
    <header class="events-header mb-4">
      <div>
        <p class="text-primary fw-semibold mb-2">Event catalogue</p>
        <h1 class="display-6 fw-bold mb-2">Campus events available for booking</h1>
        <p class="text-muted mb-0">
          Search the current event list by title, category, location, or description.
        </p>
      </div>
      <div class="events-header-summary" aria-live="polite">
        <span>{{ resultLabel }}</span>
      </div>
    </header>

    <section class="filter-panel glass-panel mb-5" :class="{ 'is-collapsed': !filtersExpanded }" aria-labelledby="event-filter-title" aria-describedby="event-filter-description">
      <div class="filter-panel-header">
        <div class="filter-panel-heading">
          <h2 id="event-filter-title" class="h5 fw-bold mb-1">Filter event list</h2>
          <p id="event-filter-description" class="text-muted small mb-0" aria-live="polite">
            {{ filterPanelDescription }}
          </p>
        </div>
        <div class="filter-panel-actions">
          <button v-if="hasActiveFilters" type="button" class="btn btn-outline-primary btn-sm btn-pill" @click="clearFilters">
            Clear filters
          </button>
          <button type="button" class="btn btn-primary btn-sm btn-pill filter-toggle-btn" :aria-expanded="filtersExpanded" aria-controls="event-filter-controls" @click="toggleFilters">
            <span class="filter-toggle-icon" aria-hidden="true">
              {{ filtersExpanded ? '▲' : '▼' }}
            </span>
          </button>
        </div>
      </div>

      <Transition name="filter-collapse">
        <div v-show="filtersExpanded" id="event-filter-controls" class="filter-panel-body">
          <div class="row g-3 align-items-end">
            <div class="col-lg-6">
              <label class="form-label" for="event-search">Search events</label>
              <input id="event-search" v-model.trim="filters.search" type="search" class="form-control" placeholder="Search event records..." autocomplete="off"/>
            </div>

            <div class="col-md-6 col-lg-4">
              <label class="form-label" for="event-category">Category</label>
              <select id="event-category" v-model="filters.category" class="form-select">
                <option value="">All categories</option>
                <option v-for="category in eventStore.categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>

            <div class="col-md-6 col-lg-2">
              <div class="filter-switch">
                <input id="freeOnly" v-model="filters.freeOnly" class="form-check-input" type="checkbox"/>
                <label class="form-check-label" for="freeOnly">Free only</label>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </section>

    <div v-if="eventStore.error" class="alert alert-danger" role="alert">{{ eventStore.error }}</div>

    <LoadingState v-if="eventStore.loading" />

    <EmptyState v-else-if="eventStore.events.length === 0" title="No matching events" message="Try another keyword, choose a different category, or remove the free-only filter." />

    <section v-else aria-labelledby="event-results-title">
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-end gap-2 mb-3">
        <div>
          <h2 id="event-results-title" class="h4 fw-bold mb-1">Available events</h2>
          <p class="text-muted mb-0" aria-live="polite">{{ resultLabel }}</p>
        </div>
      </div>

      <TransitionGroup name="list-fade" tag="div" class="row g-4 position-relative">
        <div v-for="event in eventStore.events" :key="event.id" class="col-md-6 col-xl-4">
          <EventCard :event="event" />
        </div>
      </TransitionGroup>

      <div class="d-flex flex-column align-items-center gap-2 mt-5">
        <p class="text-muted small mb-0" aria-live="polite">{{ paginationLabel }}</p>

        <paginate v-model="currentPage" :page-count="eventStore.pagination.totalPages" :page-range="3" :margin-pages="1" :click-handler="goToPage" :prev-text="'Previous'" :next-text="'Next'" :container-class="'pagination flex-wrap justify-content-center mb-0'" :page-class="'page-item'" :page-link-class="'page-link'" :prev-class="'page-item'" :prev-link-class="'page-link'" :next-class="'page-item'" :next-link-class="'page-link'" :break-view-class="'page-item disabled'" :break-view-link-class="'page-link'"/>
      </div>
    </section>
  </div>
</template>
