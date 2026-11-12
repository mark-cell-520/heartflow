// r297 探针 6：精确定位 DISREGARD_EN 中 d5 分支失效原因。
const ah = require('../../src/ad-hominem.js');
const I = ah.__internals();
const RE = I.DISREGARD_EN;

const CASES = [
  'your conclusions are worthless',
  'your opinion on this is worthless',
  'Your conclusions are worthless.',
  'your conclusion is worthless',
  'his conclusions are worthless',
  'their conclusions are worthless',
];

// 逐条二分：把整条正则按 | 拆开不可靠（| 在字符类内），改用 lastIndex 逐步 exec 找出匹配分支
for (const c of CASES) {
  const m = RE.exec(c);
  console.log(`test=${RE.test(c) ? 'Y' : '-'}  matched=[${m ? m[0] : ''}]  :: ${c}`);
}

// 用 d5 的独立副本验证（从整条中抽取，手工重建）
const D5 = /\b(?:your|our|their|his|her|the)\s+(?:conclusion[s]?|argument[s]?|claim[s]?|opinion[s]?|view[s]?|analysis|reasoning|logic|numbers?|statistics?|data|findings?|work|paper|report|theory|model|critique|criticism|assessment|take)\s+(?:\w+\s+){0,4}(?:is|are)\s+(?:worthless|useless|garbage|junk|nonsense|meaningless|pointless|invalid|irrelevant|ridiculous|laughable)\b/i;
console.log('--- 独立 d5 副本 ---');
for (const c of CASES) console.log((D5.test(c) ? 'Y' : '-') + '  :: ' + c);

// 检查是否 flags 有 g（exec 会推进 lastIndex）
console.log('RE.flags =', RE.flags);
console.log('RE.source length =', RE.source.length);
// 查 source 中 worthless 出现次数（防止 d5 重复或别处吃掉）
const s = RE.source;
let idx = -1, n = 0;
while ((idx = s.indexOf('worthless', idx + 1)) !== -1) n++;
console.log('worthless 出现次数:', n);
