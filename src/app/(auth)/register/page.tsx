import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "@/components/auth/RegisterForm";
import { publicAuthMetadata } from "@/lib/i18n/public-meta";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return publicAuthMetadata("auth.meta.registerTitle", "auth.meta.registerDesc");
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
