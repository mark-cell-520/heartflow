// [v6.7.130 第 300 轮] probe-9-zh-line：定位 idx12 正则的真实行号
// 只报数字。用 tmp 模块拿 RegExp source，再回 src 里按 source 精确定位行号。
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const ROOT = path.resolve(__dirname, '..', '..');
const idxSrc = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const mArr = idxSrc.match(/const PSEUDO_PHILOSOPHY_ZH = \[([\s\S]*?)\n\];/);
const tmp = path.join(os.tmpdir(), 'pp-zh-line-r300.js');
fs.writeFileSync(tmp, "'use strict';\nmodule.exports = [" + mArr[1] + "\n];\n");
const PP = require(tmp);
const target = PP[12].source.slice(0, 40);
console.log('idx12.source 前40字符 = ' + target);
const lines = idxSrc.split('\n');
const hitLines = [];
lines.forEach((l, i) => { if (l.includes(target.slice(0, 20))) hitLines.push(i + 1); });
console.log('含该 source 前缀的行 = ' + JSON.stringify(hitLines));
