/* AURAI yerel cevap motoru: hesap makinesi, birim, yüzde, tarih/saat, hazır bilgi.
   Eşleşme yoksa null döner ve sohbet web araştırmasına geçer. */
(()=>{
const tr=s=>s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/['’`]/g,'');
const fmt=n=>isFinite(n)?(+n.toPrecision(12)).toLocaleString('tr-TR',{maximumFractionDigits:10}):null;
const NUM='\\d+(?:[.,]\\d+)?',N=s=>parseFloat(String(s).replace(',','.'));

// --- İşlem ayrıştırıcı (+ - * / ^ % parantez) ---
function evalExpr(t){let i=0;const bad=()=>{throw 0};
 const num=()=>{const m=/^\d+(?:\.\d+)?/.exec(t.slice(i));if(!m)bad();i+=m[0].length;return +m[0]};
 const atom=()=>{let v;if(t[i]==='('){i++;v=expr();if(t[i++]!==')')bad()}else v=num();while(t[i]==='%'){i++;v/=100}return v};
 const un=()=>t[i]==='-'?(i++,-un()):t[i]==='+'?(i++,un()):atom();
 const pw=()=>{const b=un();if(t[i]==='^'){i++;return Math.pow(b,pw())}return b};
 const term=()=>{let v=pw();while(t[i]==='*'||t[i]==='/'){const o=t[i++],r=pw();v=o==='*'?v*r:v/r}return v};
 const expr=()=>{let v=term();while(t[i]==='+'||t[i]==='-'){const o=t[i++],r=term();v=o==='+'?v+r:v-r}return v};
 const v=expr();if(i!==t.length)bad();return v}
const FILLER=new Set('kac kactir sonuc sonucu nedir islem islemi islemin islemini hesapla hesaplar misin mi eder eden esittir ne bul bulur musun cevabi cevap sonucunu yap yapar lutfen'.split(' '));
function calc(q){let n=tr(q).replace(/,(?=\d)/g,'.');
 n=n.replace(/\barti\b/g,'+').replace(/\beksi\b/g,'-').replace(/\bcarpi\b/g,'*').replace(/\bbolu\b/g,'/').replace(/(\d)\s*[x×]\s*(?=[\d(])/g,'$1*').replace(/÷/g,'/');
 const m=n.match(/[\d(][\d.+\-*\/^%()\s]*[\d)%]/g);if(!m)return null;
 const e=m.sort((a,b)=>b.length-a.length)[0];if(!/\d\s*[+\-*\/^]\s*[\d(]/.test(e))return null;
 const rest=n.replace(e,' ').replace(/[^a-z\s]/g,' ').split(/\s+/).filter(Boolean);
 if(rest.some(w=>!(FILLER.has(w)||/^(kac|sonuc|isle|hesap|cevap|esit)/.test(w))))return null;
 try{const r=fmt(evalExpr(e.replace(/\s+/g,'')));return r&&{title:'Hesap makinesi',answer:`${e.replace(/\s+/g,' ').trim()} = ${r}`}}catch{return null}}

// --- Yüzde, karekök, faktöriyel, asal ---
function misc(q){const n=tr(q).replace(/,(?=\d)/g,'.');let m;
 if(m=n.match(new RegExp(`(${NUM})\\s*\\w*\\s+yuzde\\s+(${NUM})`)))return{title:'Yüzde',answer:`${m[1]} sayısının %${m[2]} değeri ${fmt(N(m[1])*N(m[2])/100)}.`};
 if(m=n.match(new RegExp(`(${NUM})\\s*(?:sayisinin\\s*)?karekok|karekok\\w*\\s*(${NUM})`))){const x=N(m[1]||m[2]);return{title:'Karekök',answer:`${fmt(x)} sayısının karekökü ${fmt(Math.sqrt(x))}.`}}
 if(m=n.match(/(\d+)\s*(?:sayisinin\s*)?faktoriyel/)){const x=+m[1];if(x<=170){let r=1;for(let i=2;i<=x;i++)r*=i;return{title:'Faktöriyel',answer:`${x}! = ${fmt(r)}`}}}
 if(m=n.match(/(\d+)\s*(?:sayisi\s*)?asal\s*mi/)){const x=+m[1];let p=x>1;for(let i=2;i*i<=x;i++)if(x%i===0){p=false;break}return{title:'Asal sayı',answer:`${x} ${p?'asal bir sayıdır.':'asal değildir.'}`}}
 return null}

// --- Birim dönüşümü ---
const U={};const add=(t,f,...a)=>a.forEach(x=>U[x]=[t,f]);
add('u',1000,'km','kilometre');add('u',1,'m','metre');add('u',.01,'cm','santimetre');add('u',.001,'mm','milimetre');add('u',1609.344,'mil');add('u',.3048,'ft','fit');add('u',.0254,'inc','inch');
add('k',1,'kg','kilo','kilogram');add('k',.001,'g','gram');add('k',.45359237,'lb','pound');add('k',1000,'ton');
add('h',1,'l','litre');add('h',.001,'ml','mililitre');add('h',3.785411784,'galon');
add('s',1,'c','celsius','santigrat');add('s',2,'f','fahrenheit');
function units(q){const n=tr(q).replace(/,(?=\d)/g,'.').replace(/°/g,'');
 const m=n.match(new RegExp(`(-?${NUM})\\s*([a-z]+)\\s+(?:kac|kactir)\\s+([a-z]+)`));if(!m)return null;
 const a=U[m[2]],b=U[m[3]];if(!a||!b||a[0]!==b[0])return null;const x=N(m[1]);let r;
 if(a[0]==='s')r=a[1]===b[1]?x:a[1]===1?x*9/5+32:(x-32)*5/9;else r=x*a[1]/b[1];
 return{title:'Birim dönüşümü',answer:`${fmt(x)} ${m[2]} = ${fmt(r)} ${m[3]}`}}

// --- Tarih / saat (cihaz saatine göre) ---
function when(q){const n=tr(q),d=new Date();
 if(/saat kac/.test(n))return{title:'Saat',answer:'Şu an saat '+d.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})+'.'};
 if(/(bugun|bugunun).*(gunlerden|tarih|ayin kaci)|gunlerden ne|tarih ne|bugun gunlerden/.test(n))return{title:'Tarih',answer:'Bugün '+d.toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'.'};
 if(/\bhangi yildayiz|yil kac\b/.test(n))return{title:'Yıl',answer:'Şu an '+d.getFullYear()+' yılındayız.'};
 return null}

// --- Hazır bilgi (kelime sınırıyla eşleşir) ---
const KB=[
// --- Beray ürün bilgileri (düzenlenebilir) ---
[['beray nedir','beray kimdir','beray ai nedir','beray ai hakkinda','beray hakkinda'],'Beray, Türkiye’den doğan bir teknoloji girişimidir. AURAI, AuraX ve Beray Sağlık gibi projeler Beray çatısı altında geliştiriliyor.'],
[['beray aura ultra x','aura ultra x','ultra x nedir','ultra x'],'Beray Aura Ultra X, AuraX uygulamasının tam adıdır: odalar, Keşfet akışı, liderlik tablosu, özel mesajlar, bildirimler ve arkadaşlarla birlikte YouTube izleme ya da çizim özellikleri olan sosyal bir uygulama.'],
[['aurax nedir','aura x nedir','aurax','beray aurax'],'AuraX, odalar, Keşfet akışı, liderlik tablosu, özel mesajlar, bildirimler ve arkadaşlarla birlikte YouTube izleme ya da çizim yapma gibi sosyal özellikleri olan bir uygulamadır.'],
[['beray platformu','beray platform','beray platformu nedir'],'Beray Platformu, Beray’a ait bir projedir. Ayrıntılı tanıtımı henüz eklenmedi.'],
[['beray saglik','beray saglik nedir'],'Beray Sağlık, sağlık konularında bilgilendirme yapmayı hedefleyen bir uygulamadır. Verdiği bilgiler genel bilgilendirme amaçlıdır; tıbbi tavsiye ya da teşhis yerine geçmez. Sağlık sorunlarında bir doktora danışmalısın.'],
[['suyun kaynama noktasi','su kac derecede kaynar'],'Su, deniz seviyesinde 100 °C’de kaynar; yükseklik arttıkça kaynama noktası düşer.'],
[['suyun donma noktasi','su kac derecede donar'],'Su, deniz seviyesinde 0 °C’de donar.'],
[['bir yilda kac gun','yil kac gun'],'Bir yıl 365 gündür; artık yıllarda (4 yılda bir) 366 gündür.'],
[['bir saatte kac dakika','saat kac dakika'],'Bir saat 60 dakikadır.'],
[['bir dakikada kac saniye','dakika kac saniye'],'Bir dakika 60 saniyedir.'],
[['bir gunde kac saat','gun kac saat'],'Bir gün 24 saattir.'],
[['haftada kac gun','hafta kac gun'],'Bir hafta 7 gündür.'],
[['bir yilda kac ay','yil kac ay'],'Bir yıl 12 aydır.'],
[['bir metre kac santim','metre kac santimetre'],'1 metre 100 santimetredir.'],
[['bir kilometre kac metre','kilometre kac metre'],'1 kilometre 1000 metredir.'],
[['bir kilo kac gram','kilo kac gram'],'1 kilogram 1000 gramdır.'],
[['bir litre kac mililitre','litre kac mililitre'],'1 litre 1000 mililitredir.'],
[['pi sayisi nedir','pi sayisi kac','pi kac'],'Pi (π) yaklaşık 3,14159’dur; bir çemberin çevresinin çapına oranıdır.'],
[['isik hizi','isigin hizi'],'Işığın boşluktaki hızı yaklaşık 299.792 km/sn’dir (yaklaşık 300.000 km/sn).'],
[['guneş sisteminde kac gezegen','kac gezegen var','guneş sisteminde kac gezegen var'],'Güneş Sistemi’nde 8 gezegen vardır: Merkür, Venüs, Dünya, Mars, Jüpiter, Satürn, Uranüs ve Neptün.'],
[['en buyuk gezegen'],'Güneş Sistemi’nin en büyük gezegeni Jüpiter’dir.'],
[['dunyaya en yakin yildiz','dunyaya en yakin yildiz hangisi'],'Dünya’ya en yakın yıldız Güneş’tir.'],
[['istanbul kacinci yilda fethedildi','istanbulun fethi'],'İstanbul, 29 Mayıs 1453’te Fatih Sultan Mehmet tarafından fethedildi.'],
[['cumhuriyet ne zaman ilan edildi','cumhuriyet bayrami'],'Türkiye Cumhuriyeti 29 Ekim 1923’te ilan edildi.'],
[['turkiyede kac il var','kac ili var turkiyenin'],'Türkiye’de 81 il vardır.'],
[['turkiyenin en yuksek dagi'],'Türkiye’nin en yüksek dağı yaklaşık 5.137 m ile Ağrı Dağı’dır.'],
[['turkiyenin en uzun nehri'],'Türkiye sınırları içinde en uzun nehir Kızılırmak’tır.'],
[['istanbul plaka','istanbul plakasi'],'İstanbul’un plaka kodu 34’tür.'],
[['ankara plaka','ankara plakasi'],'Ankara’nın plaka kodu 06’dır.'],
[['izmir plaka','izmir plakasi'],'İzmir’in plaka kodu 35’tir.'],
[['turkiye telefon kodu','turkiye ulke kodu'],'Türkiye’nin uluslararası arama kodu +90’dır.'],
[['acil durum numarasi','acil numara','ambulans numarasi'],'Türkiye’de acil çağrı numarası 112’dir. Polis imdat 155, jandarma 156, itfaiye 110’dur.'],
[['polis numarasi'],'Polis imdat numarası 155’tir; her türlü acil durumda 112 de aranabilir.'],
[['itfaiye numarasi'],'İtfaiye numarası 110’dur.'],
[['asal sayi nedir','asal sayi ne demek'],'Asal sayı, yalnızca 1’e ve kendisine bölünebilen 1’den büyük doğal sayıdır (2, 3, 5, 7, 11 …).'],
[['ucgenin ic acilari toplami','ucgenin acilari toplami'],'Bir üçgenin iç açıları toplamı 180 derecedir.'],
[['dikdortgenin alani','dikdortgen alan formulu'],'Dikdörtgenin alanı = kısa kenar × uzun kenardır.'],
[['dairenin alani','daire alan formulu'],'Dairenin alanı = π × r² (r: yarıçap).'],
[['sag ol','tesekkurler','tesekkur ederim'],'Rica ederim! Başka bir şey sormak istersen buradayım.'],
[['nasilsin','naber','ne haber'],'İyiyim, teşekkürler! Sen nasılsın, bugün neyi keşfedelim?']
];
const KBN=KB.map(([k,a])=>[k.map(x=>' '+tr(x)+' '),a]);
function kb(q){const n=' '+tr(q).replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()+' ';const h=KBN.find(([k])=>k.some(x=>n.includes(x)));return h&&{title:'Hazır bilgi',answer:h[1]}}

window.AuraEngine={answer:q=>calc(q)||misc(q)||units(q)||when(q)||kb(q)||null,size:KB.length};
if(typeof module!=='undefined')module.exports=window.AuraEngine;
})();
