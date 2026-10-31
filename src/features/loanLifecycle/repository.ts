import { api } from '@/core/api/client';
import { ApiException } from '@/core/api/errors';
import {
  BankAccount, BankVerificationStatus, Disbursement, DisbursementStatus, ESign, ESignStatus, LoanOffer, OfferStatus, OfferTerm,
} from './models';

// ---- wire shapes (see the backend OpenAPI) ----------------------------------------------
interface OfferDto {
  id: string; loan_application_id: string; version: number; principal_amount: string; tenure_days: number;
  commercial_terms: Record<string, string>; issued_at: string | null; expires_at: string | null; accepted_at: string | null;
  kfs_document_id: string | null; agreement_document_id: string | null; status: string; effective_status?: string;
}
interface ESignDto { id: string; loan_offer_id: string; status: string; signing_url?: string | null; expires_at: string; signed_at?: string | null }
interface BankDto { id: string; status: string; account_number_masked: string; ifsc: string; bank_name?: string | null; failure_code?: string | null }
interface DisbursementDto { id: string; loan_offer_id: string; status: string; amount: string; account_number_masked: string; ifsc: string; utr?: string | null; completed_at?: string | null }

const camel = (s: string) => s.toLowerCase().replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const date = (s?: string | null) => (s ? new Date(s) : null);
const humanize = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function formatTerm(key: string, value: string): OfferTerm {
  const n = Number(value);
  const isNumber = value.trim() !== '' && Number.isFinite(n);
  const k = key.toLowerCase();
  let shown = value;
  if (isNumber && (k.includes('rate') || k.includes('apr') || k.includes('percent'))) shown = `${value}%`;
  else if (isNumber && (k.includes('fee') || k.includes('charge') || k.includes('amount') || k.includes('emi'))) shown = `\u20B9${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  return { key, label: humanize(key), value: shown };
}

const toOffer = (o: OfferDto): LoanOffer => ({
  id: o.id,
  applicationId: o.loan_application_id,
  version: o.version,
  principalAmount: Number(o.principal_amount),
  tenureDays: o.tenure_days,
  terms: Object.entries(o.commercial_terms ?? {}).map(([k, v]) => formatTerm(k, String(v))),
  issuedAt: date(o.issued_at),
  expiresAt: date(o.expires_at),
  acceptedAt: date(o.accepted_at),
  kfsDocumentId: o.kfs_document_id,
  agreementDocumentId: o.agreement_document_id,
  status: camel(o.effective_status || o.status) as OfferStatus,
});

const toESign = (e: ESignDto): ESign => ({
  id: e.id, offerId: e.loan_offer_id, status: camel(e.status) as ESignStatus, signingUrl: e.signing_url ?? null,
  expiresAt: new Date(e.expires_at), signedAt: date(e.signed_at),
});

const toBank = (b: BankDto): BankAccount => ({
  id: b.id, accountNumberMasked: b.account_number_masked, ifsc: b.ifsc, bankName: b.bank_name ?? null,
  status: camel(b.status) as BankVerificationStatus, failureCode: b.failure_code ?? null,
});

const DISBURSEMENT_STATUS: Record<string, DisbursementStatus> = {
  PENDING: 'pending', PROCESSING: 'processing', DISBURSED: 'disbursed', SUCCESS: 'disbursed',
  FAILED: 'failed', REVERSED: 'reversed', REQUIRES_REVIEW: 'underReview',
};
const toDisbursement = (d: DisbursementDto): Disbursement => ({
  id: d.id, offerId: d.loan_offer_id, status: DISBURSEMENT_STATUS[d.status] ?? 'underReview', amount: Number(d.amount),
  accountNumberMasked: d.account_number_masked, ifsc: d.ifsc, utr: d.utr ?? null, completedAt: date(d.completed_at),
});

/** 404 simply means "nothing there yet". Every other error is a real error. */
async function orNull<T>(call: () => Promise<T>): Promise<T | null> {
  try { return await call(); }
  catch (e) { if (e instanceof ApiException && e.statusCode === 404) return null; throw e; }
}

export const loanLifecycleRepo = {
  /** The customer's offer for this application (issued offers only; the backend hides drafts). */
  async getOffer(applicationId: string): Promise<LoanOffer | null> {
    const list = await api.get<OfferDto[]>('/loan-offers');
    const mine = list.filter((o) => o.loan_application_id === applicationId).map(toOffer);
    if (mine.length === 0) return null;
    return mine.sort((a, b) => b.version - a.version)[0];
  },
  async acceptOffer(offer: LoanOffer): Promise<LoanOffer> {
    if (!offer.kfsDocumentId) throw new ApiException({ message: 'The key facts statement is not available yet.' });
    const o = await api.post<OfferDto>(`/loan-offers/${offer.id}/accept`, {
      data: { offer_version: offer.version, kfs_document_id: offer.kfsDocumentId, kfs_acknowledged: true },
    });
    return toOffer(o);
  },
  async declineOffer(offerId: string): Promise<void> { await api.post(`/loan-offers/${offerId}/decline`, { data: {} }); },

  async getESign(offerId: string): Promise<ESign | null> {
    const e = await orNull(() => api.get<ESignDto>(`/loan-offers/${offerId}/esign`));
    return e ? toESign(e) : null;
  },
  /** Starts (or resumes) signing. The result of signing is reported only by the provider's callback. */
  async startESign(offerId: string): Promise<ESign> { return toESign(await api.post<ESignDto>(`/loan-offers/${offerId}/esign`, { data: {} })); },

  async getBankAccount(): Promise<BankAccount | null> {
    const b = await orNull(() => api.get<BankDto>('/bank-verifications/current'));
    return b ? toBank(b) : null;
  },
  async submitBankAccount(accountNumber: string, ifsc: string): Promise<BankAccount> {
    return toBank(await api.post<BankDto>('/bank-verifications', { data: { account_number: accountNumber, ifsc } }));
  },

  async getDisbursement(offerId: string): Promise<Disbursement | null> {
    const d = await orNull(() => api.get<DisbursementDto>(`/loan-offers/${offerId}/disbursement`));
    return d ? toDisbursement(d) : null;
  },
};
