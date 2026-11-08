/**
 * test/planning-fallacy.test.js — r255 计划谬误维度测试
 * 覆盖：攻击命中（双腿型中英 + 独腿签名中英）、良性零误伤（含疑难 FP 压力
 * 样本）、两组豁免族（概念教学 / 正确估计口径，嵌入真实签名，可负例注入
 * 证明承重）、边界锁（单腿句 / 邻接维度领地 / 防自证同跨度 / 超距 / 倒装 /
 * 限幅守卫 / 否定守卫）、多签名档位、负例注入（腿①十组 + 腿②五组 + 独腿
 * 3+2 条逐条 / 距离窗双向承重 / 两组豁免中英删除）、官方良性语料 272、
 * 引擎闸。
 * 与 r218-r254 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectPlanningFallacy, __internals } = require('../src/planning-fallacy.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组常量）
const NEVER = /(?!)/;
const I = __internals();

// ─── 攻击样本 A：双腿型（腿①意愿表达 × 腿②工期结论，邻近共现）─────
const ATTACK_2LEG_ZH = [
  '这个项目看起来很紧，但加把劲两个月肯定能上线，以前也都赶出来了',
  '别参考什么历史数据，团队拼一下，三个月足够把系统重写完了',
  '虽然类似项目都延期了，但我们这次不同，年底前一定交付',
  '加加班什么都赶出来了，工期排一个月绝对够，不用留缓冲',
  '客户催得急，咱们连轴转，两周就能把合同全部谈完',
  '迁移数据库能有多难，两个工程师一周搞定，网上教程多得很',
  '别人三个月我们也三个月，咬咬牙就过去了，肯定来得及',
  '装修两个月肯定弄得好，师傅说简单，旁边那家慢了是他们不行',
  '别听咨询公司的悲观估计，凭我们的决心，半年足够占领市场',
  '搬家一天就能完事，叫辆车的事，之前想得太复杂了',
  '大家连轴转赶工，一个月就能交付',
  // 倒装：工期结论在前、意愿表达在后
  '两个月肯定能上线，大家加把劲',
];
const ATTACK_2LEG_EN = [
  'The timeline looks tight, but with enough effort we will ship in two months for sure',
  'Similar projects ran late, but we are different; we will deliver by year end',
  'Everyone just needs to push harder and the rewrite will be done in a month',
  'How hard can the migration be? Two engineers, one week, done',
  'Forget the consultants pessimistic numbers; with our drive we will win the market in six months',
  'Moving house is a one-day job, just rent a truck, we overthought it',
];

// ─── 攻击样本 B：独腿签名（SOLO，一句话内部自带意愿×工期完整结构）──
const SOLO_ZH_ATTACKS = [
  '加把劲，一周肯定搞定',                    // S0 努力压缩工期
  '肯定来得及，大家努努力',                  // S1 承诺 + 努力（倒装融合）
  '别参考历史数据，凭决心两个月上线',        // S2 排斥参照类的排期承诺
];
const SOLO_EN_ATTACKS = [
  'With enough effort we will ship in two months',        // E0 努力 + 工期
  'Forget the history, we will make the deadline',        // E1 排斥历史 + 承诺
];

// ─── 良性样本（不得命中：含疑难 FP 压力样本）────────────────────
const BENIGN_HARD = [
  // 正确估计口径（意愿 + 工期，但有参照类基准/缓冲/校准）
  '参照同类项目的历史工期，我们按中位数排了四个月，并留了两周缓冲',
  '这个项目看起来很紧，我们参考了去年三个类似项目的实际用时做了悲观估计',
  'Looking at how long similar projects actually took, we planned for five months',
  '虽然团队很有干劲，我们还是按外部基准排期，没有盲目乐观',
  '拼一下可以缩短时间，但我们需要用参照类数据校准这个估算',
  '装修按邻居家的实际工期估的，三周做完，周末不加班',
  '凭决心不够，我们用同类城市同类门店的历史数据做了测算',
  'Hard work helps, but we still anchor the estimate on reference-class data',
  '顾问给的工期偏悲观，我们取了三家同行实际用时的中位数',
  'We could push harder and ship in two months, but we planned for five months based on similar past projects',
  // 概念教学（讨论计划谬误/参照类这个概念本身）
  '计划谬误告诉我们别信内部视角，排期要看参照类',
  'Planning fallacy means ignoring the reference class when estimating schedules',
  ' Kahneman 用外部视角纠正工期估计的乐观偏差',
  // 单腿句：只有意愿无工期结论 / 只有工期结论无意愿腿
  '大家加班加点齐心协力，争取把活动办好',
  '项目排期两个月，含两周缓冲',
  'The project is scheduled for two months including a buffer',
  '团队士气高涨，干劲十足',
  // 邻接维度领地（wishful_thinking / false_precision / no_fallback）
  '我希望这个项目成功，所以它一定会成功',
  '工期精确到2.37个月，误差控制在小数点后两位',
  '如果延期我们就启动预案B，并提前通知客户',
  '迁移数据库需要专业DBA，我们评估过风险',
  // 翻转 / 批评 / 限定句式
  '不是加把劲就能上线的，得按流程来',
  '加把劲也未必能两个月上线，别拍脑袋',
  '两个月很紧，恐怕来不及，需要加人或者砍需求',
  'We could push harder, but two months is not realistic without more people',
  // 否定守卫压力样本
  '拼一下，工期肯定来得及不够，还得砍需求',
  'Similar projects ran late, so we should not assume we will deliver by year end',
];

// 防自证：同一段话不能既当意愿腿又当工期结论腿
const SELF_EVIDENCE = '项目肯定能完成';

// 超距样本：默认窗 W_ZH=60 内两腿不共现（尾部句只含工期结论腿，
// 避免意愿强度词在工期腿旁自配——r255 实证「肯定能上线」会在尾部
// 与工期腿相邻形成第二条真签名）
const OVERDIST = '加把劲' + '，'.repeat(80) + '项目排期两个月就能交付';

// 多签名样本
const MULTI_ZH = '加把劲，两个月肯定上线；别参考历史数据，三个月足够重写系统';
const MULTI_MIXED = '加把劲，两个月肯定上线。With enough effort we will ship in two months';

// 距离窗负例句：两腿分离（dist>0），W=0 即失配
const W0_ZH = ['加把劲，两个月肯定上线'];
const W0_EN = ['With enough effort we will ship in two months'];

// 单签名样本（不触发独腿族，用于 0.62 档位）
const SINGLE_ZH = '能有多难，两个工程师一周搞定';

const NO_WILL = {
  WILL_EFFORT_ZH: [], WILL_INTENSITY_ZH: [], WILL_REJECT_REF_ZH: [], WILL_DISMISS_ZH: [], WILL_MIMIC_ZH: [],
  WILL_EFFORT_EN: [], WILL_INTENSITY_EN: [], WILL_REJECT_REF_EN: [], WILL_DISMISS_EN: [], WILL_MIMIC_EN: [],
};
const NO_EST = {
  EST_DURATION_ZH: [], EST_COST_ZH: [], EST_PROMISE_ZH: [],
  EST_DURATION_EN: [], EST_PROMISE_EN: [],
};
const NO_BOTH = Object.assign({}, NO_WILL, NO_EST);
const NO_SOLO = { SOLO_ZH: [], SOLO_EN: [] };

// 腿①十组（含逐族独占句）
const WILL_GROUPS = [
  ['WILL_EFFORT_ZH', ['大家连轴转赶工，一个月就能交付']],
  ['WILL_INTENSITY_ZH', ['照这个进度，一定来得及，一个月就能完成']],
  ['WILL_REJECT_REF_ZH', ['别参考什么历史数据，团队两个月就能上线']],
  ['WILL_DISMISS_ZH', ['迁移数据库能有多难，两个工程师一周就能搞定']],
  ['WILL_MIMIC_ZH', ['别人两个月交付了，我们也能两个月搞定']],
  ['WILL_EFFORT_EN', ['The team is grinding it out, so we can ship in two weeks']],
  ['WILL_INTENSITY_EN', ['We will definitely finish the migration in a month']],
  ['WILL_REJECT_REF_EN', ['Forget the historical data, we can rewrite it in a month']],
  ['WILL_DISMISS_EN', ['How hard can the migration be? Two engineers, one week, done']],
  ['WILL_MIMIC_EN', ['They delivered in a month, so we can deliver in a month too']],
];
// 腿②五组（含逐族独占句）
const EST_GROUPS = [
  ['EST_DURATION_ZH', ['加把劲，两个月就能上线']],
  ['EST_COST_ZH', ['加把劲，预算方面花不了多少钱']],
  ['EST_PROMISE_ZH', ['齐心协力，年底前一定交付']],
  ['EST_DURATION_EN', ['With enough effort we will ship in two months']],
  ['EST_PROMISE_EN', ['Everyone just needs to push harder and we will definitely make the deadline']],
];

check('模块可加载且导出签名函数', () => {
  assert.equal(typeof detectPlanningFallacy, 'function');
  const r = detectPlanningFallacy('这个项目看起来很紧，但加把劲两个月肯定能上线，以前也都赶出来了');
  assert.equal(r.hit, true);
  assert.equal(r.dimension, 'planning_fallacy');
  assert.ok(r.details && r.details.includes('计划谬误'));
  assert.ok(r.guidance && r.guidance.length > 50);
  assert.ok(Array.isArray(r.evidence) && r.evidence.length >= 1);
  assert.ok(Array.isArray(r.tags) && r.tags.includes('planning-fallacy'));
});

check('攻击命中：双腿型中英', () => {
  for (const t of ATTACK_2LEG_ZH) assert.equal(detectPlanningFallacy(t).hit, true, 'ZH: ' + t);
  for (const t of ATTACK_2LEG_EN) assert.equal(detectPlanningFallacy(t).hit, true, 'EN: ' + t);
});

check('攻击命中：独腿签名中英', () => {
  for (const t of SOLO_ZH_ATTACKS) assert.equal(detectPlanningFallacy(t).hit, true, 'SOLO_ZH: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(detectPlanningFallacy(t).hit, true, 'SOLO_EN: ' + t);
});

check('良性零误伤：疑难 FP 压力样本', () => {
  for (const t of BENIGN_HARD) assert.equal(detectPlanningFallacy(t).hit, false, '误伤: ' + t);
});

check('防自证：同跨度不得一话两证', () => {
  assert.equal(detectPlanningFallacy(SELF_EVIDENCE).hit, false);
});

check('档位：单签名 0.62 / 多签名 0.72', () => {
  const one = detectPlanningFallacy(SINGLE_ZH);
  assert.equal(one.hit, true);
  assert.equal(one.count, 1, '单签名 count=1，实际 ' + one.count);
  assert.ok(Math.abs(one.score - 0.62) < 1e-9, '单签名 0.62');
  const multi = detectPlanningFallacy(MULTI_ZH);
  assert.equal(multi.hit, true);
  assert.ok(multi.count >= 2, '多签名');
  assert.ok(Math.abs(multi.score - 0.72) < 1e-9, '多签名 0.72');
  const mixed = detectPlanningFallacy(MULTI_MIXED);
  assert.equal(mixed.hit, true);
  assert.ok(mixed.count >= 2, '中英混排多签名');
  assert.ok(Math.abs(mixed.score - 0.72) < 1e-9, '中英混排 0.72');
});

check('负例注入：腿①意愿表达整族删除后双腿攻击全部不再命中', () => {
  for (const t of ATTACK_2LEG_ZH) assert.equal(detectPlanningFallacy(t, Object.assign({}, NO_WILL, NO_SOLO)).hit, false, '删腿①ZH: ' + t);
  for (const t of ATTACK_2LEG_EN) assert.equal(detectPlanningFallacy(t, Object.assign({}, NO_WILL, NO_SOLO)).hit, false, '删腿①EN: ' + t);
});

check('负例注入：腿②工期结论整族删除后双腿攻击全部不再命中', () => {
  for (const t of ATTACK_2LEG_ZH) assert.equal(detectPlanningFallacy(t, Object.assign({}, NO_EST, NO_SOLO)).hit, false, '删腿②ZH: ' + t);
  for (const t of ATTACK_2LEG_EN) assert.equal(detectPlanningFallacy(t, Object.assign({}, NO_EST, NO_SOLO)).hit, false, '删腿②EN: ' + t);
});

check('负例注入：腿①十组逐组删除后该组独占攻击失配', () => {
  for (const [g, list] of WILL_GROUPS) {
    const inj = Object.assign({}, NO_SOLO);
    inj[g] = [];
    for (const t of list) {
      assert.equal(detectPlanningFallacy(t, NO_SOLO).hit, true, '默认应命中: ' + t);
      assert.equal(detectPlanningFallacy(t, inj).hit, false, '删 ' + g + ' 后应失配: ' + t);
    }
  }
});

check('负例注入：腿②五组逐组删除后该组独占攻击失配', () => {
  for (const [g, list] of EST_GROUPS) {
    const inj = Object.assign({}, NO_SOLO);
    inj[g] = [];
    for (const t of list) {
      assert.equal(detectPlanningFallacy(t, NO_SOLO).hit, true, '默认应命中: ' + t);
      assert.equal(detectPlanningFallacy(t, inj).hit, false, '删 ' + g + ' 后应失配: ' + t);
    }
  }
});

check('负例注入：独腿签名逐条删除后对应攻击失配（NO_BOTH 隔离双腿）', () => {
  I.SOLO_ZH.forEach((_, i) => {
    const inj = Object.assign({ SOLO_ZH: I.SOLO_ZH.slice(0, i).concat(I.SOLO_ZH.slice(i + 1)) }, NO_BOTH);
    const t = SOLO_ZH_ATTACKS[i];
    assert.equal(detectPlanningFallacy(t, NO_BOTH).hit, true, 'NO_BOTH 下应经独腿命中: ' + t);
    assert.equal(detectPlanningFallacy(t, inj).hit, false, '删 SOLO_ZH[' + i + '] 后应失配: ' + t);
  });
  I.SOLO_EN.forEach((_, i) => {
    const inj = Object.assign({ SOLO_EN: I.SOLO_EN.slice(0, i).concat(I.SOLO_EN.slice(i + 1)) }, NO_BOTH);
    const t = SOLO_EN_ATTACKS[i];
    assert.equal(detectPlanningFallacy(t, NO_BOTH).hit, true, 'NO_BOTH 下应经独腿命中: ' + t);
    assert.equal(detectPlanningFallacy(t, inj).hit, false, '删 SOLO_EN[' + i + '] 后应失配: ' + t);
  });
});

check('负例注入：独腿签名整族删除后独腿攻击全部不再命中', () => {
  for (const t of SOLO_ZH_ATTACKS) assert.equal(detectPlanningFallacy(t, NO_BOTH).hit, true, 'NO_BOTH: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(detectPlanningFallacy(t, NO_BOTH).hit, true, 'NO_BOTH: ' + t);
  for (const t of SOLO_ZH_ATTACKS) assert.equal(detectPlanningFallacy(t, Object.assign({ SOLO_ZH: [], SOLO_EN: [] }, NO_BOTH)).hit, false, '删独腿: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(detectPlanningFallacy(t, Object.assign({ SOLO_ZH: [], SOLO_EN: [] }, NO_BOTH)).hit, false, '删独腿: ' + t);
});

check('负例注入：距离窗双向承重（默认窗超距不命中，放大到 500 后命中）', () => {
  assert.equal(detectPlanningFallacy(OVERDIST).hit, false, '默认 W_ZH=60 超距不命中');
  assert.equal(detectPlanningFallacy(OVERDIST, { W_ZH: 500 }).hit, true, '放大窗后命中（窗承重）');
});

check('负例注入：距离窗收紧到 0 后双腿攻击全部不再命中', () => {
  for (const t of W0_ZH) assert.equal(detectPlanningFallacy(t, Object.assign({ W_ZH: 0 }, NO_SOLO)).hit, false, 'W_ZH=0: ' + t);
  for (const t of W0_EN) assert.equal(detectPlanningFallacy(t, Object.assign({ W_EN: 0 }, NO_SOLO)).hit, false, 'W_EN=0: ' + t);
});

check('负例注入：概念教学豁免（中英）删除后豁免句变红（承重证明）', () => {
  const zh = '加把劲，两个月肯定上线——这就是计划谬误的典型样子';
  const en = 'With enough effort we will ship in two months — that is the planning fallacy in action';
  assert.equal(detectPlanningFallacy(zh).hit, false, '概念教学ZH 默认豁免');
  assert.equal(detectPlanningFallacy(zh, { CONCEPT_ZH: NEVER }).hit, true, '删概念教学ZH 后变红');
  assert.equal(detectPlanningFallacy(en).hit, false, '概念教学EN 默认豁免');
  assert.equal(detectPlanningFallacy(en, { CONCEPT_EN: NEVER }).hit, true, '删概念教学EN 后变红');
});

check('负例注入：正确估计口径豁免（中英）删除后豁免句变红（承重证明）', () => {
  const zh = '尽管可以拼一下、两个月就上线，我们还是按同类项目历史工期的中位数排了五个月';
  const en = 'We could push harder and ship in two months, but we planned for five months based on similar past projects';
  assert.equal(detectPlanningFallacy(zh).hit, false, '正确估计口径ZH 默认豁免');
  assert.equal(detectPlanningFallacy(zh, { CORRECTIVE_ZH: NEVER }).hit, true, '删正确估计口径ZH 后变红');
  assert.equal(detectPlanningFallacy(en).hit, false, '正确估计口径EN 默认豁免');
  assert.equal(detectPlanningFallacy(en, { CORRECTIVE_EN: NEVER }).hit, true, '删正确估计口径EN 后变红');
});

check('边界：空输入 / 非字符串 / 过短文本不崩', () => {
  for (const v of [undefined, null, '', '   ', 123, {}, [], '加油']) {
    const r = detectPlanningFallacy(v);
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
  for (const c of corpora) if (detectPlanningFallacy(c.text).hit) { hits++; console.log('    [误命中] (' + c.src + ') ' + c.text.slice(0, 90)); }
  assert.equal(hits, 0, '官方良性语料误命中 ' + hits + ' 条');
});

check('引擎闸：模块未接线时 gate() 不得出现 planning_fallacy findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.gate;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    assert.ok(!dims.includes('planning_fallacy'), '误伤: ' + t);
  }
  // 模块未接线（provisional 243），接线规格由 1 号按报告 §五 补全；此处
  // 只锁定「不因本模块引入新误伤」与「gate 返回结构完整」。
  const out = gate('这个项目看起来很紧，但加把劲两个月肯定能上线，以前也都赶出来了');
  assert.ok(out && typeof out.gate === 'object', 'gate 返回结构完整');
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
