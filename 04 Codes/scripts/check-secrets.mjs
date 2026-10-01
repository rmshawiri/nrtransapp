import {spawnSync} from 'node:child_process';
import {credentials} from './credentials.mjs';
const c=credentials();
const keys=['Mot de passe','Secret keys','Jeton','Token NR-TRANS','SMTP_PASSWORD'];
const secrets=keys.map(k=>c[k]).filter(x=>x?.length>=8);
const root=new URL('../../',import.meta.url);
const names=spawnSync('git',['diff','--cached','--name-only','-z'],{cwd:root,encoding:'utf8'}).stdout.split('\0').filter(Boolean);
let failed=false;
for(const name of names){
 if(/comptes|\.env(?:\.|$)/i.test(name)&&!name.endsWith('.env.example')){console.error('Forbidden staged file: '+name);failed=true;continue;}
 const content=spawnSync('git',['show',':'+name],{cwd:root,maxBuffer:40*1024*1024}).stdout;
 if(secrets.some(s=>content?.includes(Buffer.from(s)))){console.error('Secret detected in '+name);failed=true;}
}
console.log(failed?'Secret scan failed.':`Secret scan passed: ${names.length} staged files.`);
process.exitCode=failed?1:0;
