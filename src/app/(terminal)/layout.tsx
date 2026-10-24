import PresenceHeartbeat from "@/components/presence/PresenceHeartbeat";
import SymbolCatalogSync from "@/components/trading/SymbolCatalogSync";
import ScreenshotShield from "@/components/security/ScreenshotShield";
import PushPromptBanner from "@/components/push/PushPromptBanner";
import ScreenshotGuard from "@/components/security/ScreenshotGuard";

export default function TerminalGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://query1.finance.yahoo.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://query2.finance.yahoo.com" crossOrigin="anonymous" />
      <PresenceHeartbeat />
      <SymbolCatalogSync />
      <ScreenshotGuard />
      <ScreenshotShield />
      <PushPromptBanner />
      {children}
    </>
  );
}
