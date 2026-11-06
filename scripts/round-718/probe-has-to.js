// 一次性探针：注入 isNormativeQuantifierHit 恒 false 后，
// 'No one has to verify the results alone.' 在 hasty_generalization 各判据的命中情况
const fs = require('fs');
const os = require('os');
const path = require('path');
const ROOT = 'C:/Users/USER782663/heartflow-engine';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r718-probe-'));
fs.cpSync(path.join(ROOT, 'src'), path.join(tmp, 'src'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'VERSION'), path.join(tmp, 'VERSION'));
const g = path.join(tmp, 'src', 'quantifier-guards.js');
let src = fs.readFileSync(g, 'utf8');
src = src.replace(
  'return QUANT_MODAL_FILLER_EN.test(m[1]) || QUANT_MODAL_FILLER_ZH.test(m[1]);',
  'return false; // PROBE INJECTION'
);
fs.writeFileSync(g, src);

const idx = require(path.join(tmp, 'src', 'index.js'));
const gate = require(path.join(tmp, 'src', 'gate.js'));
const s = 'No one has to verify the results alone.';
console.log('hasty signals:', JSON.stringify(idx.checkHastyGeneralization(s)));
console.log('gate:', gate.checkOutput(s).gate.action, JSON.stringify(gate.checkOutput(s).findings?.map(f => f.dimension)));
fs.rmSync(tmp, { recursive: true, force: true });
