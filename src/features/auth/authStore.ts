import { create } from 'zustand';

import { setSessionExpiredHandler } from '@/core/api/client';
import { queryClient } from '@/core/queryClient';
import { CurrentUser } from './models';
import { authRepository } from './repository';

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: CurrentUser | null;
  bootstrap: () => Promise<void>;
  onVerifiedOtp: (user: CurrentUser) => void;
  logout: () => Promise<void>;
  forceLogout: () => Promise<void>;
}

/**
 * Single source of truth for "is anyone logged in". The route gate watches
 * `status`; screens read `user`.
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: 'unknown',
  user: null,

  async bootstrap() {
    const hasSession = await authRepository.hasStoredSession();
    if (!hasSession) {
      set({ status: 'unauthenticated' });
      return;
    }
    // A flaky connection at launch must not look like "logged out": retry with backoff.
    // Stored tokens are never cleared here; only the interceptor does that, and only when the
    // server explicitly rejects the session.
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const user = await authRepository.getMe();
        set({ status: 'authenticated', user });
        return;
      } catch (e) {
        lastError = e;
        const offline = (e as { isNetworkError?: boolean }).isNetworkError === true;
        if (!offline) break;
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
    void lastError;
    set({ status: 'unauthenticated' });
  },

  onVerifiedOtp(user) {
    set({ status: 'authenticated', user });
  },

  async logout() {
    try {
      await authRepository.logout();
    } catch {
      // Even if the server call fails we still sign out locally.
    }
    set({ status: 'unauthenticated', user: null });
    queryClient.clear(); // onboarding / loans / documents are user-scoped
  },

  async forceLogout() {
    await authRepository.clearLocalSession();
    set({ status: 'unauthenticated', user: null });
    queryClient.clear();
  },
}));

setSessionExpiredHandler(() => useAuthStore.getState().forceLogout());
