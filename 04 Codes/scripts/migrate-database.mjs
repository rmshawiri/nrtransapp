import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {databaseClient} from './database-client.mjs';
const audit=JSON.parse(await readFile(new URL('../.private/database-audit.json',import.meta.url)));
if(audit.ref!=='dffmdfueoihfcrkjabaz'||Date.now()-Date.parse(audit.at)>3600000)throw new Error('Fresh verified inventory required');
const db=databaseClient();
try{
 await db.connect();
 await db.query('select pg_advisory_lock(70241001)');
 const files=(await readdir(new URL('../supabase/migrations/',import.meta.url))).filter(x=>x.endsWith('.sql')).sort();
 const applied=[];
 for(const name of files){
  const sql=await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8');
  const hash=createHash('sha256').update(sql).digest('hex');
  const exists=(await db.query("select to_regclass('nr_private.deployment_migrations') present")).rows[0].present;
  if(exists){const old=(await db.query('select sha256 from nr_private.deployment_migrations where name=$1',[name])).rows[0];if(old){if(old.sha256!==hash)throw new Error('Migration checksum mismatch');continue;}}
  await db.query('begin');
  try{
   await db.query(sql.replace(/^begin;\s*$/mi,'').replace(/^commit;\s*$/mi,''));
   await db.query('create table if not exists nr_private.deployment_migrations(name text primary key,sha256 text not null,applied_at timestamptz not null default now())');
   await db.query('revoke all on nr_private.deployment_migrations from public,anon,authenticated');
   await db.query('insert into nr_private.deployment_migrations(name,sha256) values($1,$2)',[name,hash]);
   await db.query('commit');applied.push(name);console.log(JSON.stringify({migration:name,status:'applied'}));
  }catch(e){await db.query('rollback');throw e;}
 }
 await db.query("notify pgrst, 'reload schema'");
 await writeFile(new URL('../.private/migration-result.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),applied}));
}catch(e){console.log(JSON.stringify({error:e.code||e.name,reason:e.code?'Migration failed; current transaction rolled back':e.message}));process.exitCode=1;}
finally{await db.end().catch(()=>{});}
