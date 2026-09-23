import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Giriş · 7FX",
  description: "7FX hesabınıza güvenli giriş yapın",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/trade");
  }

  return (
    <AuthShell mode="login">
      <LoginForm />
    </AuthShell>
  );
}
