import {
  SELAM_CEVABI, komutCoz, googleAramaUrl, telBaglantisi,
  smsBaglantisi, baglantiGuvenli, telefonTemizle,
} from "./komutlar.js";

// Model kütüphanesi (sürüm sabitlenmiş). Yalnızca model başlatılırken yüklenir;
// bu yüzden kütüphane yüklenemese bile komutlar çalışmaya devam eder.
const WEBLLM_URL = "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.84/+esm";

const MODELLER = {
  hafif: {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    ad: "Hafif — Qwen2.5 0.5B",
    bellek: "yaklaşık 1 GB",
    dusunmeKapat: false,
  },
  dengeli: {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    ad: "Dengeli — Qwen2.5 1.5B",
    bellek: "yaklaşık 1,6 GB",
    dusunmeKapat: false,
  },
  gelismis: {
    id: "Qwen3-1.7B-q4f16_1-MLC",
    ad: "Gelişmiş — Qwen3 1.7B",
    bellek: "yaklaşık 2 GB",
    dusunmeKapat: true, // Qwen3'ün "düşünme" modunu kapatır
  },
};
const VARSAYILAN_MODEL = "dengeli";

const YARDIM =
  "Sorularını cevaplarım. “araştır …” dersen Google araması hazırlarım. " +
  "“ara” dersen arama bağlantısı, “mesaj gönder” dersen mesajı hazırlarım. " +
  "Arama ve mesajın son onayını sen telefonda verirsin. Vazgeçmek için “iptal” de.";

const $ = (id) => document.getElementById(id);

const depo = {
  oku(k) { try { return localStorage.getItem(k); } catch { return null; } },
  yaz(k, v) { try { localStorage.setItem(k, v); } catch { /* yok say */ } },
  sil(k) { try { localStorage.removeItem(k); } catch { /* yok say */ } },
};

const kayitliModel = depo.oku("xmax_model");

const durum = {
  kayit: null,
  motor: null,
  modelAnahtari: Object.hasOwn(MODELLER, kayitliModel) ? kayitliModel : VARSAYILAN_MODEL,
  yukleniyor: false,
  uretiyor: false,
  gecmis: [],
  bekleyen: null, // çok adımlı komutlar (ara / mesaj gönder / araştır)
  sesliCevap: depo.oku("xmax_sesli") !== "0",
  surekli: false,
  aktifBitis: 0,
  konusuyor: false,
};

// ---- Öğeler ----
const uygulama = $("uygulama");
const kayitEkrani = $("kayitEkrani");
const kayitFormu = $("kayitFormu");
const asistanBaslik = $("asistanBaslik");
const modelDurum = $("modelDurum");
const mesajlar = $("mesajlar");
const modelKart = $("modelKart");
const modelSec = $("modelSec");
const indirBtn = $("indirBtn");
const ilerleme = $("ilerleme");
const ilerlemeYazi = $("ilerlemeYazi");
const surekliKutu = $("surekliKutu");
const cagriAd = $("cagriAd");
const girisFormu = $("girisFormu");
const mikBtn = $("mikBtn");
const girdi = $("girdi");
const gonderBtn = $("gonderBtn");
const durumSatiri = $("durumSatiri");
const ayarBtn = $("ayarBtn");
const ayarKutusu = $("ayarKutusu");
const sesliCevapKutu = $("sesliCevapKutu");
const ayarModelSec = $("ayarModelSec");
const verileriSilBtn = $("verileriSilBtn");
const ayarKapatBtn = $("ayarKapatBtn");

// ---- Mesaj yardımcıları (içerik her zaman textContent ile eklenir) ----
function kaydir() { mesajlar.scrollTop = mesajlar.scrollHeight; }

function mesajEkle(metin, tur) {
  const d = document.createElement("div");
  d.className = "mesaj " + tur;
  d.textContent = metin;
  mesajlar.appendChild(d);
  kaydir();
  return d;
}

function yanitla(metin) {
  const d = mesajEkle(metin, "asistan");
  konus(metin);
  return d;
}

