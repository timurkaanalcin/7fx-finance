/**
 * Footer/register copy, chat message pages, and calendar page windows.
 * Run: npx tsx tests/round15.test.ts
 */
import assert from "node:assert/strict";
import { translate } from "../src/lib/i18n/dictionaries";
import { PUBLIC_DEFAULT_LOCALE } from "../src/lib/i18n/locales";
import {
  CHAT_MESSAGE_CAP,
  CHAT_MESSAGE_PAGE,
  chatMessageWindow,
  crmPageWindow,
  prependChatMessages,
} from "../src/lib/trader-list";

function main() {
  assert.equal(PUBLIC_DEFAULT_LOCALE, "en");
  assert.equal(translate("en", "landing.footer.features"), "Features");
  assert.equal(translate("en", "landing.partnership"), "in partnership with");
  assert.equal(translate("en", "landing.nav.platform"), "Platform");
  assert.equal(translate("en", "landing.nav.about"), "About");
  assert.equal(translate("en", "term.account"), "Account");
  assert.equal(translate("tr", "landing.footer.features"), "Özellikler");
  assert.equal(translate("tr", "landing.partnership").includes("partnership"), false);
  assert.equal(translate("de", "landing.footer.features"), "Funktionen");
  assert.equal(translate("en", "auth.emailPlaceholder"), "you@email.com");
  assert.equal(translate("en", "auth.emailPlaceholder").includes("ornek"), false);
  assert.equal(translate("en", "auth.phonePlaceholder"), "+1 …");
  assert.equal(translate("en", "auth.continue"), "Continue");
  assert.equal(translate("en", "auth.stepCredentials"), "Email and password");

  assert.deepEqual(chatMessageWindow(null, null), { take: CHAT_MESSAGE_PAGE, skip: 0 });
  assert.deepEqual(chatMessageWindow("200", "40"), { take: CHAT_MESSAGE_CAP, skip: 40 });
  assert.equal(chatMessageWindow("0", "-3").take, CHAT_MESSAGE_PAGE);

  const older = prependChatMessages(
    [
      { id: "b", body: "new" },
      { id: "c", body: "newer" },
    ],
    [
      { id: "a", body: "old" },
      { id: "b", body: "dup" },
    ]
  );
  assert.deepEqual(
    older.map((m) => m.id),
    ["a", "b", "c"]
  );
  assert.equal(older[1].body, "new");

  assert.deepEqual(crmPageWindow("50", "50"), { take: 50, skip: 50 });
  assert.equal(crmPageWindow(null, "10").take, 50);

  console.log("round15 tests passed");
}

main();
