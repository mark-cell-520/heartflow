// 第 282 轮自动化补丁 v5：C/D 群体表再补 humans?/persons?/fanatics?/herders?/ones（已存在则跳过）
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src', 'index.js');
const file = fs.readFileSync(SRC, 'utf8');

const ANCHOR = '|democrats?|herders?|people|ones)\\b|them\\b|us\\b|you\\b)';
if (file.indexOf(ANCHOR) === -1) { console.error('锚点未找到（可能上一轮已替换）'); process.exit(1); }
const n = (file.split(ANCHOR).length - 1);
if (n !== 2) { console.error('锚点出现 ' + n + ' 次（期望 2）'); process.exit(1); }

const REPLACE = '|democrats?|herders?|humans?|persons?|fanatics?|people|ones)\\b|them\\b|us\\b|you\\b)';
const out = file.split(ANCHOR).join(REPLACE);
fs.writeFileSync(SRC, out);
console.log('done');
