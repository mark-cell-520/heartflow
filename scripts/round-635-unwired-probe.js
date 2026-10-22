// r635 候选探测器 v2：必须走真实 start()（之前的版本没 start，_modules 恒空）
// 检测口径：heartflow.js 里所有 this.X = new ...(...) 实例化点中，
//           实例存在但既不在 _modules 也不在 subsystemNames 名单里的 hidden instance
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const hfSrc = fs.readFileSync(path.join(ROOT, 'src', 'core', 'heartflow.js'), 'utf8');
const lcSrc = fs.readFileSync(path.join(ROOT, 'src', 'core', 'engine-lifecycle.js'), 'utf8');

const instRe = /this\.([A-Za-z0-9_]+)\s*=\s*new /g;
const instPoints = new Set();
let m;
while ((m = instRe.exec(hfSrc)) !== null) instPoints.add(m[1]);

// subsystemNames 名单提取
const snMatch = lcSrc.match(/const subsystemNames = \[([\s\S]*?)\];/);
const subsystemNames = new Set();
if (snMatch) {
  const nm = /'([A-Za-z0-9_]+)'/g;
  while ((m = nm.exec(snMatch[1])) !== null) subsystemNames.add(m[1]);
}

const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
try { hf.start(); } catch (e) { console.error('start() threw: ' + e.message); }

const modeKeys = Object.keys(hf._modules || {});
console.log('# r635 unwired probe v2 (after start())');
console.log('实例化点: ' + instPoints.size + ' | subsystemNames: ' + subsystemNames.size + ' | _modules 键: ' + modeKeys.length);
console.log('');

const rows = [];
for (const prop of instPoints) {
  if (subsystemNames.has(prop)) continue;
  const inMod = !!(hf._modules && hf._modules[prop]);
  const inst = hf[prop];
  if (!inst) { rows.push({ prop, state: 'no-instance' }); continue; }
  if (inMod) { rows.push({ prop, state: 'wired' }); continue; }
  // 统计可 dispatch 的方法
  let methods = 0;
  try {
    const seen = new Set();
    for (const k of Object.getOwnPropertyNames(Object.getPrototypeOf(inst))) { if (k !== 'constructor' && typeof inst[k] === 'function') seen.add(k); }
    for (const k of Object.getOwnPropertyNames(inst)) { if (typeof inst[k] === 'function' && k !== 'constructor') seen.add(k); }
    methods = seen.size;
  } catch (e) {}
  rows.push({ prop, state: 'UNWIRED', methods });
}

const unwired = rows.filter(r => r.state === 'UNWIRED');
const noInst = rows.filter(r => r.state === 'no-instance');
console.log('已接线(名单内): ' + rows.filter(r => r.state === 'wired').length);
console.log('实例为空: ' + noInst.length + (noInst.length ? ' → ' + noInst.map(r => r.prop).join(', ') : ''));
console.log('★ 未接线候选 (UNWIRED): ' + unwired.length);
for (const r of unwired.sort((a, b) => b.methods - a.methods)) {
  console.log(`  [${r.prop}] 方法=${r.methods} _modules无键=TRUE dispatch不可达`);
}
