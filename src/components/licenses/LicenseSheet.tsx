import { validLogo } from "@/lib/sponsors";
import {
  httpsRegisterUrl,
  licenseFields,
  LICENSE_MISSING,
  registerHost,
  type PublicLicense,
} from "@/lib/license-record";
import type { LicensePageCopy } from "@/lib/public-doc-copy";
import RecordSeal from "@/components/licenses/RecordSeal";
import Link from "next/link";

function Missing() {
  return <span className="fx-lic-missing">{LICENSE_MISSING}</span>;
}

export default function LicenseSheet({
  copy,
  row,
  mode,
}: {
  copy: LicensePageCopy;
  row?: PublicLicense;
  mode: "list" | "full";
}) {
  const fields = row ? licenseFields(row) : licenseFields({
    id: "",
    regulator: "",
    number: "",
    entity: "",
    registerUrl: "",
    logo: null,
  });
  const verify = row ? httpsRegisterUrl(row.registerUrl) : null;
  const logo = row?.logo && validLogo(row.logo) ? row.logo : null;
  const Title = mode === "full" && row ? "h1" : "h2";
  const heading = row ? (row.regulator.trim() || LICENSE_MISSING) : copy.emptyTitle;
  const number = row?.number.trim() || LICENSE_MISSING;

  return (
    <article className={mode === "full" ? "fx-lic-sheet fx-lic-sheet--full" : "fx-lic-sheet"} id={row ? `license-${row.id}` : "license-empty"} data-license={row?.id || "empty"}>
      <header className="fx-lic-sheet-top">
        <div className="fx-lic-letterhead">
          {/* Monochrome treatment is applied in CSS. The asset itself stays the site mark. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- filtered brand mark; next/image would ignore the print filter */}
          <img src="/7fx-logo.png" alt="" width={28} height={28} className="fx-lic-mark" />
          <p className="fx-lic-kicker">{copy.kicker}</p>
        </div>
        <p className="fx-lic-docno">
          <span className="fx-lic-docno-label">{copy.number}</span>
          <span className={number === LICENSE_MISSING ? "fx-lic-docno-value fx-lic-missing" : "fx-lic-docno-value"}>{number}</span>
        </p>
      </header>

      <Title className="fx-lic-doc-title">{heading}</Title>
      {row ? null : <p className="fx-lic-empty">{copy.emptyBody}</p>}
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin data-URL; next/image does not accept it
        <img src={logo} alt="" className="fx-lic-regulator-logo" />
      ) : null}

      <dl className="fx-lic-fields">
        {fields.map((field) => (
          <div key={field.key} className={field.wide ? "is-wide" : undefined}>
            <dt>{copy[field.key]}</dt>
            <dd>{field.missing ? <Missing /> : field.value}</dd>
          </div>
        ))}
        <div className="is-wide">
          <dt>{copy.verify}</dt>
          <dd>
            {verify ? (
              <a className="fx-lic-verify" href={verify} target="_blank" rel="noopener noreferrer">
                <span className="fx-lic-verify-label">{copy.verify}</span>
                <span className="fx-lic-host">{registerHost(verify)}</span>
              </a>
            ) : (
              <Missing />
            )}
          </dd>
        </div>
      </dl>

      <footer className="fx-lic-sheet-foot">
        <div>
          {row && mode === "list" ? (
            <Link href={`/licenses/${row.id}`} className="fx-lic-open">
              {copy.viewFull}
            </Link>
          ) : null}
          <p className="fx-lic-footnote">{copy.footnote}</p>
        </div>
        <RecordSeal word={copy.stamp} label={copy.seal} />
      </footer>
    </article>
  );
}
