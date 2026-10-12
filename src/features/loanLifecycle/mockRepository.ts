import {
  ActiveLoan, BankAccount, Disbursement, KfsDocument, LoanAgreement, LoanOffer, OfferStatus, Payment,
  PaymentMethod, RepaymentInstallment, RepaymentSchedule,
} from './models';

const sleep = (ms = 500) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * In-memory mock — stateful for the lifetime of the app process.
 *
 * PRICING DISCLAIMER: rate, fees and APR here are ILLUSTRATIVE PLACEHOLDERS,
 * deliberately not tied to any approved lending policy. Every screen using
 * this data shows an "illustrative terms" banner. Replace once a real
 * pricing/policy engine exists server-side.
 */
class MockLoanLifecycleRepository {
  private offers = new Map<string, LoanOffer>(); // by applicationId
  private kfs = new Map<string, KfsDocument>(); // by offerId
  private agreements = new Map<string, LoanAgreement>(); // by offerId
  private bankAccounts = new Map<string, BankAccount>(); // by applicationId
  private disbursements = new Map<string, Disbursement>(); // by applicationId
  private activeLoans = new Map<string, ActiveLoan>(); // by applicationId
  private schedules = new Map<string, RepaymentSchedule>(); // by loanId
  private payments = new Map<string, Payment[]>(); // by loanId

  // --- Offer ---------------------------------------------------------
  async getOffer(applicationId: string): Promise<LoanOffer | null> {
    await sleep(300);
    return this.offers.get(applicationId) ?? null;
  }

  async ensureOfferGenerated(applicationId: string, requestedAmount: number, requestedTenureDays: number): Promise<LoanOffer> {
    const existing = this.offers.get(applicationId);
    if (existing) return existing;
    await sleep(700);

    const annualRatePercent = 24.0; // illustrative placeholder only
    const processingFee = Math.round(requestedAmount * 0.02);
    const years = requestedTenureDays / 365;
    const interest = requestedAmount * (annualRatePercent / 100) * years;
    const totalRepayment = requestedAmount + interest;
    const installments = Math.max(1, Math.round(requestedTenureDays / 30));
    const emi = Math.round(totalRepayment / installments);
    const apr = ((interest + processingFee) / requestedAmount / years) * 100;

    const offer: LoanOffer = {
      id: `offer_${applicationId}_1`,
      applicationId,
      approvedAmount: requestedAmount,
      disbursableAmount: requestedAmount - processingFee,
      tenureDays: requestedTenureDays,
      annualInterestRatePercent: annualRatePercent,
      processingFee,
      otherCharges: 0,
      apr,
      totalRepaymentAmount: Math.round(totalRepayment),
      emiAmount: emi,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      version: 1,
      status: 'issued',
      lenderName: 'InPockets Financial Services',
    };
    this.offers.set(applicationId, offer);
    return offer;
  }

  private setOfferStatus(offerId: string, status: OfferStatus): LoanOffer {
    for (const [key, o] of this.offers) {
      if (o.id === offerId) {
        const updated = { ...o, status };
        this.offers.set(key, updated);
        return updated;
      }
    }
    throw new Error(`Unknown offer ${offerId}`);
  }

  async acceptOffer(offerId: string) { await sleep(); return this.setOfferStatus(offerId, 'accepted'); }
  async declineOffer(offerId: string) { await sleep(); this.setOfferStatus(offerId, 'declined'); }

  // --- KFS -----------------------------------------------------------
  async getKfs(offerId: string): Promise<KfsDocument> {
    await sleep(400);
    const cached = this.kfs.get(offerId);
    if (cached) return cached;
    const offer = [...this.offers.values()].find((o) => o.id === offerId);
    if (!offer) throw new Error(`Unknown offer ${offerId}`);
    const doc: KfsDocument = {
      id: `kfs_${offerId}`, offerId, version: 1, generatedAt: new Date(),
      lineItems: [
        { label: 'Loan amount', value: `₹${offer.approvedAmount}` },
        { label: 'Annual interest rate', value: `${offer.annualInterestRatePercent.toFixed(1)}%` },
        { label: 'Processing fee', value: `₹${offer.processingFee}` },
        { label: 'APR (all-in cost)', value: `${offer.apr.toFixed(1)}%` },
        { label: 'Total amount repayable', value: `₹${offer.totalRepaymentAmount}` },
        { label: 'Tenure', value: `${offer.tenureDays} days` },
        { label: 'Lender', value: offer.lenderName },
      ],
    };
    this.kfs.set(offerId, doc);
    return doc;
  }

  // --- Agreement / e-sign ---------------------------------------------
  async getAgreement(offerId: string): Promise<LoanAgreement> {
    await sleep(400);
    const cached = this.agreements.get(offerId);
    if (cached) return cached;
    const a: LoanAgreement = { id: `agreement_${offerId}`, offerId, version: 1, createdAt: new Date(), signingStatus: 'initiated' };
    this.agreements.set(offerId, a);
    return a;
  }

  private findAgreementKey(agreementId: string): string {
    for (const [k, a] of this.agreements) if (a.id === agreementId) return k;
    throw new Error(`Unknown agreement ${agreementId}`);
  }

  async initiateESign(agreementId: string): Promise<LoanAgreement> {
    await sleep(500);
    const key = this.findAgreementKey(agreementId);
    const updated: LoanAgreement = { ...this.agreements.get(key)!, signingStatus: 'pending', providerRef: `mock-esign-${Date.now()}` };
    this.agreements.set(key, updated);
    return updated;
  }

