// 第 282 轮自动化补丁 v7：一次性完成（A1 恢复 |one + A2 前缀分支 + 限定词可选化）
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src', 'index.js');
const file = fs.readFileSync(SRC, 'utf8');

let out = file;

// A1：281 判据群体表恢复 |one（当前是 ...readers?|everyone|everybody)\s+(?:is|are)）
{
  const A = '|readers?|everyone|everybody)\\s+(?:is|are)';
  const R = '|readers?|one|everyone|everybody)\\s+(?:is|are)';
  const c = out.split(A).length - 1;
  console.log('A1=' + c);
  if (c !== 1) { console.error('A1 锚点 ' + c); process.exit(1); }
  out = out.split(A).join(R);
}

// A2：281 判据前缀加 everyone/everybody 分支
// 全文件只有 281 判据行以 "    /\\b(?:every|each)(?:\\s+\\w+){0,2}\\s+(?:users?|customers?" 开头且含 "|one|everyone"
{
  const A = '    /\\b(?:every|each)(?:\\s+\\w+){0,2}\\s+(?:users?|customers?|developers?|managers?|teams?|analysts?|attendees?|operators?|volunteers?|buyers?|sellers?|subscribers?|visitors?|guests?|applicants?|respondents?|colleagues?|neighbors?|passengers?|journalists?|citizens?|taxpayers?|investors?|recruits?|teammates?|newcomers?|outsiders?|designers?|testers?|writers?|editors?|authors?|consumers?|engineers?|employees?|workers?|students?|members?|people|persons?|humans?|individuals?|interns?|reviewers?|maintainers?|admins?|clients?|patients?|drivers?|players?|voters?|readers?|one|everyone|everybody)';
  const R = '    /\\b(?:everyone|everybody|every|each)(?:\\s+\\w+){0,2}\\s+(?:users?|customers?|developers?|managers?|teams?|analysts?|attendees?|operators?|volunteers?|buyers?|sellers?|subscribers?|visitors?|guests?|applicants?|respondents?|colleagues?|neighbors?|passengers?|journalists?|citizens?|taxpayers?|investors?|recruits?|teammates?|newcomers?|outsiders?|designers?|testers?|writers?|editors?|authors?|consumers?|engineers?|employees?|workers?|students?|members?|people|persons?|humans?|individuals?|interns?|one)';
  const c = out.split(A).length - 1;
  console.log('A2=' + c);
  if (c !== 1) { console.error('A2 锚点 ' + c); process.exit(1); }
  out = out.split(A).join(R);
}

fs.writeFileSync(SRC, out);
console.log('done');
