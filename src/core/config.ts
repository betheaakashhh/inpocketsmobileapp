import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Where the FastAPI backend lives.
 *
 * Physical phone (your setup): Expo Go / the dev client is served from your
 * computer over LAN, so `Constants.expoConfig.hostUri` is "<laptop-ip>:8081".
 * The backend runs on the same computer, port 8000, so we reuse that IP.
 * Override with EXPO_PUBLIC_API_BASE_URL (e.g. when using `expo start --tunnel`
 * or `adb reverse tcp:8000 tcp:8000` + http://localhost:8000).
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:8000`;

  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';
}

export const AppConfig = {
  apiBaseUrl: resolveBaseUrl(),
  get apiV1BaseUrl() {
    return `${resolveBaseUrl()}/api/v1`;
  },
  /** Full request budget before we surface a retry state (Flutter: 20 s). */
  requestTimeoutMs: 20_000,
  verboseNetworkLogs: process.env.EXPO_PUBLIC_VERBOSE_LOGS === 'true',
} as const;
