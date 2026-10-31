import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/core/queryClient';
import { BankAccount, Disbursement, ESign, LoanOffer } from './models';
import { loanLifecycleRepo as repo } from './repository';

export interface LoanJourneySnapshot {
  offer: LoanOffer | null;
  esign: ESign | null;
  bankAccount: BankAccount | null;
  disbursement: Disbursement | null;
}

const key = (applicationId: string) => ['journey', applicationId] as const;

async function fetchJourney(applicationId: string): Promise<LoanJourneySnapshot> {
  const offer = await repo.getOffer(applicationId);
  const bankAccount = await repo.getBankAccount();
  let esign: ESign | null = null;
  let disbursement: Disbursement | null = null;
  if (offer && offer.status === 'accepted') {
    esign = await repo.getESign(offer.id);
    disbursement = await repo.getDisbursement(offer.id);
  }
  return { offer, esign, bankAccount, disbursement };
}

/** One server-sourced snapshot per loan application. Always re-fetched when a screen opens. */
export const useJourney = (applicationId: string) =>
  useQuery({ queryKey: key(applicationId), queryFn: () => fetchJourney(applicationId), staleTime: 0 });

const reload = (id: string) => queryClient.fetchQuery({ queryKey: key(id), queryFn: () => fetchJourney(id), staleTime: 0 });
const current = (id: string) => queryClient.getQueryData<LoanJourneySnapshot>(key(id));

/** Quiet refresh for polling screens: a failed poll must never replace good data with an error. */
export async function refreshJourneyQuietly(applicationId: string): Promise<void> {
  try { queryClient.setQueryData(key(applicationId), await fetchJourney(applicationId)); } catch { /* quiet by design */ }
}

export const journeyActions = {
  async acceptOffer(id: string) {
    const offer = current(id)?.offer;
    if (!offer) throw new Error('No offer to accept');
    await repo.acceptOffer(offer);
    await reload(id);
  },
  async declineOffer(id: string) {
    const offer = current(id)?.offer;
    if (!offer) return;
    await repo.declineOffer(offer.id);
    await reload(id);
  },
  /** Returns the URL where the customer signs. Whether they signed is decided by the server later. */
  async startESign(id: string): Promise<string | null> {
    const offer = current(id)?.offer;
    if (!offer) throw new Error('No offer');
    const esign = await repo.startESign(offer.id);
    await reload(id);
    return esign.signingUrl;
  },
  async submitBankAccount(id: string, p: { accountNumber: string; ifsc: string }) {
    await repo.submitBankAccount(p.accountNumber, p.ifsc);
    await reload(id);
  },
};
