import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import PublicDoc from "@/components/public/PublicDoc";
import { marketingMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const h = headers();
  return marketingMetadata(h.get("x-forwarded-host") || h.get("host"), "/faq");
}

const QA = [
  {
    q: "What can I trade?",
    a: "The built-in catalog covers crypto, forex, commodities, indices, and stocks. The desk can add further symbols. See the markets pages for the built-in names and the session rule for each class.",
  },
  {
    q: "Which language is the public site in?",
    a: "English. If you have not chosen a language, pages stay in English. You can switch to Turkish, German, Russian, or Arabic from the language menu.",
  },
  {
    q: "When does 7FX accept a stock order?",
    a: "US stock orders are accepted on weekdays from 09:30 to 16:00 America/New_York. BIST stock orders are accepted on weekdays from 10:00 to 18:00 Europe/Istanbul. Outside that session the platform rejects a new stock order.",
  },
  {
    q: "Are forex, crypto, commodity, and index orders rejected when the session label says closed?",
    a: "Crypto is treated as open continuously. Forex, commodity, and index symbols still show a session label, and a closed label does not by itself reject those orders. Stock orders are the ones rejected when the session is closed.",
  },
  {
    q: "Does this website publish a regulatory license number?",
    a: "No. These pages do not state that 7FX is licensed, regulated, or supervised by a financial authority.",
  },
  {
    q: "Does 7FX promise a profit or a quoted spread?",
    a: "No. Nothing on this site is a forecast, a target return, or a promise of profit. Spreads and prices shown in the terminal come from the platform quote feed at that moment.",
  },
  {
    q: "How do I open an account?",
    a: "Use the register page. If you have a referral code, the form asks for it. After sign-in, the trading terminal is at the trade page.",
  },
] as const;

export default function FaqPage() {
  return (
    <PublicDoc
      title="Questions"
      lede="Short answers about how 7FX behaves. These pages describe the product. They are not an offer of returns."
    >
      {QA.map((item) => (
        <section key={item.q}>
          <h2 className="text-xl font-semibold">{item.q}</h2>
          <p className="mt-2">{item.a}</p>
        </section>
      ))}
      <p>
        <Link href="/markets" className="font-semibold underline underline-offset-4">
          Markets
        </Link>
        {" · "}
        <Link href="/platform" className="font-semibold underline underline-offset-4">
          Platform
        </Link>
        {" · "}
        <Link href="/register" className="font-semibold underline underline-offset-4">
          Open an account
        </Link>
      </p>
    </PublicDoc>
  );
}
