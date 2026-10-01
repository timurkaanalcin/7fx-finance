"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Kpis = {
  users: number;
  openPositions: number;
  pendingDeposits: number;
  pendingBalanceRequests: number;
  totalVolume: number;
};

function Card({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: string | number;
  href?: string;
  accent?: string;
}) {
  const inner = (
    <div
      className={`rounded-lg border border-neutral-200 bg-[#ffffff] p-3 shadow-sm ${accent || ""}`}
    >
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="mt-1.5 text-xl font-semibold tabular-nums text-neutral-900">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (r) => {
        if (!r.ok) throw new Error("Yüklenemedi");
        return r.json();
      })
      .then((d) => setKpis(d.kpis))
      .catch(() => setErr("KPI verileri alınamadı"));
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Gösterge Paneli</h1>
        <p className="mt-0.5 text-xs text-neutral-500">
          M1 Finance Desk CRM · Trade engine ile 1:1 Account bağlantısı
        </p>
      </div>
      {err && <p className="mb-3 text-sm text-red-400">{err}</p>}
      {!kpis && !err && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          Yükleniyor…
        </div>
      )}
      {kpis && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Card label="Traderlar" value={kpis.users} href="/admin/traders" />
          <Card label="Açık Pozisyonlar" value={kpis.openPositions} href="/admin/positions" />
          <Card
            label="Bekleyen Yatırmalar"
            value={kpis.pendingDeposits}
            href="/admin/tickets?kind=deposit"
            accent={kpis.pendingDeposits > 0 ? "ring-1 ring-amber-500/40" : ""}
          />
          <Card
            label="Marjin Talepleri"
            value={kpis.pendingBalanceRequests}
            href="/admin/tickets?kind=margin"
            accent={kpis.pendingBalanceRequests > 0 ? "ring-1 ring-amber-500/40" : ""}
          />
          <Card label="Toplam Hacim (lot)" value={Number(kpis.totalVolume).toFixed(2)} />
        </div>
      )}
      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/traders", title: "Traderlar", desc: "Filtreler, üyelik, trading Account" },
          { href: "/admin/tickets", title: "Biletler", desc: "Yatırma + marjin onayı → bakiye" },
          { href: "/admin/positions", title: "Pozisyonlar", desc: "Canlı trade engine pozisyonları" },
          { href: "/admin/desks", title: "Desklar", desc: "Trader / çalışan / analitik stub" },
          { href: "/admin/transactions", title: "Ledger", desc: "Bakiye geçmişi" },
          { href: "/admin/rates", title: "İşlem Oranları", desc: "Spread, komisyon, hacim" },
          { href: "/admin/workers", title: "Çalışanlar", desc: "Admin kullanıcılar ve izinler" },
          { href: "/admin/methods", title: "Yatırma Yöntemleri", desc: "IBAN / kripto" },
        ].map((x) => (
          <Link
            key={x.href}
            href={x.href}
            className="rounded-lg border border-neutral-200 bg-[#ffffff] p-3 transition hover:border-neutral-400"
          >
            <div className="text-xs font-semibold">{x.title}</div>
            <div className="mt-0.5 text-[10px] text-neutral-500">{x.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
