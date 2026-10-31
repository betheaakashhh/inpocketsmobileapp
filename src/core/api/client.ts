import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { AppConfig } from '../config';
import { isRefreshTokenExpired, tokenStorage } from '../storage/tokenStorage';
import { ApiException } from './errors';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Public endpoint: don't attach Authorization (login, OTP, refresh). */
    skipAuth?: boolean;
    /** Don't try the 401 -> refresh -> retry dance for this request. */
    skipRefreshRetry?: boolean;
    _retried?: boolean;
  }
}

type SessionExpiredHandler = () => Promise<void> | void;
let onSessionExpired: SessionExpiredHandler = () => {};
/** Wired by the auth store so a dead refresh token always lands on login. */
export const setSessionExpiredHandler = (h: SessionExpiredHandler) => {
  onSessionExpired = h;
};

const http: AxiosInstance = axios.create({
  baseURL: AppConfig.apiV1BaseUrl,
  timeout: AppConfig.requestTimeoutMs,
  headers: { 'Content-Type': 'application/json', 'X-Client': 'inpockets-react-native' },
});

// baseURL is resolved lazily so Metro's hostUri is available.
http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  config.baseURL = AppConfig.apiV1BaseUrl;
  if (!config.skipAuth) {
    const session = await tokenStorage.read();
    if (session) config.headers.set('Authorization', `Bearer ${session.accessToken}`);
  }
  if (AppConfig.verboseNetworkLogs) {
    console.log('[inpockets.net] →', config.method?.toUpperCase(), config.url);
  }
  return config;
});

/**
 * Single-flight refresh: if several requests 401 at once, only one
 * /auth/refresh call is made; the rest await the same promise.
 */
type RefreshOutcome = 'ok' | 'rejected' | 'unreachable';
let refreshInFlight: Promise<RefreshOutcome> | null = null;

/**
 * 'rejected'    -> the server said the session is over (401/403/400): sign the user out.
 * 'unreachable' -> timeout, offline, 5xx: the session may be perfectly valid, so do NOT sign out
 *                  (a dropped connection every 15 minutes used to force a fresh SMS login).
 */
function refreshSession(): Promise<RefreshOutcome> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async (): Promise<RefreshOutcome> => {
    try {
      const session = await tokenStorage.read();
      if (!session || isRefreshTokenExpired(session)) return 'rejected';

      const res = await http.post(
        '/auth/refresh',
        { refresh_token: session.refreshToken },
        { skipAuth: true, skipRefreshRetry: true },
      );
      const d = res.data as Record<string, string>;
      await tokenStorage.save({
        accessToken: d.access_token,
        refreshToken: d.refresh_token,
        accessTokenExpiresAt: new Date(d.access_token_expires_at),
        refreshTokenExpiresAt: new Date(d.refresh_token_expires_at),
        userId: d.user_id,
      });
      return 'ok';
    } catch (e) {
      if (axios.isAxiosError(e) && (!e.response || e.response.status >= 500)) return 'unreachable';
      return 'rejected';
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

http.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const config = err.config;
    const response = err.response;

    // No response at all -> connectivity problem (timeout / DNS / offline).
    if (!response) {
      return Promise.reject(ApiException.network());
    }

    if (response.status === 401 && config && !config.skipRefreshRetry && !config._retried) {
      const refreshed = await refreshSession();
      if (refreshed === 'ok') {
        try {
          return await http.request({ ...config, _retried: true });
        } catch (retryErr) {
          return Promise.reject(toApiException(retryErr));
        }
      }
      if (refreshed === 'unreachable') return Promise.reject(ApiException.network());
      await onSessionExpired();
    }

    return Promise.reject(ApiException.fromResponse(response.status, response.data));
  },
);

function toApiException(e: unknown): ApiException {
  if (e instanceof ApiException) return e;
  if (axios.isAxiosError(e)) {
    return e.response ? ApiException.fromResponse(e.response.status, e.response.data) : ApiException.network();
  }
  return ApiException.unexpected(e instanceof Error ? e.message : undefined);
}

/** The only place in the app allowed to talk to the network. */
export const api = {
  async get<T>(path: string, opts?: { query?: Record<string, unknown>; requiresAuth?: boolean }): Promise<T> {
    try {
      const r = await http.get(path, { params: opts?.query, skipAuth: opts?.requiresAuth === false });
      return r.data as T;
    } catch (e) { throw toApiException(e); }
  },
  async post<T>(path: string, opts?: { data?: unknown; requiresAuth?: boolean }): Promise<T> {
    try {
      const r = await http.post(path, opts?.data, { skipAuth: opts?.requiresAuth === false });
      return r.data as T;
    } catch (e) { throw toApiException(e); }
  },
  async put<T>(path: string, opts?: { data?: unknown; requiresAuth?: boolean }): Promise<T> {
    try {
      const r = await http.put(path, opts?.data, { skipAuth: opts?.requiresAuth === false });
      return r.data as T;
    } catch (e) { throw toApiException(e); }
  },
  async patch<T>(path: string, opts?: { data?: unknown; requiresAuth?: boolean }): Promise<T> {
    try {
      const r = await http.patch(path, opts?.data, { skipAuth: opts?.requiresAuth === false });
      return r.data as T;
    } catch (e) { throw toApiException(e); }
  },
  async delete<T>(path: string, opts?: { requiresAuth?: boolean }): Promise<T> {
    try {
      const r = await http.delete(path, { skipAuth: opts?.requiresAuth === false });
      return r.data as T;
    } catch (e) { throw toApiException(e); }
  },
  /** Raw bytes, e.g. GET /documents/{id}/content. Returned as base64. */
  async getBase64(path: string): Promise<string> {
    try {
      const r = await http.get(path, { responseType: 'arraybuffer' });
      return arrayBufferToBase64(r.data as ArrayBuffer);
    } catch (e) { throw toApiException(e); }
  },
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : NaN;
    const c = i + 2 < bytes.length ? bytes[i + 2] : NaN;
    out += chars[a >> 2];
    out += chars[((a & 3) << 4) | ((Number.isNaN(b) ? 0 : b) >> 4)];
    out += Number.isNaN(b) ? '=' : chars[((b & 15) << 2) | ((Number.isNaN(c) ? 0 : c) >> 6)];
    out += Number.isNaN(c) ? '=' : chars[c & 63];
  }
  return out;
}
