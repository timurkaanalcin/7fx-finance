/** Traders table page size. The list opts in; callers that omit `take` keep the old window. */
export const TRADER_PAGE = 50;
/** Largest window a paged request may ask for (refresh of rows already on screen). */
export const TRADER_TAKE_CAP = 200;
/** Communications and document pickers still ask for the full list by omitting `take`. */
export const TRADER_LEGACY_TAKE = 500;

export function traderListWindow(
  takeRaw: string | null,
  skipRaw: string | null
): { take: number; skip: number } {
  const skipNum = Number(skipRaw);
  const skip = Number.isFinite(skipNum) && skipNum > 0 ? Math.min(100_000, Math.trunc(skipNum)) : 0;
  if (takeRaw == null || takeRaw === "") return { take: TRADER_LEGACY_TAKE, skip };
  const takeNum = Math.trunc(Number(takeRaw));
  const take = Number.isFinite(takeNum) && takeNum > 0 ? Math.min(TRADER_TAKE_CAP, takeNum) : TRADER_PAGE;
  return { take, skip };
}

/** Follow-up and retention counts run only when the list asks for them. */
export function wantTraderCounts(raw: string | null): boolean {
  return raw === "1";
}
