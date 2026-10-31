/**
 * Everything between "application approved" and "money received", exactly as the
 * backend reports it. Nothing here is computed on the device: terms, status and
 * outcomes always come from the server (the app never decides that a document is
 * signed or a payout was made).
 */
export type OfferStatus = 'draft' | 'issued' | 'accepted' | 'declined' | 'expired' | 'cancelled';

export interface OfferTerm { key: string; label: string; value: string }

export interface LoanOffer {
  id: string;
  applicationId: string;
  version: number;
  principalAmount: number;
  tenureDays: number;
  terms: OfferTerm[]; // lender-set commercial terms (interest rate, fees, ...)
  issuedAt: Date | null;
  expiresAt: Date | null;
  acceptedAt: Date | null;
  kfsDocumentId: string | null;
  agreementDocumentId: string | null;
  status: OfferStatus;
}
export const isOfferExpired = (o: LoanOffer) =>
  o.status === 'expired' || (o.status === 'issued' && o.expiresAt !== null && Date.now() > o.expiresAt.getTime());

export type ESignStatus = 'initiated' | 'pending' | 'signed' | 'failed' | 'expired' | 'manualReview';
export interface ESign {
  id: string;
  offerId: string;
  status: ESignStatus;
  signingUrl: string | null;
  expiresAt: Date;
  signedAt: Date | null;
}

export type BankVerificationStatus = 'initiated' | 'pending' | 'verified' | 'failed' | 'manualReview' | 'expired';
export interface BankAccount {
  id: string;
  accountNumberMasked: string;
  ifsc: string;
  bankName: string | null;
  status: BankVerificationStatus;
  failureCode: string | null;
}

/** Customer-facing payout status. `disbursed` only after the provider has confirmed it. */
export type DisbursementStatus = 'pending' | 'processing' | 'disbursed' | 'failed' | 'reversed' | 'underReview';
export interface Disbursement {
  id: string;
  offerId: string;
  status: DisbursementStatus;
  amount: number;
  accountNumberMasked: string;
  ifsc: string;
  utr: string | null;
  completedAt: Date | null;
}
