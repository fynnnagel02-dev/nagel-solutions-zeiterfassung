export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super("AUTHENTICATION_REQUIRED", message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "You are not allowed to perform this action") {
    super("FORBIDDEN", message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message = "The submitted data is invalid") {
    super("VALIDATION_ERROR", message, 422);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested record was not found") {
    super("NOT_FOUND", message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "The requested operation conflicts with current state") {
    super("CONFLICT", message, 409);
  }
}
