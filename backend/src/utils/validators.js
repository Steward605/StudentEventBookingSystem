export function requiredString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    const error = new Error(`${fieldName} is required.`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}

export function requiredEmail(value) {
  const email = requiredString(value, 'Email').toLowerCase();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!valid) {
    const error = new Error('A valid email address is required.');
    error.status = 400;
    throw error;
  }
  return email;
}

export function requiredPositiveInteger(value, fieldName) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    const error = new Error(`${fieldName} must be a positive integer.`);
    error.status = 400;
    throw error;
  }
  return number;
}

export function optionalNumber(value, defaultValue = 0) {
  if (value === undefined || value === null || value === '') return defaultValue;
  const number = Number(value);
  if (Number.isNaN(number)) {
    const error = new Error('A numeric value is invalid.');
    error.status = 400;
    throw error;
  }
  return number;
}
