import type { Metadata } from "next";
import TerminalShell from "@/components/trading/TerminalShell";
import { privateEnglishMetadata } from "@/lib/seo";
import { readTradeSnapshot } from "@/lib/trade-snapshot";

export const metadata: Metadata = privateEnglishMetadata(
  "Trade · 7FX",
  "Charts, orders, and open positions on the 7FX terminal.",
  "/trade"
);

export default async function TradePage() {
  const snapshot = await readTradeSnapshot();
  return (
    <>
      {snapshot?.account ? (
        <link rel="preload" as="image" href="/landing/chart-poster.avif" fetchPriority="high" />
      ) : null}
      <TerminalShell initialUser={snapshot?.user ?? null} initialAccount={snapshot?.account ?? null} />
    </>
  );
}
