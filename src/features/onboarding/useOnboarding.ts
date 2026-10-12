import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/core/queryClient';
import { useAuthStore } from '@/features/auth/authStore';
import { IdentityVerificationModel, OnboardingSnapshot, PanVerificationModel } from './models';
import { onboardingRepository as repo } from './repository';

export const ONBOARDING_KEY = ['onboarding'] as const;

async function fetchSnapshot(): Promise<OnboardingSnapshot> {
  const record = await repo.getOnboarding();
  const [profile, pan, kyc, identity] = await Promise.all([
    repo.getProfile(), repo.getPanStatus(), repo.getKycStatus(), repo.getIdentityStatus(),
  ]);
  return { record, profile, pan, kyc, identity };
}

/**
 * Only runs once authenticated — touching it earlier would fire an
 * authenticated-only request before login (same rule as the Flutter router).
 */
export function useOnboarding() {
  const authed = useAuthStore((s) => s.status === 'authenticated');
  const q = useQuery({ queryKey: ONBOARDING_KEY, queryFn: fetchSnapshot, enabled: authed, staleTime: Infinity });
  return {
    snapshot: q.data,
    // "loading" = nothing to show yet and no failure yet
    isLoading: authed && q.data === undefined && !q.isError,
    // A failed *background* refresh never hides data we already have.
    isError: q.isError && q.data === undefined,
    reload: () => q.refetch(),
  };
}

export const getSnapshot = () => queryClient.getQueryData<OnboardingSnapshot>(ONBOARDING_KEY);

/** Re-fetch without flashing a spinner (status polling). Errors are swallowed. */
export async function refreshQuietly(): Promise<void> {
  try {
    await queryClient.fetchQuery({ queryKey: ONBOARDING_KEY, queryFn: fetchSnapshot, staleTime: 0 });
  } catch {
    // keep showing the last good snapshot
  }
}

/** Hard reload (shows loading) — used by the Retry button. */
export async function reloadOnboarding(): Promise<void> {
  queryClient.removeQueries({ queryKey: ONBOARDING_KEY });
  await queryClient.refetchQueries({ queryKey: ONBOARDING_KEY });
}

/**
 * Step actions deliberately do NOT swallow errors — ApiException propagates
 * so the screen can show the exact backend message.
 */
export const onboardingActions = {
  async saveProfile(p: { firstName: string; lastName: string; dateOfBirth: Date; gender?: string | null }) {
    await repo.updateProfile(p);
    await repo.advanceStep('PAN');
    await refreshQuietly();
  },

  async submitPan(panNumber: string): Promise<PanVerificationModel> {
    const result = await repo.verifyPan(panNumber);
    await refreshQuietly();
    return result;
  },

  async grantKycConsentAndInitiate() {
    await repo.recordConsent('KYC', '1.0');
    await repo.initiateKyc();
    await refreshQuietly();
  },

  async startIdentity(): Promise<IdentityVerificationModel> {
    const result = await repo.startIdentityVerification();
    await refreshQuietly();
    return result;
  },

  async submitIdentityCapture(captureRef: string): Promise<IdentityVerificationModel> {
    const result = await repo.submitIdentityCapture(captureRef);

    // Apply the authoritative POST result immediately. A follow-up refresh can
    // fail if connectivity drops right after the server accepted the capture;
    // we must not fall back to a stale PENDING.
    const current = getSnapshot();
    if (current) queryClient.setQueryData<OnboardingSnapshot>(ONBOARDING_KEY, { ...current, identity: result });

    await refreshQuietly(); // best-effort
    return result;
  },
};
