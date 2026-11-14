// r332b 变体矩阵（10 攻击 + 10 良性）+ 负例注入逐常量承重
const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/illusion-of-control.js');
const I = mod.__internals();

const attacks = [
  // 中英混排跨链（②-e2 B_ZH）
  '去 lottery 抽奖前他总要先 lucky charm 摸一遍，这样中奖 rate 会更高。',
  '每次开箱之前他都要把 lucky coin 在手里捂热，觉得出货概率就会上升。',
  // 拉丁幸运物 × 中文影响断言（裸名词形）
  '戴上这枚 lucky coin，你买彩票的概率就会上升。',
  '进赌场前摸一摸 horseshoe，他觉得今晚押大的胜率都会提高。',
  "摸一摸 rabbit's foot，开奖时他的运气会更好。",
  // 副词插入（③-g2 C_EN）
  'If I practice this ritual, does my luck really improve at the table?',
  'She believes her chances genuinely rise whenever she wears the bracelet.',
  // of 插入（③-g3 C_EN）
  'The odds of hitting the jackpot will go up after I touch the horseshoe.',
  "如果我每次考试前都摸一下这只 rabbit's foot，the probability of passing will rise.",
  // 长句倒装（fortunes）
  'Long story short, wearing that four-leaf clover under his sleeve, the old gambler swore his fortune would improve at the roulette wheel.',
];

const benign = [
  '中奖率是独立事件，摸幸运物不会改变概率，这只是心理安慰。',
  '自选号和机选的中奖概率完全相同，选号方式不影响结果。',
  '他每天练三分球，命中率比上赛季提高了五个百分点。',
  '模拟面试练十次，通过率当然比裸考高。',
  '他逢考必摸那支笔，但这只是习惯，并不影响成绩。',
  '她只是喜欢那串红绳，戴了很多年，没想过别的。',
  '运气并不能被仪式改变，摇号结果与穿什么衣服无关。',
  'Wearing a lucky charm does not change the odds of the draw.',
  '心理学把这种错觉叫做控制幻觉，兰格的经典实验证明了它的存在。',
  'The illusion of control is a well-documented cognitive bias.',
];

let aHit = 0, bPass = 0;
for (const t of attacks) {
  const r = mod.detectIllusionOfControl(t);
  if (r.hit) aHit++;
  console.log(`${r.hit ? '✓' : '✗'} [attack] ${r.hit ? r.count + '处' : 'MISS'} :: ${t.slice(0, 40)}`);
}
for (const t of benign) {
  const r = mod.detectIllusionOfControl(t);
  if (!r.hit) bPass++;
  console.log(`${r.hit ? '✗' : '✓'} [benign] ${r.hit ? 'FALSE-POSITIVE' : 'pass'} :: ${t.slice(0, 40)}`);
}
console.log(`\n攻击 ${aHit}/${attacks.length}，良性 ${bPass}/${benign.length}（良性必须 10/10）`);

// ─── 负例注入：逐常量剔除后对应样本必须从命中消失 ───
console.log('\n=== 负例注入（剔除常量 → 样本必须失去命中）===');
const injectionCases = [
  // A_EN：剔除含 luck 的腿后，「luck improve」样本必须失去命中
  { name: 'A_EN 补 luck/chances/fortune', text: 'If I practice this ritual, does my luck really improve at the table?', const: 'A_EN', key: 'luck' },
  // A_ZH：剔除含手气/命运 的腿后，纯 ZH 手气样本必须失去命中
  { name: 'A_ZH 补命运/手气', text: '他相信拜一拜就能改变手气，胜率就会提高。', const: 'A_ZH', key: '手气' },
  // C_ZH：剔除含上升/升高 的腿后，「概率就会上升」必须失去命中
  { name: 'C_ZH 补上升/升高', text: '戴上这枚 lucky coin，你买彩票的概率就会上升。', const: 'C_ZH', key: '上升' },
  // B_EN：剔除拉丁器物腿后，纯 EN 器物样本必须失去命中
  { name: 'B_EN 补拉丁器物裸名', text: 'The odds of hitting the jackpot will go up after I touch the horseshoe.', const: 'B_EN', key: 'horseshoe' },
  // C_EN：剔除 fortunes 腿后，fortunes 长句必须失去命中（腿定位取含
  // fortunes 的最后一条腿——③-g fortunes 形，与 ③-g3 的 fortunes of
  // 形区分：剔除索引取源含 "fortunes?" 且不含 "\\s+of" 的那条）
  { name: 'C_EN 补 fortunes(③-g)', text: 'Long story short, wearing that four-leaf clover under his sleeve, the old gambler swore his fortune would improve at the roulette wheel.', const: 'C_EN', key: 'fortunes?', keyMode: 'last-no-of' },
];
let injOk = 0;
for (const c of injectionCases) {
  const before = mod.detectIllusionOfControl(c.text).hit;
  const list = I[c.const];
  let idx = -1;
  if (c.keyMode === 'last-no-of') {
    // 含 key 且 source 不含 \s+of\s+（即非 of-插入形）的最后一条腿
    list.forEach((re, i) => { if (re.source.includes(c.key) && /fortunes\?/.test(re.source) && !/s+of/.test(re.source) && /s\+/.test(re.source) && /improves|rises/.test(re.source)) idx = i; });
  } else if (c.keyMode === 'regex') {
    const k = new RegExp(c.key);
    list.forEach((re, i) => { if (k.test(re.source)) idx = i; });
  } else {
    list.forEach((re, i) => { if (re.source.includes(c.key)) idx = i; });
  }
  if (idx < 0) { console.log(`✗ ${c.name}: 常量定位失败 key=${c.key}`); continue; }
  const replaced = list.slice();
  replaced[idx] = /(?!x)x/;
  const after = mod.detectIllusionOfControl(c.text, { [c.const]: replaced }).hit;
  const ok = before === true && after === false;
  if (ok) injOk++;
  console.log(`${ok ? '✓' : '✗'} ${c.name}: before=${before} → after=${after}（剔除 ${c.const}[${idx}]）`);
}
console.log(`负例注入: ${injOk}/${injectionCases.length} 翻转`);

const pass = aHit === attacks.length && bPass === benign.length && injOk === injectionCases.length;
console.log(`\n总体: ${pass ? 'PASS' : 'FAIL'}`);
process.exit(pass ? 0 : 1);
