// r275 定位 B3：对比 _normText 归一化前后，模块层结果是否翻转
const root = '/root/hermes1/skills/ai/mark-heartflow-skill';
const idx = require(root + '/src/index.js');
const ce = require(root + '/src/completion-evidence.js');

const raw = '我已经修复了这个问题，commit 3f2a91b，verify 16/0。';
console.log('raw  module =', JSON.stringify(ce.checkCompletionEvidence ? ce.checkCompletionEvidence(raw) : ce(raw)));

// 找 _normText
const src = require('fs').readFileSync(root + '/src/index.js', 'utf8');
const m = src.match(/function _normText[\s\S]{0,900}?\n}/);
console.log('\n=== _normText 定义（前 900 字符） ===\n', m ? m[0] : '未找到');
