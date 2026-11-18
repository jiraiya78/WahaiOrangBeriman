# Wahai Orang Beriman — Agent Context

## Project Overview

Static web app listing Quranic ayat that begin with **يَا أَيُّهَا الَّذِينَ آمَنُوا** (“Wahai orang-orang yang beriman”), with bilingual translation and Ibn Kathir summaries. Visual style mirrors `WebBacaanSolat`. Mobile-first; GitHub Pages ready (no build).

## Current status

**Full set:** 88 ayat that *begin* with يَا أَيُّهَا الَّذِينَ آمَنُوا (33:56 excluded — the address is mid-verse; some lists count 89 including it).

## Tech stack

| Layer | Choice |
|-------|--------|
| HTML | Single `index.html` |
| CSS | Vanilla CSS tokens in `css/styles.css` |
| JS | ES5-compatible IIFE |
| Fonts | Amiri Quran + Plus Jakarta Sans |
| Deploy | Static — GitHub Pages from `main` root |

## File structure

```
WahaiOrangBeriman/
├── context.md
├── index.html
├── css/styles.css
├── scripts/
│   ├── fetch-ayat-base.mjs   # pull Arabic/BM/EN for 89 refs
│   └── build-ayat-js.mjs     # merge base + meta → ayat.js
└── js/
    ├── app.js
    └── data/
        ├── ayat.js           # runtime content (89)
        ├── ayat-base.json    # fetched texts
        └── meta-batch-*.json # guidance + tafsir drafts
```

## UX

1. **Senarai** — ayat grouped by surah; sticky surah chips; row opens detail.
2. **Panduan** (`#ringkasan`) — same grouping; each row shows short guidance BM/EN; tap opens detail.
3. **Detail** — Arab, panduan, terjemahan BM/EN, ringkasan Ibn Kathir BM/EN.
4. **Kembali** — always on detail; returns to Senarai or Panduan (whichever you came from) and restores that scroll.
5. **Toggles BM / EN** — hide either language (at least one must stay on); prefs in `localStorage`.

## Data shape (`APP_AYAT`)

```js
{
  id: "2-153",
  surah: 2,
  surahName: { bm: "Al-Baqarah", en: "Al-Baqarah" },
  ayah: 153,
  arabic: "...",
  translation: { bm: "...", en: "..." },
  guidance: { bm: "...", en: "..." },
  tafsir: { bm: "...", en: "..." }
}
```

## Branding

- Title: Wahai Orang Beriman
- Subtitle: يَا أَيُّهَا الَّذِينَ آمَنُوا · Terjemahan & Ringkasan Ibn Kathir
- Theme: teal / gold on dark green (same family as Bacaan Solat)
