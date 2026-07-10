#!/usr/bin/env node
// WEROL feed importer — fetch a Heureka / Google-Shopping XML product feed,
// map SHOPITEMs to our products schema, and upsert into Supabase.
//
// The SAME parse/map logic is later lifted into supabase/functions/ingest-feed
// (Deno) for the scheduled (pg_cron) import. This script is the dev harness.
//
// Usage:
//   node scripts/ingest-feed.mjs --selftest          # parse bundled fixture, print rows, no DB
//   FEED_URL=... SHOP="Queens.sk" node scripts/ingest-feed.mjs --dry   # parse live feed, print, no DB
//   FEED_URL=... SHOP="Queens.sk" SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/ingest-feed.mjs
//
// Env:
//   FEED_URL              the XML feed URL (Heureka / Google Shopping / Dognet)
//   SHOP                  display name for the shop column + id prefix (default: feed host)
//   SUPABASE_URL          default https://hcrccagnnjeslnpmfdky.supabase.co
//   SUPABASE_SERVICE_KEY  service-role key (SECRET — never commit)
//   LIMIT                 cap number of products (optional, for testing)

import { XMLParser } from 'fast-xml-parser';

const ARGS = new Set(process.argv.slice(2));
const SELFTEST = ARGS.has('--selftest');
const DRY = ARGS.has('--dry') || SELFTEST;
const REPLACE = ARGS.has('--replace'); // delete all existing products before insert
const MAX_PRODUCTS = process.env.MAX_PRODUCTS ? parseInt(process.env.MAX_PRODUCTS, 10) : 3000;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hcrccagnnjeslnpmfdky.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const FEED_URL = process.env.FEED_URL || '';
const FEED_FILE = process.env.FEED_FILE || flagValue('--file');
// Some feeds (e.g. migmig.eu comparators) sit behind HTTP Basic Auth. Pass
// credentials via env only — NEVER hardcode/commit them.
const FEED_USER = process.env.FEED_USER || '';
const FEED_PASS = process.env.FEED_PASS || '';
const SHOP_ENV = process.env.SHOP || '';
const CURRENCY_ENV = process.env.CURRENCY || '';
const BUY_FALLBACK = process.env.BUY_FALLBACK || ''; // e.g. "https://shop.sk/search?q={q}"
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : Infinity;

function flagValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : '';
}

// ── Category mapping: category text + name/type keywords → our CategoryId ─────
// Covers SK + CZ + EN terms.
const CATEGORY_RULES = [
  // underwear / swimwear / lingerie first → accessories (else "plavk" hits shorts)
  ['accessories', /(prádl|pradl|spodní prádlo|spodn|slip|boxerk|podprsenk|tang|plavk|ponožk|ponozk|pun[čc]och|opasok|pásek|pasek|tašk|kabelk|ruksak|batoh|šál|\bsál\b|rukavic|čelenk|celenk|šperk|sperk|doplnk|accessor)/i],
  ['sneakers', /(obuv|tenisk|topánk|topank|sneaker|botas|\bboty\b|teniska|kotn|sandál|sandal|šlapk|slapk)/i],
  ['hoodies', /(mikin|hoodie|crewneck|sveter|svetr|pulóver|pulover|rolák|rolak)/i],
  ['tshirts', /(tričk|tricko|tielk|tílk|tilk|t-shirt|\btee\b|\btshirt\b|polo|košeľ|košil|kosil|halenk|blúz|bluz)/i],
  ['jackets', /(bund|kabát|kabat|jacket|parka|\bvest|coat|softshell|sako|kardig)/i],
  ['shorts', /(šortk|sortk|kraťas|kratas|\bshorts?\b)/i],
  ['pants', /(nohavic|kalhot|jeans|rifle|teplák|teplak|jogger|chino|pants|legín|legin|sukn|šaty|saty)/i],
  ['caps', /(šiltovk|siltovk|čiapk|ciapk|čepic|cepic|\bcap\b|beanie|klobúk|klobuk|headwear|šatk|satk)/i],
];
function mapCategory(categoryText, name) {
  const hay = `${categoryText || ''} ${name || ''}`;
  for (const [id, re] of CATEGORY_RULES) if (re.test(hay)) return id;
  return 'accessories';
}

