/**
 * test/fundamental-attribution-error.test.js — r256 基本归因错误维度测试
 * 覆盖：攻击命中（双腿型中英 + 独腿签名中英）、良性零误伤（含疑难 FP 压力
 * 样本）、三组豁免（概念教学 / 双向归因 / 疑问句，嵌入真实签名，可负例注入
 * 证明承重）、边界锁（单腿句 / 邻接维度领地 / 防自证同跨度 / 超距 / 倒装 /
 * 限幅守卫 / 否定守卫 / 自我归因守卫）、多签名档位、负例注入（腿①八组 +
 * 腿②八组 + 独腿 2+2 条逐条 / 距离窗双向承重 / 三组豁免中英删除）、官方
 * 良性语料 326、引擎闸。
 * 与 r218-r255 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectFundamentalAttributionError, __internals } = require('../src/fundamental-attribution-error.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组常量）
const NEVER = /(?!)/;
const I = __internals();

const D = (t, inj) => detectFundamentalAttributionError(t, inj || null);

// ─── 攻击样本 A：双腿型（腿①内在特质归因 × 腿②情境排斥，邻近共现）─────
const ATTACK_2LEG_ZH = [
  '他会迟到就是因为不负责，别找客观原因',
  '穷人穷是因为他们懒，不要提什么环境因素',
  '他能成功全靠天赋，运气和时代背景都不值一提',
  '这些人失败纯粹是因为能力差，跟资源分配没关系',
  '员工离职就是嫌钱少，别谈什么发展空间',
  '他抑郁就是想不开，哪有那么多外界压力',
  '公司亏损根子是管理层能力差，别怪市场环境',
  '她升职慢完全是情商低，跟公司文化没关系',
  '他这次迟到，是他态度的问题，别扯什么交通',
  // 倒装：情境排斥在前、特质归因在后
  '别找客观原因，他迟到纯粹是因为他自己不负责',
];
const ATTACK_2LEG_EN = [
  'He is late because he is irresponsible; stop making excuses',
  'Poor people are poor because they are lazy, never mind circumstances',
  'She succeeded purely through talent; luck and timing are irrelevant',
  'They failed simply because they are incompetent; it has nothing to do with resources',
  'The project failed because the team lacked discipline; do not blame the market',
  'He is depressed because he cannot let go; spare me the external pressure',
];

// ─── 攻击样本 B：独腿签名（SOLO，一句话内部自带特质归因×情境排斥）──
const SOLO_ZH_ATTACKS = [
  '就是不负责，别找借口',                              // T1 特质 + 排斥指令
  '别找客观原因，他就是不负责',                        // T2 排斥指令 + 特质（倒装）
];
const SOLO_EN_ATTACKS = [
  'He is just lazy, no excuses',                       // E1 trait + no excuses
  'No excuses, he is simply incompetent',              // E2 no excuses + trait
];

// ─── 良性样本（不得命中：含疑难 FP 压力样本）────────────────────
const BENIGN_HARD = [
  // 双向归因（性格与情境两侧并举是正当做法）
  '我们会同时考虑个人责任和情境约束，不把结果全归因于性格',
  'We weigh both disposition and situational factors before judging him',
  '评价绩效时既要看个人选择，也要看资源配置，不能只推给一方',
  'It is not just his character; the circumstances played a real role too',
  // 概念教学（讨论基本归因错误/归因偏差这个概念本身）
  '基本归因错误告诉我们别把迟到全归因于性格',
  'Fundamental attribution error means overweighting dispositional explanations',
  '组织行为学里的通信偏误讲的就是高估性格、低估情境',
  // 自我归因（第一人称自省，不是评判他人）
  '我这次失败纯粹是因为我懒，别找借口',
  'I failed because I was lazy; no excuses',
  // 疑问句（质疑该归因本身）
  '他迟到真的只是因为他懒吗？',
  'Is his lateness really just about his attitude?',
  // 单腿句：只有特质归因 / 只有情境排斥
  '他这人就是不负责',
  'He is simply irresponsible',
  '别找借口，先看数据',
  'No excuses, let us look at the data',
  // 邻接维度领地（blame_externalization 自我归责讨债 / stereotype_origin 出身标签）
  '这件事全是市场的错，我一点责任都没有',
  '项目失败都怪客户难缠，我们团队没有任何问题',
  '年轻人就是不踏实，别指望他们',
  '他又没少块肉，这点批评算什么伤害',
  // 翻转 / 批评 / 限定句式
  '不能把失败全归于个人，制度设计也要检讨',
  '他不负责只是其中一个因素，资源不足同样关键',
  'It is not that he is lazy; the workload was genuinely impossible',
  '说他不负责未必对，他连续加了三个月班',
];

// 防自证：同一段话不能既当特质归因腿又当情境排斥腿
const SELF_EVIDENCE = '他不负责';

// 超距样本：默认窗 W_ZH=60 内两腿不共现（尾部句只含情境排斥腿）
const OVERDIST = '他会迟到就是因为不负责' + '，'.repeat(80) + '别找客观原因';

// 多签名样本
const MULTI_ZH = '他会迟到就是因为不负责，别找客观原因；穷人穷是因为他们懒，不要提什么环境因素';
const MULTI_MIXED = '他会迟到就是因为不负责，别找客观原因。He is late because he is irresponsible; stop making excuses';

// 距离窗负例句：两腿分离（dist>0），W=0 即失配
const W0_ZH = ['他会迟到就是因为不负责，别找客观原因'];
const W0_EN = ['He is late because he is irresponsible; stop making excuses'];

// 单签名样本（不触发独腿族，用于 0.62 档位；特质腿与排斥腿间隔 7 字，
// 超出 SOLO_ZH 的 6 字融合窗，确保只经双腿命中）
const SINGLE_ZH = '他会迟到，根本原因就是这个人不负责，所以各位也都别去找客观原因了';

const NO_DISP = {
  DISP_MARK_TRAIT_ZH: [], DISP_PROBLEM_ZH: [], DISP_SO_ZH: [], DISP_ONLY_ZH: [], DISP_COMPLAIN_ZH: [],
  DISP_MARK_TRAIT_EN: [], DISP_OWN_FAULT_EN: [], DISP_TRAIT_ADJ_EN: [],
};
const NO_SITD = {
  SITD_REJECT_ZH: [], SITD_DEBASE_ZH: [], SITD_DENY_ZH: [], SITD_HOWMUCH_ZH: [],
  SITD_REJECT_EN: [], SITD_DEBASE_EN: [], SITD_DENY_EN: [], SITD_NO_EXCUSE_EN: [],
};
const NO_SOLO = { SOLO_ZH: [], SOLO_EN: [] };

// 腿①八组（含逐族独占句）
const DISP_GROUPS = [
  ['DISP_MARK_TRAIT_ZH', ['他会迟到就是因为不负责，别找客观原因']],
  ['DISP_PROBLEM_ZH', ['他这次迟到，是他态度的问题，别扯什么交通']],
  ['DISP_SO_ZH', ['他本性如此，所以才会一次次迟到，别找客观原因']],
  ['DISP_ONLY_ZH', ['问题只出在他自己身上，别怪环境']],
  ['DISP_COMPLAIN_ZH', ['员工离职就是嫌钱少，别谈什么发展空间']],
  ['DISP_MARK_TRAIT_EN', ['He is late because he is irresponsible; stop making excuses']],
  ['DISP_OWN_FAULT_EN', ['He has only himself to blame; stop making excuses']],
  ['DISP_TRAIT_ADJ_EN', ['He is just lazy, no excuses']],
];
// 腿②八组（含逐族独占句）
const SITD_GROUPS = [
  ['SITD_REJECT_ZH', ['他会迟到就是因为不负责，别找客观原因']],
  ['SITD_DEBASE_ZH', ['他能成功全靠天赋，运气和时代背景都不值一提']],
  ['SITD_DENY_ZH', ['这些人失败纯粹是因为能力差，跟资源分配没关系']],
  ['SITD_HOWMUCH_ZH', ['他抑郁就是想不开，哪有那么多外界压力']],
  ['SITD_REJECT_EN', ['He is late because he is irresponsible; stop making excuses']],
  ['SITD_DEBASE_EN', ['She succeeded purely through talent; luck and timing are irrelevant']],
  ['SITD_DENY_EN', ['They failed simply because they are incompetent; it has nothing to do with resources']],
  ['SITD_NO_EXCUSE_EN', ['He is late because he is irresponsible; that is no excuse']],
];

check('模块可加载且导出签名函数', () => {
  assert.equal(typeof detectFundamentalAttributionError, 'function');
  const r = D('他会迟到就是因为不负责，别找客观原因');
  assert.equal(r.hit, true);
  assert.equal(r.dimension, 'fundamental_attribution_error');
  assert.ok(r.details && r.details.includes('基本归因错误'));
  assert.ok(r.guidance && r.guidance.length > 50);
  assert.ok(Array.isArray(r.evidence) && r.evidence.length >= 1);
  assert.ok(Array.isArray(r.tags) && r.tags.includes('fundamental-attribution-error'));
});

check('攻击命中：双腿型中英', () => {
  for (const t of ATTACK_2LEG_ZH) assert.equal(D(t).hit, true, 'ZH: ' + t);
  for (const t of ATTACK_2LEG_EN) assert.equal(D(t).hit, true, 'EN: ' + t);
});

check('攻击命中：独腿签名中英', () => {
  for (const t of SOLO_ZH_ATTACKS) assert.equal(D(t).hit, true, 'SOLO_ZH: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(D(t).hit, true, 'SOLO_EN: ' + t);
});

check('良性零误伤：疑难 FP 压力样本', () => {
  for (const t of BENIGN_HARD) assert.equal(D(t).hit, false, '误伤: ' + t);
});

check('防自证：同跨度不得一话两证', () => {
  assert.equal(D(SELF_EVIDENCE).hit, false);
});

check('档位：单签名 0.62 / 多签名 0.72', () => {
  const one = D(SINGLE_ZH);
  assert.equal(one.hit, true);
  assert.equal(one.count, 1, '单签名 count=1，实际 ' + one.count);
  assert.ok(Math.abs(one.score - 0.62) < 1e-9, '单签名 0.62');
  const multi = D(MULTI_ZH);
  assert.equal(multi.hit, true);
  assert.ok(multi.count >= 2, '多签名');
  assert.ok(Math.abs(multi.score - 0.72) < 1e-9, '多签名 0.72');
  const mixed = D(MULTI_MIXED);
  assert.equal(mixed.hit, true);
  assert.ok(mixed.count >= 2, '中英混排多签名');
  assert.ok(Math.abs(mixed.score - 0.72) < 1e-9, '中英混排 0.72');
});

check('负例注入：腿①内在特质归因整族删除后双腿攻击全部不再命中', () => {
  for (const t of ATTACK_2LEG_ZH) assert.equal(D(t, Object.assign({}, NO_DISP, NO_SOLO)).hit, false, '删腿①ZH: ' + t);
  for (const t of ATTACK_2LEG_EN) assert.equal(D(t, Object.assign({}, NO_DISP, NO_SOLO)).hit, false, '删腿①EN: ' + t);
});

check('负例注入：腿②情境排斥整族删除后双腿攻击全部不再命中', () => {
  for (const t of ATTACK_2LEG_ZH) assert.equal(D(t, Object.assign({}, NO_SITD, NO_SOLO)).hit, false, '删腿②ZH: ' + t);
  for (const t of ATTACK_2LEG_EN) assert.equal(D(t, Object.assign({}, NO_SITD, NO_SOLO)).hit, false, '删腿②EN: ' + t);
});

check('负例注入：腿①八组逐组删除后该组独占攻击失配', () => {
  for (const [g, list] of DISP_GROUPS) {
    const inj = Object.assign({}, NO_SOLO);
    inj[g] = [];
    for (const t of list) {
      assert.equal(D(t, NO_SOLO).hit, true, '默认应命中: ' + t);
      assert.equal(D(t, inj).hit, false, '删 ' + g + ' 后应失配: ' + t);
    }
  }
});

check('负例注入：腿②八组逐组删除后该组独占攻击失配', () => {
  for (const [g, list] of SITD_GROUPS) {
    const inj = Object.assign({}, NO_SOLO);
    inj[g] = [];
    for (const t of list) {
      assert.equal(D(t, NO_SOLO).hit, true, '默认应命中: ' + t);
      assert.equal(D(t, inj).hit, false, '删 ' + g + ' 后应失配: ' + t);
    }
  }
});

check('负例注入：独腿签名逐条删除后对应攻击失配（NO_DISP+NO_SITD 隔离双腿）', () => {
  const NO_BOTH = Object.assign({}, NO_DISP, NO_SITD);
  I.SOLO_ZH.forEach((_, i) => {
    const inj = Object.assign({ SOLO_ZH: I.SOLO_ZH.slice(0, i).concat(I.SOLO_ZH.slice(i + 1)) }, NO_BOTH);
    const t = SOLO_ZH_ATTACKS[i];
    assert.equal(D(t, NO_BOTH).hit, true, 'NO_BOTH 下应经独腿命中: ' + t);
    assert.equal(D(t, inj).hit, false, '删 SOLO_ZH[' + i + '] 后应失配: ' + t);
  });
  I.SOLO_EN.forEach((_, i) => {
    const inj = Object.assign({ SOLO_EN: I.SOLO_EN.slice(0, i).concat(I.SOLO_EN.slice(i + 1)) }, NO_BOTH);
    const t = SOLO_EN_ATTACKS[i];
    assert.equal(D(t, NO_BOTH).hit, true, 'NO_BOTH 下应经独腿命中: ' + t);
    assert.equal(D(t, inj).hit, false, '删 SOLO_EN[' + i + '] 后应失配: ' + t);
  });
});

check('负例注入：独腿签名整族删除后独腿攻击全部不再命中', () => {
  const NO_BOTH = Object.assign({}, NO_DISP, NO_SITD);
  for (const t of SOLO_ZH_ATTACKS) assert.equal(D(t, NO_BOTH).hit, true, 'NO_BOTH: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(D(t, NO_BOTH).hit, true, 'NO_BOTH: ' + t);
  for (const t of SOLO_ZH_ATTACKS) assert.equal(D(t, Object.assign({ SOLO_ZH: [], SOLO_EN: [] }, NO_BOTH)).hit, false, '删独腿: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(D(t, Object.assign({ SOLO_ZH: [], SOLO_EN: [] }, NO_BOTH)).hit, false, '删独腿: ' + t);
});

check('负例注入：距离窗双向承重（默认窗超距不命中，放大到 500 后命中）', () => {
  assert.equal(D(OVERDIST).hit, false, '默认 W_ZH=60 超距不命中');
  assert.equal(D(OVERDIST, { W_ZH: 500 }).hit, true, '放大窗后命中（窗承重）');
});

check('负例注入：距离窗收紧到 0 后双腿攻击全部不再命中', () => {
  for (const t of W0_ZH) assert.equal(D(t, Object.assign({ W_ZH: 0 }, NO_SOLO)).hit, false, 'W_ZH=0: ' + t);
  for (const t of W0_EN) assert.equal(D(t, Object.assign({ W_EN: 0 }, NO_SOLO)).hit, false, 'W_EN=0: ' + t);
});

check('负例注入：概念教学豁免（中英）删除后豁免句变红（承重证明）', () => {
  const zh = '他会迟到就是因为不负责，别找客观原因——这就是基本归因错误的典型样子';
  const en = 'He is late because he is irresponsible; stop making excuses — that is the fundamental attribution error in action';
  assert.equal(D(zh).hit, false, '概念教学ZH 默认豁免');
  assert.equal(D(zh, { CONCEPT_ZH: NEVER }).hit, true, '删概念教学ZH 后变红');
  assert.equal(D(en).hit, false, '概念教学EN 默认豁免');
  assert.equal(D(en, { CONCEPT_EN: NEVER }).hit, true, '删概念教学EN 后变红');
});

check('负例注入：双向归因豁免（中英）删除后豁免句变红（承重证明）', () => {
  const zh = '他迟到是因为不负责，别怪环境——我们会同时考虑个人责任和情境约束';
  const en = 'He is late because he is irresponsible; stop making excuses — we weigh both disposition and situational factors';
  assert.equal(D(zh).hit, false, '双向归因ZH 默认豁免');
  assert.equal(D(zh, { DUAL_ZH: NEVER }).hit, true, '删双向归因ZH 后变红');
  assert.equal(D(en).hit, false, '双向归因EN 默认豁免');
  assert.equal(D(en, { DUAL_EN: NEVER }).hit, true, '删双向归因EN 后变红');
});

check('负例注入：自我归因守卫删除后自省句变红（承重证明）', () => {
  const zh = '我这次失败纯粹是因为我懒，别找借口';
  assert.equal(D(zh).hit, false, '自我归因ZH 默认豁免');
  assert.equal(D(zh, { SELF_ZH: NEVER }).hit, true, '删自我归因守卫ZH 后变红');
  const en = 'I failed because I was lazy; no excuses';
  assert.equal(D(en).hit, false, '自我归因EN 默认豁免');
  assert.equal(D(en, { SELF_EN: NEVER }).hit, true, '删自我归因守卫EN 后变红');
});

check('边界：空输入 / 非字符串 / 过短文本不崩', () => {
  for (const v of [undefined, null, '', '   ', 123, {}, [], '懒']) {
    const r = D(v);
    assert.equal(r.hit, false, '不得命中: ' + JSON.stringify(v));
  }
});

check('官方良性语料 326 条零误命中', () => {
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
  for (const c of corpora) if (D(c.text).hit) { hits++; console.log('    [误命中] (' + c.src + ') ' + c.text.slice(0, 90)); }
  assert.equal(hits, 0, '官方良性语料误命中 ' + hits + ' 条');
});

check('引擎闸：模块未接线时 gate() 不得出现 fundamental_attribution_error findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.gate;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    assert.ok(!dims.includes('fundamental_attribution_error'), '误伤: ' + t);
  }
  // 模块未接线（provisional 244），接线规格由 1 号按报告 §五 补全；此处
  // 只锁定「不因本模块引入新误伤」与「gate 返回结构完整」。
  const out = gate('他会迟到就是因为不负责，别找客观原因');
  assert.ok(out && typeof out.gate === 'object', 'gate 返回结构完整');
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
