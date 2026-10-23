const REPO='zriderdev-coder/zr-games-downloads';
const FILE='data/games.json';
const github='https://api.github.com/repos/'+REPO+'/contents/'+FILE;
const headers=()=>({'Authorization':'Bearer '+process.env.GITHUB_TOKEN,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'});
function ip(req){return String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'').split(',')[0].trim().replace(/^::ffff:/,'')}
function admin(req){const allowed=process.env.ADMIN_ALLOWED_PUBLIC_IP;if(allowed&&ip(req)!==allowed)return false;const secret=process.env.ADMIN_PASSWORD;const given=String(req.headers['x-admin-key']||'');if(!secret||!given||given.length!==secret.length)return false;let diff=0;for(let i=0;i<secret.length;i++)diff|=secret.charCodeAt(i)^given.charCodeAt(i);return diff===0}
async function load(){const r=await fetch(github+'?t='+Date.now(),{headers:headers(),cache:'no-store'});if(!r.ok)throw Error('GitHub read '+r.status);const f=await r.json();return {sha:f.sha,items:JSON.parse(Buffer.from(f.content.replace(/\n/g,''),'base64').toString('utf8'))}}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method==='GET'&&req.query?.check==='admin')return res.status(admin(req)?200:403).json({ok:admin(req)});
 if(req.method==='GET'){try{const d=await load();return res.status(200).json(d.items)}catch(e){return res.status(503).json({error:'Catalogo temporariamente indisponivel'})}}
 if(!['POST','DELETE'].includes(req.method))return res.status(405).json({error:'Metodo invalido'});
 if(!admin(req))return res.status(403).json({error:'Acesso negado'});
 if(!process.env.GITHUB_TOKEN)return res.status(503).json({error:'Armazenamento nao configurado'});
 try{
  const old=await load();let items=old.items;
  if(req.method==='POST'){
   const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
   const clean=s=>String(s||'').trim();
   const title=clean(body.title).slice(0,90),description=clean(body.description).slice(0,500),image=clean(body.image),download=clean(body.download),genre=clean(body.genre).slice(0,35),size=clean(body.size).slice(0,30);
   function safeUrl(s){try{let u=new URL(s);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password}catch{return false}}
   if(!title||!safeUrl(download)||!safeUrl(image))return res.status(400).json({error:'Preencha nome e URLs HTTP(S) validas'});
   const item={id:clean(body.id)||crypto.randomUUID(),title,description,image,download,genre,size,createdAt:new Date().toISOString()};
   if(body.id&&items.some(g=>g.id===body.id))items=items.map(g=>g.id===body.id?item:g);else items=[item,...items];
  }else{const id=String(req.query?.id||'');items=items.filter(g=>g.id!==id)}
  const write=await fetch(github,{method:'PUT',headers:headers(),body:JSON.stringify({message:'Update games catalog',content:Buffer.from(JSON.stringify(items,null,2)+'\n').toString('base64'),sha:old.sha})});
  if(!write.ok)throw Error('GitHub write '+write.status);
  return res.status(200).json({ok:true,items});
 }catch(e){return res.status(503).json({error:'Nao foi possivel salvar. Tente novamente.'})}
}