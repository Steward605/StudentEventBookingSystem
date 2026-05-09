<script>
import { computed, onMounted, ref } from 'vue';
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

    return {users, loading, updatingUserId, error, success, searchText, roleFilter, verificationFilter, summaryRows, filteredUsers, roleClass, verificationClass, formatJoinedDate, updateVerification};
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
        </div>

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
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Verification</th>
                <th scope="col">Campus</th>
                <th scope="col">Bookings</th>
                <th scope="col">Hosted events</th>
                <th scope="col">Registered</th>
                <th scope="col" class="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>
                  <div class="fw-bold">{{ user.name }}</div>
                  <div class="text-muted small">{{ user.email }}</div>
                </td>

                <td>
                  <span :class="['seat-status', roleClass(user.role)]">
                    {{ user.role }}
                  </span>
                </td>

                <td>
                  <span :class="['seat-status', verificationClass(user.verification_status)]">
                    {{ user.verification_status }}
                  </span>
                </td>

                <td>{{ user.campus || 'Not set' }}</td>
                <td>{{ user.booking_count }}</td>
                <td>{{ user.hosted_event_count || 0 }}</td>
                <td>{{ formatJoinedDate(user.created_at) }}</td>

                <td class="text-end">
                  <div v-if="user.role === 'student'" class="btn-group btn-group-sm">
                    <button class="btn btn-outline-success" type="button" :disabled="updatingUserId === user.id || user.verification_status === 'verified'" @click="updateVerification(user, 'verified')">
                      Verify
                    </button>

                    <button class="btn btn-outline-warning" type="button" :disabled="updatingUserId === user.id || user.verification_status === 'pending'" @click="updateVerification(user, 'pending')">
                      Pending
                    </button>

                    <button class="btn btn-outline-danger" type="button" :disabled="updatingUserId === user.id || user.verification_status === 'rejected'" @click="updateVerification(user, 'rejected')">
                      Reject
                    </button>
                  </div>

                  <span v-else class="text-muted small">
                    Admin
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>