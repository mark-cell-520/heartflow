// 第 282 轮自动化补丁 v5（A3 锚点按盘上实际文本）
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src', 'index.js');
const file = fs.readFileSync(SRC, 'utf8');
function n(str, sub) { let c = 0, i = 0; while ((i = str.indexOf(sub, i)) !== -1) { c++; i += sub.length; } return c; }

let out = file;

// 1) 281 轮判据群体表补 everyone/everybody/interns?
{
  const A = '|individuals?|reviewers?|maintainers?|admins?|clients?|patients?|drivers?|players?|voters?|readers?|one)\\s+(?:is|are)';
  const R = '|individuals?|interns?|reviewers?|maintainers?|admins?|clients?|patients?|drivers?|players?|voters?|readers?|everyone|everybody)\\s+(?:is|are)';
  const c = n(out, A); console.log('A1=' + c);
  if (c !== 1) { console.error('A1 锚点 ' + c); process.exit(1); }
  out = out.split(A).join(R);
}
// 2) C/D 判据限定词表加 each/every/all/both/single
{
  const A = 'of\\s+(?:(?:the|these|those|my|your|his|her|their|our|its)\\s+';
  const R = 'of\\s+(?:(?:the|these|those|my|your|his|her|their|our|its|each|every|all|both|single)\\s+';
  const c = n(out, A); console.log('A2=' + c);
  if (c !== 2) { console.error('A2 锚点 ' + c); process.exit(1); }
  out = out.split(A).join(R);
}
// 3) 限定词后允许 own 前缀（our own team）
{
  const A = 'of\\s+(?:(?:the|these|those|my|your|his|her|their|our|its|each|every|all|both|single)\\s+(?:users?';
  const R = 'of\\s+(?:(?:the|these|those|my|your|his|her|their|our|its|each|every|all|both|single)\\s+(?:own\\s+)?(?:users?';
  const c = n(out, A); console.log('A3=' + c);
  if (c !== 2) { console.error('A3 锚点 ' + c); process.exit(1); }
  out = out.split(A).join(R);
}
fs.writeFileSync(SRC, out);
console.log('done');
