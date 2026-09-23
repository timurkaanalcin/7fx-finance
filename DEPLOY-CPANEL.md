# M1 Finance — Natro cPanel (paylaşımlı hosting) kurulum

Hedef alan adı / alt alan: **`m1.customer.org.tr`**  
Sunucu: Natro cPanel paylaşımlı hosting (Node.js App Selector / Application Manager).

Bu proje Next.js 14 özel sunucu (`server.js`) + **MySQL** (Prisma) kullanır.

---

## 1. Alt alan adı (subdomain)

1. cPanel → **Subdomains** (Alt Alan Adları).
2. Subdomain: `m1` → sonuç: `m1.customer.org.tr`.
3. Document Root’u not edin (ör. `m1.customer.org.tr` veya `public_html/m1`).
4. DNS yayılmasını bekleyin (genelde birkaç dakika–saat).

---

## 2. MySQL veritabanı oluşturma

1. cPanel → **MySQL® Databases** (MySQL Veritabanları).
2. Yeni veritabanı oluşturun (ör. `kullanici_m1` — cPanel önek ekler).
3. Yeni MySQL kullanıcısı oluşturun; güçlü şifre kaydedin.
4. Kullanıcıyı veritabanına **ALL PRIVILEGES** ile ekleyin.
5. Bağlantı bilgileri (çoğu Natro paylaşımlı sunucuda):
   - Host: `localhost`
   - Port: `3306`
   - Veritabanı adı / kullanıcı / şifre: cPanel’de görünen tam adlar

`DATABASE_URL` örneği:

```text
mysql://DB_USER:DB_PASSWORD@localhost:3306/DB_NAME
```

Şifrede `@`, `#`, `%` gibi karakterler varsa URL-encode edin (`@` → `%40`).

---

## 3. Node.js uygulaması (Application Manager)

1. cPanel → **Setup Node.js App** / **Application Manager**.
2. **Create Application**:
   - Node.js sürümü: mümkünse **20.x** veya **22.x** (proje `engines` ile 22 önerir; sunucuda ne varsa onu seçin).
   - Application mode: **Production**.
   - Application root: projeyi yükleyeceğiniz dizin (ör. `m1` veya `nodejs/m1`).
   - Application URL: `m1.customer.org.tr` (veya ilgili subdomain).
   - Application startup file: **`server.js`**
3. Uygulamayı oluşturun; cPanel’in verdiği **PORT** değerini not edin (ortamda otomatik gelir).

---

## 4. Ortam değişkenleri (zorunlu)

Node.js App → **Environment variables** (veya `.env` dosyası — cPanel arayüzü tercih edilir):

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `AUTH_SECRET` | Evet | JWT imza anahtarı. Üret: `openssl rand -base64 32` |
| `DATABASE_URL` | Evet | MySQL bağlantı dizesi (`mysql://...`) |
| `NODE_ENV` | Önerilir | `production` (`npm start` zaten set eder) |
| `PORT` | Genelde otomatik | cPanel Application Manager atar — elle değiştirmeyin |
| `HOSTNAME` | İsteğe bağlı | Yoksa `server.js` `0.0.0.0` kullanır |

İsteğe bağlı:

| Değişken | Açıklama |
|----------|----------|
| `JWT_SECRET` | `AUTH_SECRET` yoksa yedek |
| `SEED_SECRET` | `POST /api/seed` koruması |

**Asla** gerçek `AUTH_SECRET` / DB şifresini git’e commit etmeyin.

---

## 5. Dosyaları yükleme

### Seçenek A — ZIP (önerilen)

Yerelde (veya CI’da):

```bash
./scripts/pack-cpanel.sh
# → /tmp/deskflow-trade-cpanel-YYYYMMDD-HHMMSS.zip
```

cPanel **File Manager** ile Application root’a yükleyip açın (`Extract`).

### Seçenek B — Git

Application root’ta:

```bash
git clone https://github.com/timurkaanalcin/deskflow-trade.git .
# veya mevcut repoyu pull edin
```

`node_modules` ve `.env` yüklemeyin; sunucuda kurulacak.

---

## 6. Kurulum, build ve start

cPanel Node.js App terminalinde **veya** SSH ile application root’ta:

```bash
# Sanal ortamı etkinleştirin (cPanel “Enter to virtual environment” komutu)
npm install

# Şemayı MySQL’e uygulayın
npx prisma db push

# (İsteğe bağlı) demo kullanıcılar
npm run db:seed

# Production build
npm run build

# Uygulamayı Application Manager’dan Restart edin
# veya:
npm start
# (= NODE_ENV=production node server.js)
```

`package.json` scriptleri:

- `build` → `prisma generate && next build`
- `start` → `NODE_ENV=production node server.js`

---

## 7. SSL (HTTPS)

1. cPanel → **SSL/TLS Status** veya **Let’s Encrypt**.
2. `m1.customer.org.tr` için sertifika kurun / AutoSSL’i çalıştırın.
3. **Force HTTPS Redirect** açın (mümkünse).
4. Tarayıcıda `https://m1.customer.org.tr` doğrulayın.

---

## 8. Kontrol listesi

- [ ] `m1.customer.org.tr` DNS + SSL yeşil
- [ ] MySQL DB + kullanıcı + `DATABASE_URL`
- [ ] `AUTH_SECRET` tanımlı
- [ ] Startup file = `server.js`
- [ ] `npm install` + `prisma db push` + `npm run build` hatasız
- [ ] App Restart sonrası login çalışıyor
- [ ] Demo: `trader@deskflow.local` / `Trade123!` (seed sonrası)

---

## Sorun giderme

| Belirti | Olası neden |
|---------|-------------|
| Uygulama açılmıyor | Startup `server.js` değil; `PORT` yanlış; app durmuş |
| Prisma / DB hatası | `DATABASE_URL` yanlış; kullanıcı yetkisi; şifre URL-encode |
| 502 / Passenger hatası | `npm run build` yapılmamış; Node sürümü uyumsuz |
| Auth / oturum düşüyor | `AUTH_SECRET` eksik veya her restart’ta değişiyor |

Loglar: Node.js App → **Error / Application log**, veya `~/logs/`.

---

## Yerel smoke (build)

Gerçek MySQL olmadan client generate + Next build:

```bash
DATABASE_URL="mysql://user:pass@127.0.0.1:3306/deskflow_trade" npm run build
```

---

Daha fazla ürün bilgisi: `README.md`. Netlify notları: `netlify.toml` (MySQL şeması ile Netlify Postgres uyumlu değildir; cPanel MySQL kullanın).
