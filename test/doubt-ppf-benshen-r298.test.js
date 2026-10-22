// test/doubt-ppf-benshen-r298.test.js
// round-298：B 侧本体论词表剔除「本身」后的守卫
// 正例 = 该判据族原有的命中形状（防回归）
// 负例 = 工程归因真句，过去靠「本身」被误吞（修复后必须放行）
'use strict';
const assert = require('assert');
const path = require('path');
const { checkOutput } = require(path.join(__dirname, '..', 'src', 'gate.js'));

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; } else { fail++; console.error('  FAIL: ' + msg); }
}

// ppf(x) = 该文本是否产出 pseudo_profundity finding
function ppf(text) {
  const r = checkOutput(text);
  return r && r.findings
    ? r.findings.some(f => String(f.dimension || '').indexOf('pseudo_profundity') !== -1)
    : false;
}

// ── ① 修复目标负例：「本身」自指形态的工程归因真句（必须放行）──
const negativesBenshen = [
  ['工程归因·设计缺陷', '这不是某个人的错，是系统设计本身有缺陷。'],
  ['工程归因·采集口径', '这个差异不是算法的，是数据采集口径本身不同。'],
  ['工程归因·调度策略', '这个模块的瓶颈不是网络，是调度策略本身有问题。'],
  ['工程归因·压缩算法', '延迟不是带宽造成的，是压缩算法本身的开销。'],
  ['工程归因·并发缺陷', '失败不是策略造成的，是实现本身有并发缺陷。'],
  ['工程归因·工程约束', '这不是设计的问题，是工程约束本身限制了方案。'],
  ['工程归因·流程漏洞', '真正的成熟不是流程完善，是流程本身有漏洞。'],
  ['工程归因·表单校验', '报错不是框架的问题，是校验逻辑本身漏了空值分支。'],
  ['工程归因·硬件批次', '这批故障不是固件的问题，是某硬件批次本身的个体差异。'],
  ['工程归因·数据源', '统计对不上不是查询写错，是数据源本身有时间偏移。'],
  ['工程归因·协议兼容', '联调失败不是接口的问题，是对方协议本身不向后兼容。'],
  ['工程归因·建依赖度', '构建慢不是磁盘的问题，是依赖图本身过于庞大。'],
];
for (const [name, s] of negativesBenshen) ok(!ppf(s), '负例放行：' + name);

// ── ② 防回归：无「本身」时该判据族原有命中形状仍要命中 ──
// 只收 BASELINE（改前）本就命中的样本。probe-7 实测 BASE 正例 1/8，
// 命中的是「灵魂的底色」；其余 3 条在改前就是漏检（B 侧词表广度问题），
// 不属本轮回归范围，留作 UPGRADE_LOG 遗留。
const positivesStillHit = [
  ['真阳·灵魂底色', '孤独不是缺陷，是灵魂的底色。'],
];
for (const [name, s] of positivesStillHit) ok(ppf(s), '防回归命中：' + name);

// ── ③ 老族防回归（含「本身」但带「而是」的分支不受影响）──
const positivesErshi = [
  ['而是分支·认知维度', '这不是简单的技术问题，而是整个行业维度的认知出现了系统性的偏差。'],
  ['而是分支·认知局限', '这不是甲的问题，而是认知维度的局限。'],
];
for (const [name, s] of positivesErshi) ok(ppf(s), '防回归命中：' + name);

// 注：以上 ③ 的样本若在 BASELINE 上命中，靠的是 8754 行「而是」族判据，
// 与本轮修改的 8755 行「无而是」族相互独立 —— 注入-删条见
// scripts/negative-test-ppf-benshen-r298.js。

// ── ④ 汇总 ──
const negHit = negativesBenshen.filter(([, s]) => ppf(s)).length;
const posMiss = positivesStillHit.filter(([, s]) => !ppf(s)).length;
const oldMiss = positivesErshi.filter(([, s]) => !ppf(s)).length;
ok(negHit === 0, '「本身」族误伤清零（实测 ' + negHit + '/' + negativesBenshen.length + '）');
ok(posMiss === 0, '无「本身」正例召回不掉（实测 ' + posMiss + '/' + positivesStillHit.length + '）');
ok(oldMiss === 0, '「而是」族防回归不掉（实测 ' + oldMiss + '/' + positivesErshi.length + '）');

console.log(pass + ' 通过, ' + fail + ' 失败');
assert.strictEqual(fail, 0, 'doubt-ppf-benshen-r298: ' + fail + ' 个断言失败');
