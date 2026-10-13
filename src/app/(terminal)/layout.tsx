import PresenceHeartbeat from "@/components/presence/PresenceHeartbeat";
import SymbolCatalogSync from "@/components/trading/SymbolCatalogSync";
import ScreenshotShield from "@/components/security/ScreenshotShield";
import PushPromptBanner from "@/components/push/PushPromptBanner";
import ScreenshotGuard from "@/components/security/ScreenshotGuard";

export default function TerminalGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PresenceHeartbeat />
      <SymbolCatalogSync />
      <ScreenshotGuard />
      <ScreenshotShield />
      <PushPromptBanner />
      {children}
    </>
  );
}
