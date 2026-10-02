import {credentials} from './credentials.mjs';
import {databaseClient} from './database-client.mjs';
import {createClient} from '@supabase/supabase-js';
import {appendFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
const c=credentials(),email=c.ADMIN_EMAIL||c.Email;
const supa=createClient(new URL(c['API URL']).origin,c['Secret keys'],{auth:{persistSession:false,autoRefreshToken:false}});
const db=databaseClient();
try{
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email||''))throw Error('Missing administrator identity');
 await db.connect();
 let id=(await db.query('select id from auth.users where lower(email)=lower($1)',[email])).rows[0]?.id;
 if(!id){const password=randomBytes(30).toString('base64url')+'Aa!';const r=await supa.auth.admin.createUser({email,password,email_confirm:true});if(r.error)throw Error('Administrator creation failed');id=r.data.user.id;appendFileSync(new URL('../../02 Documentation/Informations des comptes.txt',import.meta.url),'\n\nADMIN_EMAIL: '+email+'\nADMIN_PASSWORD: '+password+'\n');}
 await db.query('begin');await db.query('insert into nr_admins(user_id) values($1) on conflict do nothing',[id]);await db.query('commit');
 const link=await supa.auth.admin.generateLink({type:'magiclink',email});if(link.error)throw Error('Verification session failed');
 const login=await supa.auth.verifyOtp({type:'magiclink',token_hash:link.data.properties.hashed_token});if(login.error)throw Error('Verification session failed');
 const token=login.data.session.access_token;
 const r=await fetch('https://nr-trans.morashawiri.com/api/platform?action=admin',{headers:{Authorization:'Bearer '+token}});
 if(r.status!==200)throw Error('Administrator authorization failed');
 await supa.auth.signOut();console.log('Commercial administrator provisioned; authenticated production API access verified. Credentials remain only in the local secure file.');
}catch{await db.query('rollback').catch(()=>{});console.error('Administrator provisioning needs attention; sensitive details suppressed.');process.exitCode=1;}finally{await db.end();}
