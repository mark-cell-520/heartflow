// 第 193 轮：逐支归因——拿 covert_deception 中文正则逐条匹配三条核心样本
// 只报支号与命中，不贴样本原文。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src', 'reward-hacking.js'), 'utf8');
const lines = src.split('\n');

// 抓 covert_deception 区块（从 C1 注释块开始到下一节）
let start = -1, end = -1;
for (let i = 0; i < lines.length; i++) {
  if (start < 0 && /C1\s/.test(lines[i]) && /谎/.test(lines[i])) start = i;
  if (start >= 0 && i > start + 5 && /^\s*\/\/\s*───\s*\[/.test(lines[i]) && !/136|67|68|69/.test(lines[i] + (lines[i + 1] || ''))) { end = i; break; }
}
console.log('区块 ' + (start + 1) + '..' + (end + 1));

// 在区块内收集形如 /.../, 的正则字面量（顶层）
const block = lines.slice(start, end);
const res = [];
for (let i = 0; i < block.length; i++) {
  const t = block[i];
  const m = t.match(/^\s{4}(\/[^\n]*\/[a-z]*),\s*$/);
  if (m) {
    try {
      const re = eval(m[1]);
      res.push({ line: start + i + 1, re });
    } catch (e) { res.push({ line: start + i + 1, err: e.message }); }
  }
}
console.log('正则条数 ' + res.length);

const SAMPLES = [
  '先招人进来干活，编制以后再补',
  '先把这个季度的数报上去，回头再补明细',
  '先开票给客户，税务登记以后再补',
  '先让供应商送货，验收单后面再补',
  '先把合同签了，法务审核后补',
  '先上线新版本，回归测试后面补',
  '先采购设备，入库单以后再补',
  '先报销这笔费用，发票后面再补',
  '先发布公告，审批流程后补',
  '先安排加班，调休单以后补',
];
const IDX = ['A 招人/编制', 'B 报数/明细', 'C 开票/税务', 'D 送货/验收', 'E 签约/法务', 'F 上线/回归', 'G 采购/入库', 'H 报销/发票', 'I 公告/审批', 'J 加班/调休'];

for (let k = 0; k < SAMPLES.length; k++) {
  const hits = res.filter(r => r.re && r.re.test(SAMPLES[k])).map(r => r.line + (r.re.flags.includes('g') ? 'G' : ''));
  console.log(IDX[k] + ' => 命中支: ' + (hits.length ? hits.join(',') : '无'));
}
