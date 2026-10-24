"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export type QuoteRow = {
  symbol: string;
  name: string;
  market: string;
  href: string;
  digits: number;
};

type Tick = { bid: number; ask: number; changePct: number };

function localeTag(locale: string) {
  if (locale === "ar" || locale === "tr" || locale === "de" || locale === "ru") return locale;
  return "en";
}

export default function MarketsLiveTable({ rows }: { rows: QuoteRow[] }) {
  const { t, locale } = useI18n();
  const [ticks, setTicks] = useState<Record<string, Tick>>({});
  const [status, setStatus] = useState<"loading" | "live" | "unavailable">("loading");
  const key = rows.map((row) => row.symbol).join(",");

  useEffect(() => {
    const root = document.getElementById("fx-quote-table");
    if (!root || !key) return;
    let timer = 0;
    let stop = false;
    const symbols = key.split(",");

    async function load() {
      try {
        const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(key)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("quote");
        const body = await res.json();
        const prices = Array.isArray(body.prices) ? body.prices : [];
        const next: Record<string, Tick> = {};
        for (const p of prices) {
          if (!p || typeof p.symbol !== "string" || !symbols.includes(p.symbol)) continue;
          if (typeof p.bid !== "number" || typeof p.ask !== "number") continue;
          next[p.symbol] = { bid: p.bid, ask: p.ask, changePct: Number(p.changePct) };
        }
        if (stop) return;
        if (Object.keys(next).length === 0) {
          setStatus("unavailable");
          return;
        }
        setTicks(next);
        setStatus("live");
      } catch {
        if (!stop) setStatus((prev) => (prev === "live" ? "live" : "unavailable"));
      }
    }

    const arm = () => {
      void load();
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        if (document.visibilityState === "visible") void load();
      }, 20000);
    };
    const disarm = () => window.clearInterval(timer);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) arm();
        else disarm();
      },
      { rootMargin: "160px 0px" }
    );
    io.observe(root);
    return () => {
      stop = true;
      disarm();
      io.disconnect();
    };
  }, [key]);

  const tag = localeTag(locale);
  const px = (n: number, digits: number) =>
    new Intl.NumberFormat(tag, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
  const pct = (n: number) => {
    if (!Number.isFinite(n)) return "—";
    const body = new Intl.NumberFormat(tag, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: "exceptZero",
    }).format(n);
    return `${body}%`;
  };
  const note =
    status === "loading"
      ? t("markets.table.loading")
      : status === "unavailable"
        ? t("markets.table.unavailable")
        : t("markets.table.live");

  return (
    <div className="fx-quote" id="fx-quote-table">
      <p className="fx-quote-status" role="status">
        {note}
      </p>
      <div className="fx-quote-scroll">
        <table>
          <caption>{t("markets.table.caption")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("markets.table.symbol")}</th>
              <th scope="col">{t("markets.table.bid")}</th>
              <th scope="col">{t("markets.table.ask")}</th>
              <th scope="col">{t("markets.table.change")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const tick = ticks[row.symbol];
              const up = tick ? tick.changePct >= 0 : true;
              return (
                <tr key={row.symbol}>
                  <th scope="row">
                    <Link href={row.href} className="fx-quote-sym">
                      {row.symbol}
                    </Link>
                    <span className="fx-quote-name">
                      {row.name}
                      <span className="fx-quote-market"> · {row.market}</span>
                    </span>
                  </th>
                  <td>{tick ? px(tick.bid, row.digits) : "—"}</td>
                  <td>{tick ? px(tick.ask, row.digits) : "—"}</td>
                  <td className={tick ? (up ? "is-up" : "is-down") : undefined}>{tick ? pct(tick.changePct) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
