"use client";

import SignOutForm from "@/components/auth/SignOutForm";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmNavGroup } from "@/lib/crm-nav";
import { useI18n } from "@/lib/i18n/context";

const PRIMARY = ["/izcrm", "/izcrm/traders", "/izcrm/tickets", "/izcrm/positions"];

type Props = {
  groups: CrmNavGroup[];
  pathname: string | null;
  isActive: (href: string, exact?: boolean) => boolean;
};

/** Phone and tablet CRM: bottom tabs, a More sheet, and card labels on wide tables. */
export default function CrmMobileChrome({ groups, pathname, isActive }: Props) {
  const { t } = useI18n();
  const [more, setMore] = useState(false);
  const flat = groups.flatMap((g) => g.items);
  const primary = PRIMARY.map((href) => flat.find((item) => item.href === href)).filter((item) => item != null);
  const moreItems = flat.filter((item) => !PRIMARY.includes(item.href));

  useEffect(() => {
    setMore(false);
  }, [pathname]);

  useEffect(() => {
    const root = document.querySelector(".fx-crm-main");
    if (!root) return;
    let frame = 0;
    const label = () => {
      root.querySelectorAll("table").forEach((table) => {
        const heads = Array.from(table.querySelectorAll("thead th")).map((th) =>
          (th.textContent || "").replace(/\s+/g, " ").trim()
        );
        table.querySelectorAll("tbody tr").forEach((tr) => {
          Array.from(tr.children).forEach((cell, index) => {
            if (!(cell instanceof HTMLTableCellElement) || cell.tagName !== "TD") return;
            const name = cell.colSpan > 1 ? "" : heads[index] || "";
            if (cell.getAttribute("data-label") !== name) cell.setAttribute("data-label", name);
          });
        });
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(label);
    };
    schedule();
    const obs = new MutationObserver(schedule);
    obs.observe(root, { subtree: true, childList: true, characterData: true });
    return () => {
      cancelAnimationFrame(frame);
      obs.disconnect();
    };
  }, [pathname]);

  return (
    <>
      <nav className="fx-crm-tabbar lg:hidden" aria-label={t("crm.desk")}>
        {primary.map((item) => {
          const active = isActive(item.href, item.exact);
          const className = active ? "is-active" : "";
          if (item.document) {
            return (
              <a key={item.href} href={item.href} className={className}>
                {t(item.labelKey)}
              </a>
            );
          }
          return (
            <Link key={item.href} href={item.href} className={className} aria-current={active ? "page" : undefined}>
              {t(item.labelKey)}
            </Link>
          );
        })}
        <button type="button" className={more ? "is-active" : ""} onClick={() => setMore(true)}>
          {t("crm.nav.more")}
        </button>
      </nav>
      {more && (
        <div className="fx-crm-sheet lg:hidden" role="presentation" onClick={() => setMore(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("crm.nav.more")}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="fx-crm-sheet__bar">
              <h2>{t("crm.nav.more")}</h2>
              <button type="button" onClick={() => setMore(false)}>
                {t("crm.sheet.close")}
              </button>
            </div>
            <div className="fx-crm-sheet__list">
              {groups.map((group) => {
                const items = group.items.filter((item) => moreItems.some((row) => row.href === item.href));
                if (!items.length) return null;
                return (
                  <div key={group.id}>
                    <p className="fx-crm-sheet__group">{t(group.labelKey)}</p>
                    {items.map((item) =>
                      item.document ? (
                        <a key={item.href} href={item.href} onClick={() => setMore(false)}>
                          {t(item.labelKey)}
                        </a>
                      ) : (
                        <Link key={item.href} href={item.href} onClick={() => setMore(false)}>
                          {t(item.labelKey)}
                        </Link>
                      )
                    )}
                  </div>
                );
              })}
              <Link href="/trade" onClick={() => setMore(false)}>
                {t("crm.terminal")}
              </Link>
              <SignOutForm
                label={t("crm.signOut")}
                className="fx-crm-sheet__form"
                buttonClassName="fx-crm-sheet__signout"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
