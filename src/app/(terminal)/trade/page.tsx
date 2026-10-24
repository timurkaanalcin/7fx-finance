import TerminalShell from "@/components/trading/TerminalShell";
import { readTradeSnapshot } from "@/lib/trade-snapshot";

export default async function TradePage() {
  const snapshot = await readTradeSnapshot();
  return (
    <>
      {snapshot?.account ? (
        <link rel="preload" as="image" href="/landing/terminal-desktop.avif" fetchPriority="high" />
      ) : null}
      <TerminalShell initialUser={snapshot?.user ?? null} initialAccount={snapshot?.account ?? null} />
    </>
  );
}
