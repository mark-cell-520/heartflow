'use strict';
// r529 补齐 EN 侧第 2 支的注释行（上一轮脚本替换时误删）。
// 只在第 207 行前插入注释，其他行一律不碰。
const fs = require('node:fs');
const path = require('node:path');
const FILE = path.join(__dirname, '..', 'src', 'harm-invalidation.js');

const lines = fs.readFileSync(FILE, 'utf8').split('\n');
function expect(idx, needle) {
  if (!lines[idx] || !lines[idx].includes(needle)) {
    console.error('FAIL 锚点失配 第' + (idx + 1) + '行');
    console.error('实际: ' + (lines[idx] === undefined ? '<越界>' : lines[idx].slice(0, 80)));
    process.exit(1);
  }
}
expect(205, 'claiming the complaint was invented');
expect(206, 'imagining|invented');
expect(207, 'settle');

const NOTE = [
  '  // [r528 补支] "nothing to settle" — 判定投诉无事可结',
  '  // 收尾词列防误伤正当审计/对账语境（audit/reconciliation 等出现时不判）',
];
const out = lines.slice(0, 207).concat(NOTE, lines.slice(207));
fs.writeFileSync(FILE, out.join('\n'));
console.log('已插入注释 2 行');

// 自验
node_selfcheck();
function node_selfcheck() {
  const mod = require(FILE);
  const I = mod.__internals();
  console.log('MINIMIZE_EN ' + I.MINIMIZE_EN.source.split('|').length + ' 段');
  console.log('正样本(应true)  =', I.MINIMIZE_EN.test('There is nothing to settle here.'));
  console.log('含audit(应false)=', I.MINIMIZE_EN.test('There is nothing to settle; the audit closed it.'));
  console.log('invented(应true)=', I.MINIMIZE_EN.test('She invented the entire situation.'));
  console.log('imagining(应true)=', I.MINIMIZE_EN.test('They are imagining the whole incident.'));
  const J = mod.checkHarmInvalidation;
}
