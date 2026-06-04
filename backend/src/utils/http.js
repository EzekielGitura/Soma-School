export function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export function sendCreated(res, data) {
  res.status(201).json(data);
}

export function notFound(message = "Resource not found") {
  const error = new Error(message);
  error.status = 404;
  return error;
}

export function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export function handleError(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const status = error.status || statusFromPgError(error) || statusFromConnectionError(error) || 500;
  const message =
    status === 500
      ? "Something went wrong on the server."
      : status === 503
        ? "Data service is temporarily unavailable. Please try again later."
        : error.message;

  if (status === 500) {
    console.error(error);
  }

  res.status(status).json({ message });
}

function statusFromPgError(error) {
  if (error.code === "23505") return 409;
  if (error.code === "23503") return 400;
  if (error.code === "23514") return 400;
  return null;
}

function statusFromConnectionError(error) {
  const connectionErrorCodes = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET"]);
  if (connectionErrorCodes.has(error.code)) return 503;
  if (error.errors?.some((innerError) => connectionErrorCodes.has(innerError.code))) {
    return 503;
  }
  return null;
}
