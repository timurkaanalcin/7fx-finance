/**
 * Trader detail lazy-loads its tables, and every English dictionary key
 * exists in Turkish, German, Russian, and Arabic.
 * Run: npx tsx tests/round60-i18n-complete.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function dict(rel: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /"((?:[^"\\]|\\.)+)":\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/g;
  const src = read(rel);
  let match: RegExpExecArray | null;
  while ((match = re.exec(src))) out.set(match[1], match[2] ?? match[3]);
  return out;
}

function main() {
  const en = dict("src/lib/i18n/dictionaries/en.ts");
  const locales = ["tr", "de", "ru", "ar"] as const;
  const ph = /\{[a-zA-Z]+\}/g;
  for (const loc of locales) {
    const other = dict(`src/lib/i18n/dictionaries/${loc}.ts`);
    const missing = Array.from(en.keys()).filter((key) => !other.has(key));
    assert.deepEqual(missing, [], `${loc} is missing ${missing.length} English keys: ${missing.slice(0, 8).join(", ")}`);
    for (const pair of Array.from(en)) {
      const key = pair[0];
      const value = pair[1];
      const want = (value.match(ph) || []).join(",");
      const got = (other.get(key)!.match(ph) || []).join(",");
      assert.equal(got, want, `${loc} ${key} placeholders`);
    }
  }
  assert.notEqual(dict("src/lib/i18n/dictionaries/tr.ts").get("gap.spon.title"), en.get("gap.spon.title"));
  assert.notEqual(dict("src/lib/i18n/dictionaries/de.ts").get("gap.crm.exportOff"), en.get("gap.crm.exportOff"));
  assert.notEqual(dict("src/lib/i18n/dictionaries/ru.ts").get("gap.nf.title"), en.get("gap.nf.title"));
  assert.notEqual(dict("src/lib/i18n/dictionaries/ar.ts").get("gap.err.title"), en.get("gap.err.title"));
  assert.equal(en.get("gap.copy.action"), "Copy");
  assert.equal(dict("src/lib/i18n/dictionaries/tr.ts").get("gap.sum.open"), "Açık pozisyonlu");

  const detail = read("src/app/(admin)/izcrm/traders/[id]/page.tsx");
  assert.match(detail, /dynamic\(\(\) => import\("@\/components\/crm\/CrmRecordTable"\)/);
  assert.match(detail, /import\("@\/lib\/symbols"\)/);
  assert.equal(detail.includes('from "@/lib/symbols"'), false);
  assert.match(detail, /import type \{ CrmColumn \} from "@\/components\/crm\/CrmRecordTable"/);
  assert.equal(detail.includes("import CrmRecordTable from"), false);
  assert.equal(detail.includes("import { CrmRecordTable"), false);
  assert.match(detail, /crm\.ui\.copyAccountId/);
  assert.equal(detail.includes("Hesap ID kopyala"), false);

  const copy = read("src/components/crm/CopyButton.tsx");
  assert.match(copy, /gap\.copy\.action/);
  assert.match(copy, /gap\.copy\.done/);
  assert.equal(copy.includes("Kopyalandı"), false);

  assert.equal(read("src/components/crm/CrmSecurityShell.tsx").includes("Salt okunur CRM"), false);
  assert.match(read("src/components/crm/CrmSecurityShell.tsx"), /gap\.crm\.exportOff/);
  assert.equal(read("src/app/(admin)/izcrm/summary/page.tsx").includes("Açık pozisyonlu"), false);
  assert.equal(read("src/app/(admin)/izcrm/workers/page.tsx").includes("7+ gün giriş yok"), false);
  assert.equal(read("src/app/(admin)/izcrm/sponsors/page.tsx").includes("İsim ve logo gerekli"), false);
  assert.equal(read("src/app/(admin)/izcrm/uyelikler/page.tsx").includes("?? T.tr"), false);
  assert.equal(read("src/app/(admin)/izcrm/evrak/page.tsx").includes("?? T.tr"), false);
  assert.match(read("src/app/(admin)/izcrm/uyelikler/page.tsx"), /\?\? T\.en/);
  assert.match(read("src/components/system/ErrorFallback.tsx"), /gap\.err\.title/);
  assert.match(read("src/components/theme/ThemeToggle.tsx"), /gap\.theme\.day/);
  assert.match(read("src/components/system/NotFoundStatus.tsx"), /gap\.nf\.title/);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  assert.match(read("src/lib/session-cookie.ts"), /return Array\.from\(domains\)/);
  assert.equal(read("src/lib/session-cookie.ts").includes("[...domains]"), false);

  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies.next, "14.2.35");
  assert.equal(pkg.dependencies.prisma, "5.22.0");

  console.log("round60 i18n complete tests passed");
}

main();
