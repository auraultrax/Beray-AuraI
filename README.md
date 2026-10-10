# AURAI — Beray AI

Türkçe öncelikli sohbet arayüzü. Sık sorulan birkaç konuya hazır yanıt verir; diğer soruları sunucu tarafındaki modele gönderir. Modelin web arama aracına erişimi varsa araştırıp sentezlediği yanıtı aynı sohbet ekranına döndürür.

## Yayınlama
Bu ZIP **Cloudflare Pages** için düzenlenmiştir. Yalnızca GitHub Pages statik dosya sunar; gizli anahtarı koruyamaz ve `functions/api/chat.js` sunucu işlevini çalıştıramaz.

1. ZIP içindeki `AURAI` klasörünün içeriğini GitHub deposuna yükle.
2. Cloudflare Pages'te depoyu bağla. Kök klasör `AURAI` alt klasörü ise Root directory alanına `AURAI` yaz.
3. Settings → Variables and Secrets bölümünde `ZAI_API_KEY` adlı gizli değişken oluşturup sağlayıcının API anahtarını gir.
4. Deploy et.

API anahtarını `index.html` içine koyma veya GitHub'a yükleme. Canlı API erişimi bu paketten doğrulanmış değildir; model ve web arama aracı sağlayıcı hesabının yetkilerine bağlıdır.

## Yerli teknoloji notu
Arayüz ve ürün geliştirmesi Beray AI'ye aittir; bu sürüm dış sağlayıcıdaki modele dayanır. Bu nedenle temel modelin tamamen yerli olduğu söylenmemelidir. İleride yerli altyapıda çalışan açık ağırlıklı model veya Beray AI'nin eğittiği bir modelle değiştirilebilir.
