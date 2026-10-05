// r473 探针：T2 失败的 owner 记录实况（aggressive：强制清侧车再跑 victim）
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const MG = require('/root/.hermes/skills/ai/mark-heartflow-skill/test/mutation-guard-recovery.js');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mg473-'));
const FAKE = path.join(TMP, 'fake.js');
const GOOD = 'module.exports = 1; // original\n';
const BAD = 'module.exports = 1; // MUTATED poison\n';
fs.writeFileSync(FAKE, GOOD, 'utf8');

// 强制清干净
try { fs.unlinkSync(MG.sidecarPath(FAKE)); } catch (_) {}
try { fs.unlinkSync(MG.ownerPath(FAKE)); } catch (_) {}

const VICTIM = path.join(TMP, 'victim.js');
fs.writeFileSync(VICTIM, [
  "const fs = require('fs');",
  "const { arm } = require(" + JSON.stringify(path.resolve('/root/.hermes/skills/ai/mark-heartflow-skill/test/mutation-guard-recovery.js')) + ");",
  "const E = " + JSON.stringify(FAKE) + ";",
  "const orig = fs.readFileSync(E, 'utf8');",
  "arm(E, orig);",
  "fs.writeFileSync(E, " + JSON.stringify(BAD) + ", 'utf8');",
  "console.log('armed-and-poisoned');",
  "setTimeout(function(){}, 30000);",
].join('\n'), 'utf8');

const child = spawn(process.execPath, [VICTIM], { stdio: ['ignore', 'pipe', 'pipe'] });
let out = '';
child.stdout.on('data', d => { out += d; });
child.stderr.on('data', d => {});

let poisoned = false;
for (let i = 0; i < 40; i++) {
  try {
    if (fs.existsSync(MG.sidecarPath(FAKE)) && fs.readFileSync(FAKE, 'utf8') === BAD) { poisoned = true; break; }
  } catch (_) {}
  spawnSync('sleep', ['0.2']);
}
console.log('poisoned =', poisoned);
console.log('owner file exists =', fs.existsSync(MG.ownerPath(FAKE)));
if (fs.existsSync(MG.ownerPath(FAKE))) console.log('owner content =', JSON.stringify(fs.readFileSync(MG.ownerPath(FAKE), 'utf8')));
console.log('childAlive pre-kill =', child.pid, 'killed=' + child.killed);

child.kill('SIGKILL');
spawnSync('sleep', ['0.5']);
console.log('owner exists after kill =', fs.existsSync(MG.ownerPath(FAKE)));
if (fs.existsSync(MG.ownerPath(FAKE))) console.log('owner content after kill =', JSON.stringify(fs.readFileSync(MG.ownerPath(FAKE), 'utf8')));
console.log('ownerAlive() =', MG.ownerAlive(FAKE));
console.log('pidAlive(child.pid) =', MG.pidAlive(child.pid));
console.log('recover() =', MG.recover([FAKE]));
console.log('engine content now =', JSON.stringify(fs.readFileSync(FAKE, 'utf8')));
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
