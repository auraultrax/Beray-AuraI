// Çalıştırmak için: node test/komutlar.test.mjs
import assert from "node:assert/strict";
import {
  komutCoz, siteIzinli, telefonTemizle, googleAramaUrl,
  smsBaglantisi, telBaglantisi, baglantiGuvenli, SELAM_CEVABI, hazirCevapBul,
} from "../komutlar.js";
import { HAZIR_CEVAPLAR } from "../hazir-cevaplar.js";

let sayac = 0;
function test(ad, fn) {
  fn();
  sayac++;
  console.log("ok -", ad);
}

test("merhaba xmax -> selam", () => {
  for (const s of ["Merhaba AURAI", "merhaba aurai.", "Merhaba, AURAI!", "aurai", "Selam AURAI", "merhaba aura ay", "Merhaba Ora Ay"]) {
    const k = komutCoz(s, "AURAI");
    assert.equal(k.tur, "selam", s);
    assert.equal(k.cagri, true, s);
  }
});

test("selam cevabı metni", () => {
  assert.equal(SELAM_CEVABI, "Merhaba, öncelikle nasılsınız veya ne konuda konuşmak istersiniz?");
});

test("xmax ile başlayan soru", () => {
  const k = komutCoz("Merhaba AURAI bugün hava nasıl olacak", "AURAI");
  assert.equal(k.tur, "soru");
  assert.equal(k.cagri, true);
  assert.equal(k.metin, "bugün hava nasıl olacak");
});

test("özel asistan adı", () => {
  assert.equal(komutCoz("merhaba Aslan", "Aslan").tur, "selam");
  assert.equal(komutCoz("merhaba aurai", "Aslan").tur, "soru");
});

test("araştır", () => {
  assert.deepEqual(komutCoz("Araştır deprem toplanma alanları"), { tur: "arastir", sorgu: "deprem toplanma alanları" });
  assert.equal(komutCoz("Google'da ara kedi bakımı").sorgu, "kedi bakımı");
  assert.equal(komutCoz("araştır").sorgu, "");
  assert.equal(komutCoz("araştırır mısın").tur, "soru");
});

test("ara", () => {
  assert.deepEqual(komutCoz("ara"), { tur: "tel", numara: null });
  assert.deepEqual(komutCoz("ara 0555 123 45 67"), { tur: "tel", numara: "05551234567" });
  assert.equal(komutCoz("ara nedir").tur, "soru");
});

test("mesaj gönder", () => {
  assert.equal(komutCoz("mesaj gönder").tur, "sms");
  assert.equal(komutCoz("mesaj gönder +90 555 123 45 67").numara, "+905551234567");
  const k = komutCoz("Ahmet'e mesaj gönder");
  assert.equal(k.tur, "sms");
  assert.equal(k.kisi, "ahmete");
});

test("iptal ve yardım", () => {
  assert.equal(komutCoz("İptal").tur, "iptal");
  assert.equal(komutCoz("vazgeç").tur, "iptal");
  assert.equal(komutCoz("yardım").tur, "yardim");
});

test("boş ve normal soru", () => {
  assert.equal(komutCoz("   ").tur, "bos");
  const k = komutCoz("Türkiye'nin başkenti neresi?");
  assert.equal(k.tur, "soru");
  assert.equal(k.metin, "Türkiye'nin başkenti neresi?");
});

test("siteIzinli", () => {
  assert.equal(siteIzinli("https://www.google.com.tr/search?q=a"), true);
  assert.equal(siteIzinli("https://google.com/"), true);
  assert.equal(siteIzinli("https://maps.google.com/"), true);
  assert.equal(siteIzinli("http://www.google.com/"), false);
  assert.equal(siteIzinli("https://evilgoogle.com/"), false);
  assert.equal(siteIzinli("https://google.com.evil.com/"), false);
  assert.equal(siteIzinli("https://google.com@evil.com/"), false);
  assert.equal(siteIzinli("https://evil.com/?u=https://google.com"), false);
  assert.equal(siteIzinli("javascript:alert(1)"), false);
  assert.equal(siteIzinli("sacma"), false);
});

test("telefonTemizle", () => {
  assert.equal(telefonTemizle("0555 123 45 67"), "05551234567");
  assert.equal(telefonTemizle("+90 (555) 123-45-67"), "+905551234567");
  assert.equal(telefonTemizle("123"), null);
  assert.equal(telefonTemizle("abc"), null);
  assert.equal(telefonTemizle("1234567890123456"), null);
});

test("bağlantılar", () => {
  assert.equal(telBaglantisi("0555 123 45 67"), "tel:05551234567");
  assert.equal(telBaglantisi("x"), null);
  const sms = smsBaglantisi("05551234567", "5 dakikaya geliyorum & hazırım");
  assert.ok(baglantiGuvenli(sms), sms);
  assert.ok(sms.startsWith("sms:05551234567?body="));
  assert.ok(baglantiGuvenli(googleAramaUrl("hava durumu istanbul")));
  assert.equal(baglantiGuvenli("javascript:alert(1)"), false);
  assert.equal(baglantiGuvenli("sms:123"), false);
  assert.equal(baglantiGuvenli("https://evil.com"), false);
});

test("hazır cevaplar", () => {
  const b = (m) => hazirCevapBul(m, HAZIR_CEVAPLAR, { ad: "AURAI", kullanici: "Ayşe" });
  assert.match(b("Türkiye'nin başkenti neresi?"), /Ankara/);
  assert.equal(b("Fransa'nın başkenti neresi?"), null);
  assert.match(b("saat kaç"), /\d{2}[:.]\d{2}/);
  assert.match(b("Bugün günlerden ne?"), /^Bugün /);
  assert.equal(b("Merhaba"), SELAM_CEVABI);
  assert.match(b("nasılsın"), /İyiyim/);
  assert.match(b("sen kimsin"), /AURAI/);
  assert.match(b("Atatürk ne zaman doğdu?"), /1881/);
  assert.match(b("deprem anında ne yapmalıyım"), /ÇÖK/);
  assert.match(b("çok teşekkürler"), /Rica ederim/);
  assert.ok(typeof b("bana bir fıkra anlat") === "string");
  assert.match(b("insan mısın"), /yapay zekayım/);
  assert.equal(b("Fotosentez nedir?"), null);
  assert.equal(b("Ankara hakkında üç paragraf uzun ve ayrıntılı bir yazı yaz bana lütfen şimdi hemen"), null);
  assert.equal(b("   "), null);
});

console.log(`\n${sayac} test grubu geçti.`);
