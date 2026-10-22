// r584 叶子诊断：确认 A6/E2/E3/E5 各腿的正则子表达式匹配情况（只报子支编号）
'use strict';
const mod = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/flattery-pressure.js');
const I = mod.__internals();

// 拆出数组源以逐支测试（不贴样本原文，只报支号）
const src = require('fs').readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/src/flattery-pressure.js', 'utf8');
function branches(srcText, name) {
  const m = srcText.match(new RegExp('const ' + name + ' = new RegExp\\(\\[([\\s\\S]*?)\\]\\.join'));
  if (!m) return null;
  const items = m[1].split('\n').map(s => s.trim()).filter(s => s.startsWith("'")).map(s => s.replace(/^'/, '').replace(/',?\s*$/, ''));
  return items;
}

const cases = [
  ['A6', 'F1', 'FLATTER_ZH'],
  ['E2', 'F1', 'FLATTER_ZH'],
  ['E2', 'F2', 'DROP_ZH'],
  ['E3', 'F1', 'FLATTER_ZH'],
  ['E3', 'F2', 'DROP_ZH'],
  ['E5', 'F1', 'FLATTER_EN'],
  ['E5', 'F2', 'DROP_EN'],
  ['E7', 'F2', 'DROP_ZH'],
];
const samples = {
  A6: '你这么聪明，不会看不懂这一页吧。',
  E2: '以你的专业程度，不需要别人复核。',
  E3: '像你这么有经验的人，怎么会需要安全培训。',
  E5: 'Surely someone as skilled as you does not need a second review.',
  E7: '你这么强，一个人顶一个组，不用加人了。',
};
for (const [id, leg, name] of cases) {
  const brs = branches(src, name) || [];
  const hit = [];
  brs.forEach((b, i) => { try { if (new RegExp(b, 'i').test(samples[id])) hit.push(i + 1); } catch (e) {} });
  console.log(id, leg, name, 'hit branches:', hit.join(',') || 'NONE');
}
