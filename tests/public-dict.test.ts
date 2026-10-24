/**
 * Public pages keep terminal feed strings and do not need the CRM dictionary
 * until the CRM layout registers it.
 * Run: npx tsx tests/public-dict.test.ts
 */
import "./preload-dicts";
import assert from "node:assert/strict";
import { translate } from "../src/lib/i18n/dictionaries";
import { registerCrmDicts } from "../src/lib/i18n/dictionaries/crm-registry";
import { CRM_UI } from "../src/lib/i18n/dictionaries/crm-ui";

function main() {
  assert.equal(translate("tr", "term.feed.live"), "Canlı");
  assert.equal(translate("en", "term.feed.retry"), "Retry");
  assert.equal(translate("de", "common.signIn") === "crm.ui.save", false);
  assert.equal(translate("tr", "crm.ui.save"), "crm.ui.save");
  registerCrmDicts(CRM_UI);
  assert.equal(translate("tr", "crm.ui.save"), "Kaydet");
  assert.equal(translate("en", "crm.ui.cancel"), "Cancel");
  assert.equal(translate("ar", "term.feed.dismiss"), "إغلاق");
  console.log("public-dict tests passed");
}

main();
