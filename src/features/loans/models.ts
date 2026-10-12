/* eslint-disable @typescript-eslint/no-explicit-any */

/** FastAPI may serialise Decimal as a number or a numeric string. */
const parseDecimal = (v: unknown): number => (typeof v === 'number' ? v : Number(String(v)));

export interface LoanApplication {
  id: string;
  applicationNumber: string;
  userId: string;
  status: string;
  requestedAmount: number;
  requestedTenureDays: number;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const isDraft = (a: LoanApplication) => a.status === 'DRAFT';

export interface LoanApplicationEvent {
  id: string;
  applicationId: string;
  eventType: string;
  previousStatus: string | null;
  newStatus: string;
  actorType: string; // SYSTEM | USER | STAFF
  reason: string | null;
  createdAt: Date;
}

export const loanFromJson = (j: any): LoanApplication => ({
  id: j.id,
  applicationNumber: j.application_number,
  userId: j.user_id,
  status: j.status,
  requestedAmount: parseDecimal(j.requested_amount),
  requestedTenureDays: j.requested_tenure_days,
  submittedAt: j.submitted_at ? new Date(j.submitted_at) : null,
  createdAt: new Date(j.created_at),
  updatedAt: new Date(j.updated_at),
});

export const eventFromJson = (j: any): LoanApplicationEvent => ({
  id: j.id,
  applicationId: j.application_id,
  eventType: j.event_type,
  previousStatus: j.previous_status ?? null,
  newStatus: j.new_status,
  actorType: j.actor_type,
  reason: j.reason ?? null,
  createdAt: new Date(j.created_at),
});
