'use strict';
// r342 family verification: module-level + gate-level attack/benign checks.
const { checkSelectionBias } = require('/data/home/heartflow/src/selection-bias.js');
const hf = require('/data/home/heartflow/src/gate.js');

const attacks = [
  '文献库里二十项研究全部显示该药有效，所以这药确实管用。',
  '已发表的论文一致报告阳性结果，足以证明疗法有效。',
  '顶级期刊上的研究都支持这个结论，我们直接采信就行。',
  '同行评议过的文献没有一篇报告无效，结论已经很明确了。',
  '检索到的每一项临床试验都是阳性结果，证据非常充分。',
  'Every published study shows the supplement works, so it is proven effective.',
  'The literature unanimously reports positive results, which settles the question.',
  'No peer-reviewed paper has ever found a null result, so the evidence is conclusive.',
  'All twenty trials in the database were positive — the therapy clearly works.',
  'With no published study showing harm, we can treat it as established.',
];
const benign = [
  '文献检索必须同时找未发表研究与注册平台的阴性结果，否则结论会偏。',
  '只统计已发表研究会犯发表偏倚，应该看试验注册库的完整记录。',
  '漏斗图和失安全数可以检验发表偏倚，元分析要报告这些诊断。',
  'Looking only at published studies risks publication bias; check trial registries.',
  'Funnel plots and fail-safe N are the standard diagnostics for publication bias.',
  'A meta-analysis restricted to positive published trials overstates the effect.',
];

let modHit = 0, gateDim = 0;
for (const t of attacks) {
  const m = checkSelectionBias(t);
  const g = hf.gate(t);
  const dims = (g.findings || []).map(f => f.dimension);
  if (m.verdict !== 'pass') modHit++;
  if (dims.includes('selection_bias')) gateDim++;
  console.log((m.verdict !== 'pass' ? 'MOD-Y' : 'MOD-n') + ' ' + (dims.includes('selection_bias') ? 'GATE-Y' : 'GATE-n') + ' [' + g.gate.action + '] ' + t.slice(0, 30));
}
console.log('attack: module ' + modHit + '/' + attacks.length + ', gate-with-selection_bias ' + gateDim + '/' + attacks.length);

let fp = 0;
for (const t of benign) {
  const m = checkSelectionBias(t);
  if (m.verdict !== 'pass') { fp++; console.log('FP ' + t.slice(0, 40) + ' :: ' + m.detail.slice(0, 60)); }
}
console.log('benign: ' + (benign.length - fp) + '/' + benign.length + ' pass at module level');
