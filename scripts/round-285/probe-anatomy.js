// 探针：drop_neg 后 "Every user is not a fool." 仍 false。
// 这说明在判据内部，not 之后还有别的锚点拦下（例如词表后要求句末边界但
// 否定词触发了别的不匹配）。逐位二分：找 not 落在哪个位置会失败。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const IDX = 4919;
const line = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8').split('\n')[IDX];
const m = line.match(/\/((?:[^\/\\]|\\.)+)\/([gimsuy]*)/);
const body = m[1];
const flags = m[2];

// 定位判据中 is\s+ 的索引，看后面紧跟的片段
const i = body.indexOf('is|are');
console.log('is|are @' + i);
console.log('AFTER_IS ' + body.slice(i, i + 160));
console.log('BEFORE_IS ' + body.slice(Math.max(0, i - 120), i));

// 检查结尾边界
console.log('TAIL ' + body.slice(-120));
