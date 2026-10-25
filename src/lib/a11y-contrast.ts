/** sRGB contrast for the trade desk and CRM chrome. UI only. */

function channel(hex: string, index: number): number {
  const h = hex.replace("#", "");
  const n = parseInt(h.slice(index * 2, index * 2 + 2), 16) / 255;
  return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const r = channel(hex, 0);
  const g = channel(hex, 1);
  const b = channel(hex, 2);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

export function passesTextContrast(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= 4.5;
}

export function passesUiContrast(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= 3;
}
