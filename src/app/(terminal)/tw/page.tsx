import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { privateEnglishMetadata } from "@/lib/seo";
import "@/components/tw/tw.css";

const TwTerminal = dynamic(() => import("@/components/tw/TwTerminal"), {
  ssr: false,
  loading: () => <div className="tw" style={{ background: "#000000", minHeight: "100dvh" }} />,
});

export const metadata: Metadata = privateEnglishMetadata(
  "Chart · 7FX",
  "Charts, watchlist, positions and orders.",
  "/tw"
);

export default function TwPage() {
  return <TwTerminal />;
}