// ── helpers ─────────────────────────────────────────────────────────────────
const first = (v) => (Array.isArray(v) ? v[0] : v);
const str = (v) => {
  let x = first(v);
  if (x && typeof x === 'object' && '#text' in x) x = x['#text']; // element had attributes
  return x === undefined || x === null ? null : String(x).trim();
};
const num = (v) => {
  const x = str(v);
  if (!x) return null;
  const n = parseFloat(x.replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
};
function slug(s) {
  return (s || 'shop').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'shop';
}

// Upgrade known low-res feed image variants to their full-size equivalent.
// Sizeer's XML ships the 600×600 "gallery_xml" LiipImagine crop; the same path
// with the "gallery" filter is 1500×1500 → sharp on a full-bleed card.
function upgradeImage(url) {
  if (!url) return url;
  return url.replace('/media/cache/resolve/gallery_xml/', '/media/cache/resolve/gallery/');
}

// ── map one SHOPITEM → row ──────────────────────────────────────────────────
function mapItem(item, shopName) {
  const extId = str(item.ITEM_ID) || str(item.PRODUCTNO) || str(item.EAN);
  // Variant feeds append the size to PRODUCTNAME ("… Hnedá EUR 41,5",
  // "… EUR 34-38", "… EUR 43 1/3"). We collapse variants → strip that trailing
  // size so the product shows a clean name.
  const nameRaw = str(item.PRODUCTNAME) || str(item.PRODUCT);
  const name = nameRaw ? nameRaw.replace(/\s+EUR\s+[\d.,/\s-]+$/i, '').trim() : nameRaw;
  const buyUrl = str(item.URL);
  const img = upgradeImage(str(item.IMGURL));
  if (!extId || !name || !buyUrl) return null; // skip incomplete

  const categoryRaw = str(item.CATEGORYTEXT);
  const priceCurrent = num(item.PRICE_VAT) ?? num(item.PRICE);
  const delivery = str(item.DELIVERY_DATE);

  return {
    id: `${slug(shopName)}:${extId}`,
    ext_id: extId,
    shop: shopName,
    brand: str(item.MANUFACTURER),
    name,
    description: str(item.DESCRIPTION),
    price_current: priceCurrent,
    price_original: num(item.PRICE_VAT_BEFORE), // usually absent in basic feeds → null
    currency: str(item.CURRENCY) || 'EUR',
    image_url: img,
    image_alt_url: str(item.IMGURL_ALTERNATIVE),
    buy_url: buyUrl,
    category: mapCategory(categoryRaw, name),
    category_raw: categoryRaw,
    ean: str(item.EAN),
    in_stock: delivery === null ? true : delivery !== '0' ? true : true, // feeds list only sellable items
  };
}

// ── buy_url when the feed has none (dropship supplier feeds) ─────────────────
function fallbackBuyUrl(brand, name) {
  const q = encodeURIComponent([brand, name].filter(Boolean).join(' '));
  if (BUY_FALLBACK) return BUY_FALLBACK.replace('{q}', q);
  return `https://www.google.com/search?tbm=shop&q=${q}`;
}

// ── map one custom <product> (e.g. matterhorn-moda.cz dropship feed) → row ──
function mapCustomProduct(p, shopName, idAttr) {
  const extId = idAttr || str(p.id) || str(p.name);
  const name = str(p.name);
  if (!extId || !name) return null;

  // images: <images><image_url>..</image_url>..</images>
  let imgs = p.images?.image_url ?? [];
  if (!Array.isArray(imgs)) imgs = imgs ? [imgs] : [];
  imgs = imgs.map((x) => str(x)).filter(Boolean);

  const categoryRaw = str(p.category_path) || str(p.category);
  const type = str(p.type);

  // options → stock + first ean
  let opts = p.options?.option ?? [];
  if (!Array.isArray(opts)) opts = opts ? [opts] : [];
  const inStock = opts.length === 0 ? true : opts.some((o) => (num(o.STOCK) ?? 0) > 0);
  const ean = opts.length ? str(opts[0].ean) : null;

  const brand = str(p.brand);

  return {
    id: `${slug(shopName)}:${extId}`,
    ext_id: extId,
    shop: shopName,
    brand,
    name,
    description: null, // feed descriptions are HTML size-tables; skip for now
    price_current: num(p.price),
    price_original: null,
    currency: CURRENCY_ENV || 'CZK', // matterhorn-moda.cz feed is CZK
    image_url: imgs[0] ?? null,
    image_alt_url: imgs[1] ?? null,
    buy_url: fallbackBuyUrl(brand, name), // feed has no product URL → placeholder
    category: mapCategory(`${categoryRaw} ${type}`, name),
    category_raw: categoryRaw,
    ean,
    in_stock: inStock,
  };
}

// ── map one TradeDoubler JSON product → row ─────────────────────────────────
// TradeDoubler /products.json: { productHeader, products:[{ name, brand,
// description, fields:[{name,value}], offers:[{ productUrl(=affiliate deeplink),
// priceHistory:[{price:{value,currency}}], availability, programName,
// sourceProductId }], categories:[{name}], productImage:{url} }] }
function mapTradedoubler(p, shopName) {
  const offer = (p.offers && p.offers[0]) || {};
  const fields = Object.fromEntries((p.fields || []).map((f) => [f.name, f.value]));
  const ext = str(offer.sourceProductId) || str(fields.mpn) || str(p.name);
  const name = str(p.name);
  const buyUrl = str(offer.productUrl) || str(offer.legacyProductUrl); // affiliate deeplink
  if (!ext || !name || !buyUrl) return null;

  const ph = offer.priceHistory || [];
  const lastPrice = ph.length ? ph[ph.length - 1].price : null;
  const priceCurrent = lastPrice ? num(lastPrice.value) : null;
  const currency = (lastPrice && str(lastPrice.currency)) || CURRENCY_ENV || 'EUR';

  // "Prevoius_price" (sic) / BestPrice hold the pre-sale price like "34.95EUR"
  let priceOriginal = num(fields.Prevoius_price) ?? num(fields.BestPrice);
  if (priceOriginal && priceCurrent && priceOriginal <= priceCurrent) priceOriginal = null;

  const categoryRaw = str((p.categories && p.categories[0] && p.categories[0].name)) || '';
  const img = str(p.productImage && p.productImage.url);
  const avail = (str(offer.availability) || '').toLowerCase();

  return {
    id: `${slug(shopName)}:${ext}`,
    ext_id: ext,
    shop: shopName,
    brand: str(p.brand),
    name,
    description: null, // long HTML; skip for now
    price_current: priceCurrent,
    price_original: priceOriginal,
    currency,
    image_url: img,
    image_alt_url: str(fields.additional_image_link),
    buy_url: buyUrl,
    category: mapCategory(categoryRaw, name),
    category_raw: categoryRaw,
    ean: str(fields.gtin) || str(fields.ean),
    in_stock: avail ? avail.includes('in stock') || avail.includes('skladom') : true,
  };
}

// ── fetch all TradeDoubler pages (matrix param ;page=N) up to MAX_PRODUCTS ───
async function fetchTradedoublerAll(baseUrl, shopName) {
  const rows = [];
  let page = 1;
  let totalHits = Infinity;
  while (rows.length < Math.min(totalHits, MAX_PRODUCTS)) {
    const url = baseUrl.replace(/;page=\d+/i, `;page=${page}`);
    const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'WEROL-ingest/1.0' } });
    if (!res.ok) throw new Error(`feed page ${page} failed: HTTP ${res.status}`);
    const j = await res.json();
    if (j.productHeader && typeof j.productHeader.totalHits === 'number') totalHits = j.productHeader.totalHits;
    const items = j.products || [];
    if (!items.length) break;
    for (const p of items) {
      const row = mapTradedoubler(p, shopName);
      if (row) rows.push(row);
      if (rows.length >= MAX_PRODUCTS) break;
    }
    process.stdout.write(`  fetched page ${page} (${rows.length}/${Math.min(totalHits, MAX_PRODUCTS)})\r`);
    if (items.length < 100) break; // last page
    page += 1;
  }
  process.stdout.write('\n');
  return { total: totalHits === Infinity ? rows.length : totalHits, mapped: rows };
}

