/**
 * r303 平均≠边际（average_marginal_conflation 第 214 维度）「产量/效率/速率型
 * 平均值 → 边际量」新措辞家族轮测（真升级②）
 *
 * 背景：src/average-marginal-conflation.js（r220 起草）自立项起只覆盖
 * **货币型**平均值与结论——腿① AVG_COST/AVG_RETURN（平均成本/单台利润/
 * 平均客单价…）、腿③ CHEAP/PROFIT（更便宜/利润越滚越多…）。而
 * AP→MP（平均产量推边际产量）、平均亩产→边际亩产、平均吞吐→边际吞吐
 * 这一平均-边际混淆最教科书的形式整体缺席。
 * scripts/round-303/probe-module-amc.js（v6.8.174，引擎改动前）实测：
 *   攻击 14/14 全部 miss（模块直调 hit=false）
 *   良性 17/17 干净
 *
 * 本轮新增 F-5 平行族（三腿共现 + 跨度否定守卫，复用共享豁免入口）：
 *   腿①' AVG_RATE_ZH/EN   速率/产量型平均值
 *   腿②' RES_ZH/EN ∪ 存量 MARG/INCR   资源形边际参照（再多一个 X / one more X）
 *   腿③' QTY_CONCL_ZH/EN  数量型边际结论（多五十件 / must add ten more units）
 *
 * 覆盖：
 *   A 插件层 dispatch（analyze 报 average_marginal_conflation 族）
 *   B 攻击族命中（F-5 承重，中英 18 条）
 *   C 良性零误伤（手工 33 条 + 官方语料 378 条全量扫描）
 *   D 存量回归（r220 攻击 26 + 良性 27 + r295/r296 插件轮测不回归）
 *   E 负例注入-删条（6 组常量级 + 2 组全腿级）
 *   F 元素级注入-删条（AVG_RATE_ZH 逐元素 + RES_EN 逐元素）
 *   G 路由独立性双向对照（删新族常量不影响存量、删存量常量不影响新族）
 *   H 登记纪律（存量常量逐字保留、长度未变；src/index.js 零改动）
 *
 * 注意：本维度经 src/plugins/econ-reasoning-check/index.js 在
 * postprocess.think 层 dispatch（r295 接线），**不在 gate 层 dimMap**，
 * 故 gate.action 不受本轮影响（同 r295/r296/r300/r301/r302 先例）。
 */

'use strict';

const assert = require('assert');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MOD = require(path.join(ROOT, 'src/average-marginal-conflation.js'));
const PLUGIN = require(path.join(ROOT, 'src/plugins/econ-reasoning-check/index.js'));
const check = MOD.checkAverageMarginalConflation;
const I = MOD.__internals();
const { analyze } = PLUGIN;

let passed = 0, failed = 0;
function T(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); }
}

// ─── B 攻击族（中英 18 条；前 8 条中文、后 10 条英文）────────────────
const ATTACKS = [
  '平均每小时能生产十件，所以再加班一小时也能多产出十件',
  '每台机器平均一天产五十件，所以再开一台机器就多五十件',
  '平均亩产三吨，所以再种一亩地就能多收三吨',
  '团队平均每天处理八单，所以再加一个人就能多处理八单',
  '平均客单价两百，所以再多来一个顾客就多两百营收',
  '平均响应时间是两秒，所以再多一个用户也还是两秒',
  '平均每个用户每月登录五次，所以每多一个用户就多五次登录',
  '这条产线平均每分钟下线两台，说明再开一条产线就多两台',
  'The average output is ten units per hour, so one more hour of overtime must add ten more units.',
  'On average each worker produces ten units per shift, so one extra shift must yield ten more units.',
  'Average yield is three tons per mu, so planting one more mu of land must add three tons.',
  'The team averages eight tickets per day, so one more member must close eight more tickets.',
  'Average output per machine is 50 units a day, so running one more machine adds 50 units.',
  'Average clicks per ad are 3%, so one more thousand impressions will produce 30 more clicks.',
  'Average session length is 12 minutes, so one more user session adds 12 minutes of engagement.',
  'Our average delivery time is two days, so the next delivery will also take two days.',
  'On average each rep closes two deals a week, so one more rep should close two more deals.',
  'Average throughput is 40 requests per second, so one more server will handle 40 more requests.',
];
const ATTACK_ZH = ATTACKS.slice(0, 8);
const ATTACK_EN = ATTACKS.slice(8);

