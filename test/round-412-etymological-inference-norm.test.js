/**
 * r412 — genetic_fallacy 词源谬误族「推断式规范结论」句式族负例注入测试
 *
 * 被测对象：src/genetic-fallacy.js [r412] 新路由
 *   · 腿① ETYM 词源/本义标记（存量常量）
 *   · 腿② ETYM_NORM2_ZH/EN 推断式规范结论（新增，三支＋裸形 d 支）
 *   · 豁免：ETYM_META（评析话术本身）、ETYM_HEDGE_ZH/EN（反谬误对冲）
 *
 * 升级判定：真升级②——已有维度的全新句式族。存量 r399 词源族只收定义/
 * 规范直陈（才算/不配叫/是误用），本族收「所以现在……其实是在……」
 * 「就是说……就是在……」的推断形，两类措辞结构正交。
 *
 * 运行：node test/round-412-etymological-inference-norm.js
 */
'use strict';

const assert = require('node:assert');
const path = require('node:path');
const { checkGeneticFallacy, __internals } = require(path.join(__dirname, '..', 'src', 'genetic-fallacy.js'));

let pass = 0;
let fail = 0;
function ok(cond, name) {
  if (cond) { pass++; }
  else { fail++; console.error('  FAIL: ' + name); }
}

// ── 一、攻击族：词源腿 × 推断式规范结论（应全部命中）─────────────
// 分支覆盖：a 实是在裁定 / b 本质裁定 / c 立场裁定 / d 裸形「就是在」
const ATTACK = [
  // a 支：其实/事实上/说到底 + 在 + 裁定动词
  ['a', '「民主」一词本义是暴民统治，所以现在鼓吹民主的人其实在鼓吹暴民政治。'],
  ['a', '「女士」古义是贵族妇女，所以现在称呼普通女性为女士，事实上就是在篡改词义。'],
  ['a', 'democracy 源于希腊语，本义是暴民统治，因此你今天支持民主制度其实是在为暴政张目。'],
  // b 支：本质上/说到底/骨子里/无非是
  ['b', '「民主」本义是暴民统治，可见当下一切赞美民主的言论本质上都是在为暴政背书。'],
  ['b', 'gay 原本是快乐，所以说 gay marriage 说到底就是在美化堕落。'],
  ['b', 'Education 来自 educere，意思是引出，所以灌输式教学骨子里就是在浪费生命。'],
  ['b', '「杠精」一词源于抬杠，可见网上用这个词的人无非是在党同伐异。'],
  // c 支：为……背书/站台/正名
  ['c', 'democracy 源于希腊语，本义是暴民统治，因此你今天支持民主制度就是在为暴政张目。'],
  ['c', '「汉奸」古义指汉人奸细，所以你现在用这个词给批评者定性，说到底就是在为构陷站台。'],
  // d 支：裸形「就是在＋裁定动词」（无「其实/本质上」前缀——161 轮教训自查）
  ['d', '「 lady 」这个词原本指贵妇人，所以说别人是 lady 就是在抬高对方。'],
  ['d', '这个词源于拉丁语，本义是尺子，所以你今天拿它当标准就是在偷换概念。'],
  ['d', '「公知」原本指公共知识分子，所以你现在骂别人是公知，其实就是在扣帽子。'],
  // 英文侧
  ['en', '"Democracy" comes from the Greek for mob rule, so supporting it today is really just endorsing mob rule.'],
  ['en', 'The word literally means "to lead out", in essence every classroom that lectures is wasting time.'],
  ['en', 'It derives from the Latin for "ruler", so calling him a manager is merely rebranding a tyrant.'],
];
for (const [branch, text] of ATTACK) {
  const r = checkGeneticFallacy(text);
  ok(r.hit === true, `attack[${branch}] 应命中: ${text.slice(0, 36)}`);
}

// ── 二、良性族：词源事实陈述 / 词义演变承认 / 语言学教学（应全部不判）──
// 必须含边缘良性：引用词源＋对冲形（正确指出本义≠当下用法）
const BENIGN = [
  '「民主」一词本义是暴民统治，但现代政治学中的定义已经不同，词义会随时代演变。',
  'Education 来自 educere，意思是引出——不过现代用法早已泛化，这是词义演变的正常例子。',
  '这个词源于希腊语，本义是杠杆；本义不等于当下用法，这是语言学常识。',
  '「民主」一词本义是暴民统治，这是古希腊时期的用法。',
  'gay 原本是快乐，如今的含义已经完全变了，不能用本义评判现在的用法。',
  '「民主」一词本义是暴民统治。',
  '这个词源于希腊语，本义是杠杆。',
  '《 etymology 研究》指出，「文凭」一词源于拉丁文 diploma，指一种公文。',
  'The word "nice" originally meant foolish, but its meaning has shifted dramatically over the centuries.',
  '"Democracy" comes from the Greek for mob rule — the modern sense is broader, and word meanings evolve.',
];
for (const text of BENIGN) {
  const r = checkGeneticFallacy(text);
  ok(r.hit === false, `benign 不应判: ${text.slice(0, 36)}`);
}

