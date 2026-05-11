<script>
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore';
import LoadingState from '@/components/LoadingState.vue';
import EmptyState from '@/components/EmptyState.vue';
import { api } from '@/services/api';
import { formatDate } from '@/utils/formatters';

export default {
  components: {
    LoadingState,
    EmptyState
  },
  setup() {
    const users = ref([]);
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
      const totalUsers = users.value.length;
      const totalStudents = users.value.filter(user => user.role === 'student').length;
      const totalAdmins = users.value.filter(user => user.role === 'admin').length;
      const verifiedStudents = users.value.filter(user => user.role === 'student' && user.verification_status === 'verified').length;
      return [
        { label: 'All users', value: totalUsers },
        { label: 'Students', value: totalStudents },
        { label: 'Admins', value: totalAdmins },
        { label: 'Verified students', value: verifiedStudents }
      ];
    });
    const filteredUsers = computed(() => {
      const search = searchText.value.trim().toLowerCase();
      return users.value.filter(user => {
        const matchesRole = roleFilter.value === 'all' || user.role === roleFilter.value;
        const matchesVerification = verificationFilter.value === 'all' || user.verification_status === verificationFilter.value;
        const searchableContent = [
          user.name,
          user.email,
          user.role,
          user.campus,
          user.interests,
          user.verification_status
        ].join(' ').toLowerCase();
        const matchesSearch = !search || searchableContent.includes(search);
        return matchesRole && matchesVerification && matchesSearch;
      });
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

    async function loadUsers() {
      loading.value = true;
      error.value = '';
      try {
        const data = await api.get('/users/all');
        users.value = data.users || [];
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

    function normaliseUserCounts(user) {
      return {
        ...user,
        booking_count: user.booking_count ?? 0,
        confirmed_tickets: user.confirmed_tickets ?? 0,
        hosted_event_count: user.hosted_event_count ?? 0
      }
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
        users.value = [normaliseUserCounts(data.user), ...users.value]
        success.value = `${data.user.name} has been added.`
        showCreateForm.value = false
        resetNewUserForm()
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
        users.value = users.value.filter(currentUser => currentUser.id !== user.id)
        success.value = `${user.name} has been deleted.`
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
        const data = await api.patch(`/users/${user.id}/verification`, {
          verification_status: verificationStatus
        });
        users.value = users.value.map(currentUser => {
          if (currentUser.id !== user.id) {
            return currentUser;
          }
          return {
            ...currentUser,
            ...data.user
          };
        });
        success.value = `${user.name} is now marked as ${verificationStatus}.`;
      } catch (err) {
        error.value = err.message;
      } finally {
        updatingUserId.value = null;
      }
    }

    onMounted(loadUsers);

    return { users, loading, updatingUserId, deletingUserId, creatingUser, error, success, searchText, roleFilter, verificationFilter, showCreateForm, newUser, summaryRows, filteredUsers, roleClass, verificationClass, formatJoinedDate, resetNewUserForm, createUser, deleteUser, updateVerification };
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
          v-if="filteredUsers.length === 0"
          title="No users found"
          message="Try changing the search term, role filter, or verification filter."
        />

        <div v-else class="admin-table-wrap">
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
      </section>
    </div>
  </div>
</template>
