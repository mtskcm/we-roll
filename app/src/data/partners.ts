// Database partnerov pre WEROL — kontakty na affiliate / partnership oslovenie.
// Slúži ako structured zdroj pre budúce dashboard / outreach tooly.

export type PartnerCategory =
  | 'sk_cz_retailer'
  | 'eu_retailer'
  | 'marketplace'
  | 'brand'
  | 'affiliate_network';

export type PartnerStatus = 'not_contacted' | 'emailed' | 'responded' | 'partnered' | 'declined';

export type Partner = {
  id: string;
  name: string;
  website: string;
  category: PartnerCategory;
  country: string;
  email: string;
  affiliateNetwork?: 'Awin' | 'Dognet' | 'Heureka' | 'TradeDoubler' | 'CJ' | 'Rakuten' | 'Direct';
  notes?: string;
  status: PartnerStatus;
};

export const PARTNERS: Partner[] = [
  // SK / CZ priorita
  { id: 'footshop', name: 'Footshop', website: 'footshop.eu', category: 'sk_cz_retailer', country: 'CZ', email: 'info@footshop.cz', affiliateNetwork: 'Direct', status: 'not_contacted' },
  { id: 'queens', name: 'Queens.sk', website: 'queens.sk', category: 'sk_cz_retailer', country: 'SK', email: 'shop@queens.sk', affiliateNetwork: 'Dognet', status: 'not_contacted' },
  { id: 'freshment', name: 'Freshment', website: 'freshment.sk', category: 'sk_cz_retailer', country: 'SK', email: 'info@freshment.sk', affiliateNetwork: 'Heureka', status: 'not_contacted' },
  { id: 'sizeer', name: 'Sizeer', website: 'sizeer.sk', category: 'sk_cz_retailer', country: 'SK', email: 'sklep@sizeer.sk', affiliateNetwork: 'Awin', status: 'not_contacted' },
  { id: 'alza', name: 'AlzaShop', website: 'alza.sk', category: 'sk_cz_retailer', country: 'SK', email: 'partnership@alza.cz', affiliateNetwork: 'Heureka', status: 'not_contacted' },
  { id: 'mall', name: 'Mall.sk', website: 'mall.sk', category: 'sk_cz_retailer', country: 'SK', email: 'partners@mall.sk', affiliateNetwork: 'Heureka', status: 'not_contacted' },
  { id: 'hervis', name: 'Hervis', website: 'hervis.sk', category: 'sk_cz_retailer', country: 'SK', email: 'info@hervis.sk', affiliateNetwork: 'Awin', status: 'not_contacted' },
  { id: 'sportisimo', name: 'Sportisimo', website: 'sportisimo.sk', category: 'sk_cz_retailer', country: 'SK', email: 'info@sportisimo.sk', affiliateNetwork: 'Awin', status: 'not_contacted' },
  { id: 'naulici', name: 'NaUlici', website: 'naulici.sk', category: 'sk_cz_retailer', country: 'SK', email: 'naulici@naulici.sk', affiliateNetwork: 'Direct', status: 'not_contacted' },
  { id: 'carbon', name: 'Carbon Collective', website: 'carbon-collective.com', category: 'sk_cz_retailer', country: 'CZ', email: 'info@carbon-collective.com', affiliateNetwork: 'Direct', status: 'not_contacted' },
  { id: 'a4', name: 'A4 Store', website: 'a4store.sk', category: 'sk_cz_retailer', country: 'SK', email: 'info@a4store.sk', affiliateNetwork: 'Direct', status: 'not_contacted' },
  { id: 'mottowear', name: 'Mottowear', website: 'mottowear.com', category: 'sk_cz_retailer', country: 'SK', email: 'hello@mottowear.com', affiliateNetwork: 'Direct', status: 'not_contacted', notes: 'SK eco brand' },
  { id: 'pepe-sk', name: 'Pepe Jeans SK', website: 'pepejeans.sk', category: 'sk_cz_retailer', country: 'SK', email: 'info@pepejeans.sk', affiliateNetwork: 'Awin', status: 'not_contacted' },
  { id: 'gant-sk', name: 'GANT SK', website: 'gant.sk', category: 'sk_cz_retailer', country: 'SK', email: 'info@gant.sk', affiliateNetwork: 'Awin', status: 'not_contacted' },
  { id: 'boyish', name: 'Boyish', website: 'boyish.cz', category: 'sk_cz_retailer', country: 'CZ', email: 'info@boyish.cz', affiliateNetwork: 'Direct', status: 'not_contacted' },

  // EU
  { id: 'zalando', name: 'Zalando', website: 'zalando.sk', category: 'eu_retailer', country: 'DE', email: 'partner.relations@zalando.com', affiliateNetwork: 'Awin', status: 'not_contacted' },
  { id: 'aboutyou', name: 'About You', website: 'aboutyou.sk', category: 'eu_retailer', country: 'DE', email: 'partners@aboutyou.com', affiliateNetwork: 'Awin', status: 'not_contacted' },
  { id: 'asos', name: 'ASOS', website: 'asos.com', category: 'eu_retailer', country: 'UK', email: 'partnersuk@asos.com', affiliateNetwork: 'Awin', status: 'not_contacted' },
  { id: 'end', name: 'END Clothing', website: 'endclothing.com', category: 'eu_retailer', country: 'UK', email: 'press@endclothing.com', affiliateNetwork: 'Awin', status: 'not_contacted' },
  { id: 'mrporter', name: 'MR PORTER', website: 'mrporter.com', category: 'eu_retailer', country: 'UK', email: 'press@mrporter.com', affiliateNetwork: 'TradeDoubler', status: 'not_contacted' },
  { id: 'farfetch', name: 'Farfetch', website: 'farfetch.com', category: 'eu_retailer', country: 'UK', email: 'press@farfetch.com', affiliateNetwork: 'CJ', status: 'not_contacted' },
  { id: 'ssense', name: 'SSENSE', website: 'ssense.com', category: 'eu_retailer', country: 'CA', email: 'press@ssense.com', affiliateNetwork: 'Rakuten', status: 'not_contacted' },
  { id: '24s', name: '24S', website: '24s.com', category: 'eu_retailer', country: 'FR', email: 'hello@24s.com', affiliateNetwork: 'Direct', status: 'not_contacted', notes: 'Luxury LVMH' },
  { id: 'sns', name: 'Sneakersnstuff', website: 'sneakersnstuff.com', category: 'eu_retailer', country: 'SE', email: 'sns@sneakersnstuff.com', affiliateNetwork: 'Awin', status: 'not_contacted' },
  { id: 'naked', name: 'Naked', website: 'nakedcph.com', category: 'eu_retailer', country: 'DK', email: 'info@nakedcph.com', affiliateNetwork: 'Direct', status: 'not_contacted' },

  // Marketplaces
  { id: 'stockx', name: 'StockX', website: 'stockx.com', category: 'marketplace', country: 'US', email: 'api-team@stockx.com', affiliateNetwork: 'Direct', status: 'not_contacted', notes: 'API access available' },
  { id: 'goat', name: 'GOAT', website: 'goat.com', category: 'marketplace', country: 'US', email: 'partnerships@goat.com', affiliateNetwork: 'Direct', status: 'not_contacted' },
  { id: 'grailed', name: 'Grailed', website: 'grailed.com', category: 'marketplace', country: 'US', email: 'partnerships@grailed.com', affiliateNetwork: 'Direct', status: 'not_contacted' },
  { id: 'vinted', name: 'Vinted', website: 'vinted.sk', category: 'marketplace', country: 'LT', email: 'press@vinted.com', affiliateNetwork: 'Awin', status: 'not_contacted' },
  { id: 'klekt', name: 'Klekt', website: 'klekt.com', category: 'marketplace', country: 'AT', email: 'hello@klekt.com', affiliateNetwork: 'Direct', status: 'not_contacted' },

  // Brands (direct)
  { id: 'nike', name: 'Nike', website: 'nike.com', category: 'brand', country: 'US', email: 'media.eu@nike.com', affiliateNetwork: 'Direct', status: 'not_contacted' },
  { id: 'adidas', name: 'Adidas', website: 'adidas.com', category: 'brand', country: 'DE', email: 'press@adidas.com', affiliateNetwork: 'Direct', status: 'not_contacted' },
  { id: 'newbalance', name: 'New Balance', website: 'newbalance.com', category: 'brand', country: 'US', email: 'press-uk@newbalance.co.uk', affiliateNetwork: 'Direct', status: 'not_contacted' },
  { id: 'carhartt', name: 'Carhartt WIP', website: 'carhartt-wip.com', category: 'brand', country: 'DE', email: 'press@carhartt-wip.com', affiliateNetwork: 'Direct', status: 'not_contacted' },
  { id: 'stussy', name: 'Stüssy', website: 'stussy.com', category: 'brand', country: 'US', email: 'press@stussy.com', affiliateNetwork: 'Direct', status: 'not_contacted' },
  { id: 'thrasher', name: 'Thrasher', website: 'thrashermagazine.com', category: 'brand', country: 'US', email: 'info@thrashermagazine.com', affiliateNetwork: 'Direct', status: 'not_contacted' },
  { id: 'ripndip', name: 'Ripndip', website: 'ripndipclothing.com', category: 'brand', country: 'US', email: 'press@ripndipclothing.com', affiliateNetwork: 'Direct', status: 'not_contacted' },
  { id: 'patagonia', name: 'Patagonia', website: 'patagonia.com', category: 'brand', country: 'US', email: 'europe@patagonia.com', affiliateNetwork: 'Direct', status: 'not_contacted' },
  { id: 'tnf', name: 'The North Face', website: 'thenorthface.com', category: 'brand', country: 'US', email: 'europe.press@vfc.com', affiliateNetwork: 'Direct', status: 'not_contacted' },
  { id: 'vans', name: 'Vans', website: 'vans.com', category: 'brand', country: 'US', email: 'press@vans.com', affiliateNetwork: 'Direct', status: 'not_contacted' },

  // Affiliate sites
  { id: 'awin', name: 'Awin', website: 'awin.com', category: 'affiliate_network', country: 'UK', email: 'newpublishers@awin.com', status: 'not_contacted', notes: 'Hlavná EU sieť — pokryje 80% shopov' },
  { id: 'dognet', name: 'Dognet', website: 'dognet.sk', category: 'affiliate_network', country: 'SK', email: 'info@dognet.sk', status: 'not_contacted', notes: 'SK/CZ priorita' },
  { id: 'heureka', name: 'Heureka Partner', website: 'heureka.sk', category: 'affiliate_network', country: 'CZ', email: 'partner@heureka.sk', status: 'not_contacted' },
  { id: 'tradedoubler', name: 'TradeDoubler', website: 'tradedoubler.com', category: 'affiliate_network', country: 'SE', email: 'partners@tradedoubler.com', status: 'not_contacted' },
];

export const PARTNERS_BY_CATEGORY: Record<PartnerCategory, Partner[]> = {
  sk_cz_retailer: PARTNERS.filter((p) => p.category === 'sk_cz_retailer'),
  eu_retailer: PARTNERS.filter((p) => p.category === 'eu_retailer'),
  marketplace: PARTNERS.filter((p) => p.category === 'marketplace'),
  brand: PARTNERS.filter((p) => p.category === 'brand'),
  affiliate_network: PARTNERS.filter((p) => p.category === 'affiliate_network'),
};
