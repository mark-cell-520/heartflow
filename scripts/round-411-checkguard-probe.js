// round-411 探针：checkSamples 期望判据 vs 实际行为（不跑 400 秒 run-all）
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'scripts/guard-abilities.js'), 'utf8');

// 1) 从 guard-abilities.js 提取 SAMPLES 数组与 checkSamples 判据（原样求值，不改被测文件）
const m = src.match(/const SAMPLES = (\[[\s\S]*?\n\];)/);
if (!m) { console.log('FATAL: SAMPLES 提取失败'); process.exit(1); }
const SAMPLES = eval(m[1]);

const gate = require(path.join(ROOT, 'src/gate.js'));

console.log('── 判据对称性：checkSamples 实际读取的期望字段 ──');
const readExpect = src.match(/if \(s\.(\w+)/g) || [];
console.log('判据读到的期望字段:', readExpect.join(' '));
const declared = new Set();
for (const s of SAMPLES) for (const k of Object.keys(s)) if (k.startsWith('expect')) declared.add(k);
console.log('样本声明的期望字段:', [...declared].join(' '));
for (const k of declared) {
  const covered = readExpect.some(r => r.includes(k));
  console.log(`  ${k.padEnd(16)} 判据覆盖: ${covered ? '是' : '否  <== 该期望形同虚设，样本恒绿'}`);
}

console.log('\n── 每个样本的实际 gate action vs 期望 ──');
for (const s of SAMPLES) {
  let action = 'THROW';
  let fcount = 0;
  try {
    const r = gate.checkInput(s.text);
    action = r.gate && r.gate.action;
    fcount = (r.findings || []).length;
  } catch (e) { action = 'ERR:' + e.message.slice(0, 40); }
  const verdictUnderGuard = (s => {
    let ok = true;
    if (s.expectBlock && action !== 'block') ok = false;
    if (s.expectRewrite && action !== 'rewrite' && action !== 'verify') ok = false;
    if (s.expectClean && action !== 'pass') ok = false;
    return ok;
  })(s);
  const wantAction = s.expectBlock ? 'block' : s.expectRewrite ? 'rewrite/verify' : s.expectVague ? 'verify' : s.expectClean ? 'pass' : '?';
  console.log(`  [${s.id.padEnd(14)}] gate=${String(action).padEnd(8)} 期望=${wantAction.padEnd(12)} findings=${fcount} 守卫判=${verdictUnderGuard ? '✅' : '❌'}`);
}
