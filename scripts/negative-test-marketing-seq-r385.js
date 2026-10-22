// r385 负例还原点：删掉 src/index.js 的「第X+序列量词」排除式，守卫必须变红。
// 用法：node scripts/negative-test-marketing-seq-r385.js check|break|restore
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const TARGET = path.join(ROOT, 'src/index.js');
const TESTFILE = path.join(ROOT, 'test/confidence-marketing-seq-round385.test.js');

function clearCache() {
  Object.keys(require.cache).forEach(k => {
    if (k.includes(path.join('src', 'index.js')) || k.includes('confidence-marketing-seq')) delete require.cache[k];
  });
}

function runTest() {
  clearCache();
  const r = require(TESTFILE);
  let pass = 0, fail = 0;
  const env = { test, assertTrue, assertFalse };
  function test(name, fn) {
    try { fn(); pass++; } catch (e) { fail++; console.log(`  FAIL: ${name} -> ${e.message}`); }
  }
  function assertTrue(c, m) { if (!c) throw new Error(m); }
  function assertFalse(c, m) { if (c) throw new Error(m); }
  r(env);
  return { pass, fail };
}

const phase = process.argv[2];
if (phase === 'check' || phase === 'restore') {
  if (phase === 'restore') {
    execFileSync('git', ['checkout', '--', 'src/index.js'], { cwd: ROOT, stdio: 'inherit' });
  }
  const { pass, fail } = runTest();
  console.log(`[${phase}] ${pass} 通过 / ${fail} 失败`);
  process.exit(fail ? 1 : 0);
} else if (phase === 'break') {
  const src = fs.readFileSync(TARGET, 'utf8');
  // 定位：从 const _mkText = text 到 marketingOverclaimZH 赋值结束
  const start = src.indexOf('const _mkText = text');
  const endMarker = "const marketingOverclaimZH = (_mkText.match(";
  const end = src.indexOf(endMarker, start);
  if (start < 0 || end < 0) { console.log('未找到排除式，负例无效'); process.exit(2); }
  const broken = src.slice(0, start) + 'const _mkText = text;\n    ' + src.slice(end);
  fs.writeFileSync(TARGET, broken);
  const { pass, fail } = runTest();
  console.log(`[break] ${pass} 通过 / ${fail} 失败（预期 >= 1 失败）`);
  // 还原
  execFileSync('git', ['checkout', '--', 'src/index.js'], { cwd: ROOT, stdio: 'inherit' });
  process.exit(fail >= 1 ? 0 : 1);
} else {
  console.log('usage: node scripts/negative-test-marketing-seq-r385.js check|break|restore');
  process.exit(2);
}
