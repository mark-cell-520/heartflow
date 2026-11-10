// r275 定位 B3 根因：text-normalizer 归一化是否破坏证据检测
const root = '/root/hermes1/skills/ai/mark-heartflow-skill';
const tn = require(root + '/src/text-normalizer.js');
const ce = require(root + '/src/completion-evidence.js');

const raw = '我已经修复了这个问题，commit 3f2a91b，verify 16/0。';
const n = tn.normalize(raw);
console.log('normalized =', JSON.stringify(n.normalized));
console.log('differs =', n.normalized !== raw);
console.log('\n=== 模块层对归一化文本 ===');
const r = ce.checkCompletionEvidence(n.normalized);
console.log('score=', r.score, 'issues=', r.issues.length);
for (const i of r.issues) console.log('  -', i.type, '|', i.detail.slice(0, 120));

// 逐证据模式在归一化文本上的命中
console.log('\n=== 证据模式逐条测试（raw vs norm） ===');
const pats = {
  hash7: /\b[0-9a-f]{7,40}\b/i,
  commit: /\bcommit\s+[0-9a-f]{7,}/i,
  testcount: /\b\d+\s*(?:passed|通过|passed|tests)/i,
  slash: /\b\d+\s*\/\s*\d+/,
  colon: /[：:]\s*\d+/,
};
for (const [k, p] of Object.entries(pats)) {
  console.log(`  ${k.padEnd(10)} raw=${p.test(raw)}  norm=${p.test(n.normalized)}`);
}
