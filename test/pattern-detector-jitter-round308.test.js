/**
 * 第 308 轮守卫：detectVerdictJitter（判定抖动自检）
 *
 * 背景：第 307 轮把 PatternDetector 接进来并新增 detectVerdictJitter，
 * 但**从未实跑过**，本轮实测发现三处假阴性/脏出口：
 *   ① 交替序列报 jittered:false、flipRate:null
 *      —— detectOscillation 默认 window=10，且要求 records.length >= window，
 *         3~9 条短会话被静默早退（连 flipRate 都不返回）
 *   ② 短序列 minSamples 契约不生效（minSamples:2 时 2 条仍判 insufficient:false）
 *   ③ analyzeTrend 的 direction='insufficient' 被当成有效 trend 上报
 *
 * 本守卫把这些全部钉死：删掉 src 里任一处修复，对应断言必须变红。
 *
 * 运行：node test/pattern-detector-jitter-round308.test.js
 */
'use strict';

const path = require('path');
const assert = require('assert');
const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));

const A = (typeof process.argv[2] !== 'undefined' && process.argv[2].length > 0) ? process.argv[2] : path.join(__dirname, '..', 'src', 'core', 'heartflow.js');
let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  try { fn(); passed++; }
  catch (e) { failed++; failures.push(name + ' :: ' + e.message); }
}

const hf = new HeartFlow();
hf.start();

// ── 接线性 ────────────────────────────────────────────────────
t('A1 patternDetector 已实例化', () => {
  assert.ok(hf.patternDetector, 'hf.patternDetector 缺失');
  assert.strictEqual(typeof hf.patternDetector.detectOscillation, 'function');
});
t('A2 detectVerdictJitter 存在于原型链', () => {
  assert.strictEqual(typeof hf.detectVerdictJitter, 'function');
});
t('A3 已注册进 _modules', () => {
  assert.ok(hf._modules && hf._modules.patternDetector, '未注册 _modules.patternDetector');
});

// ── 真阳：交替序列必须报抖动 ────────────────────────────────
const ALT = ['pass', 'rewrite', 'pass', 'rewrite', 'pass', 'rewrite', 'pass', 'rewrite'];
t('B1 交替 8 条 → jittered=true', () => {
  const r = hf.detectVerdictJitter(ALT);
  assert.strictEqual(r.jittered, true, '交替序列未报抖动');
});
t('B2 交替序列 flipRate 为数字且 >= 阈值，不是 null', () => {
  const r = hf.detectVerdictJitter(ALT);
  assert.ok(typeof r.flipRate === 'number' && !Number.isNaN(r.flipRate),
    'flipRate 缺失（window 早退的症状）: ' + JSON.stringify(r));
  assert.ok(r.flipRate >= (typeof r.threshold === 'number' ? r.threshold : 0.4),
    'flipRate ' + r.flipRate + ' 未达标');
});
t('B3 交替序列给出 oscillationType=双态', () => {
  const r = hf.detectVerdictJitter(ALT);
  assert.strictEqual(r.oscillationType, 'binary');
});
t('B4 报告带可读 note', () => {
  const r = hf.detectVerdictJitter(ALT);
  assert.ok(typeof r.note === 'string' && r.note.length > 0, 'note 为空');
});
t('B5 统计 verdictCounts 正确', () => {
  const r = hf.detectVerdictJitter(ALT);
  assert.strictEqual(r.verdictCounts.pass, 4);
  assert.strictEqual(r.verdictCounts.rewrite, 4);
});
t('B6 3 条短交替序列也要能检出（不靠凑满 10）', () => {
  const r = hf.detectVerdictJitter(['pass', 'rewrite', 'pass']);
  assert.strictEqual(r.jittered, true, '3 条交替未报抖动');
  assert.ok(typeof r.flipRate === 'number', 'flipRate 缺失');
});
t('B7 多态抖动标为 multi', () => {
  const r = hf.detectVerdictJitter(['pass', 'verify', 'rewrite', 'pass', 'block']);
  assert.strictEqual(r.jittered, true);
  assert.strictEqual(r.oscillationType, 'multi');
});

// ── 真阴：全同序列不得报抖动 ────────────────────────────────
t('C1 全同 6 条 → jittered=false', () => {
  const r = hf.detectVerdictJitter(['pass', 'pass', 'pass', 'pass', 'pass', 'pass']);
  assert.strictEqual(r.jittered, false, '全同序列误报抖动');
});
t('C2 全同序列 flipRate=0', () => {
  const r = hf.detectVerdictJitter(['pass', 'pass', 'pass', 'pass', 'pass', 'pass']);
  assert.strictEqual(r.flipRate, 0);
});

