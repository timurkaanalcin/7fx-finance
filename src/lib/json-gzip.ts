import { gzipSync } from "node:zlib";

const GZIP_MIN_BYTES = 1024;

export type GzipJson =
  | { encoding: "gzip"; body: Buffer; json: string }
  | { encoding: null; body: string; json: string };

/** Gzip a JSON payload when the caller accepts gzip and the body is larger than 1KB. */
export function maybeGzipJson(acceptEncoding: string | null, payload: unknown): GzipJson {
  const json = JSON.stringify(payload);
  const accept = (acceptEncoding || "").toLowerCase();
  if (json.length > GZIP_MIN_BYTES && accept.includes("gzip")) {
    return { encoding: "gzip", body: gzipSync(Buffer.from(json, "utf8")), json };
  }
  return { encoding: null, body: json, json };
}
