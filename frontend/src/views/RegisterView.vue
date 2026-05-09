<script>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

export default {
  setup() {
    const router = useRouter();
    const auth = useAuthStore();
    const loading = ref(false);
    const error = ref('');
    const form = reactive({ name: '', email: '', password: '', campus: 'Sarawak', interests: '' });

    async function submit() {
      loading.value = true;
      error.value = '';
      try {
        await auth.register(form);
        router.push('/dashboard');
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    }

    return {loading, error, form, submit};
  }
};
</script>

<template>
  <div class="container section-pad app-shell">
    <div class="row justify-content-center">
      <div class="col-lg-7">
        <div class="card card-lift bg-white p-4 p-md-5">
          <h1 class="h2 fw-bold">Create your Student Event Booking System account</h1>
          <p class="text-muted">A profile allows the system to personalise your dashboard and keep your booking history.</p>
          <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
          <form @submit.prevent="submit">
            <div class="row g-3">
              <div class="col-md-6">
                <label for="name" class="form-label">Full name</label>
                <input id="name" v-model.trim="form.name" class="form-control" required autocomplete="name" />
              </div>
              <div class="col-md-6">
                <label for="email" class="form-label">Email</label>
                <input id="email" v-model.trim="form.email" type="email" class="form-control" required autocomplete="email" />
              </div>
              <div class="col-md-6">
                <label for="campus" class="form-label">Campus</label>
                <select id="campus" v-model="form.campus" class="form-select">
                  <option>Hawthorn</option>
                  <option>Sarawak</option>
                  <option>Online</option>
                </select>
              </div>
              <div class="col-md-6">
                <label for="password" class="form-label">Password</label>
                <input id="password" v-model="form.password" type="password" class="form-control" minlength="8" required autocomplete="new-password" />
              </div>
              <div class="col-12">
                <label for="interests" class="form-label">Interests</label>
                <textarea id="interests" v-model.trim="form.interests" class="form-control" rows="3" placeholder="e.g. design, AI, career events"></textarea>
              </div>
            </div>
            <button class="btn btn-primary btn-pill btn-hover-elevate mt-4" type="submit" :disabled="loading">
              {{ loading ? 'Creating...' : 'Create account' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
