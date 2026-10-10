# AURAI — GitHub + çevrimiçi dağıtım paketi

Bu sürüm yerel terminal/Node.js kurulumu gerektirmeyen, GitHub deposuna yüklenip Vercel üzerinden yayımlanabilecek bir pakettir. Kaynak kod GitHub'da kalır; Vercel uygulamanın web sayfasını ve sunucu tarafındaki `/api/*` fonksiyonlarını çalıştırır.

## En kolay yayınlama (bilgisayarına program kurmadan)

1. Bu ZIP dosyasını indirip Windows'ta **Tümünü Ayıkla** ile aç.
2. GitHub.com'da yeni bir depo oluştur (`aurai` gibi).
3. Depoda **Add file → Upload files** seç. Bu ZIP'in içindeki dosyaları yükle: `index.html`, `app.js`, `style.css`, `package.json`, `.gitignore`, `README.md` ve `api` klasöründeki üç JavaScript dosyası (`chat.js`, `health.js`, `search.js`). Klasör yapısı `api/chat.js`, `api/health.js`, `api/search.js` olarak korunmalı.
4. `Commit changes` düğmesine bas.
5. Vercel.com'da GitHub hesabınla oturum aç ve **Add New → Project** ile `aurai` deposunu içe aktar.
6. Vercel proje ayarlarında **Settings → Environment Variables** bölümüne git. `ZAI_API_KEY` adlı değişken ekle, değer alanına API sağlayıcının anahtarını yapıştır. 
7. Şimdilik `ZAI_MODEL` için `glm-4.6` kullanılır; hesabın farklı model gerektiriyorsa bunu ayrıca değiştirebilirsin. Ayarları kaydet ve **Deploy** seç.
8. Vercel'in oluşturduğu web adresini aç. AURAI çevrimiçi çalışır; bilgisayarında `npm start` çalıştırman gerekmez.

## İsteğe bağlı web araması

Kaynak kartları için Vercel ortam değişkenlerinden birini ayrıca ekleyebilirsin: `BRAVE_SEARCH_API_KEY` veya `TAVILY_API_KEY`. Bunlar eklenmezse Google arama bağlantısı yedek olarak görüntülenir; Google sonuçları otomatik olarak okunmuş gibi gösterilmez.

## Önemli

- Bu projeyi **saf GitHub Pages** üzerinde tek başına çalıştırmak mümkün değildir; GitHub Pages statik içerik sunar ve burada gereken gizli API anahtarını sunucu tarafında tutan fonksiyonları çalıştırmaz. Bu nedenle GitHub deposu + Vercel kullanılır; GitHub depodaki ana kaynak kodun evidir.
- API anahtarını HTML, `app.js`, `chat.js` ya da herkese açık depoya yazma. Anahtar yalnızca Vercel Environment Variables ayarında olmalı.
- İlk yayında site herkese açık olursa ziyaretçiler API kotanı tüketebilir. Önce kişisel deneme olarak kullan; sonrasında kimlik doğrulama ve daha sıkı kota limiti eklenebilir.
- AURAI'nin yanıt kalitesi kullanılan model, API kotası ve hesap erişimine bağlıdır. Bu paket hazırlanmış olsa da hesap anahtarıyla canlı üretim yanıtı burada doğrulanmamıştır.
