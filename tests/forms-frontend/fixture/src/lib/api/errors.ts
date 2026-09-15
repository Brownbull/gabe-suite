export class ApiError extends Error {
  constructor(public status: number, public detail?: string, public code?: string) {
    super(String(status));
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

export function isClientError(value: unknown): value is ApiError {
  return value instanceof ApiError && value.status >= 400 && value.status < 500;
}
