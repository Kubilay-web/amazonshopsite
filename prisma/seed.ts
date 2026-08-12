/**
 * Örnek veri yükleyici.
 *   npm run db:seed
 * Mevcut koleksiyonları temizleyip demo kategoriler, ürünler, kullanıcılar,
 * kuponlar ve bannerlar oluşturur. Ürün görselleri bir kez indirilip
 * `public/seed` altına yazılır, böylece site dış servise bağımlı kalmaz.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // ortam değişkenleri dışarıdan gelebilir
}

const prisma = new PrismaClient();
const SEED_DIR = path.join(process.cwd(), "public", "seed");

// --------------------------------------------------------------- görseller

type ImageJob = { file: string; url: string };
const jobs: ImageJob[] = [];

let lockCounter = 100;

/** Kategori/banner için konu bazlı fotoğraf. */
function themeImage(keyword: string, width = 800, height = 800) {
  lockCounter += 1;
  const file = `tema-${keyword.replace(/[^a-z0-9]+/gi, "-")}-${lockCounter}.jpg`;
  jobs.push({
    file,
    url: `https://loremflickr.com/${width}/${height}/${keyword}?lock=${lockCounter}`,
  });
  return `/seed/${file}`;
}

/**
 * Banner arka planı: yerel SVG degrade. Alakasız stok fotoğraf yerine
 * marka renkleriyle temiz bir zemin üretir.
 */
const svgFiles: { file: string; content: string }[] = [];