// ── 契约：宁漏不错报 ────────────────────────────────────────
t('D1 短序列 → insufficient=true 且 jittered=false', () => {
  const r = hf.detectVerdictJitter(['pass', 'rewrite']);
  assert.strictEqual(r.insufficient, true, 'insufficient 未置位');
  assert.strictEqual(r.jittered, false, '短序列不得报抖动');
});
t('D2 minSamples 选项生效（minSamples=2 时 2 条通过 minSamples 门，不再被类目拦）', () => {
  const r = hf.detectVerdictJitter(['pass', 'rewrite'], { minSamples: 2 });
  // 区分「被 minSamples 门拦下」和「过了门但底层算不出」：
  // 前者 note 是 insufficient_samples，后者 note 来自底层（有效类型数据不足）。
  assert.notStrictEqual(r.note, 'insufficient_samples', 'minSamples 门未生效（仍按默认 3 拦下）');
  assert.strictEqual(r.samples, 2, '统计未覆盖全部合法动作');
  assert.strictEqual(r.jittered, false);
});
t('D2b minSamples 默认 3：2 条仍被 minSamples 门拦下', () => {
  const r = hf.detectVerdictJitter(['pass', 'rewrite']);
  assert.strictEqual(r.reason, 'insufficient_samples', '默认 minSamples=3 未生效');
  assert.strictEqual(r.insufficient, true);
  assert.strictEqual(r.minSamples, 3, '默认 minSamples 不是 3');
  assert.strictEqual(r.jittered, false);
  assert.strictEqual(r.flipRate, undefined, '被门拦下时不得给 flipRate');
});
t('D2c 过了 minSamples 门但底层仍算不出 → 如实标 insufficient，不伪造 flipRate', () => {
  const r = hf.detectVerdictJitter(['pass', 'rewrite'], { minSamples: 2 });
  // 底层 detectOscillation 要求有效类型数 >=3，2 个合法动作算不出翻转率
  assert.strictEqual(r.insufficient, true,
    '算不出翻转率却伪装成有结论: ' + JSON.stringify(r));
  assert.strictEqual(r.flipRate, undefined, '算不出时不得给 flipRate');
  assert.strictEqual(r.jittered, false);
});
t('D3 minSamples=5 时 3 条返回 insufficient', () => {
  const r = hf.detectVerdictJitter(['pass', 'rewrite', 'pass'], { minSamples: 5 });
  assert.strictEqual(r.insufficient, true);
  assert.strictEqual(r.jittered, false);
});
t('D4 空数组不抛异常', () => {
  assert.doesNotThrow(() => hf.detectVerdictJitter([]));
});
t('D5 非数组输入返回结构化 reason，不抛', () => {
  const r = hf.detectVerdictJitter('nope');
  assert.strictEqual(r.jittered, false);
  assert.ok(r.reason, '缺 reason');
});
t('D6 非法元素被过滤，只统计合法动作', () => {
  const r = hf.detectVerdictJitter(['pass', 'garbage', null, { action: 'rewrite' }, {}, 'block']);
  // 合法动作 pass/rewrite/block 恰好构成 pass→rewrite→block 三态交替，
  // 所以 jittered=true 是正确行为（不是误报）——这里钉的是"脏元素没被算进去"。
  assert.strictEqual(r.jittered, true, '合法动作未构成抖动');
  assert.strictEqual(r.samples, 3, '脏元素被算进样本: ' + r.samples);
  assert.strictEqual(r.verdictCounts.garbage, undefined, '非法元素进了统计');
  assert.strictEqual(r.verdictCounts.pass, 1);
  assert.strictEqual(r.verdictCounts.rewrite, 1);
  assert.strictEqual(r.verdictCounts.block, 1);
});
t('D6b 脏元素不足以构成抖动时 jittered=false 且不抛', () => {
  const r = hf.detectVerdictJitter(['pass', 'garbage', null, { nope: 1 }, 'pass']);
  assert.strictEqual(r.jittered, false);
  assert.strictEqual(r.samples, 2);
});
t('D7 冻结入参不抛异常（不得改写入参）', () => {
  const f = Object.freeze([...ALT]);
  assert.doesNotThrow(() => hf.detectVerdictJitter(f));
  assert.deepStrictEqual([...f], ALT, '入参被修改');
});

