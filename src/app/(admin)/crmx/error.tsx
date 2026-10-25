"use client";

export default function CrmxError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" style={{ padding: 8 }}>
      <p>{error.message || "Could not load this view"}</p>
      <button type="button" onClick={reset}>Try again</button>
    </div>
  );
}
