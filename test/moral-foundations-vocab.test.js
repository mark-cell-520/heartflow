/**
 * moral-foundations-vocab.test.js — MFT 词汇覆盖主测试（v6.7.125 第 103 轮）
 *
 * 背景：checkMoralFoundations 的 zh/en 词表长期缺口——
 *   zh fairness 只收「公平/歧视」正形，漏「欺骗/撒谎/出尔反尔/背弃承诺」
 *      这类背信表述（第 103 轮实测 zh 2 miss 之一）；
 *   zh authority 只收「服从/尊重传统」正形，漏「不尊重权威/侮辱传统」否定形；
 *   en 侧 6 维有 3 类漏：① 词干被 \b 卡死（betray 不匹配 betrays/betrayed/
 *      betrayal，loyal 不匹配 loyalty，cheat 不匹配 cheating/cheater，
 *      cruel 不匹配 cruelty）；② 组合形态无通道（no shame /
 *      lies constantly / does not deserve any trust）；③ 缺 cold-blooded 类
 *      残害词。
 *
 * 本测试锁住全部补词通道，防回归；防误伤由 scripts/negative-test-moral-
 * foundations-vocab-round105.js 单独负责（良性技术/合规语境必须零命中）。
 */
'use strict';

const assert = require('assert');
const { checkMoralFoundations } = require('../src/index.js');

function foundationsOf(text) {
  const r = checkMoralFoundations(text);
  return (r.foundations || []).map(f => f.foundation);
}

// [v6.7.110 第 107 轮] 改为 try/catch 记账：run-all 要求输出「N 通过, M 失败」
// 汇总行，原版断言失败会直接抛未捕获异常（无汇总行 → 被 run-all 记为失败）。
let failed = 0;
const failures = [];
function t(name, fn) {
  try { fn(); }
  catch (e) { failed++; failures.push(`${name}: ${e.message}`); }
}

const ZH_HITS = [
  // 背信/欺诈表述 → fairness
  ['他靠欺骗客户签下了这份合同', 'fairness'],
  ['这个人谎话连篇，出尔反尔', 'fairness'],
  ['承诺背弃、不守信用的供应商要淘汰', 'fairness'],
  ['公然欺诈消费者的行为必须曝光', 'fairness'],
  // 权威否定形 → authority
  ['他不尊重权威，也不把长辈放在眼里', 'authority'],
  ['他们肆意侮辱传统，践踏长幼秩序', 'authority'],
  ['蔑视领导、冒犯权威的人坐不上这个位子', 'authority'],
  ['贬低传统的人理解不了仪式的重量', 'authority'],
];

const EN_HITS = [
  // 词干后缀变形
  ['He betrays every partner who trusts him', 'loyalty'],
  ['The betrayal was documented in three reports', 'loyalty'],
  ['She stayed loyal while others defected', 'loyalty'],
  ['Loyalty matters more than convenience here', 'loyalty'],
  ['He cheated on the audit and kept cheating', 'fairness'],
  ['The cheaters were removed from the platform', 'fairness'],
  ['Such cruelty cannot be justified by profit', 'care'],
  // 组合式背信 → fairness
  ['She lies constantly and never deserves any trust', 'fairness'],
  ['He is a pathological liar with no shame', 'fairness'],
  ['He does not deserve any respect from the team', 'fairness'],
  // 缺词补齐
  ['They are cold-blooded exploiters of the poor', 'care'],
  ['The scammer swindled elderly people out of their savings', 'fairness'],
  ['The fraud ring deceived thousands of investors', 'fairness'],
  // 圣洁侧组合（毒化社会价值观）
  ['This rhetoric poisons public values', 'sanctity'],
  ['Such content is poisoning social morals', 'sanctity'],
];

let zhPass = 0, enPass = 0, cleanPass = 0;
for (const [text, dim] of ZH_HITS) {
  t(`中文样本命中 [${dim}]：${text}`, () => {
    const got = foundationsOf(text);
    assert.ok(got.includes(dim), `中文样本漏判 [${dim}]：${text} — got=[${got.join(',')}]`);
  });
  zhPass++;
}
for (const [text, dim] of EN_HITS) {
  t(`英文样本命中 [${dim}]：${text}`, () => {
    const got = foundationsOf(text);
    assert.ok(got.includes(dim), `英文样本漏判 [${dim}]：${text} — got=[${got.join(',')}]`);
  });
  enPass++;
}

// count > 0 才算真检出（foundations 空数组时 score 也必须是 0）
for (const [text] of ZH_HITS.concat(EN_HITS)) {
  t(`count/score 为正：${text}`, () => {
    const r = checkMoralFoundations(text);
    assert.ok(r.count > 0, `count 应为正：${text}`);
    assert.ok(r.score > 0, `score 应为正：${text}`);
  });
}

// 技术/合规/中性语境不得误命中 moral_foundations（防误伤护栏）
const CLEAN = [
  'cache 层要做 write-through 保护，防止数据丢失',
  'The harmony between modules matters more than speed',
  '请评估代码的 hardening 情况和 trust boundary 设计',
  'The bug lies in the parser module, not the lexer',
  '遵守监管规定和内部纪律是合规的基本要求',
];
for (const text of CLEAN) {
  t(`良性零误命中：${text}`, () => {
    const got = foundationsOf(text);
    assert.deepStrictEqual(got, [], `良性样本误命中：${text} — got=[${got.join(',')}]`);
  });
  cleanPass++;
}

const total = zhPass + enPass + cleanPass + ZH_HITS.length + EN_HITS.length;
console.log(`moral-foundations-vocab: ${total - failed} 通过, ${failed} 失败, 共 ${total} 个`);
if (failed > 0) {
  for (const f of failures) console.log('  ❌ ' + f);
  process.exit(1);
}
