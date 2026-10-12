import * as SecureStore from 'expo-secure-store';

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  userId: string;
}

export const isRefreshTokenExpired = (s: StoredSession) => Date.now() > s.refreshTokenExpiresAt.getTime();

const K = {
  access: 'ip_access_token',
  refresh: 'ip_refresh_token',
  accessExp: 'ip_access_expires_at',
  refreshExp: 'ip_refresh_expires_at',
  user: 'ip_user_id',
} as const;

/** Keychain (iOS) / Keystore-backed (Android) via expo-secure-store. */
export const tokenStorage = {
  async save(s: StoredSession): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(K.access, s.accessToken),
      SecureStore.setItemAsync(K.refresh, s.refreshToken),
      SecureStore.setItemAsync(K.accessExp, s.accessTokenExpiresAt.toISOString()),
      SecureStore.setItemAsync(K.refreshExp, s.refreshTokenExpiresAt.toISOString()),
      SecureStore.setItemAsync(K.user, s.userId),
    ]);
  },

  async read(): Promise<StoredSession | null> {
    const [access, refresh, accessExp, refreshExp, user] = await Promise.all([
      SecureStore.getItemAsync(K.access),
      SecureStore.getItemAsync(K.refresh),
      SecureStore.getItemAsync(K.accessExp),
      SecureStore.getItemAsync(K.refreshExp),
      SecureStore.getItemAsync(K.user),
    ]);
    if (!access || !refresh || !accessExp || !refreshExp || !user) return null;
    return {
      accessToken: access,
      refreshToken: refresh,
      accessTokenExpiresAt: new Date(accessExp),
      refreshTokenExpiresAt: new Date(refreshExp),
      userId: user,
    };
  },

  async clear(): Promise<void> {
    await Promise.all(Object.values(K).map((k) => SecureStore.deleteItemAsync(k)));
  },
};
