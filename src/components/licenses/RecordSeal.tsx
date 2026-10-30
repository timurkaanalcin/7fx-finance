export default function RecordSeal({ word, label }: { word: string; label: string }) {
  return (
    <figure className="fx-lic-seal">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" strokeWidth="0.6" />
        <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="3.5" strokeDasharray="1.4 5.2" />
        <text x="60" y="56" textAnchor="middle" className="fx-lic-seal-mark">
          7FX
        </text>
        <text x="60" y="74" textAnchor="middle" className="fx-lic-seal-word">
          {word}
        </text>
      </svg>
      <figcaption className="fx-lic-sr">{label}</figcaption>
    </figure>
  );
}
