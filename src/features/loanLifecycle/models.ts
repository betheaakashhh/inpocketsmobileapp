/**
 * Models for everything between "loan approved" and "loan closed". None of
 * this exists in the backend yet — these are the shapes a real
 * implementation should return, so wiring it in later is a data-source swap.
 */
export type OfferStatus = 'issued' | 'accepted' | 'declined' | 'expired';

export interface LoanOffer {
  id: string;
  applicationId: string;
  approvedAmount: number;
  disbursableAmount: number; // approved minus upfront fees
  tenureDays: number;
  annualInterestRatePercent: number;
  processingFee: number;
  otherCharges: number;
  apr: number;
  totalRepaymentAmount: number;
  emiAmount: number;
  issuedAt: Date;
  expiresAt: Date;
  version: number;
  status: OfferStatus;
  lenderName: string;
}
export const isOfferExpired = (o: LoanOffer) => Date.now() > o.expiresAt.getTime();

export interface KfsLineItem { label: string; value: string }
export interface KfsDocument {
  id: string; offerId: string; version: number; generatedAt: Date; lineItems: KfsLineItem[];
}

export type ESignStatus = 'initiated' | 'pending' | 'signed' | 'failed' | 'expired' | 'manualReview';
export interface LoanAgreement {
  id: string; offerId: string; version: number; createdAt: Date;
  signingStatus: ESignStatus; signedAt?: Date; providerRef?: string;
}

export type BankVerificationStatus = 'notStarted' | 'pending' | 'verified' | 'failed' | 'manualReview';
export interface BankAccount {
  id: string; accountHolderName: string; accountNumberMasked: string; ifsc: string;
  bankName: string; status: BankVerificationStatus; failureReason?: string;
}

export type DisbursementStatus = 'pending' | 'processing' | 'success' | 'failed' | 'reversed' | 'requiresReview';
export interface Disbursement {
  id: string; loanId: string; amount: number; status: DisbursementStatus;
  initiatedAt: Date; completedAt?: Date; utr?: string; failureReason?: string;
}

export type InstallmentStatus = 'upcoming' | 'due' | 'paid' | 'overdue' | 'partiallyPaid';
export interface RepaymentInstallment {
  installmentNumber: number; dueDate: Date; principalComponent: number; interestComponent: number;
  amountDue: number; amountPaid: number; status: InstallmentStatus; daysPastDue: number;
}
export const amountRemaining = (i: RepaymentInstallment) => Math.max(0, Math.min(i.amountDue, i.amountDue - i.amountPaid));

export interface RepaymentSchedule { loanId: string; installments: RepaymentInstallment[]; generatedAt: Date }
export const totalOutstanding = (s: RepaymentSchedule) => s.installments.reduce((sum, i) => sum + amountRemaining(i), 0);
export const isFullyPaid = (s: RepaymentSchedule) => s.installments.every((i) => i.status === 'paid');
export function nextDue(s: RepaymentSchedule): RepaymentInstallment | null {
  const due = s.installments.filter((i) => i.status === 'due' || i.status === 'overdue');
  if (due.length === 0) return null;
  return due.reduce((a, b) => (a.dueDate.getTime() < b.dueDate.getTime() ? a : b));
}

export type PaymentMethod = 'upi' | 'debitCard' | 'netBanking';
export type PaymentStatus = 'pending' | 'success' | 'failed';
export interface Payment {
  id: string; loanId: string; amount: number; method: PaymentMethod; status: PaymentStatus;
  createdAt: Date; installmentNumbers: number[]; receiptRef?: string;
}

export interface ActiveLoan {
  id: string; applicationId: string; principalAmount: number; disbursedAt: Date;
  status: string; // ACTIVE | OVERDUE | CLOSED
}
