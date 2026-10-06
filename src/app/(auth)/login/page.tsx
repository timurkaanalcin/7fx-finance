import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession, requireUser, destroySession } from "@/lib/auth";
import { hostnameFromRequest, isCrmHostname, MAIN_SITE_ORIGIN } from "@/lib/crm-host";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In · 7FX",
  description: "Securely sign in to your 7FX account",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    const user = await requireUser();
    if (user) {
      const host = hostnameFromRequest({ headers: headers() });
      if (session.role === "ADMIN") {
        redirect("/izcrm");
      }
      if (isCrmHostname(host)) {
        redirect(`${MAIN_SITE_ORIGIN}/trade`);
      }
      redirect("/trade");
    }
    // Stale cookie (e.g. loginEnabled=false) — clear so middleware allows /login
    await destroySession();
  }

  return (
    <AuthShell mode="login">
      <LoginForm />
    </AuthShell>
  );
}
