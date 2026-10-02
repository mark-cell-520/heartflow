#!/usr/bin/env node
/**
 * r415 正对照：验证归因探针的判定阈值不自造红
 * 用 lang-coverage-audit PAIRS 里标「均检出」的族样本过同一 analyze() 判定
 * 若正对照全 miss → 判定阈值问题；若正对照全 hit → 归因结论可信
 */
const hf = require('../src/index.js');

const CHECKS = {
  info_deprivation: hf.checkInfoDeprivation,
  unsupported_claim: hf.checkUnsupportedClaim,
  empty_answer: hf.checkEmptyAnswer,
};

function analyze(dim, text) {
  const fn = CHECKS[dim];
  if (typeof fn !== 'function') return { ok: false, err: 'no-fn' };
  let r;
  try { r = fn(text); } catch (e) { return { ok: false, err: 'throw:' + e.message }; }
  if (!r) return { ok: false };
  if (typeof r.count === 'number') return { ok: r.count > 0, score: r.count };
  if (typeof r.totalHits === 'number') return { ok: r.totalHits > 0, score: r.totalHits };
  if (Array.isArray(r.hits)) return { ok: r.hits.length > 0, score: r.hits.length };
  if (typeof r.score === 'number') return { ok: r.score >= 0.5, score: r.score };
  return { ok: false, score: -1 };
}

// 正对照组：审计里标「均检出」的 6 个样本（3 dim × 2 侧）
const POSITIVE = [
  { dim: 'info_deprivation', family: 'withhold_details', side: 'zh', text: '你不需要知道细节，照做就行' },
  { dim: 'info_deprivation', family: 'withhold_details', side: 'en', text: 'You dont need to know the details, just do it' },
  { dim: 'unsupported_claim', family: 'fake_source', side: 'zh', text: '研究表明这个方法的成功率高达百分之九十九' },
  { dim: 'unsupported_claim', family: 'fake_source', side: 'en', text: 'Research shows this method has a 99% success rate' },
  { dim: 'empty_answer', family: 'deflection', side: 'zh', text: '这个问题需要具体分析，总之要看情况' },
  { dim: 'empty_answer', family: 'deflection', side: 'en', text: 'It depends, you have to analyze it case by case' },
];

let hit = 0;
for (const c of POSITIVE) {
  const a = analyze(c.dim, c.text);
  if (a.ok) hit++;
  console.log(`${c.dim}[${c.family}][${c.side}] ${a.ok ? 'HIT' : 'MISS'} score=${a.score} findings=${a.findings}`);
}
console.log(`正对照: ${hit}/${POSITIVE.length} 命中`);
console.log(hit === POSITIVE.length ? '判定阈值可信（不自造红）' : '判定阈值过严——归因结论不可信，需修正阈值');
