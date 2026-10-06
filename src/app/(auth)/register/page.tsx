import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "@/components/auth/RegisterForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Register · 7FX",
  description: "Create your 7FX account",
};

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
