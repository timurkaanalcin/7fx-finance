import type { AssetClass } from "@/lib/symbols";

export type PublicPageCopy = { title: string; description: string };

/** Titles and descriptions for the new public routes. English, factual, no performance promises. */
export const MARKETING_COPY: Record<string, PublicPageCopy> = {
  "/markets": {
    title: "Markets on 7FX",
    description:
      "Built-in 7FX symbols cover crypto, forex, commodities, indices, and stocks. Session rules differ by asset class.",
  },
  "/markets/crypto": {
    title: "Crypto markets on 7FX",
    description:
      "Crypto symbols on 7FX are treated as open continuously. The platform does not reject a crypto order because a session is closed.",
  },
  "/markets/forex": {
    title: "Forex markets on 7FX",
    description:
      "Forex symbols on 7FX use a Sunday 22:00 UTC to Friday 22:00 UTC session label. A closed label does not by itself reject a forex order.",
  },
  "/markets/commodities": {
    title: "Commodity markets on 7FX",
    description:
      "Commodity symbols on 7FX use the same session window as forex. A closed label does not by itself reject a commodity order.",
  },
  "/markets/indices": {
    title: "Index markets on 7FX",
    description:
      "Index symbols on 7FX are labeled open during the US cash session or Istanbul weekday hours. A closed label does not by itself reject an index order.",
  },
  "/markets/stocks": {
    title: "Stock markets on 7FX",
    description:
      "US stock orders on 7FX are rejected outside 09:30–16:00 America/New_York on weekdays. BIST names use 10:00–18:00 Europe/Istanbul on weekdays.",
  },
  "/platform": {
    title: "The 7FX platform",
    description:
      "7FX is a multi-asset trading terminal with one account, an order ticket, open positions, and charts. English is the default public language.",
  },
  "/faq": {
    title: "7FX questions",
    description:
      "Answers about 7FX markets, languages, stock sessions, and what this website does and does not claim.",
  },
};

export type AssetPage = {
  slug: string;
  path: string;
  assetClass: AssetClass;
  title: string;
  lede: string;
  session: string[];
};

export const ASSET_PAGES: readonly AssetPage[] = [
  {
    slug: "crypto",
    path: "/markets/crypto",
    assetClass: "CRYPTO",
    title: "Crypto",
    lede: "Crypto pairs in the built-in 7FX catalog are quoted in the trading terminal.",
    session: [
      "The platform treats crypto as open 24 hours a day, including weekends.",
      "A closed-session check does not reject a new crypto order.",
    ],
  },
  {
    slug: "forex",
    path: "/markets/forex",
    assetClass: "FX",
    title: "Forex",
    lede: "Forex pairs in the built-in 7FX catalog are quoted in the trading terminal.",
    session: [
      "The session label follows roughly Sunday 22:00 UTC through Friday 22:00 UTC. Saturday is closed, as is Friday after 22:00 UTC and Sunday before 22:00 UTC.",
      "A closed forex label does not by itself reject a new forex order.",
    ],
  },
  {
    slug: "commodities",
    path: "/markets/commodities",
    assetClass: "COMMODITY",
    title: "Commodities",
    lede: "Commodity symbols in the built-in 7FX catalog are quoted in the trading terminal.",
    session: [
      "The platform uses the same weekly window as forex for the commodity session label.",
      "A closed commodity label does not by itself reject a new commodity order.",
    ],
  },
  {
    slug: "indices",
    path: "/markets/indices",
    assetClass: "INDEX",
    title: "Indices",
    lede: "Cash-index symbols in the built-in 7FX catalog are quoted in the trading terminal.",
    session: [
      "The session label is on when the US regular cash session is open (weekdays 09:30–16:00 America/New_York) or when Istanbul weekday hours 10:00–18:30 are open.",
      "A closed index label does not by itself reject a new index order.",
    ],
  },
  {
    slug: "stocks",
    path: "/markets/stocks",
    assetClass: "STOCK",
    title: "Stocks",
    lede: "US and BIST stock symbols in the built-in 7FX catalog are quoted in the trading terminal.",
    session: [
      "US names follow weekdays 09:30–16:00 America/New_York.",
      "BIST names (Istanbul listings in the catalog) follow weekdays 10:00–18:00 Europe/Istanbul.",
      "A new stock order is rejected when that symbol's session is closed.",
    ],
  },
];

export function assetBySlug(slug: string): AssetPage | undefined {
  return ASSET_PAGES.find((page) => page.slug === slug);
}
