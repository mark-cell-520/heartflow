/** [round-286 probe] 负例守卫 checkPasses 退出码为何非 0 */
const cp = require('child_process');
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SCRIPT = path.join(ROOT, 'scripts', 'sync-doc-dimensions.js');

for (const cwd of [ROOT, undefined]) {
  const r = cp.spawnSync('node', [SCRIPT, '--check'], { encoding: 'utf8', timeout: 180000, cwd });
  console.log('cwd=', cwd, 'status=', r.status);
  console.log('stdout:', (r.stdout || '').slice(0, 400));
  console.log('stderr:', (r.stderr || '').slice(0, 400));
  console.log('---');
}
