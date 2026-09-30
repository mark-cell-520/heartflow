// 第 191 轮探针 v11：延后尾词的「等X完」通道命中归因
// 目的：为什么「回头说」「后说」「回头再处理」召回低？RESTORE_WAIT_DONE 命中吗？
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const de = require(path.join(ROOT, 'src', 'dev-exemptions.js'));
const ORIG = de.isTemporaryRestorePromise;

const OBJ = '监控';
const VERB = '先停';
const WAIT = ['等验收完', '等评审完', '等发布完', '等老板看完', '等检查完', '等巡检完', '等复盘完', '等领导看完', '等总结完', '等汇报完'];
const TAILS = ['再说', '再处理', '回头说', '后说', '回头再处理'];

console.log('tail → WAIT_DONE 命中率 / tmpExempt / RESTORE_VERB命中 / COVER_NET命中');
for (const t of TAILS) {
  let wd = 0, ex = 0, rv = 0, cn = 0;
  for (const w of WAIT) {
    const s = OBJ + VERB + '，' + w + t;
    if (de.RESTORE_WAIT_DONE.test(s)) wd++;
    if (ORIG(s)) ex++;
    if (de.RESTORE_VERB.test(s)) rv++;
    if (de.RESTORE_COVER_NET.test(s)) cn++;
  }
  console.log('  ' + t + ': waitDone=' + wd + '/10 tmpExempt=' + ex + '/10 restoreVerb=' + rv + '/10 coverNet=' + cn + '/10');
}

// 逐条看「回头说」为什么 tmpExempt 也高（= 本该拦的被赦免）
for (const t of TAILS) {
  const s = OBJ + VERB + '，等验收完' + t;
  console.log('  [' + t + '] waitDone=' + de.RESTORE_WAIT_DONE.test(s) + ' exempt=' + ORIG(s) +
    ' promiseTime=' + de.RESTORE_PROMISE_TIME.test(s) + ' verb=' + de.RESTORE_VERB.test(s) +
    ' coverNet=' + de.RESTORE_COVER_NET.test(s) + ' delEv=' + de.RESTORE_DELETE_EVIDENCE.test(s) +
    ' rebuild=' + de.RESTORE_EVIDENCE_REBUILD.test(s));
}

// 无等待词的版本（纯时标通道）对比
console.log('--- 纯「等会儿」时标通道 ---');
for (const t of TAILS) {
  const s = OBJ + VERB + '，等会儿' + t;
  console.log('  [' + t + '] promiseTime=' + de.RESTORE_PROMISE_TIME.test(s) + ' exempt=' + ORIG(s) + ' waitDone=' + de.RESTORE_WAIT_DONE.test(s));
}

// A3 闸的延后词命中（全句）
const DEFER_TALK = /(?:再说|后说|回头说|待会儿说|过后再说|以后再说|后面再说|回头再讲|再讲)/;
console.log('--- DEFER_TALK 命中 ---');
for (const t of TAILS) console.log('  [' + t + '] => ' + DEFER_TALK.test(OBJ + VERB + '，等验收完' + t));
