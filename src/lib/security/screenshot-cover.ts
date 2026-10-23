/**
 * The terminal blackout is a desktop screenshot deterrent.
 * On a phone or WebView, window blur / pagehide also fire while the page is
 * still on screen (keyboard closing after sign-in, focus moving inside the
 * WebView). Latching the cover then makes /trade look like it never opened.
 */
export function shouldCoverForCapture(opts: {
  reason: "blur" | "visibility" | "pagehide" | "print" | "key";
  visibilityState: DocumentVisibilityState | "visible" | "hidden" | "prerender";
}): boolean {
  if (opts.reason === "print" || opts.reason === "key") return true;
  return opts.visibilityState !== "visible";
}
