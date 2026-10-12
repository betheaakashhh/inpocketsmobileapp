import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/core/queryClient';
import { loanLifecycleRepo as repo } from './mockRepository';
import {
  ActiveLoan, BankAccount, Disbursement, KfsDocument, LoanAgreement, LoanOffer, Payment, PaymentMethod,
  RepaymentSchedule,
} from './models';

export interface LoanJourneySnapshot {
  offer: LoanOffer | null;
  kfs: KfsDocument | null;
  agreement: LoanAgreement | null;
  bankAccount: BankAccount | null;
  disbursement: Disbursement | null;
  activeLoan: ActiveLoan | null;
  schedule: RepaymentSchedule | null;
  payments: Payment[];
}

const key = (applicationId: string) => ['journey', applicationId] as const;

async function fetchJourney(applicationId: string): Promise<LoanJourneySnapshot> {
  const offer = await repo.getOffer(applicationId);
  const bankAccount = await repo.getBankAccount(applicationId);
  const disbursement = await repo.getDisbursement(applicationId);
  const activeLoan = await repo.getActiveLoan(applicationId);

  let kfs: KfsDocument | null = null;
  let agreement: LoanAgreement | null = null;
  if (offer) {
    kfs = await repo.getKfs(offer.id);
    agreement = await repo.getAgreement(offer.id);
  }

  let schedule: RepaymentSchedule | null = null;
  let payments: Payment[] = [];
  if (activeLoan) {
    schedule = await repo.getRepaymentSchedule(activeLoan.id);
    payments = await repo.getPaymentHistory(activeLoan.id);
  }
  return { offer, kfs, agreement, bankAccount, disbursement, activeLoan, schedule, payments };
}

/** One snapshot per loan application, same pattern as onboarding. */
export const useJourney = (applicationId: string) =>
  useQuery({ queryKey: key(applicationId), queryFn: () => fetchJourney(applicationId), staleTime: Infinity });

const reload = (id: string) => queryClient.fetchQuery({ queryKey: key(id), queryFn: () => fetchJourney(id), staleTime: 0 });
const current = (id: string) => queryClient.getQueryData<LoanJourneySnapshot>(key(id));

/** Quiet refresh: keeps kfs/agreement/bank from the current snapshot. */
export async function refreshJourneyQuietly(applicationId: string): Promise<void> {
  try {
    const cur = current(applicationId);
    const offer = await repo.getOffer(applicationId);
    const disbursement = await repo.getDisbursement(applicationId);
    const activeLoan = await repo.getActiveLoan(applicationId);
    let schedule = cur?.schedule ?? null;
    let payments = cur?.payments ?? [];
    if (activeLoan) {
      schedule = await repo.getRepaymentSchedule(activeLoan.id);
      payments = await repo.getPaymentHistory(activeLoan.id);
    }
    const base: LoanJourneySnapshot = cur ?? {
      offer: null, kfs: null, agreement: null, bankAccount: null, disbursement: null,
      activeLoan: null, schedule: null, payments: [],
    };
    queryClient.setQueryData<LoanJourneySnapshot>(key(applicationId), {
      ...base, offer, disbursement, activeLoan, schedule, payments,
    });
  } catch {
    // quiet by design
  }
}

export const journeyActions = {
  async generateOfferIfNeeded(id: string, requestedAmount: number, requestedTenureDays: number) {
    await repo.ensureOfferGenerated(id, requestedAmount, requestedTenureDays);
    await reload(id);
  },
  async acceptOffer(id: string) {
    const offer = current(id)?.offer;
    if (!offer) return;
    await repo.acceptOffer(offer.id);
    await reload(id);
  },
  async declineOffer(id: string) {
    const offer = current(id)?.offer;
    if (!offer) return;
    await repo.declineOffer(offer.id);
    await reload(id);
  },
  async initiateESign(id: string) {
    const a = current(id)?.agreement;
    if (!a) return;
    await repo.initiateESign(a.id);
    await reload(id);
  },
  async completeESign(id: string) {
    const a = current(id)?.agreement;
    if (!a) return;
    await repo.completeESign(a.id);
    await reload(id);
  },
  async submitBankAccount(id: string, p: { accountHolderName: string; accountNumber: string; ifsc: string }) {
    await repo.submitBankAccount(id, p.accountHolderName, p.accountNumber, p.ifsc);
    await reload(id);
  },
  async initiateDisbursement(id: string) {
    const offer = current(id)?.offer;
    if (!offer) return;
    await repo.initiateDisbursement(id, offer.disbursableAmount);
    await reload(id);
  },
  async makePayment(id: string, p: { amount: number; method: PaymentMethod; installmentNumbers: number[] }) {
    const loan = current(id)?.activeLoan;
    if (!loan) return;
    await repo.makePayment(loan.id, p.amount, p.method, p.installmentNumbers);
    await reload(id);
  },
};