  async completeESign(agreementId: string): Promise<LoanAgreement> {
    await sleep(900);
    const key = this.findAgreementKey(agreementId);
    const updated: LoanAgreement = { ...this.agreements.get(key)!, signingStatus: 'signed', signedAt: new Date() };
    this.agreements.set(key, updated);
    return updated;
  }

  // --- Bank account ----------------------------------------------------
  async getBankAccount(applicationId: string): Promise<BankAccount | null> {
    await sleep(300);
    return this.bankAccounts.get(applicationId) ?? null;
  }

  async submitBankAccount(applicationId: string, accountHolderName: string, accountNumber: string, ifsc: string): Promise<BankAccount> {
    await sleep(1200); // simulates a penny-drop verification call
    const masked = accountNumber.length > 4
      ? '•'.repeat(accountNumber.length - 4) + accountNumber.slice(-4)
      : accountNumber;
    const account: BankAccount = {
      id: `bank_${applicationId}`,
      accountHolderName,
      accountNumberMasked: masked,
      ifsc: ifsc.toUpperCase(),
      bankName: guessBankFromIfsc(ifsc),
      status: 'verified',
    };
    this.bankAccounts.set(applicationId, account);
    return account;
  }

  // --- Disbursement ------------------------------------------------------
  async getDisbursement(applicationId: string): Promise<Disbursement | null> {
    await sleep(300);
    return this.disbursements.get(applicationId) ?? null;
  }

  async initiateDisbursement(applicationId: string, amount: number): Promise<Disbursement> {
    const loanId = `loan_${applicationId}`;
    const processing: Disbursement = {
      id: `disb_${applicationId}`, loanId, amount, status: 'processing', initiatedAt: new Date(),
    };
    this.disbursements.set(applicationId, processing);
    setTimeout(() => this.resolveDisbursement(applicationId, loanId, amount), 3000);
    return processing;
  }

  private resolveDisbursement(applicationId: string, loanId: string, amount: number) {
    const started = this.disbursements.get(applicationId)!.initiatedAt;
    this.disbursements.set(applicationId, {
      id: `disb_${applicationId}`, loanId, amount, status: 'success',
      initiatedAt: started, completedAt: new Date(), utr: `UTR${Date.now()}`,
    });
    this.activeLoans.set(applicationId, {
      id: loanId, applicationId, principalAmount: amount, disbursedAt: new Date(), status: 'ACTIVE',
    });
    this.schedules.set(loanId, this.generateSchedule(loanId, applicationId));
  }

  async getActiveLoan(applicationId: string): Promise<ActiveLoan | null> {
    await sleep(300);
    return this.activeLoans.get(applicationId) ?? null;
  }

  private generateSchedule(loanId: string, applicationId: string): RepaymentSchedule {
    const offer = this.offers.get(applicationId)!;
    const count = Math.max(1, Math.round(offer.tenureDays / 30));
    const principalEach = offer.approvedAmount / count;
    const interestEach = (offer.totalRepaymentAmount - offer.approvedAmount) / count;
    const now = new Date();
    const installments: RepaymentInstallment[] = Array.from({ length: count }, (_, i) => ({
      installmentNumber: i + 1,
      dueDate: new Date(now.getFullYear(), now.getMonth() + i + 1, now.getDate()),
      principalComponent: Math.round(principalEach),
      interestComponent: Math.round(interestEach),
      amountDue: offer.emiAmount,
      amountPaid: 0,
      status: i === 0 ? 'due' : 'upcoming',
      daysPastDue: 0,
    }));
    return { loanId, installments, generatedAt: now };
  }

  async getRepaymentSchedule(loanId: string): Promise<RepaymentSchedule> {
    await sleep(400);
    const s = this.schedules.get(loanId);
    if (!s) throw new Error(`No repayment schedule for loan ${loanId} yet`);
    return s;
  }

  async makePayment(loanId: string, amount: number, method: PaymentMethod, installmentNumbers: number[]): Promise<Payment> {
    await sleep(1500); // simulates a real payment round trip
    const payment: Payment = {
      id: `pay_${Date.now()}`, loanId, amount, method, status: 'success',
      createdAt: new Date(), installmentNumbers, receiptRef: `RCPT${Date.now()}`,
    };
    const list = this.payments.get(loanId) ?? [];
    list.unshift(payment);
    this.payments.set(loanId, list);

    const schedule = this.schedules.get(loanId);
    if (schedule) {
      this.schedules.set(loanId, {
        ...schedule,
        installments: schedule.installments.map((inst) =>
          installmentNumbers.includes(inst.installmentNumber)
            ? { ...inst, amountPaid: inst.amountDue, status: 'paid' as const }
            : inst,
        ),
      });
    }
    return payment;
  }

  async getPaymentHistory(loanId: string): Promise<Payment[]> {
    await sleep(300);
    return [...(this.payments.get(loanId) ?? [])];
  }
}

function guessBankFromIfsc(ifsc: string): string {
  if (ifsc.length < 4) return 'Bank';
  const code = ifsc.slice(0, 4).toUpperCase();
  const known: Record<string, string> = {
    HDFC: 'HDFC Bank', ICIC: 'ICICI Bank', SBIN: 'State Bank of India',
    UTIB: 'Axis Bank', PUNB: 'Punjab National Bank', KKBK: 'Kotak Mahindra Bank',
  };
  return known[code] ?? `Bank (${code})`;
}

/** Kept for the whole app session so history survives screen navigation. */
export const loanLifecycleRepo = new MockLoanLifecycleRepository();
