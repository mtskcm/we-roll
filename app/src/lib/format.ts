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

/** e.g. (39, 'EUR') → "39 €" */
export function formatPrice(value: number, currency?: string): string {
  return `${value} ${currencySymbol(currency)}`.trim();
}
