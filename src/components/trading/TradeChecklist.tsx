"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { TRADE_CHECKLIST_KEY, checklistDismissed } from "@/lib/trade-checklist";

type Props = {
  /** Opens the existing deposit sheet. Does not submit it. */
  onDeposit: () => void;
  /** Opens the order ticket so it can be read. Does not send an order. */
  onPreviewTicket: () => void;
};

export default function TradeChecklist({ onDeposit, onPreviewTicket }: Props) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(!checklistDismissed(window.localStorage.getItem(TRADE_CHECKLIST_KEY)));
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(TRADE_CHECKLIST_KEY, "1");
    } catch {
      /* private mode: hide for this view only */
    }
    setVisible(false);
  }

  if (!visible) return null;

  const step =
    "min-h-9 rounded-full border border-desk-border bg-desk-bg px-3 text-left text-[11px] font-medium text-desk-text hover:bg-desk-hover";

  return (
    <aside
      data-fx-checklist=""
      className="shrink-0 border-b border-desk-border bg-desk-panel px-3 py-2.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-desk-text">{t("term.onboard.title")}</p>
          <p className="mt-0.5 text-[11px] font-normal leading-snug text-desk-muted">{t("term.onboard.lead")}</p>
        </div>
        <button
          type="button"
          data-fx-checklist-dismiss=""
          onClick={dismiss}
          className="shrink-0 text-[11px] font-medium text-desk-muted hover:text-desk-text"
        >
          {t("term.onboard.dismiss")}
        </button>
      </div>
      <ol className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-2">
        <li>
          <Link href="/profile" data-fx-checklist-profile="" className={`inline-flex items-center ${step}`}>
            {t("term.onboard.profile")}
          </Link>
        </li>
        <li>
          <button type="button" data-fx-checklist-deposit="" onClick={onDeposit} className={step}>
            {t("term.onboard.deposit")}
          </button>
        </li>
        <li>
          <button type="button" data-fx-checklist-ticket="" onClick={onPreviewTicket} className={step}>
            {t("term.onboard.ticket")}
          </button>
        </li>
      </ol>
    </aside>
  );
}
