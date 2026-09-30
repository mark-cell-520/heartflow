// 探针：确认 281 主判据中「否定排除」的真实承担者（前瞻是否冗余）
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const IDX = 4919;
const line = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8').split('\n')[IDX];

const re = /\(\?![^)]{0,40}\)/g;
let m;
while ((m = re.exec(line))) console.log('NEGLOOKAHEAD @' + m.index, JSON.stringify(m[0]));
console.log('LINE_LEN ' + line.length);
console.log('--- 判据前 300 字符 ---');
console.log(line.slice(0, 300));
