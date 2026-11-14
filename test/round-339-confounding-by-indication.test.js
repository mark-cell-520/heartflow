'use strict';
/**
 * test/round-339-confounding-by-indication.test.js
 * [r339] 适应证混杂（confounding by indication / 指征混杂）——
 * econ_reasoning_gate 聚合族第 19 子族。
 * 真升级类型②：聚合族全新子家族（src/index.js 零改动、维度计数 256
 * 不变，同 r332/r336 先例）。
 *
 * 立项缺口实证（coordination/agent4/probes/r339-probe-candidates.js，
 * 集成树 v6.8.185 hf.gate() 全量 findings 口径）：五候选定拨——
 *   · A 禀赋/处置效应新措辞：攻击 5/7 穿透、良性 3/4（1 条被存量
 *     维度误拦），放弃；
 *   · B 适应证混杂：攻击 5/5 完全穿透、良性 4/4 零误伤 → **胜出**；
 *   · C 筛查悖误读：1/5（reverse_causation/perfect_error 已代拦
 *     大半），放弃；D omission/status quo：0/5 全覆盖，放弃；
 *   · E effort justification：3/5 部分覆盖，放弃。
 * 外部来源：空返，按既有形态自建（arXiv 查询词被 OR 拆散返回无关
 * 条目、GitHub repos 0 命中、Semantic Scholar 429；原始证据
 * coordination/agent4/scout/*20261114-175632*）。
 *
 * 补丁（新增 src/confounding-by-indication.js）：
 *   腿① SELECTION（治疗分配由基线风险驱动在场）ZH 四组 / EN 四组；
 *   腿② CAUSAL（结局差异×治疗因果断言）ZH 四组 / EN 四组；
 *   窗 PAIR_ZH 60 / PAIR_EN 160；
 *   豁免 CONCEPT（适应证混杂/因果推断/confounding by indication 概念
 *     教学）+ CORRECT（随机化/分层/调整基线/倾向评分/不能据此比较
 *     纠正句）；
 *   强否定前缀守卫（无法证明新药有害=否定断言）+ 腿②对冲守卫
 *     （可能是指征混杂=正确限定）。
 *   注册：src/econ-reasoning-gate.js FAMILIES（gate 层）+
 *   src/plugins/econ-reasoning-check/index.js FAMILIES（插件层）。
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 + 官方语料
 *   全量）/ D 聚合桥注册 / E 常量级注入-删条承重（腿组 + 窗 + 豁免
 *   + 守卫逐项）/ F 边界锁（近邻维度领地）/ G 登记纪律。
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const { detectConfoundingByIndication, __internals } = require(path.join(ROOT, 'src', 'confounding-by-indication.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const ergMod = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
const hit = (t, inj) => detectConfoundingByIndication(t, inj).hit === true;

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 攻击集（ZH 13 + EN 10，覆盖探针穿透句 + 逐组独担句）──────────
const ATTACK = [
  // ZH 探针胜出句（原样）
  '用新药的都是重症患者，所以新药组死亡率更高，这证明新药反而有害。',
  '病情重的医生才敢开这个疗法，结果用了疗法的病人死得更多，可见疗法有问题。',
  '接受这种治疗的患者本身预后更差，因此该治疗导致更高的死亡率。',
  '这种药只给危重病人用，他们组的痊愈率自然更低，可见该药无效。',
  '越严重的病越倾向于用新方案，并发症更多，所以新方案更危险。',
  // ZH 逐组独担（腿①四组各一 + 腿②四组各一）
  '这种方案只给危重病人用，所以该方案有问题。',
  '用新药的都是重症患者，所以新药反而有害。',
  '病情越重的患者越容易抢着用新药，因此新药的口碑更好。',
  '服用新药的患者平均基线风险更高，所以新药不安全。',
  '这种方案只给危重病人用，所以它的效果更差。',
  '新疗法只用于重症，研究表明该药不安全。',
  '新疗法只用于重症，新疗法反而有害。',
  '接受新药的患者本身病情更重，这一组的痊愈率明显更低。',
  // EN 探针胜出句（原样）
  'The patients who received the new drug were the sickest ones, so the higher death rate proves the drug is harmful.',
  'Doctors prescribe this therapy only in severe cases, and those patients die more often, so the therapy must be dangerous.',
  // EN 逐组独担
  'The patients who received the new drug were the sickest ones, and the drug is ineffective.',
  'Doctors prescribe this therapy only in severe cases, and the therapy is ineffective.',
  'Sicker patients received the new drug, and the drug is ineffective.',
  'Patients who received the drug had worse baseline severity, and the drug is ineffective.',
  'Doctors prescribe this therapy only in severe cases, so the therapy must be dangerous.',
  'The sickest patients received the drug, and the trial results prove the drug is unsafe.',
  'The patients who got the new drug were the sickest, and the drug is ineffective.',
  'Sicker patients were given the therapy, and their mortality rates were higher.',
];

// ─── A. gate 层归因 ─────────────────────────────────────────────
check('A gate 层：攻击 ZH/EN 各 2 条 → action=verify 且 findings 含 econ_reasoning_gate', () => {
  for (const s of [
    '用新药的都是重症患者，所以新药组死亡率更高，这证明新药反而有害。',
    '病情重的医生才敢开这个疗法，结果用了疗法的病人死得更多，可见疗法有问题。',
    'The patients who received the new drug were the sickest ones, so the higher death rate proves the drug is harmful.',
    'Doctors prescribe this therapy only in severe cases, and those patients die more often, so the therapy must be dangerous.',
  ]) {
    const r = gate(s);
    assert.strictEqual(r.gate.action, 'verify', 'action 非 verify: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'econ_reasoning_gate');
    assert.ok(f, 'findings 缺 econ_reasoning_gate: ' + s);
  }
});

// ─── B. 模块直调 ────────────────────────────────────────────────
check('B 模块直调：攻击 23/23 命中且 details 带 confounding-by-indication 标', () => {
  let n = 0;
  for (const s of ATTACK) {
    const r = detectConfoundingByIndication(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.details.includes('confounding-by-indication'), 'details 缺族名标: ' + r.details);
    n++;
  }
  assert.strictEqual(n, 23);
});
check('B 聚合桥直调：攻击经 econ-reasoning-gate 命中且 families 含 confounding_by_indication', () => {
  const r = ergMod.checkEconReasoningGate('用新药的都是重症患者，所以新药组死亡率更高，这证明新药反而有害。');
  assert.strictEqual(r.hit, true);
  const fam = (r.families || []).find(f => f.key === 'confounding_by_indication');
  assert.ok(fam, 'families 缺 confounding_by_indication');
  assert.strictEqual(fam.round, 'r339');
});

// ─── C. 良性零误伤 ──────────────────────────────────────────────
check('C 良性零误伤：手工良性 9/9 模块级不命中', () => {
  const BENIGN = [
    '两组病情严重程度不同，需要按基线风险分层或随机化后才能比较疗效。',
    '重症患者更常用新药，死亡率差异可能是指征混杂而非药物效应。',
    '新药组死亡率更高，但这是因为重症患者更多地被分到了新药组，不能据此认为新药有害。',
    '只有随机对照试验才能排除适应证混杂的影响。',
    '医生说这种药只用于重症，这是合理的用药规范。',
    'Treatment assignment was confounded by indication; we adjusted for baseline severity.',
    'Sicker patients received the therapy, so mortality differences may reflect prognosis, not harm.',
    'Doctors reserve the drug for the most severe cases, which is standard practice.',
    'The drug was given only to critical patients, and the study protocol required randomization.',
  ];
  for (const s of BENIGN) assert.strictEqual(hit(s), false, '误伤: ' + s);
});
check('C 良性零误伤：官方四基准语料全量模块级零命中', () => {
  function flatten(mod) {
    const out = []; const src = mod.SAMPLES || mod.samples || mod.CATEGORIES;
    if (Array.isArray(src)) out.push(...src);
    else if (src && typeof src === 'object') for (const v of Object.values(src)) { if (Array.isArray(v)) out.push(...v); else if (v && Array.isArray(v.samples)) out.push(...v.samples); }
    return out.filter(s => typeof s === 'string');
  }
  let n = 0, fp = 0; const hits = [];
  for (const f of ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
    for (const s of flatten(require(path.join(ROOT, 'test', f)))) {
      n++;
      if (detectConfoundingByIndication(s).hit) { fp++; hits.push(s.slice(0, 60)); }
    }
  }
  assert.ok(n >= 360, '语料条数不足: ' + n);
  assert.strictEqual(fp, 0, '误伤 ' + fp + ' 条: ' + hits.join(' | '));
});

// ─── D. 聚合桥注册 ──────────────────────────────────────────────
check('D 注册：econ-reasoning-gate FAMILIES 含 confounding_by_indication 行', () => {
  const row = ergMod.FAMILIES.find(f => f.key === 'confounding_by_indication');
  assert.ok(row, '聚合桥 FAMILIES 缺行');
  assert.strictEqual(row.mod, './confounding-by-indication.js');
  assert.strictEqual(row.fn, 'detectConfoundingByIndication');
  assert.strictEqual(row.round, 'r339');
});
check('D 注册：插件层 FAMILIES 含 confounding_by_indication 行', () => {
  const row = (plugin.FAMILIES || []).find(f => f.key === 'confounding_by_indication');
  assert.ok(row, '插件层 FAMILIES 缺行');
  assert.strictEqual(row.mod, '../../confounding-by-indication.js');
  assert.strictEqual(row.round, 'r339');
});

// ─── E. 常量级注入-删条承重 ─────────────────────────────────────
const FALSE = /(?!)/;
// 腿① ZH 四组逐组删条 → 独担样本失效
check('E 注入 SELECT_VERB_ZH=[] → S1 独担样本失效', () => {
  const s = '这种方案只给危重病人用，所以该方案有问题。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { SELECT_VERB_ZH: [] }), false);
});
check('E 注入 SELECT_TREAT_SEV_ZH=[] → S2 独担样本失效', () => {
  const s = '用新药的都是重症患者，所以新药反而有害。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { SELECT_TREAT_SEV_ZH: [] }), false);
});
check('E 注入 SELECT_SEV_TREAT_ZH=[] → S3 独担样本失效', () => {
  const s = '病情越重的患者越容易抢着用新药，因此新药的口碑更好。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { SELECT_SEV_TREAT_ZH: [] }), false);
});
check('E 注入 SELECT_IMBALANCE_ZH=[] → S4 独担样本失效', () => {
  const s = '服用新药的患者平均基线风险更高，所以新药不安全。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { SELECT_IMBALANCE_ZH: [] }), false);
});
// 腿① EN 四组逐组删条
check('E 注入 SELECT_RECV_SEV_EN=[] → E1 独担样本失效', () => {
  const s = 'The patients who received the new drug were the sickest ones, and the drug is ineffective.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { SELECT_RECV_SEV_EN: [] }), false);
});
check('E 注入 SELECT_PRESCRIBE_SEV_EN=[] → E2 独担样本失效', () => {
  const s = 'Doctors prescribe this therapy only in severe cases, and the therapy is ineffective.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { SELECT_PRESCRIBE_SEV_EN: [] }), false);
});
check('E 注入 SELECT_SICKER_RECV_EN=[] → E3 独担样本失效', () => {
  const s = 'Sicker patients received the new drug, and the drug is ineffective.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { SELECT_SICKER_RECV_EN: [] }), false);
});
check('E 注入 SELECT_IMBALANCE_EN=[] → E4 独担样本失效', () => {
  const s = 'Patients who received the drug had worse baseline severity, and the drug is ineffective.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { SELECT_IMBALANCE_EN: [] }), false);
});
// 腿② ZH 四组逐组删条
check('E 注入 CAUSAL_MARK_ZH_A=[] → A 独担样本失效', () => {
  const s = '这种方案只给危重病人用，所以它的效果更差。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { CAUSAL_MARK_ZH_A: [] }), false);
});
check('E 注入 CAUSAL_PROVE_ZH_B=[] → B 独担样本失效', () => {
  const s = '新疗法只用于重症，研究表明该药不安全。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { CAUSAL_PROVE_ZH_B: [] }), false);
});
check('E 注入 CAUSAL_TREAT_ZH_C=[] → C 独担样本失效', () => {
  const s = '新疗法只用于重症，新疗法反而有害。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { CAUSAL_TREAT_ZH_C: [] }), false);
});
check('E 注入 CAUSAL_OUTCOME_ZH_D=[] → D 独担样本失效', () => {
  const s = '接受新药的患者本身病情更重，这一组的痊愈率明显更低。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { CAUSAL_OUTCOME_ZH_D: [] }), false);
});
// 腿② EN 四组逐组删条
check('E 注入 CAUSAL_SO_EN_A=[] → A 独担样本失效', () => {
  const s = 'Doctors prescribe this therapy only in severe cases, so the therapy must be dangerous.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { CAUSAL_SO_EN_A: [] }), false);
});
check('E 注入 CAUSAL_PROVE_EN_B=[] → B 独担样本失效', () => {
  const s = 'The sickest patients received the drug, and the trial results prove the drug is unsafe.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { CAUSAL_PROVE_EN_B: [] }), false);
});
check('E 注入 CAUSAL_TREAT_EN_C=[] → C 独担样本失效', () => {
  const s = 'The patients who got the new drug were the sickest, and the drug is ineffective.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { CAUSAL_TREAT_EN_C: [] }), false);
});
check('E 注入 CAUSAL_RATE_EN_D=[] → D 独担样本失效', () => {
  const s = 'Sicker patients were given the therapy, and their mortality rates were higher.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { CAUSAL_RATE_EN_D: [] }), false);
});
// 窗删除（-1 全滤：任何样本两腿都不可能配对）
check('E 注入 PAIR_ZH=-1 → 中文攻击全失效', () => {
  for (const s of ATTACK.slice(0, 13)) assert.strictEqual(hit(s, { PAIR_ZH: -1 }), false, '删窗后仍命中: ' + s);
});
check('E 注入 PAIR_EN=-1 → 英文攻击全失效', () => {
  for (const s of ATTACK.slice(13)) assert.strictEqual(hit(s, { PAIR_EN: -1 }), false, '删窗后仍命中: ' + s);
});
// 窗收紧（0：两腿距离 >0 的样本收紧后失效——紧邻样本 dist=0 不受影响）
check('E 注入 PAIR_ZH=0 → 非紧邻中文样本失效', () => {
  assert.strictEqual(hit('用新药的都是重症患者，所以新药组死亡率更高，这证明新药反而有害。', { PAIR_ZH: 0 }), false);
});
// 豁免表：永假正则 → 带攻击结构的良性样本由不判变判
// 构造纪律：样本必须双腿齐全，豁免标记与攻击形共存于同句。
check('E 注入 CONCEPT_ZH 永假 → 概念教学良性变红', () => {
  const s = '适应证混杂的经典例子：用新药的都是重症患者，所以新药组死亡率更高，这证明新药反而有害。';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { CONCEPT_ZH: FALSE }), true);
});
check('E 注入 CONCEPT_EN 永假 → 概念教学良性变红', () => {
  const s = 'Confounding by indication means the patients who received the new drug were the sickest ones, so the drug is ineffective.';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { CONCEPT_EN: FALSE }), true);
});
check('E 注入 CORRECT_ZH 永假 → 纠正句良性变红', () => {
  const s = '用新药的都是重症患者，所以新药组死亡率更高，但我们需要按基线风险分层或随机化后才能比较疗效。';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { CORRECT_ZH: FALSE }), true);
});
check('E 注入 CORRECT_EN 永假 → 纠正句良性变红', () => {
  const s = 'The patients who received the new drug were the sickest ones, so the higher death rate seems to prove harm, but we must adjust for baseline severity first.';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { CORRECT_EN: FALSE }), true);
});
// 对冲守卫：腿②前置对冲词 → 该匹配作废（构造双腿齐全样本）
check('E 对冲守卫：腿②前置「可能」→ 不判（删 HEDGE 守卫无入口，用正确限定样本锁行为）', () => {
  const s = '重症患者更常用新药，死亡率差异可能是指征混杂而非药物效应。';
  assert.strictEqual(hit(s), false);
});
// 强否定守卫：腿②前「无法」→ 不判
check('E 否定守卫：腿②前置「无法证明」→ 不判', () => {
  const s = '用新药的都是重症患者，但现有数据无法证明新药反而有害。';
  assert.strictEqual(hit(s), false);
});

// ─── F. 边界锁（近邻维度领地不判）────────────────────────────────
check('F 边界：共同原因形不判（两变量相关源于共同原因，无选择性分配腿）', () => {
  assert.strictEqual(hit('冰激凌销量和溺水人数一起上升，因为两者都由夏季高温引起。'), false);
});
check('F 边界：因果倒置形不判（疗效好所以被选用，方向相反）', () => {
  assert.strictEqual(hit('因为这个疗法确实有效，所以医生都愿意给病人用。'), false);
});
check('F 边界：按结果选择样本形不判（只看存活/成功案例）', () => {
  assert.strictEqual(hit('我们只访谈了创业成功的公司，所以得出了坚持就是胜利的结论。'), false);
});
check('F 边界：无腿②的客观用药描述不判', () => {
  assert.strictEqual(hit('医生主要给重症患者开这种药，这是说明书规定的用法。'), false);
});

// ─── G. 登记纪律 ─────────────────────────────────────────────────
check('G 登记：__internals 暴露全部常量组与 findSignatures', () => {
  const I = __internals();
  for (const k of [
    'SELECT_VERB_ZH', 'SELECT_TREAT_SEV_ZH', 'SELECT_SEV_TREAT_ZH', 'SELECT_IMBALANCE_ZH',
    'SELECT_RECV_SEV_EN', 'SELECT_PRESCRIBE_SEV_EN', 'SELECT_SICKER_RECV_EN', 'SELECT_IMBALANCE_EN',
    'CAUSAL_MARK_ZH_A', 'CAUSAL_PROVE_ZH_B', 'CAUSAL_TREAT_ZH_C', 'CAUSAL_OUTCOME_ZH_D',
    'CAUSAL_SO_EN_A', 'CAUSAL_PROVE_EN_B', 'CAUSAL_TREAT_EN_C', 'CAUSAL_RATE_EN_D',
    'SELECTION_ZH_GROUPS', 'SELECTION_EN_GROUPS', 'CAUSAL_ZH_GROUPS', 'CAUSAL_EN_GROUPS',
    'PAIR_ZH', 'PAIR_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'CORRECT_ZH', 'CORRECT_EN',
    'STRONG_NEG_ZH', 'STRONG_NEG_EN', 'HEDGE_ZH', 'HEDGE_EN',
    'findSignatures',
  ]) assert.ok(k in I, '__internals 缺键: ' + k);
  assert.strictEqual(I.PAIR_ZH, 60);
  assert.strictEqual(I.PAIR_EN, 160);
});

console.log(`\nr339 轮测：${passed} 通过 / ${failed} 失败`);
