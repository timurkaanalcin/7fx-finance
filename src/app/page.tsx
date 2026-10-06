import { redirect } from "next/navigation";
import { getSession, postLoginPath } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LandingPage from "@/components/landing/LandingPage";

export default async function Home() {
  const session = await getSession();
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true, crmReadOnly: true },
    });
    redirect(user ? postLoginPath(user) : session.role === "ADMIN" ? "/izcrm" : "/trade");
  }

  return <LandingPage />;
}
