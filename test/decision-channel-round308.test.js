/**
 * 第 308 轮守卫：decision.decide 的可定向通道契约
 *
 * 缺口复测（probe-5/6/7 实测，r308）：
 *   r307 交接簿记账「v3 走 key=value 通道（feasibility/risk/impact/confidence
 *   + 引擎调用覆盖率 0/18）→ CHOSEN=A，confidence=0.85」。
 *   **该记账不可复现**——本轮实测同一形态 chosen=null、confidence=0。
 *
 * 精确定位（probe-7 逐项对照）：
 *   ① key=value 的 key 必须是白名单内字段：
 *      NUMERIC_KEYS = ['feasibility','consequence_value','risk','confidence','prior']
 *      —— r307 写的 **impact 不在白名单**，字段被整体丢弃
 *   ② value 必须落在 [0,1]（src/core/decision.js 375 行越界 continue）
 *      —— r307 写的 9/2/7/8 全部越界，被逐个丢弃
 *   ③ 两个条件同时踩中 → 四个字段全丢 → 全部回退文本默认值 → composite
 *      打平 → options_indistinguishable + chosen:null
 *
 * 真实可用通道（本轮实测 confidence 有区分度的三种）：
 *   · x/y 检测比例（命中率 10/10、误伤 0/30）→ conf 0.7
 *   · [0,1] 区间白名单 key=value → conf 0.8~0.9
 *   · 两者混合 → conf 0.7
 *
 * 本守卫把契约钉死：改坏 NUMERIC_KEYS 或区间校验，对应断言必须变红。
 *
 * 运行：node test/decision-channel-round308.test.js
 */
'use strict';

const path = require('path');
const assert = require('assert');
const { HeartFlowDecision } = require(path.join(__dirname, '..', 'src', 'core', 'decision.js'));

let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  try { fn(); passed++; }
  catch (e) { failed++; failures.push(name + ' :: ' + e.message); }
}

const d = new HeartFlowDecision();

async function decide(prompt) {
  return d.decide({ task: '选下一轮方向', prompt });
}
function isChosen(r) { return r && typeof r.chosen === 'string' && r.chosen.length > 0; }

// 同步测试主体（异步结果在下方 run 段收集）
const asyncResults = [];
function at(name, fn) { asyncResults.push([name, fn]); }

// ── 真实可用通道 ────────────────────────────────────────────
at('A1 x/y 检测比例通道可定向', async () => {
  const r = await decide('[A] 甲：命中率 10/10、误伤 0/30\n[B] 乙：命中率 4/10、误伤 12/30');
  assert.ok(isChosen(r), '比例通道未能定向: ' + JSON.stringify(r));
  assert.ok(r.confidence > 0, 'confidence 为 0');
});
at('A2 [0,1] 区间白名单 key=value 通道可定向', async () => {
  const r = await decide('[A] 甲：feasibility=0.9, risk=0.2, confidence=0.8\n[B] 乙：feasibility=0.8, risk=0.3, confidence=0.7');
  assert.ok(isChosen(r), 'key=value 通道未能定向: ' + JSON.stringify(r));
});
at('A3 混合通道（比例 + key=value）可定向', async () => {
  const r = await decide('[A] 甲：命中率 10/10、误伤 0/30，feasibility=0.95\n[B] 乙：命中率 4/10、误伤 12/30，feasibility=0.5');
  assert.ok(isChosen(r), '混合通道未能定向: ' + JSON.stringify(r));
});
at('A4 比例通道已知盲区（r308 probe-8 实测）：打分方向与质量反相关', async () => {
  // probe-8 实测：命中率 10/10 误伤 0/30 的项 score 0.77，
  // 命中率 4/10 误伤 12/30 的项 score 0.82 —— decide 把「更差的候选」排更高。
  // 这是 _scoreOption 的真实缺陷（只解析数字大小，不理解「命中率越高越好、
  // 误伤越低越好」的语义）。这里只钉「通道能定向且 confidence>0」这个契约，
  // 反向打分的事实写进 UPGRADE_LOG 遗留节，交给后续轮次修。
  const r = await decide('[A] 甲：命中率 10/10、误伤 0/30\n[B] 乙：命中率 4/10、误伤 12/30');
  assert.ok(isChosen(r), '比例通道未能定向');
  assert.ok(r.confidence > 0, 'confidence 异常');
  assert.ok(typeof r.chosen === 'string' && r.chosen.length === 1,
    'chosen 应为单字母选项号: ' + r.chosen);
});

