// XMAX - komut çözümleme ve güvenlik yardımcıları.
// Bu dosyada tarayıcıya özgü kod yok; Node ile test edilebilir.

export const SELAM_CEVABI =
  "Merhaba, öncelikle nasılsınız veya ne konuda konuşmak istersiniz?";

// Araştırma bağlantıları yalnızca bu alan adlarına (ve alt alan adlarına) açılır.
// Genişletmek istersen buraya ekle.
export const IZINLI_ALAN_ADLARI = ["google.com", "google.com.tr"];

const KATLA = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

export function trLower(s) {
  return String(s ?? "").toLocaleLowerCase("tr-TR");
}

// Küçük harfe çevirir, noktalama işaretlerini atar, boşlukları sadeleştirir.
export function normalize(s) {
  return trLower(s)
    .replace(/[’'`´]/g, "")
    .replace(/[^\p{L}\p{N}+\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Türkçe harfleri ASCII karşılığına çevirir (1'e 1, uzunluk değişmez).
export function fold(s) {
  return s.replace(/[çğıöşüâîû]/g, (c) => KATLA[c]);
}

function kacis(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Ses tanıma "XMAX" kelimesini farklı yazabilir; bilinen varyantları da kabul et.
export function adVaryantlari(ad) {
  const f = fold(normalize(ad || "xmax"));
  const v = new Set([f]);
  if (f === "xmax") {
    ["eksmaks", "eks maks", "ex max", "exmax", "x max", "ekmaks", "eksmax"].forEach((x) => v.add(x));
  }
  return [...v].sort((a, b) => b.length - a.length);
}

// Telefon numarasını doğrular. Geçersizse null döner.
export function telefonTemizle(s) {
  const t = String(s ?? "").trim();
  const arti = t.startsWith("+") ? "+" : "";
  const rakam = t.replace(/\D/g, "");
  if (rakam.length < 7 || rakam.length > 15) return null;
  return arti + rakam;
}

// Yalnızca https ve izinli alan adlarına true döner.
export function siteIzinli(url, izinli = IZINLI_ALAN_ADLARI) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    if (u.username || u.password) return false;
    if (u.port && u.port !== "443") return false;
    const h = u.hostname.toLowerCase();
    return izinli.some((d) => h === d || h.endsWith("." + d));
  } catch {
    return false;
  }
}

export function googleAramaUrl(sorgu) {
  const q = String(sorgu ?? "").slice(0, 200);
  return "https://www.google.com.tr/search?hl=tr&q=" + encodeURIComponent(q);
}

// tel: ve sms: bağlantıları oluşturur. Numara doğrulanmamışsa null döner.
export function telBaglantisi(numara) {
  const n = telefonTemizle(numara);
  return n ? "tel:" + n : null;
}

export function smsBaglantisi(numara, metin) {
  const n = telefonTemizle(numara);
  if (!n) return null;
  const govde = encodeURIComponent(String(metin ?? "").slice(0, 500));
  return "sms:" + n + (govde ? "?body=" + govde : "");
}

// Uygulamanın açacağı bağlantı türlerinin son kontrolü.
export function baglantiGuvenli(href) {
  if (/^https:/i.test(href)) return siteIzinli(href);
  return /^(tel|sms):\+?\d{7,15}(\?body=[A-Za-z0-9%._~!*'()-]*)?$/.test(href);
}

// Kullanıcının yazdığı ya da söylediği metni komuta çevirir.
// Dönüş: { tur, ... } ; "cagri: true" metin asistanın adıyla başladıysa eklenir.
export function komutCoz(metin, asistanAdi = "xmax") {
  const n = normalize(metin);
  const f = fold(n);
  if (!n) return { tur: "bos" };

  // Çağrı: "merhaba xmax", "xmax hava nasıl"
  for (const a of adVaryantlari(asistanAdi)) {
    const m = f.match(new RegExp("^(?:(?:merhaba|selam|hey) )?" + kacis(a) + "(?: (.+))?$"));
    if (m) {
      const kalan = m[1] ? n.slice(n.length - m[1].length).trim() : "";
      if (!kalan) return { tur: "selam", cagri: true };
      return { ...komutCoz(kalan, asistanAdi), cagri: true };
    }
  }

  if (/^(iptal|vazgec|bos ver)$/.test(f)) return { tur: "iptal" };
  if (/^(yardim|neler yapabilirsin|ne yapabilirsin)$/.test(f)) return { tur: "yardim" };

  let m = f.match(/^(?:arastir|google da ara|googleda ara|google ara|internette ara)(?: (.+))?$/);
  if (m) return { tur: "arastir", sorgu: m[1] ? n.slice(n.length - m[1].length).trim() : "" };

  if (/^(ara|arama yap|birini ara|telefon et)$/.test(f)) return { tur: "tel", numara: null };
  m = f.match(/^(?:ara|arama yap) (.+)$/);
  if (m) {
    const num = telefonTemizle(m[1]);
    if (num) return { tur: "tel", numara: num };
  }

  if (/^(mesaj gonder|mesaj at|mesaj yaz|sms gonder|sms at)$/.test(f)) {
    return { tur: "sms", numara: null, kisi: "" };
  }
  m = f.match(/^(?:mesaj gonder|mesaj at|sms gonder|sms at) (.+)$/);
  if (m) {
    const num = telefonTemizle(m[1]);
    if (num) return { tur: "sms", numara: num, kisi: "" };
  }
  m = f.match(/^(.+) (?:mesaj gonder|mesaj at|sms gonder|sms at)$/);
  if (m && m[1].split(" ").length <= 3) {
    return { tur: "sms", numara: null, kisi: n.slice(0, m[1].length).trim() };
  }

  return { tur: "soru", metin: n.length ? String(metin).trim() : "" };
}
