/**
 * test/round-176-common-cause.js — r176 第 174 维度 common_cause
 * （共同原因谬误 / confounding factor）轮测。
 *
 * 判据三腿共现（缺一不判）：
 *   腿① COVARIATION：C-a 相关名词形（相关/关联，免并列结构）或
 *     C-b 共变动词形（同步上升/一起上升/同涨同跌/齐头并进/如影随形…）
 *     × 并列双变量结构（和/与/这[两几][个种]/二者…）；
 *   腿② CAUSAL 直接因果动词（导致/造成/带来/驱动/增加/源于/是…的原因…）
 *     与腿①双朝向 60 字窗共现（不收「说明/表明/证明」等推断词）；
 *   腿③ NO_CONFOUND：未点名/未控制共同因素。
 * 豁免：概念教学 / 实验证据 / 推理否定 / 对冲 / 已点名共同因素 / 疑问句。
 */
'use strict';
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { checkCommonCause, __internals } = require(path.join(ROOT, 'src/common-cause.js'));

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + ' — ' + e.message); }
}

// ─── 正向：攻击样本（中英双语 / 裸名词 / 带修饰 / 倒装 / 长句）──────────
const ATTACK_ZH = [
  '夏天冰淇淋销量和溺水死亡同步上升，说明吃冰淇淋导致溺水',
  '孩子身高和词汇量同步增长，说明背单词能让人长高',
  '度假胜地蚊香销量和登革热病例同步上升，蚊香导致登革热',
  'A 指标与 B 指标高度相关，可见 A 是 B 的原因',
  '这两个指标同涨同跌，说明其中一个驱动另一个',
  '过去五年里，公司广告投入和销售额一路同步上升，可见广告投入直接带来了增长',
  '吃冰淇淋导致了溺水——每年夏天，冰淇淋销量和溺水死亡都同步上升',
  'A 是 B 的原因，因为 A 与 B 高度相关',
  '近年来这两个变量齐头并进，说明前者拉高了后者',
  '咖啡销量和心脏病发病率一起上升，可见喝咖啡引发了心脏病',
  '新用户留存和客服满意度同步下降，看来客服水平造成了流失',
  '这两个序列高度相关，足以证明前者推动了后者',
];
const ATTACK_EN = [
  'Ice cream sales and drowning deaths rise together every summer, so ice cream causes drowning.',
  'The two metrics move in lockstep, which shows one drives the other.',
  'A and B are highly correlated, so A causes B.',
  'Rainy days and asthma attacks rise together, so rain causes asthma.',
  'Firefighters and fire damage move together, which means more firefighters create bigger losses.',
  'X and Y track each other closely, therefore X increases Y.',
];

// ─── 正向：良性样本（含边缘良性：正确多因陈述 / 同比对照 / 纯描述）─────
const BENIGN_ZH = [
  '冰淇淋销量与溺水死亡同因于气温，二者相关只是因为共同原因',
  '相关不等于因果，这是统计学的基本常识',
  '这两个指标同步上升，可能是同一个驱动因素造成的',
  '身高和词汇量同步增长，二者都由年龄驱动',
  'A 与 B 相关，但相关不等于因果，需要进一步验证',
  '在随机对照试验中，两组差异可以归因于处理',
  '这两个指标相关，但不能说明一个导致另一个',
  '城市人口和餐馆数量同步上升，反映了城市化进程',
  '销售额与去年同期同步上升，说明旺季策略见效了',
  '数据显示这两个指标同步上升，说明广告投入带来了增长',
  '这两个指标高度相关，说明背后有共同的驱动因素',
  '温度和冰淇淋销量一起上升，这是再正常不过的季节现象',
];
const BENIGN_EN = [
  'Ice cream sales and drownings both rise in summer, but they share a common cause — temperature.',
  'The two variables are correlated, which does not mean one causes the other.',
  'Height and vocabulary move together in children, but both are driven by age.',
  'Rainfall and umbrella sales rise together, yet rainfall does not cause umbrella sales.',
];

console.log('[r176] 第 174 维度 common_cause 轮测');

ok('攻击 ZH 全命中', () => {
  for (const s of ATTACK_ZH) {
    const r = checkCommonCause(s);
    assert(r.hit, '未命中: ' + s);
    assert(r.score > 0, 'score=0: ' + s);
  }
});
ok('攻击 EN 全命中', () => {
  for (const s of ATTACK_EN) {
    const r = checkCommonCause(s);
    assert(r.hit, '未命中: ' + s);
  }
});
ok('良性 ZH 零误判', () => {
  for (const s of BENIGN_ZH) {
    const r = checkCommonCause(s);
    assert(!r.hit, '误判: ' + s);
  }
});
ok('良性 EN 零误判', () => {
  for (const s of BENIGN_EN) {
    const r = checkCommonCause(s);
    assert(!r.hit, '误判: ' + s);
  }
});

