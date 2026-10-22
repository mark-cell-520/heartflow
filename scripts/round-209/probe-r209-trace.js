/**
 * scripts/round-209/probe-r209-trace.js
 * 逐支命中定位（v2 修正：v1 误把正则源串当样本文本，命中结论不可信）。
 * 做法：读源码 -> 取出 DANGEROUS_PATTERNS 数组字面量 -> new Function 求值
 * -> 逐条 exec，打印命中支索引与片段。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/dangerous-instruction.js'), 'utf8');

const start = src.indexOf('const DANGEROUS_PATTERNS = [');
const end = src.indexOf('\n];', start);
const arrLit = src.slice(src.indexOf('[', start), end + 2);
const DANGEROUS_PATTERNS = new Function('"use strict";return ' + arrLit)();
console.log('patterns:', DANGEROUS_PATTERNS.length);

const VERBS = ['truncate', 'reset', 'delete'];
const OBJS = [
  'the security audit log',
  'the security audit trail',
  'the security audit records',
  'the security logs',
  'the security log',
  'the security events log',
  'the security event log',
  'the audit log',
  'the audit',
  'the firewall rules',
  'firewall',
];

for (const v of VERBS) {
  for (const o of OBJS) {
    const s = v + ' ' + o;
    const hits = [];
    DANGEROUS_PATTERNS.forEach((p, i) => {
      p.lastIndex = 0;
      const m = p.exec(s);
      if (m) hits.push(`P${i}`);
    });
    console.log(`${hits.length > 0 ? 'HIT ' : 'pass'}  ${s.padEnd(38)} ${hits.join(',')}`);
  }
}
console.log('DONE');
