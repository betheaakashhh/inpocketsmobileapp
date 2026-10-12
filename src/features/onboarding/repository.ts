import { api } from '@/core/api/client';
import { Fmt } from '@/core/utils/formatters';
import {
  IdentityVerificationModel, KycStatusModel, OnboardingRecord, PanVerificationModel, ProfileModel,
  identityFromJson, kycFromJson, panFromJson, profileFromJson, recordFromJson,
} from './models';

export const onboardingRepository = {
  async getOnboarding(): Promise<OnboardingRecord> {
    return recordFromJson(await api.get('/onboarding'));
  },

  async advanceStep(step: string): Promise<OnboardingRecord> {
    return recordFromJson(await api.patch('/onboarding', { data: { current_step: step } }));
  },

  async getProfile(): Promise<ProfileModel> {
    return profileFromJson(await api.get('/onboarding/profile'));
  },

  async updateProfile(p: { firstName: string; lastName: string; dateOfBirth: Date; gender?: string | null }): Promise<ProfileModel> {
    const body: Record<string, string> = {
      first_name: p.firstName,
      last_name: p.lastName,
      date_of_birth: Fmt.dateOnly(p.dateOfBirth),
    };
    if (p.gender) body.gender = p.gender;
    return profileFromJson(await api.put('/onboarding/profile', { data: body }));
  },

  recordConsent(consentType: string, version: string, status = 'GRANTED') {
    return api.post('/onboarding/consents', { data: { consent_type: consentType, version, status } });
  },

  async verifyPan(panNumber: string): Promise<PanVerificationModel> {
    return panFromJson(await api.post('/onboarding/pan', { data: { pan_number: panNumber } }));
  },

  async getPanStatus(): Promise<PanVerificationModel | null> {
    const d = await api.get<unknown>('/onboarding/pan');
    return d ? panFromJson(d) : null;
  },

  async initiateKyc(): Promise<KycStatusModel> {
    return kycFromJson(await api.post('/onboarding/kyc'));
  },

  async getKycStatus(): Promise<KycStatusModel | null> {
    const d = await api.get<unknown>('/onboarding/kyc');
    return d ? kycFromJson(d) : null;
  },

  async startIdentityVerification(): Promise<IdentityVerificationModel> {
    return identityFromJson(await api.post('/onboarding/identity-verification'));
  },

  async submitIdentityCapture(captureRef: string): Promise<IdentityVerificationModel> {
    return identityFromJson(
      await api.post('/onboarding/identity-verification/capture', { data: { capture_ref: captureRef } }),
    );
  },

  async getIdentityStatus(): Promise<IdentityVerificationModel | null> {
    const d = await api.get<unknown>('/onboarding/identity-verification');
    return d ? identityFromJson(d) : null;
  },
};
