import { Platform } from 'react-native';

import { api } from '@/core/api/client';
import { isRefreshTokenExpired, tokenStorage } from '@/core/storage/tokenStorage';
import { CurrentUser, DeviceSession, sessionFromJson, userFromJson } from './models';

function deviceType(): string {
  return Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'other';
}

function deviceName(): string {
  if (Platform.OS === 'android') {
    const c = Platform.constants as { Brand?: string; Model?: string };
    if (c?.Model) return [c.Brand, c.Model].filter(Boolean).join(' ');
    return 'Android device';
  }
  return Platform.OS === 'ios' ? 'iOS device' : 'Device';
}

export const authRepository = {
  requestOtp(phoneNumber: string) {
    return api.post('/auth/request-otp', { data: { phone_number: phoneNumber }, requiresAuth: false });
  },

  /** Verifies the OTP and persists the session so later requests authenticate. */
  async verifyOtp(phoneNumber: string, otp: string): Promise<CurrentUser> {
    const d = await api.post<Record<string, string>>('/auth/verify-otp', {
      data: { phone_number: phoneNumber, otp, device_name: deviceName(), device_type: deviceType() },
      requiresAuth: false,
    });
    await tokenStorage.save({
      accessToken: d.access_token,
      refreshToken: d.refresh_token,
      accessTokenExpiresAt: new Date(d.access_token_expires_at),
      refreshTokenExpiresAt: new Date(d.refresh_token_expires_at),
      userId: d.user_id,
    });
    return authRepository.getMe();
  },

  async getMe(): Promise<CurrentUser> {
    return userFromJson(await api.get('/auth/me'));
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      await tokenStorage.clear();
    }
  },

  async getSessions(): Promise<DeviceSession[]> {
    const d = await api.get<{ sessions: unknown[] }>('/auth/sessions');
    return d.sessions.map(sessionFromJson);
  },

  async revokeOtherSessions(): Promise<number> {
    const d = await api.delete<{ revoked_count?: number }>('/auth/sessions/others');
    return d.revoked_count ?? 0;
  },

  revokeSession(id: string) {
    return api.delete(`/auth/sessions/${id}`);
  },

  /** Used when the refresh token was already rejected — nothing left to revoke. */
  clearLocalSession: () => tokenStorage.clear(),

  async hasStoredSession(): Promise<boolean> {
    const s = await tokenStorage.read();
    return s !== null && !isRefreshTokenExpired(s);
  },
};
