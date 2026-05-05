<script>
  import { formatCurrency, formatDate, formatTimeRange } from '@/utils/formatters';
  export default {
    props: {
      event: {
        type: Object,
        required: true
      }
    },
    setup() {
      return {
        formatCurrency,
        formatDate,
        formatTimeRange
      };
    }
  };
</script>

<template>
  <article class="card premium-card h-100 border-0 bg-white shadow-sm overflow-hidden text-start">
    <div class="position-relative overflow-hidden">
      <img :src="event.image_url" :alt="`${event.title} event image`" class="event-image transition-transform w-100" style="border-radius: 0;" loading="lazy" />
      
      <!-- Glassmorphism Price Badge -->
      <div class="position-absolute top-0 end-0 m-3 glass-effect fw-bold px-3 py-1 rounded-pill small">
        {{ formatCurrency(event.price) }}
      </div>
    </div>

    <div class="card-body d-flex flex-column p-4">
      <span class="text-uppercase tracking-wide text-primary small fw-bold mb-2">{{ event.category }}</span>
      <h3 class="h5 card-title fw-bold text-dark mb-3">{{ event.title }}</h3>
      
      <p class="card-text text-muted flex-grow-1 small line-clamp-2 mb-4">{{ event.description }}</p>

      <div class="d-flex flex-column gap-2 text-muted small mb-4">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-calendar3 text-primary" aria-hidden="true"></i> 
          <span>{{ formatDate(event.event_date) }}</span>
        </div>
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-clock text-primary" aria-hidden="true"></i> 
          <span>{{ formatTimeRange(event.start_time, event.end_time) }}</span>
        </div>
      </div>

      <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
        <span class="small fw-medium" :class="event.seats_left < 20 ? 'text-danger' : 'text-success'">
          <i class="bi bi-person-fill" aria-hidden="true"></i> {{ event.seats_left }} seats left
        </span>
        <RouterLink class="btn btn-primary rounded-pill px-4 py-2 btn-hover-elevate btn-sm fw-semibold" :to="`/events/${event.id}`">
          View Details
        </RouterLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
/* clamp long descriptions to 2 lines */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>