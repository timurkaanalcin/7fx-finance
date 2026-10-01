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
  { symbol: "USDTRY", name: "US Dollar / Turkish Lira", class: "FX", digits: 4, pipSize: 0.0001, contractSize: 100000, basePrice: 34.25, spread: 0.02, yahoo: "TRY=X", flag: "🇹🇷" },
  { symbol: "EURTRY", name: "Euro / Turkish Lira", class: "FX", digits: 4, pipSize: 0.0001, contractSize: 100000, basePrice: 37.15, spread: 0.025, yahoo: "EURTRY=X", flag: "🇹🇷" },
  { symbol: "GBPTRY", name: "Pound / Turkish Lira", class: "FX", digits: 4, pipSize: 0.0001, contractSize: 100000, basePrice: 43.55, spread: 0.03, yahoo: "GBPTRY=X", flag: "🇹🇷" },

  // —— Commodities (Yahoo futures — verified) ——
  { symbol: "XAUUSD", name: "Gold / USD", class: "COMMODITY", digits: 2, pipSize: 0.01, contractSize: 100, basePrice: 4200, spread: 0.35, yahoo: "GC=F", flag: "🥇" },
  { symbol: "XAGUSD", name: "Silver / USD", class: "COMMODITY", digits: 3, pipSize: 0.001, contractSize: 5000, basePrice: 61, spread: 0.02, yahoo: "SI=F", flag: "🥈" },
  { symbol: "XPTUSD", name: "Platinum / USD", class: "COMMODITY", digits: 2, pipSize: 0.01, contractSize: 50, basePrice: 1730, spread: 0.8, yahoo: "PL=F", flag: "⚪" },
  { symbol: "XPDUSD", name: "Palladium / USD", class: "COMMODITY", digits: 2, pipSize: 0.01, contractSize: 100, basePrice: 1200, spread: 1.2, yahoo: "PA=F", flag: "🔘" },
  { symbol: "WTIUSD", name: "Crude Oil WTI", class: "COMMODITY", digits: 2, pipSize: 0.01, contractSize: 1000, basePrice: 91, spread: 0.04, yahoo: "CL=F", flag: "🛢️" },
  { symbol: "UKOIL", name: "Crude Oil Brent", class: "COMMODITY", digits: 2, pipSize: 0.01, contractSize: 1000, basePrice: 99, spread: 0.05, yahoo: "BZ=F", flag: "🛢️" },
  { symbol: "NATGAS", name: "Natural Gas", class: "COMMODITY", digits: 3, pipSize: 0.001, contractSize: 10000, basePrice: 3.0, spread: 0.01, yahoo: "NG=F", flag: "🔥" },
  { symbol: "COPPER", name: "Copper", class: "COMMODITY", digits: 4, pipSize: 0.0001, contractSize: 25000, basePrice: 6.6, spread: 0.002, yahoo: "HG=F", flag: "🟠" },
  { symbol: "ALUMINUM", name: "Aluminum", class: "COMMODITY", digits: 2, pipSize: 0.01, contractSize: 25, basePrice: 3270, spread: 1.5, yahoo: "ALI=F", flag: "⬜" },
  { symbol: "CORN", name: "Corn", class: "COMMODITY", digits: 2, pipSize: 0.25, contractSize: 50, basePrice: 501, spread: 0.5, yahoo: "ZC=F", flag: "🌽" },
  { symbol: "WHEAT", name: "Wheat", class: "COMMODITY", digits: 2, pipSize: 0.25, contractSize: 50, basePrice: 677, spread: 0.75, yahoo: "ZW=F", flag: "🌾" },
  { symbol: "SOYBEAN", name: "Soybeans", class: "COMMODITY", digits: 2, pipSize: 0.25, contractSize: 50, basePrice: 1289, spread: 1.0, yahoo: "ZS=F", flag: "🫘" },
  { symbol: "COFFEE", name: "Coffee", class: "COMMODITY", digits: 2, pipSize: 0.05, contractSize: 375, basePrice: 290, spread: 0.15, yahoo: "KC=F", flag: "☕" },
  { symbol: "SUGAR", name: "Sugar", class: "COMMODITY", digits: 2, pipSize: 0.01, contractSize: 1120, basePrice: 18.6, spread: 0.03, yahoo: "SB=F", flag: "🍬" },
  { symbol: "COCOA", name: "Cocoa", class: "COMMODITY", digits: 0, pipSize: 1, contractSize: 10, basePrice: 5340, spread: 8, yahoo: "CC=F", flag: "🍫" },
  { symbol: "COTTON", name: "Cotton", class: "COMMODITY", digits: 2, pipSize: 0.01, contractSize: 500, basePrice: 79, spread: 0.08, yahoo: "CT=F", flag: "🧵" },
  { symbol: "HEATOIL", name: "Heating Oil", class: "COMMODITY", digits: 4, pipSize: 0.0001, contractSize: 42000, basePrice: 4.73, spread: 0.002, yahoo: "HO=F", flag: "⛽" },
  { symbol: "GASOLINE", name: "RBOB Gasoline", class: "COMMODITY", digits: 4, pipSize: 0.0001, contractSize: 42000, basePrice: 3.28, spread: 0.002, yahoo: "RB=F", flag: "⛽" },
  { symbol: "RICE", name: "Rough Rice", class: "COMMODITY", digits: 3, pipSize: 0.005, contractSize: 2000, basePrice: 16.1, spread: 0.02, yahoo: "ZR=F", flag: "🍚" },

  // —— Crypto (Yahoo CRYPTOCURRENCY — verified) ——
  { symbol: "BTCUSD", name: "Bitcoin / USD", class: "CRYPTO", digits: 2, pipSize: 1, contractSize: 1, basePrice: 83600, spread: 25, yahoo: "BTC-USD", flag: "₿" },
  { symbol: "ETHUSD", name: "Ethereum / USD", class: "CRYPTO", digits: 2, pipSize: 0.1, contractSize: 1, basePrice: 2690, spread: 2.5, yahoo: "ETH-USD", flag: "Ξ" },
  { symbol: "BNBUSD", name: "BNB / USD", class: "CRYPTO", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 766, spread: 0.4, yahoo: "BNB-USD", flag: "🟡" },
  { symbol: "SOLUSD", name: "Solana / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 118, spread: 0.05, yahoo: "SOL-USD", flag: "◎" },
  { symbol: "XRPUSD", name: "XRP / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 1.49, spread: 0.0005, yahoo: "XRP-USD", flag: "✕" },
  { symbol: "ADAUSD", name: "Cardano / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.25, spread: 0.0002, yahoo: "ADA-USD", flag: "🔷" },
  { symbol: "DOGEUSD", name: "Dogecoin / USD", class: "CRYPTO", digits: 6, pipSize: 0.000001, contractSize: 1, basePrice: 0.095, spread: 0.00005, yahoo: "DOGE-USD", flag: "🐕" },
  { symbol: "TRXUSD", name: "TRON / USD", class: "CRYPTO", digits: 6, pipSize: 0.000001, contractSize: 1, basePrice: 0.337, spread: 0.0002, yahoo: "TRX-USD", flag: "◆" },
  { symbol: "AVAXUSD", name: "Avalanche / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 11.0, spread: 0.02, yahoo: "AVAX-USD", flag: "🔺" },
  { symbol: "DOTUSD", name: "Polkadot / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 1.24, spread: 0.002, yahoo: "DOT-USD", flag: "⚫" },
  { symbol: "LINKUSD", name: "Chainlink / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 14.3, spread: 0.02, yahoo: "LINK-USD", flag: "🔗" },
  { symbol: "POLUSD", name: "Polygon / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.113, spread: 0.0002, yahoo: "POL28321-USD", flag: "🟣" },
  { symbol: "LTCUSD", name: "Litecoin / USD", class: "CRYPTO", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 67, spread: 0.08, yahoo: "LTC-USD", flag: "Ł" },
  { symbol: "ATOMUSD", name: "Cosmos / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 1.77, spread: 0.003, yahoo: "ATOM-USD", flag: "⚛️" },
  { symbol: "UNIUSD", name: "Uniswap / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 8.84, spread: 0.015, yahoo: "UNI7083-USD", flag: "🦄" },
  { symbol: "APTUSD", name: "Aptos / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 0.78, spread: 0.002, yahoo: "APT21794-USD", flag: "🅰" },
  { symbol: "ARBUSD", name: "Arbitrum / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.202, spread: 0.0003, yahoo: "ARB11841-USD", flag: "🔵" },
  { symbol: "OPUSD", name: "Optimism / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.13, spread: 0.0003, yahoo: "OP-USD", flag: "🔴" },
  { symbol: "SUIUSD", name: "Sui / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 1.16, spread: 0.002, yahoo: "SUI20947-USD", flag: "💧" },
  { symbol: "NEARUSD", name: "NEAR Protocol / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 5.39, spread: 0.01, yahoo: "NEAR-USD", flag: "Ⓝ" },
  { symbol: "TONUSD", name: "Toncoin / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 1.51, spread: 0.003, yahoo: "TON11419-USD", flag: "💎" },
  { symbol: "BCHUSD", name: "Bitcoin Cash / USD", class: "CRYPTO", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 306, spread: 0.4, yahoo: "BCH-USD", flag: "฿" },
  { symbol: "XLMUSD", name: "Stellar / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.225, spread: 0.0002, yahoo: "XLM-USD", flag: "✦" },
  { symbol: "FILUSD", name: "Filecoin / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 1.03, spread: 0.002, yahoo: "FIL-USD", flag: "📁" },
  { symbol: "ETCUSD", name: "Ethereum Classic / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 8.96, spread: 0.015, yahoo: "ETC-USD", flag: "⟠" },
  { symbol: "ICPUSD", name: "Internet Computer / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 3.33, spread: 0.008, yahoo: "ICP-USD", flag: "∞" },
  { symbol: "AAVEUSD", name: "Aave / USD", class: "CRYPTO", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 166, spread: 0.25, yahoo: "AAVE-USD", flag: "👻" },
  { symbol: "MKRUSD", name: "Maker / USD", class: "CRYPTO", digits: 2, pipSize: 0.1, contractSize: 1, basePrice: 1820, spread: 2.5, yahoo: "MKR-USD", flag: "Ⓜ" },
  { symbol: "INJUSD", name: "Injective / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 7.56, spread: 0.015, yahoo: "INJ-USD", flag: "💉" },
  { symbol: "ALGOUSD", name: "Algorand / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.128, spread: 0.00015, yahoo: "ALGO-USD", flag: "△" },
  { symbol: "SHIBUSD", name: "Shiba Inu / USD", class: "CRYPTO", digits: 9, pipSize: 1e-9, contractSize: 1, basePrice: 5.76e-6, spread: 5e-9, yahoo: "SHIB-USD", flag: "🐕" },
  { symbol: "PEPEUSD", name: "Pepe / USD", class: "CRYPTO", digits: 10, pipSize: 1e-10, contractSize: 1, basePrice: 4.34e-6, spread: 5e-9, yahoo: "PEPE24478-USD", flag: "🐸" },
  { symbol: "RENDERUSD", name: "Render / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 1.91, spread: 0.003, yahoo: "RENDER-USD", flag: "🎨" },
  { symbol: "SEIUSD", name: "Sei / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.074, spread: 0.0001, yahoo: "SEI-USD", flag: "🌊" },
  { symbol: "TIAUSD", name: "Celestia / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 0.447, spread: 0.001, yahoo: "TIA-USD", flag: "✨" },
  { symbol: "HBARUSD", name: "Hedera / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.105, spread: 0.00015, yahoo: "HBAR-USD", flag: "ℏ" },

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