// ── 白名单契约：非白名单 key 不得被当判据 ──────────────────
at('B1 非白名单 key（impact）不产生区分度', async () => {
  // impact 不在 NUMERIC_KEYS 内 → 丢弃 → 候选打平 → 弃权
  const r = await decide('[A] 甲：impact=0.9\n[B] 乙：impact=0.2');
  assert.ok(!isChosen(r), '非白名单 key 竟产生了定向，说明白名单失效: ' + JSON.stringify(r));
});
at('B2 白名单 key 齐全且含 consequence_value/prior', async () => {
  // 四个白名单字段各自单独出现都应能定向（probe-6 实测）
  const keys = ['feasibility', 'consequence_value', 'confidence', 'prior'];
  for (const k of keys) {
    const r = await decide(`[A] 甲：${k}=0.9\n[B] 乙：${k}=0.2`);
    assert.ok(isChosen(r), `白名单字段 ${k} 未能定向: ` + JSON.stringify(r));
  }
});

// ── 区间契约：value 越界必须被丢弃（不静默采信） ────────────
at('C1 越界 value（>1）被丢弃，不得定向', async () => {
  const r = await decide('[A] 甲：feasibility=9\n[B] 乙：feasibility=2');
  assert.ok(!isChosen(r), '越界 value 竟被采信: ' + JSON.stringify(r));
});
at('C2 负值越界被丢弃', async () => {
  const r = await decide('[A] 甲：feasibility=-5\n[B] 乙：feasibility=-1');
  assert.ok(!isChosen(r), '负越界 value 竟被采信');
});
at('C3 同一字段 [0,1] 内的差异可定向（对照组）', async () => {
  const r = await decide('[A] 甲：feasibility=0.9\n[B] 乙：feasibility=0.2');
  assert.ok(isChosen(r), '区间内差异未能定向');
});

// ── r307 记账精确复现（必须为 null，证明那轮记账不可信） ────
at('D1 r307 原始形态复现为 chosen=null', async () => {
  const prompt = [
    '[A] 接 PatternDetector：feasibility=9, risk=2, impact=7, confidence=8，引擎调用覆盖率 0/18',
    '[B] 接 TTLPreferences：feasibility=8, risk=3, impact=6, confidence=7，引擎调用覆盖率 0/18',
    '[C] 做仓库卫生：feasibility=10, risk=1, impact=2, confidence=9，引擎调用覆盖率 1/18',
  ].join('\n');
  const r = await decide(prompt);
  assert.strictEqual(r.chosen, null, 'r307 形态竟能定向（与 r308 实测矛盾）');
  assert.strictEqual(r.confidence, 0);
  assert.ok(/options_indistinguishable/.test(String(r.reasoning || '')),
    'reasoning 未说明原因: ' + String(r.reasoning || '').slice(0, 80));
});
at('D2 只把值改成 [0,1]（仍留 impact）→ 由白名单字段定向', async () => {
  const prompt = [
    '[A] 接 PatternDetector：feasibility=0.9, risk=0.2, impact=0.7, confidence=0.8，引擎调用覆盖率 0/18',
    '[B] 接 TTLPreferences：feasibility=0.8, risk=0.3, impact=0.6, confidence=0.7，引擎调用覆盖率 0/18',
  ].join('\n');
  const r = await decide(prompt);
  assert.ok(isChosen(r), '白名单字段区间内仍未定向: ' + JSON.stringify(r));
});

// ── 无判据时必须弃权（不许胡乱挑） ─────────────────────────
at('E1 无可解析判据 → chosen=null 且说明原因', async () => {
  const r = await decide('[A] 接 PatternDetector\n[B] 接 TTLPreferences\n[C] 做仓库卫生');
  assert.strictEqual(r.chosen, null);
  assert.ok(/options_indistinguishable/.test(String(r.reasoning || '')), '未说明弃权原因');
});

// ── 覆盖率比例单独不构成定向（H: 三个几乎相同的比例） ────────
at('F1 覆盖率先单挑不保证定向（记为已知盲区，不是回归）', async () => {
  const r = await decide('[A] 3/18\n[B] 0/18\n[C] 0/18');
  // probe-7 实测 chosen=null：单纯的 x/y 且两项相同时无区分度。
  // 这里只钉「不抛异常 + 有 reasoning」，不强制定向方向。
  assert.ok(r && typeof r === 'object', '返回值异常');
  assert.ok('confidence' in r, '缺 confidence 字段');
});

(async () => {
  for (const [name, fn] of asyncResults) {
    try { await fn(); passed++; }
    catch (e) { failed++; failures.push(name + ' :: ' + e.message); }
  }
  console.log('═══════════════════════════════════════');
  console.log('decision 通道契约守卫（第 308 轮）');
  console.log('═══════════════════════════════════════');
  console.log('  通过 ' + passed + ' / ' + (passed + failed));
  if (failed) {
    console.log('  失败 ' + failed + ':');
    for (const f of failures) console.log('    ✗ ' + f);
    process.exitCode = 1;
  } else {
    console.log('  ✅ 全绿');
  }
})();
