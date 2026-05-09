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
    const error = ref('');
    const searchText = ref('');
    const roleFilter = ref('all');

    const summaryRows = computed(() => {
      const totalUsers = users.value.length;
      const totalStudents = users.value.filter(user => user.role === 'student').length;
      const totalAdmins = users.value.filter(user => user.role === 'admin').length;
      const confirmedTickets = users.value.reduce((sum, user) => {
        return sum + Number(user.confirmed_tickets || 0);
      }, 0);

      return [
        {
          label: 'All users',
          value: totalUsers
        },
        {
          label: 'Students',
          value: totalStudents
        },
        {
          label: 'Admins',
          value: totalAdmins
        },
        {
          label: 'Confirmed tickets',
          value: confirmedTickets
        }
      ];
    });

    const filteredUsers = computed(() => {
      const search = searchText.value.trim().toLowerCase();
      return users.value.filter(user => {
        const matchesRole = roleFilter.value === 'all' || user.role === roleFilter.value;
        const searchableContent = [
          user.name,
          user.email,
          user.role,
          user.campus,
          user.interests
        ].join(' ').toLowerCase();
        const matchesSearch = !search || searchableContent.includes(search);
        return matchesRole && matchesSearch;
      });
    });

    function roleClass(role) {
      if (role === 'admin') {
        return 'seat-status-warning';
      }
      return 'seat-status-success';
    }

    function formatJoinedDate(dateValue) {
      if (!dateValue) {
        return 'Not available';
      }
      return formatDate(dateValue);
    }

    onMounted(async () => {
      try {
        const data = await api.get('/users/all');
        users.value = data.users || [];
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    });

    return {users, loading, error, searchText, roleFilter, summaryRows, filteredUsers, roleClass, formatJoinedDate};
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
            View all user accounts registered to the Student Event Booking System.
          </p>
        </div>
      </header>

      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
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
            <input id="admin-user-search" v-model="searchText" class="form-control" type="search" placeholder="Search by name, email, role, campus, or interests"/>
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
        </div>

        <EmptyState
          v-if="filteredUsers.length === 0"
          title="No users found"
          message="Try changing the search term or role filter."
        />

        <div v-else class="admin-table-wrap">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Campus</th>
                <th scope="col">Bookings</th>
                <th scope="col">Confirmed tickets</th>
                <th scope="col">Registered</th>
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
                <td>{{ user.campus || 'Not set' }}</td>
                <td>{{ user.booking_count }}</td>
                <td>{{ user.confirmed_tickets }}</td>
                <td>{{ formatJoinedDate(user.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>