'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
// [r563] 打印提取出的字符串字面量的真实字符，确认双反斜杠是否被正确还原。
const src = require('fs').readFileSync(__HF + '/src/favor-ledger.js', 'utf8');
const startMarker = 'const LEDGER_EN = new RegExp([';
const i = src.indexOf(startMarker);
const j = src.indexOf("], 'i');", i);
const block = src.slice(i + startMarker.length, j);
const branches = block.split('\n').map(x => x.trim()).filter(x => x.startsWith("'"));
const inner = branches[0].slice(1, branches[0].lastIndexOf("'"));
console.log('raw literal:', JSON.stringify(inner));
console.log('eval 还原:', eval(inner));
const re = new RegExp(eval(inner) , 'i');
console.log('test:', re.test('I helped you a lot back then'));