// ── delete every product (used by --replace before a fresh import) ───────────
async function deleteAllProducts() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=not.is.null`, {
    method: 'DELETE',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: 'return=minimal',
    },
  });
  if (!res.ok) throw new Error(`delete-all failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
}

// ── collapse variants (same ITEMGROUP_ID) to one product ────────────────────
function dedupeVariants(items) {
  const seen = new Set();
  const out = [];
  for (const raw of items) {
    const gid = str(raw.ITEMGROUP_ID);
    if (gid) {
      if (seen.has(gid)) continue;
      seen.add(gid);
    }
    out.push(raw);
  }
  return out;
}

function parseFeed(xml, shopName) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true,
  });
  const doc = parser.parse(xml);

  // Format detection: Heureka (SHOP/SHOPITEM) vs custom (products/product).
  const heurekaRoot = doc.SHOP || doc.shop;
  const customRoot = doc.products || doc.PRODUCTS;

  const rows = [];
  let total = 0;

  if (heurekaRoot || doc.SHOPITEM) {
    let items = (heurekaRoot && (heurekaRoot.SHOPITEM || heurekaRoot.shopitem)) || doc.SHOPITEM || [];
    if (!Array.isArray(items)) items = [items];
    total = items.length;
    for (const it of dedupeVariants(items)) {
      const row = mapItem(it, shopName);
      if (row) rows.push(row);
      if (rows.length >= LIMIT) break;
    }
  } else if (customRoot) {
    let items = customRoot.product || customRoot.PRODUCT || [];
    if (!Array.isArray(items)) items = [items];
    total = items.length;
    for (const p of items) {
      const row = mapCustomProduct(p, shopName, str(p['@_id']));
      if (row) rows.push(row);
      if (rows.length >= LIMIT) break;
    }
  } else {
    throw new Error('Unrecognized feed format (expected SHOP/SHOPITEM or products/product).');
  }

  return { total, mapped: rows };
}