// ─── C 良性（手工 33 条）────────────────────────────────────────────
const BENIGN = [
  '平均成本是每件十二元，我们需要重新核算边际成本再决定是否增产',
  'On average each unit costs twelve dollars; we need to check the marginal cost before expanding.',
  '平均每小时产出十件，这个数字只反映历史水平',
  'Average output is ten units per hour, which only reflects historical performance.',
  '教材里讲过，平均值不能直接推断边际值',
  'The textbook explains that an average cannot be used to infer the marginal value.',
  '平均亩产三吨可能偏高，也许再种一亩达不到这个数',
  'Average yield of three tons per mu may be optimistic; one more mu might not reach it.',
  '人均 GDP 一万美元，这是把全国总量除以人口得到的平均值',
  'Per-capita GDP of ten thousand dollars is the national total divided by population.',
  '平均每个用户每月登录五次，这是上季度的统计口径',
  'Average logins per user per month were five last quarter, according to the report.',
  '平均处理时长三分钟，如果需要压缩到两分钟得单独测算',
  'The average ticket takes three minutes; cutting it to two needs a separate measurement.',
  '平均一次培训要两天，这是过去十二期的平均水平',
  'On average a training run takes two days, based on the last twelve cohorts.',
  '平均每小时进店三十人，周末会更多一些',
  'On average thirty people walk in per hour, and weekends see somewhat more.',
  '平均产能利用率七成，产能瓶颈在注塑工序',
  'Average capacity utilisation is 70%, and the bottleneck is the injection-moulding step.',
  '平均响应时间两秒，这是监控面板上的历史均值',
  'Average response time is two seconds, as shown on the monitoring dashboard.',
  '我们平均每天发一版，发布节奏由值班表决定',
  'We ship once a day on average; the release cadence is set by the on-call rota.',
  '平均每单运费五元，运费政策写在帮助中心',
  'Average shipping cost is five yuan per order, and the policy is documented in the help centre.',
  '新员工平均三周上手，这取决于培训体系而不是个人',
  'New hires take three weeks on average to ramp up, which depends on the training programme.',
  '平均订单金额两百元，与去年持平',
  'Average order value is 200 yuan, flat year on year.',
  '实验达到统计显著（p=0.03），效应量为 0.2 个标准差，属于小效应，需要更大样本确认。',
  '根据成本加成定价，这批货的出厂价是每件三十七块五，含原材料、人工和合理利润。',
  'The comparable sales in the neighborhood averaged around 480k, and the formal valuation came in at 495k.',
];

// ─── D 存量回归（r220 轮测原句：攻击 + 良性）────────────────────────
const LEGACY_ATTACK = [
  '单台成本已经压到这么低了，说明再生产一台更便宜。',
  '平均每个产品能赚不少，产量继续往上加，利润只会越滚越多。',
  'Average cost has fallen so far that the next unit is cheaper.',
  'Each unit earns a healthy margin on average, so pushing volume higher will keep raising profit.',
];
const LEGACY_ATTACK_ZH = LEGACY_ATTACK.slice(0, 2);
const LEGACY_ATTACK_EN = LEGACY_ATTACK.slice(2);
const LEGACY_BENIGN = [
  '平均成本是每件十二元，先算边际再决定。',
  'On average each unit costs twelve dollars; we ran the marginal numbers before expanding.',
  '我们的平均成本是每件 12 元。',
  'Average cost is twelve dollars per unit.',
];

