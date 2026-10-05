/** Tiny dependency-free User-Agent parser (device class / browser / OS) for CRM display. */

export type ParsedUserAgent = {
  device: "mobile" | "tablet" | "desktop" | "bot" | "unknown";
  browser: string | null;
  os: string | null;
};

function ver(ua: string, re: RegExp): string {
  const m = ua.match(re);
  if (!m || !m[1]) return "";
  return m[1].split(/[._]/).slice(0, 1).join(".");
}

export function parseUserAgent(raw: string | null | undefined): ParsedUserAgent {
  const ua = String(raw || "").slice(0, 1000);
  if (!ua) return { device: "unknown", browser: null, os: null };

  const isBot = /bot|crawler|spider|crawling|curl\/|wget|python-requests|httpclient|axios|node-fetch|undici|postman/i.test(ua);

  // OS
  let os: string | null = null;
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && /Mobile\//.test(ua))) {
    os = `iPadOS ${ver(ua, /OS (\d+[._]\d+)/)}`.trim();
  } else if (/iPhone|iPod/.test(ua)) {
    os = `iOS ${ver(ua, /OS (\d+[._]\d+)/)}`.trim();
  } else if (/Android/.test(ua)) {
    os = `Android ${ver(ua, /Android (\d+(?:\.\d+)?)/)}`.trim();
  } else if (/CrOS/.test(ua)) {
    os = "ChromeOS";
  } else if (/Windows NT 10\.0/.test(ua)) {
    os = "Windows 10/11";
  } else if (/Windows NT 6\.3/.test(ua)) {
    os = "Windows 8.1";
  } else if (/Windows NT 6\.1/.test(ua)) {
    os = "Windows 7";
  } else if (/Windows/.test(ua)) {
    os = "Windows";
  } else if (/Mac OS X/.test(ua)) {
    os = "macOS"; // UA version is frozen at 10_15_7 by browsers
  } else if (/Linux/.test(ua)) {
    os = "Linux";
  }

  // Browser (order matters: many UAs contain "Chrome" / "Safari")
  let browser: string | null = null;
  const pick = (name: string, re: RegExp) => {
    const v = ver(ua, re);
    return v ? `${name} ${v}` : name;
  };
  if (/Edg(?:e|A|iOS)?\//.test(ua)) browser = pick("Edge", /Edg(?:e|A|iOS)?\/(\d+)/);
  else if (/OPR\/|Opera/.test(ua)) browser = pick("Opera", /(?:OPR|Opera)\/(\d+)/);
  else if (/SamsungBrowser\//.test(ua)) browser = pick("Samsung Internet", /SamsungBrowser\/(\d+)/);
  else if (/YaBrowser\//.test(ua)) browser = pick("Yandex", /YaBrowser\/(\d+)/);
  else if (/FxiOS\//.test(ua)) browser = pick("Firefox", /FxiOS\/(\d+)/);
  else if (/Firefox\//.test(ua)) browser = pick("Firefox", /Firefox\/(\d+)/);
  else if (/CriOS\//.test(ua)) browser = pick("Chrome", /CriOS\/(\d+)/);
  else if (/; wv\)/.test(ua) && /Android/.test(ua)) browser = "Android WebView";
  else if (/Chrome\//.test(ua)) browser = pick("Chrome", /Chrome\/(\d+)/);
  else if (/Safari\//.test(ua) && /Version\//.test(ua)) browser = pick("Safari", /Version\/(\d+)/);
  else if (/AppleWebKit/.test(ua) && /(iPhone|iPad|iPod)/.test(ua)) browser = "iOS WebView";
  else if (/curl\//i.test(ua)) browser = pick("curl", /curl\/(\d+)/i);
  else if (isBot) browser = ua.split(/[\s/;]/)[0]?.slice(0, 40) || "Bot";

  let device: ParsedUserAgent["device"] = "desktop";
  if (isBot) device = "bot";
  else if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) || (/Macintosh/.test(ua) && /Mobile\//.test(ua))) device = "tablet";
  else if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/.test(ua)) device = "mobile";

  return { device, browser, os };
}
