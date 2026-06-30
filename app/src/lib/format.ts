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
