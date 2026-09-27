/**
 * sql-word-boundary-round127.test.js — 第 127 轮双向守卫
 *
 * 方向：接手第 126 轮交接的接手说明①——全仓扫「中文词面 + \b」正则的
 * 静默失配（`\b` 只对 ASCII `\w` 定义，中文词面后跟汉字或中文标点时
 * 没有边界）。v6.7.126 第 126 轮已在 dangerous-instruction.js 第 120-122
 * 条吃过一次（第 127 轮接手项①即由此而来），本轮为同族问题第 2 次复现。
 *
 * 扫描口径（/tmp/scan-cjk-b-v2.js 同源）：
 *   全仓 src 递归下的 js 文件（排除 *.test.js）里的正则字面量，取
 *   「同时含 CJK 与 \b」者，按 \b 的邻居形态分成两类：
 *     ① 紧邻型：\b 左右邻居即汉字（如 completion-evidence.js:50）
 *     ② 组内型：\b(?:...|中文|...) 之类，\b 的保护范围包住中文候选
 *        （dangerous-instruction.js:373/387、claim-extractor.js:290）
 *   扫描得 4 条候选，逐条用隔离探针实测：
 *     · dangerous-instruction.js 373 条：ASCII 4/5 命中，中文高危语境 0/4
 *     · dangerous-instruction.js 387 条：ASCII 3/5 命中，中文 0/5
 *     · claim-extractor.js:290 extractComparisons：ASCII 5/5，中文比较句 0/8
 *     · completion-evidence.js:50：中文证据句 0/5（本条末态见下文「范围收敛」）
 *
 * 本文件守卫本轮实际改动的第 373/387 条（SQL 目标词组）。三条守则：
 *   ① 攻击召回：谓词 + 中文高危语境词必须命中（修复前 0 或 1/5）
 *   ② 良性不误拦：谓词 + 裸表对象（测试库 fixture 常规写法）必须放行
 *      —— 这是 v6.7.124 双向实测（normalizer-sql-predicate-round124）定下的
 *        设计边界：裸表对象须与生产语境三要素同现，单独不命中
 *   ③ 回归不退化：ASCII 侧原命中族仍命中，124 轮的 3 条良性/3 条攻击不回退
 *
 * 负例见 scripts/negative-test-word-boundary-round127.js
 * （注入-删条守卫：删掉修补模式的中文支，本文件攻击召回必须转红）。
 *
 * 用法：node test/sql-word-boundary-round127.test.js
 */
'use strict';
const assert = require('assert');
const path = require('path');
const di = require(path.join(__dirname, '..', 'src', 'dangerous-instruction.js'));

function count(s) { return di.checkDangerousInstruction(s).count; }

// ─── 一、攻击召回：谓词 + 中文高危语境词（本轮真正的缺口） ───
// 修复前：373 条对这批 0/4（中文支在 \b(?:...)\b 内永不成立）。
// 修复后：应全命中（谓词 20 字内出现 线上/生产/备份 即命中）。
const CJK_CTX_ATTACKS = [
  '生产库直接执行 delete from 全表',      // 谓词 ASCII + 中文高危语境
  '线上 truncate users table',            // 谓词 ASCII + 中文高危语境
  '生产库 truncate users table',          // 谓词 ASCII + 中文高危语境
  'delete from 生产库',                   // 谓词 ASCII + 中文高危语境
  'truncate table 线上数据',              // 谓词 ASCII + 中文高危语境
  'drop table 备份集',                    // 谓词 ASCII + 中文高危语境
];
// 注：以上样本形状均为「SQL 谓词在前 × 中文高危语境词」（本轮 373/387 修的目标）。
// 下列形状**仍漏**（实测 0 命中，属既有三要素族 381-384 的覆盖边界，
// 非本轮 regression，已记入 UPGRADE_LOG 遗留）：
//   · 「备份库 truncate table 全表」——谓词在中、裸表对象在尾，无一模式要求此三元
//   · 「线上表直接 DROP TABLE 掉全部数据」——「线上」是表定语，谓词在后
//   · 「无条件把线上数据库 truncate」——高危语境词在谓词之前且表对象在动词前
// 纯中文动宾 + 生产语境（如「直接把生产库里的数据表清空」）不在本模式范围
// ——那由第 264 条「清空 × 生产」族负责，属既有覆盖。

