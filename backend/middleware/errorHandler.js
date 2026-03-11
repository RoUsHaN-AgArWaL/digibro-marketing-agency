export function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error.",
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}