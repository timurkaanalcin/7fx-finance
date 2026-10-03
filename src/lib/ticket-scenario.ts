export type TicketKind = "DEPOSIT" | "WITHDRAW" | "MARGIN";

export type TicketFacts = {
  id: string;
  kind: TicketKind;
  customer: string;
  customerEmail: string;
  tradingAccountId: string | null;
  amount: number | null;
  currency: string;
  method: string;
  openedAt: Date;
  country?: string | null;
  reason?: string | null;
};

const KIND_LABEL: Record<TicketKind, string> = {
  DEPOSIT: "yatırım (deposit) talebi",
  WITHDRAW: "para çekme talebi",
  MARGIN: "teminat / bakiye talebi",
};

function fmtWhen(d: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function fmtAmount(amount: number | null, currency: string): string {
  if (amount == null || !Number.isFinite(amount)) return `tutar belirtilmemiş (${currency || "USD"})`;
  const n = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${n} ${currency || "USD"}`;
}

/** Professional Turkish event narrative built only from this ticket's facts. */
export function composeTicketScenario(facts: TicketFacts): string {
  const kind = KIND_LABEL[facts.kind] || facts.kind;
  const when = fmtWhen(facts.openedAt);
  const money = fmtAmount(facts.amount, facts.currency);
  const account = facts.tradingAccountId?.trim() || "hesap kaydı bulunamadı";
  const method = facts.method?.trim() || "yöntem belirtilmemiş";
  const country = facts.country?.trim() || "ülke bilgisi yok";
  const name = facts.customer?.trim() || "isimsiz müşteri";
  const email = facts.customerEmail?.trim() || "e-posta yok";
  const reason = facts.reason?.trim();
  const reasonSentence = reason
    ? `Onay nedeni olarak yönetici şunu kaydetmiştir: “${reason}”.`
    : "Yönetici henüz bir onay nedeni yazmamıştır; bu senaryo yalnızca bilet kaydındaki olgulara dayanır.";

  return [
    `${when} (İstanbul) tarihinde müşteri ${name} (${email}), işlem hesabı ${account} üzerinden ${money} tutarında bir ${kind} açmıştır.`,
    `Talep ${method} yöntemiyle iletilmiş, ülke bilgisi “${country}” olarak kayıtlıdır ve sistemde BEKLEMEDE (PENDING) statüsüyle tutulmaktadır. Bilet kimliği ${facts.id}, türü ${facts.kind}, tutar ${money}, yöntem ${method}.`,
    `Yönetici incelemesi bu bileti BEKLEMEDE (PENDING) durumundan ONAYLANDI (APPROVED) durumuna taşıyacaktır. ${reasonSentence} Onay sonrası ilgili bakiye hareketi müşterinin 1:1 işlem hesabına işlenir; bu metin onay kaydına olay senaryosu olarak eklenecektir.`,
  ].join("\n\n");
}

export function readApprovalPayload(body: Record<string, unknown>) {
  const rawReason =
    body.approvalReason != null
      ? String(body.approvalReason)
      : body.adminNote != null
        ? String(body.adminNote)
        : "";
  const approvalReason = rawReason.trim().slice(0, 4000);
  const eventScenario =
    body.eventScenario != null ? String(body.eventScenario).trim().slice(0, 12000) : "";
  return {
    approvalReason: approvalReason || null,
    eventScenario: eventScenario || null,
    adminNote: approvalReason ? approvalReason.slice(0, 500) : null,
  };
}
