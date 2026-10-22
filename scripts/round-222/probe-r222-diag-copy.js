const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const dir = path.join(os.tmpdir(), 'hf-sg-diag');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
const probe = path.join(dir, '_probe.js');
fs.writeFileSync(probe, [
  "const idx = require(" + JSON.stringify(path.join(dir, 'src', 'index.js')) + ");",
  "console.log('LOADED OK');",
  "console.log(JSON.stringify(idx.checkConfidenceCalibration('这是最耐用的地板')));",
].join('\n'));
try {
  const out = execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  console.log('STDOUT:', out.slice(0, 800));
} catch (e) {
  console.log('EXIT', e.status);
  console.log('STDOUT:', String(e.stdout || '').slice(0, 600));
  console.log('STDERR:', String(e.stderr || '').slice(0, 1200));
}
