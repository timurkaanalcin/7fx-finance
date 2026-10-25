"use client";

import { useState } from "react";
import { symbolLogoUrl } from "@/lib/symbol-logo";

type Props = {
  symbol: string;
  /** Emoji / letter fallback when no logo file */
  fallback?: string;
  size?: number;
  className?: string;
};

/**
 * Renders the official-ish logo from /public/logos when available,
 * otherwise the emoji/flag fallback (or a letter chip).
 */
export default function SymbolIcon({
  symbol,
  fallback,
  size = 20,
  className = "",
}: Props) {
  const url = symbolLogoUrl(symbol);
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    const letter = (fallback && fallback.trim()) || symbol.slice(0, 2);
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-desk-bg text-[10px] font-semibold leading-none text-desk-muted ring-1 ring-desk-border/40 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        {letter.length <= 3 ? letter : symbol.slice(0, 1)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static bitmap; next/image would change this layout
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      className={`inline-block shrink-0 rounded-full object-cover ring-1 ring-desk-border/30 ${className}`}
      style={{ width: size, height: size }}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
