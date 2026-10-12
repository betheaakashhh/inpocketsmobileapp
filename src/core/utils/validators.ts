/**
 * Mirrors real backend constraints (app/schemas/auth.py,
 * app/services/pan_verification.py) so users get instant feedback.
 */
const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export const Validators = {
  /** Exactly 10 digits, starting with 6-9. */
  phoneNumber(value?: string): string | null {
    const v = value?.trim() ?? '';
    if (!v) return 'Enter your mobile number';
    if (!/^\d{10}$/.test(v)) return 'Enter a valid 10-digit mobile number';
    if (!/^[6-9]/.test(v)) return 'Enter a valid Indian mobile number';
    return null;
  },

  otp(value?: string, length = 6): string | null {
    const v = value?.trim() ?? '';
    if (v.length !== length || !/^\d+$/.test(v)) return `Enter the ${length}-digit code`;
    return null;
  },

  pan(value?: string): string | null {
    const v = value?.trim().toUpperCase() ?? '';
    if (!v) return 'Enter your PAN number';
    if (!PAN.test(v)) return 'PAN should look like ABCDE1234F';
    return null;
  },

  requiredName(value?: string, field = 'This field'): string | null {
    const v = value?.trim() ?? '';
    if (!v) return `${field} is required`;
    if (v.length < 2) return `${field} looks too short`;
    if (!/^[A-Za-z .'-]+$/.test(v)) return `${field} can only contain letters`;
    return null;
  },

  /** Client-side UX guardrail only; backend just enforces amount > 0. */
  loanAmount(value?: string, min = 1000, max = 500000): string | null {
    const v = value?.trim() ?? '';
    if (!v) return 'Enter an amount';
    const amount = Number(v);
    if (!Number.isFinite(amount) || amount <= 0) return 'Enter a valid amount';
    if (amount < min) return `Minimum amount is ₹${min}`;
    if (amount > max) return `Maximum amount is ₹${max}`;
    return null;
  },
};

export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
