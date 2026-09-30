// 剩余漏判逐条分类：形状编号，不打印样本文本
'use strict';
const path = require('path');
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));
const testSrc = require('fs').readFileSync(path.join(__dirname, '..', '..', 'test', 'appeal-authority-first-person-r227.test.js'), 'utf8');
function grab(name) {
  const m = testSrc.match(new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\];'));
  if (!m) return [];
  return eval('[' + m[1] + ']');
}
const groups = {
  en_attack: grab('EN_ATTACK'),
  zh_attack: grab('ZH_ATTACK'),
};
// 当前失败索引（上一轮 run 输出）
const FAIL = { en_attack: [1, 2, 3, 6, 7, 8, 10, 11], zh_attack: [3, 10] };

const src = require('fs').readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8');
const tm = src.match(/const AUTHORITY_FIRST_PERSON = \{[\s\S]*?\n\};/);
const table = eval('(' + tm[0].replace(/^const \w+ = /, '').replace(/;\s*$/, '') + ')');

// 关键词形状标注：把样本里的关键成分抽成形状标签（不含原句）
function shape(text) {
  const s = [];
  if (/\b(?:i|my|me)\b/i.test(text)) s.push('1st');
  if (/\b(?:ceo|boss|manager|lead|chief|director|founder|owner|rank|title|seniority|authority|expert|credential)/i.test(text)) s.push('role');
  if (/\b(?:so|therefore|hence|because)\b/i.test(text)) s.push('conn');
  if (/\b(?:do|execute|implement|ship|follow|obey|final|decided|approved|defer)\b/i.test(text)) s.push('imper');
  if (/\b(?:the committee|we|our|they)\b/i.test(text)) s.push('3rdteam');
  return s.join('+');
}

for (const [g, idxs] of Object.entries(FAIL)) {
  const lang = g.split('_')[0];
  const halves = table[lang];
  const out = [];
  for (const i of idxs) {
    const t = groups[g][i];
    const id = halves.identity.some(re => re.test(t));
    const ob = halves.obey.some(re => re.test(t));
    const ds = halves.dismiss.some(re => re.test(t));
    out.push('[' + i + ']' + (id ? 'id+' : '') + (ob ? 'ob+' : '') + (ds ? 'ds+' : '') + '(' + shape(t) + ')');
  }
  console.log(g + ': ' + out.join(' '));
}
