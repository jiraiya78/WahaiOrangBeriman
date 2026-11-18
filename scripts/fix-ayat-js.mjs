import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "..", "js", "data", "ayat.js");
const code = fs.readFileSync(outPath, "utf8");
const match = code.match(/const APP_AYAT = (\[[\s\S]*\]);?\s*$/);
if (!match) throw new Error("Could not parse APP_AYAT");

const ayat = JSON.parse(match[1]);
const VOCATIVE = "يَٰٓأَيُّهَا";

let stripped = 0;
for (const a of ayat) {
  const idx = a.arabic.indexOf(VOCATIVE);
  if (idx > 0) {
    a.arabic = a.arabic.slice(idx);
    stripped++;
  }
}

const filtered = ayat.filter((a) => a.id !== "33-56" && a.arabic.startsWith(VOCATIVE));

const header = `/**
 * Ayat yang bermula dengan يَا أَيُّهَا الَّذِينَ آمَنُوا
 * Jumlah: ${filtered.length}.
 * Terjemahan: BM (Abdullah Muhammad Basmeih) + English (Saheeh International).
 * Tafsir: ringkasan gaya Ibn Kathir (BM + EN).
 * Guidance: ringkas 1–2 ayat panduan (BM + EN).
 */

const APP_AYAT = `;

fs.writeFileSync(outPath, header + JSON.stringify(filtered, null, 2) + ";\n", "utf8");
console.log({
  stripped,
  final: filtered.length,
  nonStarters: ayat.filter((a) => !a.arabic.startsWith(VOCATIVE)).map((a) => a.id)
});
