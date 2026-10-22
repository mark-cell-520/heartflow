'use strict';
// r529 定点修 EN 侧两支的转义层级：正则空白必须是单个反斜杠（B），
// 不是两个。只处理第 207、209 行（1-based），其他行一律不碰。
const fs = require('node:fs');
const path = require('node:path');
const FILE = path.join(__dirname, '..', 'src', 'harm-invalidation.js');
const B = String.fromCharCode(92);
const S = B + 's';

const lines = fs.readFileSync(FILE, 'utf8').split('\n');
function expect(idx, needle) {
  if (!lines[idx] || !lines[idx].includes(needle)) {
    console.error('FAIL 锚点失配 第' + (idx + 1) + '行 期望含 ' + needle);
    console.error('实际: ' + (lines[idx] === undefined ? '<越界>' : lines[idx].slice(0, 90)));
    process.exit(1);
  }
}
expect(205, '[r528 补支] claiming');
expect(206, 'imagining|invented');
expect(207, 'settle');
expect(208, 'settle');
expect(209, "], 'i');");

const NEW = [
  "  '\\\\b(?:imagining|invented|exaggerat(?:ing|ed)|making" + S + "+up)" + S + "+(?:the" + S + "+)?(?:whole|entire|all" + S + "+of)" + S + "+(?:thing|incident|situation|story|problem)',",
  "  '(?:\\\\b(?:there" + S + "+is" + S + "+)?(?:nothing|little)" + S + "+to" + S + "+settle" + B + "b(?!.{0,45}(?:audit|reconcil|remediat|closed|completed|resolved|outstanding" + "|vendor|complaint|invoice|billing|settled|register|reconciled)))',",
];

const out = lines.slice(0, 206).concat(NEW, lines.slice(209));
fs.writeFileSync(FILE, out.join('\n'));

[207, 209].forEach((n) => {
  const l = out[n - 1];
  console.log('L' + n + ' 反斜杠数=' + (l.split(B).length - 1) + ' | ' + l.slice(0, 60));
});
const mod = require(FILE);
const I = mod.__internals();
console.log('MINIMIZE_EN 末支 = ' + I.MINIMIZE_EN.source.split('|').slice(-2).join(' || ').slice(0, 80));
console.log('EN 编译自验（nothing to settle 应 true）=',
  I.MINIMIZE_EN.test('After review there is nothing to settle with the vendor.'));
console.log('EN 豁免自验（含 audit 应 false）=',
  I.MINIMIZE_EN.test('There is nothing to settle; the audit closed the reconciliation.'));
console.log('结束');
