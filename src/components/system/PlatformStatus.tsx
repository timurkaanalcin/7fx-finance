import type { CSSProperties } from "react";

type Action = { label: string; href?: string; onClick?: () => void };

type Props = {
  code: string;
  title: string;
  body: string;
  primary: Action;
  secondary?: Action;
};

const page: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px 20px",
  background: "#000000",
  color: "#d1d4dc",
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
};

const card: CSSProperties = {
  width: "min(440px, 100%)",
  textAlign: "center",
};

const kicker: CSSProperties = {
  margin: "18px 0 8px",
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "#a7b0c0",
};

const heading: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 500,
  letterSpacing: "-0.03em",
  color: "#f4f5f7",
};

const copy: CSSProperties = {
  margin: "12px auto 0",
  maxWidth: 380,
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 1.5,
  color: "#a7b0c0",
};

const row: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  justifyContent: "center",
  marginTop: 22,
};

const primaryBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  padding: "0 16px",
  borderRadius: 999,
  border: 0,
  background: "#f4f5f7",
  color: "#111111",
  font: "inherit",
  fontSize: 13,
  fontWeight: 500,
  textDecoration: "none",
  cursor: "pointer",
};

const ghostBtn: CSSProperties = {
  ...primaryBtn,
  background: "transparent",
  color: "#d1d4dc",
  border: "1px solid #2a2a2a",
};

function ActionLink({ item, kind }: { item: Action; kind: "primary" | "ghost" }) {
  const style = kind === "primary" ? primaryBtn : ghostBtn;
  if (item.onClick) {
    return (
      <button type="button" onClick={item.onClick} style={style}>
        {item.label}
      </button>
    );
  }
  return (
    <a href={item.href || "/"} style={style}>
      {item.label}
    </a>
  );
}

/** Full-page 404 / 500. Inline styles so it still matches the desk when route CSS is missing. */
export default function PlatformStatus({ code, title, body, primary, secondary }: Props) {
  return (
    <main style={page} data-fx-status={code}>
      <div style={card}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/v3/icon-64.png"
          alt=""
          width={48}
          height={48}
          style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover" }}
        />
        <p style={kicker}>{code}</p>
        <h1 style={heading}>{title}</h1>
        <p style={copy}>{body}</p>
        <div style={row}>
          <ActionLink item={primary} kind="primary" />
          {secondary ? <ActionLink item={secondary} kind="ghost" /> : null}
        </div>
      </div>
    </main>
  );
}
