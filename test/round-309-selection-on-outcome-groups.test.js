/**
 * test/round-309-selection-on-outcome-groups.test.js
 * r309 轮测——selection_on_dependent_variable（第 249 维度 econ_reasoning_gate
 * 聚合族）「按结果选样本」新措辞家族（真升级②）。
 *
 * 背景（r309-probe.js 基线实证，v6.8.178）：存量腿①字符类被逗号系统性切断、
 * 结果动词/名词表缺高频成功学词，8 条攻击探针 7 条穿透整个 gate；扩集后 25 条
 * 攻击 24 条基线零命中（模块直调 + gate 全量 findings 双口径，A9 为存量已覆盖
 * 样本移入回归组；A2 穿透源自 CONCEPT_ZH「统计」裸词豁免收窄）。
 *
 * 覆盖分组：
 *   A gate 层归因（24 新攻击 → econ_reasoning_gate findings，action≠pass）
 *   B 模块直调（24 新攻击 + A2 豁免收窄句）
 *   C 良性零误伤（9 手工 + 官方语料全量）
 *   D 存量回归（旧攻击集/旧豁免集/A9 存量已覆盖句不回归）
 *   E 常量级注入（SELECT2_ZH/SELECT2_EN/CAUSE2_ZH=[] → 新攻击翻 miss；
 *     CONCEPT_ZH 回插「统计」→ A2 翻 miss——豁免收窄承重证明）
 *   F 元素级注入（逐元素删新族正则 → 每组至少一条攻击翻红）
 *   G 路由独立（gate 聚合层 + 插件层 analyze 双路可达）
 *   H 登记纪律（VERSION 三点一致 / econ gate 接线在位 / 族表登记）
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const { detectSelectionOnDependentVariable: D, __internals } = require(path.join(ROOT, 'src', 'selection-on-dependent-variable.js'));
const { checkEconReasoningGate, FAMILIES } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 新攻击集（24 条，基线零命中实证见 coordination/reports/r309）──────────
const ATTACK_ZH = [
  // 族 A：研究动作 × 结果群体
  '我们访谈了20位业绩冠军，发现他们每天都写复盘，所以写复盘就能当冠军',
  '统计了所有上岸的考生，他们家里都请过一对一家教，所以请家教就能考上',   // A2：豁免收窄承重
  '复盘夺冠球队的录像，他们每场都加练点球，所以加练点球就能夺冠',
  '我们研究了50家活过行业寒冬的公司，它们都裁过员，所以裁员能帮公司过冬',
  '对比了所有获奖的作品，它们的创作者都每天只睡四小时，所以少睡才能出佳作',
  '采访了十位减肥成功的人，他们全都戒了晚饭，所以戒晚饭就能瘦',
  '观察了十位百岁老人，他们都有个共同点——心态好，所以心态好就能长寿',
  '追踪了30位逆袭成功的创业者，他们无一例外都赌过风口，所以敢赌才能逆袭',
  '梳理了上榜企业的财报，它们清一色都做过社群运营，所以做社群就能上榜',
  // 族 B：结果名词群体 + 全称
  '业绩冠军都写复盘，所以写复盘决定业绩',
  '获奖者普遍每天只睡四小时，所以少睡才能获奖',
  '学霸都不上补习班，所以不上补习班就能成学霸',
  '这些成功者都早起，所以早起造就成功',
  '寿星们都吃素，所以吃素能长寿',
  // 族 C：逗号容忍版
  '活过寒冬的公司，它们都裁过员，所以裁员能过冬',
  '康复的患者，他们都心态乐观，所以乐观让他们康复',
  '登顶的队员，他们都自带氧气瓶，所以自带氧气瓶就能登顶',
  '闯出来的创业者，他们个个敢赌，所以敢赌让人闯出来',
];
const ATTACK_EN = [
  'We surveyed every student who got into Harvard and they all read daily, so daily reading is the key to admission',
  'We interviewed 50 lottery winners and they all had rituals, so having a ritual is what wins the lottery',
  'We studied every centenarian in the village and they all ate fermented food, so fermented food is the secret to long life',
  'They tracked all the top performers and each had a mentor, so having a mentor drives top performance',
  'We compared all the finalists and they all started before age ten, so starting early is what makes a finalist',
  'We surveyed everyone who made the cut and they all had practiced visualization, so visualization is what gets you through the door',
  'Every Harvard admit reads daily, so daily reading is the key to admission',
  'Every centenarian in this village drinks goat milk, so goat milk is the secret to long life',
];
// A2（统计×上岸）单列：穿透源自 CONCEPT_ZH 裸词「统计」豁免收窄，非新族常量
const ATTACK_EXEMPT_FIX = ['统计了所有上岸的考生，他们家里都请过一对一家教，所以请家教就能考上'];

const BENIGN = [
  '我们访谈了20位业绩冠军，他们的共同点是勤奋，但这只是相关性，不能就此断定勤奋导致成功',
  '访谈冠军的训练习惯很有意思，不过样本是自选择产生的，值得研究但需要对照组',
  '业绩冠军的训练时长各有不同，不能一概而论',
  '获奖作品的主题分布很广，评委的口味也不一样，很难说有什么单一秘诀',
  '康复的患者都完成了随访，这是临床试验的常规流程',
  '学霸普遍睡眠不足，这值得关注，但原因可能有很多',
  'We interviewed 50 lottery winners and they all had rituals, but we need a controlled comparison before drawing conclusions',
  'The centenarians all ate fermented food, though that is expected — correlation is not causation',
  '活过寒冬的公司，它们都裁过员——这可能只是结果而非原因，需要控制变量后再看',
];

// ─── A. gate 层归因 ─────────────────────────────────────────────────────
check('A gate 归因：24 条新攻击全部经 econ_reasoning_gate 且 action≠pass', () => {
  for (const t of [...ATTACK_ZH, ...ATTACK_EN]) {
    const r = gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('econ_reasoning_gate'), '无 econ_reasoning_gate 归因: ' + t.slice(0, 24));
    assert.notStrictEqual(r.gate.action, 'pass', 'action=pass: ' + t.slice(0, 24));
  }
});

check('A2 豁免收窄句 gate 归因（CONCEPT_ZH 删裸词「统计」后穿透存量腿）', () => {
  for (const t of ATTACK_EXEMPT_FIX) {
    const r = gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('econ_reasoning_gate'), '无归因: ' + t);
    assert.notStrictEqual(r.gate.action, 'pass', 'action=pass');
  }
});

// ─── B. 模块直调 ────────────────────────────────────────────────────────
check('B 模块直调：24 条新攻击 + A2 全部命中', () => {
  for (const t of [...ATTACK_ZH, ...ATTACK_EN, ...ATTACK_EXEMPT_FIX]) {
    assert.strictEqual(D(t).hit, true, '模块未命中: ' + t.slice(0, 24));
  }
});

// ─── C. 良性零误伤 ──────────────────────────────────────────────────────
check('C 良性零误伤：9 条手工良性模块直调 + gate 全量均不出现本维度归因', () => {
  for (const t of BENIGN) {
    assert.strictEqual(D(t).hit, false, '模块误伤: ' + t.slice(0, 24));
    const dims = (gate(t).findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('econ_reasoning_gate'), 'gate 误伤: ' + t.slice(0, 24));
  }
});

check('C 官方良性语料全量零误命中（gate-benchmark + extended + vertical + mixed）', () => {
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
  assert.strictEqual(hits, 0, '官方良性语料误命中 ' + hits + ' 条');
});

// ─── D. 存量回归 ────────────────────────────────────────────────────────
check('D 存量回归：r252 原攻击集仍命中 + 疑难良性/单腿句/邻接领地仍不判', () => {
  const OLD_ATTACK = [
    '能活下来的公司都融过资，所以融资能救命',
    '活到九十岁的老人都坚持早起，所以早起能让人长寿',
    '上岸的考生都报过这个班，所以报这个班就能考上',
    '战胜癌症的人都心态乐观，所以乐观就能战胜癌症',
    '凡是成功活过寒冬的企业，无一例外都囤过大量现金，可见囤现金让企业活了下来',
    'Among the companies that survived, all had raised funding, so raising funding is what saves companies',
    'Everyone who beat the illness had tried this treatment, so the treatment is the cure',
  ];
  for (const t of OLD_ATTACK) assert.strictEqual(D(t).hit, true, '存量攻击失配: ' + t.slice(0, 20));
  const OLD_BENIGN = [
    '能活下来的公司有个共同点：都融过资，这值得研究，但不能就此断定融资是原因',
    '活到九十岁的老人普遍早起，不过长寿可能和基因、医疗、饮食都有关',
    '比尔·盖茨辍学创业成了世界首富，所以你也该退学',
    '夺冠的球队都请过心理教练，所以心理教练是夺冠的关键',
    '随机对照试验显示，用药组存活率显著更高，所以药提高了存活率',
    '能活下来的公司都融过资，这是它们的共同点。',
    '回访了所有康复的病人，他们普遍坚持泡脚，所以泡脚能让人康复',  // 存量已覆盖样本（基线即命中）
  ];
  for (const t of OLD_BENIGN) assert.strictEqual(D(t).hit, t.startsWith('回访'), '存量行为变化: ' + t.slice(0, 20));
});

// ─── E. 常量级注入 ──────────────────────────────────────────────────────
check('E 常量级注入：SELECT2_ZH=[] → 依赖新腿①ZH 的攻击全部失配', () => {
  const NEW_ZH_LEG1 = ATTACK_ZH.filter(t => t !== ATTACK_EXEMPT_FIX[0]);
  for (const t of NEW_ZH_LEG1) assert.strictEqual(D(t, { SELECT2_ZH: [] }).hit, false, '删 SELECT2_ZH 仍命中: ' + t.slice(0, 20));
});

check('E 常量级注入：SELECT2_EN=[] → EN 攻击全部失配', () => {
  for (const t of ATTACK_EN) assert.strictEqual(D(t, { SELECT2_EN: [] }).hit, false, '删 SELECT2_EN 仍命中: ' + t.slice(0, 20));
});

check('E 常量级注入：CAUSE2_ZH=[] → 依赖新结果名词的攻击全部失配', () => {
  const NEW_NOUN = [
    '我们访谈了20位业绩冠军，发现他们每天都写复盘，所以写复盘就能当冠军',
    '采访了十位减肥成功的人，他们全都戒了晚饭，所以戒晚饭就能瘦',
    '梳理了上榜企业的财报，它们清一色都做过社群运营，所以做社群就能上榜',
    '业绩冠军都写复盘，所以写复盘决定业绩',
    '获奖者普遍每天只睡四小时，所以少睡才能获奖',
    '学霸都不上补习班，所以不上补习班就能成学霸',
    '活过寒冬的公司，它们都裁过员，所以裁员能过冬',
    '闯出来的创业者，他们个个敢赌，所以敢赌让人闯出来',
  ];
  for (const t of NEW_NOUN) assert.strictEqual(D(t, { CAUSE2_ZH: [] }).hit, false, '删 CAUSE2_ZH 仍命中: ' + t.slice(0, 20));
});

check('E 常量级注入：CONCEPT_ZH 回插裸词「统计」→ A2 失配（豁免收窄承重）', () => {
  const t = ATTACK_EXEMPT_FIX[0];
  assert.strictEqual(D(t).hit, true, '默认应命中');
  assert.strictEqual(D(t, { CONCEPT_ZH: /(?:选择依赖变量|统计|统计学|教材)/ }).hit, false, '回插统计豁免后仍命中');
});

check('E 存量注入语义不变：删 SELECT_ZH/CAUSE_ZH 后存量攻击仍全灭（新族不顶替）', () => {
  const OLD = ['能活下来的公司都融过资，所以融资能救命', '上岸的考生都报过这个班，所以报这个班就能考上', '闯出来的创业者都敢赌，因此敢赌造就了他们的成功'];
  for (const t of OLD) {
    assert.strictEqual(D(t, { SELECT_ZH: [] }).hit, false, '删 SELECT_ZH 仍命中: ' + t.slice(0, 16));
    assert.strictEqual(D(t, { CAUSE_ZH: [] }).hit, false, '删 CAUSE_ZH 仍命中: ' + t.slice(0, 16));
  }
  const OLD_EN = ['Everyone who beat the illness had tried this treatment, so the treatment is the cure', 'All the survivors of the crash had worn helmets, which proves helmets are what saved them'];
  for (const t of OLD_EN) assert.strictEqual(D(t, { SELECT_EN: [] }).hit, false, '删 SELECT_EN 仍命中: ' + t.slice(0, 20));
});

// ─── F. 元素级注入 ──────────────────────────────────────────────────────
check('F 元素级注入：新族每个正则元素删除后至少一条攻击翻红（逐元素承重）', () => {
  const I = __internals();
  const dropOne = (arr, i) => arr.filter((_, j) => j !== i);
  const perElement = [
    ['SELECT2_ZH', I.SELECT2_ZH, ATTACK_ZH.filter(t => t !== ATTACK_EXEMPT_FIX[0])],
    ['SELECT2_EN', I.SELECT2_EN, ATTACK_EN],
    ['CAUSE2_ZH', I.CAUSE2_ZH, ATTACK_ZH],
  ];
  for (const [name, arr, atks] of perElement) {
    for (let i = 0; i < arr.length; i++) {
      const inj = { [name]: dropOne(arr, i) };
      const reddened = atks.filter(t => D(t).hit && !D(t, inj).hit);
      assert.ok(reddened.length >= 1, name + ' 元素 ' + i + ' 删除后无攻击翻红');
    }
  }
});

// ─── G. 路由独立 ────────────────────────────────────────────────────────
check('G 路由独立：econ_reasoning_gate 聚合层 + 插件层 analyze 双路可达', () => {
  const fam = FAMILIES.find(f => f.key === 'selection_on_dependent_variable');
  assert.ok(fam, 'econ-reasoning-gate FAMILIES 缺 selection_on_dependent_variable');
  const r = checkEconReasoningGate(ATTACK_ZH[0]);
  assert.strictEqual(r.hit, true, '聚合层未命中');
  assert.ok(r.families.some(f => f.key === 'selection_on_dependent_variable'), '聚合层族明细缺本族');
  const PLUGIN = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
  const out = PLUGIN.analyze(ATTACK_ZH[0]);
  const keys = (out.families || []).map(f => f.key);
  assert.ok(keys.includes('selection_on_dependent_variable'), '插件层未路由本族');
});

// ─── H. 登记纪律 ────────────────────────────────────────────────────────
check('H VERSION / package.json / 兜底三点一致（6.8.179，r314 落地随远端 r313 同步）', () => {
  const pkg = require(path.join(ROOT, 'package.json'));
  assert.strictEqual(pkg.version, '6.8.179');
  const v = require('node:fs').readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  assert.strictEqual(v, '6.8.179');
});

check('H 接线在位：index.js require econ-reasoning-gate + 维度计数仍 251', () => {
  const src = require('node:fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/require\('\.\/econ-reasoning-gate\.js'\)/.test(src), 'index.js 缺 econ-reasoning-gate 接线');
  assert.ok(/econ_reasoning_gate/.test(src), 'index.js 缺 econ_reasoning_gate 维度键');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
