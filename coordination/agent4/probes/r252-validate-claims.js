const fs = require('fs');
const lines = fs.readFileSync('coordination/claims.jsonl', 'utf8').trim().split('\n');
let bad = 0;
lines.forEach((l, i) => {
  const t = l.trim();
  if (!t) return;
  try { JSON.parse(t); } catch (e) { bad++; console.log(`第 ${i + 1} 行 JSON 非法: ${e.message}`); }
});
const last = JSON.parse(lines[lines.length - 1].trim());
console.log(`claims.jsonl 共 ${lines.length} 行，非法 ${bad} 行`);
console.log(`末行 round=${last.round} kind=${last.kind} status=${last.status}`);
