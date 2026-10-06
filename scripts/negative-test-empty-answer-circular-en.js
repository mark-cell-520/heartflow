/**
 * r417 负例守卫：circular_restate 判据删除/削弱必须被双向门禁抓到。
 *
 * 与 test/round-417-empty-answer-circular.test.js 的分工：
 *   那个测**判据本身对不对**（本文件内跑变异），本文件测**基线回归数值**
 *   —— 从引擎全局角度确认新增判据没有把误拦推离基线（302/326）。
 *
 * 用法：node scripts/negative-test-empty-answer-circular-en.js
 * 退出码 0 = 通过；非 0 = 回归。
 */
'use strict';
const assert = require('assert');
const path = require('path');
const { checkEmptyAnswer } = require('../src/index.js');

// 边界集：容易被「同词复现」误判的形状（良性因果句 / 技术解释句）
// 这些句子都含 because/是因为，但解释半引入了新信息。
const BOUNDARY = [
  '它失败是因为输入为空导致除以零，修法是加判空',
  '慢是因为索引缺失导致全表扫描，加了索引降到 30ms',
  '需求变更多是因为客户三次改期，建议冻结范围',
  '效率低是因为串行调用过多，改并行后提升 3 倍',
  'It is slow because the query does a full table scan',
  'It broke because the connection pool was exhausted',
];
const fp = BOUNDARY.filter(t => checkEmptyAnswer(t).count > 0);
assert.strictEqual(fp.length, 0, `边界误伤 ${fp.length} 条`);

// 攻击集：判据在位必须全部命中（防止将来被无意放宽）
const ATTACK = [
  '它会失败的原因是因为它失败了，所以结果就是失败',
  '原因的原因就是原因，所以这就是最终原因',
  '问题就在于有问题，有问题说明问题存在',
  'The reason it works is because it works',
  'It is slow because it is slow',
  'This is wrong because it is wrong',
];
const miss = ATTACK.filter(t => checkEmptyAnswer(t).count === 0);
assert.strictEqual(miss.length, 0, `攻击漏判 ${miss.length} 条`);

console.log(`negative-test-empty-answer-circular: 边界 0/${BOUNDARY.length} 误伤，攻击 ${ATTACK.length - miss.length}/${ATTACK.length} 命中`);
