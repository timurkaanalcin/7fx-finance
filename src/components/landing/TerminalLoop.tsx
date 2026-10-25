"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { TerminalDesk } from "@/components/landing/LiveMarkets";

export default function TerminalLoop() {
  const { t } = useI18n();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reduce, setReduce] = useState(false);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { rootMargin: "120px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near || reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [near, reduce]);

  const caption = near ? t("landing.desk.note") : reduce ? t("landing.screen.reduced") : t("landing.screen.caption");

  return (
    <section id="screen" className="fx-section" aria-labelledby="screen-title" data-fx-reduced={reduce ? "1" : "0"}>
      <div className="fx-shell">
        <p className="fx-eyebrow inline-flex items-center gap-2">
          <span className="fx-eyebrow-dot" aria-hidden />
          {t("landing.screen.eyebrow")}
        </p>
        <h2 id="screen-title" className="fx-h2 mt-4">
          {t("landing.screen.title")}
        </h2>
        <p className="fx-section-body mt-4 max-w-[640px]">{t("landing.screen.body")}</p>
        <div className="fx-screen" ref={stageRef}>
          <div className="fx-terminal-bar" aria-hidden>
            <span className="fx-terminal-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="fx-terminal-name">{t("landing.live.terminal")}</span>
            <span className="fx-terminal-badge">{t("landing.screen.badge")}</span>
          </div>
          <div className="fx-screen-stage">
            {/* Poster stays in the document. The canvas covers it only while the section is near the viewport. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- static bitmap; next/image would change this layout */}
            <img
              src="/landing/terminal-poster.webp"
              alt={t("landing.screen.poster")}
              width={960}
              height={540}
              loading="lazy"
              decoding="async"
            />
            {near && !reduce ? (
              <canvas ref={canvasRef} className="fx-screen-canvas" aria-hidden />
            ) : null}
            {near ? <TerminalDesk /> : null}
          </div>
          <p className="fx-film-cap">{caption}</p>
        </div>
      </div>
    </section>
  );
}