console.log('=== A 插件层 dispatch（analyze 报族）===');
T('A1 18 条攻击全部经插件 analyze 命中 average_marginal_conflation', () => {
  for (const t of ATTACKS) {
    const r = analyze(t);
    assert.ok(r.families.some(f => f.key === 'average_marginal_conflation'),
      `插件层未命中: ${t.slice(0, 40)}`);
    assert.ok(r.totalHits > 0, `totalHits=0: ${t.slice(0, 40)}`);
  }
});
T('A2 攻击 score = 0.6（VERIFY 级，与 r220 一致）', () => {
  for (const t of ATTACKS) {
    const r = analyze(t);
    assert.strictEqual(r.families[0].score, 0.6, t.slice(0, 30));
  }
});
T('A3 MCP action=only 单族过滤可达（average_marginal_conflation）', () => {
  const r = analyze(ATTACKS[0], { only: 'average_marginal_conflation' });
  assert.strictEqual(r.familyCount, 1);
  assert.strictEqual(r.families[0].key, 'average_marginal_conflation');
});
T('A4 良性文本 action=only 零命中', () => {
  for (const t of BENIGN) {
    const r = analyze(t, { only: 'average_marginal_conflation' });
    assert.strictEqual(r.familyCount, 0, `误伤: ${t.slice(0, 40)}`);
  }
});

console.log('=== B 攻击族命中（F-5 承重）===');
T('B1 中文 8/8 模块直调 hit 且 detail 含 F-5', () => {
  for (const t of ATTACK_ZH) {
    const r = check(t);
    assert.ok(r.hit, `未命中: ${t}`);
    assert.ok(r.detail.includes('F-5'), `非 F-5 承重: ${r.detail} | ${t}`);
  }
});
T('B2 英文 10/10 模块直调 hit', () => {
  for (const t of ATTACK_EN) {
    const r = check(t);
    assert.ok(r.hit, `未命中: ${t}`);
    assert.ok(r.detail.includes('F-5'), `非 F-5 承重: ${r.detail} | ${t}`);
  }
});
T('B3 全部 18 条命中 count >= 1', () => {
  for (const t of ATTACKS) assert.ok(check(t).count >= 1, t.slice(0, 30));
});

console.log('=== C 良性零误伤 ===');
T('C1 手工良性 33/33 模块直调不判', () => {
  for (const t of BENIGN) {
    const r = check(t);
    assert.ok(!r.hit, `误伤: ${t.slice(0, 50)} | ${r.detail}`);
  }
});
T('C2 官方良性语料 378 条全量扫描零误伤（F-5 三腿 + 完整豁免层）', () => {
  const corpora = {
    'gate-benchmark': require(path.join(ROOT, 'test/gate-benchmark.js')).SAMPLES,
    'gate-benchmark-extended': require(path.join(ROOT, 'test/gate-benchmark-extended.js')).SAMPLES,
    'benign-mixed': require(path.join(ROOT, 'test/benign-mixed-benchmark.js')).SAMPLES,
    'vertical-benign': require(path.join(ROOT, 'test/vertical-benign-benchmark.js')).CATEGORIES,
  };
  function flat(v, out) {
    if (typeof v === 'string') { out.push(v); return; }
    if (Array.isArray(v)) { for (const x of v) flat(x, out); return; }
    if (v && typeof v === 'object') {
      for (const k of Object.keys(v)) {
        if (k === 'text' && typeof v[k] === 'string') { out.push(v[k]); continue; }
        flat(v[k], out);
      }
    }
  }
  let n = 0;
  for (const raw of Object.values(corpora)) {
    const list = [];
    flat(raw, list);
    for (const t of list) {
      if (typeof t !== 'string' || t.length < 6) continue;
      n++;
      assert.ok(!check(t).hit, `官方良性误伤: ${t.slice(0, 80)}`);
    }
  }
  assert.strictEqual(n, 378, `官方良性语料条数应为 378，实测 ${n}`);
});

