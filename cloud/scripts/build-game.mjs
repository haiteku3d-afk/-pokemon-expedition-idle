import './prepare-game.mjs';
import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['scripts/run-framework.mjs','build'],{cwd:new URL('..',import.meta.url),stdio:'inherit',env:process.env});process.exit(result.status??1);
