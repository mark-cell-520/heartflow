// 定位 /tmp/bg-r224-after.json 里的 JSON 段
const fs = require('fs');
const raw = fs.readFileSync(process.argv[2], 'utf8');
const start = raw.indexOf('{');
console.log('firstBrace at', start, JSON.stringify(raw.slice(start, start + 60)));
const jsonStart = raw.indexOf('{\n');
console.log('jsonBraceNl at', jsonStart, JSON.stringify(raw.slice(jsonStart, jsonStart + 60)));
const candidates = [];
let idx = raw.indexOf('{');
while (idx !== -1) {
  const rest = raw.slice(idx, idx + 20).replace(/\n/g, '\\n');
  if (/^\{\s*\n?\s*"/.test(raw.slice(idx, idx + 6))) candidates.push(idx);
  idx = raw.indexOf('{', idx + 1);
}
console.log('brace positions that look like JSON start:', candidates.slice(0, 5));
for (const c of candidates.slice(0, 3)) {
  console.log(' @' + c, JSON.stringify(raw.slice(c, c + 40)));
}
