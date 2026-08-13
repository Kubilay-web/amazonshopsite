# Amazon Clone — Çok Kullanıcılı E-Ticaret

Next.js 16 (App Router) + MongoDB + Prisma + Cloudinary + Stripe ile yazılmış,
yönetim panelli, tam responsive bir e-ticaret uygulaması.

---

## Hızlı başlangıç

```bash
npm install
cp .env.example .env      # değerleri doldurun
npm run db:push           # koleksiyon ve indeksleri oluşturur
npm run db:seed           # örnek veri + demo görselleri
npm run dev               # http://localhost:3000
```

### Demo hesaplar (seed sonrası)

| Rol      | E-posta            | Şifre      |
| -------- | ------------------ | ---------- |
| Yönetici | `admin@amazon.com` | `admin123` |
| Müşteri  | `ayse@test.com`    | `test1234` |
| Müşteri  | `mehmet@test.com`  | `test1234` |

Kuponlar: `HOSGELDIN10` (%10, min 25 €) · `YAZ25` (%25, min 100 €) · `SUPER5` (%5)

> Veritabanı boşken kayıt olan **ilk kullanıcı otomatik olarak yönetici** olur.

---

## Komutlar

| Komut              | Açıklama                                          |
| ------------------ | ------------------------------------------------- |
| `npm run dev`      | Geliştirme sunucusu                               |
| `npm run build`    | Prisma client üretir + üretim derlemesi           |
| `npm run start`    | Üretim sunucusu                                   |
| `npm run db:push`  | Şemayı MongoDB'ye uygular                         |
| `npm run db:seed`  | Örnek veri yükler (83 ürün, 7 kategori, banner…)  |
| `npm run db:reset` | Veritabanını sıfırlar ve yeniden doldurur         |
| `npm run db:studio`| Prisma Studio                                     |

---

## Özellikler

### Mağaza (müşteri)

- **Ana sayfa** — otomatik geçen hero slider, kategori kartları, fırsat / öne çıkan /
  çok satan / yeni gelen ürün rayları (yatay kaydırmalı)
- **Katalog & arama** — metin araması, kategori + alt kategori, marka, fiyat aralığı,
  müşteri puanı ve indirim filtreleri, 6 sıralama seçeneği, sayfalama
- **Ürün detayı** — çoklu görsel galerisi, renk/beden varyantları, stok durumu,
  adet seçimi, "Sepete ekle" / "Hemen al", favoriler, benzer ürünler
- **Değerlendirmeler** — 1-5 yıldız, puan dağılım grafiği, kullanıcı başına tek yorum
  (düzenlenebilir), ürün puanı otomatik yeniden hesaplanır
- **Sepet** — misafirken `localStorage`, giriş yapınca veritabanına taşınır ve birleşir;
  fiyat/stok her zaman sunucudan doğrulanır
- **Para birimi** — tüm site ve Stripe ödemeleri **EUR (€)**; 50 € üzeri kargo bedava
- **Ödeme** — kayıtlı adres seçimi veya yeni adres, kupon uygulama, Stripe Checkout
  veya kapıda ödeme, sipariş notu
- **Hesabım** — siparişler (durum çizelgesi, kargo takip no, iptal), adres defteri,
  profil & şifre değiştirme, favoriler

### Yönetim paneli (`/admin`)

Kenar çubuğu beş bölüme ayrılmıştır (Genel · Katalog · Satış · Müşteri & içerik ·
Sistem) ve bekleyen sipariş / kritik stok / düşük puanlı yorum sayıları rozet olarak
gösterilir.

**Genel**

- **Panel** — ciro, 30 günlük ciro ve önceki döneme göre değişim, ortalama sepet,
  sipariş, ürün, kullanıcı, bekleyen sipariş, kritik stok, yorum, kupon, kategori ve
  banner kartları; tıklanabilir uyarı rozetleri; 14 günlük ciro grafiği; son
  siparişler, stoğu azalan ürünler ve son yorumlar
- **Raporlar** — 7/30/90/365 günlük aralık seçimi; ciro, ortalama sepet, ödeme
  dönüşümü, satılan adet, kargo geliri, kupon indirimi ve yeni kullanıcı metrikleri;
  günlük ciro grafiği; en çok satan ürünler, en değerli müşteriler, kategori
  kırılımı, sipariş & ödeme durumu dağılımı, kupon performansı; **CSV dışa aktarım**
  (sipariş, ürün, kullanıcı, yorum, kupon — Excel uyumlu, UTF-8)

