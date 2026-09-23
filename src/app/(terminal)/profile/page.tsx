"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Profile = {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  birthDate: string | null;
  language: string;
  timezone: string;
  country: string | null;
  address: string | null;
  accountType: string;
  registrationDate: string | null;
  registrationCountry: string | null;
  isResident: boolean;
  lastLoginAt: string | null;
  tradingServer: string | null;
  tradingGroup: string | null;
  desk: string | null;
  documentsStatus: string;
  balance: number;
  equity: number;
  credit: number;
  bonus: number;
  currency: string;
  retentionStatus: string | null;
  saleStatus: string | null;
  ftd: boolean;
  brokerName: string | null;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#1e293b] py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-100">{value ?? "—"}</span>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("tr");
  const [timezone, setTimezone] = useState("Europe/Istanbul");
  const [address, setAddress] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d?.profile) return;
        setProfile(d.profile);
        setPhone(d.profile.phone || "");
        setLanguage(d.profile.language || "tr");
        setTimezone(d.profile.timezone || "Europe/Istanbul");
        setAddress(d.profile.address || "");
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, language, timezone, address }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Kayıt başarısız");
        return;
      }
      setMsg("Kaydedildi");
      setProfile((p) => (p ? { ...p, phone, language, timezone, address } : p));
    } finally {
      setBusy(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1220] text-slate-400">
        Profil yükleniyor…
      </div>
    );
  }

  const money = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: profile.currency || "USD" });

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <header className="flex h-12 items-center gap-3 border-b border-[#1e293b] bg-[#0f172a] px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-[10px] font-bold">
          M1
        </div>
        <span className="text-sm font-semibold">Üyelik Bilgileri</span>
        <Link
          href="/trade"
          className="ml-auto rounded-md bg-[#1e293b] px-2.5 py-1.5 text-xs hover:bg-[#334155]"
        >
          ← Terminal
        </Link>
      </header>

      <main className="mx-auto max-w-2xl p-4 md:p-6">
        <div className="mb-4 rounded-xl border border-[#1e293b] bg-[#0f172a] p-4">
          <div className="mb-1 text-lg font-semibold">{profile.name}</div>
          <div className="text-xs text-slate-500">{profile.email}</div>
          <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
            <span className="rounded bg-slate-700 px-1.5 py-0.5">{profile.accountType}</span>
            <span
              className={`rounded px-1.5 py-0.5 ${
                profile.active ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
              }`}
            >
              {profile.active ? "Aktif" : "Donduruldu"}
            </span>
            {profile.documentsStatus && profile.documentsStatus !== "NONE" && (
              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-blue-300">
                Belgeler: {profile.documentsStatus}
              </span>
            )}
          </div>
        </div>

        <section className="mb-4 rounded-xl border border-[#1e293b] bg-[#0f172a] p-4">
          <h2 className="mb-2 text-sm font-medium text-slate-300">Kimlik / Hesap</h2>
          <Row label="Ad" value={profile.firstName} />
          <Row label="Soyad" value={profile.lastName} />
          <Row label="Ülke" value={profile.country} />
          <Row
            label="Doğum tarihi"
            value={
              profile.birthDate ? new Date(profile.birthDate).toLocaleDateString("tr-TR") : "—"
            }
          />
          <Row
            label="Kayıt"
            value={
              profile.registrationDate
                ? new Date(profile.registrationDate).toLocaleDateString("tr-TR")
                : "—"
            }
          />
          <Row label="Kayıt ülkesi" value={profile.registrationCountry} />
          <Row label="Yerleşik" value={profile.isResident ? "Evet" : "Hayır"} />
          <Row
            label="Son giriş"
            value={
              profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString("tr-TR") : "—"
            }
          />
          <Row label="Desk" value={profile.desk} />
          <Row label="Server / Group" value={[profile.tradingServer, profile.tradingGroup].filter(Boolean).join(" / ") || "—"} />
          <Row label="Broker" value={profile.brokerName} />
        </section>

        <section className="mb-4 rounded-xl border border-[#1e293b] bg-[#0f172a] p-4">
          <h2 className="mb-2 text-sm font-medium text-slate-300">Finans özeti</h2>
          <Row label="Bakiye" value={money(profile.balance)} />
          <Row label="Özsermaye" value={money(profile.equity)} />
          <Row label="Kredi" value={money(profile.credit)} />
          <Row label="Bonus" value={money(profile.bonus)} />
          <Row label="Para birimi" value={profile.currency} />
        </section>

        <section className="mb-4 rounded-xl border border-[#1e293b] bg-[#0f172a] p-4">
          <h2 className="mb-2 text-sm font-medium text-slate-300">Durum (salt okunur)</h2>
          <Row label="Satış" value={profile.saleStatus} />
          <Row label="Retansiyon" value={profile.retentionStatus} />
          <Row label="FTD" value={profile.ftd ? "Evet" : "Hayır"} />
          <p className="mt-2 text-[10px] text-slate-600">
            CRM durum alanları yalnızca masa tarafından yönetilir; düzenlenemez.
          </p>
        </section>

        <form onSubmit={save} className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-300">Düzenlenebilir alanlar</h2>
          {msg && <p className="mb-2 text-xs text-emerald-400">{msg}</p>}
          <div className="grid gap-3 text-xs sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-slate-500">Telefon</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded border border-[#1e293b] bg-[#0b1220] px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-500">Dil</span>
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded border border-[#1e293b] bg-[#0b1220] px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-slate-500">Saat dilimi</span>
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="rounded border border-[#1e293b] bg-[#0b1220] px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-slate-500">Adres</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded border border-[#1e293b] bg-[#0b1220] px-2 py-1.5"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
          >
            Kaydet
          </button>
        </form>
      </main>
    </div>
  );
}
