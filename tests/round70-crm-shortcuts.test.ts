/**
 * CRM shortcut guards. They must stay quiet in text fields and must not
 * stand in for approve, reject, or other money actions.
 * Run: npx tsx tests/round70-crm-shortcuts.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { listCountKind } from "../src/lib/crm-list-url";
import {
  isTypingTarget,
  wantsClosePopover,
  wantsRowOpen,
  wantsSearchFocus,
  wantsShortcutHelp,
  type KeyInfo,
} from "../src/lib/crm-shortcuts";

function read(rel: string): string {
  return fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
}

function key(partial: Partial<KeyInfo> & { key: string }): KeyInfo {
  return {
    repeat: false,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    target: { tagName: "BODY" },
    ...partial,
  };
}

function main() {
  assert.equal(isTypingTarget({ tagName: "INPUT", inputType: "search" }), true);
  assert.equal(isTypingTarget({ tagName: "INPUT" }), true);
  assert.equal(isTypingTarget({ tagName: "TEXTAREA" }), true);
  assert.equal(isTypingTarget({ tagName: "SELECT" }), true);
  assert.equal(isTypingTarget({ tagName: "DIV", isContentEditable: true }), true);
  assert.equal(isTypingTarget({ tagName: "DIV", role: "textbox" }), true);
  assert.equal(isTypingTarget({ tagName: "INPUT", inputType: "checkbox" }), false);
  assert.equal(isTypingTarget({ tagName: "TR" }), false);
  assert.equal(isTypingTarget(null), false);

  const typing = key({ key: "/", target: { tagName: "INPUT", inputType: "text" } });
  assert.equal(wantsSearchFocus(typing), false);
  assert.equal(wantsShortcutHelp({ ...typing, key: "?" }), false);
  assert.equal(wantsClosePopover({ ...typing, key: "Escape", popoverOpen: true }), false);
  assert.equal(wantsRowOpen({ ...typing, key: "Enter", rowFocused: true }), false);

  assert.equal(wantsSearchFocus(key({ key: "/" })), true);
  assert.equal(wantsSearchFocus(key({ key: "/", ctrlKey: true })), false);
  assert.equal(wantsSearchFocus(key({ key: "/", metaKey: true })), false);
  assert.equal(wantsSearchFocus(key({ key: "/", repeat: true })), false);
  assert.equal(wantsSearchFocus(key({ key: "?" })), false);

  assert.equal(wantsShortcutHelp(key({ key: "?" })), true);
  assert.equal(wantsShortcutHelp(key({ key: "?", altKey: true })), false);
  assert.equal(wantsShortcutHelp(key({ key: "/", shiftKey: true })), false);

  assert.equal(wantsClosePopover(key({ key: "Escape", popoverOpen: true })), true);
  assert.equal(wantsClosePopover(key({ key: "Escape", popoverOpen: false })), false);
  assert.equal(
    wantsClosePopover(key({ key: "Escape", popoverOpen: true, target: { tagName: "INPUT", inputType: "checkbox" } })),
    true
  );

  const row = { rowFocused: true, action: null as string | null };
  assert.equal(wantsRowOpen({ ...key({ key: "Enter", target: { tagName: "TR" } }), ...row }), true);
  assert.equal(wantsRowOpen({ ...key({ key: "Enter", target: { tagName: "BUTTON" } }), ...row }), false);
  assert.equal(wantsRowOpen({ ...key({ key: "Enter", target: { tagName: "A" } }), ...row }), false);
  assert.equal(wantsRowOpen({ ...key({ key: "Enter", shiftKey: true, target: { tagName: "TR" } }), ...row }), false);
  assert.equal(wantsRowOpen({ ...key({ key: "Enter", target: { tagName: "TR" } }), rowFocused: false, action: null }), false);
  for (const action of ["approve", "reject", "delete", "pay", "adjust"]) {
    assert.equal(
      wantsRowOpen({ ...key({ key: "Enter", target: { tagName: "TR" } }), rowFocused: true, action }),
      false,
      action
    );
  }

  assert.equal(listCountKind(0, 0, 0), "empty");
  assert.equal(listCountKind(0, 0, null), "empty");
  assert.equal(listCountKind(1, 9, 9), "showing");
  assert.equal(listCountKind(1, 2, null), "open");
  assert.equal(listCountKind(0, 4, 12), "count");

  const traders = read("src/app/(admin)/izcrm/traders/page.tsx");
  assert.match(traders, /e\.key !== "\/"/);
  assert.match(traders, /href=\{`\/izcrm\/traders\/\$\{u\.id\}`\}/);
  assert.match(traders, /crm\.list\.none/);
  assert.match(traders, /data-fx-list-row/);
  assert.equal(traders.includes("?scope=admin"), false);

  const layout = read("src/app/(admin)/izcrm/layout.tsx");
  assert.match(layout, /<CrmShortcuts \/>/);
  assert.match(layout, /fetch\("\/api\/auth\/me"\)/);
  assert.match(layout, /<NotificationBell \/>/);

  assert.match(read("src/components/crm/CrmListBar.tsx"), /crm\.list\.none/);
  assert.match(read("src/app/(admin)/izcrm/positions/page.tsx"), /crm\.list\.none/);
  assert.equal(read("src/app/(admin)/izcrm/positions/page.tsx").includes("crm.pos.shown"), false);
  assert.match(read("src/app/(admin)/izcrm/deposits/page.tsx"), /data-fx-money="approve"/);
  assert.match(read("src/app/(admin)/izcrm/deposits/page.tsx"), /data-fx-money="reject"/);
  assert.match(read("src/app/(admin)/izcrm/withdrawals/page.tsx"), /data-fx-money="approve"/);
  assert.match(read("src/app/(admin)/izcrm/tickets/page.tsx"), /data-fx-money="reject"/);
  assert.match(read("src/components/crm/MultiSelect.tsx"), /data-fx-filter-popover/);
  assert.match(read("src/lib/i18n/dictionaries/crm-ui.ts"), /crm\.list\.none/);
  assert.match(read("src/lib/i18n/dictionaries/crm-ui.ts"), /crm\.kb\.safe/);
  assert.equal(read("src/app/api/admin/deposits/route.ts").includes("crm-shortcuts"), false);
  assert.equal(read("src/app/api/admin/withdrawals/route.ts").includes("data-fx-money"), false);

  console.log("round70 crm shortcuts ok");
}

main();
