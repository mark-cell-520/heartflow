/**
 * test/round-643-sunk-cost-coercion.test.js
 *
 * 第 98 判别维度 sunk_cost_coercion（沉没成本胁迫）守护测试。
 * 立项来源：r643 探测器（scripts/round-643-probe.js）+ decision 本体
 * A=0.93 / confidence 0.85 / identity 100%。
 *
 * 覆盖七节：
 *   A 单维命中（10 条攻击，中英双语）
 *   B 单维不误伤（12 条良性，含决策分析/会计结转/反思/纯感慨四类看守）
 *   C discriminate 聚合（dimensions 登记 + findings 可见 + 维度总数 100）
 *   D gate 分级（双入口 action 非 pass、良性 pass/verify）
 *   E 变异注入负例（置空四条腿 + 拆「双腿共现」为「或」）
 *   F 边界锁（与 fallacies sunk_cost_* / favor_ledger 的分界）
 *   G 接口登记（module.exports + 六处接线）
 */
'use strict';

const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/sunk-cost-coercion.js'));
const gateMod = require(path.join(REPO, 'src/gate.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkSunkCostCoercion;
const internals = mod.__internals;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：单维命中（10 条攻击，中英各半）───────────────────────────
const ATTACK = [
  // 中文：投入陈述 + 放弃可惜
  '都已经投入这么多了，现在放弃太可惜，再加把劲',
  '钱都交了，你现在退出不是白花了',
  '已经等了三年了，再等几个月又能怎样',
  '来都来了，就买了吧，不然这趟白跑',
  '都坚持这么久了，现在放弃前面全废了',
  '投了这么多钱，现在收手就是承认当初错了',
  // 英文
  'We have already invested so much, quitting now would waste it all.',
  'You have paid for the course, so you might as well finish it.',
  'We have waited three years, a few more months will not hurt.',
  'Since you already started, stopping now means it was all for nothing.',
];

// ─── B 节：单维不误伤（12 条良性）───────────────────────────────────
const BENIGN = [
  // 客观决策说明（有投入陈述、无「放弃可惜」腿）
  '考虑到前期已经投入的研发成本，团队决定继续完成这个项目',
  '既然学费已经交了，就好好上课把知识学到手',
  '项目进行到一半，收尾工作还需要两周时间',
  'Given the sunk development cost, we will finish the remaining milestones.',
  'The deposit is non-refundable, so let us make the most of the workshop.',
  // G1 决策分析语境
  '这是沉没成本，应该忽略它，只看未来的收益',
  '沉没成本谬误是行为经济学里的经典概念',
  // G2 会计结转
  '财务上这笔费用需要核销并计入当期损益',
  // G3 反思教学
  '这种沉没成本话术的问题在于把过去的付出当成未来的理由',
  // G4 纯感慨
  '时间过得真快，三年就这么过去了',
  // 无关良性
  '如果不确定，可以先问问团队的资深同事',
  // ⚠️ 右腿单独出现不得判（双腿共现铁律）
  'Waiting a few more days will not hurt if the data is incomplete.',
  'A few more weeks will not matter for the internal review.',
];

console.log('═══ A 节：单维命中 ═══');
for (const s of ATTACK) {
  t('A hit: ' + s.slice(0, 34), () => {
    const r = check(s);
    assert.ok(r.hit, '应命中：' + s);
    assert.ok(r.count >= 1, 'count 应 >= 1');
  });
}

console.log('═══ B 节：单维不误伤 ═══');
for (const s of BENIGN) {
  t('B no-fp: ' + s.slice(0, 34), () => {
    const r = check(s);
    assert.ok(!r.hit, '不应命中：' + s + ' → ' + r.detail);
  });
}

// ─── C 节：discriminate 聚合 ────────────────────────────────────────
console.log('═══ C 节：discriminate 聚合 ═══');
t('C1 dimensions 登记 sunk_cost_coercion', () => {
  const d = gateMod.discriminate('钱都交了，你现在退出不是白花了');
  assert.ok(d.dimensions && 'sunk_cost_coercion' in d.dimensions, 'dimensions 缺键');
  assert.ok(d.dimensions.sunk_cost_coercion.count >= 1, 'count 应 >= 1');
});
t('C2 findings 可见', () => {
  const d = gateMod.discriminate('钱都交了，你现在退出不是白花了');
  const f = (d.findings || []).find(x => x.dimension === 'sunk_cost_coercion');
  assert.ok(f, 'findings 里应出现 sunk_cost_coercion');
});
t('C3 维度总数 100', () => {
  const d = gateMod.discriminate('probe');
  // [r655] 100 → 104：r647 commitment_coercion、r648 investment_as_debt、
  // r649 suffering_capital、r650 selfharm_coercion、r654
  // relationship_severance、r655 fear_projection 六个维度陆续接入。
  assert.strictEqual(Object.keys(d.dimensions).length, 118, '维度总数应为 110');
});
t('C4 summary 有人类可读文案', () => {
  const d = gateMod.discriminate('钱都交了，你现在退出不是白花了');
  const s = JSON.stringify(d.summary || d);
  assert.ok(s.includes('沉没成本胁迫'), 'summary 应含「沉没成本胁迫」');
});
t('C5 idx 直接导出可用', () => {
  assert.strictEqual(typeof idx.checkSunkCostCoercion, 'function', 'idx.checkSunkCostCoercion 应为函数');
  assert.ok(idx.checkSunkCostCoercion('钱都交了，你现在退出不是白花了').hit, '导出应可命中');
});

// ─── D 节：gate 分级 ────────────────────────────────────────────────
console.log('═══ D 节：gate 分级 ═══');
t('D1 gate 入口 10 条攻击全部非 pass', () => {
  for (const s of ATTACK) {
    const r = gateMod.gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', '不得放行：' + s);
  }
});
t('D2 checkOutput 入口 10 条攻击全部非 pass', () => {
  for (const s of ATTACK) {
    const r = gateMod.checkOutput(s);
    const act = (r.gate && r.gate.action) || r.action;
    assert.notStrictEqual(act, 'pass', '不得放行：' + s);
  }
});
t('D3 良性 14 条 pass/verify（不硬拦）', () => {
  for (const s of BENIGN) {
    const r = gateMod.gate(s);
    assert.ok(r.gate.action === 'pass' || r.gate.action === 'verify',
      '不得硬拦：' + s + ' → ' + r.gate.action);
  }
});
t('D4 行动级是 verify 不是 block/rewrite', () => {
  const r = gateMod.gate('钱都交了，你现在退出不是白花了');
  assert.strictEqual(r.gate.action, 'verify', '应为 verify（保守口径）');
});

// ─── E 节：变异注入负例（删判据必变红）─────────────────────────────
console.log('═══ E 节：变异注入负例 ═══');
const E_SAMPLE = '钱都交了，你现在退出不是白花了';
t('E1 置空 INVESTED_ZH 后不判', () => {
  const r = check(E_SAMPLE, { INVESTED_ZH: /(?!x)x/ });
  assert.ok(!r.hit, '置空投入腿应不判');
});
t('E2 置空 SUNK_ZH 后不判', () => {
  const r = check(E_SAMPLE, { SUNK_ZH: /(?!x)x/ });
  assert.ok(!r.hit, '置空沉没腿应不判');
});
t('E3 置空 ANALYSIS_ZH 不误伤良性（良性本就不判，护栏仍在）', () => {
  const r = check('这是沉没成本，应该忽略它，只看未来的收益', { ANALYSIS_ZH: /(?!x)x/ });
  // 置空分析语看守后，本样本只有投入名词无投入动词、无沉没腿 → 仍不判
  assert.ok(!r.hit, '缺投入动词 + 缺沉没腿，置空看守也不应判');
});
t('E4 置空 ACCOUNTING_ZH 后会计句仍不判（双腿不在场）', () => {
  const r = check('财务上这笔费用需要核销并计入当期损益', { ACCOUNTING_ZH: /(?!x)x/ });
  assert.ok(!r.hit, '会计句无投入动词 + 无沉没腿');
});
t('E5 真实命中样本在四条腿齐全时必判（对照）', () => {
  const r = check(E_SAMPLE, {});
  assert.ok(r.hit, '原样本应命中');
});

// ─── F 节：边界锁（与相邻维度的分界）───────────────────────────────
console.log('═══ F 节：边界锁 ═══');
t('F1 fallacies 的显式推论形不归本维度（分界记录）', () => {
  // 「已经花了这么多钱，现在放弃等于前功尽弃，白做了」——fallacies 的
  // sunk_cost_nullified 认它（等于+白做）；本维度双腿也在场，命中是正常的。
  // 这里锁的是**分界存在**：两者可以同时命中，不互相依赖。
  const d = gateMod.discriminate('已经花了这么多钱，现在放弃等于前功尽弃，白做了');
  const dims = (d.findings || []).map(x => x.dimension);
  assert.ok(dims.length >= 1, '至少一个维度命中');
});
t('F2 favor_ledger 族（人情债）不被本维度误吃', () => {
  // 第二人称义务索取，无自身投入陈述
  const r = check('我当年帮了你那么大忙，这点小事你都不肯');
  assert.ok(!r.hit, 'favor_ledger 族不归本维度');
});
t('F3 单腿「投入陈述」不判', () => {
  assert.ok(!check('这个项目已经投入了三年的研发精力').hit, '只有投入腿不判');
});
t('F4 单腿「沉没定性」不判', () => {
  assert.ok(!check('半途而废确实不太好，你要想清楚').hit, '只有沉没腿不判');
});
t('F5 正当提问不判', () => {
  assert.ok(!check('如何评估一个项目是否应该继续投入？').hit, '提问不判');
});

// ─── G 节：接口登记 ────────────────────────────────────────────────
console.log('═══ G 节：接口登记 ═══');
t('G1 module.exports 形状', () => {
  assert.strictEqual(typeof mod.checkSunkCostCoercion, 'function');
  assert.strictEqual(typeof mod.__internals, 'function');
});
t('G2 八组正则常量可提取', () => {
  const I = internals();
  for (const k of ['INVESTED_ZH', 'INVESTED_EN', 'SUNK_ZH', 'SUNK_EN',
    'ANALYSIS_ZH', 'ACCOUNTING_ZH', 'REFLEXIVE_ZH', 'NOSTALGIA_ZH']) {
    assert.ok(I[k] instanceof RegExp, k + ' 应为 RegExp');
  }
});
t('G3 非字符串不崩', () => {
  assert.ok(!check(null).hit);
  assert.ok(!check(undefined).hit);
  assert.ok(!check('').hit);
  assert.ok(!check(123).hit);
});
t('G4 DIM_GUIDANCE 已登记', () => {
  const src = require('fs').readFileSync(path.join(REPO, 'src/index.js'), 'utf8');
  assert.ok(src.includes("'sunk_cost_coercion':"), 'DIM_GUIDANCE 应有该键');
});
t('G5 VERIFY_DIMS 已登记', () => {
  const src = require('fs').readFileSync(path.join(REPO, 'src/index.js'), 'utf8');
  const i = src.indexOf('const VERIFY_DIMS');
  const seg = src.slice(i, src.indexOf(']);', i));
  assert.ok(seg.includes("'sunk_cost_coercion',"), 'VERIFY_DIMS 应含该维度');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (failures.length) { console.log('失败明细:'); for (const f of failures) console.log('  - ' + f); }
process.exitCode = fail > 0 ? 1 : 0;
