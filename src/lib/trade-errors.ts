/** Map stable trading-engine messages to UI copy. Does not change how trades are priced or filled. */
const EXACT: Record<string, string> = {
  "Price yok": "term.err.noPrice",
  "Yetersiz serbest marj": "term.err.noMargin",
  "Invalid symbol": "term.err.badSymbol",
  "Invalid volume": "term.err.badVolume",
  "Symbol is closed for trading": "term.err.symbolClosed",
  "Account not found": "term.err.noAccount",
  "Price required for Limit/Stop": "term.err.needPrice",
  "Position not found": "term.err.noPosition",
  "No symbol settings": "term.err.noSettings",
  "Volume exceeds position size": "term.err.volumeTooBig",
  "Invalid stop loss": "term.err.badSl",
  "Stop loss must be below current price for BUY": "term.err.slBuy",
  "Stop loss must be above current price for SELL": "term.err.slSell",
  "Invalid take profit": "term.err.badTp",
  "Take profit must be above current price for BUY": "term.err.tpBuy",
  "Take profit must be below current price for SELL": "term.err.tpSell",
  "Nothing to update": "term.err.nothing",
};

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

export function localizeTradeError(raw: string, t: (key: string) => string): string {
  const key = EXACT[raw];
  if (key) return t(key);
  const range = /^Volume must be between (.+)[–-](.+)$/.exec(raw);
  if (range) return fill(t("term.err.volumeRange"), { min: range[1], max: range[2] });
  const step = /^Volume step is (.+)$/.exec(raw);
  if (step) return fill(t("term.err.volumeStep"), { step: step[1] });
  const min = /^Volume must be at least (.+)$/.exec(raw);
  if (min) return fill(t("term.err.minVolume"), { min: min[1] });
  return raw;
}