function baglantiEkle(href, etiket) {
  if (!baglantiGuvenli(href)) {
    mesajEkle("Bu bağlantıya izin verilmiyor.", "asistan");
    return;
  }
  const d = document.createElement("div");
  d.className = "mesaj asistan eylem";
  const a = document.createElement("a");
  a.href = href;
  a.textContent = etiket;
  if (href.startsWith("https:")) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  d.appendChild(a);
  mesajlar.appendChild(d);
  kaydir();
}

function dugmeEkle(etiket, islev) {
  const d = document.createElement("div");
  d.className = "mesaj asistan eylem";
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = etiket;
  b.addEventListener("click", islev);
  d.appendChild(b);
  mesajlar.appendChild(d);
  kaydir();
}

function durumYaz(metin) { durumSatiri.textContent = metin || ""; }

function modelDurumYaz(kod, metin) {
  modelDurum.dataset.durum = kod;
  modelDurum.textContent = metin;
}

// ---- Giriş akışı ----
async function girdiyiIsle(ham) {
  const metin = String(ham ?? "").trim().slice(0, 500);
  if (!metin || !durum.kayit) return;
  mesajEkle(metin, "kullanici");
  await isle(metin);
}

async function isle(metin) {
  const k = komutCoz(metin, durum.kayit.asistanAdi);
  if (durum.bekleyen && (await bekleyenAdim(metin, k))) return;
  switch (k.tur) {
    case "selam": return yanitla(SELAM_CEVABI);
    case "iptal": durum.bekleyen = null; return yanitla("Tamam, iptal ettim.");
    case "yardim": return yanitla(YARDIM);
    case "arastir": return arastir(k.sorgu);
    case "tel": return telBaslat(k);
    case "sms": return smsBaslat(k);
    case "bos": return undefined;
    default: return soruSor(k.metin || metin);
  }
}

// ---- Araştırma (Google'a bağlantı; yalnızca izinli alan adları) ----
function arastir(sorgu) {
  const q = String(sorgu ?? "").trim();
  if (!q) {
    durum.bekleyen = { is: "arastir" };
    yanitla("Neyi araştırayım?");
    return;
  }
  yanitla("Aramayı hazırladım. Bağlantıya dokununca Chrome'da Google açılır.");
  baglantiEkle(googleAramaUrl(q), "Google'da ara: " + q.slice(0, 60));
}

// ---- Arama ve mesaj (her zaman kullanıcı onayıyla) ----
function kisiSecDestekli() {
  return "contacts" in navigator && "ContactsManager" in window;
}

function kisiSecDugmesiEkle() {
  dugmeEkle("Kişi seç", async () => {
    try {
      const sec = await navigator.contacts.select(["name", "tel"], { multiple: false });
      const kisi = sec && sec[0];
      const num = telefonTemizle((kisi && kisi.tel && kisi.tel[0]) || "");
      if (!num) {
        yanitla("Bu kişinin numarası yok. Numarayı yazar mısın?");
        return;
      }
      const ad = String((kisi.name && kisi.name[0]) || num).slice(0, 40);
      numaraAlindi(num, ad);
    } catch {
      mesajEkle("Kişi seçilmedi.", "asistan");
    }
  });
}

function numaraAlindi(num, ad) {
  const b = durum.bekleyen;
  if (!b) return;
  if (b.is === "tel") {
    durum.bekleyen = null;
    telHazirla(num, ad);
  } else {
    durum.bekleyen = { is: "sms", adim: "metin", numara: num, ad };
    yanitla(ad + " için mesajın ne olsun?");
  }
}

function telBaslat(k) {
  if (k.numara) { telHazirla(k.numara, k.numara); return; }
  durum.bekleyen = { is: "tel", adim: "numara" };
  if (kisiSecDestekli()) {
    yanitla("Kimi arayayım? Kişi seç düğmesine dokun ya da numarayı yaz.");
    kisiSecDugmesiEkle();
  } else {
    yanitla("Hangi numarayı arayayım? Numarayı yaz.");
  }
}

