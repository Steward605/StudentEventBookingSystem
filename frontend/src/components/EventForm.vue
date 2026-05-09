<script>
import { computed, reactive, watch } from 'vue';

const defaultEvent = {
  title: '',
  category: 'Technology',
  description: '',
  venue_id: '',
  location: '',
  city: 'Kuching',
  event_date: '',
  start_time: '',
  end_time: '',
  capacity: 50,
  price: 0,
  image_url: '',
  organiser: '',
  accessibility_notes: '',
  status: 'published'
};

export default {
  props: {
    initialValue: {
      type: Object,
      default: () => ({})
    },
    loading: {
      type: Boolean,
      default: false
    },
    submitLabel: {
      type: String,
      default: 'Save event'
    },
    venues: {
      type: Array,
      default: () => []
    },
    showVenuePicker: {
      type: Boolean,
      default: false
    },
    showStatus: {
      type: Boolean,
      default: false
    },
    lockOrganiser: {
      type: Boolean,
      default: false
    },
    cancelTo: {
      type: String,
      default: '/admin/events'
    }
  },
  emits: ['submit'],
  setup(props, { emit }) {
    const form = reactive({ ...defaultEvent });

    const categories = [
      'Technology',
      'Design',
      'Career',
      'Community',
      'Wellbeing',
      'Entrepreneurship',
      'Academic',
      'Sports'
    ];

    const statuses = [
      { value: 'draft', label: 'Draft' },
      { value: 'published', label: 'Published' }
    ];

    const selectedVenue = computed(() => {
      return props.venues.find(venue => Number(venue.id) === Number(form.venue_id)) || null;
    });

    const venueCapacityText = computed(() => {
      if (!selectedVenue.value) {
        return 'Select a venue to check its maximum capacity.';
      }

      return `Maximum capacity: ${selectedVenue.value.capacity} students.`;
    });

    watch(
      () => props.initialValue,
      value => {
        Object.assign(form, defaultEvent, value || {});
        form.venue_id = value?.venue_id || '';
        form.status = value?.status || 'published';
      },
      {
        immediate: true,
        deep: true
      }
    );

    watch(selectedVenue, venue => {
      if (!venue || !props.showVenuePicker) {
        return;
      }

      form.location = `${venue.name}, ${venue.building} ${venue.room}`;
      form.city = venue.city;

      if (Number(form.capacity) > Number(venue.capacity)) {
        form.capacity = venue.capacity;
      }
    });

    function submit() {
      const payload = {
        ...form,
        venue_id: form.venue_id ? Number(form.venue_id) : null,
        capacity: Number(form.capacity),
        price: Number(form.price || 0)
      };

      emit('submit', payload);
    }

    return {form, categories, statuses, selectedVenue, venueCapacityText, submit};
  }
};
</script>