// ─── 常量负例注入承重（置空后攻击必须翻转 miss / 良性陷阱必须翻转 hit）─
const inj = (obj, s) => checkCommonCause(s, obj);

ok('注入 COVARY_REL_ZH=[] 相关名词形攻击翻转', () => {
  const s = 'A 指标与 B 指标高度相关，可见 A 是 B 的原因';
  assert(checkCommonCause(s).hit, '注入前应命中');
  assert(!inj({ COVARY_REL_ZH: [] }, s).hit, '注入后应 miss');
});
ok('注入 COVARY_MOVE_ZH=[] 共变动词形攻击翻转', () => {
  const s = '夏天冰淇淋销量和溺水死亡同步上升，说明吃冰淇淋导致溺水';
  assert(checkCommonCause(s).hit, '注入前应命中');
  assert(!inj({ COVARY_MOVE_ZH: [] }, s).hit, '注入后应 miss');
});
ok('注入 PAIR_ZH=[] 指代结构攻击翻转', () => {
  const s = '这两个指标同涨同跌，说明其中一个驱动另一个';
  assert(checkCommonCause(s).hit, '注入前应命中');
  assert(!inj({ PAIR_ZH: [] }, s).hit, '注入后应 miss');
});
ok('注入 CAUSE_ZH=[] 因果动词攻击翻转', () => {
  const s = '度假胜地蚊香销量和登革热病例同步上升，蚊香导致登革热';
  assert(checkCommonCause(s).hit, '注入前应命中');
  assert(!inj({ CAUSE_ZH: [] }, s).hit, '注入后应 miss');
});
ok('注入 CAUSE_EN=[] 英文攻击翻转', () => {
  const s = 'Ice cream sales and drowning deaths rise together every summer, so ice cream causes drowning.';
  assert(checkCommonCause(s).hit, '注入前应命中');
  assert(!inj({ CAUSE_EN: [] }, s).hit, '注入后应 miss');
});
ok('注入 COVARY_MOVE_EN=[] 英文共变词翻转', () => {
  const s = 'The two metrics move in lockstep, which shows one drives the other.';
  assert(checkCommonCause(s).hit, '注入前应命中');
  assert(!inj({ COVARY_MOVE_EN: [] }, s).hit, '注入后应 miss');
});
ok('注入 COVARY_REL_EN=[] 英文相关名词翻转', () => {
  const s = 'A and B are highly correlated, so A causes B.';
  assert(checkCommonCause(s).hit, '注入前应命中');
  assert(!inj({ COVARY_REL_EN: [] }, s).hit, '注入后应 miss');
});
ok('陷阱翻转 NO_CONFOUND_ZH=[] 良性变攻击', () => {
  const s = '冰淇淋销量与溺水死亡同因于气温，二者相关，气温同时推高了这两个数字';
  assert(!checkCommonCause(s).hit, '注入前应 pass');
  assert(inj({ NO_CONFOUND_ZH: [] }, s).hit, '注入后应 hit');
});
ok('陷阱翻转 NO_CONFOUND_EN=[] 良性变攻击', () => {
  const s = 'Ice cream sales and drownings rise together in summer, but they share a common cause: temperature increases both.';
  assert(!checkCommonCause(s).hit, '注入前应 pass');
  assert(inj({ NO_CONFOUND_EN: [] }, s).hit, '注入后应 hit');
});
ok('陷阱翻转 EXEMPT_META_ZH=[] 概念教学变攻击', () => {
  const s = '教材里有这道题：A 和 B 同步上升，所以 A 导致 B';
  assert(!checkCommonCause(s).hit, '注入前应 pass');
  assert(inj({ EXEMPT_META_ZH: [] }, s).hit, '注入后应 hit');
});
ok('陷阱翻转 EXEMPT_NEG_ZH=[] 推理否定变攻击', () => {
  const s = '这两个指标相关，但不能说明一个导致另一个';
  assert(!checkCommonCause(s).hit, '注入前应 pass');
  assert(inj({ EXEMPT_NEG_ZH: [] }, s).hit, '注入后应 hit');
});
ok('陷阱翻转 EXEMPT_HEDGE_ZH=[] 对冲陈述变攻击', () => {
  const s = '这两个指标同步上升，可能是同一个驱动因素造成的';
  assert(!checkCommonCause(s).hit, '注入前应 pass');
  assert(inj({ EXEMPT_HEDGE_ZH: [] }, s).hit, '注入后应 hit');
});
ok('陷阱翻转 EXEMPT_EVID_ZH=[] 实验语境变攻击', () => {
  const s = '数据显示这两个指标同步上升，说明广告投入带来了增长';
  assert(!checkCommonCause(s).hit, '注入前应 pass');
  assert(inj({ EXEMPT_EVID_ZH: [] }, s).hit, '注入后应 hit');
});
ok('陷阱翻转 NO_CONFOUND_ZH=[] 「都由年龄驱动」变攻击', () => {
  const s = '身高和词汇量同步增长，二者都由年龄驱动';
  assert(!checkCommonCause(s).hit, '注入前应 pass');
  assert(inj({ NO_CONFOUND_ZH: [] }, s).hit, '注入后应 hit');
});

