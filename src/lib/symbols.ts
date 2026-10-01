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

  // —— FX majors + liquid crosses + TRY / liquid exotics (Yahoo =X verified) ——
  { symbol: "EURUSD", name: "Euro / US Dollar", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 1.0852, spread: 0.00012, yahoo: "EURUSD=X", flag: "🇪🇺" },
  { symbol: "GBPUSD", name: "British Pound / USD", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 1.2745, spread: 0.00015, yahoo: "GBPUSD=X", flag: "🇬🇧" },
  { symbol: "USDJPY", name: "US Dollar / Yen", class: "FX", digits: 3, pipSize: 0.01, contractSize: 100000, basePrice: 149.85, spread: 0.015, yahoo: "USDJPY=X", flag: "🇯🇵" },
  { symbol: "AUDUSD", name: "Aussie / USD", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 0.6628, spread: 0.00014, yahoo: "AUDUSD=X", flag: "🇦🇺" },
  { symbol: "NZDUSD", name: "Kiwi / USD", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 0.5722, spread: 0.00016, yahoo: "NZDUSD=X", flag: "🇳🇿" },
  { symbol: "USDCAD", name: "USD / Canadian Dollar", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 1.3582, spread: 0.00015, yahoo: "USDCAD=X", flag: "🇨🇦" },
  { symbol: "USDCHF", name: "USD / Swiss Franc", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 0.8845, spread: 0.00014, yahoo: "USDCHF=X", flag: "🇨🇭" },
  { symbol: "EURGBP", name: "Euro / Pound", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 0.8512, spread: 0.00014, yahoo: "EURGBP=X", flag: "🇪🇺" },
  { symbol: "EURJPY", name: "Euro / Yen", class: "FX", digits: 3, pipSize: 0.01, contractSize: 100000, basePrice: 162.45, spread: 0.02, yahoo: "EURJPY=X", flag: "🇪🇺" },
  { symbol: "GBPJPY", name: "Pound / Yen", class: "FX", digits: 3, pipSize: 0.01, contractSize: 100000, basePrice: 209.5, spread: 0.03, yahoo: "GBPJPY=X", flag: "🇬🇧" },
  { symbol: "EURCHF", name: "Euro / Swiss Franc", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 0.942, spread: 0.00018, yahoo: "EURCHF=X", flag: "🇪🇺" },
  { symbol: "EURCAD", name: "Euro / Canadian Dollar", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 1.609, spread: 0.0002, yahoo: "EURCAD=X", flag: "🇪🇺" },
  { symbol: "EURAUD", name: "Euro / Aussie", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 1.628, spread: 0.00022, yahoo: "EURAUD=X", flag: "🇪🇺" },
  { symbol: "EURNZD", name: "Euro / Kiwi", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 2.013, spread: 0.0003, yahoo: "EURNZD=X", flag: "🇪🇺" },
  { symbol: "GBPCHF", name: "Pound / Swiss Franc", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 1.104, spread: 0.00022, yahoo: "GBPCHF=X", flag: "🇬🇧" },
  { symbol: "GBPCAD", name: "Pound / Canadian Dollar", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 1.884, spread: 0.00025, yahoo: "GBPCAD=X", flag: "🇬🇧" },
  { symbol: "GBPAUD", name: "Pound / Aussie", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 1.907, spread: 0.00028, yahoo: "GBPAUD=X", flag: "🇬🇧" },
  { symbol: "GBPNZD", name: "Pound / Kiwi", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 2.34033, spread: 0.0004, yahoo: "GBPNZD=X", flag: "🇬🇧" },
  { symbol: "AUDJPY", name: "Aussie / Yen", class: "FX", digits: 3, pipSize: 0.01, contractSize: 100000, basePrice: 109.9, spread: 0.025, yahoo: "AUDJPY=X", flag: "🇦🇺" },
  { symbol: "AUDNZD", name: "Aussie / Kiwi", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 1.236, spread: 0.00025, yahoo: "AUDNZD=X", flag: "🇦🇺" },
  { symbol: "AUDCAD", name: "Aussie / Canadian Dollar", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 0.988, spread: 0.00022, yahoo: "AUDCAD=X", flag: "🇦🇺" },
  { symbol: "AUDCHF", name: "Aussie / Swiss Franc", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 0.579, spread: 0.00022, yahoo: "AUDCHF=X", flag: "🇦🇺" },
  { symbol: "NZDJPY", name: "Kiwi / Yen", class: "FX", digits: 3, pipSize: 0.01, contractSize: 100000, basePrice: 88.9, spread: 0.03, yahoo: "NZDJPY=X", flag: "🇳🇿" },
  { symbol: "CADJPY", name: "Canadian Dollar / Yen", class: "FX", digits: 3, pipSize: 0.01, contractSize: 100000, basePrice: 111.2, spread: 0.025, yahoo: "CADJPY=X", flag: "🇨🇦" },
  { symbol: "CHFJPY", name: "Swiss Franc / Yen", class: "FX", digits: 3, pipSize: 0.01, contractSize: 100000, basePrice: 189.9, spread: 0.03, yahoo: "CHFJPY=X", flag: "🇨🇭" },
  { symbol: "CADCHF", name: "Canadian Dollar / Swiss Franc", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 0.586, spread: 0.00022, yahoo: "CADCHF=X", flag: "🇨🇦" },
  { symbol: "NZDCAD", name: "Kiwi / Canadian Dollar", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 0.799, spread: 0.00025, yahoo: "NZDCAD=X", flag: "🇳🇿" },
  { symbol: "NZDCHF", name: "Kiwi / Swiss Franc", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 0.468, spread: 0.00025, yahoo: "NZDCHF=X", flag: "🇳🇿" },
  { symbol: "USDSEK", name: "USD / Swedish Krona", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 10.05, spread: 0.004, yahoo: "USDSEK=X", flag: "🇸🇪" },
  { symbol: "USDNOK", name: "USD / Norwegian Krone", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 9.64, spread: 0.004, yahoo: "USDNOK=X", flag: "🇳🇴" },
  { symbol: "USDDKK", name: "USD / Danish Krone", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 6.62, spread: 0.003, yahoo: "USDDKK=X", flag: "🇩🇰" },
  { symbol: "USDPLN", name: "USD / Polish Zloty", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 3.87, spread: 0.0025, yahoo: "USDPLN=X", flag: "🇵🇱" },
  { symbol: "USDMXN", name: "USD / Mexican Peso", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 18.25, spread: 0.004, yahoo: "USDMXN=X", flag: "🇲🇽" },
  { symbol: "USDZAR", name: "USD / South African Rand", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 16.56, spread: 0.008, yahoo: "USDZAR=X", flag: "🇿🇦" },
  { symbol: "USDSGD", name: "USD / Singapore Dollar", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 1.28, spread: 0.0002, yahoo: "USDSGD=X", flag: "🇸🇬" },
  { symbol: "USDHKD", name: "USD / Hong Kong Dollar", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 7.85, spread: 0.0003, yahoo: "USDHKD=X", flag: "🇭🇰" },
  { symbol: "USDCNH", name: "USD / Offshore Yuan", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 6.72, spread: 0.0015, yahoo: "USDCNH=X", flag: "🇨🇳" },
  { symbol: "EURSEK", name: "Euro / Swedish Krona", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 11.35, spread: 0.005, yahoo: "EURSEK=X", flag: "🇪🇺" },
  { symbol: "EURNOK", name: "Euro / Norwegian Krone", class: "FX", digits: 5, pipSize: 0.0001, contractSize: 100000, basePrice: 10.90, spread: 0.005, yahoo: "EURNOK=X", flag: "🇪🇺" },
  { symbol: "USDTRY", name: "US Dollar / Turkish Lira", class: "FX", digits: 4, pipSize: 0.0001, contractSize: 100000, basePrice: 34.25, spread: 0.02, yahoo: "TRY=X", flag: "🇹🇷" },
  { symbol: "EURTRY", name: "Euro / Turkish Lira", class: "FX", digits: 4, pipSize: 0.0001, contractSize: 100000, basePrice: 37.15, spread: 0.025, yahoo: "EURTRY=X", flag: "🇹🇷" },
  { symbol: "GBPTRY", name: "Pound / Turkish Lira", class: "FX", digits: 4, pipSize: 0.0001, contractSize: 100000, basePrice: 43.55, spread: 0.03, yahoo: "GBPTRY=X", flag: "🇹🇷" },
  { symbol: "AUDTRY", name: "Aussie / Turkish Lira", class: "FX", digits: 4, pipSize: 0.0001, contractSize: 100000, basePrice: 34.03, spread: 0.03, yahoo: "AUDTRY=X", flag: "🇹🇷" },
  { symbol: "CADTRY", name: "Canadian Dollar / Turkish Lira", class: "FX", digits: 4, pipSize: 0.0001, contractSize: 100000, basePrice: 34.43, spread: 0.03, yahoo: "CADTRY=X", flag: "🇹🇷" },
  { symbol: "CHFTRY", name: "Swiss Franc / Turkish Lira", class: "FX", digits: 4, pipSize: 0.0001, contractSize: 100000, basePrice: 58.78, spread: 0.04, yahoo: "CHFTRY=X", flag: "🇹🇷" },
  { symbol: "JPYTRY", name: "Yen / Turkish Lira", class: "FX", digits: 5, pipSize: 0.00001, contractSize: 100000, basePrice: 0.31, spread: 0.0002, yahoo: "JPYTRY=X", flag: "🇹🇷" },
  { symbol: "NZDTRY", name: "Kiwi / Turkish Lira", class: "FX", digits: 4, pipSize: 0.0001, contractSize: 100000, basePrice: 27.52, spread: 0.035, yahoo: "NZDTRY=X", flag: "🇹🇷" },

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

  // —— Crypto USD (Yahoo CRYPTOCURRENCY — verified live feeds only) ——
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
  { symbol: "WIFUSD", name: "dogwifhat / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.247, spread: 0.0004, yahoo: "WIF-USD", flag: "🐶" },
  { symbol: "BONKUSD", name: "Bonk / USD", class: "CRYPTO", digits: 10, pipSize: 1e-10, contractSize: 1, basePrice: 3.73e-6, spread: 5e-10, yahoo: "BONK-USD", flag: "🦴" },
  { symbol: "FLOKIUSD", name: "FLOKI / USD", class: "CRYPTO", digits: 9, pipSize: 1e-9, contractSize: 1, basePrice: 2.74e-5, spread: 2e-8, yahoo: "FLOKI-USD", flag: "🐺" },
  { symbol: "FETUSD", name: "FET / ASI Alliance / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.235, spread: 0.0003, yahoo: "FET-USD", flag: "🤖" },
  { symbol: "TAOUSD", name: "Bittensor / USD", class: "CRYPTO", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 305, spread: 0.4, yahoo: "TAO22974-USD", flag: "🧠" },
  { symbol: "IMXUSD", name: "Immutable / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.168, spread: 0.0003, yahoo: "IMX10603-USD", flag: "🧊" },
  { symbol: "STXUSD", name: "Stacks / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.398, spread: 0.0005, yahoo: "STX4847-USD", flag: "📚" },
  { symbol: "RUNEUSD", name: "THORChain / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 0.783, spread: 0.0015, yahoo: "RUNE-USD", flag: "⚡" },
  { symbol: "EGLDUSD", name: "MultiversX / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 4.59, spread: 0.01, yahoo: "EGLD-USD", flag: "🌐" },
  { symbol: "SANDUSD", name: "The Sandbox / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.044, spread: 0.0001, yahoo: "SAND-USD", flag: "🏖️" },
  { symbol: "MANAUSD", name: "Decentraland / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.089, spread: 0.00015, yahoo: "MANA-USD", flag: "🟣" },
  { symbol: "AXSUSD", name: "Axie Infinity / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 1.14, spread: 0.002, yahoo: "AXS-USD", flag: "🅰️" },
  { symbol: "CRVUSD", name: "Curve / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.386, spread: 0.0005, yahoo: "CRV-USD", flag: "📉" },
  { symbol: "LDOUSD", name: "Lido DAO / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.448, spread: 0.0006, yahoo: "LDO-USD", flag: "🌊" },
  { symbol: "GRTUSD", name: "The Graph / USD", class: "CRYPTO", digits: 6, pipSize: 0.000001, contractSize: 1, basePrice: 0.029, spread: 0.00005, yahoo: "GRT6719-USD", flag: "📊" },
  { symbol: "SNXUSD", name: "Synthetix / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.255, spread: 0.0004, yahoo: "SNX-USD", flag: "💠" },
  { symbol: "MNTUSD", name: "Mantle / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 0.69, spread: 0.001, yahoo: "MNT27075-USD", flag: "🟤" },
  { symbol: "OKBUSD", name: "OKB / USD", class: "CRYPTO", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 121, spread: 0.15, yahoo: "OKB-USD", flag: "🆗" },
  { symbol: "CROUSD", name: "Cronos / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.068, spread: 0.0001, yahoo: "CRO-USD", flag: "©️" },
  { symbol: "VETUSD", name: "VeChain / USD", class: "CRYPTO", digits: 6, pipSize: 0.000001, contractSize: 1, basePrice: 0.0089, spread: 0.000015, yahoo: "VET-USD", flag: "✅" },
  { symbol: "THETAUSD", name: "Theta Network / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.226, spread: 0.0003, yahoo: "THETA-USD", flag: "θ" },
  { symbol: "EOSUSD", name: "EOS / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.098, spread: 0.00015, yahoo: "EOS-USD", flag: "⬛" },
  { symbol: "XMRUSD", name: "Monero / USD", class: "CRYPTO", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 545, spread: 0.8, yahoo: "XMR-USD", flag: "ɱ" },
  { symbol: "ZECUSD", name: "Zcash / USD", class: "CRYPTO", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 1407, spread: 1.5, yahoo: "ZEC-USD", flag: "ⓩ" },
  { symbol: "DASHUSD", name: "Dash / USD", class: "CRYPTO", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 59.5, spread: 0.1, yahoo: "DASH-USD", flag: "ㄷ" },
  { symbol: "KASUSD", name: "Kaspa / USD", class: "CRYPTO", digits: 6, pipSize: 0.000001, contractSize: 1, basePrice: 0.043, spread: 0.00008, yahoo: "KAS-USD", flag: "⛏️" },
  { symbol: "PYTHUSD", name: "Pyth Network / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.077, spread: 0.00015, yahoo: "PYTH-USD", flag: "🔮" },
  { symbol: "ENAUSD", name: "Ethena / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.264, spread: 0.0004, yahoo: "ENA-USD", flag: "η" },
  { symbol: "ONDOUSD", name: "Ondo / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.499, spread: 0.0006, yahoo: "ONDO-USD", flag: "🏛️" },
  { symbol: "STRKUSD", name: "Starknet / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.044, spread: 0.0001, yahoo: "STRK-USD", flag: "🌟" },
  { symbol: "BLURUSD", name: "Blur / USD", class: "CRYPTO", digits: 6, pipSize: 0.000001, contractSize: 1, basePrice: 0.021, spread: 0.00004, yahoo: "BLUR-USD", flag: "🖼️" },
  { symbol: "GALAUSD", name: "Gala / USD", class: "CRYPTO", digits: 7, pipSize: 0.0000001, contractSize: 1, basePrice: 0.00227, spread: 0.000005, yahoo: "GALA-USD", flag: "🎮" },
  { symbol: "FLOWUSD", name: "Flow / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.032, spread: 0.00008, yahoo: "FLOW-USD", flag: "〰️" },
  { symbol: "CHZUSD", name: "Chiliz / USD", class: "CRYPTO", digits: 6, pipSize: 0.000001, contractSize: 1, basePrice: 0.016, spread: 0.00003, yahoo: "CHZ-USD", flag: "🌶️" },
  { symbol: "XTZUSD", name: "Tezos / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.319, spread: 0.0004, yahoo: "XTZ-USD", flag: "ꜩ" },
  { symbol: "IOTAUSD", name: "IOTA / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.056, spread: 0.0001, yahoo: "IOTA-USD", flag: "🔺" },
  { symbol: "ENSUSD", name: "Ethereum Name Service / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 6.92, spread: 0.015, yahoo: "ENS-USD", flag: "🪪" },
  { symbol: "QNTUSD", name: "Quant / USD", class: "CRYPTO", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 300, spread: 0.4, yahoo: "QNT-USD", flag: "ℚ" },
  { symbol: "KAVAUSD", name: "Kava / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.069, spread: 0.00012, yahoo: "KAVA-USD", flag: "☕" },
  { symbol: "ZILUSD", name: "Zilliqa / USD", class: "CRYPTO", digits: 7, pipSize: 0.0000001, contractSize: 1, basePrice: 0.0035, spread: 0.000008, yahoo: "ZIL-USD", flag: "Ƶ" },
  { symbol: "INCHUSD", name: "1inch / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.102, spread: 0.0002, yahoo: "1INCH-USD", flag: "🦄" },
  { symbol: "SUSHIUSD", name: "SushiSwap / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.263, spread: 0.0004, yahoo: "SUSHI-USD", flag: "🍣" },
  { symbol: "DYDXUSD", name: "dYdX / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.143, spread: 0.00025, yahoo: "DYDX-USD", flag: "📈" },
  { symbol: "APEUSD", name: "ApeCoin / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.151, spread: 0.00025, yahoo: "APE-USD", flag: "🦍" },
  { symbol: "CFXUSD", name: "Conflux / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.055, spread: 0.0001, yahoo: "CFX-USD", flag: "🌀" },
  { symbol: "ROSEUSD", name: "Oasis / USD", class: "CRYPTO", digits: 6, pipSize: 0.000001, contractSize: 1, basePrice: 0.0087, spread: 0.00002, yahoo: "ROSE-USD", flag: "🌹" },
  { symbol: "MINAUSD", name: "Mina / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.146, spread: 0.00025, yahoo: "MINA-USD", flag: "◇" },
  { symbol: "KSMUSD", name: "Kusama / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 5.22, spread: 0.012, yahoo: "KSM-USD", flag: "🐦" },
  { symbol: "NEOUSD", name: "NEO / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 2.52, spread: 0.005, yahoo: "NEO-USD", flag: "🟢" },
  { symbol: "CAKEUSD", name: "PancakeSwap / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 2.59, spread: 0.005, yahoo: "CAKE-USD", flag: "🥞" },
  { symbol: "ARUSD", name: "Arweave / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 4.09, spread: 0.01, yahoo: "AR-USD", flag: "🧶" },
  { symbol: "ORDIUSD", name: "ORDI / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 4.63, spread: 0.01, yahoo: "ORDI-USD", flag: "🟧" },
  { symbol: "WUSD", name: "Wormhole / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.0135, spread: 0.00003, yahoo: "W-USD", flag: "🐛" },
  { symbol: "JTOUSD", name: "Jito / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 0.535, spread: 0.001, yahoo: "JTO-USD", flag: "🛠️" },
  { symbol: "RAYUSD", name: "Raydium / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 1.90, spread: 0.003, yahoo: "RAY-USD", flag: "☀️" },
  { symbol: "PENDLEUSD", name: "Pendle / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 2.43, spread: 0.005, yahoo: "PENDLE-USD", flag: "⏳" },
  { symbol: "ETHFIUSD", name: "ether.fi / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 0.758, spread: 0.0015, yahoo: "ETHFI-USD", flag: "💎" },
  { symbol: "EIGENUSD", name: "EigenLayer / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.245, spread: 0.0004, yahoo: "EIGEN-USD", flag: "🔷" },
  { symbol: "VIRTUALUSD", name: "Virtuals Protocol / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 0.806, spread: 0.0015, yahoo: "VIRTUAL-USD", flag: "👾" },
  { symbol: "TWTUSD", name: "Trust Wallet Token / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 0.593, spread: 0.001, yahoo: "TWT-USD", flag: "🛡️" },
  { symbol: "JASMYUSD", name: "JasmyCoin / USD", class: "CRYPTO", digits: 6, pipSize: 0.000001, contractSize: 1, basePrice: 0.00572, spread: 0.000012, yahoo: "JASMY-USD", flag: "🇯🇵" },
  { symbol: "YFIUSD", name: "yearn.finance / USD", class: "CRYPTO", digits: 2, pipSize: 0.1, contractSize: 1, basePrice: 2455, spread: 3, yahoo: "YFI-USD", flag: "💙" },
  { symbol: "BATUSD", name: "Basic Attention Token / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.089, spread: 0.00015, yahoo: "BAT-USD", flag: "🦁" },
  { symbol: "ZRXUSD", name: "0x / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.123, spread: 0.0002, yahoo: "ZRX-USD", flag: "✖️" },
  { symbol: "ANKRUSD", name: "Ankr / USD", class: "CRYPTO", digits: 6, pipSize: 0.000001, contractSize: 1, basePrice: 0.0049, spread: 0.00001, yahoo: "ANKR-USD", flag: "⚓" },
  { symbol: "FLRUSD", name: "Flare / USD", class: "CRYPTO", digits: 6, pipSize: 0.000001, contractSize: 1, basePrice: 0.0074, spread: 0.000015, yahoo: "FLR-USD", flag: "🔥" },
  { symbol: "XDCUSD", name: "XDC Network / USD", class: "CRYPTO", digits: 6, pipSize: 0.000001, contractSize: 1, basePrice: 0.0355, spread: 0.00006, yahoo: "XDC-USD", flag: "✖" },
  { symbol: "BSVUSD", name: "Bitcoin SV / USD", class: "CRYPTO", digits: 2, pipSize: 0.01, contractSize: 1, basePrice: 19.7, spread: 0.05, yahoo: "BSV-USD", flag: "🅱️" },
  { symbol: "LEOUSD", name: "UNUS SED LEO / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 8.84, spread: 0.015, yahoo: "LEO-USD", flag: "🦁" },
  { symbol: "NEXOUSD", name: "Nexo / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 0.832, spread: 0.0015, yahoo: "NEXO-USD", flag: "🅽" },
  { symbol: "GTUSD", name: "GateToken / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 11.08, spread: 0.02, yahoo: "GT-USD", flag: "🅶" },
  { symbol: "NOTUSD", name: "Notcoin / USD", class: "CRYPTO", digits: 7, pipSize: 0.0000001, contractSize: 1, basePrice: 0.0005, spread: 0.000001, yahoo: "NOT-USD", flag: "📝" },
  { symbol: "LPTUSD", name: "Livepeer / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 1.75, spread: 0.004, yahoo: "LPT-USD", flag: "🎥" },
  { symbol: "SSVUSD", name: "ssv.network / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 3.15, spread: 0.008, yahoo: "SSV-USD", flag: "🔐" },
  { symbol: "RPLUSD", name: "Rocket Pool / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 1.95, spread: 0.005, yahoo: "RPL-USD", flag: "🚀" },
  { symbol: "CVXUSD", name: "Convex Finance / USD", class: "CRYPTO", digits: 3, pipSize: 0.001, contractSize: 1, basePrice: 2.15, spread: 0.005, yahoo: "CVX-USD", flag: "凸" },
  { symbol: "SUPERUSD", name: "SuperVerse / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.201, spread: 0.0003, yahoo: "SUPER8290-USD", flag: "🦸" },
  { symbol: "ZETAUSD", name: "ZetaChain / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.058, spread: 0.0001, yahoo: "ZETA-USD", flag: "ζ" },
  { symbol: "ALTUSD", name: "Altlayer / USD", class: "CRYPTO", digits: 6, pipSize: 0.000001, contractSize: 1, basePrice: 0.0078, spread: 0.000015, yahoo: "ALT29073-USD", flag: "🧬" },
  { symbol: "MANTAUSD", name: "Manta Network / USD", class: "CRYPTO", digits: 5, pipSize: 0.00001, contractSize: 1, basePrice: 0.068, spread: 0.00012, yahoo: "MANTA-USD", flag: "🐋" },
  { symbol: "HNTUSD", name: "Helium / USD", class: "CRYPTO", digits: 4, pipSize: 0.0001, contractSize: 1, basePrice: 0.492, spread: 0.001, yahoo: "HNT-USD", flag: "📡" },
  { symbol: "ONEUSD", name: "Harmony / USD", class: "CRYPTO", digits: 7, pipSize: 0.0000001, contractSize: 1, basePrice: 0.00216, spread: 0.000005, yahoo: "ONE3945-USD", flag: "1️⃣" },
  { symbol: "HOTUSD", name: "Holo / USD", class: "CRYPTO", digits: 8, pipSize: 1e-8, contractSize: 1, basePrice: 4.47e-4, spread: 1e-6, yahoo: "HOT2682-USD", flag: "🔥" },
  { symbol: "GMTUSD", name: "STEPN GMT / USD", class: "CRYPTO", digits: 6, pipSize: 0.000001, contractSize: 1, basePrice: 0.0086, spread: 0.00002, yahoo: "GMT18069-USD", flag: "👟" },

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
