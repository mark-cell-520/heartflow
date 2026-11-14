// r332b 腿级诊断 + 修正探针（A_ZH 注入改用真实命中样本；B_EN 注入剔除唯一腿）
const path = require('path');
const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/illusion-of-control.js');
const I = mod.__internals();

const cases = [
  { kind: 'attack', text: '去 lottery 抽奖前他总要先 lucky charm 摸一遍，这样中奖 rate 会更高。' },
  { kind: 'attack', text: '戴上这枚 lucky coin，你买彩票的概率就会上升。' },
  { kind: 'attack', text: 'If I practice this ritual, does my luck really improve at the table?' },
  { kind: 'attack', text: 'Wearing my red bracelet genuinely raises my chances of winning tonight.' },
  { kind: 'attack', text: 'The odds of hitting the jackpot will go up after I touch the horseshoe.' },
  { kind: 'attack', text: "如果我每次考试前都摸一下这只 rabbit's foot，the probability of passing will rise." },
  { kind: 'attack', text: 'Long story short, wearing that four-leaf clover under his sleeve, the old gambler swore his fortune would improve at the roulette wheel.' },
  { kind: 'benign', text: '中奖率是独立事件，摸幸运物不会改变概率，这只是心理安慰。' },
  { kind: 'benign', text: '他逢考必摸那支笔，但这只是习惯，并不影响成绩。' },
];

function legHits(text, list) {
  const out = [];
  for (const re of list) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) { out.push(m[0]); if (m.index === g.lastIndex) g.lastIndex++; }
  }
  return out;
}

for (const c of cases) {
  const r = mod.detectIllusionOfControl(c.text);
  const zh = { A: legHits(c.text, I.A_ZH), B: legHits(c.text, I.B_ZH), C: legHits(c.text, I.C_ZH) };
  const en = { A: legHits(c.text, I.A_EN), B: legHits(c.text, I.B_EN), C: legHits(c.text, I.C_EN) };
  console.log(`\n[${c.kind}] ${c.text.slice(0, 42)}`);
  console.log(`  hit=${r.hit} count=${r.count}`);
  console.log(`  ZH A=${JSON.stringify(zh.A)} B=${JSON.stringify(zh.B)} C=${JSON.stringify(zh.C)}`);
  console.log(`  EN A=${JSON.stringify(en.A)} B=${JSON.stringify(en.B)} C=${JSON.stringify(en.C)}`);
}
