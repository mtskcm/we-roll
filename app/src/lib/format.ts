// Price formatting — show currency symbols (€ £ $ …) instead of ISO codes.

export function currencySymbol(currency?: string): string {
  switch ((currency || '').toUpperCase()) {
    case 'EUR': return '€';
    case 'USD': return '$';
    case 'GBP': return '£';
    case 'CZK': return 'Kč';
    case 'PLN': return 'zł';
    default: return currency || '';
  }
}

/** e.g. (39, 'EUR') → "39 €". Rounds to 2 decimals and strips trailing zeros
 *  so float sums like 34.9 + 24.9 don't render as "59.800000000000004". */
export function formatPrice(value: number, currency?: string): string {
  const rounded = Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
  return `${rounded} ${currencySymbol(currency)}`.trim();
}

/** Compact social count: 1234 → "1.2K". */
export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return String(n);
}

/** Compact relative age: "3m" / "3h" / "3d" — one format everywhere. */
export function relTime(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 60) return `${Math.max(1, m)}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
