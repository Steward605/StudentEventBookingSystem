<script>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import Paginate from 'vuejs-paginate-next'
import { useAuthStore } from '@/stores/authStore';
import LoadingState from '@/components/LoadingState.vue';
import EmptyState from '@/components/EmptyState.vue';
import { api } from '@/services/api';
import { formatDate } from '@/utils/formatters';

export default {
  components: {
    LoadingState,
    EmptyState,
    paginate: Paginate
  },
  setup() {
    const users = ref([]);
    const summary = ref({
      totalUsers: 0,
      totalStudents: 0,
      totalAdmins: 0,
      verifiedStudents: 0
    });
    const pagination = ref({
      page: 1,
      limit: 8,
      totalItems: 0,
      totalPages: 1
    });
    const currentPage = ref(1);
    const loading = ref(true);
    const updatingUserId = ref(null);
    const error = ref('');
    const success = ref('');
    const searchText = ref('');
    const roleFilter = ref('all');
    const verificationFilter = ref('all');
    const authStore = useAuthStore()
    const showCreateForm = ref(false)
    const creatingUser = ref(false)
    const deletingUserId = ref(null)
    const perPage = 8
    let debounceTimer
    const newUser = reactive({
      name: '',
      email: '',
      password: '',
      role: 'student',
      campus: 'Sarawak',
      interests: '',
      verification_status: 'pending'
    })
    const summaryRows = computed(() => {
      return [
        { label: 'All users', value: summary.value.totalUsers },
        { label: 'Students', value: summary.value.totalStudents },
        { label: 'Admins', value: summary.value.totalAdmins },
        { label: 'Verified students', value: summary.value.verifiedStudents }
      ];
    });
    const filteredUsers = computed(() => users.value);
    const resultLabel = computed(() => {
      const count = pagination.value.totalItems ?? filteredUsers.value.length;
      return `${count} ${count === 1 ? 'user' : 'users'} shown`;
    });
    const paginationLabel = computed(() => {
      const { page, limit, totalItems } = pagination.value;

      if (!totalItems) {
        return 'No users found';
      }

      const start = (page - 1) * limit + 1;
      const end = Math.min(page * limit, totalItems);
      return `Showing ${start}-${end} of ${totalItems} users`;
    });

    function roleClass(role) {
      if (role === 'admin') {
        return 'seat-status-warning';
      }
      return 'seat-status-success';
    }

    function verificationClass(status) {
      if (status === 'verified') {
        return 'seat-status-success';
      }
      if (status === 'rejected') {
        return 'seat-status-danger';
      }
      return 'seat-status-warning';
    }

    function formatJoinedDate(dateValue) {
      if (!dateValue) {
        return 'Not available';
      }
      return formatDate(dateValue);
    }

    function buildParams(page = 1) {
      return {
        ...(searchText.value ? { search: searchText.value } : {}),
        ...(roleFilter.value !== 'all' ? { role: roleFilter.value } : {}),
        ...(verificationFilter.value !== 'all' ? { verification: verificationFilter.value } : {}),
        page,
        limit: perPage
      }
    }

    function buildQuery(params) {
      const query = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.set(key, value)
        }
      })
      return query.toString() ? `?${query.toString()}` : ''
    }

    async function loadUsers(page = currentPage.value) {
      currentPage.value = page
      loading.value = true;
      error.value = '';
      try {
        const data = await api.get(`/users/all${buildQuery(buildParams(page))}`);
        users.value = data.users || [];
        summary.value = data.summary || summary.value;
        pagination.value = data.pagination || {
          page,
          limit: perPage,
          totalItems: users.value.length,
          totalPages: 1
        };
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    }

    function resetNewUserForm() {
      Object.assign(newUser, {
        name: '',
        email: '',
        password: '',
        role: 'student',
        campus: 'Sarawak',
        interests: '',
        verification_status: 'pending'
      })
    }

    async function createUser() {
      creatingUser.value = true
      error.value = ''
      success.value = ''
      try {
        const payload = {
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          campus: newUser.campus,
          interests: newUser.interests,
          verification_status: newUser.role === 'admin' ? 'verified' : newUser.verification_status
        }
        const data = await api.post('/users', payload)
        success.value = `${data.user.name} has been added.`
        showCreateForm.value = false
        resetNewUserForm()
        await loadUsers(1)
      } catch (err) {
        error.value = err.message
      } finally {
        creatingUser.value = false
      }
    }

    async function deleteUser(user) {
      if (user.id === authStore.user?.id) {
        error.value = 'You cannot delete your own admin account.'
        return
      }

      const confirmed = window.confirm(
        `Delete ${user.name}? This will remove the account and any bookings owned by this user.`
      )

      if (!confirmed) {
        return
      }

      deletingUserId.value = user.id
      error.value = ''
      success.value = ''

      try {
        await api.delete(`/users/${user.id}`)
        success.value = `${user.name} has been deleted.`
        await loadUsers(currentPage.value)
        if (users.value.length === 0 && currentPage.value > 1 && pagination.value.totalItems > 0) {
          await loadUsers(currentPage.value - 1)
        }
      } catch (err) {
        error.value = err.message
      } finally {
        deletingUserId.value = null
      }
    }

    async function updateVerification(user, verificationStatus) {
      updatingUserId.value = user.id;
      error.value = '';
      success.value = '';
      try {
        await api.patch(`/users/${user.id}/verification`, {
          verification_status: verificationStatus
        });
        success.value = `${user.name} is now marked as ${verificationStatus}.`;
        await loadUsers(currentPage.value)
      } catch (err) {
        error.value = err.message;
      } finally {
        updatingUserId.value = null;
      }
    }

    function goToPage(pageNum) {
      const totalPages = pagination.value.totalPages || 1;
      if (pageNum < 1 || pageNum > totalPages || pageNum === pagination.value.page) {
        return;
      }
      loadUsers(pageNum);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    watch([searchText, roleFilter, verificationFilter], () => {
      window.clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(() => {
        loadUsers(1)
      }, 250)
    })

    onMounted(loadUsers);
    onBeforeUnmount(() => {
      window.clearTimeout(debounceTimer)
    })

    return { users, pagination, currentPage, resultLabel, paginationLabel, loading, updatingUserId, deletingUserId, creatingUser, error, success, searchText, roleFilter, verificationFilter, showCreateForm, newUser, summaryRows, filteredUsers, roleClass, verificationClass, formatJoinedDate, resetNewUserForm, createUser, deleteUser, updateVerification, goToPage };
  }
};
</script>

