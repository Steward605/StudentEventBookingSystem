export function formatCurrency(value) {
  const numeric = Number(value);
  if (numeric === 0) return 'Free';
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(numeric);
}

export function formatDate(dateString) {
  return new Intl.DateTimeFormat('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(dateString));
}

export function formatTimeRange(start, end) {
  return `${start} - ${end}`;
}
