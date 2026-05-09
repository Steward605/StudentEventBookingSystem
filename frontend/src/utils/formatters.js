export function formatCurrency(value) {
  const numeric = Number(value || 0);

  if (numeric === 0) {
    return 'Free';
  }

  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR'
  }).format(numeric);
}

export function formatPrice(value) {
  return formatCurrency(value);
}

export function formatDate(dateValue) {
  if (!dateValue) {
    return 'Not available';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function formatTime(timeValue) {
  if (!timeValue) {
    return 'Not available';
  }

  const [hourValue, minuteValue] = String(timeValue).split(':');
  const hour = Number.parseInt(hourValue, 10);
  const minute = Number.parseInt(minuteValue || '0', 10);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return timeValue;
  }

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return new Intl.DateTimeFormat('en-MY', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

export function formatTimeRange(start, end) {
  if (!start && !end) {
    return 'Not available';
  }

  if (!start) {
    return formatTime(end);
  }

  if (!end) {
    return formatTime(start);
  }

  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function formatDateTime(dateValue) {
  if (!dateValue) {
    return 'Not available';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}