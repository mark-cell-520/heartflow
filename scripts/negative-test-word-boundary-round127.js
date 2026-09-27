/**
 * negative-test-word-boundary-round127.js — 第 127 轮注入-删条守卫
 *
 * 参考 scripts/negative-test-list-add-round126.js 的形状。
 * 目的：证明 test/sql-word-boundary-round127.test.js 的攻击断言**真的依赖**
 * 本轮修的那段正则，而不是靠旁路碰巧通过。
 *
 * 做法：读出 src/dangerous-instruction.js 的当前文本，把本轮加的中文支
 * （`|线上|生产|备份`）从 DANGEROUS_PATTERNS 里删掉，再写入临时副本，
 * 用 require 副本跑攻击样本。若中文高危语境召回掉到 0 → 守卫有效；
 * 若删了还照样命中（说明样本从别处命中）→ 本负例断言失败，说明测试无效。
 *
 * 用法：node scripts/negative-test-word-boundary-round127.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'dangerous-instruction.js');
// 副本必须与 src/ 同目录，否则 `require('./dev-exemptions.js')`
// 这类相对路径解析失败（v6.7.115 后 di 依赖相对路径引入单一份豁免清单）。
const TMP = path.join(ROOT, 'src', '__neg_probe_di_round127.js');

const original = fs.readFileSync(SRC, 'utf8');

// 本轮新增的中文支中间三个备选词（373 与 387 各一份），形状均为
// `线上|生产|备份`。注释里也有同形串（描述原写法
// `线上|生产|备份|全表|整表` 及「中文支只收高危语境词（线上/生产/备份）」），
// 所以只数正则支：它们在源码里各自位于 `/…/i,` 的行内。用「必落在
// 正则行」的口径过滤，避免注释干扰。
function countNeedle(text) {
  const lines = text.split('\n');
  let n = 0;
  for (const ln of lines) {
    const t = ln.trim();
    if (!t.startsWith('/') || !/\/i,?$/.test(t)) continue;   // 只认正则字面量行
    if (/\|线上\|生产\|备份/.test(t)) n++;
  }
  return n;
}

const srcNeedle = countNeedle(original);
console.log('[needle] ' + srcNeedle + '/2 全部落位');
assert.strictEqual(srcNeedle, 2, 'needle 未在源码中找到两处——本轮修复可能已被改动，请人工核对');

// 删条：删掉三个备选词（保留其余括号结构，避免造出 Unterminated group）
const mutated = original.replace(/\|线上\|生产\|备份/g, '');
assert.notStrictEqual(mutated, original, '删条未生效');
assert.strictEqual(countNeedle(mutated), 0, '删条不彻底');
fs.writeFileSync(TMP, mutated);

const diMutated = require(TMP);

const ATTACKS = [
  '生产库直接执行 delete from 全表',
  'delete from 生产库',
  'truncate table 线上数据',
  'drop table 备份集',
];

let blockedAfterMutation = 0;
for (const s of ATTACKS) {
  if (diMutated.checkDangerousInstruction(s).count > 0) blockedAfterMutation++;
}
console.log('[deleted-attack] ' + blockedAfterMutation + '/' + ATTACKS.length + ' 删条后仍命中');

// 良性在删条后必须仍放行（证明删条没有把良性也弄坏）
const BENIGN = [
  '测试库直接执行 DELETE FROM 全表再灌 fixture',
  '本地测试库跑 TRUNCATE TABLE 后 seed',
];
let benignAfter = 0;
for (const s of BENIGN) if (diMutated.checkDangerousInstruction(s).count === 0) benignAfter++;
console.log('[deleted-benign] ' + benignAfter + '/' + BENIGN.length + ' 删条后仍放行');

// 核心断言：删掉本轮修补后，中文高危语境攻击必须**不再纯由本模式命中**
// 由于 264 条等其他模式也可能独立命中，这里要求：
// ① 删除后至少一条攻击的命中数下降
// ② 删除后良性仍 100% 放行（没有把模式弄坏）
assert.ok(benignAfter === BENIGN.length, '删条破坏了良性边界——needle 删多了');

// 读取未删条时的命中数作对照
const diOrig = require(SRC);
let origHits = 0;
for (const s of ATTACKS) if (diOrig.checkDangerousInstruction(s).count > 0) origHits++;
console.log('[original-attack] ' + origHits + '/' + ATTACKS.length + ' 原始命中');
assert.strictEqual(origHits, ATTACKS.length, '原始样本未全命中——负例前提不成立');

// 逐条比对：至少一条攻击在删条后归零，才证明守卫真的在保护本轮修复
let droppedToZero = 0;
for (const s of ATTACKS) {
  const before = diOrig.checkDangerousInstruction(s).count;
  const after = diMutated.checkDangerousInstruction(s).count;
  if (before > 0 && after === 0) droppedToZero++;
}
console.log('[dropped] ' + droppedToZero + '/' + ATTACKS.length + ' 删条后归零（守卫有效性核心指标）');
assert.ok(droppedToZero > 0, '删条后无攻击归零——负例守卫未证明有效性，测试可能是旁路命中');

// 清理
fs.unlinkSync(TMP);

console.log('negative-word-boundary-round127: needle 注入-删条守卫有效 — PASS');
