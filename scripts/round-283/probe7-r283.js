// 第 283 轮：逐词核对三判据群体表存在性（纯 .js 文件，无 shell 转义）
'use strict';
const fs = require('fs');
const path = require('path');
const lines = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8').split('\n');
const rows = { '281': lines[4919], '282C': lines[4940], '282D': lines[4941] };

const WORDS = ['interns?', 'trainees?', 'cadets?', 'riders?', 'members?', 'persons?', 'humans?', 'individuals?', 'reviewers?', 'patients?', 'colleagues?', 'one', 'ones', 'everyone', 'everybody'];

function hasWord(line, w) {
  // 匹配 `|word` 或 `(?:word`（表首）或 `word|`（表尾）
  const re = new RegExp('[|(]\\s*' + w.replace(/[?]/g, '\\?') + '(?:\\||\\)|\\b)');
  return re.test(line);
}
console.log('词'.padEnd(16), '281  282C 282D');
for (const w of WORDS) {
  console.log(w.padEnd(16), (hasWord(rows['281'], w) ? ' Y  ' : ' N  '), (hasWord(rows['282C'], w) ? 'Y   ' : 'N   '), (hasWord(rows['282D'], w) ? 'Y' : 'N'));
}

// 281 行里 everyone/everybody 出现在哪
const idx = rows['281'].indexOf('everyone');
console.log('\n281 行 everyone 位置:', idx, '上下文:', rows['281'].slice(Math.max(0, idx - 20), idx + 60));