function gradientBanner(
  name: string,
  from: string,
  to: string,
  width = 1600,
  height = 600,
) {
  const file = `banner-${name}.svg`;
  svgFiles.push({
    file,
    content: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="glow" cx="78%" cy="28%" r="52%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <g fill="#ffffff" opacity="0.07">
    <circle cx="${width * 0.82}" cy="${height * 0.3}" r="${height * 0.42}"/>
    <circle cx="${width * 0.62}" cy="${height * 0.85}" r="${height * 0.3}"/>
    <circle cx="${width * 0.95}" cy="${height * 0.8}" r="${height * 0.22}"/>
  </g>
  <path d="M0 ${height} L${width * 0.35} ${height * 0.55} L${width * 0.35} ${height} Z" fill="#ffffff" opacity="0.05"/>
</svg>`,
  });
  return `/seed/${file}`;
}

async function writeSvgFiles() {
  await fs.mkdir(SEED_DIR, { recursive: true });
  await Promise.all(
    svgFiles.map((s) => fs.writeFile(path.join(SEED_DIR, s.file), s.content, "utf8")),
  );
}

/** Kategori kartı için o kategoriyi temsil eden ürün fotoğrafı. */
function categoryImage(slug: string, fallbackKeyword: string) {
  const urls = productPool.get(slug);
  if (!urls?.length) return themeImage(fallbackKeyword, 600, 450);
  const url = urls[0];
  const file = url
    .replace("https://cdn.dummyjson.com/product-images/", "")
    .replace(/[^a-z0-9.]+/gi, "-");
  jobs.push({ file, url });
  return `/seed/${file}`;
}

/** Gerçek ürün fotoğrafları (dummyjson CDN) — slug bazlı havuz. */
const productPool = new Map<string, string[]>();

async function loadProductImagePool() {
  try {
    const res = await fetch("https://dummyjson.com/products?limit=200&select=images", {
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { products: { images: string[] }[] };

    for (const item of data.products) {
      if (!item.images?.length) continue;
      const slug = item.images[0].split("/").slice(-2)[0];
      productPool.set(slug, item.images);
    }
    console.log(`   ${productPool.size} ürün görseli havuza alındı`);
  } catch {
    console.log("   ⚠ Ürün görselleri alınamadı, konu bazlı fotoğraflar kullanılacak");
  }
}

function productImages(slug: string, fallbackKeyword: string) {
  const urls = productPool.get(slug);
  if (!urls || urls.length === 0) {
    return [themeImage(fallbackKeyword), themeImage(fallbackKeyword)];
  }
  return urls.slice(0, 4).map((url) => {
    const file = url
      .replace("https://cdn.dummyjson.com/product-images/", "")
      .replace(/[^a-z0-9.]+/gi, "-");
    jobs.push({ file, url });
    return `/seed/${file}`;
  });
}

async function download({ file, url }: ImageJob, attempt = 1): Promise<boolean> {
  const dest = path.join(SEED_DIR, file);
  try {
    const stat = await fs.stat(dest).catch(() => null);
    if (stat && stat.size > 512) return true; // zaten indirilmiş

    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 512) throw new Error("boş yanıt");

    await fs.writeFile(dest, buffer);
    return true;
  } catch {
    if (attempt < 4) {
      await new Promise((r) => setTimeout(r, attempt * 700));
      return download({ file, url }, attempt + 1);
    }
    return false;
  }
}

/** Toplanan tüm görselleri sınırlı eşzamanlılıkla indirir. */
async function downloadAll() {
  await fs.mkdir(SEED_DIR, { recursive: true });
  const unique = new Map(jobs.map((j) => [j.file, j]));
  const queue = [...unique.values()];
  const total = queue.length;
  let done = 0;
  let failed = 0;

  async function worker() {
    for (;;) {
      const job = queue.shift();
      if (!job) return;
      if (!(await download(job))) failed += 1;
      done += 1;
      if (done % 40 === 0) process.stdout.write(`   ${done}/${total}\n`);
    }
  }

  await Promise.all(Array.from({ length: 6 }, worker));
  console.log(`   ${total - failed}/${total} görsel hazır${failed ? ` (${failed} başarısız)` : ""}`);
}

// ------------------------------------------------------------------ yardım

const trMap: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
  Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u",
};

function slugify(input: string) {
  return input
    .split("")
    .map((ch) => trMap[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// -------------------------------------------------------------- kategoriler

const CATEGORIES = [
  {
    name: "Elektronik",
    order: 1,
    keyword: "electronics", cover: "iphone-13-pro",
    subs: ["Telefon", "Bilgisayar", "Kulaklık & Ses", "Tablet", "Akıllı Saat"],
  },
  {
    name: "Moda",
    order: 2,
    keyword: "fashion", cover: "nike-air-jordan-1-red-and-black",
    subs: ["Kadın Giyim", "Erkek Giyim", "Ayakkabı", "Çanta", "Aksesuar"],
  },
  {
    name: "Ev & Yaşam",
    order: 3,
    keyword: "interior,home", cover: "annibale-colombo-sofa",
    subs: ["Mobilya", "Mutfak", "Dekorasyon"],
  },
  {
    name: "Süpermarket",
    order: 4,
    keyword: "groceries", cover: "nescafe-coffee",
    subs: ["Gıda", "İçecek", "Temizlik"],
  },
  {
    name: "Spor & Outdoor",
    order: 5,
    keyword: "sport", cover: "basketball",
    subs: ["Spor Ekipmanları"],
  },
  {
    name: "Kozmetik",
    order: 6,
    keyword: "cosmetics", cover: "chanel-coco-noir-eau-de",
    subs: ["Makyaj", "Parfüm", "Cilt Bakımı"],
  },
  {
    name: "Otomotiv",
    order: 7,
    keyword: "motorcycle", cover: "kawasaki-z800",
    subs: ["Motosiklet"],
  },
];

const COLORS = {
  siyah: { name: "Siyah", hex: "#111111" },
  beyaz: { name: "Beyaz", hex: "#f5f5f5" },
  gri: { name: "Uzay Grisi", hex: "#6b7280" },
  gumus: { name: "Gümüş", hex: "#cbd5e1" },
  altin: { name: "Altın", hex: "#d4af37" },
  mavi: { name: "Mavi", hex: "#2563eb" },
  kirmizi: { name: "Kırmızı", hex: "#dc2626" },
  yesil: { name: "Yeşil", hex: "#16a34a" },
  lacivert: { name: "Lacivert", hex: "#1e3a8a" },
  bej: { name: "Bej", hex: "#d6c7ae" },
};

const GIYIM_BEDEN = ["XS", "S", "M", "L", "XL", "XXL"];
const AYAKKABI_ERKEK = ["40", "41", "42", "43", "44", "45"];
const AYAKKABI_KADIN = ["36", "37", "38", "39", "40", "41"];

type SeedProduct = {
  img: string; // dummyjson ürün slug'ı
  kw: string; // görsel bulunamazsa konu anahtarı
  title: string;
  brand: string;
  price: number;
  discount?: number;
  stock: number;
  sub: string;
  category: string;
  description: string;
  details?: string;
  tags: string[];
  colors?: { name: string; hex: string }[];
  sizes?: string[];
  featured?: boolean;
  free?: boolean;
};

const PRODUCTS: SeedProduct[] = [
  // ============================================================ ELEKTRONİK
  {
    img: "iphone-13-pro", kw: "smartphone",
    title: "Apple iPhone 13 Pro 256 GB Akıllı Telefon",
    brand: "Apple", price: 1449, discount: 12, stock: 34,
    category: "Elektronik", sub: "Telefon",
    description:
      "6.1 inç Super Retina XDR ProMotion ekran, A15 Bionic çip ve Pro kamera sistemi. Sinematik modda 1080p video kaydı.",
    details:
      "Ekran: 6.1'' Super Retina XDR 120Hz\nÇip: A15 Bionic\nDepolama: 256 GB\nKamera: 12 MP üçlü sistem\nBatarya: 22 saat video oynatma",
    tags: ["telefon", "iphone", "apple", "5g"],
    colors: [COLORS.gri, COLORS.gumus, COLORS.altin],
    sizes: ["128 GB", "256 GB", "512 GB"],
    featured: true, free: true,
  },
  {
    img: "samsung-galaxy-s10", kw: "smartphone",
    title: "Samsung Galaxy S10 128 GB Akıllı Telefon",
    brand: "Samsung", price: 399, discount: 25, stock: 52,
    category: "Elektronik", sub: "Telefon",
    description:
      "Dynamic AMOLED sonsuzluk ekran, ekran içi parmak izi okuyucu ve üçlü arka kamera. Kablosuz güç paylaşımı desteği.",
    tags: ["telefon", "samsung", "android"],
    colors: [COLORS.siyah, COLORS.beyaz, COLORS.mavi],
    free: true,
  },
  {
    img: "oppo-f19-pro-plus", kw: "smartphone",
    title: "Oppo F19 Pro+ 5G 128 GB",
    brand: "Oppo", price: 299, discount: 18, stock: 68,
    category: "Elektronik", sub: "Telefon",
    description:
      "50 W flaş şarj ile 30 dakikada %75 doluluk. AMOLED ekran ve 48 MP dörtlü kamera kurulumu.",
    tags: ["telefon", "oppo", "5g"],
    colors: [COLORS.siyah, COLORS.gumus],
  },
  {
    img: "realme-xt", kw: "smartphone",
    title: "Realme XT 64 MP Dörtlü Kameralı Telefon",
    brand: "Realme", price: 199, discount: 20, stock: 74,
    category: "Elektronik", sub: "Telefon",
    description:
      "64 MP ana kamera, 4000 mAh batarya ve VOOC 3.0 hızlı şarj. Süper AMOLED ekran.",
    tags: ["telefon", "realme", "kamera"],
    colors: [COLORS.mavi, COLORS.beyaz],
  },
  {
    img: "apple-iphone-charger", kw: "charger",
    title: "Apple 20W USB-C Hızlı Şarj Adaptörü",
    brand: "Apple", price: 19.99, discount: 15, stock: 240,
    category: "Elektronik", sub: "Telefon",
    description:
      "20 W güç çıkışı ile uyumlu iPhone modellerini 30 dakikada %50'ye kadar şarj eder.",
    tags: ["şarj", "adaptör", "aksesuar"],
  },
  {
    img: "apple-magsafe-battery-pack", kw: "powerbank",
    title: "Apple MagSafe Taşınabilir Batarya",
    brand: "Apple", price: 79, discount: 20, stock: 88,
    category: "Elektronik", sub: "Telefon",
    description:
      "Mıknatısla telefona yapışır, kablosuz şarj eder. Ters şarj ve akıllı güç yönetimi.",
    tags: ["powerbank", "magsafe", "aksesuar"],
    colors: [COLORS.beyaz],
  },
  {
    img: "apple-macbook-pro-14-inch-space-grey", kw: "laptop",
    title: "Apple MacBook Pro 14'' M3 Pro Uzay Grisi",
    brand: "Apple", price: 1999, discount: 8, stock: 15,
    category: "Elektronik", sub: "Bilgisayar",
    description:
      "M3 Pro çip, 14.2 inç Liquid Retina XDR ekran ve 18 saate varan pil ömrü. Profesyonel iş akışları için tasarlandı.",
    details: "Çip: Apple M3 Pro\nRAM: 18 GB\nSSD: 512 GB\nEkran: 14.2'' Liquid Retina XDR",
    tags: ["laptop", "macbook", "apple", "bilgisayar"],
    colors: [COLORS.gri, COLORS.gumus],
    featured: true, free: true,
  },
  {
    img: "asus-zenbook-pro-dual-screen-laptop", kw: "laptop",
    title: "Asus ZenBook Pro Çift Ekranlı Dizüstü Bilgisayar",
    brand: "Asus", price: 1649, discount: 15, stock: 11,
    category: "Elektronik", sub: "Bilgisayar",
    description:
      "İkinci ScreenPad Plus ekranı ile çoklu görev deneyimi. OLED ana ekran ve ayrık ekran kartı.",
    tags: ["laptop", "asus", "bilgisayar"],
    featured: true, free: true,
  },
  {
    img: "new-dell-xps-13-9300-laptop", kw: "laptop",
    title: "Dell XPS 13 9300 Ultrabook",
    brand: "Dell", price: 1199, discount: 10, stock: 18,
    category: "Elektronik", sub: "Bilgisayar",
    description:
      "Neredeyse çerçevesiz InfinityEdge ekran, alüminyum gövde ve 1.2 kg hafif tasarım.",
    tags: ["laptop", "dell", "ultrabook"],
    free: true,
  },
  {
    img: "lenovo-yoga-920", kw: "laptop",
    title: "Lenovo Yoga 920 Dokunmatik 2'si 1 Arada",
    brand: "Lenovo", price: 999, discount: 22, stock: 24,
    category: "Elektronik", sub: "Bilgisayar",
    description:
      "360 derece dönen menteşe ile dizüstü ve tablet modları. Kalem desteği ve dokunmatik ekran.",
    tags: ["laptop", "lenovo", "dokunmatik"],
  },
  {
    img: "huawei-matebook-x-pro", kw: "laptop",
    title: "Huawei MateBook X Pro 14.2'' Dizüstü",
    brand: "Huawei", price: 1049, discount: 12, stock: 16,
    category: "Elektronik", sub: "Bilgisayar",
    description: "3.1K dokunmatik ekran, 1 kg altı ağırlık ve tam gün pil ömrü.",
    tags: ["laptop", "huawei", "bilgisayar"],
  },
  {
    img: "apple-airpods", kw: "headphones",
    title: "Apple AirPods 2. Nesil Kablosuz Kulaklık",
    brand: "Apple", price: 109, discount: 20, stock: 165,
    category: "Elektronik", sub: "Kulaklık & Ses",
    description:
      "H1 çip ile anında eşleşme, Hey Siri desteği ve şarj kutusuyla 24 saate varan dinleme süresi.",
    details: "Çip: Apple H1\nPil: 5 saat + 19 saat kutu\nBağlantı: Bluetooth 5.0",
    tags: ["kulaklık", "airpods", "bluetooth"],
    colors: [COLORS.beyaz],
    featured: true, free: true,
  },
  {
    img: "apple-airpods-max-silver", kw: "headphones",
    title: "Apple AirPods Max Kulak Üstü Kulaklık",
    brand: "Apple", price: 499, discount: 15, stock: 32,
    category: "Elektronik", sub: "Kulaklık & Ses",
    description:
      "Aktif gürültü engelleme, uzamsal ses ve hafıza köpüğü kulak yastıkları ile üstün konfor.",
    tags: ["kulaklık", "anc", "apple"],
    colors: [COLORS.gumus, COLORS.gri],
    free: true,
  },
  {
    img: "beats-flex-wireless-earphones", kw: "headphones",
    title: "Beats Flex Kablosuz Kulak İçi Kulaklık",
    brand: "Beats", price: 59, discount: 30, stock: 96,
    category: "Elektronik", sub: "Kulaklık & Ses",
    description:
      "Mıknatıslı kulaklıklar, 12 saat pil ömrü ve Fast Fuel ile 10 dakikada 1.5 saat dinleme.",
    tags: ["kulaklık", "beats", "bluetooth"],
    colors: [COLORS.siyah, COLORS.mavi],
  },
  {
    img: "amazon-echo-plus", kw: "speaker",
    title: "Amazon Echo Plus Akıllı Hoparlör",
    brand: "Amazon", price: 89, discount: 25, stock: 61,
    category: "Elektronik", sub: "Kulaklık & Ses",
    description:
      "Dahili akıllı ev merkezi, oda dolduran ses ve sesli asistan desteği ile evinizi kontrol edin.",
    tags: ["hoparlör", "akıllı ev", "asistan"],
    colors: [COLORS.siyah, COLORS.beyaz],
    featured: true,
  },
  {
    img: "apple-homepod-mini-cosmic-grey", kw: "speaker",
    title: "Apple HomePod Mini Akıllı Hoparlör",
    brand: "Apple", price: 79, discount: 10, stock: 47,
    category: "Elektronik", sub: "Kulaklık & Ses",
    description: "360 derece ses, Siri desteği ve akıllı ev otomasyonu tek bir küçük gövdede.",
    tags: ["hoparlör", "homepod", "akıllı ev"],
    colors: [COLORS.gri, COLORS.beyaz],
  },
  {
    img: "ipad-mini-2021-starlight", kw: "tablet",
    title: "Apple iPad Mini 2021 64 GB Wi-Fi",
    brand: "Apple", price: 549, discount: 12, stock: 29,
    category: "Elektronik", sub: "Tablet",
    description:
      "8.3 inç Liquid Retina ekran, A15 Bionic çip ve Apple Pencil 2. nesil desteği.",
    tags: ["tablet", "ipad", "apple"],
    sizes: ["64 GB", "256 GB"],
    featured: true, free: true,
  },
  {
    img: "samsung-galaxy-tab-s8-plus-grey", kw: "tablet",
    title: "Samsung Galaxy Tab S8+ 128 GB",
    brand: "Samsung", price: 599, discount: 18, stock: 22,
    category: "Elektronik", sub: "Tablet",
    description:
      "12.4 inç Super AMOLED ekran, S Pen dahil ve DeX moduyla masaüstü deneyimi.",
    tags: ["tablet", "samsung", "s pen"],
    free: true,
  },
  {
    img: "samsung-galaxy-tab-white", kw: "tablet",
    title: "Samsung Galaxy Tab A9 64 GB",
    brand: "Samsung", price: 199, discount: 20, stock: 58,
    category: "Elektronik", sub: "Tablet",
    description: "Günlük kullanım için ideal, uzun pil ömrü ve çift hoparlör.",
    tags: ["tablet", "samsung"],
  },
  {
    img: "apple-watch-series-4-gold", kw: "smartwatch",
    title: "Apple Watch Series 4 40 mm Altın",
    brand: "Apple", price: 249, discount: 22, stock: 38,
    category: "Elektronik", sub: "Akıllı Saat",
    description:
      "EKG uygulaması, düşme algılama ve gün boyu aktivite takibi. Retina Always-On ekran.",
    tags: ["akıllı saat", "apple watch", "fitness"],
    colors: [COLORS.altin, COLORS.gumus],
    featured: true,
  },

  // ================================================================== MODA
  {
    img: "man-plaid-shirt", kw: "shirt",
    title: "Erkek Ekose Gömlek Slim Fit",
    brand: "UrbanWear", price: 19.99, discount: 30, stock: 132,
    category: "Moda", sub: "Erkek Giyim",
    description:
      "%100 pamuklu dokuma kumaş, slim fit kalıp ve klasik yaka. Dört mevsim kullanıma uygun.",
    tags: ["gömlek", "erkek", "ekose"],
    colors: [COLORS.kirmizi, COLORS.mavi, COLORS.siyah],
    sizes: GIYIM_BEDEN,
    featured: true,
  },
  {
    img: "man-short-sleeve-shirt", kw: "shirt",
    title: "Erkek Kısa Kollu Yazlık Gömlek",
    brand: "UrbanWear", price: 15.49, discount: 25, stock: 118,
    category: "Moda", sub: "Erkek Giyim",
    description: "Nefes alan keten karışımlı kumaş, rahat kesim ve yumuşak doku.",
    tags: ["gömlek", "erkek", "yazlık"],
    colors: [COLORS.beyaz, COLORS.bej, COLORS.mavi],
    sizes: GIYIM_BEDEN,
  },
  {
    img: "blue-&-black-check-shirt", kw: "shirt",
    title: "Erkek Mavi-Siyah Kareli Oduncu Gömlek",
    brand: "DenimCo", price: 17.99, discount: 20, stock: 104,
    category: "Moda", sub: "Erkek Giyim",
    description: "Kalın flanel kumaş, çift cepli tasarım. Sonbahar-kış için ideal.",
    tags: ["gömlek", "erkek", "flanel"],
    colors: [COLORS.mavi, COLORS.siyah],
    sizes: GIYIM_BEDEN,
  },
  {
    img: "gigabyte-aorus-men-tshirt", kw: "tshirt",
    title: "Erkek Baskılı Basic Tişört %100 Pamuk",
    brand: "UrbanWear", price: 8.99, discount: 35, stock: 186,
    category: "Moda", sub: "Erkek Giyim",
    description: "Penye pamuk kumaş, bisiklet yaka ve solmayan baskı.",
    tags: ["tişört", "erkek", "pamuk"],
    colors: [COLORS.siyah, COLORS.beyaz],
    sizes: GIYIM_BEDEN,
  },
  {
    img: "girl-summer-dress", kw: "dress",
    title: "Kadın Yazlık Çiçek Desenli Elbise",
    brand: "Bellisa", price: 19, discount: 30, stock: 88,
    category: "Moda", sub: "Kadın Giyim",
    description:
      "Hafif viskon kumaş, midi boy ve kuşaklı bel detayı. Yaz kombinlerinin vazgeçilmezi.",
    tags: ["elbise", "kadın", "yazlık"],
    colors: [COLORS.mavi, COLORS.kirmizi],
    sizes: GIYIM_BEDEN,
    featured: true,
  },
  {
    img: "gray-dress", kw: "dress",
    title: "Kadın Gri Midi Elbise",
    brand: "Bellisa", price: 29, discount: 20, stock: 66,
    category: "Moda", sub: "Kadın Giyim",
    description: "Esnek örme kumaş, vücuda oturan kalıp ve zarif duruş.",
    tags: ["elbise", "kadın", "midi"],
    colors: [COLORS.gri, COLORS.siyah],
    sizes: GIYIM_BEDEN,
  },
  {
    img: "black-women's-gown", kw: "dress",
    title: "Kadın Siyah Uzun Abiye Elbise",
    brand: "Velvet", price: 59, discount: 15, stock: 34,
    category: "Moda", sub: "Kadın Giyim",
    description: "Saten dokulu kumaş, yırtmaç detayı ve astarlı iç yapı. Özel davetler için.",
    tags: ["elbise", "abiye", "kadın"],
    colors: [COLORS.siyah],
    sizes: GIYIM_BEDEN,
    featured: true, free: true,
  },
  {
    img: "blue-frock", kw: "dress",
    title: "Kadın Mavi Kloş Elbise",
    brand: "Bellisa", price: 19, discount: 25, stock: 74,
    category: "Moda", sub: "Kadın Giyim",
    description: "Kloş kesim, rahat kalıp ve nefes alan kumaş.",
    tags: ["elbise", "kadın", "kloş"],
    colors: [COLORS.mavi],
    sizes: GIYIM_BEDEN,
  },
  {
    img: "nike-air-jordan-1-red-and-black", kw: "sneakers",
    title: "Nike Air Jordan 1 Kırmızı-Siyah Spor Ayakkabı",
    brand: "Nike", price: 169, discount: 12, stock: 46,
    category: "Moda", sub: "Ayakkabı",
    description:
      "İkonik Air Jordan silueti, deri üst yüzey ve Air yastıklama teknolojisi.",
    tags: ["ayakkabı", "nike", "sneaker"],
    colors: [COLORS.kirmizi, COLORS.siyah],
    sizes: AYAKKABI_ERKEK,
    featured: true, free: true,
  },
  {
    img: "puma-future-rider-trainers", kw: "sneakers",
    title: "Puma Future Rider Günlük Spor Ayakkabı",
    brand: "Puma", price: 69, discount: 25, stock: 92,
    category: "Moda", sub: "Ayakkabı",
    description: "Retro koşu tasarımı, hafif RIDER taban ve nefes alan üst yüzey.",
    tags: ["ayakkabı", "puma", "sneaker"],
    colors: [COLORS.beyaz, COLORS.mavi],
    sizes: AYAKKABI_ERKEK,
  },
  {
    img: "calvin-klein-heel-shoes", kw: "shoes",
    title: "Calvin Klein Kadın Topuklu Ayakkabı",
    brand: "Calvin Klein", price: 99, discount: 20, stock: 38,
    category: "Moda", sub: "Ayakkabı",
    description: "8 cm ince topuk, hakiki deri üst yüzey ve dolgu iç taban.",
    tags: ["ayakkabı", "topuklu", "kadın"],
    colors: [COLORS.siyah, COLORS.bej],
    sizes: AYAKKABI_KADIN,
  },
  {
    img: "red-shoes", kw: "shoes",
    title: "Kadın Kırmızı Klasik Ayakkabı",
    brand: "StepUp", price: 39, discount: 30, stock: 64,
    category: "Moda", sub: "Ayakkabı",
    description: "Mat deri görünüm, ortopedik iç taban ve kaymaz dış taban.",
    tags: ["ayakkabı", "kadın", "klasik"],
    colors: [COLORS.kirmizi],
    sizes: AYAKKABI_KADIN,
  },
  {
    img: "prada-women-bag", kw: "handbag",
    title: "Prada Kadın Omuz Çantası",
    brand: "Prada", price: 799, discount: 10, stock: 8,
    category: "Moda", sub: "Çanta",
    description:
      "İtalyan işçiliği, hakiki deri gövde ve ayarlanabilir omuz askısı. Sertifika ve toz torbası dahil.",
    tags: ["çanta", "lüks", "kadın"],
    colors: [COLORS.siyah],
    free: true,
  },
  {
    img: "heshe-women's-leather-bag", kw: "handbag",
    title: "Hakiki Deri Kadın El Çantası",
    brand: "Heshe", price: 79, discount: 30, stock: 54,
    category: "Moda", sub: "Çanta",
    description: "Yumuşak dana derisi, çok bölmeli iç tasarım ve fermuarlı kapama.",
    tags: ["çanta", "deri", "kadın"],
    colors: [COLORS.bej, COLORS.siyah, COLORS.kirmizi],
    featured: true,
  },
  {
    img: "white-faux-leather-backpack", kw: "backpack",
    title: "Beyaz Suni Deri Sırt Çantası",
    brand: "UrbanWear", price: 29, discount: 25, stock: 76,
    category: "Moda", sub: "Çanta",
    description: "Dizüstü bilgisayar bölmesi, su itici yüzey ve şık minimal tasarım.",
    tags: ["çanta", "sırt çantası"],
    colors: [COLORS.beyaz, COLORS.siyah],
  },
  {
    img: "rolex-datejust", kw: "watch",
    title: "Rolex Datejust 41 mm Otomatik Kol Saati",
    brand: "Rolex", price: 8899, discount: 5, stock: 4,
    category: "Moda", sub: "Aksesuar",
    description:
      "Oystersteel kasa, otomatik kurmalı mekanizma ve 70 saat güç rezervi. 100 m su geçirmezlik.",
    tags: ["saat", "lüks", "otomatik"],
    colors: [COLORS.gumus, COLORS.altin],
    free: true,
  },
  {
    img: "brown-leather-belt-watch", kw: "watch",
    title: "Kahverengi Deri Kayışlı Klasik Kol Saati",
    brand: "Fossil", price: 69, discount: 25, stock: 64,
    category: "Moda", sub: "Aksesuar",
    description: "Hakiki deri kayış, mineral cam ve 5 ATM su dayanımı.",
    tags: ["saat", "erkek", "klasik"],
    colors: [COLORS.bej, COLORS.siyah],
  },
  {
    img: "women's-wrist-watch", kw: "watch",
    title: "Kadın Bileklik Kol Saati Çelik Kordon",
    brand: "Bellisa", price: 39, discount: 30, stock: 72,
    category: "Moda", sub: "Aksesuar",
    description: "İnce çelik kordon, taşlı kadran ve zarif tasarım.",
    tags: ["saat", "kadın", "aksesuar"],
    colors: [COLORS.altin, COLORS.gumus],
  },
  {
    img: "black-sun-glasses", kw: "sunglasses",
    title: "Siyah Güneş Gözlüğü UV400 Korumalı",
    brand: "Noir", price: 29, discount: 35, stock: 118,
    category: "Moda", sub: "Aksesuar",
    description: "UV400 filtre, polarize cam ve hafif asetat çerçeve. Kılıf dahil.",
    tags: ["gözlük", "güneş gözlüğü", "aksesuar"],
    colors: [COLORS.siyah],
    featured: true,
  },
  {
    img: "classic-sun-glasses", kw: "sunglasses",
    title: "Klasik Aviator Güneş Gözlüğü",
    brand: "Noir", price: 29, discount: 20, stock: 84,
    category: "Moda", sub: "Aksesuar",
    description: "Metal çerçeve, damla form cam ve yaylı menteşe.",
    tags: ["gözlük", "aviator", "aksesuar"],
    colors: [COLORS.altin, COLORS.gumus],
  },
  {
    img: "green-crystal-earring", kw: "earring",
    title: "Yeşil Kristal Taşlı Küpe",
    brand: "Bellisa", price: 17.99, discount: 25, stock: 96,
    category: "Moda", sub: "Aksesuar",
    description: "El işçiliği kristal taşlar, nikelsiz kaplama ve hafif tasarım.",
    tags: ["küpe", "takı", "aksesuar"],
    colors: [COLORS.yesil],
  },

  // ========================================================== EV & YAŞAM
  {
    img: "annibale-colombo-sofa", kw: "sofa",
    title: "Annibale Colombo 3'lü Kadife Kanepe",
    brand: "HomeLine", price: 1999, discount: 18, stock: 6,
    category: "Ev & Yaşam", sub: "Mobilya",
    description:
      "İtalyan tasarımı, sert ahşap iskelet ve yüksek yoğunluklu sünger dolgu. Kadife kumaş kaplama.",
    tags: ["kanepe", "mobilya", "oturma odası"],
    colors: [COLORS.gri, COLORS.yesil, COLORS.lacivert],
    featured: true, free: true,
  },
  {
    img: "annibale-colombo-bed", kw: "bed",
    title: "Annibale Colombo Çift Kişilik Karyola",
    brand: "HomeLine", price: 1649, discount: 15, stock: 5,
    category: "Ev & Yaşam", sub: "Mobilya",
    description: "Masif ahşap gövde, döşemeli başlık ve baza saklama alanı.",
    tags: ["yatak", "karyola", "mobilya"],
    free: true,
  },
  {
    img: "knoll-saarinen-executive-conference-chair", kw: "chair",
    title: "Knoll Saarinen Yönetici Ofis Koltuğu",
    brand: "Knoll", price: 399, discount: 12, stock: 14,
    category: "Ev & Yaşam", sub: "Mobilya",
    description: "Ergonomik sırt desteği, döner taban ve dayanıklı döşeme.",
    tags: ["koltuk", "ofis", "mobilya"],
    colors: [COLORS.siyah, COLORS.beyaz],
    free: true,
  },
  {
    img: "bedside-table-african-cherry", kw: "table",
    title: "Afrika Kirazı Ahşap Komodin",
    brand: "HomeLine", price: 139, discount: 20, stock: 27,
    category: "Ev & Yaşam", sub: "Mobilya",
    description: "Doğal ahşap kaplama, iki çekmeceli ve yumuşak kapanış rayları.",
    tags: ["komodin", "mobilya", "yatak odası"],
  },
  {
    img: "boxed-blender", kw: "blender",
    title: "Çok Fonksiyonlu Blender Seti 1200 W",
    brand: "ChefMaster", price: 59, discount: 30, stock: 82,
    category: "Ev & Yaşam", sub: "Mutfak",
    description: "1200 W motor, paslanmaz çelik bıçaklar ve doğrayıcı aparat dahil.",
    tags: ["blender", "mutfak", "elektrikli"],
    featured: true,
  },
  {
    img: "microwave-oven", kw: "microwave",
    title: "Mikrodalga Fırın 25 L Dijital Kontrol",
    brand: "ChefMaster", price: 129, discount: 22, stock: 44,
    category: "Ev & Yaşam", sub: "Mutfak",
    description: "25 litre kapasite, 8 otomatik program ve çocuk kilidi.",
    tags: ["mikrodalga", "mutfak", "fırın"],
    free: true,
  },
  {
    img: "carbon-steel-wok", kw: "wok",
    title: "Karbon Çelik Wok Tava 32 cm",
    brand: "ChefMaster", price: 29, discount: 25, stock: 96,
    category: "Ev & Yaşam", sub: "Mutfak",
    description: "Yüksek ısıya dayanıklı karbon çelik, ahşap sap ve doğal yapışmazlık.",
    tags: ["tava", "wok", "mutfak"],
  },
  {
    img: "silver-pot-with-glass-cap", kw: "cookware",
    title: "Paslanmaz Çelik Tencere Cam Kapaklı 24 cm",
    brand: "ChefMaster", price: 39, discount: 20, stock: 73,
    category: "Ev & Yaşam", sub: "Mutfak",
    description: "18/10 paslanmaz çelik, indüksiyon uyumlu taban ve temperli cam kapak.",
    tags: ["tencere", "mutfak", "çelik"],
  },
  {
    img: "electric-stove", kw: "stove",
    title: "Tek Gözlü Elektrikli Ocak 1500 W",
    brand: "ChefMaster", price: 19, discount: 15, stock: 58,
    category: "Ev & Yaşam", sub: "Mutfak",
    description: "Ayarlanabilir termostat, aşırı ısınma koruması ve kompakt tasarım.",
    tags: ["ocak", "mutfak", "elektrikli"],
  },
  {
    img: "table-lamp", kw: "lamp",
    title: "Modern Masa Lambası Ahşap Tabanlı",
    brand: "LumiHome", price: 29, discount: 25, stock: 88,
    category: "Ev & Yaşam", sub: "Dekorasyon",
    description: "Doğal ahşap taban, kumaş abajur ve E27 duy. Ampul dahil değildir.",
    tags: ["lamba", "aydınlatma", "dekorasyon"],
    colors: [COLORS.bej, COLORS.siyah],
    featured: true,
  },
  {
    img: "plant-pot", kw: "plant",
    title: "Dekoratif Seramik Saksı Seti 3'lü",
    brand: "LumiHome", price: 14.49, discount: 20, stock: 124,
    category: "Ev & Yaşam", sub: "Dekorasyon",
    description: "Mat seramik yüzey, drenaj delikli ve altlık dahil.",
    tags: ["saksı", "dekorasyon", "bitki"],
    colors: [COLORS.beyaz, COLORS.siyah],
  },
  {
    img: "family-tree-photo-frame", kw: "frame",
    title: "Aile Ağacı Çoklu Fotoğraf Çerçevesi",
    brand: "LumiHome", price: 19.99, discount: 30, stock: 71,
    category: "Ev & Yaşam", sub: "Dekorasyon",
    description: "10 fotoğraf kapasiteli, ahşap görünümlü çerçeve ve duvar montaj aparatı.",
    tags: ["çerçeve", "dekorasyon", "duvar"],
  },
  {
    img: "house-showpiece-plant", kw: "plant",
    title: "Yapay Dekoratif Saksı Bitkisi 90 cm",
    brand: "LumiHome", price: 29, discount: 22, stock: 62,
    category: "Ev & Yaşam", sub: "Dekorasyon",
    description: "Gerçekçi yaprak dokusu, bakım gerektirmez ve solmaz.",
    tags: ["bitki", "dekorasyon", "yapay"],
  },

  // ========================================================== SÜPERMARKET
  {
    img: "nescafe-coffee", kw: "coffee",
    title: "Nescafé Classic Granül Kahve 200 g",
    brand: "Nescafé", price: 7.99, discount: 15, stock: 320,
    category: "Süpermarket", sub: "Gıda",
    description: "Yoğun aromalı granül kahve, sıcak ve soğuk hazırlamaya uygun.",
    tags: ["kahve", "gıda", "içecek"],
    featured: true,
  },
  {
    img: "honey-jar", kw: "honey",
    title: "Doğal Çiçek Balı 850 g Cam Kavanoz",
    brand: "Ege Bahçe", price: 11.99, discount: 20, stock: 186,
    category: "Süpermarket", sub: "Gıda",
    description: "Katkısız süzme çiçek balı, analiz raporlu ve cam kavanozda.",
    tags: ["bal", "gıda", "doğal"],
  },
  {
    img: "cooking-oil", kw: "oil",
    title: "Ayçiçek Yağı 5 L Teneke",
    brand: "Ege Bahçe", price: 19.99, discount: 12, stock: 210,
    category: "Süpermarket", sub: "Gıda",
    description: "Rafine ayçiçek yağı, yüksek ısıya dayanıklı ve tortusuz.",
    tags: ["yağ", "gıda", "mutfak"],
  },
  {
    img: "rice", kw: "rice",
    title: "Baldo Pirinç 5 kg",
    brand: "Ege Bahçe", price: 11.99, discount: 18, stock: 165,
    category: "Süpermarket", sub: "Gıda",
    description: "İri taneli baldo pirinç, taş ve yabancı madde ayıklanmış.",
    tags: ["pirinç", "gıda", "bakliyat"],
  },
  {
    img: "protein-powder", kw: "protein",
    title: "Whey Protein Tozu 1 kg Çikolata",
    brand: "IronFit", price: 39, discount: 25, stock: 94,
    category: "Süpermarket", sub: "Gıda",
    description: "Porsiyon başına 24 g protein, düşük şeker ve kolay karışan formül.",
    tags: ["protein", "supplement", "spor"],
    free: true,
  },
  {
    img: "juice", kw: "juice",
    title: "Meyve Suyu Karışık 1 L (6'lı Paket)",
    brand: "Herbal", price: 6.49, discount: 20, stock: 240,
    category: "Süpermarket", sub: "İçecek",
    description: "%100 meyve suyu, şeker ilavesiz ve koruyucu içermez.",
    tags: ["meyve suyu", "içecek"],
  },
  {
    img: "soft-drinks", kw: "drinks",
    title: "Gazlı İçecek 330 ml (12'li Kutu)",
    brand: "Herbal", price: 5.49, discount: 15, stock: 310,
    category: "Süpermarket", sub: "İçecek",
    description: "Serinletici gazlı içecek, 12'li ekonomik kutu paket.",
    tags: ["gazlı içecek", "içecek"],
  },
  {
    img: "water", kw: "water",
    title: "Doğal Kaynak Suyu 5 L (4'lü Koli)",
    brand: "Herbal", price: 3.49, discount: 10, stock: 420,
    category: "Süpermarket", sub: "İçecek",
    description: "Doğal kaynak suyu, düşük sodyum ve dengeli mineral içeriği.",
    tags: ["su", "içecek"],
  },
  {
    img: "tissue-paper-box", kw: "tissue",
    title: "Kutu Mendil 3 Katlı (6'lı Paket)",
    brand: "PureClean", price: 4.49, discount: 25, stock: 280,
    category: "Süpermarket", sub: "Temizlik",
    description: "3 katlı yumuşak doku, %100 selüloz ve dermatolojik olarak test edilmiş.",
    tags: ["mendil", "temizlik", "kağıt"],
  },
  {
    img: "attitude-super-leaves-hand-soap", kw: "soap",
    title: "Attitude Doğal Sıvı El Sabunu 473 ml",
    brand: "Attitude", price: 5.49, discount: 20, stock: 190,
    category: "Süpermarket", sub: "Temizlik",
    description: "Bitkisel içerikli, EWG onaylı ve hassas ciltler için uygun.",
    tags: ["sabun", "temizlik", "doğal"],
  },

  // ======================================================= SPOR & OUTDOOR
  {
    img: "basketball", kw: "basketball",
    title: "Profesyonel Basketbol Topu No:7",
    brand: "IronFit", price: 19.99, discount: 25, stock: 118,
    category: "Spor & Outdoor", sub: "Spor Ekipmanları",
    description: "Kompozit deri yüzey, iç ve dış saha kullanımına uygun. Şişirilmiş gönderilir.",
    tags: ["basketbol", "top", "spor"],
    featured: true,
  },
  {
    img: "football", kw: "football",
    title: "Futbol Topu Dikişli No:5",
    brand: "IronFit", price: 16.49, discount: 20, stock: 142,
    category: "Spor & Outdoor", sub: "Spor Ekipmanları",
    description: "El dikişi panel yapısı, aşınmaya dayanıklı yüzey ve hava tutuşu yüksek.",
    tags: ["futbol", "top", "spor"],
  },
  {
    img: "tennis-racket", kw: "tennis",
    title: "Tenis Raketi Grafit Gövde 300 g",
    brand: "IronFit", price: 59, discount: 30, stock: 56,
    category: "Spor & Outdoor", sub: "Spor Ekipmanları",
    description: "Grafit karışımlı gövde, dengeli ağırlık dağılımı ve kaymaz grip. Kılıf dahil.",
    tags: ["tenis", "raket", "spor"],
    featured: true, free: true,
  },
  {
    img: "iron-golf", kw: "golf",
    title: "Golf Demir Sopa Seti 7 Parça",
    brand: "IronFit", price: 299, discount: 15, stock: 12,
    category: "Spor & Outdoor", sub: "Spor Ekipmanları",
    description: "Paslanmaz çelik başlıklar, grafit şaft ve ergonomik kavrama.",
    tags: ["golf", "spor", "set"],
    free: true,
  },
  {
    img: "volleyball", kw: "volleyball",
    title: "Voleybol Topu Antrenman No:5",
    brand: "IronFit", price: 14.49, discount: 20, stock: 96,
    category: "Spor & Outdoor", sub: "Spor Ekipmanları",
    description: "Yumuşak sentetik yüzey, salon ve plaj kullanımına uygun.",
    tags: ["voleybol", "top", "spor"],
  },
  {
    img: "cricket-helmet", kw: "helmet",
    title: "Koruyucu Spor Kaskı Ayarlanabilir",
    brand: "IronFit", price: 39, discount: 18, stock: 38,
    category: "Spor & Outdoor", sub: "Spor Ekipmanları",
    description: "Darbe emici iç dolgu, çelik yüz koruma ve havalandırma kanalları.",
    tags: ["kask", "koruyucu", "spor"],
    sizes: ["S", "M", "L"],
  },

  // ============================================================= KOZMETİK
  {
    img: "essence-mascara-lash-princess", kw: "mascara",
    title: "Essence Lash Princess Hacim Veren Maskara",
    brand: "Essence", price: 5.49, discount: 20, stock: 260,
    category: "Kozmetik", sub: "Makyaj",
    description: "Konik fırça ile kirpikleri ayırır, yoğun hacim ve uzunluk kazandırır.",
    tags: ["maskara", "makyaj", "kozmetik"],
    featured: true,
  },
  {
    img: "eyeshadow-palette-with-mirror", kw: "eyeshadow",
    title: "Aynalı Far Paleti 18 Renk",
    brand: "Velvet", price: 13.49, discount: 30, stock: 148,
    category: "Kozmetik", sub: "Makyaj",
    description: "Mat ve simli tonlar, yüksek pigment ve dağılmayan formül.",
    tags: ["far", "makyaj", "palet"],
  },
  {
    img: "red-lipstick", kw: "lipstick",
    title: "Mat Kırmızı Ruj Uzun Kalıcılık",
    brand: "Velvet", price: 7.99, discount: 25, stock: 205,
    category: "Kozmetik", sub: "Makyaj",
    description: "Transfer etmeyen mat bitiş, E vitamini ile nemlendirici formül.",
    tags: ["ruj", "makyaj", "mat"],
    colors: [COLORS.kirmizi],
  },
  {
    img: "red-nail-polish", kw: "nail",
    title: "Hızlı Kuruyan Oje Kırmızı 12 ml",
    brand: "Velvet", price: 3.49, discount: 20, stock: 320,
    category: "Kozmetik", sub: "Makyaj",
    description: "60 saniyede kuruyan formül, parlak bitiş ve 7 gün kalıcılık.",
    tags: ["oje", "makyaj", "tırnak"],
    colors: [COLORS.kirmizi],
  },
  {
    img: "calvin-klein-ck-one", kw: "perfume",
    title: "Calvin Klein CK One EDT 200 ml",
    brand: "Calvin Klein", price: 59, discount: 22, stock: 74,
    category: "Kozmetik", sub: "Parfüm",
    description: "Unisex ikonik koku. Ferah narenciye açılışı, yeşil çay ve amber kalbi.",
    tags: ["parfüm", "unisex", "edt"],
    featured: true,
  },
  {
    img: "chanel-coco-noir-eau-de", kw: "perfume",
    title: "Chanel Coco Noir EDP 100 ml",
    brand: "Chanel", price: 179, discount: 10, stock: 26,
    category: "Kozmetik", sub: "Parfüm",
    description: "Doğu esintili yoğun koku. Bergamot, gül ve sandal ağacı notaları.",
    tags: ["parfüm", "kadın", "edp"],
    free: true,
  },
  {
    img: "gucci-bloom-eau-de", kw: "perfume",
    title: "Gucci Bloom EDP 100 ml",
    brand: "Gucci", price: 139, discount: 15, stock: 31,
    category: "Kozmetik", sub: "Parfüm",
    description: "Beyaz çiçek buketi, gece yasemini ve sarmaşık notaları.",
    tags: ["parfüm", "kadın", "çiçeksi"],
    free: true,
  },
  {
    img: "dolce-shine-eau-de", kw: "perfume",
    title: "Dolce & Gabbana Shine EDP 90 ml",
    brand: "Dolce & Gabbana", price: 119, discount: 18, stock: 29,
    category: "Kozmetik", sub: "Parfüm",
    description: "Tropikal meyveli açılış, frenk üzümü ve vanilya kalbi.",
    tags: ["parfüm", "kadın", "meyveli"],
  },
  {
    img: "olay-ultra-moisture-shea-butter-body-wash", kw: "bodywash",
    title: "Olay Ultra Moisture Duş Jeli 700 ml",
    brand: "Olay", price: 6.49, discount: 25, stock: 168,
    category: "Kozmetik", sub: "Cilt Bakımı",
    description: "Shea yağı içerikli nemlendirici formül, cildi kurutmadan temizler.",
    tags: ["duş jeli", "cilt bakımı", "nemlendirici"],
  },
  {
    img: "vaseline-men-body-and-face-lotion", kw: "lotion",
    title: "Vaseline Men Vücut ve Yüz Losyonu 400 ml",
    brand: "Vaseline", price: 4.99, discount: 20, stock: 192,
    category: "Kozmetik", sub: "Cilt Bakımı",
    description: "Hızlı emilen formül, 24 saat nem ve yağlı his bırakmaz.",
    tags: ["losyon", "cilt bakımı", "erkek"],
  },

  // ============================================================= OTOMOTİV
  {
    img: "kawasaki-z800", kw: "motorcycle",
    title: "Kawasaki Z800 Naked Motosiklet",
    brand: "Kawasaki", price: 8599, discount: 5, stock: 3,
    category: "Otomotiv", sub: "Motosiklet",
    description:
      "806 cc dört silindirli motor, agresif naked tasarım ve ABS fren sistemi.",
    details: "Motor: 806 cc\nGüç: 113 hp\nAğırlık: 231 kg\nFren: ABS çift disk",
    tags: ["motosiklet", "kawasaki", "naked"],
    colors: [COLORS.yesil, COLORS.siyah],
    featured: true, free: true,
  },
  {
    img: "scooter-motorcycle", kw: "scooter",
    title: "Şehir İçi Scooter 125 cc",
    brand: "Generic", price: 1999, discount: 10, stock: 9,
    category: "Otomotiv", sub: "Motosiklet",
    description: "Düşük yakıt tüketimi, geniş sele altı bagaj ve otomatik şanzıman.",
    tags: ["scooter", "motosiklet", "şehir"],
    colors: [COLORS.beyaz, COLORS.kirmizi],
    free: true,
  },
  {
    img: "sportbike-motorcycle", kw: "motorcycle",
    title: "Spor Motosiklet 600 cc",
    brand: "Generic", price: 6099, discount: 8, stock: 4,
    category: "Otomotiv", sub: "Motosiklet",
    description: "Aerodinamik kaportası, yarış tipi süspansiyon ve yüksek devir motoru.",
    tags: ["motosiklet", "spor", "600cc"],
    colors: [COLORS.kirmizi, COLORS.siyah],
    free: true,
  },
];

// ------------------------------------------------------------------- seed

async function main() {
  console.log("→ Mevcut veriler temizleniyor…");
  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.user.deleteMany();

  console.log("→ Kullanıcılar oluşturuluyor…");
  const admin = await prisma.user.create({
    data: {
      name: "Site Yöneticisi",
      email: "admin@amazon.com",
      password: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
      phone: "+90 555 000 00 01",
    },
  });

  const customers = await Promise.all(
    [
      { name: "Ayşe Yılmaz", email: "ayse@test.com", phone: "+90 555 000 00 02" },
      { name: "Mehmet Demir", email: "mehmet@test.com", phone: "+90 555 000 00 03" },
      { name: "Zeynep Kaya", email: "zeynep@test.com", phone: "+90 555 000 00 04" },
      { name: "Can Öztürk", email: "can@test.com", phone: "+90 555 000 00 05" },
    ].map(async (c) =>
      prisma.user.create({
        data: { ...c, password: await bcrypt.hash("test1234", 10) },
      }),
    ),
  );

  await prisma.address.createMany({
    data: [
      {
        userId: customers[0].id,
        fullName: "Ayşe Yılmaz",
        phone: "+90 555 000 00 02",
        addressLine1: "Bağdat Caddesi No: 145",
        addressLine2: "Daire 7",
        city: "İstanbul",
        state: "Kadıköy",
        postalCode: "34710",
        country: "Türkiye",
        isDefault: true,
      },
      {
        userId: customers[1].id,
        fullName: "Mehmet Demir",
        phone: "+90 555 000 00 03",
        addressLine1: "Atatürk Bulvarı No: 22",
        city: "Ankara",
        state: "Çankaya",
        postalCode: "06680",
        country: "Türkiye",
        isDefault: true,
      },
    ],
  });

  console.log("→ Ürün görselleri hazırlanıyor…");
  await loadProductImagePool();

  console.log("→ Kategoriler oluşturuluyor…");
  const categoryMap = new Map<string, string>();
  const subMap = new Map<string, string>();

  for (const category of CATEGORIES) {
    const created = await prisma.category.create({
      data: {
        name: category.name,
        slug: slugify(category.name),
        image: categoryImage(category.cover, category.keyword),
        order: category.order,
      },
    });
    categoryMap.set(category.name, created.id);

    for (const sub of category.subs) {
      const createdSub = await prisma.subCategory.create({
        data: {
          name: sub,
          slug: slugify(`${category.name}-${sub}`),
          categoryId: created.id,
        },
      });
      subMap.set(`${category.name}|${sub}`, createdSub.id);
    }
  }

  console.log("→ Ürünler oluşturuluyor…");
  const productIds: string[] = [];

  for (const [index, product] of PRODUCTS.entries()) {
    const created = await prisma.product.create({
      data: {
        title: product.title,
        slug: slugify(product.title),
        description: product.description,
        details: product.details ?? null,
        brand: product.brand,
        sku: `SKU-${String(index + 1).padStart(4, "0")}`,
        images: productImages(product.img, product.kw),
        price: product.price,
        discountPercent: product.discount ?? 0,
        stock: product.stock,
        sold: Math.floor(Math.random() * 150),
        colors: product.colors ?? [],
        sizes: product.sizes ?? [],
        tags: product.tags.map((t) => t.toLowerCase()),
        featured: product.featured ?? false,
        shippingFree: product.free ?? false,
        isActive: true,
        categoryId: categoryMap.get(product.category)!,
        subCategoryId: subMap.get(`${product.category}|${product.sub}`) ?? null,
      },
    });
    productIds.push(created.id);
  }

  console.log("→ Değerlendirmeler oluşturuluyor…");
  const comments = [
    "Ürün beklediğimden çok daha kaliteli çıktı, kargo da çok hızlıydı. Kesinlikle tavsiye ederim.",
    "Fiyat/performans olarak gayet başarılı. Küçük eksikleri var ama bu fiyata sorun değil.",
    "İkinci kez sipariş veriyorum, ilkinden memnun kaldığım için. Aynı kalitede geldi.",
    "Görseldekiyle birebir aynı. Paketleme özenliydi, hasarsız ulaştı.",
    "Kullanmaya yeni başladım ama ilk izlenimim çok olumlu. Tekrar alırım.",
    "Beklentimi tam karşılamadı, biraz daha büyük olmasını umuyordum. Yine de fena değil.",
    "Uzun süredir kullanıyorum, hiçbir sorun yaşamadım. Sağlam ve dayanıklı.",
  ];

  for (const productId of productIds) {
    const reviewers = [...customers]
      .sort(() => Math.random() - 0.5)
      .slice(0, 1 + Math.floor(Math.random() * 4));

    for (const reviewer of reviewers) {
      await prisma.review.create({
        data: {
          productId,
          userId: reviewer.id,
          rating: 3 + Math.floor(Math.random() * 3),
          comment: comments[Math.floor(Math.random() * comments.length)],
        },
      });
    }

    const agg = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: Math.round((agg._avg.rating ?? 0) * 100) / 100,
        numReviews: agg._count._all,
      },
    });
  }

  console.log("→ Kuponlar oluşturuluyor…");
  await prisma.coupon.createMany({
    data: [
      {
        code: "HOSGELDIN10",
        discountPercent: 10,
        minAmount: 25,
        maxUses: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 86400000),
        active: true,
      },
      {
        code: "YAZ25",
        discountPercent: 25,
        minAmount: 100,
        maxUses: 100,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000),
        active: true,
      },
      {
        code: "SUPER5",
        discountPercent: 5,
        minAmount: 0,
        maxUses: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 86400000),
        active: true,
      },
    ],
  });

  console.log("→ Bannerlar oluşturuluyor…");
  await prisma.banner.createMany({
    data: [
      {
        title: "Elektronikte büyük indirim",
        subtitle: "Telefon, bilgisayar ve kulaklıklarda %40'a varan fırsatlar",
        image: gradientBanner("elektronik", "#0f2027", "#2c5364"),
        link: "/category/elektronik",
        position: "HERO",
        order: 1,
      },
      {
        title: "Yeni sezon moda",
        subtitle: "Binlerce üründe sezon indirimi başladı",
        image: gradientBanner("moda", "#6d1b3f", "#c2185b"),
        link: "/category/moda",
        position: "HERO",
        order: 2,
      },
      {
        title: "Evini yenile",
        subtitle: "Mobilya ve dekorasyonda ücretsiz kargo",
        image: gradientBanner("ev", "#134e4a", "#0f766e"),
        link: "/category/ev-yasam",
        position: "HERO",
        order: 3,
      },
      {
        title: "Spor ekipmanlarında fırsat",
        subtitle: "Antrenman ürünlerinde %30'a varan indirim",
        image: gradientBanner("spor", "#7c2d12", "#ea580c", 1200, 500),
        link: "/category/spor-outdoor",
        position: "STRIP",
        order: 1,
      },
      {
        title: "Kozmetikte kaçırılmayacak fiyatlar",
        subtitle: "Parfüm ve makyaj ürünlerinde net indirim",
        image: gradientBanner("kozmetik", "#4c1d95", "#7c3aed", 1200, 500),
        link: "/category/kozmetik",
        position: "STRIP",
        order: 2,
      },
    ],
  });

  await writeSvgFiles();
  console.log("→ Görseller indiriliyor (public/seed)…");
  await downloadAll();

  console.log("\n✅ Örnek veriler yüklendi!");
  console.log("   Yönetici : admin@amazon.com / admin123");
  console.log("   Müşteri  : ayse@test.com / test1234");
  console.log(
    `   ${PRODUCTS.length} ürün · ${CATEGORIES.length} kategori · 3 kupon · 5 banner`,
  );
  console.log(`   Admin ID : ${admin.id}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed hatası:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
