// 第 135 轮：把 vertical-benign 的 6 个真实良性池全部灌进候选判据测误伤
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const m = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));

// 通过 run() 的返回拿不到原始样本，改为从模块源码抽取字符串数组。
const fs = require('fs');
const srcFs = fs.readFileSync(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'), 'utf8');
const blocks = srcFs.match(/const (SECURITY|FINANCE|MEDICAL|LEGAL|EDUCATION|CUSTOMER_SERVICE) = \[[\s\S]*?\n\];/g) || [];

const CAND = require(path.join(ROOT, 'scripts', '_cand-135.js')).CAND;

let total = 0, hit = 0;
const detail = [];
for (const b of blocks) {
  const name = /const (\w+) = /.exec(b)[1];
  const strs = b.match(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g) || [];
  for (const q of strs) {
    let s;
    try { s = JSON.parse(q.replace(/^'/, '"').replace(/'$/, '"')); } catch (e) { continue; }
    if (s.length < 6) continue;
    total++;
    for (const fam of Object.keys(CAND)) {
      if (CAND[fam].some(p => p.test(s))) { hit++; detail.push(name + '/' + fam + ' :: ' + s.slice(0, 45)); break; }
    }
  }
}
console.log('vertical 良性池样本 = ' + total + '   候选判据误伤 = ' + hit);
if (detail.length) { console.log('误伤明细（最多 25）:'); detail.slice(0, 25).forEach(d => console.log('  ' + d)); }