**Katalog**

- **Ürünler** — arama, durum filtreleri (yayında/pasif/öne çıkan/indirimli),
  sayfalama, tam CRUD; çoklu görsel yükleme (Cloudinary) veya URL yapıştırma, kapak
  seçimi ve sıralama, renk/beden/etiket editörü; **toplu işlemler**: yayına al/pasife
  al, öne çıkar/kaldır, toplu indirim, toplu stok atama, kategori taşıma, toplu silme
- **Stok & fiyat** — satır içi düzenlenebilir stok/fiyat/indirim tablosu, değişiklikler
  biriktirilip tek istekte kaydedilir; kritik stok, tükenen, indirimli ve pasif
  filtreleri; toplam stok adedi ve stok değeri
- **Kategoriler** — kategori ve alt kategori CRUD, görsel, sıralama; ürünü olan
  kategori silinemez
- **Yorumlar** — puana göre filtre, metin araması, ürün ve kullanıcıya köprü, silme
  (silindiğinde ürün puanı yeniden hesaplanır)

**Satış**

- **Siparişler** — sipariş no/takip no/müşteri araması, duruma göre filtre, detay
  sayfası, sipariş/ödeme durumu ve kargo takip numarası güncelleme; **toplu durum
  atama** (iptalde stok otomatik iade edilir); CSV indirme
- **Kuponlar** — kod, yüzde, minimum tutar, kullanım limiti, tarih aralığı, aktiflik

**Müşteri & içerik**

- **Kullanıcılar** — arama, rol değiştirme (USER/ADMIN), hesap askıya alma, silme,
  CSV indirme
- **Müşteri detayı** (`/admin/users/[id]`) — toplam harcama, ödenmiş sipariş,
  ortalama sepet; sipariş geçmişi, adresler, aktif sepet, favoriler ve yorumlar
- **Bannerlar** — ana slayt ve orta şerit bannerları, sıra ve yayın durumu

**Sistem**

- **Ayarlar** — mağaza kimliği (site adı, açıklama, destek e-postası/telefonu, adres),
  duyuru şeridi, ticaret kuralları (bedava kargo limiti, kargo ücreti, KDV oranı,
  minimum sipariş tutarı, kritik stok eşiği), özellik anahtarları (kapıda ödeme,
  Stripe, yorumlar, yeni üyelik kaydı), bakım modu ve mesajı, sosyal medya
  bağlantıları. Ayarlar mağazaya canlı yansır: kargo hesabı ve minimum sipariş
  kontrolü hem istemcide hem `/api/checkout` içinde bu değerleri kullanır, kapatılan
  ödeme yöntemi sunucuda da reddedilir, bakım modunda ziyaretçiler bakım ekranını
  görürken yöneticiler mağazayı gezmeye devam eder.
- **İşlem kaydı** — panelde yapılan tüm oluşturma/güncelleme/silme/toplu işlemlerin
  denetim kaydı; işlem ve kayıt türüne göre filtre, 30 günden eski kayıtları temizleme

---

## Mimari

```
app/
  (shop)/            mağaza sayfaları (header + footer)
  (auth)/            giriş / kayıt
  admin/             yönetim paneli (middleware ile ADMIN korumalı)
  api/               REST uçları
components/
  layout/ product/ catalog/ checkout/ account/ admin/ ui/ providers/
lib/
  prisma.ts          tekil PrismaClient
  auth.ts / jwt.ts   JWT + httpOnly çerez oturumu
  queries.ts         sunucu bileşenleri için doğrudan DB okumaları
  admin-queries.ts   pano ve rapor sorguları, müşteri 360° görünümü
  settings.ts        site ayarları (tek satır, önbellekli, varsayılana düşer)
  audit.ts           yönetici işlemlerinin denetim kaydı
  reviews.ts         ürün puanı yeniden hesaplama
  cart.ts            sepet doğrulama (fiyat/stok sunucudan)
  orders.ts          ödeme/stok/iptal iş kuralları
  coupon.ts          kupon doğrulama
  cloudinary.ts      görsel yükleme
  stripe.ts          Stripe istemcisi
  validators.ts      zod şemaları
prisma/
  schema.prisma      MongoDB modelleri
  seed.ts            örnek veri
```

