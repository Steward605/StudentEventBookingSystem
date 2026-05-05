<script>
  import { onMounted, reactive, watch } from 'vue';
  import EventCard from '@/components/EventCard.vue';
  import LoadingState from '@/components/LoadingState.vue';
  import EmptyState from '@/components/EmptyState.vue';
  import { useEventStore } from '@/stores/eventStore';

  export default {
    components: { EventCard, LoadingState, EmptyState },
    setup() {
      const eventStore = useEventStore();
      const filters = reactive({ search: '', category: '', freeOnly: false });
      let debounceTimer;

      function applyFilters() {
        window.clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => eventStore.fetchEvents(filters), 250);
      }

      function clearFilters() {
        filters.search = '';
        filters.category = '';
        filters.freeOnly = false;
        eventStore.fetchEvents();
      }

      watch(filters, applyFilters);
      onMounted(() => eventStore.fetchEvents());

      return { eventStore, filters, clearFilters };
    }
  };
</script>

<template>
  <div class="container section-pad app-shell">
    <div class="row mb-4 align-items-end">
      <div class="col-lg-8">
        <p class="text-primary fw-semibold mb-2">Browse events</p>
        <h1 class="display-6 fw-bold">Find an event that fits your goals</h1>
        <p class="text-muted mb-0">Search by title, category, location, or description. Filters update instantly.</p>
      </div>
    </div>

    <div class="filter-bar sticky-top glass-panel mb-5 p-2 px-3 rounded-pill d-flex flex-wrap gap-3 align-items-center shadow-sm z-3" style="top: 1rem;">
      <div class="flex-grow-1 position-relative">
        <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
        <input 
          id="search" 
          v-model.trim="filters.search" 
          type="search" 
          class="form-control rounded-pill ps-5 border-0 bg-light" 
          placeholder="Search campus experiences..." 
        />
      </div>
      
      <select v-model="filters.category" class="form-select w-auto rounded-pill border-0 bg-light" aria-label="Filter by category">
        <option value="">All Categories</option>
        <option v-for="category in eventStore.categories" :key="category" :value="category">{{ category }}</option>
      </select>
      
      <div class="form-check form-switch mb-0 border-start ps-4 ms-2">
        <input id="freeOnly" v-model="filters.freeOnly" class="form-check-input" type="checkbox" />
        <label class="form-check-label fw-medium text-dark" for="freeOnly">Free Only</label>
      </div>

      <button v-if="filters.search || filters.category || filters.freeOnly" @click="clearFilters" class="btn btn-sm btn-link text-muted text-decoration-none border-start ms-2" aria-label="Clear filters">
        <i class="bi bi-x-circle-fill"></i> Clear
      </button>
    </div>

    <div v-if="eventStore.error" class="alert alert-danger" role="alert">{{ eventStore.error }}</div>
    <LoadingState v-if="eventStore.loading" />
    <EmptyState v-else-if="eventStore.events.length === 0" title="No matching events" message="Try another keyword or remove one of the filters." />
    
    <TransitionGroup name="list-fade" tag="div" class="row g-4 position-relative" v-else>
      <div v-for="event in eventStore.events" :key="event.id" class="col-md-6 col-xl-4 w-100" style="max-width: 100%;">
        <EventCard :event="event" />
      </div>
    </TransitionGroup>
  </div>
</template>