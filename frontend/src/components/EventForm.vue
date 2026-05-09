<script>
  import { reactive, watch } from 'vue';

  const defaultEvent = {
    title: '',
    category: 'Technology',
    description: '',
    location: '',
    city: 'Kuching',
    event_date: '',
    start_time: '',
    end_time: '',
    capacity: 50,
    price: 0,
    image_url: '',
    organiser: '',
    accessibility_notes: ''
  };
  export default {
    props: {
      initialValue: { type: Object, default: () => ({}) },
      loading: { type: Boolean, default: false },
      submitLabel: { type: String, default: 'Save event' }
    },
    emits: ['submit'],
    setup(props, { emit }) {
      const form = reactive({ ...defaultEvent });
      const categories = ['Technology', 'Design', 'Career', 'Community', 'Wellbeing', 'Entrepreneurship'];

      watch(() => props.initialValue, value => {
        Object.assign(form, defaultEvent, value || {});
      }, { immediate: true, deep: true });

      function submit() {
        emit('submit', { ...form });
      }
      return {form, categories, submit};
    }
  };
</script>

<template>
  <form class="card card-lift bg-white p-4" @submit.prevent="submit">
    <div class="row g-3">
      <div class="col-md-8">
        <label for="title" class="form-label">Title</label>
        <input id="title" v-model.trim="form.title" class="form-control" required />
      </div>
      <div class="col-md-4">
        <label for="category" class="form-label">Category</label>
        <select id="category" v-model="form.category" class="form-select">
          <option v-for="category in categories" :key="category">{{ category }}</option>
        </select>
      </div>
      <div class="col-12">
        <label for="description" class="form-label">Description</label>
        <textarea id="description" v-model.trim="form.description" class="form-control" rows="4" required></textarea>
      </div>
      <div class="col-md-6">
        <label for="location" class="form-label">Location</label>
        <input id="location" v-model.trim="form.location" class="form-control" required />
      </div>
      <div class="col-md-6">
        <label for="city" class="form-label">City</label>
        <input id="city" v-model.trim="form.city" class="form-control" required />
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
      <div class="col-md-4">
        <label for="capacity" class="form-label">Capacity</label>
        <input id="capacity" v-model.number="form.capacity" type="number" min="1" class="form-control" required />
      </div>
      <div class="col-md-4">
        <label for="price" class="form-label">Price (MYR)</label>
        <input id="price" v-model.number="form.price" type="number" min="0" step="0.01" class="form-control" required />
      </div>
      <div class="col-md-4">
        <label for="organiser" class="form-label">Organiser</label>
        <input id="organiser" v-model.trim="form.organiser" class="form-control" required />
      </div>
      <div class="col-12">
        <label for="image" class="form-label">
          Image URL <span class="text-muted fw-normal">(optional)</span>
        </label>
        <input id="image" v-model.trim="form.image_url" type="url" class="form-control" placeholder="https://example.com/event-image.jpg"/>
        <div class="form-text">Leave blank to use the default event cover image.</div>
      </div>
      <div class="col-12">
        <label for="accessibility" class="form-label">Accessibility notes</label>
        <textarea id="accessibility" v-model.trim="form.accessibility_notes" class="form-control" rows="3"></textarea>
      </div>
    </div>
    <button class="btn btn-primary btn-pill btn-hover-elevate mt-4" type="submit" :disabled="loading">
      {{ loading ? 'Saving...' : submitLabel }}
    </button>
  </form>
</template>