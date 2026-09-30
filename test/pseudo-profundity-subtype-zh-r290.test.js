/**
 * pseudo-profundity-subtype-zh-r290.test.js — 中文子句型覆盖（第 290 轮）
 *
 * 缺口实测（scripts/round-290/probe-pp-subtype.js，直接重跑 round-289/diag.js
 * 的 16 条真实样本集）：第 289 轮补完五族后，仍有 **7/16 零归因**，
 * 分四类子句型——本轮全部收敛到 0/16。
 *
 * 四类子句型（样本只在本文件与 scripts/round-290/ 出现，不进报告/commit）：
 *   ⑤ 元认知递归收尾：抽象主语 + 系词 +「自己不知道什么」
 *   ⑥ 主语域偏正：抽象主语 +「不在于A而在于B」
 *   ⑦ 主语域格言：必修课 / 与自己和解 / 明喻+胜出赋值
 *   ⑧ 对称伪辩证：A/B 两侧共享「想X就X」镜像结构
 *
 * 与 289 轮的分界：289 轮判据锚**宾语/B 侧本体论词表**，本轮锚
 * **主语侧抽象域词表**——两轮互补，共同覆盖「把普通结论升格为本体论命题」。
 *
 * 良性边界本轮扩到 22 条（289 轮 11 + 本轮 11），含 4 条易误伤形状：
 * 真偏正句（问题不在于能力而在时间）、语法正确的比喻句、
 * 抽象主语的实指陈述、技术文档的口头禅。
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

// ─── 1. 本轮四类子句型：改动前本维度归因 0/7 ───
const HITS = {
  '⑤ 元认知递归': [
    '真正的智慧，是知道自己不知道什么。',
  ],
  '⑥ 主语域偏正': [
    '生命的意义不在于长短，而在于我们如何度过。',
  ],
  '⑦-必修课': [
    '孤独是成长的必修课，它让我们有机会与自己对话。',
  ],
  '⑦-与自己和解': [
    '真正的成熟，是终于学会与不完美的自己和解。',
  ],
  '⑦-明喻胜出赋值': [
    '沉默是最深沉的告别，胜过千言万语。',
  ],
  '⑧ 对称伪辩证': [
    '真正的自由不是想做什么就做什么，而是不想做什么就不做什么。',
  ],
  '⑧-2 度量辩证': [
    '幸福不是拥有得多，而是计较得少。',
  ],
};
for (const [fam, list] of Object.entries(HITS)) {
  for (const t of list) {
    const r = ownDim(t);
    ok(r.own, `${fam} 未归因本维度：${t.slice(0, 20)}（action=${r.action}）`);
  }
}

// ─── 2. 良性边界：22 条，必须全部不归因本维度 ───
const BENIGN = [
  // 289 轮原 11 条
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
  '离开不代表结束，而是新的合作形式的开始。',
  // 本轮新增 11 条（专打本轮判据的易误伤形状）
  '沉默是沟通的一种形式，该说话时才有效。',
  '告别的方式有很多种，写信只是其中之一。',
  '孤独感在青少年中很常见，家长要留意。',
  '真正的成熟需要时间，不是读几本书就能获得。',
  '知道自己不知道什么，是工程师的基本素养。',
  '效率不在于加班多少，而在于任务怎么拆分。',
  '成本不在于单价，而在于总体拥有成本。',
  '这个逻辑不是要覆盖所有场景，而是要覆盖主要场景。',
  '温度不是越高越好，而是要根据材料定。',
  '胜利不是终点，而是新的起点。',
  '质量不是检验出来的，而是生产出来的。',
];
for (const t of BENIGN) {
  const r = ownDim(t);
  ok(!r.own, `良性被误判 pseudo_profundity：${t.slice(0, 24)}`);
}

// ─── 3. 既有族防回归：289 轮 + 原 9 条判据的样本仍要命中 ───
const REGRESSION = [
  // 289 轮五族各一条
  '孤独是灵魂在喧嚣世界中为自己保留的最后一块静默之地。',
  '成长就是一次又一次把自己打碎再拼起来的过程。',
  '生活就像一盒巧克力，你永远不知道下一颗是什么味道。',
  '自由不是随心所欲，而是自我主宰。',
  '时间会治愈一切创伤，只要你愿意给它一个机会。',
  '所有的离别，都是为了更好的重逢。',
  '时间是最温柔的暴政，它在流逝中定义我们的存在。',
  '生命是一场没有地图的旅行，每一步都是答案。',
  '真正的勇气，不是没有恐惧，而是带着恐惧依然前行。',
  // 原 9 条判据
  '以战略级系统性思维赋能全域价值闭环',
];
for (const t of REGRESSION) {
  const r = ownDim(t);
  ok(r.own, `既有族回归失败：${t.slice(0, 20)}`);
}

// ─── 4. gate 动作分级：命中族至少给 verify（不是静默 pass）──
const GATED = [
  '生命的意义不在于长短，而在于我们如何度过。',
  '沉默是最深沉的告别，胜过千言万语。',
];
for (const t of GATED) {
  const r = ownDim(t);
  ok(r.action !== 'pass', `命中后 gate 仍 pass：${t.slice(0, 20)}`);
}

// ─── 5. 双向守卫全量复跑（不进 stdout，只看数字）──
console.log(`\npseudo_profundity 子句型 r290: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
assert.strictEqual(failed, 0, `${failed} 个断言失败`);
process.exit(failed === 0 ? 0 : 1);
