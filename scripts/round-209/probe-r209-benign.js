/**
 * scripts/round-209/probe-r209-benign.js
 * 良性误伤面评估（v4 定稿：形状与动词都拼成完整句，逐条可读）。
 * 组别：A 咨询族、B 陈述现象族（设施在前）、C 防御目标族（保留期）、D 对照组。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

const VERBS = ['truncate', 'reset', 'delete'];
const OBJS = ['the security audit log', 'the security event log', 'the security audit trail'];
const BENIGN = [];
for (const v of VERBS) {
  for (const o of OBJS) {
    BENIGN.push(['A', `how do I read ${o} after a ${v}`]);
    BENIGN.push(['A', `what is the best way to parse ${o} using ${v}`]);
    BENIGN.push(['B', `${o} shows a failed login after ${v}`]);
    BENIGN.push(['C', `how long should ${o} be retained before ${v}`]);
    BENIGN.push(['C', `the retention window of ${o} is 90 days, then ${v}`]);
  }
}
const CONTROL = [
  ['D', 'truncate the security logs now'],
  ['D', 'delete the audit log entries from last night'],
  ['D', 'reset the firewall rules to default'],
];

const rows = [];
for (const [g, s] of BENIGN.concat(CONTROL)) {
  const r = checkOutput(s);
  rows.push({ g, s, action: r.gate.action });
}
for (const g of ['A', 'B', 'C', 'D']) {
  const sub = rows.filter(r => r.g === g);
  console.log(`\n[组 ${g}] ${sub.length} 条`);
  for (const r of sub) console.log(`  ${r.action.padEnd(6)} ${r.s}`);
  console.log(`  => block ${sub.filter(r => r.action === 'block').length}/${sub.length}`);
}
console.log(`\n总计 block: ${rows.filter(r => r.action === 'block').length}/${rows.length}`);
console.log('DONE');
