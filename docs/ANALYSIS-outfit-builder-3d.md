# Outfit builder — 3D avatar, extrakcia oblečenia z feed fotiek a AI virtual try-on

> Analýza z 11. 6. 2026. Otázka: dá sa z XML feed produktov vytiahnuť kúsok
> oblečenia z fotky a obliecť ho na otáčateľný 3D model postavy? Aké sú
> alternatívy a ako funguje AI virtual try-on?

## Zhrnutie

Skutočné 3D obliekanie z feed fotiek **nie je realizovateľné** — nie kvôli
renderingu, ale kvôli obsahu: 2D fotka neobsahuje 3D informáciu o strihu.
Realistická cesta je trojvrstvová:

1. **Segmentačné výrezy** v ingest pipeline (lacné, automatické, hneď)
2. **2.5D builder** ako základná hravá vrstva (pseudo-3D rotácia avatara)
3. **AI virtual try-on** ako prémiové „wow" tlačidlo navrch (generuje
   fotorealistický výsledok namiesto rekonštrukcie geometrie)

## Časť 1: Z feed fotky vytiahnuť kúsok a dať ho na postavu

### Krok 1 — vytiahnutie kúsku z fotky (vyriešený problém)

Z produktovej fotky (aj s pozadím, aj na modelke) sa dá oblečenie vystrihnúť
automaticky pomocou segmentácie:

- **rembg / BiRefNet** — odstránenie pozadia, beží lokálne alebo ako lacné
  API, ~zadarmo
- **SAM 2** alebo špecializované *cloth segmentation* modely — vedia
  vystrihnúť konkrétne tričko z fotky modelky (oddelia ho od tela)

Výstup: PNG výrez kúsku s priehľadným pozadím. Dá sa zavesiť rovno na
existujúci `ingest-feed` pipeline — pri importe produktu sa raz vygeneruje
výrez a uloží do Supabase storage. Plne automatické, škáluje na tisíce SKU.

### Krok 2 — „dať to na 3D model" (tu je háčik)

Fotka je 2D projekcia — **neobsahuje informáciu o zadnej strane kúsku ani
o tom, ako sa látka skladá na tele**. Z jednej fotky sa 3D model oblečenia
zrekonštruovať prakticky nedá. Možnosti od najťažšej po najreálnejšiu:

1. **Skutočná 3D rekonštrukcia z fotky** — existuje len ako výskum
   (single-image garment reconstruction), výsledky nespoľahlivé. Ručná tvorba
   3D strihov (CLO3D / Marvelous Designer) = hodiny práce na jeden produkt.
   Pri feede s tisíckami položiek mŕtva cesta. (Preto realtime 3D dress-up
   nerobí ani Zalando či ASOS.)
2. **Šablónové 3D meshe** — generický 3D model trička / mikiny / nohavíc
   (pár kusov, vyrobené raz), fotka produktu sa naň premietne ako textúra
   (three.js + expo-gl v Expo). Automatizovateľné, ale vyzerá „hranato" —
   potlač sa natiahne, strih nesedí, zadná strana je vymyslená. Použiteľné,
   ak stačí štylizovaný/herný vzhľad.
3. **2.5D warp na avatara** *(toto reálne robia dress-up appky)* — výrez
   z kroku 1 sa mesh-warpom prispôsobí na ilustrovaného avatara (kotviace
   body: ramená, pás, boky). „Otáčanie" sa fejkuje 2–3 pripravenými pohľadmi
   avatara. Plne automatické, robustné na feed fotky. Na tomto princípe stojí
   prototyp A vo `OutfitBuilderPrototype.tsx`.

Vizuálne sa teda predstava „obliecť kúsok na otáčateľnú postavu" dosiahnuť
dá (2.5D / šablónové meshe), ale nie ako fyzikálne korektné 3D obliekanie.
Túto dieru rieši AI try-on — výsledok **vygeneruje** namiesto rekonštrukcie.

## Časť 2: AI virtual try-on

**Princíp:** diffusion model dostane dve fotky — osobu (avatara/modelku)
a kúsok oblečenia. Vnútorne si odhadne pózu, „vymaskuje" oblasť oblečenia na
tele a do nej vygeneruje produkt vrátane záhybov, tieňov a správneho
padnutia. Výstup je fotorealistický obrázok za ~5–15 sekúnd, cena cez API
typicky pár centov za obrázok.

### Free demá (nahrať fotku osoby + fotku produktu z feedu)

- [Kolors Virtual Try-On](https://huggingface.co/spaces/Kwai-Kolors/Kolors-Virtual-Try-On) — najznámejšie free demo
- [IDM-VTON](https://huggingface.co/spaces/yisol/IDM-VTON) — open-source klasika
- [WeShopAI Virtual Try On](https://huggingface.co/spaces/WeShopAI/WeShopAI-Virtual-Try-On)

### Produkčné API

- [FASHN API](https://fashn.ai/products/api) — špecializované try-on API,
  berie flat-lay aj ghost-mannequin fotky (presne formát feedu),
  [free tier s 10 kreditmi](https://fashn.ai/virtual-try-on), 5–17 s na obrázok
- Kling Virtual Try-On cez [PiAPI](https://piapi.ai/virtual-try-on) alebo
  [Pixazo](https://www.pixazo.ai/api/virtual-try-on)

### Flow v appke

Užívateľ si poskladá outfit (v builderi z výrezov) → tlačidlo **„Pozri na
modelke"** → Supabase edge function zavolá try-on API postupne (najprv vrch,
výstup pošle znova s nohavicami) → výsledok sa cachene per produkt+avatar,
platí sa len prvé vygenerovanie.

## Súvisiace

- Prototyp builderov (A — pseudo-3D rotácia, B — dress-up, C — flat-lay):
  `app/src/screens/OutfitBuilderPrototype.tsx`, prepínač v dev builde na
  Fit tabe. Throwaway kód — po výbere víťaza zmazať.
- Ďalšie možné kroky: segmentačný skript nad reálnymi feed fotkami (rembg,
  overiť kvalitu výrezov) alebo demo edge function na FASHN free tier.
