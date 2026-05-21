# WEROL

Kurátorovaný streetwear feed z najlepších e-shopov — mobilná appka + landing page.

> 🚧 V developmentu. Spúšťame leto 2026.

## Štruktúra repa

```
werol/
├── app/         # React Native (Expo) mobile app
├── landing/     # Static landing page (deployed to werol.app)
├── supabase/    # Database schemas, triggers, edge functions
├── docs/        # Internal docs (status, partnerships, contacts)
└── README.md
```

## Tím

- **Matúš Kačmár** — Dev full-stack (frontend + backend), owner
- **Maroš Pasternák** — Design, marketing support
- **Jakub Baran** — Marketing/content, business dev

## Quick start

### Mobile app (`app/`)

```bash
cd app
npm install
npx expo start
```

Scan QR cez Expo Go (iOS/Android) alebo `i` / `a` pre simulator.

### Landing page (`landing/`)

Static HTML — žiadny build step.

**Local preview:**
```bash
cd landing
python3 -m http.server 4444
# Otvor http://localhost:4444
```

**Deploy:**
Drag & drop `landing/` priečinok do Cloudflare Pages projektu `werol`.

Live: **https://werol.app**

### Supabase

Schema + triggers: [supabase/sync-to-trello.sql](supabase/sync-to-trello.sql)

V Supabase Dashboarde → SQL Editor → spustiť proti danému projektu.

## Status

Aktuálny stav projektu, čo je hotové a čo treba: **[docs/STATUS.md](docs/STATUS.md)**

## Linky

- 🌐 Landing: https://werol.app
- 📱 App: spúšťame leto 2026
- 📋 Trello workspace: https://trello.com/w/werol
- 🗄️ Supabase: https://hcrccagnnjeslnpmfdky.supabase.co
- 📊 Roadmap board: https://trello.com/b/BczenqY5

## Stack

- **Mobile:** Expo SDK 54, React Native 0.81, TypeScript, Zustand, React Navigation, Reanimated 4
- **Backend:** Supabase (Postgres + Auth + Storage)
- **Landing:** Plain HTML/CSS/JS, hosted on Cloudflare Pages
- **PM:** Trello (auto-sync emails z landingu cez Postgres trigger)
- **Email:** Cloudflare Email Routing (info@/jakub@/matus@/maros@werol.app → gmail)

## License

Proprietary © 2026 WEROL
