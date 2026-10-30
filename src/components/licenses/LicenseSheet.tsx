import {
  EMPTY_LICENSE,
  httpsRegisterUrl,
  licenseEntries,
  LICENSE_MISSING,
  registerHost,
  type PublicLicense,
} from "@/lib/license-record";
import { registerKind } from "@/lib/license-register";
import type { LicensePageCopy } from "@/lib/public-doc-copy";
import RecordSeal from "@/components/licenses/RecordSeal";

function Missing() {
  return <span className="fx-lic-missing">{LICENSE_MISSING}</span>;
}

export default function LicenseSheet({
  copy,
  row,
  mode,
  locale,
}: {
  copy: LicensePageCopy;
  row?: PublicLicense;
  mode: "list" | "full";
  locale: string;
}) {
  const record = row ?? EMPTY_LICENSE;
  const kind = row ? registerKind(record) : "generic";
  const labels = copy[kind];
  const fields = licenseEntries(record, locale);
  const verify = row ? httpsRegisterUrl(row.registerUrl) : null;
  const Title = mode === "full" && row ? "h1" : "h2";
  const heading = row ? (row.entity.trim() || LICENSE_MISSING) : copy.emptyTitle;
  const number = row?.number.trim() || LICENSE_MISSING;
  const regulator = row?.regulator.trim() || "";

  return (
    <article
      className={mode === "full" ? "fx-lic-sheet fx-lic-sheet--full" : "fx-lic-sheet"}
      id={row ? `license-${row.id}` : "license-empty"}
      data-license={row?.id || "empty"}
      data-register={kind}
    >
      <header className="fx-lic-sheet-top">
        <div className="fx-lic-letterhead">
          {/* eslint-disable-next-line @next/next/no-img-element -- monochrome filter; next/image would drop it in print */}
          <img src="/7fx-logo.png" alt="" width={28} height={28} className="fx-lic-mark" />
          <p className="fx-lic-kicker">{copy.kicker}</p>
        </div>
        <p className="fx-lic-docno">
          <span className="fx-lic-docno-label">{labels.number}</span>
          <span className={number === LICENSE_MISSING ? "fx-lic-docno-value fx-lic-missing" : "fx-lic-docno-value"}>{number}</span>
        </p>
      </header>

      <Title className="fx-lic-doc-title">{heading}</Title>
      {row ? (
        <p className={regulator ? "fx-lic-regulator-line" : "fx-lic-regulator-line fx-lic-missing"}>{regulator || LICENSE_MISSING}</p>
      ) : (
        <p className="fx-lic-empty">{copy.emptyBody}</p>
      )}

      <p className="fx-lic-verify-row">
        {verify ? (
          <a className="fx-lic-verify-btn" href={verify} target="_blank" rel="noopener noreferrer">
            {copy.verify}
            <span className="fx-lic-host">{registerHost(verify)}</span>
          </a>
        ) : (
          <span className="fx-lic-verify-missing">
            {copy.verify} <Missing />
          </span>
        )}
      </p>

      <dl className="fx-lic-fields">
        {fields.map((field) => (
          <div key={field.key} className={field.wide ? "is-wide" : undefined}>
            <dt>{labels[field.key]}</dt>
            <dd>{field.missing ? <Missing /> : field.value}</dd>
          </div>
        ))}
      </dl>

      <footer className="fx-lic-sheet-foot">
        <div>
          {row && mode === "list" ? (
            <a href={`/licenses/${row.id}`} className="fx-lic-open">
              {copy.viewFull}
            </a>
          ) : null}
          <p className="fx-lic-footnote">{copy.footnote}</p>
        </div>
        <RecordSeal word={copy.stamp} label={copy.seal} />
      </footer>
    </article>
  );
}
