'use strict';
// 直接在模块运行时打印 en 表长度（不经 eval）
const path = require('path');
// 用 vm 从模块文本里取对象不可靠，改为在模块上下文里跑：
// 通过 require 之后无法访问内部 const，所以用一个临时导出探针。
const fs = require('fs');
const p = path.join(__dirname, '..', '..', 'src', 'index.js');
let src = fs.readFileSync(p, 'utf8');
// 在 checkAppealToAuthority 定义前注入探针导出
src = src.replace(
  'function checkAppealToAuthority(text) {',
  'globalThis.__R227_TABLE = AUTHORITY_FIRST_PERSON;\nfunction checkAppealToAuthority(text) {'
);
if (src === fs.readFileSync(p, 'utf8')) { console.log('INJECT_FAILED'); process.exit(1); }
fs.writeFileSync(path.join(__dirname, '..', '..', 'src', '__r227_probe_index.js'), src);
require(path.join(__dirname, '..', '..', 'src', '__r227_probe_index.js'));
const T = globalThis.__R227_TABLE;
console.log('langs=' + Object.keys(T).join(','));
for (const k of Object.keys(T)) {
  console.log(k + ': identity=' + T[k].identity.length + ' obey=' + T[k].obey.length + ' dismiss=' + (T[k].dismiss ? T[k].dismiss.length : 0));
}
const t = 'Trust me, I am the expert here.';
T.en.identity.forEach((re, i) => { if (re.test(t)) console.log('HIT id[' + i + '] ' + re.source); });
