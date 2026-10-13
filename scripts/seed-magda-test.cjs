// Additive only: creates scoped staff magda@7fx.local (1h expiry) + 2 TEST customers assigned to her.
// Never touches existing real customers. Re-runnable: skips customers that already exist.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const p = new PrismaClient();
const PASS = process.env.MAGDA_PASS;
const now = Date.now();
const day = 864e5;
const SYMS = [
  ["EURUSD", 1.085, 1e5, 0.004], ["GBPUSD", 1.27, 1e5, 0.005], ["USDJPY", 149.5, 1e3, 0.6], ["XAUUSD", 2380, 100, 18],
  ["BTCUSD", 64000, 1, 900], ["ETHUSD", 3100, 1, 60], ["USOIL", 78, 1000, 0.9], ["XAGUSD", 29, 5000, 0.35],
];
function rnd(a, b) { return a + Math.random() * (b - a); }
async function main() {
  if (!PASS) throw new Error("MAGDA_PASS missing");
  let magda = await p.user.findUnique({ where: { email: "magda@7fx.local" } });
  const expiresAt = new Date(now + 3600e3);
  if (!magda) {
    magda = await p.user.create({ data: {
      email: "magda@7fx.local", name: "Magdalena", role: "ADMIN", jobTitle: "sales_mgr",
      passwordHash: await bcrypt.hash(PASS, 10), expiresAt, isTest: true,
      canManageUsers: false, canApproveDeposits: false, canEditRates: false, canManageMethods: false, canAdjustBalance: false,
    } });
    console.log("created magda", magda.id);
  } else {
    if (magda.role !== "ADMIN" || magda.jobTitle !== "sales_mgr") throw new Error("magda exists with other role; not touching");
    console.log("magda exists", magda.id, magda.expiresAt);
  }
  const method = await p.depositMethod.findFirst({ orderBy: { sortOrder: "asc" } });
  async function mk(email, name, first, last, bal, created, trades, open, deps, notes, ret) {
    if (await p.user.findUnique({ where: { email } })) { console.log("exists", email); return; }
    const u = await p.user.create({ data: {
      email, name, firstName: first, lastName: last, passwordHash: await bcrypt.hash(require("crypto").randomBytes(18).toString("hex"), 10),
      role: "TRADER", isTest: true, accountType: "TEST", assigneeId: magda.id, assigneeName: magda.name,
      country: "TR", phone: "+900000000000", createdAt: new Date(created), registrationDate: new Date(created),
      retentionStatus: ret, ftd: deps.length > 0, validationStatus: "VALID",
      account: { create: { balance: bal, equity: bal, freeMargin: bal, leverage: 100 } },
    } });
    let b = 0;
    for (const [amt, t] of deps) {
      if (method) await p.depositRequest.create({ data: { userId: u.id, methodId: method.id, amount: amt, status: "APPROVED", note: "TEST deposit", createdAt: new Date(t), reviewedAt: new Date(t + 36e5) } });
      await p.balanceLedger.create({ data: { userId: u.id, type: "DEPOSIT", amount: amt, balanceBefore: b, balanceAfter: b + amt, comment: "TEST deposit", createdAt: new Date(t) } });
      b += amt;
    }
    for (let i = 0; i < trades; i++) {
      const [sym, px, cs, vol] = SYMS[i % SYMS.length];
      const side = Math.random() < 0.55 ? "BUY" : "SELL";
      const lots = sym.includes("BTC") || sym.includes("ETH") ? +rnd(0.05, 0.5).toFixed(2) : +rnd(0.1, 2).toFixed(2);
      const op = px * (1 + rnd(-0.03, 0.03));
      const mv = rnd(-1, 1.25) * vol;
      const cp = op + mv;
      const pnl = +((side === "BUY" ? cp - op : op - cp) * cs * lots * (sym === "USDJPY" ? 1 / 149.5 : 1)).toFixed(2);
      const opened = created + (i + 1) * ((now - created - 3 * day) / (trades + 1));
      const closed = opened + rnd(0.05, 3) * day;
      await p.position.create({ data: { userId: u.id, symbol: sym, side, volume: lots, openPrice: op, currentPrice: cp, closePrice: cp, profit: pnl, closeProfit: pnl, status: "CLOSED", openedAt: new Date(opened), closedAt: new Date(closed) } });
      await p.balanceLedger.create({ data: { userId: u.id, type: "TRADE_PNL", amount: pnl, balanceBefore: b, balanceAfter: b + pnl, comment: `TEST ${sym} ${side}`, createdAt: new Date(closed) } });
      b += pnl;
    }
    if (b !== bal) await p.balanceLedger.create({ data: { userId: u.id, type: "ADJUSTMENT", amount: +(bal - b).toFixed(2), balanceBefore: b, balanceAfter: bal, comment: "TEST balance alignment" } });
    for (const [sym, side, lots] of open) {
      const s = SYMS.find((x) => x[0] === sym);
      await p.position.create({ data: { userId: u.id, symbol: sym, side, volume: lots, openPrice: s[1], currentPrice: s[1], stopLoss: side === "BUY" ? s[1] - 2 * s[3] : s[1] + 2 * s[3], takeProfit: side === "BUY" ? s[1] + 3 * s[3] : s[1] - 3 * s[3], status: "OPEN", openedAt: new Date(now - rnd(0.2, 2) * day) } });
    }
    for (const n of notes) await p.userNote.create({ data: { userId: u.id, authorId: magda.id, authorName: magda.name, body: n } });
    console.log("created", email, u.id);
  }
  await mk("test-pro@7fx.test", "TEST Deneyimli Yatırımcı", "TEST", "Deneyimli", 100000, now - 200 * day, 48,
    [["EURUSD", "BUY", 1.5], ["XAUUSD", "SELL", 0.5], ["BTCUSD", "BUY", 0.2]],
    [[25000, now - 199 * day], [30000, now - 150 * day], [20000, now - 90 * day], [15000, now - 40 * day]],
    ["TEST: Deneyimli yatırımcı, FX + emtia + kripto aktif.", "TEST: Aylık görüşme yapıldı, ek yatırım planlıyor."], "VIP");
  await mk("test-new@7fx.test", "TEST Yeni Yatırımcı", "TEST", "Yeni", 1500, now - 5 * day, 2, [],
    [[1500, now - 5 * day]], ["TEST: Yeni müşteri, ilk yatırım 1.500$. Eğitim araması planlandı."], "NEW");
  console.log("EXPIRES_AT_UTC", (await p.user.findUnique({ where: { email: "magda@7fx.local" } })).expiresAt.toISOString());
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
