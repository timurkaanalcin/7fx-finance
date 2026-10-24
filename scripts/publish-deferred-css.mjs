import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), ".next", "static", "css");
const jobs = [
  ["fx-public-utilities-marker", "fx-public-utilities.css"],
  ["fx-landing-marker", "fx-landing.css"],
];
const found = new Set();
for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith(".css")) continue;
  const text = fs.readFileSync(path.join(dir, name), "utf8");
  for (const [marker, dest] of jobs) {
    if (!text.includes(marker)) continue;
    fs.writeFileSync(path.join(process.cwd(), "public", dest), text);
    found.add(dest);
  }
}
for (const [, dest] of jobs) {
  if (!found.has(dest)) {
    console.error(`missing built css for ${dest}`);
    process.exit(1);
  }
}
console.log("published", [...found].join(", "));
