# Werol — Typography

Edition 01 · 2026

Three families. One system. Each carries a specific job — do not swap them.

---

## 1 · Display — **Archivo Black**

- Weights used: **400 / 700 / 800 / 900**
- Tracking: tight (`letter-spacing: -0.04em` to `-0.045em` for big sizes)
- Used for: headlines, product names, navigation, BUY buttons, the wordmark itself
- Source: Google Fonts → https://fonts.google.com/specimen/Archivo
- License: Open Font License (free for commercial)

Loading:
```html
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;700;800;900&display=swap" rel="stylesheet">
```

CSS:
```css
font-family: 'Archivo', sans-serif;
font-weight: 900;
letter-spacing: -0.045em;
```

---

## 2 · Body — **Inter**

- Weights used: **400 / 500 / 600 / 700**
- Tracking: neutral (`letter-spacing: -0.02em` to `0`)
- Used for: long-form copy, descriptions, chat, paragraphs
- Source: Google Fonts → https://fonts.google.com/specimen/Inter
- License: Open Font License

Loading:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

CSS:
```css
font-family: 'Inter', system-ui, sans-serif;
font-weight: 400;
```

---

## 3 · Technical — **JetBrains Mono**

- Weights used: **400 / 500 / 700**
- Tracking: open (`letter-spacing: 0.1em` to `0.22em` — depending on size)
- Used for: labels, prices, retailer tags, SKUs, status indicators, ALL CAPS micro-type
- Source: Google Fonts → https://fonts.google.com/specimen/JetBrains+Mono
- License: Open Font License

Loading:
```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

CSS:
```css
font-family: 'JetBrains Mono', monospace;
font-size: 12px;
letter-spacing: 0.18em;
text-transform: uppercase;
```

---

## Type Scale

| Token   | Family       | Weight | Size  | Use                       |
|---------|--------------|--------|-------|---------------------------|
| H1      | Archivo      | 900    | 96 px | Section headings          |
| H2      | Archivo      | 800    | 56 px | Slide titles              |
| H3      | Archivo      | 800    | 32 px | Card titles               |
| Body L  | Inter        | 400    | 24 px | Lead paragraphs           |
| Body M  | Inter        | 400    | 18 px | Default body              |
| Body S  | Inter        | 400    | 14 px | Captions, footnotes       |
| Mono    | JetBrains    | 500    | 14 px | Technical labels (UPPER)  |

---

## Combined loading (paste into any HTML head)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

---

## DO NOT

- Use serifs, condensed faces, or alternate Archivo subfamilies (e.g. Archivo Narrow).
- Apply gradients, drop-shadows or bevels to type.
- Bend, italicize or stretch the wordmark.
- Use Inter for headlines or Archivo for body — keep the roles strict.
