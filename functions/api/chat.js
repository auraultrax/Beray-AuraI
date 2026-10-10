// Cloudflare Pages Function: functions/api/chat.js
// Sıra: ortak bilgi havuzu (KV) → Vikipedi → model (+web araması). Sınırlar ve bütçe KV ile tutulur.
// Gizli anahtarları (ZAI_API_KEY / OPENAI_API_KEY) yalnızca Cloudflare gizli değişkeni olarak tanımla.
const json=(b,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const norm=s=>s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,"0")).join("").slice(0,40);
const day=()=>new Date().toISOString().slice(0,10);
const PERSONAL=/\b(ben|benim|bana|beni|kendim|kendimi|annem|babam|kardesim|sevgilim|esim|arkadasim|patronum|hissediyorum|uzgunum|yalnizim)\b/;
const BASE="Sen AURAI'sin, Beray AI'nin Türkçe öncelikli asistanısın. Doğal, doğru ve anlaşılır Türkçe yanıt ver. Güncel bilgi gerektiğinde veya kullanıcı araştırma istediğinde web arama aracını kullan. Sonuçları ham biçimde kopyalama; kaynakları değerlendirip tek bir bütünlüklü cevap oluştur. Emin olmadığın şeyi kesinmiş gibi söyleme. Kaynak bağlantısı uydurma.";
const LISTEN="Sen AURAI'sin ve dinleme modundasın. Önce dinle: kullanıcının anlattığını kendi sözcüklerinle yansıt, acele öğüt verme, yargılama. Sıcak, sakin ve sade Türkçe kullan; kısa yanıtlar ver ve genelde tek bir açık uçlu soru sor. Terapist değilsin; teşhis koyma, tedavi önerme ve bunu gerektiğinde nazikçe belirt. Kullanıcıyı sana bağımlı kılma; uygun olduğunda güvendiği insanlarla da konuşmasını destekle. Her şeye hak verme; gerektiğinde nazik ve dürüst ol. Web araması yapma.";
const CRISIS=" Kullanıcı kendine zarar verme ya da yaşamdan vazgeçme sinyali verdi. Sakin ve sıcak yanıt ver; yalnız olmadığını söyle. Yöntem veya ayrıntı verme. Hemen 112'yi aramasını ve yanındaki birine haber vermesini nazikçe öner. Konuyu geçiştirme; konuşmaya devam etmeye davet et.";
const LIMITED={answer:"Bugünkü yapay zekâ araştırma hakkın doldu. Hesap, dönüşüm ve temel bilgiler gibi hazır cevaplar çalışmaya devam ediyor; araştırma için yarın tekrar dene.",limited:true,sources:[]};

