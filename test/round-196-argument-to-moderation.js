/**
 * test/round-196-argument-to-moderation.js — 第 194 维度
 * argument_to_moderation（诉诸中庸：中间/折中立场表述×中间=正确断言
 * 两腿结构）负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击必须停止命中（证明不是装饰）；
 *      依赖某豁免的陷阱样本在抹掉它后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良性另在
 * variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部 gate.action 非 pass
 * 且 argument_to_moderation 维度承重，≥5 良性全部 pass）。本族枚举刻意
 * 收裸名词形态（「中间立场」「折中」「各打五十大板」「双方都有错」），
 * 不收「了/之后」后缀才命中的形；「取中间」收受限形，不收「中间」裸词
 * （「中间价/中间值」是算术语境，另有算术豁免兜底）。
 *
 * 立项证据：grep -rniE 'moderation|中庸|中间立场' src/ 仅命中古籍书名
 * （《中庸》）与 content moderation 一词——193 维无一覆盖「折中立场被
 * 直接当成真理」这一族。侦察落盘 /tmp/hf-scout-<ts>.txt（HN Algolia 命中
 * arXiv 2405.02318「Translating natural language to first-order logic for
 * logical fallacy detection」pts=258；GitHub fallacy detection 前列仓库
 * 全部依赖 LLM；Semantic Scholar 429——纯规则自有实现）。
 */
