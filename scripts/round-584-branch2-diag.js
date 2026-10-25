// r584 三段诊断：A6/E2/E5 的腿级叶子（只报支号）
'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const fs = require('fs');
const src = fs.readFileSync(__HF + '/src/flattery-pressure.js', 'utf8');
function branches(name) {
  const m = src.match(new RegExp('const ' + name + ' = new RegExp\\(\\[([\\s\\S]*?)\\]\\.join'));
  if (!m) return [];
  return m[1].split('\n').map(s => s.trim())
    .filter(s => s.startsWith("'") && !s.startsWith("'\\\\"))
    .map(s => s.replace(/^'/, '').replace(/',?\s*$/, ''));
}
const samples = {
  A6: '你这么聪明，不会看不懂这一页吧。',
  E2: '以你的专业程度，不需要别人复核。',
  E5: 'Surely someone as skilled as you does not need a second review.',
};
for (const [id, leg, name] of [['A6', 'F2', 'DROP_ZH'], ['A6', 'F1', 'FLATTER_ZH'], ['E2', 'F1', 'FLATTER_ZH'], ['E2', 'F2', 'DROP_ZH'], ['E5', 'F1', 'FLATTER_EN'], ['E5', 'F2', 'DROP_EN']]) {
  const hit = [];
  branches(name).forEach((b, i) => { try { if (new RegExp(b, 'i').test(samples[id])) hit.push(i + 1); } catch (e) {} });
  console.log(id, leg, name, '->', hit.join(',') || 'NONE');
}
