import { create } from 'zustand';

import { ApiException } from '@/core/api/errors';
import { useAuthStore } from './authStore';
import { authRepository } from './repository';

const RESEND_COOLDOWN_SECONDS = 60; // matches backend default

interface OtpFlowState {
  phoneNumber: string;
  isSubmitting: boolean;
  resendCooldown: number;
  errorMessage: string | null; // phone-entry-level error
  otpError: string | null; // otp-box-level error (triggers shake)
  sendOtp: (phone: string) => Promise<boolean>;
  resend: () => Promise<boolean>;
  verifyOtp: (code: string) => Promise<boolean>;
  clearOtpError: () => void;
  reset: () => void;
}

let cooldownTimer: ReturnType<typeof setInterval> | null = null;
const stopTimer = () => {
  if (cooldownTimer) clearInterval(cooldownTimer);
  cooldownTimer = null;
};

const initial = {
  phoneNumber: '',
  isSubmitting: false,
  resendCooldown: 0,
  errorMessage: null,
  otpError: null,
};

export const useOtpFlow = create<OtpFlowState>((set, get) => ({
  ...initial,

  async sendOtp(phone) {
    set({ isSubmitting: true, errorMessage: null, phoneNumber: phone });
    try {
      await authRepository.requestOtp(phone);
      set({ isSubmitting: false, errorMessage: null });
      startCooldown(set, get);
      return true;
    } catch (e) {
      set({ isSubmitting: false, errorMessage: e instanceof ApiException ? e.message : ApiException.unexpected().message });
      return false;
    }
  },

  async resend() {
    const s = get();
    if (s.resendCooldown > 0 || s.isSubmitting) return false;
    return s.sendOtp(s.phoneNumber);
  },

  async verifyOtp(code) {
    set({ isSubmitting: true, otpError: null });
    try {
      const user = await authRepository.verifyOtp(get().phoneNumber, code);
      useAuthStore.getState().onVerifiedOtp(user);
      set({ isSubmitting: false });
      return true;
    } catch (e) {
      set({ isSubmitting: false, otpError: e instanceof ApiException ? e.message : ApiException.unexpected().message });
      return false;
    }
  },

  clearOtpError: () => set({ otpError: null }),

  reset() {
    stopTimer();
    set({ ...initial });
  },
}));

function startCooldown(
  set: (p: Partial<OtpFlowState>) => void,
  get: () => OtpFlowState,
) {
  stopTimer();
  set({ resendCooldown: RESEND_COOLDOWN_SECONDS });
  cooldownTimer = setInterval(() => {
    const next = get().resendCooldown - 1;
    if (next <= 0) {
      stopTimer();
      set({ resendCooldown: 0 });
    } else {
      set({ resendCooldown: next });
    }
  }, 1000);
}
