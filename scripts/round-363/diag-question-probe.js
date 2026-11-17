// 一次性诊断（r363-2）：找「结构完整（四腿齐）但结论带疑问」的探针，
// 验证 QUESTION 守卫注入后能否翻转。
const path = require('path');
const ROOT = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { checkQuantifierScopeShift } = require(path.join(ROOT, 'src', 'quantifier-scope-shift.js'));
function hit(text, inject) {
  const r = checkQuantifierScopeShift(text, inject);
  return !!(r && r.verdict && r.verdict !== 'pass');
}

// 候选：完整 ∀∃ 结构 + 结论是疑问语气
const candidates = [
  ['C1 对每个员工都有一个工位，所以是不是存在一个工位是所有员工共用的呢？', '对每个员工都有一个工位，所以是不是存在一个工位是所有员工共用的呢？'],
  ['C2 Every student has a mentor, so is there a mentor for every student?', 'Every student has a mentor, so is there a mentor for every student?'],
  ['C3 每个人都有一位导师，所以有一个导师带所有人吗？', '每个人都有一位导师，所以有一个导师带所有人吗？'],
  ['C4 对每个员工都有一个工位，所以存在一个工位是所有员工共用的吗', '对每个员工都有一个工位，所以存在一个工位是所有员工共用的吗'],
];
for (const [tag, s] of candidates) {
  const base = hit(s);
  const noQ = hit(s, { QUESTION_ZH: [] });
  const noQTail = hit(s, { QUESTION_TAIL_RE: /(?!x)x/ });
  const noQBoth = hit(s, { QUESTION_ZH: [], QUESTION_TAIL_RE: /(?!x)x/ });
  console.log(`${tag}\n  base=${base} 删QUESTION_ZH=${noQ} 删TAIL_RE=${noQTail} 全删=${noQBoth}`);
}
