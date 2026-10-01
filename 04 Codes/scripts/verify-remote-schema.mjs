import assert from 'node:assert/strict';
import {databaseClient} from './database-client.mjs';
import {credentials} from './credentials.mjs';
const db=databaseClient();
try{
 await db.connect();await db.query('begin read only');
 const tables=(await db.query("select tablename,rowsecurity from pg_tables where schemaname='public' and tablename like 'nr_%'")).rows;
 assert.equal(tables.length,19);assert.ok(tables.every(t=>t.rowsecurity));
 const funcs=(await db.query("select p.proname,p.prosecdef,has_function_privilege('anon',p.oid,'EXECUTE') anon,has_function_privilege('authenticated',p.oid,'EXECUTE') authenticated from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'nr_%'")).rows;
 assert.equal(funcs.length,6);assert.ok(funcs.every(f=>!f.prosecdef&&!f.anon&&!f.authenticated));
 const history=(await db.query('select name,sha256 from nr_private.deployment_migrations order by name')).rows;
 const orphan=(await db.query("select count(*)::int n from auth.users where email is null")).rows[0].n;
 assert.equal(orphan,0,'SQL fixtures must have been rolled back');
 await db.query('rollback');
 const c=credentials(),base=new URL(c['API URL']).origin,headers={apikey:c['Publishable key']||c['Publishable keys']};
 assert.ok(headers.apikey,'Publishable key is required');
 const prices=await fetch(base+'/rest/v1/nr_prices?select=plan_id,months,amount',{headers});assert.equal(prices.status,200);assert.equal((await prices.json()).length,8);
 const denied=await fetch(base+'/rest/v1/nr_records?select=id',{headers});assert.ok([401,403].includes(denied.status));
 console.log(JSON.stringify({tablesWithRLS:tables.length,serverOnlyRPCs:funcs.length,migrations:history.map(x=>x.name),anonymousPrices:'passed',anonymousFinance:'denied',fixturesRolledBack:true}));
}catch(e){console.log(JSON.stringify({error:e.code||e.name,message:e instanceof assert.AssertionError?e.message:'Schema verification failed'}));process.exitCode=1;}finally{await db.end().catch(()=>{});}
