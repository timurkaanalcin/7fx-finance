"use client";

type Props = {
  label?: string;
  variant?: "desk" | "crm" | "inline";
  className?: string;
};

/** Branded route/load transition: 7FX logo reveals left → right (sweep). */
export default function BrandLoader({ label, variant = "desk", className = "" }: Props) {
  const shell =
    variant === "crm"
      ? "fx-brand-loader--crm min-h-screen bg-white text-neutral-500"
      : variant === "inline"
        ? "fx-brand-loader--inline min-h-[120px] bg-transparent text-desk-muted"
        : "fx-brand-loader--desk h-screen bg-desk-bg text-desk-muted";

  return (
    <div
      className={`fx-brand-loader flex flex-col items-center justify-center gap-4 ${shell} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="fx-brand-loader-mark relative h-10 w-[140px] overflow-hidden sm:h-12 sm:w-[168px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/7fx-logo.png"
          alt="7FX"
          className={`fx-brand-loader-logo h-full w-full object-contain object-left ${
            variant === "desk" || variant === "inline" ? "brightness-0 invert" : ""
          }`}
        />
      </div>
      {label ? <span className="text-sm tracking-wide opacity-80">{label}</span> : null}
    </div>
  );
}
