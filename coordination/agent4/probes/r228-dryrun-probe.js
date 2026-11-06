// r228 干跑：新模块对攻击/良性/边界样本的模块层判定（接线前自检）
// 修订记录：v2 修正 H7-ZH 探针句笔误（百分之**分**分之一 → 百分之一，
// 该笔误曾致 H7 假性漏判，模块对正确句子实测命中）。
const { checkConditionalTransposition } = require('/data/home/heartflow/src/conditional-transposition.js');

const ATTACKS = [
  ['H1-ZH', '证据在无辜者身上出现的概率只有百万分之一，所以被告无辜的几率也只有百万分之一。'],
  ['H2-EN', 'The match has a 1-in-a-million chance if he is innocent, so there is only a 1-in-a-million chance he is innocent.'],
  ['H3-ZH', '如果他是清白的，那么证据恰好吻合的可能性微乎其微，可见他清白的可能性也微乎其微。'],
  ['H4-EN', 'If he were innocent, the chance of this evidence appearing is extremely small, so the chance that he is innocent is extremely small too.'],
  ['H5-ZH', '在守法者中，这个账户模式出现的概率是十万分之一，因此有这种账户模式的人是守法者的概率也是十万分之一。'],
  ['H6-EN', 'Among law-abiding citizens this pattern occurs once in a hundred thousand, so the probability that someone with this pattern is law-abiding is also one in a hundred thousand.'],
  ['H7-ZH', '健康人群里携带该基因的概率只有百分之一，所以携带该基因的人是健康人的概率也只有百分之一。'],
  ['H8-EN', 'Only 0.1% of healthy people carry this marker, so only 0.1% of people carrying this marker are healthy.'],
  ['H9-ZH', '无罪的人中DNA吻合的概率是千万分之一，那么DNA吻合的人无罪的概率也是千万分之一。'],
  ['H10-EN', 'The probability of a DNA match in innocent people is one in ten million; the probability that a DNA match means the person is innocent is therefore also one in ten million.'],
];

const BENIGN = [
  ['BH1-ZH', '即便匹配出现在无辜者身上的概率只有百万分之一，也不能直接换算成无罪概率，还要看基础概率。'],
  ['BH2-EN', 'Even if a match is one-in-a-million among the innocent, that does not transpose into his probability of innocence.'],
  ['BH3-ZH', '这个检测在患者中的阳性率是99%，但由于患病率很低，阳性预测值远低于99%，要看基础概率。'],
  ['BH4-EN', 'The test is 99% sensitive, but with low prevalence the positive predictive value is far lower — the base rate matters.'],
  ['BH5-ZH', '证据在无辜者身上出现的概率很低，这说明证据有一定价值，但结论仍要综合全部在案证据。'],
  ['BH6-ZH', '教学中我们用法官谬误的例子说明：条件概率不能反向套用。'],
  ['BH7-EN', 'The prosecutor\u2019s fallacy is the mistake of treating P(evidence|innocent) as if it were P(innocent|evidence).'],
];

const EDGE = [
  // 单值不判 / 无推断词不判 / 复述不回指不判 / 否定结论不判 / 真疑问不判 / 不同值不判
  ['E1-单值', '证据在无辜者身上出现的概率只有百万分之一。'],
  ['E2-无推断', '在患者中阳性率是99%，在健康者中阳性率是1%。'],
  ['E3-复述不回指', '如果他没准备，通过考试的可能性极低，所以通过考试的可能性也极低。'],
  ['E4-否定结论', '证据在无辜者身上出现的概率只有百万分之一，但并不能据此推定他无罪的概率同样是百万分之一。'],
  ['E5-真疑问', '在患者中阳性率是99%，那么阳性者中患者的概率也是99%吗？'],
  ['E6-不同值', '在患者中阳性率是99%，所以假阳性率是1%。'],
  ['E7-无框无数值', '两个概率不能混为一谈，这是统计常识。'],
  ['E8-估计语气', '调查显示，样本中该特征的出现率约为千分之一，所以在更大总体中该特征的出现率也约为千分之一。'],
];

let miss = 0, fp = 0;
console.log('=== 攻击（期望 hit=true）===');
for (const [id, s] of ATTACKS) {
  const r = checkConditionalTransposition(s);
  if (!r.hit) miss++;
  console.log(`${id.padEnd(8)} hit=${r.hit} score=${r.score} count=${r.count} ${r.hit ? '' : '<<< 漏判'} ${r.detail.slice(0, 60)}`);
}
console.log(`漏判: ${miss}/${ATTACKS.length}`);
console.log('=== 良性（期望 hit=false）===');
for (const [id, s] of BENIGN) {
  const r = checkConditionalTransposition(s);
  if (r.hit) fp++;
  console.log(`${id.padEnd(10)} hit=${r.hit} ${r.hit ? '<<< 误判 ' + r.detail.slice(0, 50) : ''}`);
}
console.log(`误判: ${fp}/${BENIGN.length}`);
console.log('=== 边界（期望 hit=false）===');
for (const [id, s] of EDGE) {
  const r = checkConditionalTransposition(s);
  console.log(`${id.padEnd(14)} hit=${r.hit} ${r.hit ? '<<< ' + r.detail.slice(0, 60) : ''}`);
}
