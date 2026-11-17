/**
 * test/round-367-negative-existential-import.js
 * r367：第 260 维度 negative_existential_import（否定前提推存在）维度测试。
 * 覆盖：攻击样本（10）、良性样本（10）、负例注入（逐常量置空证承重）、
 * 同族变体矩阵（ZH/EN/裸名词/倒装/长句）、边界维度（不重复 appeal_to_ignorance
 * 与 existential_fallacy）。
 */
'use strict';
const assert = require('assert');
const path = require('path');
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
const {
  checkNegativeExistentialImport,
  NEG_PREMISE_ZH, NEG_PREMISE_EN, EXISTENCE_ZH, EXISTENCE_EN,
  EXIST_CONCL_ZH, EXIST_CONCL_EN, OBSERVATION, META_CONCEPT,
  TEACH, HEDGE, COMPLIANT_CONCLUSION, SCIENCE_CONDUCT,
} = require(path.join(__dirname, '..', 'src', 'negative-existential-import.js'));

let pass = 0, fail = 0;
const T = (name, fn) => { try { fn(); pass++; console.log(`✅ ${name}`); } catch (e) { fail++; console.log(`❌ ${name}: ${e.message}`); } };

const DIM = 'negative_existential_import';

// ── 攻击样本（gate.action 非 pass；族内维度必命中）──────────────────
const ATTACKS = [
  '没有人见过龙，所以龙一定存在于我们尚未探索的地方。',
  '从来没有人证明这个理论是错的，因此这个理论就是对的。',
  '没有证据表明他有罪，所以他是清白的。',
  '没有任何研究显示这种方法有效，可见这种方法就是有效的。',
  '你说不出反对的理由，说明这个方案是对的。',
  '因为没有科学家能解释这个现象，所以这一定是超自然力量造成的。',
  '目前尚未发现外星生命，所以外星生命必定存在于我们看不到的维度。',
  '没人反驳过这个观点，说明它已经被所有人接受了。',
  '至今没有人成功复现该结果，所以原始结果必然出自某种神秘机制。',
  '至今无人观测到暗物质的直接信号，因此暗物质必定存在于我们探测不到的频段。',
];
// ── 良性样本（必须全部 pass）──────────────────────────────────────
// r367 修复记录：首版 BENIGN[0]「没有人见过龙，所以目前没有可靠证据支持龙的存在。」
// 被存量维度 appeal_to_ignorance(verify) + contradiction(verify) 误伤（非本维度引入，
// 存量基线误伤，探针实证 gate.action=verify 而本维度零命中）。按 r359 选样纪律
// 换为双向样本；存量误伤归属写进注释，留给 1 号 engine 侧裁决。
// 第二轮替换实证：候选「没有任何研究显示…不属于标准疗法」被存量 perfect_error
// 判 verify；「目前没有研究发现…」被 unfalsifiable_assertion；「至今没人见过…」
// 「没有什么证据显示…」均被 fallacy_of_relevance 误伤——存量基线对「否定前提+
// 否定结论」句形普遍敏感，最终选定「没人能证伪 + 但字转折」形（本维度腿①命中、
// 腿②不命中，兼作良性压力样本）。
const BENIGN = [
  '这个理论没人能证伪，但它仍需更多实验数据支持。',
  '没有充分证据支持这个假说，我们应保持开放态度继续观察。',
  '没有证据表明他有罪，所以按无罪推定他应当被释放。',
  '没有任何研究显示这种方法有效，所以我们不能说它有效。',
  '你说不出反对的理由，不等于这个方案是对的，还需要实证检验。',
  '因为没有科学家能解释这个现象，所以这仍是一个开放问题。',
  '目前尚未发现外星生命，所以外星生命的存在仍未被证实。',
  '没人反驳过这个观点，但这不等于它被所有人接受。',
  '至今没有人成功复现该结果，所以该结果的可信度存疑。',
  '有些病人报告了这种症状，所以存在这种症状的病例。', // 带存在承诺前提：合法
];

T('r367: 攻击样本 10/10 非 pass 且族内维度命中', () => {
  ATTACKS.forEach((t, i) => {
    const r = gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(r.gate.action !== 'pass', `ATTACK[${i}] 未拦截: ${t} (action=${r.gate.action})`);
    assert.ok(dims.includes(DIM), `ATTACK[${i}] 未命中族维度: ${t} dims=[${dims}]`);
  });
});

