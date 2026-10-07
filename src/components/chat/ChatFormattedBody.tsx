"use client";

import { Fragment, type ReactNode } from "react";

function formatInline(text: string): ReactNode[] {
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
}: {
  text: string;
  className?: string;
}) {
  const lines = text.split("\n");
  return (
    <div className={className ?? "break-words leading-relaxed"}>
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
