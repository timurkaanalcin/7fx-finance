import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const bin = path.join(root, "node_modules", ".bin", "tailwindcss");
const utilities = path.join(root, "public", "fx-public-utilities.css");
// Compile the public sheet with the CLI so its @config never enters the Next
// PostCSS pass. A shared Tailwind config cache was building the desk sheet
// with the public content list and dropping md:flex / max-w-[420px].
const compiled = spawnSync(
  bin,
  ["-c", "tailwind.public.config.ts", "-i", "src/app/public.css", "-o", utilities, "--minify"],
  {
    cwd: root,
    stdio: "inherit",
    // Tailwind 3.4's CLI bundles a 2024 caniuse snapshot and warns that it is
    // older than six months. The installed caniuse-lite is current; this flag
    // only skips that notice. Prefixes still come from the bundled snapshot.
    env: { ...process.env, BROWSERSLIST_IGNORE_OLD_DATA: "1" },
  }
);
if (compiled.status !== 0) process.exit(compiled.status || 1);
const utilText = fs.readFileSync(utilities, "utf8");
if (!utilText.includes("fx-public-utilities-marker")) {
  console.error("public utilities missing marker");
  process.exit(1);
}
if (utilText.includes("fx-desk-history") || utilText.includes("fx-account-bar")) {
  console.error("public utilities picked up desk css");
  process.exit(1);
}

const dir = path.join(root, ".next", "static", "css");
let landing = "";
for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith(".css")) continue;
  const text = fs.readFileSync(path.join(dir, name), "utf8");
  if (text.includes("fx-landing-marker") && !text.includes("fx-public-utilities-marker")) {
    landing = text;
    break;
  }
}
if (!landing) {
  console.error("missing built css for fx-landing.css");
  process.exit(1);
}
fs.writeFileSync(path.join(root, "public", "fx-landing.css"), landing);
console.log("published fx-public-utilities.css, fx-landing.css");
