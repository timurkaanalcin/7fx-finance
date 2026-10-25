export class CrmxApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function crmxGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
  const data: unknown = await res.json().catch(() => null);
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.assign("/login");
  }
  if (!res.ok) {
    let message = "Request failed";
    if (data && typeof data === "object" && "error" in data) {
      const err = (data as { error?: unknown }).error;
      if (typeof err === "string" && err.trim()) message = err;
    }
    throw new CrmxApiError(res.status, message);
  }
  return data as T;
}

export async function crmxPost(url: string, body: Record<string, string>): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    let message = "Request failed";
    if (data && typeof data === "object" && "error" in data) {
      const err = (data as { error?: unknown }).error;
      if (typeof err === "string" && err.trim()) message = err;
    }
    throw new CrmxApiError(res.status, message);
  }
}
