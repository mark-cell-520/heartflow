#!/usr/bin/env node
'use strict';
/*
 * r362 轮测：Will Rogers 族第三轮缺口补齐（agent-4，真升级类型②）。
 *
 * 立项探针实证（scripts/round-362/probe-r362-candidates.js，改前）：
 * 四组候选 17 条攻击句 gate=pass 穿透 16 条（唯一未穿透样本
 * 「re-binned into new stages」被存量 MIGRATE_RULE_EN 的 new stages
 * 代拦，裁定非缺口）。改后 0/17 穿透。海外扫描空返（arXiv 查询词
 * 被 OR 拆散、GitHub 0 命中、S2 限流），按既有形态自建，家族定义
 * 仍取 Feinstein, Sosin & Wells (1985)。
 *
 * 本轮新族：
 *   腿① MIGRATE_RECLASS2_ZH（分层调整倒装形）、MIGRATE_BETWEEN_EN
 *     （moved some between stages）、MIGRATE_REDRAWN_EN（tiers were
 *     redrawn 被动重画形）、MIGRATE_RECLASS_EN 补 re-stratif /
 *     re-bin / reshuffle 词根、MIGRATE_RECLASS_ZH 补调整分班族；
 *   腿② BOTHUP_ALL_EN（三正则：全称主语 / for everyone / across the
 *     board）、BOTHUP_BOTHOBJ_EN（improved both groups 无 in 形）、
 *     BOTHUP_IDIOM_ZH 扩屡创新高 / 连创新高 / 再创新高 / 屡攀新高 /
 *     节节攀升（与 r357 CASE_SURGE_ZH7 划界：该族判病例数激增不要
 *     求腿①迁移共现，本族须迁移在场）。
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 + FP 嫌疑
 *   组合 + 官方四基准语料全量）/ D 常量级注入-删条承重（双族承重
 *   须同置后备族）/ E 存量回归引用 / F 边界锁 / G 登记纪律。
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const { detectWillRogersPhenomenon, __internals } = require(path.join(ROOT, 'src', 'will-rogers-phenomenon.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const ergMod = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const hit = (t, inj) => detectWillRogersPhenomenon(t, inj).hit === true;

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 本轮新形攻击集（探针实证改前 gate=pass 穿透）──────────────────
const ATTACK_NEW = [
  // A 组 EN 腿②全称提升（BOTHUP_ALL_EN 三正则，存量 BE1–BE5 全部
  //   要求 both 在前或 in both，全称形零覆盖）
  "After the reshuffle, everyone's scores improved.",
  'Regrouping the classes lifted scores across the board.',
  'Re-binning the students left all of them doing better.',
  'Once the tiers were redrawn, scores rose for everyone.',
  'The re-stratification moved several patients, and all patients did better.',
  // B 组 ZH 腿②成语扩词（与 r357 CASE_SURGE_ZH7 划界：须腿①在场）
  '重新分组之后，两组的成绩屡创新高。',
  '调整分班之后，两个班的分数连创新高。',
  '转班之后，两个班的平均分节节攀升。',
  '重新分层之后，两组的指标再创新高。',
  // C 组 ZH 腿①分层调整倒装形（存量只收正序整词）
  '学校调整了一下分层，两组的及格率都提高了。',
  '老师重新分了层，两个班的平均分一起涨了。',
  '教务处变动了一下分层，两组的成绩都上升了。',
  // D 组 EN 腿①迁移新形
  "Re-stratifying the patients moved some between stages, and both stages' survival rose.",
  'Re-binning the students by the new rule improved both groups.',
  "Once the brackets were redrawn, both brackets' averages rose.",
];

// ─── 本轮良性集（模块层必须 miss）──────────────────────────────
const BENIGN_NEW = [
  // 个体层面归因 → 豁免 C
  "After the reshuffle, every student improved because each one practiced more.",
  '调整了一下分层之后，两组成绩都提高了，因为每个学生都多做了练习。',
  // 无腿①的非分组域（全称/成语形单独出现不判）
  'Sales rose across the board after the product launch.',
  '公司业绩屡创新高，因为市场需求真实增长。',
  '重新分组后，两个班的成绩水涨船高，但这只是统计假象，需要核对个体数据。',
  // 方向相反 → 腿②天然排除
  'After re-binning, one group improved and the other declined.',
  '调整了一下分层之后，两组的成绩一个升一降。',
  // 概念教学 → 腿②排除
  'Re-stratification is a known source of the Will Rogers phenomenon.',
  // 非分组域 + 非指标名词（ACROSS_EN 名词收紧实证）
  'Re-sorting the inbox improved response times across the board.',
  'The battle lines were redrawn after the debate.',
  // 非分组组名词（BOTHOBJ_EN 腿②须分组名词）
  'The new tutorial improved both groups of volunteers in the study.',
];

// ─── A. gate 层归因 ────────────────────────────────────────────
check('A gate 层归因：新形攻击 15/15 → econ_reasoning_gate findings 且 action≠pass', () => {
  for (const s of ATTACK_NEW) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'econ_reasoning_gate');
    assert.ok(f, 'findings 缺 econ_reasoning_gate: ' + s);
    assert.ok(f.severity >= 60, 'severity 不足: ' + s);
  }
});

// ─── B. 模块直调 ───────────────────────────────────────────────
check('B 模块直调：新形攻击 15/15 HIT', () => {
  for (const s of ATTACK_NEW) assert.strictEqual(hit(s), true, '未命中: ' + s);
});

// ─── C. 良性零误伤 ─────────────────────────────────────────────
check('C 良性零误伤：本轮良性 12/12 不判', () => {
  for (const s of BENIGN_NEW) assert.strictEqual(hit(s), false, '误判: ' + s);
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
      const r = detectWillRogersPhenomenon(s);
      if (r.hit) { fp++; hits.push(s.slice(0, 60)); }
    }
  }
  assert.strictEqual(fp, 0, `基准语料误命中 ${fp}/${n}: ${hits.join(' | ')}`);
});

// ─── D. 常量级注入-删条承重 ────────────────────────────────────
check('D 注入 MIGRATE_RECLASS2_ZH=[] → 倒装分层形失效', () => {
  for (const s of ['学校调整了一下分层，两组的及格率都提高了。', '老师重新分了层，两个班的平均分一起涨了。']) {
    assert.strictEqual(hit(s), true);
    assert.strictEqual(hit(s, { MIGRATE_RECLASS2_ZH: [] }), false, '删词后仍命中: ' + s);
  }
  // 存量正序形不受影响（RECLASS_ZH 仍承重）
  assert.strictEqual(hit('按新的分层标准重新分层调整之后，两组的治愈率都提高了。', { MIGRATE_RECLASS2_ZH: [] }), true, '存量词被误删');
});
check('D 注入 MIGRATE_RECLASS_ZH 去调整分班 → 分班迁移形失效', () => {
  const s = '调整分班之后，两个班的分数连创新高。';
  const noFenban = /(?:重新分期|重新分组|重新分类|重新划归|重新划定|重新归类|调整分组|调整分期|重新编制|分层调整|分层变动|层次调整|分层重新划分|换(?:了)?(?:标准|口径|分组方式|计分方式)|分期标准(?:的)?(?:调整|改变|更新|更换|修订)|分组(?:规则|标准|口径)(?:的)?(?:调整|改变|更新|更换|变化)|新的(?:分期|分组|分类|分班)(?:标准|规则|方案|办法)|标准一改|口径一变|标准变化|分组方式变)/;
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIGRATE_RECLASS_ZH: [noFenban] }), false, '删词后仍命中');
  assert.strictEqual(hit('重新分层之后，两组的指标再创新高。', { MIGRATE_RECLASS_ZH: [noFenban] }), true, '存量词被误删');
});
check('D 注入 MIGRATE_BETWEEN_EN=[] → between 目标介词形失效', () => {
  const s = "Re-stratifying the patients moved some between stages, and both stages' survival rose.";
  assert.strictEqual(hit(s), true);
  // 腿①同时由 MIGRATE_RECLASS_EN 的 re-stratif 词根承重，精准删词须
  // 一并置空后备腿①族，否则删词不生效（双腿双族承重）。
  const inj = { MIGRATE_BETWEEN_EN: [], MIGRATE_RECLASS_EN: [] };
  assert.strictEqual(hit(s, inj), false, '删词后仍命中');
  // 存量 from...to... 形不受影响（leg① 仍由 E1 re-stratif 承重）
  assert.strictEqual(hit("Re-stratifying moved patients from early to late stage, and both stages' survival rose.", { MIGRATE_BETWEEN_EN: [] }), true, '存量 from...to 形被误删');
});
check('D 注入 MIGRATE_REDRAWN_EN=[] → 被动重画形失效', () => {
  const s = "Once the brackets were redrawn, both brackets' averages rose.";
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIGRATE_REDRAWN_EN: [] }), false, '删词后仍命中');
  // 非分组域被动句不判（组名词前置收紧实证）
  assert.strictEqual(hit('The battle lines were redrawn after the debate.'), false);
});
check('D 注入 MIGRATE_RECLASS_EN 去 re-stratif/re-bin/reshuffle 词根 → 对应形失效', () => {
  const noRoots = /\b(?:reclassif(?:y|ied|ies|ying|ication)|re-?stag(?:e|ed|es|ing)|re-?assign(?:ed|ing|ment)?|re-?group(?:ed|ing)?|re-?categoriz(?:e|ed|ing|ation)|re-?labell?ed|re-?sort(?:ed|ing)?)\b/i;
  const s1 = "Re-stratifying the patients moved some between stages, and both stages' survival rose.";
  const s2 = 'Re-binning the students by the new rule improved both groups.';
  const s3 = "After the reshuffle, everyone's scores improved.";
  for (const s of [s1, s2, s3]) {
    assert.strictEqual(hit(s), true);
    // s2/s3 有 MIGRATE_RULE_EN / MIGRATE_BETWEEN_EN 后备覆盖时须一并置空
    const inj = { MIGRATE_RECLASS_EN: [noRoots], MIGRATE_RULE_EN: [], MIGRATE_BETWEEN_EN: [] };
    assert.strictEqual(hit(s, inj), false, '删词根后仍命中: ' + s);
  }
  // 存量 reclassif 词根不受影响
  assert.strictEqual(hit('Reclassifying the students improved both groups.', { MIGRATE_RECLASS_EN: [noRoots] }), true, '存量词根被误删');
});
check('D 注入 BOTHUP_ALL_EN 族=[] → EN 全称提升三形失效', () => {
  for (const s of ["After the reshuffle, everyone's scores improved.", 'Once the tiers were redrawn, scores rose for everyone.', 'Regrouping the classes lifted scores across the board.']) {
    assert.strictEqual(hit(s), true);
    const inj = { BOTHUP_ALL_EN: [] };
    // redrawn 样本腿①由 REDRAWN 承重，仅腿②被删 → 不命中
    assert.strictEqual(hit(s, inj), false, '删词后仍命中: ' + s);
  }
  // 存量 in both 形不受影响
  assert.strictEqual(hit("The new staging criteria shifted some patients, and survival improved in both groups.", { BOTHUP_ALL_EN: [] }), true, '存量腿②被误删');
});
check('D 注入 BOTHUP_BOTHOBJ_EN=[] → improved both groups 无 in 形失效', () => {
  const s = 'Re-binning the students by the new rule improved both groups.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { BOTHUP_BOTHOBJ_EN: [] }), false, '删词后仍命中');
  // 存量 in both 形不受影响
  assert.strictEqual(hit("Re-binning the students improved survival in both groups.", { BOTHUP_BOTHOBJ_EN: [] }), true, '存量腿②被误删');
});
check('D 注入 BOTHUP_IDIOM_ZH 去扩词 → 屡创新高族失效', () => {
  const noNew = /(?:水涨船高|步步高升)/;
  for (const s of ['重新分组之后，两组的成绩屡创新高。', '转班之后，两个班的平均分节节攀升。']) {
    assert.strictEqual(hit(s), true);
    assert.strictEqual(hit(s, { BOTHUP_IDIOM_ZH: [noNew] }), false, '删词后仍命中: ' + s);
  }
  // 存量成语形不受影响
  assert.strictEqual(hit('重新分组之后，两组的指标水涨船高。', { BOTHUP_IDIOM_ZH: [noNew] }), true, '存量成语被误删');
});

// ─── E. 存量回归 ───────────────────────────────────────────────
check('E 存量回归：r360/r361 攻击样本在新树下仍全部 HIT', () => {
  const legacy = [
    // r360 存量形
    '新的分期标准把一部分轻症病人从晚期移到早期，结果早期和晚期的生存率都提高了。',
    '把垫底的学生分到慢班之后，快班和慢班的平均分一起涨了。',
    "Moving the weakest students to the remedial class raised the average of both classes.",
    "Changing the cut-offs moved several patients between stages, and both stages' survival improved.",
    // r361 存量形（成语族/批量族/分层调整族）
    '重新分组之后，两组的指标水涨船高。',
    '重新分组后，两个班的分数齐刷刷地涨了。',
    '转班之后，两个班的成绩一律提升了。',
    '按新的分层标准重新分层调整之后，两组的治愈率都提高了。',
  ];
  for (const s of legacy) assert.strictEqual(hit(s), true, '存量形回归: ' + s);
});
check('E 存量回归：族表 key 无重复、双腿族数 = 24', () => {
  const I = __internals();
  const zhLeg1 = ['MIGRATE_FROM_TO_ZH', 'MIGRATE_RECLASS_ZH', 'MIGRATE_ASSIGN_ZH', 'MIGRATE_MOVE_ZH', 'MIGRATE_RECLASS2_ZH'];
  const enLeg1 = ['MIGRATE_RECLASS_EN', 'MIGRATE_FROM_TO_EN', 'MIGRATE_RULE_EN', 'MIGRATE_TOGROUP_EN', 'MIGRATE_SPLIT_EN', 'MIGRATE_BETWEEN_EN', 'MIGRATE_REDRAWN_EN'];
  const zhLeg2 = ['BOTHUP_ALL_ZH', 'BOTHUP_DOUBLE_ZH', 'BOTHUP_TWOGROUP_ZH', 'BOTHUP_GROUPNOUN_ZH', 'BOTHUP_IDIOM_ZH'];
  const enLeg2 = ['BOTHUP_BOTHGROUPS_EN', 'BOTHUP_RAISEDBOTH_EN', 'BOTHUP_MADEBOTH_EN', 'BOTHUP_BOTHUP_EN', 'BOTHUP_INBOTH_EN', 'BOTHUP_ALL_EN', 'BOTHUP_BOTHOBJ_EN'];
  const all = [...zhLeg1, ...enLeg1, ...zhLeg2, ...enLeg2];
  assert.strictEqual(all.length, 24, '腿族总数应为 24（ZH腿①5 + EN腿①7 + ZH腿②5 + EN腿②7）');
  assert.strictEqual(new Set(all).size, all.length, '族名重复');
  for (const k of all) assert.ok(I[k] !== undefined, '__internals 缺 ' + k);
});

// ─── F. 边界锁 ─────────────────────────────────────────────────
check('F 边界锁：辛普森悖论（两组方向相反）不被本族命中', () => {
  assert.strictEqual(hit('总体上死亡率下降了，所以这个治疗方案更安全，然而每个科室的死亡率都在上升。'), false);
});
check('F 边界锁：检出时点假象（survivor_time_bias 领地）不被本族命中', () => {
  assert.strictEqual(hit('体检普及之后确诊年龄提前，五年生存率上升可能只是提前记账，需要对照总死亡率判断。'), false);
});
check('F 边界锁：r357 CASE_SURGE_ZH7 划界——病例数激增无腿①时不归本族判', () => {
  // 筛查域病例数激增族不要求腿①迁移共现（其领地）；本族须腿①在场
  assert.strictEqual(hit('筛查普及之后，确诊人数屡创新高，但这只是病例池变宽了。'), false);
});
check('F 边界锁：__internals 暴露本轮新增常量', () => {
  const I = __internals();
  assert.ok(I.MIGRATE_RECLASS2_ZH !== undefined, '__internals 缺 MIGRATE_RECLASS2_ZH');
  assert.ok(I.MIGRATE_RECLASS2_ZH.source.includes('重新分'), 'MIGRATE_RECLASS2_ZH 未收重新分层');
  assert.ok(I.MIGRATE_BETWEEN_EN !== undefined, '__internals 缺 MIGRATE_BETWEEN_EN');
  assert.ok(I.MIGRATE_BETWEEN_EN.source.includes('between'), 'MIGRATE_BETWEEN_EN 未收 between');
  assert.ok(I.MIGRATE_REDRAWN_EN !== undefined, '__internals 缺 MIGRATE_REDRAWN_EN');
  assert.ok(I.MIGRATE_REDRAWN_EN.source.includes('drawn'), 'MIGRATE_REDRAWN_EN 未收 redrawn');
  assert.ok(I.MIGRATE_RECLASS_EN.source.includes('stratif'), 'MIGRATE_RECLASS_EN 未收 re-stratif 词根');
  assert.ok(I.MIGRATE_RECLASS_EN.source.includes('reshuffl'), 'MIGRATE_RECLASS_EN 未收 reshuffle 词根');
  assert.ok(I.MIGRATE_RECLASS_ZH.source.includes('调整分班'), 'MIGRATE_RECLASS_ZH 未收调整分班');
  assert.ok(I.BOTHUP_ALL_EN !== undefined, '__internals 缺 BOTHUP_ALL_EN');
  assert.ok(I.BOTHUP_ALL_EN.source.includes('everyone'), 'BOTHUP_ALL_EN 未收 everyone');
  assert.ok(I.BOTHUP_BOTHOBJ_EN !== undefined, '__internals 缺 BOTHUP_BOTHOBJ_EN');
  assert.ok(I.BOTHUP_IDIOM_ZH.source.includes('屡创新高'), 'BOTHUP_IDIOM_ZH 未收屡创新高');
});

// ─── G. 登记纪律 ───────────────────────────────────────────────
check('G 登记纪律：econ-reasoning-gate 族表无重复 key', () => {
  const keys = ergMod.FAMILIES.map(f => f.key);
  assert.strictEqual(new Set(keys).size, keys.length, '族表有重复 key');
});
check('G 登记纪律：src/index.js 本轮零改动（聚合族范式）', () => {
  const fs = require('node:fs');
  const idx = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(!idx.includes('will-rogers-phenomenon'), 'index.js 不应引用本模块');
  assert.ok(idx.includes('econ_reasoning_gate'), 'index.js 应仍持有 econ_reasoning_gate 接入点');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
