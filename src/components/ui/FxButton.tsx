import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "icon" | "danger" | "pill";
type Size = "sm" | "md";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const VARIANT: Record<Variant, string> = {
  primary: "fx-btn fx-btn--primary",
  secondary: "fx-btn fx-btn--secondary",
  ghost: "fx-btn fx-btn--ghost",
  icon: "fx-btn fx-btn--icon fx-btn--secondary",
  danger: "fx-btn fx-btn--danger",
  pill: "fx-btn fx-btn--pill fx-btn--secondary",
};

/** Shared control. Heights come from --fx-btn-h (40px) and --fx-btn-h-sm (36px). */
export default function FxButton({
  variant = "secondary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: Props) {
  const sizeClass = size === "sm" ? "fx-btn--sm" : "";
  return <button type={type} className={`${VARIANT[variant]} ${sizeClass} ${className}`.trim()} {...rest} />;
}
