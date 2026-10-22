'use strict';
// [r564] 假设验证：EN 三组漏了 .join('|')，数组默认用逗号 join，
// 于是正则里出现字面逗号（for\s+you\b,\b(?:i|we)），跨支永不匹配。
// 只验证假设，不改文件。
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const m = require(path.join(ROOT, 'src', 'favor-ledger.js'));
const I = m.__internals();

const hasComma = (src) => src.includes(',') ? '眉含逗号' : '无逗号';
console.log('LEDGER_ZH', hasComma(I.LEDGER_ZH.source));
console.log('LEDGER_EN', hasComma(I.LEDGER_EN.source), '逗号出现次数:', (I.LEDGER_EN.source.match(/,/g) || []).length);
console.log('CLAIM_ZH  ', hasComma(I.CLAIM_ZH.source));
console.log('CLAIM_EN  ', hasComma(I.CLAIM_EN.source), '逗号出现次数:', (I.CLAIM_EN.source.match(/,/g) || []).length);
console.log('GUARD_ZH  ', hasComma(I.GUARD_ZH.source));
console.log('GUARD_EN  ', hasComma(I.GUARD_EN.source), '逗号出现次数:', (I.GUARD_EN.source.match(/,/g) || []).length);

// 修法验证：把 source 里的逗号换回 |，看是否恢复匹配
const fixedEN = I.LEDGER_EN.source.replace(/,/g, '|');
const fixedClaimEN = I.CLAIM_EN.source.replace(/,/g, '|');
const L = new RegExp(fixedEN, 'i');
const C = new RegExp(fixedClaimEN, 'i');
const probes = [
  'I helped you a lot back then, you cannot refuse me this.',
  'Without me you would be nothing, so do as I say.',
  'I covered for you for years, this is a small ask.',
  'I pulled strings for your promotion, now it is my turn.',
  'After all I have done for you, you owe me this.',
  'Considering everything I did for you, the least you can do is obey.',
];
let n = 0;
for (const p of probes) if (L.test(p)) n++;
console.log('替换逗号为 | 后 LEDGER_EN 命中:', n, '/6');
let n2 = 0;
for (const p of probes) if (C.test(p)) n2++;
console.log('替换逗号为 | 后 CLAIM_EN 命中:', n2, '/6');
