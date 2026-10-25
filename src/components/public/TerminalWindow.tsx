"use client";

import { useI18n } from "@/lib/i18n/context";

/** Dark terminal still shared with the landing laptop. Lazy so it is not the LCP image. */
export default function TerminalWindow() {
  const { t } = useI18n();
  return (
    <figure className="fx-terminal-window">
      <div className="fx-terminal-bar" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <picture>
        <source srcSet="/landing/terminal-desktop.avif" type="image/avif" />
        <source srcSet="/landing/terminal-desktop.webp" type="image/webp" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landing/terminal-desktop.webp"
          alt={t("landing.demo.desktop")}
          width={640}
          height={400}
          sizes="(min-width: 1024px) 560px, 100vw"
          loading="lazy"
          decoding="async"
        />
      </picture>
      <figcaption>
        {t("landing.demo.desktop")}
        <span>{t("landing.demo.illustrative")}</span>
      </figcaption>
    </figure>
  );
}
