"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";
import { keyTargetFromNode, wantsRowOpen } from "@/lib/crm-shortcuts";

/** Visible ring when a list row itself has focus. */
export const CRM_ROW_FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-black";

/** Enter on the row opens its detail. Buttons and money actions keep their own keys. */
export function useCrmRowKeys() {
  const router = useRouter();
  return (href: string) => (e: KeyboardEvent<HTMLElement>) => {
    const node = e.target instanceof HTMLElement ? e.target : null;
    const action = node?.closest("[data-fx-money]")?.getAttribute("data-fx-money") || null;
    if (
      !wantsRowOpen({
        key: e.key,
        repeat: e.repeat,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        target: keyTargetFromNode(e.target),
        rowFocused: e.currentTarget === e.target,
        action,
      })
    ) {
      return;
    }
    e.preventDefault();
    router.push(href);
  };
}
