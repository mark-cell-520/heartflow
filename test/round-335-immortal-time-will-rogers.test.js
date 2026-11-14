'use strict';
/**
 * test/round-335-immortal-time-will-rogers.test.js
 * [r335] immortal_time_bias（第 240 维度）路径 (g) Will Rogers 现象/
 * 分期迁移（stage migration / reclassification artifact）子家族——
 * 真升级②（已有维度的全新措辞家族），维度计数 256 不变、src/index.js
 * 零改动（同 r328/r331 形态）。
 *
 * 立项缺口实证（scripts/round-335/r335-probe-candidates.js，集成树
 * v6.8.185）：8 条攻击样本 4 条完全穿引擎（gate.action=pass、findings
 * 无归因——肿瘤分期迁移/信用评级迁移两条 ZH + 两条 EN），其余被
 * pseudo_causal/confidence 泛维度代拦；src/ 下没有任何维度判「成员
 * 重新分类 × 两组指标同向改善 × 成效结论」这一结构（simpsons_paradox
 * 须方向相悖、selection_bias 管样本推广、survivor_time_bias 管病程
 * 结构，均不覆盖组间成员搬移造成的账面同升）。
 *
 * 补丁（src/immortal-time-bias.js）：
 *   新增常量 RECLASS_ZH/EN（腿① 重新分类动作）、BOTH_UP_ZH/EN（腿②
 *   两组指标同向变动）、CLAIM_ZH/EN（腿③ 成效结论）、EXEMPT_WR_ZH/EN
 *   （豁免：偏误点名 / 谨慎解读否定 / 总体终点无变化——与 EXEMPT_LEAD、
 *   EXEMPT_LEN 分离，r328/r331 轮测断言的结构不动）
 *   + 路径 (g) OR 分支（复用 WIN_LEAD 跨腿窗，在锚腿门槛之前评判）；
 *   find 逻辑既有路径与既有常量零改动。
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 + 官方语料
 *   全量）/ D 存量回归 / E 常量级注入-删条承重（六腿 + 窗 + 豁免逐项
 *   + 元素隔离）/ F 边界锁 / G 登记纪律。
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const { checkImmortalTimeBias, __internals } = require(path.join(ROOT, 'src', 'immortal-time-bias.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const hit = (t, inj) => checkImmortalTimeBias(t, inj).hit === true;

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 新攻击集（20 条：路径 g ZH 12 + EN 8，覆盖肿瘤分期/ICU 指标/编班/
// 信用评级/保险池/员工分组/医保目录/竞赛分组/感染病区/商家推荐池 ×
// reclassified/moved/re-bucketed/restaged/reassigned/promoted）──
const ATTACK_ZH = [
  '新的分期标准把一部分晚期患者重新划入中期，早期和中期生存率都上升了，说明新标准显著改善了预后。',
  '医院把重症病人转到合作病区后，两个病区的死亡率都下降了，可见本院的 ICU 救治水平很高。',
  '重新编班后，把成绩垫底的学生分出去，快班和慢班的平均分都提高了，这说明分层教学立竿见影。',
  '新评级模型把部分 B 级客户上调到 A 级，A 级和 B 级的违约率都下降了，证明风控模型升级有效。',
  '保险新政把健康人群分到优质池后，两个池子的赔付率都下降了，说明定价改革成功了。',
  '公司把绩效垫底的员工调到其他组，两个组的满意度都上升了，说明这次调整立竿见影。',
  '新医保目录把高价药剔除出去后，两个批次的报销比例都提高了，说明控费成效显著。',
  '把差生剥离出去单独组班之后，两个班的平均分都上升了，可见因材施教取得了成功。',
  '修订后的分级标准把一批中等风险客户升级到低风险档，两档的坏账率都下降了，说明新模型更加科学。',
  '竞赛组委会把强队调入甲组，甲乙两组的胜率都提高了，证明分组改革明显改善了比赛质量。',
  '院方把术后感染病人转移到专科病区，本院区和合作病区的感染率都下降了，可见管理升级成效显著。',
  '新规将垫底商家移出推荐池后，首页和推荐池的转化率都上升了，说明平台治理见效了。',
];
const ATTACK_EN = [
  'Under the new staging criteria, some advanced cases were reclassified as intermediate, and survival rates rose in both groups — proof the new protocol works.',
  'After transferring the sickest patients to another ward, mortality rates dropped in both wards, showing excellent care.',
  'Re-bucketing the worst accounts into a new tier lowered the default rate in both tiers, so the new risk model works.',
  'Moving the failing students to a separate class raised the average scores in both classes, demonstrating the tracking reform succeeded.',
  'The insurer moved healthy policyholders into a preferred pool, and loss rates fell in both pools — evidence the repricing worked.',
  'Under the revised TNM criteria many patients were restaged to earlier stages, and five-year survival improved in both stages, proving the new standard is more accurate.',
  'After the weakest performers were reassigned to another team, satisfaction rose in both teams, showing the reorganization paid off.',
  'Promoting the riskiest borrowers from subprime to prime lowered delinquency in both buckets, so the new underwriting model is effective.',
];

// ─── A. gate 层归因 ────────────────────────────────────────────────
check('A gate 层归因：路径 g 攻击 20/20 → immortal_time_bias findings 且 action≠pass', () => {
  for (const s of [...ATTACK_ZH, ...ATTACK_EN]) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});

// ─── B. 模块直调（命中 + detail 带 Will Rogers 标）─────────────────
check('B 模块直调：路径 g ZH 12/12 命中且 detail 带 Will Rogers 标', () => {
  for (const s of ATTACK_ZH) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('Will Rogers'), 'detail 缺 Will Rogers 标: ' + r.detail);
  }
});
check('B 模块直调：路径 g EN 8/8 命中且 detail 带 will-rogers 标', () => {
  for (const s of ATTACK_EN) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('will-rogers'), 'detail 缺 will-rogers 标: ' + r.detail);
  }
});

// ─── C. 良性零误伤 ────────────────────────────────────────────────
const BENIGN = [
  '新分期标准让部分晚期病人归入中期，但总生存期没有变化，这是 Will Rogers 现象，不能当作疗效证据。',
  '把垫底学生分班后两个班平均分都上升，可没有一个学生真的进步了，这是重新分类造成的统计假象。',
  'Under stage migration, both stage-specific survival rates can rise without any patient living longer — a statistical artifact, not a treatment effect.',
  'ICU 死亡率下降是因为把最危重的病人转走了，并不是救治水平提高，报道时应当注明这一点。',
  '这个疗法在随机对照试验中显著降低了死亡率，是真正的生存获益。',
  '重新分组后我们重新计算了平均分，两组的数据都要更新。',
  '公司上调了部分客户的信用等级，这是例行评估。',
  '编班调整只涉及时间安排，不影响成绩统计。',
  'Randomized trials showed a real mortality benefit, unlike reclassification artifacts.',
  '两个池子的赔付率都下降了，但这只是健康人群被分走的结果，并不能说明定价更合理。',
  'Will Rogers 现象告诉我们：把病人重新分期后，两组的生存率可以同时上升而没有一个病人活得更久。',
  'Stage migration can make survival rates rise in both stages without anyone living longer; it is a reclassification artifact.',
  '把重症病人转到合作病区是常规分流，与救治水平无关。',
  '软件升级到新版本后，两块板的性能都提升了，说明优化有效。',
  '央行下调存款准备金率后，两个月的社融数据都上升了，说明流动性改善。',
  '编辑把错别字剔除之后，两篇文章的可读性都提高了。',
];
check('C 良性零误伤：手工良性 16/16 不判', () => {
  for (const s of BENIGN) assert.strictEqual(hit(s), false, '误判: ' + s);
});
check('C 良性零误伤：官方四基准语料全量模块级路径(g)零命中', () => {
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
      const r = checkImmortalTimeBias(s);
      if (r.hit && (r.detail.includes('Will Rogers') || r.detail.includes('will-rogers'))) { fp++; hits.push(s.slice(0, 60)); }
    }
  }
  assert.ok(n >= 360, '语料条数不足: ' + n);
  assert.strictEqual(fp, 0, '误伤 ' + fp + ' 条: ' + hits.join(' | '));
});

// ─── D. 存量回归（路径 a-f 不回归 + 既有豁免结构不变）─────────────
check('D 存量回归：路径 (d) lead-time 攻击仍命中且 EXEMPT_LEAD 仍三元素', () => {
  const r = checkImmortalTimeBias('肿瘤早筛让确诊时间平均提前了两年，患者的五年生存率因此大幅上升，可见筛查显著延长了寿命。');
  assert.strictEqual(r.hit, true);
  assert.ok(r.detail.includes('领先时间偏误'), '路径 d 回归: ' + r.detail);
  const I = __internals();
  assert.strictEqual(I.EXEMPT_LEAD_ZH.length, 3, 'EXEMPT_LEAD_ZH 元素数被改');
  assert.strictEqual(I.EXEMPT_LEAD_EN.length, 3, 'EXEMPT_LEAD_EN 元素数被改');
  assert.strictEqual(I.WIN_LEAD_ZH, 160);
  assert.strictEqual(I.WIN_LEAD_EN, 400);
});
check('D 存量回归：路径 (a) 起点差异攻击仍命中', () => {
  const r = checkImmortalTimeBias('治疗后立刻使用新方案的患者五年生存率明显更高，说明新方案确实改善了预后。');
  assert.strictEqual(r.hit, true, '路径 (a) 回归');
});
check('D 存量回归：路径 (e) 病程长度偏误攻击仍命中', () => {
  const r = checkImmortalTimeBias('筛查发现的肿瘤大多是生长缓慢的类型，所以筛出来的人预后天然更好，这说明筛查确实有效。');
  assert.strictEqual(r.hit, true, '路径 (e) 回归');
  assert.ok(r.detail.includes('病程长度偏误'), '路径 e detail 回归: ' + r.detail);
});
check('D 存量回归：路径 (f) 过度诊断攻击仍命中', () => {
  const r = checkImmortalTimeBias('早筛查出了大量本来一辈子都不会发病的病变，这些病例证明筛查挽救了无数生命。');
  assert.strictEqual(r.hit, true, '路径 (f) 回归');
  assert.ok(r.detail.includes('过度诊断'), '路径 f detail 回归: ' + r.detail);
});

// ─── E. 常量级注入-删条承重 ────────────────────────────────────────
// 腿① 重新分类动作
check('E 注入 RECLASS_ZH=[] → 路径 g ZH 12/12 由判翻转不判', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { RECLASS_ZH: [] }), false, '删条后仍命中: ' + s);
});
check('E 注入 RECLASS_EN=[] → 路径 g EN 8/8 由判翻转不判', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { RECLASS_EN: [] }), false, '删条后仍命中: ' + s);
});
// 腿② 两组指标同向变动
check('E 注入 BOTH_UP_ZH=[] → 路径 g ZH 12/12 由判翻转不判', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { BOTH_UP_ZH: [] }), false, '删条后仍命中: ' + s);
});
check('E 注入 BOTH_UP_EN=[] → 路径 g EN 8/8 由判翻转不判', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { BOTH_UP_EN: [] }), false, '删条后仍命中: ' + s);
});
// 腿③ 成效结论
check('E 注入 CLAIM_ZH=[] → 路径 g ZH 12/12 由判翻转不判', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { CLAIM_ZH: [] }), false, '删条后仍命中: ' + s);
});
check('E 注入 CLAIM_EN=[] → 路径 g EN 8/8 由判翻转不判', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { CLAIM_EN: [] }), false, '删条后仍命中: ' + s);
});
// 跨腿邻近窗（复用 WIN_LEAD，注入清零）
check('E 注入 WIN_LEAD_ZH=0 → 路径 g 中文攻击由判翻转不判', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { WIN_LEAD_ZH: 0 }), false, '清零窗后仍命中: ' + s);
});
check('E 注入 WIN_LEAD_EN=0 → 路径 g 英文攻击由判翻转不判', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { WIN_LEAD_EN: 0 }), false, '清零窗后仍命中: ' + s);
});
// 豁免表：置空整个豁免数组 → 谨慎/纠正句由不判变判
// 构造纪律：探针句必须**三腿齐全**（否则压根不判，测不出豁免承重），
// 豁免标记追加在攻击形之后（转述/批评该谬误的句子）。
const EXEMPT_WR_PROBES = [
  ['EXEMPT_WR_ZH/点名', 'EXEMPT_WR_ZH', '新的分期标准把一部分晚期患者重新划入中期，早期和中期生存率都上升了，说明新标准显著改善了预后——这正是分期迁移偏误。'],
  ['EXEMPT_WR_ZH/无人变好', 'EXEMPT_WR_ZH', '把成绩垫底的学生分出去，快班和慢班的平均分都提高了，这说明分层教学立竿见影——可没有一个学生真的进步了。'],
  ['EXEMPT_WR_ZH/否定', 'EXEMPT_WR_ZH', '医院把重症病人转到合作病区，两个病区的死亡率都下降了，可见本院救治水平很高——但这并不代表救治水平真的提高。'],
  ['EXEMPT_WR_EN/点名', 'EXEMPT_WR_EN', 'Under the new staging criteria, some advanced cases were reclassified as intermediate, and survival rates rose in both groups — proof the new protocol works. This is a reclassification artifact.'],
  ['EXEMPT_WR_EN/无人变好', 'EXEMPT_WR_EN', 'Re-bucketing the worst accounts into a new tier lowered the default rate in both tiers, so the new risk model works — but no borrower actually got better.'],
];
for (const [name, key, text] of EXEMPT_WR_PROBES) {
  check(`E 注入 ${key}=[] → ${name} 由豁免翻转命中`, () => {
    const before = checkImmortalTimeBias(text);
    assert.strictEqual(before.hit, false, '置空前应被豁免，实际 hit=' + before.hit);
    assert.strictEqual(hit(text, { [key]: [] }), true, '置空后应命中');
  });
}
// 元素隔离：只留点名元素 → 否定/无人变好句不再被豁免（证明各元素独立承重）
// 构造纪律：探针句必须**三腿齐全**（否则压根不判，测不出豁免承重），
// 豁免标记追加在攻击形之后（转述/批评该谬误的句子）。
check('E 注入 EXEMPT_WR_ZH=[仅点名] → 否定句与无人变好句翻命中、点名句仍豁免', () => {
  const I = __internals();
  const namingOnly = { EXEMPT_WR_ZH: [I.EXEMPT_WR_ZH[0], I.EXEMPT_WR_ZH[1]] };
  assert.strictEqual(hit('医院把重症病人转到合作病区，两个病区的死亡率都下降了，可见本院救治水平很高——但这并不代表救治水平真的提高。', namingOnly), true, '否定句未被隔离');
  assert.strictEqual(hit('把成绩垫底的学生分出去，快班和慢班的平均分都提高了，这说明分层教学立竿见影——可没有一个学生真的进步了。', namingOnly), true, '无人变好句未被隔离');
  assert.strictEqual(hit('新的分期标准把一部分晚期患者重新划入中期，早期和中期生存率都上升了，说明新标准显著改善了预后——这正是分期迁移偏误。', namingOnly), false, '点名句应仍豁免');
});
check('E 注入 EXEMPT_WR_EN=[仅点名] → 无人变好句翻命中、点名句仍豁免', () => {
  const I = __internals();
  const namingOnly = { EXEMPT_WR_EN: [I.EXEMPT_WR_EN[0], I.EXEMPT_WR_EN[1]] };
  assert.strictEqual(hit('Re-bucketing the worst accounts into a new tier lowered the default rate in both tiers, so the new risk model works — but no borrower actually got better.', namingOnly), true, '无人变好句未被隔离');
  assert.strictEqual(hit('Under the new staging criteria, some advanced cases were reclassified as intermediate, and survival rates rose in both groups — proof the new protocol works. This is a reclassification artifact.', namingOnly), false, '点名句应仍豁免');
});

// ─── F. 边界锁 ────────────────────────────────────────────────────
check('F 边界锁：疑问形不判', () => {
  assert.strictEqual(hit('新的分期标准把晚期患者重新划入中期，早期和中期的生存率都上升了，说明新标准改善了吗？'), false, '疑问形未豁免');
});
check('F 边界锁：缺两组同向变动腿不判（只有分类动作 + 成效结论）', () => {
  assert.strictEqual(hit('新的分期标准把一部分晚期患者重新划入中期，说明新标准显著改善了预后。'), false, '缺腿②仍判');
});
check('F 边界锁：缺成效结论腿不判（只有分类动作 + 两组同变）', () => {
  assert.strictEqual(hit('新的分期标准把一部分晚期患者重新划入中期，早期和中期的生存率都上升了。'), false, '缺腿③仍判');
});
check('F 边界锁：缺重新分类腿不判（普通两组比较）', () => {
  assert.strictEqual(hit('早期和中期患者的生存率都上升了，说明新疗法确实改善了预后。'), false, '缺腿①仍判');
});
check('F 边界锁：跨腿邻近窗（三腿相隔 >160 字不判）', () => {
  const filler = '这是一段与医院管理统计无关的社区活动筹备说明，讲的是场地预订、桌椅数量、音响设备调试和志愿者排班流程，组织者还提醒大家关注天气预报与交通路线，整个筹备过程预计需要两周时间，相关预算与物资清单另见附件表格，会议通知已通过邮件发送给各位成员，如有变动将第一时间在群里同步更新，谢谢大家的配合与支持，期待本次活动顺利举办并取得良好效果。';
  const s = '新的分期标准把一部分晚期患者重新划入中期。' + filler + '早期和中期的生存率都上升了，说明新标准显著改善了预后。';
  assert.ok(s.indexOf('都上升') - s.indexOf('重新划入') > 160, '样本跨度未超窗（样本构造失败）');
  assert.strictEqual(hit(s), false, '跨腿窗失效');
});
check('F 边界锁：升级/降级限上下文（软件升级 + 金融操作不触发）', () => {
  assert.strictEqual(hit('软件升级到新版本后，两块板的性能都提升了，说明优化有效。'), false, '软件升级误判');
  assert.strictEqual(hit('央行下调存款准备金率后，两个月的社融数据都上升了，说明流动性改善。'), false, '金融操作误判');
});

// ─── G. 登记纪律 ──────────────────────────────────────────────────
check('G VERSION / package.json 一致', () => {
  const pkg = require(path.join(ROOT, 'package.json'));
  const v = require('node:fs').readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  assert.ok(/^\d+\.\d+\.\d+$/.test(v), 'VERSION 格式非法: ' + v);
  assert.strictEqual(pkg.version, v);
});
check('G index.js 既有接线在位（require + 计算点 + dimMap 键）', () => {
  const src = require('node:fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/checkImmortalTimeBias/.test(src), 'index.js 缺 checkImmortalTimeBias 接线');
  assert.ok(/immortal_time_bias/.test(src), 'index.js 缺 immortal_time_bias 维度键');
});
check('G __internals 暴露路径 (g) 六腿 + 豁免（负例注入口）', () => {
  const I = __internals();
  for (const k of ['RECLASS_ZH', 'RECLASS_EN', 'BOTH_UP_ZH', 'BOTH_UP_EN', 'CLAIM_ZH', 'CLAIM_EN', 'EXEMPT_WR_ZH', 'EXEMPT_WR_EN']) {
    assert.ok(I[k] !== undefined, '__internals 缺 ' + k);
    assert.ok(Array.isArray(I[k]) && I[k].length >= 2, k + ' 元素不足');
  }
});

console.log(`\nround-335 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
