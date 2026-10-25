import type { CrmxIcon } from "@/lib/crmx/nav";

type Props = { name: CrmxIcon | "menu" | "close"; size?: number };

export default function Icon({ name, size = 18 }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "dashboard") return <svg {...common}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></svg>;
  if (name === "traders") return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5S14 16 14.5 19" /><circle cx="17" cy="9" r="2.2" /><path d="M16 14.6c2.2.3 3.8 1.6 4.4 4" /></svg>;
  if (name === "deposits") return <svg {...common}><path d="M12 4v12" /><path d="M7.5 11.5 12 16l4.5-4.5" /><path d="M5 19.5h14" /></svg>;
  if (name === "withdrawals") return <svg {...common}><path d="M12 16V4" /><path d="M7.5 8.5 12 4l4.5 4.5" /><path d="M5 19.5h14" /></svg>;
  if (name === "tickets") return <svg {...common}><path d="M6 6.5h12v11H6z" /><path d="M9 10h6M9 13.5h4" /></svg>;
  if (name === "transactions") return <svg {...common}><path d="M7 7h11M7 12h11M7 17h11" /><path d="M4 7h.01M4 12h.01M4 17h.01" /></svg>;
  if (name === "positions") return <svg {...common}><path d="M4 16.5 9 11l3 3 7-8" /><path d="M15 6h4v4" /></svg>;
  if (name === "inbox") return <svg {...common}><path d="M4 6.5h16v11H4z" /><path d="M4 6.5 12 13l8-6.5" /></svg>;
  if (name === "settings") return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.2M12 18.3v2.2M4.8 6.2l1.6 1.6M17.6 16.2l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.8 17.8l1.6-1.6M17.6 7.8l1.6-1.6" /></svg>;
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="6" /><path d="M15.5 15.5 20 20" /></svg>;
  if (name === "menu") return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
  return <svg {...common}><path d="M6 6l12 12M18 6 6 18" /></svg>;
}
