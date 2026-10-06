# 7FX — Anti-hırsızlık / anti-klon önerileri (ONAY İÇİN — henüz uygulanmadı)

Kısa özet: CRM veri sızıntısı ve platformun kopyalanması riskine karşı katmanlı savunma.  
**Dürüst sınır:** Tarayıcıda sağ tık / DevTools kapatmak veya kaynak kodunu “saklamak” profesyonel saldırgana karşı güçlü değildir; asıl değer sunucu tarafı yetki, log ve erişim kontrolündedir.

---

## Kolay / yüksek değer

- **Sıkı yetki modeli:** CRM yazma (`requireAdminWrite`) ile okuma ayrımı (zaten RO admin var) — tüm mutasyonlarda tutarlı denetim.
- **Oturum güvenliği:** `httpOnly` + `Secure` + kısa ömür / idle timeout; şüphede tüm oturumları düşürme; şifre değişince JWT iat iptali (kısmen var).
- **API auth:** Tüm `/api/admin/*` için ADMIN zorunlu; müşteri API’lerinde yalnızca kendi `userId` verisi; IDOR testleri.
- **Rate limit:** Login, password reset, admin list/export, support mesajı — IP + hesap bazlı.
- **CORS daraltma:** Varsayılan olarak cross-origin credential **yok**; `crm7fx` için CORS/cookie Domain açmak yüzey büyütür (statik CRM-on-Natro riski — şimdilik **önerilmez** / bekletildi).
- **CSP sıkılaştırma:** `unsafe-inline`/`unsafe-eval` azaltma; `connect-src` allowlist; `frame-ancestors 'none'` (CRM).
- **`/izcrm` source map kapalı** production’da; `productionBrowserSourceMaps: false`.
- **Robots / noindex:** CRM host ve `/izcrm` için `X-Robots-Tag: noindex` + `robots.txt Disallow`.
- **Audit log:** Kim, neyi, hangi trader’ı görüntüledi/dışa aktardı (ekran görüntüsü sinyali + mevcut audit).
- **ToS / sözleşme:** Müşteri ve çalışan için veri kopyalama / ekran kaydı yasağı + hukuki yaptırım maddesi (teknik değil, caydırıcı).

## Orta

- **CRM ekran filigranı:** Sayfada yarı saydam `adminId · email · timestamp` (CSS/canvas) — sızdırılan ekran görüntüsünde iz bırakır; kaldırılabilir ama pratikte faydalı.
- **Session binding:** Oturumu UA + hafif fingerprint / IP subnet ile bağlama; ani coğrafya değişiminde re-auth.
- **Cihaz / oturum listesi:** Admin “aktif oturumlar” + uzaktan logout.
- **Hassas alan maskeleme:** IBAN/KYC varsayılan gizli; “göster” ayrı yetki + log.
- **Export kontrolü:** CSV/PDF export quota + zorunlu sebep alanı + alert.
- **WAF / bot:** Cloudflare (veya benzeri) admin path rate limit + challenge.
- **2FA** özellikle tam yetkili ADMIN için (TOTP).
- **Ayrı CRM origin + VPN / IP allowlist** (ofis IP) — dışarıdan `/izcrm` kapalı.

## Aşırı / sahte güvenlik (düşük gerçek değer)

- **Sağ tık / DevTools engeli:** Kolay aşılır; UX’i bozar; “güvenlik” hissi verir, koruma sağlamaz. İsteğe bağlı kozmetik.
- **JS obfuscation / “kod kilidi”:** Client bundle yine indirilir; reverse engineering geciktirir, engellemez.
- **Tam ekran / DRM benzeri kilitler:** Broker web app’te pratik değil; kırılgan.
- **Statik CRM’i Natro’da host + ana API’ye CORS+Domain cookie:** Kolay kopyalanır UI + geniş cookie yüzeyi; **klon ve oturum çalma riskini artırır** (bu yüzden şimdilik durduruldu).
- **“Kaynak kodu görünmesin” vaadi:** Mümkün değil; sunucu sırları (AUTH_SECRET, DB) asıl korunacaklar.

## CRM veri hırsızlığına özel

1. Least privilege + RO roller (devam).  
2. View/export audit + anomaly alert (çok trader açma).  
3. Watermark + hukuki ToS.  
4. IP allowlist / 2FA.  
5. Natro statik CRM **onaysız açılmasın**.

## Platform klonlamaya özel

1. Marka/asset lisans + ToS.  
2. API anahtarları ve fiyat feed’i sunucuda; client’ta secret yok.  
3. Source map kapalı; public repo yok.  
4. Klon “UI kopyası” kaçınılmaz olabilir — farklılaştırıcı: veri, likidite, operasyon, yasal entity.  
5. Obfuscation = zaman kazancı, kale değil.

---

**Onay soruları (kullanıcıya):**  
1) Production’da CRM için IP allowlist / 2FA ister misiniz?  
2) CRM filigranı (admin id) açılsın mı?  
3) Statik CRM-on-Natro tamamen iptal mi, yoksa VPN arkasına mı?  
4) Export audit + rate limit bu sprintte mi?



## Implementation status (2026-10-06)
High-value items (1)–(11) implemented on Railway CRM; Natro static CRM remains paused.
