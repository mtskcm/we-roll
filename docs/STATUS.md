# WEROL — Status & TODO master list

Posledná aktualizácia: 21.5.2026 (po DEEP AUDIT)

Legenda: ✅ hotové · 🟡 in progress · 🚧 blokované · 🔴 P0 · 🟠 P1 · 🟢 P2

---

## 👥 Tím a roly (audit 21.5)

| Člen | Primárne | Sekundárne |
|---|---|---|
| **Matúš Kačmár** | Dev full-stack (frontend + backend) | Owner, legal, business decisions |
| **Maroš Pasternák** | Design (internal) | Marketing / Social support |
| **Jakub Baran** | Marketing / Content all-in (IG) | Business dev, partner outreach, KE incubator |

---

## 🚧 BLOKER #1: Marošove designy

Stav: **Maroš pripravuje 5+ screens vo Figma. App rewrite čaká.**

Postup: **Big rewrite naraz po dokončení** (nie inkrementálne).

Týmto sú blokované:
- 🎓 Onboarding tutoriál
- 🔐 Login + Registrácia (auth UI)
- 🎨 Feed/Search/Profile/Messages redesign
- 🦴 Loading skeletons, Empty states, Error states

Sprint 1 sa preto sústreďuje na **veci nezávislé od designu**.

---

## 🔴 Sprint 1 (do 4.6) — najbližšie 2 týždne

### Hotové ✅
- ✅ Landing page deploy na werol.app + Supabase signup + Trello sync
- ✅ Instagram @werol.app account vytvorený (Jakub)
- ✅ Cloudflare Email Routing (info@/jakub@/matus@/maros@werol.app)
- ✅ Trello workspace s 8 boardmi (110+ kariet, fully tagged)

### To Do tento týždeň
- 🔴 **Maroš:** dokončiť Figma designy (5+ screens)
- 🔴 **Matúš:** Privacy Policy + Terms cez termly.io
- 🔴 **Matúš:** Cookie consent banner (Cookieyes free)
- 🔴 **Matúš:** Git commit + reorganize repo (commit existujúce zmeny)
- 🔴 **Matúš:** per-osoba email routing (poslať Jakubovi gmail)
- 🟠 **Jakub:** roztriediť Firmy CZ/SK, napísať outreach template
- 🟠 **Maroš:** Splash screen + App icon design (môže paralelne s veľkými screenmi)
- 🟠 **Jakub:** Inovatívne centrum KE — kontaktovať známeho

### POSUNUTÉ ZO SPRINT 1
- 🍎 Apple Developer Account → Sprint 4 (treba až pred TestFlight)
- 🤖 Google Play Developer → Sprint 4
- 🎓 Onboarding tutoriál → Sprint 2 (blokované designom)
- 🔐 Registrácia (Apple/Google/email) → Sprint 2 (blokované designom)
- 🌐 TikTok @werol.app → Sprint 2 (až bude content)

---

## ⏭️ Sprint 2-6 plán (audit 21.5)

### Sprint 2 — Design rewrite + Auth (5.6 → 18.6)
**Predpoklad:** Maroš má designy hotové.

- 🎨 Big design rewrite (Matúš aplikuje Maroš designy screen-by-screen)
- 🔐 Supabase Auth setup + Login/Register flow
- 🎓 Onboarding tutoriál (s novým designom)
- 📧 Per-osoba email routing finalizovaný

### Sprint 3 — Backend + Features (19.6 → 2.7)
- 🔌 Products schema + real API integrácia (replace mocks)
- ❤️ Real likes/saves sync cez Supabase
- 👔 Outfit Builder full feature
- 🤝 Affiliate outreach (Jakub) — smaller SK/CZ shops

### Sprint 4 — Polish + Beta (3.7 → 16.7)
- 🦴 Loading skeletons + Empty/Error states (s designom)
- 🌓 Light theme variants
- 🔔 Push notifikácie (expo-notifications + EAS Build)
- 🍎 Apple Developer Account (99 USD)
- 🤖 Google Play Developer (25 USD)
- 🧪 TestFlight beta (10 testerov)
- 🧪 Google Play Internal Testing

### Sprint 5 — Pre-launch (17.7 → 30.7)
- 🖼️ App Store screenshoty (Maroš)
- 🎬 Promo video 15-30s (Maroš)
- 🔍 ASO keywords research (Jakub)
- 📲 App Store Connect + Play Console listing
- 🛡️ GDPR data export endpoint
- 📨 Welcome / broadcast email tool decision

### Sprint 6 — Launch (31.7 → 13.8)
- 🚀 Submit do App Store + Play Store
- 📣 Launch deň — push všetkých kanálov
- 💸 Paid ads aktivácia (Meta + TikTok, 200€)
- 🎁 Referral program live
- 🐛 Post-launch bug fixing

---

## 🟢 Decisions confirmed (21.5 audit)

| Otázka | Rozhodnutie |
|---|---|
| Revenue model | **Affiliate only** (po 1000 stiahnutí re-evaluate) |
| Beta testers | Tím + Supabase signupy + influencers + open beta (all-of) |
| Affiliate strategy | **Smaller SK/CZ first** (Jakubov zoznam, výber z Firmy) |
| Email backend | **Supabase + Trello sync** (Mailchimp odmietnutý) |
| Welcome email | **Nie teraz** — broadcast až tesne pred launch |
| Právna forma | **Po beta test** (nie teraz) |
| Trademark | **ÚPV SR SK only** (~165€) |
| GDPR | Privacy + Terms (termly.io) + Cookie consent (Cookieyes) |
| Content schedule | **Daily** posty (IG primárne, TikTok od S2) |
| Products schema | Full (creator_id, cached counts, availability) |
| Data zdroj | Mocky teraz, real data neskôr |
| App design | **Big rewrite po Marošovi** (nie inkrementálne) |

---

## 💡 Open questions (treba ešte vyjasniť)

- Pôjde aj **funkcionalita** s designom? (Maroš môže navrhnúť iné features)
- Tools pre broadcast email? (Resend / CF Email Workers / Mailchimp comeback)
- Konkrétny vlastník pre Privacy/Terms text (Matúš ale check by jurist?)
- Open beta = verejný TestFlight cez Apple — Apple verification timing?

---

## 📂 Repo organization (potreba refaktor)

**Súčasný stav:** Všetko v `/Users/matus/werol-app/` (mixed RN + web + supabase).

**GitHub:** `https://github.com/mtskcm/we-roll.git` — branch `main`. Posledný commit: `Apply new design v2`. Neuncommitted: `STATUS.md`, `supabase/`, `web/`.

**Návrh restrukturalizácie:**
```
werol/
├── app/              (React Native app — všetko z root)
├── landing/          (presunúť z web/)
├── supabase/         (existujúce)
├── scripts/          (existujúce)
├── docs/             (STATUS.md, partners.csv, emails.txt)
└── README.md         (workspace overview)
```

**Action:** Matúš spraví commit aktuálnych zmien + restrukturalizáciu (Sprint 1).

---

## 🔗 Linky

- **GitHub:** https://github.com/mtskcm/we-roll
- **Trello workspace:** https://trello.com/w/werol
- **Roadmap board:** https://trello.com/b/BczenqY5
- **APP functionality:** https://trello.com/b/3tUehwaT
- **Supabase project:** https://hcrccagnnjeslnpmfdky.supabase.co
- **Landing live:** https://werol.app
