import pg from 'pg';
import {mkdir,writeFile} from 'node:fs/promises';
import {credentials} from './credentials.mjs';
import {resolve6} from 'node:dns/promises';
const c=credentials();
const raw=c['Direct connection'];
const connectionString=raw.replace('[YOUR-PASSWORD]',encodeURIComponent(c['Mot de passe']));
const parsed=new URL(connectionString);
const addresses=await resolve6(parsed.hostname).catch(()=>[]);
const client=new pg.Client({host:process.env.NR_DB_HOST||addresses[0]||parsed.hostname,port:Number(parsed.port||5432),user:decodeURIComponent(parsed.username),password:decodeURIComponent(parsed.password),database:parsed.pathname.slice(1),ssl:{servername:parsed.hostname,rejectUnauthorized:true},connectionTimeoutMillis:15000,query_timeout:15000});
try {
 await client.connect();
 await client.query('BEGIN READ ONLY');
 const queries={
 identity:'select current_database(), version()',
 tables:"select schemaname,tablename,rowsecurity from pg_tables where schemaname not in ('pg_catalog','information_schema') order by 1,2",
 columns:"select table_schema,table_name,column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema in ('public','private','nr_trans') order by 1,2,ordinal_position",
 policies:'select * from pg_policies',
 functions:"select n.nspname,p.proname,p.prosecdef,pg_get_functiondef(p.oid) definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private','nr_trans') and p.prokind='f'",
 triggers:"select trigger_schema,event_object_table,trigger_name,action_statement from information_schema.triggers where trigger_schema in ('public','auth','storage')",
 buckets:'select id,public from storage.buckets',
 users:'select count(*)::int count from auth.users'
 };
 const audit={project:'nr-trans',ref:c['Project ID'],at:new Date().toISOString()};
 for(const [key,sql] of Object.entries(queries))audit[key]=(await client.query(sql)).rows;
 await client.query('ROLLBACK');
 await mkdir(new URL('../.private/',import.meta.url),{recursive:true});
 await writeFile(new URL('../.private/database-audit.json',import.meta.url),JSON.stringify(audit,null,2));
 console.log(JSON.stringify({project:audit.project,ref:audit.ref,tables:audit.tables,functions:audit.functions.map(x=>({schema:x.nspname,name:x.proname,securityDefiner:x.prosecdef})),policies:audit.policies.length,triggers:audit.triggers,buckets:audit.buckets,users:audit.users}));
} catch(e){console.log(JSON.stringify({error:e.code||e.name,reason:'Database audit failed; no mutation performed'}));process.exitCode=1;}finally{await client.end().catch(()=>{});}
