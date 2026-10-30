function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** HTML mail shell. The mark is the black-on-white 7FX logo. */
export function emailHtml(input: { subject: string; body: string; logoUrl: string }): string {
  const subject = escapeHtml(input.subject || "7FX");
  const body = escapeHtml(input.body || "").replace(/\n/g, "<br/>");
  const logo = escapeHtml(input.logoUrl);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${subject}</title></head><body style="margin:0;background:#ffffff;color:#111111;font-family:Inter,Arial,sans-serif;font-weight:400;font-size:16px;line-height:1.6"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff"><tr><td align="center" style="padding:28px 16px"><table role="presentation" width="100%" style="max-width:560px"><tr><td style="padding:0 0 20px"><img src="${logo}" alt="7FX" width="160" height="72" style="display:block;border:0;height:72px;width:auto"/></td></tr><tr><td style="color:#111111;font-size:16px;line-height:1.6;font-weight:400">${body}</td></tr></table></td></tr></table></body></html>`;
}
