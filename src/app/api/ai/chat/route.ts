import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { membershipState } from "@/lib/ai-membership";

export const dynamic = "force-dynamic";
const H = { "Cache-Control": "no-store" };

const SYSTEM = `You are "7FX AI", the in-app assistant of the 7FX trading platform. Reply in the user's language (Turkish, English, Russian, Arabic or German), concisely.
You can explain trading concepts (lots, leverage, margin, spread, stop loss, take profit, risk/reward), platform features (watchlist, favourites, price alerts, order ticket, history filters, CSV export, deposits/withdrawals, documents, live support) and general market terminology.
Rules: never invent account balances, positions, personal data, licences, regulators or guaranteed returns. No personalised investment advice or buy/sell signals; add a short risk reminder when discussing trades. For account-specific issues, direct the user to Live Support in Profile.`;

const rate = new Map<string, number[]>();

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: H });
  const st = await membershipState(user);
  if (!st.active) return NextResponse.json({ error: "membership_required" }, { status: 402, headers: H });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "ai_not_configured" }, { status: 503, headers: H });

  const now = Date.now();
  const hits = (rate.get(user.id) || []).filter((t) => now - t < 60_000);
  if (!st.unlimited && hits.length >= 15) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: H });
  hits.push(now); rate.set(user.id, hits);

  const body = (await req.json().catch(() => ({}))) as { messages?: { role: string; content: string }[] };
  const msgs = (body.messages || [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return NextResponse.json({ error: "bad_request" }, { status: 400, headers: H });
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 30_000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: ctl.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.AI_ASSISTANT_MODEL || process.env.SUPPORT_AI_MODEL || "gpt-4.1-mini", temperature: 0.4, max_tokens: 700, messages: [{ role: "system", content: SYSTEM }, ...msgs] }),
    });
    clearTimeout(t);
    if (!res.ok) {
      console.error("[ai-chat] upstream", res.status);
      return NextResponse.json({ error: "upstream" }, { status: 502, headers: H });
    }
    const d = await res.json();
    const reply = String(d.choices?.[0]?.message?.content || "").trim();
    return NextResponse.json({ reply }, { headers: H });
  } catch (e) {
    console.error("[ai-chat]", e);
    return NextResponse.json({ error: "upstream" }, { status: 502, headers: H });
  }
}
