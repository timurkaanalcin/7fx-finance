"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { PageFallback } from "@/components/crmx/ui";

const Screen = dynamic(() => import("@/components/crmx/pages/Settings"), {
  loading: () => <PageFallback />,
});

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Screen />
    </Suspense>
  );
}
