import {databaseClient} from './database-client.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {credentials} from './credentials.mjs';
const c=credentials();
const client=databaseClient();
try {
 await client.connect();
 await client.query('BEGIN READ ONLY');
 const queries={
 schemas:"select nspname from pg_namespace where nspname not like 'pg_%' and nspname<>'information_schema' order by 1",
 extensions:'select extname,extversion from pg_extension order by 1',
 views:"select schemaname,viewname,definition from pg_views where schemaname not in ('pg_catalog','information_schema')",
 indexes:"select schemaname,tablename,indexname,indexdef from pg_indexes where schemaname not in ('pg_catalog','information_schema')",
 grants:"select * from information_schema.role_table_grants where table_schema not in ('pg_catalog','information_schema')",
 defaults:'select defaclrole::regrole::text,defaclnamespace::regnamespace::text,defaclobjtype,defaclacl::text from pg_default_acl',
 eventTriggers:'select evtname,evtevent,evtfoid::regprocedure::text,evtenabled from pg_event_trigger',
 publications:'select * from pg_publication_tables',
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
 audit.counts={};
 for(const table of audit.tables.filter(t=>!['auth','storage','realtime','vault'].includes(t.schemaname))) {
  const quote=x=>'"'+x.replaceAll('"','""')+'"';
  const name=quote(table.schemaname)+'.'+quote(table.tablename);
  audit.counts[name]=(await client.query('select count(*)::int n from '+name)).rows[0].n;
 }
 audit.storageObjects=(await client.query('select count(*)::int count from storage.objects')).rows;
 audit.vaultSecretCount=(await client.query('select count(*)::int count from vault.secrets')).rows;
 await client.query('ROLLBACK');
 await mkdir(new URL('../.private/',import.meta.url),{recursive:true});
 await writeFile(new URL('../.private/database-audit.json',import.meta.url),JSON.stringify(audit,null,2));
 await writeFile(new URL('../.private/database-checkpoint-'+Date.now()+'.json',import.meta.url),JSON.stringify(audit,null,2),{flag:'wx'});
 console.log(JSON.stringify({project:audit.project,ref:audit.ref,applicationTableCounts:audit.counts,schemas:audit.schemas,functions:audit.functions.map(x=>({schema:x.nspname,name:x.proname,securityDefiner:x.prosecdef})),policies:audit.policies.length,buckets:audit.buckets.length,users:audit.users,storageObjects:audit.storageObjects,vaultSecretCount:audit.vaultSecretCount,checkpointSaved:true}));
} catch(e){console.log(JSON.stringify({error:e.code||e.name,reason:'Database audit failed; no mutation performed'}));process.exitCode=1;}finally{await client.end().catch(()=>{});}