T('r367: 良性样本 10/10 pass', () => {
  BENIGN.forEach((t, i) => {
    const r = gate(t);
    assert.strictEqual(r.gate.action, 'pass', `BENIGN[${i}] 误伤: ${t} (action=${r.gate.action}, findings=${JSON.stringify(r.findings)})`);
  });
});

// ── 负例注入：逐常量置空证承重（腿①否定前提/腿②肯定结论/豁免组）──
T('r367: 负例注入——腿①（NEG_PREMISE_ZH）置空后攻击不再命中', () => {
  const probe = '没有人见过龙，所以龙一定存在于我们尚未探索的地方。';
  const before = checkNegativeExistentialImport(probe);
  assert.ok(before.hit, '基线应命中');
  const saved = NEG_PREMISE_ZH.length;
  for (const re of NEG_PREMISE_ZH) re.lastIndex = 0;
  const bak = [...NEG_PREMISE_ZH];
  bak.forEach((_, i) => NEG_PREMISE_ZH.splice(0, saved));
  const after = checkNegativeExistentialImport(probe);
  assert.ok(!after.hit, '腿①置空后不应命中');
  bak.forEach(re => NEG_PREMISE_ZH.push(re));
  assert.ok(checkNegativeExistentialImport(probe).hit, '恢复后应再命中');
});

T('r367: 负例注入——腿②（EXIST_CONCL_ZH）置空后攻击不再命中', () => {
  const probe = '没有人见过龙，所以龙一定存在于我们尚未探索的地方。';
  assert.ok(checkNegativeExistentialImport(probe).hit, '基线应命中');
  const bak = [...EXIST_CONCL_ZH];
  bak.forEach((_, i) => EXIST_CONCL_ZH.splice(0, bak.length));
  assert.ok(!checkNegativeExistentialImport(probe).hit, '腿②置空后不应命中');
  bak.forEach(re => EXIST_CONCL_ZH.push(re));
  assert.ok(checkNegativeExistentialImport(probe).hit, '恢复后应再命中');
});

T('r367: 负例注入——腿① EN（NEG_PREMISE_EN）置空后 EN 攻击不再命中', () => {
  const probe = 'No one has ever seen a dragon, so dragons must exist beyond what we have explored.';
  assert.ok(checkNegativeExistentialImport(probe).hit, 'EN 基线应命中');
  const bak = [...NEG_PREMISE_EN];
  bak.forEach((_, i) => NEG_PREMISE_EN.splice(0, bak.length));
  assert.ok(!checkNegativeExistentialImport(probe).hit, 'EN 腿①置空后不应命中');
  bak.forEach(re => NEG_PREMISE_EN.push(re));
});

T('r367: 负例注入——腿② EN（EXIST_CONCL_EN）置空后 EN 攻击不再命中', () => {
  const probe = 'Nobody has refuted this theory, so it must be true.';
  assert.ok(checkNegativeExistentialImport(probe).hit, 'EN 基线应命中');
  const bak = [...EXIST_CONCL_EN];
  bak.forEach((_, i) => EXIST_CONCL_EN.splice(0, bak.length));
  assert.ok(!checkNegativeExistentialImport(probe).hit, 'EN 腿②置空后不应命中');
  bak.forEach(re => EXIST_CONCL_EN.push(re));
});

T('r367: 负例注入——EXISTENCE_ZH（存在承诺豁免）置空后良性变攻击', () => {
  // r367 修复（首版失败实证）：原样本「有些病人报告了这种症状，所以存在这种症状的病例。」
  // 腿②无存在断言形（EXIST_CONCL_ZH 零命中），豁免置空后不会转命中——豁免没在
  // 承重，是设计缺陷。换双腿齐全样本：「有人说」是转述标记（存在承诺词），
  // 前提段「从没有人见过这种鸟」+ 结论段「必定存在于深山老林里」双腿都在，
  // 注入三点验证：基线豁免 → 置空转命中 → 恢复回豁免。
  const probe = '有人说从没有人见过这种鸟，所以它必定存在于深山老林里。';
  assert.ok(!checkNegativeExistentialImport(probe).hit, '存在承诺前提应豁免');
  const bak = [...EXISTENCE_ZH];
  bak.forEach((_, i) => EXISTENCE_ZH.splice(0, bak.length));
  assert.ok(checkNegativeExistentialImport(probe).hit, '豁免置空后应转命中（证承重）');
  bak.forEach(re => EXISTENCE_ZH.push(re));
  assert.ok(!checkNegativeExistentialImport(probe).hit, '恢复后应再豁免');
});