// ── 趋势侧：insufficient 不得冒充趋势 ──────────────────────
t('E1 样本 <5 时 trend 为 null（不得把 insufficient 当稳定）', () => {
  const r = hf.detectVerdictJitter(['pass', 'rewrite', 'pass', 'rewrite']);
  assert.strictEqual(r.trend, null, '短序列返回了伪趋势: ' + JSON.stringify(r.trend));
});
t('E2 样本 >=5 且非 pass 占比上升 → trend.direction=rising', () => {
  const r = hf.detectVerdictJitter(['pass', 'verify', 'rewrite', 'rewrite', 'block']);
  assert.ok(r.trend, 'trend 缺失');
  assert.strictEqual(r.trend.direction, 'rising', '方向错误: ' + r.trend.direction);
});
t('E3 样本 >=5 且全程 pass → trend.direction=stable', () => {
  const r = hf.detectVerdictJitter(['pass', 'pass', 'pass', 'pass', 'pass']);
  assert.ok(r.trend, 'trend 缺失');
  assert.strictEqual(r.trend.direction, 'stable');
});
t('E4 trend.direction 只可能是三个合法值或 null', () => {
  const seqs = [
    ['pass', 'pass', 'pass', 'pass', 'pass'],
    ['pass', 'verify', 'rewrite', 'rewrite', 'block'],
    ['block', 'rewrite', 'verify', 'pass', 'pass'],
    ['pass', 'rewrite', 'pass', 'rewrite'],
  ];
  for (const s of seqs) {
    const d = hf.detectVerdictJitter(s).trend;
    if (d === null) continue;
    assert.ok(['stable', 'rising', 'falling'].includes(d.direction),
      '非法 direction: ' + d.direction);
  }
});

// ── 旁路性：不得影响判定 ────────────────────────────────────
t('F1 判定入口可用且返回 gate.action', () => {
  const txt = '毋庸置疑，这是绝对正确的唯一答案。';
  const gateMod = require(path.join(__dirname, '..', 'src', 'gate.js'));
  const gateFn = typeof gateMod.gate === 'function' ? gateMod.gate : gateMod.check;
  const r = gateFn(txt);
  assert.ok(r && r.gate && r.gate.action, 'gate() 未返回 gate.action');
});
t('F1b 调用后 gate 判定结果不变（旁路性）', () => {
  const gateMod = require(path.join(__dirname, '..', 'src', 'gate.js'));
  const gateFn = typeof gateMod.gate === 'function' ? gateMod.gate : gateMod.check;
  const txt = '毋庸置疑，这是绝对正确的唯一答案。';
  const a1 = gateFn(txt).gate.action;
  hf.detectVerdictJitter(ALT);
  const a2 = gateFn(txt).gate.action;
  assert.strictEqual(a1, a2, '判定动作被旁路调用改变了: ' + a1 + ' -> ' + a2);
});
t('F2 方法自带 patternDetector 缺失兜底（不抛）', () => {
  const obj = Object.create(hf);
  obj.patternDetector = null;
  const r = obj.detectVerdictJitter(ALT);
  assert.strictEqual(r.jittered, false);
  assert.ok(r.reason, '兜底缺 reason');
});

// ── 窗口显式化（B1/B6 回归的核心） ────────────────────────
t('G1 window 被钳制到序列长度，不因凑不满指定窗口而漏检', () => {
  const r = hf.detectVerdictJitter(['pass', 'rewrite', 'pass', 'rewrite', 'pass', 'rewrite'], { window: 10 });
  // 修复前：默认 window=10 且序列仅 6 条 → 静默早退 detected:false、flipRate:null
  // 修复后：window 被钳到序列长度，能真实算出翻转率并检出双态震荡
  assert.strictEqual(r.jittered, true, '短会话真抖动被漏检');
  assert.ok(typeof r.flipRate === 'number', 'flipRate 缺失');
  assert.strictEqual(r.window, 6, 'window 未按序列长度钳制: ' + r.window);
});
t('G1b window 小于序列长度时取末尾窗口', () => {
  const seq = ['pass', 'pass', 'pass', 'pass', 'pass', 'rewrite', 'pass', 'rewrite'];
  const r = hf.detectVerdictJitter(seq, { window: 4 });
  assert.strictEqual(r.jittered, true);
  assert.strictEqual(r.window, 4, 'window 未取 4: ' + r.window);
  assert.strictEqual(r.samples, 8, '样本数应为全序列长度');
});
t('G2 window 选项不短于 minSamples 时可检出', () => {
  const r = hf.detectVerdictJitter(ALT, { window: 8 });
  assert.strictEqual(r.jittered, true);
});

// ── 汇总 ────────────────────────────────────────────────────
const ok = process.exitCode || 0;
console.log('═══════════════════════════════════════');
console.log('detectVerdictJitter 守卫（第 308 轮）');
console.log('═══════════════════════════════════════');
console.log('  通过 ' + passed + ' / ' + (passed + failed));
// run-all.js 只认「N 通过, M 失败」成对汇总行；只报分数式时被判静默、
// 计入 1 个失败（第 309-310 轮连续三轮占失败位）。这里补标准行。
console.log('测试结果: ' + passed + ' 通过, ' + failed + ' 失败, 共 ' + (passed + failed) + ' 个');
if (failed) {
  console.log('  失败 ' + failed + ':');
  for (const f of failures) console.log('    ✗ ' + f);
  process.exitCode = 1;
} else {
  console.log('  ✅ 全绿');
}
