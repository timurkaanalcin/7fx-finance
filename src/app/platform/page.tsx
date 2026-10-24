import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import PublicDoc from "@/components/public/PublicDoc";
import { marketingMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const h = headers();
  return marketingMetadata(h.get("x-forwarded-host") || h.get("host"), "/platform");
}

export default function PlatformPage() {
  return (
    <PublicDoc
      title="Platform"
      lede="7FX is a multi-asset trading platform. After you sign in, the terminal is where you watch symbols, place orders, and review open and closed positions."
    >
      <h2 className="text-xl font-semibold">What the terminal includes</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>One account per signed-in user, with the balance stored on that account.</li>
        <li>An order ticket for the selected symbol.</li>
        <li>Open positions, pending orders, and closed-trade history.</li>
        <li>A chart for the selected symbol.</li>
      </ul>
      <h2 className="text-xl font-semibold">Language</h2>
      <p>
        Public pages are in English until a language is chosen. Turkish, German, Russian, and Arabic are available in
        the language menu. The choice is stored in the <span className="font-semibold">fx_lang</span> cookie.
      </p>
      <h2 className="text-xl font-semibold">Phone</h2>
      <p>
        The site is usable in a phone browser. On iPhone and iPad you can add it to the Home Screen.{" "}
        <Link href="/ios" className="font-semibold underline underline-offset-4">
          iPhone and iPad install steps
        </Link>
        .
      </p>
      <h2 className="text-xl font-semibold">Deposits and withdrawals</h2>
      <p>
        Deposit and withdrawal requests are submitted from the signed-in account. They stay pending until the desk
        updates the request. This page does not describe a transfer as instant.
      </p>
      <p>
        <Link href="/markets" className="font-semibold underline underline-offset-4">
          Markets and session rules
        </Link>
      </p>
    </PublicDoc>
  );
}
