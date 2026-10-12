/**
 * Normalised error the UI can rely on, regardless of which of the backend's
 * two error shapes produced it:
 *  - FastAPI default: {"detail": "message"} | {"detail": [{"msg": "..."}]}
 *  - AppException handler: {"error": {"code","message","request_id"}}
 */
export class ApiException extends Error {
  readonly statusCode?: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly isNetworkError: boolean;

  constructor(init: {
    message: string;
    statusCode?: number;
    code?: string;
    requestId?: string;
    isNetworkError?: boolean;
  }) {
    super(init.message);
    this.name = 'ApiException';
    this.statusCode = init.statusCode;
    this.code = init.code;
    this.requestId = init.requestId;
    this.isNetworkError = init.isNetworkError ?? false;
  }

  get isUnauthorized() { return this.statusCode === 401; }
  get isForbidden() { return this.statusCode === 403; }
  get isNotFound() { return this.statusCode === 404; }
  get isRateLimited() { return this.statusCode === 429; }
  get isServerError() { return (this.statusCode ?? 0) >= 500; }

  static network(detail?: string) {
    return new ApiException({
      message: detail ?? "Can't reach InPockets right now. Check your connection and try again.",
      isNetworkError: true,
    });
  }

  static unexpected(detail?: string) {
    return new ApiException({ message: detail ?? 'Something went wrong on our end. Please retry.' });
  }

  static fromResponse(statusCode: number | undefined, data: unknown) {
    let message: string | undefined;
    let code: string | undefined;
    let requestId: string | undefined;

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const d = data as Record<string, unknown>;
      const err = d.error;
      if (err && typeof err === 'object') {
        const e = err as Record<string, unknown>;
        if (typeof e.message === 'string') message = e.message;
        if (typeof e.code === 'string') code = e.code;
        if (typeof e.request_id === 'string') requestId = e.request_id;
      }
      const detail = d.detail;
      if (!message && typeof detail === 'string') {
        message = detail;
      } else if (!message && Array.isArray(detail) && detail.length > 0) {
        const first = detail[0] as Record<string, unknown> | undefined;
        if (first && typeof first.msg === 'string') message = first.msg;
      }
    }

    return new ApiException({ message: message ?? fallbackForStatus(statusCode), statusCode, code, requestId });
  }
}

function fallbackForStatus(status?: number): string {
  switch (status) {
    case 400: return 'That request looks invalid. Please check and try again.';
    case 401: return 'Your session has expired. Please log in again.';
    case 403: return "You don't have permission to do that.";
    case 404: return "We couldn't find what you're looking for.";
    case 429: return "You've tried that a few too many times. Please wait a bit.";
    case 502:
    case 503: return 'A verification service is temporarily unavailable. Please try again shortly.';
    default: return 'Something went wrong. Please try again.';
  }
}