<template>
  <form class="admin-event-form" @submit.prevent="submit">
    <section class="admin-form-section" aria-labelledby="event-basic-details">
      <div class="admin-form-section-header">
        <div>
          <p class="text-primary fw-semibold mb-1">Step 1</p>
          <h2 id="event-basic-details" class="h4 fw-bold mb-1">Basic details</h2>
          <p class="text-muted small mb-0">
            Enter the public-facing event title, category, and description.
          </p>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-lg-8">
          <label for="title" class="form-label">Title</label>
          <input id="title" v-model.trim="form.title" class="form-control" required />
        </div>

        <div class="col-lg-4">
          <label for="category" class="form-label">Category</label>
          <select id="category" v-model="form.category" class="form-select">
            <option v-for="category in categories" :key="category">
              {{ category }}
            </option>
          </select>
        </div>

        <div v-if="showStatus" class="col-lg-4">
          <label for="status" class="form-label">Publishing status</label>
          <select id="status" v-model="form.status" class="form-select">
            <option v-for="status in statuses" :key="status.value" :value="status.value">
              {{ status.label }}
            </option>
          </select>
          <div class="form-text">
            Draft events are saved privately and cannot be booked yet.
          </div>
        </div>

        <div class="col-12">
          <label for="description" class="form-label">Description</label>
          <textarea id="description" v-model.trim="form.description" class="form-control" rows="4" required></textarea>
        </div>
      </div>
    </section>

    <section class="admin-form-section" aria-labelledby="event-venue-details">
      <div class="admin-form-section-header">
        <div>
          <p class="text-primary fw-semibold mb-1">Step 2</p>
          <h2 id="event-venue-details" class="h4 fw-bold mb-1">Venue and schedule</h2>
          <p class="text-muted small mb-0">
            Set where and when the event will take place.
          </p>
        </div>
      </div>

      <div class="row g-3">
        <div v-if="showVenuePicker" class="col-12">
          <label for="venue" class="form-label">Venue</label>
          <select id="venue" v-model="form.venue_id" class="form-select" required>
            <option value="" disabled>Select a venue</option>
            <option v-for="venue in venues" :key="venue.id" :value="venue.id">
              {{ venue.name }} — {{ venue.campus }}, {{ venue.building }} {{ venue.room }} · {{ venue.capacity }} seats
            </option>
          </select>
          <div class="form-text">
            {{ venueCapacityText }}
          </div>
        </div>

        <div class="col-lg-6">
          <label for="location" class="form-label">Location</label>
          <input id="location" v-model.trim="form.location" class="form-control" :readonly="showVenuePicker" required />
        </div>

        <div class="col-lg-6">
          <label for="city" class="form-label">City</label>
          <input id="city" v-model.trim="form.city" class="form-control" :readonly="showVenuePicker" required />
        </div>

        <div class="col-md-4">
          <label for="date" class="form-label">Date</label>
          <input id="date" v-model="form.event_date" type="date" class="form-control" required />
        </div>

        <div class="col-md-4">
          <label for="start" class="form-label">Start time</label>
          <input id="start" v-model="form.start_time" type="time" class="form-control" required />
        </div>

        <div class="col-md-4">
          <label for="end" class="form-label">End time</label>
          <input id="end" v-model="form.end_time" type="time" class="form-control" required />
        </div>
      </div>
    </section>

    <section class="admin-form-section" aria-labelledby="event-booking-details">
      <div class="admin-form-section-header">
        <div>
          <p class="text-primary fw-semibold mb-1">Step 3</p>
          <h2 id="event-booking-details" class="h4 fw-bold mb-1">Booking details</h2>
          <p class="text-muted small mb-0">
            Configure capacity, pricing, organiser, image, and accessibility notes.
          </p>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-md-4">
          <label for="capacity" class="form-label">Capacity</label>
          <input
            id="capacity"
            v-model.number="form.capacity"
            type="number"
            min="1"
            :max="selectedVenue?.capacity || undefined"
            class="form-control"
            required
          />
        </div>

        <div class="col-md-4">
          <label for="price" class="form-label">Price (MYR)</label>
          <input id="price" v-model.number="form.price" type="number" min="0" step="0.01" class="form-control" required />
        </div>

        <div class="col-md-4">
          <label for="organiser" class="form-label">Organiser</label>
          <input id="organiser" v-model.trim="form.organiser" class="form-control" :readonly="lockOrganiser" required />
        </div>

        <div class="col-12">
          <label for="image" class="form-label">
            Image URL <span class="text-muted fw-normal">(optional)</span>
          </label>
          <input id="image" v-model.trim="form.image_url" type="url" class="form-control" placeholder="https://example.com/event-image.jpg" />
          <div class="form-text">
            Leave blank to use the default event cover image.
          </div>
        </div>

        <div class="col-12">
          <label for="accessibility" class="form-label">Accessibility notes</label>
          <textarea id="accessibility" v-model.trim="form.accessibility_notes" class="form-control" rows="3"></textarea>
        </div>
      </div>
    </section>

    <div class="admin-form-actions">
      <button class="btn btn-primary btn-pill btn-hover-elevate" type="submit" :disabled="loading">
        {{ loading ? 'Saving...' : submitLabel }}
      </button>

      <RouterLink class="btn btn-outline-primary btn-pill" :to="cancelTo">
        Cancel
      </RouterLink>
    </div>
  </form>
</template>