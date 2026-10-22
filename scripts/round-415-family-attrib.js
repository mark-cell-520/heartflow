#!/usr/bin/env node
/**
 * r415 族归因探针：对三个「均漏」族做多样化本实测
 * 目的：判定真空缺 vs 样本不典型（r414 教训：不归因就动引擎会自造红）
 * 输出：每个变体在双边的命中情况
 */
const hf = require('../src/index.js');

// 与 lang-coverage-audit.js 的 hit() 完全同一把尺（count / totalHits / hits）
const CHECKS = {
  info_deprivation: hf.checkInfoDeprivation,
  unsupported_claim: hf.checkUnsupportedClaim,
  empty_answer: hf.checkEmptyAnswer,
};

// 形状描述族，每族 6 变体：ZH 3 + EN 3
const CASES = [
  // ── info_deprivation / cognitive_shutdown：禁止追问原因族
  { dim: 'info_deprivation', family: 'cognitive_shutdown', side: 'zh', text: '你没有必要了解原因，执行就可以了' },
  { dim: 'info_deprivation', family: 'cognitive_shutdown', side: 'zh', text: '不要问为什么，照我说的做就行' },
  { dim: 'info_deprivation', family: 'cognitive_shutdown', side: 'zh', text: '原因不是你需要考虑的，你只管执行' },
  { dim: 'info_deprivation', family: 'cognitive_shutdown', side: 'zh', text: '别追根问底了，知道太多对你没好处' },
  { dim: 'info_deprivation', family: 'cognitive_shutdown', side: 'zh', text: '你不用明白原理，跟着步骤做完就行' },
  { dim: 'info_deprivation', family: 'cognitive_shutdown', side: 'zh', text: '解释了你也不懂，别浪费时间' },
  { dim: 'info_deprivation', family: 'cognitive_shutdown', side: 'en', text: 'You do not need to understand the internals, just follow orders' },
  { dim: 'info_deprivation', family: 'cognitive_shutdown', side: 'en', text: 'Dont ask why, just do what I say' },
  { dim: 'info_deprivation', family: 'cognitive_shutdown', side: 'en', text: 'The reasons are none of your concern, you just execute' },
  { dim: 'info_deprivation', family: 'cognitive_shutdown', side: 'en', text: 'You dont need to understand the internals, simply comply' },
  { dim: 'info_deprivation', family: 'cognitive_shutdown', side: 'en', text: 'No need to dig into the details, follow the procedure' },
  { dim: 'info_deprivation', family: 'cognitive_shutdown', side: 'en', text: 'Understanding is not required here, just run the steps' },

  // ── unsupported_claim / sweeping_absolute：全量覆盖式断言族
  { dim: 'unsupported_claim', family: 'sweeping_absolute', side: 'zh', text: '毫无疑问这彻底解决了所有潜在的安全隐患' },
  { dim: 'unsupported_claim', family: 'sweeping_absolute', side: 'zh', text: '这完全杜绝了任何可能的风险' },
  { dim: 'unsupported_claim', family: 'sweeping_absolute', side: 'zh', text: '已经根除了全部的安全隐患' },
  { dim: 'unsupported_claim', family: 'sweeping_absolute', side: 'zh', text: '彻底消除了所有潜在问题' },
  { dim: 'unsupported_claim', family: 'sweeping_absolute', side: 'zh', text: '百分之百覆盖了每一个边界情况' },
  { dim: 'unsupported_claim', family: 'sweeping_absolute', side: 'zh', text: '这绝对万无一失，不存在任何漏洞' },
  { dim: 'unsupported_claim', family: 'sweeping_absolute', side: 'en', text: 'This has undoubtedly eliminated every potential security risk' },
  { dim: 'unsupported_claim', family: 'sweeping_absolute', side: 'en', text: 'This completely eliminates any possible risk' },
  { dim: 'unsupported_claim', family: 'sweeping_absolute', side: 'en', text: 'All possible risks have been fully eradicated' },
  { dim: 'unsupported_claim', family: 'sweeping_absolute', side: 'en', text: 'It removes every single potential issue with no exceptions' },
  { dim: 'unsupported_claim', family: 'sweeping_absolute', side: 'en', text: 'Every potential vulnerability is now fully covered' },
  { dim: 'unsupported_claim', family: 'sweeping_absolute', side: 'en', text: 'There are absolutely no risks left whatsoever' },

  // ── empty_answer / circular_restate：同义反复族
  { dim: 'empty_answer', family: 'circular_restate', side: 'zh', text: '这个问题本质上就是因为问题本身很复杂所以复杂' },
  { dim: 'empty_answer', family: 'circular_restate', side: 'zh', text: '失败的原因是因为失败了' },
  { dim: 'empty_answer', family: 'circular_restate', side: 'zh', text: '这个方法有效的原因是因为它有效' },
  { dim: 'empty_answer', family: 'circular_restate', side: 'zh', text: '之所以贵是因为它的成本高，成本高是因为它贵' },
  { dim: 'empty_answer', family: 'circular_restate', side: 'zh', text: '这个方案的好处是它很好' },
  { dim: 'empty_answer', family: 'circular_restate', side: 'zh', text: '问题复杂的原因是这个问题本身很复杂' },
  { dim: 'empty_answer', family: 'circular_restate', side: 'en', text: 'There is no simple answer here, it all depends on circumstances' },
  { dim: 'empty_answer', family: 'circular_restate', side: 'en', text: 'It failed because it failed' },
  { dim: 'empty_answer', family: 'circular_restate', side: 'en', text: 'It works because it works' },
  { dim: 'empty_answer', family: 'circular_restate', side: 'en', text: 'The reason it is expensive is that it costs a lot, and it costs a lot because it is expensive' },
  { dim: 'empty_answer', family: 'circular_restate', side: 'en', text: 'The benefit is that it is beneficial' },
  { dim: 'empty_answer', family: 'circular_restate', side: 'en', text: 'It is complex because the issue itself is complex' },
];

const TARGETS = ['info_deprivation', 'unsupported_claim', 'empty_answer'];

// 与 lang-coverage-audit.js hit() 同一把尺
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

let hit = 0, miss = 0;
const missLines = [];
const byFam = {};
for (const c of CASES) {
  const a = analyze(c.dim, c.text);
  const key = `${c.dim}|${c.family}|${c.side}`;
  byFam[key] = byFam[key] || { n: 0, hit: 0 };
  byFam[key].n++;
  if (a.ok) { byFam[key].hit++; hit++; }
  else {
    miss++;
    missLines.push(`${c.dim}[${c.family}][${c.side}] n=${a.score} err=${a.err || ''}`);
  }
}
console.log(`归一化结果: 命中 ${hit}/${CASES.length}, 漏 ${miss}`);
for (const k of Object.keys(byFam)) {
  const v = byFam[k];
  console.log(`  ${k}: ${v.hit}/${v.n}`);
}
console.log('--- 漏判明细 ---');
for (const l of missLines) console.log('  ' + l);
