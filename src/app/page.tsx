import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LandingPage from "@/components/landing/LandingPage";

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/trade");
  }

  return (
    <Suspense
      fallback={
        <div className="m1-landing flex min-h-screen items-center justify-center bg-[#f3efe6] text-[#6b6458]">
          Yükleniyor…
        </div>
      }
    >
      <LandingPage />
    </Suspense>
  );
}
