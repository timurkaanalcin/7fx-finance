import type { Metadata } from "next";
import NotFoundStatus from "@/components/system/NotFoundStatus";

export const metadata: Metadata = {
  title: "Page not found · 7FX",
  description: "That page is not on the 7FX desk.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <NotFoundStatus />
  );
}
