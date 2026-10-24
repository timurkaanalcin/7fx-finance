"use client";
import ErrorFallback from "@/components/system/ErrorFallback";
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en"><body style={{ background: "#0b0b0b", color: "#eee", margin: 0 }}>
      <ErrorFallback error={error} reset={reset} where="global" />
    </body></html>
  );
}
