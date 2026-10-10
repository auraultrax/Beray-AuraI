// Cloudflare Pages Function: functions/api/chat.js
// Configure ZAI_API_KEY as a Cloudflare Pages secret. Never expose it in index.html.
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
export async function onRequestPost({request,env}){
 const origin=request.headers.get("Origin");
 if(origin){try{if(new URL(origin).host!==new URL(request.url).host)return json({error:"Bu isteğe izin verilmiyor."},403)}catch{return json({error:"İstek kaynağı geçersiz."},403)}}
 if(!env.ZAI_API_KEY)return json({error:"AURAI araştırma motoru henüz etkinleştirilmemiş."},503);
 let p;try{p=await request.json()}catch{return json({error:"İstek içeriği okunamadı."},400)}
 const question=typeof p?.question==="string"?p.question.trim().slice(0,3000):"";
 if(!question)return json({error:"Bir soru yazmalısın."},400);
 const history=Array.isArray(p.messages)?p.messages.slice(-8).map(m=>({role:m?.role==="assistant"?"assistant":"user",content:typeof m?.content==="string"?m.content.slice(0,2000):""})).filter(m=>m.content):[];
 if(history.at(-1)?.role!=="user"||history.at(-1)?.content!==question)history.push({role:"user",content:question});
 try{
  const r=await fetch("https://api.z.ai/api/paas/v4/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+env.ZAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:"glm-4.6",messages:[{role:"system",content:"Sen AURAI'sin, Beray AI'nin Türkçe öncelikli asistanısın. Doğal, doğru ve anlaşılır Türkçe yanıt ver. Güncel bilgi gerektiğinde veya kullanıcı araştırma istediğinde webSearchPrime aracını kullan. Sonuçları ham biçimde kopyalama; kaynakları değerlendirip tek bir bütünlüklü cevap oluştur. Emin olmadığın şeyi kesinmiş gibi söyleme. Kaynak bağlantısı uydurma."},...history],tools:[{type:"mcp",mcp:{server_label:"web search",transport_type:"streamable-http",allowed_tools:["webSearchPrime"]}}],tool_choice:"auto",temperature:.35,max_tokens:1400,stream:false}),signal:AbortSignal.timeout(50000)});
  const d=await r.json().catch(()=>({}));if(!r.ok)return json({error:"Araştırma sağlayıcısı yanıt veremedi. API anahtarını ve hesap durumunu kontrol et."},502);
  const m=d?.choices?.[0]?.message;const answer=typeof m?.content==="string"?m.content.trim():Array.isArray(m?.content)?m.content.map(x=>x?.text||"").join("\n").trim():"";
  if(!answer)return json({error:"AURAI yanıt alamadı. Lütfen tekrar dene."},502);
  const sources=(Array.isArray(d.web_search)?d.web_search:[]).slice(0,8).map(s=>({title:String(s?.title||s?.media||"Web kaynağı").slice(0,180),link:typeof s?.link==="string"&&/^https?:\/\//i.test(s.link)?s.link:""})).filter(s=>s.link);
  return json({answer,sources});
 }catch(e){return json({error:e?.name==="TimeoutError"?"Araştırma zaman aşımına uğradı. Tekrar dene.":"Araştırma servisine bağlanılamadı. Lütfen tekrar dene."},e?.name==="TimeoutError"?504:502)}
}