const assert = require('assert');
const { checkArgumentToModeration } = require('../src/argument-to-moderation.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const NEVER = /(?!x)x/; // 永不匹配
const hit = (s) => checkArgumentToModeration(s).hit;
const noHit = (s) => !checkArgumentToModeration(s).hit;

// ─── 攻击样本（中文×7 / 英文×3 / 含裸名词、带修饰、倒装、长句）────────
const ATTACK = [
  '甲方乙方各有过错，真相在中间，各打五十大板才是最公道的处理。',
  '这两种观点都太极端了，正确的答案在它们中间。',
  '公说公有理婆说婆有理，其实折中才是对的。',
  '一个巴掌拍不响，双方都有错，各打五十大板才是公道的。',
  '关于这项政策该不该继续，支持和反对的人都走了极端，中间立场才是理性的。',
  '才是正解的，恰恰是那条没人坚持的中间道路。',                                    // 倒装（断言在前）
  '这场争论持续了三个月，支持和反对的人其实都有责任，各退一步才是解决问题的出路。', // 长句
  'Both extremes are wrong, so the truth lies somewhere in the middle.',
  "Let's just split the difference — the middle ground is the correct answer.",
  'When two sides clash, the fairest position is usually the one in between.',
];

// ─── 良性样本（边缘良性：谈判成交/算术取中/元讨论/推理否定/中性陈述）──
const BENIGN = [
  '谈判桌上双方各让一步，终于签下了这份协议。',                       // 谈判成交（程序动作）
  '两个温度计读数差了0.3度，取中间值作为最终结果。',                   // 算术取中
  '中庸之道是儒家思想的重要概念，讲的是不偏不倚。',                   // 元讨论（概念）
  '真相并不总是在两个极端中间，有时一方就是对的。',                   // 推理否定
  '战争是多因共同造成的，不能简化为单一因素。',                       // 正确多因陈述
  '甲方报价80万，乙方报价120万，中间价100万是市场行情。',             // 市场行情（中间价不入腿①）
  '折中并不等于正确，关键要看哪一方的证据更充分。',                   // 推理否定
  '两种假说都在检验中，目前没有定论。',                               // 中性陈述
  '两个方案各有优劣，可以结合两者的优点，形成新方案。',               // 拼合优点≠中间=真理
  'The two companies met in the middle and signed the deal at $50.',  // EN 谈判
  'The average of the two readings is the middle value, which we report as the measurement.', // EN 算术
  "Aristotle's doctrine of the mean is often confused with the argument to moderation.", // EN 元讨论
  'One side may still be entirely right — being in the middle is not automatically correct.', // EN 推理否定
  'The conflict has many causes working together; no single factor explains it.', // EN 中性
];

// ─── 豁免承重陷阱（含豁免词时放过；抹掉该豁免必须转为命中）────────────
const TRAPS = [
  { name: '元讨论豁免承重', sample: '诉诸中庸是一种常见的逻辑谬误，把中间立场当成真理就错了。', exempt: 'EXEMPT_META_ZH' },
  { name: '推理否定豁免承重(zh)', sample: '折中并不总是正确的，所谓各打五十大板才是公道，其实是无原则妥协。', exempt: 'EXEMPT_NEG_ZH' },
  { name: '谈判成交豁免承重', sample: '遗产分配谈判中，兄弟姐妹各让一步，折中方案才是对各方都公平的解决。', exempt: 'EXEMPT_DEAL_ZH' },
  { name: '算术取中豁免承重', sample: '两位评委对同一跳水动作打分，去掉最高分最低分后取中间值，这才是公平的评分方式。', exempt: 'EXEMPT_AVG_ZH' },
  { name: '对冲豁免承重', sample: '也许真相就在两者中间，各让一步或许才是最优解。', exempt: 'EXEMPT_HEDGE_ZH' },
  { name: '疑问句豁免承重', sample: '难道各打五十大板才是公道吗？', exempt: null },
  { name: '元讨论豁免承重(en)', sample: 'Some say the middle ground is always the correct answer, but that is the argument to moderation fallacy.', exempt: 'EXEMPT_META_EN' },
];

console.log('— 攻击样本（应全部命中）—');
for (const [i, s] of ATTACK.entries()) t(`attack[${i}] ${s.slice(0, 22)}…`, () => assert.strictEqual(hit(s), true));

console.log('— 良性样本（应全部放行）—');
for (const [i, s] of BENIGN.entries()) t(`benign[${i}] ${s.slice(0, 22)}…`, () => assert.strictEqual(noHit(s), true));

console.log('— 豁免承重（抹掉豁免必须转为命中）—');
for (const [i, tr] of TRAPS.entries()) {
  t(`trap[${i}] ${tr.name}`, () => {
    assert.strictEqual(noHit(tr.sample), true, '含豁免词时应放行');
    if (tr.exempt === null) {
      // 疑问句豁免：去掉问号必须转为命中
      assert.strictEqual(hit(tr.sample.replace(/[?？]/g, '。')), true, '去掉问号应命中');
    }
  });
}

console.log('— 逐常量注入（腿必须承重）—');
// 腿① / 腿② 各自抹掉后，依赖该腿的攻击必须停止命中
const ZH_NEED_A = [ATTACK[0], ATTACK[1], ATTACK[2], ATTACK[3], ATTACK[4], ATTACK[5], ATTACK[6]];
const EN_NEED = [ATTACK[7], ATTACK[8], ATTACK[9]];
t('注入 MIDDLE_ZH=[] → 中文攻击全停', () => {
  for (const s of ZH_NEED_A) assert.strictEqual(checkArgumentToModeration(s, { MIDDLE_ZH: [] }).hit, false, s.slice(0, 20));
});
t('注入 TRUTH_ZH=[] → 中文攻击全停', () => {
  for (const s of ZH_NEED_A) assert.strictEqual(checkArgumentToModeration(s, { TRUTH_ZH: [] }).hit, false, s.slice(0, 20));
});
t('注入 MIDDLE_EN=[] → 英文攻击全停', () => {
  for (const s of EN_NEED) assert.strictEqual(checkArgumentToModeration(s, { MIDDLE_EN: [] }).hit, false, s.slice(0, 20));
});
t('注入 TRUTH_EN=[] → 英文攻击全停', () => {
  for (const s of EN_NEED) assert.strictEqual(checkArgumentToModeration(s, { TRUTH_EN: [] }).hit, false, s.slice(0, 20));
});
// 豁免抹掉后，陷阱样本必须转为命中（证明豁免在承重而非装饰）
t('注入 EXEMPT_META_ZH=[] → 元陷阱转为命中', () => {
  assert.strictEqual(checkArgumentToModeration(TRAPS[0].sample, { EXEMPT_META_ZH: [] }).hit, true);
});
t('注入 EXEMPT_NEG_ZH=[] → 否定陷阱转为命中', () => {
  assert.strictEqual(checkArgumentToModeration(TRAPS[1].sample, { EXEMPT_NEG_ZH: [] }).hit, true);
});
t('注入 EXEMPT_DEAL_ZH=[] → 谈判陷阱转为命中', () => {
  assert.strictEqual(checkArgumentToModeration(TRAPS[2].sample, { EXEMPT_DEAL_ZH: [] }).hit, true);
});
t('注入 EXEMPT_AVG_ZH=[] → 算术陷阱转为命中', () => {
  assert.strictEqual(checkArgumentToModeration(TRAPS[3].sample, { EXEMPT_AVG_ZH: [] }).hit, true);
});
t('注入 EXEMPT_HEDGE_ZH=[] → 对冲陷阱转为命中', () => {
  assert.strictEqual(checkArgumentToModeration(TRAPS[4].sample, { EXEMPT_HEDGE_ZH: [] }).hit, true);
});
t('注入 EXEMPT_META_EN=[] → 英文元陷阱转为命中', () => {
  assert.strictEqual(checkArgumentToModeration(TRAPS[6].sample, { EXEMPT_META_EN: [] }).hit, true);
});

console.log('— 变体矩阵（真实 gate()，≥5 攻击变体非 pass + ≥5 良性 pass）—');
// 同族变体：中英双语、裸名词、带修饰、倒装、长句
const VARIANTS = [
  '双方都有错，这事各打五十大板，才是公道。',                          // 裸名词
  '所谓的中间立场，才是这次事件里唯一理性的声音。',                    // 带修饰
  '才是正确的答案——那个谁也不讨好的折中方案。',                        // 倒装
  '关于这场旷日持久的争论，甲派乙派各执一词，其实都过于极端，站在中间看问题才是清醒的，政策也应当取折中。', // 长句
  'Both parties share the blame, and the middle ground is the only rational position.', // EN
  'A fair compromise position is usually the one between the two extremes.', // EN 变体
];
const VARIANTS_BENIGN = [
  '调解员建议双方各让一步，最终双方达成了和解。',                      // 调解语境
  '三个数 3、6、9 的平均值是 6，取中间值即可。',                       // 算术
  '儒家讲中庸，不是和稀泥，而是分寸感。',                              // 元讨论
  '目前证据还不足以在两种假说之间下定论，需要补充实验数据。',         // 证据不足≠中间=真理
  '两个方案各有优劣，可以结合两者的优点，形成新方案。',               // 拼合优点≠中间=真理
  'The mediator proposed meeting in the middle, and both sides accepted the settlement.', // EN 调解
  'Neither explanation is proven yet; the jury is still out.',         // EN 存疑
];
for (const [i, s] of VARIANTS.entries()) t(`variant-attack[${i}] ${s.slice(0, 20)}…`, () => {
  const r = gate(s);
  assert.notStrictEqual(r.gate.action, 'pass', `应非 pass，实得 ${r.gate.action}`);
  const f = (r.findings || []).find((x) => x.dimension === 'argument_to_moderation');
  assert.ok(f, 'findings 应含 argument_to_moderation');
  assert.ok(f.severity > 0, 'severity 应 >0');
});
for (const [i, s] of VARIANTS_BENIGN.entries()) t(`variant-benign[${i}] ${s.slice(0, 20)}…`, () => {
  const r = gate(s);
  assert.strictEqual(r.gate.action, 'pass', `应 pass，实得 ${r.gate.action}（${r.gate.reason || ''}）`);
});

console.log(`\nround-196: ${pass} passed / ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
