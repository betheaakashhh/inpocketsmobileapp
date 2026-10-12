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
    try {
      const user = await authRepository.getMe();
      set({ status: 'authenticated', user });
    } catch {
      // Access token invalid and the interceptor's refresh also failed.
      set({ status: 'unauthenticated' });
    }
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
