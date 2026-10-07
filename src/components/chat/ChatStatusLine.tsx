"use client";

import { presenceState } from "@/lib/presence-shared";

export function ChatStatusLine({
  lastSeenAt,
  inChat,
  typing,
  labels,
  className,
}: {
  lastSeenAt?: string | null;
  inChat?: boolean;
  typing?: boolean;
  labels: {
    typing: string;
    inChat: string;
    online: string;
    offline: string;
  };
  className?: string;
}) {
  if (typing) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--accent)] ${className || ""}`}>
        <span className="flex gap-0.5">
          <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
        </span>
        {labels.typing}
      </span>
    );
  }
  if (inChat) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 ${className || ""}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {labels.inChat}
      </span>
    );
  }
  const st = presenceState(lastSeenAt ?? null);
  if (st === "online" || st === "recent") {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 ${className || ""}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${st === "online" ? "bg-emerald-500" : "bg-amber-400"}`} />
        {labels.online}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] text-neutral-400 ${className || ""}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
      {labels.offline}
    </span>
  );
}
