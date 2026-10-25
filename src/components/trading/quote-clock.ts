/** Last time a quote poll returned ticks. Lets the chart stay "live" without a React render when prices are unchanged. */
let seenAt = 0;

export function markQuotesSeen(at = Date.now()): void {
  seenAt = at;
}

export function quotesSeenAt(): number {
  return seenAt;
}
