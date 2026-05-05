<script>
  import { reactive, ref } from 'vue';
  import { useAuthStore } from '@/stores/authStore';

  export default {
    setup() {
      const auth = useAuthStore();
      const loading = ref(false);
      const error = ref('');
      const form = reactive({
        name: auth.user?.name || '',
        email: auth.user?.email || '',
        campus: auth.user?.campus || 'Sarawak',
        interests: auth.user?.interests || ''
      });

      async function submit() {
        loading.value = true;
        error.value = '';
        try {
          await auth.updateProfile(form);
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
      <div class="col-lg-8">
        <div class="card card-lift bg-white p-4 p-md-5">
          <p class="text-primary fw-semibold mb-2">Account</p>
          <h1 class="display-6 fw-bold">Profile settings</h1>
          <p class="text-muted">Update the information used for dashboard display and booking defaults.</p>
          <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
          <form @submit.prevent="submit">
            <div class="row g-3">
              <div class="col-md-6">
                <label for="name" class="form-label">Full name</label>
                <input id="name" v-model.trim="form.name" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label for="email" class="form-label">Email</label>
                <input id="email" v-model.trim="form.email" type="email" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label for="campus" class="form-label">Campus</label>
                <select id="campus" v-model="form.campus" class="form-select">
                  <option>Hawthorn</option>
                  <option>Sarawak</option>
                  <option>Online</option>
                </select>
              </div>
              <div class="col-12">
                <label for="interests" class="form-label">Interests</label>
                <textarea id="interests" v-model.trim="form.interests" class="form-control" rows="4"></textarea>
              </div>
            </div>
            <button class="btn btn-primary mt-4" type="submit" :disabled="loading">{{ loading ? 'Saving...' : 'Save changes' }}</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
