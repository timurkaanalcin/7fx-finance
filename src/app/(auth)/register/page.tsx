import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "@/components/auth/RegisterForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kayıt · 7FX",
  description: "7FX hesabı oluşturun",
};

export default async function RegisterPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/trade");
  }

  return (
    <AuthShell mode="register">
      <RegisterForm />
    </AuthShell>
  );
}
