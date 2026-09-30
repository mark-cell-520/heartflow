// 第 280 轮 diag5：定位负例守卫「对照副本崩溃」的真实原因。
// 现象：hf-280-control 副本的 gate.checkOutput 抛错（detail 指向 src/index.js:4796，
// 但那是渲染的行号噪声）。逐层验证：是否 src 复制不完整 / node -e 路径问题。
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

const dir = path.join(os.tmpdir(), 'hf-280-diag5');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });

const probe = path.join(dir, '_p.js');
fs.writeFileSync(probe, [
  'try {',
  '  const gate = require(' + JSON.stringify(path.join(dir, 'src', 'gate.js')) + ');',
  '  const r = gate.checkOutput("All users mock a stranger.");',
  '  console.log("OK " + JSON.stringify(r.gate));',
  '} catch (e) {',
  '  console.log("THROW " + (e && e.stack ? e.stack.split("\\n").slice(0, 6).join(" | ") : e));',
  '}',
].join('\n'));
try {
  console.log(execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
} catch (e) {
  console.log('CHILD_FAIL ' + String(e.stdout || '') + ' || ' + String(e.stderr || '').slice(0, 500));
}
