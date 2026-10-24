import "@/components/landing/landing.css";

export const metadata = {
  robots: { index: false, follow: false, nocache: true },
  title: "7FX",
};

/** Emits the landing sheet so the home page can load it without blocking first paint. */
export default function FxLandingCssEntry() {
  return null;
}
