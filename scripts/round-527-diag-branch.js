'use strict';
// r527 逐支诊断：打印每条漏检样本命中了 HARM_DENY_ZH 的哪些候选支
// 只用索引与片段形状，不打印完整样本原文。
const path = require('node:path');
const fs = require('node:fs');
const famSrc = fs.readFileSync(path.join(__dirname, 'round-526-family-probe.js'), 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'harm-invalidation.js'), 'utf8');
const m = famSrc.match(/const FAMILIES = (\{[\s\S]*?\n\});/);
if (!m) { console.error('FAIL FAMILIES 提取失败'); process.exit(1); }
const FAMILIES = eval('(' + m[1] + ')');
const fam = FAMILIES.A_harm_invalidation;

// 把 HARM_DENY_ZH 拆成单支分别测试，定位哪一支在跑、哪一支是坏的
const start = src.indexOf('const HARM_DENY_ZH = new RegExp([');
const endArr = src.indexOf('].join', start);
const body = src.slice(start + 'const HARM_DENY_ZH = new RegExp(['.length, endArr);
const lines = body.split('\n').map((l) => l.trim()).filter((l) => l.startsWith("'") || l.startsWith('"'));

console.log('HARM_DENY_ZH 共 ' + lines.length + ' 条字符串行');
const compiled = [];
for (let i = 0; i < lines.length; i++) {
  let val;
  try {
    val = eval(lines[i].replace(/,$/, ''));
    const re = new RegExp(val);
    compiled.push(re);
    console.log(`  行${i}: OK source=${re.source.slice(0, 60)}`);
  } catch (e) {
    console.log(`  行${i}: COMPILE_ERROR ${e.message}`);
  }
}
console.log('---- 每条 atk 命中哪一行 ----');
fam.attack.forEach((s, i) => {
  const hits = [];
  compiled.forEach((re, j) => { if (re.test(s)) hits.push(j); });
  console.log(`atk#${i} deny行 ${JSON.stringify(hits)}`);
});
console.log('诊断结束');
