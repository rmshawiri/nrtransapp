import {writeFile} from 'node:fs/promises';
import {credentials} from './credentials.mjs';
const c=credentials();
const env={SUPABASE_URL:new URL(c['API URL']).origin,SUPABASE_PUBLISHABLE_KEY:c['Publishable key'],SUPABASE_SECRET_KEY:c['Secret keys'],PUBLIC_SITE_URL:'https://nr-trans.morashawiri.com'};
await writeFile(new URL('../.env.local',import.meta.url),Object.entries(env).map(([k,v])=>k+'='+JSON.stringify(v)).join('\n')+'\n',{mode:0o600});
console.log('Local server configuration saved to ignored .env.local; no values displayed.');
