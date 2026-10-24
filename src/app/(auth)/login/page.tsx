import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession, requireUser, destroySession, postLoginPath } from "@/lib/auth";
import { hostnameFromRequest, isCrmHostname, MAIN_SITE_ORIGIN } from "@/lib/crm-host";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { publicAuthMetadata } from "@/lib/i18n/public-meta";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return publicAuthMetadata("auth.meta.loginTitle", "auth.meta.loginDesc");
}

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    const user = await requireUser();
    if (user) {
      const host = hostnameFromRequest({ headers: headers() });
      if (isCrmHostname(host)) {
        redirect(user.role === "ADMIN" ? "/izcrm" : `${MAIN_SITE_ORIGIN}/trade`);
      }
      // TEMP: postLoginPath /izcrm stays on main host until Natro crm7fx is live
      redirect(postLoginPath(user));
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