function smsBaslat(k) {
  if (k.numara) {
    durum.bekleyen = { is: "sms", adim: "metin", numara: k.numara, ad: k.numara };
    yanitla("Mesajın ne olsun?");
    return;
  }
  durum.bekleyen = { is: "sms", adim: "numara" };
  if (kisiSecDestekli()) {
    yanitla("Kime göndereyim? Kişi seç düğmesine dokun ya da numarayı yaz.");
    kisiSecDugmesiEkle();
  } else {
    yanitla("Hangi numaraya göndereyim? Numarayı yaz.");
  }
}

function telHazirla(num, ad) {
  const href = telBaglantisi(num);
  if (!href) { yanitla("Bu numarayı anlayamadım."); return; }
  yanitla("Hazır. Bağlantıya dokununca arama ekranı açılır; aramayı sen başlatırsın.");
  baglantiEkle(href, "Ara: " + ad);
}

function smsHazirla(num, metin) {
  const href = smsBaglantisi(num, metin);
  if (!href) { yanitla("Numara geçersiz, işlemi iptal ettim."); return; }
  yanitla("Mesaj hazır. Bağlantıya dokununca mesaj uygulaması açılır; göndermek için son onayı orada sen verirsin.");
  baglantiEkle(href, "Mesajı aç: " + metin.slice(0, 50));
}

// Çok adımlı komutun bir sonraki adımı. true dönerse girdi bu adımda tüketildi.
async function bekleyenAdim(metin, k) {
  const b = durum.bekleyen;
  if (k.tur === "iptal") {
    durum.bekleyen = null;
    yanitla("Tamam, iptal ettim.");
    return true;
  }
  if (b.is === "arastir") {
    durum.bekleyen = null;
    arastir(metin);
    return true;
  }
  if (b.adim === "numara") {
    const num = telefonTemizle(metin);
    if (num) { numaraAlindi(num, num); return true; }
    if (k.tur !== "soru") { durum.bekleyen = null; return false; } // başka komut verdi
    yanitla("Numarayı anlayamadım. Rakamlarla yazar mısın? Vazgeçmek için “iptal” de.");
    return true;
  }
  if (b.adim === "metin") {
    durum.bekleyen = null;
    smsHazirla(b.numara, metin);
    return true;
  }
  return false;
}

// ---- Yapay zeka (tarayıcıda çalışan model) ----
function sistemMetni() {
  const m = MODELLER[durum.modelAnahtari];
  const ad = durum.kayit.asistanAdi;
  return (
    `Sen ${ad} adında, Türkçe konuşan bir sesli asistansın. Kullanıcının adı ${durum.kayit.ad}. ` +
    "Her zaman Türkçe cevap ver. Cevapların kısa olsun: en fazla üç cümle. " +
    "Madde işareti, başlık ve süslü biçim kullanma, çünkü cevabın sesli okunacak. " +
    "Emin olmadığın bilgiyi uydurma. Güncel bilgi gerekiyorsa kullanıcıya “araştır …” diyerek Google'da arama yapabileceğini söyle. " +
    "Telefonu kendi başına kontrol edemezsin; arama ya da mesaj için kullanıcıya “ara” veya “mesaj gönder” demesini söyle. " +
    `Sen bir yapay zekasın, insan olduğunu söyleme. Altta çalışan model ${m.ad}; bu açık lisanslı bir model ve sorulursa bunu söyle.`
  );
}

function temizle(t) {
  return t
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/<think>[\s\S]*$/, "")
    .trim();
}

function girisKilidi(kilitli) {
  gonderBtn.disabled = kilitli;
}

