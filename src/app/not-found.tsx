import type { Metadata } from "next";
import PlatformStatus from "@/components/system/PlatformStatus";

export const metadata: Metadata = {
  title: "Page not found · 7FX",
  description: "That page is not on the 7FX desk.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <PlatformStatus
      code="404"
      title="This page is not on the desk"
      body="The link may be old, or the page may have moved. You can open the terminal or go back home."
      primary={{ href: "/trade", label: "Open terminal" }}
      secondary={{ href: "/", label: "Home" }}
    />
  );
}
