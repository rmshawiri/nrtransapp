import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {credentials} from './credentials.mjs';
const c=credentials(),admin=createClient(new URL(c['API URL']).origin,c['Secret keys'],{auth:{persistSession:false,autoRefreshToken:false}});
const fixture=JSON.parse(await readFile(new URL('../.private/browser-fixture-owner.json',import.meta.url)));
const existing=await admin.auth.admin.getUserById(fixture.id);
if(existing.error||!/^nr-trans-browser-[a-f0-9-]+@example\.com$/.test(existing.data.user.email))throw new Error('Unexpected fixture');
const password=crypto.randomUUID()+'Aa7';
if((await admin.auth.admin.updateUserById(fixture.id,{password})).error)throw new Error('Fixture password update failed');
function run(args){try{execFileSync('cmd.exe',['/d','/s','/c','npx --yes agent-browser --session nr-roundtrip '+args],{stdio:['ignore','pipe','pipe'],timeout:45000});}catch{throw new Error('Browser login step failed');}}
run('fill "input[name=email]" "'+existing.data.user.email+'"');
run('fill "input[name=password]" "'+password+'"');
run('click "#auth-form button"');
console.log('Login submitted through the real form; credentials not displayed.');
