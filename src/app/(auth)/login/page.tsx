import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession, requireUser, destroySession, postLoginPath } from "@/lib/auth";
import { hostnameFromRequest, isCrmHostname, mainSiteOrigin } from "@/lib/crm-host";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { publicAuthMetadata } from "@/lib/i18n/public-meta";
import { locationForRequest } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return publicAuthMetadata("auth.meta.loginTitle", "auth.meta.loginDesc");
}

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    const user = await requireUser();
    if (user) {
      const h = headers();
      const host = hostnameFromRequest({ headers: h });
      const loc = (path: string) =>
        locationForRequest({ url: "http://0.0.0.0/", headers: { get: (name) => h.get(name) } }, path);
      if (isCrmHostname(host)) {
        redirect(loc(user.role === "ADMIN" ? "/izcrm" : `${mainSiteOrigin()}/trade`));
      }
      // TEMP: postLoginPath /izcrm stays on main host until Natro crm7fx is live
      redirect(loc(postLoginPath(user)));
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
