import { parseDateOnly } from '@/core/utils/formatters';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type OnboardingStep = 'PROFILE' | 'PAN' | 'KYC' | 'IDENTITY' | 'COMPLETED';

export interface OnboardingRecord {
  id: string;
  status: string; // NOT_STARTED | IN_PROGRESS | COMPLETED
  currentStep: string;
  createdAt: Date;
  updatedAt: Date;
}
export const isOnboardingCompleted = (r: OnboardingRecord) => r.status === 'COMPLETED';

export interface ProfileModel {
  id: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
}

export interface PanVerificationModel {
  id: string;
  status: string; // PENDING | VERIFIED | FAILED | MANUAL_REVIEW
  panNumberMasked: string;
  provider: string;
  verifiedName: string | null;
  nameMatchResult: string | null;
  failureReason: string | null;
  createdAt: Date;
}

export interface KycStatusModel {
  id: string;
  status: string; // NOT_STARTED|PENDING|PROCESSING|VERIFIED|FAILED|MANUAL_REVIEW
  provider: string;
  kycType: string;
  initiatedAt: Date;
  completedAt: Date | null;
  failureReason: string | null;
  consentUrl: string | null;
}

export interface IdentityVerificationModel {
  id: string;
  provider: string;
  providerRef: string;
  verificationType: string;
  status: string; // PENDING|PROCESSING|VERIFIED|FAILED|RETRY_REQUIRED|MANUAL_REVIEW
  confidenceScore: number | null;
  failureReason: string | null;
  createdAt: Date;
  captureSessionToken: string | null;
}

export interface OnboardingSnapshot {
  record: OnboardingRecord;
  profile: ProfileModel;
  pan: PanVerificationModel | null;
  kyc: KycStatusModel | null;
  identity: IdentityVerificationModel | null;
}

export const recordFromJson = (j: any): OnboardingRecord => ({
  id: j.id, status: j.status, currentStep: j.current_step,
  createdAt: new Date(j.created_at), updatedAt: new Date(j.updated_at),
});

export const profileFromJson = (j: any): ProfileModel => ({
  id: j.id,
  firstName: j.first_name ?? null,
  lastName: j.last_name ?? null,
  dateOfBirth: j.date_of_birth ? parseDateOnly(String(j.date_of_birth).slice(0, 10)) : null,
  gender: j.gender ?? null,
});

export const panFromJson = (j: any): PanVerificationModel => ({
  id: j.id, status: j.status, panNumberMasked: j.pan_number_masked, provider: j.provider,
  verifiedName: j.verified_name ?? null, nameMatchResult: j.name_match_result ?? null,
  failureReason: j.failure_reason ?? null, createdAt: new Date(j.created_at),
});

export const kycFromJson = (j: any): KycStatusModel => ({
  id: j.id, status: j.status, provider: j.provider, kycType: j.kyc_type,
  initiatedAt: new Date(j.initiated_at),
  completedAt: j.completed_at ? new Date(j.completed_at) : null,
  failureReason: j.failure_reason ?? null, consentUrl: j.consent_url ?? null,
});

export const identityFromJson = (j: any): IdentityVerificationModel => ({
  id: j.id, provider: j.provider, providerRef: j.provider_ref,
  verificationType: j.verification_type, status: j.status,
  confidenceScore: typeof j.confidence_score === 'number' ? j.confidence_score : null,
  failureReason: j.failure_reason ?? null, createdAt: new Date(j.created_at),
  captureSessionToken: j.capture_session_token ?? null,
});

/** Index into the 4-step tracker; COMPLETED clamps to the last step. */
export function stepIndexOf(record: OnboardingRecord): number {
  const order = ['PROFILE', 'PAN', 'KYC', 'IDENTITY', 'COMPLETED'];
  const i = order.indexOf(record.currentStep);
  return i < 0 ? 0 : i;
}
