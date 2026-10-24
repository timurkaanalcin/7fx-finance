import Image from "next/image";

type LogoProps = {
  alt?: string;
  priority?: boolean;
  className?: string;
  /** CSS pixel height. The mark is square. */
  height?: number;
};

export default function BrandLogo({
  alt = "7FX",
  priority = false,
  className = "h-9 w-auto",
  height = 36,
}: LogoProps) {
  return (
    <Image
      src="/7fx-logo.png"
      alt={alt}
      width={height}
      height={height}
      priority={priority}
      sizes={`${height * 3}px`}
      className={className}
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
