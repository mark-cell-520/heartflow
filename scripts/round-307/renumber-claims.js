// r307 撞号重编号：claims.jsonl 我的两行 r305→r307 + 撞号说明
'use strict';
const fs = require('fs');
const lines = fs.readFileSync('/data/home/heartflow/coordination/claims.jsonl', 'utf8').trim().split('\n');
const out = [];
for (const ln of lines) {
  let obj = null;
  try { obj = JSON.parse(ln); } catch (e) { /* keep raw */ }
  if (obj && obj.round === 'r305' && obj.agent === 'agent-4' && (obj.kind === 'dimension' || obj.kind === 'release')) {
    const s = JSON.stringify(obj);
    if (s.includes('sorites')) {
      obj.round = 'r307';
      obj.note_collision = '原本地认领号 r305 与远端已发布 r305（anchoring_effect 元语言锚定陈述族，6.8.175→6.8.176）撞号，按撞号纪律重编号为 r307（r306 dose_response_linearity 亦已被占）';
      out.push(JSON.stringify(obj));
      continue;
    }
  }
  out.push(ln);
}
fs.writeFileSync('/data/home/heartflow/coordination/claims.jsonl', out.join('\n') + '\n');
console.log('done, total lines:', out.length);
