"use client";

import { useEffect, useRef } from "react";

/**
 * Muted hero backdrop. It is not an image, so it cannot become the LCP element.
 * The paint loop waits until the canvas is on screen and stops when motion is reduced.
 */
export default function HeroAtmosphere() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let frame = 0;
    let running = false;

    const paint = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      const pw = Math.max(1, Math.floor(w * dpr));
      const ph = Math.max(1, Math.floor(h * dpr));
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.045)";
      ctx.lineWidth = 1;
      const gap = 48;
      for (let x = 0; x <= w; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += gap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      const drift = reduce.matches ? 0 : frame * 0.35;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const y = h * 0.62 + Math.sin((x + drift) / 90) * 18 + Math.cos((x + drift) / 40) * 6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(61,220,151,0.28)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (!reduce.matches && running) {
        frame += 1;
        raf = requestAnimationFrame(paint);
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      paint();
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) start();
      else stop();
    });
    io.observe(canvas);
    const onReduce = () => {
      cancelAnimationFrame(raf);
      paint();
    };
    reduce.addEventListener("change", onReduce);
    return () => {
      stop();
      io.disconnect();
      reduce.removeEventListener("change", onReduce);
    };
  }, []);

  return <canvas ref={ref} className="fx-hero-atmo" aria-hidden />;
}
