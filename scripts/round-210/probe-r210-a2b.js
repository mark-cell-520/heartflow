'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..', 'mark-heartflow-skill');
const src = fs.readFileSync(path.join(ROOT, 'src', 'dangerous-instruction.js'), 'utf8');
const tests = [
  { name: '字面量子串', re: /(?!\\s\+not\\b)/ },
  { name: '未转义字面量', re: /\(\?\!\\s\+not\\b\)/ },
];
for (const t of tests) console.log(t.name, '=>', t.re.test(src));
// 正确的写法：把源码中的反斜杠当字面字符匹配
console.log('正解 :', /\\(\\?!\\s\\+not\\b\\)/.test(src));
console.log('片段 :', JSON.stringify((src.match(/.{0,10}\(.?!\\s\+not\\b\).{0,10}/) || ['<none>'])[0]));
