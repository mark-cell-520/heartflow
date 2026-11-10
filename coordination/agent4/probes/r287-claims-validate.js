// r287 claims.jsonl 行格式校验：每行必须是合法 JSON 对象
const fs = require('fs');
const lines = fs.readFileSync('/data/home/heartflow/coordination/claims.jsonl', 'utf8').trim().split('\n');
let bad = 0;
lines.forEach((l, i) => {
  try {
    const o = JSON.parse(l);
    if (!o.round || !o.agent || !o.kind) { bad++; console.log('line', i + 1, 'missing required fields'); }
  } catch (e) { bad++; console.log('line', i + 1, 'JSON parse error:', e.message); }
});
console.log('claims.jsonl lines:', lines.length, 'bad:', bad);
const r287 = lines.map(l => JSON.parse(l)).filter(o => o.round === 'r287');
console.log('r287 entries:', r287.map(o => o.kind + (o.status ? ':' + o.status : '')).join(' | '));
