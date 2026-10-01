import pg from 'pg';
import {readFileSync} from 'node:fs';
import {credentials} from './credentials.mjs';

export function databaseClient() {
 const c=credentials();
 const raw=c['Session pooler'];
 if(!raw) throw new Error('Session pooler missing');
 const u=new URL(raw.replace('[YOUR-PASSWORD]',encodeURIComponent(c['Mot de passe'])));
 if(!u.hostname.endsWith('.pooler.supabase.com') || decodeURIComponent(u.username)!=='postgres.dffmdfueoihfcrkjabaz' || u.port!=='5432') throw new Error('Unexpected database target');
 return new pg.Client({host:u.hostname,port:5432,user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),database:u.pathname.slice(1),ssl:{servername:u.hostname,rejectUnauthorized:true,ca:readFileSync(new URL('./certs/supabase-ca.crt',import.meta.url),'utf8')},connectionTimeoutMillis:15000,query_timeout:60000});
}
