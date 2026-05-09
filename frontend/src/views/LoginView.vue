<script>
  import { reactive, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/authStore';

  export default {
    setup() {
      const auth = useAuthStore();
      const route = useRoute();
      const router = useRouter();
      const loading = ref(false);
      const error = ref('');
      const preventPasswordAutofill = ref(true);
      const form = reactive({ email: '', password: '' });

      async function submit() {
        loading.value = true;
        error.value = '';
        try {
          await auth.login(form);
          router.push(route.query.redirect || (auth.isAdmin ? '/admin' : '/dashboard'));
        } catch (err) {
          error.value = err.message;
        } finally {
          loading.value = false;
        }
      }

      return {loading, error, form, submit, preventPasswordAutofill};
    }
  };
</script>

<template>
  <div class="container section-pad app-shell">
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-5">
        <div class="card card-lift bg-white p-4 p-md-5">
          <h1 class="h2 fw-bold">Log in</h1>
          <p class="text-muted">Log in to manage your bookings and view your event history.</p>
          <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
          <form @submit.prevent="submit">
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <input id="email" v-model.trim="form.email" type="email" class="form-control" required autocomplete="email" autocapitalize="none" spellcheck="false" @focus="preventPasswordAutofill = false" @pointerdown="preventPasswordAutofill = false"/>
            </div>
            <div class="mb-4">
              <label for="password" class="form-label">Password</label>
              <input id="password" v-model="form.password" type="password" class="form-control" required autocomplete="current-password" autocapitalize="none" :readonly="preventPasswordAutofill" @focus="preventPasswordAutofill = false" @pointerdown="preventPasswordAutofill = false" @keydown="preventPasswordAutofill = false"/>
            </div>
            <button class="btn btn-primary btn-pill btn-hover-elevate w-100" type="submit" :disabled="loading">
              {{ loading ? 'Logging in...' : 'Log in' }}
            </button>
          </form>
          <p class="mt-3 mb-0 small">Need an account? <RouterLink to="/register">Register here</RouterLink>.</p>
        </div>
      </div>
    </div>
  </div>
</template>
