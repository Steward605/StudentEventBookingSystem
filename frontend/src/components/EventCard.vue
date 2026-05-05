<script>
import { computed, ref } from 'vue';
import { formatCurrency, formatDate, formatTimeRange } from '@/utils/formatters';

const fallbackSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#e8eefc"/>
      <stop offset="52%" stop-color="#d9e7ff"/>
      <stop offset="100%" stop-color="#eff7ff"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="700" fill="url(#g)"/>
  <circle cx="930" cy="120" r="180" fill="#cde3ff" opacity="0.8"/>
  <circle cx="180" cy="620" r="220" fill="#ffffff" opacity="0.72"/>
  <rect x="140" y="170" width="920" height="360" rx="48" fill="#ffffff" opacity="0.76"/>
  <text x="600" y="335" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="#193dc4">Student Event</text>
  <text x="600" y="405" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#475467">Campus booking experience</text>
</svg>
`);

export default {
  props: {
    event: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const imageFailed = ref(false);
    const fallbackImage = `data:image/svg+xml;charset=UTF-8,${fallbackSvg}`;

    const imageSource = computed(() => imageFailed.value || !props.event.image_url ? fallbackImage : props.event.image_url);
    const imageAlt = computed(() => props.event.title ? `${props.event.title} event cover image` : 'Event cover image');
    const detailPath = computed(() => `/events/${props.event.id}`);
    const descriptionId = computed(() => `event-card-description-${props.event.id}`);
    const seatsLeft = computed(() => Number(props.event.seats_left ?? 0));
    const seatsLabel = computed(() => {
      if (seatsLeft.value <= 0) return 'Fully booked';
      return `${seatsLeft.value} ${seatsLeft.value === 1 ? 'seat' : 'seats'} left`;
    });
    const seatStatusClass = computed(() => {
      if (seatsLeft.value <= 0) return 'seat-status-danger';
      if (seatsLeft.value < 20) return 'seat-status-warning';
      return 'seat-status-success';
    });

    function useFallbackImage() {
      imageFailed.value = true;
    }

    return {formatCurrency, formatDate, formatTimeRange, imageSource, imageAlt, detailPath, descriptionId, seatsLabel, seatStatusClass, useFallbackImage};
  }
};
</script>

<template>
  <article class="event-card card h-100 border-0 bg-white shadow-sm overflow-hidden">
    <RouterLink class="event-card-media" :to="detailPath" :aria-label="`View details for ${event.title}`">
      <img :src="imageSource" :alt="imageAlt" class="event-image" loading="lazy" @error="useFallbackImage" />
      <span class="event-price-badge">{{ formatCurrency(event.price) }}</span>
    </RouterLink>

    <div class="card-body event-card-body">
      <p class="event-category">{{ event.category }}</p>
      <h3 class="event-card-title">{{ event.title }}</h3>
      <p :id="descriptionId" class="event-description">{{ event.description }}</p>

      <dl class="event-meta">
        <div class="event-meta-row">
          <dt>Date</dt>
          <dd>{{ formatDate(event.event_date) }}</dd>
        </div>
        <div class="event-meta-row">
          <dt>Time</dt>
          <dd>{{ formatTimeRange(event.start_time, event.end_time) }}</dd>
        </div>
      </dl>

      <div class="event-card-footer">
        <span :class="['seat-status', seatStatusClass]">{{ seatsLabel }}</span>
        <RouterLink class="btn btn-primary btn-sm btn-pill btn-hover-elevate" :to="detailPath" :aria-describedby="descriptionId">
          View details
        </RouterLink>
      </div>
    </div>
  </article>
</template>