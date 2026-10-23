/**
 * FX conversion used when a non-USD credit is posted onto the USD trading balance.
 * Run: npx tsx tests/fx-usd.test.ts
 */
import assert from "node:assert/strict";
import {
  appendFxNote,
  convertAmountToUsd,
  fxLedgerNote,
  roundUsd,
  setFxQuoteOverrideForTests,
} from "../src/lib/fx-usd";

function quote(currency: string) {
  if (currency === "TRY") return { unitsPerUsd: 42.15, quote: 42.15, pair: "USDTRY" };
  if (currency === "EUR") return { unitsPerUsd: 1 / 1.08, quote: 1.08, pair: "EURUSD" };
  return null;
}

async function main() {
  setFxQuoteOverrideForTests(quote);
  try {
    const usd = await convertAmountToUsd(10.125, "USD");
    assert.equal(usd.usdAmount, 10.125);
    assert.equal(usd.source, "identity");
    assert.equal(fxLedgerNote(usd), "");

    const tryCredit = await convertAmountToUsd(300000, "TRY");
    assert.equal(tryCredit.usdAmount, 7117.44);
    assert.equal(tryCredit.pair, "USDTRY");
    assert.equal(tryCredit.quote, 42.15);
    assert.match(fxLedgerNote(tryCredit), /300,000\.00 TRY = 7,117\.44 USD @ 42\.1500 USDTRY/);

    const eur = await convertAmountToUsd(100, "EUR");
    assert.equal(eur.usdAmount, 108);
    assert.equal(eur.pair, "EURUSD");

    const neg = await convertAmountToUsd(-300000, "TRY");
    assert.equal(neg.usdAmount, -7117.44);

    assert.equal(roundUsd(-10.126), -10.13);
    assert.equal(roundUsd(10.124), 10.12);
    assert.equal(appendFxNote("CRM deposit approved", tryCredit).includes("300,000.00 TRY"), true);
    assert.equal(appendFxNote("already", usd), "already");

    const noted = appendFxNote("CRM", tryCredit);
    assert.equal(appendFxNote(noted, tryCredit), noted);

    await assert.rejects(() => convertAmountToUsd(10, "XXX"), /Unsupported currency XXX/);
  } finally {
    setFxQuoteOverrideForTests(null);
  }
  console.log("fx-usd tests passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
