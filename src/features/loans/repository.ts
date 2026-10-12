import { api } from '@/core/api/client';
import { eventFromJson, loanFromJson, LoanApplication, LoanApplicationEvent } from './models';

export const loanRepository = {
  async createDraft(requestedAmount: number, requestedTenureDays: number): Promise<LoanApplication> {
    return loanFromJson(
      await api.post('/loan-applications', {
        data: { requested_amount: requestedAmount, requested_tenure_days: requestedTenureDays },
      }),
    );
  },

  async list(): Promise<LoanApplication[]> {
    const d = await api.get<unknown[]>('/loan-applications');
    // Newest first so a just-submitted application is immediately visible.
    return d.map(loanFromJson).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async get(id: string): Promise<LoanApplication> {
    return loanFromJson(await api.get(`/loan-applications/${id}`));
  },

  async submit(id: string): Promise<LoanApplication> {
    return loanFromJson(await api.post(`/loan-applications/${id}/submit`));
  },

  async getEvents(id: string): Promise<LoanApplicationEvent[]> {
    const d = await api.get<unknown[]>(`/loan-applications/${id}/events`);
    return d.map(eventFromJson);
  },
};
