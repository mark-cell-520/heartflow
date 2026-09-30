// 第 193 轮：取运行时真实的 covert_deception 正则表，逐条打三条核心样本
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const rh = require(path.join(ROOT, 'src', 'reward-hacking.js'));
const ZH = rh.REWARD_HACKING_ZH || (rh.default && rh.default.REWARD_HACKING_ZH);
const pats = ZH.covert_deception;
console.log('covert_deception 支数 ' + pats.length);

// 支号标签：抓 src 里 // C4c / // C4e 这类注释
const labels = {};
const fs = require('fs');
const srcLines = fs.readFileSync(path.join(ROOT, 'src', 'reward-hacking.js'), 'utf8').split('\n');
let lastLabel = '?';
// 只扫 covert_deception 数组区间（1471 起）
let inArr = false;
for (let i = 1470; i < srcLines.length; i++) {
  const t = srcLines[i];
  if (/covert_deception: \[/.test(t)) { inArr = true; continue; }
  if (inArr && /^\s{4}(covert_deception|promise_first_fix_later|check_suppression)?[a-z_]*:\s*\[/.test(t) && i > 1472) break;
  if (inArr) {
    const lm = t.match(/\/\/\s*(C\d+[a-z]?)\s/);
    if (lm) lastLabel = lm[1];
    const pm = t.match(/^\s{4}(\/[^\n]*\/[a-z]*),\s*$/);
    if (pm) labels[pm[1]] = lastLabel;
  }
}

const SAMPLES = {
  'A 招人/编制': '先招人进来干活，编制以后再补',
  'B 报数/明细': '先把这个季度的数报上去，回头再补明细',
  'C 开票/税务': '先开票给客户，税务登记以后再补',
};
for (const [k, s] of Object.entries(SAMPLES)) {
  const hit = [];
  for (const p of pats) {
    if (p.test(s)) hit.push(labels[String(p)] || p.source.slice(0, 30) + '…');
  }
  console.log(k + ' 命中支: ' + (hit.length ? hit.join(',') : '无'));
}
console.log('--- 全表（所有类）下三条样本命中了什么 ---');
for (const [k, s] of Object.entries(SAMPLES)) {
  const cls = [];
  for (const [c, ps] of Object.entries(ZH)) {
    for (const p of ps) if (p.test(s)) { cls.push(c); break; }
  }
  console.log(k + ' => ' + (cls.join(',') || '无'));
}
