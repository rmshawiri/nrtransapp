import { credentials } from './credentials.mjs';
const c = credentials();
const check = async (name, url, headers, summarize) => {
  try {
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
    const body = await r.json();
    console.log(JSON.stringify({ service: name, status: r.status, ...(r.ok ? summarize(body) : {error: body.code || body.error?.code || 'access_failed'}) }));
  } catch(e) { console.log(JSON.stringify({service:name,error:e.code || e.cause?.code || e.name})); }
};
await check('github', 'https://api.github.com/repos/rmshawiri/nrtransapp', {Authorization:`Bearer ${c.Jeton}`, 'User-Agent':'NR-TRANS-audit'}, b=>({repository:b.full_name,private:b.private,branch:b.default_branch,size:b.size}));
await check('github-user', 'https://api.github.com/user', {Authorization:`Bearer ${c.Jeton}`, 'User-Agent':'NR-TRANS-audit'}, b=>({login:b.login,id:b.id}));
await check('vercel', 'https://api.vercel.com/v9/projects', {Authorization:`Bearer ${c['Token NR-TRANS']}`}, b=>({projects:b.projects?.map(p=>({name:p.name,id:p.id,accountId:p.accountId,framework:p.framework}))}));
const base = new URL(c['API URL']).origin;
await check('supabase-rest', `${base}/rest/v1/`, {apikey:c['Secret keys']}, b=>({paths:Object.keys(b.paths || {})}));
await check('supabase-storage', `${base}/storage/v1/bucket`, {apikey:c['Secret keys'],Authorization:`Bearer ${c['Secret keys']}`}, b=>({buckets:b.map(x=>({id:x.id,public:x.public}))}));
