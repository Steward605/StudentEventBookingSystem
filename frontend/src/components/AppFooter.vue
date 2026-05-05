<template>
  <footer class="footer mt-5 py-4">
    <div class="container d-flex flex-column flex-md-row justify-content-between gap-3">
      <div>
        <p class="fw-bold mb-1">Student Event Booking System</p>
        <p class="mb-0 small">Student event discovery, booking, and participation tracking.</p>
      </div>
      <div class="small">
        <RouterLink to="/events" class="me-3">Browse events</RouterLink>
        <RouterLink to="/dashboard" class="me-3">Dashboard</RouterLink>
        <RouterLink to="/profile">Profile</RouterLink>
      </div>
    </div>
  </footer>
</template>
