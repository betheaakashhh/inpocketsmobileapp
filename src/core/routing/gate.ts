import { AuthStatus } from '@/features/auth/authStore';
import { isOnboardingCompleted, OnboardingSnapshot } from '@/features/onboarding/models';

export const Routes = {
  splash: '/',
  loading: '/loading',
  login: '/login',
  loginOtp: '/login/otp',
  onboardingProfile: '/onboarding/profile',
  onboardingPan: '/onboarding/pan',
  onboardingKyc: '/onboarding/kyc',
  onboardingIdentity: '/onboarding/identity',
  onboardingComplete: '/onboarding/complete',
  home: '/home',
  homeLoans: '/home/loans',
  loanApply: '/loans/apply',
  loanDetail: (id: string) => `/loans/${id}`,
  loanOffer: (id: string) => `/loans/${id}/offer`,
  loanKfs: (id: string) => `/loans/${id}/kfs`,
  loanAgreement: (id: string) => `/loans/${id}/agreement`,
  loanBank: (id: string) => `/loans/${id}/bank-account`,
  loanDisbursement: (id: string) => `/loans/${id}/disbursement`,
  loanRepayment: (id: string) => `/loans/${id}/repayment`,
  documents: '/documents',
  sessions: '/profile/sessions',
  settings: '/settings',
} as const;

const AUTH_ROUTES: readonly string[] = [Routes.login, Routes.loginOtp];

/**
 * Step screens only — deliberately excludes onboardingComplete so the
 * celebratory "you're all set" screen isn't yanked away the instant the
 * record flips to COMPLETED; the user taps through to /home themselves.
 */
const STEP_ROUTES: readonly string[] = [
  Routes.onboardingProfile, Routes.onboardingPan, Routes.onboardingKyc, Routes.onboardingIdentity,
];

export interface GateInput {
  pathname: string;
  authStatus: AuthStatus;
  splashDone: boolean;
  onboarding: { isLoading: boolean; isError: boolean; snapshot?: OnboardingSnapshot };
}

/** Direct port of the Flutter router's `_redirect`. Returns null = stay put. */
export function resolveRedirect({ pathname, authStatus, splashDone, onboarding }: GateInput): string | null {
  // Auth bootstrap (stored tokens + GET /auth/me) hasn't resolved — keep the
  // splash up rather than flashing login. Also honour the brand-intro minimum.
  if (authStatus === 'unknown' || !splashDone) {
    return pathname === Routes.splash ? null : Routes.splash;
  }

  if (authStatus === 'unauthenticated') {
    return AUTH_ROUTES.includes(pathname) ? null : Routes.login;
  }

  // Authenticated from here on.
  if (onboarding.isLoading || onboarding.isError || !onboarding.snapshot) {
    return pathname === Routes.loading ? null : Routes.loading;
  }

  const record = onboarding.snapshot.record;

  if (!isOnboardingCompleted(record)) {
    const target =
      record.currentStep === 'PAN' ? Routes.onboardingPan
      : record.currentStep === 'KYC' ? Routes.onboardingKyc
      : record.currentStep === 'IDENTITY' ? Routes.onboardingIdentity
      : Routes.onboardingProfile;
    return pathname === target ? null : target;
  }

  // Onboarding complete. Finishing the identity step celebrates first.
  if (pathname === Routes.onboardingIdentity) return Routes.onboardingComplete;

  const blockedNow =
    AUTH_ROUTES.includes(pathname) || STEP_ROUTES.includes(pathname) ||
    pathname === Routes.splash || pathname === Routes.loading;
  return blockedNow ? Routes.home : null;
}
