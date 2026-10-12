/**
 * Live-support auto-reply. Uses an LLM only when OPENAI_API_KEY is set; otherwise
 * answers from a fixed FAQ built from site content. Never invents account data,
 * licences, returns or guarantees.
 */

export const AI_WORKER_NAME = "7FX Asistan";
export const AI_WORKER_ID = "ai";
export const HANDOFF_TEXT = "Canlı temsilciye bağlanıyorsunuz. Bir temsilcimiz en kısa sürede bu sohbetten size yanıt verecek.";

export function normalizeTr(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function wantsHuman(msg: string): boolean {
  const n = normalizeTr(msg);
  return /musteri temsilci|temsilci|operator|canli destek|insan(la)? gorus/.test(n);
}

type Faq = { keys: string[]; answer: string };
const FAQ: Faq[] = [
  { keys: ["yatir", "para yatir", "deposit", "iban", "havale", "kripto ile"], answer: "Para yatırmak için terminalde Para Yatır bölümünü açın. Aktif yöntemler (IBAN/havale veya kripto) ve ödeme bilgileri orada gösterilir. Gönderimden sonra talebiniz ekibimiz tarafından kontrol edilip onaylanır." },
  { keys: ["cek", "withdraw", "para cek", "cekim"], answer: "Para çekme talebini Profil > Para çekme bölümünden IBAN/hesap bilgisi veya cüzdan adresiyle oluşturabilirsiniz. Talepler ekip kontrolünden sonra işlenir; süre yönteme göre değişebilir." },
  { keys: ["hesap ac", "kayit", "register", "uye"], answer: "Hesap açmak için ana sayfadaki Hesap aç butonunu kullanın, formu doldurun ve giriş yapın. Ardından terminale erişebilirsiniz." },
  { keys: ["sifre", "giris yap", "login", "giremiyorum"], answer: "Giriş sorunlarında e-posta ve şifrenizi kontrol edin. Şifrenizi Profil bölümünden değiştirebilirsiniz; hesabınıza erişemiyorsanız 'temsilci' yazarak canlı temsilciye bağlanabilirsiniz." },
  { keys: ["piyasa", "enstruman", "sembol", "forex", "hisse", "kripto", "altin", "emtia"], answer: "7FX üzerinden forex pariteleri, hisse ve endeksler, kripto varlıklar ve altın/petrol gibi emtialar tek hesap altında web terminalinden izlenip işlem yapılabilir." },
  { keys: ["guven", "ssl", "guvenlik", "kyc", "aml"], answer: "Bağlantılar SSL/TLS ile şifrelenir; oturum çerezli kimlik doğrulama ve korumalı yönetim alanları kullanılır. Gerekli durumlarda kimlik/uyum (KYC/AML) kontrolleri istenebilir." },
  { keys: ["lisans", "regulasyon", "duzenleyici"], answer: "Lisans bilgileri yalnızca ana sayfadaki Lisanslar bölümünde, resmi kayıt bağlantısıyla birlikte yayımlanır. Orada yer almayan bir lisans bilgisini teyit edemem." },
  { keys: ["mobil", "uygulama", "telefon", "pwa", "indir"], answer: "Platform masaüstü ve mobil tarayıcılarda çalışır; tarayıcı menüsünden Ana ekrana ekle diyerek uygulama gibi kullanabilirsiniz." },
  { keys: ["bakiye", "pozisyon", "emir", "kar", "zarar", "hesabim"], answer: "Hesabınıza özel bakiye, pozisyon ve işlem bilgilerini terminal ve Profil sayfasında görebilirsiniz. Hesabınıza özel bir konuyu incelemek için 'temsilci' yazarak canlı temsilciye bağlanın." },
];

export function faqAnswer(msg: string): string {
  const n = normalizeTr(msg);
  let best: Faq | null = null, bestHits = 0;
  for (const f of FAQ) {
    const hits = f.keys.filter((k) => n.includes(k)).length;
    if (hits > bestHits) { best = f; bestHits = hits; }
  }
  if (best) return best.answer + "\n\nCanlı temsilci için 'temsilci' yazabilirsiniz.";
  if (/^(merhaba|selam|iyi gunler|hello|hi)\b/.test(n))
    return "Merhaba! 7FX destek asistanıyım. Para yatırma/çekme, hesap, piyasalar veya platform hakkında sorabilirsiniz. Canlı temsilci için 'temsilci' yazın.";
  return "Bu soruyu otomatik olarak yanıtlayamıyorum. Canlı temsilciye bağlanmak için 'temsilci' yazabilirsiniz.";
}

const SYSTEM = `You are the 7FX live-support assistant on 7fx.customer.org.tr. Reply in the customer's language, briefly.
Only use this site information:
${FAQ.map((f) => "- " + f.answer).join("\n")}
Rules: Never invent or state account balances, positions, transactions, personal data, licences, regulators, returns, profits or guarantees. Never give investment advice. If the question needs account-specific data or anything not covered above, say you cannot confirm it and that the customer can type "temsilci" to reach a live agent.`;

export async function aiReply(msg: string, history: { from: "customer" | "support"; body: string }[]): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return faqAnswer(msg);
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 20_000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: ctl.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.SUPPORT_AI_MODEL || "gpt-4.1-mini",
        temperature: 0.2,
        max_tokens: 350,
        messages: [
          { role: "system", content: SYSTEM },
          ...history.slice(-8).map((h) => ({ role: h.from === "customer" ? "user" : "assistant", content: h.body.slice(0, 1500) })),
          { role: "user", content: msg.slice(0, 1500) },
        ],
      }),
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`LLM ${res.status}`);
    const d = await res.json();
    const out = String(d.choices?.[0]?.message?.content || "").trim();
    return out || faqAnswer(msg);
  } catch (e) {
    console.error("[support-ai]", e);
    return faqAnswer(msg);
  }
}
