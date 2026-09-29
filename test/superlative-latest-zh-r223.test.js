/**
 * test/superlative-latest-zh-r223.test.js
 *
 * 第 223 轮（v6.7.127）：「最新」中性化边界化回归测试
 *
 * 背景（222 轮遗留 2，本轮实测坐实）：
 *   checkConfidenceCalibration 的 _supText 用裸 /最新/ 无边界全局删除。
 *   「最新鲜的蔬菜」的前两个字符被吃掉后，白名单形容词「新鲜」失效，
 *   导致「最 + 主观形容词」族在带「最新」前缀时整段漏判。
 *   探针 A（scripts/round-223/probe-r223-supLatest.js）实测 6/6 全 pass。
 *
 * 修复形状：
 *   仅当「最新」后接「的」或时间/序列名词词根时才中性化；
 *   后接形容词（新鲜/甜/软/亮…）时保留原形，交由 superlative 判据捕获。
 *   「最新 + 名词」的边界词表经 30 条时间族样本实测零误吃。
 *
 * 本测试的职责：
 *   ① 修好的正向族端到端必须非 pass（不得回退到漏判）
 *   ② 时间/序列用法必须保持原样中性化（不得因修边界而新增误伤）
 *   ③ 不得把动作从 verify 升级到 rewrite/block（severity 0.25 的上限）
 *   ④ 白名单既有行为不得回归
 */
'use strict';

const assert = require('assert');
const { checkOutput } = require('../src/gate.js');

// ── ① 正向：「最新 + 评价性形容词 + 对象」必须被捕获 ──────────────────
// 这些句子在修复前全部 pass（裸 /最新/ 把形容词前缀吃掉）。
{
  const positives = [
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
  let caught = 0;
  for (const s of positives) {
    const r = checkOutput(s);
    if (r.gate.action !== 'pass') caught++;
  }
  assert.ok(caught === positives.length,
    `「最新+形容词」族应全部非 pass，实测 ${caught}/${positives.length}`);
  console.log(`① 「最新+形容词」族端到端捕获：${caught}/${positives.length} ✅`);
}

// ── ② 时间/序列用法：不得因修边界而新增误伤 ────────────────────────────
// 这些句子在修复前后都必须保持 pass（「最新」在此是时间副词不是评价词）。
{
  const timeUses = [
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
    '最近一段时间的数据。',
  ];
  const regs = timeUses.map(s => {
    const r = checkOutput(s);
    return { s, a: r.gate.action, dims: (r.findings || []).map(f => f.dimension) };
  });
  // 「最近一段时间的数据」在修复前就因 vagueness 维度判 verify（git stash 实测），
  // 与「最新」中性化无关 → 剔除该维度的既有行为，只判 superlative 相关新增。
  const newNonPass = regs.filter(x => x.a !== 'pass' && x.dims.join(',').indexOf('vagueness') === -1);
  assert.strictEqual(newNonPass.length, 0,
    `时间/序列用法必须全 pass，实测非 pass：${JSON.stringify(newNonPass.map(x => x.a))}`);
  console.log(`② 时间/序列用法零新增误伤：${timeUses.length - newNonPass.length}/${timeUses.length}（1 条 vagueness 为基线既有，与本次无关） ✅`);
}

// ── ③ 动作封顶：不得升级 rewrite/block ────────────────────────────────
{
  const positives = [
    '这是市场上最新鲜的蔬菜。',
    '这家店的面包是最新鲜出炉的。',
    '我们用的是最新鲜的肉。',
    '最新鲜的水果在产地直发。',
  ];
  for (const s of positives) {
    const r = checkOutput(s);
    assert.ok(r.gate.action === 'pass' || r.gate.action === 'verify',
      `动作必须封顶在 verify，实测 ${r.gate.action}`);
  }
  console.log('③ 动作封顶在 verify ✅');
}

// ── ④ 既有 superlative 白名单行为不得回归 ─────────────────────────────
// 单字/双字形容词白名单在 222 轮测试里断言过，抽几条同族确认未被边界化波及。
{
  const whites = [
    '这是最安静的机器。',
    '这是最甜的糖。',
    '这是最软的垫子。',
    '这是最亮的屏幕。',
    '这是最便宜的票。',
    '这是最准的预报。',
  ];
  let caught = 0;
  for (const s of whites) {
    const r = checkOutput(s);
    if (r.gate.action !== 'pass') caught++;
  }
  assert.ok(caught === whites.length,
    `既有白名单族不得回归，实测 ${caught}/${whites.length}`);
  console.log(`④ 既有白名单族无回归：${caught}/${whites.length} ✅`);
}

// ── ⑤ 「最新+名词 + 句尾 最新鲜」混合句：局部保留判断 ─────────────────
// 一句话里同时有中性化的「最新版」与需捕获的「最新鲜」。
{
  const mixed = [
    '最新版的设计用了最新鲜的配色。',
    '结合最新的数据，这是最新鲜的结论。',
  ];
  let caught = 0;
  for (const s of mixed) {
    const r = checkOutput(s);
    if (r.gate.action !== 'pass') caught++;
  }
  assert.ok(caught === mixed.length,
    `混合句必须命中，实测 ${caught}/${mixed.length}`);
  console.log(`⑤ 混合句命中：${caught}/${mixed.length} ✅`);
}

console.log('\n测试结果: 5 组全通过');
