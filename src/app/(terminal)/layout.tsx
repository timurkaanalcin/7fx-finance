import PresenceHeartbeat from "@/components/presence/PresenceHeartbeat";
import SymbolCatalogSync from "@/components/trading/SymbolCatalogSync";
import ScreenshotGuard from "@/components/security/ScreenshotGuard";

export default function TerminalGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PresenceHeartbeat />
      <SymbolCatalogSync />
      <ScreenshotGuard />
      {children}
    </>
  );
}
