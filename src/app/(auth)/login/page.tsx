import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession, requireUser, destroySession, postLoginPath } from "@/lib/auth";
import { hostnameFromRequest, isCrmHostname, MAIN_SITE_ORIGIN } from "@/lib/crm-host";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { publicAuthMetadata } from "@/lib/i18n/public-meta";
import { locationForRequest } from "@/lib/request-origin";
import "@/components/crmv4/signin.css";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return publicAuthMetadata("auth.meta.loginTitle", "auth.meta.loginDesc");
}

export default async function LoginPage({ searchParams }: { searchParams?: { desk?: string | string[] } }) {
  const session = await getSession();
  if (session) {
    const user = await requireUser();
    if (user) {
      const h = headers();
      const host = hostnameFromRequest({ headers: h });
      const loc = (path: string) =>
        locationForRequest({ url: "http://0.0.0.0/", headers: { get: (name) => h.get(name) } }, path);
      if (isCrmHostname(host)) {
        redirect(loc(user.role === "ADMIN" ? "/izcrm" : `${MAIN_SITE_ORIGIN}/trade`));
      }
      // TEMP: postLoginPath /izcrm stays on main host until Natro crm7fx is live
      redirect(loc(postLoginPath(user)));
    }
    // Stale cookie (e.g. loginEnabled=false) — clear so middleware allows /login
    await destroySession();
  }

  const desk = searchParams?.desk === "crmv4";
  return (
    <AuthShell mode="login" desk={desk}>
      <LoginForm />
    </AuthShell>
  );
}
