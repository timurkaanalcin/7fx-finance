import Image from "next/image";

type LogoTone = "paper" | "ink" | "theme";

type LogoProps = {
  alt?: string;
  priority?: boolean;
  className?: string;
  /** CSS pixel height. The mark is square. */
  height?: number;
  /**
   * paper: white mark for dark surfaces.
   * ink: black mark for light surfaces.
   * theme: black in light theme, white in dark theme.
   */
  tone?: LogoTone;
};

export default function BrandLogo({
  alt = "7FX",
  priority = false,
  className = "h-9 w-auto",
  height = 36,
  tone = "paper",
}: LogoProps) {
  const toneClass = tone === "ink" ? "fx-logo-ink" : tone === "theme" ? "fx-logo-theme" : "fx-logo-paper";
  return (
    <Image
      src="/7fx-logo.png"
      alt={alt}
      width={height}
      height={height}
      priority={priority}
      sizes={`${height * 3}px`}
      className={`${toneClass} ${className}`}
      style={{ width: "auto", height }}
    />
  );
}

export function IngMark({ className, height = 20 }: { className?: string; height?: number }) {
  const width = Math.round(height * (1024 / 433));
  return (
    <Image
      src="/ing-logo.png"
      alt="ING"
      width={width}
      height={height}
      sizes={`${width * 2}px`}
      className={className}
      style={{ width: "auto", height }}
    />
  );
}
