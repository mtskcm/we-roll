import { useSettingsStore, type Language } from '../store/settingsStore';

type Dict = Record<string, string>;

const SK: Dict = {
  // Tabs
  'tab.feed': 'FEED',
  'tab.search': 'HĽADAJ',
  'tab.notifications': 'NOTIFIK.',
  'tab.profile': 'PROFIL',

  // Search
  'search.title': 'Hľadaj',
  'search.placeholder': 'Značky, produkty, e-shopy…',
  'search.results': '{n} produktov',
  'search.empty.title': 'Žiadne výsledky',
  'search.empty.body': 'Skús inú značku alebo vyčisti filtre.',
  'search.clearFilters': 'Vymazať filtre',
  'search.allCategories': 'Všetko',
  'search.allShops': 'Všetky shopy',
  'search.recent': 'Nedávno hľadané',
  'search.recent.clear': 'Vymazať',
  'search.discoverHint': 'Tieto odporúčania sa menia podľa toho čo lajkneš a uložíš.',
  'search.bucket.foryou.title': 'Pre teba',
  'search.bucket.foryou.subtitle': 'Viac z kategórie {cat}',
  'search.bucket.trending.title': 'Trendy',
  'search.bucket.trending.subtitle': 'Najpopulárnejšie tento týždeň',
  'search.bucket.shop.subtitle': 'Tvoj obľúbený e-shop',
  'search.bucket.creator.subtitle': '{handle} · {n} outfitov',
  'search.bucket.alsoSee': 'Pozri tiež: {cat}',

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

  // Profile
  'profile.joined': 'Členom od {date}',
  'profile.stat.liked': 'OBĽÚBENÉ',
  'profile.stat.saved': 'ULOŽENÉ',
  'profile.stat.orders': 'OBJEDNÁVKY',
  'profile.stat.brands': 'ZNAČKY',
  'profile.section.creators': 'Top creators',
  'profile.section.liked': 'Tvoje obľúbené',
  'profile.section.saved': 'Uložené',
  'profile.section.settings': 'Nastavenia',
  'profile.empty.liked': 'Zatiaľ nič nelajknuté.',
  'profile.empty.saved': 'Žiadne uložené produkty.',
  'profile.settings.notifications': 'Notifikácie',
  'profile.settings.theme': 'Téma',
  'profile.settings.theme.value': 'Iba tmavá',
  'profile.settings.language': 'Jazyk',
  'profile.settings.logout': 'Odhlásiť sa',

  // Language sheet
  'lang.title': 'Vyber jazyk',
  'lang.sk': 'Slovenčina',
  'lang.en': 'Angličtina',

  // Product card
  'product.share': 'Zdieľať',
  'product.save': 'Uložiť',
  'product.takeIt': 'Take it',
  'product.opening': 'Otvára e-shop…',

  // Share sheet
  'share.title': 'Pošli kamošovi',
  'share.nativeFallback': 'Ďalšie možnosti zdieľania',
  'share.sent': 'Odoslané pre {name}',

  // Login
  'login.title': 'Vitaj späť',
  'login.subtitle': 'Prihlás sa pre prístup k tvojim objednávkam, veľkostiam a obľúbeným značkám.',
  'login.email': 'Email',
  'login.password': 'Heslo',
  'login.cta': 'Prihlásiť sa',
  'login.or': 'alebo',
  'login.guest': 'Pokračovať ako hosť',
  'login.terms': 'Pokračovaním súhlasíš s podmienkami a zásadami ochrany súkromia.',
  'login.noAccount': 'Nemáš účet?',
  'login.toRegister': 'Vytvor si ho',

  // Register
  'register.title': 'Vytvor si účet',
  'register.subtitle': 'Pár sekúnd a si dnu — sleduj zľavy, ulož si obľúbené kúsky.',
  'register.name': 'Meno',
  'register.passwordConfirm': 'Heslo znova',
  'register.cta': 'Vytvoriť účet',
  'register.haveAccount': 'Už máš účet?',
  'register.toLogin': 'Prihlás sa',
  'register.error.name': 'Zadaj meno aspoň 2 znaky',
  'register.error.email': 'Neplatný email',
  'register.error.password': 'Heslo musí mať aspoň 4 znaky',
  'register.error.passwordMatch': 'Heslá sa nezhodujú',

  // Profile expanded
  'profile.section.orders': 'Objednávky',
  'profile.section.sizes': 'Moje veľkosti',
  'profile.section.brands': 'Obľúbené značky',
  'profile.order.delivered': 'Doručené',
  'profile.order.shipped': 'Odoslané',
  'profile.order.processing': 'Spracúva sa',
  'profile.order.itemCount': '{n} ks',
  'profile.size.top': 'Hore',
  'profile.size.bottom': 'Dole',
  'profile.size.shoes': 'Obuv',
  'profile.brands.empty': 'Zatiaľ nesleduješ žiadnu značku.',
  'profile.orders.empty': 'Žiadne objednávky.',
};

