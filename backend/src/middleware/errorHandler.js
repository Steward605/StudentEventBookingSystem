export function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  const status = error.status || 500;
  const message = status === 500 ? 'Unexpected server error.' : error.message;
  res.status(status).json({ message });
}
