import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession, requireUser, destroySession, postLoginPath } from "@/lib/auth";
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
      if (isCrmHostname(host)) {
        redirect(user.role === "ADMIN" ? "/izcrm" : `${MAIN_SITE_ORIGIN}/trade`);
      }
      // Full CRM admins: CRM is on crm7fx (separate DB) — send them there
      const path = postLoginPath(user);
      if (path === "/izcrm") {
        redirect("https://crm7fx.customer.org.tr/login");
      }
      redirect(path);
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
