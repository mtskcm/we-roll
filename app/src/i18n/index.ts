import { useSettingsStore, type Language } from '../store/settingsStore';

type Dict = Record<string, string>;

const SK: Dict = {
  // Tabs
  'tab.feed': 'HOME',
  'tab.outfit': 'FITS',
  'tab.fit': 'CREATE',
  'tab.profile': 'ME',

  // Search
  'search.title': 'Hľadaj',
  'search.placeholder': 'Značky, produkty, e-shopy…',
  'search.results': '{n} produktov',
  'search.empty.title': 'Žiadne výsledky',
  'search.empty.body': 'Skús inú značku alebo vyčisti filtre.',
  'search.allCategories': 'Všetko',
  'search.recent': 'Nedávno hľadané',
  'search.recent.clear': 'Vymazať',
  'search.discoverHint': 'Tieto odporúčania sa menia podľa toho čo lajkneš a uložíš.',
  'search.trending.title': 'TRENDY TERAZ',
  'search.trending.subtitle': 'Najpopulárnejšie tento týždeň',
  'search.foryou.title': 'PRE TEBA',
  'search.foryou.subtitle': 'Podľa toho, čo lajkuješ a ukladáš',

  // Notifications screen
  'notif.title': 'Notifikácie',
  'notif.new': '{n} nových',
  'notif.allRead': 'Všetko prečítané',
  'notif.markAll': 'Označiť všetko',
  'notif.empty.title': 'Žiadne správy',
  'notif.empty.body': 'Sem ti budú prichádzať notifikácie o zľavách, restoku a nových kolekciách.',
  'notif.type.price_drop': 'Pokles ceny',
  'notif.type.restock': 'Späť na sklade',
  'notif.type.new_collection': 'Nová kolekcia',

  // Language sheet
  'lang.title': 'Vyber jazyk',
  'lang.sk': 'Slovenčina',
  'lang.en': 'Angličtina',

  // Share sheet
  'share.sent': 'Odoslané pre {name}',
  'share.copied': 'Link skopírovaný',
};

const EN: Dict = {
  // Tabs
  'tab.feed': 'HOME',
  'tab.outfit': 'FITS',
  'tab.fit': 'CREATE',
  'tab.profile': 'ME',

  // Search
  'search.title': 'Search',
  'search.placeholder': 'Brands, products, shops…',
  'search.results': '{n} products',
  'search.empty.title': 'No results',
  'search.empty.body': 'Try another brand or clear filters.',
  'search.allCategories': 'All',
  'search.recent': 'Recent searches',
  'search.recent.clear': 'Clear',
  'search.discoverHint': 'These recommendations adapt based on what you like and save.',
  'search.trending.title': 'TRENDING NOW',
  'search.trending.subtitle': 'Most popular this week',
  'search.foryou.title': 'FOR YOU',
  'search.foryou.subtitle': 'Based on what you like and save',

  // Notifications screen
  'notif.title': 'Notifications',
  'notif.new': '{n} new',
  'notif.allRead': 'All read',
  'notif.markAll': 'Mark all',
  'notif.empty.title': 'No notifications',
  'notif.empty.body': 'Discount alerts, restocks and new collections will appear here.',
  'notif.type.price_drop': 'Price drop',
  'notif.type.restock': 'Back in stock',
  'notif.type.new_collection': 'New collection',

  // Language sheet
  'lang.title': 'Choose language',
  'lang.sk': 'Slovak',
  'lang.en': 'English',

  // Share sheet
  'share.sent': 'Sent to {name}',
  'share.copied': 'Link copied',
};

const DICTS: Record<Language, Dict> = { sk: SK, en: EN };

function format(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

export function useT() {
  const language = useSettingsStore((s) => s.language);
  const dict = DICTS[language];
  return (key: keyof typeof SK, params?: Record<string, string | number>): string => {
    const t = dict[key as string] ?? SK[key as string] ?? (key as string);
    return format(t, params);
  };
}

export type TKey = keyof typeof SK;
