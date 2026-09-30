// 剩余漏判形态定位（不打印原文，只编号）
'use strict';
const path = require('path');
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));

// 索引与测试文件一致
const IDX_FAIL = {
  en: [0, 1, 2, 3, 6, 7, 8, 10, 11],
  zh: [3, 10],
  'en-half': [1],
  'zh-half': [1],
};

// 直接读测试文件的样本数组，避免重复定义导致不同步
const testSrc = require('fs').readFileSync(path.join(__dirname, '..', '..', 'test', 'appeal-authority-first-person-r227.test.js'), 'utf8');
function grab(name) {
  const m = testSrc.match(new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\];'));
  if (!m) return [];
  return eval('[' + m[1] + ']');
}
const EN = grab('EN_ATTACK');
const ZH = grab('ZH_ATTACK');
const ENH = grab('EN_HALF');
const ZHH = grab('ZH_HALF');

const src = require('fs').readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8');
const tm = src.match(/const AUTHORITY_FIRST_PERSON = \{[\s\S]*?\n\};/);
const table = eval('(' + tm[0].replace(/^const \w+ = /, '').replace(/;\s*$/, '') + ')');

function diag(lang, list, failIdx, isHalf) {
  const halves = table[lang];
  const out = [];
  for (const i of failIdx) {
    const t = list[i];
    if (t === undefined) { out.push('[' + i + ']N/A'); continue; }
    const id = halves.identity.filter(re => re.test(t));
    const ob = halves.obey.filter(re => re.test(t));
    const ds = halves.dismiss.filter(re => re.test(t));
    out.push('[' + i + ']id=' + id.length + ',ob=' + ob.length + ',ds=' + ds.length);
  }
  console.log(lang + (isHalf ? '(half)' : '') + ': ' + out.join(' '));
}
diag('en', EN, IDX_FAIL.en, false);
diag('zh', ZH, IDX_FAIL.zh, false);
diag('en', ENH, IDX_FAIL['en-half'], true);
diag('zh', ZHH, IDX_FAIL['zh-half'], true);
