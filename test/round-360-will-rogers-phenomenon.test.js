'use strict';
/**
 * test/round-360-will-rogers-phenomenon.test.js
 * [r360] Will Rogers 现象（分期迁移）——econ_reasoning_gate 聚合族第 20
 * 子族（src/index.js 零改动、维度计数 257 不变，同 r336/r339 先例）。
 *
 * 真升级类型②：已有维度的全新措辞家族。
 *
 * 立项缺口实证（scripts/round-360/probe-candidates.js，v6.8.186 基线
 * gate() 口径）五候选定拨：
 *   · A 筛查 lead-time/length-time 偏误族：攻击 10 条仅 3 条穿透，强形
 *     被 post_hoc / survivor_time_bias / reverse_causation / pseudo_causal
 *     代拦，缺口强度不足，放弃；
 *   · B Will Rogers 分期迁移族：攻击 9 条 **6 条穿透且 traceSummary
 *     全部「无命中」零维度承重**，良性 4/4 零误伤 → **胜出**；
 *   · C econ 机会成本族：7 条仅 1 条穿透（已被 econ_reasoning_gate 自身
 *     代拦——r336 已落地），放弃；
 *   · D 量词移位/存在谬误族：5 条仅 2 条穿透（强形被 absolute_claim /
 *     perfect_error / stereotype 代拦），放弃；
 *   · E Berkson 住院选择形：4 条 2 条穿透（collider_bias COND_EN 共享
 *     常量缺口，第 7 次留交 1 号裁决，不动）。
 *
 * 补丁（新增 src/will-rogers-phenomenon.js + 两处 FAMILIES 注册）：
 *   腿① MIGRATE 组间迁移/重新分类在场：ZH 四组（从A移到B 迁移动词 /
 *     重新分期分组名词 / 分班调组动词 / 迁移语义裸族）+ EN 五组
 *     （reclassifying / moved from...to... / grouping rule change /
 *     move...to/into <组名词> / split into groups）；
 *   腿② BOTH_UP 两组同时改善断言：ZH 四组（都+上升动词 / 双双一起 /
 *     两组都+名词+上升 / 两组名词+和+两组名词+上升）+ EN 五组
 *     （both groups ... improved / raised the average of both /
 *     made both ... better / both ... went up / improved in both groups）；
 *   窗 PAIR_ZH 60 / PAIR_EN 160；强否定前缀守卫 + 递进连词不判否定；
 *   腿① MIGRATE_FROM_TO_ZH / MIGRATE_ASSIGN_ZH 收紧：命中须邻近组名词；
 *   三组豁免：A CONCEPT 概念教学 / B CORRECT 正确响应形（否认成效 +
 *     要求核对个体数据，ZH 3 条 + EN 3 条）/ C INDIV 个体层面归因
 *     （改善来自每个个体自身）。
 *
 * 构造期修掉的两个正则缺陷（均为负例注入-删条实证后返工）：
 *   ① `classes?` 在正则里解析为 classe + 可选 s，永不匹配单数 class——
 *      "Moving ... to the remedial class" 与 "raised the average of both
 *      classes" 两族整族穿透，改 `class(?:es)?`（4 处）；
 *   ② EN 迁移动词族强制要求 from，"move X to Y" 无 from 形穿透，补
 *      MIGRATE_TOGROUP_EN；改善词在前的 "improved in both groups" 形
 *      穿透，补 BOTHUP_INBOTH_EN；ZH 补「调到」动词形。
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 + 官方四基准
 *   语料全量 + A/B 双树对照）/ D 聚合桥与插件注册 / E 常量级注入-删条
 *   承重（腿组 + 窗 + 豁免逐项）/ F 边界锁（近邻维度领地）/ G 登记纪律。
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

// ─── 攻击集（ZH 10 + EN 9：临床分期迁移 / 学校分班 / 分组口径变更 /
// 员工分组 / 区域分组 × reclassifying / regrouping / staging criteria）──
const ATTACK_ZH = [
  '新的分期标准把一部分轻症病人从晚期移到早期，结果早期和晚期的生存率都提高了。',
  '把垫底的学生分到慢班之后，快班和慢班的平均分一起涨了。',
  '标准一改，早期组和晚期组的治愈率双双上升，这是医疗水平的提升。',
  '重新分期之后，早期组和晚期组的生存率都提升了。',
  '按新标准重新分组后，两个班的及格率都上升了。',
  '把成绩靠后的学生调到普通班，重点班和普通班的平均分双双上涨。',
  '调整分组口径之后，两组的数字同时变好了。',
  '新的分班方案把几个学生调进实验班，实验班和普通班的成绩都提高了。',
  '重新划定风险层级后，高风险组和低风险组的达标率都上升了。',
  '分组规则调整完，甲组和乙组的人均产出都增长了。',
];
const ATTACK_EN = [
  "Reclassifying patients moved some from the advanced to the early group, and both groups' survival rates improved.",
  'Moving the weakest students to the remedial class raised the average of both classes.',
  "Changing the grouping rule made both groups' numbers better at the same time.",
  'After regrouping, the average of both groups went up, which shows the reform worked.',
  'The new staging criteria shifted some patients into the early group, and survival improved in both groups.',
  'Regrouping the cohort raised the mean of both arms at once.',
  'Reclassifying workers into two teams lifted the output of both teams.',
  'After the new brackets were applied, both brackets showed higher pass rates.',
  'The revised stage cut-offs moved several cases earlier, and both stages now report better outcomes.',
];

// ─── A. gate 层归因 ────────────────────────────────────────────────
check('A gate 层归因：攻击 19/19 → econ_reasoning_gate findings 且 action≠pass', () => {
  for (const s of [...ATTACK_ZH, ...ATTACK_EN]) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'econ_reasoning_gate');
    assert.ok(f, 'findings 缺 econ_reasoning_gate: ' + s);
  }
});
check('A gate 层归因：19/19 findings  severity ≥ 60 且 action ∈ {verify,block,rewrite}', () => {
  for (const s of [...ATTACK_ZH, ...ATTACK_EN]) {
    const r = gate(s);
    const f = (r.findings || []).find(x => x.dimension === 'econ_reasoning_gate');
    assert.ok(f, 'findings 缺 econ_reasoning_gate: ' + s);
    // gate 层 finding 只带 dimension/severity/details（details 为 trace 计数
    // 形「econ_reasoning_gate(N次)」，不展开子族名）——子族归因由 B 组在
    // 聚合桥层断言；这里断言严重度落在 verify 档（≥60）而非放行档。
    assert.ok(f.severity >= 60, 'severity 过低: ' + f.severity + ' | ' + s);
    assert.ok(['verify', 'block', 'rewrite'].includes(r.gate.action), 'action 异常: ' + r.gate.action);
  }
});

// ─── B. 模块直调 ───────────────────────────────────────────────────
check('B 模块直调：攻击 ZH 10/10 命中', () => {
  for (const s of ATTACK_ZH) {
    const r = detectWillRogersPhenomenon(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.details.includes('will-rogers-phenomenon'), 'detail 缺族名标: ' + r.details);
    assert.ok(r.guidance.length > 200, 'guidance 过短');
    assert.ok(Array.isArray(r.evidence) && r.evidence.length >= 1, '缺 evidence');
  }
});
check('B 模块直调：攻击 EN 9/9 命中', () => {
  for (const s of ATTACK_EN) {
    const r = detectWillRogersPhenomenon(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.details.includes('will-rogers-phenomenon'), 'detail 缺族名标: ' + r.details);
  }
});
check('B 聚合桥直调：攻击 19/19 命中且 families 含 will_rogers_phenomenon', () => {
  for (const s of [...ATTACK_ZH, ...ATTACK_EN]) {
    const r = ergMod.checkEconReasoningGate(s);
    assert.strictEqual(r.hit, true, '聚合桥未命中: ' + s);
    const fam = (r.families || []).find(f => f.key === 'will_rogers_phenomenon');
    assert.ok(fam, 'families 缺 will_rogers_phenomenon: ' + s);
    assert.strictEqual(fam.round, 'r360');
  }
});

// ─── C. 良性零误伤 ─────────────────────────────────────────────────
const BENIGN = [
  // 两组方向相反（本族腿②天然排除；属 simpsons_paradox 领地）
  '重新分组后早期组生存率从60%升到65%，晚期组从10%降到9%，两组变化方向不同，需要分开解释。',
  '把学生按摸底成绩分班之后，两个班的平均分一个升一个降，属于正常的重新分布。',
  'After regrouping, the early group improved while the late group declined, so we report them separately.',
  'Splitting the cohort changed both averages, but in opposite directions, so no single trend can be claimed.',
  // 概念教学（Will Rogers 现象本身）
  'Will Rogers 现象是医学统计学文献记载的口径假象，重新分组后两组同时改善需要核对个体数据。',
  'The Will Rogers phenomenon is a stage-migration artifact documented in the cancer staging literature.',
  // 正确响应形：指出同时改善只是再分类假象
  '两组生存率同时上升只是分期迁移造成的统计假象，不代表整体病情真的改善了。',
  'Both groups improved, but that does not reflect any real change in patient outcomes.',
  // 正确响应形：要求核对个体层面数据
  '需要逐个病例核对迁移前后每个病人的真实结局，再下结论。',
  'We need to check patient-level data before claiming the new staging improved outcomes.',
  // 个体层面归因：改善来自每个个体自身
  '两组都提高是因为每个学生都多做了练习，成绩变化发生在个体身上。',
  'Each individual patient improved after the treatment, so both groups showed better outcomes.',
  // 无迁移腿（只有分组统计，没有组间再分类）
  '我们按年龄分层统计后，每个年龄段的复发率都下降了，因为新药对所有人有效。',
  '把不同工龄的员工分成三组后，各组的人均产出都上升了，因为引进了新设备。',
  // 非分组迁移（腿①组名词收紧）
  '把文件从仓库调到车间，两边的周转都变快了。',
  // 市场/外部因素造成的两组同增（非口径动作）
  '分公司重组后两个区域的营收都增长了，这是市场扩张带来的，不是账面调整。',
  // 疑问句
  '重新分组之后两组的通过率都上升了吗？',
];
check('C 良性零误伤：手工良性 20/20 不判', () => {
  for (const s of BENIGN) assert.strictEqual(hit(s), false, '误判: ' + s);
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
check('C A/B 双树对照：移除本家族后良性集 gate action 逐条一致（零新增误伤）', () => {
  // 把双腿全部 18 个族逐个置空（不能只置 GROUPS 容器名——注入按族名
  // 逐个解析），模拟「本家族不存在」的基线树：攻击必须全部失效（证明
  // 双腿承重），良性集不得因本家族产生任何 pass→非pass 变化。
  const blank = {
    MIGRATE_FROM_TO_ZH: [], MIGRATE_RECLASS_ZH: [], MIGRATE_ASSIGN_ZH: [], MIGRATE_MOVE_ZH: [],
    MIGRATE_RECLASS_EN: [], MIGRATE_FROM_TO_EN: [], MIGRATE_RULE_EN: [], MIGRATE_TOGROUP_EN: [], MIGRATE_SPLIT_EN: [],
    BOTHUP_ALL_ZH: [], BOTHUP_DOUBLE_ZH: [], BOTHUP_TWOGROUP_ZH: [], BOTHUP_GROUPNOUN_ZH: [],
    BOTHUP_BOTHGROUPS_EN: [], BOTHUP_RAISEDBOTH_EN: [], BOTHUP_MADEBOTH_EN: [], BOTHUP_BOTHUP_EN: [], BOTHUP_INBOTH_EN: [],
  };
  for (const s of [...ATTACK_ZH, ...ATTACK_EN]) {
    assert.strictEqual(hit(s, blank), false, '注入后仍命中（腿组不承重）: ' + s);
  }
  for (const s of BENIGN) {
    assert.strictEqual(hit(s), false);
    assert.strictEqual(hit(s, blank), false);
  }
});

// ─── D. 聚合桥与插件注册 ───────────────────────────────────────────
check('D 注册：econ-reasoning-gate FAMILIES 含 will_rogers_phenomenon 行', () => {
  const row = ergMod.FAMILIES.find(f => f.key === 'will_rogers_phenomenon');
  assert.ok(row, '聚合桥 FAMILIES 缺行');
  assert.strictEqual(row.mod, './will-rogers-phenomenon.js');
  assert.strictEqual(row.fn, 'detectWillRogersPhenomenon');
  assert.strictEqual(row.round, 'r360');
  assert.ok(row.zh.includes('Will Rogers'), 'zh 标签不含族名');
});
check('D 注册：插件层 FAMILIES 含 will_rogers_phenomenon 行', () => {
  const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
  const row = (plugin.FAMILIES || []).find(f => f.key === 'will_rogers_phenomenon');
  assert.ok(row, '插件层 FAMILIES 缺行');
  assert.strictEqual(row.group, 'stats');
  assert.strictEqual(row.round, 'r360');
});

// ─── E. 常量级注入-删条承重 ────────────────────────────────────────
// 腿① ZH 四组
check('E 注入 MIGRATE_FROM_TO_ZH=[] → 从A移到B 攻击失效', () => {
  // 样本避开「新的…标准/分期标准…」——否则 MIGRATE_RECLASS_ZH 一并承重
  const s = '把一部分轻症病人从晚期移到早期，结果早期和晚期的生存率都提高了。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIGRATE_FROM_TO_ZH: [] }), false);
});
check('E 注入 MIGRATE_RECLASS_ZH=[] → 重新分期攻击失效', () => {
  const s = '重新分期之后，早期组和晚期组的生存率都提升了。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIGRATE_RECLASS_ZH: [] }), false);
});
check('E 注入 MIGRATE_ASSIGN_ZH=[] → 分班调组攻击失效', () => {
  const s = '把成绩靠后的学生调到普通班，重点班和普通班的平均分双双上涨。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIGRATE_ASSIGN_ZH: [] }), false);
});
check('E 注入 MIGRATE_MOVE_ZH=[] → 迁移裸族攻击失效', () => {
  const s = '这次组间迁移之后，早期组和晚期组的生存率都提高了。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIGRATE_MOVE_ZH: [] }), false);
});
// 腿② ZH 四组（每个样本只依赖被清零组——其余腿组在该句上不命中）
check('E 注入 BOTHUP_ALL_ZH=[] → 都+上升攻击失效', () => {
  const s = '重新分组后，及格率都上升了。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { BOTHUP_ALL_ZH: [] }), false);
});
check('E 注入 BOTHUP_DOUBLE_ZH=[] → 双双一起攻击失效', () => {
  const s = '重新分期之后，两组生存率双双上升。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { BOTHUP_DOUBLE_ZH: [] }), false);
});
check('E 注入 BOTHUP_TWOGROUP_ZH=[] → 两组都攻击失效', () => {
  const s = '重新分组后，两组的平均分均有了明显的提高。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { BOTHUP_TWOGROUP_ZH: [] }), false);
});
check('E 注入 BOTHUP_GROUPNOUN_ZH=[] → 组名词对攻击失效', () => {
  const s = '重新划定风险层级后，高风险组和低风险组的达标率上升了。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { BOTHUP_GROUPNOUN_ZH: [] }), false);
});
// 腿① EN 五组
check('E 注入 MIGRATE_RECLASS_EN=[] → reclassifying/regrouping 攻击失效', () => {
  const s = 'Regrouping the cohort raised the mean of both arms at once.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIGRATE_RECLASS_EN: [] }), false);
});
check('E 注入 MIGRATE_TOGROUP_EN=[] → move...to group 攻击失效', () => {
  const s = 'Moving the weakest students to the remedial class raised the average of both classes.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIGRATE_TOGROUP_EN: [] }), false);
});
check('E 注入 MIGRATE_RULE_EN=[] → grouping rule 攻击失效', () => {
  const s = "Changing the grouping rule made both groups' numbers better at the same time.";
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { MIGRATE_RULE_EN: [] }), false);
});
// 腿② EN 五组
check('E 注入 BOTHUP_BOTHGROUPS_EN=[] → both groups improved 失效', () => {
  const s = "Reclassifying patients moved some from the advanced to the early group, and both groups' survival rates improved.";
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { BOTHUP_BOTHGROUPS_EN: [] }), false);
});
check('E 注入 BOTHUP_RAISEDBOTH_EN=[] → raised the average of both 失效', () => {
  const s = 'Moving the weakest students to the remedial class raised the average of both classes.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { BOTHUP_RAISEDBOTH_EN: [] }), false);
});
check('E 注入 BOTHUP_INBOTH_EN=[] → improved in both groups 失效', () => {
  const s = 'The new staging criteria shifted some patients into the early group, and survival improved in both groups.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { BOTHUP_INBOTH_EN: [] }), false);
});
check('E 注入 BOTHUP_MADEBOTH_EN=[] → made both better 失效', () => {
  const s = 'Changing the grouping rule made both better at the same time.';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { BOTHUP_MADEBOTH_EN: [] }), false);
});
// 窗
check('E 注入 PAIR_ZH=0 → 超窗攻击失效（窗承重）', () => {
  const s = '新的分期标准把一部分轻症病人从晚期移到早期，结果早期和晚期的生存率都提高了。';
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { PAIR_ZH: 0 }), false);
});
check('E 注入 PAIR_EN=0 → 超窗攻击失效（窗承重）', () => {
  const s = "Reclassifying patients moved some from the advanced to the early group, and both groups' survival rates improved.";
  assert.strictEqual(hit(s), true);
  assert.strictEqual(hit(s, { PAIR_EN: 0 }), false);
});
// 三组豁免逐项承重（把该豁免置为永假正则 → 良性翻转为命中）
// 样本逐个核对只依赖被清零的豁免：CONCEPT 句避开「分期迁移/统计假象」
// 词（否则会被 CORRECT_ZH2 一并豁免），CORRECT_ZH2 句避开概念词，等等。
const NEVER = /(?!x)x/, ALWAYS = /./;
check('E 注入 CONCEPT_ZH=永假 → 概念教学良性翻转为命中', () => {
  const s = '流行病学课上讲过，重新分组后两组的生存率都提高了，这是组间再分类造成的。';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { CONCEPT_ZH: NEVER }), true);
});
check('E 注入 CORRECT_ZH2=永假 → 账面假象良性翻转为命中', () => {
  const s = '重新分期后两组生存率都提高了，但这只是账面数字变好看了。';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { CORRECT_ZH2: NEVER }), true);
});
check('E 注入 INDIV_ZH=永假 → 个体层面归因良性翻转为命中', () => {
  const s = '重新分组后两组都提高了，因为每个学生都多做了练习。';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { INDIV_ZH: NEVER }), true);
});
check('E 注入 INDIV_EN=永假 → 个体层面归因良性 EN 翻转为命中', () => {
  const s = 'After regrouping, each individual patient improved, so both groups showed better outcomes.';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { INDIV_EN: NEVER }), true);
});
check('E 注入 CORRECT_EN2=永假 → EN 假象良性翻转为命中', () => {
  const s = 'Both groups improved after regrouping, but this is an artifact of reclassification, not a real improvement.';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { CORRECT_EN2: NEVER }), true);
});
// 腿①组名词收紧承重（GROUP_ZH 置为恒真 → 非分组迁移良性翻转为命中）
check('E 注入 GROUP_ZH=恒真 → 非分组迁移良性翻转为命中（组名词收紧承重）', () => {
  const s = '把物料从仓库调到车间，两边的效率都提高了。';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(hit(s, { GROUP_ZH: ALWAYS }), true);
});
// 疑问句豁免承重
check('E 疑问句豁免承重：问句恒不判', () => {
  const s = '重新分组之后两组的通过率都上升了吗？';
  assert.strictEqual(hit(s), false);
  assert.strictEqual(detectWillRogersPhenomenon(s).count, 0);
});

// ─── F. 边界锁（近邻维度领地不被本族蚕食）────────────────────────
check('F 边界锁：辛普森悖论（两组方向相反）不被本族命中', () => {
  const s = '总体上死亡率下降了，所以这个治疗方案更安全，然而每个科室的死亡率都在上升。';
  assert.strictEqual(hit(s), false);
});
check('F 边界锁：检出时点假象（survivor_time_bias 领地）不被本族命中', () => {
  const s = '体检普及之后确诊年龄提前，五年生存率上升可能只是提前记账，需要对照总死亡率判断。';
  assert.strictEqual(hit(s), false);
});
check('F 边界锁：小基数比例（statistical_misleading 领地）不被本族命中', () => {
  const s = '用户满意度提升了 300%，从 2 个人涨到了 8 个人。';
  assert.strictEqual(hit(s), false);
});
check('F 边界锁：__internals 暴露全部腿组与豁免常量', () => {
  const I = __internals();
  for (const k of ['MIGRATE_FROM_TO_ZH', 'MIGRATE_RECLASS_ZH', 'MIGRATE_ASSIGN_ZH', 'MIGRATE_MOVE_ZH',
    'MIGRATE_RECLASS_EN', 'MIGRATE_FROM_TO_EN', 'MIGRATE_RULE_EN', 'MIGRATE_TOGROUP_EN', 'MIGRATE_SPLIT_EN',
    'BOTHUP_ALL_ZH', 'BOTHUP_DOUBLE_ZH', 'BOTHUP_TWOGROUP_ZH', 'BOTHUP_GROUPNOUN_ZH',
    'BOTHUP_BOTHGROUPS_EN', 'BOTHUP_RAISEDBOTH_EN', 'BOTHUP_MADEBOTH_EN', 'BOTHUP_BOTHUP_EN', 'BOTHUP_INBOTH_EN',
    'MIGRATE_ZH_GROUPS', 'MIGRATE_EN_GROUPS', 'BOTHUP_ZH_GROUPS', 'BOTHUP_EN_GROUPS',
    'PAIR_ZH', 'PAIR_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'CORRECT_ZH', 'CORRECT_ZH2', 'CORRECT_ZH3',
    'CORRECT_EN', 'CORRECT_EN2', 'CORRECT_EN3', 'INDIV_ZH', 'INDIV_EN', 'GROUP_ZH']) {
    assert.ok(I[k] !== undefined, '__internals 缺 ' + k);
  }
  assert.strictEqual(typeof I.findSignatures, 'function');
});

// ─── G. 登记纪律 ──────────────────────────────────────────────────
check('G 登记纪律：econ-reasoning-gate 族表无重复 key', () => {
  const keys = ergMod.FAMILIES.map(f => f.key);
  assert.strictEqual(new Set(keys).size, keys.length, '族表有重复 key');
});
check('G 登记纪律：src/index.js 本轮零改动（dimMap 维度计数不变）', () => {
  // 聚合族扩族不动全局接入点：index.js 不含本模块路径
  const fs = require('node:fs');
  const idx = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(!idx.includes('will-rogers-phenomenon'), 'index.js 不应引用本模块（聚合族范式要求零改动）');
  assert.ok(idx.includes('econ_reasoning_gate'), 'index.js 应仍持有 econ_reasoning_gate 接入点');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
