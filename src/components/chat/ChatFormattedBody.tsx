"use client";

import { Fragment, type ReactNode } from "react";

/** "/documents" typed by staff → link to the customer's Documents page. */
function linkDocs(text: string, keyBase: string): ReactNode[] {
  const parts = text.split(/(\/documents)(?![\w/-])/g);
  if (parts.length === 1) return [text];
  return parts.map((p, i) =>
    p === "/documents" ? (
      <a key={`${keyBase}-d${i}`} href="/documents" className="fx-chat-doclink font-semibold underline underline-offset-2">
        /documents
      </a>
    ) : (
      p
    )
  );
}

function formatInline(text: string): ReactNode[] {
  return formatInlineRaw(text).flatMap((n, i) => (typeof n === "string" ? linkDocs(n, String(i)) : [n]));
}

function formatInlineRaw(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("__") && token.endsWith("__")) {
      nodes.push(
        <span key={key++} className="underline underline-offset-2">
          {token.slice(2, -2)}
        </span>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(
        <em key={key++} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else {
      nodes.push(token);
    }
    last = m.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Renders chat markdown: newlines, **bold**, *italic*, __underline__, "- " bullets. */
export function ChatFormattedBody({
  text,
  className,
  renderAttachment,
}: {
  text: string;
  className?: string;
  /** renders [[att:ID]] markers (always stripped from the visible text) */
  renderAttachment?: (id: string) => ReactNode;
}) {
  const ids: string[] = [];
  const clean = text
    .replace(/\[\[att:([a-z0-9]{10,40})\]\]/gi, (_m, id: string) => {
      ids.push(id);
      return "";
    })
    .replace(/\s+$/, "");
  const lines = clean.split("\n");
  return (
    <div className={className ?? "break-words leading-relaxed"}>
      {ids.length > 0 && renderAttachment && (
        <div className="mb-1 flex flex-wrap gap-1">
          {ids.map((id) => (
            <Fragment key={id}>{renderAttachment(id)}</Fragment>
          ))}
        </div>
      )}
      {lines.map((line, i) => {
        const bullet = /^[-•]\s+/.test(line);
        const content = bullet ? line.replace(/^[-•]\s+/, "") : line;
        return (
          <Fragment key={i}>
            {i > 0 && <br />}
            {bullet ? (
              <span className="inline-flex gap-1.5">
                <span aria-hidden className="shrink-0">
                  •
                </span>
                <span>{formatInline(content)}</span>
              </span>
            ) : (
              formatInline(content)
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
