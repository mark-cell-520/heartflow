/**
 * test/round-172-whole-part-transfer.js — 第 170 维度 whole_part_transfer
 * （整体-部分属性迁移：部分属性推整体属性/整体属性推每个部分属性）
 * 负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入空数组后，依赖该常量的攻击必须停止命中
 *      （证明该腿不是装饰）；依赖某豁免的「陷阱样本」（诸腿俱在但被正确
 *      豁免）在抹掉该豁免后必须转为命中（证明豁免在承重）。
 *
 * 161 轮教训：负例全绿不等于不漏——裸名词/带修饰/倒装/长句变体与边缘良性
 * 另在 variant-matrix 段用真实 gate() 复量。
 */
const assert = require('assert');
const { checkWholePartTransfer } = require('../src/whole-part-transfer.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（无注入必须命中）────────────────────────────────────
const ATTACK_ZH = [
  '每个队员个人能力都很强，所以这支球队一定很强。',               // 组合形：部分量词×质量词×推断词×整体名词×质量词复现
  '每个人都是精英，所以这个团队很强。',                           // 组合形：裸名词「人」
  '所有零件都用的顶级材料，因此这台设备的性能一定极其出色。',       // 组合形：带修饰
  '这个政府里的每个官员都清廉，所以这个政府自然是清廉的。',         // 组合形：裸名词政府
  '这支球队是世界顶级的，所以每个球员都是世界顶级水平。',           // 分解形：整体质量×推断词×部分量词×质量词复现
  '这家公司是全球顶尖的，因此这里的每个员工都是顶尖人才。',         // 分解形：带修饰
];
const ATTACK_EN = [
  'Every player on the roster is elite, so the team is guaranteed to win.',   // 组合形 EN
  'The orchestra is world-class, therefore every musician in it is world-class.', // 分解形 EN
];

// ─── 良性样本（无注入必须放行）────────────────────────────────────
const BENIGN = [
  '每个零件重1公斤，整机一共10个零件，所以整机重10公斤。',           // 显式聚合运算豁免
  '每个人都付出了努力，所以这个项目才能成功。',                     // 部分侧无涌现质量词（努力是投入）
  '这个系统很复杂，所以每个模块都不简单。',                         // 无迁移结构
  '球队输球不是因为某个球员，是整体配合出了问题，每个球员也都尽了全力。', // 否定翻转语境
  '战争是多因共同造成的，不能简单归结为某一个因素。',               // 与整体-部分无关的正确多因陈述
  '每个人都很优秀，但这不意味着这个团队就一定很强。',               // 推理否定豁免
  '组合谬误是常见的逻辑谬误，老师在课堂上讲过。',                   // 概念/教学转述豁免
  'Each panel generates 400W, so the array totals 4.8kW.',          // EN 显式聚合
  'Every musician in the pit orchestra is excellent, and the performance was wonderful too.', // EN 无推断词
];

console.log('\n[round-172 whole_part_transfer] 正向：攻击命中 / 良性放行');
t('全部攻击样本命中（无注入）', () => {
  for (const s of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = checkWholePartTransfer(s);
    assert.ok(r.hit, '未命中: ' + s);
  }
});
t('全部良性样本放行（无注入）', () => {
  for (const s of BENIGN) {
    const r = checkWholePartTransfer(s);
    assert.ok(!r.hit, '误命中: ' + s);
  }
});

console.log('\n[承重] 逐常量注入后依赖腿必须失效');
t('注入空 PART_QUANT_ZH 后中文攻击停火', () => {
  for (const s of ATTACK_ZH) {
    assert.ok(!checkWholePartTransfer(s, { PART_QUANT_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 QUALITY_ZH 后中文攻击停火', () => {
  for (const s of ATTACK_ZH) {
    assert.ok(!checkWholePartTransfer(s, { QUALITY_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 WHOLE_ZH 后中文攻击停火', () => {
  for (const s of ATTACK_ZH) {
    assert.ok(!checkWholePartTransfer(s, { WHOLE_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 INFER_ZH+MODAL_ZH（结论标记全空）后中文攻击停火', () => {
  for (const s of ATTACK_ZH) {
    assert.ok(!checkWholePartTransfer(s, { INFER_ZH: [], MODAL_ZH: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 PART_QUANT_EN 后英文攻击停火', () => {
  for (const s of ATTACK_EN) {
    assert.ok(!checkWholePartTransfer(s, { PART_QUANT_EN: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 QUALITY_EN 后英文攻击停火', () => {
  for (const s of ATTACK_EN) {
    assert.ok(!checkWholePartTransfer(s, { QUALITY_EN: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 WHOLE_EN 后英文攻击停火', () => {
  for (const s of ATTACK_EN) {
    assert.ok(!checkWholePartTransfer(s, { WHOLE_EN: [] }).hit, '仍命中: ' + s);
  }
});
t('注入空 INFER_EN+MODAL_EN 后英文攻击停火', () => {
  for (const s of ATTACK_EN) {
    assert.ok(!checkWholePartTransfer(s, { INFER_EN: [], MODAL_EN: [] }).hit, '仍命中: ' + s);
  }
});

console.log('\n[承重] 豁免腿：诸腿俱在的陷阱样本，抹掉对应豁免必须转为命中');
// 四条陷阱：部分量词×质量词×结论标记×整体名词×质量词复现俱在，各被一条豁免正确放行
const TRAP_AGG = '每个零件都是顶级工艺，整机一共由10个零件组成，所以整机性能一定顶级。';
const TRAP_NEG = '每个人都很优秀，但这不意味着这个团队就一定很强。';
const TRAP_HEDGE = '每个人都很优秀，所以这个团队可能会很强。';
const TRAP_CONCEPT = '每个人都是精英所以这个团队很强的推理，就是典型的组合谬误，课堂上老师讲过。';
t('四条陷阱无注入时放行', () => {
  for (const s of [TRAP_AGG, TRAP_NEG, TRAP_HEDGE, TRAP_CONCEPT]) {
    assert.ok(!checkWholePartTransfer(s).hit, '陷阱被误命中: ' + s);
  }
});
t('抹掉 EXEMPT_AGG_ZH 后显式聚合陷阱转为命中', () => {
  assert.ok(checkWholePartTransfer(TRAP_AGG, { EXEMPT_AGG_ZH: [] }).hit);
});
t('抹掉 EXEMPT_NEG_ZH 后推理否定陷阱转为命中', () => {
  assert.ok(checkWholePartTransfer(TRAP_NEG, { EXEMPT_NEG_ZH: [] }).hit);
});
t('抹掉 EXEMPT_HEDGE_ZH 后对冲陷阱转为命中', () => {
  assert.ok(checkWholePartTransfer(TRAP_HEDGE, { EXEMPT_HEDGE_ZH: [] }).hit);
});
t('抹掉 EXEMPT_CONCEPT_ZH 后概念教学陷阱转为命中', () => {
  assert.ok(checkWholePartTransfer(TRAP_CONCEPT, { EXEMPT_CONCEPT_ZH: [] }).hit);
});

console.log('\n[变体矩阵] 真实 gate()：攻击非 pass / 良性 pass（161 轮强制项）');
// 同族 ≥5 攻击变体（中英、裸名词、带修饰、倒装、长句）
const MATRIX_ATTACK = [
  '每个队员个人能力都很强，所以这支球队一定很强。',
  '所有零件都用的顶级材料，因此这台设备的性能一定极其出色。',
  '这支部队里的每个士兵都很精锐，所以这支部队的战斗力必然十分强悍。',
  '这个政府里的每个官员都清廉，所以这个政府自然是清廉的。',
  '每个班级都很优秀，可见这个学校一定很优秀。',
  '这个项目组里的每一位工程师都是顶尖高手，所以整个项目组攻克这类难题自然不在话下。',
  '这支球队是世界顶级的，所以每个球员都是世界顶级水平。',
  '这家公司是全球顶尖的，因此这里的每个员工都是顶尖人才。',
  '这支乐队享誉全球，可见队里的每一个乐手都是大师级的。',
  'Every player on the roster is elite, so the team is guaranteed to win.',
  'All the engineers are top-tier, which means the whole department must be excellent.',
  'The orchestra is world-class, therefore every musician in it is world-class.',
  'This company is the industry leader, so every employee here is a top performer.',
];
// 边缘良性 ≥5（含「战争是多因共同造成的」式正确陈述与可加量显式合计）
const MATRIX_BENIGN = [
  '每个零件重1公斤，整机一共10个零件，所以整机重10公斤。',
  '球队输球不是因为某个球员，是整体配合出了问题，每个球员也都尽了全力。',
  '战争是多因共同造成的，不能简单归结为某一个因素。',
  '这个系统很复杂，所以每个模块都不简单。',
  '这个班级平均分很高，所以每个学生都考得很好。',
  '组合谬误是常见的逻辑谬误，老师在课堂上讲过。',
  'Each panel generates 400W, so the array totals 4.8kW.',
  'Every musician in the pit orchestra is excellent, and the performance was wonderful too.',
];
t('变体矩阵：全部攻击 gate.action 非 pass', () => {
  for (const s of MATRIX_ATTACK) {
    const a = gate(s).gate.action;
    assert.notStrictEqual(a, 'pass', '攻击被判 pass: ' + s);
  }
});
t('变体矩阵：全部良性 gate.action = pass', () => {
  for (const s of MATRIX_BENIGN) {
    const a = gate(s).gate.action;
    assert.strictEqual(a, 'pass', '良性被拦(action=' + a + '): ' + s);
  }
});

console.log('\n[登记断言] 第 170 维度已接入引擎');
t('dimensions 键数 170 且含 whole_part_transfer', () => {
  const { discriminate } = require('../src/index.js');
  const d = discriminate('neutral baseline text');
  const keys = Object.keys(d.dimensions || {});
  assert.strictEqual(keys.length, 170, 'dimensions 键数 = ' + keys.length + '（应为 170）');
  assert.ok(keys.includes('whole_part_transfer'), 'dimMap 未登记 whole_part_transfer');
});
t('findings 含 whole_part_transfer 且 gate 非 pass', () => {
  const r = gate('每个队员个人能力都很强，所以这支球队一定很强。');
  const f = (r.findings || []).find(x => x.dimension === 'whole_part_transfer');
  assert.ok(f, 'findings 无 whole_part_transfer');
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action = pass');
});
t('DIM_GUIDANCE 指引含 whole_part_transfer 概念条文', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(src.includes("'whole_part_transfer':"), 'index.js 无 whole_part_transfer guidance 键');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
