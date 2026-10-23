const api='https://store.steampowered.com/api/';
function allowed(req){const s=process.env.ADMIN_PASSWORD;const k=String(req.headers['x-admin-key']||'');if(!s||!k||s.length!==k.length)return false;let n=0;for(let i=0;i<s.length;i++)n|=s.charCodeAt(i)^k.charCodeAt(i);if(n)return false;const ip=process.env.ADMIN_ALLOWED_PUBLIC_IP;if(ip){let remote=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'').split(',')[0].trim();if(remote!==ip)return false}return true}
const text=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
async function json(url){const r=await fetch(url,{headers:{'Accept':'application/json','User-Agent':'ZRGamesCatalog/1.0'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw Error('Steam API '+r.status);return r.json()}
export default async function handler(req,res){
res.setHeader('Cache-Control','no-store');
if(req.method!=='GET')return res.status(405).json({error:'Metodo invalido'});
if(!allowed(req))return res.status(403).json({error:'Acesso negado'});
try{
 const id=String(req.query?.id||'').trim();
 if(id){if(!/^\d{1,12}$/.test(id))return res.status(400).json({error:'ID invalido'});const r=await json(api+'appdetails?appids='+encodeURIComponent(id)+'&l=brazilian');const x=r[id];if(!x?.success||!x.data)return res.status(404).json({error:'Jogo nao encontrado'});const d=x.data;return res.status(200).json({id,title:d.name||'',description:text(d.short_description||d.detailed_description).slice(0,500),image:d.header_image||'',genre:d.genres?.[0]?.description||'Outros',size:'',source:'Steam',storeUrl:'https://store.steampowered.com/app/'+id+'/'})}
 const q=String(req.query?.q||'').trim().slice(0,80);if(q.length<2)return res.status(200).json({items:[]});
 const data=await json(api+'storesearch/?term='+encodeURIComponent(q)+'&l=brazilian&cc=BR');return res.status(200).json({items:(data.items||[]).slice(0,15).map(x=>({id:x.id,title:x.name,image:x.tiny_image||''}))});
}catch(e){return res.status(502).json({error:'Busca indisponivel no momento. Tente novamente.'})}
}