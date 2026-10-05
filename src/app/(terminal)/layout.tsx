import PresenceHeartbeat from "@/components/presence/PresenceHeartbeat";

export default function TerminalGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PresenceHeartbeat />
      {children}
    </>
  );
}
