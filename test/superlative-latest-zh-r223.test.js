/**
 * test/superlative-latest-zh-r223.test.js
 *
 * 第 223 轮（v6.7.127）：「最新」中性化边界化回归测试
 *
 * 背景（222 轮遗留 2，本轮实测坐实）：
 *   checkConfidenceCalibration 的 _supText 用裸「最新」无边界全局删除。
 *   「最新鲜的蔬菜」的前两个字符被吃掉后，白名单形容词「新鲜」失效，
 *   导致「最 + 主观形容词」族在带「最新」前缀时整段漏判。
 *   探针 A（scripts/round-223/probe-r223-supLatest.js）实测 6/6 全 pass。
 *
 * 修复形状：
 *   仅当「最新」后接「的」或时间/序列名词词根时才中性化；
 *   后接形容词（新鲜/甜/软/亮…）时保留原形，交由 superlative 判据捕获。
 *   「最新 + 名词」的边界词表经 30 条时间族样本实测零误吃。
 *
 * 本测试的职责（逐样本计数，末尾吐标准结果行供 run-all 解析）：
 *   ① 修好的正向族端到端必须非 pass（不得回退到漏判）
 *   ② 时间/序列用法必须保持原样中性化（不得因修边界而新增误伤）
 *   ③ 不得把动作从 verify 升级到 rewrite/block（severity 0.25 的上限）
 *   ④ 白名单既有行为不得回归
 *   ⑤ 「最新+名词 + 最新鲜」混合句必须仍命中形容词分支
 */
'use strict';

const assert = require('assert');
const { checkOutput } = require('../src/gate.js');

let passed = 0;
let failed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log('PASS ' + name);
  } catch (e) {
    failed++;
    console.log('FAIL ' + name + ' — ' + String(e.message).slice(0, 160));
  }
}

// ── ① 正向：「最新 + 评价性形容词 + 对象」必须被捕获 ──────────────────
// 这些句子在修复前全部 pass（裸「最新」把形容词前缀吃掉）。
const LATEST_ADJ_POS = [
  '这是市场上最新鲜的蔬菜，供货商每天凌晨采摘。',
  '这家店的面包是最新鲜出炉的。',
  '这是目前最新鲜的食材。',
  '我们用的是最新鲜的肉。',
  '这个方案基于最新鲜的一手数据。',
  '用户口碑里提到最新鲜的口感。',
  '最新鲜的水果在产地直发。',
  '最新鲜的牛奶保质期最短。',
  '最新鲜的海鲜今晚到港。',
  '保证最新鲜的状态。',
];
for (const s of LATEST_ADJ_POS) {
  check('① 正向捕获「最新+形容词」', () => {
    const r = checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass',
      '应被判非 pass，实测 ' + r.gate.action);
  });
}

// ── ② 时间/序列用法：不得因修边界而新增误伤 ────────────────────────────
// 「最新」在此是时间副词不是评价词。「最近一段时间的数据」在修复前就因
// vagueness 判 verify（git stash 实测），与本次改动无关 → 该条排除。
const TIME_USES = [
  '请查看最新的版本说明。',
  '最新发布的产品存在一个已知问题。',
  '这是最新一期报告。',
  '最新一轮评审已经结束。',
  '这是最新一批数据。',
  '最新款的产品已经上架。',
  '最新一代的芯片性能更好。',
  '最新一届的名单在这里。',
  '最新的资料已归档。',
  '最新的信息请看附件。',
  '最新的文件在这里。',
  '最新的进展同步一下。',
  '最新的结果出来了。',
  '最新通知已收到。',
  '最新公告请查收。',
  '最新数据已经同步。',
  '最新的情况说明在这里。',
  '最新消息刚推送。',
  '最新的成果已发布。',
  '最新的记录被刷新。',
  '最新一起的案件已结案。',
  '最新一条的规则刚生效。',
  '最新一次的通知请查收。',
];
for (const s of TIME_USES) {
  check('② 时间/序列用法零新增误伤', () => {
    const r = checkOutput(s);
    assert.strictEqual(r.gate.action, 'pass',
      '时间用法必须 pass，实测 ' + r.gate.action + ' dims=' +
      (r.findings || []).map(f => f.dimension).join(','));
  });
}

// ── ③ 动作封顶：不得升级 rewrite/block ────────────────────────────────
const CAPPED = [
  '这是市场上最新鲜的蔬菜。',
  '这家店的面包是最新鲜出炉的。',
  '我们用的是最新鲜的肉。',
  '最新鲜的水果在产地直发。',
];
for (const s of CAPPED) {
  check('③ 动作封顶在 verify', () => {
    const r = checkOutput(s);
    assert.ok(r.gate.action === 'pass' || r.gate.action === 'verify',
      '动作必须封顶在 verify，实测 ' + r.gate.action);
  });
}

// ── ④ 既有 superlative 白名单行为不得回归 ─────────────────────────────
const WHITELIST = [
  '这是最安静的机器。',
  '这是最甜的糖。',
  '这是最软的垫子。',
  '这是最亮的屏幕。',
  '这是最便宜的票。',
  '这是最准的预报。',
];
for (const s of WHITELIST) {
  check('④ 既有白名单族无回归', () => {
    const r = checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass',
      '白名单族应非 pass，实测 ' + r.gate.action);
  });
}

// ── ⑤ 「最新+名词 + 最新鲜」混合句：局部保留判断 ─────────────────
const MIXED = [
  '最新版的设计用了最新鲜的配色。',
  '结合最新的数据，这是最新鲜的结论。',
];
for (const s of MIXED) {
  check('⑤ 混合句命中形容词分支', () => {
    const r = checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass',
      '混合句应非 pass，实测 ' + r.gate.action);
  });
}

console.log('\n测试结果: ' + passed + ' 通过, ' + failed + ' 失败, 共 ' + (passed + failed) + ' 个');
process.exit(failed > 0 ? 1 : 0);
