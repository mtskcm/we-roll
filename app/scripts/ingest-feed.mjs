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

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hcrccagnnjeslnpmfdky.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const FEED_URL = process.env.FEED_URL || '';
const SHOP_ENV = process.env.SHOP || '';
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : Infinity;

// ── Category mapping: CATEGORYTEXT + name keywords → our CategoryId ──────────
const CATEGORY_RULES = [
  ['sneakers', /(obuv|tenisk|topánk|topank|sneaker|botas|boty|obuv|teniska)/i],
  ['hoodies', /(mikin|hoodie|crewneck|sveter|pulóver|pulover)/i],
  ['tshirts', /(tričk|tricko|tielk|t-shirt|\btee\b|\btshirt\b|polo)/i],
  ['jackets', /(bund|kabát|kabat|jacket|parka|vest|coat|softshell)/i],
  ['shorts', /(šortk|sortk|kraťas|kratas|\bshorts?\b)/i],
  ['pants', /(nohavic|jeans|rifle|teplák|teplak|jogger|chino|pants|legín|legin)/i],
  ['caps', /(šiltovk|siltovk|čiapk|ciapk|\bcap\b|beanie|klobúk|klobuk|headwear)/i],
  ['accessories', /(doplnk|ponožk|ponozk|opasok|tašk|t_ask|ruksak|batoh|šál|sal|rukavic|accessor)/i],
];
function mapCategory(categoryText, name) {
  const hay = `${categoryText || ''} ${name || ''}`;
  for (const [id, re] of CATEGORY_RULES) if (re.test(hay)) return id;
  return 'accessories';
}

// ── helpers ─────────────────────────────────────────────────────────────────
const first = (v) => (Array.isArray(v) ? v[0] : v);
const str = (v) => {
  const x = first(v);
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

// ── map one SHOPITEM → row ──────────────────────────────────────────────────
function mapItem(item, shopName) {
  const extId = str(item.ITEM_ID) || str(item.PRODUCTNO) || str(item.EAN);
  const name = str(item.PRODUCTNAME) || str(item.PRODUCT);
  const buyUrl = str(item.URL);
  const img = str(item.IMGURL);
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
  const parser = new XMLParser({ ignoreAttributes: true, trimValues: true });
  const doc = parser.parse(xml);
  const root = doc.SHOP || doc.shop || doc;
  let items = root.SHOPITEM || root.shopitem || [];
  if (!Array.isArray(items)) items = [items];
  const deduped = dedupeVariants(items);
  const rows = [];
  for (const it of deduped) {
    const row = mapItem(it, shopName);
    if (row) rows.push(row);
    if (rows.length >= LIMIT) break;
  }
  return { total: items.length, mapped: rows };
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
  const shopName = SHOP_ENV || (FEED_URL ? new URL(FEED_URL).hostname.replace(/^www\./, '') : 'Demo Shop');

  let xml;
  if (SELFTEST) {
    console.log('▶ selftest: parsing bundled fixture');
    xml = FIXTURE;
  } else {
    if (!FEED_URL) {
      console.error('✗ FEED_URL not set. Use --selftest, or set FEED_URL=...');
      process.exit(1);
    }
    console.log(`▶ fetching feed: ${FEED_URL}`);
    const res = await fetch(FEED_URL, { headers: { 'User-Agent': 'WEROL-ingest/1.0' } });
    if (!res.ok) {
      console.error(`✗ feed fetch failed: HTTP ${res.status}`);
      process.exit(1);
    }
    xml = await res.text();
  }

  const { total, mapped } = parseFeed(xml, shopName);
  console.log(`✓ parsed ${total} SHOPITEMs → ${mapped.length} products (shop: "${shopName}", variants collapsed)`);

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
  console.log(`▶ upserting ${mapped.length} products into ${SUPABASE_URL}…`);
  await upsert(mapped);
  console.log('✓ done.');
}

main().catch((e) => {
  console.error('✗', e.message);
  process.exit(1);
});
