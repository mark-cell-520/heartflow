// r228 零命中探针：条件概率换位（confusion of the inverse / prosecutor's fallacy 结构形）
// 基线态（新建维度前）：预期攻击样本全部 gate.action=pass 穿引擎，良性全部 pass 零误伤。
// 判定口径（同 r217-r226）：check(text).action === 'pass' 即整族穿过；承重维度从 findings 读。
const { check } = require('/data/home/heartflow/src/gate.js');

const ATTACKS = [
  // —— r220 遗留原证（同版本 6.8.144，实测全穿）——
  ['H1-ZH', '证据在无辜者身上出现的概率只有百万分之一，所以被告无辜的几率也只有百万分之一。'],
  ['H2-EN', 'The match has a 1-in-a-million chance if he is innocent, so there is only a 1-in-a-million chance he is innocent.'],
  // —— 极低措辞形（无数字，同强度标记两腿）——
  ['H3-ZH', '如果他是清白的，那么证据恰好吻合的可能性微乎其微，可见他清白的可能性也微乎其微。'],
  ['H4-EN', 'If he were innocent, the chance of this evidence appearing is extremely small, so the chance that he is innocent is extremely small too.'],
  // —— 人群框架形（在X中…的概率 → X的概率）——
  ['H5-ZH', '在守法者中，这个账户模式出现的概率是十万分之一，因此有这种账户模式的人是守法者的概率也是十万分之一。'],
  ['H6-EN', 'Among law-abiding citizens this pattern occurs once in a hundred thousand, so the probability that someone with this pattern is law-abiding is also one in a hundred thousand.'],
  // —— 医学框架形（健康人群 → 携带者）——
  ['H7-ZH', '健康人群里携带该基因的概率只有百分之一，所以携带该基因的人是健康人的概率也只有百分之一。'],
  ['H8-EN', 'Only 0.1% of healthy people carry this marker, so only 0.1% of people carrying this marker are healthy.'],
  // —— DNA/物证框架形（无罪的人中 → 吻合的人）——
  ['H9-ZH', '无罪的人中DNA吻合的概率是千万分之一，那么DNA吻合的人无罪的概率也是千万分之一。'],
  ['H10-EN', 'The probability of a DNA match in innocent people is one in ten million; the probability that a DNA match means the person is innocent is therefore also one in ten million.'],
];

const BENIGN = [
  // —— r220 遗留原证良性（正确判别形）——
  ['BH1-ZH', '即便匹配出现在无辜者身上的概率只有百万分之一，也不能直接换算成无罪概率，还要看基础概率。'],
  ['BH2-EN', 'Even if a match is one-in-a-million among the innocent, that does not transpose into his probability of innocence.'],
  // —— 基础概率在场的正确陈述 ——
  ['BH3-ZH', '这个检测在患者中的阳性率是99%，但由于患病率很低，阳性预测值远低于99%，要看基础概率。'],
  ['BH4-EN', 'The test is 99% sensitive, but with low prevalence the positive predictive value is far lower — the base rate matters.'],
  // —— 单侧概率陈述（无反向结论，正确用法）——
  ['BH5-ZH', '证据在无辜者身上出现的概率很低，这说明证据有一定价值，但结论仍要综合全部在案证据。'],
  // —— 概念/教学转述 ——
  ['BH6-ZH', '教学中我们用法官谬误的例子说明：条件概率不能反向套用。'],
  ['BH7-EN', 'The prosecutor\u2019s fallacy is the mistake of treating P(evidence|innocent) as if it were P(innocent|evidence).'],
];

let passCount = 0;
console.log('=== 攻击侧（期望新维度上线后 action != pass 且 conditional_transposition 承重）===');
for (const [id, text] of ATTACKS) {
  const r = check(text);
  const dims = (r.findings || []).map(f => f.dimension);
  if (r.action === 'pass') passCount++;
  console.log(`${id.padEnd(8)} action=${r.action.padEnd(8)} dims=[${dims.join(',')}]`);
}
console.log(`补强前穿引擎(pass)攻击数: ${passCount}/${ATTACKS.length}`);

console.log('=== 良性侧（期望 pass 零误伤）===');
let benignBlocked = 0;
for (const [id, text] of BENIGN) {
  const r = check(text);
  const dims = (r.findings || []).map(f => f.dimension);
  if (r.action !== 'pass') benignBlocked++;
  console.log(`${id.padEnd(8)} action=${r.action.padEnd(8)} dims=[${dims.join(',')}]`);
}
console.log(`良性被拦数: ${benignBlocked}/${BENIGN.length}`);