// ── 三、豁免组承重：评析词源谬误话术本身（有腿①＋腿②仍不判）──────
const META_EXEMPT = [
  '「民主」本义是暴民统治，所以今天说民主的人其实在鼓吹暴民政治——这就是典型的词源谬误。',
  '说「本义是X所以现在都是误用」的人，本质上是在犯诉诸词源的错误。',
  'This is an etymological fallacy: the word derives from the Latin, so calling it abuse is really just distortion.',
];
for (const text of META_EXEMPT) {
  const r = checkGeneticFallacy(text);
  ok(r.hit === false, `meta-exempt 不应判: ${text.slice(0, 36)}`);
}

// ── 四、逐常量承重：负例注入验证每条腿都在承重（空白正则替换）─────
// 4.1 腿① ETYM_ZH 置空 → 攻击句不再命中（证明词源腿承重）
{
  const I = __internals();
  const text = '「民主」一词本义是暴民统治，所以现在鼓吹民主的人其实在鼓吹暴民政治。';
  const base = checkGeneticFallacy(text);
  ok(base.hit === true, '常量注入基线应命中');
  const noEtym = checkGeneticFallacy(text, { ETYM_ZH: /(?!x)x/ });
  ok(noEtym.hit === false, 'ETYM_ZH 置空后不应命中（腿①承重）');
  ok(I.ETYM_ZH.test(text) && I.ETYM_NORM2_ZH.test(text), 'internals 常量可达');
}
// 4.2 腿② ETYM_NORM2_ZH 置空 → 攻击句不再命中（证明推断腿承重）
{
  const text = '「民主」一词本义是暴民统治，所以现在鼓吹民主的人其实在鼓吹暴民政治。';
  const noNorm = checkGeneticFallacy(text, { ETYM_NORM2_ZH: /(?!x)x/ });
  ok(noNorm.hit === false, 'ETYM_NORM2_ZH 置空后不应命中（腿②承重）');
}
// 4.3 对冲组 ETYM_HEDGE_ZH 置空 → 对冲良性句转为命中（证明对冲在承重）
{
  const text = '「民主」一词本义是暴民统治，但现代政治学中的定义已经不同，词义会随时代演变。';
  const base = checkGeneticFallacy(text);
  ok(base.hit === false, '对冲良性基线不应命中');
  // 注意：此句腿② NORM2 本身不命中（「已经不同」不在 NORM2 表），
  // 故置空 HEDGE 仍不判——对冲与该句正交；换用腿②命中的对冲句验证：
  const text2 = '这个词源于希腊语，本义是杠杆；本义不等于当下用法，这是语言学常识，所以你拿本义说事其实是在偷换概念。';
  const noHedge = checkGeneticFallacy(text2, { ETYM_HEDGE_ZH: /(?!x)x/ });
  ok(noHedge.hit === true, 'ETYM_HEDGE_ZH 置空后对冲句应命中（对冲承重）');
}
// 4.4 META 豁免置空 → 元陈述句转为命中（证明 META 在承重）
{
  const text = '「民主」本义是暴民统治，所以今天说民主的人其实在鼓吹暴民政治——这就是典型的词源谬误。';
  const base = checkGeneticFallacy(text);
  ok(base.hit === false, 'meta 豁免基线不应命中');
  const noMeta = checkGeneticFallacy(text, { ETYM_META_ZH: /(?!x)x/ });
  ok(noMeta.hit === true, 'ETYM_META_ZH 置空后元陈述句应命中（META 承重）');
}
// 4.5 EN 侧逐常量
{
  const en = '"Democracy" comes from the Greek for mob rule, so supporting it today is really just endorsing mob rule.';
  ok(checkGeneticFallacy(en).hit === true, 'EN 基线应命中');
  ok(checkGeneticFallacy(en, { ETYM_EN: /(?!x)x/ }).hit === false, 'ETYM_EN 置空后不应命中');
  ok(checkGeneticFallacy(en, { ETYM_NORM2_EN: /(?!x)x/ }).hit === false, 'ETYM_NORM2_EN 置空后不应命中');
}
// 4.6 距离与共现纪律：只有腿①无腿②不判；只有腿②无腿①不判
{
  ok(checkGeneticFallacy('这个词源于希腊语，本义是杠杆。').hit === false, '仅腿①不判');
  ok(checkGeneticFallacy('所以你现在支持它其实就是在鼓吹暴民政治。').hit === false, '仅腿②不判');
}

// ── 五、存量回归：r399 直陈形路由不受影响 ───────────────────────
{
  const stock = [
    '这个词源于希腊语，本义是杠杆，所以你现在用这个词都是误用。',
    'gay 原本是快乐，所以说 gay marriage 从一开始就是用错了。',
  ];
  for (const text of stock) {
    const r = checkGeneticFallacy(text);
    ok(r.hit === true, `存量直陈形应仍命中: ${text.slice(0, 30)}`);
  }
  // 存量 SOURCE×QUALITY 族
  const src = [
    '这个观点是年轻人提出的，肯定不成熟。',
    '小作坊生产的，质量能好到哪去。',
  ];
  for (const text of src) {
    const r = checkGeneticFallacy(text);
    ok(r.hit === true, `存量来源族应仍命中: ${text.slice(0, 20)}`);
  }
}

console.log(`\nr412 etymological-inference-norm: ${pass} passed / ${fail} failed`);
if (fail > 0) process.exit(1);
