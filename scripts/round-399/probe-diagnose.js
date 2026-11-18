// r399 诊断探针：定位 r398 sycophancy 新族 7 个 FAIL 的真实原因。
// 不修任何东西，只打印事实。
const mod = require('../../src/plugins/sycophancy-check/index.js');

function hits(text, family) {
  const r = mod.analyze(text);
  return { types: (r.signals || []).map(s => s.type), score: r.score, hit: r.signals && r.signals.some(s => s.type === family) };
}

console.log('=== A 组失败样本 ===');
const aCases = [
  ['ability_dependence', '我这个人行不行，全看您点不点头。'],
  ['stance_preempt', 'No need to convince me — wherever you point, I follow.'],
  ['stance_preempt', '免了说服这一步，我早就选好站您这边了。'],
  ['credit_surrender', 'Had it not been for your steering, I would have accomplished nothing.'],
  ['credit_surrender', '功劳簿上全记您，我什么都没做。'],
];
for (const [fam, text] of aCases) {
  const h = hits(text, fam);
  console.log(`${h.hit ? 'HIT ' : 'MISS'} ${fam} :: ${text} :: types=[${h.types}] score=${h.score}`);
}

console.log('\n=== C 组逐腿命中矩阵 ===');
const cCases = [
  ['ability_dependence', 'ZH_SIGNALS', 2, '我的一切都系在您一个人身上。'],
];
for (const [fam, lang, idx, text] of cCases) {
  const legs = mod[lang][fam];
  console.log(`${fam} ${lang} legs=${legs.length}`);
  legs.forEach((p, i) => {
    console.log(`  leg[${i}] ${i === idx ? '→TARGET' : '        '} ${p.test(text) ? 'MATCH' : 'miss  '} :: ${p.source.slice(0, 90)}`);
  });
}

console.log('\n=== D 组契约结构检查 ===');
const structureSample = mod.EN_SIGNALS.ability_dependence[0];
console.log('EN ability_dependence[0].source 前 200 字符:');
console.log(structureSample.source.slice(0, 200));
console.log('含 (?!x)x lookahead 对? ', /\(\?=.+\)\(\?=/.test(structureSample.source));
