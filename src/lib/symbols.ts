export type AssetClass = "STOCK" | "FX" | "CRYPTO" | "INDEX" | "COMMODITY";

export type SymbolDef = {
  symbol: string;
  name: string;
  class: AssetClass;
  digits: number;
  pipSize: number;
  contractSize: number;
  /** Fallback only when live quote unavailable */
  basePrice: number;
  spread: number;
  /** Yahoo Finance ticker */
  yahoo: string;
  flag?: string;
};

export const SYMBOLS: SymbolDef[] = [
  // —— US equities ——
  { symbol: "AAPL", name: "Apple Inc.", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 220, spread: 0.02, yahoo: "AAPL", flag: "🇺🇸" },
  { symbol: "MSFT", name: "Microsoft Corp.", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 420, spread: 0.02, yahoo: "MSFT", flag: "🇺🇸" },
  { symbol: "GOOGL", name: "Alphabet Inc. Class A", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 175, spread: 0.02, yahoo: "GOOGL", flag: "🇺🇸" },
  { symbol: "AMZN", name: "Amazon.com Inc.", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 185, spread: 0.02, yahoo: "AMZN", flag: "🇺🇸" },
  { symbol: "NVDA", name: "NVIDIA Corp.", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 120, spread: 0.03, yahoo: "NVDA", flag: "🇺🇸" },
  { symbol: "META", name: "Meta Platforms Inc.", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 520, spread: 0.03, yahoo: "META", flag: "🇺🇸" },
  { symbol: "TSLA", name: "Tesla Inc.", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 250, spread: 0.04, yahoo: "TSLA", flag: "🇺🇸" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 210, spread: 0.02, yahoo: "JPM", flag: "🇺🇸" },
  { symbol: "V", name: "Visa Inc.", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 280, spread: 0.02, yahoo: "V", flag: "🇺🇸" },
  { symbol: "JNJ", name: "Johnson & Johnson", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 160, spread: 0.02, yahoo: "JNJ", flag: "🇺🇸" },
  { symbol: "WMT", name: "Walmart Inc.", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 80, spread: 0.02, yahoo: "WMT", flag: "🇺🇸" },
  { symbol: "NFLX", name: "Netflix Inc.", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 700, spread: 0.05, yahoo: "NFLX", flag: "🇺🇸" },
  { symbol: "AMD", name: "Advanced Micro Devices", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 160, spread: 0.03, yahoo: "AMD", flag: "🇺🇸" },
  { symbol: "INTC", name: "Intel Corp.", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 25, spread: 0.02, yahoo: "INTC", flag: "🇺🇸" },
  { symbol: "BAC", name: "Bank of America Corp.", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 40, spread: 0.01, yahoo: "BAC", flag: "🇺🇸" },
  { symbol: "XOM", name: "Exxon Mobil Corp.", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 110, spread: 0.02, yahoo: "XOM", flag: "🇺🇸" },
  { symbol: "KO", name: "Coca-Cola Co.", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 70, spread: 0.01, yahoo: "KO", flag: "🇺🇸" },
  { symbol: "DIS", name: "Walt Disney Co.", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 100, spread: 0.02, yahoo: "DIS", flag: "🇺🇸" },

  // —— BIST (Istanbul) ——
  { symbol: "THYAO", name: "Türk Hava Yolları", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 300, spread: 0.05, yahoo: "THYAO.IS", flag: "🇹🇷" },
  { symbol: "GARAN", name: "Garanti BBVA", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 120, spread: 0.03, yahoo: "GARAN.IS", flag: "🇹🇷" },
  { symbol: "AKBNK", name: "Akbank", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 60, spread: 0.02, yahoo: "AKBNK.IS", flag: "🇹🇷" },
  { symbol: "EREGL", name: "Ereğli Demir Çelik", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 50, spread: 0.02, yahoo: "EREGL.IS", flag: "🇹🇷" },
  { symbol: "BIMAS", name: "BİM Birleşik Mağazalar", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 500, spread: 0.1, yahoo: "BIMAS.IS", flag: "🇹🇷" },
  { symbol: "ASELS", name: "Aselsan", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 80, spread: 0.03, yahoo: "ASELS.IS", flag: "🇹🇷" },
  { symbol: "SISE", name: "Şişecam", class: "STOCK", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 45, spread: 0.02, yahoo: "SISE.IS", flag: "🇹🇷" },

  // —— FX ——
  { symbol: "EURUSD", name: "Euro / US Dollar", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 1.0852, spread: 0.00012, yahoo: "EURUSD=X", flag: "🇪🇺" },
  { symbol: "GBPUSD", name: "British Pound / USD", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 1.2745, spread: 0.00015, yahoo: "GBPUSD=X", flag: "🇬🇧" },
  { symbol: "USDJPY", name: "US Dollar / Yen", class: "FX", digits: 3, pipSize: 0.01, contractSize: 100000, basePrice: 149.85, spread: 0.015, yahoo: "USDJPY=X", flag: "🇯🇵" },
  { symbol: "AUDUSD", name: "Aussie / USD", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 0.6628, spread: 0.00014, yahoo: "AUDUSD=X", flag: "🇦🇺" },
  { symbol: "NZDUSD", name: "Kiwi / USD", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 0.5722, spread: 0.00016, yahoo: "NZDUSD=X", flag: "🇳🇿" },
  { symbol: "USDCAD", name: "USD / Canadian Dollar", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 1.3582, spread: 0.00015, yahoo: "USDCAD=X", flag: "🇨🇦" },
  { symbol: "USDCHF", name: "USD / Swiss Franc", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 0.8845, spread: 0.00014, yahoo: "USDCHF=X", flag: "🇨🇭" },
  { symbol: "EURGBP", name: "Euro / Pound", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 0.8512, spread: 0.00014, yahoo: "EURGBP=X", flag: "🇪🇺" },
  { symbol: "GBPNZD", name: "Pound / Kiwi", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 2.34033, spread: 0.0004, yahoo: "GBPNZD=X", flag: "🇬🇧" },
  { symbol: "EURJPY", name: "Euro / Yen", class: "FX", digits: 3, pipSize: 0.01, contractSize: 100000, basePrice: 162.45, spread: 0.02, yahoo: "EURJPY=X", flag: "🇪🇺" },

  // —— Commodities ——
  { symbol: "XAUUSD", name: "Gold / USD", class: "COMMODITY", digits: 2, pipSize: 0.01, contractSize: 100, basePrice: 2345.5, spread: 0.35, yahoo: "GC=F", flag: "🥇" },
  { symbol: "XAGUSD", name: "Silver / USD", class: "COMMODITY", digits: 3, pipSize: 0.001, contractSize: 5000, basePrice: 28.45, spread: 0.02, yahoo: "SI=F", flag: "🥈" },
  { symbol: "WTIUSD", name: "Crude Oil WTI", class: "COMMODITY", digits: 2, pipSize: 0.01, contractSize: 1000, basePrice: 78.32, spread: 0.04, yahoo: "CL=F", flag: "🛢️" },

  // —— Crypto ——
  { symbol: "BTCUSD", name: "Bitcoin / USD", class: "CRYPTO", digits: 2, pipSize: 1, contractSize: 1, basePrice: 64250, spread: 25, yahoo: "BTC-USD", flag: "₿" },
  { symbol: "ETHUSD", name: "Ethereum / USD", class: "CRYPTO", digits: 2, pipSize: 0.1, contractSize: 1, basePrice: 3450.5, spread: 2.5, yahoo: "ETH-USD", flag: "Ξ" },
  { symbol: "TRXUSD", name: "TRON / USD", class: "CRYPTO", digits: 6, pipSize: 0.000001, contractSize: 1, basePrice: 0.34, spread: 0.0002, yahoo: "TRX-USD", flag: "◆" },
  { symbol: "SOLUSD", name: "Solana / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 150, spread: 0.05, yahoo: "SOL-USD", flag: "◎" },
  { symbol: "XRPUSD", name: "XRP / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.55, spread: 0.0005, yahoo: "XRP-USD", flag: "✕" },

  // —— Indices ——
  { symbol: "US30", name: "Dow Jones 30", class: "INDEX", digits: 1, pipSize: 0.1, contractSize: 1, basePrice: 39850.5, spread: 2.0, yahoo: "^DJI", flag: "🇺🇸" },
  { symbol: "NAS100", name: "Nasdaq 100", class: "INDEX", digits: 1, pipSize: 0.1, contractSize: 1, basePrice: 17820.2, spread: 1.5, yahoo: "^NDX", flag: "🇺🇸" },
  { symbol: "GER40", name: "DAX 40", class: "INDEX", digits: 1, pipSize: 0.1, contractSize: 1, basePrice: 18245.8, spread: 1.2, yahoo: "^GDAXI", flag: "🇩🇪" },
];

export function getSymbol(symbol: string): SymbolDef | undefined {
  return SYMBOLS.find((s) => s.symbol === symbol);
}

export function toYahoo(symbol: string): string | undefined {
  return getSymbol(symbol)?.yahoo;
}

export function formatPrice(symbol: string, price: number): string {
  const def = getSymbol(symbol);
  const digits = def?.digits ?? 5;
  return price.toFixed(digits);
}

export function calcPipDistance(symbol: string, from: number, to: number): number {
  const def = getSymbol(symbol);
  if (!def) return 0;
  return (to - from) / def.pipSize;
}

export function calcProfit(
  symbol: string,
  side: "BUY" | "SELL",
  volume: number,
  openPrice: number,
  currentPrice: number
): number {
  const def = getSymbol(symbol);
  if (!def) return 0;
  const dir = side === "BUY" ? 1 : -1;
  const diff = (currentPrice - openPrice) * dir;
  return diff * def.contractSize * volume;
}

export function calcMargin(
  symbol: string,
  volume: number,
  price: number,
  leverage: number
): number {
  const def = getSymbol(symbol);
  if (!def) return 0;
  return (volume * def.contractSize * price) / leverage;
}
