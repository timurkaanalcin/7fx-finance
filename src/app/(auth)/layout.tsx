import "../base.css";
import "./auth-mobile.css";
import DeferredSheets from "@/components/styles/DeferredSheets";

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DeferredSheets />
      {children}
    </>
  );
}