async function soruSor(soru) {
  if (!durum.motor) {
    yanitla(
      durum.yukleniyor
        ? "Yapay zeka hâlâ yükleniyor, birazdan tekrar sor."
        : "Yapay zeka henüz başlatılmadı. Yukarıdaki kartta “Yapay zekayı indir ve başlat” düğmesine bas. Bu arada araştır, ara ve mesaj gönder komutlarını kullanabilirsin."
    );
    return;
  }
  if (durum.uretiyor) {
    yanitla("Önceki cevabı bitiriyorum, bir saniye.");
    return;
  }
  durum.uretiyor = true;
  girisKilidi(true);
  const balon = mesajEkle("…", "asistan bekliyor");
  let tam = "";
  try {
    const m = MODELLER[durum.modelAnahtari];
    const istek = {
      messages: [
        { role: "system", content: sistemMetni() },
        ...durum.gecmis,
        { role: "user", content: soru },
      ],
      stream: true,
      temperature: 0.6,
      top_p: 0.9,
      max_tokens: 320,
    };
    if (m.dusunmeKapat) istek.extra_body = { enable_thinking: false };

    const akis = await durum.motor.chat.completions.create(istek);
    for await (const parca of akis) {
      const d = parca.choices && parca.choices[0] && parca.choices[0].delta && parca.choices[0].delta.content;
      if (d) {
        tam += d;
        const gorunen = temizle(tam);
        if (gorunen) {
          balon.classList.remove("bekliyor");
          balon.textContent = gorunen;
          kaydir();
        }
      }
    }
    const nihai = temizle(tam) || "Cevap üretemedim, tekrar dener misin?";
    balon.classList.remove("bekliyor");
    balon.textContent = nihai;
    durum.gecmis.push({ role: "user", content: soru }, { role: "assistant", content: nihai });
    if (durum.gecmis.length > 10) durum.gecmis.splice(0, durum.gecmis.length - 10);
    konus(nihai);
  } catch (e) {
    console.error(e);
    balon.classList.remove("bekliyor");
    balon.textContent = "Bir hata oldu. Sayfayı yenileyip tekrar dene.";
  } finally {
    durum.uretiyor = false;
    girisKilidi(false);
  }
}

function kartMesaji(metin) { ilerlemeYazi.textContent = metin; }

async function modeliBaslat() {
  if (durum.yukleniyor || durum.motor) return;
  const anahtar = modelSec.value;
  const m = MODELLER[anahtar];
  if (!m) return;

  if (!("gpu" in navigator)) {
    kartMesaji("Bu tarayıcı WebGPU desteklemiyor. Güncel Chrome ile dene (Android 12 ve üzeri ya da bilgisayar). Yapay zeka olmadan komutlar çalışmaya devam eder.");
    return;
  }
  let adaptor = null;
  try { adaptor = await navigator.gpu.requestAdapter(); } catch { /* yok say */ }
  if (!adaptor) {
    kartMesaji("Cihazının ekran kartı WebGPU için uygun görünmüyor. Daha yeni bir cihaz ya da bilgisayar dene.");
    return;
  }

  durum.yukleniyor = true;
  indirBtn.disabled = true;
  modelSec.disabled = true;
  ilerleme.hidden = false;
  ilerleme.value = 0;
  kartMesaji("Başlıyor…");
  modelDurumYaz("yukleniyor", "Yapay zeka yükleniyor…");
  try {
    const webllm = await import(WEBLLM_URL);
    const motor = await webllm.CreateMLCEngine(m.id, {
      initProgressCallback: (r) => {
        const oran = Math.min(1, Math.max(0, r.progress || 0));
        ilerleme.value = oran;
        const iniyor = /fetch/i.test(r.text || "");
        kartMesaji("%" + Math.round(oran * 100) + (iniyor ? " — model indiriliyor" : " — model hazırlanıyor"));
      },
    });
    durum.motor = motor;
    durum.modelAnahtari = anahtar;
    depo.yaz("xmax_model", anahtar);
    modelKart.hidden = true;
    modelDurumYaz("hazir", m.ad + " hazır");
    mesajEkle("Yapay zeka hazır. “Merhaba " + durum.kayit.asistanAdi + "” diyerek başlayabilirsin.", "asistan");
  } catch (e) {
    console.error(e);
    modelDurumYaz("kapali", "Yapay zeka kapalı");
    indirBtn.disabled = false;
    modelSec.disabled = false;
    ilerleme.hidden = true;
    kartMesaji("Model yüklenemedi. İnternet bağlantını kontrol et; olmazsa daha hafif bir model seç. Ayrıntı için tarayıcı konsoluna bak.");
  } finally {
    durum.yukleniyor = false;
  }
}

