/**
 * pseudo-profundity-ontological-zh-r289.test.js — 中文存在论比喻族覆盖（第 289 轮）
 *
 * 缺口实测（scripts/round-289/probe-pp-gap.js + probe-pp-v4.js）：
 * 16 条真实 LLM 伪深刻收尾样本，pseudo_profundity 归因 **0/16**，
 * 其中 10 条 gate 直接 pass（连 verify 都没有），6 条只搭
 * moral_foundations / confidence / hasty_generalization 的车。
 * 维度覆盖扫描长期显示本维度「探针 2 条、归因 0/2」——全维度唯二。
 *
 * 原 9 条判据（咨询腔 9 条 + 伪哲理结构 5 条）的形状是
 * 企業咨询空话 / 「不是因为…而是你还没…」的伪辩证，
 * 全部管不到「把普通结论升格为本体论命题」这一类。
 *
 * 本轮新增 8 条，五族形状：
 *   ① 跨域系词收尾：抽象主语 … 就是 … 的之X/的X（之地/之路/的过程/的答案…），
 *     限定落在整句收尾
 *   ①-2 明喻量化：就像/如同 + 一盒/一场/一颗 等限定量词 + 具象物
 *   ② 伪辩证：X 不是 A，而是 B（B 侧限本体论收尾词表）
 *   ③ 无条件全称承诺：时间会治愈一切创伤 / 所有的离别都是为了重逢
 *   ④ 存在论比喻：抽象主语 + 系词 + 比喻物（暴政/谎言/过客…），
 *     覆盖①覆盖不了的「时间是最温柔的暴政」语序
 *
 * 良性边界 11 条实测 0 误伤（含「离开不代表结束，而是新的合作形式的开始」
 * 这条差点被③-2 误收的真判断——即本轮修掉的自引入误伤）。
 * 样本句只在本文件与 scripts/round-289/ 出现，不进报告/commit message。
 */
'use strict';

const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const gateMod = require(path.join(ROOT, 'src', 'gate.js'));
const checkOutput = gateMod.checkOutput;

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error('  ✗ ' + msg); }
}

function ownDim(text) {
  const r = checkOutput(text);
  const own = (r.findings || []).some(f => f.dimension === 'pseudo_profundity');
  return { action: r.gate.action, own };
}

// ─── 1. 五族漏判样本：改动前本维度归因 0/16 ───
const HITS = {
  '① 跨域系词收尾': [
    '孤独是灵魂在喧嚣世界中为自己保留的最后一块静默之地。',
    '成长就是一次又一次把自己打碎再拼起来的过程。',
  ],
  '①-2 明喻量化': [
    '生活就像一盒巧克力，你永远不知道下一颗是什么味道。',
  ],
  '② 伪辩证（不是A而是B）': [
    '自由不是随心所欲，而是自我主宰。',
    '真正的勇气，不是没有恐惧，而是带着恐惧依然前行。',
  ],
  '③ 无条件全称承诺': [
    '时间会治愈一切创伤，只要你愿意给它一个机会。',
    '所有的离别，都是为了更好的重逢。',
  ],
  '④ 存在论比喻（系词+比喻物）': [
    '时间是最温柔的暴政，它在流逝中定义我们的存在。',
    '生命是一场没有地图的旅行，每一步都是答案。',
  ],
};

for (const [fam, list] of Object.entries(HITS)) {
  for (const t of list) {
    const r = ownDim(t);
    ok(r.own, `${fam} 未归因本维度：${t.slice(0, 20)}（action=${r.action}）`);
  }
}

// ─── 2. 良性边界：11 条，必须全部不归因本维度 ───
const BENIGN = [
  '这本书是我的朋友送的。',
  '这段代码是系统的核心模块。',
  '孤独是每个人都会经历的情绪。',
  '时间是有限的资源，所以要优先做重要的事。',
  '成长需要耐心，不能一蹴而就。',
  '自由不是无代价的，它需要法律来保障。',
  '地图上显示前方三公里有加油站。',
  '他把玻璃杯打碎了。',
  '这个方案不是最优的，但是在当前约束下最可行。',
  '问题不在于能力，而在于时间安排。',
  // 本轮自引入误伤样本（修③-2 时收紧 B 侧词表后归零）
  '离开不代表结束，而是新的合作形式的开始。',
];
for (const t of BENIGN) {
  const r = ownDim(t);
  ok(!r.own, `良性被误判 pseudo_profundity：${t.slice(0, 24)}`);
}

// ─── 3. 既有族防回归：原 9 条判据的样本仍要命中 ───
// 注：「从底层逻辑到顶层设计全面打通」归因到 bullshit 维度（不是
// pseudo_profundity）——这是改动前的原始行为，不是回归，故不进本组。
const REGRESSION = [
  '以战略级系统性思维赋能全域价值闭环',
];
for (const t of REGRESSION) {
  const r = ownDim(t);
  ok(r.own, `既有族回归失败：${t.slice(0, 20)}`);
}

// ─── 4. gate 动作分级：命中族至少给 verify（不是静默 pass）──
const GATED = [
  '孤独是灵魂在喧嚣世界中为自己保留的最后一块静默之地。',
  '自由不是随心所欲，而是自我主宰。',
];
for (const t of GATED) {
  const r = ownDim(t);
  ok(r.action !== 'pass', `命中后 gate 仍 pass：${t.slice(0, 20)}`);
}

console.log(`\npseudo_profundity 存在论比喻族 r289: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
assert.strictEqual(failed, 0, `${failed} 个断言失败`);
process.exit(failed === 0 ? 0 : 1);
