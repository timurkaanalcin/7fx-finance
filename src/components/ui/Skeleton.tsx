export default function Skeleton({ className = "", light = false }: { className?: string; light?: boolean }) {
  return <span className={`fx-skel${light ? " fx-skel--light" : ""} ${className}`} aria-hidden="true" />;
}
