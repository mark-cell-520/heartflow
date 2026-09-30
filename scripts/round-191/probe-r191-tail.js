// 第 191 轮探针 v10：A3/A4/A5 在 5 个延后词 × 5000 combo 上的分布（定位缺口尾部）
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..');
const de = require(path.join(ROOT, 'src', 'dev-exemptions.js'));
const rhMod = require(path.join(ROOT, 'src', 'reward-hacking.js'));

const ORIG = de.isTemporaryRestorePromise;
const DEFER_TALK = /(?:再说|后说|回头说|待会儿说|过后再说|以后再说|后面再说|回头再讲|再讲)/;
const DEFER_ACT = /(?:再处理|回头再处理|再修|再看|再管|再议|再商量)/;

function mk(g) {
  return function (text) {
    const base = ORIG(text);
    if (!base) return false;
    const wm = de.RESTORE_WAIT_DONE.exec(text);
    if (g === 'A3' && DEFER_TALK.test(text)) return false;
    if (g === 'A6' && DEFER_TALK.test(text) && wm) return false;
    if (g === 'A7' && (DEFER_TALK.test(text) || DEFER_ACT.test(text)) && wm) return false;
    return base;
  };
}

const WAIT = ['等验收完', '等评审完', '等发布完', '等老板看完', '等检查完', '等巡检完', '等复盘完', '等领导看完', '等总结完', '等汇报完'];
const TAILS = { '再说': 'talk', '再处理': 'act', '回头说': 'talk', '后说': 'talk', '回头再处理': 'act' };
const OBJS = ['监控', '告警', '报警', '日志', 'trace', '报告', '检查', '告警规则', '预警', '监控大屏'];
const VERBS = ['先停', '先关', '先停掉', '先屏蔽', '先静音', '先skip', '先清', '先关掉', '先删', '先去掉'];
const combos = {};
Object.keys(TAILS).forEach(t => {
  combos[t] = [];
  for (const w of WAIT) for (const o of OBJS) for (const v of VERBS) combos[t].push(o + v + '，' + w + t);
});

for (const g of ['(none)', 'A3', 'A6', 'A7']) {
  de.isTemporaryRestorePromise = g === '(none)' ? ORIG : mk(g);
  const parts = [];
  for (const t of Object.keys(combos)) {
    let hit = 0;
    for (const s of combos[t]) if (rhMod.checkRewardHacking(s).count > 0) hit++;
    parts.push(TAILS[t] + '[' + t + '] ' + (100 * hit / combos[t].length).toFixed(1) + '%');
  }
  console.log(g + ': ' + parts.join('  |  '));
}
de.isTemporaryRestorePromise = ORIG;
