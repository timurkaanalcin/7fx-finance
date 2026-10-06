import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, requireUser, destroySession } from "@/lib/auth";
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
      redirect(session.role === "ADMIN" ? "/izcrm" : "/trade");
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