console.log('=== D 存量回归（r220 家族未受影响）===');
T('D1 存量货币型攻击 4/4 仍命中', () => {
  for (const t of LEGACY_ATTACK) assert.ok(check(t).hit, `存量攻击丢失: ${t}`);
});
T('D2 存量良性 4/4 仍放行', () => {
  for (const t of LEGACY_BENIGN) assert.ok(!check(t).hit, `存量良性被误伤: ${t}`);
});
T('D3 存量常量长度未变（r280/r265 登记纪律）', () => {
  const expect = {
    AVG_COST_ZH: 3, AVG_RETURN_ZH: 4, MARG_ZH: 6, INCR_ZH: 10, CHEAP_ZH: 1, PROFIT_ZH: 5,
    AVG_COST_EN: 4, AVG_RETURN_EN: 5, MARG_EN: 8, INCR_EN: 13, CHEAP_EN: 10, PROFIT_EN: 8,
  };
  for (const [k, v] of Object.entries(expect)) {
    assert.strictEqual(I[k].length, v, `${k} 长度应为 ${v}，实测 ${I[k].length}`);
  }
});
T('D4 新族常量长度登记（AVG_RATE 5/5、RES 7/4、QTY_CONCL 4/4）', () => {
  assert.strictEqual(I.AVG_RATE_ZH.length, 5);
  assert.strictEqual(I.AVG_RATE_EN.length, 5);
  assert.strictEqual(I.RES_ZH.length, 7);
  assert.strictEqual(I.RES_EN.length, 4);
  assert.strictEqual(I.QTY_CONCL_ZH.length, 4);
  assert.strictEqual(I.QTY_CONCL_EN.length, 4);
});

console.log('=== E 负例注入-删条（常量级：删则该腿失承重）===');
// 注入契约：数组常量注入空数组 []（RegExp 不可注入数组常量——list is not iterable）
function hits(arr, inject) {
  let h = 0;
  for (const t of arr) { try { if (check(t, inject).hit) h++; } catch (_) {} }
  return h;
}
T('E1 注入 AVG_RATE_ZH:[] → 中文攻击 8/8 翻 miss', () => {
  assert.strictEqual(hits(ATTACK_ZH, { AVG_RATE_ZH: [] }), 0);
});
T('E2 注入 AVG_RATE_EN:[] → 英文攻击 10/10 翻 miss', () => {
  assert.strictEqual(hits(ATTACK_EN, { AVG_RATE_EN: [] }), 0);
});
T('E3 注入 QTY_CONCL_ZH:[] → 中文攻击 8/8 翻 miss', () => {
  assert.strictEqual(hits(ATTACK_ZH, { QTY_CONCL_ZH: [] }), 0);
});
T('E4 注入 QTY_CONCL_EN:[] → 英文攻击 10/10 翻 miss', () => {
  assert.strictEqual(hits(ATTACK_EN, { QTY_CONCL_EN: [] }), 0);
});
T('E5 注入 RES_ZH:[]（仅删 RES，MARG/INCR 保留）→ 中文 6/8 翻 miss', () => {
  assert.strictEqual(hits(ATTACK_ZH, { RES_ZH: [] }), 2);
});
T('E6 注入 RES_EN:[]（仅删 RES，MARG/INCR 保留）→ 英文 9/10 翻 miss', () => {
  assert.strictEqual(hits(ATTACK_EN, { RES_EN: [] }), 1);
});
T('E7 全腿②中文注入（RES+MARG+INCR 均空）→ 中文 8/8 翻 miss', () => {
  assert.strictEqual(hits(ATTACK_ZH, { RES_ZH: [], MARG_ZH: [], INCR_ZH: [] }), 0);
});
T('E8 全腿②英文注入（RES+MARG+INCR 均空）→ 英文 10/10 翻 miss', () => {
  assert.strictEqual(hits(ATTACK_EN, { RES_EN: [], MARG_EN: [], INCR_EN: [] }), 0);
});