const EN: Dict = {
  // Tabs
  'tab.feed': 'FEED',
  'tab.search': 'SEARCH',
  'tab.notifications': 'NOTIF.',
  'tab.profile': 'PROFILE',

  // Search
  'search.title': 'Search',
  'search.placeholder': 'Brands, products, shops…',
  'search.results': '{n} products',
  'search.empty.title': 'No results',
  'search.empty.body': 'Try another brand or clear filters.',
  'search.clearFilters': 'Clear filters',
  'search.allCategories': 'All',
  'search.allShops': 'All shops',
  'search.recent': 'Recent searches',
  'search.recent.clear': 'Clear',
  'search.discoverHint': 'These recommendations adapt based on what you like and save.',
  'search.bucket.foryou.title': 'For you',
  'search.bucket.foryou.subtitle': 'More from {cat}',
  'search.bucket.trending.title': 'Trending',
  'search.bucket.trending.subtitle': 'Most popular this week',
  'search.bucket.shop.subtitle': 'Your favorite shop',
  'search.bucket.creator.subtitle': '{handle} · {n} outfits',
  'search.bucket.alsoSee': 'See also: {cat}',

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

  // Profile
  'profile.joined': 'Member since {date}',
  'profile.stat.liked': 'LIKED',
  'profile.stat.saved': 'SAVED',
  'profile.stat.orders': 'ORDERS',
  'profile.stat.brands': 'BRANDS',
  'profile.section.creators': 'Top creators',
  'profile.section.liked': 'Your favorites',
  'profile.section.saved': 'Saved',
  'profile.section.settings': 'Settings',
  'profile.empty.liked': 'Nothing liked yet.',
  'profile.empty.saved': 'No saved products.',
  'profile.settings.notifications': 'Notifications',
  'profile.settings.theme': 'Theme',
  'profile.settings.theme.value': 'Dark only',
  'profile.settings.language': 'Language',
  'profile.settings.logout': 'Log out',

  // Language sheet
  'lang.title': 'Choose language',
  'lang.sk': 'Slovak',
  'lang.en': 'English',

  // Product card
  'product.share': 'Share',
  'product.save': 'Save',
  'product.takeIt': 'Take it',
  'product.opening': 'Opening shop…',

  // Share sheet
  'share.title': 'Send to a friend',
  'share.nativeFallback': 'More sharing options',
  'share.sent': 'Sent to {name}',

  // Login
  'login.title': 'Welcome back',
  'login.subtitle': 'Sign in to access your orders, sizes and favorite brands.',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.cta': 'Sign in',
  'login.or': 'or',
  'login.guest': 'Continue as guest',
  'login.terms': 'By continuing you agree to the terms and privacy policy.',
  'login.noAccount': "Don't have an account?",
  'login.toRegister': 'Sign up',

  // Register
  'register.title': 'Create account',
  'register.subtitle': 'A few seconds and you are in — track sales, save favorites.',
  'register.name': 'Name',
  'register.passwordConfirm': 'Confirm password',
  'register.cta': 'Create account',
  'register.haveAccount': 'Already have an account?',
  'register.toLogin': 'Sign in',
  'register.error.name': 'Enter at least 2 characters',
  'register.error.email': 'Invalid email',
  'register.error.password': 'Password must be at least 4 characters',
  'register.error.passwordMatch': 'Passwords do not match',

  // Profile expanded
  'profile.section.orders': 'Orders',
  'profile.section.sizes': 'My sizes',
  'profile.section.brands': 'Favorite brands',
  'profile.order.delivered': 'Delivered',
  'profile.order.shipped': 'Shipped',
  'profile.order.processing': 'Processing',
  'profile.order.itemCount': '{n} items',
  'profile.size.top': 'Top',
  'profile.size.bottom': 'Bottom',
  'profile.size.shoes': 'Shoes',
  'profile.brands.empty': 'You are not following any brands yet.',
  'profile.orders.empty': 'No orders yet.',
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