// ── Supabase upsert via PostgREST ───────────────────────────────────────────
async function upsert(rows) {
  const CHUNK = 500;
  let done = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Supabase upsert failed (${res.status}): ${body.slice(0, 400)}`);
    }
    done += batch.length;
    process.stdout.write(`  upserted ${done}/${rows.length}\r`);
  }
  process.stdout.write('\n');
}

// ── bundled fixture (real Heureka clothing structure) for --selftest ────────
const FIXTURE = `<?xml version="1.0" encoding="utf-8"?>
<SHOP>
  <SHOPITEM>
    <ITEM_ID>SK-10231</ITEM_ID>
    <PRODUCTNAME>Nike Sportswear Club Hoodie</PRODUCTNAME>
    <DESCRIPTION>Klasická pánska mikina s kapucňou.</DESCRIPTION>
    <URL>https://example-shop.sk/p/nike-club-hoodie</URL>
    <IMGURL>https://example-shop.sk/img/nike-club-hoodie.jpg</IMGURL>
    <IMGURL_ALTERNATIVE>https://example-shop.sk/img/nike-club-hoodie-2.jpg</IMGURL_ALTERNATIVE>
    <PRICE_VAT>59.90</PRICE_VAT>
    <MANUFACTURER>Nike</MANUFACTURER>
    <CATEGORYTEXT>Oblečenie | Pánske | Mikiny</CATEGORYTEXT>
    <EAN>1934560001231</EAN>
    <ITEMGROUP_ID>grp-club-hoodie</ITEMGROUP_ID>
    <PARAM><PARAM_NAME>Veľkosť</PARAM_NAME><VAL>M</VAL></PARAM>
  </SHOPITEM>
  <SHOPITEM>
    <ITEM_ID>SK-10232</ITEM_ID>
    <PRODUCTNAME>Nike Sportswear Club Hoodie</PRODUCTNAME>
    <URL>https://example-shop.sk/p/nike-club-hoodie</URL>
    <IMGURL>https://example-shop.sk/img/nike-club-hoodie.jpg</IMGURL>
    <PRICE_VAT>59.90</PRICE_VAT>
    <MANUFACTURER>Nike</MANUFACTURER>
    <CATEGORYTEXT>Oblečenie | Pánske | Mikiny</CATEGORYTEXT>
    <ITEMGROUP_ID>grp-club-hoodie</ITEMGROUP_ID>
    <PARAM><PARAM_NAME>Veľkosť</PARAM_NAME><VAL>L</VAL></PARAM>
  </SHOPITEM>
  <SHOPITEM>
    <ITEM_ID>SK-22119</ITEM_ID>
    <PRODUCTNAME>adidas Samba OG tenisky</PRODUCTNAME>
    <URL>https://example-shop.sk/p/adidas-samba-og</URL>
    <IMGURL>https://example-shop.sk/img/adidas-samba.jpg</IMGURL>
    <PRICE_VAT>119.00</PRICE_VAT>
    <MANUFACTURER>adidas</MANUFACTURER>
    <CATEGORYTEXT>Obuv | Tenisky</CATEGORYTEXT>
    <EAN>4066759001239</EAN>
  </SHOPITEM>
</SHOP>`;

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  const shopName =
    SHOP_ENV ||
    (FEED_URL ? new URL(FEED_URL).hostname.replace(/^www\./, '') : '') ||
    (FEED_FILE ? 'Local Feed' : 'Demo Shop');

  // TradeDoubler (JSON, paginated) is detected by URL.
  const isTradedoubler =
    !SELFTEST && !FEED_FILE && /tradedoubler\.com|products\.json/i.test(FEED_URL);

  let total, mapped;

  if (isTradedoubler) {
    console.log(`▶ fetching TradeDoubler feed (JSON, up to ${MAX_PRODUCTS}): ${FEED_URL.replace(/token=[^&;]+/i, 'token=***')}`);
    ({ total, mapped } = await fetchTradedoublerAll(FEED_URL, shopName));
    console.log(`✓ ${total} available → imported ${mapped.length} products (shop: "${shopName}")`);
  } else {
    let xml;
    if (SELFTEST) {
      console.log('▶ selftest: parsing bundled fixture');
      xml = FIXTURE;
    } else if (FEED_FILE) {
      console.log(`▶ reading local file: ${FEED_FILE}`);
      const { readFile } = await import('node:fs/promises');
      xml = await readFile(FEED_FILE, 'utf8');
    } else {
      if (!FEED_URL) {
        console.error('✗ No source. Use --selftest, FEED_URL=…, or --file <path> / FEED_FILE=…');
        process.exit(1);
      }
      console.log(`▶ fetching feed: ${FEED_URL}`);
      const headers = { 'User-Agent': 'WEROL-ingest/1.0' };
      if (FEED_USER || FEED_PASS) {
        headers.Authorization = `Basic ${Buffer.from(`${FEED_USER}:${FEED_PASS}`).toString('base64')}`;
      }
      const res = await fetch(FEED_URL, { headers });
      if (!res.ok) {
        console.error(`✗ feed fetch failed: HTTP ${res.status}`);
        process.exit(1);
      }
      xml = await res.text();
    }
    ({ total, mapped } = parseFeed(xml, shopName));
    console.log(`✓ parsed ${total} items → ${mapped.length} products (shop: "${shopName}", variants collapsed)`);
  }

  // category histogram
  const hist = {};
  for (const r of mapped) hist[r.category] = (hist[r.category] || 0) + 1;
  console.log('  categories:', hist);
  console.log('  sample row:', JSON.stringify(mapped[0], null, 2));

  if (DRY) {
    console.log(SELFTEST ? '▶ selftest done (no DB write).' : '▶ dry run done (no DB write).');
    return;
  }
  if (!SERVICE_KEY) {
    console.error('✗ SUPABASE_SERVICE_KEY not set — cannot write. (Use --dry to preview.)');
    process.exit(1);
  }
  if (REPLACE) {
    console.log('▶ --replace: deleting ALL existing products…');
    await deleteAllProducts();
  }
  console.log(`▶ upserting ${mapped.length} products into ${SUPABASE_URL}…`);
  await upsert(mapped);
  console.log('✓ done.');
}

main().catch((e) => {
  console.error('✗', e.message);
  process.exit(1);
});
