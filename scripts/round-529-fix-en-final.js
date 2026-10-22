'use strict';
// r529 最终修正：EN 侧两支的正则反斜杠必须写成双份（JS 字符串字面量）。
// 根因：源码里写单反斜杠 \s 时，JS 字符串字面量把 \s 当无效转义，反斜杠被
// 吃掉，编译出的正则匹配字母 s 而非空白——这正是 r527/r528 连续两轮的死因。
// 本脚本用运行期拼接生成正确的双反斜杠形态，源码中不出现裸反斜杠。
// 只重写第 207、210 两行，其他行一律不碰。
const fs = require('node:fs');
const path = require('node:path');
const FILE = path.join(__dirname, '..', 'src', 'harm-invalidation.js');
const B = String.fromCharCode(92);
const SB = B + B; // 源码层的双反斜杠

const lines = fs.readFileSync(FILE, 'utf8').split('\n');
function expect(idx, needle) {
  if (!lines[idx] || !lines[idx].includes(needle)) {
    console.error('FAIL 锚点失配 第' + (idx + 1) + '行：' + needle);
    console.error('实际: ' + (lines[idx] === undefined ? '<越界>' : lines[idx].slice(0, 80)));
    process.exit(1);
  }
}
expect(205, 'claiming the complaint was invented');
expect(206, 'imagining|invented');
expect(209, '(?:' + B + B + 'b(?:there');

const NEW = [
  "  '" + SB + "b(?:imagining|invented|exaggerat(?:ing|ed)|making" + SB + "s+up)" + SB + "s+" +
    "(?:the" + SB + "s+)?(?:whole|entire|all" + SB + "s+of)" + SB + "s+" +
    "(?:thing|incident|situation|story|problem)',",
  "  '(?:" + SB + "b(?:there" + SB + "s+is" + SB + "s+)?(?:nothing|little)" + SB + "s+to" + SB + "s+" +
    "settle" + SB + "b(?!.{0,45}(?:audit|reconcil|remediat|closed|completed|resolved" +
    "|outstanding|vendor|complaint|invoice|billing|settled|register|reconciled)))',",
];

const out = lines.slice(0, 206).concat(NEW, lines.slice(208));
fs.writeFileSync(FILE, out.join('\n'));
console.log('已重写两行');

// 行为自验
const mod = require(FILE);
const I = mod.__internals();
const t = (s) => I.MINIMIZE_EN.test(s);
console.log('imagining(应true) =', t('They are imagining the whole incident.'));
console.log('invented(应true)  =', t('She invented the entire situation.'));
console.log('settle(应true)    =', t('There is nothing to settle here.'));
console.log('settle+audit(应false)=', t('There is nothing to settle; the audit closed it.'));
console.log('exaggerated(应true)=', t('He exaggerated the whole problem.'));
console.log('结束');
