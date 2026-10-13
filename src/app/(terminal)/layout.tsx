import PresenceHeartbeat from "@/components/presence/PresenceHeartbeat";
import SymbolCatalogSync from "@/components/trading/SymbolCatalogSync";
import HesapKimligiGate from "@/components/ai/HesapKimligiGate";
import ScreenshotGuard from "@/components/security/ScreenshotGuard";

export default function TerminalGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PresenceHeartbeat />
      <SymbolCatalogSync />
      <ScreenshotGuard />
      <HesapKimligiGate />
      {children}
    </>
  );
}
