import {databaseClient} from './database-client.mjs';
// Every fixture is rolled back. Savepoints let expected permission failures be tested
// without aborting the outer transaction or weakening any policy.
export async function remoteTestDatabase(){
 const db=databaseClient();await db.connect();await db.query('begin');
 const query=async(sql,params)=>{
  await db.query('savepoint test_statement');
  try{const r=await db.query(sql,params);await db.query('set constraints all immediate; set constraints all deferred; release savepoint test_statement');return r;}
  catch(e){await db.query('rollback to savepoint test_statement');await db.query('release savepoint test_statement');throw e;}
 };
 return {query,exec:sql=>query(sql),close:async()=>{try{await db.query('rollback');}finally{await db.end();}}};
}
