// r228 负例注入验证：逐常量摘除 → 守卫必须变红
// 变红定义（r218/r226 范式）：应停命中的攻击转为不命中，或应放行的陷阱转为命中。
const M = require('/data/home/heartflow/src/conditional-transposition.js');

const ATT = {
  zh1: '证据在无辜者身上出现的概率只有百万分之一，所以被告无辜的几率也只有百万分之一。',
  zh2: '如果他是清白的，那么证据恰好吻合的可能性微乎其微，可见他清白的可能性也微乎其微。',
  zh3: '在守法者中，这个账户模式出现的概率是十万分之一，因此有这种账户模式的人是守法者的概率也是十万分之一。',
  en1: 'The match has a 1-in-a-million chance if he is innocent, so there is only a 1-in-a-million chance he is innocent.',
  en2: 'If he were innocent, the chance of this evidence appearing is extremely small, so the chance that he is innocent is extremely small too.',
  en3: 'Only 0.1% of healthy people carry this marker, so only 0.1% of people carrying this marker are healthy.',
};
const TRAP = {
  // 每个豁免/守卫对应一条当前必须放行、摘除常量后必须转命中的陷阱。
  // 陷阱句设计原则：四要件齐全（同值两现+条件框+推断词+实体回指），
  // 唯一防线就是目标常量——否则注入后不会翻转（r228 实测教训：
  // 初版 4 条陷阱只含单个数值或无推断词，注入后仍不命中）。
  BASERATE_ZH: '只看基础概率的人会说：在患者中阳性率是99%，所以阳性者中患者的概率也是99%——这正是基数率忽视的典型形态。',
  CORRECT_ZH: '在无辜者中匹配出现的概率是百万分之一，所以在无辜者中被误配的概率也是百万分之一，但这只是条件概率的一个方向，两个概率不能互相换算。',
  META_ZH: '教学中我们讲过一个案例：在患者中阳性率是99%，所以阳性者中患者的概率也是99%——这就是谬误。',
  ESTIMATE_ZH: '调查显示，样本中该特征的出现率约为千分之一，所以在更大总体中该特征的出现率也约为千分之一。',
  NEG_ZH: '证据在无辜者身上出现的概率只有百万分之一，但被告无辜的概率并不会因此就是百万分之一。',
  BASERATE_EN: 'For sick patients the test is 99% sensitive, so the probability that a positive patient is sick is also 99% — but the base rate matters.',
  CORRECT_EN: 'A match is one-in-a-million among the innocent, so it does not transpose into his probability of innocence being one-in-a-million.',
  META_EN: 'For sick patients the test is 99% sensitive, so the probability that a positive patient is sick is also 99% — a classic fallacy taught in every textbook.',
  ESTIMATE_EN: 'A survey found the rate is about one in a thousand in the sample, so in the wider population it is about one in a thousand too.',
  NEG_EN: 'The match has a 1-in-a-million chance if he is innocent, so the chance he is innocent is not 1-in-a-million.',
};

// 先验：基线全对
let bad = 0;
for (const [k, s] of Object.entries(ATT)) {
  const r = M.checkConditionalTransposition(s);
  if (!r.hit) { console.log(`基线攻击 ${k} 未命中 <<<`); bad++; }
}
for (const [k, s] of Object.entries(TRAP)) {
  const r = M.checkConditionalTransposition(s);
  if (r.hit) { console.log(`基线陷阱 ${k} 误命中 <<< ${r.detail.slice(0, 60)}`); bad++; }
}
console.log(`基线检查: ${bad === 0 ? '全对' : bad + ' 项异常'}`);

const NEVER = /(?!x)x/;
const results = [];
function injectTest(name, inj, expectStopKeys, expectTrapKeys) {
  let ok = true;
  const notes = [];
  for (const k of expectStopKeys) {
    const r = M.checkConditionalTransposition(ATT[k], inj);
    if (r.hit) { ok = false; notes.push(`${k} 仍命中`); }
  }
  for (const k of expectTrapKeys) {
    const r = M.checkConditionalTransposition(TRAP[k], inj);
    if (!r.hit) { ok = false; notes.push(`${k} 未转命中`); }
  }
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${notes.length ? ' — ' + notes.join('; ') : ''}`);
}

injectTest('FRAME_ZH=[] → ZH攻击停', { FRAME_ZH: [] }, ['zh1', 'zh2', 'zh3'], []);
injectTest('FRAME_EN=[] → EN攻击停', { FRAME_EN: [] }, ['en1', 'en2', 'en3'], []);
injectTest('INFER_ZH=永假 → ZH攻击停', { INFER_ZH: NEVER }, ['zh1', 'zh2', 'zh3'], []);
injectTest('INFER_EN=永假 → EN攻击停', { INFER_EN: NEVER }, ['en1', 'en2', 'en3'], []);
injectTest('EXTREME_ZH=[] → 无数值形停', { EXTREME_ZH: [] }, ['zh2'], []);
injectTest('EXTREME_EN=[] → 无数值形停', { EXTREME_EN: [] }, ['en2'], []);
injectTest('ZH_VALUE_RES=[] → ZH数值攻击停', { ZH_VALUE_RES: [] }, ['zh1', 'zh3'], []);
injectTest('EN_VALUE_RES=[] → EN数值攻击停', { EN_VALUE_RES: [] }, ['en1', 'en3'], []);
injectTest('NEG_ZH=永假 → 否定陷阱转命中', { NEG_ZH: NEVER }, [], ['NEG_ZH']);
injectTest('NEG_EN=永假 → 否定陷阱转命中', { NEG_EN: NEVER }, [], ['NEG_EN']);
injectTest('EXEMPT_BASERATE_ZH=[] → 陷阱转命中', { EXEMPT_BASERATE_ZH: [] }, [], ['BASERATE_ZH']);
injectTest('EXEMPT_BASERATE_EN=[] → 陷阱转命中', { EXEMPT_BASERATE_EN: [] }, [], ['BASERATE_EN']);
injectTest('EXEMPT_CORRECT_ZH=[] → 陷阱转命中', { EXEMPT_CORRECT_ZH: [] }, [], ['CORRECT_ZH']);
injectTest('EXEMPT_CORRECT_EN=[] → 陷阱转命中', { EXEMPT_CORRECT_EN: [] }, [], ['CORRECT_EN']);
injectTest('EXEMPT_META_ZH=[] → 陷阱转命中', { EXEMPT_META_ZH: [] }, [], ['META_ZH']);
injectTest('EXEMPT_META_EN=[] → 陷阱转命中', { EXEMPT_META_EN: [] }, [], ['META_EN']);
injectTest('EXEMPT_ESTIMATE_ZH=[] → 陷阱转命中', { EXEMPT_ESTIMATE_ZH: [] }, [], ['ESTIMATE_ZH']);
injectTest('EXEMPT_ESTIMATE_EN=[] → 陷阱转命中', { EXEMPT_ESTIMATE_EN: [] }, [], ['ESTIMATE_EN']);

for (const r of results) console.log(r);
console.log(`注入 ${results.length} 个：${results.filter(r => r.startsWith('PASS')).length} 个变红，${results.filter(r => r.startsWith('FAIL')).length} 个未变红`);