console.log('=== F 元素级注入-删条（逐个元素删，专署攻击翻 miss）===');
T('F1 AVG_RATE_ZH[0]（平均每+时间单位+产出动词）删 → 中文 3 条专署翻 miss', () => {
  const a = I.AVG_RATE_ZH.slice(); a[0] = /(?!)/i;
  assert.strictEqual(hits(ATTACK_ZH, { AVG_RATE_ZH: a }), 5);
});
T('F2 AVG_RATE_ZH[3]（平均+速率名词）删 → 中文 3 条专署翻 miss', () => {
  const a = I.AVG_RATE_ZH.slice(); a[3] = /(?!)/i;
  assert.strictEqual(hits(ATTACK_ZH, { AVG_RATE_ZH: a }), 5);
});
T('F3 RES_EN[0]（one more + 资源名词）删 → 英文 6 条专署翻 miss', () => {
  const a = I.RES_EN.slice(); a[0] = /(?!)/i;
  assert.strictEqual(hits(ATTACK_EN, { RES_EN: a }), 4);
});

console.log('=== G 路由独立性双向对照 ===');
T('G1 删存量全部腿常量（AVG_COST/AVG_RETURN/MARG/INCR/CHEAP/PROFIT）→ F-5 中文攻击 8/8 仍命中', () => {
  const inj = { AVG_COST_ZH: [], AVG_RETURN_ZH: [], MARG_ZH: [], INCR_ZH: [], CHEAP_ZH: [], PROFIT_ZH: [] };
  assert.strictEqual(hits(ATTACK_ZH, inj), 8);
});
T('G2 删存量全部腿常量（EN 侧）→ F-5 英文攻击 10/10 仍命中', () => {
  const inj = { AVG_COST_EN: [], AVG_RETURN_EN: [], MARG_EN: [], INCR_EN: [], CHEAP_EN: [], PROFIT_EN: [] };
  assert.strictEqual(hits(ATTACK_EN, inj), 10);
});
T('G3 删新族 AVG_RATE_ZH:[] → 存量中文货币型攻击仍 2/2 命中（互不依赖）', () => {
  assert.strictEqual(hits(LEGACY_ATTACK_ZH, { AVG_RATE_ZH: [] }), 2);
});
T('G4 删新族 QTY_CONCL_EN:[] → 存量英文货币型攻击仍 2/2 命中', () => {
  assert.strictEqual(hits(LEGACY_ATTACK_EN, { QTY_CONCL_EN: [] }), 2);
});

console.log('=== H 登记纪律 / 引擎边界 ===');
T('H1 __internals 暴露 6 个新族探针键', () => {
  for (const k of ['AVG_RATE_ZH', 'AVG_RATE_EN', 'RES_ZH', 'RES_EN', 'QTY_CONCL_ZH', 'QTY_CONCL_EN']) {
    assert.ok(Array.isArray(I[k]) && I[k].length > 0, `缺少探针键 ${k}`);
  }
});
T('H2 src/index.js 本轮零改动（git diff 对 src/index.js 应为空）', () => {
  const { execFileSync } = require('child_process');
  let out = '';
  try {
    out = execFileSync('git', ['diff', '--name-only', 'HEAD', '--', 'src/index.js'],
      { cwd: ROOT, encoding: 'utf8' });
  } catch (_) { out = ''; }
  // 工作区若有未提交改动也算；HEAD 与工作区都无 src/index.js 变更才算零改动
  const wt = execFileSync('git', ['status', '--porcelain', '--', 'src/index.js'],
    { cwd: ROOT, encoding: 'utf8' });
  assert.strictEqual((out + wt).trim(), '', `src/index.js 有改动: ${out}${wt}`);
});
T('H3 维度计数不受影响（guard-abilities 登记的 246 维不含新键）', () => {
  // 本维度在 gate 层 dimMap 无键（插件层 dispatch），故 dimMap 键数不变
  const idx = require('fs').readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  assert.ok(!/average_marginal_conflation/.test(idx),
    'src/index.js 不应出现 average_marginal_conflation（插件层 dispatch，非 gate 层）');
});

console.log(`\nround-303-average-marginal-rate: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('✅ round-303-average-marginal-rate PASS');
