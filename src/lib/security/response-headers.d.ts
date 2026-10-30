declare module "@/lib/security/response-headers.cjs" {
  export const FRAME_OPTIONS: string;
  export const REFERRER_POLICY: string;
  export const PERMISSIONS_POLICY: string;
  export const HSTS_VALUE: string;
  export function contentSecurityPolicy(opts: { https: boolean; dev: boolean; crmv2?: boolean }): string;
  export function requestIsHttps(forwardedProto: string | null | undefined, protocol: string): boolean;
  export function staticSecurityHeaders(): { key: string; value: string }[];
}
