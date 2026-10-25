"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { PageFallback } from "@/components/crmx/ui";

const Screen = dynamic(() => import("@/components/crmx/pages/Traders"), {
  loading: () => <PageFallback />,
});

export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Screen selectedId={params.id} />
    </Suspense>
  );
}
