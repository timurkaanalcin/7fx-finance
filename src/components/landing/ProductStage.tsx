"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

function useMediaFlags() {
  const [flags, setFlags] = useState({ reduce: false, mobile: false });
  useEffect(() => {
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileMq = window.matchMedia("(max-width: 767px)");
    const sync = () => setFlags({ reduce: reduceMq.matches, mobile: mobileMq.matches });
    sync();
    reduceMq.addEventListener("change", sync);
    mobileMq.addEventListener("change", sync);
    return () => {
      reduceMq.removeEventListener("change", sync);
      mobileMq.removeEventListener("change", sync);
    };
  }, []);
  return flags;
}

function TerminalFilm() {
  const { t } = useI18n();
  const { reduce, mobile } = useMediaFlags();
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: "240px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  useEffect(() => {
    if (!near || reduce) return;
    const video = videoRef.current;
    if (!video) return;
    const play = video.play();
    if (play) play.catch(() => undefined);
  }, [near, reduce]);

  const poster = "/landing/terminal-poster.webp";
  const caption = t("landing.video.caption");

  if (reduce) {
    return (
      <figure className="fx-film">
        {/* Explicit AVIF/WebP sources; the optimizer is not required for these stills. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={poster} alt={caption} width={960} height={540} loading="lazy" decoding="async" />
        <figcaption>{t("landing.video.reduced")}</figcaption>
      </figure>
    );
  }

  return (
    <div className="fx-film" ref={wrapRef}>
      <video
        ref={videoRef}
        muted
        autoPlay
        loop
        playsInline
        poster={poster}
        preload={mobile ? "none" : "metadata"}
        aria-label={caption}
        width={960}
        height={540}
      >
        {near ? (
          <>
            <source src="/landing/terminal-demo.webm" type="video/webm" />
            <source src="/landing/terminal-demo.mp4" type="video/mp4" />
          </>
        ) : null}
      </video>
      <p className="fx-film-cap">{caption}</p>
    </div>
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/terminal-desktop.webp"
              alt={t("landing.demo.desktop")}
              width={1440}
              height={900}
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/terminal-mobile.webp"
              alt={t("landing.demo.mobile")}
              width={780}
              height={1688}
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