// ---- Sesli cevap ----
function konus(metin) {
  if (!durum.sesliCevap || !("speechSynthesis" in window)) return;
  const sade = String(metin).replace(/[*#`_>]/g, " ").slice(0, 600);
  if (!sade.trim()) return;
  const u = new SpeechSynthesisUtterance(sade);
  u.lang = "tr-TR";
  const ses = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith("tr"));
  if (ses) u.voice = ses;
  const bitti = () => {
    durum.konusuyor = false;
    if (durum.surekli) tanimaBaslat("surekli");
  };
  u.onstart = () => {
    durum.konusuyor = true;
    tanimaDurdur(); // kendi sesini dinlemesin
  };
  u.onend = bitti;
  u.onerror = bitti;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// ---- Ses girişi ----
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let tanima = null;
let tanimaMod = "tek";
let tanimaCalisiyor = false;

function mikGuncelle() {
  mikBtn.classList.toggle("dinliyor", tanimaCalisiyor);
  mikBtn.setAttribute("aria-pressed", String(tanimaCalisiyor));
  if (tanimaCalisiyor) {
    durumYaz(tanimaMod === "surekli" ? "Dinliyorum — “Merhaba " + durum.kayit.asistanAdi + "” de." : "Dinliyorum…");
  } else if (durumSatiri.textContent.startsWith("Dinliyorum")) {
    durumYaz("");
  }
}

function tanimaDurdur() {
  if (tanima) {
    const t = tanima;
    tanima = null;
    t.onresult = null;
    t.onerror = null;
    t.onend = null;
    try { t.abort(); } catch { /* yok say */ }
  }
  tanimaCalisiyor = false;
  mikGuncelle();
}

function sesGeldi(metin) {
  const m = String(metin || "").trim();
  if (!m) return;
  if (tanimaMod === "surekli") {
    const k = komutCoz(m, durum.kayit.asistanAdi);
    const simdi = Date.now();
    if (k.cagri) {
      durum.aktifBitis = simdi + 45000;
    } else if (simdi < durum.aktifBitis) {
      durum.aktifBitis = simdi + 45000;
    } else {
      return; // çağrılmadı, yok say
    }
  }
  girdiyiIsle(m);
}

function tanimaBaslat(mod) {
  if (!SR) {
    yanitla("Bu tarayıcı ses girişini desteklemiyor. Chrome kullan.");
    durum.surekli = false;
    surekliKutu.checked = false;
    return;
  }
  tanimaDurdur();
  const t = new SR();
  t.lang = "tr-TR";
  t.interimResults = false;
  t.maxAlternatives = 1;
  t.continuous = mod === "surekli";
  t.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) sesGeldi(e.results[i][0].transcript);
    }
  };
  t.onerror = (e) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      durum.surekli = false;
      surekliKutu.checked = false;
      tanimaDurdur();
      mesajEkle("Mikrofon izni verilmedi. Adres çubuğundaki ayarlardan izin verebilirsin.", "asistan");
    } else if (e.error === "no-speech" && mod === "tek") {
      durumYaz("Ses algılanamadı.");
    }
  };
  t.onend = () => {
    if (tanima !== t) return;
    tanima = null;
    tanimaCalisiyor = false;
    mikGuncelle();
    if (mod === "surekli" && durum.surekli && !durum.konusuyor) {
      setTimeout(() => { if (durum.surekli && !tanima && !durum.konusuyor) tanimaBaslat("surekli"); }, 400);
    }
  };
  tanima = t;
  tanimaMod = mod;
  try {
    t.start();
    tanimaCalisiyor = true;
  } catch {
    tanimaCalisiyor = false;
  }
  mikGuncelle();
}

