// AURAI hazır cevaplar. Yapay zekaya sormadan, anında ve her zaman aynı cevabı verir.
//
// Yeni cevap eklemek için listeye bir kayıt ekle:
//   anahtar: soruda geçmesi gereken kelimeler. Bir ifadedeki tüm kelimeler soruda olmalı (sırası önemsiz).
//            Kelimenin başı yeterli: "baskent", "başkenti" kelimesini de yakalar.
//   cevap:   bir metin ya da (baglam) => metin. baglam = { ad: asistan adı, kullanici: kullanıcı adı }
//
// İpucu: "Fransa'nın başkenti" gibi sorulara yanlış cevap vermemek için anahtara ülke adını da yaz.
import { SELAM_CEVABI } from "./komutlar.js";

const SAKALAR = [
  "Matematik kitabı neden üzgünmüş? Çünkü bir sürü problemi varmış!",
  "Bilgisayar doktora gitmiş. Doktor sormuş: Neyin var? Bilgisayar demiş ki: Galiba virüs kaptım!",
  "Telefon şarja takılınca neden rahatlamış? Çünkü sonunda enerji bulmuş!",
  "Yapay zeka neden hiç yorulmaz? Çünkü uyku modu var, ama horlamıyor!",
  "Kalem neden hep mutluymuş? Çünkü her gün yeni bir sayfa açılırmış!",
];

export const HAZIR_CEVAPLAR = [
  // ---- Sohbet ----
  { anahtar: ["merhaba", "selam", "selamlar"], cevap: SELAM_CEVABI },
  { anahtar: ["gunaydin"], cevap: "Günaydın! Güzel bir gün olsun. Bugün ne yapalım?" },
  { anahtar: ["iyi aksamlar"], cevap: "İyi akşamlar! Nasıl geçti günün?" },
  { anahtar: ["iyi geceler"], cevap: "İyi geceler! Tatlı rüyalar." },
  { anahtar: ["nasilsin", "nasilsiniz", "naber"], cevap: "İyiyim, teşekkür ederim! Sen nasılsın? Ne konuşalım?" },
  { anahtar: ["kimsin", "adin ne", "ismin ne"], cevap: (b) => "Ben " + b.ad + ", Türkçe konuşan sesli bir yapay zeka asistanıyım." },
  { anahtar: ["insan misin", "robot musun", "yapay zeka misin"], cevap: "Evet, ben bir yapay zekayım, insan değilim. Ama sohbet etmeyi çok seviyorum!" },
  { anahtar: ["tesekkur", "tesekkurler", "sag ol", "sagol", "eyvallah"], cevap: "Rica ederim! Başka bir şey var mı?" },
  { anahtar: ["gorusuruz", "hoscakal", "hosca kal", "bay bay"], cevap: "Görüşmek üzere! İhtiyacın olursa buradayım." },
  { anahtar: ["saka yap", "fikra anlat", "espri yap", "fikra", "saka"], cevap: () => SAKALAR[Math.floor(Math.random() * SAKALAR.length)] },

  // ---- Saat ve tarih (cihazın saatinden) ----
  { anahtar: ["saat kac", "su an saat"], cevap: () => "Saat " + new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) + "." },
  {
    anahtar: ["bugun gunlerden ne", "bugun ayin kaci", "bugunun tarihi", "tarih ne"],
    cevap: () => "Bugün " + new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + ".",
  },

  // ---- Türkiye ve tarih ----
  { anahtar: ["turkiye baskent"], cevap: "Türkiye'nin başkenti Ankara'dır." },
  { anahtar: ["turkiye para birimi"], cevap: "Türkiye'nin para birimi Türk lirasıdır." },
  { anahtar: ["turkiye telefon kodu", "turkiye ulke kodu"], cevap: "Türkiye'nin ülke telefon kodu artı doksandır." },
  { anahtar: ["turkiye en yuksek dag"], cevap: "Türkiye'nin en yüksek dağı yaklaşık 5.137 metreyle Ağrı Dağı'dır." },
  { anahtar: ["turkiye en buyuk gol"], cevap: "Türkiye'nin en büyük gölü Van Gölü'dür." },
  { anahtar: ["ataturk dogdu", "ataturk dogum"], cevap: "Mustafa Kemal Atatürk 1881'de Selanik'te doğdu." },
  { anahtar: ["cumhuriyet ilan", "cumhuriyet bayram", "cumhuriyet ne zaman"], cevap: "Cumhuriyet 29 Ekim 1923'te ilan edildi." },
  { anahtar: ["23 nisan"], cevap: "23 Nisan 1920'de Türkiye Büyük Millet Meclisi Ankara'da açıldı. Bu gün Ulusal Egemenlik ve Çocuk Bayramı olarak kutlanır." },
  { anahtar: ["19 mayis"], cevap: "19 Mayıs 1919'da Mustafa Kemal Samsun'a çıktı; bu tarih Kurtuluş Savaşı'nın başlangıcı sayılır. Atatürk'ü Anma, Gençlik ve Spor Bayramı olarak kutlanır." },
  { anahtar: ["30 agustos"], cevap: "30 Ağustos 1922'de Başkomutanlık Meydan Muharebesi kazanıldı; bu gün Zafer Bayramı olarak kutlanır." },
  { anahtar: ["istiklal marsi kim", "istiklal marsi yazar", "istiklal marsini kim"], cevap: "İstiklal Marşı'nı Mehmet Akif Ersoy yazdı. 12 Mart 1921'de Türkiye Büyük Millet Meclisi tarafından kabul edildi." },

  // ---- Güvenlik ----
  { anahtar: ["acil numara", "ambulans numara", "acil durum numara"], cevap: "Acil durumda 112'yi ara. Sağlık, polis, itfaiye ve jandarma için acil çağrı numarasıdır." },
  {
    anahtar: ["deprem aninda", "deprem olunca", "deprem ne yapmali"],
    cevap: "Deprem anında ÇÖK, KAPAN, TUTUN: yere çök, başını ve boynunu koru, sağlam bir şeye tutun ve sarsıntı bitene kadar bekle. Sonra asansör kullanmadan sakince açık alana çık. Acil durumda 112'yi ara.",
  },
];
