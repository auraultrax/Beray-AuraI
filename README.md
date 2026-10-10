# AURAI — GitHub Pages sürümü

Bu sürüm yalnızca `index.html` ile çalışır. Node.js, Ollama, API anahtarı veya derleme adımı gerektirmez.

## GitHub Pages ile yayınlama
1. Bu klasördeki `index.html` ve `README.md` dosyalarını GitHub deposunun kök dizinine yükleyin.
2. Depoda **Settings → Pages** bölümünü açın.
3. **Deploy from a branch** seçin, `main` ve `/(root)` seçerek kaydedin.
4. GitHub Pages'in verdiği bağlantıyı açın.

## Nasıl çalışır?
- Türkçe hazır yanıt listesinde net bir eşleşme varsa doğrudan yanıt verir.
- Eşleşme yoksa Google aramasını bir iframe içinde göstermeyi dener; Google bunu engellerse "Yeni sekmede aç" bağlantısı kullanılabilir.
- Sohbet geçmişi tarayıcının localStorage alanında saklanır.

## Sınırlar
- Bu, trilyonlarca hazır cevabı depolayan veya büyük bir dil modeli kullanan bir sistem değildir. Küçük bir hazır yanıt motoru ve Google'a arama bağlantısı sunan statik bir arayüzdür.
- Google arama sonuçlarının iframe içinde görünmesi Google tarafından garanti edilmez. GitHub Pages tek başına sunucu API'lerine gizli anahtar saklayarak erişemez.
