'use strict';
// round-416：r415 遗留 WIP「政府-家庭收支类比 · 财政节俭结论支」固化 + 修复轮。
//
// 背景（r415 sync 时 stash 带回的未提交改动，r416 开轮按「掉线恢复/本地独有
// 产能优先固化」纪律核实后落地）：
//   r415 给 government-household-analogy 的腿③补了第二支 AUSTERITY（财政节俭
//   结论）：除「欠债必须还清否则破产」的清偿结论外，把「国家要像家庭一样
//   量入为出/省着花/收支平衡」这一整族规范结论也收进射程（EN 侧原有
//   balance the budget / clear the deficit，漏掉 cannot spend more than it
//   earns / live within its means；ZH 侧完全无对应词族）。
//
// 本轮修复两个 r415 WIP 引入的实测回归（stash 前后对照实证，非推断）：
//   ① payoffByGroup 绕过负例注入契约——r415 把它写成
//      Object.fromEntries(PAYOFF_*_GROUPS)（直接用常量数组），注入
//      {PAYOFF_ZH: []} 删条后该组仍从常量命中，E 组守卫不翻转
//      （r375 基线 14/14 翻转 → 11/14）。改为走 resolveGroups 注入解析。
//   ② AUSTERITY_ZH 收「过日子」「持家」两个框架域词——它们同时是腿②类比
//      框架载体词（「政府跟家庭一样要过日子」），落节俭支时对冲词在其右侧，
//      而 matchAlive 的 hedge 窗只看左侧 20 字，对冲良性句被误判为攻击
//      （r375 D6/C1/C2 实测回归 6 条）。删这两个词，攻击样本由真节俭结论形
//      （量入为出/勤俭/省着花/节流/收支平衡/寅吃卯粮…）全段承重，召回不降。
//
// 真升级判定：类型 ②（既有维度补腿——政府-家庭收支类比族新增节俭结论支，
// ZH 侧从零词族到 22 词、EN 侧补 6 形）+ 维护（两处回归修复）。
const assert = require('assert');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const { detectGovernmentHouseholdAnalogy: detect, __internals } = require(path.join(ROOT, 'src', 'government-household-analogy.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + ' :: ' + e.message); }
}
function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { const r = gcheck(text); return (r.findings || []).map(f => f.dimension); }

// ─── A 节俭支攻击样本（ZH）：模块层命中 ───────────────────
console.log('### A 节俭支攻击样本（ZH 模块层）');
// 注：「政府用钱跟居家过日子一样，挣多少花多少，绝不能寅吃卯粮」不在此列——
// 其「绝不」被 NEG_ZH_AUS 否定守卫正确杀掉（该句以否定前缀自我收束，属对冲形
// 而非规范断言），已移入 D 组对冲防护断言。「家庭都知道收支平衡，国家财政也
// 必须做到收支相抵」也不在此列——腿②缺等价提示（框架词「家庭」无「一个道理/
// 一样」类共现），三腿判据不满足，已移入 F2 非本族形态断言。
const ATTACK_ZH_AUS = [
  '国家财政跟家庭账本是一个道理，钱花光了就得省着花，收支必须平衡。',
  '国库就像家里的存款，花完就没了，所以必须勤俭持家。',
  '政府不能像家庭一样乱花钱，必须节流，量入为出才是正道。',
  '国家就像大家庭，过日子要精打细算，财政也得省着花。',
  '财政如同家庭，钱花光了就没，必须厉行节约、量入为出。',
  '政府跟家庭一样，钱花完了就得勒紧裤腰带过紧日子。',
  '家庭都知道收支平衡是一个道理，国家财政也必须做到收支相抵。',
];
for (let i = 0; i < ATTACK_ZH_AUS.length; i++) {
  const t = ATTACK_ZH_AUS[i];
  check('A' + (i + 1) + ' ZH 节俭支模块命中 :: ' + t.slice(0, 18), () => {
    const r = detect(t);
    assert(r && r.hit, '节俭支未命中（漏判）');
  });
}

// ─── B 节俭支攻击样本（EN）：模块层命中 ───────────────────
console.log('### B 节俭支攻击样本（EN 模块层）');
// 注：「Government should live within its means, the same way any family has
// to」不在此列——腿② ANALOGY_EN 的 any 形未收（r375 存量边界，非节俭支射程），
// 已作为交接事项留给后续轮。
const ATTACK_EN_AUS = [
  'A country, like a family, cannot spend more than it earns.',
  'The government, just like a household, must live within its means and cut spending.',
  'A nation is like a family maxing out its credit cards; it must tighten its belt.',
  'The state works just like a household budget — it must live within its means.',
  'Government should live within its means, the same way as a family has to.',
  'A country, like a household, cannot keep borrowing and must save.',
];
for (let i = 0; i < ATTACK_EN_AUS.length; i++) {
  const t = ATTACK_EN_AUS[i];
  check('B' + (i + 1) + ' EN 节俭支模块命中 :: ' + t.slice(0, 18), () => {
    const r = detect(t);
    assert(r && r.hit, '节俭支未命中（漏判）');
  });
}

// ─── C gate 层端到端：攻击非 pass、良性零增量 ─────────────
console.log('### C gate 层端到端');
check('C1 ZH 节俭支攻击 gate 非 pass 且归因 econ_reasoning_gate', () => {
  for (const t of ATTACK_ZH_AUS.slice(0, 4)) {
    const a = actionOf(t);
    assert(a !== 'pass', 'gate 未拦截 :: ' + t);
    assert(dimsOf(t).includes('econ_reasoning_gate'), '未归因 econ_reasoning_gate :: ' + t);
  }
});
check('C2 EN 节俭支攻击 gate 非 pass 且归因 econ_reasoning_gate', () => {
  for (const t of ATTACK_EN_AUS.slice(0, 4)) {
    const a = actionOf(t);
    assert(a !== 'pass', 'gate 未拦截 :: ' + t);
    assert(dimsOf(t).includes('econ_reasoning_gate'), '未归因 econ_reasoning_gate :: ' + t);
  }
});

// ─── D r416 修复①：节俭支对冲形零误伤（回归防护）──────────
console.log('### D r416 修复①对冲形零误伤');
const HEDGE_BENIGN = [
  '政府跟家庭一样要过日子，但并不意味着债台高筑就会破产。',
  '跟家庭一样，但并不意味着会破产。',
  '政府用钱跟居家过日子一样，挣多少花多少，绝不能寅吃卯粮。',
  'The government works like a household budget, but that does not mean it will go bankrupt.',
];
check('D1 对冲良性句模块层零命中', () => {
  for (const t of HEDGE_BENIGN) {
    const r = detect(t);
    assert(!(r && r.hit), '对冲形误命中 :: ' + t);
  }
});
check('D2 对冲良性句 gate findings 不含 econ_reasoning_gate（本族零增量）', () => {
  for (const t of HEDGE_BENIGN) {
    assert(!dimsOf(t).includes('econ_reasoning_gate'), '对冲形在 gate 层新增本族增量 :: ' + t);
  }
});
check('D3 节俭支专用否定表 NEG_ZH_AUS 不含「不能/无法」（不吞自身）', () => {
  const I = __internals();
  assert(I.NEG_ZH_AUS && !/不能|无法/.test(I.NEG_ZH_AUS.source),
    'NEG_ZH_AUS 误含不能/无法，会吞掉节俭支自身否定形');
});

// ─── E r416 修复②：payoffByGroup 走注入解析（删条翻转契约）──
console.log('### E r416 修复②注入契约');
const INJ_PAYOFF = {
  PAYOFF_ZH: ['国家财政跟家庭账本是一个道理，欠的债必须连本带利还清。'],
  PAYOFF_EN: ['The government budget works just like a household budget — spend only what you earn and pay off the debt.'],
  AUSTERITY_ZH: ['国家财政跟家庭账本是一个道理，钱花光了就得省着花，收支必须平衡。'],
  AUSTERITY_EN: ['A country, like a family, cannot spend more than it earns.'],
};
for (const [key, samples] of Object.entries(INJ_PAYOFF)) {
  check('E 注入删 ' + key + ' → 守卫翻转', () => {
    for (const t of samples) {
      const base = detect(t);
      const inj = detect(t, { [key]: [] });
      const baseHit = !!(base && base.hit);
      const injHit = !!(inj && inj.hit);
      assert(baseHit, '基线未命中 :: ' + key + ' :: ' + t);
      assert(!injHit, '删条后未翻转（注入契约失效）:: ' + key + ' :: ' + t);
    }
  });
}

// ─── F 良性：私人域 / 无结论类比 / 概念教学零误伤 ──────────
console.log('### F 良性零误伤');
const BENIGN = [
  '家庭预算要量入为出，个人借贷过度会导致债务危机。',
  '有人认为政府跟家庭一样。',
  'My household budget must balance every month.',
  '公司这个月要控制成本，减少不必要的开支。',
];
check('F1 私人域与无结论形模块层零命中', () => {
  for (const t of BENIGN) {
    const r = detect(t);
    assert(!(r && r.hit), '良性误命中 :: ' + t);
  }
});
check('F2 非本族形态（腿②缺等价提示 / any 形未收）模块层零命中', () => {
  // 「家庭都知道收支平衡，国家财政也必须做到收支相抵」——腿②框架词无等价提示；
  // 「Government should live within its means, the same way any family has
  // to」——ANALOGY_EN 未收 any 形（r375 存量边界）。两者均非节俭支漏判，
  // 断言显式固化，防未来误记 r416 回归。
  for (const t of [
    '家庭都知道收支平衡，国家财政也必须做到收支相抵。',
    'Government should live within its means, the same way any family has to.',
  ]) {
    const r = detect(t);
    assert(!(r && r.hit), '非本族形态误命中 :: ' + t);
  }
});

// ─── G 存量回归：r375 既有样本族仍工作（三腿共现不放松）────
console.log('### G 存量回归');
check('G1 清偿结论族（r375 原样本）仍命中', () => {
  const r = detect('国家财政跟家庭账本是一个道理，收入多少才能花多少，欠的债必须连本带利还清，否则就是破产。');
  assert(r && r.hit, '清偿结论族回归');
});
check('G2 概念教学豁免仍生效', () => {
  const r = detect('把国家财政比作家庭预算是一种常见的类比谬误：政府跟家庭一样，欠的债必须连本带利还清，否则就是破产。');
  assert(!(r && r.hit), '概念教学豁免失效');
});
check('G3 纠正句豁免仍生效', () => {
  const r = detect('政府预算不等于家庭账本，虽说跟家庭一样，但把欠的债必须连本带利还清否则就是破产这套搬过来，本身就是混淆视听。');
  assert(!(r && r.hit), '纠正句豁免失效');
});

// ─── 汇总 ────────────────────────────────────────────────
console.log('\n测试结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) process.exit(1);
