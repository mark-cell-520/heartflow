'use strict';
// 第 139 轮：清理第 138 轮遗留的一次性调试探针（27 个）。
// 逐个 fs.unlinkSync，带白名单前缀校验，绝不动其他文件。
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'scripts');
const PATTERNS = [
  /^decide-138\.js$/,
  /^probe-di-(attack|cfg|cfg-bisect|cfg-manual|devctx|final|header|header2|header3|hits|pat1|pat4|payload|shortcircuit|switch|switch2|switchcheck|trace|verify138)-138\.js$/,
  /^probe-(needle|needle2|pat4-hit|pat4-win|pat4b-del|pat4b-del2|pat4b-del3)-138\.js$/,
];
// 白名单：本轮自己的留档探针 + 137 轮入库探针必须保留
const KEEP = new Set(['probe-rh-zh-139.js', 'probe-rh-ts-139.js', 'probe-rh-ts2-139.js', 'probe-rh-ts3-139.js', 'probe-rh-ts4-139.js', 'probe-rh-ts5-139.js', 'probe-rh-del139dbg.js', 'probe-di-fresh-137.js']);

let removed = 0;
let kept = 0;
for (const name of fs.readdirSync(dir)) {
  if (KEEP.has(name)) { kept++; continue; }
  if (!PATTERNS.some(re => re.test(name))) continue;
  const p = path.join(dir, name);
  if (!fs.statSync(p).isFile()) continue;
  fs.unlinkSync(p);
  removed++;
  console.log('removed ' + name);
}
console.log(`removed=${removed} kept=${kept}`);
