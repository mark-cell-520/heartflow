// r439 删条变异：证明守卫真的敏感（不是摆设）
//
// 做法：把 _sanitizeHistoryForSave 的各脱敏支逐支作废，跑定向守卫，
// 必须看到 FAIL。三支分别对应三个泄漏点：
//   E1 整函数变直通（return historySlice）   → input+keywords+GoT 全泄漏
//   E2 只删 keywords 脱敏支                   → keywords 泄漏
//   E3 只删 GoT paths 脱敏支                   → description/gotPaths 泄漏
// 跑完 restore 回绿。
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'src/core/judgment-engine.js');
const GUARD = path.join(ROOT, 'test/round-439-privacy-persist-guard.test.js');

const orig = fs.readFileSync(TARGET, 'utf8');

const M1 = orig.replace(
  /_sanitizeHistoryForSave\(historySlice\) \{(\s*)if \(!Array\.isArray\(historySlice\)\) return historySlice;/,
  '_sanitizeHistoryForSave(historySlice) {\n    return historySlice; // [MUTANT E1]'
);
const M2 = orig.replace(
  /copy\.context\.keywords = _PrivacyExposure\.sanitizeKeywordList\(copy\.context\.keywords\);/,
  '/* [MUTANT E2] keywords 脱敏支删除 */'
);
const M3 = orig.replace(
  /if \(Array\.isArray\(copy\.paths\)\) \{\s*copy\.paths = copy\.paths\.map\(\(p\) => \{[\s\S]*?return pc;\s*\}\);\s*\}/,
  '/* [MUTANT E3] GoT paths 脱敏支删除 */'
);

function run(label) {
  try {
    const out = execFileSync('node', [GUARD], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 100000 });
    console.log(`${label}: PASS(不该发生) ${out.split('\n').filter(l => l.includes('通过')).pop() || ''}`);
    return false;
  } catch (e) {
    const so = (e.stdout || '') + (e.stderr || '');
    const line = so.split('\n').filter(l => l.includes('守卫失败')).pop();
    console.log(`${label}: FAIL(预期) ${line || so.split('\n').slice(-3).join(' | ')}`);
    return true;
  }
}

const results = { E1: false, E2: false, E3: false };
try {
  if (M1 !== orig) { fs.writeFileSync(TARGET, M1); results.E1 = run('E1 整函数直通'); }
  else console.log('E1: 变异串未命中，跳过');
  fs.writeFileSync(TARGET, orig);
  if (M2 !== orig) { fs.writeFileSync(TARGET, M2); results.E2 = run('E2 删 keywords 支'); }
  else console.log('E2: 变异串未命中，跳过');
  fs.writeFileSync(TARGET, orig);
  if (M3 !== orig) { fs.writeFileSync(TARGET, M3); results.E3 = run('E3 删 GoT paths 支'); }
  else console.log('E3: 变异串未命中，跳过');
  fs.writeFileSync(TARGET, orig);
} finally {
  fs.writeFileSync(TARGET, orig);
}
const okCount = Object.values(results).filter(Boolean).length;
console.log(`变异结果：${okCount}/3 支删后守卫变红`);
try {
  execFileSync('node', [GUARD], { cwd: ROOT, stdio: 'ignore', timeout: 100000 });
  console.log('还原校验：守卫回绿');
} catch (e) {
  console.log('还原校验：FAILED');
  process.exit(1);
}
if (okCount < 2) { console.log('守卫敏感度不足'); process.exit(1); }
