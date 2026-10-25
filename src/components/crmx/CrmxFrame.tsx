"use client";

import "../../app/globals.css";
import "./crmx.css";
import CrmI18n from "@/components/i18n/CrmI18n";
import Shell from "./Shell";

export default function CrmxFrame({ children }: { children: React.ReactNode }) {
  return (
    <CrmI18n>
      <Shell>{children}</Shell>
    </CrmI18n>
  );
}
