import PresenceHeartbeat from "@/components/presence/PresenceHeartbeat";
import SymbolCatalogSync from "@/components/trading/SymbolCatalogSync";

export default function TerminalGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PresenceHeartbeat />
      <SymbolCatalogSync />
      {children}
    </>
  );
}