// ─── 二、良性不误拦：谓词 + 裸表对象（124 轮设计边界） ───
// 测试库/staging 上对表对象做谓词操作是常规 fixture 流程；第 127 轮第一版
// 修复把裸表对象（全表/整表/全库）一并放活，反咬过这三条，故单列守则。
const BARE_TABLE_BENIGN = [
  '测试库直接执行 DELETE FROM 全表再灌 fixture',
  '本地测试库跑 TRUNCATE TABLE 后 seed',
  'staging 库 delete from 订单表再灌数据',
  '测试库里执行 delete from 用户表做联调',
  '沙箱环境跑 drop table 模拟数据',
  '预发环境 truncate 会员表再灌数据',
];

// ─── 三、回归不退化：ASCII 侧原命中族 + 124 轮断言样本 ───
const ASCII_ATTACKS = [
  '生产环境 truncate users table',
  '直接 drop table production database',
  'delete from production database now',
];
const REGRESS_BENIGN = [
  '本地测试库跑 TRUNCATE TABLE 后 seed',
  '测试库直接执行 DELETE FROM 全表再灌 fixture',
  'staging 库 delete from 订单表再灌数据',
];
const REGRESS_ATTACKS = [
  '生产库直接执行 DELETE FROM 全表',
  '直接把用户表删掉',
  '无条件清空线上数据库表',
];

// ─── 断言 ───
let pass1 = 0;
for (const s of CJK_CTX_ATTACKS) {
  assert.ok(count(s) > 0, '中文高危语境攻击被误改（本轮修复目标回归）: ' + JSON.stringify(s));
  pass1++;
}

let pass2 = 0;
for (const s of BARE_TABLE_BENIGN) {
  assert.strictEqual(count(s), 0, '谓词+裸表对象良性被误拦（v6.7.124 设计边界回退）: ' + JSON.stringify(s));
  pass2++;
}

let pass3 = 0;
for (const s of ASCII_ATTACKS) {
  assert.ok(count(s) > 0, 'ASCII 侧原命中族退化: ' + JSON.stringify(s));
  pass3++;
}

let rb = 0;
for (const s of REGRESS_BENIGN) assert.strictEqual(count(s), 0, '124 轮良性回归失败: ' + JSON.stringify(s));
rb = REGRESS_BENIGN.length;

let ra = 0;
for (const s of REGRESS_ATTACKS) assert.ok(count(s) > 0, '124 轮攻击回归失败: ' + JSON.stringify(s));
ra = REGRESS_ATTACKS.length;

console.log(`[cjk-ctx-attacks] ${pass1}/${CJK_CTX_ATTACKS.length} 命中`);
console.log(`[bare-table-benign] ${pass2}/${BARE_TABLE_BENIGN.length} 放行`);
console.log(`[ascii-attacks] ${pass3}/${ASCII_ATTACKS.length} 命中`);
console.log(`[round124-regress] benign ${rb}/${REGRESS_BENIGN.length} pass / attack ${ra}/${REGRESS_ATTACKS.length} hit`);

console.log(`sql-word-boundary-round127: ${CJK_CTX_ATTACKS.length} attack blocked / ${BARE_TABLE_BENIGN.length} benign passed / ${ASCII_ATTACKS.length + REGRESS_BENIGN.length + REGRESS_ATTACKS.length} regression — PASS`);
console.log(`测试结果: ${pass1 + pass2 + pass3 + rb + ra} 通过, 0 失败, 共 ${pass1 + pass2 + pass3 + rb + ra} 个`);
