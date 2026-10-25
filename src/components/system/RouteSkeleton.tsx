/** Route-level skeleton. Inline styles so public and auth pages match before CSS chunks. */
export default function RouteSkeleton({ tone }: { tone: "dark" | "light" }) {
  const dark = tone === "dark";
  const bars = [168, "72%", "100%", "100%", "64%"] as const;
  return (
    <main
      data-fx-route-skeleton=""
      aria-busy="true"
      style={{
        minHeight: "100vh",
        background: dark ? "#07090d" : "#ffffff",
        color: dark ? "#f4f7fb" : "#15161a",
        padding: "32px 20px",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontWeight: 400,
      }}
    >
      <span className="sr-only">Loading</span>
      <style>{`@keyframes fx-route-skel{0%{opacity:.4}50%{opacity:1}100%{opacity:.4}}@media (prefers-reduced-motion:reduce){.fx-route-bar{animation:none!important}}`}</style>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {bars.map((width, i) => (
          <span
            key={i}
            className="fx-route-bar"
            style={{
              display: "block",
              height: i === 0 ? 18 : 14,
              width,
              maxWidth: "100%",
              borderRadius: 8,
              marginBottom: 12,
              background: dark ? "rgba(244,247,251,.12)" : "#ececec",
              animation: "fx-route-skel 1.3s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    </main>
  );
}
