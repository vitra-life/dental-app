import type { components } from './schema';

export type ApiErrorBody = components['schemas']['ErrorResponseDto'];

/** One invalid request field, as the API reports it in `details`. */
export interface FieldError {
  field: string;
  errors: string[];
}

/** A non-2xx answer from the API, with the body in the backend's error format. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.message ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }

  /** The invalid fields of a 400 response; empty for other errors. */
  get fieldErrors(): FieldError[] {
    const details: unknown = this.body?.details;
    return Array.isArray(details) ? details.filter(isFieldError) : [];
  }
}

function isFieldError(value: unknown): value is FieldError {
  return typeof value === 'object' && value !== null && 'field' in value && 'errors' in value;
}

/** The data of an openapi-fetch result, or an `ApiError` thrown for an error response. */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (!result.response.ok) {
    throw new ApiError(result.response.status, (result.error as ApiErrorBody | undefined) ?? null);
  }
  return result.data as T;
}

/** A Persian message for any error a request can throw. */
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'ارتباط با سرور برقرار نشد';
  switch (error.status) {
    case 400:
      return 'اطلاعات واردشده معتبر نیست';
    case 404:
      return 'مورد موردنظر پیدا نشد';
    case 409:
      return 'این تغییر با اطلاعات موجود تداخل دارد';
    default:
      return error.status >= 500 ? 'خطای سرور؛ دوباره تلاش کنید' : 'درخواست انجام نشد';
  }
}
