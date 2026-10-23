import {get, put, head} from '@vercel/blob';
import {randomUUID} from 'node:crypto';
const PATH='catalog/games.json';
function ip(req){return String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'').split(',')[0].trim().replace(/^::ffff:/,'')}
function admin(req){const allowed=process.env.ADMIN_ALLOWED_PUBLIC_IP;if(allowed&&ip(req)!==allowed)return false;const secret=process.env.ADMIN_PASSWORD;const given=String(req.headers['x-admin-key']||'');if(!secret||!given||given.length!==secret.length)return false;let diff=0;for(let i=0;i<secret.length;i++)diff|=secret.charCodeAt(i)^given.charCodeAt(i);return diff===0}

async function load(){const result=await get(PATH,{access:'private'});if(!result||result.statusCode===404)return {items:[],etag:null};if(result.statusCode!==200)throw Error('Blob read HTTP '+result.statusCode);const body=await new Response(result.stream).text();return {items:JSON.parse(body),etag:result.blob?.etag||null}}
function safeUrl(s){try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password}catch{return false}}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method==='GET'&&req.query?.check==='admin')return res.status(admin(req)?200:403).json({ok:admin(req)});
 if(req.method==='GET'){try{return res.status(200).json((await load()).items)}catch(e){console.error('Blob read',e?.message);return res.status(503).json({error:'Catalogo indisponivel'})}}
 if(!['POST','DELETE'].includes(req.method))return res.status(405).json({error:'Metodo invalido'});
 if(!admin(req))return res.status(403).json({error:'Acesso negado'});
 if(!process.env.BLOB_READ_WRITE_TOKEN)return res.status(503).json({error:'Vercel Blob nao configurado'});
 try{
 let items=(await load()).items;
 if(req.method==='POST'){
 const b=typeof req.body==='string'?JSON.parse(req.body):req.body||{},clean=v=>String(v||'').trim();
 const title=clean(b.title).slice(0,90),description=clean(b.description).slice(0,500),image=clean(b.image),download=clean(b.download),genre=clean(b.genre).slice(0,35),size=clean(b.size).slice(0,30);
 if(!title||!safeUrl(image)||!safeUrl(download))return res.status(400).json({error:'Nome, capa e link HTTP(S) sao obrigatorios'});
 const id=clean(b.id)||randomUUID(),item={id,title,description,image,download,genre,size,createdAt:new Date().toISOString()};
 if(b.id&&items.some(x=>x.id===b.id))items=items.map(x=>x.id===b.id?item:x);else items=[item,...items];
 }else{const id=String(req.query?.id||'');items=items.filter(x=>x.id!==id)}
 await put(PATH,JSON.stringify(items,null,2),{access:'private',allowOverwrite:true,addRandomSuffix:false,contentType:'application/json',cacheControlMaxAge:60});
 return res.status(200).json({ok:true,items});
 }catch(e){console.error('Blob write',e?.message||e);return res.status(503).json({error:'Nao foi possivel salvar no Vercel Blob: '+String(e?.message||'Erro').slice(0,140)})}
}