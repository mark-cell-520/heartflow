#!/usr/bin/env node
/**
 * 第 219 轮立项探针：三个候选方向的实测坐实（只报数字，不贴样本原文）。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name.startsWith('round-')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

const srcFiles = walk(path.join(ROOT, 'src'));
const testFiles = walk(path.join(ROOT, 'test'));
const findings = {};

for (const field of ['_selfVerification', '_reflectionLoopClosed']) {
  const consumers = [];
  for (const f of [...srcFiles, ...testFiles]) {
    const txt = fs.readFileSync(f, 'utf8');
    const rel = path.relative(ROOT, f);
    txt.split('\n').forEach((ln, i) => {
      if (ln.startsWith('*') || ln.startsWith('//') || ln.trim().startsWith('/*')) return;
      if (ln.includes(field + ' = ')) return;
      if (ln.includes(field + '={')) return;
      if (ln.includes(field)) consumers.push(rel + ':' + (i + 1) + ' :: ' + ln.trim().slice(0, 80));
    });
  }
  findings[field] = consumers;
}

const fakeGreen = [];
for (const f of testFiles) {
  const txt = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f);
  txt.split('\n').forEach((ln, i) => {
    if (/doesNotThrow\s*\(\s*\(\s*\)\s*=>\s*\{\s*try/.test(ln) || /doesNotThrow\s*\(\s*function\s*\(\s*\)\s*\{\s*try/.test(ln)) {
      fakeGreen.push(rel + ':' + (i + 1));
    }
  });
}

console.log('=== 第 219 轮立项探针（只报数字）===');
console.log('src 文件数:', srcFiles.length, ' test 文件数:', testFiles.length);
for (const [k, v] of Object.entries(findings)) {
  console.log('读取点[' + k + ']:', v.length);
  v.slice(0, 8).forEach(s => console.log('    ' + s));
}
console.log('假绿 doesNotThrow(try{}catch{}) 行数:', fakeGreen.length);
fakeGreen.slice(0, 8).forEach(s => console.log('    ' + s));

(async () => {
  try {
    const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
    const { buildGateVerdict } = require(path.join(ROOT, 'src/gate-verdict.js'));
    const hf = new HeartFlow();
    await hf.start();
    const inputs = [
      '帮我看看这个方案有没有什么问题',
      '总结一下这个系统的优点',
      '我觉得这个结论不一定对，需要更多证据',
      '请解释一下推理过程',
    ];
    let withSv = 0;
    const actions = {};
    for (const inp of inputs) {
      const r = await hf.think(inp, { compact: false });
      if (r && r._selfVerification) withSv++;
      const v = buildGateVerdict(r);
      actions[v.action] = (actions[v.action] || 0) + 1;
      if (r && r._selfVerification) {
        console.log('  sv: passed=' + r._selfVerification.passed,
          'conf=' + r._selfVerification.confidence,
          'issues=' + (r._selfVerification.issues || []).length,
          'verdict=' + v.action);
      } else {
        console.log('  sv: (未落地) verdict=' + v.action);
      }
    }
    console.log('_selfVerification 落地:', withSv, '/', inputs.length);
    console.log('gate verdict action 分布:', JSON.stringify(actions));
    process.exit(0);
  } catch (e) {
    console.error('探针引擎段失败:', e && e.message);
    process.exit(1);
  }
})();