async function wiki(question){
 const n=norm(question);if(!/\b(nedir|kimdir|ne demek|nerede|nerededir)\b/.test(n))return null;
 const topic=n.replace(/\b(nedir|kimdir|ne demek|nerede|nerededir|nasil|bir|hakkinda|bilgi|ver|soyler|misin|anlatir|aciklar)\b/g," ").replace(/\s+/g," ").trim();
 if(!topic||topic.length>80)return null;
 const o={headers:{"User-Agent":"AURAI/1.0 (Beray AI)",Accept:"application/json"},signal:AbortSignal.timeout(4000)};
 try{
  const s=await fetch("https://tr.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=1&srsearch="+encodeURIComponent(topic),o).then(r=>r.json());
  const t=s?.query?.search?.[0]?.title;if(!t)return null;
  const d=await fetch("https://tr.wikipedia.org/api/rest_v1/page/summary/"+encodeURIComponent(t.replace(/ /g,"_")),o).then(r=>r.json());
  if(d?.type!=="standard"||!d.extract||d.extract.length<40)return null;
  const tw=norm(d.title).split(" ");
  if(!topic.split(" ").some(w=>w.length>2&&tw.some(x=>x.startsWith(w.slice(0,5)))))return null;
  const link=d.content_urls?.desktop?.page;
  return{answer:d.extract,label:"AURAI · VİKİPEDİ",sources:link?[{title:"Vikipedi: "+d.title,link}]:[]};
 }catch{return null}
}
async function askZai(env,sys,history,search){
 const r=await fetch("https://api.z.ai/api/paas/v4/chat/completions",{method:"POST",headers:{Authorization:"Bearer "+env.ZAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:"glm-4.6",messages:[{role:"system",content:sys},...history],...(search?{tools:[{type:"mcp",mcp:{server_label:"web search",transport_type:"streamable-http",allowed_tools:["webSearchPrime"]}}],tool_choice:"auto"}:{}),temperature:.35,max_tokens:1400,stream:false}),signal:AbortSignal.timeout(50000)});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error("provider");
 const m=d?.choices?.[0]?.message;
 const answer=typeof m?.content==="string"?m.content.trim():Array.isArray(m?.content)?m.content.map(x=>x?.text||"").join("\n").trim():"";
 return{answer,sources:(Array.isArray(d.web_search)?d.web_search:[]).map(s=>({title:s?.title||s?.media,link:s?.link}))};
}
// OpenAI (Responses API). Canlı hesapla doğrulanmadı; OPENAI_MODEL zorunlu.
async function askOpenAI(env,sys,history,search){
 const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:"Bearer "+env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:env.OPENAI_MODEL,instructions:sys,input:history,...(search?{tools:[{type:"web_search"}]}:{}),max_output_tokens:1400}),signal:AbortSignal.timeout(50000)});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error("provider");
 let answer="";const sources=[];
 for(const o of d.output||[])if(o.type==="message")for(const c of o.content||[])if(c.type==="output_text"){answer+=c.text;for(const a of c.annotations||[])if(a.type==="url_citation")sources.push({title:a.title,link:a.url})}
 return{answer:answer.trim(),sources};
}
export async function onRequestPost({request,env}){
 const origin=request.headers.get("Origin");
 if(origin){try{if(new URL(origin).host!==new URL(request.url).host)return json({error:"Bu isteğe izin verilmiyor."},403)}catch{return json({error:"İstek kaynağı geçersiz."},403)}}
 let p;try{p=await request.json()}catch{return json({error:"İstek içeriği okunamadı."},400)}
 const question=typeof p?.question==="string"?p.question.trim().slice(0,3000):"";
 if(!question)return json({error:"Bir soru yazmalısın."},400);
 const listen=p.listen===true,crisis=p.crisis===true,kv=env.AURAI_KV;
 const history=Array.isArray(p.messages)?p.messages.slice(-8).map(m=>({role:m?.role==="assistant"?"assistant":"user",content:typeof m?.content==="string"?m.content.slice(0,2000):""})).filter(m=>m.content):[];
 if(history.at(-1)?.role!=="user"||history.at(-1)?.content!==question)history.push({role:"user",content:question});
 // Kişisel, dinleme veya kriz sohbetleri asla ortak havuza girmez.
 const cacheable=!listen&&!crisis&&history.length<=1&&question.length<=300&&!PERSONAL.test(norm(question));
 const key=cacheable?"c:"+await sha(norm(question)):"";
 if(cacheable&&kv){try{const c=await kv.get(key,"json");if(c?.answer)return json({...c,label:"AURAI · BİLGİ HAVUZU"})}catch{}}
 if(cacheable){const w=await wiki(question);if(w){if(kv)try{await kv.put(key,JSON.stringify(w),{expirationTtl:2592000})}catch{};return json(w)}}
 const useOpenAI=!!(env.OPENAI_API_KEY&&env.OPENAI_MODEL);
 if(!useOpenAI&&!env.ZAI_API_KEY)return json({error:"AURAI araştırma motoru henüz etkinleştirilmemiş."},503);
 if(kv&&!crisis){ // güvenlik mesajları sınırdan muaf
  try{
   const ip=request.headers.get("CF-Connecting-IP")||"x",d=day();
   const bump=async(k)=>{const n=(parseInt(await kv.get(k))||0)+1;await kv.put(k,String(n),{expirationTtl:90000});return n};
   if(await bump("b:"+d)>(+env.DAILY_BUDGET||5000))return json(LIMITED);
   if(await bump("r:"+d+":"+ip)>(listen?(+env.LISTEN_LIMIT||40):(+env.DAILY_LIMIT||20)))return json(LIMITED);
  }catch{}
 }
 try{
  const sys=(listen?LISTEN:BASE)+(crisis?CRISIS:"");
  const res=await (useOpenAI?askOpenAI:askZai)(env,sys,history,!listen&&!crisis);
  if(!res.answer)return json({error:"AURAI yanıt alamadı. Lütfen tekrar dene."},502);
  const seen=new Set(),sources=res.sources.filter(s=>typeof s.link==="string"&&/^https?:\/\//i.test(s.link)&&!seen.has(s.link)&&seen.add(s.link)).slice(0,8).map(s=>({title:String(s.title||"Web kaynağı").slice(0,180),link:s.link}));
  const out={answer:res.answer,sources};
  if(cacheable&&kv)try{await kv.put(key,JSON.stringify(out),{expirationTtl:604800})}catch{}
  return json(out);
 }catch(e){return json({error:e?.name==="TimeoutError"?"Araştırma zaman aşımına uğradı. Tekrar dene.":"Araştırma servisine bağlanılamadı. Lütfen tekrar dene."},e?.name==="TimeoutError"?504:502)}
}
