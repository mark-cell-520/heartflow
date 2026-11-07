// r233 SKILL.md 规格表 Engine version 行同步
const fs = require('fs');
let s = fs.readFileSync('SKILL.md', 'utf8');
const a = '| Engine version | 6.8.146 |';
const b = '| Engine version | 6.8.148 |';
if (!s.includes(a)) { console.log('MISS'); process.exit(1); }
fs.writeFileSync('SKILL.md', s.split(a).join(b));
console.log('SKILL Engine version → 6.8.148');
