/**
 * test/money-illusion.test.js — r254 货币错觉维度测试
 * 覆盖：攻击命中（双腿型中英 + 独腿签名中英）、良性零误伤（含疑难 FP 压力
 * 样本）、两组豁免族（概念教学 / 正确价格口径，嵌入真实签名，可负例注入
 * 证明承重）、边界锁（单腿句 / 邻接维度领地 / 防自证同跨度 / 超距 / 倒装 /
 * 限幅守卫 / 否定守卫）、多签名档位、负例注入（腿①四组 + 腿②五组 + 独腿
 * 3+2 条逐条 / 距离窗双向承重 / 两组豁免中英删除）、官方良性语料 272、
 * 引擎闸。
 * 与 r218-r253 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectMoneyIllusion, __internals } = require('../src/money-illusion.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组常量）
const NEVER = /(?!)/;
const I = __internals();

// ─── 攻击样本 A：双腿型（腿①名义变动 × 腿②福利结论，邻近共现）─────
const ATTACK_2LEG_ZH = [
  '工资涨了5%，虽然物价涨了8%，但到手钱变多了，大家更富裕了',
  '名义GDP连年增长，这说明老百姓的日子越过越好了',
  '存款利率3%，通胀5%，但利息是实打实到账的，存钱不亏',
  '老李的退休金从三千涨到四千，涨了三分之一，他的养老待遇明显改善了',
  '虽然通胀吃掉了购买力，但名义收入年年创新高，说明工薪阶层收入在提高',
  '合同金额从一百万涨到一百二十万，数字上看我们收入提高了两成，公司更赚钱了',
  '最低工资标准上调了，打工到手的钱变多了，这就是实实在在的改善',
  '薪酬数字连年上调，虽然购买力打折，到手的钞票变厚了，日子更踏实',
  '地方政府税收名义额连创新高，说明财政实力显著增强',
  '以现价计算的公司营收一年内扩张了15%，企业真实经营规模在扩大',
  // 倒装：福利结论在前、名义变动在后
  '大家更富裕了，因为工资数字连年上调',
];
const ATTACK_2LEG_EN = [
  'Wages rose 5% while prices rose 8%, but people have more cash in hand, so they are better off',
  'Nominal GDP keeps growing, which shows living standards are improving',
  'The interest rate is 3% and inflation is 5%, but the interest payment is real money in the bank',
  'Salary numbers went up 20% year over year, so employees clearly earned more',
  'The face value of the payout doubled, so retirees are twice as well off',
  'Ticket prices doubled but attendance revenue doubled too, so the business is booming in real terms',
  'Although prices doubled, my paycheck in dollars is the highest ever, so I am doing better than before',
  'Her pension went from 3000 to 4000 dollars a month, so she is better off',
];

// ─── 攻击样本 B：独腿签名（SOLO，一句话内部自带名义≡福利的完整结构）──
const SOLO_ZH_ATTACKS = [
  '涨工资就是改善生活',              // S0 涨工资≡改善
  '名义增长就是共同富裕',            // S1 名义增长≡富裕
  '工资数字涨了就是收入提高',        // S2 工资数字≡收入提高
];
const SOLO_EN_ATTACKS = [
  'A nominal raise is a real improvement',   // E0 nominal raise ≡ real improvement
  'More dollars in hand means better off',   // E1 dollars in hand ≡ better off
];

// ─── 良性样本（不得命中：含疑难 FP 压力样本）────────────────────
const BENIGN_HARD = [
  // 正确价格口径（名义变动 + 价格调整，福利结论不成立或限定在名义）
  '工资涨了5%，物价涨了8%，扣除通胀实际工资其实是下降的',
  '名义GDP连年增长，但要扣除价格因素，实际增长没那么好看',
  '退休金从三千涨到四千，不过同期物价涨了不少，实际购买力提高有限',
  'Wages rose 5% and prices rose 8%, so real wages fell',
  'Nominal GDP grew, but adjusted for inflation the real gain was flat',
  '合同金额从一百万涨到一百二十万，但同期物价涨了25%，实际收入是下降的',
  '最低工资上调要对照物价涨幅，如果CPI涨得更多，实际最低工资反而降了',
  '营收名义增长15%，扣除成本上涨后实际利润几乎没动',
  'Salary rose 20% nominally, but inflation was 20%, so real pay was flat',
  '票息固定增加只是名义口径，实际收益要按真实利率折算',
  // 概念教学（讨论货币错觉/价格口径这个概念本身）
  '货币错觉告诉我们名义不等于实际，评价生活水平要用不变价',
  'Money illusion means nominal gains are not real gains when prices rise faster',
  '经济学家用费雪方程区分名义利率和实际利率',
  // 单腿句：只有名义变动无福利结论
  '这个月房租涨了两百，房东说是因为通胀',
  '债券按名义本金计算利息，这是标准条款',
  'The payout is fixed in nominal terms and does not adjust for inflation',
  '工资涨了5%',
  '老李的退休金从三千涨到四千',
  // 邻接维度领地（false_precision / statistical_misleading / 伪因果）
  '我们测得营收增长了15.37%，精确到小数点后两位',
  '统计口径把三个季度的数据平均后呈现，制造了平滑增长的印象',
  '把不同年份的数字直接相加对比，忽略了价格水平的变化',
  '通胀率3%，我把钱投了指数基金',
  '工资跑不赢通胀',
  // 翻转 / 批评 / 限定句式
  '工资数字涨了，但这不说明生活更富裕',
  '名义账户和实际账户要分清，不能混用',
  '按不变价计算的GDP增长才是实际增长',
  // 否定守卫压力样本
  '工资涨了5%，并不能说明大家更富裕',
  'Wages rose 5%, which does not mean people are better off',
  // 限幅守卫压力样本
  '工资涨了5%，大家富裕了一点点，但购买力提高有限',
];

// 防自证：同一段话不能既当名义变动又当福利结论
const SELF_EVIDENCE = '数字上看我们收入提高了两成';

// 超距样本：默认窗 W_ZH=60 内两腿不共现
const OVERDIST = '工资涨了5%' + '，'.repeat(80) + '大家更富裕了';

// 多签名样本
const MULTI_ZH = '工资涨了5%，大家更富裕了；名义GDP连年增长，说明日子越过越好';
const MULTI_MIXED = '工资涨了5%，大家更富裕了。Wages rose 5%, so people are better off';

// 距离窗负例句：两腿分离（dist>0），W=0 即失配
const W0_ZH = [
  '工资涨了5%，虽然物价涨了8%，但到手钱变多了，大家更富裕了',
  '老李的退休金从三千涨到四千，涨了三分之一，他的养老待遇明显改善了',
];
const W0_EN = [
  'Wages rose 5% while prices rose 8%, but people have more cash in hand, so they are better off',
];

const NO_NOMINAL = {
  NOMINAL_NOUN_VERB_ZH: [], NOMINAL_FROM_TO_ZH: [], NOMINAL_BASIS_ZH: [], NOMINAL_RATE_GAP_ZH: [],
  NOMINAL_NOUN_VERB_EN: [], NOMINAL_FROM_TO_EN: [], NOMINAL_BASIS_EN: [], NOMINAL_RATE_GAP_EN: [],
};
const NO_WELFARE = {
  WELFARE_RICH_ZH: [], WELFARE_LIFE_ZH: [], WELFARE_NOUN_VERB_ZH: [], WELFARE_STRENGTH_ZH: [],
  WELFARE_CASH_ZH: [], WELFARE_EN: [],
};
const NO_BOTH = Object.assign({}, NO_NOMINAL, NO_WELFARE);
const NO_SOLO = { SOLO_ZH: [], SOLO_EN: [] };

// 腿①八组（含逐族独占句）
const NOMINAL_GROUPS = [
  ['NOMINAL_NOUN_VERB_ZH', ['工资涨了5%，大家更富裕了']],
  ['NOMINAL_FROM_TO_ZH', ['他的进账从三千涨到四千，生活明显改善了']],
  ['NOMINAL_BASIS_ZH', ['名义GDP连年增长，这说明老百姓的日子越过越好了']],
  ['NOMINAL_RATE_GAP_ZH', ['存款利率3%，通胀5%，但利息是实打实到账的，存钱不亏']],
  ['NOMINAL_NOUN_VERB_EN', ['Salary numbers went up 20% year over year, so employees clearly earned more']],
  ['NOMINAL_FROM_TO_EN', ['Her pension went from 3000 to 4000 dollars a month, so she is better off']],
  ['NOMINAL_BASIS_EN', ['The face value of the payout doubled, so retirees are twice as well off']],
  ['NOMINAL_RATE_GAP_EN', ['The interest rate is 3% and inflation is 5%, but the interest payment is real money in the bank']],
];
// 腿②五组（含逐族独占句）
const WELFARE_GROUPS = [
  ['WELFARE_RICH_ZH', ['工资涨了5%，大家更富裕了']],
  ['WELFARE_LIFE_ZH', ['名义GDP连年增长，这说明老百姓的日子越过越好了']],
  ['WELFARE_NOUN_VERB_ZH', ['老李的退休金从三千涨到四千，他的养老待遇明显改善了']],
  ['WELFARE_STRENGTH_ZH', ['地方政府税收名义额连创新高，说明财政实力显著增强']],
  ['WELFARE_CASH_ZH', ['存款利率3%，通胀5%，但利息是实打实到账的，存钱不亏']],
  ['WELFARE_EN', ['Wages rose 5% while prices rose 8%, but people have more cash in hand, so they are better off']],
];

check('模块可加载且导出签名函数', () => {
  assert.equal(typeof detectMoneyIllusion, 'function');
  const r = detectMoneyIllusion('工资涨了5%，虽然物价涨了8%，但到手钱变多了，大家更富裕了');
  assert.equal(r.hit, true);
  assert.equal(r.dimension, 'money_illusion');
  assert.ok(r.details && r.details.includes('货币错觉'));
  assert.ok(r.guidance && r.guidance.length > 50);
  assert.ok(Array.isArray(r.evidence) && r.evidence.length >= 1);
  assert.ok(Array.isArray(r.tags) && r.tags.includes('money-illusion'));
});

check('攻击命中：双腿型中英', () => {
  for (const t of ATTACK_2LEG_ZH) assert.equal(detectMoneyIllusion(t).hit, true, 'ZH: ' + t);
  for (const t of ATTACK_2LEG_EN) assert.equal(detectMoneyIllusion(t).hit, true, 'EN: ' + t);
});

check('攻击命中：独腿签名中英', () => {
  for (const t of SOLO_ZH_ATTACKS) assert.equal(detectMoneyIllusion(t).hit, true, 'SOLO_ZH: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(detectMoneyIllusion(t).hit, true, 'SOLO_EN: ' + t);
});

check('良性零误伤：疑难 FP 压力样本', () => {
  for (const t of BENIGN_HARD) assert.equal(detectMoneyIllusion(t).hit, false, '误伤: ' + t);
});

check('防自证：同跨度不得一话两证', () => {
  assert.equal(detectMoneyIllusion(SELF_EVIDENCE).hit, false);
});

check('档位：单签名 0.62 / 多签名 0.72', () => {
  const one = detectMoneyIllusion('工资涨了5%，大家更富裕了');
  assert.equal(one.hit, true);
  assert.equal(one.count, 1);
  assert.ok(Math.abs(one.score - 0.62) < 1e-9, '单签名 0.62');
  const multi = detectMoneyIllusion(MULTI_ZH);
  assert.equal(multi.hit, true);
  assert.ok(multi.count >= 2, '多签名');
  assert.ok(Math.abs(multi.score - 0.72) < 1e-9, '多签名 0.72');
  const mixed = detectMoneyIllusion(MULTI_MIXED);
  assert.equal(mixed.hit, true);
  assert.ok(mixed.count >= 2, '中英混排多签名');
  assert.ok(Math.abs(mixed.score - 0.72) < 1e-9, '中英混排 0.72');
});

check('负例注入：腿①名义变动整族删除后双腿攻击全部不再命中', () => {
  for (const t of ATTACK_2LEG_ZH) assert.equal(detectMoneyIllusion(t, NO_NOMINAL).hit, false, '删腿①ZH: ' + t);
  for (const t of ATTACK_2LEG_EN) assert.equal(detectMoneyIllusion(t, NO_NOMINAL).hit, false, '删腿①EN: ' + t);
});

check('负例注入：腿②福利结论整族删除后双腿攻击全部不再命中', () => {
  for (const t of ATTACK_2LEG_ZH) assert.equal(detectMoneyIllusion(t, NO_WELFARE).hit, false, '删腿②ZH: ' + t);
  for (const t of ATTACK_2LEG_EN) assert.equal(detectMoneyIllusion(t, NO_WELFARE).hit, false, '删腿②EN: ' + t);
});

check('负例注入：腿①八组逐组删除后该组独占攻击失配', () => {
  for (const [g, list] of NOMINAL_GROUPS) {
    const inj = Object.assign({}, NO_SOLO);
    inj[g] = [];
    for (const t of list) {
      assert.equal(detectMoneyIllusion(t, NO_SOLO).hit, true, '默认应命中: ' + t);
      assert.equal(detectMoneyIllusion(t, inj).hit, false, '删 ' + g + ' 后应失配: ' + t);
    }
  }
});

check('负例注入：腿②六组逐组删除后该组独占攻击失配', () => {
  for (const [g, list] of WELFARE_GROUPS) {
    const inj = Object.assign({}, NO_SOLO);
    inj[g] = [];
    for (const t of list) {
      assert.equal(detectMoneyIllusion(t, NO_SOLO).hit, true, '默认应命中: ' + t);
      assert.equal(detectMoneyIllusion(t, inj).hit, false, '删 ' + g + ' 后应失配: ' + t);
    }
  }
});

check('负例注入：独腿签名逐条删除后对应攻击失配（NO_BOTH 隔离双腿）', () => {
  I.SOLO_ZH.forEach((_, i) => {
    const inj = Object.assign({ SOLO_ZH: I.SOLO_ZH.slice(0, i).concat(I.SOLO_ZH.slice(i + 1)) }, NO_BOTH);
    const t = SOLO_ZH_ATTACKS[i];
    assert.equal(detectMoneyIllusion(t, NO_BOTH).hit, true, 'NO_BOTH 下应经独腿命中: ' + t);
    assert.equal(detectMoneyIllusion(t, inj).hit, false, '删 SOLO_ZH[' + i + '] 后应失配: ' + t);
  });
  I.SOLO_EN.forEach((_, i) => {
    const inj = Object.assign({ SOLO_EN: I.SOLO_EN.slice(0, i).concat(I.SOLO_EN.slice(i + 1)) }, NO_BOTH);
    const t = SOLO_EN_ATTACKS[i];
    assert.equal(detectMoneyIllusion(t, NO_BOTH).hit, true, 'NO_BOTH 下应经独腿命中: ' + t);
    assert.equal(detectMoneyIllusion(t, inj).hit, false, '删 SOLO_EN[' + i + '] 后应失配: ' + t);
  });
});

check('负例注入：独腿签名整族删除后独腿攻击全部不再命中', () => {
  for (const t of SOLO_ZH_ATTACKS) assert.equal(detectMoneyIllusion(t, NO_BOTH).hit, true, 'NO_BOTH: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(detectMoneyIllusion(t, NO_BOTH).hit, true, 'NO_BOTH: ' + t);
  for (const t of SOLO_ZH_ATTACKS) assert.equal(detectMoneyIllusion(t, Object.assign({ SOLO_ZH: [], SOLO_EN: [] }, NO_BOTH)).hit, false, '删独腿: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(detectMoneyIllusion(t, Object.assign({ SOLO_ZH: [], SOLO_EN: [] }, NO_BOTH)).hit, false, '删独腿: ' + t);
});

check('负例注入：距离窗双向承重（默认窗超距不命中，放大到 500 后命中）', () => {
  assert.equal(detectMoneyIllusion(OVERDIST).hit, false, '默认 W_ZH=60 超距不命中');
  assert.equal(detectMoneyIllusion(OVERDIST, { W_ZH: 500 }).hit, true, '放大窗后命中（窗承重）');
});

check('负例注入：距离窗收紧到 0 后双腿攻击全部不再命中', () => {
  for (const t of W0_ZH) assert.equal(detectMoneyIllusion(t, { W_ZH: 0 }).hit, false, 'W_ZH=0: ' + t);
  for (const t of W0_EN) assert.equal(detectMoneyIllusion(t, { W_EN: 0 }).hit, false, 'W_EN=0: ' + t);
});

check('负例注入：概念教学豁免（中英）删除后豁免句变红（承重证明）', () => {
  const zh = '工资涨了5%，大家更富裕了，这就是货币错觉的典型表现';
  const en = 'Wages rose 5%, so people are better off — that is money illusion at work';
  assert.equal(detectMoneyIllusion(zh).hit, false, '概念教学ZH 默认豁免');
  assert.equal(detectMoneyIllusion(zh, { CONCEPT_ZH: NEVER }).hit, true, '删概念教学ZH 后变红');
  assert.equal(detectMoneyIllusion(en).hit, false, '概念教学EN 默认豁免');
  assert.equal(detectMoneyIllusion(en, { CONCEPT_EN: NEVER }).hit, true, '删概念教学EN 后变红');
});

check('负例注入：正确价格口径豁免（中英）删除后豁免句变红（承重证明）', () => {
  const zh = '工资涨了5%，物价涨了8%，按扣除通胀的口径，大家确实更富裕了';
  const en = 'Wages rose 5% and prices rose 8%, but deflated for inflation people are better off';
  assert.equal(detectMoneyIllusion(zh).hit, false, '正确价格口径ZH 默认豁免');
  assert.equal(detectMoneyIllusion(zh, { CORRECTIVE_ZH: NEVER }).hit, true, '删正确价格口径ZH 后变红');
  assert.equal(detectMoneyIllusion(en).hit, false, '正确价格口径EN 默认豁免');
  assert.equal(detectMoneyIllusion(en, { CORRECTIVE_EN: NEVER }).hit, true, '删正确价格口径EN 后变红');
});

check('边界：空输入 / 非字符串 / 过短文本不崩', () => {
  for (const v of [undefined, null, '', '   ', 123, {}, [], '工资']) {
    const r = detectMoneyIllusion(v);
    assert.equal(r.hit, false, '不得命中: ' + JSON.stringify(v));
  }
});

check('官方良性语料 272 条零误命中', () => {
  const path = require('node:path');
  const ROOT = path.join(__dirname, '..');
  const corpora = [];
  const push = (src, t) => { if (typeof t === 'string' && t.trim()) corpora.push({ src, text: t }); };
  const pick = (it) => (typeof it === 'string' ? it : (it && typeof it === 'object' ? (it.text || it.sample || it.input || it.prompt || it.content) : null));
  const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
  for (const [cat, arr] of Object.entries(gb.SAMPLES || {})) if (Array.isArray(arr)) for (const it of arr) push('gb:' + cat, pick(it));
  const ext = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
  for (const [k, v] of Object.entries(ext)) if (Array.isArray(v)) for (const it of v) push('ext:' + k, pick(it));
  const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
  for (const [cat, arr] of Object.entries(vb.CATEGORIES || {})) if (Array.isArray(arr)) for (const it of arr) push('vert:' + cat, pick(it));
  const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
  for (const [k, v] of Object.entries(bm)) if (Array.isArray(v)) for (const it of v) push('mixed:' + k, pick(it));
  assert.ok(corpora.length >= 270, '语料规模 ' + corpora.length);
  let hits = 0;
  for (const c of corpora) if (detectMoneyIllusion(c.text).hit) { hits++; console.log('    [误命中] (' + c.src + ') ' + c.text.slice(0, 90)); }
  assert.equal(hits, 0, '官方良性语料误命中 ' + hits + ' 条');
});

check('引擎闸：模块未接线时 gate() 不得出现 money_illusion findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.gate;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    assert.ok(!dims.includes('money_illusion'), '误伤: ' + t);
  }
  // 模块未接线（provisional 242），接线规格由 1 号按报告 §五 补全；此处
  // 只锁定「不因本模块引入新误伤」与「gate 返回结构完整」。
  const out = gate('工资涨了5%，虽然物价涨了8%，但到手钱变多了，大家更富裕了');
  assert.ok(out && typeof out.gate === 'object', 'gate 返回结构完整');
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
