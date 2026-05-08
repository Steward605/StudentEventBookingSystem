<script>
import { reactive, ref, watch } from 'vue';
import { useAuthStore } from '@/stores/authStore';

export default {
  setup() {
    const auth = useAuthStore();
    const loading = ref(false);
    const error = ref('');
    const form = reactive({
      name: '',
      email: '',
      campus: 'Sarawak',
      interests: ''
    });

    function syncForm() {
      form.name = auth.user?.name || '';
      form.email = auth.user?.email || '';
      form.campus = auth.user?.campus || 'Sarawak';
      form.interests = auth.user?.interests || '';
    }

    async function submit() {
      loading.value = true;
      error.value = '';
      try {
        await auth.updateProfile(form);
      } catch (err) {
        error.value = err.message || 'Unable to update profile.';
      } finally {
        loading.value = false;
      }
    }
    watch(() => auth.user, syncForm, { immediate: true });
    return {auth, loading, error, form, submit};
  }
};
</script>

<template>
  <div class="container section-pad app-shell">
    <header class="dashboard-header mb-4">
      <div>
        <p class="text-primary fw-semibold mb-2">Account</p>
        <h1 class="display-6 fw-bold mb-2">Profile settings</h1>
        <p class="text-muted mb-0">Update the information used for dashboard display and booking defaults.</p>
      </div>
      <div class="dashboard-header-actions">
        <RouterLink class="btn btn-outline-primary btn-pill" to="/dashboard">
          Back to dashboard
        </RouterLink>
      </div>
    </header>

    <div class="row g-4">
      <div class="col-lg-8">
        <section class="dashboard-panel h-100" aria-labelledby="profile-form-title">
          <div class="dashboard-panel-header">
            <div>
              <p class="text-primary fw-semibold mb-1">Details</p>
              <h2 id="profile-form-title" class="h4 fw-bold mb-0">Personal information</h2>
            </div>
          </div>
          <div v-if="error" class="alert alert-danger" role="alert">
            {{ error }}
          </div>
          <form @submit.prevent="submit">
            <div class="row g-3">
              <div class="col-md-6">
                <label for="profile-name" class="form-label">Full name</label>
                <input id="profile-name" v-model.trim="form.name" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label for="profile-email" class="form-label">Email</label>
                <input id="profile-email" v-model.trim="form.email" type="email" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label for="profile-campus" class="form-label">Campus</label>
                <select id="profile-campus" v-model="form.campus" class="form-select">
                  <option>Hawthorn</option>
                  <option>Sarawak</option>
                  <option>Online</option>
                </select>
              </div>
              <div class="col-12">
                <label for="profile-interests" class="form-label">Interests</label>
                <textarea id="profile-interests" v-model.trim="form.interests" class="form-control" rows="4"></textarea>
                <div class="form-text">Use comma-separated interests, such as design, entrepreneurship, community events.</div>
              </div>
            </div>
            <div class="d-flex flex-wrap gap-2 mt-4">
              <button class="btn btn-primary btn-pill" type="submit" :disabled="loading">
                {{ loading ? 'Saving...' : 'Save changes' }}
              </button>
              <RouterLink class="btn btn-outline-primary btn-pill" to="/dashboard">
                Cancel
              </RouterLink>
            </div>
          </form>
        </section>
      </div>

      <div class="col-lg-4">
        <aside class="dashboard-panel h-100" aria-labelledby="profile-summary-title">
          <div class="dashboard-panel-header">
            <div>
              <p class="text-primary fw-semibold mb-1">Account</p>
              <h2 id="profile-summary-title" class="h4 fw-bold mb-0">Saved profile details</h2>
            </div>
          </div>
          <dl class="account-snapshot-list">
            <div class="account-snapshot-row">
              <dt>Name</dt>
              <dd>{{ auth.user?.name || 'Not set' }}</dd>
            </div>
            <div class="account-snapshot-row">
              <dt>Email</dt>
              <dd>{{ auth.user?.email || 'Not set' }}</dd>
            </div>
            <div class="account-snapshot-row">
              <dt>Campus</dt>
              <dd>{{ auth.user?.campus || 'Not set' }}</dd>
            </div>
            <div class="account-snapshot-row">
              <dt>Role</dt>
              <dd>{{ auth.user?.role || 'Student' }}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  </div>
</template>