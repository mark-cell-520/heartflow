// 第 283 轮：提取 281/282C/282D 三判据群体表 + 表语表，求差集找漏词
'use strict';
const fs = require('fs');
const path = require('path');
const lines = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8').split('\n');
const rows = { '281': 4920, 'C': 4941, 'D': 4942 };

// 稳健提取：抓 "of\s+" 或中缀后的限定词表，改用整行里第一个 (?:the|these|...) 段
function extractSets(line) {
  // 表语表：取 "(?:a\s+|an\s+)?(?:...)" 最后一段
  const attrM = line.match(/\(\?:a\\s\+\|an\\s\+\)\?\(\?:((?:[^()]|\(b\)|\(\?:[a-z])+)\)\\b\(\?=/);
  let attrs = [];
  if (attrM) {
    attrs = attrM[1].split('|').map(x => x.replace(/\\s\+/g, ' ').trim());
  }
  // 群体表：所有长度 > 5 的 alternation 分支，按 '|' 拆，取含 's?' 或裸词
  const grpM = line.match(/\(\?:own\\s\+\)\?\(\?:((?:[a-z?]+\|)+[a-z?]+)\)\\b/);
  let grp = [];
  if (grpM) grp = grpM[1].split('|');
  const tailM = line.match(/\\b\|(them\\b)\|(us\\b)\|(you\\b)/);
  return { grp, attrs, hasTail: !!tailM, len: line.length };
}

for (const [k, n] of Object.entries(rows)) {
  const r = extractSets(lines[n - 1]);
  console.log(k, 'line', n, 'grp=' + r.grp.length, 'attr=' + r.attrs.length, 'tail=' + r.hasTail);
}

const g281 = extractSets(lines[4919]).grp;
const gC = extractSets(lines[4940]).grp;
const gD = extractSets(lines[4941]).grp;
console.log('\n281 有而 C 无:', g281.filter(x => gC.indexOf(x) === -1).join(' '));
console.log('281 有而 D 无:', g281.filter(x => gD.indexOf(x) === -1).join(' '));
console.log('C 有而 D 无:', gC.filter(x => gD.indexOf(x) === -1).join(' '));
console.log('D 有而 C 无:', gD.filter(x => gC.indexOf(x) === -1).join(' '));
const a281 = extractSets(lines[4919]).attrs;
const aC = extractSets(lines[4940]).attrs;
const aD = extractSets(lines[4941]).attrs;
console.log('\nattr 281 vs C 差:', a281.filter(x => aC.indexOf(x) === -1).join(' | '));
console.log('\nattr 281 vs D 差:', a281.filter(x => aD.indexOf(x) === -1).join(' | '));
console.log('\nattr sample C:', aC.slice(0, 8).join(' | '), '... total', aC.length);
