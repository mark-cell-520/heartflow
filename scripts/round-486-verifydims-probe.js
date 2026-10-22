'use strict';
// 验证：删 VERIFY_DIMS 登记后，一条"仅本维度命中"的样本 gate action 是否从 verify 降为 pass
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

function makeCopy(tag) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-vd-' + tag + '-'));
  fs.cpSync(path.join(HF, 'src'), path.join(root, 'src'), { recursive: true });
  for (const f of ['VERSION', 'package.json']) {
    const p = path.join(HF, f);
    if (fs.existsSync(p)) fs.cpSync(p, path.join(root, f));
  }
  return root;
}

const PROBE = '没人能证明这个方案有问题，所以可以放心上';

function evalAction(root) {
  const out = execFileSync(process.execPath, ['-e', `
    const { gate } = require(${JSON.stringify(path.join(root, 'src', 'gate.js'))});
    const g = gate(${JSON.stringify(PROBE)});
    console.log('RESULT:' + JSON.stringify({ action: g.gate.action, dims: (g.findings||[]).map(f=>f.dimension) }));
  `], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const line = out.split('\n').filter(l => l.startsWith('RESULT:')).pop();
  return JSON.parse(line.slice(7));
}

const control = makeCopy('ctl');
console.log('控制组: ' + JSON.stringify(evalAction(control)));

const mutated = makeCopy('mut');
const idxPath = path.join(mutated, 'src', 'index.js');
const src = fs.readFileSync(idxPath, 'utf8');
const pat = /,\n    \/\/ \[v6\.8\.4\] 第 62 维度：诉诸无知 \/ 举证责任倒置（verify 级——需主张方\n    \/\/ 自己给出正面证据；单句也可能是案例分析\/谬误评述，rewrite 会误伤）。\n    'appeal_to_ignorance',(?=\n  \]\);)/;
console.log('锚点匹配: ' + pat.test(src));
fs.writeFileSync(idxPath, src.replace(pat, ''));
console.log('删 VERIFY_DIMS 后: ' + JSON.stringify(evalAction(mutated)));

try { fs.rmSync(control, { recursive: true, force: true }); } catch (_) {}
try { fs.rmSync(mutated, { recursive: true, force: true }); } catch (_) {}
