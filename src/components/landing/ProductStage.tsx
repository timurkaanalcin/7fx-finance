"use client";

import { useI18n } from "@/lib/i18n/context";

function TerminalFilm() {
  const { t } = useI18n();
  return (
    <figure className="fx-film">
      {/* Still only. The looping screen is the canvas section, so this column does not fetch the demo video. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- static bitmap; next/image would change this layout */}
      <img
        src="/landing/terminal-poster.webp"
        alt={t("landing.video.caption")}
        width={960}
        height={540}
        loading="lazy"
        decoding="async"
      />
      <figcaption>{t("landing.video.caption")}</figcaption>
    </figure>
  );
}

export default function ProductStage() {
  const { t } = useI18n();
  const label = t("landing.demo.illustrative");
  return (
    <div className="fx-stage">
      <div className="fx-stage-devices">
        <figure className="fx-laptop">
          <div className="fx-laptop-bar" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <picture>
            <source srcSet="/landing/terminal-desktop.avif" type="image/avif" />
            <source srcSet="/landing/terminal-desktop.webp" type="image/webp" />
            {/* eslint-disable-next-line @next/next/no-img-element -- static bitmap; next/image would change this layout */}
            <img
              src="/landing/terminal-desktop.webp"
              alt={t("landing.demo.desktop")}
              width={640}
              height={400}
              sizes="(min-width: 1024px) 720px, 100vw"
              loading="lazy"
              decoding="async"
            />
          </picture>
          <figcaption>
            {t("landing.demo.desktop")}
            <span>{label}</span>
          </figcaption>
        </figure>
        <figure className="fx-phone">
          <picture>
            <source srcSet="/landing/terminal-mobile.avif" type="image/avif" />
            <source srcSet="/landing/terminal-mobile.webp" type="image/webp" />
            {/* eslint-disable-next-line @next/next/no-img-element -- static bitmap; next/image would change this layout */}
            <img
              src="/landing/terminal-mobile.webp"
              alt={t("landing.demo.mobile")}
              width={360}
              height={780}
              sizes="220px"
              loading="lazy"
              decoding="async"
            />
          </picture>
          <figcaption>
            {t("landing.demo.mobile")}
            <span>{label}</span>
          </figcaption>
        </figure>
      </div>
      <TerminalFilm />
    </div>
  );
}
