'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
// r647 定位探针 2：PROMISE_ZH 逐分支拆「你发了誓要照顾我一辈子」
const { __internals } = require(__HF + '/src/commitment-coercion.js');
const I = __internals();
const t = '你发了誓要照顾我一辈子，现在反悔等于欺骗。';
const promiseParts = [
  ['二称+动词', String.raw`(?:你|您|你们|当初的?你|你自己)(?:[^。]{0,4})?(?:亲口|亲口说|当面|亲口答应)?(?:[^。]{0,4})?(?:发|许|立|赌|指天)?(?:答应|承诺|保证|发誓|起誓|应下|应允|允诺|说好|讲好|许下|许愿|担保|保票|拍胸脯|立字据|签约|签字)(?:过|的|了)?`],
  ['名词+完成', String.raw`(?:承诺|诺言|誓言|誓约|保证|保票|话|字据|契约|合同|协议|条款|约定)(?:都|已经|早就|早就说|早已)?(?:[^。]{0,3})?(?:说出|说在|说在前面|出了口|出口|算数|算得了数|签了|立下|许下|白纸黑字)(?:来|的|了)?`],
  ['你说的', String.raw`(?:你|您|你们)(?:自己|当初|先前|以前|过去|当时|一开始)?(?:[^。]{0,2})?(?:说|讲|提)(?:的|过|到)?`],
  ['当初说好', String.raw`(?:当初|一开始|最初|刚开始|开始|从前|此前|当时)(?:[^。]{0,4})?(?:说好|讲好|讲定|说定|约定|答应|应下|说好的)`],
  ['无条件', String.raw`(?:说|讲)(?:[^。]{0,3})?(?:都|全)(?:答应|依|听|算数|照办)`],
];
for (const [name, src] of promiseParts) {
  const re = new RegExp(src);
  console.log(`  PROMISE[${name}]: ${re.test(t)}`);
}
// 关键：文本是「你发了誓」——「发了誓」的「了」在动词中间
const t2 = '你发了誓';
console.log('t2 你发了誓 主支:', new RegExp(promiseParts[0][1]).test(t2));
const t3 = '你发誓要照顾我一辈子';
console.log('t3 你发誓 主支:', new RegExp(promiseParts[0][1]).test(t3));
