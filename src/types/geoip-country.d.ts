declare module "geoip-country" {
  export type GeoCountry = {
    country: string;
    name?: string;
    native?: string;
    continent?: string;
  };
  export function lookup(ip: string): GeoCountry | null;
  const _default: { lookup: typeof lookup };
  export default _default;
}
