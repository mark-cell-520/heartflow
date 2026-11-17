// r363-3b：C2 body 尾部到底是什么？为什么 TAIL_RE 不命中
const path = require('path');
const ROOT = '/root/hermes1/skills/ai/mark-heartflow-skill';
// 复制 _clauses 逻辑
function _clauses(t) {
  const parts = t.split(/[。；;！!？?\n]+/).map(s => s.trim()).filter(Boolean);
  const out = [];
  for (const p of parts) {
    const subs = p.split(/\.(?=\s|[A-Z"']|$)/).map(s => s.trim()).filter(Boolean);
    for (const s of subs) out.push(s);
  }
  return out;
}
const s = 'Every student has a mentor, so is there a mentor for every student?';
const cl = _clauses(s);
console.log('clauses:', JSON.stringify(cl));
// 注意：_clauses 先按 ？ 切分！「student?」的问号在第一次 split 就被吃掉
// 所以 body 不含 ? → 原正则 /[吗呢？?]$/ 同样不命中 → C2 穿透是**存量缺陷**，
// 不是 r363 改动引入。
