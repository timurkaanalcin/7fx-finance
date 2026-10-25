/**
 * CRM keyboard guards. Pure so tests can prove shortcuts stay quiet in fields
 * and never stand in for approve, reject, or other money actions.
 */

export type KeyTarget = {
  tagName?: string | null;
  inputType?: string | null;
  isContentEditable?: boolean;
  role?: string | null;
};

export type KeyInfo = {
  key: string;
  repeat?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  target: KeyTarget | null;
};

const TYPING_ROLES = new Set(["textbox", "searchbox", "combobox"]);
const NON_TEXT_INPUTS = new Set([
  "button",
  "checkbox",
  "radio",
  "file",
  "hidden",
  "submit",
  "reset",
  "image",
  "range",
  "color",
]);
const ACTIVATOR_TAGS = new Set(["BUTTON", "A", "SELECT", "INPUT", "TEXTAREA"]);
const ACTIVATOR_ROLES = new Set(["button", "link", "menuitem", "option"]);

/** Actions a shortcut must never invoke. Native button activation is separate. */
const MONEY_ACTIONS = new Set(["approve", "reject", "delete", "pay", "adjust", "credit", "debit"]);

export function isTypingTarget(target: KeyTarget | null | undefined): boolean {
  if (!target) return false;
  const tag = String(target.tagName || "").toUpperCase();
  if (tag === "INPUT") {
    const type = String(target.inputType || "text").toLowerCase();
    return !NON_TEXT_INPUTS.has(type);
  }
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  const role = String(target.role || "").toLowerCase();
  return TYPING_ROLES.has(role);
}

function modified(e: KeyInfo): boolean {
  return Boolean(e.repeat || e.metaKey || e.ctrlKey || e.altKey);
}

/** "/" focuses the list search. Quiet while typing and with a modifier. */
export function wantsSearchFocus(e: KeyInfo): boolean {
  if (e.key !== "/" || modified(e)) return false;
  return !isTypingTarget(e.target);
}

/** "?" opens the shortcut sheet. Shift+/ arrives as "?". */
export function wantsShortcutHelp(e: KeyInfo): boolean {
  if (e.key !== "?" || modified(e)) return false;
  return !isTypingTarget(e.target);
}

/** Esc closes an open filter menu. Quiet while a field has the caret. */
export function wantsClosePopover(e: KeyInfo & { popoverOpen?: boolean }): boolean {
  if (e.key !== "Escape" || e.repeat) return false;
  if (!e.popoverOpen) return false;
  return !isTypingTarget(e.target);
}

/**
 * Enter opens the focused row. It does not fire from a field, a button, a link,
 * or anything marked as a money action.
 */
export function wantsRowOpen(
  e: KeyInfo & { rowFocused?: boolean; action?: string | null }
): boolean {
  if (e.key !== "Enter" || modified(e) || e.shiftKey) return false;
  if (!e.rowFocused) return false;
  if (isTypingTarget(e.target)) return false;
  const tag = String(e.target?.tagName || "").toUpperCase();
  if (ACTIVATOR_TAGS.has(tag)) return false;
  const role = String(e.target?.role || "").toLowerCase();
  if (ACTIVATOR_ROLES.has(role)) return false;
  const action = String(e.action || "").toLowerCase();
  if (action && MONEY_ACTIONS.has(action)) return false;
  return true;
}

export function keyTargetFromNode(target: EventTarget | null): KeyTarget {
  if (typeof HTMLElement === "undefined" || !(target instanceof HTMLElement)) return {};
  const inputType = target instanceof HTMLInputElement ? target.type : null;
  return {
    tagName: target.tagName,
    inputType,
    isContentEditable: target.isContentEditable,
    role: target.getAttribute("role"),
  };
}
