const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 2500000 -> "25,00,000" (Indian digit grouping, no Intl dependency). */
function groupIndian(n: number): string {
  const s = Math.round(Math.abs(n)).toString();
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

export const Fmt = {
  currency(amount: number): string {
    return `${amount < 0 ? '-' : ''}₹${groupIndian(amount)}`;
  },

  date(dt: Date): string {
    return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
  },

  dateTime(dt: Date): string {
    const h = dt.getHours();
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const mm = dt.getMinutes().toString().padStart(2, '0');
    return `${Fmt.date(dt)}, ${h12}:${mm} ${h >= 12 ? 'PM' : 'AM'}`;
  },

  relativeShort(dt: Date): string {
    const diffMs = Date.now() - dt.getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return Fmt.date(dt);
  },

  /** "9876543210" -> "98765 43210" */
  phoneGrouped(ten: string): string {
    return ten.length === 10 ? `${ten.slice(0, 5)} ${ten.slice(5)}` : ten;
  },

  tenureDays(days: number): string {
    if (days % 30 === 0 && days >= 30) {
      const months = days / 30;
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    }
    return `${days} days`;
  },

  /** Local YYYY-MM-DD, as the backend expects for date_of_birth. */
  dateOnly(dt: Date): string {
    const y = dt.getFullYear().toString().padStart(4, '0');
    const m = (dt.getMonth() + 1).toString().padStart(2, '0');
    const d = dt.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  },
};

/** Parse "YYYY-MM-DD" as a LOCAL date (JS would otherwise treat it as UTC). */
export function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