mikBtn.addEventListener("click", () => {
  if (tanimaCalisiyor) {
    durum.surekli = false;
    surekliKutu.checked = false;
    tanimaDurdur();
    return;
  }
  tanimaBaslat("tek");
});

surekliKutu.addEventListener("change", () => {
  durum.surekli = surekliKutu.checked;
  if (durum.surekli) tanimaBaslat("surekli");
  else tanimaDurdur();
});

// ---- Yazılı giriş ----
girisFormu.addEventListener("submit", (e) => {
  e.preventDefault();
  const m = girdi.value;
  girdi.value = "";
  girdiyiIsle(m);
});

// ---- Model kartı ve ayarlar ----
function modelSecenekleriniDoldur(secim) {
  for (const [anahtar, m] of Object.entries(MODELLER)) {
    const o = document.createElement("option");
    o.value = anahtar;
    o.textContent = m.ad + " (GPU belleği " + m.bellek + ")";
    secim.appendChild(o);
  }
  secim.value = durum.modelAnahtari;
}

indirBtn.addEventListener("click", modeliBaslat);

ayarBtn.addEventListener("click", () => {
  sesliCevapKutu.checked = durum.sesliCevap;
  ayarModelSec.value = durum.modelAnahtari;
  ayarKutusu.showModal();
});
ayarKapatBtn.addEventListener("click", () => ayarKutusu.close());
sesliCevapKutu.addEventListener("change", () => {
  durum.sesliCevap = sesliCevapKutu.checked;
  depo.yaz("xmax_sesli", durum.sesliCevap ? "1" : "0");
  if (!durum.sesliCevap && "speechSynthesis" in window) speechSynthesis.cancel();
});
ayarModelSec.addEventListener("change", () => {
  depo.yaz("xmax_model", ayarModelSec.value);
  location.reload();
});
verileriSilBtn.addEventListener("click", () => {
  if (confirm("Kayıt bilgilerin ve ayarların bu cihazdan silinsin mi?")) {
    ["xmax_kayit", "xmax_model", "xmax_sesli"].forEach((k) => depo.sil(k));
    location.reload();
  }
});

// ---- Kayıt ----
function kayitliyiOku() {
  try {
    const k = JSON.parse(depo.oku("xmax_kayit") || "null");
    if (k && typeof k.ad === "string" && typeof k.asistanAdi === "string" && k.ad && k.asistanAdi) return k;
  } catch { /* bozuk kayıt: yok say */ }
  return null;
}

function uygulamayiAc() {
  const ad = durum.kayit.asistanAdi;
  kayitEkrani.hidden = true;
  uygulama.hidden = false;
  asistanBaslik.textContent = ad;
  cagriAd.textContent = ad;
  document.title = ad + " Asistan";
  indirBtn.textContent = kayitliModel ? "Yapay zekayı başlat" : "Yapay zekayı indir ve başlat";
  mesajEkle(
    "Merhaba " + durum.kayit.ad + ". Ben " + ad + ". “Merhaba " + ad + "” diyerek ya da yazarak başlayabilirsin. Neler yapabildiğimi görmek için “yardım” yaz.",
    "asistan"
  );
}

kayitFormu.addEventListener("submit", (e) => {
  e.preventDefault();
  const kayit = {
    ad: $("kayitAd").value.trim().slice(0, 40),
    soyad: $("kayitSoyad").value.trim().slice(0, 40),
    asistanAdi: ($("kayitAsistanAdi").value.trim() || "XMAX").slice(0, 24),
  };
  if (!kayit.ad || !kayit.soyad || !$("kayitOnay").checked) return;
  depo.yaz("xmax_kayit", JSON.stringify(kayit));
  durum.kayit = kayit;
  uygulamayiAc();
});

// ---- Başlangıç ----
modelSecenekleriniDoldur(modelSec);
modelSecenekleriniDoldur(ayarModelSec);
durum.kayit = kayitliyiOku();
if (durum.kayit) uygulamayiAc();
else kayitEkrani.hidden = false;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* çevrimdışı önbellek olmadan da çalışır */ });
}
