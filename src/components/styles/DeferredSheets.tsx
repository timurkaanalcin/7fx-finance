const UTILITIES = "/fx-public-utilities.css";
const LANDING = "/fx-landing.css";

function links(href: string) {
  return `<link rel="preload" href="${href}" as="style"><link rel="stylesheet" href="${href}" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="${href}"></noscript>`;
}

/** Non-blocking stylesheets. First paint is not held on these files. */
export default function DeferredSheets({ landing = false }: { landing?: boolean }) {
  const html = links(UTILITIES) + (landing ? links(LANDING) : "");
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
