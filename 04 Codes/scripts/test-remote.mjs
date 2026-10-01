import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['--test','tests/database.test.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,NR_TEST_REMOTE:'1'},stdio:'inherit'});
process.exitCode=result.status??1;
