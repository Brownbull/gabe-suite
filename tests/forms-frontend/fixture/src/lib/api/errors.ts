export class ApiError extends Error {
  constructor(public status: number) {
    super(String(status));
  }
}

export function isClientError(value: unknown): value is ApiError {
  return value instanceof ApiError && value.status >= 400 && value.status < 500;
}
