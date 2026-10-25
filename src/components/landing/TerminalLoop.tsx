"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type Candle = { o: number; h: number; l: number; c: number };

function seedCandles(): Candle[] {
  const out: Candle[] = [];
  let price = 1.084;
  for (let i = 0; i < 42; i++) {
    const drift = Math.sin(i / 5.5) * 0.0018 + Math.cos(i / 9) * 0.0008;
    const o = price;
    const c = price + drift;
    const h = Math.max(o, c) + 0.0009;
    const l = Math.min(o, c) - 0.0009;
    out.push({ o, h, l, c });
    price = c;
  }
  return out;
}

function draw(canvas: HTMLCanvasElement, candles: Candle[], shift: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w < 2 || h < 2) return;
  const pw = Math.floor(w * dpr);
  const ph = Math.floor(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0b0e13";
  ctx.fillRect(0, 0, w, h);

  const wide = w >= 720;
  const padL = 16;
  const padR = wide ? 196 : 16;
  const padT = 18;
  const padB = 36;
  const cw = Math.max(40, w - padL - padR);
  const ch = Math.max(40, h - padT - padB);
  const slot = cw / candles.length;
  let min = candles[0].l;
  let max = candles[0].h;
  for (const c of candles) {
    if (c.l < min) min = c.l;
    if (c.h > max) max = c.h;
  }
  const span = max - min || 1;
  const y = (v: number) => padT + (1 - (v - min) / span) * ch;

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    const gy = padT + (ch / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padL, gy);
    ctx.lineTo(padL + cw, gy);
    ctx.stroke();
  }

  candles.forEach((c, i) => {
    const x = padL + i * slot - shift;
    if (x < padL - slot || x > padL + cw) return;
    const up = c.c >= c.o;
    const color = up ? "#3ddc97" : "#ef5350";
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.25;
    const mid = x + slot * 0.5;
    ctx.beginPath();
    ctx.moveTo(mid, y(c.h));
    ctx.lineTo(mid, y(c.l));
    ctx.stroke();
    const top = y(Math.max(c.o, c.c));
    const bot = y(Math.min(c.o, c.c));
    ctx.globalAlpha = 0.92;
    ctx.fillRect(x + slot * 0.28, top, Math.max(2, slot * 0.44), Math.max(1.5, bot - top));
    ctx.globalAlpha = 1;
  });

  if (wide) {
    ctx.fillStyle = "#10151d";
    ctx.fillRect(w - 180, 12, 168, h - 24);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.strokeRect(w - 180.5, 12.5, 168, h - 24);
    const rows = [
      ["EURUSD", "1.08421", true],
      ["XAUUSD", "2,341.20", true],
      ["AAPL", "189.42", false],
      ["BTCUSD", "67,420", true],
      ["US30", "39,842", false],
    ] as const;
    ctx.font = "400 11px var(--font-inter), Inter, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    rows.forEach((row, i) => {
      const yy = 40 + i * 36;
      ctx.fillStyle = "#c5cedd";
      ctx.textAlign = "left";
      ctx.fillText(row[0], w - 166, yy);
      ctx.fillStyle = row[2] ? "#3ddc97" : "#ef5350";
      ctx.font = "500 12px var(--font-inter), Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(row[1], w - 26, yy);
      ctx.font = "400 11px var(--font-inter), Inter, system-ui, sans-serif";
    });
  }
}

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
    if (reduce) return;
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { rootMargin: "120px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  useEffect(() => {
    if (!near || reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const candles = seedCandles();
    let frame = 0;
    let last = 0;
    let shift = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(32, now - last) : 16;
      last = now;
      shift += dt * 0.012;
      const slot = Math.max(8, canvas.clientWidth / 48);
      if (shift >= slot) {
        shift -= slot;
        const prev = candles[candles.length - 1];
        const drift = Math.sin(now / 900) * 0.0012;
        const o = prev.c;
        const c = o + drift;
        candles.shift();
        candles.push({
          o,
          c,
          h: Math.max(o, c) + 0.0007,
          l: Math.min(o, c) - 0.0007,
        });
      }
      draw(canvas, candles, shift);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [near, reduce]);

  const caption = reduce ? t("landing.screen.reduced") : t("landing.screen.caption");

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
          </div>
          <p className="fx-film-cap">{caption}</p>
        </div>
      </div>
    </section>
  );
}
