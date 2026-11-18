import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "js", "data", "ayat.js");
const code = fs.readFileSync(outPath, "utf8");
const match = code.match(/const APP_AYAT = (\[[\s\S]*\]);?\s*$/);
const ayat = JSON.parse(match[1]);
for (const id of ["5-1", "49-1", "60-1"]) {
  const a = ayat.find((x) => x.id === id);
  console.log("---", id);
  console.log(a.arabic.slice(0, 60));
  console.log([...a.arabic.slice(0, 35)].map((c) => "U+" + c.codePointAt(0).toString(16)).join(" "));
}