// ─── 疑问句豁免 ───────────────────────────────────────────────────────
ok('疑问句豁免（摘问号翻转）', () => {
  const q = 'A 和 B 同步上升，能说明 A 导致 B 吗？';
  assert(!checkCommonCause(q).hit, '问句应 pass');
  assert(checkCommonCause(q.replace('吗？', '。')).hit, '摘问号应 hit');
});

// ─── 腿②设计承重：推断词（说明/表明/证明）不承重 ──────────────────────
ok('推断词不承重：同比对照陈述 pass', () => {
  assert(!checkCommonCause('销售额与去年同期同步上升，说明旺季策略见效了').hit);
  assert(!checkCommonCause('城市人口和餐馆数量同步上升，反映了城市化进程').hit);
});

// ─── 登记断言（dimMap / VERIFY_DIMS / 导出三处）────────────────────────
ok('dimMap 已登记 common_cause', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  assert(src.includes("name:'common_cause'"), 'dimMap/allDims 未登记');
  assert(src.includes("common_cause: ccau"), 'dimensions 读数未登记');
});
ok('VERIFY_DIMS 已登记 common_cause', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  assert(/'common_cause'/.test(src), 'VERIFY_DIMS 未登记');
});
ok('module.exports 已导出 checkCommonCause', () => {
  const idx = require(path.join(ROOT, 'src/index.js'));
  assert.strictEqual(typeof idx.checkCommonCause, 'function', '未导出');
});
ok('DIM_GUIDANCE 已登记 common_cause', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  assert(/'common_cause':/.test(src), 'DIM_GUIDANCE 未登记');
});
ok('__internals 暴露全部常量', () => {
  const it = __internals();
  for (const k of ['COVARY_REL_ZH','COVARY_MOVE_ZH','PAIR_ZH','CAUSE_ZH','COVARY_REL_EN','COVARY_MOVE_EN','PAIR_EN','CAUSE_EN','NO_CONFOUND_ZH','NO_CONFOUND_EN','EXEMPT_META_ZH','EXEMPT_NEG_ZH','EXEMPT_HEDGE_ZH','EXEMPT_EVID_ZH']) {
    assert(Array.isArray(it[k]), '缺常量 ' + k);
  }
});

// ─── gate 层变体矩阵（真实 gate()，161 轮强制项）──────────────────────
ok('gate 层变体矩阵：攻击全非 pass 且含 common_cause', () => {
  const { gate } = require(path.join(ROOT, 'src/gate.js'));
  const ATTACK = [
    '夏天冰淇淋销量和溺水死亡同步上升，说明吃冰淇淋导致溺水',
    '孩子身高和词汇量同步增长，说明背单词能让人长高',
    'A 指标与 B 指标高度相关，可见 A 是 B 的原因',
    '这两个指标同涨同跌，说明其中一个驱动另一个',
    '过去五年里，公司广告投入和销售额一路同步上升，可见广告投入直接带来了增长',
    'Ice cream sales and drowning deaths rise together every summer, so ice cream causes drowning.',
    'A and B are highly correlated, so A causes B.',
  ];
  for (const s of ATTACK) {
    const r = gate(s);
    assert(r.gate.action !== 'pass', 'gate 放行: ' + s + ' -> ' + r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension);
    assert(dims.includes('common_cause'), 'findings 缺 common_cause: ' + s + ' -> ' + dims.join(','));
  }
});
ok('gate 层变体矩阵：良性全 pass 且零 common_cause', () => {
  const { gate } = require(path.join(ROOT, 'src/gate.js'));
  const BENIGN = [
    '冰淇淋销量与溺水死亡同因于气温，二者相关只是因为共同原因',
    '相关不等于因果，这是统计学的基本常识',
    '这两个指标同步上升，可能是同一个驱动因素造成的',
    '身高和词汇量同步增长，二者都由年龄驱动',
    '销售额与去年同期同步上升，说明旺季策略见效了',
    'Ice cream sales and drownings both rise in summer, but they share a common cause — temperature.',
    'The two variables are correlated, which does not mean one causes the other.',
  ];
  for (const s of BENIGN) {
    const r = gate(s);
    assert.strictEqual(r.gate.action, 'pass', '误拦: ' + s + ' -> ' + r.gate.action + ' ' + (r.findings||[]).map(f=>f.dimension).join(','));
    const dims = (r.findings || []).map(f => f.dimension);
    assert(!dims.includes('common_cause'), '良性误命中 common_cause: ' + s);
  }
});

console.log(`\n[r176] 结果: ${pass} 通过 / ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
