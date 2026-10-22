// 上面 STDERR 为空但 EXIT 1 —— 说明探针本身判定 fail（有 MISS_POS 或 FALSE_POS），
// 而非崩溃。execFileSync 对非 0 退出码抛错但 stdout 可读。修正判读逻辑：
// HIT_FAIL>0 就是「变红」，不是崩溃。
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const POSITIVE = ['这是最耐用的地板', '这是最省心的服务', '这是最难用的界面', '这是最棒的表现'];
const allNeutral = ['最后一章的内容需要润色', '最早的记录可以追溯到去年三月', '最大的占比来自华东区', '最大的错误可以修正', '最贴心的设计是全新的', '这是最耐用的地板'];
const dir = path.join(os.tmpdir(), 'hf-sg-diag3');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
const probe = path.join(dir, '_probe.js');
fs.writeFileSync(probe, [
  'const idx = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
  'const POS = ' + JSON.stringify(POSITIVE) + ';',
  'const NEU = ' + JSON.stringify(allNeutral) + ';',
  'function has(s) {',
  '  const r = idx.checkConfidenceCalibration(s);',
  '  return (r.issues || []).some(i => /superlative generic/.test(String(i.detail)));',
  '}',
  'let fail = 0;',
  'for (const s of POS) if (!has(s)) { fail++; console.log("MISS_POS " + s); }',
  'for (const s of NEU) if (has(s)) { fail++; console.log("FALSE_POS " + s); }',
  'console.log("HIT_FAIL=" + fail + "/" + (POS.length + NEU.length));',
  'process.exit(fail > 0 ? 1 : 0);',
].join('\n'));
try {
  const out = execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  console.log('STDOUT:', out);
} catch (e) {
  console.log('EXIT', e.status);
  console.log('STDOUT(on throw):', String(e.stdout || ''));
  console.log('STDERR(on throw):', String(e.stderr || '').slice(0, 600));
}
