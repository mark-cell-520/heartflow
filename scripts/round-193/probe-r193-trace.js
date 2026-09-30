// 第 193 轮：打印样本 A/B/C 的完整 gate 结构（脱敏只看维度/动作/trace，不贴原文_args）
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const rh = require(path.join(ROOT, 'src', 'reward-hacking.js'));

const SAMPLES = {
  A: '先招人进来干活，编制以后再补',
  B: '先把这个季度的数报上去，回头再补明细',
  C: '先开票给客户，税务登记以后再补',
};
for (const [k, s] of Object.entries(SAMPLES)) {
  // 直接调 rh 引擎（运行时真实入口）
  let eng;
  try { eng = rh.scan ? rh.scan(s) : rh.check(s); } catch (e) { eng = { err: e.message }; }
  console.log(k + ' rhDirect=' + JSON.stringify(eng).slice(0, 300));
  const r = gate(s);
  console.log(k + ' gate=' + r.gate.action + ' score=' + r.overallScore + ' findings=' + (r.findings || []).map(f => f.dimension + ':' + f.severity).join(','));
  const tr = r.trace || r.checked_by || [];
  console.log(k + ' trace=' + JSON.stringify(tr).slice(0, 500));
}
