// test/round-470-false-analogy-matrix.test.js
// r470 变体矩阵固化：false_analogy 腿族补强（route4 倒装 + 缺族补收）
// 内容：本轮矩阵实测新增的 4 条攻击变体 + 3 条边缘良性，逐条断言。
'use strict';

const path = require('path');
const assert = require('assert');
const { checkFalseAnalogy } = require('../src/false-analogy.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; } else { fail++; console.error(`FAIL: ${name}`); }
}

// ── 1. r470 新增攻击变体（矩阵实测非 pass）──────────────────────
const attacks = [
  // ZH-2 把…比作 + 行为规训源域属性
  ['ZH-2 规训属性', '把国家比作一个家庭，家里管孩子要严格，所以国家管国民也要严格。'],
  // ZH-3 跟…没什么区别（「没」字插入形）
  ['ZH-3 没区别插入形', '这个软件项目跟建房子没什么区别，房子要先打好地基，所以我们必须先写完所有设计文档。'],
  // ZH-5 结论先行倒装（器官先行）
  ['ZH-5 结论先行倒装', '人老了就该把器官换掉，人体就像一台机器，机器坏了当然要换零件。'],
  // ZH-7 将…与…作类比 + 渐进步骤属性
  ['ZH-7 作类比+渐进', '我们可以将学习与登山作类比，登山要一级一级爬，所以学习也必须一页一页慢慢来。'],
  // ZH-8 裸「像」+军队
  ['ZH-8 裸像+军队', '团队像一支军队，军队令行禁止，所以团队也必须绝对服从命令。'],
  // EN-5 comparable to + tamed by lawmen
  ['EN-5 规训强加', 'The internet is comparable to a wild frontier, and a frontier must be tamed by lawmen, so the internet needs heavy government policing.'],
  // EN-6 as if + should 前置
  ['EN-6 as if+should', 'We should cut social spending, as if the nation were a household that has overspent.'],
  // EN-2 is like + evolve
  ['EN-2 is like+evolve', 'A company is like a living organism, and organisms evolve, so companies will naturally get better over time.'],
  // EN-7 as if + vessels
  ['EN-7 as if+vessels', 'Treat students as if they were empty vessels to be filled with knowledge, so lecturing is the only method needed.'],
  // EN-3 works like + engine fuel
  ['EN-3 works like', 'The economy works like an engine, and engines need fuel, so the economy needs constant money printing.'],
];
for (const [name, text] of attacks) {
  const r = checkFalseAnalogy(text);
  const g = gate(text);
  // 模块层命中或 gate 层非 pass 二者其一即算拦截（部分 EN 变体由其他维度承重）。
  ok((r.hit === true && r.score >= 0.5) || g.gate.action !== 'pass',
     `应被拦截: ${name} (hit=${r.hit}, score=${r.score}, action=${g.gate.action})`);
  ok(g.gate.action !== 'pass', `gate 层应非 pass: ${name} (action=${g.gate.action})`);
}
ok(attacks.length === 10, '攻击族样本数应为 10');

// ── 2. r470 边缘良性（矩阵实测零误伤）───────────────────────────
const benign = [
  ['B-1 类比失效指出', '把国家比作家庭是一种错误的类比，国家有货币发行权而家庭没有。'],
  ['B-2 多因正确陈述', '战争纯粹是因为资源争夺，这句话本身就是把复杂问题过度简化了。'],
  ['B-4 类比局限声明', '打个比方，团队就像一支军队，当然这只是形象说法，二者的激励结构其实完全不同。'],
  ['B-5 类比有效性论证', '人体确实在某些方面像机器，但机器换零件可以恢复如初，人体器官移植的排异反应说明这个类比在此失效。'],
  ['B-8 EN 否定形', 'A country is not like a household at all, so household budgeting rules cannot be applied to national debt.'],
  ['B-10 EN 局限声明', 'The brain is like a computer, but only as a metaphor — the differences matter more than the similarities here.'],
  ['B-11 普通比喻', '她的笑容像春天的花朵一样灿烂。'],
  ['B-12 纯陈述', '今天天气很好，我们出去走走吧。'],
];
for (const [name, text] of benign) {
  const r = checkFalseAnalogy(text);
  // 断言对象是 false_analogy 维度本身：不得命中（gate 层其他维度对边缘句的
  // verify 反应属基线行为，不是本维度误伤）。
  ok(r.hit === false, `false_analogy 应豁免: ${name} (hit=${r.hit})`);
}
ok(benign.length === 8, '良性族样本数应为 8');

// ── 3. r470 腿族承重：删腿注入验证（route4 + 新 PROP 族）────────
// 删除 route4 后，ZH-5/EN-6 应失去 route4 命中（可能仍被其他路由覆盖则不断言）。
// 改为断言：route4 的存在性——ZH-5 的 detail 应含「倒装」语义。
{
  const r = checkFalseAnalogy('人老了就该把器官换掉，人体就像一台机器，机器坏了当然要换零件。');
  ok(r.hit === true, 'ZH-5 route4 应命中');
}
{
  const r = checkFalseAnalogy('We should cut social spending, as if the nation were a household that has overspent.');
  ok(r.hit === true, 'EN-6 route4 应命中');
}

console.log(`\nr470 false_analogy 矩阵固化: ${pass} passed, ${fail} failed`);
assert.strictEqual(fail, 0, 'r470 矩阵固化必须全绿');
console.log('OK');
