/**
 * Translation corrections for the locale keys added in round 60, and the
 * Arabic document direction used by public pages and CRM.
 * Run: npx tsx tests/round61-rtl-i18n.test.ts
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
  const de = dict("src/lib/i18n/dictionaries/de.ts");
  const ru = dict("src/lib/i18n/dictionaries/ru.ts");
  const ar = dict("src/lib/i18n/dictionaries/ar.ts");
  const tr = dict("src/lib/i18n/dictionaries/tr.ts");
  const en = dict("src/lib/i18n/dictionaries/en.ts");

  const fixed: Array<[Map<string, string>, string, string]> = [
    [de, "term.ot.pendingOk", "Ausstehende Order erstellt"],
    [de, "term.ot.marketNote", "Eine Marktorder wird zum aktuellen Preis ausgeführt; der Preis kann sich ändern."],
    [de, "term.ot.estEntry", "ca. Einstieg"],
    [de, "landing.screen.body", "Eine Vorschau des Terminals. Die Preise kommen aus dem öffentlichen Feed."],
    [de, "gap.nf.title", "Diese Seite gibt es nicht"],
    [ru, "term.ot.estEntry", "Оценка входа"],
    [ru, "term.ot.wrongSide", "Уровень не с той стороны от входа"],
    [ru, "term.ot.slWrong", "Стоп-лосс не с той стороны от входа"],
    [ru, "term.calc.pipValue", "Стоимость пипса"],
    [ru, "term.calc.pips", "Расстояние (пипсы)"],
    [ru, "term.unit.pip", "пипс"],
    [ru, "term.stmt.deposit", "Депозит"],
    [ru, "term.stmt.subtitle", "Закрытые сделки, депозиты и выводы за выбранные даты"],
    [ru, "term.stmt.grossLoss", "Валовой убыток"],
    [ru, "term.stmt.note", "Нарастающий итог складывает сохранённые суммы в каждой валюте: одобренные депозиты, одобренные выводы и результат закрытых сделок. Баланс, кредит, своп и маржа не пересчитываются."],
    [ru, "term.stmt.loading", "Загрузка депозитов и выводов…"],
    [ru, "term.stmt.cashFailed", "Не удалось загрузить депозиты и выводы."],
    [ru, "landing.screen.body", "Предпросмотр терминала. Цены приходят из публичной ленты."],
    [ru, "gap.nf.title", "Этой страницы нет"],
    [ar, "gap.sum.open", "مع مراكز مفتوحة"],
    [ar, "term.err.volumeTooBig", "الحجم يتجاوز حجم المركز"],
    [ar, "term.ot.opened", "تم فتح المركز"],
    [ar, "term.ot.posValue", "قيمة المركز"],
    [ar, "term.kb.tabOpen", "المراكز المفتوحة"],
    [ar, "term.kb.tabClosed", "المراكز المغلقة"],
    [ar, "term.calc.notional", "قيمة المركز"],
    [ar, "landing.screen.body", "معاينة المنصة. الأسعار من التغذية العامة."],
    [ar, "gap.nf.title", "هذه الصفحة غير موجودة"],
    [tr, "gap.nf.title", "Bu sayfa bulunamadı"],
  ];
  assert.equal(fixed.length, 29);
  const ph = /\{[a-zA-Z]+\}/g;
  for (const row of fixed) {
    const table = row[0];
    const key = row[1];
    const value = row[2];
    assert.equal(table.get(key), value, key);
    const want = (en.get(key)!.match(ph) || []).join(",");
    const got = (value.match(ph) || []).join(",");
    assert.equal(got, want, `${key} placeholders`);
  }
  assert.equal(de.get("term.ot.market"), "Markt");
  assert.equal(ru.get("term.deposit"), "Депозит");
  assert.equal(ar.get("term.positions"), "المراكز");
  assert.equal(de.get("term.stmt.deposit"), "Einzahlung");
  assert.equal(ar.get("term.stmt.deposit"), "إيداع");
  assert.equal(tr.get("term.stmt.deposit"), "Yatırım");

  const layout = read("src/app/layout.tsx");
  assert.match(layout, /cookies\(\)\.get\("fx_lang"\)/);
  assert.equal(layout.includes("fx_crm_lang"), false);
  assert.match(layout, /initialLocale=\{locale\}/);

  const ctx = read("src/lib/i18n/context.tsx");
  assert.match(ctx, /document\.documentElement\.dir = meta\.dir/);
  assert.match(ctx, /data-i18n-scope='crm'/);
  assert.match(ctx, /fx_lang=/);
  assert.equal(ctx.includes("[..."), false);

  for (const rel of ["src/app/globals.css", "src/app/base.css"]) {
    const css = read(rel);
    assert.match(css, /html\[dir="rtl"\] \.ml-auto[\s\S]*margin-inline-start: auto/, rel);
    assert.match(css, /html\[dir="rtl"\] \.mr-auto[\s\S]*margin-inline-end: auto/, rel);
    assert.match(css, /html\[dir="rtl"\] \.fx-rtl-flip[\s\S]*transform: scaleX\(-1\)/, rel);
    assert.match(css, /html\[dir="rtl"\] \.tabular-nums[\s\S]*direction: ltr/, rel);
    assert.match(css, /input\[inputmode="email"\]/, rel);
    assert.match(css, /\.tv-lightweight-charts/, rel);
    assert.equal(/font-weight:\s*650|font-weight:\s*700|font-weight:\s*800|font-weight:\s*900/.test(css), false, rel);
  }

  assert.match(read("src/components/auth/AuthShell.tsx"), /fx-rtl-flip/);
  assert.match(read("src/components/trading/PnlCalendar.tsx"), /fx-rtl-flip/);
  assert.match(read("src/app/(terminal)/profile/page.tsx"), /<span className="fx-rtl-flip"/);
  assert.match(read("src/app/(admin)/izcrm/chat/page.tsx"), /className="fx-rtl-flip flex/);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  assert.match(read("src/lib/session-cookie.ts"), /return Array\.from\(domains\)/);
  assert.equal(read("src/lib/session-cookie.ts").includes("[...domains]"), false);

  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies.next, "14.2.35");
  assert.equal(pkg.dependencies.prisma, "5.22.0");

  console.log("round61 rtl i18n tests passed");
}

main();
