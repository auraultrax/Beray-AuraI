# XMAX — Türkçe sesli asistan

Tarayıcıda çalışan, sunucusuz ve ücretsiz bir asistan. Yapay zeka modeli kullanıcının kendi cihazında çalışır (WebLLM + WebGPU). Hesap, API anahtarı ya da ödeme gerekmez.

## Neler yapar

- Türkçe sohbet eder, cevabı sesli okur.
- “Merhaba XMAX” deyince şu cevabı verir: *Merhaba, öncelikle nasılsınız veya ne konuda konuşmak istersiniz?*
- “araştır …” deyince Google aramasını hazırlar; bağlantı Chrome'da açılır. Yalnızca `google.com` ve `google.com.tr` bağlantılarına izin verilir (`komutlar.js` içinde değiştirilebilir).
- “ara” ve “mesaj gönder” ile arama ve mesajı hazırlar. **Son onayı her zaman kullanıcı verir**: bağlantıya dokunur, arama ya da mesaj uygulaması açılır, gönderme düğmesine kendisi basar.
- İlk açılışta kayıt ekranı vardır (ad, soyad, asistan adı). Bilgiler yalnızca cihazda (`localStorage`) saklanır.
- Chrome'da “Ana ekrana ekle” ile uygulama gibi kurulur.

## Neler yapmaz

- Telefonu kendi başına ele geçirmez, kullanıcı haberi olmadan arama ya da mesaj gönderemez. Tarayıcı bunu zaten engeller.
- Sayfa kapalıyken “Merhaba XMAX” diye uyanmaz. “Çağır” seçeneği yalnızca sayfa açıkken çalışır (deneysel; Android'de dinleme sık sık yeniden başladığı için bip sesi duyulabilir).
- Güncel bilgi bilmez; bunun için “araştır …” kullanılır. Küçük modeller yanlış bilgi verebilir.

## Gereksinimler

- Güncel **Google Chrome** (bilgisayar ya da Android 12 ve üzeri). WebGPU gerekir.
- Model için yaklaşık 1–2 GB boş GPU belleği. Zayıf cihazlarda “Hafif” modeli seç.
- Model ilk kullanımda indirilir (yüzlerce MB ile yaklaşık 1 GB arası). Wi‑Fi önerilir. Sonra cihazda önbellekte kalır.

## GitHub Pages ile yayınlama

1. GitHub'da yeni bir depo (repository) oluştur, örneğin `xmax`.
2. Bu klasördeki tüm dosyaları depoya yükle (`index.html`, `app.js`, `komutlar.js`, `style.css`, `sw.js`, `manifest.json`, iki ikon, `test/` klasörü).
3. Depoda **Settings → Pages** bölümüne git. “Branch” olarak `main`, klasör olarak `/ (root)` seç, kaydet.
4. Birkaç dakika sonra adres hazırdır: `https://KULLANICI-ADIN.github.io/xmax/`
5. Adresi Chrome'da aç. Telefonda menüden **Ana ekrana ekle** de.

## Gizlilik ve güvenlik

- Yazdıkların ve sohbet geçmişin cihazından çıkmaz; geçmiş kaydedilmez.
- Dışarı çıkan tek şeyler: model dosyaları (Hugging Face ve GitHub'dan indirilir), model kütüphanesi (jsDelivr'den), **sesle konuşurken Chrome'un ses tanıma servisi** (ses Google'a gönderilir) ve kullanıcının dokunup açtığı Google araması.
- `index.html` içindeki Content-Security-Policy, sayfanın yalnızca bu adreslere bağlanmasına izin verir. Sayfada satır içi betik yoktur; mesajlar `textContent` ile eklenir, bu yüzden HTML enjeksiyonu çalışmaz.
- Açılan bağlantılar tek bir yerden süzülür (`baglantiGuvenli`): `https` ise izinli alan adı, `tel:` ve `sms:` ise doğrulanmış numara olmak zorundadır.
- Kod içine anahtar ya da şifre koyma. Bu projede hiçbiri gerekmiyor.
- KVKK: Proje kişisel veriyi bir sunucuya göndermez. Yine de uygulamayı yayınlayan olarak aydınlatma ve açık rıza yükümlülüklerin için bir hukuk danışmanına sor; ben avukat değilim.

## Sorun giderme

- **“WebGPU desteklemiyor”**: Chrome'u güncelle. Eski ya da çok zayıf cihazlarda çalışmaz; komutlar (araştır, ara, mesaj) yine çalışır.
- **Model inmiyor**: Tarayıcı konsolunu (F12) aç. “Content Security Policy” hatası görürsen hatada geçen adresi `index.html` içindeki `connect-src` listesine ekle.
- **Mikrofon çalışmıyor**: Adres çubuğundaki kilit simgesinden mikrofon iznini ver. Sayfa `https` ile açılmalıdır.
- **Güncelleme görünmüyor**: Servis dosyası eski sürümü tutuyor olabilir. Sayfayı yenile ya da `sw.js` içindeki `ONBELLEK` adını değiştir.

## Değiştirme

- Model listesi ve sürüm: `app.js` başındaki `MODELLER` ve `WEBLLM_URL`.
- İzinli arama alan adları: `komutlar.js` içindeki `IZINLI_ALAN_ADLARI`.
- Komutlar: `komutlar.js` içindeki `komutCoz`. Değiştirince `node test/komutlar.test.mjs` ile kontrol et.

## Lisanslar ve atıf

- [WebLLM](https://github.com/mlc-ai/web-llm): Apache-2.0.
- Modeller Hugging Face'ten kullanıcının tarayıcısına indirilir, bu depoda dağıtılmaz: Alibaba Qwen ekibinin Qwen2.5 (0.5B, 1.5B) ve Qwen3 (1.7B) modelleri, Apache-2.0. Model sayfalarındaki lisansı kendin de doğrula.
- Bu modeller yabancı kurumların açık modelleridir. Uygulamayı tanıtırken “yerli model” demek yanlış olur; “açık kaynaklı modellerle çalışan Türkçe asistan” demek doğrudur.
- Kendi kodun için bir lisans seç (ör. MIT) ve `LICENSE` dosyası ekle.
