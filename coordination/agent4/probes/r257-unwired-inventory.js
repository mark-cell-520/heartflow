// r257: 盘点 src/*.js 中未被 src/index.js require 的模块（provisional backlog）
const fs = require('fs');
const path = require('path');
const ROOT = '/data/home/heartflow';
const idx = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const reqRe = /require\('\.\/([a-z0-9\-]+)\.js'\)/g;
const required = new Set();
let m;
while ((m = reqRe.exec(idx))) required.add(m[1]);
const files = fs.readdirSync(path.join(ROOT, 'src')).filter(f => f.endsWith('.js'));
const unwired = files.map(f => f.slice(0, -3)).filter(n => !required.has(n)).sort();
console.log('src root js files:', files.length, 'required by index.js:', required.size);
console.log('UNWIRED (' + unwired.length + '):');
console.log(unwired.join('\n'));
