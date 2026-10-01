import {spawnSync} from 'node:child_process';
import {credentials} from './credentials.mjs';
const c=credentials();
const encoded=Buffer.from(`x-access-token:${c.Jeton}`).toString('base64');
const env={...process.env,GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0:`AUTHORIZATION: basic ${encoded}`};
const r=spawnSync('git',['push','-u','origin','main'],{cwd:new URL('../../',import.meta.url),env,encoding:'utf8',timeout:90000});
console.log(r.status===0?'GitHub push succeeded.':'GitHub push failed (credentials omitted).');
if(r.status===0){const v=spawnSync('git',['ls-remote','origin','refs/heads/main'],{cwd:new URL('../../',import.meta.url),env,encoding:'utf8',timeout:30000});console.log(v.stdout.trim());}
process.exitCode=r.status??1;
