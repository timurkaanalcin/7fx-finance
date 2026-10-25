"use client";

import type { PasswordStrength } from "@/lib/auth-fields";

export function FieldMessage({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="fx-auth-field-error" role="alert">
      {children}
    </p>
  );
}

export function AuthAlert({ title, children }: { title: string; children: string }) {
  if (!children) return null;
  return (
    <div role="alert" data-fx-auth-error="" className="fx-auth-alert">
      <p className="fx-auth-alert-title">{title}</p>
      <p>{children}</p>
    </div>
  );
}

export function PasswordToggle({
  pressed,
  onClick,
  showLabel,
  hideLabel,
}: {
  pressed: boolean;
  onClick: () => void;
  showLabel: string;
  hideLabel: string;
}) {
  return (
    <button
      type="button"
      data-fx-password-toggle=""
      className="fx-auth-reveal"
      aria-pressed={pressed}
      aria-label={pressed ? hideLabel : showLabel}
      onClick={onClick}
    >
      {pressed ? hideLabel : showLabel}
    </button>
  );
}

export function PasswordMeter({ level }: { level: PasswordStrength }) {
  const on = level === "empty" ? 0 : level === "short" ? 1 : level === "ok" ? 2 : 3;
  return (
    <div className={`fx-pw-meter is-${level}`} data-fx-pw-strength={level} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < on ? "is-on" : ""} />
      ))}
    </div>
  );
}