<template>
  <div class="admin-content-page">
    <LoadingState v-if="loading" />

    <div v-else>
      <header class="admin-page-header mb-4">
        <div>
          <p class="text-primary fw-semibold mb-2">User management</p>
          <h1 class="display-6 fw-bold mb-2">Registered users</h1>
          <p class="text-muted mb-0">
            Verify student accounts before allowing them to host events and book venues.
          </p>
        </div>
      </header>

      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <div v-if="success" class="alert alert-success" role="status">
        {{ success }}
      </div>

      <section class="row g-3 mb-4" aria-label="Registered user summary">
        <div v-for="row in summaryRows" :key="row.label" class="col-sm-6 col-xl-3">
          <div class="admin-mini-stat">
            <p class="text-muted small mb-1">{{ row.label }}</p>
            <p class="h4 fw-bold mb-0">{{ row.value }}</p>
          </div>
        </div>
      </section>

      <section class="admin-panel" aria-labelledby="registered-users-title">
        <div class="admin-panel-header">
          <div>
            <p class="text-primary fw-semibold mb-1">Accounts</p>
            <h2 id="registered-users-title" class="h4 fw-bold mb-0">User list</h2>
          </div>
          <button class="btn btn-primary rounded-pill px-4" type="button" @click="showCreateForm = !showCreateForm">
            {{ showCreateForm ? 'Close' : 'Add user' }}
          </button>
        </div>

        <form v-if="showCreateForm" class="admin-create-user-form mb-4" @submit.prevent="createUser">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label fw-semibold" for="new-user-name">Full name</label>
              <input id="new-user-name" v-model="newUser.name" class="form-control" type="text" required placeholder="Example: Aina Rahman"/>
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold" for="new-user-email">Email</label>
              <input id="new-user-email" v-model="newUser.email" class="form-control" type="email" required placeholder="example@student.com"/>
            </div>

            <div class="col-md-4">
              <label class="form-label fw-semibold" for="new-user-password">Temporary password</label>
              <input id="new-user-password" v-model="newUser.password" class="form-control" type="password" minlength="8" required placeholder="Minimum 8 characters"/>
            </div>

            <div class="col-md-4">
              <label class="form-label fw-semibold" for="new-user-role">Role</label>
              <select id="new-user-role" v-model="newUser.role" class="form-select">
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div class="col-md-4">
              <label class="form-label fw-semibold" for="new-user-verification">Verification</label>
              <select id="new-user-verification" v-model="newUser.verification_status" class="form-select" :disabled="newUser.role === 'admin'">
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
              <p v-if="newUser.role === 'admin'" class="form-text mb-0">
                Admin accounts are automatically verified.
              </p>
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold" for="new-user-campus">Campus</label>
              <select id="new-user-campus" v-model="newUser.campus" class="form-select">
                <option value="Sarawak">Sarawak</option>
                <option value="Hawthorn">Hawthorn</option>
                <option value="Online">Online</option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold" for="new-user-interests">Interests</label>
              <input id="new-user-interests" v-model="newUser.interests" class="form-control" type="text" placeholder="Technology, design, volunteering"/>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4">
            <button class="btn btn-outline-secondary rounded-pill px-4" type="button" @click="resetNewUserForm">
              Reset
            </button>
            <button class="btn btn-primary rounded-pill px-4" type="submit" :disabled="creatingUser">
              {{ creatingUser ? 'Adding...' : 'Create user' }}
            </button>
          </div>
        </form>

        <div class="admin-management-toolbar">
          <div>
            <label class="form-label fw-semibold" for="admin-user-search">
              Search users
            </label>
            <input id="admin-user-search" v-model="searchText" class="form-control" type="search" placeholder="Search by name, email, role, campus, interests, or verification"/>
          </div>

          <div>
            <label class="form-label fw-semibold" for="admin-role-filter">
              Filter by role
            </label>
            <select id="admin-role-filter" v-model="roleFilter" class="form-select">
              <option value="all">All roles</option>
              <option value="student">Students</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div>
            <label class="form-label fw-semibold" for="admin-verification-filter">
              Filter by verification
            </label>
            <select id="admin-verification-filter" v-model="verificationFilter" class="form-select">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <EmptyState
          v-if="summaryRows[0].value === 0"
          title="No users found"
          message="Registered accounts will appear here after users are created."
        />

        <EmptyState
          v-else-if="filteredUsers.length === 0"
          title="No users found"
          message="Try changing the search term, role filter, or verification filter."
        />

        <div v-else>
          <div class="admin-results-heading mb-3">
            <h3 class="h5 fw-bold mb-0">User records</h3>
            <p class="text-muted mb-0">{{ resultLabel }}</p>
          </div>

          <div class="admin-table-wrap">
            <table class="table admin-users-table mb-0">
              <thead>
                <tr>
                  <th scope="col" class="users-col-user">User</th>
                  <th scope="col" class="users-col-role">Role</th>
                  <th scope="col" class="users-col-status">Status</th>
                  <th scope="col" class="users-col-campus">Campus</th>
                  <th scope="col" class="users-col-number">Bookings</th>
                  <th scope="col" class="users-col-number">Hosted</th>
                  <th scope="col" class="users-col-date">Registered</th>
                  <th scope="col" class="users-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in filteredUsers" :key="user.id">
                  <td class="users-col-user">
                    <div class="admin-user-name">{{ user.name }}</div>
                    <div class="admin-user-email">{{ user.email }}</div>
                  </td>
                  <td class="users-col-role">
                    <span :class="['seat-status', roleClass(user.role)]">
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="users-col-status">
                    <span :class="['seat-status', verificationClass(user.verification_status)]">
                      {{ user.verification_status }}
                    </span>
                  </td>
                  <td class="users-col-campus">
                    {{ user.campus || 'Not set' }}
                  </td>
                  <td class="users-col-number">
                    {{ user.booking_count }}
                  </td>
                  <td class="users-col-number">
                    {{ user.hosted_event_count || 0 }}
                  </td>
                  <td class="users-col-date">
                    {{ formatJoinedDate(user.created_at) }}
                  </td>
                  <td class="users-col-actions">
                    <div class="admin-user-actions">
                      <select v-if="user.role === 'student'" class="form-select form-select-sm admin-status-select" :value="user.verification_status" :disabled="updatingUserId === user.id" @change="updateVerification(user, $event.target.value)">
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <span v-else class="admin-role-note">Admin</span>
                      <button class="btn btn-outline-danger btn-sm admin-delete-user-btn" type="button" :disabled="deletingUserId === user.id" @click="deleteUser(user)">
                        {{ deletingUserId === user.id ? 'Deleting...' : 'Delete' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="d-flex flex-column align-items-center gap-2 mt-4">
            <p class="text-muted small mb-0" aria-live="polite">{{ paginationLabel }}</p>

            <paginate v-model="currentPage" :page-count="pagination.totalPages" :page-range="3" :margin-pages="1" :click-handler="goToPage" :prev-text="'Previous'" :next-text="'Next'" :container-class="'pagination flex-wrap justify-content-center mb-0'" :page-class="'page-item'" :page-link-class="'page-link'" :prev-class="'page-item'" :prev-link-class="'page-link'" :next-class="'page-item'" :next-link-class="'page-link'" :break-view-class="'page-item disabled'" :break-view-link-class="'page-link'"/>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