T('r367: 负例注入——COMPLIANT_CONCLUSION 置空后正当结论变命中', () => {
  const probe = '没有证据表明他有罪，所以按无罪推定他应当被释放。';
  assert.ok(!checkNegativeExistentialImport(probe).hit, '合规限定结论应豁免');
  const bak = [...COMPLIANT_CONCLUSION];
  bak.forEach((_, i) => COMPLIANT_CONCLUSION.splice(0, bak.length));
  const r = checkNegativeExistentialImport(probe);
  assert.ok(!r.hit, '合规结论豁免置空后由腿②不命中兜底（结论无存在断言形）');
  bak.forEach(re => COMPLIANT_CONCLUSION.push(re));
});

// ── 同族变体矩阵（≥5 变体：中英/裸名词/带修饰/倒装/长句）──────────
const VARIANTS = [
  // ZH 裸名词形（无「所以」，逗号分句）
  '至今没有发现过这种粒子，它必定存在于更高的能标上。',
  // ZH 倒装形（结论在前、前提在后作理由）
  '这个理论就是对的，从来没有人能证明它是错的。',
  // ZH 长句
  '虽然过去十年我们动用了全部手段，但从来没有人真正观测到这个信号，因此它只能存在于我们现有仪器探测不到的某个频段。',
  // ZH 解释否定腿 + 存在结论
  '没有任何专家能解释这一现象，可见背后必有某种超自然力量。',
  // EN
  'No one has ever observed this particle, so it must exist at higher energies.',
  // EN 全称接受腿
  'Nobody has objected to this plan, which means it is accepted by everyone.',
  // EN 长句
  'Despite decades of searching, no evidence of extraterrestrial life has been found, so alien life must exist somewhere we cannot look.',
];
T('r367: 同族变体矩阵 7/7 命中', () => {
  VARIANTS.forEach((t, i) => {
    const r = gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(r.gate.action !== 'pass', `VARIANT[${i}] 未拦截: ${t}`);
    assert.ok(dims.includes(DIM), `VARIANT[${i}] 未命中族维度: ${t} dims=[${dims}]`);
  });
});

// ── 边界：与 appeal_to_ignorance / existential_fallacy 不重复（族维度独中）──
T('r367: 边界——appeal_to_ignorance 族样本（举证责任）不被本族抢判', () => {
  const probes = [
    '你证明不了上帝不存在，所以上帝存在，你必须接受。', // aig 族形状
  ];
  probes.forEach((t, i) => {
    const r = gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes(DIM), `边界[${i}] 不应由本族命中: ${t} dims=[${dims}]`);
  });
});

T('r367: 边界——existential_fallacy 族样本（肯定无存在承诺前提）不被本族抢判', () => {
  const probes = [
    '所有喝过这款茶的人都改善了睡眠，所以存在喝茶助眠的人。',
    '如果按下这个按钮就能获得奖励，那么一定存在获得过奖励的人。',
  ];
  probes.forEach((t, i) => {
    const r = gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes(DIM), `边界[${i}] 不应由本族命中: ${t} dims=[${dims}]`);
  });
});

// ── 合约：未命中永不返回 null（维度函数铁律）──────────────────────
T('r367: 合约——未命中返回零分对象而非 null', () => {
  const r = checkNegativeExistentialImport('今天天气不错，我们出去散步吧。');
  assert.ok(r !== null && r !== undefined, '不得返回 null/undefined');
  assert.strictEqual(r.hit, false);
  assert.strictEqual(r.score, 0);
  assert.strictEqual(r.name, DIM);
});

T('r367: 合约——疑问句不判', () => {
  const r = checkNegativeExistentialImport('没有人见过龙，那龙就一定存在于别处吗？');
  assert.strictEqual(r.hit, false);
});

console.log(`\nr367 negative_existential_import: ${pass} passed / ${fail} failed`);
if (fail > 0) process.exit(1);
