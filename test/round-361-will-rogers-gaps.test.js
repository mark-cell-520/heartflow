'use strict';
/**
 * test/round-361-will-rogers-gaps.test.js
 * [r361] Will Rogers 族剩余缺口补齐 + 「全不」否定形缺陷修复
 * （econ_reasoning_gate 聚合族第 20 子族扩容，src/index.js 零改动、
 * 维度计数 257 不变，同 r360 先例）。
 *
 * 真升级类型②：已有维度的全新措辞家族（r360 交接项定拨）。
 *
 * 立项缺口实证（scripts/round-361/probe-candidates.js +
 * probe-attribute2.js，v6.8.186 基线 gate() 口径）：
 *   · A ZH 腿①：转班 / 并班 / 并班重排 三条攻击 gate=pass 且
 *     traceSummary「无命中」零维度承重 → 真空缺，落地；
 *   · B ZH 腿②：水涨船高 / 齐刷刷 / 一律 三条攻击 gate=pass 零承重
 *     → 真空缺，落地；
 *   · 分层调整 / 分层变动 / 无一例外 三条模块层 miss 但 gate 层已被
 *     pseudo_causal / law_of_small_numbers / hasty_generalization 代拦
 *     → 非 gate 缺口，按模块层双保险补齐（负例注入在模块层证承重）；
 *   · C EN 腿② fared 动词形经探针实证**非缺口**——「both cohorts
 *     fared better」已被 BOTHUP_BOTHGROUPS_EN 的 better 兜底代拦
 *     （module=HIT）→ 不新增动词，r360 交接项③ fared 部分结案；
 *   · D 潜在缺陷：BOTHUP_ALL_ZH 的「全不」把否定形「两组全不提高」
 *     当成改善断言（module=HIT 归因 econ_reasoning_gate）→ 删除，
 *     换「无一例外 / 毫无例外」强调形与「齐刷刷 / 一律 / 清一色」批量形；
 *   · E EN 腿① cut-offs：r360 已补正则且有攻击样本承重，本轮补独属
 *     负例样本（删 cut-?offs? 后该样本模块层失效）。
 *
 * 海外扫描：arXiv 三轮（查询词被 OR 拆散，返回天文/视频扩散/量子霍尔
 * 等无关条目）、GitHub 三轮 0 命中、S2 限流——空返，按既有形态自建，
 * 家族定义仍取 Feinstein, Sosin & Wells (1985) 与 Sormani et al. (2004)。
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 + 官方四基准
 *   语料全量 + A/B 双树对照）/ D 常量级注入-删条承重（含精准删词：
 *   只删本轮新词不动 r360 存量词）/ E 全不缺陷修复回归 / F 边界锁 /
 *   G 登记纪律。
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

// ─── 本轮新形攻击集（探针实证修复前 gate=pass 零维度承重）────────────
const ATTACK_NEW = [
  // 腿① 转班 / 并班（MIGRATE_MOVE_ZH 补词）
  '学校按新方案给一批学生转班，两个班的平均分都提高了。',
  '并班之后，两个班的成绩一起涨了。',
  '学校把两个班并班重排，快班和慢班的及格率都上升了。',
  // 腿① 分层调整名词形（MIGRATE_RECLASS_ZH 补词——gate 层已被
  //   pseudo_causal 代拦，模块层双保险）
  '按新的分层标准重新分层调整之后，两组的治愈率都提高了。',
  '重新分层变动后，两组的生存率双双上升。',
  // 腿② 水涨船高成语形（BOTHUP_IDIOM_ZH 新族）
  '重新分组之后，两组的指标水涨船高。',
  // 腿② 无一例外强调形（BOTHUP_ALL_ZH 补词）
  '调整分组之后，两组成绩无一例外地提高了。',
  // 腿② 齐刷刷 / 一律批量形（BOTHUP_ALL_ZH 补词）
  '重新分组后，两个班的分数齐刷刷地涨了。',
  '转班之后，两个班的成绩一律提升了。',
  // EN 腿① cut-offs 独属样本（r360 补词的本轮负例锚点）
  "Changing the cut-offs moved several patients between stages, and both stages' survival improved.",
];
// 「全不」否定形：修复前 module=HIT（缺陷），修复后必须 module=miss
const NEG_BUG = [
  '重新分组之后，两组全不提高，改革毫无效果。',
  '调整分组后，两组成绩全不上升，说明方法有问题。',
];
// ─── 本轮良性集（模块层必须 miss）──────────────────────────────
const BENIGN_NEW = [
  // 两组方向相反 → 腿②天然排除
  '学校按新方案给一批学生转班，两个班的成绩一升一降。',
  '并班之后，两个班的成绩毫无变化。',
  '重新分层调整之后，两组的治愈率一个升一个降。',
  // 正确响应形 → 豁免 B
  '重新分组后，两个班的成绩水涨船高，但这只是统计假象。',
  // 个体层面归因 → 豁免 C
  '转班之后，两个班的成绩都提高了，因为每个学生都多做了练习。',
  'Every student in both cohorts fared better after the new training program.',
  // 无腿①的非分组迁移
  '公司把文件转到了档案库，两个文件夹的大小都变大了。',
  // 「全不」否定形（缺陷修复回归样本）
  ...NEG_BUG,
];

// ─── A. gate 层归因 ────────────────────────────────────────────
check('A gate 层归因：新形攻击 11/11 → econ_reasoning_gate findings 且 action≠pass', () => {
  for (const s of ATTACK_NEW) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'econ_reasoning_gate');
    assert.ok(f, 'findings 缺 econ_reasoning_gate: ' + s);
    assert.ok(f.severity >= 60, 'severity 不足: ' + s);
  }
});

// ─── B. 模块直调 ───────────────────────────────────────────────
check('B 模块直调：新形攻击 11/11 HIT', () => {
  for (const s of ATTACK_NEW) assert.strictEqual(hit(s), true, '未命中: ' + s);
});
check('B 模块直调：「全不」否定形 2/2 miss（缺陷修复）', () => {
  for (const s of NEG_BUG) assert.strictEqual(hit(s), false, '仍误判: ' + s);
});

// ─── C. 良性零误伤 ─────────────────────────────────────────────
check('C 良性零误伤：本轮良性 9/9 不判', () => {
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
  assert.ok(n >= 360, '语料条数不足: ' + n);
  assert.strictEqual(fp, 0, '误伤 ' + fp + ' 条: ' + hits.join(' | '));
});
check('C A/B 双树对照：移除本家族后攻击全失效、良性两树下均不判', () => {
  // 19 个腿组逐个置空（腿② ZH 现为五组，含 r361 新增 BOTHUP_IDIOM_ZH）
  const blank = {
    MIGRATE_FROM_TO_ZH: [], MIGRATE_RECLASS_ZH: [], MIGRATE_ASSIGN_ZH: [], MIGRATE_MOVE_ZH: [],
    MIGRATE_RECLASS_EN: [], MIGRATE_FROM_TO_EN: [], MIGRATE_RULE_EN: [], MIGRATE_TOGROUP_EN: [], MIGRATE_SPLIT_EN: [],
    BOTHUP_ALL_ZH: [], BOTHUP_IDIOM_ZH: [], BOTHUP_DOUBLE_ZH: [], BOTHUP_TWOGROUP_ZH: [], BOTHUP_GROUPNOUN_ZH: [],
    BOTHUP_BOTHGROUPS_EN: [], BOTHUP_RAISEDBOTH_EN: [], BOTHUP_MADEBOTH_EN: [], BOTHUP_BOTHUP_EN: [], BOTHUP_INBOTH_EN: [],
  };
  for (const s of ATTACK_NEW) {
    assert.strictEqual(hit(s, blank), false, '注入后仍命中（腿组不承重）: ' + s);
  }
  for (const s of BENIGN_NEW) {
    assert.strictEqual(hit(s), false, '误判: ' + s);
    assert.strictEqual(hit(s, blank), false, '注入后误判: ' + s);
  }
});
// 三条基线即非 pass 的良性样本（探针 r361-probe-attribute2 基线实测）：
// gate action 锁定为基线值 verify，归因为存量维度（law_of_small_numbers /
// standard_shift / 空 trace 基线），证明本轮新词没有改变它们的归因。
check('C 基线锁定：三条存量 verify 良性样本 gate action 与模块归因不变', () => {
  const baseline = [
    ['重新分层调整之后，两组的治愈率一个升一个降。', 'verify'],
    ['重新分组后，两个班的成绩水涨船高，但这只是统计假象。', 'verify'],
    ['转班之后，两个班的成绩都提高了，因为每个学生都多做了练习。', 'verify'],
  ];
  for (const [s, act] of baseline) {
    assert.strictEqual(gate(s).gate.action, act, 'gate action 偏离基线: ' + s);
    assert.strictEqual(hit(s), false, '模块层误判: ' + s);
  }
});

// ─── D. 常量级注入-删条承重（精准删词：只删本轮新词，r360 存量词不动）──
// r360 版 MIGRATE_MOVE_ZH（无 转班/并班/并组）
const MIGRATE_MOVE_ZH_R360 = /(?:组间迁移|病人迁移|患者迁移|学员迁移|学生迁移|转组|换组|换班|调班|迁移|再分类|重新划分)/;
check('D 注入 MIGRATE_MOVE_ZH 旧版（去转班/并班）→ 转班/并班攻击失效', () => {
  const a = '学校按新方案给一批学生转班，两个班的平均分都提高了。';
  const b = '并班之后，两个班的成绩一起涨了。';
  const c = '学校把两个班并班重排，快班和慢班的及格率都上升了。';
  for (const s of [a, b, c]) {
    assert.strictEqual(hit(s), true);
    assert.strictEqual(hit(s, { MIGRATE_MOVE_ZH: [MIGRATE_MOVE_ZH_R360] }), false, '删词后仍命中: ' + s);
  }
  // 存量词不受影响（证明只删了新词）
  const legacy = '这次组间迁移之后，早期组和晚期组的生存率都提高了。';
  assert.strictEqual(hit(legacy, { MIGRATE_MOVE_ZH: [MIGRATE_MOVE_ZH_R360] }), true, '存量词被误删');
});
// r360 版 MIGRATE_RECLASS_ZH（无 分层调整/分层变动/层次调整/分层重新划分）
const MIGRATE_RECLASS_ZH_R360 = /(?:重新分期|重新分组|重新分类|重新划归|重新划定|重新归类|调整分组|调整分期|重新编制|换(?:了)?(?:标准|口径|分组方式|计分方式)|分期标准(?:的)?(?:调整|改变|更新|更换|修订)|分组(?:规则|标准|口径)(?:的)?(?:调整|改变|更新|更换|变化)|新的(?:分期|分组|分类|分班)(?:标准|规则|方案|办法)|标准一改|口径一变|标准变化|分组方式变)/;
check('D 注入 MIGRATE_RECLASS_ZH 旧版（去分层调整）→ 分层调整攻击失效', () => {
  const a = '按新的分层标准重新分层调整之后，两组的治愈率都提高了。';
  const b = '重新分层变动后，两组的生存率双双上升。';
  for (const s of [a, b]) {
    assert.strictEqual(hit(s), true);
    assert.strictEqual(hit(s, { MIGRATE_RECLASS_ZH: [MIGRATE_RECLASS_ZH_R360] }), false, '删词后仍命中: ' + s);
  }
  const legacy = '重新分期之后，早期组和晚期组的生存率都提升了。';
  assert.strictEqual(hit(legacy, { MIGRATE_RECLASS_ZH: [MIGRATE_RECLASS_ZH_R360] }), true, '存量词被误删');
});
// r360 版 BOTHUP_ALL_ZH（全不版，无 无一例外/齐刷刷/一律）
const BOTHUP_ALL_ZH_R360 = /(?:都|皆|均|统统|全都|全不|一并)[^。，！？；\n]{0,4}(?:提高|提升|上升|升高|增长|增加|改善|好转|变好|涨了|上涨|走高|翻倍|进步|跑赢|胜出)/;
check('D 注入 BOTHUP_ALL_ZH 旧版（去无一例外/齐刷刷/一律）→ 新腿②攻击失效', () => {
  const a = '调整分组之后，两组成绩无一例外地提高了。';
  const b = '重新分组后，两个班的分数齐刷刷地涨了。';
  const c = '转班之后，两个班的成绩一律提升了。';
  for (const s of [a, b, c]) {
    assert.strictEqual(hit(s), true);
    assert.strictEqual(hit(s, { BOTHUP_ALL_ZH: [BOTHUP_ALL_ZH_R360] }), false, '删词后仍命中: ' + s);
  }
  const legacy = '重新分组后，及格率都上升了。';
  assert.strictEqual(hit(legacy, { BOTHUP_ALL_ZH: [BOTHUP_ALL_ZH_R360] }), true, '存量词被误删');
});
check('D 注入 BOTHUP_IDIOM_ZH=[] → 水涨船高攻击失效', () => {
  const s = '重新分组之后，两组的指标水涨船高。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { BOTHUP_IDIOM_ZH: [] }), false);
});
check('D 注入 MIGRATE_RULE_EN 去 cut-offs → cut-offs 独属样本失效（r360 补词承重）', () => {
  const s = "Changing the cut-offs moved several patients between stages, and both stages' survival improved.";
  const noCutoffs = /\b(?:chang(?:e|ed|ing|es)|revis(?:e|ed|ing|ion)|updat(?:e|ed|ing)|new|adjust(?:ed|ing|ment)?)\s+(?:the\s+)?(?:grouping|groups?|staging|stages?|classifications?|categories|categorisation|grading|brackets?|thresholds?)\s*(?:rules?|criteria|schemes?|standards?|boundar(?:y|ies))?\b/i;
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIGRATE_RULE_EN: [noCutoffs] }), false, '删 cut-offs 后仍命中');
  // 存量 grouping rule 形不受影响
  const legacy = "Changing the grouping rule made both groups' numbers better at the same time.";
  assert.strictEqual(hit(legacy, { MIGRATE_RULE_EN: [noCutoffs] }), true, '存量词被误删');
});

// ─── E. 「全不」缺陷修复回归 ───────────────────────────────────
check('E 缺陷回归：注入 r360 全不版 BOTHUP_ALL_ZH → 否定形翻转为命中（证修复前是 bug）', () => {
  for (const s of NEG_BUG) {
    assert.strictEqual(hit(s), false, '修复后仍误判: ' + s);
    assert.strictEqual(hit(s, { BOTHUP_ALL_ZH: [BOTHUP_ALL_ZH_R360] }), true, '旧版下未复现 bug: ' + s);
  }
});
check('E 缺陷回归：现存腿组常量已不含「全不」字面', () => {
  const I = __internals();
  for (const k of ['BOTHUP_ALL_ZH', 'BOTHUP_DOUBLE_ZH', 'BOTHUP_TWOGROUP_ZH', 'BOTHUP_GROUPNOUN_ZH', 'BOTHUP_IDIOM_ZH']) {
    const re = I[k];
    assert.ok(!re.source.includes('全不'), k + ' 仍含「全不」');
  }
});

// ─── F. 边界锁 ─────────────────────────────────────────────────
check('F 边界锁：辛普森悖论（两组方向相反）不被本族命中', () => {
  assert.strictEqual(hit('总体上死亡率下降了，所以这个治疗方案更安全，然而每个科室的死亡率都在上升。'), false);
});
check('F 边界锁：检出时点假象（survivor_time_bias 领地）不被本族命中', () => {
  assert.strictEqual(hit('体检普及之后确诊年龄提前，五年生存率上升可能只是提前记账，需要对照总死亡率判断。'), false);
});
check('F 边界锁：小基数比例（statistical_misleading 领地）不被本族命中', () => {
  assert.strictEqual(hit('用户满意度提升了 300%，从 2 个人涨到了 8 个人。'), false);
});
check('F 边界锁：__internals 暴露本轮新增常量', () => {
  const I = __internals();
  assert.ok(I.BOTHUP_IDIOM_ZH !== undefined, '__internals 缺 BOTHUP_IDIOM_ZH');
  assert.ok(I.MIGRATE_MOVE_ZH.source.includes('转班'), 'MIGRATE_MOVE_ZH 未收转班');
  assert.ok(I.MIGRATE_RECLASS_ZH.source.includes('分层调整'), 'MIGRATE_RECLASS_ZH 未收分层调整');
  assert.ok(I.BOTHUP_ALL_ZH.source.includes('无一例外'), 'BOTHUP_ALL_ZH 未收无一例外');
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
