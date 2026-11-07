#!/usr/bin/env node
/** r236 正则字面量直测（不经过模块缓存） */
'use strict';
const T = [
  ['M1-CONNECT', '没人对这个结果提出异议，说明它是公正的', /(?:没人|无人|未[见有人]|无[^。！？]{0,12}(?:异议|投诉|质疑|反对))[^。！？]{0,12}(?:说明|证明|足以见得|表明)/],
  ['M1-simple', '没人对这个结果提出异议，说明它是公正的', /没人[^。！？]{0,12}(?:说明|证明)/],
  ['M4-notmine', "If anything goes wrong it is the system's fault, not mine", /\bnot\s+(?:mine|my\s+problem|my\s+fault|my\s+responsibility)\b/i],
  ['M4-itis', "If anything goes wrong it is the system's fault, not mine", /\b(?:it'?s|that'?s|it\s+is)\s+(?:the\s+|all\s+)?(?:AI'?s?|algorithm'?s?|model'?s?|system'?s?|software'?s?|engine'?s?|machine'?s?|computer'?s?)?\s*(?:fault|blame|responsibility|liability|problem|error|mistake)\b/i],
];
for (const [n, t, re] of T) console.log(n.padEnd(14), re.test(t) ? 'HIT' : 'MISS');
// 逐段拆解 M1
const s = '没人对这个结果提出异议，说明它是公正的';
console.log('\n句长', s.length, '异议位置', s.indexOf('异议'), '说明位置', s.indexOf('说明'));
const seg = s.slice(s.indexOf('异议'), s.indexOf('说明'));
console.log('异议→说明之间片段: "' + seg + '" 长度', seg.length);
