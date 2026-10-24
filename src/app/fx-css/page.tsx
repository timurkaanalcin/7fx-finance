export const metadata = {
  robots: { index: false, follow: false, nocache: true },
  title: "7FX",
};

/**
 * Kept as a noindex route. The public utility sheet is compiled by
 * scripts/publish-deferred-css.mjs so the restricted Tailwind content
 * list never enters the Next PostCSS pass.
 */
export default function FxCssEntry() {
  return null;
}
