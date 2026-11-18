/**
 * Fetch Arabic (Uthmani), EN (Saheeh), BM (Basmeih) for all
 * "Ya ayyuhaladhina amanu" ayat. Writes js/data/ayat-base.json
 */

const REFS = [
  [2, 104], [2, 153], [2, 172], [2, 178], [2, 183], [2, 208], [2, 254], [2, 264], [2, 267], [2, 278], [2, 282],
  [3, 100], [3, 102], [3, 118], [3, 130], [3, 149], [3, 156], [3, 200],
  [4, 19], [4, 29], [4, 43], [4, 59], [4, 71], [4, 94], [4, 135], [4, 136], [4, 144],
  [5, 1], [5, 2], [5, 6], [5, 8], [5, 11], [5, 35], [5, 51], [5, 54], [5, 57], [5, 87], [5, 90], [5, 94], [5, 95], [5, 101], [5, 105], [5, 106],
  [8, 15], [8, 20], [8, 24], [8, 27], [8, 29], [8, 45],
  [9, 23], [9, 28], [9, 34], [9, 38], [9, 119], [9, 123],
  [22, 77],
  [24, 21], [24, 27], [24, 58],
  [33, 9], [33, 41], [33, 49], [33, 53], [33, 56], [33, 69], [33, 70],
  [47, 7], [47, 33],
  [49, 1], [49, 2], [49, 6], [49, 11], [49, 12],
  [57, 28],
  [58, 9], [58, 11], [58, 12],
  [59, 18],
  [60, 1], [60, 10], [60, 13],
  [61, 2], [61, 10], [61, 14],
  [62, 9],
  [63, 9],
  [64, 14],
  [66, 6], [66, 8]
];

const SURAH_NAMES = {
  2: { bm: "Al-Baqarah", en: "Al-Baqarah" },
  3: { bm: "Ali Imran", en: "Ali 'Imran" },
  4: { bm: "An-Nisa", en: "An-Nisa'" },
  5: { bm: "Al-Maidah", en: "Al-Ma'idah" },
  8: { bm: "Al-Anfal", en: "Al-Anfal" },
  9: { bm: "At-Tawbah", en: "At-Tawbah" },
  22: { bm: "Al-Hajj", en: "Al-Hajj" },
  24: { bm: "An-Nur", en: "An-Nur" },
  33: { bm: "Al-Ahzab", en: "Al-Ahzab" },
  47: { bm: "Muhammad", en: "Muhammad" },
  49: { bm: "Al-Hujurat", en: "Al-Hujurat" },
  57: { bm: "Al-Hadid", en: "Al-Hadid" },
  58: { bm: "Al-Mujadilah", en: "Al-Mujadilah" },
  59: { bm: "Al-Hashr", en: "Al-Hashr" },
  60: { bm: "Al-Mumtahanah", en: "Al-Mumtahanah" },
  61: { bm: "As-Saff", en: "As-Saff" },
  62: { bm: "Al-Jumuah", en: "Al-Jumu'ah" },
  63: { bm: "Al-Munafiqun", en: "Al-Munafiqun" },
  64: { bm: "At-Taghabun", en: "At-Taghabun" },
  66: { bm: "At-Tahrim", en: "At-Tahrim" }
};

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "..", "js", "data", "ayat-base.json");

const surahs = [...new Set(REFS.map(([s]) => s))];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function loadSurah(surah) {
  const [ar, en, ms] = await Promise.all([
    fetchJson(`https://quran-json.risanb.com/text/uthmani/chapters/${surah}.json`),
    fetchJson(`https://quran-json.risanb.com/translations/en-saheeh/chapters/${surah}.json`),
    fetchJson(`https://C-Fu.github.io/quran-database-malay/api/surah/${surah}.json`)
  ]);

  const arMap = {};
  const enMap = {};
  const msMap = {};

  (ar.verses || []).forEach((v) => {
    arMap[v.id] = v.text || v.uthmani || v.arabic;
  });
  (en.verses || []).forEach((v) => {
    let t = v.translation || v.text || "";
    // Strip leading "(n) " verse number prefixes common in Saheeh JSON
    t = t.replace(/^\(\d+\)\s*/, "");
    enMap[v.id] = t;
  });
  (ms || []).forEach((v) => {
    msMap[v.ayah] = v.malay;
    if (!arMap[v.ayah] && v.arabic) arMap[v.ayah] = v.arabic;
  });

  return { arMap, enMap, msMap };
}

const cache = {};
for (const s of surahs) {
  process.stdout.write(`Fetching surah ${s}...\n`);
  cache[s] = await loadSurah(s);
}

const rows = REFS.map(([surah, ayah]) => {
  const { arMap, enMap, msMap } = cache[surah];
  const arabic = arMap[ayah];
  const bm = msMap[ayah];
  const en = enMap[ayah];
  if (!arabic || !bm || !en) {
    throw new Error(`Missing text for ${surah}:${ayah} ar=${!!arabic} bm=${!!bm} en=${!!en}`);
  }
  return {
    id: `${surah}-${ayah}`,
    surah,
    surahName: SURAH_NAMES[surah],
    ayah,
    arabic,
    translation: { bm, en }
  };
});

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ count: rows.length, refs: REFS.length, ayat: rows }, null, 2), "utf8");
console.log(`Wrote ${rows.length} ayat -> ${outPath}`);
