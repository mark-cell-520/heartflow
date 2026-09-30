// 第 282 轮自动化补丁 v6（A2 按行号定位，只改 281 判据那一行）
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src', 'index.js');
const file = fs.readFileSync(SRC, 'utf8');
function n(s, sub) { let c = 0, i = 0; while ((i = s.indexOf(sub, i)) !== -1) { c++; i += sub.length; } return c; }

const out = file.split('\n');
let a1 = 0, a2 = 0;
for (let i = 0; i < out.length; i++) {
  // A1：恢复 |one
  if (a1 === 0 && out[i].indexOf('|individuals?|interns?|reviewers?|maintainers?|admins?|clients?|patients?|drivers?|players?|voters?|readers?|everyone|everybody)\\s+(?:is|are)') !== -1) {
    out[i] = out[i].replace('|individuals?|interns?|reviewers?|maintainers?|admins?|clients?|patients?|drivers?|players?|voters?|readers?|everyone|everybody)\\s+(?:is|are)',
      '|individuals?|interns?|reviewers?|maintainers?|admins?|clients?|patients?|drivers?|players?|voters?|readers?|one|everyone|everybody)\\s+(?:is|are)');
    a1 = 1; continue;
  }
  // A2：281 判据前缀分支（该行同时含 "readers?|one|everyone" 与本行是 every|each 前缀族里
  //     唯一含 "nobody|chaff)\\b(?=\\s*(?:[.,;:!?]|$))" 的）
  if (a2 === 0 && out[i].indexOf('/\\b(?:every|each)(?:\\s+\\w+){0,2}\\s+') === 0 && out[i].indexOf('nobody|chaff)') !== -1) {
    out[i] = out[i].replace('/\\b(?:every|each)(?:\\s+\\w+){0,2}\\s+', '/\\b(?:everyone|everybody|every|each)(?:\\s+\\w+){0,2}\\s+');
    a2 = 1; continue;
  }
}
if (a1 === 0 || a2 === 0) { console.error('FAIL a1=' + a1 + ' a2=' + a2); process.exit(1); }
fs.writeFileSync(SRC, out.join('\n'));
console.log('done a1=' + a1 + ' a2=' + a2);