**Performans notu:** Sayfalar sunucu bileşeni olarak Prisma'ya *doğrudan* sorgu atar
(araya HTTP katmanı girmez). Ana sayfa gibi çok sorgulu ekranlarda sorgular
`Promise.all` ile paralel çalışır, ürün kartları için `select` ile yalnızca gereken
alanlar çekilir ve `schema.prisma` içinde kategori, fiyat, tarih, durum alanlarına
indeks tanımlanmıştır. REST uçları (`/api/*`) aynı iş mantığını dış istemcilere açar.

### API uçları

| Uç | Metotlar |
| --- | --- |
| `/api/auth/register` `/login` `/logout` `/me` | POST / GET |
| `/api/products` `/api/products/[id]` | GET · POST/PUT/DELETE (admin) |
| `/api/categories` `/api/subcategories` (+`/[id]`) | GET · POST/PUT/DELETE (admin) |
| `/api/cart` | GET · PUT · DELETE |
| `/api/wishlist` | GET · POST (toggle) · DELETE |
| `/api/reviews` | GET · POST · DELETE |
| `/api/addresses` (+`/[id]`) | GET · POST · PUT · DELETE |
| `/api/checkout` · `/api/checkout/verify` | POST |
| `/api/orders` `/api/orders/[id]` | GET · PATCH (admin) · DELETE |
| `/api/coupons` `/api/coupons/validate` | GET/POST/PUT/DELETE · POST |
| `/api/banners` `/api/users` (+`/[id]`) | admin |
| `/api/upload` | POST/DELETE (Cloudinary, admin) |
| `/api/webhooks/stripe` (+ `/api/webhook` takma adı) | POST |
| `/api/admin/settings` | GET · PUT (site ayarları) |
| `/api/admin/reviews` | GET · DELETE (yorum moderasyonu) |
| `/api/admin/inventory` | PATCH (toplu stok/fiyat) |
| `/api/admin/products/bulk` `/api/admin/orders/bulk` | POST (toplu işlem) |
| `/api/admin/logs` | GET · DELETE (denetim kaydı) |
| `/api/admin/export?type=…` | GET (CSV) |

---

## Stripe kurulumu

1. `.env` içine `STRIPE_SECRET_KEY` ve `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ekleyin.
2. Webhook'u yerelde dinleyin:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Çıktıdaki `whsec_...` değerini `STRIPE_WEBHOOK_SECRET` olarak yazın.

   Canlıda ise Stripe panelinde **Developers → Webhooks → Add endpoint** ile
   `https://<alan-adiniz>/api/webhooks/stripe` adresini ekleyin ve o endpoint'in
   kendi `whsec_` değerini kullanın. Her endpoint'in secret'ı farklıdır; başka bir
   endpoint'in secret'ı imza doğrulamasında 400 döndürür.
   Gereken olaylar: `checkout.session.completed`, `checkout.session.expired`,
   `payment_intent.payment_failed`, `charge.refunded`.
3. Test kartı: `4242 4242 4242 4242`, herhangi bir gelecek tarih ve CVC.

Webhook yapılandırılmasa bile ödeme sonrası dönüş sayfası `/api/checkout/verify`
ile Stripe oturumunu doğrulayıp siparişi "Ödendi" yapar. Stripe anahtarları hiç
tanımlı değilse kart seçeneği kapanır, **kapıda ödeme** ile sipariş verilebilir.

## Cloudinary kurulumu

`.env` içine `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
girin. Tanımlı değilse yönetim panelindeki yükleme butonu uyarı verir; görselleri
doğrudan URL yapıştırarak da ekleyebilirsiniz.

---

## Demo görselleri hakkında

`npm run db:seed` çalışırken ürün fotoğrafları bir kez indirilip `public/seed`
klasörüne yazılır (bu klasör `.gitignore`'dadır, seed ile yeniden üretilir).
Böylece site çalışırken dış bir görsel servisine bağımlı olmaz. Kendi ürün
fotoğraflarınızı yönetim panelinden Cloudinary ile yükleyebilirsiniz.

## Güvenlik notları

- Şifreler `bcrypt` ile hash'lenir, oturum `HS256` imzalı JWT + `httpOnly` çerez.
- `/admin`, `/account`, `/checkout`, `/wishlist` middleware ile korunur; ayrıca her
  API ucunda `requireUser` / `requireAdmin` kontrolü yapılır.
- Sepet ve sipariş tutarları **istemciden alınmaz**, her zaman veritabanındaki güncel
  fiyat ve stok üzerinden yeniden hesaplanır.
- Stripe webhook imzası doğrulanır; sipariş ödeme işaretlemesi idempotenttir.

---

Bu proje eğitim amaçlı bir demodur; Amazon.com ile bir ilişkisi yoktur.
