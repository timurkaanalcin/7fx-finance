import type { Metadata } from "next";
import { getPublicLocale, serverT } from "@/lib/i18n/server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "@/components/auth/RegisterForm";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const t = serverT(getPublicLocale());
  return {
    title: t("authx.register.metaTitle"),
    description: t("authx.register.metaDesc"),
    alternates: { canonical: "/register" },
  };
}

export default async function RegisterPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "ADMIN" ? "/izcrm" : "/trade");
  }

  return (
    <AuthShell mode="register">
      <RegisterForm />
    </AuthShell>
  );
}
